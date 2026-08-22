import React from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
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
          <h1 className="text-2xl font-black text-[#2B2521] tracking-tight">
            AI Health Intelligence & Biomarker Trends
          </h1>
          <p className="text-xs text-[#82786D] mt-0.5">
            Statistical trend monitoring & clinical decision support signals.
          </p>
        </div>

        <span className="px-3.5 py-1.5 bg-[#FAF7F2] text-[#B25838] border border-[#E8DEC8] rounded-full text-xs font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Clinical AI Intelligence
        </span>
      </div>

      {/* Primary Highlights Card */}
      <div className="p-7 rounded-3xl bg-[#FAF7F2] border border-[#E8DEC8] space-y-4">
        <div className="flex items-center gap-3 text-[#2B2521] font-bold text-base">
          <div className="p-2.5 bg-[#2B2521] text-white rounded-2xl">
            <Lightbulb className="w-5 h-5 text-[#F5C7B8]" />
          </div>
          <div>
            <h3 className="font-bold text-base">Synthesized Health Summary</h3>
            <p className="text-xs text-[#82786D] font-normal">Cross-referenced across all authorized diagnostic records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4F4740]">
          <div className="p-5 bg-white rounded-2xl border border-[#E8E1D5] space-y-2 shadow-2xs">
            <span className="font-bold text-[#2D6346] flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#2D6346]" />
              Cardiovascular & Blood Pressure Stability
            </span>
            <p className="leading-relaxed text-[#63594F]">
              Systolic BP has stabilized consistently in the 116–118 mmHg range across 3 consecutive clinical visits, confirming efficacy of Lisinopril 10mg maintenance.
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

      {/* ML Trend Snapshots */}
      <div className="space-y-4">
        <h2 className="font-bold text-[#2B2521] text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#C85A3B]" />
          Time-Series Biomarker Trends
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {trends.map(trend => (
            <div
              key={trend.id}
              className="heal-card p-6 bg-white border border-[#E8E1D5] rounded-3xl shadow-sm space-y-4 flex flex-col justify-between"
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

              <div className="pt-2 text-xs text-[#63594F] bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8DEC8]">
                <p className="leading-snug">{trend.aiInsight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Care Reminders Card */}
      <div className="heal-card p-6 bg-white border border-[#E8E1D5] rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#2B2521] text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C85A3B]" />
            AI Smart Reminders & Care Plan
          </h2>
          <span className="text-xs text-[#82786D]">Validated EHR clinical guidelines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[#C85A3B] mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-[#2B2521] block">Upcoming Doctor Consultation</span>
              <p className="text-[#63594F]">Nov 15th, 2026 · Dr. Rajesh Sharma (Cardiology Follow-Up)</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] flex items-start gap-3">
            <Pill className="w-4 h-4 text-[#2D6346] mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-[#2B2521] block">Prescription Refill Window</span>
              <p className="text-[#63594F]">Lisinopril 10mg (90-day supply active until Dec 2026)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
