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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#241F1C] via-[#332A24] to-[#201B18] text-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/15">
              <QrCode className="w-6 h-6 text-[#F5C7B8]" />
            </div>
            <div>
              <h3 className="font-bold text-base">Emergency Health QR & ID Badge</h3>
              <p className="text-xs text-[#D8CEBE]">
                Single-Factor Emergency Access Token · FIPS-140 Sovereign
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Printable Physical ID Card Layout */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#241F1C] via-[#332A24] to-[#201B18] text-white border-2 border-[#3E352F] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BA3B3B] animate-ping" />
                <span className="font-black text-[11px] sm:text-xs tracking-wider text-[#F5C7B8] uppercase">HEALLOCK EMERGENCY ID CARD</span>
              </div>
              <span className="text-[10px] font-mono text-[#D8CEBE]">HL-VERIFIED</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
              <div className="space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="text-lg font-black text-white">{patient.name}</h4>
                  <p className="text-xs text-[#D8CEBE] font-mono">ID: {patient.healthId}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <div className="px-2.5 py-0.5 rounded-full bg-[#BA3B3B]/30 text-[#F5C7B8] border border-[#BA3B3B]/40 font-bold">
                    Blood: {patient.emergencyProfile.bloodGroup}
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-[#C85A3B]/30 text-[#F5C7B8] border border-[#C85A3B]/40 font-bold">
                    Allergies: {patient.emergencyProfile.allergies.length}
                  </div>
                </div>

                <div className="text-[10px] text-[#82786D] font-mono pt-1">
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
                <span className="text-[9px] font-mono text-[#2B2521] font-bold mt-1">SCAN FOR ER</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#2B2521] rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#E8E1D5] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#C85A3B]" />
              <span>Print Badge Card</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
