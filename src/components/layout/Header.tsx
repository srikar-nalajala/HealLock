import React from 'react';
import { Shield, Bell, LogOut, User, ShieldAlert, Stethoscope, Pill, ShieldCheck } from 'lucide-react';
import { Patient, Staff, UserRole } from '../../types';

interface HeaderProps {
  currentRole: UserRole;
  patient: Patient;
  staff: Staff;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  patient,
  staff,
  unreadNotifsCount,
  onOpenNotifications,
  onLogout,
}) => {
  const roleTitles: Record<UserRole, string> = {
    patient: 'PATIENT PORTAL',
    doctor: 'DOCTOR & CLINICAL EHR',
    emergency: 'EMERGENCY ACCESS TERMINAL',
    pharmacist: 'PHARMACY DISPENSARY',
    admin: 'SECURITY & ML RADAR',
    receptionist: 'PATIENT ADMISSIONS',
  };

  const roleBadges: Record<UserRole, { label: string; color: string }> = {
    patient: { label: 'Patient Verified', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    doctor: { label: 'Physician MD', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    emergency: { label: 'Level-1 Emergency Staff', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    pharmacist: { label: 'Licensed Pharmacist', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    admin: { label: 'Hospital Admin', color: 'bg-slate-100 text-slate-800 border-slate-300' },
    receptionist: { label: 'Admissions Staff', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Portal Tag (Matches reference screenshot) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5 fill-white text-blue-600" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              HealLock
            </span>
          </div>

          <span className="hidden sm:inline-block pl-3 border-l border-slate-200 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
            {roleTitles[currentRole]}
          </span>
        </div>

        {/* Center: Clean Role Status Pill */}
        <div className="hidden md:flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${roleBadges[currentRole].color}`}>
            {currentRole === 'patient' && <User className="w-3.5 h-3.5" />}
            {currentRole === 'doctor' && <Stethoscope className="w-3.5 h-3.5" />}
            {currentRole === 'emergency' && <ShieldAlert className="w-3.5 h-3.5" />}
            {currentRole === 'pharmacist' && <Pill className="w-3.5 h-3.5" />}
            {currentRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{roleBadges[currentRole].label}</span>
          </span>
        </div>

        {/* Right: Notifications, Profile Pill, and Sign Out Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative transition-colors cursor-pointer"
            title="Open Notifications & SMS Dispatch Center"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* User Profile Pill matching reference UI */}
          <div className="flex items-center gap-2.5 pl-2">
            <img
              src={currentRole === 'patient' ? patient.avatarUrl : staff.avatarUrl}
              alt={currentRole === 'patient' ? patient.name : staff.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200/90 shadow-2xs"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentRole === 'patient' ? patient.name : staff.name}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {currentRole === 'patient' ? `Health ID: ${patient.healthId}` : `${staff.role.toUpperCase()}: ${staff.badgeNumber}`}
              </div>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Log out and return to Home/Login page"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
