import { useState, useMemo, useEffect } from 'react';
import { DRUGS as MILLERS_DRUGS } from '../drugs.js';
import { calcDose } from '../utils.js';

const TIER_STYLE = {
  elderly:  { label: 'Elderly',     color: '#f97316' },
  cardiac:  { label: 'Cardiac',     color: '#ef4444' },
  hypo:     { label: 'Hypovolemia', color: '#ef4444' },
  obese:    { label: 'IBW-adj',     color: '#fbbf24' },
  standard: { label: 'Standard',    color: '#34d399' },
};

export default function DrugTable({ patient, drugList, categoryList, resetKey }) {
  const DRUGS = drugList || MILLERS_DRUGS;

  const [query, setQuery]                 = useState('');
  const [isFocused, setIsFocused]         = useState(false);
  const [picked, setPicked]               = useState([]);
  const [expandedId, setExpandedId]       = useState(null);
  const [selectedConcs, setSelectedConcs] = useState({});

  useEffect(() => {
    if (resetKey === 0) return;
    setPicked([]);
    setQuery('');
    setExpandedId(null);
  }, [resetKey]);

  const ready = patient.weightKg > 0 && patient.heightCm > 0 && patient.age > 0;

  // Dropdown suggestions: name-match, exclude already-picked
  const pickedIds = useMemo(() => new Set(picked.map(d => d.id)), [picked]);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return DRUGS.filter(d => d.name.toLowerCase().includes(q) && !pickedIds.has(d.id)).slice(0, 10);
  }, [DRUGS, query, pickedIds]);

  const showDropdown = isFocused && suggestions.length > 0;

  function pickDrug(drug) {
    setPicked(prev => [...prev, drug]);   // newest at bottom
    setQuery('');
  }

  function removePicked(id) {
    setPicked(prev => prev.filter(d => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function isContraindicated(drug) {
    return drug.contraindications?.some(c => patient.comorbidities.includes(c)) ?? false;
  }

  return (
    <div className="rounded-2xl border border-white/8" style={{ background: 'var(--bg-card)' }}>

      {/* Card header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2 rounded-t-2xl overflow-hidden">
        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Drug Doses</span>
        {picked.length > 0 && (
          <span className="ml-auto text-[10px] text-white/20">{picked.length} drug{picked.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="p-4 space-y-3">

        {/* ── Search bar + dropdown ── */}
        <div className="relative">
          <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25 pointer-events-none z-10"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search drug name…"
            className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-sm text-white
                        placeholder-white/25 focus:outline-none transition-all
                        ${showDropdown ? 'rounded-b-none border-indigo-500/50' : 'border-white/10 focus:border-indigo-500/50'}`}
            style={{ background: 'var(--bg-input)' }}
          />
          {query && (
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => setQuery('')}
              className="absolute right-3 top-3.5 text-white/25 hover:text-white/60 transition-colors z-10"
            >
              ✕
            </button>
          )}

          {/* Dropdown list */}
          {showDropdown && (
            <div
              className="absolute left-0 right-0 z-50 border border-t-0 border-indigo-500/50 rounded-b-xl overflow-hidden"
              style={{ background: 'var(--bg-input)' }}
            >
              {suggestions.map((drug, i) => (
                <button
                  key={drug.id}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => pickDrug(drug)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-500/12 transition-colors
                              ${i < suggestions.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: drug.color || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white">{drug.name}</span>
                    {drug.indication && (
                      <span className="ml-2 text-[11px] text-white/30 truncate">{drug.indication}</span>
                    )}
                  </div>
                  {drug.isHighAlert && <Badge text="HIGH ALERT" color="#f59e0b" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hints */}
        {picked.length === 0 && !ready && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500/6 border border-blue-500/12">
            <span className="text-blue-400/50 text-sm">👆</span>
            <p className="text-[11px] text-blue-400/55">Enter patient information above, then search for a drug</p>
          </div>
        )}

        {picked.length === 0 && ready && !query.trim() && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/3 border border-white/8">
            <span className="text-white/30 text-sm">🔍</span>
            <p className="text-[11px] text-white/35">Type a drug name to see doses</p>
          </div>
        )}

        {!ready && picked.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/6 border border-amber-500/15">
            <span className="text-amber-400/60 text-sm">⚠</span>
            <p className="text-[11px] text-amber-400/60">Enter patient weight, height and age to see calculated doses</p>
          </div>
        )}

        {/* ── Selected drug results — newest on top ── */}
        {picked.length > 0 && (
          <div className="space-y-1.5">
            {picked.map(drug => (
              <DrugCard
                key={drug.id}
                drug={drug}
                patient={patient}
                ready={ready}
                contraindicated={isContraindicated(drug)}
                expanded={expandedId === drug.id}
                onToggle={() => setExpandedId(expandedId === drug.id ? null : drug.id)}
                onRemove={() => removePicked(drug.id)}
                selectedConc={
                  selectedConcs[drug.id]
                    ? drug.concentration.find(c => c.label === selectedConcs[drug.id]) ?? drug.concentration[0]
                    : drug.concentration[0]
                }
                onConcChange={label => setSelectedConcs(prev => ({ ...prev, [drug.id]: label }))}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function DrugCard({ drug, patient, ready, contraindicated, expanded, onToggle, onRemove, selectedConc, onConcChange }) {
  const result = ready && !contraindicated ? calcDose(drug, patient, selectedConc) : null;
  const tier   = result?.tier || 'standard';
  const ts     = TIER_STYLE[tier];

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      contraindicated
        ? 'border-red-500/30 opacity-60'
        : drug.isHighAlert
        ? 'border-amber-500/25'
        : 'border-white/8'
    }`} style={{ background: 'var(--bg-item)' }}>

      {/* Main row */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button className="flex-1 min-w-0 flex items-center gap-3 text-left" onClick={onToggle}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: drug.color || '#6366f1' }} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-white">{drug.name}</span>
              {drug.isHighAlert && <Badge text="HIGH ALERT" color="#f59e0b" />}
              {contraindicated && <Badge text="CONTRA" color="#ef4444" />}
              {ready && !contraindicated && tier !== 'standard' && (
                <Badge text={ts.label} color={ts.color} />
              )}
              {result?.cappedByMax && <Badge text="MAX" color="#60a5fa" />}
            </div>
            <p className="text-[11px] text-white/30 mt-0.5 truncate">{drug.indication}</p>
            {drug.ref && (
              <p className="text-[10px] text-white/18 mt-0.5 truncate">📚 {drug.ref.split(',')[0]}</p>
            )}
          </div>

          {contraindicated ? (
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold text-red-400">⛔ Contra</p>
            </div>
          ) : ready && result ? (
            <DoseSummary drug={drug} result={result} />
          ) : null}

          <svg
            className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-white/20
                     hover:text-white/60 hover:bg-white/8 transition-all ml-1"
        >
          ✕
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-white/6">

          {drug.concentration.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">Concentration:</span>
              {drug.concentration.map(c => (
                <button
                  key={c.label}
                  onClick={() => onConcChange(c.label)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    selectedConc.label === c.label
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-white/4 border-white/10 text-white/40 hover:bg-white/8'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {ready && !contraindicated && result && !drug.isInfusion && (
            <div className="rounded-xl overflow-hidden border border-white/6" style={{ background: 'var(--bg-item)' }}>
              <div className="grid grid-cols-3 divide-x divide-white/6">
                <DoseCell label={result.isMcg ? 'Dose (mcg)' : 'Dose (mg)'}>
                  {drug.weightBasis === 'fixed'
                    ? (result.minDose === result.maxDose ? `${result.minDose}` : `${result.minDose}–${result.maxDose}`)
                    : `${result.minDose}–${result.maxDose}`}
                </DoseCell>
                <DoseCell label={`Vol @ ${result.concLabel}`} highlight>
                  {result.minVol === result.maxVol
                    ? `${result.minVol} mL`
                    : `${result.minVol}–${result.maxVol} mL`}
                </DoseCell>
                <DoseCell label="Basis">
                  <span className="text-[10px]">{result.weightLabel}</span>
                </DoseCell>
              </div>
              {result.cappedByMax && (
                <div className="px-3 py-1.5 border-t border-white/4 text-[10px] text-blue-400/60">
                  Capped at max dose: {drug.maxDose} {result.isMcg ? 'mcg' : 'mg'}
                </div>
              )}
            </div>
          )}

          {ready && !contraindicated && result && drug.isInfusion && (
            <div className="rounded-xl overflow-hidden border border-white/6" style={{ background: 'var(--bg-item)' }}>
              <div className="grid grid-cols-2 divide-x divide-white/6">
                <DoseCell label={result.isMcg ? 'Rate (mcg/kg/min)' : 'Rate (mg/kg/h)'} highlight>
                  {result.minDose}–{result.maxDose}
                </DoseCell>
                <DoseCell label="Basis">
                  <span className="text-[10px]">{result.weightLabel}</span>
                </DoseCell>
              </div>
            </div>
          )}

          {contraindicated && (
            <div className="rounded-xl p-2.5 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.06)' }}>
              <p className="text-[11px] text-red-400">
                Contraindicated: {drug.contraindications.filter(c => patient.comorbidities.includes(c)).join(', ')}
              </p>
            </div>
          )}

          {drug.notes && (
            <p className="text-[11px] text-white/35 leading-relaxed">{drug.notes}</p>
          )}

          <p className="text-[10px] text-white/20">📚 {drug.ref}</p>
        </div>
      )}
    </div>
  );
}

function DoseSummary({ drug, result }) {
  if (drug.isInfusion) {
    return (
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">
          {result.minDose}–{result.maxDose}
          <span className="text-[10px] text-white/35 ml-1">{result.isMcg ? 'mcg/kg/min' : 'mg/kg/h'}</span>
        </p>
        <p className="text-[10px] text-white/25">infusion</p>
      </div>
    );
  }

  const doseStr = result.minDose === result.maxDose ? `${result.minDose}` : `${result.minDose}–${result.maxDose}`;
  const volStr  = result.minVol  === result.maxVol  ? `${result.minVol} mL` : `${result.minVol}–${result.maxVol} mL`;

  if (drug.weightBasis === 'fixed') {
    return (
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">
          {doseStr}<span className="text-[10px] text-white/35 ml-1">{result.isMcg ? 'mcg' : 'mg'}</span>
        </p>
        <p className="text-xs font-semibold text-blue-300">{volStr}</p>
      </div>
    );
  }

  return (
    <div className="text-right flex-shrink-0">
      <p className="text-xs font-semibold text-blue-300">{volStr}</p>
      <p className="text-[10px] text-white/25">{doseStr} {result.isMcg ? 'mcg' : 'mg'}</p>
    </div>
  );
}

function DoseCell({ label, children, highlight }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[9px] text-white/25 uppercase tracking-wider font-bold mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-blue-300' : 'text-white'}`}>{children}</p>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
      style={{ background: color + '22', color }}>
      {text}
    </span>
  );
}
