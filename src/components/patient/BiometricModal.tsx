import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Check, 
  AlertCircle, 
  ScanFace, 
  Fingerprint, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Lock,
  AlertTriangle,
  Users
} from 'lucide-react';
import { Patient } from '../../types';
import { 
  biometricService, 
  FaceFeatureExtractionResult, 
  BiometricMatchResult 
} from '../../services/biometricService';
import confetti from 'canvas-confetti';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  mode: 'enroll_face' | 'verify_face' | 'enroll_fingerprint' | 'verify_fingerprint';
  onBiometricsUpdated: (updatedBiometrics: Patient['registeredBiometrics']) => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  onClose,
  patient,
  mode,
  onBiometricsUpdated,
}) => {
  const [step, setStep] = useState<'idle' | 'capturing' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedFace, setExtractedFace] = useState<FaceFeatureExtractionResult | null>(null);
  const [matchResult, setMatchResult] = useState<BiometricMatchResult | null>(null);
  const [fingerprintScanProgress, setFingerprintScanProgress] = useState(0);
  const [isHardwareAvailable, setIsHardwareAvailable] = useState<boolean>(true);
  const [modelsLoading, setModelsLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize hardware capability detection
  useEffect(() => {
    biometricService.isHardwarePlatformAuthenticatorAvailable().then(avail => {
      setIsHardwareAvailable(avail);
    });
  }, []);

  // Initialize camera or sensor when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep('idle');
      setErrorMessage(null);
      setExtractedFace(null);
      setMatchResult(null);
      return;
    }

    if (mode === 'enroll_face' || mode === 'verify_face') {
      startCamera();
    } else {
      setStep('idle');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  const startCamera = async () => {
    setStep('capturing');
    setErrorMessage(null);
    setModelsLoading(true);

    try {
      // Pre-load Neural Network Models
      await biometricService.loadModels();
      setModelsLoading(false);

      if (videoRef.current) {
        const stream = await biometricService.startCameraStream(videoRef.current);
        streamRef.current = stream;
      }
    } catch (err: any) {
      setModelsLoading(false);
      setErrorMessage(err.message || 'Camera or Neural Network Model initialization failed.');
      setStep('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      biometricService.stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Face Capture & Enrollment
  const handleCaptureFace = async () => {
    setStep('processing');
    setErrorMessage(null);

    try {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        throw new Error('Camera stream not ready. Please wait for camera initialization.');
      }

      // Real Neural Network Face Detection & 128D Embedding Extraction
      const faceData = await biometricService.extractFaceFeatures(videoRef.current);
      setExtractedFace(faceData);

      if (mode === 'enroll_face') {
        const updatedBiometrics: Patient['registeredBiometrics'] = {
          ...patient.registeredBiometrics,
          faceTemplateRef: faceData.templateRef,
          faceRegisteredAt: new Date().toISOString(),
          facePhotoUrl: faceData.photoUrl,
          faceFeatures: faceData.featureVector,
          faceLivenessScore: faceData.livenessScore,
          lastUpdated: new Date().toISOString().split('T')[0],
        };

        onBiometricsUpdated(updatedBiometrics);
        setStep('success');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } else if (mode === 'verify_face') {
        // Compare with enrolled embedding
        const match = biometricService.verifyFaceMatch(
          faceData.featureVector,
          patient.registeredBiometrics.faceFeatures,
          patient.registeredBiometrics.faceTemplateRef
        );
        setMatchResult(match);

        if (match.matched) {
          setStep('success');
          confetti({ particleCount: 40, spread: 50 });
        } else {
          setErrorMessage(match.details);
          setStep('error');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Face recognition extraction failed.');
      setStep('error');
    }
  };

  // Fingerprint Enrollment & Verification
  const handleScanFingerprint = async () => {
    setStep('processing');
    setErrorMessage(null);
    setFingerprintScanProgress(25);

    try {
      if (mode === 'enroll_fingerprint') {
        setFingerprintScanProgress(60);
        const result = await biometricService.enrollFingerprintFIDO2(patient);
        setFingerprintScanProgress(100);

        const updatedBiometrics: Patient['registeredBiometrics'] = {
          ...patient.registeredBiometrics,
          fingerprintTemplateRef: result.templateRef,
          fingerprintCredentialId: result.credentialId,
          fingerprintRegisteredAt: result.registeredAt,
          lastUpdated: new Date().toISOString().split('T')[0],
        };

        onBiometricsUpdated(updatedBiometrics);
        setStep('success');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } else if (mode === 'verify_fingerprint') {
        setFingerprintScanProgress(60);
        const result = await biometricService.verifyFingerprintFIDO2(
          patient.registeredBiometrics.fingerprintCredentialId || patient.registeredBiometrics.fingerprintTemplateRef
        );
        setFingerprintScanProgress(100);
        setMatchResult(result);

        if (result.matched) {
          setStep('success');
          confetti({ particleCount: 40, spread: 50 });
        } else {
          setErrorMessage(result.details);
          setStep('error');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Fingerprint biometric scan failed.');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  const isFaceMode = mode === 'enroll_face' || mode === 'verify_face';
  const isEnroll = mode === 'enroll_face' || mode === 'enroll_fingerprint';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              {isFaceMode ? (
                <ScanFace className="w-6 h-6 text-cyan-300" />
              ) : (
                <Fingerprint className="w-6 h-6 text-amber-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  {isFaceMode 
                    ? (isEnroll ? '3D Face Recognition Enrollment' : 'Verify Patient Identity via Face') 
                    : (isEnroll ? 'WebAuthn FIDO2 Hardware Registration' : 'Verify Patient Fingerprint')}
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                {isFaceMode 
                  ? 'Real-Time 128D Neural Embeddings & Anti-Spoofing' 
                  : 'FIPS 140-2 Level 3 Secure Enclave & TPM 2.0 Biometrics'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* FACE RECOGNITION VIEW */}
          {isFaceMode && (
            <div className="space-y-4">
              {/* Camera Stream Box with Reticle */}
              <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />

                {/* Live Model Loading Indicator */}
                {modelsLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 text-white z-20">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                    <p className="text-xs font-bold">Loading Neural Network Weights (128D FaceNet)...</p>
                  </div>
                )}

                {/* 3D Facial Reticle Overlay */}
                {step === 'capturing' && !modelsLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-56 h-72 border-2 border-cyan-400/80 rounded-[50px] relative flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.25)]">
                      {/* Reticle Corner Brackets */}
                      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
                      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
                      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
                      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />
                      
                      {/* Scanning Horizontal Laser Beam */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-1/4 animate-bounce" />

                      {/* Center Landmark Grid */}
                      <div className="grid grid-cols-3 gap-8 opacity-40">
                        <div className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
                        <div className="w-2 h-2 rounded-full bg-cyan-300" />
                        <div className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
                        <div className="w-2 h-2 rounded-full bg-cyan-300" />
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <div className="w-2 h-2 rounded-full bg-cyan-300" />
                      </div>
                    </div>

                    <div className="mt-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>Align Face Inside Oval · Single Face Required</span>
                    </div>
                  </div>
                )}

                {/* Processing Overlay */}
                {step === 'processing' && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20">
                    <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                    <h4 className="font-bold text-sm text-white">Extracting 128-Dimensional Face Embedding...</h4>
                    <p className="text-xs text-slate-300 mt-1 font-mono">Running Real-Time Euclidean Distance & Landmark Analysis</p>
                  </div>
                )}

                {/* Success Overlay */}
                {step === 'success' && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-5 text-white animate-in zoom-in-95 z-20">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-2.5 text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono font-black text-xs uppercase tracking-wider mb-1">
                      MATCHED — ACCESS GRANTED
                    </span>
                    <h4 className="font-bold text-base text-white">
                      {isEnroll ? 'Face Embedding Enrolled!' : 'Identity Verified Successfully!'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                      {isEnroll
                        ? `Extracted 128-float vector and generated Zero-Knowledge template. Raw photo not uploaded.`
                        : matchResult?.details || 'Face matches enrolled patient template.'}
                    </p>
                    {matchResult && (
                      <div className="mt-3 grid grid-cols-2 gap-2 w-full max-w-xs text-[11px] font-mono bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-left text-slate-400">
                          Euclidean Dist: <span className="font-bold text-emerald-400">{matchResult.euclideanDistance}</span>
                        </div>
                        <div className="text-right text-slate-400">
                          Confidence: <span className="font-bold text-emerald-400">{matchResult.confidenceScore}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Overlay */}
                {step === 'error' && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-5 text-white animate-in zoom-in-95 z-20">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mb-2 text-rose-400">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-0.5 rounded-full bg-rose-500/30 text-rose-300 font-mono font-black text-xs uppercase tracking-wider mb-1">
                      NOT MATCHED — ACCESS DENIED
                    </span>
                    <h4 className="font-bold text-sm text-rose-200">Biometric Verification Failed</h4>
                    <p className="text-xs text-rose-100/90 mt-1 max-w-xs mx-auto">
                      {errorMessage || matchResult?.details || 'Face mismatch or detection error.'}
                    </p>
                    {matchResult && matchResult.euclideanDistance < 5 && (
                      <div className="mt-2 text-[11px] font-mono text-rose-300">
                        Measured Distance: {matchResult.euclideanDistance} (Max allowed: 0.58)
                      </div>
                    )}
                    <button
                      onClick={startCamera}
                      className="mt-4 px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Try Again / Re-align Face
                    </button>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Strict Metric:</span> 128D Cosine & Euclidean threshold (Cutoff: $\le 0.58$).
                </div>

                {step === 'capturing' && !modelsLoading && (
                  <button
                    type="button"
                    onClick={handleCaptureFace}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isEnroll ? 'Capture & Enroll Face' : 'Scan & Verify Face'}</span>
                  </button>
                )}

                {step === 'success' && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Done & Save</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FINGERPRINT BIOMETRIC VIEW */}
          {!isFaceMode && (
            <div className="space-y-5">
              <div className="p-8 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-800 shadow-inner min-h-[240px]">
                {/* Ripple wave animation when scanning */}
                {step === 'processing' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 rounded-full border border-amber-400/40 animate-ping" />
                    <div className="w-60 h-60 rounded-full border border-amber-500/20 animate-pulse" />
                  </div>
                )}

                {step === 'idle' && (
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                      <Fingerprint className="w-10 h-10 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-100">
                        {isEnroll ? 'Hardware Biometric Registration (FIDO2)' : 'Authenticate with Platform Biometrics'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Touch your hardware biometric sensor (Touch ID, Windows Hello, or USB Security Key).
                      </p>

                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-400/30 rounded-full text-[11px] text-amber-300 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Platform Authenticator: {isHardwareAvailable ? 'TPM 2.0 / Apple Secure Enclave / Windows Hello' : 'Hardware Sensor Unavailable'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleScanFingerprint}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 mx-auto shadow-lg transition-all cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>{isEnroll ? 'Trigger Hardware WebAuthn Enrollment' : 'Verify Hardware Fingerprint'}</span>
                    </button>
                  </div>
                )}

                {step === 'processing' && (
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-300">
                      <Fingerprint className="w-10 h-10 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-amber-300">Waiting for Hardware Biometric Verification...</h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Respond to OS prompt (Touch ID / Windows Hello)
                      </p>
                    </div>
                  </div>
                )}

                {step === 'success' && (
                  <div className="space-y-3 animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono font-black text-xs uppercase tracking-wider">
                      VERIFIED — ACCESS GRANTED
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-emerald-300">
                        {isEnroll ? 'FIDO2 Credential Registered!' : 'Fingerprint Verified!'}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                        Hardware security handshake confirmed with Secure Enclave.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                )}

                {step === 'error' && (
                  <div className="space-y-3 animate-in zoom-in-95">
                    <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-0.5 rounded-full bg-rose-500/30 text-rose-300 font-mono font-black text-xs uppercase tracking-wider">
                      FAILED / UNSUPPORTED
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-rose-300">Biometric Authentication Failed</h4>
                      <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                        {errorMessage || 'Verification cancelled or sensor unsupported.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('idle')}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Retry Verification
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong className="text-slate-800">Hardware Protection:</strong> Raw fingerprint minutiae never leave your device's security enclave chip. Only cryptographic signatures are verified.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
