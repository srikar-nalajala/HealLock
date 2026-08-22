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
          <h1 className="text-2xl font-black text-[#2B2521] tracking-tight">
            Accountability & Audit Timeline
          </h1>
          <p className="text-xs text-[#82786D] mt-0.5">
            Every medical record read, modification, and emergency unseal is verified on-chain.
          </p>
        </div>

        <button
          onClick={onOpenExplorer}
          className="px-4 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
        >
          <Layers className="w-4 h-4 text-[#F5C7B8]" />
          <span>Launch Block Explorer</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-2xl border border-[#E8E1D5] w-fit text-xs font-bold shadow-2xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'all' ? 'bg-[#2B2521] text-white shadow-xs' : 'text-[#63594F] hover:text-[#2B2521] hover:bg-[#FAF7F2]'
          }`}
        >
          All Access Logs ({events.length})
        </button>
        <button
          onClick={() => setFilter('normal')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'normal' ? 'bg-[#2B2521] text-white shadow-xs' : 'text-[#63594F] hover:text-[#2B2521] hover:bg-[#FAF7F2]'
          }`}
        >
          Routine Authorized ({events.filter(e => e.accessType === 'normal').length})
        </button>
        <button
          onClick={() => setFilter('emergency')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'emergency' ? 'bg-[#BA3B3B] text-white shadow-xs' : 'text-[#63594F] hover:text-[#2B2521] hover:bg-[#FAF7F2]'
          }`}
        >
          Emergency Unlocks ({events.filter(e => e.accessType === 'emergency').length})
        </button>
      </div>

      {/* Events Timeline Container */}
      <div className="heal-card p-8 bg-white border border-[#E8E1D5] rounded-3xl shadow-sm space-y-6">
        <div className="relative pl-6 sm:pl-8 border-l-2 border-[#E8E1D5] space-y-8">
          {filteredEvents.map(event => (
            <div key={event.id} className="relative group">
              {/* Dot Icon on line */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                  event.accessType === 'emergency'
                    ? 'bg-[#BA3B3B] text-white animate-pulse'
                    : 'bg-[#2B2521] text-[#FAF7F2]'
                }`}
              >
                {event.accessType === 'emergency' ? (
                  <ShieldAlert className="w-4 h-4 text-white" />
                ) : (
                  <Building2 className="w-4 h-4 text-[#FAF7F2]" />
                )}
              </div>

              {/* Event Box */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E1D5] transition-all space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#2B2521] text-sm">{event.hospitalName}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                        event.accessType === 'emergency'
                          ? 'bg-[#FDF2F0] text-[#BA3B3B] border border-[#F5C7C1]'
                          : 'bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5]'
                      }`}
                    >
                      {event.accessType}
                    </span>
                    {event.factorUsed && (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#F2EDFA] text-[#5B4886] border border-[#DCD3EB] rounded-full">
                        {event.factorUsed.toUpperCase()} VERIFIED
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#82786D] font-mono">{event.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#82786D]">Action:</span>
                    <p className="font-bold text-[#2B2521] mt-0.5">{event.action}</p>
                  </div>
                  <div>
                    <span className="text-[#82786D]">Clinical Reason:</span>
                    <p className="font-medium text-[#4F4740] mt-0.5">{event.reason}</p>
                  </div>
                </div>

                {/* Blockchain Proof Footer */}
                <div className="pt-3 border-t border-[#E8E1D5] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Blockchain Verified</span>
                    </span>
                    <span className="text-xs font-mono text-[#82786D]">Block #{event.blockNumber}</span>
                  </div>

                  <button
                    onClick={() => onInspectTx(event)}
                    className="text-xs font-mono text-[#C85A3B] hover:text-[#B84E30] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tx: {event.txHash.substring(0, 10)}...{event.txHash.substring(event.txHash.length - 4)}</span>
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
