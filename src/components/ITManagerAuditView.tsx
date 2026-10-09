import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Clock,
  Mail,
  UserCheck,
  RefreshCw,
  Eye,
  Calendar,
  Lock,
  MessageSquare
} from 'lucide-react';
import { AuditLog, StudentAccountRecord } from '../types';

interface ITManagerAuditViewProps {
  logs: AuditLog[];
  studentAccounts: StudentAccountRecord[];
  onRefresh?: () => void;
  onOpenViewershipSheet?: () => void;
  onOpenPasswordLogSheet?: () => void;
  uniqueAccountsSawAnnouncements?: number;
}

export const ITManagerAuditView: React.FC<ITManagerAuditViewProps> = ({
  logs,
  studentAccounts,
  onRefresh,
  onOpenViewershipSheet,
  onOpenPasswordLogSheet,
  uniqueAccountsSawAnnouncements
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all_logs' | 'sign_in_out' | 'restricted' | 'student_accounts' | 'posts_tests'>('all_logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'RESTRICTED'>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filter logs based on active subtab, search query, and status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Subtab filter
      if (activeSubTab === 'sign_in_out') {
        if (log.eventType !== 'SIGN_IN_SUCCESS' && log.eventType !== 'SIGN_OUT') return false;
      } else if (activeSubTab === 'restricted') {
        if (log.eventType !== 'SIGN_IN_RESTRICTED' && log.status !== 'RESTRICTED') return false;
      } else if (activeSubTab === 'student_accounts') {
        if (log.eventType !== 'STUDENT_ACCOUNT_CREATED') return false;
      } else if (activeSubTab === 'posts_tests') {
        if (log.eventType !== 'ANNOUNCEMENT_POSTED' && log.eventType !== 'TEST_SCHEDULED') return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && log.status !== statusFilter) {
        return false;
      }

      // Search query (matches email, name, role, reason, details)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEmail = log.email?.toLowerCase().includes(q);
        const matchesName = log.name?.toLowerCase().includes(q);
        const matchesRole = log.role?.toLowerCase().includes(q);
        const matchesClass = log.schoolClass?.toLowerCase().includes(q);
        const matchesReason = log.reason?.toLowerCase().includes(q);
        const matchesDetails = log.details?.toLowerCase().includes(q);
        return matchesEmail || matchesName || matchesRole || matchesClass || matchesReason || matchesDetails;
      }

      return true;
    });
  }, [logs, activeSubTab, statusFilter, searchQuery]);

  // Summary counts
  const stats = useMemo(() => {
    const total = logs.length;
    const signIns = logs.filter(l => l.eventType === 'SIGN_IN_SUCCESS').length;
    const restricted = logs.filter(l => l.eventType === 'SIGN_IN_RESTRICTED' || l.status === 'RESTRICTED').length;
    const signOuts = logs.filter(l => l.eventType === 'SIGN_OUT').length;
    const studentCreated = logs.filter(l => l.eventType === 'STUDENT_ACCOUNT_CREATED').length;
    const posts = logs.filter(l => l.eventType === 'ANNOUNCEMENT_POSTED').length;
    return { total, signIns, restricted, signOuts, studentCreated, posts };
  }, [logs]);

  // Export to CSV spreadsheet function
  const handleExportCSV = () => {
    const headers = ["Timestamp", "Event Type", "Status", "Real Email Account", "User Full Name", "Role", "Class", "Restriction Reason / Notes", "Activity Details"];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.eventType}"`,
      `"${l.status}"`,
      `"${l.email}"`,
      `"${l.name}"`,
      `"${l.role}"`,
      `"${l.schoolClass || '-'}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `usap_it_security_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Privileged IT Security Console • Confidential</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              IT Manager Master Audit Spreadsheet
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 font-medium max-w-2xl">
              Real-time audit log of authentic email accounts, live user sign-ins, sign-outs, restricted login attempts, new student accounts created, and posted announcements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenPasswordLogSheet && (
              <button
                onClick={onOpenPasswordLogSheet}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-950/40 transition flex items-center gap-2 border border-amber-400/40"
                title="Open encrypted accounts & password log sheet (IT security passkey)"
              >
                <Lock className="w-4 h-4 text-amber-200" />
                <span>Master Password Log</span>
              </button>
            )}
            {onOpenViewershipSheet && (
              <button
                onClick={onOpenViewershipSheet}
                className="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-purple-950/40 transition flex items-center gap-2 border border-purple-400/30"
                title="Open announcement viewership spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Announcement Viewership ({uniqueAccountsSawAnnouncements || 0})</span>
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5"
                title="Refresh logs"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Spreadsheet (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-purple-300 block">Total Audited Events</span>
            <span className="text-2xl font-black text-white">{stats.total}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Successful Sign Ins</span>
            <span className="text-2xl font-black text-emerald-400">{stats.signIns}</span>
          </div>
          <div className="bg-rose-500/20 backdrop-blur-sm rounded-2xl p-3 border border-rose-500/30">
            <span className="text-[10px] uppercase font-bold text-rose-300 block">Restricted / Denied</span>
            <span className="text-2xl font-black text-rose-300">{stats.restricted}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">Sign Outs</span>
            <span className="text-2xl font-black text-sky-400">{stats.signOuts}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Students Registered</span>
            <span className="text-2xl font-black text-amber-300">{stats.studentCreated}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-purple-300 block">Notices Broadcasted</span>
            <span className="text-2xl font-black text-purple-300">{stats.posts}</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Control Bar */}
      <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Subtabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('all_logs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                activeSubTab === 'all_logs'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Activity Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('sign_in_out')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                activeSubTab === 'sign_in_out'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In & Out Logs
            </button>
            <button
              onClick={() => setActiveSubTab('restricted')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                activeSubTab === 'restricted'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Restricted / Blocked Attempts ({stats.restricted})
            </button>
            <button
              onClick={() => setActiveSubTab('student_accounts')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                activeSubTab === 'student_accounts'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Accounts Created ({stats.studentCreated})
            </button>
            <button
              onClick={() => setActiveSubTab('posts_tests')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                activeSubTab === 'posts_tests'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Announcements & Tests Activities
            </button>
            {onOpenViewershipSheet && (
              <button
                type="button"
                onClick={onOpenViewershipSheet}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                title="View audited sheet of accounts who saw announcements"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Viewership Sheet ({uniqueAccountsSawAnnouncements || 0})</span>
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Only Successful</option>
              <option value="RESTRICTED">Only Restricted / Blocked</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by authentic email address, user name, role, class, or restriction reason..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="bg-white border border-purple-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Audit Data Grid • {filteredLogs.length} Records Shown
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Visible exclusively to IT Manager (Sburathequestionman@USAP)
          </span>
        </div>

        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 sticky top-0 z-10 text-[11px] uppercase font-black text-slate-700 tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Exact Time (Timestamp)</th>
                <th className="py-3 px-4">Activity / Event</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Real Email Account</th>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Account Role</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Restriction Reason / Action Details</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLogs.map((log) => {
                const isRestricted = log.status === 'RESTRICTED' || log.eventType === 'SIGN_IN_RESTRICTED';
                const isSignIn = log.eventType === 'SIGN_IN_SUCCESS';
                const isSignOut = log.eventType === 'SIGN_OUT';
                const isStudentCreated = log.eventType === 'STUDENT_ACCOUNT_CREATED';

                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-purple-50/50 transition-colors ${
                      isRestricted ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    {/* Exact Time */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Activity / Event */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-[11px] ${
                        isRestricted
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isSignIn
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isSignOut
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : isStudentCreated
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {isRestricted && <XCircle className="w-3 h-3 text-rose-600" />}
                        {isSignIn && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {isSignOut && <Clock className="w-3 h-3 text-slate-600" />}
                        {isStudentCreated && <UserCheck className="w-3 h-3 text-amber-600" />}
                        <span>{log.eventType.replace(/_/g, ' ')}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-300 font-black'
                      }`}>
                        {log.status}
                      </span>
                    </td>

                    {/* Real Email Account */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-purple-950 font-extrabold">{log.email}</span>
                      </div>
                    </td>

                    {/* User Name */}
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {log.name || 'Unknown'}
                    </td>

                    {/* Account Role */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-extrabold text-[11px] border border-purple-200">
                        {log.role}
                      </span>
                    </td>

                    {/* Class */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-semibold">
                      {log.schoolClass || '—'}
                    </td>

                    {/* Reason / Details */}
                    <td className="py-3 px-4 max-w-xs text-xs">
                      {isRestricted ? (
                        <div className="text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200">
                          {log.reason || 'Restricted: Unauthorized attempt'}
                        </div>
                      ) : (
                        <div className="text-slate-600 truncate font-normal">
                          {log.details || log.reason || 'Standard verified operation'}
                        </div>
                      )}
                    </td>

                    {/* Inspect button */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 rounded-lg transition"
                        title="View Full Entry"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                    No activity logs found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Student Accounts Detailed Table */}
      {studentAccounts && studentAccounts.length > 0 && (
        <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Registered Student Directory ({studentAccounts.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verified student accounts created through SBURA THE QUESTION MAN email verification
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Active Student Registry
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-purple-50/70 text-[11px] uppercase font-black text-purple-950 border-b border-purple-200">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">School Email Account</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Date & Time Account Created</th>
                  <th className="py-2.5 px-3">Verification Dispatcher</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 font-medium">
                {studentAccounts.map((std, idx) => (
                  <tr key={std.userId || idx} className="hover:bg-purple-50/40">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{std.name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-900">{std.email}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{std.schoolClass}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{formatTimestamp(std.createdAt)}</td>
                    <td className="py-2.5 px-3 font-extrabold text-purple-700">{std.verifiedBy || "SBURA THE QUESTION MAN"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">Audit Entry Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Exact Timestamp</span>
                <span className="font-mono font-bold text-slate-900">{formatTimestamp(selectedLog.timestamp)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Event Type</span>
                  <span className="font-extrabold text-purple-700">{selectedLog.eventType}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Security Status</span>
                  <span className={`font-black ${selectedLog.status === 'RESTRICTED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Real Email Account</span>
                <span className="font-mono font-black text-purple-950 select-all">{selectedLog.email}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">User Name</span>
                  <span className="font-bold text-slate-900">{selectedLog.name}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Role & Class</span>
                  <span className="font-bold text-slate-900">{selectedLog.role} {selectedLog.schoolClass ? `(${selectedLog.schoolClass})` : ''}</span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block mb-0.5">Restriction Reason</span>
                  <p className="text-xs text-rose-900 font-semibold">{selectedLog.reason}</p>
                </div>
              )}

              {selectedLog.details && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-purple-900 block mb-0.5">Activity Details</span>
                  <p className="text-xs text-purple-950 font-medium">{selectedLog.details}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
