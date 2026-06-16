import { useState } from 'react';
import PatientForm from './components/PatientForm.jsx';
import DrugTable from './components/DrugTable.jsx';
import DrugReference from './components/DrugReference.jsx';
import BarashReference from './components/BarashReference.jsx';
import { CATEGORIES as MILLERS_CATS, DRUGS as MILLERS_DRUGS } from './drugs.js';
import { CATEGORIES as BARASH_CATS, DRUGS as BARASH_DRUGS } from './barash_calc_drugs.js';

const DEFAULT_PATIENT = {
  weightKg: 0, heightCm: 0, age: 0, sex: 'male', comorbidities: [],
};

export default function App() {
  const [source, setSource]     = useState('millers');
  const [mode, setMode]         = useState('calculator');
  const [patient, setPatient]   = useState(DEFAULT_PATIENT);
  const [mobileTab, setMobileTab] = useState('drugs'); // 'patient' | 'drugs'

  const drugList     = source === 'barash' ? BARASH_DRUGS : MILLERS_DRUGS;
  const categoryList = source === 'barash' ? BARASH_CATS  : MILLERS_CATS;

  return (
    <div className="flex flex-col" style={{ background: '#080f1e', minHeight: '100dvh' }}>

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 border-b border-white/8 px-3 md:px-5 py-2.5 md:py-3 flex items-center gap-2 md:gap-4" style={{ background: '#0a1322' }}>

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs flex-shrink-0">💉</div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">Thai Anesthetic Drug</p>
            <p className="text-[10px] text-white/30 mt-0.5">Drug calculator &amp; reference</p>
          </div>
          <p className="text-xs font-bold text-white sm:hidden">Thai Anesthetic</p>
        </div>

        <div className="flex-1" />

        {/* Source toggle */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1 border border-white/8">
          {[
            { id: 'millers', label: "Miller's", icon: '📗' },
            { id: 'barash',  label: 'Barash',   icon: '📘' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                source === s.id ? 'bg-blue-600 text-white shadow' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1 border border-white/8">
          {[
            { id: 'calculator', label: 'Calc', icon: '🧮' },
            { id: 'reference',  label: 'Ref',  icon: '📋' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === m.id ? 'bg-indigo-600 text-white shadow' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span>{m.icon}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── DISCLAIMER ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 md:px-5 py-1.5 bg-amber-500/6 border-b border-amber-500/12">
        <span className="text-amber-400 text-[10px]">⚠</span>
        <p className="text-[10px] text-amber-400/70 leading-tight">For clinical decision support only — always verify doses independently.</p>
        <div className="ml-auto flex-shrink-0">
          <span className="text-[9px] text-white/20 font-medium hidden sm:inline">{source === 'barash' ? '📘 Barash 9e' : "📗 Miller's 9e"}</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex overflow-hidden" style={{ paddingBottom: mode === 'calculator' ? 64 : 0 }}>

        {/* ── CALCULATOR MODE ── */}
        {mode === 'calculator' && (
          <>
            {/* Desktop: side by side | Mobile: tabs */}
            <aside className={`
              flex-shrink-0 border-r border-white/8 overflow-y-auto
              w-full md:w-72
              ${mobileTab === 'patient' ? 'block' : 'hidden'} md:block
            `} style={{ background: '#0a1322' }}>
              <PatientForm patient={patient} onChange={setPatient} onReset={() => setPatient(DEFAULT_PATIENT)} />
            </aside>

            <main className={`
              flex-1 overflow-y-auto px-3 md:px-5 py-4 md:py-5
              ${mobileTab === 'drugs' ? 'block' : 'hidden'} md:block
            `}>
              <DrugTable patient={patient} drugList={drugList} categoryList={categoryList} />
            </main>
          </>
        )}

        {/* ── REFERENCE MODE ── */}
        {mode === 'reference' && (
          <main className="flex-1 overflow-y-auto px-3 md:px-5 py-4 md:py-5 max-w-4xl mx-auto w-full">
            {source === 'barash' ? <BarashReference /> : <DrugReference />}
          </main>
        )}
      </div>

      {/* ── MOBILE BOTTOM TAB BAR (calculator mode only) ── */}
      {mode === 'calculator' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-white/10 flex" style={{ background: '#0a1322', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {[
            { id: 'patient', label: 'Patient',  icon: '🧑‍⚕️' },
            { id: 'drugs',   label: 'Drugs',    icon: '💊' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id)}
              style={{ minHeight: 64 }}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 font-semibold transition-all active:opacity-70 ${
                mobileTab === t.id
                  ? 'text-blue-400 border-t-2 border-blue-500 -mt-0.5'
                  : 'text-white/35 border-t-2 border-transparent -mt-0.5'
              }`}
            >
              <span className="text-2xl leading-none">{t.icon}</span>
              <span className="text-sm">{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
