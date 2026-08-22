/**
 * HealLock Supabase Backend Data & Security Service
 * Handles PostgreSQL persistence, real-time sync, and document storage.
 */

import { supabase } from './supabaseClient';
import { 
  Patient, 
  MedicalRecord, 
  ConsentGrant, 
  BlockchainBlock, 
  AccessAnomalyAlert,
} from '../types';
import { INITIAL_PATIENT, INITIAL_RECORDS, INITIAL_CONSENTS, INITIAL_BLOCKS } from './mockData';

class SupabaseService {
  /**
   * Save or Update Patient Record in Supabase
   */
  public async savePatient(patient: Patient): Promise<Patient> {
    return this.savePatientProfile(patient);
  }

  public async savePatientProfile(patient: Patient): Promise<Patient> {
    try {
      const payload = {
        id: patient.id,
        health_id: patient.healthId,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dob: patient.dob,
        gender: patient.gender,
        avatar_url: patient.avatarUrl,
        emergency_profile: patient.emergencyProfile,
        registered_biometrics: patient.registeredBiometrics,
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('patients')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase] Patient upsert fallback to local storage:', error.message);
        localStorage.setItem(`patient_${patient.id}`, JSON.stringify(patient));
        return patient;
      }

      return patient;
    } catch (err: any) {
      console.warn('[Supabase] Patient save network fallback:', err.message);
      localStorage.setItem(`patient_${patient.id}`, JSON.stringify(patient));
      return patient;
    }
  }

  /**
   * Fetch Patient by Unique ID or HealthID
   */
  public async getPatient(identifier: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`id.eq.${identifier},health_id.eq.${identifier.toUpperCase()},email.eq.${identifier.toLowerCase()}`)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          healthId: data.health_id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          dob: data.dob,
          gender: data.gender,
          avatarUrl: data.avatar_url || INITIAL_PATIENT.avatarUrl,
          emergencyProfile: data.emergency_profile || INITIAL_PATIENT.emergencyProfile,
          registeredBiometrics: data.registered_biometrics || INITIAL_PATIENT.registeredBiometrics,
        };
      }
    } catch (err) {
      console.warn('[Supabase] Fetch patient fallback:', err);
    }

    // Fallback to local storage or mock data
    const local = localStorage.getItem(`patient_${identifier}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    if (
      identifier.toLowerCase() === INITIAL_PATIENT.id.toLowerCase() || 
      identifier.toUpperCase() === INITIAL_PATIENT.healthId || 
      identifier.toLowerCase() === INITIAL_PATIENT.email.toLowerCase()
    ) {
      return INITIAL_PATIENT;
    }

    return null;
  }

  /**
   * Fetch All Registered Patients (for 1-to-N Biometric Identification Search)
   */
  public async getAllPatients(): Promise<Patient[]> {
    const patientsMap = new Map<string, Patient>();

    // 1. Add baseline initial patient
    patientsMap.set(INITIAL_PATIENT.id, INITIAL_PATIENT);

    // 2. Fetch from Supabase PostgreSQL
    try {
      const { data, error } = await supabase.from('patients').select('*');
      if (data && !error) {
        for (const d of data) {
          patientsMap.set(d.id, {
            id: d.id,
            healthId: d.health_id,
            name: d.name,
            email: d.email,
            phone: d.phone,
            dob: d.dob,
            gender: d.gender,
            avatarUrl: d.avatar_url || INITIAL_PATIENT.avatarUrl,
            emergencyProfile: d.emergency_profile || INITIAL_PATIENT.emergencyProfile,
            registeredBiometrics: d.registered_biometrics || INITIAL_PATIENT.registeredBiometrics,
          });
        }
      }
    } catch (err) {
      console.warn('[Supabase] getAllPatients fallback:', err);
    }

    // 3. Add any localStorage saved patients
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('patient_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const p = JSON.parse(raw);
              if (p && p.id && p.healthId) {
                patientsMap.set(p.id, p);
              }
            } catch {}
          }
        }
      }
    } catch {}

    // 4. Check current session user if patient
    try {
      const sessionUser = localStorage.getItem('heallock_auth_user');
      if (sessionUser) {
        const u = JSON.parse(sessionUser);
        if (u && u.patientData && u.patientData.id) {
          patientsMap.set(u.patientData.id, u.patientData);
        }
      }
    } catch {}

    return Array.from(patientsMap.values());
  }

  /**
   * Fetch Medical Records for Patient
   */
  public async getPatientRecords(patientId: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      if (data && !error && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          patientId: d.patient_id,
          title: d.title,
          category: d.category,
          date: d.date,
          doctorName: d.doctor_name,
          hospitalName: d.hospital_name,
          fileType: d.file_type || 'application/pdf',
          fileUrl: d.file_url,
          storagePath: d.storage_path,
          fileSize: d.file_size,
          sha256Hash: d.sha256_hash,
          isEncrypted: d.is_encrypted ?? true,
          contentEncrypted: d.content_encrypted || '',
          aiExtractedFields: d.ai_extracted_fields || {
            summary: '',
            confidenceScore: 95,
          },
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn('[Supabase] getPatientRecords fallback:', err);
    }

    return INITIAL_RECORDS;
  }

  /**
   * Save Medical Record
   */
  public async addMedicalRecord(patientId: string, record: MedicalRecord): Promise<void> {
    try {
      const payload = {
        id: record.id,
        patient_id: patientId,
        title: record.title,
        category: record.category,
        date: record.date,
        doctor_name: record.doctorName,
        hospital_name: record.hospitalName,
        file_type: record.fileType,
        file_url: record.fileUrl,
        storage_path: record.storagePath,
        file_size: record.fileSize,
        sha256_hash: record.sha256Hash,
        is_encrypted: record.isEncrypted,
        content_encrypted: record.contentEncrypted,
        ai_extracted_fields: record.aiExtractedFields,
      };

      await supabase.from('medical_records').upsert(payload);
    } catch (err) {
      console.warn('[Supabase] addMedicalRecord fallback:', err);
    }
  }

  /**
   * Upload Document Attachment to Supabase Storage Bucket ('medical-records')
   */
  public async uploadRecordAttachment(file: File, path: string): Promise<string> {
    try {
      const { error } = await supabase.storage
        .from('medical-records')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('[Supabase Storage] Upload fallback:', error.message);
        return URL.createObjectURL(file);
      }

      const { data: publicUrlData } = supabase.storage
        .from('medical-records')
        .getPublicUrl(path);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.warn('[Supabase Storage] Upload error:', err.message);
      return URL.createObjectURL(file);
    }
  }

  /**
   * Fetch Active Consents for Patient
   */
  public async getConsents(patientId: string): Promise<ConsentGrant[]> {
    try {
      const { data, error } = await supabase
        .from('consents')
        .select('*')
        .eq('patient_id', patientId);

      if (data && !error && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          patientId: c.patient_id,
          hospitalId: c.hospital_id,
          hospitalName: c.hospital_name,
          scope: c.scope || [],
          grantedAt: c.granted_at,
          expiresAt: c.expires_at,
          status: c.status,
        }));
      }
    } catch (err) {
      console.warn('[Supabase] getConsents fallback:', err);
    }

    return INITIAL_CONSENTS;
  }

  /**
   * Save / Revoke Consent Grant
   */
  public async saveConsent(patientId: string, consent: ConsentGrant): Promise<void> {
    try {
      const payload = {
        id: consent.id,
        patient_id: patientId,
        hospital_id: consent.hospitalId,
        hospital_name: consent.hospitalName,
        scope: consent.scope,
        granted_at: consent.grantedAt,
        expires_at: consent.expiresAt,
        status: consent.status,
      };

      await supabase.from('consents').upsert(payload);
    } catch (err) {
      console.warn('[Supabase] saveConsent fallback:', err);
    }
  }

  /**
   * Append Blockchain Audit Block
   */
  public async appendBlockchainBlock(block: BlockchainBlock): Promise<void> {
    try {
      const payload = {
        block_number: block.blockNumber,
        previous_hash: block.previousHash,
        hash: block.hash,
        merkle_root: block.merkleRoot,
        timestamp: block.timestamp,
        transactions: block.transactions,
        nonce: block.nonce,
      };

      await supabase.from('blockchain_ledger').upsert(payload);
    } catch (err) {
      console.warn('[Supabase] appendBlockchainBlock fallback:', err);
    }
  }

  /**
   * Fetch Full Blockchain Audit Ledger
   */
  public async getBlockchainLedger(): Promise<BlockchainBlock[]> {
    try {
      const { data, error } = await supabase
        .from('blockchain_ledger')
        .select('*')
        .order('block_number', { ascending: true });

      if (data && !error && data.length > 0) {
        return data.map((b: any) => ({
          blockNumber: b.block_number,
          previousHash: b.previous_hash,
          hash: b.hash,
          merkleRoot: b.merkle_root,
          timestamp: b.timestamp,
          transactions: b.transactions || [],
          nonce: b.nonce || 0,
        }));
      }
    } catch (err) {
      console.warn('[Supabase] getBlockchainLedger fallback:', err);
    }

    return INITIAL_BLOCKS;
  }
}

export const supabaseService = new SupabaseService();
