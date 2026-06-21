import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Languages, 
  Mail, 
  Lock, 
  Search, 
  UserCog, 
  Briefcase, 
  AlertCircle,
  RefreshCw,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';

interface SettingsProps {
  profile: UserProfile | null;
  getToken: () => Promise<string | null>;
}

interface UserRecord {
  id: number;
  uid: string;
  email: string;
  role: 'back-office' | 'trader';
  traderId: number | null;
  createdAt: string;
}

export function Settings({ profile, getToken }: SettingsProps) {
  const { t, language, setLanguage } = useLanguage();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccessCode, setUserSuccessCode] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  ];

  const fetchUsers = async () => {
    if (profile?.role !== 'back-office') return;
    setLoadingUsers(true);
    setUserError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setUserError(err.message || 'Could not load system users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [profile]);

  const handleRoleChange = async (userId: number, newRole: 'back-office' | 'trader') => {
    setUserError(null);
    setUserSuccessCode(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Failed to update user role');
      }
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      // Flash success
      setUserSuccessCode(userId);
      setTimeout(() => setUserSuccessCode(null), 3000);
    } catch (err: any) {
      console.error(err);
      setUserError(err.message || 'Failed to change role.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-brand-green" />
          <h2 className="text-3xl font-black text-brand-dark tracking-tight">{t.settings.title}</h2>
        </div>
        {profile?.role === 'back-office' && (
          <button 
            onClick={fetchUsers}
            disabled={loadingUsers}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 rounded-xl font-bold text-xs border border-slate-200/60 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
            Sync Users
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Stack Account & Preferred Languages) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Account Information */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-brand-dark text-lg">{t.settings.account}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                  Full Name
                </label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-700 truncate text-sm">
                    {profile?.email?.toLowerCase() === 'njoroge@biasharasasa.com' ? 'Admin Njoroge' : 'User Member'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                  {t.settings.email}
                </label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-700 truncate text-sm">{profile?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                  {t.settings.role}
                </label>
                <div className="flex items-center gap-3 p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                  <Shield className="w-4 h-4 text-brand-green shrink-0" />
                  <span className="font-black text-brand-green uppercase text-xs tracking-wider">
                    {profile?.role === 'back-office' ? 'Back Office Admin' : 'Trader'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preferences Language */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-brand-dark text-lg">{t.settings.language}</h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    language === lang.id 
                      ? 'bg-brand-blue/5 border-brand-blue/30 scale-[1.02]' 
                      : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className={`font-bold ${language === lang.id ? 'text-brand-dark' : ''}`}>
                      {lang.label}
                    </span>
                  </div>
                  {language === lang.id && (
                    <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column (Dynamic Roles & Access Control or Static Info) */}
        <div className="lg:col-span-2 space-y-6">
          
          {profile?.role === 'back-office' ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <UserCog className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-brand-dark text-lg">System Users & Roles</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">Configure user logins and access rules system-wide.</p>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-brand-green/40 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all text-slate-700"
                  />
                </div>
              </div>

              {/* Status messages info */}
              {userError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-start gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userError}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                {loadingUsers && users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <RefreshCw className="w-8 h-8 text-brand-green animate-spin" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing database registers...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-medium">No registered system users matched your search criteria.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-4">Email Register</th>
                        <th className="pb-4">System Identity</th>
                        <th className="pb-4">Access Role Privilege</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((userRecord) => {
                        const isSelf = userRecord.email.toLowerCase() === profile?.email?.toLowerCase();
                        return (
                          <tr key={userRecord.id} className="text-xs">
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{userRecord.email}</span>
                                <span className="text-[10px] font-medium text-slate-400 font-mono mt-0.5">UID: {userRecord.uid.substring(0, 10)}...</span>
                              </div>
                            </td>
                            <td className="py-4 text-slate-500 font-medium">
                              {userRecord.traderId ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold text-[10px] uppercase border border-blue-100">
                                  <Briefcase className="w-3 h-3" /> Linked Trader
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border border-slate-100">
                                  Platform User
                                </span>
                              )}
                            </td>
                            <td className="py-4">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full font-black uppercase text-[9px] tracking-wider ${
                                  userRecord.role === 'back-office' 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}>
                                  {userRecord.role === 'back-office' ? 'Back-Office Admin' : 'Trader'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              {isSelf ? (
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                  Your Account
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  {userSuccessCode === userRecord.id && (
                                    <motion.span 
                                      initial={{ scale: 0.8 }} 
                                      animate={{ scale: 1 }} 
                                      className="text-brand-green flex items-center gap-1 text-[11px] font-bold mr-2"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Updated
                                    </motion.span>
                                  )}
                                  
                                  <button
                                    onClick={() => handleRoleChange(
                                      userRecord.id, 
                                      userRecord.role === 'back-office' ? 'trader' : 'back-office'
                                    )}
                                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all tracking-wider cursor-pointer ${
                                      userRecord.role === 'back-office'
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                                        : 'bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white border border-brand-green/10'
                                    }`}
                                  >
                                    {userRecord.role === 'back-office' ? 'Revoke Admin' : 'Grant Admin'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-brand-light-green/20 p-8 rounded-[36px] border border-brand-green/10 space-y-4"
            >
              <h3 className="text-xl font-black text-brand-dark flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-green" />
                Empowering Daily Commerce
              </h3>
              <p className="text-slate-600 font-medium leading-relaxed text-sm">
                As a registered trader, you have access to clean, modern Point of Sale tools, automatic inventory counters, low-stock warnings, and historic reports.
              </p>
              <p className="text-slate-500 font-medium leading-relaxed text-xs pt-1">
                Role modifications (such as promotion to back-office coordinator status) are managed strictly by verified administrative managers through authorization keys.
              </p>
            </motion.div>
          )}

          {/* Roles & Permissions Explanation Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="w-16 h-16 rounded-[22px] bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black">{t.settings.rolesManagement}</h3>
              <p className="text-white/60 font-medium text-xs leading-relaxed max-w-2xl">
                {profile?.role === 'back-office' 
                  ? t.settings.adminNote
                  : t.settings.traderNote
                }
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
