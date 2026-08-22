import React, { useState } from 'react';
import { 
  Shield, 
  Stethoscope, 
  Pill, 
  ShieldCheck, 
  User, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Eye, 
  EyeOff, 
  Flame, 
  Phone,
  Heart,
  Calendar,
  AlertTriangle,
  Building2,
  FileText,
  Fingerprint,
  ScanFace,
  KeyRound,
  Zap
} from 'lucide-react';
import { UserRole } from '../../types';
import { authService, AuthUser, DetailedRegistrationData, REGISTERED_HOSPITALS_CREDENTIALS, RegisteredHospitalCredential } from '../../services/authService';
import { INITIAL_PATIENT } from '../../services/mockData';
import confetti from 'canvas-confetti';

interface LandingHomePageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LandingHomePage: React.FC<LandingHomePageProps> = ({
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  
  // Basic Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedHospitalPreset, setSelectedHospitalPreset] = useState<string>('HOSP-CITYCARE-84910');

  // Patient Detailed Registration Fields
  const [dob, setDob] = useState('1996-05-14');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [emergencyContactName, setEmergencyContactName] = useState('David Chen');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+1 (555) 892-3491');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Spouse');
  const [allergies, setAllergies] = useState('Penicillin, Peanuts');
  const [criticalMeds, setCriticalMeds] = useState('Lisinopril 10mg');
  const [conditions, setConditions] = useState('Hypertension');

  // Hospital / Doctor Detailed Registration Fields
  const [medicalLicense, setMedicalLicense] = useState('MD-84910');
  const [hospitalName, setHospitalName] = useState('City Care Multi-Specialty Hospital');
  const [department, setDepartment] = useState('Cardiology & Emergency EHR');

  // Pharmacist Detailed Registration Fields
  const [pharmacyLicense, setPharmacyLicense] = useState('RPH-94102');
  const [pharmacyName, setPharmacyName] = useState('Metro Community Pharmacy');

  // Admin Detailed Registration Fields
  const [adminId, setAdminId] = useState('ADM-NODE-01');

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const roleConfigs = [
    {
      role: 'patient' as UserRole,
      title: 'Patient',
      desc: 'Self-sovereign consent & encrypted records',
      icon: User,
      accentColor: 'border-blue-500 bg-blue-50/70 text-blue-900',
    },
    {
      role: 'doctor' as UserRole,
      title: 'Hospital & ER',
      desc: 'Hospital EHR node, attending doctor & emergency bypass',
      icon: Building2,
      accentColor: 'border-[#C85A3B] bg-[#FFF9F2] text-[#2B2521]',
    },
    {
      role: 'pharmacist' as UserRole,
      title: 'Pharmacist',
      desc: 'Rx verification & fulfillment',
      icon: Pill,
      accentColor: 'border-teal-500 bg-teal-50/70 text-teal-900',
    },
    {
      role: 'admin' as UserRole,
      title: 'Admin & ML',
      desc: 'Node registry & anomaly radar',
      icon: ShieldCheck,
      accentColor: 'border-slate-800 bg-slate-100 text-slate-900',
    },
  ];

  const handleSelectHospitalPreset = (hosp: RegisteredHospitalCredential) => {
    setSelectedHospitalPreset(hosp.hospitalId);
    setEmail(hosp.hospitalId);
    setPassword('DemoRolePassword123!');
    setHospitalName(hosp.name);
    setDepartment(hosp.department);
    setMedicalLicense(hosp.badgeNumber);
    setFullName(hosp.attendingDoctor);
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    setAuthError(null);
    setSelectedRole(role);
    try {
      let demoEmail = '';
      if (role === 'patient') demoEmail = INITIAL_PATIENT.email;
      else if (role === 'doctor') demoEmail = 'HOSP-CITYCARE-84910';
      else if (role === 'pharmacist') demoEmail = 'elena.rostova@apothecary.net';
      else demoEmail = 'marcus.vance@saintjude.org';

      const user = await authService.login({
        email: demoEmail,
        password: 'DemoRolePassword123!',
        role,
      });
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      onLoginSuccess(user);
    } catch (err: any) {
      setAuthError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await authService.loginWithBiometrics(selectedRole);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      onLoginSuccess(user);
    } catch (err: any) {
      setAuthError(err.message || 'Biometric authentication failed or cancelled');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      let user: AuthUser;
      if (authMode === 'login') {
        if (!email || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        user = await authService.login({
          email,
          password,
          role: selectedRole,
        });
      } else {
        if (!fullName || !email || !password) {
          throw new Error('Please fill in all required registration fields.');
        }
        const regData: DetailedRegistrationData = {
          name: fullName,
          email,
          password,
          role: selectedRole,
          dob,
          gender,
          bloodGroup,
          phone,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelation,
          allergies,
          criticalMeds,
          conditions,
          medicalLicense,
          hospitalName,
          department,
          pharmacyLicense,
          pharmacyName,
          adminId,
        };
        user = await authService.registerDetailed(regData);
      }
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      onLoginSuccess(user);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2521] flex flex-col justify-between selection:bg-[#C85A3B] selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E1D5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#2B2521] flex items-center justify-center text-[#FAF7F2] shadow-xs border border-[#3E352F]">
              <Shield className="w-5 h-5 fill-[#C85A3B] text-[#C85A3B]" />
            </div>
            <span className="text-xl font-black text-[#2B2521] tracking-tight">HealLock</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#EDF5F0] text-[#2D6346] border border-[#C4DFC5] text-xs font-bold rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#2D6346] animate-pulse" />
              <span>Sovereign Security Active</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Column: Clean Platform Narrative */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E8E1D5] text-[#C85A3B] text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C85A3B]" />
            <span>Private · Sovereign · Emergency Ready</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2B2521] tracking-tight leading-[1.15]">
            Your Health Records, Truly in Your Hands.
          </h1>

          <p className="text-[#63594F] text-sm sm:text-base leading-relaxed">
            Patient-controlled medical identity and cryptographic audit ledger. Share only what you approve with doctors, with instant emergency bypass when every second counts.
          </p>

          {/* 3 Clean Minimal Pillars */}
          <div className="space-y-3 pt-2">
            <div className="p-4 bg-white rounded-2xl border border-[#E8E1D5] shadow-xs flex items-center gap-3.5">
              <div className="p-2.5 bg-[#EDF5F0] text-[#2D6346] rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#2B2521]">1. Patient-Controlled Consent</h4>
                <p className="text-xs text-[#82786D]">Granular scoping and 1-click revocation across all hospitals.</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E8E1D5] shadow-xs flex items-center gap-3.5">
              <div className="p-2.5 bg-[#FDF2F0] text-[#BA3B3B] rounded-xl shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#2B2521]">2. Emergency Multi-Factor Unlock</h4>
                <p className="text-xs text-[#82786D]">Instant biometric or QR unsealing for critical life-saving vitals.</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E8E1D5] shadow-xs flex items-center gap-3.5">
              <div className="p-2.5 bg-[#FAF7F2] text-[#C85A3B] rounded-xl shrink-0 border border-[#E8DEC8]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#2B2521]">3. Immutable Audit Ledger</h4>
                <p className="text-xs text-[#82786D]">Every single doctor and hospital record access is recorded on-chain.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean & Simple Sign In Card */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-7 sm:p-10 border border-[#E8E1D5] shadow-xl space-y-6">
            {/* Form Header Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D5]">
              <div>
                <h2 className="text-xl font-black text-[#2B2521]">
                  {authMode === 'login' ? 'Sign In to Portal' : 'Create Account'}
                </h2>
                <p className="text-xs text-[#82786D] mt-0.5">
                  {authMode === 'login'
                    ? 'Select your role and enter your credentials'
                    : 'Fill in your details to initialize your sovereign health record'}
                </p>
              </div>

              <div className="flex bg-[#FAF7F2] p-1 rounded-2xl border border-[#E8E1D5] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-[#2B2521] text-white shadow-xs font-bold' : 'text-[#63594F] hover:text-[#2B2521]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    authMode === 'register' ? 'bg-[#2B2521] text-white shadow-xs font-bold' : 'text-[#63594F] hover:text-[#2B2521]'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-4 rounded-2xl bg-[#FDF2F0] border border-[#F5C7C1] text-[#962828] text-xs font-semibold">
                {authError}
              </div>
            )}

            {/* Clean Role Selector (No cluttered truncated text) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#63594F] uppercase tracking-wider">
                Select Your Role:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {roleConfigs.map(item => {
                  const Icon = item.icon;
                  const isSelected = selectedRole === item.role;

                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedRole(item.role)}
                      className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'border-[#C85A3B] bg-[#FDF8F5] text-[#2B2521] shadow-xs font-black'
                          : 'border-[#E8E1D5] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#63594F]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-[#C85A3B]' : 'text-[#82786D]'}`} />
                      <div className="font-bold text-xs">{item.title}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hospital Facility Preset Quick Selector */}
            {selectedRole === 'doctor' && authMode === 'login' && (
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DEC8] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#2B2521] text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#C85A3B]" />
                    <span>Registered Hospital Facilities & Login IDs</span>
                  </div>
                  <span className="text-[10px] text-[#82786D] font-mono">1-Click Quick Fill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {REGISTERED_HOSPITALS_CREDENTIALS.map(hosp => {
                    const isSelected = selectedHospitalPreset === hosp.hospitalId || email.toLowerCase() === hosp.hospitalId.toLowerCase();
                    return (
                      <button
                        key={hosp.hospitalId}
                        type="button"
                        onClick={() => handleSelectHospitalPreset(hosp)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                          isSelected
                            ? 'bg-white border-[#C85A3B] shadow-xs ring-1 ring-[#C85A3B]'
                            : 'bg-white/80 border-[#E8E1D5] hover:border-[#C85A3B]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[#2B2521] text-xs line-clamp-1">{hosp.name}</div>
                          <div className="text-[10px] font-mono font-bold text-[#C85A3B] mt-0.5">
                            ID: {hosp.hospitalId}
                          </div>
                        </div>
                        <div className="text-[10px] text-[#63594F] flex items-center justify-between border-t border-[#E8E1D5]/60 pt-1">
                          <span>{hosp.attendingDoctor}</span>
                          <span className="font-mono text-[#82786D]">{hosp.code}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real-time Clean Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Common Account Fields */}
              <div className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#2B2521]">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Olivia Chen, Dr. Rajesh Sharma, MD"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E8E1D5] bg-[#FAF7F2] font-semibold text-[#2B2521] placeholder-[#82786D] focus:ring-2 focus:ring-[#C85A3B] focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B2521]">
                    {selectedRole === 'doctor' ? 'Hospital ID or Facility Email *' : 'Email Address *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'doctor'
                        ? 'e.g. HOSP-CITYCARE-84910 or doctor@citycare.com'
                        : 'e.g. yourname@example.com'
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8E1D5] bg-[#FAF7F2] font-semibold text-[#2B2521] placeholder-[#82786D] focus:ring-2 focus:ring-[#C85A3B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#2B2521]">Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-[#82786D] hover:text-[#2B2521] flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter secure password (6+ characters)..."
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8E1D5] bg-[#FAF7F2] font-mono text-[#2B2521] placeholder-[#82786D] focus:ring-2 focus:ring-[#C85A3B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Patient Detailed Registration Section */}
              {authMode === 'register' && selectedRole === 'patient' && (
                <div className="space-y-4 pt-4 border-t border-[#E8E1D5]">
                  <div className="font-bold text-[#2B2521] text-xs flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#BA3B3B]" />
                    <span>Patient Emergency Profile Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] text-[#2B2521] font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Gender</label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] text-[#2B2521] font-semibold"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={e => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#F5C7C1] bg-[#FDF2F0] font-black text-[#BA3B3B]"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <label className="font-bold text-[#63594F]">Contact Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+1 (555) 234-5678"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] font-semibold"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-3">
                    <div className="font-bold text-[#2B2521] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C85A3B]" />
                      <span>Primary Emergency Contact</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#82786D]">Contact Name</label>
                        <input
                          type="text"
                          value={emergencyContactName}
                          onChange={e => setEmergencyContactName(e.target.value)}
                          placeholder="e.g. David Chen"
                          className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#E8E1D5] font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#82786D]">Relation</label>
                        <input
                          type="text"
                          value={emergencyContactRelation}
                          onChange={e => setEmergencyContactRelation(e.target.value)}
                          placeholder="e.g. Spouse"
                          className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#E8E1D5] font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#82786D]">Phone</label>
                        <input
                          type="tel"
                          value={emergencyContactPhone}
                          onChange={e => setEmergencyContactPhone(e.target.value)}
                          placeholder="+1 (555) 892-3491"
                          className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#E8E1D5] font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Allergies & Critical Meds */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[#BA3B3B]">Known Allergies</label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={e => setAllergies(e.target.value)}
                        placeholder="e.g. Penicillin, Peanuts"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#F5C7C1] bg-[#FDF2F0] font-semibold text-[#2B2521]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#7A402A]">Critical Medications</label>
                      <input
                        type="text"
                        value={criticalMeds}
                        onChange={e => setCriticalMeds(e.target.value)}
                        placeholder="e.g. Lisinopril 10mg"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8DEC8] bg-[#FAF7F2] font-semibold text-[#2B2521]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Hospital Organization Registration */}
              {authMode === 'register' && selectedRole === 'doctor' && (
                <div className="space-y-3 pt-3 border-t border-[#E8E1D5]">
                  <div className="font-bold text-[#2B2521] text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#C85A3B]" />
                    <span>Hospital Facility & Clinical EHR Node Registration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-[#63594F]">Hospital / Healthcare Facility Name *</label>
                      <input
                        type="text"
                        required
                        value={hospitalName}
                        onChange={e => setHospitalName(e.target.value)}
                        placeholder="e.g. City Care Multi-Specialty Hospital"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Medical License / Registry ID *</label>
                      <input
                        type="text"
                        required
                        value={medicalLicense}
                        onChange={e => setMedicalLicense(e.target.value)}
                        placeholder="e.g. MD-84910 or HOSP-REG-01"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Clinical Department *</label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        placeholder="e.g. Cardiology & Emergency EHR"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pharmacist Registration */}
              {authMode === 'register' && selectedRole === 'pharmacist' && (
                <div className="space-y-3 pt-3 border-t border-[#E8E1D5]">
                  <div className="font-bold text-[#2B2521] text-xs flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-[#2D6346]" />
                    <span>Pharmacist Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Pharmacy License *</label>
                      <input
                        type="text"
                        required
                        value={pharmacyLicense}
                        onChange={e => setPharmacyLicense(e.target.value)}
                        placeholder="e.g. RPH-94102"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Dispensary Name *</label>
                      <input
                        type="text"
                        required
                        value={pharmacyName}
                        onChange={e => setPharmacyName(e.target.value)}
                        placeholder="e.g. Metro Pharmacy"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Registration */}
              {authMode === 'register' && selectedRole === 'admin' && (
                <div className="space-y-3 pt-3 border-t border-[#E8E1D5]">
                  <div className="font-bold text-[#2B2521] text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2B2521]" />
                    <span>Administrator Clearance</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Admin Clearance ID *</label>
                      <input
                        type="text"
                        required
                        value={adminId}
                        onChange={e => setAdminId(e.target.value)}
                        placeholder="e.g. ADM-NODE-01"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#63594F]">Hospital Network *</label>
                      <input
                        type="text"
                        required
                        value={hospitalName}
                        onChange={e => setHospitalName(e.target.value)}
                        placeholder="e.g. City Care Network"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-[#2B2521] hover:bg-[#3D352E] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer mt-4"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      {authMode === 'login'
                        ? selectedRole === 'doctor'
                          ? 'Sign In as HOSPITAL & CLINICAL EHR'
                          : `Sign In as ${selectedRole.toUpperCase()}`
                        : 'Create & Register Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Hardware Biometrics Button */}
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#2B2521] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-[#E8E1D5] transition-all cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-[#C85A3B]" />
                  <span>Sign In with Face / Fingerprint / Passkey</span>
                </button>
              )}

              {/* Quick Demo 1-Click Pills */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-[#82786D] mb-2 font-medium">Quick 1-Click Demo Login:</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(['patient', 'doctor', 'pharmacist', 'admin'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickDemoLogin(role)}
                      className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#2B2521] rounded-xl border border-[#E8E1D5] text-[11px] font-bold transition-colors cursor-pointer capitalize"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-[#E8E1D5] py-4 px-6 text-center text-xs text-[#82786D]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2B2521]">HealLock Platform</span>
            <span>·</span>
            <span>Client-side AES-256 encrypted · Sovereign on-chain ledger</span>
          </div>
          <span className="text-[11px] text-[#82786D] font-mono">
            Powered by Supabase & WebAuthn
          </span>
        </div>
      </footer>
    </div>
  );
};
