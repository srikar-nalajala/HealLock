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
    patient: { label: 'Patient Sovereign ID', color: 'bg-[#F4EFE6] text-[#B25838] border-[#E8DEC8]' },
    doctor: { label: 'Physician MD', color: 'bg-[#ECE8F4] text-[#5B4886] border-[#DCD3EB]' },
    emergency: { label: 'Level-1 Emergency Staff', color: 'bg-[#FBEAE8] text-[#BA3B3B] border-[#F2C5C1]' },
    pharmacist: { label: 'Licensed Pharmacist', color: 'bg-[#EBF5F0] text-[#2D6346] border-[#C5DFCE]' },
    admin: { label: 'Hospital Admin', color: 'bg-[#EFEAE2] text-[#3D352E] border-[#DED4C7]' },
    receptionist: { label: 'Admissions Staff', color: 'bg-[#FBF1E2] text-[#B87B28] border-[#F2DEBF]' },
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E8E1D5] shadow-xs">
      <div className="px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Portal Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2A2420] flex items-center justify-center text-[#FAF7F2] shadow-xs border border-[#3E352F]">
              <Shield className="w-4.5 h-4.5 fill-[#C85A3B] text-[#C85A3B]" />
            </div>
            <span className="text-xl font-extrabold text-[#2B2521] tracking-tight">
              HealLock
            </span>
          </div>

          <span className="hidden sm:inline-block pl-3 border-l border-[#E8E1D5] text-[11px] font-extrabold tracking-wider text-[#82786D] uppercase">
            {roleTitles[currentRole]}
          </span>
        </div>

        {/* Center: Clean Role Status Pill */}
        <div className="hidden md:flex items-center gap-2">
          <span className={`px-3.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${roleBadges[currentRole].color}`}>
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
            className="p-2 text-[#63594F] hover:text-[#2B2521] hover:bg-[#F3EFE6] rounded-xl relative transition-colors cursor-pointer border border-transparent hover:border-[#E8E1D5]"
            title="Open Notifications & SMS Dispatch Center"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="w-2.5 h-2.5 bg-[#BA3B3B] rounded-full absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* User Profile Pill matching reference UI */}
          <div className="flex items-center gap-2.5 pl-2">
            <img
              src={currentRole === 'patient' ? patient.avatarUrl : staff.avatarUrl}
              alt={currentRole === 'patient' ? patient.name : staff.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#E8E1D5] shadow-xs"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#2B2521] leading-tight">
                {currentRole === 'patient' ? patient.name : staff.name}
              </div>
              <div className="text-[11px] text-[#82786D] font-mono">
                {currentRole === 'patient' ? `Health ID: ${patient.healthId}` : `${staff.role.toUpperCase()}: ${staff.badgeNumber}`}
              </div>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl border border-[#E8E1D5] bg-[#F7F4EE] hover:bg-[#FBEAE8] hover:text-[#BA3B3B] hover:border-[#F2C5C1] text-[#4F4740] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Log out and return to Home/Login page"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
