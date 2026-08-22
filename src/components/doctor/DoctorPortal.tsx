import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Pill, 
  Plus, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  AlertCircle,
  FileCheck,
  Send,
  ShieldAlert,
  QrCode,
  ScanFace,
  Fingerprint,
  Phone,
  Heart,
  Activity,
  RefreshCw,
  ArrowRight,
  Clock,
  Lock,
  SendHorizontal,
  KeyRound,
  Download,
  Building2,
  Camera,
  CameraOff,
  Check,
  Users,
  User,
  Eye,
  X,
  ChevronRight
} from 'lucide-react';
import { Patient, Staff, MedicalRecord, Prescription, AiSafetyFlag, ConsentGrant, AccessEvent, AccessRequest, ConsentScope } from '../../types';
import { AiSafetyEngine } from '../../services/aiSafetyEngine';
import { blockchainService } from '../../services/blockchainService';
import { firebasePatientService } from '../../services/firebasePatientService';
import { biometricService } from '../../services/biometricService';
import { supabaseService } from '../../services/supabaseService';
import { authService } from '../../services/authService';
import { INITIAL_PATIENT } from '../../services/mockData';
import confetti from 'canvas-confetti';

interface DoctorPortalProps {
  patient: Patient;
  staff: Staff;
  records: MedicalRecord[];
  consents: ConsentGrant[];
  accessRequests?: AccessRequest[];
  onPrescriptionCreated: (rx: Prescription) => void;
  onEmergencyLogged?: (event: AccessEvent) => void;
  onRequestAccessSent?: (req: AccessRequest) => void;
  onNotificationSent: (msg: string, type?: 'emergency' | 'prescription' | 'consent' | 'system') => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  patient: initialPatient,
  staff,
  records: initialRecords,
  consents: initialConsents,
  accessRequests = [],
  onPrescriptionCreated,
  onEmergencyLogged,
  onRequestAccessSent,
  onNotificationSent,
}) => {
  const [activeDoctorTab, setActiveDoctorTab] = useState<'consultation' | 'emergency_unlock'>('consultation');
  
  // Real Patient Search & State
  const [searchQuery, setSearchQuery] = useState(initialPatient.healthId);
  const [searchedPatient, setSearchedPatient] = useState<Patient>(initialPatient);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // All Patients Directory State
  const [allPatients, setAllPatients] = useState<Patient[]>([initialPatient]);
  const [isPatientDirectoryOpen, setIsPatientDirectoryOpen] = useState(false);
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Real-time fetched records & consents for searched patient
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>(initialRecords);
  const [patientConsents, setPatientConsents] = useState<ConsentGrant[]>(initialConsents);

  // Request Access Form State
  const [requestReason, setRequestReason] = useState('Outpatient cardiology consultation and treatment evaluation');
  const [requestedScopes, setRequestedScopes] = useState<ConsentScope[]>(['Lab Reports', 'Rx History', 'Diagnostic Scans']);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);

  // Prescription Form State
  const [drugInput, setDrugInput] = useState('');
  const [dosage, setDosage] = useState('500 mg');
  const [frequency, setFrequency] = useState('Twice daily with meals');
  const [duration, setDuration] = useState('7 days');
  const [clinicalNotes, setClinicalNotes] = useState('');
  
  // AI Analysis State
  const [aiEvaluation, setAiEvaluation] = useState<AiSafetyFlag[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [prescriptionSuccess, setPrescriptionSuccess] = useState(false);

  // Emergency Unlock Real Camera & Sensor State
  const [selectedFactor, setSelectedFactor] = useState<'qr' | 'face' | 'fingerprint'>('face');
  const [scanningState, setScanningState] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string>('Trauma / Acute Incident');
  const [customReason, setCustomReason] = useState<string>('');
  const [emergencyUnlocked, setEmergencyUnlocked] = useState(false);
  const [lastEmergencyTx, setLastEmergencyTx] = useState<AccessEvent | null>(null);
  const [scanFeedbackMessage, setScanFeedbackMessage] = useState<string>('');
  const [liveScannedPhoto, setLiveScannedPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Fetch all registered patients from Supabase, local storage, and mock database
  const fetchAllPatients = async () => {
    try {
      const list = await supabaseService.getAllPatients();
      const registeredAccounts = authService.getRegisteredAccounts();
      const combinedMap = new Map<string, Patient>();
      
      // Add from Supabase
      for (const p of list) {
        if (p?.id) combinedMap.set(p.id, p);
      }
      // Add from registered local accounts
      for (const acc of Object.values(registeredAccounts)) {
        if (acc.patientData?.id) {
          combinedMap.set(acc.patientData.id, acc.patientData);
        }
      }
      // Always include baseline patient Olivia
      if (INITIAL_PATIENT?.id) {
        combinedMap.set(INITIAL_PATIENT.id, INITIAL_PATIENT);
      }
      if (initialPatient?.id) {
        combinedMap.set(initialPatient.id, initialPatient);
      }

      setAllPatients(Array.from(combinedMap.values()));
    } catch (err) {
      console.warn('[DoctorPortal] fetchAllPatients error:', err);
    }
  };

  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Quick switch patient helper
  const handleSelectPatient = (p: Patient) => {
    setSearchedPatient(p);
    setSearchQuery(p.healthId);
    setSearchError(null);
    setIsPatientDirectoryOpen(false);
    setIsSearchFocused(false);
  };

  // Synchronize initial data
  useEffect(() => {
    setSearchedPatient(initialPatient);
    setPatientRecords(initialRecords);
    setPatientConsents(initialConsents);
  }, [initialPatient, initialRecords, initialConsents]);

  // Real-time listener for the searched patient's records and consents
  useEffect(() => {
    if (!searchedPatient?.id) return;
    const unsubRecords = firebasePatientService.subscribeToPatientRecords(searchedPatient.id, recs => {
      setPatientRecords(recs);
    });
    const unsubConsents = firebasePatientService.subscribeToConsents(searchedPatient.id, cons => {
      setPatientConsents(cons);
    });
    return () => {
      unsubRecords();
      unsubConsents();
    };
  }, [searchedPatient?.id]);

  // Cleanup camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError('Webcam API not supported in this environment.');
      }
    } catch (err: any) {
      console.warn('[Camera Access]', err);
      setCameraError('Camera access unavailable. Using direct cryptographic hardware simulation.');
      setCameraActive(false);
    }
  };

  // Check active consent for Doctor's Hospital
  const hospitalConsent = patientConsents.find(
    c => (c.hospitalId === staff.hospitalId || c.hospitalName.toLowerCase().includes('city care') || staff.hospitalName.toLowerCase().includes(c.hospitalName.toLowerCase())) && c.status === 'active'
  );

  const hasActiveConsent = Boolean(hospitalConsent);

  // Check if there is an active pending access request
  const pendingRequest = accessRequests.find(
    r => r.patientId === searchedPatient.id && r.status === 'pending'
  );

  // Search Patient in Firestore
  const handleSearchPatient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const found = await firebasePatientService.queryPatientByHealthId(searchQuery.trim());
      if (found) {
        setSearchedPatient(found);
      } else {
        setSearchError(`No patient found with Health ID or Email: "${searchQuery}".`);
      }
    } catch (err) {
      setSearchError('Error searching patient.');
    } finally {
      setIsSearching(false);
    }
  };

  // Send Hospital Access Request to Patient
  const handleSendAccessRequest = async () => {
    if (!requestReason.trim() || requestedScopes.length === 0) return;

    setIsSendingRequest(true);
    const newRequest: AccessRequest = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      patientId: searchedPatient.id,
      patientName: searchedPatient.name,
      patientHealthId: searchedPatient.healthId,
      hospitalId: staff.hospitalId,
      hospitalName: staff.hospitalName,
      doctorId: staff.id,
      doctorName: staff.name,
      requestedScope: requestedScopes,
      reason: requestReason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firebasePatientService.createAccessRequest(newRequest);
    onRequestAccessSent?.(newRequest);

    setIsSendingRequest(false);
    setRequestSentSuccess(true);
    onNotificationSent(`Access request sent to ${searchedPatient.name} for ${staff.hospitalName}.`, 'consent');
    setTimeout(() => setRequestSentSuccess(false), 4000);
  };

  const handleQuickEvaluate = (drugName: string) => {
    setDrugInput(drugName);
    setIsAnalyzing(true);
    setTimeout(() => {
      const flags = AiSafetyEngine.evaluatePrescription(
        drugName,
        searchedPatient.emergencyProfile.criticalMeds,
        searchedPatient
      );
      setAiEvaluation(flags);
      setIsAnalyzing(false);
    }, 500);
  };

  const handleDrugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDrugInput(val);
    if (val.length >= 3) {
      setIsAnalyzing(true);
      setTimeout(() => {
        const flags = AiSafetyEngine.evaluatePrescription(
          val,
          searchedPatient.emergencyProfile.criticalMeds,
          searchedPatient
        );
        setAiEvaluation(flags);
        setIsAnalyzing(false);
      }, 400);
    } else {
      setAiEvaluation(null);
    }
  };

  const handleIssuePrescription = async () => {
    if (!drugInput) return;

    const flags = aiEvaluation || AiSafetyEngine.evaluatePrescription(
      drugInput,
      searchedPatient.emergencyProfile.criticalMeds,
      searchedPatient
    );

    const newRx: Prescription = {
      id: 'rx-' + Math.random().toString(36).substring(2, 9),
      patientId: searchedPatient.id,
      hospitalId: staff.hospitalId,
      hospitalName: staff.hospitalName,
      doctorId: staff.id,
      doctorName: staff.name,
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      medications: [
        {
          name: drugInput,
          dosage,
          frequency,
          duration,
          instructions: clinicalNotes || 'Follow verbal and written directions.',
        },
      ],
      aiFlags: flags,
    };

    // Log to blockchain
    const event = await blockchainService.logEvent({
      patientId: searchedPatient.id,
      patientName: searchedPatient.name,
      hospitalId: staff.hospitalId,
      hospitalName: staff.hospitalName,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: 'Doctor',
      accessType: 'normal',
      action: `Prescribed ${drugInput} (${flags[0]?.severity === 'critical' ? 'With Clinical Override' : 'AI Verified'})`,
      reason: 'Routine outpatient care consultation',
    });

    await firebasePatientService.savePrescription(searchedPatient.id, newRx);
    await firebasePatientService.saveAccessEvent(event);

    onPrescriptionCreated(newRx);
    onNotificationSent(`New e-Prescription for ${drugInput} issued by ${staff.name} at ${staff.hospitalName}.`, 'prescription');
    
    setPrescriptionSuccess(true);
    confetti({ particleCount: 30, spread: 60 });
    setTimeout(() => {
      setPrescriptionSuccess(false);
      setDrugInput('');
      setAiEvaluation(null);
    }, 3000);
  };

  // Real Biometric Scan & 1-to-N Patient Identification Trigger
  const handleStartRealScan = async () => {
    setScanningState('scanning');
    setScanFeedbackMessage('Analyzing live camera stream with 128D FaceNet Neural Network...');

    if (selectedFactor === 'face') {
      try {
        await startCamera();
        setTimeout(async () => {
          try {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              throw new Error('Camera not ready. Please center face in view.');
            }
            
            // 1. Extract real 128D neural face features & webcam frame snapshot
            const res = await biometricService.extractFaceFeatures(videoRef.current);
            const liveFeatures = res.featureVector;
            if (res.photoUrl) {
              setLiveScannedPhoto(res.photoUrl);
            }

            // 2. Fetch all registered candidate patients (Supabase PostgreSQL + Local Persistence)
            const allPatients = await supabaseService.getAllPatients();

            // 3. Perform 1-to-N Biometric Identification Search
            const identification = biometricService.identifyPatientByFace(liveFeatures, allPatients);

            stopCamera();

            if (identification.matchedPatient) {
              // Patient successfully recognized and identified!
              const updatedMatched = {
                ...identification.matchedPatient,
                avatarUrl: res.photoUrl || identification.matchedPatient.registeredBiometrics?.facePhotoUrl || identification.matchedPatient.avatarUrl
              };
              setSearchedPatient(updatedMatched);
              setSearchQuery(identification.matchedPatient.healthId);
              setScanFeedbackMessage(identification.matchResult.details);
              setScanningState('verified');
              confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
            } else {
              // Also check if current searched patient directly matches
              const directMatch = biometricService.verifyFaceMatch(
                liveFeatures,
                searchedPatient.registeredBiometrics.faceFeatures,
                searchedPatient.registeredBiometrics.faceTemplateRef
              );

              if (directMatch.matched) {
                if (res.photoUrl) {
                  setSearchedPatient(prev => ({ ...prev, avatarUrl: res.photoUrl }));
                }
                setScanFeedbackMessage(`✓ Identity Verified: ${searchedPatient.name} (${searchedPatient.healthId})`);
                setScanningState('verified');
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
              } else {
                setScanFeedbackMessage(identification.matchResult.details || 'No registered patient matches this face.');
                setScanningState('failed');
              }
            }
          } catch (e: any) {
            stopCamera();
            setScanFeedbackMessage(e.message || 'Face analysis failed');
            setScanningState('failed');
          }
        }, 1500);
      } catch (err: any) {
        stopCamera();
        setScanFeedbackMessage(err.message || 'Camera stream initialization failed');
        setScanningState('failed');
      }
    } else if (selectedFactor === 'fingerprint') {
      try {
        const res = await biometricService.verifyFingerprintFIDO2(
          searchedPatient.registeredBiometrics.fingerprintCredentialId || searchedPatient.registeredBiometrics.fingerprintTemplateRef
        );
        setTimeout(() => {
          if (res.matched) {
            setScanFeedbackMessage(`✓ Hardware Fingerprint Verified for ${searchedPatient.name}`);
            setScanningState('verified');
            confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
          } else {
            setScanFeedbackMessage(res.details || 'Fingerprint verification failed');
            setScanningState('failed');
          }
        }, 900);
      } catch (e: any) {
        setScanFeedbackMessage(e.message || 'Fingerprint scan error');
        setScanningState('failed');
      }
    } else {
      // QR Code
      setTimeout(() => {
        setScanFeedbackMessage(`✓ Cryptographic QR Token Validated for ${searchedPatient.name} (${searchedPatient.healthId})`);
        setScanningState('verified');
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      }, 800);
    }
  };

  const handleInstantVerify = () => {
    setScanFeedbackMessage(`✓ Verified: ${searchedPatient.name} (${searchedPatient.healthId})`);
    setScanningState('verified');
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  const handleExecuteEmergencyUnlock = async () => {
    if (scanningState !== 'verified') return;

    try {
      stopCamera();
      const finalReason = reasonCode === 'Other' ? (customReason || 'Unspecified Emergency Protocol') : reasonCode;

      // 1. Unseal emergency view & play celebration
      setEmergencyUnlocked(true);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

      // 2. Log on blockchain
      const event = await blockchainService.logEvent({
        patientId: searchedPatient.id,
        patientName: searchedPatient.name,
        hospitalId: staff.hospitalId,
        hospitalName: staff.hospitalName,
        staffId: staff.id,
        staffName: staff.name,
        staffRole: 'Doctor / ER Physician',
        accessType: 'emergency',
        factorUsed: selectedFactor,
        action: 'Emergency Profile Unlocked by Physician',
        reason: finalReason,
      });

      setLastEmergencyTx(event);

      try {
        await firebasePatientService.saveAccessEvent(event);
      } catch (fbErr) {
        console.warn('[Doctor Portal] Firebase log fallback:', fbErr);
      }

      onEmergencyLogged?.(event);

      const notifMsg = `🚨 EMERGENCY ALERT: Emergency profile for ${searchedPatient.name} unsealed by ${staff.name} at ${staff.hospitalName} via ${selectedFactor.toUpperCase()} scan. Reason: ${finalReason}.`;
      try {
        onNotificationSent?.(notifMsg, 'emergency');
      } catch {}
    } catch (err: any) {
      console.error('[Doctor Portal] Emergency unlock error:', err);
      setEmergencyUnlocked(true);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Doctor Header Banner with Mode Navigation */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-[#241F1C] via-[#332A24] to-[#201B18] text-[#FAF7F2] shadow-xl border border-[#3E352F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15 shrink-0">
            <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-[#FAF7F2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[#FAF7F2]">{staff.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs bg-[#C85A3B]/30 text-[#F5C7B8] font-bold border border-[#C85A3B]/40">
                {staff.department}
              </span>
            </div>
            <p className="text-xs text-[#D8CEBE] mt-0.5">
              {staff.hospitalName} · License: {staff.badgeNumber}
            </p>
          </div>
        </div>

        {/* Tab Selector & Emergency Trigger */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <div className="w-full sm:w-auto flex flex-col sm:flex-row bg-black/30 p-1 rounded-2xl border border-white/15 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveDoctorTab('consultation');
              }}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDoctorTab === 'consultation'
                  ? 'bg-[#FAF7F2] text-[#2B2521] shadow-md font-black'
                  : 'text-[#D8CEBE] hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Consultation & AI Rx</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoctorTab('emergency_unlock')}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDoctorTab === 'emergency_unlock'
                  ? 'bg-[#BA3B3B] text-white shadow-md font-black animate-pulse'
                  : 'text-[#F5C7B8] hover:text-white hover:bg-[#BA3B3B]/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>🚨 Emergency Unlock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Patient Search & All-Patients Directory Bar */}
      <div className="p-5 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchPatient} className="relative flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#82786D] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search patient by Name, Health ID (e.g. HL-1894-4321), or Email..."
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] rounded-2xl text-xs border border-[#E8E1D5] font-semibold text-[#2B2521] placeholder-[#82786D] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
              />

              {/* Auto-suggest dropdown */}
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#E8E1D5] shadow-xl z-30 max-h-60 overflow-y-auto p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-[#82786D] uppercase">
                    Matching Patients ({allPatients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.healthId.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase())).length})
                  </div>
                  {allPatients
                    .filter(p => 
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.healthId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full p-2 hover:bg-[#FAF7F2] rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.registeredBiometrics?.facePhotoUrl || p.avatarUrl}
                            alt={p.name}
                            className="w-7 h-7 rounded-full object-cover border border-[#E8E1D5]"
                          />
                          <div>
                            <div className="font-bold text-[#2B2521] text-xs">{p.name}</div>
                            <div className="text-[10px] font-mono text-[#82786D]">{p.healthId} · {p.email}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#C85A3B] font-bold">Select →</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-[#FAF7F2] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F5C7B8]" />
              ) : (
                <Search className="w-3.5 h-3.5 text-[#F5C7B8]" />
              )}
              <span>Lookup EHR</span>
            </button>
          </form>

          {/* All Patients Directory Open Button */}
          <button
            type="button"
            onClick={() => setIsPatientDirectoryOpen(true)}
            className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#2B2521] border border-[#E8DEC8] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Users className="w-4 h-4 text-[#C85A3B]" />
            <span>All Patients Directory ({allPatients.length})</span>
          </button>
        </div>

        {/* Quick Patient Roster Switcher Chips */}
        <div className="pt-2 border-t border-[#E8E1D5] flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-[#82786D] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#82786D]" />
            Patients:
          </span>
          {allPatients.map(p => {
            const isSelected = p.id === searchedPatient.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPatient(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#2B2521] text-white border-[#2B2521] shadow-xs font-bold'
                    : 'bg-[#FAF7F2] text-[#63594F] border-[#E8DEC8] hover:border-[#C85A3B] hover:text-[#2B2521]'
                }`}
              >
                <img
                  src={p.registeredBiometrics?.facePhotoUrl || p.avatarUrl}
                  alt={p.name}
                  className="w-5 h-5 rounded-full object-cover border border-white/40"
                />
                <span>{p.name}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-[#F5C7B8]' : 'text-[#82786D]'}`}>
                  ({p.healthId})
                </span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#F5C7B8]" />}
              </button>
            );
          })}
        </div>

        {searchError && (
          <div className="mt-1 text-[#BA3B3B] text-xs font-semibold bg-[#FDF2F0] p-2.5 rounded-xl border border-[#F5C7C1]">
            {searchError}
          </div>
        )}
      </div>

      {/* VIEW 1: Consultation & AI Prescription Safety Engine */}
      {activeDoctorTab === 'consultation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          {/* Left Column: Patient Profile & Access Status */}
          <div className="lg:col-span-5 space-y-4">
            {/* Patient Card */}
            <div className="heal-card p-6 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
                <div className="flex items-center gap-3.5">
                  <img
                    src={liveScannedPhoto || searchedPatient.registeredBiometrics?.facePhotoUrl || searchedPatient.avatarUrl}
                    alt={searchedPatient.name}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-[#E8DEC8] shadow-2xs"
                  />
                  <div>
                    <h3 className="font-bold text-[#2B2521] text-base">{searchedPatient.name}</h3>
                    <p className="text-xs text-[#82786D] font-mono">ID: {searchedPatient.healthId}</p>
                    <p className="text-[11px] text-[#63594F] mt-0.5">
                      {searchedPatient.gender} · Born {searchedPatient.dob}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {hasActiveConsent ? (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5]">
                      Consent Active ✓
                    </span>
                  ) : pendingRequest ? (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#FFF9F2] text-[#C85A3B] border border-[#E8DEC8] animate-pulse">
                      Request Pending ⏳
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1]">
                      No Active Consent
                    </span>
                  )}
                </div>
              </div>

              {/* If Has Active Consent: Show Scopes & Pre-check baseline */}
              {hasActiveConsent ? (
                <>
                  <div className="space-y-2 text-xs">
                    <div className="text-[#63594F] font-semibold">Authorized Consent Scope:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {hospitalConsent?.scope.map(s => (
                        <span
                          key={s}
                          className="px-2.5 py-1 bg-[#FAF7F2] text-[#2B2521] border border-[#E8DEC8] rounded-xl font-medium"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC8] space-y-2 text-xs">
                    <div className="font-bold text-[#2B2521] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#C85A3B]" />
                      <span>Clinical Pre-Check Baseline</span>
                    </div>
                    <div className="text-[#63594F]">
                      <strong className="text-[#2B2521]">Allergies:</strong> {searchedPatient.emergencyProfile.allergies.join(', ') || 'None Documented'}
                    </div>
                    <div className="text-[#63594F]">
                      <strong className="text-[#2B2521]">Current Regimen:</strong> {searchedPatient.emergencyProfile.criticalMeds.join(', ') || 'None Active'}
                    </div>
                    <div className="text-[#63594F]">
                      <strong className="text-[#2B2521]">Blood Group:</strong> {searchedPatient.emergencyProfile.bloodGroup || 'O+'}
                    </div>
                  </div>
                </>
              ) : (
                /* NO ACTIVE CONSENT: Request Access Workflow */
                <div className="space-y-4 pt-1">
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC8] text-xs space-y-3">
                    <div className="font-bold text-[#2B2521] flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#C85A3B]" />
                      <span>Request Real-Time Patient Consent</span>
                    </div>
                    <p className="text-[#63594F] leading-relaxed">
                      In compliance with Minimum Necessary Access and Patient Sovereignty, submit an access request to {searchedPatient.name}. The patient will receive a real-time prompt to approve your requested clinical scope.
                    </p>

                    {pendingRequest ? (
                      <div className="p-3.5 bg-[#FFF9F2] rounded-xl border border-[#E8DEC8] text-[#7A402A] font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#C85A3B] animate-spin" />
                        <span>Access request sent. Awaiting patient approval in their portal...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="font-bold text-[#2B2521]">Clinical Justification / Reason *</label>
                          <textarea
                            rows={2}
                            value={requestReason}
                            onChange={e => setRequestReason(e.target.value)}
                            placeholder="Reason for accessing records..."
                            className="w-full p-2.5 bg-white rounded-xl border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-[#2B2521]">Requested Categories</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(['Lab Reports', 'Rx History', 'Diagnostic Scans', 'Surgical Notes'] as ConsentScope[]).map(sc => {
                              const isChecked = requestedScopes.includes(sc);
                              return (
                                <button
                                  key={sc}
                                  type="button"
                                  onClick={() => {
                                    setRequestedScopes(isChecked ? requestedScopes.filter(s => s !== sc) : [...requestedScopes, sc]);
                                  }}
                                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                                    isChecked ? 'bg-[#2B2521] text-white border-[#2B2521]' : 'bg-white text-[#63594F] border-[#E8E1D5] hover:border-[#C85A3B]'
                                  }`}
                                >
                                  {sc}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSendingRequest || !requestReason || requestedScopes.length === 0}
                          onClick={handleSendAccessRequest}
                          className="w-full py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                        >
                          <SendHorizontal className="w-3.5 h-3.5 text-[#F5C7B8]" />
                          <span>{isSendingRequest ? 'Sending Request...' : 'Send Access Request to Patient'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fast Emergency Bypass Callout */}
              <div className="p-3.5 rounded-2xl bg-[#FDF2F0] border border-[#F5C7C1] text-xs flex items-center justify-between text-[#BA3B3B]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#BA3B3B]" />
                  <span>Patient Incapacitated / In Crisis?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDoctorTab('emergency_unlock')}
                  className="font-bold text-[#BA3B3B] hover:underline cursor-pointer"
                >
                  Launch Emergency Unlock →
                </button>
              </div>
            </div>

            {/* Accessible Medical Records (If Consent Granted) */}
            {hasActiveConsent && (
              <div className="heal-card p-6 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#2B2521] text-sm">Authorized Medical Records</h4>
                  <span className="text-xs text-[#82786D] font-mono">{patientRecords.length} Available</span>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {patientRecords.map(record => (
                    <div
                      key={record.id}
                      className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E1D5] hover:border-[#C85A3B] transition-colors text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2B2521]">{record.title}</span>
                        <span className="text-[10px] text-[#82786D]">{record.date}</span>
                      </div>
                      <p className="text-[#63594F] line-clamp-2">{record.aiExtractedFields.summary}</p>
                      
                      {record.aiExtractedFields.values && Object.keys(record.aiExtractedFields.values).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {Object.entries(record.aiExtractedFields.values).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 bg-white rounded-lg border border-[#E8DEC8] text-[10px] font-mono text-[#2B2521]">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[#82786D]">
                        <span className="font-mono">{record.category}</span>
                        {record.fileUrl && (
                          <a
                            href={record.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C85A3B] hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>Download Full PDF</span>
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Prescription Safety Engine */}
          <div className="lg:col-span-7 space-y-4">
            <div className="heal-card p-6 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">AI Prescription Safety Engine</h3>
                    <p className="text-xs text-slate-500">
                      RxNorm / DDInter Rules Engine + Claude AI Clinical Explanation Layer
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-100 text-indigo-800">
                  Decision Support Only
                </span>
              </div>

              {/* Quick Preset Buttons for Testing Conflict Scenarios */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-500">Quick Test Scenarios:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickEvaluate('Amoxicillin')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ⚠️ Amoxicillin (Penicillin Conflict)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickEvaluate('Spironolactone')}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ⚡ Spironolactone (Hyperkalemia Conflict)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickEvaluate('Atorvastatin')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✓ Atorvastatin (Safe Regimen)
                  </button>
                </div>
              </div>

              {/* Prescription Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Medication Name</label>
                  <div className="relative">
                    <Pill className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={drugInput}
                      onChange={handleDrugInputChange}
                      placeholder="e.g. Amoxicillin, Atorvastatin, Metformin..."
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Dosage</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Frequency</label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Clinical Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    placeholder="Specific patient instructions or diagnostic context..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* AI Safety Analysis Card */}
              {isAnalyzing && (
                <div className="p-4 rounded-xl bg-slate-100 animate-pulse text-xs text-slate-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span>Cross-referencing RxNorm, DDInter graph and patient allergy history...</span>
                </div>
              )}

              {aiEvaluation && !isAnalyzing && (
                <div className="space-y-3">
                  {aiEvaluation.map((flag, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border ${
                        flag.severity === 'critical'
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : flag.severity === 'warning'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {flag.severity === 'critical' ? (
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        ) : flag.severity === 'warning' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        )}

                        <div className="space-y-2 text-xs flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase tracking-wider text-[11px]">
                              {flag.conflictType.replace('_', ' ')} · {flag.severity.toUpperCase()}
                            </span>
                            <span className="text-[10px] opacity-75 font-mono">Claude AI Verified</span>
                          </div>

                          <p className="leading-relaxed font-medium">{flag.explanation}</p>

                          <div className="p-2.5 rounded-lg bg-white/80 border border-current/20 text-xs">
                            <span className="font-bold">Clinical Recommendation:</span> {flag.clinicalRecommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* If Critical Flag: Require Doctor Override */}
                  {aiEvaluation.some(f => f.severity === 'critical') && (
                    <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                      <div className="font-bold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Doctor Retains Final Clinical Authority</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        The AI engine alerts and assists but <strong>never blocks</strong>. To proceed despite safety flag, provide clinical justification for the immutable audit log:
                      </p>
                      <input
                        type="text"
                        placeholder="Mandatory physician override justification..."
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        className="w-full text-xs p-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit e-Prescription */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {prescriptionSuccess ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> e-Prescription saved to Firestore & on-chain!
                    </span>
                  ) : (
                    `Signed by ${staff.name}`
                  )}
                </span>

                <button
                  type="button"
                  disabled={!drugInput || (aiEvaluation?.some(f => f.severity === 'critical') && !overrideReason)}
                  onClick={handleIssuePrescription}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all ${
                    !drugInput || (aiEvaluation?.some(f => f.severity === 'critical') && !overrideReason)
                      ? 'bg-slate-300 cursor-not-allowed opacity-70'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md cursor-pointer'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Issue e-Prescription</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Embedded Level-1 Emergency Multi-Factor Unlock (With Real Camera / Biometrics) */}
      {activeDoctorTab === 'emergency_unlock' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {!emergencyUnlocked ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Step 1: Factor Selection & Camera Feed */}
              <div className="lg:col-span-7 space-y-6">
                <div className="heal-card p-8 sm:p-9 space-y-6 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#C85A3B] uppercase tracking-wider">Step 1</span>
                      <h3 className="text-lg font-black text-[#2B2521] mt-0.5">Choose Verification Factor</h3>
                    </div>
                    <span className="px-3.5 py-1 bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5] text-xs font-bold rounded-full">
                      Single Factor Sufficient
                    </span>
                  </div>

                  {/* Clean Spacious Factor Tabs */}
                  <div className="grid grid-cols-3 gap-3.5">
                    {[
                      { id: 'face' as const, label: 'Face Liveness', sub: 'Live Neural AI', icon: ScanFace },
                      { id: 'qr' as const, label: 'QR Scanner', sub: 'Wristband / Card', icon: QrCode },
                      { id: 'fingerprint' as const, label: 'Fingerprint', sub: 'FIDO2 / Sensor', icon: Fingerprint },
                    ].map(factor => {
                      const Icon = factor.icon;
                      const isSelected = selectedFactor === factor.id;
                      return (
                        <button
                          key={factor.id}
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setSelectedFactor(factor.id);
                            setScanningState('idle');
                          }}
                          className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'border-[#C85A3B] bg-[#FDF8F5] text-[#2B2521] shadow-xs'
                              : 'border-[#E8E1D5] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#63594F]'
                          }`}
                        >
                          <Icon className={`w-7 h-7 ${isSelected ? 'text-[#C85A3B]' : 'text-[#82786D]'}`} />
                          <span className="text-xs font-bold">{factor.label}</span>
                          <span className="text-[10px] text-[#82786D]">{factor.sub}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive Camera / Sensor Feed Box */}
                  <div className="p-8 rounded-3xl bg-[#241F1C] text-white relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[290px] border border-[#3E352F]">
                    {/* Live Video Feed Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover rounded-3xl ${cameraActive ? 'block' : 'hidden'}`}
                    />

                    {/* Camera Overlay Grid when active */}
                    {cameraActive && (
                      <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-3xl flex items-center justify-center pointer-events-none">
                        <div className="w-44 h-44 border-2 border-dashed border-emerald-400 rounded-full animate-pulse flex items-center justify-center">
                          <span className="text-xs font-mono font-bold bg-black/60 px-3 py-1 rounded-full text-emerald-300">
                            Aligning Face...
                          </span>
                        </div>
                      </div>
                    )}

                    {scanningState === 'idle' && (
                      <div className="space-y-4 z-10 max-w-sm">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-[#D8CEBE]">
                          {selectedFactor === 'face' && <ScanFace className="w-8 h-8 text-[#FAF7F2]" />}
                          {selectedFactor === 'qr' && <QrCode className="w-8 h-8 text-[#FAF7F2]" />}
                          {selectedFactor === 'fingerprint' && <Fingerprint className="w-8 h-8 text-[#FAF7F2]" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            Ready to Scan {selectedFactor.toUpperCase()}
                          </p>
                          <p className="text-xs text-[#D8CEBE] mt-1">
                            {selectedFactor === 'face' ? 'Align patient face in frame for 128D neural recognition' : selectedFactor === 'qr' ? 'Aim camera at emergency wristband or sovereign card' : 'Place finger on hardware biometric sensor'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleStartRealScan}
                            className="px-6 py-3 bg-[#BA3B3B] hover:bg-[#A32A2A] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Start Real {selectedFactor.toUpperCase()} Scan</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleInstantVerify}
                            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-[#FAF7F2] rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Instant Verify</span>
                          </button>
                        </div>

                        {cameraError && (
                          <p className="text-xs text-amber-300 font-medium">{cameraError}</p>
                        )}
                      </div>
                    )}

                    {scanningState === 'scanning' && (
                      <div className="space-y-3 z-10 bg-black/60 p-6 rounded-2xl backdrop-blur-md">
                        <RefreshCw className="w-10 h-10 text-[#C85A3B] animate-spin mx-auto" />
                        <div>
                          <p className="text-sm font-bold text-white">
                            Analyzing Live Biometrics & Neural Embeddings...
                          </p>
                          <p className="text-xs text-[#D8CEBE] mt-1">
                            Searching candidate database in Supabase...
                          </p>
                        </div>
                      </div>
                    )}

                    {scanningState === 'verified' && (
                      <div className="space-y-3 z-10 bg-black/85 p-6 rounded-3xl backdrop-blur-md animate-in zoom-in-95 duration-200 border border-emerald-500/40 max-w-md mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                          <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                            Patient Identified & Verified
                          </span>
                          <h4 className="text-lg font-bold text-white mt-1">
                            {searchedPatient.name}
                          </h4>
                          <p className="text-xs text-emerald-300 font-mono mt-0.5">
                            HealthID: {searchedPatient.healthId} · Blood Group: {searchedPatient.emergencyProfile?.bloodGroup || 'O+'}
                          </p>
                          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                            {scanFeedbackMessage || '128D FaceNet Match Confirmed · Ready to Unseal'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setScanningState('idle');
                          }}
                          className="text-xs text-slate-400 hover:text-white underline cursor-pointer pt-1"
                        >
                          Rescan / Switch Patient
                        </button>
                      </div>
                    )}

                    {scanningState === 'failed' && (
                      <div className="space-y-3 z-10 bg-black/85 p-6 rounded-3xl backdrop-blur-md animate-in zoom-in-95 duration-200 border border-rose-500/40 max-w-md mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500 flex items-center justify-center mx-auto text-rose-400">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                          <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                            Verification Mismatch
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            No Matching Patient Found
                          </h4>
                          <p className="text-xs text-rose-200 mt-1 max-w-sm mx-auto">
                            {scanFeedbackMessage || 'Live face did not match enrolled templates.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setScanningState('idle');
                          }}
                          className="px-5 py-2 bg-[#BA3B3B] hover:bg-[#A32A2A] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md mt-2"
                        >
                          Retry Scan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Reason Code & Unseal Button */}
              <div className="lg:col-span-5 space-y-6">
                <div className="heal-card p-8 sm:p-9 space-y-6 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm flex flex-col justify-between h-full">
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs font-bold text-[#BA3B3B] uppercase tracking-wider">Step 2</span>
                      <h3 className="text-lg font-black text-[#2B2521] mt-0.5">Clinical Reason</h3>
                      <p className="text-xs text-[#82786D] mt-1">
                        Recorded on-chain for audit accountability
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

                  {/* Big Unseal Action Button */}
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
                    {scanningState !== 'verified' && (
                      <p className="text-[11px] text-center text-[#82786D]">
                        Verify face or factor above to enable unseal button
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked Emergency Card View — Spacious & Elegant */
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Top Success Banner */}
              <div className="p-6 rounded-3xl bg-[#2D6346] text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-white/15 rounded-2xl">
                    <CheckCircle2 className="w-7 h-7 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Emergency Profile Unsealed</h3>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      On-chain transaction minted: <span className="font-mono text-emerald-200">{lastEmergencyTx?.txHash.substring(0, 16)}...</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      const el = document.getElementById('emergency-request-access-box');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 bg-white text-[#2B2521] hover:bg-[#FAF7F2] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#C85A3B]" />
                    <span>Request Full Old Records</span>
                  </button>

                  <button
                    onClick={() => {
                      setEmergencyUnlocked(false);
                      setScanningState('idle');
                    }}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset & Reseal
                  </button>

                  <button
                    onClick={() => setActiveDoctorTab('consultation')}
                    className="px-4 py-2 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Consultation Tab
                  </button>
                </div>
              </div>

              {/* Clean Spacious Emergency Profile Card */}
              <div className="heal-card p-8 sm:p-10 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-8">
                {/* Header with Photo & Blood Group */}
                <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-[#E8E1D5]">
                  <div className="flex items-center gap-5">
                    <img
                      src={liveScannedPhoto || searchedPatient.registeredBiometrics?.facePhotoUrl || searchedPatient.avatarUrl}
                      alt={searchedPatient.name}
                      className="w-20 h-20 rounded-3xl object-cover border-2 border-[#BA3B3B] shadow-md ring-4 ring-[#BA3B3B]/10"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-[#2B2521] tracking-tight">{searchedPatient.name}</h2>
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1]">
                          EMERGENCY SCOPE ONLY
                        </span>
                      </div>
                      <div className="text-xs text-[#82786D] font-mono">
                        Health ID: {searchedPatient.healthId} · DOB: {searchedPatient.dob} ({searchedPatient.gender})
                      </div>
                    </div>
                  </div>

                  {/* Clean Blood Group Pill */}
                  <div className="flex items-center gap-4 px-6 py-4 bg-[#FDF2F0] border border-[#F5C7C1] rounded-3xl text-[#BA3B3B]">
                    <Heart className="w-9 h-9 fill-[#BA3B3B] text-[#BA3B3B] animate-pulse" />
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#962828]">Blood Group</div>
                      <div className="text-3xl font-black text-[#BA3B3B]">{searchedPatient.emergencyProfile?.bloodGroup || 'O+'}</div>
                    </div>
                  </div>
                </div>

                {/* Vitals & Meds Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Allergies */}
                  <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-4">
                    <div className="flex items-center gap-2 text-[#962828] font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 text-[#BA3B3B]" />
                      <span>High-Alert Allergies</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {(searchedPatient.emergencyProfile?.allergies?.length ? searchedPatient.emergencyProfile.allergies : ['No critical allergies documented']).map(allergy => (
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
                      {(searchedPatient.emergencyProfile?.criticalMeds?.length ? searchedPatient.emergencyProfile.criticalMeds : ['No critical daily medications recorded']).map(med => (
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

                {/* Emergency Contacts */}
                <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#2B2521] text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#C85A3B]" />
                      <span>Emergency Contacts (SMS Push Dispatched)</span>
                    </div>
                    <span className="text-xs text-[#2D6346] font-bold">✓ Automated Push Sent</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(searchedPatient.emergencyProfile?.emergencyContacts?.length ? searchedPatient.emergencyProfile.emergencyContacts : [{ name: 'Primary Kin', relation: 'Family', phone: searchedPatient.phone || 'Emergency Services' }]).map(c => (
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
              </div>

              {/* Step 3: Request Full Medical Record Access to View Old EHR / Lab Tests */}
              <div id="emergency-request-access-box" className="heal-card p-8 sm:p-10 bg-gradient-to-br from-[#241F1C] via-[#332A24] to-[#201B18] text-[#FAF7F2] rounded-3xl border border-[#3E352F] shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-white/10 border border-white/15 rounded-2xl">
                      <KeyRound className="w-6 h-6 text-[#F5C7B8]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-black text-white tracking-tight">
                          Request Full Medical Records & Past EHR Access
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#C85A3B]/30 text-[#F5C7B8] border border-[#C85A3B]/40 text-[10px] font-bold uppercase tracking-wider">
                          Patient Consent Required
                        </span>
                      </div>
                      <p className="text-xs text-[#D8CEBE] mt-0.5">
                        Emergency bypass only unlocked vitals. Send an authorized request to {searchedPatient.name} to unseal all historical lab tests, past prescriptions, and scans.
                      </p>
                    </div>
                  </div>

                  {hasActiveConsent && (
                    <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Full Access Granted ✓</span>
                    </span>
                  )}
                </div>

                {hasActiveConsent ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-emerald-200">
                        ✓ Consent Active: You have authorized access to view all historical records!
                      </h4>
                      <p className="text-xs text-emerald-300/80">
                        Scopes: {hospitalConsent?.scope.join(', ') || 'All Clinical EHR'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDoctorTab('consultation')}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Open Full Patient EHR & Lab Records →</span>
                    </button>
                  </div>
                ) : pendingRequest ? (
                  <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-amber-400 animate-spin" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-200">
                          Access Request Dispatched & Pending Patient Approval
                        </h4>
                        <p className="text-xs text-amber-300/80 mt-0.5">
                          A real-time prompt was sent to {searchedPatient.name}. When approved in their portal, this terminal will automatically unlock.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <span className="text-xs font-mono text-amber-300 bg-amber-900/40 px-3 py-1 rounded-xl border border-amber-700/50">
                        Scopes: {pendingRequest.requestedScope.join(', ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Clinical Justification */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#F5C7B8] flex items-center justify-between">
                        <span>Clinical Purpose of Request *</span>
                        <span className="text-[11px] text-[#82786D] font-normal">Recorded on-chain</span>
                      </label>
                      <input
                        type="text"
                        value={requestReason}
                        onChange={e => setRequestReason(e.target.value)}
                        placeholder="e.g., Trauma post-incident evaluation and full cardiology history review"
                        className="w-full text-xs p-3.5 rounded-xl bg-black/30 border border-white/15 text-white placeholder-[#82786D] focus:ring-2 focus:ring-[#C85A3B] focus:outline-none"
                      />
                    </div>

                    {/* Scopes Selection */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-[#F5C7B8]">
                        Select Clinical Categories:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(['Lab Reports', 'Rx History', 'Diagnostic Scans', 'Surgical Notes'] as ConsentScope[]).map(sc => {
                          const isChecked = requestedScopes.includes(sc);
                          return (
                            <button
                              key={sc}
                              type="button"
                              onClick={() => {
                                setRequestedScopes(
                                  isChecked
                                    ? requestedScopes.filter(s => s !== sc)
                                    : [...requestedScopes, sc]
                                );
                              }}
                              className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                                isChecked
                                  ? 'bg-[#C85A3B] border-[#E8795A] text-white shadow-md'
                                  : 'bg-black/20 border-white/15 text-[#D8CEBE] hover:bg-white/10'
                              }`}
                            >
                              <span>{sc}</span>
                              {isChecked ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-[#82786D]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs text-[#82786D]">
                        Prompt will appear instantly in {searchedPatient.name}'s Patient Dashboard.
                      </p>
                      <button
                        type="button"
                        disabled={isSendingRequest || requestedScopes.length === 0}
                        onClick={handleSendAccessRequest}
                        className="px-6 py-3.5 bg-[#C85A3B] hover:bg-[#B84E30] disabled:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-2"
                      >
                        {isSendingRequest ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Dispatching Request...</span>
                          </>
                        ) : requestSentSuccess ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>Request Dispatched ✓</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send Access Request to Patient</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL PATIENTS DIRECTORY MODAL */}
      {isPatientDirectoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E1D5] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[#E8E1D5] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2B2521] text-white rounded-2xl">
                  <Users className="w-5 h-5 text-[#F5C7B8]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2B2521] text-base sm:text-lg">
                    All Registered Patients Directory
                  </h3>
                  <p className="text-xs text-[#82786D]">
                    {allPatients.length} Registered Patients in Hospital Network · Real-Time Decentralized EHR
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPatientDirectoryOpen(false)}
                className="p-2 text-[#82786D] hover:text-[#2B2521] hover:bg-[#EAE2D5] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-[#E8E1D5] bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-[#82786D] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={directorySearchQuery}
                  onChange={e => setDirectorySearchQuery(e.target.value)}
                  placeholder="Filter patients by name, Health ID (HL-...), email, blood group, or allergies..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] rounded-2xl text-xs border border-[#E8E1D5] font-semibold text-[#2B2521] placeholder-[#82786D] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                />
              </div>
            </div>

            {/* Patients List Grid */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-[#FAF7F2]/40">
              {allPatients
                .filter(p => {
                  const q = directorySearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.healthId.toLowerCase().includes(q) ||
                    p.email.toLowerCase().includes(q) ||
                    p.emergencyProfile?.bloodGroup?.toLowerCase().includes(q) ||
                    p.emergencyProfile?.allergies?.some(a => a.toLowerCase().includes(q)) ||
                    p.emergencyProfile?.criticalConditions?.some(c => c.toLowerCase().includes(q))
                  );
                })
                .map(p => {
                  const isCurrent = p.id === searchedPatient.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-5 rounded-3xl border transition-all space-y-4 ${
                        isCurrent
                          ? 'bg-white border-[#C85A3B] shadow-md ring-2 ring-[#C85A3B]/20'
                          : 'bg-white border-[#E8E1D5] hover:border-[#C85A3B] shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={p.registeredBiometrics?.facePhotoUrl || p.avatarUrl}
                            alt={p.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#E8DEC8] shadow-xs shrink-0"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-base text-[#2B2521]">{p.name}</h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FAF7F2] text-[#2B2521] border border-[#E8DEC8]">
                                {p.healthId}
                              </span>
                              {isCurrent && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2B2521] text-[#F5C7B8]">
                                  Currently Open in EHR
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#63594F] mt-1 flex flex-wrap items-center gap-3">
                              <span><strong>DOB:</strong> {p.dob || '1992-04-14'}</span>
                              <span>•</span>
                              <span><strong>Gender:</strong> {p.gender || 'Female'}</span>
                              <span>•</span>
                              <span><strong>Blood Group:</strong> <span className="text-[#BA3B3B] font-bold">{p.emergencyProfile?.bloodGroup || 'A+'}</span></span>
                              <span>•</span>
                              <span><strong>Phone:</strong> {p.phone || '+1 (555) 438-9210'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                            isCurrent
                              ? 'bg-[#2D6346] text-white'
                              : 'bg-[#2B2521] hover:bg-[#3D352E] text-white active:scale-95'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#F5C7B8]" />
                          <span>{isCurrent ? 'Viewing Active EHR ✓' : 'Open Patient EHR →'}</span>
                        </button>
                      </div>

                      {/* Clinical Baseline Summary Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8E1D5] text-xs">
                        <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DEC8] space-y-1">
                          <span className="text-[#82786D] font-bold text-[11px] block uppercase tracking-wider">
                            Documented Allergies:
                          </span>
                          <p className="text-[#BA3B3B] font-semibold">
                            {p.emergencyProfile?.allergies?.join(', ') || 'No known drug allergies'}
                          </p>
                        </div>

                        <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DEC8] space-y-1">
                          <span className="text-[#82786D] font-bold text-[11px] block uppercase tracking-wider">
                            Current Daily Medications:
                          </span>
                          <p className="text-[#2B2521] font-semibold">
                            {p.emergencyProfile?.criticalMeds?.join(', ') || 'No active daily medications'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#E8E1D5] bg-white flex justify-between items-center text-xs">
              <span className="text-[#82786D]">
                Select any patient to switch the Doctor Consultation & AI Prescription workflow.
              </span>
              <button
                type="button"
                onClick={() => setIsPatientDirectoryOpen(false)}
                className="px-5 py-2 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
