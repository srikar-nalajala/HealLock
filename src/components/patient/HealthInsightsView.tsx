import React, { useState } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Pill,
  Clock,
  Check,
  CheckSquare,
  Square,
  Plus,
  Bell,
  HeartPulse,
  Droplets,
  Apple,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  ChevronRight,
  X,
  FileText,
  Smartphone
} from 'lucide-react';
import { HealthTrendSnapshot, Patient } from '../../types';
import confetti from 'canvas-confetti';

interface HealthInsightsViewProps {
  patient: Patient;
  trends: HealthTrendSnapshot[];
}

interface MedicationScheduleItem {
  id: string;
  name: string;
  dosage: string;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening' | 'As Needed (PRN)';
  time: string;
  instructions: string;
  taken: boolean;
  prescribedBy: string;
}

interface GeneralReminderItem {
  id: string;
  category: 'Appointment' | 'Medication' | 'Lab Test' | 'Lifestyle' | 'Preventive';
  title: string;
  dueDate: string;
  time?: string;
  notes: string;
  priority: 'high' | 'medium' | 'routine';
  completed: boolean;
  facility?: string;
}

export const HealthInsightsView: React.FC<HealthInsightsViewProps> = ({
  patient,
  trends: initialTrends,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'schedule' | 'reminders' | 'trends'>('all');
  const [trends, setTrends] = useState<HealthTrendSnapshot[]>(initialTrends);

  // Daily Medication Tracker State
  const [medications, setMedications] = useState<MedicationScheduleItem[]>([
    {
      id: 'med-1',
      name: 'Lisinopril',
      dosage: '10 mg · Oral Tablet',
      timeSlot: 'Morning',
      time: '08:00 AM',
      instructions: 'Take 1 tablet with a full glass of water after breakfast',
      taken: true,
      prescribedBy: 'Dr. Rajesh Sharma (Cardiology)',
    },
    {
      id: 'med-2',
      name: 'Vitamin D3 & Omega-3',
      dosage: '2000 IU / 1000 mg',
      timeSlot: 'Morning',
      time: '08:30 AM',
      instructions: 'Cardiovascular maintenance & bone mineral density support',
      taken: true,
      prescribedBy: 'City Care Hospital Wellness',
    },
    {
      id: 'med-3',
      name: 'Albuterol Sulfate Inhaler',
      dosage: '90 mcg · 2 Inhalations',
      timeSlot: 'As Needed (PRN)',
      time: '15 min before exercise',
      instructions: 'Inhale 1-2 puffs for acute wheezing or prior to vigorous exercise',
      taken: false,
      prescribedBy: 'Dr. Rajesh Sharma',
    },
  ]);

  // General & Preventive Reminders State
  const [reminders, setReminders] = useState<GeneralReminderItem[]>([
    {
      id: 'rem-1',
      category: 'Appointment',
      title: 'Cardiology 6-Month EHR Follow-Up',
      dueDate: 'Nov 15, 2026',
      time: '10:30 AM',
      notes: 'Evaluate Lisinopril BP response and review 12-lead ECG trace.',
      priority: 'high',
      completed: false,
      facility: 'City Care Hospital (Dr. Rajesh Sharma)',
    },
    {
      id: 'rem-2',
      category: 'Lab Test',
      title: 'Fasting Lipid & Comprehensive Metabolic Panel',
      dueDate: 'Dec 05, 2026',
      time: '08:00 AM',
      notes: '12-hour fasting required (water only). Check Total Cholesterol, LDL, HDL, Triglycerides, and eGFR.',
      priority: 'medium',
      completed: false,
      facility: 'Apex Diagnostics & Imaging',
    },
    {
      id: 'rem-3',
      category: 'Medication',
      title: 'Lisinopril 90-Day Prescription Refill',
      dueDate: 'Dec 12, 2026',
      notes: 'Pharmacy automated refill authorized under active on-chain consent.',
      priority: 'medium',
      completed: false,
      facility: 'City Care Outpatient Pharmacy',
    },
    {
      id: 'rem-4',
      category: 'Lifestyle',
      title: 'Home Blood Pressure Logging (Monday & Thursday)',
      dueDate: 'Every Mon & Thu',
      time: '07:30 AM',
      notes: 'Record morning seated systolic/diastolic in HealLock vitals log.',
      priority: 'routine',
      completed: true,
    },
    {
      id: 'rem-5',
      category: 'Preventive',
      title: 'Annual Comprehensive Eye & Retinal Screening',
      dueDate: 'Jan 20, 2027',
      notes: 'Routine microvascular baseline assessment for hypertension.',
      priority: 'routine',
      completed: false,
      facility: 'Metro Vision Center',
    },
  ]);

  // Add Custom Reminder Modal State
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GeneralReminderItem['category']>('Medication');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'routine'>('medium');
  const [newFacility, setNewFacility] = useState('');

  // Log Vital Modal State
  const [isLogVitalOpen, setIsLogVitalOpen] = useState(false);
  const [vitalMetric, setVitalMetric] = useState('Blood Pressure (Systolic)');
  const [vitalValue, setVitalValue] = useState('118');

  // Toggle Medication Taken
  const handleToggleMedication = (medId: string) => {
    setMedications(prev =>
      prev.map(m => {
        if (m.id === medId) {
          const next = !m.taken;
          if (next) {
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
          }
          return { ...m, taken: next };
        }
        return m;
      })
    );
  };

  // Toggle Reminder Completed
  const handleToggleReminder = (remId: string) => {
    setReminders(prev =>
      prev.map(r => {
        if (r.id === remId) {
          const next = !r.completed;
          if (next) {
            confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
          }
          return { ...r, completed: next };
        }
        return r;
      })
    );
  };

  // Delete Reminder
  const handleDeleteReminder = (remId: string) => {
    setReminders(prev => prev.filter(r => r.id !== remId));
  };

  // Create Custom Reminder
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate.trim()) return;

    const newItem: GeneralReminderItem = {
      id: 'rem-' + Math.random().toString(36).substring(2, 8),
      title: newTitle.trim(),
      category: newCategory,
      dueDate: newDueDate,
      notes: newNotes.trim() || 'Custom care reminder added by patient.',
      priority: newPriority,
      completed: false,
      facility: newFacility.trim() || undefined,
    };

    setReminders([newItem, ...reminders]);
    setIsAddReminderOpen(false);
    setNewTitle('');
    setNewDueDate('');
    setNewNotes('');
    setNewFacility('');
    confetti({ particleCount: 35, spread: 55 });
  };

  // Log New Vital Reading
  const handleLogVital = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(vitalValue);
    if (isNaN(numVal)) return;

    const todayStr = new Date().toISOString().split('T')[0];
    setTrends(prev =>
      prev.map(t => {
        if (t.metricName.toLowerCase().includes(vitalMetric.toLowerCase()) || vitalMetric.toLowerCase().includes(t.metricName.toLowerCase())) {
          return {
            ...t,
            currentValue: `${numVal}${t.unit === 'mmHg' ? '/76' : ''}`,
            values: [...t.values, { date: todayStr, value: numVal }].slice(-5),
          };
        }
        return t;
      })
    );

    setIsLogVitalOpen(false);
    confetti({ particleCount: 30, spread: 50 });
  };

  const takenMedsCount = medications.filter(m => m.taken).length;
  const adherencePercent = Math.round((takenMedsCount / (medications.length || 1)) * 100);
  const pendingRemindersCount = reminders.filter(r => !r.completed).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#241F1C] via-[#332A24] to-[#201B18] text-[#FAF7F2] shadow-xl border border-[#3E352F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15 shrink-0">
            <HeartPulse className="w-7 h-7 text-[#F5C7B8]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Health Intelligence & Care Reminders
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#C85A3B]/40 text-[#F5C7B8] font-bold border border-[#C85A3B]/50">
                AI Active
              </span>
            </div>
            <p className="text-xs text-[#D8CEBE] mt-0.5">
              Decentralized EHR health intelligence, daily adherence schedules, and smart doctor instructions.
            </p>
          </div>
        </div>

        {/* Quick Vitals & Reminder Stats */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/15 text-center flex-1 sm:flex-initial">
            <div className="text-[10px] uppercase font-bold text-[#D8CEBE]">Daily Meds</div>
            <div className="text-sm font-black text-emerald-300 font-mono">{adherencePercent}% Taken</div>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/15 text-center flex-1 sm:flex-initial">
            <div className="text-[10px] uppercase font-bold text-[#D8CEBE]">Pending Reminders</div>
            <div className="text-sm font-black text-[#F5C7B8] font-mono">{pendingRemindersCount} Active</div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1D5] pb-2">
        <div className="flex flex-wrap gap-1.5 bg-white p-1 rounded-2xl border border-[#E8E1D5] text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#2B2521] text-white shadow-xs font-black'
                : 'text-[#63594F] hover:bg-[#FAF7F2]'
            }`}
          >
            Overview & All Insights
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-[#2B2521] text-white shadow-xs font-black'
                : 'text-[#63594F] hover:bg-[#FAF7F2]'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Daily Medication Tracker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reminders'
                ? 'bg-[#2B2521] text-white shadow-xs font-black'
                : 'text-[#63594F] hover:bg-[#FAF7F2]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Smart Care Reminders</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trends'
                ? 'bg-[#2B2521] text-white shadow-xs font-black'
                : 'text-[#63594F] hover:bg-[#FAF7F2]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Biomarker Trends</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLogVitalOpen(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-[#FAF7F2] text-[#2B2521] border border-[#E8DEC8] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-[#C85A3B]" />
            <span>Log Vital Reading</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddReminderOpen(true)}
            className="px-3.5 py-1.5 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#F5C7B8]" />
            <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Synthesized Clinical Summary */}
      {(activeTab === 'all' || activeTab === 'trends') && (
        <div className="p-7 rounded-3xl bg-[#FAF7F2] border border-[#E8DEC8] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#2B2521] font-bold text-base">
              <div className="p-2.5 bg-[#2B2521] text-white rounded-2xl">
                <Lightbulb className="w-5 h-5 text-[#F5C7B8]" />
              </div>
              <div>
                <h3 className="font-bold text-base">Synthesized Clinical Summary</h3>
                <p className="text-xs text-[#82786D] font-normal">Cross-referenced from authorized diagnostic records & lab panels</p>
              </div>
            </div>
            <span className="text-xs text-[#2D6346] font-bold px-3 py-1 bg-[#EDF5F0] rounded-full border border-[#C4DFC5]">
              Zero Adverse Interaction Flag ✓
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4F4740]">
            <div className="p-5 bg-white rounded-2xl border border-[#E8E1D5] space-y-2 shadow-2xs">
              <span className="font-bold text-[#2D6346] flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#2D6346]" />
                Cardiovascular & Blood Pressure Stability
              </span>
              <p className="leading-relaxed text-[#63594F]">
                Systolic BP has stabilized consistently in the 116–118 mmHg range across 3 consecutive clinical visits, confirming therapeutic efficacy of Lisinopril 10mg maintenance.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E8E1D5] space-y-2 shadow-2xs">
              <span className="font-bold text-[#2B2521] flex items-center gap-1.5 text-xs">
                <Activity className="w-4 h-4 text-[#C85A3B]" />
                Metabolic & Glycemic Baseline
              </span>
              <p className="leading-relaxed text-[#63594F]">
                Fasting blood glucose averaged 91 mg/dL, with HbA1c at 5.3%, maintaining optimal non-diabetic glycemic regulation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Daily Medication Regimen Tracker */}
      {(activeTab === 'all' || activeTab === 'schedule') && (
        <div className="heal-card p-6 sm:p-7 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#FAF7F2] text-[#2D6346] rounded-2xl border border-[#E8DEC8]">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#2B2521] text-base">
                  Daily Medication Adherence Schedule
                </h3>
                <p className="text-xs text-[#82786D]">
                  Tap pills to mark as taken today · Track clinical adherence streak
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#2D6346] bg-[#EDF5F0] px-3 py-1 rounded-full border border-[#C4DFC5]">
                {takenMedsCount} of {medications.length} Doses Taken
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {medications.map(med => (
              <div
                key={med.id}
                onClick={() => handleToggleMedication(med.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  med.taken
                    ? 'bg-[#EDF5F0]/60 border-[#C4DFC5] shadow-2xs'
                    : 'bg-[#FAF7F2] border-[#E8E1D5] hover:border-[#C85A3B] shadow-2xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-[#63594F] border border-[#E8DEC8]">
                      {med.timeSlot} · {med.time}
                    </span>
                    <button
                      type="button"
                      className={`p-1 rounded-lg transition-colors ${
                        med.taken ? 'text-[#2D6346]' : 'text-[#82786D]'
                      }`}
                    >
                      {med.taken ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </div>

                  <div>
                    <h4 className={`font-black text-sm ${med.taken ? 'text-[#2D6346] line-through' : 'text-[#2B2521]'}`}>
                      {med.name}
                    </h4>
                    <p className="text-xs text-[#63594F] font-mono mt-0.5">{med.dosage}</p>
                  </div>

                  <p className="text-[11px] text-[#82786D] leading-relaxed italic">
                    "{med.instructions}"
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8E1D5]/60 flex items-center justify-between text-[10px] text-[#82786D]">
                  <span>{med.prescribedBy}</span>
                  <span className={`font-bold ${med.taken ? 'text-[#2D6346]' : 'text-[#C85A3B]'}`}>
                    {med.taken ? 'Taken Today ✓' : 'Tap to Mark Taken'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Smart Care Reminders & Preventative Instructions */}
      {(activeTab === 'all' || activeTab === 'reminders') && (
        <div className="heal-card p-6 sm:p-7 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#FAF7F2] text-[#C85A3B] rounded-2xl border border-[#E8DEC8]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#2B2521] text-base">
                  Smart Care Reminders & Clinical Action Items
                </h3>
                <p className="text-xs text-[#82786D]">
                  Doctor consultation dates, lab follow-up windows, and lifestyle recommendations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddReminderOpen(true)}
              className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#2B2521] border border-[#E8DEC8] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-[#C85A3B]" />
              <span>Create New Reminder</span>
            </button>
          </div>

          <div className="space-y-3">
            {reminders.map(rem => (
              <div
                key={rem.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  rem.completed
                    ? 'bg-[#FAF7F2] border-[#E8E1D5] opacity-70'
                    : rem.priority === 'high'
                    ? 'bg-[#FFF9F2] border-[#E8DEC8] shadow-2xs'
                    : 'bg-white border-[#E8E1D5] shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleReminder(rem.id)}
                    className="mt-0.5 text-[#C85A3B] hover:scale-110 transition-transform cursor-pointer"
                  >
                    {rem.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2D6346]" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#C85A3B] hover:bg-[#C85A3B]/10" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-black text-sm ${rem.completed ? 'line-through text-[#82786D]' : 'text-[#2B2521]'}`}>
                        {rem.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rem.category === 'Appointment'
                            ? 'bg-[#FAF7F2] text-[#C85A3B] border border-[#E8DEC8]'
                            : rem.category === 'Lab Test'
                            ? 'bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5]'
                            : rem.category === 'Medication'
                            ? 'bg-[#FFF9F2] text-[#7A402A] border border-[#E8DEC8]'
                            : 'bg-[#FAF7F2] text-[#63594F] border border-[#E8E1D5]'
                        }`}
                      >
                        {rem.category}
                      </span>
                      {rem.priority === 'high' && !rem.completed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1]">
                          High Priority
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#63594F] leading-relaxed">{rem.notes}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#82786D] pt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-[#C85A3B]" />
                        Due: {rem.dueDate} {rem.time && `· ${rem.time}`}
                      </span>
                      {rem.facility && (
                        <>
                          <span>•</span>
                          <span>{rem.facility}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-1.5 text-[#82786D] hover:text-[#BA3B3B] hover:bg-[#FDF2F0] rounded-xl transition-colors cursor-pointer"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Time-Series Biomarker Trends */}
      {(activeTab === 'all' || activeTab === 'trends') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#2B2521] text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C85A3B]" />
              Time-Series Biomarker Trends
            </h2>
            <span className="text-xs text-[#82786D]">Decentralized Longitudinal EHR Measurements</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {trends.map(trend => (
              <div
                key={trend.id}
                className="heal-card p-6 bg-white border border-[#E8E1D5] rounded-3xl shadow-sm space-y-4 flex flex-col justify-between hover:border-[#C85A3B] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2B2521] text-xs">{trend.metricName}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        trend.trendDirection === 'improving' || trend.trendDirection === 'stable'
                          ? 'bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5]'
                          : 'bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1]'
                      }`}
                    >
                      {trend.trendDirection.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#2B2521]">{trend.currentValue}</span>
                    <span className="text-xs text-[#82786D]">{trend.unit}</span>
                  </div>

                  {/* Simulated Chart Bars */}
                  <div className="pt-2">
                    <div className="flex items-end gap-2 h-16 pt-2 border-b border-[#E8E1D5]">
                      {trend.values.map((v, idx) => {
                        const heightPercent = Math.min(Math.max((v.value / 140) * 100, 20), 100);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full bg-[#C85A3B] rounded-t-md group-hover:bg-[#B84E30] transition-colors"
                            />
                            <span className="text-[9px] text-[#82786D] font-mono truncate w-full text-center">
                              {v.date.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-[#63594F] bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8DEC8]">
                  <p className="leading-snug">{trend.aiInsight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Add Custom Reminder Modal */}
      {isAddReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E1D5] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-[#E8E1D5] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#2B2521] text-white rounded-xl">
                  <Plus className="w-5 h-5 text-[#F5C7B8]" />
                </div>
                <h3 className="font-bold text-[#2B2521] text-base">Add Personalized Health Reminder</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddReminderOpen(false)}
                className="p-1.5 text-[#82786D] hover:text-[#2B2521] hover:bg-[#EAE2D5] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#2B2521]">Reminder Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Check fasting blood sugar, refill allergy nasal spray..."
                  className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] font-semibold text-[#2B2521] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B2521]">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] font-semibold text-[#2B2521] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                  >
                    <option value="Medication">Medication</option>
                    <option value="Appointment">Appointment</option>
                    <option value="Lab Test">Lab Test</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Preventive">Preventive Care</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B2521]">Priority Tier</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] font-semibold text-[#2B2521] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                  >
                    <option value="routine">Routine</option>
                    <option value="medium">Medium</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B2521]">Target Due Date *</label>
                  <input
                    type="text"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    placeholder="e.g. Every Mon & Thu, Nov 25, 2026..."
                    className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] font-semibold text-[#2B2521] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B2521]">Doctor / Clinic (Optional)</label>
                  <input
                    type="text"
                    value={newFacility}
                    onChange={e => setNewFacility(e.target.value)}
                    placeholder="e.g. City Care Clinic"
                    className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] font-semibold text-[#2B2521] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#2B2521]">Clinical Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Special instructions or context for this reminder..."
                  className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] text-[#2B2521] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E1D5]">
                <button
                  type="button"
                  onClick={() => setIsAddReminderOpen(false)}
                  className="px-4 py-2 text-[#82786D] hover:text-[#2B2521] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-2xl font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log New Vital Reading Modal */}
      {isLogVitalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E1D5] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-[#E8E1D5] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#2B2521] text-white rounded-xl">
                  <Activity className="w-5 h-5 text-[#F5C7B8]" />
                </div>
                <h3 className="font-bold text-[#2B2521] text-base">Log Home Vital Measurement</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogVitalOpen(false)}
                className="p-1.5 text-[#82786D] hover:text-[#2B2521] hover:bg-[#EAE2D5] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogVital} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#2B2521]">Select Vital Metric</label>
                <select
                  value={vitalMetric}
                  onChange={e => setVitalMetric(e.target.value)}
                  className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] font-semibold text-[#2B2521] focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                >
                  <option value="Blood Pressure (Systolic)">Blood Pressure (Systolic mmHg)</option>
                  <option value="Fasting Blood Glucose">Fasting Blood Glucose (mg/dL)</option>
                  <option value="Resting Heart Rate">Resting Heart Rate (bpm)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#2B2521]">Measured Value</label>
                <input
                  type="number"
                  required
                  value={vitalValue}
                  onChange={e => setVitalValue(e.target.value)}
                  placeholder="e.g. 118"
                  className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] font-semibold text-[#2B2521] text-base focus:outline-none focus:ring-2 focus:ring-[#C85A3B]"
                />
              </div>

              <p className="text-[11px] text-[#82786D]">
                Measurements are encrypted and added to your longitudinal EHR trend graph.
              </p>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E1D5]">
                <button
                  type="button"
                  onClick={() => setIsLogVitalOpen(false)}
                  className="px-4 py-2 text-[#82786D] hover:text-[#2B2521] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-2xl font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Save Vital Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
