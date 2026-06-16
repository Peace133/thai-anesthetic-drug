import { useState, useMemo } from 'react';
import { CATEGORIES as MILLERS_CATS, DRUGS as MILLERS_DRUGS } from '../drugs.js';
import { calcDose, calcBMI } from '../utils.js';

const TIER_STYLE = {
  elderly:  { label: 'Elderly',     color: '#f97316' },
  cardiac:  { label: 'Cardiac',     color: '#ef4444' },
  hypo:     { label: 'Hypovolemia', color: '#ef4444' },
  obese:    { label: 'IBW-adj',     color: '#fbbf24' },
  standard: { label: 'Standard',    color: '#34d399' },
};

export default function DrugTable({ patient, drugList, categoryList }) {
  const DRUGS = drugList || MILLERS_DRUGS;
  const CATEGORIES = categoryList || MILLERS_CATS;

  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId]         = useState(null);
  const [selectedConcs, setSelectedConcs]   = useState({});
  const [search, setSearch]                 = useState('');

  const ready = patient.weightKg > 0 && patient.heightCm > 0 && patient.age > 0;

  const filtered = useMemo(() => {
    let list = DRUGS;
    if (activeCategory !== 'all') list = list.filter(d => d.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.indication?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [DRUGS, activeCategory, search]);

  const grouped = useMemo(() => {
    const cats = search.trim()
      ? CATEGORIES
      : CATEGORIES.filter(cat => activeCategory === 'all' || cat.id === activeCategory);

    return cats
      .map(cat => ({ ...cat, drugs: filtered.filter(d => d.category === cat.id) }))
      .filter(cat => cat.drugs.length > 0);
  }, [CATEGORIES, filtered, activeCategory, search]);

  function isContraindicated(drug) {
    return drug.contraindications?.some(c => patient.comorbidities.includes(c)) ?? false;
  }

  const allCats = [{ id: 'all', label: 'All', icon: '💊' }, ...CATEGORIES];

  return (
    <div className="flex flex-col gap-0">

      {/* ── Sticky top bar: search + category tabs ── */}
      <div
        className="sticky top-0 z-10 pb-3 space-y-3"
        style={{ background: '#080f1e' }}
      >
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm select-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory('all'); }}
            placeholder="Search drugs…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20
                       focus:outline-none focus:border-blue-500/50 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 text-xs transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category tabs — horizontal scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {allCats.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activeCategory === cat.id && !search
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/4 border-white/8 text-white/40 hover:bg-white/8 hover:text-white/70'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Not-ready banner */}
        {!ready && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/8 border border-blue-500/15">
            <span className="text-blue-400/60 text-xs">←</span>
            <p className="text-[11px] text-blue-400/60">Enter patient weight, height &amp; age in the sidebar to calculate doses</p>
          </div>
        )}
      </div>

      {/* ── Drug list ── */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-white/20 text-sm">
          No drugs match "{search}"
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(cat => (
            <section key={cat.id}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{cat.icon}</span>
                <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{cat.label}</h3>
                <div className="flex-1 h-px bg-white/6" />
                <span className="text-[10px] text-white/20">{cat.drugs.length}</span>
              </div>

              <div className="space-y-1.5">
                {cat.drugs.map(drug => (
                  <DrugCard
                    key={drug.id}
                    drug={drug}
                    patient={patient}
                    ready={ready}
                    contraindicated={isContraindicated(drug)}
                    expanded={expandedId === drug.id}
                    onToggle={() => setExpandedId(expandedId === drug.id ? null : drug.id)}
                    selectedConc={
                      selectedConcs[drug.id]
                        ? drug.concentration.find(c => c.label === selectedConcs[drug.id]) ?? drug.concentration[0]
                        : drug.concentration[0]
                    }
                    onConcChange={label => setSelectedConcs(prev => ({ ...prev, [drug.id]: label }))}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function DrugCard({ drug, patient, ready, contraindicated, expanded, onToggle, selectedConc, onConcChange }) {
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
    }`} style={{ background: '#0d1b33' }}>

      {/* ── Main row ── */}
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3"
        onClick={onToggle}
      >
        {/* Color dot */}
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: drug.color || '#6366f1' }} />

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">{drug.name}</span>
            {drug.isHighAlert && <Badge text="HIGH ALERT" color="#f59e0b" />}
            {contraindicated && <Badge text="CONTRA" color="#ef4444" />}
            {ready && !contraindicated && tier !== 'standard' && (
              <Badge text={ts.label} color={ts.color} />
            )}
            {result?.cappedByMax && <Badge text="MAX" color="#60a5fa" />}
          </div>
          <p className="text-[11px] text-white/35 mt-0.5 truncate">{drug.indication}</p>
        </div>

        {/* Dose summary — right side */}
        {contraindicated ? (
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-bold text-red-400">⛔ Contraindicated</p>
          </div>
        ) : ready && result ? (
          <DoseSummary drug={drug} result={result} />
        ) : !ready ? (
          <div className="flex-shrink-0">
            <div className="flex flex-col items-end gap-0.5">
              <div className="w-16 h-4 rounded bg-white/5" />
              <div className="w-10 h-3 rounded bg-white/4" />
            </div>
          </div>
        ) : null}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-white/6">

          {/* Concentration selector (if multiple) */}
          {drug.concentration.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Concentration:</span>
              {drug.concentration.map(c => (
                <button
                  key={c.label}
                  onClick={() => onConcChange(c.label)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    selectedConc.label === c.label
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-white/4 border-white/10 text-white/45 hover:bg-white/8'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Dose breakdown */}
          {ready && !contraindicated && result && !drug.isInfusion && (
            <div className="rounded-xl overflow-hidden border border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
                  ⓘ Capped at max dose: {drug.maxDose} {result.isMcg ? 'mcg' : 'mg'}
                </div>
              )}
            </div>
          )}

          {/* Infusion detail */}
          {ready && !contraindicated && result && drug.isInfusion && (
            <div className="rounded-xl overflow-hidden border border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
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

          {/* Contraindication detail */}
          {contraindicated && (
            <div className="rounded-xl p-2.5 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.06)' }}>
              <p className="text-[11px] text-red-400">
                ⛔ Contraindicated:{' '}
                {drug.contraindications.filter(c => patient.comorbidities.includes(c)).join(', ')}
              </p>
            </div>
          )}

          {/* Notes */}
          {drug.notes && (
            <p className="text-[11px] text-white/40 leading-relaxed">{drug.notes}</p>
          )}

          {/* Reference */}
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
          <span className="text-[10px] text-white/40 ml-1">{result.isMcg ? 'mcg/kg/min' : 'mg/kg/h'}</span>
        </p>
        <p className="text-[10px] text-white/30">infusion</p>
      </div>
    );
  }

  const doseStr = result.minDose === result.maxDose
    ? `${result.minDose}`
    : `${result.minDose}–${result.maxDose}`;
  const volStr = result.minVol === result.maxVol
    ? `${result.minVol} mL`
    : `${result.minVol}–${result.maxVol} mL`;

  if (drug.weightBasis === 'fixed') {
    return (
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">
          {doseStr}
          <span className="text-[10px] text-white/40 ml-1">{result.isMcg ? 'mcg' : 'mg'}</span>
        </p>
        <p className="text-xs font-semibold text-blue-300">{volStr}</p>
      </div>
    );
  }

  return (
    <div className="text-right flex-shrink-0">
      <p className="text-xs font-semibold text-blue-300">{volStr}</p>
      <p className="text-[10px] text-white/30">
        {doseStr} {result.isMcg ? 'mcg' : 'mg'}
      </p>
    </div>
  );
}

function DoseCell({ label, children, highlight }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-blue-300' : 'text-white'}`}>{children}</p>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-bold"
      style={{ background: color + '22', color }}
    >
      {text}
    </span>
  );
}
