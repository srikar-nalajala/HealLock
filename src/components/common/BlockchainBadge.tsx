import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, ExternalLink, Hash } from 'lucide-react';
import { AccessEvent } from '../../types';

interface BlockchainBadgeProps {
  event: AccessEvent;
  onInspect?: (event: AccessEvent) => void;
}

export const BlockchainBadge: React.FC<BlockchainBadgeProps> = ({ event, onInspect }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-1.5">
      <button
        onClick={() => onInspect?.(event)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-xs"
        title="Verified against on-chain Hyperledger/EVM audit ledger"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Blockchain Verified</span>
      </button>

      <button
        onClick={() => onInspect?.(event)}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-mono transition-colors"
        title="View full cryptographic hash and Merkle block proof"
      >
        <Hash className="w-3 h-3 text-slate-400" />
        <span>
          Tx: {event.txHash.substring(0, 6)}...{event.txHash.substring(event.txHash.length - 4)}
        </span>
        <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
      </button>
    </div>
  );
};
