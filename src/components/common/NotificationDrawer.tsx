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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Notifications & Dispatch Center</h3>
              <p className="text-[11px] text-slate-500">Real-time in-app, SMS, and Push feeds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-600 font-semibold">{notifications.length} Total Alerts</span>
          <button
            onClick={onMarkAllAsRead}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                  notif.type === 'emergency'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : notif.type === 'access_request'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    {notif.type === 'emergency' && <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
                    {notif.type === 'access_request' && <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />}
                    {notif.type === 'prescription' && <Pill className="w-4 h-4 text-teal-600 shrink-0" />}
                    {notif.type === 'consent' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    {notif.type === 'system' && <Info className="w-4 h-4 text-slate-500 shrink-0" />}
                    <span>{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {notif.timestamp.includes('T') ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : notif.timestamp}
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">{notif.message}</p>

                {notif.type === 'access_request' && onNavigateToRequests && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToRequests();
                      onClose();
                    }}
                    className="text-xs font-bold text-amber-800 hover:underline pt-1 block cursor-pointer"
                  >
                    Review & Manage Access Request →
                  </button>
                )}

                {notif.smsDispatched && (
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 pt-1">
                    <Smartphone className="w-3 h-3 text-emerald-600" />
                    <span>SMS alert dispatched to registered emergency contacts</span>
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
