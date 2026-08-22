import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  ConsentScope, 
  MedicalRecord, 
  Prescription, 
  AccessEvent, 
  ConsentGrant, 
  EmergencyProfile, 
  Patient,
  AccessRequest, 
  RealtimeNotification 
} from './types';
import { 
  INITIAL_PATIENT, 
  INITIAL_HOSPITALS, 
  INITIAL_STAFF, 
  INITIAL_CONSENTS, 
  INITIAL_ACCESS_EVENTS, 
  INITIAL_RECORDS, 
  INITIAL_PRESCRIPTIONS, 
  INITIAL_TRENDS 
} from './services/mockData';
import { authService, AuthUser } from './services/authService';
import { LandingHomePage } from './components/landing/LandingHomePage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { MyRecordsView } from './components/patient/MyRecordsView';
import { ConsentSettingsView } from './components/patient/ConsentSettingsView';
import { AccountabilityTimelineView } from './components/patient/AccountabilityTimelineView';
import { HealthInsightsView } from './components/patient/HealthInsightsView';
import { SettingsView } from './components/patient/SettingsView';
import { EmergencyProfileModal } from './components/patient/EmergencyProfileModal';
import { ManualRecordUploadModal } from './components/patient/ManualRecordUploadModal';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { PharmacistPortal } from './components/pharmacist/PharmacistPortal';
import { AdminSecurityPortal } from './components/admin/AdminSecurityPortal';
import { BlockchainExplorerModal } from './components/common/BlockchainExplorerModal';
import { DocumentAIScannerModal } from './components/common/DocumentAIScannerModal';
import { NotificationDrawer, NotificationItem } from './components/common/NotificationDrawer';
import { blockchainService } from './services/blockchainService';
import { firebasePatientService } from './services/firebasePatientService';
import { supabaseService } from './services/supabaseService';

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authService.getCurrentUser());

  // Navigation State inside Patient Portal
  const [activePatientTab, setActivePatientTab] = useState<string>('dashboard');

  // Core Real-Time Data State
  const [patient, setPatient] = useState<Patient>(currentUser?.patientData || INITIAL_PATIENT);
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [consents, setConsents] = useState<ConsentGrant[]>(INITIAL_CONSENTS);
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>(INITIAL_ACCESS_EVENTS);
  const [records, setRecords] = useState<MedicalRecord[]>(INITIAL_RECORDS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [trends, setTrends] = useState(INITIAL_TRENDS);

  // Active Role and Active Staff Persona
  const currentRole: UserRole = currentUser?.role || 'patient';
  const activeStaff = currentUser?.staffData || INITIAL_STAFF.find(s => s.role === currentRole) || INITIAL_STAFF[0];

  // Modals State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isManualUploadOpen, setIsManualUploadOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [selectedTxForModal, setSelectedTxForModal] = useState<AccessEvent | null>(null);

  // Real-Time Notification Feed
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([
    {
      id: 'notif-init-1',
      recipientId: 'all',
      type: 'consent',
      title: 'Consent Active: City Care Hospital',
      message: 'Active permissions granted for Lab Reports and Rx History.',
      timestamp: new Date().toISOString(),
      isRead: false,
    },
    {
      id: 'notif-init-2',
      recipientId: 'all',
      type: 'prescription',
      title: 'Prescription Verified Safe',
      message: 'Claude AI and RxNorm verified Lisinopril 10mg maintenance refill.',
      timestamp: new Date().toISOString(),
      isRead: false,
    },
  ]);

  // 1. Auth Subscription
  useEffect(() => {
    const unsubscribe = authService.subscribe(user => {
      setCurrentUser(user);
      if (user?.patientData) {
        setPatient(user.patientData);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Real-Time Firestore Data Synchronization
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: (() => void)[] = [];

    if (currentUser.role === 'patient' && patient?.id) {
      // Seed patient records if brand new
      firebasePatientService.seedPatientRecordsIfEmpty(patient);

      // Profile real-time listener
      unsubs.push(
        firebasePatientService.subscribeToPatientProfile(patient.id, updatedProfile => {
          setPatient(updatedProfile);
        })
      );

      // Records real-time listener
      unsubs.push(
        firebasePatientService.subscribeToPatientRecords(patient.id, liveRecords => {
          setRecords(liveRecords);
        })
      );

      // Consents real-time listener
      unsubs.push(
        firebasePatientService.subscribeToConsents(patient.id, liveConsents => {
          setConsents(liveConsents);
        })
      );

      // Access Requests real-time listener
      unsubs.push(
        firebasePatientService.subscribeToAccessRequestsForPatient(patient.id, liveRequests => {
          setAccessRequests(liveRequests);
        })
      );

      // Prescriptions real-time listener
      unsubs.push(
        firebasePatientService.subscribeToPrescriptions(patient.id, liveRx => {
          setPrescriptions(liveRx);
        })
      );

      // Audit Logs real-time listener
      unsubs.push(
        firebasePatientService.subscribeToAuditLogs(liveEvents => {
          setAccessEvents(liveEvents);
        }, patient.id)
      );

      // Notifications real-time listener
      unsubs.push(
        firebasePatientService.subscribeToNotifications(patient.id, liveNotifs => {
          if (liveNotifs.length > 0) {
            setNotifications(liveNotifs);
          }
        })
      );
    } else if (activeStaff) {
      // Staff / Hospital access requests listener
      unsubs.push(
        firebasePatientService.subscribeToAccessRequestsForHospital(activeStaff.hospitalId, liveRequests => {
          setAccessRequests(liveRequests);
        })
      );

      // Global Audit logs listener
      unsubs.push(
        firebasePatientService.subscribeToAuditLogs(liveEvents => {
          setAccessEvents(liveEvents);
        })
      );

      // Staff Notifications listener
      unsubs.push(
        firebasePatientService.subscribeToNotifications(activeStaff.id, liveNotifs => {
          if (liveNotifs.length > 0) {
            setNotifications(liveNotifs);
          }
        })
      );
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [currentUser?.uid, patient?.id, activeStaff?.hospitalId]);

  // Notification Helper
  const addNotification = async (message: string, type: RealtimeNotification['type'] = 'system') => {
    const newNotif: RealtimeNotification = {
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      recipientId: patient?.id || 'all',
      type,
      title: type === 'emergency' ? '🚨 EMERGENCY ACCESS ALERT' : type === 'access_request' ? '🔑 Access Request Alert' : 'System Notification',
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      smsDispatched: type === 'emergency',
    };
    setNotifications(prev => [newNotif, ...prev]);
    await firebasePatientService.createNotification(newNotif);
  };

  // Auth Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.patientData) {
      setPatient(user.patientData);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  // Consent & Permission Handlers
  const handleToggleConsent = async (consentId: string) => {
    const targetConsent = consents.find(c => c.id === consentId);
    if (!targetConsent) return;

    const newStatus = targetConsent.status === 'active' ? 'revoked' : 'active';
    
    // Log consent update on-chain
    const event = await blockchainService.logEvent({
      patientId: patient.id,
      patientName: patient.name,
      hospitalId: targetConsent.hospitalId,
      hospitalName: targetConsent.hospitalName,
      staffId: 'patient-self',
      staffName: patient.name,
      staffRole: 'Patient',
      accessType: 'normal',
      action: `Consent ${newStatus === 'active' ? 'Re-Activated' : 'Revoked'}`,
      reason: 'Patient self-sovereign consent modification',
    });

    setConsents(prev =>
      prev.map(c => (c.id === consentId ? { ...c, status: newStatus } : c))
    );
    setAccessEvents(prev => [event, ...prev]);
    await firebasePatientService.saveConsentGrant(patient.id, { ...targetConsent, status: newStatus });
    await firebasePatientService.saveAccessEvent(event);
    addNotification(`Consent for ${targetConsent.hospitalName} is now ${newStatus.toUpperCase()}. On-chain tx minted.`, 'consent');
  };

  const handleRevokeAll = async (hospitalId: string) => {
    const targetConsent = consents.find(c => c.hospitalId === hospitalId);
    if (!targetConsent) return;

    const event = await firebasePatientService.revokeConsentGrant(
      patient.id,
      targetConsent.id,
      targetConsent.hospitalId,
      targetConsent.hospitalName,
      patient.name
    );

    setConsents(prev =>
      prev.map(c => (c.hospitalId === hospitalId ? { ...c, status: 'revoked' } : c))
    );
    setAccessEvents(prev => [event, ...prev]);
    addNotification(`All access privileges revoked for ${targetConsent.hospitalName}.`, 'consent');
  };

  const handleUpdateScope = async (consentId: string, newScope: ConsentScope[]) => {
    const targetConsent = consents.find(c => c.id === consentId);
    if (!targetConsent) return;

    const event = await blockchainService.logEvent({
      patientId: patient.id,
      patientName: patient.name,
      hospitalId: targetConsent.hospitalId,
      hospitalName: targetConsent.hospitalName,
      staffId: 'patient-self',
      staffName: patient.name,
      staffRole: 'Patient',
      accessType: 'normal',
      action: `Scoped Categories Updated: [${newScope.join(', ')}]`,
      reason: 'Patient modified granular category permissions',
    });

    setConsents(prev =>
      prev.map(c => (c.id === consentId ? { ...c, scope: newScope } : c))
    );
    setAccessEvents(prev => [event, ...prev]);
    await firebasePatientService.saveConsentGrant(patient.id, { ...targetConsent, scope: newScope });
    await firebasePatientService.saveAccessEvent(event);
    addNotification(`Updated permissions for ${targetConsent.hospitalName} to: ${newScope.join(', ')}`, 'consent');
  };

  const handleGrantNewConsent = async (hospitalId: string, scope: ConsentScope[], expiryMonths: number) => {
    const hosp = hospitals.find(h => h.id === hospitalId);
    if (!hosp) return;

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

    const newGrant: ConsentGrant = {
      id: 'c-' + Math.random().toString(36).substring(2, 7),
      patientId: patient.id,
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      scope,
      grantedAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      status: 'active',
    };

    const event = await blockchainService.logEvent({
      patientId: patient.id,
      patientName: patient.name,
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      staffId: 'patient-self',
      staffName: patient.name,
      staffRole: 'Patient',
      accessType: 'normal',
      action: `Granted New Hospital Consent (Valid ${expiryMonths} Mo)`,
      reason: 'Patient self-sovereign permission grant',
    });

    setConsents(prev => [newGrant, ...prev]);
    setAccessEvents(prev => [event, ...prev]);
    await firebasePatientService.saveConsentGrant(patient.id, newGrant);
    await firebasePatientService.saveAccessEvent(event);
    addNotification(`New on-chain consent granted to ${hosp.name}.`, 'consent');
  };

  // Hospital Access Request Response (Approve / Reject)
  const handleRespondAccessRequest = async (
    request: AccessRequest,
    action: 'approved' | 'rejected',
    grantedScope?: ConsentScope[],
    expiryMonths?: number
  ) => {
    const { consent, event } = await firebasePatientService.respondToAccessRequest(
      request,
      action,
      grantedScope,
      expiryMonths
    );

    if (consent) {
      setConsents(prev => [consent, ...prev.filter(c => c.hospitalId !== consent.hospitalId)]);
    }
    setAccessEvents(prev => [event, ...prev]);
    setAccessRequests(prev => prev.map(r => (r.id === request.id ? { ...r, status: action } : r)));
    addNotification(
      action === 'approved' 
        ? `Approved access request from ${request.hospitalName}.`
        : `Declined access request from ${request.hospitalName}.`,
      'access_request'
    );
  };

  const handleEmergencyLogged = (event: AccessEvent) => {
    setAccessEvents(prev => [event, ...prev]);
  };

  const handlePrescriptionCreated = (rx: Prescription) => {
    setPrescriptions(prev => [rx, ...prev]);
  };

  const handleRecordCreated = (rec: MedicalRecord) => {
    setRecords(prev => [rec, ...prev]);
    addNotification(`Medical record encrypted & stored in Firebase: ${rec.title}`, 'system');
  };

  const handleDeleteRecord = async (recordId: string, storagePath?: string) => {
    await firebasePatientService.deleteMedicalRecord(patient.id, recordId, storagePath);
    setRecords(prev => prev.filter(r => r.id !== recordId));
    addNotification('Record removed from encrypted storage.', 'system');
  };

  const handleUpdateEmergencyProfile = async (updatedProfile: EmergencyProfile) => {
    setPatient(prev => ({ ...prev, emergencyProfile: updatedProfile }));
    await firebasePatientService.updatePatientEmergencyProfile(patient.id, updatedProfile);
    addNotification('Emergency Profile Card updated and synced on-chain.', 'system');
  };

  const handleUpdateBiometrics = async (updatedBiometrics: Patient['registeredBiometrics']) => {
    const updatedPatient: Patient = {
      ...patient,
      avatarUrl: updatedBiometrics.facePhotoUrl || patient.avatarUrl,
      registeredBiometrics: updatedBiometrics,
    };
    setPatient(updatedPatient);

    // Persist to Supabase and Firestore
    await supabaseService.savePatientProfile(updatedPatient);
    await firebasePatientService.savePatientProfile(updatedPatient);

    // Sync auth state if current user is patient
    if (currentUser?.patientData) {
      currentUser.patientData = updatedPatient;
      localStorage.setItem('heallock_auth_user', JSON.stringify(currentUser));
    }

    // Mint on-chain audit block
    const event = await blockchainService.logEvent({
      patientId: patient.id,
      patientName: patient.name,
      hospitalId: 'self-vault',
      hospitalName: 'Patient Sovereign Identity Vault',
      staffId: 'patient-self',
      staffName: patient.name,
      staffRole: 'Patient',
      accessType: 'normal',
      action: 'Biometric Credentials Enrolled (3D Face Mesh / FIDO2 Key)',
      reason: 'Hardware biometric factor registration and zero-knowledge template generation',
    });

    setAccessEvents(prev => [event, ...prev]);
    await firebasePatientService.saveAccessEvent(event);
    addNotification('Biometric credentials registered and verified on-chain.', 'system');
  };

  const handleInspectTx = (event: AccessEvent) => {
    setSelectedTxForModal(event);
    setIsExplorerOpen(true);
  };

  // If not authenticated, render the Landing & Login Home Page
  if (!currentUser) {
    return (
      <LandingHomePage
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans">
      {/* Top Main Navigation Header */}
      <Header
        currentRole={currentRole}
        patient={patient}
        staff={activeStaff}
        unreadNotifsCount={notifications.filter(n => !n.isRead).length}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1">
        {/* Sidebar only shown in Patient Portal mode */}
        {currentRole === 'patient' && (
          <Sidebar
            activeTab={activePatientTab}
            onSelectTab={setActivePatientTab}
            onOpenExplorer={() => {
              setSelectedTxForModal(null);
              setIsExplorerOpen(true);
            }}
          />
        )}

        {/* Main Content Area with Mobile Bottom Clearance */}
        <main className="flex-1 p-3.5 sm:p-8 pb-28 md:pb-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* 1. Patient Portal Views */}
          {currentRole === 'patient' && (
            <>
              {activePatientTab === 'dashboard' && (
                <PatientDashboard
                  patient={patient}
                  consents={consents}
                  accessEvents={accessEvents}
                  records={records}
                  prescriptions={prescriptions}
                  accessRequests={accessRequests}
                  onOpenEmergencyCard={() => setIsEmergencyModalOpen(true)}
                  onNavigateTab={setActivePatientTab}
                  onInspectTx={handleInspectTx}
                  onToggleConsent={handleToggleConsent}
                  onRevokeAll={handleRevokeAll}
                />
              )}

              {activePatientTab === 'records' && (
                <MyRecordsView
                  records={records}
                  prescriptions={prescriptions}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onOpenManualUpload={() => setIsManualUploadOpen(true)}
                  onDeleteRecord={handleDeleteRecord}
                />
              )}

              {activePatientTab === 'consents' && (
                <ConsentSettingsView
                  consents={consents}
                  hospitals={hospitals}
                  accessRequests={accessRequests}
                  onToggleConsent={handleToggleConsent}
                  onUpdateScope={handleUpdateScope}
                  onRevokeConsent={handleRevokeAll}
                  onGrantNewConsent={handleGrantNewConsent}
                  onRespondAccessRequest={handleRespondAccessRequest}
                />
              )}

              {activePatientTab === 'timeline' && (
                <AccountabilityTimelineView
                  events={accessEvents}
                  onInspectTx={handleInspectTx}
                  onOpenExplorer={() => {
                    setSelectedTxForModal(null);
                    setIsExplorerOpen(true);
                  }}
                />
              )}

              {activePatientTab === 'insights' && (
                <HealthInsightsView
                  patient={patient}
                  trends={trends}
                />
              )}

              {activePatientTab === 'settings' && (
                <SettingsView
                  patient={patient}
                  onUpdateBiometrics={handleUpdateBiometrics}
                />
              )}
            </>
          )}

          {/* 2. Doctor Portal (With Embedded Emergency Multi-Factor Unlock) */}
          {currentRole === 'doctor' && (
            <DoctorPortal
              patient={patient}
              staff={activeStaff}
              records={records}
              consents={consents}
              accessRequests={accessRequests}
              onPrescriptionCreated={handlePrescriptionCreated}
              onEmergencyLogged={handleEmergencyLogged}
              onRequestAccessSent={req => setAccessRequests(prev => [req, ...prev])}
              onNotificationSent={(msg, type) => addNotification(msg, type || 'prescription')}
            />
          )}

          {/* 3. Pharmacist Dispensary */}
          {currentRole === 'pharmacist' && (
            <PharmacistPortal
              patient={patient}
              staff={activeStaff}
              prescriptions={prescriptions}
              onDispense={rxId => {
                setPrescriptions(prev =>
                  prev.map(p => (p.id === rxId ? { ...p, status: 'dispensed' } : p))
                );
              }}
              onNotificationSent={msg => addNotification(msg, 'prescription')}
            />
          )}

          {/* 4. Hospital Admin & ML Radar */}
          {currentRole === 'admin' && (
            <AdminSecurityPortal
              staff={activeStaff}
              hospitals={hospitals}
              onOpenExplorer={() => {
                setSelectedTxForModal(null);
                setIsExplorerOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <EmergencyProfileModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        patient={patient}
        onUpdateProfile={handleUpdateEmergencyProfile}
      />

      <ManualRecordUploadModal
        isOpen={isManualUploadOpen}
        onClose={() => setIsManualUploadOpen(false)}
        patient={patient}
        onRecordCreated={handleRecordCreated}
      />

      <BlockchainExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        selectedEvent={selectedTxForModal}
      />

      <DocumentAIScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        patient={patient}
        onRecordCreated={handleRecordCreated}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          if (currentUser?.uid) {
            firebasePatientService.markAllNotificationsAsRead(currentUser.uid);
          }
        }}
        onNavigateToRequests={() => {
          setActivePatientTab('consents');
        }}
      />
    </div>
  );
}

export default App;
