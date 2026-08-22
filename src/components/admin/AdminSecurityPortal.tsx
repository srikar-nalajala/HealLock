import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Activity, 
  Lock, 
  Eye, 
  Check, 
  Radio,
  FileCheck
} from 'lucide-react';
import { Hospital, Staff, AccessAnomalyAlert, AccessEvent } from '../../types';
import { mlAnomalyDetector } from '../../services/mlAnomalyDetector';
import { blockchainService } from '../../services/blockchainService';

interface AdminSecurityPortalProps {
  staff: Staff;
  hospitals: Hospital[];
  onOpenExplorer: () => void;
}

export const AdminSecurityPortal: React.FC<AdminSecurityPortalProps> = ({
  staff,
  hospitals: initialHospitals,
  onOpenExplorer,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>(initialHospitals);
  const [alerts, setAlerts] = useState<AccessAnomalyAlert[]>(mlAnomalyDetector.getAlerts());

  const handleToggleVerification = (hospId: string) => {
    setHospitals(prev =>
      prev.map(h => {
        if (h.id === hospId) {
          const nextStatus = h.verificationStatus === 'verified' ? 'suspended' : 'verified';
          return { ...h, verificationStatus: nextStatus };
        }
        return h;
      })
    );
  };

  const handleReviewAlert = (alertId: string) => {
    mlAnomalyDetector.markReviewed(alertId);
    setAlerts([...mlAnomalyDetector.getAlerts()]);
  };

  const simulateAnomalySpike = () => {
    const newAlert: AccessAnomalyAlert = {
      id: 'alert-' + Math.random().toString(36).substring(2, 7),
      hospitalId: 'hosp-004',
      hospitalName: 'St. Jude Community Clinic',
      date: new Date().toISOString().split('T')[0],
      accessCount: 14,
      rollingAverage: 1.2,
      severity: 'critical',
      abusePattern: 'Repeated Emergency Access Trigger Spike (14x over 1-hr window)',
      reason: 'High frequency emergency factor triggers detected without trauma case filing.',
      adminReviewed: false,
      timestamp: new Date().toISOString(),
    };
    setAlerts([newAlert, ...alerts]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Admin Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#241F1C] via-[#332A24] to-[#201B18] text-[#FAF7F2] shadow-xl border border-[#3E352F] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
            <ShieldAlert className="w-7 h-7 text-[#F5C7B8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{staff.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#C85A3B]/40 text-[#F5C7B8] font-semibold border border-[#C85A3B]/50">
                Hospital Compliance & ML Radar
              </span>
            </div>
            <p className="text-xs text-[#D8CEBE]">
              HealLock Trust Layer · Machine Learning Behavioral Anomaly Detection & Sovereign Nodes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={simulateAnomalySpike}
            className="px-3.5 py-2 bg-[#BA3B3B] hover:bg-[#962828] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Simulate Abuse Anomaly
          </button>
          <button
            onClick={onOpenExplorer}
            className="px-3.5 py-2 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#F5C7B8]" />
            Audit Ledger
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="heal-card p-5 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-1">
          <div className="text-xs font-bold text-[#82786D] uppercase">Registered Hospitals</div>
          <div className="text-2xl font-black text-[#2B2521]">{hospitals.length} Facilities</div>
          <div className="text-[11px] text-[#2D6346] font-semibold">3 Active EVM Nodes</div>
        </div>

        <div className="heal-card p-5 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-1">
          <div className="text-xs font-bold text-[#82786D] uppercase">ML Anomaly Engine</div>
          <div className="text-2xl font-black text-[#2B2521]">Active (v2.4)</div>
          <div className="text-[11px] text-[#C85A3B] font-semibold">Rolling Window: 7-Day</div>
        </div>

        <div className="heal-card p-5 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-1">
          <div className="text-xs font-bold text-[#82786D] uppercase">Security Alerts</div>
          <div className="text-2xl font-black text-[#BA3B3B]">{alerts.filter(a => !a.adminReviewed).length} Pending</div>
          <div className="text-[11px] text-[#BA3B3B] font-semibold">Requires Admin Clearance</div>
        </div>

        <div className="heal-card p-5 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-1">
          <div className="text-xs font-bold text-[#82786D] uppercase">Ledger State Root</div>
          <div className="text-2xl font-black text-[#2B2521] font-mono">#48,913</div>
          <div className="text-[11px] text-[#2D6346] font-semibold">100% Consensus</div>
        </div>
      </div>

      {/* ML Access Anomaly Radar */}
      <div className="heal-card p-8 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FAF7F2] text-[#BA3B3B] rounded-2xl border border-[#E8DEC8]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2B2521] text-base">
                ML Access Anomaly Detection Radar
              </h3>
              <p className="text-xs text-[#82786D]">
                Flags statistical deviations, access surges, and repeated emergency bypass patterns
              </p>
            </div>
          </div>

          <span className="px-3 py-1 text-xs font-bold bg-[#FAF7F2] text-[#63594F] border border-[#E8E1D5] rounded-full">
            Real-time Telemetry
          </span>
        </div>

        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all ${
                alert.adminReviewed
                  ? 'bg-[#FAF7F2] border-[#E8E1D5] opacity-75'
                  : alert.severity === 'critical'
                  ? 'bg-[#FDF2F0] border-[#F5C7C1] shadow-2xs'
                  : 'bg-[#FFF9F2] border-[#E8DEC8]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {alert.severity === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-[#BA3B3B] shrink-0 mt-0.5" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-[#C85A3B] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#2B2521] text-sm">{alert.abusePattern}</span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                          alert.severity === 'critical'
                            ? 'bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1]'
                            : 'bg-[#FFF9F2] text-[#C85A3B] border border-[#E8DEC8]'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-xs text-[#63594F] font-medium">{alert.reason}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#82786D] pt-1">
                      <span>Hospital: <strong>{alert.hospitalName}</strong></span>
                      <span>·</span>
                      <span>Spike Count: <strong className="text-[#BA3B3B]">{alert.accessCount} accesses</strong></span>
                      <span>·</span>
                      <span>Expected Baseline: {alert.rollingAverage} / day</span>
                    </div>
                  </div>
                </div>

                <div>
                  {alert.adminReviewed ? (
                    <span className="px-3 py-1 bg-[#FAF7F2] text-[#63594F] text-xs font-semibold rounded-xl border border-[#E8E1D5] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6346]" /> Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleReviewAlert(alert.id)}
                      className="px-3.5 py-1.5 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Acknowledge & Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital Verification & Permissioning Table */}
      <div className="heal-card p-8 bg-white rounded-3xl border border-[#E8E1D5] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FAF7F2] text-[#C85A3B] rounded-2xl border border-[#E8DEC8]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2B2521] text-base">Hospital Identity & Public Key Registry</h3>
              <p className="text-xs text-[#82786D]">
                Governs valid cryptographic signers for prescription issue and record uploads
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8E1D5] text-[#82786D] font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Hospital Name</th>
                <th className="pb-3 font-semibold">Facility Code</th>
                <th className="pb-3 font-semibold">City</th>
                <th className="pb-3 font-semibold">Verification</th>
                <th className="pb-3 font-semibold">Public Key</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D5]">
              {hospitals.map(hosp => (
                <tr key={hosp.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                  <td className="py-3.5 font-bold text-[#2B2521]">{hosp.name}</td>
                  <td className="py-3.5 font-mono text-[#63594F]">{hosp.code}</td>
                  <td className="py-3.5 text-[#63594F]">{hosp.city}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                        hosp.verificationStatus === 'verified'
                          ? 'bg-[#EDF5F0] text-[#2D6346] border-[#C4DFC5]'
                          : hosp.verificationStatus === 'pending'
                          ? 'bg-[#FFF9F2] text-[#C85A3B] border-[#E8DEC8]'
                          : 'bg-[#FDF2F0] text-[#BA3B3B] border-[#F5C7C1]'
                      }`}
                    >
                      {hosp.verificationStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-[#82786D] truncate max-w-[140px]">
                    {hosp.publicKey}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleToggleVerification(hosp.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hosp.verificationStatus === 'verified'
                          ? 'bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1] hover:bg-[#FBEAE8]'
                          : 'bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5] hover:bg-[#DCEDE1]'
                      }`}
                    >
                      {hosp.verificationStatus === 'verified' ? 'Suspend Node' : 'Authorize Node'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
