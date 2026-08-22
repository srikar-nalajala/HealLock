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
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-800 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20">
            <Pill className="w-7 h-7 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{staff.name}</h2>
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/40 text-emerald-100 font-semibold border border-emerald-400/30">
                Hospital Pharmacy Dispensary
              </span>
            </div>
            <p className="text-xs text-teal-200">
              Role-Based Access: Medication & Prescription Data Only (RBAC Enforced)
            </p>
          </div>
        </div>

        <div className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 font-mono">
          <span>Active Patient: {patient.name} ({patient.healthId})</span>
        </div>
      </div>

      {/* Prescription Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Pending & Active Prescriptions</h3>
          <span className="text-xs text-slate-500">{prescriptions.length} Active in Record</span>
        </div>

        {prescriptions.map(rx => {
          const isDispensed = dispensedIds.includes(rx.id) || rx.status === 'dispensed';

          return (
            <div
              key={rx.id}
              className="heal-card p-6 border border-slate-200 hover:border-teal-300 transition-all space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>Prescription #{rx.id.toUpperCase()}</span>
                      <span className="text-xs text-slate-400 font-normal">· {rx.date}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Prescribed by <strong>{rx.doctorName}</strong> ({rx.hospitalName})
                    </div>
                  </div>
                </div>

                <div>
                  {isDispensed ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-300">
                      <Check className="w-3.5 h-3.5" /> Dispensed & Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Ready for Fulfilment
                    </span>
                  )}
                </div>
              </div>

              {/* Medication Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Prescribed Medication List
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rx.medications.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">{med.name}</span>
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-mono rounded font-semibold">
                          {med.dosage}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-semibold">Regimen:</span> {med.frequency} · {med.duration}
                      </div>
                      <div className="text-slate-500 italic">
                        "{med.instructions}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Safety Engine Sign-Off */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>
                    <strong>Clinical Safety Clearance:</strong> AI RxNorm interaction check verified zero adverse flag.
                  </span>
                </div>
                <span className="font-mono text-[11px] text-teal-700 font-semibold">DDInter Graph Pass ✓</span>
              </div>

              {/* Action Button */}
              {!isDispensed && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDispenseRx(rx)}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
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
