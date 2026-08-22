/**
 * Comprehensive Automated Function Analysis & Test Suite for HealLock
 */

// 1. Setup Node polyfills for browser environments before loading modules
const storageStore = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageStore.get(key) || null,
  setItem: (key: string, value: string) => storageStore.set(key, value),
  removeItem: (key: string) => storageStore.delete(key),
  clear: () => storageStore.clear(),
};

import * as util from 'util';

(globalThis as any).TextEncoder = util.TextEncoder;
(globalThis as any).TextDecoder = util.TextDecoder;
(globalThis as any).util = util;
(globalThis as any).localStorage = localStorageMock;
(globalThis as any).window = globalThis;
(globalThis as any).PublicKeyCredential = {
  isUserVerifyingPlatformAuthenticatorAvailable: async () => true,
};
Object.defineProperty(globalThis, 'navigator', {
  value: {
    userAgent: 'Node.js',
    credentials: {
      create: async () => ({ id: 'fido2_test_cred_98a7bc' }),
      get: async () => ({ id: 'fido2_test_cred_98a7bc' }),
    },
  },
  writable: true,
  configurable: true,
});

async function run() {
  const { AiSafetyEngine } = await import('./src/services/aiSafetyEngine');
  const { blockchainService } = await import('./src/services/blockchainService');
  const { mlAnomalyDetector } = await import('./src/services/mlAnomalyDetector');
  const { firebaseStorageService } = await import('./src/services/firebaseStorageService');
  const { authService } = await import('./src/services/authService');
  const { 
    INITIAL_PATIENT, 
    INITIAL_RECORDS, 
    INITIAL_CONSENTS, 
    INITIAL_STAFF, 
    INITIAL_PRESCRIPTIONS, 
    INITIAL_BLOCKS, 
    INITIAL_ANOMALIES 
  } = await import('./src/services/mockData');
  const { firebasePatientService } = await import('./src/services/firebasePatientService');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, errorDetails?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${testName}`);
    } else {
      failedTests++;
      console.error(`  ✗ FAIL: ${testName}`, errorDetails ? errorDetails : '');
    }
  }

  console.log('====================================================');
  console.log('🚀 HEALLOCK SYSTEM INTEGRITY & FUNCTION TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST SUITE 1: AI Safety Engine (Drug Interactions, Allergies, Contraindications)
  // ----------------------------------------------------
  console.log('🔍 [1/7] Testing AI Safety Engine (aiSafetyEngine.ts)...');
  {
    const mockPatient = {
      ...INITIAL_PATIENT,
      emergencyProfile: {
        ...INITIAL_PATIENT.emergencyProfile,
        allergies: ['Penicillin (Anaphylaxis)', 'Sulfa Drugs (Hives)'],
        criticalMeds: ['Lisinopril 10mg'],
      }
    };

    // Test 1.1: Allergy Conflict (Amoxicillin with Penicillin allergy)
    const allergyFlags = AiSafetyEngine.evaluatePrescription('Amoxicillin 500mg', [], mockPatient as any);
    assert(
      allergyFlags.some(f => f.conflictType === 'allergy_conflict' && f.severity === 'critical'),
      'Allergy check flags Amoxicillin for Penicillin-allergic patient as critical'
    );

    // Test 1.2: Allergy Conflict (Bactrim with Sulfa allergy)
    const sulfaFlags = AiSafetyEngine.evaluatePrescription('Bactrim DS', [], mockPatient as any);
    assert(
      sulfaFlags.some(f => f.conflictType === 'allergy_conflict' && f.allergen?.includes('Sulfa')),
      'Allergy check flags Bactrim for Sulfa-allergic patient'
    );

    // Test 1.3: Critical DDI (Warfarin + Aspirin)
    const ddiFlags1 = AiSafetyEngine.evaluatePrescription('Aspirin 81mg', ['Warfarin 5mg'], mockPatient as any);
    assert(
      ddiFlags1.some(f => f.conflictType === 'drug_interaction' && f.severity === 'critical' && f.explanation.includes('hemorrhage')),
      'Drug interaction flags Warfarin + Aspirin hemorrhage risk as critical'
    );

    // Test 1.4: Critical DDI (Sildenafil + Nitroglycerin)
    const ddiFlags2 = AiSafetyEngine.evaluatePrescription('Nitroglycerin 0.4mg SL', ['Sildenafil 50mg'], mockPatient as any);
    assert(
      ddiFlags2.some(f => f.conflictType === 'drug_interaction' && f.severity === 'critical' && f.explanation.includes('hypotension')),
      'Drug interaction flags Sildenafil + Nitroglycerin fatal hypotension contraindication'
    );

    // Test 1.5: Warning DDI (Lisinopril + Spironolactone - Hyperkalemia)
    const ddiFlags3 = AiSafetyEngine.evaluatePrescription('Spironolactone 25mg', ['Lisinopril 10mg'], mockPatient as any);
    assert(
      ddiFlags3.some(f => f.conflictType === 'drug_interaction' && f.severity === 'warning' && f.explanation.includes('hyperkalemia')),
      'Drug interaction flags Lisinopril + Spironolactone hyperkalemia warning'
    );

    // Test 1.6: Duplicate Therapy (Lisinopril 20mg vs Lisinopril 10mg)
    const dupFlags = AiSafetyEngine.evaluatePrescription('Lisinopril 20mg', ['Lisinopril 10mg'], mockPatient as any);
    assert(
      dupFlags.some(f => f.conflictType === 'duplicate_medication' && f.severity === 'warning'),
      'Duplicate therapy correctly detects already active medication across dosages'
    );

    // Test 1.7: Safe Medication Check
    const safeFlags = AiSafetyEngine.evaluatePrescription('Metformin 500mg', ['Atorvastatin 20mg'], mockPatient as any);
    assert(
      safeFlags.length === 1 && safeFlags[0].conflictType === 'safe' && safeFlags[0].severity === 'safe',
      'Safe medication prescription passes with verified safe flag'
    );
  }

  // ----------------------------------------------------
  // TEST SUITE 2: Blockchain Service (Cryptographic Proofs & Ledger)
  // ----------------------------------------------------
  console.log('\n🔍 [2/7] Testing Blockchain Audit Ledger (blockchainService.ts)...');
  {
    const initialBlockCount = blockchainService.getBlocks().length;
    assert(initialBlockCount > 0, `Initial blockchain ledger loaded ${initialBlockCount} existing blocks`);

    // Log a new on-chain access event
    const eventPayload = {
      patientId: INITIAL_PATIENT.id,
      patientName: INITIAL_PATIENT.name,
      hospitalId: 'hosp-001',
      hospitalName: 'Metro General Hospital',
      staffId: 'staff-101',
      staffName: 'Dr. Sarah Chen',
      staffRole: 'Cardiologist',
      accessType: 'normal' as const,
      factorUsed: 'qr' as const,
      action: 'Clinical Records Inspection',
      reason: 'Bi-annual cardiology review',
    };

    const loggedEvent = await blockchainService.logEvent(eventPayload);

    assert(Boolean(loggedEvent.txHash && loggedEvent.txHash.startsWith('0x')), 'Generated cryptographic SHA-256 txHash for access event');
    assert(loggedEvent.verified === true, 'Access event marked as verified');
    assert(blockchainService.getBlocks().length === initialBlockCount + 1, 'Block height incremented after mining new transaction');

    // Verify cryptographic transaction against on-chain block
    const verification = blockchainService.verifyTx(loggedEvent.txHash);
    assert(verification.verified === true && verification.block !== undefined, 'Transaction hash verified against block Merkle root');

    // Verify invalid transaction rejection
    const invalidVerification = blockchainService.verifyTx('0xdeadbeef00000000000000000000000000000000000000000000000000000000');
    assert(invalidVerification.verified === false, 'Tampered/unregistered txHash correctly rejected');
  }

  // ----------------------------------------------------
  // TEST SUITE 3: ML Anomaly Detector (Abuse Pattern Recognition)
  // ----------------------------------------------------
  console.log('\n🔍 [3/7] Testing ML Anomaly Detector (mlAnomalyDetector.ts)...');
  {
    const alerts = mlAnomalyDetector.getAlerts();
    assert(Array.isArray(alerts) && alerts.length > 0, 'ML anomaly baseline alerts initialized');

    // Simulate 3 rapid emergency access events by same hospital
    const emergencyEvents = [
      {
        id: 'ev-1',
        patientId: 'p-1',
        patientName: 'John Doe',
        hospitalId: 'suspicious-hosp-99',
        hospitalName: 'Shady Clinic',
        staffId: 's-1',
        staffName: 'Unknown Staff',
        staffRole: 'ER Staff',
        accessType: 'emergency' as const,
        action: 'Emergency Bypass',
        reason: 'Acute Trauma',
        timestamp: new Date().toISOString(),
        txHash: '0x111',
        blockNumber: 48900,
        verified: true
      },
      {
        id: 'ev-2',
        patientId: 'p-1',
        patientName: 'John Doe',
        hospitalId: 'suspicious-hosp-99',
        hospitalName: 'Shady Clinic',
        staffId: 's-1',
        staffName: 'Unknown Staff',
        staffRole: 'ER Staff',
        accessType: 'emergency' as const,
        action: 'Emergency Bypass',
        reason: 'Acute Trauma',
        timestamp: new Date().toISOString(),
        txHash: '0x222',
        blockNumber: 48901,
        verified: true
      },
      {
        id: 'ev-3',
        patientId: 'p-1',
        patientName: 'John Doe',
        hospitalId: 'suspicious-hosp-99',
        hospitalName: 'Shady Clinic',
        staffId: 's-1',
        staffName: 'Unknown Staff',
        staffRole: 'ER Staff',
        accessType: 'emergency' as const,
        action: 'Emergency Bypass',
        reason: 'Acute Trauma',
        timestamp: new Date().toISOString(),
        txHash: '0x333',
        blockNumber: 48902,
        verified: true
      }
    ];

    const detectedAlert = mlAnomalyDetector.analyzeAccessStream('suspicious-hosp-99', 'Shady Clinic', emergencyEvents);
    assert(
      detectedAlert !== null && detectedAlert.severity === 'critical' && detectedAlert.abusePattern.includes('Repeated Emergency'),
      'ML Anomaly engine flags 3+ rapid emergency bypass events as critical abuse pattern'
    );

    if (detectedAlert) {
      mlAnomalyDetector.markReviewed(detectedAlert.id);
      assert(detectedAlert.adminReviewed === true, 'Admin review status flag updated on flagged anomaly');
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 4: Storage Service Utility Functions
  // ----------------------------------------------------
  console.log('\n🔍 [4/7] Testing Storage Service Utilities (firebaseStorageService.ts)...');
  {
    assert(firebaseStorageService.formatFileSize(0) === '0 B', 'formatFileSize handles 0 bytes');
    assert(firebaseStorageService.formatFileSize(1024) === '1 KB', 'formatFileSize handles 1 KB');
    assert(firebaseStorageService.formatFileSize(1024 * 1024 * 2.5) === '2.5 MB', 'formatFileSize handles 2.5 MB');

    // SHA-256 computation on mock Blob
    const testBlob = new Blob(['HEALLOCK_IMMUTABLE_PATIENT_RECORD_DATA'], { type: 'text/plain' });
    const hash = await firebaseStorageService.computeFileSha256(testBlob);
    assert(Boolean(hash && hash.length === 64), 'computeFileSha256 produces valid 64-char hex digest');
  }

  // ----------------------------------------------------
  // TEST SUITE 5: Auth & Role Management Service
  // ----------------------------------------------------
  console.log('\n🔍 [5/7] Testing Auth Service & Multi-Role Lifecycle (authService.ts)...');
  {
    // Test 5.1: Detailed Patient Registration
    const newPatientAuth = await authService.registerDetailed({
      name: 'Dr. Johnathan Smith',
      email: 'john.smith.test@heallock.io',
      password: 'StrongPassword123!',
      role: 'patient',
      dob: '1988-12-04',
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+1 (555) 789-0123',
      emergencyContactName: 'Jane Smith',
      emergencyContactPhone: '+1 (555) 789-0124',
      emergencyContactRelation: 'Spouse',
      allergies: 'Aspirin, Shellfish',
      criticalMeds: 'Metoprolol 50mg',
      conditions: 'Hypertension',
    });

    assert(newPatientAuth.role === 'patient', 'Registered new patient with role "patient"');
    assert(newPatientAuth.patientData?.emergencyProfile.bloodGroup === 'B+', 'Patient emergency profile blood group correctly set');
    assert(newPatientAuth.patientData?.emergencyProfile.allergies.includes('Aspirin'), 'Patient allergies parsed into array');
    assert(Boolean(newPatientAuth.patientData?.healthId?.startsWith('HL-')), 'Patient generated unique HealthID with HL- prefix');

    // Test 5.2: Detailed Doctor Registration
    const newDoctorAuth = await authService.registerDetailed({
      name: 'Dr. Emily Watson, MD',
      email: 'dr.watson@mayo.edu',
      password: 'DoctorPassword123!',
      role: 'doctor',
      hospitalName: 'Mayo Clinic',
      department: 'Neurology',
      medicalLicense: 'MED-994821',
    });

    assert(newDoctorAuth.role === 'doctor', 'Registered new doctor with role "doctor"');
    assert(newDoctorAuth.staffData?.hospitalName === 'Mayo Clinic', 'Doctor hospital affiliation registered');
    assert(newDoctorAuth.staffData?.badgeNumber === 'MED-994821', 'Doctor medical license preserved');

    // Test 5.3: Login with existing registered account
    const loggedInUser = await authService.login({
      email: 'john.smith.test@heallock.io',
      password: 'StrongPassword123!',
      role: 'patient',
    });

    assert(loggedInUser.displayName === 'Dr. Johnathan Smith', 'Login retrieves registered user data correctly');

    // Test 5.4: Logout
    await authService.logout();
    assert(authService.getCurrentUser() === null, 'Logout successfully cleared session and current user');
  }

  // ----------------------------------------------------
  // TEST SUITE 6: Firebase Patient & Consent Workflow Service
  // ----------------------------------------------------
  console.log('\n🔍 [6/7] Testing Patient & Consent Query Fallbacks (firebasePatientService.ts)...');
  {
    // Fast timeout query test
    const foundPatient = await firebasePatientService.queryPatientByHealthId('HL-1894-4321');
    assert(foundPatient !== null && foundPatient.name === INITIAL_PATIENT.name, 'queryPatientByHealthId resolves patient by HealthID');

    const foundByEmail = await firebasePatientService.queryPatientByHealthId(INITIAL_PATIENT.email);
    assert(foundByEmail !== null && foundByEmail.healthId === INITIAL_PATIENT.healthId, 'queryPatientByHealthId resolves patient by email');
  }

  // ----------------------------------------------------
  // TEST SUITE 7: Mock Data & Domain Model Integrity
  // ----------------------------------------------------
  console.log('\n🔍 [7/7] Testing Mock Data & Model Integrity (mockData.ts)...');
  {
    assert(INITIAL_RECORDS.length >= 4, `INITIAL_RECORDS contains ${INITIAL_RECORDS.length} valid medical records`);
    assert(INITIAL_CONSENTS.length >= 3, `INITIAL_CONSENTS contains ${INITIAL_CONSENTS.length} valid consent grants`);
    assert(INITIAL_STAFF.length >= 4, `INITIAL_STAFF contains ${INITIAL_STAFF.length} staff records across roles`);
    assert(INITIAL_PRESCRIPTIONS.length >= 3, `INITIAL_PRESCRIPTIONS contains ${INITIAL_PRESCRIPTIONS.length} prescriptions`);
    assert(INITIAL_BLOCKS.length >= 3, `INITIAL_BLOCKS contains ${INITIAL_BLOCKS.length} blockchain blocks`);
    assert(INITIAL_ANOMALIES.length >= 2, `INITIAL_ANOMALIES contains ${INITIAL_ANOMALIES.length} baseline anomalies`);

    // Verify medical record fields
    for (const record of INITIAL_RECORDS) {
      assert(
        Boolean(record.id && record.title && record.category && record.hospitalName && record.doctorName),
        `Record "${record.title}" contains all required clinical metadata`
      );
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 8: Biometric Recognition & Hardware Security Service
  // ----------------------------------------------------
  console.log('\n🔍 [8/8] Testing Biometric Recognition & Hardware Tokens (biometricService.ts)...');
  {
    const { biometricService } = await import('./src/services/biometricService');

    // Test 8.1: Real 128D Identical Face Vector Matching (Euclidean distance == 0)
    const mock128D_A = new Array(128).fill(0).map((_, i) => Math.sin(i * 0.1));
    const mock128D_B = [...mock128D_A];
    const match1 = biometricService.verifyFaceMatch(mock128D_A, mock128D_B);
    assert(match1.matched === true && match1.euclideanDistance === 0, 'Identical 128D face vectors match with Euclidean distance 0.0 (MATCHED)');

    // Test 8.2: Different Person Face Vector (> 0.58 distance)
    const mock128D_Different = new Array(128).fill(0).map((_, i) => Math.cos(i * 0.5));
    const match2 = biometricService.verifyFaceMatch(mock128D_A, mock128D_Different);
    assert(match2.matched === false && match2.status === 'FAILED', 'Different person 128D face vector is strictly rejected (NOT MATCHED)');

    // Test 8.3: Unregistered Patient Face Check
    const matchUnreg = biometricService.verifyFaceMatch(mock128D_A, undefined);
    assert(matchUnreg.matched === false && matchUnreg.status === 'NOT_REGISTERED', 'Unregistered face biometrics returns NOT_REGISTERED (Access Denied)');

    // Test 8.4: FIDO2 Fingerprint Enrollment
    const fidoResult = await biometricService.enrollFingerprintFIDO2(INITIAL_PATIENT);
    assert(Boolean(fidoResult.credentialId && fidoResult.templateRef), 'FIDO2 enrollment generates valid credential ID and template reference');

    // Test 8.5: Fingerprint Verification
    const fidoVerify = await biometricService.verifyFingerprintFIDO2(fidoResult.credentialId);
    assert(fidoVerify.matched === true && fidoVerify.verificationFactor === 'fingerprint', 'Fingerprint biometric verification succeeds for enrolled token');

    // Test 8.6: Emergency QR Payload Generation
    const qrPayload = biometricService.generateEmergencyQrPayload(INITIAL_PATIENT);
    const parsedQr = JSON.parse(qrPayload);
    assert(parsedQr.healthId === INITIAL_PATIENT.healthId && parsedQr.bloodGroup === INITIAL_PATIENT.emergencyProfile.bloodGroup, 'Emergency QR payload contains accurate patient health and blood group data');
  }

  // ----------------------------------------------------
  // TEST SUITE 9: Supabase Database & Storage Service
  // ----------------------------------------------------
  console.log('\n🔍 [9/9] Testing Supabase PostgreSQL & Storage Service (supabaseService.ts)...');
  {
    const { supabase, isSupabaseConfigured } = await import('./src/services/supabaseClient');
    const { supabaseService } = await import('./src/services/supabaseService');

    // Test 9.1: Supabase Configuration Check
    assert(isSupabaseConfigured() === true, 'Supabase client is configured with production URL and key');

    // Test 9.2: Patient Persistence & Retrieval
    const saved = await supabaseService.savePatient(INITIAL_PATIENT);
    assert(saved.id === INITIAL_PATIENT.id, 'Supabase service saves patient profile correctly');

    const fetched = await supabaseService.getPatient(INITIAL_PATIENT.healthId);
    assert(Boolean(fetched && fetched.healthId === INITIAL_PATIENT.healthId), 'Supabase retrieves patient by HealthID');

    // Test 9.3: Medical Records Query
    const records = await supabaseService.getPatientRecords(INITIAL_PATIENT.id);
    assert(Array.isArray(records) && records.length > 0, 'Supabase retrieves patient medical records');

    // Test 9.4: Consent Grants Query
    const consents = await supabaseService.getConsents(INITIAL_PATIENT.id);
    assert(Array.isArray(consents) && consents.length > 0, 'Supabase retrieves active consent grants');

    // Test 9.5: Blockchain Ledger Retrieval
    const ledger = await supabaseService.getBlockchainLedger();
    assert(Array.isArray(ledger) && ledger.length > 0, 'Supabase retrieves blockchain audit blocks');
  }

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests === 0) {
    console.log('🎉 ALL SYSTEM FUNCTIONS AND WORKFLOWS ARE 100% OPERATIONAL!');
  } else {
    console.log(`⚠️ ${failedTests} TESTS FAILED. CHECK LOGS ABOVE.`);
  }
  console.log('====================================================\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
