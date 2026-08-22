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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Security & Biometric Key Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage hardware credentials, emergency factors, cryptographic key pairs, and notification dispatches.
        </p>
      </div>

      {/* Hardware & Biometric Factor Registry */}
      <div className="heal-card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Hardware & Biometric Factor Registry
          </h2>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>FIPS-140 Sovereign Cryptography</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Emergency QR Code Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>Emergency QR Code</span>
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Active</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Printed on physical health card & emergency watch band.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>View & Print QR Badge</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-1.5 bg-white text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Inspect QR Payload</span>
              </button>
            </div>
          </div>

          {/* 2. Face Liveness & 3D Mesh Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <ScanFace className="w-4 h-4 text-purple-600" />
                  <span>Face Liveness Hash</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hasFace ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {hasFace ? 'Registered' : 'Pending'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                3D facial mesh template stored locally with zero cloud photo upload.
              </p>

              {patient.registeredBiometrics.facePhotoUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <img
                    src={patient.registeredBiometrics.facePhotoUrl}
                    alt="Enrolled Face"
                    className="w-8 h-8 rounded-full object-cover border border-purple-300"
                  />
                  <div className="text-[10px] text-purple-700 font-mono">
                    Liveness: {patient.registeredBiometrics.faceLivenessScore || 98.4}% ✓
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setBiometricModalMode('enroll_face')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{hasFace ? 'Re-scan / Update Face' : 'Enroll Face with Camera'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBiometricModalMode('verify_face')}
                  className="flex-1 py-1.5 bg-white text-purple-700 font-bold text-xs rounded-lg border border-purple-200 hover:bg-purple-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Verify Face</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyKey}
                  title="Copy Face Template Hash"
                  className="p-1.5 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Fingerprint FIDO2 Hardware Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-amber-600" />
                  <span>Fingerprint FIDO2</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hasFingerprint ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {hasFingerprint ? 'Enrolled' : 'Not Enrolled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                WebAuthn hardware biometric token linked to patient public key.
              </p>
              <div className="text-[10px] font-mono text-slate-500 block truncate pt-1">
                Credential: {patient.registeredBiometrics.fingerprintTemplateRef}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setBiometricModalMode('enroll_fingerprint')}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>{hasFingerprint ? 'Re-enroll Touch ID / Key' : 'Enroll Fingerprint'}</span>
              </button>

              <button
                type="button"
                onClick={() => setBiometricModalMode('verify_fingerprint')}
                className="w-full py-1.5 bg-white text-slate-700 font-bold text-xs rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test Fingerprint Scan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alerts & Dispatch Channels */}
      <div className="heal-card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          Emergency Alert Dispatch Channels
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block">Instant SMS Dispatch</span>
              <span className="text-slate-500">
                Sends high-priority SMS alert to {patient.phone} and primary emergency contacts upon any emergency access.
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={() => setSmsEnabled(!smsEnabled)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block">Push Notifications (In-App & Mobile)</span>
              <span className="text-slate-500">
                Real-time WebSocket alerts for consent requests and e-prescription dispensations.
              </span>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={() => setPushEnabled(!pushEnabled)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
