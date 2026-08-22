import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  QrCode, 
  Smartphone, 
  UserCheck, 
  Fingerprint, 
  Lock, 
  Bell, 
  Check, 
  Download,
  Copy,
  CheckCircle2,
  ScanFace,
  Camera,
  RefreshCw,
  Sparkles,
  Shield,
  Eye
} from 'lucide-react';
import { Patient } from '../../types';
import { BiometricModal } from './BiometricModal';
import { EmergencyQrModal } from './EmergencyQrModal';

interface SettingsViewProps {
  patient: Patient;
  onUpdateBiometrics?: (updatedBiometrics: Patient['registeredBiometrics']) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  patient,
  onUpdateBiometrics 
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Modals state
  const [biometricModalMode, setBiometricModalMode] = useState<'enroll_face' | 'verify_face' | 'enroll_fingerprint' | 'verify_fingerprint' | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(patient.registeredBiometrics.faceTemplateRef);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleBiometricsUpdated = (updated: Patient['registeredBiometrics']) => {
    onUpdateBiometrics?.(updated);
  };

  const hasFace = Boolean(patient.registeredBiometrics.faceTemplateRef);
  const hasFingerprint = Boolean(patient.registeredBiometrics.fingerprintTemplateRef);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#2B2521] tracking-tight">
          Security & Biometric Settings
        </h1>
        <p className="text-xs text-[#82786D] mt-0.5">
          Manage hardware credentials, emergency factors, cryptographic key pairs, and alerts.
        </p>
      </div>

      {/* Hardware & Biometric Factor Registry */}
      <div className="heal-card p-8 bg-white border border-[#E8E1D5] rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[#2B2521] flex items-center gap-2">
            <Key className="w-5 h-5 text-[#C85A3B]" />
            Hardware & Biometric Factor Registry
          </h2>
          <span className="px-3 py-1 bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5] rounded-full text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2D6346]" />
            <span>FIPS-140 Sovereign Cryptography</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Emergency QR Code Card */}
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2B2521] text-xs flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#C85A3B]" />
                  <span>Emergency QR</span>
                </span>
                <span className="px-2 py-0.5 bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5] rounded-md text-[10px] font-bold">Active</span>
              </div>
              <p className="text-xs text-[#82786D]">
                Printed on physical health card & emergency watch band.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-2.5 bg-[#2B2521] hover:bg-[#3D352E] active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>View & Print QR</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-1.5 bg-white text-[#4F4740] font-semibold text-xs rounded-xl border border-[#E8E1D5] hover:bg-[#FAF7F2] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#82786D]" />
                <span>Inspect Payload</span>
              </button>
            </div>
          </div>

          {/* 2. Face Liveness & 3D Mesh Card */}
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2B2521] text-xs flex items-center gap-1.5">
                  <ScanFace className="w-4 h-4 text-[#C85A3B]" />
                  <span>Face Liveness</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  hasFace ? 'bg-[#EDF5F0] text-[#2D6346] border-[#C4DFC5]' : 'bg-[#FDF2F0] text-[#BA3B3B] border-[#F5C7C1]'
                }`}>
                  {hasFace ? 'Registered' : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-[#82786D]">
                Facial mesh stored locally with zero cloud photo upload.
              </p>

              {patient.registeredBiometrics.facePhotoUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <img
                    src={patient.registeredBiometrics.facePhotoUrl}
                    alt="Enrolled Face"
                    className="w-8 h-8 rounded-full object-cover border-2 border-[#E8E1D5]"
                  />
                  <div className="text-[10px] text-[#2D6346] font-mono">
                    Liveness: {patient.registeredBiometrics.faceLivenessScore || 98.4}% ✓
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => setBiometricModalMode('enroll_face')}
                className="w-full py-2.5 bg-[#2B2521] hover:bg-[#3D352E] active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{hasFace ? 'Re-scan Face' : 'Enroll Face Mesh'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBiometricModalMode('verify_face')}
                  className="flex-1 py-1.5 bg-white text-[#2B2521] font-bold text-xs rounded-xl border border-[#E8E1D5] hover:bg-[#FAF7F2] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Verify Face</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyKey}
                  title="Copy Face Template Hash"
                  className="p-2 bg-white text-[#2B2521] rounded-xl border border-[#E8E1D5] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-[#2D6346]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Fingerprint FIDO2 Hardware Card */}
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2B2521] text-xs flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-[#C85A3B]" />
                  <span>Fingerprint FIDO2</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  hasFingerprint ? 'bg-[#EDF5F0] text-[#2D6346] border-[#C4DFC5]' : 'bg-[#FDF2F0] text-[#BA3B3B] border-[#F5C7C1]'
                }`}>
                  {hasFingerprint ? 'Enrolled' : 'Not Enrolled'}
                </span>
              </div>
              <p className="text-xs text-[#82786D]">
                WebAuthn hardware biometric token linked to public key.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => setBiometricModalMode('enroll_fingerprint')}
                className="w-full py-2.5 bg-[#2B2521] hover:bg-[#3D352E] active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>{hasFingerprint ? 'Re-enroll Key' : 'Enroll Key'}</span>
              </button>

              <button
                type="button"
                onClick={() => setBiometricModalMode('verify_fingerprint')}
                className="w-full py-1.5 bg-white text-[#2B2521] font-bold text-xs rounded-xl border border-[#E8E1D5] hover:bg-[#FAF7F2] flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D6346]" />
                <span>Test Fingerprint</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alerts & Dispatch Channels */}
      <div className="heal-card p-8 bg-white border border-[#E8E1D5] rounded-3xl shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#2B2521] flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#C85A3B]" />
          Emergency Alert Dispatch Channels
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E1D5]">
            <div>
              <span className="font-bold text-[#2B2521] block text-sm">Instant SMS Dispatch</span>
              <span className="text-[#82786D] text-xs">
                Sends high-priority SMS alert to {patient.phone} and primary emergency contacts upon any emergency access.
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={() => setSmsEnabled(!smsEnabled)}
              className="w-4 h-4 text-[#C85A3B] rounded focus:ring-[#C85A3B]"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E1D5]">
            <div>
              <span className="font-bold text-[#2B2521] block text-sm">Push Notifications (In-App & Mobile)</span>
              <span className="text-[#82786D] text-xs">
                Real-time alerts for consent requests and e-prescription dispensations.
              </span>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={() => setPushEnabled(!pushEnabled)}
              className="w-4 h-4 text-[#C85A3B] rounded focus:ring-[#C85A3B]"
            />
          </div>
        </div>
      </div>

      {/* Biometric Interactive Modal */}
      {biometricModalMode && (
        <BiometricModal
          isOpen={Boolean(biometricModalMode)}
          onClose={() => setBiometricModalMode(null)}
          patient={patient}
          mode={biometricModalMode}
          onBiometricsUpdated={handleBiometricsUpdated}
        />
      )}

      {/* Emergency QR Modal */}
      <EmergencyQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        patient={patient}
      />
    </div>
  );
};
