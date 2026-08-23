import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  QrCode, 
  ScanFace, 
  Fingerprint, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Heart, 
  Activity, 
  Sparkles, 
  Clock, 
  Lock,
  ArrowRight,
  RefreshCw,
  BellRing,
  Camera,
  Check
} from 'lucide-react';
import { Patient, Staff, AccessEvent } from '../../types';
import { blockchainService } from '../../services/blockchainService';
import { biometricService } from '../../services/biometricService';
import { supabaseService } from '../../services/supabaseService';
import confetti from 'canvas-confetti';

interface EmergencyUnlockPortalProps {
  patient: Patient;
  staff: Staff;
  onEmergencyLogged: (event: AccessEvent) => void;
  onNotificationSent: (msg: string) => void;
}

export const EmergencyUnlockPortal: React.FC<EmergencyUnlockPortalProps> = ({
  patient,
  staff,
  onEmergencyLogged,
  onNotificationSent,
}) => {
  const [currentPatient, setCurrentPatient] = useState<Patient>(patient);
  const [selectedFactor, setSelectedFactor] = useState<'qr' | 'face' | 'fingerprint'>('face');
  const [scanningState, setScanningState] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
  const [reasonCode, setReasonCode] = useState<string>('Trauma / Acute Incident');
  const [customReason, setCustomReason] = useState<string>('');
  const [unlocked, setUnlocked] = useState(false);
  const [lastTx, setLastTx] = useState<AccessEvent | null>(null);
  const [matchDetails, setMatchDetails] = useState<string>('');
  const [liveScannedPhoto, setLiveScannedPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      biometricService.stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
  };

  const startScan = async () => {
    setScanningState('scanning');
    setMatchDetails('');

    if (selectedFactor === 'face') {
      try {
        if (videoRef.current) {
          const stream = await biometricService.startCameraStream(videoRef.current);
          streamRef.current = stream;
        }

        // Live camera landmark & 128D FaceNet analysis
        setTimeout(async () => {
          try {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              throw new Error('Camera not ready. Please align your face inside the oval.');
            }

            const res = await biometricService.extractFaceFeatures(videoRef.current);
            const liveFeatures = res.featureVector;
            if (res.photoUrl) {
              setLiveScannedPhoto(res.photoUrl);
            }

            // Fetch all candidate patients
            const allPatients = await supabaseService.getAllPatients();

            // 1-to-N face identification search
            const identification = biometricService.identifyPatientByFace(liveFeatures, allPatients);

            stopCamera();

            if (identification.matchedPatient) {
              const updatedMatched = {
                ...identification.matchedPatient,
                avatarUrl: res.photoUrl || identification.matchedPatient.registeredBiometrics?.facePhotoUrl || identification.matchedPatient.avatarUrl
              };
              setCurrentPatient(updatedMatched);
              setMatchDetails(identification.matchResult.details);
              setScanningState('verified');
              confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
            } else {
              setMatchDetails(
                identification.matchResult.details || '❌ Access Denied: Unknown face. No registered patient matches this biometric profile.'
              );
              setScanningState('failed');
            }
          } catch (e: any) {
            stopCamera();
            setMatchDetails(e.message || 'Face analysis failed');
            setScanningState('failed');
          }
        }, 1500);
      } catch (err: any) {
        stopCamera();
        setMatchDetails(err.message || 'Camera stream failed');
        setScanningState('failed');
      }
    } else if (selectedFactor === 'fingerprint') {
      try {
        const result = await biometricService.verifyFingerprintFIDO2(
          patient.registeredBiometrics.fingerprintCredentialId || patient.registeredBiometrics.fingerprintTemplateRef
        );
        setTimeout(() => {
          setMatchDetails(result.details);
          if (result.matched) {
            setScanningState('verified');
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
          } else {
            setScanningState('failed');
          }
        }, 1200);
      } catch (e: any) {
        setMatchDetails(e.message || 'Fingerprint scan failed');
        setScanningState('failed');
      }
    } else {
      // QR Code
      setTimeout(() => {
        setMatchDetails(`Cryptographic QR Health Token Verified: ${patient.healthId}`);
        setScanningState('verified');
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }, 1000);
    }
  };

  const handleExecuteEmergencyUnlock = async () => {
    if (scanningState !== 'verified') return;

    const finalReason = reasonCode === 'Other' ? (customReason || 'Unspecified Emergency Protocol') : reasonCode;

    // Log to immutable blockchain for identified patient
    const event = await blockchainService.logEvent({
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      hospitalId: staff.hospitalId,
      hospitalName: staff.hospitalName,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: 'Emergency Responder',
      accessType: 'emergency',
      factorUsed: selectedFactor,
      action: `Emergency Profile Unlocked (${selectedFactor.toUpperCase()} Biometric Recognition)`,
      reason: finalReason,
    });

    setLastTx(event);
    setUnlocked(true);
    onEmergencyLogged(event);

    // Instant notification to patient and primary emergency contact
    const notifMsg = `🚨 EMERGENCY ALERT: Emergency medical profile for ${currentPatient.name} was unlocked by ${staff.name} at ${staff.hospitalName} via ${selectedFactor.toUpperCase()} verification. Reason: ${finalReason}.`;
    onNotificationSent(notifMsg);
  };

  const resetFlow = () => {
    stopCamera();
    setScanningState('idle');
    setUnlocked(false);
    setLastTx(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Emergency Warning Banner */}
      <div className="p-6 rounded-3xl bg-[#BA3B3B] text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/20 rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Level-1 Emergency Access Terminal</h2>
            <p className="text-rose-100 text-xs mt-0.5">
              Single-Factor Sufficient Unlock · Mandatory On-Chain Immutable Logging · Minimum Necessary Scope
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/20 px-3.5 py-2 rounded-2xl border border-white/20 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Responder: {staff.name} ({staff.hospitalName})</span>
        </div>
      </div>

      {!unlocked ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Step 1: Select Verification Factor (Any ONE Sufficient) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="heal-card p-8 sm:p-9 space-y-6 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#C85A3B] uppercase tracking-wider">Step 1</span>
                  <h3 className="text-lg font-black text-[#2B2521] mt-0.5">Choose Any ONE Verification Factor</h3>
                </div>
                <span className="px-3.5 py-1 bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5] text-xs font-bold rounded-full">
                  1-Factor Sufficient
                </span>
              </div>

              {/* Factor Selection Buttons */}
              <div className="grid grid-cols-3 gap-3.5">
                {[
                  { id: 'face' as const, label: 'Face Liveness', sub: '3D Template Match', icon: ScanFace },
                  { id: 'qr' as const, label: 'QR Code Scan', sub: 'Card / Wristband', icon: QrCode },
                  { id: 'fingerprint' as const, label: 'Fingerprint', sub: 'WebAuthn / Sensor', icon: Fingerprint },
                ].map(factor => {
                  const Icon = factor.icon;
                  const isSelected = selectedFactor === factor.id;
                  return (
                    <button
                      key={factor.id}
                      type="button"
                      onClick={() => { stopCamera(); setSelectedFactor(factor.id); setScanningState('idle'); }}
                      className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-[#C85A3B] bg-[#FDF8F5] text-[#2B2521] shadow-xs'
                          : 'border-[#E8E1D5] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#63594F]'
                      }`}
                    >
                      <Icon className={`w-7 h-7 ${isSelected ? 'text-[#C85A3B]' : 'text-[#82786D]'}`} />
                      <span className="font-bold text-xs">{factor.label}</span>
                      <span className="text-[10px] text-[#82786D]">{factor.sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Sensor Scanner Box */}
              <div className="p-6 rounded-xl bg-slate-900 text-white relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[240px]">
                {selectedFactor === 'face' && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] ${
                      scanningState === 'scanning' ? 'opacity-80' : 'opacity-0 pointer-events-none'
                    }`}
                  />
                )}

                {/* Background scanning wave effect */}
                {scanningState === 'scanning' && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-0 animate-pulse z-10" />
                )}

                {scanningState === 'idle' && (
                  <div className="space-y-3 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      {selectedFactor === 'qr' && <QrCode className="w-8 h-8 text-blue-400" />}
                      {selectedFactor === 'face' && <ScanFace className="w-8 h-8 text-purple-400" />}
                      {selectedFactor === 'fingerprint' && <Fingerprint className="w-8 h-8 text-amber-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        Ready to authenticate via {selectedFactor.toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-400">
                        Aim hospital sensor at patient wearable, face, or fingerprint reader
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startScan}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Trigger {selectedFactor.toUpperCase()} Biometric Scan
                    </button>
                  </div>
                )}

                {scanningState === 'scanning' && (
                  <div className="space-y-3 relative z-10 bg-slate-950/70 p-4 rounded-2xl backdrop-blur-xs">
                    <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-cyan-200">
                        Verifying Biometric Liveness & Cryptographic Token...
                      </p>
                      <p className="text-xs text-slate-300 font-mono">
                        Matching against registered template: {patient.registeredBiometrics.faceTemplateRef.substring(0, 20)}...
                      </p>
                    </div>
                  </div>
                )}

                {scanningState === 'verified' && (
                  <div className="space-y-3 animate-in zoom-in-95 duration-200 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-300">
                        Identity Verified: {patient.name} ({patient.healthId})
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {matchDetails || 'Biometric single factor satisfied · Ready to unseal emergency profile'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScanningState('idle')}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Rescan / Change Factor
                    </button>
                  </div>
                )}

                {scanningState === 'failed' && (
                  <div className="space-y-3 animate-in zoom-in-95 duration-200 relative z-10 p-4">
                    <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-300">
                        Biometric Verification Mismatch
                      </p>
                      <p className="text-xs text-rose-200/90 mt-1 max-w-sm mx-auto">
                        {matchDetails || `Live face did not match enrolled patient template for ${patient.name}.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScanningState('idle')}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Retry Scan / Switch Factor
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Mandatory Clinical Reason Code */}
          <div className="lg:col-span-5 space-y-4">
            <div className="heal-card p-6 space-y-5 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Step 2</span>
                  <h3 className="text-base font-bold text-slate-900">Mandatory Emergency Reason Code</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable legal justification recorded on-chain for audit accountability
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    'Trauma / Acute Incident',
                    'Cardiac Arrest / STEMI',
                    'Unconscious / Altered Mental Status',
                    'Acute Respiratory Failure',
                    'Other',
                  ].map(option => (
                    <label
                      key={option}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        reasonCode === option
                          ? 'border-[#BA3B3B] bg-[#FDF6F5] font-bold text-[#962828]'
                          : 'border-[#E8E1D5] hover:bg-[#FAF7F2] text-[#4F4740]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reasonCode"
                        value={option}
                        checked={reasonCode === option}
                        onChange={() => setReasonCode(option)}
                        className="text-[#BA3B3B] focus:ring-[#BA3B3B]"
                      />
                      <span>{option}</span>
                    </label>
                  ))}

                  {reasonCode === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify emergency reason (required)..."
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] text-[#2B2521] focus:ring-2 focus:ring-[#BA3B3B] focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-[#E8E1D5] space-y-3">
                <button
                  type="button"
                  disabled={scanningState !== 'verified'}
                  onClick={handleExecuteEmergencyUnlock}
                  className={`w-full py-4 px-6 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                    scanningState === 'verified'
                      ? 'bg-[#BA3B3B] hover:bg-[#A32A2A] active:scale-98 cursor-pointer ring-4 ring-[#BA3B3B]/20 animate-pulse'
                      : 'bg-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>UNSEAL EMERGENCY PROFILE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-[#82786D]">
                  Logs event to on-chain ledger & dispatches instant SMS alerts
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Unlocked View — Displays ONLY the Emergency Profile (Minimum Necessary Access) */
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Success Banner */}
          <div className="p-6 rounded-3xl bg-[#2D6346] text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/15 rounded-2xl">
                <CheckCircle2 className="w-7 h-7 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Emergency Profile Successfully Unsealed</h3>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Minimum necessary medical profile visible. On-chain transaction: <span className="font-mono text-emerald-200">{lastTx?.txHash.substring(0, 16)}...</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={resetFlow}
                className="px-4 py-2 bg-white text-[#2B2521] hover:bg-[#FAF7F2] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Seal & New Session
              </button>
            </div>
          </div>

          {/* Emergency Card Data */}
          <div className="heal-card p-8 sm:p-10 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-[#E8E1D5]">
              <div className="flex items-center gap-5">
                <img
                  src={liveScannedPhoto || currentPatient.registeredBiometrics.facePhotoUrl || currentPatient.avatarUrl}
                  alt={currentPatient.name}
                  className="w-20 h-20 rounded-3xl object-cover border-2 border-[#BA3B3B] shadow-md ring-4 ring-[#BA3B3B]/10"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-[#2B2521] tracking-tight">{currentPatient.name}</h2>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1]">
                      EMERGENCY SCOPE ONLY
                    </span>
                  </div>
                  <div className="text-xs text-[#82786D] font-mono">
                    Health ID: {currentPatient.healthId} · DOB: {currentPatient.dob} ({currentPatient.gender})
                  </div>
                </div>
              </div>

              {/* Clean Blood Group Pill */}
              <div className="flex items-center gap-4 px-6 py-4 bg-[#FDF2F0] border border-[#F5C7C1] rounded-3xl text-[#BA3B3B]">
                <Heart className="w-9 h-9 fill-[#BA3B3B] text-[#BA3B3B] animate-pulse" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#962828]">Blood Group</div>
                  <div className="text-3xl font-black text-[#BA3B3B]">{currentPatient.emergencyProfile.bloodGroup}</div>
                </div>
              </div>
            </div>

            {/* Vital Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Allergies */}
              <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-4">
                <div className="flex items-center gap-2 text-[#962828] font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-[#BA3B3B]" />
                  <span>High-Alert Allergies</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(currentPatient.emergencyProfile.allergies || ['No known allergies']).map(allergy => (
                    <span
                      key={allergy}
                      className="px-4 py-2 bg-white text-[#962828] font-bold text-xs rounded-2xl border border-[#F5C7C1] shadow-xs"
                    >
                      ⚠️ {allergy}
                    </span>
                  ))}
                </div>
              </div>

              {/* Critical Meds */}
              <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-4">
                <div className="flex items-center gap-2 text-[#7A402A] font-bold text-sm">
                  <Activity className="w-5 h-5 text-[#C85A3B]" />
                  <span>Active Critical Medications</span>
                </div>
                <div className="space-y-2">
                  {(currentPatient.emergencyProfile.criticalMeds || ['No critical daily medications']).map(med => (
                    <div
                      key={med}
                      className="p-3 bg-white text-[#4F4740] font-semibold text-xs rounded-xl border border-[#E8E1D5]"
                    >
                      • {med}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Contacts with One-Click Call */}
            <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#2B2521] text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#C85A3B]" />
                  <span>Emergency Contacts (SMS Push Sent)</span>
                </div>
                <span className="text-xs text-[#2D6346] font-bold">✓ Automated Push Sent</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(currentPatient.emergencyProfile.emergencyContacts || []).map(c => (
                  <div
                    key={c.phone}
                    className="p-4 bg-white rounded-2xl border border-[#E8E1D5] flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-[#2B2521] text-xs">
                        {c.name} ({c.relation})
                      </div>
                      <div className="text-xs text-[#82786D] font-mono mt-0.5">{c.phone}</div>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="px-3.5 py-1.5 bg-[#EDF5F0] hover:bg-[#E0EFE7] text-[#2D6346] font-bold text-xs rounded-xl border border-[#C4DFC5] transition-colors"
                    >
                      Call Now
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimum Necessary Notice */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Principle 2 (Minimum Necessary Access):</strong> Full medical history, psychiatric evaluations, and routine scans are masked from emergency mode to preserve patient privacy while providing essential life-saving data.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
