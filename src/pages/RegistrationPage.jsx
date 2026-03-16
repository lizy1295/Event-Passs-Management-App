import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../firebase';

export default function RegistrationPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticket, setTicket] = useState(null);   // { name, email, qrData }
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'guests'), {
        name,
        email,
        hasCheckedIn: false,
        registrationTime: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error adding document:', err);
      alert('Failed to register. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const qrData = JSON.stringify({ name, email, type: 'VIP Pass' });

    // Trigger fade out, then show ticket
    setIsTransitioning(true);
    setTimeout(() => {
      setTicket({ name, email, qrData });
      setIsTransitioning(false);
    }, 400);
  };

  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center p-4 antialiased text-slate-100 relative overflow-x-hidden">

      {/* ── Registration Form ── */}
      {!ticket && (
        <div className={`glass-panel w-full max-w-md rounded-[2rem] p-8 sm:p-10 z-10 ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 mb-6 shadow-lg shadow-purple-500/30 ring-4 ring-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400">
              Summit 2026
            </h1>
            <p className="text-slate-400 text-sm mt-3 font-medium">Claim your exclusive digital pass</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-300 ml-1">Full Name</label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-glass w-full rounded-2xl px-5 py-4 text-white placeholder-slate-500 transition-all duration-300"
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 ml-1">Email Address</label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glass w-full rounded-2xl px-5 py-4 text-white placeholder-slate-500 transition-all duration-300"
                placeholder="you@company.com"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 hover:from-purple-500 to-pink-600 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500/30 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registering…' : 'Generate My Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Digital Ticket ── */}
      {ticket && (
        <div className="glass-panel w-full max-w-sm rounded-[2rem] overflow-hidden relative z-10 mx-auto fade-in">
          {/* Ticket cutouts & dash line */}
          <div className="ticket-cutout left" />
          <div className="ticket-cutout right" />
          <div className="dash-line" />

          {/* Ticket Header */}
          <div className="bg-white/5 pt-8 pb-10 px-8 text-center relative z-10">
            <h2 className="text-2xl font-black tracking-widest uppercase text-white drop-shadow-md">VIP Pass</h2>
            <p className="text-purple-300 text-sm font-medium mt-1 uppercase tracking-widest">Summit 2026</p>
          </div>

          {/* Ticket Body */}
          <div className="px-8 pb-10 pt-8 text-center mt-2">
            <div className="mb-8">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Admit One</p>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words px-4">{ticket.name}</p>
              <p className="text-sm font-medium text-slate-400 mt-2 truncate max-w-full px-2">{ticket.email}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                <div className="relative p-4 bg-white rounded-xl shadow-xl transform transition duration-500 hover:scale-[1.02]">
                  <QRCodeCanvas
                    value={ticket.qrData}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="H"
                  />
                </div>
              </div>
            </div>

            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active successfully</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
