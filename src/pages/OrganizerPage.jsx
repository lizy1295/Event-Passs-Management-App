import { useState, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import QrScanner from '../components/QrScanner';

export default function OrganizerPage() {
  const [scanResult, setScanResult] = useState(null);
  const [guestData, setGuestData] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'searching' | 'found' | 'not-found' | 'checked-in' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  // Ref to prevent spamming queries for the same code
  const lastScannedCode = useRef('');
  
  const handleScanSuccess = useCallback(async (decodedText) => {
    // Prevent re-scanning the same code in quick succession
    if (decodedText === lastScannedCode.current && scanStatus !== 'idle') {
       return;
    }
    
    try {
      lastScannedCode.current = decodedText;
      const guestId = decodedText.trim();
      
      if (!guestId) {
        setScanStatus('error');
        setErrorMessage('Invalid QR Code.');
        return;
      }

      setScanResult(guestId);
      setScanStatus('searching');
      setGuestData(null);

      // Get document directly by ID (much faster and more reliable)
      const { getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'guests', guestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setScanStatus('not-found');
      } else {
        // Found the guest
        const guestInfo = { id: docSnap.id, ...docSnap.data() };
        setGuestData(guestInfo);
        
        if (guestInfo.hasCheckedIn || guestInfo.status === 'Checked In') {
          setScanStatus('checked-in');
        } else {
          setScanStatus('found');
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
      setScanStatus('error');
      setErrorMessage('A database error occurred or ID is invalid.');
    }
  }, [scanStatus]);

  const handleManualCheckIn = async () => {
    if (!guestData) return;
    
    try {
      const docRef = doc(db, 'guests', guestData.id);
      const checkInDate = new Date();
      await updateDoc(docRef, {
        hasCheckedIn: true,
        status: 'Checked In', // Sync with main app
        checkInTime: checkInDate
      });
      setScanStatus('checked-in');
      setGuestData(prev => ({ ...prev, hasCheckedIn: true, status: 'Checked In', checkInTime: checkInDate }));
    } catch (err) {
      console.error("Error updating document: ", err);
      alert("Failed to manually check-in. Check permissions.");
    }
  };
  
  const handleReset = () => {
    setScanResult(null);
    setGuestData(null);
    setScanStatus('idle');
    setErrorMessage('');
    lastScannedCode.current = '';
  };

  return (
    <div className="bg-dashboard text-slate-800 antialiased min-h-screen pb-12">
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
                Ticket<span className="text-indigo-600">Scanner</span>
              </span>
            </div>
            <div className="flex items-center">
              <a href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                View Full Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 mt-8">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Control Scanner</h1>
          <p className="mt-1 text-sm text-slate-500">Scan digital passes to verify entry</p>
        </div>

        <div className="mb-6">
          <QrScanner 
            onScanSuccess={handleScanSuccess} 
          />
        </div>

        {/* ── Status / Results Card ── */}
        <div className="stat-card rounded-2xl p-6 relative overflow-hidden transition-all">
          
          {scanStatus === 'idle' && (
             <div className="text-center py-6 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p className="font-medium text-slate-500">Position QR Code within the frame.</p>
             </div>
          )}

          {scanStatus === 'searching' && (
            <div className="text-center py-6">
              <div className="w-8 h-8 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
              <p className="font-medium text-slate-600">Verifying guest...</p>
            </div>
          )}

          {scanStatus === 'not-found' && (
            <div className="text-center py-4 relative z-10">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-bold text-slate-900 mb-1">Guest Not Found</h3>
              <p className="text-sm text-slate-500 mb-5">This pass is not registered in the system.</p>
              <button onClick={handleReset} className="w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none transition-colors sm:text-sm">
                Scan Another Pass
              </button>
            </div>
          )}

          {scanStatus === 'error' && (
             <div className="text-center py-4 relative z-10">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-bold text-slate-900 mb-1">Scan Error</h3>
              <p className="text-sm text-slate-500 mb-5">{errorMessage}</p>
              <button onClick={handleReset} className="w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none transition-colors sm:text-sm">
                Try Again
              </button>
            </div>
          )}

          {scanStatus === 'checked-in' && guestData && (
             <div className="text-center py-4 relative z-10">
               <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-transparent -mx-6 -mt-6 h-32 opacity-50 pointer-events-none" />
               <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-3 shadow-inner ring-8 ring-amber-50 relative">
                <svg className="h-8 w-8 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Already Checked In!</h3>
              
              <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 mt-4 text-left shadow-sm">
                 <p className="text-sm text-slate-500 font-medium mb-1">Guest details</p>
                 <p className="font-bold text-slate-900 text-lg">{guestData.name}</p>
                 <p className="text-slate-500 text-sm">{guestData.email}</p>
              </div>

              <button onClick={handleReset} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all">
                Scan Next Pass
              </button>
            </div>
          )}

          {scanStatus === 'found' && guestData && (
             <div className="text-center py-4 relative z-10">
               <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-transparent -mx-6 -mt-6 h-32 opacity-50 pointer-events-none" />
               <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-3 shadow-inner ring-8 ring-emerald-50 relative">
                <svg className="h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Valid Registration Found</h3>
              
              <div className="bg-white rounded-xl border border-emerald-100 p-4 mb-5 mt-4 text-left shadow-sm ring-1 ring-emerald-50">
                 <p className="text-sm text-slate-500 font-medium mb-1">Admit</p>
                 <p className="font-bold text-slate-900 text-xl">{guestData.name}</p>
                 <p className="text-slate-500 text-sm mt-0.5">{guestData.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleReset} className="w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-3 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none transition-colors">
                  Cancel
                </button>
                <button onClick={handleManualCheckIn} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all shadow-emerald-600/20 transform hover:-translate-y-0.5">
                  Check In Now
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
