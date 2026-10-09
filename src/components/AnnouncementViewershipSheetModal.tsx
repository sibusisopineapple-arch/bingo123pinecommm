import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Users,
  Eye,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAnnouncementViews, AnnouncementViewRecord } from '../utils/announcementViewTracker';
import { UserSession } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession | null;
}

export const AnnouncementViewershipSheetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  session
}) => {
  const isItManager = session?.role === 'IT_MANAGER';
  const { viewRecords, uniqueAccountsCount, viewsByAnnouncement, isLoading, exportToCSV } =
    useAnnouncementViews(isItManager);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Filtered viewership records
  const filteredRecords = useMemo(() => {
    return viewRecords.filter((record) => {
      // Announcement filter
      if (selectedAnnouncementId !== 'ALL' && record.announcementId !== selectedAnnouncementId) {
        return false;
      }

      // Role filter
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'FACULTY' || roleFilter === 'TEACHER') {
          if (record.userRole !== 'FACULTY' && record.userRole !== 'TEACHER') return false;
        } else if (record.userRole !== roleFilter) {
          return false;
        }
      }

      // Search query (name, email, class, snippet)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = record.userName.toLowerCase().includes(q);
        const matchesEmail = (record.userEmail || '').toLowerCase().includes(q);
        const matchesClass = (record.schoolClass || '').toLowerCase().includes(q);
        const matchesSnippet = (record.announcementSnippet || '').toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesClass || matchesSnippet;
      }

      return true;
    });
  }, [viewRecords, selectedAnnouncementId, roleFilter, searchQuery]);

  // Strictly only visible to IT Manager
  if (!isOpen || !isItManager) return null;

  const announcementIds = Object.keys(viewsByAnnouncement);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 border border-white/10 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Announcement Readership & Viewership Sheet
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider">
                  IT Manager Only
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80 font-medium">
                Audited list of accounts who saw campus announcements with computed readership counts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={viewRecords.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
              title="Download spreadsheet as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
              title="Close sheet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Metric Cards: Computed Number of Accounts Who Saw Announcements */}
        <div className="p-4 sm:p-5 bg-purple-50/50 border-b border-purple-100 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* COMPUTED STAT 1: Unique Accounts */}
            <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-purple-900">
                <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Total Accounts Who Saw</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                  Computed
                </span>
              </div>
              <div className="text-3xl font-black text-purple-950">
                {uniqueAccountsCount}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Distinct user accounts confirmed to have seen the announcements.
              </p>
            </div>

            {/* COMPUTED STAT 2: Total View Events */}
            <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-indigo-900">
                <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Total Read Receipts</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                  Live
                </span>
              </div>
              <div className="text-3xl font-black text-indigo-950">
                {viewRecords.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Total announcement views recorded across all posts.
              </p>
            </div>

            {/* COMPUTED STAT 3: Active Announcements Tracked */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-emerald-900">
                <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Announcements Tracked</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  Active
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-950">
                {announcementIds.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Number of announcements actively logged with readership.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account name, email, or class..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600 focus:bg-white"
              />
            </div>

            {/* Filter by Announcement */}
            <select
              value={selectedAnnouncementId}
              onChange={(e) => setSelectedAnnouncementId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-600"
            >
              <option value="ALL">All Announcements ({viewRecords.length})</option>
              {announcementIds.map((id) => (
                <option key={id} value={id}>
                  Post #{id.slice(0, 6)} ({viewsByAnnouncement[id]?.count} accounts) — {viewsByAnnouncement[id]?.authorName}
                </option>
              ))}
            </select>

            {/* Filter by Role */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-600"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students Only</option>
              <option value="FACULTY">Faculty Only</option>
              <option value="TA">Teaching Assistants</option>
              <option value="HEAD">Head of School</option>
              <option value="CO_FOUNDER">Co-Founders</option>
              <option value="ESTATE">Estate Team</option>
              <option value="NON_FACULTY">Non-Faculty Staff</option>
              <option value="IT_MANAGER">IT Managers</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">
              Showing <strong className="text-slate-900">{filteredRecords.length}</strong> of {viewRecords.length} entries
            </span>
            <button
              onClick={exportToCSV}
              disabled={viewRecords.length === 0}
              className="sm:hidden px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Sheet Table */}
        <div className="flex-1 overflow-auto bg-slate-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Account Identity</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Class / Team</th>
                  <th className="py-2.5 px-3">Announcement Seen</th>
                  <th className="py-2.5 px-3">First Seen</th>
                  <th className="py-2.5 px-3">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((r, idx) => (
                  <tr key={`${r.id}-${idx}`} className="hover:bg-purple-50/40 transition">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-extrabold text-slate-900">{r.userName}</div>
                      {r.userEmail && (
                        <div className="text-[10px] text-slate-400 font-mono">{r.userEmail}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          r.userRole === 'STUDENT'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : r.userRole === 'FACULTY' || r.userRole === 'TEACHER'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : r.userRole === 'IT_MANAGER'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {r.userRole === 'TEACHER' ? 'FACULTY' : r.userRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {r.schoolClass ? (
                        <span className="font-bold text-purple-700">{r.schoolClass}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 max-w-[240px]">
                      <div className="truncate text-slate-800 font-semibold" title={r.announcementSnippet}>
                        "{r.announcementSnippet}"
                      </div>
                      <div className="text-[10px] text-purple-600 font-medium">
                        By: {r.authorName || 'Campus Staff'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap text-[11px] font-mono">
                      {new Date(r.firstSeenAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap text-[11px] font-mono">
                      {new Date(r.lastSeenAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-700 text-sm">No Readership Records Found</div>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery ? 'Try clearing your search filters' : 'As accounts log in and view announcements, they will appear here.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Audited & Computed Exclusively for IT Manager Account</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={viewRecords.length === 0}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
