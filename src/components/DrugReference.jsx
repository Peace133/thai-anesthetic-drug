import { useState, useMemo } from 'react';
import { CATEGORIES as MILLERS_CATS, DRUGS as MILLERS_DRUGS } from '../drugs.js';

export default function DrugReference({ drugList, categoryList }) {
  const DRUGS = drugList || MILLERS_DRUGS;
  const CATEGORIES = categoryList || MILLERS_CATS;

  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = activeCategory === 'all' ? DRUGS : DRUGS.filter(d => d.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.indication?.toLowerCase().includes(q));
    }
    return list;
  }, [DRUGS, activeCategory, search]);

  const grouped = CATEGORIES
    .filter(cat => search.trim() ? true : (activeCategory === 'all' || cat.id === activeCategory))
    .map(cat => ({ ...cat, drugs: filtered.filter(d => d.category === cat.id) }))
    .filter(cat => cat.drugs.length > 0);

  const allCats = [{ id: 'all', label: 'All', icon: '💊' }, ...CATEGORIES];

  return (
    <div className="flex flex-col gap-3">
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
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 text-xs">✕</button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {allCats.map(cat => (
          <Tab
            key={cat.id}
            id={cat.id}
            label={cat.label}
            icon={cat.icon}
            active={activeCategory === cat.id && !search}
            onClick={id => { setActiveCategory(id); setSearch(''); }}
          />
        ))}
      </div>

      {/* Drug groups */}
      {grouped.map(cat => (
        <div key={cat.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{cat.icon}</span>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">{cat.label}</h3>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {cat.drugs.map(drug => {
            const isExpanded = expandedId === drug.id;

            return (
              <div
                key={drug.id}
                className={`rounded-xl border transition-all ${
                  drug.isHighAlert
                    ? 'border-amber-500/30 bg-[#0f1f3a]'
                    : 'border-white/8 bg-[#0f1f3a]'
                }`}
              >
                <button
                  className="w-full text-left px-4 py-3 flex items-start gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : drug.id)}
                >
                  <div
                    className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: drug.color || '#6366f1' }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{drug.name}</span>
                      {drug.isHighAlert && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                          HIGH ALERT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{drug.indication}</p>
                  </div>

                  {/* Dose range — right side */}
                  <div className="text-right flex-shrink-0">
                    {drug.weightBasis === 'fixed' ? (
                      <>
                        <p className="text-sm font-bold text-white">
                          {drug.doses.standard.min === drug.doses.standard.max
                            ? `${drug.doses.standard.min}`
                            : `${drug.doses.standard.min}–${drug.doses.standard.max}`}
                          <span className="text-xs font-normal text-white/50 ml-1">
                            {drug.isMcg ? 'mcg' : 'mg'}
                          </span>
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">fixed dose</p>
                      </>
                    ) : drug.isInfusion ? (
                      <>
                        <p className="text-sm font-bold text-white">
                          {drug.doses.standard.min}–{drug.doses.standard.max}
                          <span className="text-xs font-normal text-white/50 ml-1">
                            {drug.isMcg ? 'mcg/kg/min' : 'mg/kg/h'}
                          </span>
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">infusion</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-white">
                          {drug.doses.standard.min}–{drug.doses.standard.max}
                          <span className="text-xs font-normal text-white/50 ml-1">
                            {drug.isMcg ? 'mcg/kg' : 'mg/kg'}
                          </span>
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">{drug.weightBasis}</p>
                      </>
                    )}
                  </div>

                  <svg
                    className={`w-4 h-4 text-white/30 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded — full dose tiers + concentrations + notes */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">

                    {/* Concentrations */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-white/40">Available as:</span>
                      {drug.concentration.map(c => (
                        <span key={c.label} className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20 font-semibold">
                          {c.label}
                        </span>
                      ))}
                    </div>

                    {/* Dose tiers table */}
                    <div className="bg-white/3 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/6">
                            <th className="text-left py-2 px-3 text-white/40 font-semibold">Population</th>
                            <th className="text-right py-2 px-3 text-white/40 font-semibold">
                              {drug.isInfusion ? 'Rate' : drug.weightBasis === 'fixed' ? 'Dose' : 'Dose (per kg)'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(drug.doses).map(([tier, range]) => (
                            <tr key={tier} className="border-b border-white/4 last:border-0">
                              <td className="py-2 px-3 text-white/60 capitalize">{tierLabel(tier)}</td>
                              <td className="py-2 px-3 text-right font-semibold text-white">
                                {range.min === range.max ? range.min : `${range.min}–${range.max}`}
                                <span className="text-white/40 font-normal ml-1 text-[10px]">
                                  {drug.isInfusion
                                    ? (drug.isMcg ? 'mcg/kg/min' : 'mg/kg/h')
                                    : drug.weightBasis === 'fixed'
                                    ? (drug.isMcg ? 'mcg' : 'mg')
                                    : (drug.isMcg ? 'mcg/kg' : 'mg/kg')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {drug.maxDose && (
                        <div className="px-3 py-1.5 border-t border-white/4 text-[10px] text-white/30">
                          Max dose: {drug.maxDose} {drug.isMcg ? 'mcg' : 'mg'}
                        </div>
                      )}
                    </div>

                    {/* Contraindications */}
                    {drug.contraindications?.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-[11px]">⛔</span>
                        <p className="text-[11px] text-red-400/80">
                          Contraindicated in: {drug.contraindications.join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {drug.notes && (
                      <div className="flex gap-2">
                        <span className="text-[11px]">📝</span>
                        <p className="text-[11px] text-white/50 leading-relaxed">{drug.notes}</p>
                      </div>
                    )}

                    <p className="text-[10px] text-white/20">📚 {drug.ref}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Tab({ id, label, icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
        active
          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
          : 'bg-white/4 text-white/40 border border-transparent hover:bg-white/8'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
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
