import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  ScanFace, 
  Sparkles, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import { AuthUser, authService } from '../../services/authService';
import { biometricService, FaceFeatureExtractionResult, BiometricMatchResult } from '../../services/biometricService';
import { supabaseService } from '../../services/supabaseService';
import confetti from 'canvas-confetti';

interface FaceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const FaceLoginModal: React.FC<FaceLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'idle' | 'scanning' | 'analyzing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<string | null>(null);
  const [matchedUser, setMatchedUser] = useState<AuthUser | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setStep('idle');
      setErrorMessage(null);
      setMatchDetails(null);
      setMatchedUser(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setStep('scanning');
    setErrorMessage(null);
    try {
      await biometricService.loadModels();
      if (videoRef.current) {
        const stream = await biometricService.startCameraStream(videoRef.current);
        streamRef.current = stream;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to access camera or load neural networks.');
      setStep('failed');
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

  const handleScanFace = async () => {
    setStep('analyzing');
    setErrorMessage(null);

    try {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        throw new Error('Camera not ready. Please look directly at the camera.');
      }

      // 1. Extract 128D FaceNet Embedding from live webcam frame
      const faceData = await biometricService.extractFaceFeatures(videoRef.current);
      if (faceData.photoUrl) {
        setLiveSnapshot(faceData.photoUrl);
      }

      // 2. Perform strict 1-to-N matching against registered database & local accounts
      const user = await authService.loginWithFaceFeatures(faceData.featureVector);

      stopCamera();
      setMatchedUser(user);
      setStep('success');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

      setTimeout(() => {
        onLoginSuccess(user);
      }, 1200);
    } catch (err: any) {
      stopCamera();
      setErrorMessage(
        err.message || 'Face not recognized. No registered account matches this biometric identity.'
      );
      setStep('failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E1D5] w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-[#2B2521] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15">
              <ScanFace className="w-6 h-6 text-[#F5C7B8]" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">3D Face Recognition Login</h3>
              <p className="text-xs text-[#D8CEBE]">
                128D Neural Vector Matching · Anti-Spoofing Liveness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-[#D8CEBE] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 bg-[#FAF7F2]/40">
          {/* Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-[#E8DEC8] shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* High-Tech Oval Landmark Guide */}
            {step === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-64 border-2 border-dashed border-[#C85A3B] rounded-full animate-pulse opacity-80" />
                <div className="absolute top-4 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-full text-[11px] font-mono text-white">
                  Center face in oval & look directly at camera
                </div>
              </div>
            )}

            {/* Analyzing Overlay */}
            {step === 'analyzing' && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border-2 border-[#C85A3B] flex items-center justify-center text-[#F5C7B8] animate-spin">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-[#FAF7F2]">Extracting 128D Neural Embedding...</p>
                  <p className="text-xs text-[#D8CEBE] font-mono">
                    Searching registered patient biometric ledger (Threshold d &le; 0.40)
                  </p>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {step === 'success' && matchedUser && (
              <div className="absolute inset-0 bg-[#EDF5F0]/95 backdrop-blur-xs flex flex-col items-center justify-center text-[#2D6346] space-y-3 p-6 text-center animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-[#2D6346] text-white flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-[#1E432F]">Identity Verified!</h4>
                  <p className="text-xs text-[#2D6346] font-semibold">
                    Welcome back, {matchedUser.displayName} ({matchedUser.patientData?.healthId || matchedUser.email})
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-white rounded-full text-[11px] font-mono font-bold border border-[#C4DFC5]">
                    ✓ Biometric Signature Matched (d &le; 0.40)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Failure Alert */}
          {step === 'failed' && (
            <div className="p-4 rounded-2xl bg-[#FDF2F0] border border-[#F5C7C1] flex items-start gap-3 text-xs text-[#BA3B3B] animate-in shake">
              <AlertTriangle className="w-5 h-5 text-[#BA3B3B] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Authentication Denied</p>
                <p className="leading-relaxed">
                  {errorMessage || 'Scanned face does not match any enrolled patient in the database. Access Denied.'}
                </p>
              </div>
            </div>
          )}

          {/* Strict Security Note */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center gap-2.5 text-[11px] text-[#63594F]">
            <Lock className="w-4 h-4 text-[#2D6346] shrink-0" />
            <span>
              HealLock enforces strict 128D mathematical thresholds (d &le; 0.40 & cos &ge; 0.90). Unregistered faces are rejected.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E8E1D5] bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#82786D] hover:text-[#2B2521] font-bold cursor-pointer"
          >
            Cancel
          </button>

          {step === 'scanning' && (
            <button
              type="button"
              onClick={handleScanFace}
              className="px-6 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Camera className="w-4 h-4 text-[#F5C7B8]" />
              <span>Scan Face & Authenticate</span>
            </button>
          )}

          {step === 'failed' && (
            <button
              type="button"
              onClick={startCamera}
              className="px-5 py-2.5 bg-[#C85A3B] hover:bg-[#B84E30] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
