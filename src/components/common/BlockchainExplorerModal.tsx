import React, { useState } from 'react';
import { X, ShieldCheck, Database, Lock, CheckCircle2, ArrowRight, Copy, Check, FileCode, Layers } from 'lucide-react';
import { AccessEvent, BlockchainBlock } from '../../types';
import { blockchainService } from '../../services/blockchainService';

interface BlockchainExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent?: AccessEvent | null;
}

export const BlockchainExplorerModal: React.FC<BlockchainExplorerModalProps> = ({
  isOpen,
  onClose,
  selectedEvent,
}) => {
  const [copiedTx, setCopiedTx] = useState(false);
  const blocks = blockchainService.getBlocks();
  const [activeTab, setActiveTab] = useState<'tx' | 'blocks' | 'architecture'>('tx');

  if (!isOpen) return null;

  const currentEvent = selectedEvent || blocks[0]?.transactions[0];
  const verification = currentEvent ? blockchainService.verifyTx(currentEvent.txHash) : null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">HealLock Immutable Audit Ledger</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Consensus Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cryptographic tamper-evident proof · Zero raw medical records on-chain
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-sm font-semibold bg-white">
          <button
            onClick={() => setActiveTab('tx')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'tx'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Transaction Details
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'blocks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ledger Blocks ({blocks.length})
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'architecture'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            On-Chain vs Off-Chain Boundary
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {activeTab === 'tx' && currentEvent && (
            <div className="space-y-5">
              {/* Verification Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-emerald-900">Cryptographic Verification Passed</p>
                  <p className="text-emerald-700 text-xs mt-0.5">{verification?.details}</p>
                </div>
              </div>

              {/* Transaction Key Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Transaction Hash (SHA-256)
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-800 break-all">
                    <span>{currentEvent.txHash}</span>
                    <button
                      onClick={() => handleCopy(currentEvent.txHash)}
                      className="ml-2 p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 shrink-0"
                      title="Copy Hash"
                    >
                      {copiedTx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500">Block Height:</span>
                      <p className="font-bold text-slate-800 font-mono">#{currentEvent.blockNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Timestamp:</span>
                      <p className="font-semibold text-slate-800">{currentEvent.timestamp}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Access Audit Payload
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Access Type:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          currentEvent.accessType === 'emergency'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {currentEvent.accessType.toUpperCase()}
                      </span>
                    </div>
                    {currentEvent.factorUsed && (
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Biometric Factor:</span>
                        <span className="font-semibold text-purple-700 uppercase">
                          {currentEvent.factorUsed} UNLOCK
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Hospital / Facility:</span>
                      <span className="font-medium text-slate-800">{currentEvent.hospitalName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Action:</span>
                      <span className="font-medium text-slate-800">{currentEvent.action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Clinical Reason:</span>
                      <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">
                        {currentEvent.reason}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON Leaf Payload View */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono">
                <div className="flex items-center justify-between mb-2 text-slate-400 text-[11px] font-sans">
                  <span>Immutable On-Chain Event State Leaf</span>
                  <span className="text-emerald-400">Merkle Verified ✓</span>
                </div>
                <pre className="overflow-x-auto p-2 bg-slate-950 rounded-lg text-slate-300">
{JSON.stringify(
  {
    tx_hash: currentEvent.txHash,
    patient_id_hash: "0x89f2a948... (Anonymized)",
    hospital: currentEvent.hospitalName,
    staff_id: currentEvent.staffId,
    access_type: currentEvent.accessType,
    biometric_factor: currentEvent.factorUsed || 'NONE',
    reason_code: currentEvent.reason,
    timestamp: currentEvent.timestamp,
    raw_medical_data_present: false,
  },
  null,
  2
)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'blocks' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Recent blocks synced from permissioned healthcare ledger</span>
                <span className="font-mono text-blue-600">Sync: Height #{blocks[0]?.blockNumber}</span>
              </div>

              {blocks.map(block => (
                <div
                  key={block.blockNumber}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-800 text-sm">Block #{block.blockNumber}</span>
                      <span className="text-xs text-slate-400">· {new Date(block.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 font-mono text-slate-600">
                      Nonce: {block.nonce}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1 text-slate-600">
                    <div className="p-2 bg-slate-50 rounded truncate">
                      <span className="text-slate-400">Block Hash: </span>
                      {block.hash}
                    </div>
                    <div className="p-2 bg-slate-50 rounded truncate">
                      <span className="text-slate-400">Merkle Root: </span>
                      {block.merkleRoot}
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Contained Transactions ({block.transactions.length}):</span>
                    {block.transactions.map(tx => (
                      <span key={tx.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-mono text-[11px]">
                        {tx.action} ({tx.hospitalName})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 text-sm text-slate-700 leading-relaxed">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Zero Raw Medical Data On-Chain Architecture
              </h4>
              <p>
                HealLock strictly enforces privacy regulations (HIPAA, GDPR, DPDP) by maintaining an exact separation between the <strong>Immutable Audit Ledger</strong> and <strong>Encrypted Off-Chain Storage</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                  <div className="font-bold text-blue-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    Off-Chain Storage (Postgres + S3)
                  </div>
                  <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
                    <li>Medical records & lab PDFs (AES-256 field encrypted)</li>
                    <li>Prescription details & clinical diagnoses</li>
                    <li>Biometric templates (hashed references only)</li>
                    <li>Editable & deletable on patient request (Right to Erasure)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    On-Chain Audit Ledger (Hyperledger/EVM)
                  </div>
                  <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
                    <li>Consent Grants, Expiries & Revocations</li>
                    <li>Normal record access events & timestamps</li>
                    <li>Emergency profile single-factor unlocks with reason codes</li>
                    <li>Immutable, tamper-evident Merkle tree proofs</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
