import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, query, orderBy, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: true, month: 'short', day: 'numeric',
  }).format(date);
};

const AVATAR_COLORS = [
  'bg-red-100 text-red-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-purple-100 text-purple-600',
  'bg-amber-100 text-amber-600',
  'bg-indigo-100 text-indigo-600',
];

function Avatar({ name }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const colorClass = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold shadow-sm ${colorClass}`}>
      {initial}
    </div>
  );
}

// ─── Guest Row ────────────────────────────────────────────────────────────────

function GuestRow({ guest, onCheckIn }) {
  const [loading, setLoading] = useState(false);
  const isCheckedIn = guest.hasCheckedIn === true || guest.status === 'Checked In';

  const handleCheckIn = async () => {
    setLoading(true);
    await onCheckIn(guest.id);
    setLoading(false);
  };

  const badge = isCheckedIn
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Checked In',  dot: 'bg-emerald-500' }
    : { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Awaiting',    dot: 'bg-amber-500'   };

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      {/* Guest Details */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Avatar name={guest.name} />
          </div>
          <div className="ml-4 max-w-[200px] sm:max-w-none">
            <div className="text-sm font-semibold text-slate-900 truncate">{guest.name || 'Unknown'}</div>
            <div className="text-sm text-slate-500 truncate mt-0.5">{guest.email || 'No email provided'}</div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} mr-1.5 ${isCheckedIn ? '' : 'animate-pulse'}`} />
          {badge.label}
        </span>
      </td>

      {/* Check-in Time */}
      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell text-sm text-slate-500">
        {isCheckedIn
          ? <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-medium">{formatDate(guest.checkInTime)}</span>
          : <span className="text-slate-400 italic">Not recorded</span>
        }
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {isCheckedIn ? (
          <span className="text-slate-400 select-none mr-2 font-medium">Completed</span>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing
              </>
            ) : (
              <>
                <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Check In
              </>
            )}
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, badge, icon, accent }) {
  return (
    <div className="stat-card rounded-2xl p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 ${accent} rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300`} />
      <div className="relative flex items-center">
        <div className={`p-3 rounded-xl ${icon.bg} ${icon.text} ring-1 ${icon.ring}`}>{icon.svg}</div>
        <div className="ml-4 w-0 flex-1">
          <dt className="text-sm font-medium text-slate-500 truncate">{label}</dt>
          <dd className="flex items-baseline mt-1">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
            {badge && (
              <div className="ml-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {badge}
              </div>
            )}
          </dd>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [allGuests, setAllGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true,
      }).format(new Date()));
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  // Firestore real-time listener
  useEffect(() => {
    const q = query(collection(db, 'guests'), orderBy('name'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAllGuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    }, (err) => {
      console.error('Real-time listener error:', err);
      setError('Error loading data. Check database connections and rules.');
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Check-in handler
  const handleCheckIn = useCallback(async (guestId) => {
    try {
      const checkInDate = new Date();
      await updateDoc(doc(db, 'guests', guestId), {
        hasCheckedIn: true,
        status: 'Checked In', // Sync with main app
        checkInTime: checkInDate,
      });
    } catch (err) {
      console.error('Error updating document:', err);
      alert('Failed to check in. Check Firebase permissions.');
    }
  }, []);

  // Derived stats
  const total      = allGuests.length;
  const checkedIn  = allGuests.filter(g => g.hasCheckedIn === true || g.status === 'Checked In').length;
  const remaining  = total - checkedIn;
  const percent    = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  // Filtered list
  const filtered = allGuests.filter(g => {
    const term = searchTerm.toLowerCase();
    return (g.name || '').toLowerCase().includes(term) ||
           (g.email || '').toLowerCase().includes(term);
  });

  return (
    <div className="bg-dashboard text-slate-800 antialiased min-h-screen">

      {/* ── Navigation ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Event<span className="text-indigo-600">Admin</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-slate-500 hidden sm:block">
                <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">{currentTime}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Control Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Real-time attendee management and monitoring.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 text-sm font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 status-badge-pulse" />
              <span>Live Updates Active</span>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <StatCard
            label="Total Registered"
            value={total}
            accent="bg-gradient-to-br from-indigo-100 to-indigo-50"
            icon={{
              bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100',
              svg: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ),
            }}
          />
          <StatCard
            label="Checked-In"
            value={checkedIn}
            badge={`${percent}%`}
            accent="bg-gradient-to-br from-emerald-100 to-emerald-50"
            icon={{
              bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100',
              svg: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            }}
          />
          <StatCard
            label="Awaiting Entry"
            value={remaining}
            accent="bg-gradient-to-br from-amber-100 to-amber-50"
            icon={{
              bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100',
              svg: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            }}
          />
        </div>

        {/* Guest Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">

          {/* Table Controls */}
          <div className="p-5 border-b border-slate-200 sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg leading-6 font-bold text-slate-900">Guest Directory</h3>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <div className="relative rounded-xl shadow-sm max-w-md w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl py-2.5 bg-slate-50 border transition-colors outline-none"
                  placeholder="Search by name or email..."
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-slate-200 border-collapse">
              <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Guest Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Check-in Time</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <svg className="animate-spin mx-auto h-8 w-8 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-sm text-slate-500 font-medium">Loading guest list…</p>
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-red-500 font-medium">{error}</td>
                  </tr>
                )}
                {!isLoading && !error && filtered.map(guest => (
                  <GuestRow key={guest.id} guest={guest} onCheckIn={handleCheckIn} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {!isLoading && !error && filtered.length === 0 && allGuests.length > 0 && (
            <div className="px-6 py-12 text-center bg-white border-t border-slate-100">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-900">No guests found</h3>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your search criteria.</p>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 sm:flex sm:items-center sm:justify-between text-sm text-slate-500">
            <div>
              {!isLoading && !error
                ? searchTerm
                  ? `Found ${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${searchTerm}"`
                  : `Showing all ${total} record${total !== 1 ? 's' : ''}`
                : 'Loading…'
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
