import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  Heart, 
  Phone, 
  ShieldAlert, 
  QrCode, 
  UserCheck, 
  Activity, 
  Copy, 
  Check, 
  Lock,
  Edit2,
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { Patient, EmergencyProfile } from '../../types';

interface EmergencyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onUpdateProfile?: (updatedProfile: EmergencyProfile) => void;
}

export const EmergencyProfileModal: React.FC<EmergencyProfileModalProps> = ({
  isOpen,
  onClose,
  patient,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit states
  const [bloodGroup, setBloodGroup] = useState(patient.emergencyProfile.bloodGroup);
  const [allergies, setAllergies] = useState<string[]>(patient.emergencyProfile.allergies);
  const [criticalMeds, setCriticalMeds] = useState<string[]>(patient.emergencyProfile.criticalMeds);
  const [allergyInput, setAllergyInput] = useState('');
  const [medInput, setMedInput] = useState('');

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(patient.healthId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (name: string) => {
    setAllergies(allergies.filter(a => a !== name));
  };

  const handleAddMed = () => {
    if (medInput.trim() && !criticalMeds.includes(medInput.trim())) {
      setCriticalMeds([...criticalMeds, medInput.trim()]);
      setMedInput('');
    }
  };

  const handleRemoveMed = (name: string) => {
    setCriticalMeds(criticalMeds.filter(m => m !== name));
  };

  const handleSaveProfile = () => {
    const updated: EmergencyProfile = {
      ...patient.emergencyProfile,
      bloodGroup,
      allergies,
      criticalMeds,
    };
    onUpdateProfile?.(updated);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Urgent Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Emergency Medical Profile Card
              </h3>
              <p className="text-xs text-rose-100">
                Minimum Necessary Access · Realtime Editable & Unlocked via QR, Face, Fingerprint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-rose-100 hover:text-white hover:bg-rose-700/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/60 text-xs">
          {/* Patient Overview Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={patient.avatarUrl}
                alt={patient.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-rose-500/30"
              />
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{patient.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono">DOB: {patient.dob} ({patient.gender})</span>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-xs font-mono text-blue-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>ID: {patient.healthId}</span>
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Blood Group Badge / Edit */}
            {isEditing ? (
              <div className="space-y-1">
                <label className="font-bold text-rose-700">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border-2 border-rose-300 font-black text-rose-700 bg-rose-50 text-base"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-700">
                <Heart className="w-6 h-6 fill-rose-600 text-rose-600" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Blood Group</div>
                  <div className="text-2xl font-black text-rose-700 leading-none">{bloodGroup}</div>
                </div>
              </div>
            )}
          </div>

          {/* Critical Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Allergies */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
              <div className="flex items-center justify-between text-rose-900 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Known High-Alert Allergies
                </span>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add allergy (e.g. Penicillin)"
                    value={allergyInput}
                    onChange={e => setAllergyInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white rounded-lg border border-rose-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAllergy}
                    className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {allergies.map(allergy => (
                  <span
                    key={allergy}
                    className="px-2.5 py-1 bg-white text-rose-700 font-bold text-xs rounded-lg border border-rose-300 shadow-2xs flex items-center gap-1.5"
                  >
                    <span>⚠️ {allergy}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        className="text-rose-400 hover:text-rose-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Critical Medications */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" />
                  Active Critical Medications
                </span>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add medication (e.g. Lisinopril 10mg)"
                    value={medInput}
                    onChange={e => setMedInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white rounded-lg border border-amber-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddMed}
                    className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                {criticalMeds.map(med => (
                  <div
                    key={med}
                    className="px-2.5 py-1 bg-white text-amber-900 font-semibold text-xs rounded-lg border border-amber-200 flex items-center justify-between"
                  >
                    <span>• {med}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(med)}
                        className="text-amber-400 hover:text-rose-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pre-Existing Conditions */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 text-xs">Pre-Existing Conditions & Directives</div>
            <div className="flex flex-wrap gap-2">
              {patient.emergencyProfile.criticalConditions.map(cond => (
                <span key={cond} className="px-3 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg">
                  {cond}
                </span>
              ))}
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                ✓ Organ Donor
              </span>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-600" />
                Emergency Guardians / Contacts
              </span>
              <span className="text-[11px] text-slate-400">Auto-notified upon emergency access</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patient.emergencyProfile.emergencyContacts.map(contact => (
                <div
                  key={contact.phone}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      {contact.name}
                      {contact.isPrimary && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 font-semibold rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{contact.relation}</div>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-600 font-mono text-xs rounded-lg border border-slate-200 font-semibold"
                  >
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Edit & Save */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center text-xs">
          {isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Emergency Card</span>
            </button>
          )}

          {isEditing ? (
            <button
              type="button"
              onClick={handleSaveProfile}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
