import { useState, useMemo } from 'react';
import { CATEGORIES as MILLERS_CATS, DRUGS as MILLERS_DRUGS } from '../drugs.js';

export default function DrugReference({ drugList, categoryList }) {
  const DRUGS      = drugList     || MILLERS_DRUGS;
  const CATEGORIES = categoryList || MILLERS_CATS;

  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch]                 = useState('');
  const [selected, setSelected]             = useState(null);

  const filtered = useMemo(() => {
    let list = activeCategory === 'all' ? DRUGS : DRUGS.filter(d => d.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.indication?.toLowerCase().includes(q));
    }
    return list;
  }, [DRUGS, activeCategory, search]);

  const allCats = [{ id: 'all', label: 'All', icon: '💊' }, ...CATEGORIES];

  return (
    <>
      <div className="flex flex-col gap-3">

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory('all'); }}
            placeholder="Search drugs…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white
                       placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 text-xs">✕</button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {allCats.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                activeCategory === cat.id && !search
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-white/4 text-white/40 border border-transparent hover:bg-white/8'
              }`}
            >
              <span>{cat.icon}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 2-column card grid */}
        {filtered.length === 0
          ? <p className="text-center py-8 text-white/25 text-sm">No drugs found</p>
          : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(drug => (
                <DrugCard
                  key={drug.id}
                  drug={drug}
                  selected={selected?.id === drug.id}
                  onClick={() => setSelected(selected?.id === drug.id ? null : drug)}
                />
              ))}
            </div>
          )
        }
      </div>

      {/* Detail bottom sheet */}
      {selected && <MillersDetailPanel drug={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function DrugCard({ drug, selected, onClick }) {
  const d    = drug.doses?.standard;
  const unit = drug.isInfusion
    ? (drug.isMcg ? 'mcg/kg/min' : 'mg/kg/h')
    : drug.weightBasis === 'fixed'
    ? (drug.isMcg ? 'mcg' : 'mg')
    : (drug.isMcg ? 'mcg/kg' : 'mg/kg');
  const range = d ? (d.min === d.max ? `${d.min}` : `${d.min}–${d.max}`) : '—';

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all active:scale-95 ${
        selected
          ? 'border-indigo-500/50'
          : drug.isHighAlert
          ? 'border-amber-500/25 hover:border-amber-500/45'
          : 'border-white/8 hover:border-white/20'
      }`}
      style={{ background: selected ? 'rgba(99,102,241,0.12)' : 'var(--bg-item)' }}
    >
      {/* Name row */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: drug.color || '#6366f1' }} />
        <span className="text-[12px] font-bold text-white truncate flex-1">{drug.name}</span>
        {drug.isHighAlert && (
          <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold flex-shrink-0">⚠</span>
        )}
      </div>
      {/* Indication */}
      <p className="text-[10px] text-white/40 truncate mb-2">{drug.indication}</p>
      {/* Dose */}
      <p className="text-[12px] font-semibold text-blue-300">{range}
        <span className="text-[10px] font-normal text-white/35 ml-1">{unit}</span>
      </p>
    </button>
  );
}

function MillersDetailPanel({ drug, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 overflow-hidden"
        style={{ background: 'var(--bg-card)', maxHeight: '60vh' }}>

        {/* Handle + header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: drug.color || '#6366f1' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{drug.name}</p>
            <p className="text-[11px] text-white/40">{drug.indication}</p>
          </div>
          {drug.isHighAlert && (
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">HIGH ALERT</span>
          )}
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all">
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(60vh - 56px)' }}>

          {/* Concentrations */}
          {drug.concentration?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Available as:</span>
              {drug.concentration.map(c => (
                <span key={c.label}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20 font-semibold">
                  {c.label}
                </span>
              ))}
            </div>
          )}

          {/* Dose tiers */}
          {drug.doses && (
            <div className="rounded-xl overflow-hidden border border-white/6" style={{ background: 'var(--bg-item)' }}>
              <div className="grid grid-cols-2 border-b border-white/6">
                <div className="px-3 py-2 text-[10px] font-bold text-white/35 uppercase tracking-wider">Population</div>
                <div className="px-3 py-2 text-[10px] font-bold text-white/35 uppercase tracking-wider text-right">
                  {drug.isInfusion ? 'Rate' : drug.weightBasis === 'fixed' ? 'Dose' : 'Dose / kg'}
                </div>
              </div>
              {Object.entries(drug.doses).map(([tier, range], i, arr) => (
                <div key={tier} className={`grid grid-cols-2 ${i < arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="px-3 py-2 text-[11px] text-white/55 capitalize">{tierLabel(tier)}</div>
                  <div className="px-3 py-2 text-[11px] font-semibold text-white text-right">
                    {range.min === range.max ? range.min : `${range.min}–${range.max}`}
                    <span className="text-[10px] font-normal text-white/35 ml-1">
                      {drug.isInfusion
                        ? (drug.isMcg ? 'mcg/kg/min' : 'mg/kg/h')
                        : drug.weightBasis === 'fixed'
                        ? (drug.isMcg ? 'mcg' : 'mg')
                        : (drug.isMcg ? 'mcg/kg' : 'mg/kg')}
                    </span>
                  </div>
                </div>
              ))}
              {drug.maxDose && (
                <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-white/30">
                  Max: {drug.maxDose} {drug.isMcg ? 'mcg' : 'mg'}
                </div>
              )}
            </div>
          )}

          {/* Contraindications */}
          {drug.contraindications?.length > 0 && (
            <div className="flex gap-2 px-3 py-2 rounded-xl bg-red-500/6 border border-red-500/15">
              <span className="text-[11px] flex-shrink-0">⛔</span>
              <p className="text-[11px] text-red-400/80">Contraindicated in: {drug.contraindications.join(', ')}</p>
            </div>
          )}

          {/* Notes */}
          {drug.notes && (
            <div className="flex gap-2">
              <span className="text-[11px] flex-shrink-0">📝</span>
              <p className="text-[11px] text-white/50 leading-relaxed">{drug.notes}</p>
            </div>
          )}

          <p className="text-[10px] text-white/20">📚 {drug.ref?.split(',')[0]}</p>
        </div>
      </div>
    </>
  );
}

function tierLabel(tier) {
  const map = {
    standard: 'Standard',
    elderly:  'Elderly (≥65)',
    cardiac:  'Cardiac disease',
    hypo:     'Hypovolemia / Shock',
    obese:    'Obese',
    pediatric:'Pediatric',
  };
  return map[tier] || tier;
}
