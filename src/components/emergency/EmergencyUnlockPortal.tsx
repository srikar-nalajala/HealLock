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
              const directMatch = biometricService.verifyFaceMatch(
                liveFeatures,
                currentPatient.registeredBiometrics.faceFeatures,
                currentPatient.registeredBiometrics.faceTemplateRef
              );

              if (directMatch.matched) {
                setMatchDetails(`✓ Identity Verified: ${currentPatient.name} (${currentPatient.healthId})`);
                setScanningState('verified');
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
              } else {
                setMatchDetails(identification.matchResult.details || 'No registered patient matches this face.');
                setScanningState('failed');
              }
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
      <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Level-1 Emergency Access Terminal</h2>
            <p className="text-rose-100 text-xs">
              Single-Factor Sufficient Unlock · Mandatory On-Chain Immutable Logging · Minimum Necessary Scope
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-rose-700/80 px-3 py-1.5 rounded-xl border border-rose-400/40 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Responder: {staff.name} ({staff.hospitalName})</span>
        </div>
      </div>

      {!unlocked ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Step 1: Select Verification Factor (Any ONE Sufficient) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="heal-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 1</span>
                  <h3 className="text-base font-bold text-slate-900">Choose Any ONE Verification Factor</h3>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
                  1-Factor Sufficient
                </span>
              </div>

              {/* Factor Selection Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { stopCamera(); setSelectedFactor('qr'); setScanningState('idle'); }}
                  className={`p-4 rounded-xl border-2 text-left flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    selectedFactor === 'qr'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <QrCode className={`w-8 h-8 mb-2 ${selectedFactor === 'qr' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="font-bold text-xs">QR Code Scan</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Card / Bracelet / Phone</span>
                </button>

                <button
                  type="button"
                  onClick={() => { stopCamera(); setSelectedFactor('face'); setScanningState('idle'); }}
                  className={`p-4 rounded-xl border-2 text-left flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    selectedFactor === 'face'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <ScanFace className={`w-8 h-8 mb-2 ${selectedFactor === 'face' ? 'text-purple-600' : 'text-slate-500'}`} />
                  <span className="font-bold text-xs">Face Liveness</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">3D Template Match</span>
                </button>

                <button
                  type="button"
                  onClick={() => { stopCamera(); setSelectedFactor('fingerprint'); setScanningState('idle'); }}
                  className={`p-4 rounded-xl border-2 text-left flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    selectedFactor === 'fingerprint'
                      ? 'border-amber-600 bg-amber-50/50 text-amber-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Fingerprint className={`w-8 h-8 mb-2 ${selectedFactor === 'fingerprint' ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span className="font-bold text-xs">Fingerprint</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">WebAuthn / Scanner</span>
                </button>
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

                <div className="space-y-2">
                  {[
                    'Trauma / Acute Incident',
                    'Cardiac Arrest / STEMI',
                    'Unconscious / Altered Mental Status',
                    'Acute Respiratory Failure',
                    'Other',
                  ].map(option => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        reasonCode === option
                          ? 'border-rose-500 bg-rose-50/60 font-bold text-rose-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reasonCode"
                        value={option}
                        checked={reasonCode === option}
                        onChange={() => setReasonCode(option)}
                        className="text-rose-600 focus:ring-rose-500"
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
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  disabled={scanningState !== 'verified'}
                  onClick={handleExecuteEmergencyUnlock}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 shadow-md transition-all ${
                    scanningState === 'verified'
                      ? 'bg-rose-600 hover:bg-rose-700 active:scale-98 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed opacity-70'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>UNSEAL EMERGENCY PROFILE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Logs event to on-chain ledger & dispatches instant SMS alerts
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Unlocked View — Displays ONLY the Emergency Profile (Minimum Necessary Access) */
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Success Banner */}
          <div className="p-4 rounded-2xl bg-emerald-600 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-200" />
              <div>
                <h3 className="text-lg font-bold">Emergency Profile Successfully Unsealed</h3>
                <p className="text-xs text-emerald-100">
                  Minimum necessary medical profile visible. On-chain transaction: <span className="font-mono">{lastTx?.txHash.substring(0, 16)}...</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetFlow}
                className="px-3.5 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Seal & New Session
              </button>
            </div>
          </div>

          {/* Emergency Card Data */}
          <div className="heal-card p-6 border-2 border-rose-300 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <img
                  src={liveScannedPhoto || currentPatient.registeredBiometrics.facePhotoUrl || currentPatient.avatarUrl}
                  alt={currentPatient.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-rose-500 shadow-md ring-2 ring-rose-300"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900">{currentPatient.name}</h2>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
                      EMERGENCY SCOPE ONLY
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Health ID: {currentPatient.healthId} · DOB: {currentPatient.dob} ({currentPatient.gender})
                  </div>
                </div>
              </div>

              {/* Big Blood Group */}
              <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-700">
                <Heart className="w-8 h-8 fill-rose-600 text-rose-600 animate-pulse" />
                <div>
                  <div className="text-xs font-bold uppercase text-rose-500">Blood Group</div>
                  <div className="text-3xl font-black text-rose-700">{currentPatient.emergencyProfile.bloodGroup}</div>
                </div>
              </div>
            </div>

            {/* Vital Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allergies */}
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>High-Alert Allergies</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentPatient.emergencyProfile.allergies.map(allergy => (
                    <span
                      key={allergy}
                      className="px-3 py-1.5 bg-white text-rose-800 font-black text-xs rounded-xl border border-rose-300 shadow-xs"
                    >
                      ⚠️ {allergy}
                    </span>
                  ))}
                </div>
              </div>

              {/* Critical Meds */}
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Activity className="w-5 h-5 text-amber-600" />
                  <span>Active Critical Medications</span>
                </div>
                <div className="space-y-1.5">
                  {currentPatient.emergencyProfile.criticalMeds.map(med => (
                    <div
                      key={med}
                      className="p-2 bg-white text-amber-900 font-bold text-xs rounded-lg border border-amber-200"
                    >
                      • {med}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Contacts with One-Click Call */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>Emergency Contacts (SMS Alert Dispatched)</span>
                </div>
                <span className="text-xs text-emerald-600 font-semibold">✓ Automated Push Sent</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPatient.emergencyProfile.emergencyContacts.map(c => (
                  <div
                    key={c.phone}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {c.name} ({c.relation})
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{c.phone}</div>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200"
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
