import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Lock, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  BellRing,
  Stethoscope,
  Trash2
} from 'lucide-react';
import { ConsentGrant, ConsentScope, Hospital, AccessRequest } from '../../types';

interface ConsentSettingsViewProps {
  consents: ConsentGrant[];
  hospitals: Hospital[];
  accessRequests?: AccessRequest[];
  onToggleConsent: (consentId: string) => void;
  onUpdateScope: (consentId: string, newScope: ConsentScope[]) => void;
  onRevokeConsent: (consentId: string) => void;
  onGrantNewConsent: (hospitalId: string, scope: ConsentScope[], expiryMonths: number) => void;
  onRespondAccessRequest?: (request: AccessRequest, action: 'approved' | 'rejected', scope?: ConsentScope[], expiryMonths?: number) => void;
}

export const ConsentSettingsView: React.FC<ConsentSettingsViewProps> = ({
  consents,
  hospitals,
  accessRequests = [],
  onToggleConsent,
  onUpdateScope,
  onRevokeConsent,
  onGrantNewConsent,
  onRespondAccessRequest,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[0]?.id || '');
  const [selectedScopes, setSelectedScopes] = useState<ConsentScope[]>(['Lab Reports', 'Rx History']);
  const [expiryMonths, setExpiryMonths] = useState(6);

  // Approval Modal for pending hospital requests
  const [approvingRequest, setApprovingRequest] = useState<AccessRequest | null>(null);
  const [approvedScope, setApprovedScope] = useState<ConsentScope[]>([]);
  const [approvedMonths, setApprovedMonths] = useState(12);

  const availableScopes: ConsentScope[] = [
    'Lab Reports',
    'Rx History',
    'Diagnostic Scans',
    'Surgical Notes',
  ];

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');

  const handleToggleScopeCheckbox = (scope: ConsentScope) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleCreateGrant = () => {
    if (!selectedHospitalId || selectedScopes.length === 0) return;
    onGrantNewConsent(selectedHospitalId, selectedScopes, expiryMonths);
    setShowAddModal(false);
  };

  const handleOpenApproveModal = (req: AccessRequest) => {
    setApprovingRequest(req);
    setApprovedScope(req.requestedScope || ['Lab Reports', 'Rx History']);
    setApprovedMonths(12);
  };

  const handleConfirmApprove = () => {
    if (!approvingRequest || !onRespondAccessRequest) return;
    onRespondAccessRequest(approvingRequest, 'approved', approvedScope, approvedMonths);
    setApprovingRequest(null);
  };

  const handleRejectRequest = (req: AccessRequest) => {
    if (!onRespondAccessRequest) return;
    if (confirm(`Decline access request from ${req.hospitalName}?`)) {
      onRespondAccessRequest(req, 'rejected');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2B2521] tracking-tight">Consent & Access Control</h1>
          <p className="text-xs text-[#82786D] mt-0.5">
            Zero hospital access without your explicit cryptographic authorization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#F5C7B8]" />
          <span>Grant New Hospital Consent</span>
        </button>
      </div>

      {/* Principle Banner */}
      <div className="p-4 rounded-2xl bg-[#EDF5F0] border border-[#C4DFC5] text-xs text-[#2D6346] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#2D6346] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Cryptographic Consent Minting</span>
          <p className="text-[#2D6346]/90 leading-relaxed">
            Every time you toggle, scope, or revoke consent, an event hash is signed with your sovereign identity and broadcasted to the ledger. Hospitals are bound to these exact access boundaries.
          </p>
        </div>
      </div>

      {/* INCOMING HOSPITAL ACCESS REQUESTS (Real-Time Queue) */}
      {pendingRequests.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#FFF9F2] border-2 border-[#E8DEC8] shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#C85A3B] text-white rounded-2xl">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-[#2B2521] text-base">Incoming Hospital Access Requests</h3>
                <p className="text-xs text-[#82786D]">
                  {pendingRequests.length} hospital(s) are requesting permission to review your health records
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-[#FAF7F2] text-[#C85A3B] border border-[#E8DEC8] text-xs font-bold rounded-full">
              Action Required
            </span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div
                key={req.id}
                className="p-5 bg-white rounded-2xl border border-[#E8E1D5] shadow-xs flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#C85A3B]" />
                    <span className="font-bold text-[#2B2521] text-sm">{req.hospitalName}</span>
                    <span className="text-xs text-[#82786D]">·</span>
                    <span className="text-xs text-[#4F4740] font-semibold flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-[#C85A3B]" />
                      {req.doctorName}
                    </span>
                  </div>

                  <p className="text-xs text-[#63594F]">
                    <strong>Reason for Request:</strong> "{req.reason}"
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-[#82786D]">Requested Scope:</span>
                    {req.requestedScope.map(s => (
                      <span key={s} className="px-2.5 py-0.5 bg-[#FAF7F2] text-[#2B2521] rounded-lg text-[10px] font-bold border border-[#E8DEC8]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(req)}
                    className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#63594F] font-bold rounded-xl text-xs border border-[#E8E1D5] transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenApproveModal(req)}
                    className="px-4 py-2 bg-[#2D6346] hover:bg-[#234F38] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Grant</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital Consents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#2B2521] text-base">Configured Hospital Consents</h2>
          <span className="text-xs text-[#82786D]">{consents.length} Total Facilities</span>
        </div>

        {consents.map(consent => {
          const isActive = consent.status === 'active';

          return (
            <div
              key={consent.id}
              className={`heal-card p-6 border transition-all rounded-3xl ${
                isActive
                  ? 'bg-white border-[#E8E1D5] shadow-sm'
                  : 'bg-[#FAF7F2]/60 border-[#E8E1D5] opacity-75'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8E1D5]">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      isActive ? 'bg-[#FAF7F2] text-[#C85A3B] border border-[#E8DEC8]' : 'bg-[#FAF7F2] text-[#82786D]'
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2B2521] text-base">{consent.hospitalName}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#82786D] mt-0.5 font-mono">
                      <span>Granted: {new Date(consent.grantedAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>Expires: {new Date(consent.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5]'
                        : 'bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1]'
                    }`}
                  >
                    {consent.status.toUpperCase()}
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleConsent(consent.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2B2521] text-white shadow-xs'
                        : 'bg-[#FAF7F2] text-[#63594F] border border-[#E8E1D5] hover:bg-[#EAE2D5]'
                    }`}
                  >
                    {isActive ? 'Active (Toggle OFF)' : 'Inactive (Toggle ON)'}
                  </button>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => onRevokeConsent(consent.id)}
                      className="px-3.5 py-1.5 bg-[#FDF2F0] hover:bg-[#FBEAE8] text-[#BA3B3B] border border-[#F5C7C1] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Revoke All
                    </button>
                  )}
                </div>
              </div>

              {/* Scopes Toggles */}
              <div className="pt-4 space-y-3">
                <div className="text-xs font-bold text-[#63594F] uppercase tracking-wider flex items-center justify-between">
                  <span>Authorized Category Scope</span>
                  <span className="text-[11px] text-[#82786D] font-normal">Click tags to customize permissions</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableScopes.map(scope => {
                    const isScoped = consent.scope.includes(scope);
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => {
                          const nextScope = isScoped
                            ? consent.scope.filter(s => s !== scope)
                            : [...consent.scope, scope];
                          onUpdateScope(consent.id, nextScope);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isScoped
                            ? 'bg-[#FAF7F2] text-[#2B2521] border-2 border-[#C85A3B] shadow-2xs'
                            : 'bg-[#FAF7F2]/50 text-[#82786D] border border-[#E8E1D5] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        {isScoped ? <Check className="w-3.5 h-3.5 text-[#C85A3B]" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{scope}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grant New Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E1D5] w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8E1D5] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#C85A3B]" />
                <h3 className="font-bold text-[#2B2521] text-base">Grant Hospital Access Permission</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#82786D] hover:text-[#2B2521] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Hospital Facility</label>
                <select
                  value={selectedHospitalId}
                  onChange={e => setSelectedHospitalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Permission Validity Duration</label>
                <select
                  value={expiryMonths}
                  onChange={e => setExpiryMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={24}>24 Months (2 Years)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700">Select Permitted Categories (Scope)</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableScopes.map(scope => {
                    const isChecked = selectedScopes.includes(scope);
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => handleToggleScopeCheckbox(scope)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${isChecked ? 'bg-blue-600 text-white' : 'border border-slate-400'}`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{scope}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGrant}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                Mint On-Chain Grant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Access Request Customizer Modal */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Approve Hospital Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{approvingRequest.hospitalName}</div>
                <div className="text-slate-500">Requested by {approvingRequest.doctorName}</div>
                <div className="text-slate-600 italic">"{approvingRequest.reason}"</div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700">Customize Permitted Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableScopes.map(scope => {
                    const isChecked = approvedScope.includes(scope);
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => {
                          setApprovedScope(isChecked ? approvedScope.filter(s => s !== scope) : [...approvedScope, scope]);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-400'}`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{scope}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Grant Duration</label>
                <select
                  value={approvedMonths}
                  onChange={e => setApprovedMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approvedScope.length === 0}
                onClick={handleConfirmApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                Confirm & Mint Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
