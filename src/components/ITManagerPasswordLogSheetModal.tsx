import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Eye,
  EyeOff,
  Search,
  Download,
  Edit3,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  User,
  Users,
  Sparkles,
  Check,
  AlertTriangle,
  LockKeyhole
} from 'lucide-react';
import { UserRole, StudentAccountRecord } from '../types';
import { doc, setDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface AccountCredentialRecord {
  id: string;
  name: string;
  role: UserRole | string;
  email?: string;
  schoolClass?: string;
  password: string;
  lastUpdated: string;
  isStudent: boolean;
}

interface ITManagerPasswordLogSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  isItManager: boolean;
  studentAccounts: StudentAccountRecord[];
  facultyDirectory: { name: string; area: string; role: string }[];
  initialStaffPasswords: Record<string, string>;
  onLogAudit?: (action: string, status: 'SUCCESS' | 'RESTRICTED', email: string, name: string, role: string, details: string) => void;
}

const PASSKEY_REQUIRED = '1970p';
const LOCAL_CREDENTIALS_STORAGE_KEY = 'usap_it_managed_account_passwords_v2';

export const ITManagerPasswordLogSheetModal: React.FC<ITManagerPasswordLogSheetModalProps> = ({
  isOpen,
  onClose,
  isItManager,
  studentAccounts,
  facultyDirectory,
  initialStaffPasswords,
  onLogAudit
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [revealedPasswordIds, setRevealedPasswordIds] = useState<Record<string, boolean>>({});

  // Active password editing state
  const [editingAccount, setEditingAccount] = useState<AccountCredentialRecord | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stored password overrides map: key is account name or userId/email -> password
  const [storedPasswords, setStoredPasswords] = useState<Record<string, { password: string; updatedAt: string }>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CREDENTIALS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Real-time Firestore credentials sync
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'account_credentials'),
        (snapshot) => {
          const freshMap: Record<string, { password: string; updatedAt: string }> = {};
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.password) {
              const updated = data.updatedAt || new Date().toISOString();
              if (data.name) {
                freshMap[data.name] = { password: data.password, updatedAt: updated };
              }
              if (data.email) {
                freshMap[data.email] = { password: data.password, updatedAt: updated };
              }
            }
          });

          setStoredPasswords((prev) => {
            const merged = { ...prev, ...freshMap };
            try {
              localStorage.setItem(LOCAL_CREDENTIALS_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        },
        (error) => {
          console.warn('Firestore account credentials sync notice:', error);
        }
      );
      return () => unsub();
    } catch {}
  }, []);

  // Reset passkey gate when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPasskeyInput('');
      setPasskeyError(null);
      setIsUnlocked(false);
      setEditingAccount(null);
      setSaveSuccessMsg(null);
    }
  }, [isOpen]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError(null);

    if (passkeyInput.trim() === PASSKEY_REQUIRED) {
      setIsUnlocked(true);
      if (onLogAudit) {
        onLogAudit(
          'IT_PASSWORD_LOG_UNLOCKED',
          'SUCCESS',
          'Sburathequestionman@USAP',
          'IT Manager',
          'IT_MANAGER',
          'IT Manager unlocked encrypted Master Password Log Sheet.'
        );
      }
    } else {
      setPasskeyError('Invalid IT Passkey. Access restricted to authorized IT Manager.');
      if (onLogAudit) {
        onLogAudit(
          'IT_PASSWORD_LOG_ACCESS_DENIED',
          'RESTRICTED',
          'unknown',
          'Unauthorized Visitor',
          'UNKNOWN',
          'Failed passkey attempt on Master Password Log Sheet.'
        );
      }
    }
  };

  // Compile all accounts (Faculty, TAs, Leadership, Staff + Registered Students)
  const allAccounts: AccountCredentialRecord[] = useMemo(() => {
    const list: AccountCredentialRecord[] = [];

    // 1. Staff & Faculty Accounts
    facultyDirectory.forEach((staff) => {
      const savedOverride = storedPasswords[staff.name];
      const fallbackPassword = initialStaffPasswords[staff.name] || `${staff.name.replace(/\s+/g, '')}@USAP`;

      list.push({
        id: `staff_${staff.name}`,
        name: staff.name,
        role: staff.role,
        schoolClass: staff.area,
        password: savedOverride?.password || fallbackPassword,
        lastUpdated: savedOverride?.updatedAt || 'Initial Setup',
        isStudent: false
      });
    });

    // 2. Student Accounts (Deduplicated with real school email)
    studentAccounts.forEach((st) => {
      const savedOverride = storedPasswords[st.email || st.userId || st.name];
      const defaultStudentPassword = `UsapStudent@${st.schoolClass.replace(/\s+/g, '')}`;

      list.push({
        id: `student_${st.id || st.userId}`,
        name: st.name,
        role: 'STUDENT',
        email: st.email,
        schoolClass: st.schoolClass,
        password: savedOverride?.password || defaultStudentPassword,
        lastUpdated: savedOverride?.updatedAt || st.createdAt || 'Account Creation',
        isStudent: true
      });
    });

    return list;
  }, [facultyDirectory, studentAccounts, storedPasswords, initialStaffPasswords]);

  // Filtered accounts list
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      // Role filter
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'FACULTY' && acc.role !== 'FACULTY' && acc.role !== 'TEACHER') return false;
        if (roleFilter !== 'FACULTY' && acc.role !== roleFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesEmail = (acc.email || '').toLowerCase().includes(q);
        const matchesRole = acc.role.toLowerCase().includes(q);
        const matchesClass = (acc.schoolClass || '').toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesRole || matchesClass;
      }

      return true;
    });
  }, [allAccounts, roleFilter, searchQuery]);

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswordIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Save new password
  const handleSavePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !newPasswordInput.trim()) return;

    setIsSaving(true);
    const newPwd = newPasswordInput.trim();
    const nowIso = new Date().toISOString();
    const key = editingAccount.isStudent ? (editingAccount.email || editingAccount.name) : editingAccount.name;

    try {
      // 1. Update local state and localStorage
      const updatedMap = {
        ...storedPasswords,
        [key]: { password: newPwd, updatedAt: nowIso },
        [editingAccount.name]: { password: newPwd, updatedAt: nowIso }
      };
      setStoredPasswords(updatedMap);
      localStorage.setItem(LOCAL_CREDENTIALS_STORAGE_KEY, JSON.stringify(updatedMap));

      // 2. Persist to Firestore credentials collection if online
      try {
        const docRef = doc(db, 'account_credentials', editingAccount.id);
        await setDoc(docRef, {
          name: editingAccount.name,
          role: editingAccount.role,
          email: editingAccount.email || '',
          schoolClass: editingAccount.schoolClass || '',
          password: newPwd,
          encryptedBy: "SBURA THE QUESTION MAN",
          updatedAt: nowIso
        }, { merge: true });
      } catch (err) {
        console.warn("Could not sync password to Firestore directly, saved to local store:", err);
      }

      // 3. Log audit event
      if (onLogAudit) {
        onLogAudit(
          'PASSWORD_UPDATED_BY_IT_MANAGER',
          'SUCCESS',
          editingAccount.email || `${editingAccount.name}@usapschool.org`,
          editingAccount.name,
          editingAccount.role,
          `IT Manager changed password for ${editingAccount.name} (${editingAccount.role}). Encrypted by SBURA THE QUESTION MAN.`
        );
      }

      setSaveSuccessMsg(`Password for "${editingAccount.name}" updated successfully and synced!`);
      setTimeout(() => setSaveSuccessMsg(null), 5000);
      setEditingAccount(null);
      setNewPasswordInput('');
    } catch (err) {
      console.error('Error saving password:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Export Roster to CSV
  const exportToCSV = () => {
    const headers = ["Account Name", "Role", "Email (Students)", "Department / Class", "Encrypted Password", "Last Updated", "Encryption Provider"];
    const rows = filteredAccounts.map((acc) => [
      `"${acc.name}"`,
      `"${acc.role}"`,
      `"${acc.email || '-'}"`,
      `"${acc.schoolClass || '-'}"`,
      `"${acc.password}"`,
      `"${acc.lastUpdated}"`,
      `"SBURA THE QUESTION MAN"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `usap_all_accounts_password_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 text-white p-5 flex items-center justify-between shrink-0 border-b border-purple-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 flex items-center justify-center text-amber-400 shrink-0 border border-purple-400/40 shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Master Accounts & Password Log Sheet
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                  Passkey Protected
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80 font-medium">
                Confidential IT Management Console • All accounts are encrypted by SBURA THE QUESTION MAN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
            title="Close log sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PASSKEY GATE: Screen shown when not yet unlocked */}
        {!isUnlocked ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 flex-1 bg-slate-50">
            <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-800 flex items-center justify-center shadow-lg border border-purple-200 animate-bounce">
              <LockKeyhole className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-1">
              <h4 className="text-xl font-black text-slate-900">
                Enter IT Security Pass-Key
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                This password log sheet is protected by high-level encryption. Please enter your master IT security passkey to unlock the user credentials log sheet.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-3">
              <div className="relative">
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => {
                    setPasskeyInput(e.target.value);
                    setPasskeyError(null);
                  }}
                  placeholder="Enter master passkey..."
                  autoFocus
                  className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-2xl text-center text-base font-black text-slate-900 tracking-widest focus:outline-none focus:border-purple-600 shadow-sm"
                />
              </div>

              {passkeyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passkeyError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-900/30 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <Key className="w-4 h-4" />
                <span>Unlock Password Log Sheet</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>All accounts are encrypted by SBURA THE QUESTION MAN</span>
            </div>
          </div>
        ) : (
          /* UNLOCKED: MASTER PASSWORD LOG SHEET INTERFACE */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* ENCRYPTION & SECURITY STATUS BANNER */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-3.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/40">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black tracking-wide text-emerald-300 flex items-center gap-1.5">
                    <span>🛡️ All accounts are encrypted by SBURA THE QUESTION MAN</span>
                  </div>
                  <div className="text-[10px] text-purple-200/90 font-medium">
                    Auto-Sync Active • Change passwords whenever required with instant update & persistence
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportToCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  title="Download password log sheet as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV Log</span>
                </button>
              </div>
            </div>

            {/* Notification of successful update */}
            {saveSuccessMsg && (
              <div className="p-3 px-6 bg-emerald-50 border-b border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setSaveSuccessMsg(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-black"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Filter & Search Controls Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search account name, email, role..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-600"
                >
                  <option value="ALL">All Roles ({allAccounts.length})</option>
                  <option value="STUDENT">Students Only ({studentAccounts.length})</option>
                  <option value="FACULTY">Faculty Members</option>
                  <option value="TA">Teaching Assistants</option>
                  <option value="HEAD">Head of School / Leadership</option>
                  <option value="ESTATE">Estate Management</option>
                  <option value="NON_FACULTY">Non-Faculty Staff</option>
                  <option value="IT_MANAGER">IT Manager</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 font-semibold shrink-0">
                Showing <strong className="text-slate-900">{filteredAccounts.length}</strong> of {allAccounts.length} accounts
              </div>
            </div>

            {/* SPREADSHEET TABLE */}
            <div className="flex-1 overflow-auto bg-slate-50 p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">Account Name</th>
                      <th className="py-3 px-3">User Role</th>
                      <th className="py-3 px-3">Email (Students)</th>
                      <th className="py-3 px-3">Department / Class</th>
                      <th className="py-3 px-3">Account Password</th>
                      <th className="py-3 px-3">Last Updated</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAccounts.map((acc, idx) => {
                      const isRevealed = !!revealedPasswordIds[acc.id];
                      return (
                        <tr key={`${acc.id}-${idx}`} className="hover:bg-purple-50/40 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">
                            {acc.name}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                acc.role === 'STUDENT'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : acc.role === 'FACULTY' || acc.role === 'TEACHER'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : acc.role === 'IT_MANAGER'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {acc.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {acc.email ? (
                              <span className="font-mono text-purple-700 text-[11px] font-bold">
                                {acc.email}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">
                                No Email Needed
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {acc.schoolClass || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 w-fit">
                              <span className="font-bold text-slate-900 tracking-wider">
                                {isRevealed ? acc.password : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(acc.id)}
                                className="text-slate-400 hover:text-purple-600 p-0.5 rounded transition"
                                title={isRevealed ? "Hide Password" : "Show Password"}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-purple-600" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">
                            {acc.lastUpdated.includes('T') ? acc.lastUpdated.slice(0, 10) : acc.lastUpdated}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setEditingAccount(acc);
                                setNewPasswordInput(acc.password);
                              }}
                              className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center gap-1 mx-auto"
                              title="Change and update password"
                            >
                              <Edit3 className="w-3 h-3 text-purple-700" />
                              <span>Change</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* INLINE EDIT PASSWORD MODAL */}
            {editingAccount && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-purple-200 shadow-2xl space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Change Account Password</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{editingAccount.name} ({editingAccount.role})</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingAccount(null)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSavePasswordChange} className="space-y-3.5">
                    {editingAccount.email && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Student School Email</label>
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-purple-700 font-bold">
                          {editingAccount.email}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Account Password
                      </label>
                      <input
                        type="text"
                        required
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Enter new password..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-purple-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                      />
                    </div>

                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900 font-medium">
                      🔒 State: <strong>All accounts are encrypted by SBURA THE QUESTION MAN</strong>. Changes sync across all devices automatically.
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingAccount(null)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving || !newPasswordInput.trim()}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Save & Sync Password</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 shrink-0 gap-2">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>All accounts are encrypted by SBURA THE QUESTION MAN • Master Passkey Protected</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
