import React from 'react';
import { X, Bell, ShieldAlert, CheckCircle2, Pill, Clock, Smartphone, KeyRound, Info } from 'lucide-react';
import { RealtimeNotification } from '../../types';

export interface NotificationItem {
  id: string;
  type: 'emergency' | 'consent' | 'prescription' | 'access_request' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  smsDispatched?: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: (NotificationItem | RealtimeNotification)[];
  onMarkAllAsRead: () => void;
  onNavigateToRequests?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onNavigateToRequests,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-[#E8E1D5]">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E1D5] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white text-[#C85A3B] rounded-xl border border-[#E8DEC8]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2B2521] text-sm">Notifications & Alerts</h3>
              <p className="text-[11px] text-[#82786D]">Real-time in-app, SMS, and Push dispatch feeds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#82786D] hover:text-[#2B2521] hover:bg-[#EAE2D5] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="px-4 py-2.5 bg-[#FAF7F2]/80 border-b border-[#E8E1D5] flex justify-between items-center text-xs">
          <span className="text-[#63594F] font-semibold">{notifications.length} Total Alerts</span>
          <button
            onClick={onMarkAllAsRead}
            className="text-[#C85A3B] font-bold hover:underline cursor-pointer"
          >
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-[#82786D] text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
                  notif.type === 'emergency'
                    ? 'bg-[#FDF2F0] border-[#F5C7C1] text-[#BA3B3B]'
                    : notif.type === 'access_request'
                    ? 'bg-[#FFF9F2] border-[#E8DEC8] text-[#7A402A]'
                    : 'bg-[#FAF7F2] border-[#E8E1D5] text-[#2B2521]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    {notif.type === 'emergency' && <ShieldAlert className="w-4 h-4 text-[#BA3B3B] shrink-0" />}
                    {notif.type === 'access_request' && <KeyRound className="w-4 h-4 text-[#C85A3B] shrink-0" />}
                    {notif.type === 'prescription' && <Pill className="w-4 h-4 text-[#2D6346] shrink-0" />}
                    {notif.type === 'consent' && <CheckCircle2 className="w-4 h-4 text-[#2D6346] shrink-0" />}
                    {notif.type === 'system' && <Info className="w-4 h-4 text-[#82786D] shrink-0" />}
                    <span className="text-[#2B2521] font-bold">{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-[#82786D] font-mono">
                    {notif.timestamp.includes('T') ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : notif.timestamp}
                  </span>
                </div>

                <p className="text-[#63594F] leading-relaxed">{notif.message}</p>

                {notif.type === 'access_request' && onNavigateToRequests && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToRequests();
                      onClose();
                    }}
                    className="text-xs font-bold text-[#C85A3B] hover:underline pt-1 block cursor-pointer"
                  >
                    Review & Manage Access Request →
                  </button>
                )}

                {notif.smsDispatched && (
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-[#2D6346] pt-1">
                    <Smartphone className="w-3 h-3 text-[#2D6346]" />
                    <span>SMS alert dispatched to emergency contacts</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
