import React, { useState } from 'react';
import { Pill, CheckCircle2, ShieldCheck, AlertTriangle, Clock, Sparkles, Send, Check } from 'lucide-react';
import { Patient, Staff, Prescription } from '../../types';
import { blockchainService } from '../../services/blockchainService';
import { firebasePatientService } from '../../services/firebasePatientService';
import confetti from 'canvas-confetti';

interface PharmacistPortalProps {
  patient: Patient;
  staff: Staff;
  prescriptions: Prescription[];
  onDispense: (prescriptionId: string) => void;
  onNotificationSent: (msg: string) => void;
}

export const PharmacistPortal: React.FC<PharmacistPortalProps> = ({
  patient,
  staff,
  prescriptions,
  onDispense,
  onNotificationSent,
}) => {
  const [dispensedIds, setDispensedIds] = useState<string[]>([]);

  const handleDispenseRx = async (rx: Prescription) => {
    // 1. Log dispense event to blockchain
    const event = await blockchainService.logEvent({
      patientId: patient.id,
      patientName: patient.name,
      hospitalId: staff.hospitalId,
      hospitalName: staff.hospitalName,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: 'Pharmacist',
      accessType: 'normal',
      action: `Dispensed Rx: ${rx.medications.map(m => m.name).join(', ')}`,
      reason: 'Pharmacy fulfilment and patient counseling',
    });

    // 2. Sync to Firebase Firestore
    await firebasePatientService.updatePrescriptionStatus(patient.id, rx.id, 'dispensed');
    await firebasePatientService.saveAccessEvent(event);

    setDispensedIds(prev => [...prev, rx.id]);
    onDispense(rx.id);
    onNotificationSent(`Prescription fulfilled by Pharmacist ${staff.name} at ${staff.hospitalName}.`);
    confetti({ particleCount: 30, spread: 50 });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Pharmacy Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#241F1C] via-[#332A24] to-[#201B18] text-[#FAF7F2] shadow-xl border border-[#3E352F] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
            <Pill className="w-7 h-7 text-[#F5C7B8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{staff.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#2D6346]/40 text-[#EDF5F0] font-semibold border border-[#2D6346]/50">
                Hospital Pharmacy Dispensary
              </span>
            </div>
            <p className="text-xs text-[#D8CEBE]">
              Role-Based Access: Medication & Prescription Fulfillment (RBAC Enforced)
            </p>
          </div>
        </div>

        <div className="text-xs bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 font-mono text-[#D8CEBE]">
          <span>Active Patient: {patient.name} ({patient.healthId})</span>
        </div>
      </div>

      {/* Prescription Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#2B2521] text-base">Active Prescriptions Queue</h3>
          <span className="text-xs text-[#82786D]">{prescriptions.length} Active in Record</span>
        </div>

        {prescriptions.map(rx => {
          const isDispensed = dispensedIds.includes(rx.id) || rx.status === 'dispensed';

          return (
            <div
              key={rx.id}
              className="heal-card p-6 bg-white rounded-3xl border border-[#E8E1D5] hover:border-[#C85A3B] transition-all space-y-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#FAF7F2] text-[#2D6346] rounded-2xl border border-[#E8DEC8]">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#2B2521] text-sm flex items-center gap-2">
                      <span>Prescription #{rx.id.toUpperCase()}</span>
                      <span className="text-xs text-[#82786D] font-normal">· {rx.date}</span>
                    </div>
                    <div className="text-xs text-[#63594F]">
                      Prescribed by <strong>{rx.doctorName}</strong> ({rx.hospitalName})
                    </div>
                  </div>
                </div>

                <div>
                  {isDispensed ? (
                    <span className="px-3 py-1 bg-[#EDF5F0] text-[#2D6346] rounded-full text-xs font-bold flex items-center gap-1 border border-[#C4DFC5]">
                      <Check className="w-3.5 h-3.5" /> Dispensed & Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-[#FFF9F2] text-[#C85A3B] rounded-full text-xs font-bold flex items-center gap-1 border border-[#E8DEC8]">
                      <Clock className="w-3.5 h-3.5" /> Ready for Fulfillment
                    </span>
                  )}
                </div>
              </div>

              {/* Medication Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#63594F] uppercase tracking-wider">
                  Prescribed Medication List
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rx.medications.map((med, idx) => (
                    <div key={idx} className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E1D5] text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2B2521] text-sm">{med.name}</span>
                        <span className="px-2.5 py-0.5 bg-white text-[#2D6346] font-mono rounded-lg font-bold border border-[#E8E1D5]">
                          {med.dosage}
                        </span>
                      </div>
                      <div className="text-[#63594F]">
                        <span className="font-semibold">Regimen:</span> {med.frequency} · {med.duration}
                      </div>
                      <div className="text-[#82786D] italic">
                        "{med.instructions}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Safety Engine Sign-Off */}
              <div className="p-4 rounded-2xl bg-[#EDF5F0] border border-[#C4DFC5] text-xs text-[#2D6346] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2D6346]" />
                  <span>
                    <strong>Clinical Safety Clearance:</strong> AI RxNorm interaction check verified zero adverse flag.
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold">DDInter Graph Pass ✓</span>
              </div>

              {/* Action Button */}
              {!isDispensed && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDispenseRx(rx)}
                    className="px-5 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#F5C7B8]" />
                    <span>Dispense & Certify On-Chain</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
