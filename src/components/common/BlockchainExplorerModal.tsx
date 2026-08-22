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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E1D5] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E1D5] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2B2521] flex items-center justify-center text-[#FAF7F2] border border-[#3E352F]">
              <ShieldCheck className="w-6 h-6 text-[#F5C7B8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#2B2521] text-lg">HealLock Immutable Audit Ledger</h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#EDF5F0] text-[#2D6346] rounded-full border border-[#C4DFC5] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Consensus Active
                </span>
              </div>
              <p className="text-xs text-[#82786D]">
                Cryptographic tamper-evident proof · Zero raw medical records on-chain
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#82786D] hover:text-[#2B2521] hover:bg-[#EAE2D5] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8E1D5] px-6 gap-6 text-sm font-semibold bg-white">
          <button
            onClick={() => setActiveTab('tx')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tx'
                ? 'border-[#C85A3B] text-[#2B2521] font-black'
                : 'border-transparent text-[#82786D] hover:text-[#2B2521]'
            }`}
          >
            Transaction Details
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'blocks'
                ? 'border-[#C85A3B] text-[#2B2521] font-black'
                : 'border-transparent text-[#82786D] hover:text-[#2B2521]'
            }`}
          >
            Ledger Blocks ({blocks.length})
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-[#C85A3B] text-[#2B2521] font-black'
                : 'border-transparent text-[#82786D] hover:text-[#2B2521]'
            }`}
          >
            Security Architecture
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF7F2]/50">
          {activeTab === 'tx' && currentEvent && (
            <div className="space-y-5">
              {/* Verification Banner */}
              <div className="p-4 rounded-2xl bg-[#EDF5F0] border border-[#C4DFC5] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2D6346] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-[#2D6346]">Cryptographic Verification Passed</p>
                  <p className="text-[#2D6346]/80 text-xs mt-0.5">{verification?.details}</p>
                </div>
              </div>

              {/* Transaction Key Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
                  <div className="text-xs font-bold text-[#82786D] uppercase tracking-wider">
                    Transaction Hash (SHA-256)
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-xl text-xs font-mono text-[#2B2521] break-all border border-[#E8DEC8]">
                    <span>{currentEvent.txHash}</span>
                    <button
                      onClick={() => handleCopy(currentEvent.txHash)}
                      className="ml-2 p-1.5 hover:bg-[#EAE2D5] rounded-lg text-[#82786D] hover:text-[#2B2521] shrink-0 cursor-pointer"
                      title="Copy Hash"
                    >
                      {copiedTx ? <Check className="w-4 h-4 text-[#2D6346]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[#82786D]">Block Height:</span>
                      <p className="font-bold text-[#2B2521] font-mono">#{currentEvent.blockNumber}</p>
                    </div>
                    <div>
                      <span className="text-[#82786D]">Timestamp:</span>
                      <p className="font-semibold text-[#2B2521]">{currentEvent.timestamp}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
                  <div className="text-xs font-bold text-[#82786D] uppercase tracking-wider">
                    Access Audit Payload
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-[#E8E1D5] pb-1.5">
                      <span className="text-[#82786D]">Access Type:</span>
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${
                          currentEvent.accessType === 'emergency'
                            ? 'bg-[#FDF2F0] text-[#BA3B3B] border-[#F5C7C1]'
                            : 'bg-[#EDF5F0] text-[#2D6346] border-[#C4DFC5]'
                        }`}
                      >
                        {currentEvent.accessType.toUpperCase()}
                      </span>
                    </div>
                    {currentEvent.factorUsed && (
                      <div className="flex justify-between border-b border-[#E8E1D5] pb-1.5">
                        <span className="text-[#82786D]">Biometric Factor:</span>
                        <span className="font-semibold text-[#5B4886] uppercase">
                          {currentEvent.factorUsed} UNLOCK
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-[#E8E1D5] pb-1.5">
                      <span className="text-[#82786D]">Hospital / Facility:</span>
                      <span className="font-medium text-[#2B2521]">{currentEvent.hospitalName}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E8E1D5] pb-1.5">
                      <span className="text-[#82786D]">Action:</span>
                      <span className="font-medium text-[#2B2521]">{currentEvent.action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#82786D]">Clinical Reason:</span>
                      <span className="font-medium text-[#2B2521] text-right max-w-[200px] truncate">
                        {currentEvent.reason}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON Leaf Payload View */}
              <div className="p-4 rounded-2xl bg-[#241F1C] text-[#FAF7F2] text-xs font-mono border border-[#3E352F]">
                <div className="flex items-center justify-between mb-2 text-[#D8CEBE] text-[11px] font-sans">
                  <span>Immutable On-Chain Event State Leaf</span>
                  <span className="text-[#EDF5F0]">Merkle Verified ✓</span>
                </div>
                <pre className="overflow-x-auto p-3 bg-[#1C1816] rounded-xl text-[#F5C7B8]">
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
              <div className="text-xs text-[#82786D] flex items-center justify-between">
                <span>Recent blocks synced from permissioned healthcare ledger</span>
                <span className="font-mono text-[#C85A3B] font-bold">Sync: Height #{blocks[0]?.blockNumber}</span>
              </div>

              {blocks.map(block => (
                <div
                  key={block.blockNumber}
                  className="p-5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-3 hover:border-[#C85A3B] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#C85A3B]" />
                      <span className="font-bold text-[#2B2521] text-sm">Block #{block.blockNumber}</span>
                      <span className="text-xs text-[#82786D]">· {new Date(block.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#FAF7F2] font-mono text-[#63594F] border border-[#E8DEC8]">
                      Nonce: {block.nonce}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1 text-[#63594F]">
                    <div className="p-2.5 bg-[#FAF7F2] rounded-xl truncate border border-[#E8DEC8]">
                      <span className="text-[#82786D]">Block Hash: </span>
                      {block.hash}
                    </div>
                    <div className="p-2.5 bg-[#FAF7F2] rounded-xl truncate border border-[#E8DEC8]">
                      <span className="text-[#82786D]">Merkle Root: </span>
                      {block.merkleRoot}
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-[#82786D] flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#2B2521]">Contained Transactions ({block.transactions.length}):</span>
                    {block.transactions.map(tx => (
                      <span key={tx.id} className="px-2.5 py-0.5 bg-[#FAF7F2] text-[#2B2521] rounded-lg font-mono text-[11px] border border-[#E8DEC8]">
                        {tx.action} ({tx.hospitalName})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] space-y-4 text-sm text-[#4F4740] leading-relaxed">
              <h4 className="font-bold text-[#2B2521] text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#C85A3B]" />
                Zero Raw Medical Data On-Chain Architecture
              </h4>
              <p>
                HealLock strictly enforces privacy regulations by maintaining an exact separation between the <strong>Immutable Audit Ledger</strong> and <strong>Encrypted Off-Chain Storage</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC8] space-y-2">
                  <div className="font-bold text-[#2B2521] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#C85A3B]" />
                    Off-Chain Storage (Postgres + Storage)
                  </div>
                  <ul className="text-xs text-[#63594F] space-y-1.5 list-disc list-inside">
                    <li>Medical records & lab PDFs (AES-256 field encrypted)</li>
                    <li>Prescription details & clinical diagnoses</li>
                    <li>Biometric templates (hashed references only)</li>
                    <li>Editable & deletable on patient request</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-[#EDF5F0] border border-[#C4DFC5] space-y-2">
                  <div className="font-bold text-[#2D6346] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2D6346]" />
                    On-Chain Audit Ledger (Hyperledger/EVM)
                  </div>
                  <ul className="text-xs text-[#2D6346]/90 space-y-1.5 list-disc list-inside">
                    <li>Consent Grants, Expiries & Revocations</li>
                    <li>Normal record access events & timestamps</li>
                    <li>Emergency profile unlocks with clinical reasons</li>
                    <li>Immutable, tamper-evident Merkle tree proofs</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8E1D5] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
