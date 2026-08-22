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
import { authService, AuthUser, DetailedRegistrationData } from '../../services/authService';
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

  // Doctor / Staff Detailed Registration Fields
  const [medicalLicense, setMedicalLicense] = useState('MD-84920-CA');
  const [hospitalName, setHospitalName] = useState('City Care Hospital');
  const [department, setDepartment] = useState('Cardiology & Critical Care');

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
      title: 'Doctor & ER',
      desc: 'Clinical EHR, AI Rx engine & unlock',
      icon: Stethoscope,
      accentColor: 'border-indigo-500 bg-indigo-50/70 text-indigo-900',
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

  const handleQuickDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    setAuthError(null);
    setSelectedRole(role);
    try {
      let demoEmail = '';
      if (role === 'patient') demoEmail = INITIAL_PATIENT.email;
      else if (role === 'doctor') demoEmail = 'dr.thorne@metrohealth.org';
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
    <div className="min-h-screen bg-gradient-to-b from-[#f0f4f9] via-[#f8fafc] to-[#e2e8f0] text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 fill-white text-blue-600" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">HealLock</span>
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                Healthcare Security & Audit Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg font-mono">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Firebase Connected</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start flex-1">
        {/* Left Column: Platform Narrative */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Health Intelligence · Blockchain Audit · Cryptographic Control</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-[1.2]">
            Real-Time Patient Health Records & Cryptographic Consent
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed">
            Create your account with complete clinical details or sign in to your role-specific dashboard. Every medical record is client-encrypted off-chain with AES-256 and immutably audited on the blockchain ledger.
          </p>

          {/* 4 Core Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                1. Patient Control
              </span>
              <p className="text-[11px] text-slate-500">Granular consent scoping & 1-click revocation.</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                2. Minimum Necessary
              </span>
              <p className="text-[11px] text-slate-500">Emergency unseals vital card only.</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0" />
                3. Doctor Emergency
              </span>
              <p className="text-[11px] text-slate-500">QR / Face / Fingerprint single-factor unlock.</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                4. On-Chain Audit
              </span>
              <p className="text-[11px] text-slate-500">SHA-256 Merkle tree consensus verification.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Comprehensive Registration & Login Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            {/* Form Header Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {authMode === 'login' ? 'Sign In to HealLock' : 'Create Real Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {authMode === 'login'
                    ? 'Enter your credentials to access your active portal'
                    : 'Fill in your full clinical profile to initialize your on-chain health record'}
                </p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    authMode === 'register' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Instant 1-Click Demo Role Switcher */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Instant Demo 1-Click Access</span>
                </span>
                <span className="text-[10px] text-blue-600 font-mono">Pre-seeded Mock Data</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('patient')}
                  className="px-2.5 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1 text-center"
                >
                  <User className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('doctor')}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1 text-center"
                >
                  <Stethoscope className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate">Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('pharmacist')}
                  className="px-2.5 py-1.5 bg-white hover:bg-teal-600 hover:text-white text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1 text-center"
                >
                  <Pill className="w-3 h-3 text-teal-600 shrink-0" />
                  <span className="truncate">Pharmacist</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1 text-center"
                >
                  <ShieldCheck className="w-3 h-3 text-slate-700 shrink-0" />
                  <span className="truncate">Admin</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {authError}
              </div>
            )}

            {/* Hardware Biometrics Quick Sign-In Option in Login Mode */}
            {authMode === 'login' && (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 shadow-md transition-all cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-amber-400" />
                  <span>Sign In with Hardware Biometrics (Touch ID / Windows Hello / Passkey)</span>
                </button>
                <div className="flex items-center gap-2 text-slate-400 my-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">or sign in with password</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </div>
            )}

            {/* Role Selector */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Select Your Role
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {roleConfigs.map(item => {
                  const Icon = item.icon;
                  const isSelected = selectedRole === item.role;

                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedRole(item.role)}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? `${item.accentColor} shadow-xs font-bold`
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-current' : 'text-slate-500'}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <div className="font-bold text-xs">{item.title}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real-time Comprehensive Form */}
            <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
              {/* Common Account Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {authMode === 'register' && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Olivia Chen, Dr. Rajesh Sharma, MD"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter secure password (6+ characters)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Patient Detailed Registration Section */}
              {authMode === 'register' && selectedRole === 'patient' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Patient Health & Emergency Profile Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Gender</label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={e => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/50 font-black text-rose-700 focus:ring-2 focus:ring-rose-500"
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
                      <label className="font-bold text-slate-700">Contact Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+1 (555) 234-5678"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Primary Emergency Contact (Notified in Level-1 Access)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">Contact Name</label>
                        <input
                          type="text"
                          value={emergencyContactName}
                          onChange={e => setEmergencyContactName(e.target.value)}
                          placeholder="e.g. David Chen"
                          className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">Relation</label>
                        <input
                          type="text"
                          value={emergencyContactRelation}
                          onChange={e => setEmergencyContactRelation(e.target.value)}
                          placeholder="e.g. Spouse / Parent"
                          className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">Phone</label>
                        <input
                          type="tel"
                          value={emergencyContactPhone}
                          onChange={e => setEmergencyContactPhone(e.target.value)}
                          placeholder="+1 (555) 892-3491"
                          className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Allergies & Critical Meds */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-rose-700">Known Allergies (Comma-separated)</label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={e => setAllergies(e.target.value)}
                        placeholder="e.g. Penicillin, Peanuts, Sulfa"
                        className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50/30 font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-amber-800">Critical Medications</label>
                      <input
                        type="text"
                        value={criticalMeds}
                        onChange={e => setCriticalMeds(e.target.value)}
                        placeholder="e.g. Lisinopril 10mg, Metformin"
                        className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/30 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor Detailed Registration Section */}
              {authMode === 'register' && selectedRole === 'doctor' && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                    <span>Physician Credentials & Hospital Affiliation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Medical License Number *</label>
                      <input
                        type="text"
                        required
                        value={medicalLicense}
                        onChange={e => setMedicalLicense(e.target.value)}
                        placeholder="e.g. MD-84920-CA"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Hospital / Facility Name *</label>
                      <input
                        type="text"
                        required
                        value={hospitalName}
                        onChange={e => setHospitalName(e.target.value)}
                        placeholder="e.g. City Care Hospital"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-700">Department / Specialization</label>
                      <input
                        type="text"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        placeholder="e.g. Cardiology, Emergency Medicine"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pharmacist Detailed Registration Section */}
              {authMode === 'register' && selectedRole === 'pharmacist' && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>Pharmacist Credentials & Pharmacy Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Pharmacy License / Reg No *</label>
                      <input
                        type="text"
                        required
                        value={pharmacyLicense}
                        onChange={e => setPharmacyLicense(e.target.value)}
                        placeholder="e.g. RPH-94102"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Dispensary / Pharmacy Name *</label>
                      <input
                        type="text"
                        required
                        value={pharmacyName}
                        onChange={e => setPharmacyName(e.target.value)}
                        placeholder="e.g. Metro Community Pharmacy"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Detailed Registration Section */}
              {authMode === 'register' && selectedRole === 'admin' && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    <span>Hospital Administrator Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Admin Clearance ID *</label>
                      <input
                        type="text"
                        required
                        value={adminId}
                        onChange={e => setAdminId(e.target.value)}
                        placeholder="e.g. ADM-NODE-01"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Hospital Network Name *</label>
                      <input
                        type="text"
                        required
                        value={hospitalName}
                        onChange={e => setHospitalName(e.target.value)}
                        placeholder="e.g. City Care Hospital Network"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating & Initializing Profile...</span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? `Sign In as ${selectedRole.toUpperCase()}` : `Create & Register ${selectedRole.toUpperCase()} Account`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">HealLock Platform</span>
            <span>·</span>
            <span>Zero raw medical data on-chain · Client-side AES-256 field encryption</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Firebase Auth & Cloud Firestore
          </span>
        </div>
      </footer>
    </div>
  );
};
