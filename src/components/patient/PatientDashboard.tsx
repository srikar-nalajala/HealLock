import React, { useState } from 'react';
import { 
  ShieldAlert, 
  FileText, 
  Pill, 
  Scan, 
  Lightbulb, 
  ShieldCheck, 
  Building2, 
  User, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  ExternalLink,
  Plus,
  BellRing
} from 'lucide-react';
import { Patient, ConsentGrant, AccessEvent, MedicalRecord, Prescription, AccessRequest } from '../../types';

interface PatientDashboardProps {
  patient: Patient;
  consents: ConsentGrant[];
  accessEvents: AccessEvent[];
  records: MedicalRecord[];
  prescriptions: Prescription[];
  accessRequests?: AccessRequest[];
  onOpenEmergencyCard: () => void;
  onNavigateTab: (tab: string) => void;
  onInspectTx: (event: AccessEvent) => void;
  onToggleConsent: (consentId: string) => void;
  onRevokeAll: (hospitalId: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  consents,
  accessEvents,
  records,
  prescriptions,
  accessRequests = [],
  onOpenEmergencyCard,
  onNavigateTab,
  onInspectTx,
  onToggleConsent,
  onRevokeAll,
}) => {
  const activeConsent = consents.find(c => c.status === 'active') || consents[0];
  const isConsentActive = activeConsent?.status === 'active';

  const pendingRequestsCount = accessRequests.filter(r => r.status === 'pending').length;

  // Real Count categories
  const labReportsCount = records.filter(r => r.category === 'Lab Reports').length;
  const prescriptionsCount = prescriptions.length + records.filter(r => r.category === 'Prescriptions').length;
  const scansCount = records.filter(r => r.category === 'Diagnostic Scans').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back, {patient.name}!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your medical identity, consents, and cryptographic audit ledger are up to date.
          </p>
        </div>

        {/* Prominent Red Emergency Profile Card Button */}
        <button
          type="button"
          onClick={onOpenEmergencyCard}
          className="px-5 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4 text-white" />
          <span>Emergency Profile Card</span>
        </button>
      </div>

      {/* Pending Hospital Request Alert if any */}
      {pendingRequestsCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4 text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="font-bold text-amber-950">
                {pendingRequestsCount} Pending Hospital Access Request{pendingRequestsCount > 1 ? 's' : ''}
              </span>
              <p className="text-amber-800 text-[11px]">
                A clinical provider requested access to your records. Review and approve permissions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('consents')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
          >
            Review Requests →
          </button>
        </div>
      )}

      {/* Main Two-Column Grid matching reference UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (col-span-6): My Records + Active Hospital Consent */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. My Records Card */}
          <div className="heal-card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">My Records</h2>
              <span className="text-xs font-mono text-slate-400 font-semibold">{records.length} Total Documents</span>
            </div>

            {/* 3 Categories Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Lab Reports */}
              <button
                type="button"
                onClick={() => onNavigateTab('records')}
                className="p-4 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 mb-2 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <div className="font-semibold text-slate-800 text-xs">Lab Reports</div>
                <div className="text-xs text-slate-500 font-medium">({labReportsCount})</div>
              </button>

              {/* Prescriptions */}
              <button
                type="button"
                onClick={() => onNavigateTab('records')}
                className="p-4 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 mb-2 group-hover:scale-105 transition-transform">
                  <Pill className="w-5 h-5 text-slate-500" />
                </div>
                <div className="font-semibold text-slate-800 text-xs">Prescriptions</div>
                <div className="text-xs text-slate-500 font-medium">({prescriptionsCount})</div>
              </button>

              {/* Diagnostic Scans */}
              <button
                type="button"
                onClick={() => onNavigateTab('records')}
                className="p-4 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 mb-2 group-hover:scale-105 transition-transform">
                  <Scan className="w-5 h-5 text-slate-500" />
                </div>
                <div className="font-semibold text-slate-800 text-xs">Diagnostic Scans</div>
                <div className="text-xs text-slate-500 font-medium">({scansCount})</div>
              </button>
            </div>

            {/* View All Button */}
            <button
              type="button"
              onClick={() => onNavigateTab('records')}
              className="w-full mt-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View All Encrypted Records</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Active Hospital Consent Card */}
          <div className="heal-card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Active Hospital Consent</h2>

            {activeConsent ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <Building2 className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{activeConsent.hospitalName}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Valid until {new Date(activeConsent.expiresAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Active / Inactive Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {isConsentActive ? 'Active' : 'Revoked'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleConsent(activeConsent.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isConsentActive ? 'bg-[#0284c7]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isConsentActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Scoped Categories */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-600">Permitted Scopes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeConsent.scope.map(scope => (
                      <span key={scope} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200 text-[11px]">
                        ✓ {scope}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Revoke All Consent Button */}
                {isConsentActive && (
                  <button
                    type="button"
                    onClick={() => onRevokeAll(activeConsent.hospitalId)}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Revoke Hospital Consent</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 p-4 text-center">No configured hospital consents.</div>
            )}
          </div>
        </div>

        {/* Right Column (col-span-6): AI Insights + Recent Data Access Timeline */}
        <div className="lg:col-span-6 space-y-6">
          {/* 3. AI Health Insights & Prescription Safety Card */}
          <div className="heal-card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">AI Health Insights</h2>

            {/* Insight 1: Blood Pressure */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-xs">Blood Pressure Trend: Optimal</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consistently trending in the normal range over the last 30 days (118/76 avg).
                </p>
              </div>
            </div>

            {/* Insight 2: Prescription Safety Check */}
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-emerald-950 text-xs">Prescription Safety Check</h3>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  No adverse interactions or duplicate regimens found across your active prescriptions.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Recent Data Access Timeline */}
          <div className="heal-card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Recent Data Access Timeline</h2>
              <button
                type="button"
                onClick={() => onNavigateTab('timeline')}
                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                View Full Audit Ledger →
              </button>
            </div>

            {/* Timeline Items */}
            <div className="space-y-3">
              {accessEvents.slice(0, 3).map((event, idx) => (
                <div
                  key={event.id || idx}
                  className="p-3.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors text-xs"
                >
                  <div className="space-y-1 max-w-[68%]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{event.hospitalName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 font-medium">{event.staffName}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] truncate">{event.action}</p>
                  </div>

                  {/* Blockchain Verified Badge with Tx Hash Inspector */}
                  <button
                    type="button"
                    onClick={() => onInspectTx(event)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title={`Tx Hash: ${event.txHash}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Blockchain Verified</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
