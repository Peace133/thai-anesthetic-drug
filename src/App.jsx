import { useState } from 'react';
import PatientForm from './components/PatientForm.jsx';
import DrugTable from './components/DrugTable.jsx';
import DrugReference from './components/DrugReference.jsx';
import BarashReference from './components/BarashReference.jsx';
import DraftMode from './components/DraftMode.jsx';
import { CATEGORIES as MILLERS_CATS, DRUGS as MILLERS_DRUGS } from './drugs.js';
import { CATEGORIES as BARASH_CATS, DRUGS as BARASH_DRUGS } from './barash_calc_drugs.js';

const DEFAULT_PATIENT = {
  weightKg: 0, heightCm: 0, age: 0, sex: 'male', comorbidities: [],
};

export default function App() {
  const [source, setSource]       = useState('millers');
  const [mode, setMode]           = useState('calculator');
  const [patient, setPatient]     = useState(DEFAULT_PATIENT);
  const [draftResetKey, setDraftResetKey] = useState(0);
  const [calcResetKey, setCalcResetKey]   = useState(0);
  const [isDark, setIsDark]               = useState(true);

  function handleClear() {
    setPatient(DEFAULT_PATIENT);
    setDraftResetKey(k => k + 1);
    setCalcResetKey(k => k + 1);
  }

  const drugList     = source === 'barash' ? BARASH_DRUGS : MILLERS_DRUGS;
  const categoryList = source === 'barash' ? BARASH_CATS  : MILLERS_CATS;

  return (
    <div
      className="flex flex-col"
      data-theme={isDark ? 'dark' : 'light'}
      style={{ background: 'var(--bg-main)', minHeight: '100dvh' }}
    >

      {/* ── HEADER ── */}
      <header
        className="flex-shrink-0 px-4 md:px-6 py-3 flex items-center gap-3 border-b border-white/8"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Left — logo + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">💉</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-none">Anesthetic Drug Calculator</p>
            <p className="text-[10px] text-white/30 mt-0.5">Clinical decision support tool</p>
          </div>
        </div>

        {/* Center — mode toggle */}
        <div className="flex-shrink-0 flex gap-0.5 p-0.5 rounded-lg border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'calculator', label: 'Calculator' },
            { id: 'reference',  label: 'Reference'  },
            { id: 'draft',      label: 'Draft'       },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all active:scale-95 ${
                mode === m.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Right — theme toggle */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setIsDark(d => !d)}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/8
                       text-white/40 hover:text-white/70 hover:border-white/20 transition-all active:scale-90"
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── DISCLAIMER ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-1.5 border-b border-amber-500/15"
        style={{ background: 'rgba(245,158,11,0.04)' }}>
        <span className="text-amber-400 text-xs flex-shrink-0">⚠</span>
        <p className="text-[10px] text-amber-400/70 leading-tight">
          For clinical decision support only — always verify doses independently.
        </p>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── CALCULATOR mode ── always mounted, hidden when inactive */}
        <div style={{ display: mode === 'calculator' ? 'block' : 'none' }}>
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 space-y-4">
            <PatientForm
              patient={patient}
              onChange={setPatient}
              onReset={handleClear}
            />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wider flex-shrink-0">Reference</span>
              <div className="relative flex-1">
                <select
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-9 py-2.5
                             text-sm font-semibold text-white focus:outline-none focus:border-blue-500/50
                             transition-all cursor-pointer"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <option value="millers" style={{ background: 'var(--bg-card)' }}>📗  Miller's Anesthesia 9th Edition</option>
                  <option value="barash"  style={{ background: 'var(--bg-card)' }}>📘  Barash Clinical Anesthesia 8th Edition</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <DrugTable patient={patient} drugList={drugList} categoryList={categoryList} resetKey={calcResetKey} />
          </div>
        </div>

        {/* ── REFERENCE mode ── full-width, no max-width constraint ── */}
        <div style={{ display: mode === 'reference' ? 'block' : 'none' }}>
          <div className="px-4 md:px-6 py-4 space-y-3">
            {/* Source selector */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wider flex-shrink-0">Reference</span>
              <div className="relative flex-1 max-w-xs">
                <select
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-9 py-2.5
                             text-sm font-semibold text-white focus:outline-none focus:border-blue-500/50
                             transition-all cursor-pointer"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <option value="millers" style={{ background: 'var(--bg-card)' }}>📗  Miller's Anesthesia 9th Edition</option>
                  <option value="barash"  style={{ background: 'var(--bg-card)' }}>📘  Barash Clinical Anesthesia 8th Edition</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* Full-width reference content */}
            {source === 'barash' ? <BarashReference /> : <DrugReference />}
          </div>
        </div>

        {/* ── DRAFT mode ── always mounted, hidden when inactive */}
        <div style={{ display: mode === 'draft' ? 'block' : 'none' }}>
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 space-y-4">
            <PatientForm
              patient={patient}
              onChange={setPatient}
              onReset={handleClear}
              hideComorbidities
            />
            <DraftMode patient={patient} resetKey={draftResetKey} />
          </div>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer className="flex-shrink-0 px-4 py-3 flex items-center justify-center border-t border-white/6"
        style={{ background: 'var(--bg-surface)' }}>
        <p className="text-[11px] text-white/20">
          Made by <span className="text-white/40 font-semibold">Chet43</span> and team
        </p>
      </footer>

    </div>
  );
}
