import React, { useState } from 'react';
import { 
  FileText, 
  Pill, 
  Scan, 
  Lock, 
  Sparkles, 
  Search, 
  UploadCloud, 
  CheckCircle2, 
  Eye, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  Building2,
  Plus,
  ExternalLink,
  Download,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { MedicalRecord, Prescription } from '../../types';

interface MyRecordsViewProps {
  records: MedicalRecord[];
  prescriptions: Prescription[];
  onOpenScanner: () => void;
  onOpenManualUpload: () => void;
  onDeleteRecord?: (recordId: string, storagePath?: string) => void;
}

export const MyRecordsView: React.FC<MyRecordsViewProps> = ({
  records,
  prescriptions,
  onOpenScanner,
  onOpenManualUpload,
  onDeleteRecord,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const categories = ['all', 'Lab Reports', 'Prescriptions', 'Diagnostic Scans', 'Surgical Notes'];

  const filteredRecords = records.filter(r => {
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesQuery = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.aiExtractedFields.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Upload Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Encrypted Medical Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AES-256 field-encrypted · Firebase Storage & Cloud Firestore Persistent
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenManualUpload}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Record / File</span>
          </button>

          <button
            type="button"
            onClick={onOpenScanner}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Document AI Scan</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? `All Records (${records.length})` : cat}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search records, diagnoses, biomarkers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Records Grid */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">No Medical Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your first encrypted record or use the Document AI OCR scanner to add records.
          </p>
          <button
            type="button"
            onClick={onOpenManualUpload}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Record Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="heal-card p-5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 font-mono">
                    {record.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{record.date}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  {record.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {record.aiExtractedFields.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[130px]">{record.hospitalName}</span>
                </div>

                <div className="flex items-center gap-2">
                  {record.fileSize && (
                    <span className="text-[10px] font-mono text-slate-400">{record.fileSize}</span>
                  )}
                  <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Encrypted
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">{selectedRecord.category}</span>
                <h3 className="font-bold text-slate-900 text-lg">{selectedRecord.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero-Knowledge Proof: Decrypted locally. Stored in Firebase Cloud Storage.</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Facility / Lab</span>
                  <span className="font-bold text-slate-800">{selectedRecord.hospitalName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Physician / Author</span>
                  <span className="font-bold text-slate-800">{selectedRecord.doctorName}</span>
                </div>
              </div>

              {/* Integrity & File Info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px]">Storage & Hash Integrity</span>
                  {selectedRecord.fileSize && (
                    <span className="font-mono text-slate-500 text-[10px]">Size: {selectedRecord.fileSize}</span>
                  )}
                </div>

                {selectedRecord.sha256Hash && (
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-[11px] font-mono">
                    <span className="text-slate-600 truncate mr-2">SHA-256: {selectedRecord.sha256Hash}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(selectedRecord.sha256Hash!)}
                      className="text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer flex items-center gap-1 font-sans"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {selectedRecord.fileUrl && (
                  <div className="pt-1">
                    <a
                      href={selectedRecord.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Open / Download Attached Document</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                    </a>
                  </div>
                )}
              </div>

              {/* Extracted Biomarkers / Values */}
              {selectedRecord.aiExtractedFields.values && Object.keys(selectedRecord.aiExtractedFields.values).length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Extracted Biomarkers & Numerical Values
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedRecord.aiExtractedFields.values).map(([k, v]) => (
                      <div key={k} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">{k}</span>
                        <span className="font-bold text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-950">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Clinical Summary & Synthesis</span>
                </div>
                <p className="leading-relaxed">{selectedRecord.aiExtractedFields.summary}</p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-white flex justify-between items-center">
              {onDeleteRecord && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${selectedRecord.title}"?`)) {
                      onDeleteRecord(selectedRecord.id, selectedRecord.storagePath);
                      setSelectedRecord(null);
                    }
                  }}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
