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
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30">
            <ShieldAlert className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{staff.name}</h2>
              <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/30 text-indigo-200 font-semibold border border-indigo-400/30">
                Hospital Compliance & ML Anomaly Radar
              </span>
            </div>
            <p className="text-xs text-slate-400">
              HealLock Trust Layer · Machine Learning Behavioral Anomaly Detection & Permissioned Nodes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={simulateAnomalySpike}
            className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Simulate Abuse Anomaly Spike
          </button>
          <button
            onClick={onOpenExplorer}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            Audit Ledger
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="heal-card p-4 space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Registered Hospitals</div>
          <div className="text-2xl font-black text-slate-900">{hospitals.length} Facilities</div>
          <div className="text-[11px] text-emerald-600 font-semibold">3 Active EVM Nodes</div>
        </div>

        <div className="heal-card p-4 space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase">ML Anomaly Engine</div>
          <div className="text-2xl font-black text-slate-900">Active (v2.4)</div>
          <div className="text-[11px] text-blue-600 font-semibold">Rolling-Average Window: 7-Day</div>
        </div>

        <div className="heal-card p-4 space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Active Security Alerts</div>
          <div className="text-2xl font-black text-rose-600">{alerts.filter(a => !a.adminReviewed).length} Pending</div>
          <div className="text-[11px] text-rose-600 font-semibold">Requires Admin Clearance</div>
        </div>

        <div className="heal-card p-4 space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Ledger State Root</div>
          <div className="text-2xl font-black text-slate-900 font-mono">#48,913</div>
          <div className="text-[11px] text-emerald-600 font-semibold">100% Merkle Consensus</div>
        </div>
      </div>

      {/* ML Access Anomaly Radar */}
      <div className="heal-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                ML Access Anomaly Detection Radar
              </h3>
              <p className="text-xs text-slate-500">
                Flags statistical deviations, access surges, and repeated emergency bypass patterns
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg">
            Real-time Telemetry
          </span>
        </div>

        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all ${
                alert.adminReviewed
                  ? 'bg-slate-50 border-slate-200 opacity-70'
                  : alert.severity === 'critical'
                  ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                  : 'bg-amber-50/70 border-amber-300'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {alert.severity === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{alert.abusePattern}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                          alert.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">{alert.reason}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span>Hospital: <strong>{alert.hospitalName}</strong></span>
                      <span>·</span>
                      <span>Spike Count: <strong className="text-rose-600">{alert.accessCount} accesses</strong></span>
                      <span>·</span>
                      <span>Expected Baseline: {alert.rollingAverage} / day</span>
                    </div>
                  </div>
                </div>

                <div>
                  {alert.adminReviewed ? (
                    <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleReviewAlert(alert.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
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
      <div className="heal-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hospital Identity & Public Key Registry</h3>
              <p className="text-xs text-slate-500">
                Governs valid cryptographic signers for prescription issue and record uploads
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-2.5 font-semibold">Hospital Name</th>
                <th className="pb-2.5 font-semibold">Facility Code</th>
                <th className="pb-2.5 font-semibold">City</th>
                <th className="pb-2.5 font-semibold">Verification</th>
                <th className="pb-2.5 font-semibold">Public Key</th>
                <th className="pb-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map(hosp => (
                <tr key={hosp.id} className="hover:bg-slate-50/80">
                  <td className="py-3 font-bold text-slate-800">{hosp.name}</td>
                  <td className="py-3 font-mono text-slate-600">{hosp.code}</td>
                  <td className="py-3 text-slate-600">{hosp.city}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                        hosp.verificationStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : hosp.verificationStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {hosp.verificationStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-400 truncate max-w-[140px]">
                    {hosp.publicKey}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleToggleVerification(hosp.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        hosp.verificationStatus === 'verified'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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
