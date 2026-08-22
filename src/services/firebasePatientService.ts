import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  MedicalRecord, 
  ConsentGrant, 
  AccessEvent, 
  Prescription, 
  Patient, 
  AccessRequest, 
  RealtimeNotification, 
  EmergencyProfile, 
  ConsentScope 
} from '../types';
import { 
  INITIAL_RECORDS, 
  INITIAL_CONSENTS, 
  INITIAL_ACCESS_EVENTS, 
  INITIAL_PRESCRIPTIONS, 
  INITIAL_PATIENT, 
  INITIAL_STAFF 
} from './mockData';
import { firebaseStorageService } from './firebaseStorageService';
import { blockchainService } from './blockchainService';
import { supabaseService } from './supabaseService';

export class FirebasePatientService {
  /* =========================================================================
   * 1. REAL-TIME SUBSCRIPTIONS
   * ========================================================================= */

  /**
   * Real-time Patient Profile subscription
   */
  public subscribeToPatientProfile(
    patientId: string,
    callback: (patient: Patient) => void
  ): () => void {
    if (!patientId) return () => {};

    try {
      const patientDocRef = doc(db, 'patients', patientId);
      const unsubscribe = onSnapshot(
        patientDocRef,
        docSnap => {
          if (docSnap.exists()) {
            callback(docSnap.data() as Patient);
          }
        },
        err => {
          console.warn('[Firestore Real-Time] Patient profile fallback mode:', err.message);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('[Firestore] Profile listener subscription exception:', e);
      return () => {};
    }
  }

  /**
   * Real-time Patient Medical Records subscription
   */
  public subscribeToPatientRecords(
    patientId: string,
    callback: (records: MedicalRecord[]) => void
  ): () => void {
    if (!patientId) return () => {};

    try {
      const recordsCol = collection(db, `patients/${patientId}/records`);
      const unsubscribe = onSnapshot(
        recordsCol,
        snapshot => {
          if (!snapshot.empty) {
            const records = snapshot.docs.map(d => d.data() as MedicalRecord);
            callback(records);
          }
        },
        err => {
          console.warn('[Firestore Real-Time] Records fallback mode:', err.message);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('[Firestore] Records subscription exception:', e);
      return () => {};
    }
  }

  /**
   * Real-time Consent Grants subscription
   */
  public subscribeToConsents(
    patientId: string,
    callback: (consents: ConsentGrant[]) => void
  ): () => void {
    if (!patientId) return () => {};

    try {
      const consentsCol = collection(db, `patients/${patientId}/consents`);
      const unsubscribe = onSnapshot(
        consentsCol,
        snapshot => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => d.data() as ConsentGrant);
            callback(list);
          }
        },
        err => {
          console.warn('[Firestore Real-Time] Consents fallback mode:', err.message);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('[Firestore] Consents subscription exception:', e);
      return () => {};
    }
  }

  /**
   * Real-time Hospital Access Requests for Patient
   */
  public subscribeToAccessRequestsForPatient(
    patientId: string,
    callback: (requests: AccessRequest[]) => void
  ): () => void {
    if (!patientId) return () => {};

    try {
      const q = query(
        collection(db, 'access_requests'),
        where('patientId', '==', patientId)
      );

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const requests = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as AccessRequest[];
          callback(requests);
        },
        err => {
          console.warn('[Firestore Real-Time] Access requests fallback mode:', err.message);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('[Firestore] Access requests subscription exception:', e);
      return () => {};
    }
  }

  /**
   * Real-time Hospital Access Requests for Hospital / Doctor
   */
  public subscribeToAccessRequestsForHospital(
    hospitalId: string,
    callback: (requests: AccessRequest[]) => void
  ): () => void {
    if (!hospitalId) return () => {};

    try {
      const q = query(
        collection(db, 'access_requests'),
        where('hospitalId', '==', hospitalId)
      );

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const requests = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as AccessRequest[];
          callback(requests);
        },
        err => {
          console.warn('[Firestore Real-Time] Hospital access requests fallback:', err.message);
        }
      );
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  }

  /**
   * Real-time Prescriptions subscription
   */
  public subscribeToPrescriptions(
    patientId: string,
    callback: (prescriptions: Prescription[]) => void
  ): () => void {
    if (!patientId) return () => {};

    try {
      const rxCol = collection(db, `patients/${patientId}/prescriptions`);
      const unsubscribe = onSnapshot(
        rxCol,
        snapshot => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => d.data() as Prescription);
            callback(list);
          }
        },
        err => {
          console.warn('[Firestore Real-Time] Prescriptions fallback mode:', err.message);
        }
      );
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  }

  /**
   * Real-time Blockchain Audit Event Logs subscription
   */
  public subscribeToAuditLogs(
    callback: (events: AccessEvent[]) => void,
    patientId?: string
  ): () => void {
    try {
      const logsCol = collection(db, 'access_audit_logs');
      const unsubscribe = onSnapshot(
        logsCol,
        snapshot => {
          if (!snapshot.empty) {
            let events = snapshot.docs.map(d => d.data() as AccessEvent);
            if (patientId) {
              events = events.filter(e => e.patientId === patientId);
            }
            events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(events);
          }
        },
        err => {
          console.warn('[Firestore Real-Time] Audit logs fallback mode:', err.message);
        }
      );
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  }

  /**
   * Real-time Notifications subscription for a user
   */
  public subscribeToNotifications(
    userId: string,
    callback: (notifications: RealtimeNotification[]) => void
  ): () => void {
    if (!userId) return () => {};

    try {
      const notifsCol = collection(db, 'notifications');
      const unsubscribe = onSnapshot(
        notifsCol,
        snapshot => {
          if (!snapshot.empty) {
            const notifs = snapshot.docs
              .map(d => ({ id: d.id, ...d.data() }) as RealtimeNotification)
              .filter(n => n.recipientId === userId || n.recipientId === 'all');
            notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(notifs);
          }
        },
        err => {
          console.warn('[Firestore Real-Time] Notifications fallback mode:', err.message);
        }
      );
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  }

  /* =========================================================================
   * 2. CRUD & MUTATION OPERATIONS
   * ========================================================================= */

  /**
   * Save Patient Profile
   */
  public async savePatientProfile(patient: Patient): Promise<void> {
    try {
      // 1. Supabase PostgreSQL Persistence
      await supabaseService.savePatient(patient);

      // 2. Firestore Sync
      const patientDocRef = doc(db, 'patients', patient.id);
      await setDoc(patientDocRef, {
        ...patient,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('[Storage Sync] Profile save fallback:', err);
    }
  }

  /**
   * Update Patient Emergency Profile
   */
  public async updatePatientEmergencyProfile(patientId: string, profile: EmergencyProfile): Promise<void> {
    try {
      const patientDocRef = doc(db, 'patients', patientId);
      await updateDoc(patientDocRef, {
        emergencyProfile: profile,
        'registeredBiometrics.lastUpdated': new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.warn('[Firestore] Emergency profile update fallback:', err);
    }
  }

  /**
   * Save Medical Record (Metadata in Firestore, File in Storage)
   */
  public async saveMedicalRecord(patientId: string, record: MedicalRecord): Promise<void> {
    try {
      const recordDocRef = doc(db, `patients/${patientId}/records`, record.id);
      await setDoc(recordDocRef, {
        ...record,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Medical record save fallback:', err);
    }
  }

  /**
   * Delete Medical Record from Firestore & Firebase Storage
   */
  public async deleteMedicalRecord(patientId: string, recordId: string, storagePath?: string): Promise<void> {
    try {
      const recordDocRef = doc(db, `patients/${patientId}/records`, recordId);
      await deleteDoc(recordDocRef);

      if (storagePath) {
        await firebaseStorageService.deleteMedicalDocument(storagePath);
      }
    } catch (err) {
      console.warn('[Firestore] Delete medical record fallback:', err);
    }
  }

  /**
   * Save Consent Grant
   */
  public async saveConsentGrant(patientId: string, consent: ConsentGrant): Promise<void> {
    try {
      const consentDocRef = doc(db, `patients/${patientId}/consents`, consent.id);
      await setDoc(consentDocRef, {
        ...consent,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Consent grant save fallback:', err);
    }
  }

  /**
   * Revoke Consent Grant
   */
  public async revokeConsentGrant(
    patientId: string,
    consentId: string,
    hospitalId: string,
    hospitalName: string,
    patientName: string
  ): Promise<AccessEvent> {
    try {
      const consentDocRef = doc(db, `patients/${patientId}/consents`, consentId);
      await updateDoc(consentDocRef, {
        status: 'revoked',
        revokedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Consent revocation fallback:', err);
    }

    // Log on-chain
    const event = await blockchainService.logEvent({
      patientId,
      patientName,
      hospitalId,
      hospitalName,
      staffId: 'patient-self',
      staffName: patientName,
      staffRole: 'Patient',
      accessType: 'normal',
      action: `Revoked Hospital Consent for ${hospitalName}`,
      reason: 'Patient self-sovereign revocation of permissions',
    });

    await this.saveAccessEvent(event);

    // Notify Hospital / Staff
    await this.createNotification({
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      recipientId: hospitalId,
      type: 'consent',
      title: 'Consent Access Revoked',
      message: `${patientName} has revoked clinical data access permissions for ${hospitalName}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
    });

    return event;
  }

  /**
   * Create Hospital Access Request (Hospital -> Patient)
   */
  public async createAccessRequest(request: AccessRequest): Promise<void> {
    try {
      const reqDocRef = doc(db, 'access_requests', request.id);
      await setDoc(reqDocRef, {
        ...request,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send real-time notification to patient
      await this.createNotification({
        id: 'notif-' + Math.random().toString(36).substring(2, 9),
        recipientId: request.patientId,
        type: 'access_request',
        title: `Access Request from ${request.hospitalName}`,
        message: `${request.doctorName} requested permission for [${request.requestedScope.join(', ')}]. Reason: "${request.reason}".`,
        timestamp: new Date().toISOString(),
        isRead: false,
        metadata: { requestId: request.id },
      });
    } catch (err) {
      console.warn('[Firestore] Create access request fallback:', err);
    }
  }

  /**
   * Respond to Hospital Access Request (Patient approves or rejects)
   */
  public async respondToAccessRequest(
    request: AccessRequest,
    action: 'approved' | 'rejected',
    grantedScope?: ConsentScope[],
    expiryMonths = 12
  ): Promise<{ consent?: ConsentGrant; event: AccessEvent }> {
    const finalScope = grantedScope || request.requestedScope;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

    try {
      const reqDocRef = doc(db, 'access_requests', request.id);
      await updateDoc(reqDocRef, {
        status: action,
        grantedScope: action === 'approved' ? finalScope : undefined,
        expiryDate: action === 'approved' ? expiryDate.toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Update access request fallback:', err);
    }

    let newConsent: ConsentGrant | undefined;

    if (action === 'approved') {
      newConsent = {
        id: 'c-' + Math.random().toString(36).substring(2, 8),
        patientId: request.patientId,
        hospitalId: request.hospitalId,
        hospitalName: request.hospitalName,
        scope: finalScope,
        grantedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        status: 'active',
      };
      await this.saveConsentGrant(request.patientId, newConsent);
    }

    // On-Chain Event
    const event = await blockchainService.logEvent({
      patientId: request.patientId,
      patientName: request.patientName,
      hospitalId: request.hospitalId,
      hospitalName: request.hospitalName,
      staffId: request.doctorId,
      staffName: request.doctorName,
      staffRole: 'Doctor',
      accessType: 'normal',
      action: action === 'approved' ? `Patient Approved Access Request ([${finalScope.join(', ')}])` : `Patient Rejected Access Request`,
      reason: `Response to request: "${request.reason}"`,
    });
    await this.saveAccessEvent(event);

    // Notify Hospital
    await this.createNotification({
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      recipientId: request.hospitalId,
      type: 'access_request',
      title: action === 'approved' ? `Access Granted by ${request.patientName}` : `Access Request Declined`,
      message: action === 'approved' 
        ? `${request.patientName} granted access for [${finalScope.join(', ')}] until ${expiryDate.toLocaleDateString()}.`
        : `${request.patientName} declined the access request for ${request.hospitalName}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
    });

    return { consent: newConsent, event };
  }

  /**
   * Save Prescription
   */
  public async savePrescription(patientId: string, prescription: Prescription): Promise<void> {
    try {
      const rxDocRef = doc(db, `patients/${patientId}/prescriptions`, prescription.id);
      await setDoc(rxDocRef, {
        ...prescription,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Prescription save fallback:', err);
    }
  }

  /**
   * Update Prescription Status (e.g. Pharmacist Dispensed)
   */
  public async updatePrescriptionStatus(
    patientId: string,
    rxId: string,
    status: Prescription['status']
  ): Promise<void> {
    try {
      const rxDocRef = doc(db, `patients/${patientId}/prescriptions`, rxId);
      await updateDoc(rxDocRef, { status });
    } catch (err) {
      console.warn('[Firestore] Prescription update fallback:', err);
    }
  }

  /**
   * Save an On-Chain Access Event
   */
  public async saveAccessEvent(event: AccessEvent): Promise<void> {
    try {
      const eventDocRef = doc(db, 'access_audit_logs', event.id);
      await setDoc(eventDocRef, {
        ...event,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Access event save fallback:', err);
    }
  }

  /**
   * Query Patient by Health ID (e.g. HL-1894-4321) or Email
   */
  public async queryPatientByHealthId(identifier: string): Promise<Patient | null> {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return null;

    // 1. First priority: Query Supabase PostgreSQL Database
    try {
      const supabasePatient = await supabaseService.getPatient(clean);
      if (supabasePatient) {
        return supabasePatient;
      }
    } catch (sbErr) {
      console.warn('[Supabase] Patient lookup fallback:', sbErr);
    }

    try {
      // 2. Search Firestore by healthId
      const qHealthId = query(collection(db, 'patients'), where('healthId', '==', identifier.trim().toUpperCase()));
      const snap1 = await getDocs(qHealthId);
      if (!snap1.empty) {
        return snap1.docs[0].data() as Patient;
      }

      // 3. Search Firestore by email
      const qEmail = query(collection(db, 'patients'), where('email', '==', clean));
      const snap2 = await getDocs(qEmail);
      if (!snap2.empty) {
        return snap2.docs[0].data() as Patient;
      }

      // 4. Search Firestore by doc ID
      const docRef = doc(db, 'patients', identifier.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Patient;
      }
    } catch (e) {
      console.warn('[Firestore] Patient query fallback:', e);
    }

    // Fallback: If identifier matches INITIAL_PATIENT
    if (clean === INITIAL_PATIENT.healthId.toLowerCase() || clean === INITIAL_PATIENT.email.toLowerCase() || clean === 'olivia' || clean.includes('1894')) {
      return INITIAL_PATIENT;
    }

    return null;
  }

  /**
   * Create Real-Time Notification
   */
  public async createNotification(notification: RealtimeNotification): Promise<void> {
    try {
      const notifDocRef = doc(db, 'notifications', notification.id);
      await setDoc(notifDocRef, {
        ...notification,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Firestore] Notification save fallback:', e);
    }
  }

  /**
   * Mark notification as read
   */
  public async markNotificationAsRead(notifId: string): Promise<void> {
    try {
      const notifDocRef = doc(db, 'notifications', notifId);
      await updateDoc(notifDocRef, { isRead: true });
    } catch (e) {}
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const notifsCol = collection(db, 'notifications');
      const snapshot = await getDocs(notifsCol);
      const updates = snapshot.docs
        .filter(d => d.data().recipientId === userId || d.data().recipientId === 'all')
        .map(d => updateDoc(doc(db, 'notifications', d.id), { isRead: true }));
      await Promise.all(updates);
    } catch (e) {}
  }

  /**
   * Helper: Seed Initial Patient & Hospital Records to Firestore if newly registered
   */
  public async seedPatientRecordsIfEmpty(patient: Patient): Promise<void> {
    try {
      const recordsCol = collection(db, `patients/${patient.id}/records`);
      const snapshot = await getDocs(recordsCol);
      if (snapshot.empty) {
        // Save initial seed records
        const seedPromises = INITIAL_RECORDS.map(r => 
          setDoc(doc(db, `patients/${patient.id}/records`, r.id), { ...r, patientId: patient.id })
        );
        const consentPromises = INITIAL_CONSENTS.map(c =>
          setDoc(doc(db, `patients/${patient.id}/consents`, c.id), { ...c, patientId: patient.id })
        );
        const rxPromises = INITIAL_PRESCRIPTIONS.map(rx =>
          setDoc(doc(db, `patients/${patient.id}/prescriptions`, rx.id), { ...rx, patientId: patient.id })
        );
        await Promise.all([...seedPromises, ...consentPromises, ...rxPromises]);
      }
    } catch (e) {
      console.warn('[Firestore] Seed records fallback:', e);
    }
  }
}

export const firebasePatientService = new FirebasePatientService();
