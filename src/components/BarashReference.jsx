import { useState, useMemo } from 'react';
import { BARASH_CATEGORIES, BARASH_DRUGS } from '../barash_drugs.js';

export default function BarashReference() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = activeCategory === 'all' ? BARASH_DRUGS : BARASH_DRUGS.filter(d => d.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.indication?.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, search]);

  const grouped = BARASH_CATEGORIES
    .filter(c => c.id !== 'all')
    .filter(cat => search.trim() ? true : (activeCategory === 'all' || cat.id === activeCategory))
    .map(cat => ({ ...cat, drugs: filtered.filter(d => d.category === cat.id) }))
    .filter(cat => cat.drugs.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Source badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
        <span className="text-amber-400 text-xs">📚</span>
        <p className="text-[11px] text-amber-400/80 font-medium">Barash Clinical Anesthesia, 9th Edition</p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm select-none">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveCategory('all'); }}
          placeholder="Search drugs…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20
                     focus:outline-none focus:border-amber-500/50 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 text-xs">✕</button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {BARASH_CATEGORIES.map(cat => (
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
                {/* Header row */}
                <button
                  className="w-full text-left px-4 py-3 flex items-start gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : drug.id)}
                >
                  <div
                    className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
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
                    <p className="text-[10px] text-blue-400/50 mt-0.5">{drug.concentration}</p>
                  </div>

                  {/* Dose preview — first dose range */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-white/70">
                      {drug.doseRanges[0]?.dose}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">{drug.doseRanges[0]?.population}</p>
                  </div>

                  <svg
                    className={`w-4 h-4 text-white/30 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">

                    {/* Mechanism */}
                    <div className="flex gap-2">
                      <span className="text-[11px] flex-shrink-0">🔬</span>
                      <p className="text-[11px] text-blue-300/80">{drug.mechanism}</p>
                    </div>

                    {/* Dose table */}
                    <div className="bg-white/3 rounded-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-white/6">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Dose by Population</p>
                      </div>
                      <table className="w-full text-xs">
                        <tbody>
                          {drug.doseRanges.map((r, i) => (
                            <tr key={i} className="border-b border-white/4 last:border-0">
                              <td className="py-2 px-3 text-white/50 w-1/3">{r.population}</td>
                              <td className="py-2 px-3 font-bold text-white">{r.dose}</td>
                              {r.note && (
                                <td className="py-2 px-3 text-white/30 text-[10px]">{r.note}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Key points */}
                    {drug.keyPoints?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Key Points</p>
                        {drug.keyPoints.map((pt, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-white/20 text-[11px] flex-shrink-0 mt-0.5">•</span>
                            <p className="text-[11px] text-white/55 leading-relaxed">{pt}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Side effects */}
                    {drug.sideEffects && (
                      <div className="flex gap-2">
                        <span className="text-[11px] flex-shrink-0">⚠️</span>
                        <p className="text-[11px] text-amber-400/70 leading-relaxed">{drug.sideEffects}</p>
                      </div>
                    )}

                    {/* Contraindications */}
                    {drug.contraindications && (
                      <div className="flex gap-2">
                        <span className="text-[11px] flex-shrink-0">⛔</span>
                        <p className="text-[11px] text-red-400/80 leading-relaxed">{drug.contraindications}</p>
                      </div>
                    )}

                    {/* Reference */}
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
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          : 'bg-white/4 text-white/40 border border-transparent hover:bg-white/8'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
