import React from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Heart,
  Pill,
  Clock
} from 'lucide-react';
import { HealthTrendSnapshot, Patient } from '../../types';

interface HealthInsightsViewProps {
  patient: Patient;
  trends: HealthTrendSnapshot[];
}

export const HealthInsightsView: React.FC<HealthInsightsViewProps> = ({
  patient,
  trends,
}) => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AI Health Intelligence & ML Trend Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Principle 4 (AI-Assisted Healthcare): Statistical trend monitoring & clinical decision support signals.
          </p>
        </div>

        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Claude AI Health Engine
        </span>
      </div>

      {/* Primary Highlights Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3>Synthesized Patient Health Summary</h3>
            <p className="text-xs text-slate-500 font-normal">Cross-referenced across all authorized diagnostic records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-4 bg-white/90 rounded-xl border border-blue-200/60 space-y-1.5">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Cardiovascular & Blood Pressure Stability
            </span>
            <p className="leading-relaxed">
              Systolic BP has stabilized consistently in the 116–118 mmHg range across 3 consecutive clinical visits, confirming efficacy of Lisinopril 10mg maintenance.
            </p>
          </div>

          <div className="p-4 bg-white/90 rounded-xl border border-blue-200/60 space-y-1.5">
            <span className="font-bold text-indigo-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              Metabolic & Glycemic Baseline
            </span>
            <p className="leading-relaxed">
              Fasting blood glucose averaged 91 mg/dL, with HbA1c at 5.3%, maintaining optimal non-diabetic glycemic regulation.
            </p>
          </div>
        </div>
      </div>

      {/* ML Trend Snapshots */}
      <div className="space-y-4">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Machine Learning Time-Series Biomarker Trends
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {trends.map(trend => (
            <div
              key={trend.id}
              className="heal-card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">{trend.metricName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      trend.trendDirection === 'improving' || trend.trendDirection === 'stable'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {trend.trendDirection.toUpperCase()}
                  </span>
                </div>

                <div className="text-2xl font-black text-slate-900">
                  {trend.currentValue}
                </div>

                {/* Simulated Chart Bars */}
                <div className="pt-2">
                  <div className="flex items-end gap-2 h-20 pt-2 border-b border-slate-100">
                    {trend.values.map((v, idx) => {
                      const heightPercent = Math.min(Math.max((v.value / 140) * 100, 20), 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-blue-500 rounded-t-md group-hover:bg-blue-600 transition-colors"
                          />
                          <span className="text-[9px] text-slate-400 font-mono truncate w-full text-center">
                            {v.date.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="leading-snug">{trend.aiInsight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Care Reminders Card */}
      <div className="heal-card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            AI Smart Reminders & Doctor Instructions
          </h2>
          <span className="text-xs text-slate-400">Generated from validated EHR care plans</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Upcoming Doctor Consultation</span>
              <p className="text-slate-600">Nov 15th, 2026 · Dr. Rajesh Sharma (Cardiology Follow-Up)</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Pill className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Prescription Refill Window</span>
              <p className="text-slate-600">Lisinopril 10mg (90-day supply active until Dec 2026)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
