export type UserRole = 'patient' | 'doctor' | 'emergency' | 'pharmacist' | 'admin' | 'receptionist';

export type ConsentScope = 'Lab Reports' | 'Rx History' | 'Diagnostic Scans' | 'Surgical Notes' | 'Emergency Only';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export interface EmergencyProfile {
  bloodGroup: string;
  allergies: string[];
  criticalMeds: string[];
  criticalConditions: string[];
  emergencyContacts: EmergencyContact[];
  organDonor: boolean;
  dnrStatus: boolean;
}

export interface Patient {
  id: string;
  healthId: string; // e.g. "HL-1894-4321"
  name: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  avatarUrl: string;
  emergencyProfile: EmergencyProfile;
  registeredBiometrics: {
    faceTemplateRef: string;
    faceRegisteredAt: string;
    facePhotoUrl?: string;
    faceFeatures?: number[];
    faceLivenessScore?: number;
    fingerprintTemplateRef: string;
    fingerprintRegisteredAt: string;
    fingerprintCredentialId?: string;
    qrCodeString: string;
    lastUpdated?: string;
  };
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  city: string;
  verificationStatus: 'verified' | 'pending' | 'suspended';
  registeredDepartments: string[];
  publicKey: string;
}

export interface Staff {
  id: string;
  hospitalId: string;
  hospitalName: string;
  name: string;
  role: UserRole;
  department: string;
  badgeNumber: string;
  avatarUrl: string;
}

export interface ConsentGrant {
  id: string;
  patientId: string;
  hospitalId: string;
  hospitalName: string;
  scope: ConsentScope[];
  grantedAt: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface AccessRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientHealthId: string;
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  requestedScope: ConsentScope[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  createdAt: string;
  updatedAt: string;
  grantedScope?: ConsentScope[];
  expiryMonths?: number;
  expiryDate?: string;
}

export interface AccessEvent {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  accessType: 'normal' | 'emergency';
  factorUsed?: 'qr' | 'face' | 'fingerprint';
  action: string;
  reason: string;
  timestamp: string;
  txHash: string;
  blockNumber: number;
  verified: boolean;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  category: 'Lab Reports' | 'Prescriptions' | 'Diagnostic Scans' | 'Surgical Notes';
  title: string;
  date: string;
  hospitalName: string;
  doctorName: string;
  fileType: string;
  fileUrl?: string;
  storagePath?: string;
  fileSize?: string;
  sha256Hash?: string;
  isEncrypted: boolean;
  contentEncrypted: string;
  aiExtractedFields: {
    medications?: string[];
    values?: Record<string, string>;
    diagnoses?: string[];
    keyFindings?: string[];
    summary: string;
    confidenceScore: number;
  };
  createdAt?: string;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface AiSafetyFlag {
  conflictType: 'drug_interaction' | 'allergy_conflict' | 'duplicate_medication' | 'contraindication' | 'safe';
  severity: 'safe' | 'warning' | 'critical';
  drugA?: string;
  drugB?: string;
  allergen?: string;
  explanation: string;
  clinicalRecommendation: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  status: 'active' | 'dispensed' | 'flagged' | 'discontinued';
  medications: MedicationItem[];
  aiFlags: AiSafetyFlag[];
}

export interface HealthTrendSnapshot {
  id: string;
  patientId: string;
  metricName: string;
  unit: string;
  currentValue: string;
  trendDirection: 'stable' | 'improving' | 'declining' | 'fluctuating';
  values: { date: string; value: number }[];
  flaggedForReview: boolean;
  aiInsight: string;
}

export interface AccessAnomalyAlert {
  id: string;
  hospitalId: string;
  hospitalName: string;
  patientId?: string;
  date: string;
  accessCount: number;
  rollingAverage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  abusePattern: string;
  reason: string;
  adminReviewed: boolean;
  timestamp: string;
}

export interface BlockchainBlock {
  blockNumber: number;
  timestamp: string;
  previousHash: string;
  hash: string;
  merkleRoot: string;
  transactions: AccessEvent[];
  nonce: number;
}

export interface RealtimeNotification {
  id: string;
  recipientId: string; // patientId or staffId or 'all'
  type: 'emergency' | 'consent' | 'prescription' | 'access_request' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  smsDispatched?: boolean;
}
