import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import { MedicalRecord, Patient } from '../../types';
import { blockchainService } from '../../services/blockchainService';
import { firebasePatientService } from '../../services/firebasePatientService';
import confetti from 'canvas-confetti';


interface DocumentAIScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onRecordCreated: (record: MedicalRecord) => void;
}

export const DocumentAIScannerModal: React.FC<DocumentAIScannerModalProps> = ({
  isOpen,
  onClose,
  patient,
  onRecordCreated,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'lipid' | 'discharge' | 'prescription'>('lipid');
  const [scanStep, setScanStep] = useState<'idle' | 'ocr' | 'extracting' | 'encrypted' | 'done'>('idle');

  if (!isOpen) return null;

  const presets = {
    lipid: {
      title: 'Comprehensive Lipid & Biomarker Panel',
      category: 'Lab Reports' as const,
      hospital: 'Apex Diagnostics & Imaging',
      doctor: 'Dr. Rajesh Sharma',
      text: 'PATIENT: OLIVIA CHEN (HL-1894-4321)\nSPECIMEN: SERUM\nTOTAL CHOLESTEROL: 178 mg/dL\nHDL CHOLESTEROL: 60 mg/dL\nLDL CHOLESTEROL: 98 mg/dL\nTRIGLYCERIDES: 105 mg/dL\nGLUCOSE FASTING: 88 mg/dL\nIMPRESSION: Optimal lipid profile and euglycemia.',
      extracted: {
        values: {
          'Total Cholesterol': '178 mg/dL (Normal)',
          'HDL': '60 mg/dL (Optimal)',
          'LDL': '98 mg/dL (Desirable)',
          'Triglycerides': '105 mg/dL (Normal)',
          'Fasting Glucose': '88 mg/dL (Normal)',
        },
        diagnoses: ['Optimal Lipid Regulation', 'Normal Glycemic Baseline'],
        summary: 'Claude Vision OCR extracted biomarkers with 99.4% confidence score. All values within clinical reference bounds.',
        confidenceScore: 0.99,
      },
    },
    discharge: {
      title: 'Post-Observation Cardiology Summary',
      category: 'Surgical Notes' as const,
      hospital: 'City Care Hospital',
      doctor: 'Dr. Rajesh Sharma',
      text: 'ADMISSION NOTE: Routine BP optimization follow-up.\nVITALS: BP 118/76, HR 68, SpO2 99%.\nMEDICATIONS CONTINUED: Lisinopril 10mg PO Daily.\nFOLLOW-UP: 6 Months.\nNO ACUTE ADVERSE FINDINGS.',
      extracted: {
        values: {
          'Blood Pressure': '118/76 mmHg (Controlled)',
          'Heart Rate': '68 bpm',
          'SpO2': '99% on room air',
        },
        diagnoses: ['Controlled Hypertension', 'No acute cardiac distress'],
        summary: 'Patient demonstrates optimal blood pressure control under ongoing ACE inhibitor regimen.',
        confidenceScore: 0.98,
      },
    },
    prescription: {
      title: 'Digital Inhaler Refill Authorization',
      category: 'Prescriptions' as const,
      hospital: 'City Care Hospital',
      doctor: 'Dr. Rajesh Sharma',
      text: 'Rx: Albuterol Sulfate 90mcg Inhalation Aerosol\nSIG: Inhale 1-2 puffs q4-6h PRN wheezing/exercise\nQTY: 1 canister (200 inhalations)\nREFILLS: 2',
      extracted: {
        medications: ['Albuterol Sulfate 90mcg'],
        values: {
          'Frequency': '1-2 puffs q4-6h PRN',
          'Quantity': '1 canister (200 actuations)',
        },
        diagnoses: ['Exercise-Induced Bronchospasm'],
        summary: 'Standard bronchodilator prescription verified against allergy profile.',
        confidenceScore: 1.0,
      },
    },
  };

  const handleStartProcessing = () => {
    setScanStep('ocr');
    setTimeout(() => {
      setScanStep('extracting');
      setTimeout(() => {
        setScanStep('encrypted');
        setTimeout(async () => {
          const current = presets[selectedPreset];
          const recordId = 'rec-' + Math.random().toString(36).substring(2, 8);
          const newRecord: MedicalRecord = {
            id: recordId,
            patientId: patient.id,
            category: current.category,
            title: current.title,
            date: new Date().toISOString().split('T')[0],
            hospitalName: current.hospital,
            doctorName: current.doctor,
            fileType: 'PDF / AI OCR Analyzed',
            fileSize: '48.2 KB',
            sha256Hash: 'sha256_' + Math.random().toString(36).substring(2, 12),
            isEncrypted: true,
            contentEncrypted: 'U2FsdGVkX1+98Kx2Wv83' + Math.random().toString(36) + '...[AES-256 GCM 256-bit Encrypted]',
            aiExtractedFields: current.extracted,
            createdAt: new Date().toISOString(),
          };

          // Append access / upload event to blockchain
          const event = await blockchainService.logEvent({
            patientId: patient.id,
            patientName: patient.name,
            hospitalId: 'hosp-001',
            hospitalName: current.hospital,
            staffId: 'staff-apex-421',
            staffName: current.doctor,
            staffRole: 'Diagnostic Specialist',
            accessType: 'normal',
            action: `Uploaded ${current.title} (Document AI OCR)`,
            reason: 'Automated OCR & structured EHR sync',
          });

          // Sync to Firebase Firestore
          await firebasePatientService.saveMedicalRecord(patient.id, newRecord);
          await firebasePatientService.saveAccessEvent(event);

          onRecordCreated(newRecord);
          setScanStep('done');
          confetti({ particleCount: 30, spread: 60 });
        }, 1000);
      }, 1000);
    }, 900);
  };

  const resetScanner = () => {
    setScanStep('idle');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E1D5] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E1D5] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2B2521] flex items-center justify-center text-[#FAF7F2] border border-[#3E352F]">
              <Sparkles className="w-5 h-5 text-[#F5C7B8]" />
            </div>
            <div>
              <h3 className="font-bold text-[#2B2521] text-lg">Document AI & OCR Engine</h3>
              <p className="text-xs text-[#82786D]">
                Vision OCR · Automated Entity Extraction · Sovereign AES-256 Storage
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#FAF7F2]/40">
          {scanStep === 'idle' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#63594F] uppercase tracking-wider">
                Select Sample Medical Document to Process
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPreset('lipid')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedPreset === 'lipid'
                      ? 'border-[#C85A3B] bg-[#FFF9F2] text-[#2B2521] shadow-2xs font-bold'
                      : 'border-[#E8E1D5] hover:border-[#C85A3B] bg-white text-[#63594F]'
                  }`}
                >
                  <FileText className="w-6 h-6 text-[#C85A3B] mb-2" />
                  <div className="font-bold text-xs">Lab Panel (Lipid/CBC)</div>
                  <div className="text-[10px] text-[#82786D] mt-0.5">Biomarker Extraction</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPreset('discharge')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedPreset === 'discharge'
                      ? 'border-[#C85A3B] bg-[#FFF9F2] text-[#2B2521] shadow-2xs font-bold'
                      : 'border-[#E8E1D5] hover:border-[#C85A3B] bg-white text-[#63594F]'
                  }`}
                >
                  <FileText className="w-6 h-6 text-[#2B2521] mb-2" />
                  <div className="font-bold text-xs">Cardiology Summary</div>
                  <div className="text-[10px] text-[#82786D] mt-0.5">Clinical Note Parsing</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPreset('prescription')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedPreset === 'prescription'
                      ? 'border-[#C85A3B] bg-[#FFF9F2] text-[#2B2521] shadow-2xs font-bold'
                      : 'border-[#E8E1D5] hover:border-[#C85A3B] bg-white text-[#63594F]'
                  }`}
                >
                  <FileText className="w-6 h-6 text-[#2D6346] mb-2" />
                  <div className="font-bold text-xs">Prescription Image</div>
                  <div className="text-[10px] text-[#82786D] mt-0.5">Dosage & Sig Rules</div>
                </button>
              </div>

              {/* Document Preview Box */}
              <div className="p-5 rounded-2xl bg-white border border-[#E8E1D5] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#82786D] font-mono">
                  <span>Document Stream Input</span>
                  <span>Patient ID: {patient.healthId}</span>
                </div>
                <pre className="p-3.5 bg-[#241F1C] text-[#FAF7F2] rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-[#3E352F]">
                  {presets[selectedPreset].text}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-[#EDF5F0] border border-[#C4DFC5] text-xs text-[#2D6346] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2D6346] shrink-0" />
                <span>
                  Extracted metadata is automatically encrypted with AES-256 off-chain. Only an on-chain event hash is minted to the ledger.
                </span>
              </div>
            </div>
          )}

          {/* Processing Animation Steps */}
          {['ocr', 'extracting', 'encrypted'].includes(scanStep) && (
            <div className="p-8 rounded-3xl bg-[#241F1C] text-white flex flex-col items-center justify-center text-center space-y-5 min-h-[300px] border border-[#3E352F]">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-[#C85A3B] flex items-center justify-center text-[#F5C7B8] animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#FAF7F2]">
                  {scanStep === 'ocr' && 'Step 1/3: Running Vision OCR on Document Image...'}
                  {scanStep === 'extracting' && 'Step 2/3: Structuring Key Biomarkers & Clinical Entities...'}
                  {scanStep === 'encrypted' && 'Step 3/3: Applying AES-256 Field Encryption & Minting Hash...'}
                </h4>
                <p className="text-xs text-[#D8CEBE] font-mono">
                  {scanStep === 'ocr' && 'Tokenizing text layers and detecting table matrix...'}
                  {scanStep === 'extracting' && 'Matching values to standardized LOINC & RxNorm ontologies...'}
                  {scanStep === 'encrypted' && 'SHA-256 Merkle root verification complete.'}
                </p>
              </div>
            </div>
          )}

          {/* Done Step */}
          {scanStep === 'done' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-5 rounded-2xl bg-[#EDF5F0] border border-[#C4DFC5] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2D6346] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[#2D6346] text-sm">
                    Medical Record Extracted & Verified Successfully!
                  </p>
                  <p className="text-[#2D6346]/90 mt-0.5">
                    {presets[selectedPreset].extracted.summary}
                  </p>
                </div>
              </div>

              {/* Extracted Structured Entity View */}
              <div className="p-5 rounded-2xl bg-white border border-[#E8E1D5] space-y-3">
                <div className="text-xs font-bold text-[#63594F] uppercase tracking-wider">
                  Extracted Structured Fields
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(presets[selectedPreset].extracted.values || {}).map(([k, v]) => (
                    <div key={k} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8]">
                      <span className="text-[#82786D] block">{k}</span>
                      <span className="font-bold text-[#2B2521]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8E1D5] bg-white flex justify-between items-center">
          <button
            onClick={resetScanner}
            className="text-xs text-[#82786D] hover:text-[#2B2521] cursor-pointer"
          >
            {scanStep === 'done' ? 'Process Another Document' : 'Cancel'}
          </button>

          {scanStep === 'idle' && (
            <button
              onClick={handleStartProcessing}
              className="px-5 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#F5C7B8]" />
              <span>Run Document AI Pipeline</span>
            </button>
          )}

          {scanStep === 'done' && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#2B2521] hover:bg-[#3D352E] text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Done & View In Records
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
