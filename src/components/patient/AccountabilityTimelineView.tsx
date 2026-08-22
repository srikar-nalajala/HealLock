import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  User, 
  Clock, 
  CheckCircle2, 
  Filter, 
  ExternalLink, 
  Hash, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { AccessEvent } from '../../types';

interface AccountabilityTimelineViewProps {
  events: AccessEvent[];
  onInspectTx: (event: AccessEvent) => void;
  onOpenExplorer: () => void;
}

export const AccountabilityTimelineView: React.FC<AccountabilityTimelineViewProps> = ({
  events,
  onInspectTx,
  onOpenExplorer,
}) => {
  const [filter, setFilter] = useState<'all' | 'normal' | 'emergency'>('all');

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    return e.accessType === filter;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Cryptographic Accountability Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Principle 5 (Accountability): Every record read, update, or emergency unseal is immutably logged on-chain.
          </p>
        </div>

        <button
          onClick={onOpenExplorer}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-98"
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Launch Ledger Block Explorer</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-slate-200 w-fit text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Access Logs ({events.length})
        </button>
        <button
          onClick={() => setFilter('normal')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Routine Authorized ({events.filter(e => e.accessType === 'normal').length})
        </button>
        <button
          onClick={() => setFilter('emergency')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'emergency' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Emergency Unlocks ({events.filter(e => e.accessType === 'emergency').length})
        </button>
      </div>

      {/* Events Timeline Container */}
      <div className="heal-card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6">
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8">
          {filteredEvents.map(event => (
            <div key={event.id} className="relative group">
              {/* Dot Icon on line */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                  event.accessType === 'emergency'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {event.accessType === 'emergency' ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
              </div>

              {/* Event Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{event.hospitalName}</h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                        event.accessType === 'emergency'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {event.accessType}
                    </span>
                    {event.factorUsed && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded-full">
                        {event.factorUsed.toUpperCase()} VERIFIED
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{event.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Action:</span>
                    <p className="font-bold text-slate-800">{event.action}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Clinical Reason:</span>
                    <p className="font-medium text-slate-700">{event.reason}</p>
                  </div>
                </div>

                {/* Blockchain Proof Footer */}
                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Blockchain Verified</span>
                    </span>
                    <span className="text-xs font-mono text-slate-500">Block #{event.blockNumber}</span>
                  </div>

                  <button
                    onClick={() => onInspectTx(event)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-mono font-semibold"
                  >
                    <span>Tx: {event.txHash.substring(0, 8)}...{event.txHash.substring(event.txHash.length - 4)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
