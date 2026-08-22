import React, { useState } from 'react';
import { 
  QrCode, 
  X, 
  Copy, 
  Check, 
  Download, 
  Heart, 
  AlertTriangle, 
  ShieldCheck, 
  Printer,
  Sparkles
} from 'lucide-react';
import { Patient } from '../../types';
import { biometricService } from '../../services/biometricService';

interface EmergencyQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export const EmergencyQrModal: React.FC<EmergencyQrModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const payloadString = biometricService.generateEmergencyQrPayload(patient);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <QrCode className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Emergency Health QR & ID Badge</h3>
              <p className="text-xs text-blue-200">
                Single-Factor Emergency Access Token · FIPS-140 Zero Knowledge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Printable Physical ID Card Card Layout */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-2 border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="font-black text-xs tracking-wider text-rose-300 uppercase">HEALLOCK EMERGENCY ID CARD</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">HL-VERIFIED</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div>
                  <h4 className="text-lg font-black text-white">{patient.name}</h4>
                  <p className="text-xs text-slate-300 font-mono">ID: {patient.healthId}</p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    Blood: {patient.emergencyProfile.bloodGroup}
                  </div>
                  <div className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Allergies: {patient.emergencyProfile.allergies.length}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  Face Ref: {patient.registeredBiometrics.faceTemplateRef.substring(0, 14)}...
                </div>
              </div>

              {/* QR Code graphic representation */}
              <div className="p-2 bg-white rounded-xl shadow-lg shrink-0 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(patient.registeredBiometrics.qrCodeString || patient.healthId)}`}
                  alt="Emergency QR Code"
                  className="w-24 h-24 rounded-lg object-contain"
                />
                <span className="text-[9px] font-mono text-slate-800 font-bold mt-1">SCAN FOR ER</span>
              </div>
            </div>
          </div>

          {/* Cryptographic JSON Payload Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Cryptographic QR Payload String:</span>
              <button
                type="button"
                onClick={handleCopyPayload}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36 border border-slate-800">
              {JSON.stringify(JSON.parse(payloadString), null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Badge Card</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
