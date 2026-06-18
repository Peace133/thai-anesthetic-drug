import { useState, useMemo, useEffect } from 'react';
import { calcDose, calcIBW, calcLBW } from '../utils.js';
import { DRUGS as MILLERS_DRUGS } from '../drugs.js';
import { DRUGS as BARASH_DRUGS }  from '../barash_calc_drugs.js';

const CATEGORY_LABELS = {
  induction:   'Induction Agent',
  benzo:       'Benzodiazepine',
  opioid:      'Opioid',
  ndmr:        'NMB — Non-depolarizing',
  dmr:         'NMB — Depolarizing',
  reversal:    'Reversal Agent',
  vasopressor: 'Vasopressor',
  antiemetic:  'Antiemetic',
  emergency:   'Emergency',
  local:       'Local Anesthetic',
};

// Merge both references, deduplicate by name (Miller's takes priority)
const _seen = new Set();
const AnesdrugDB = [...MILLERS_DRUGS, ...BARASH_DRUGS].filter(d => {
  const key = d.name.toLowerCase();
  if (_seen.has(key)) return false;
  _seen.add(key);
  return true;
});

const CATEGORY_META = [
  { id: 'induction',   short: 'Induction'  },
  { id: 'benzo',       short: 'Benzo'      },
  { id: 'opioid',      short: 'Opioids'    },
  { id: 'ndmr',        short: 'NMB ND'     },
  { id: 'dmr',         short: 'NMB D'      },
  { id: 'reversal',    short: 'Reversal'   },
  { id: 'vasopressor', short: 'Vasopres.'  },
  { id: 'antiemetic',  short: 'Antiemetic' },
  { id: 'emergency',   short: 'Emergency'  },
  { id: 'local',       short: 'Local'      },
];

const CATEGORIES_IN_USE = CATEGORY_META.filter(c =>
  AnesdrugDB.some(d => d.category === c.id)
);

const CUSTOM_UNITS = ['mg/kg', 'mcg/kg', 'mg', 'mcg'];
const CUSTOM_COLOR = '#f59e0b';

export default function DraftMode({ patient, resetKey }) {
  const ready = patient.weightKg > 0 && patient.heightCm > 0 && patient.age > 0;

  const [draftItems, setDraftItems]     = useState([]);
  const [customDrugs, setCustomDrugs]   = useState([]);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES_IN_USE[0]?.id || 'induction');
  const [query, setQuery]               = useState('');
  const [addName, setAddName]           = useState('');
  const [addConc, setAddConc]           = useState('');
  const [addUnit, setAddUnit]           = useState('mg/kg');
  const [showAddForm, setShowAddForm]   = useState(false);

  useEffect(() => {
    if (resetKey === 0) return;
    setDraftItems([]);
    setCustomDrugs([]);
    setQuery('');
  }, [resetKey]);

  const addedIds = useMemo(() => new Set(draftItems.map(i => i.id)), [draftItems]);

  const allDrugs = useMemo(() => [...AnesdrugDB, ...customDrugs], [customDrugs]);

  const panelCategories = useMemo(() => {
    const cats = [...CATEGORIES_IN_USE];
    if (customDrugs.length > 0) cats.push({ id: 'custom', label: 'Custom', short: 'Custom' });
    return cats;
  }, [customDrugs]);

  const rightDrugs = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return allDrugs.filter(d => d.name.toLowerCase().includes(q));
    }
    if (activeCategory === 'custom') return customDrugs;
    return allDrugs.filter(d => d.category === activeCategory);
  }, [query, activeCategory, allDrugs, customDrugs]);

  function selectedInCategory(catId) {
    const drugs = catId === 'custom'
      ? customDrugs
      : allDrugs.filter(d => d.category === catId);
    return drugs.filter(d => addedIds.has(d.id)).length;
  }

  function toggleDrug(drug) {
    if (addedIds.has(drug.id)) {
      setDraftItems(prev => prev.filter(i => i.id !== drug.id));
    } else {
      setDraftItems(prev => [...prev, {
        id:          drug.id,
        drug,
        dose:        '',
        unit:        drug.unit || 'mg/kg',
        weightBasis: drug.weightBasis || 'TBW',
        concIdx:     0,
      }]);
    }
  }

  function removeDrug(id) {
    setDraftItems(prev => prev.filter(i => i.id !== id));
  }

  function updateItem(id, changes) {
    setDraftItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));
  }

  function handleAddCustom() {
    const name = addName.trim();
    if (!name) return;
    const concMgMl = parseFloat(addConc);
    const concentration = (!isNaN(concMgMl) && concMgMl > 0)
      ? [{ label: `${addConc} mg/mL`, mgPerMl: concMgMl }]
      : [];
    const drug = {
      id:            'custom_' + Date.now(),
      name,
      indication:    '',
      concentration,
      unit:          addUnit,
      weightBasis:   'TBW',
      doses:         null,
      color:         CUSTOM_COLOR,
      isCustom:      true,
    };
    setCustomDrugs(prev => [...prev, drug]);
    setDraftItems(prev => [...prev, { id: drug.id, drug, dose: '', unit: addUnit, weightBasis: 'TBW', concIdx: 0 }]);
    setAddName('');
    setAddConc('');
    setAddUnit('mg/kg');
    setShowAddForm(false);
    setActiveCategory('custom');
  }

  return (
    <div className="space-y-3">

      {/* ── Drug picker — two panel ── */}
      <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'var(--bg-card)' }}>

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
          <div className="w-1 h-4 bg-amber-500 rounded-full" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Drug Selection</span>
          {draftItems.length > 0 && (
            <span className="text-[10px] text-amber-400/60 font-semibold">{draftItems.length} selected</span>
          )}
          <button
            onClick={() => { setShowAddForm(v => !v); setAddName(''); setAddConc(''); setAddUnit('mg/kg'); }}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all active:scale-95 ${
              showAddForm
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Drug
          </button>
        </div>

        {/* Custom drug form */}
        {showAddForm && (
          <div className="px-3 pt-3 pb-3 border-b border-white/6 space-y-2">
            {/* Row 1 — name */}
            <input
              autoFocus
              value={addName}
              onChange={e => setAddName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              placeholder="Drug name…"
              className="w-full bg-white/5 border border-amber-500/30 rounded-xl px-3 py-2
                         text-sm text-white placeholder-white/20 focus:outline-none
                         focus:border-amber-500/60 transition-all"
            />
            {/* Row 2 — preparation + unit + add button */}
            <div className="flex gap-2">
              {/* Concentration */}
              <div className="flex items-center gap-1.5 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2
                              focus-within:border-amber-500/40 transition-all">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={addConc}
                  onChange={e => setAddConc(e.target.value)}
                  placeholder="Conc."
                  className="w-full bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
                />
                <span className="text-[11px] text-white/30 flex-shrink-0">mg/mL</span>
              </div>
              {/* Unit */}
              <div className="relative flex-shrink-0">
                <select
                  value={addUnit}
                  onChange={e => setAddUnit(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-3 pr-7 py-2
                             text-sm text-white focus:outline-none focus:border-amber-500/40
                             transition-all cursor-pointer"
                  style={{ background: 'var(--bg-surface)' }}
                >
                  {CUSTOM_UNITS.map(u => <option key={u} value={u} style={{ background: 'var(--bg-surface)' }}>{u}</option>)}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {/* Add */}
              <button
                onClick={handleAddCustom}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40
                           text-amber-300 text-sm font-bold hover:bg-amber-500/30 transition-all active:scale-95"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="px-3 py-2 border-b border-white/6 relative">
          <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search drugs..."
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-8 py-2
                       text-sm text-white placeholder-white/20 focus:outline-none
                       focus:border-amber-500/40 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Two-panel body */}
        <div className="flex" style={{ height: '340px' }}>

          {/* Left — category list */}
          <div className="flex-shrink-0 overflow-y-auto border-r border-white/8 scrollbar-hide"
            style={{ width: '110px', background: 'var(--bg-sidebar)' }}>
            {panelCategories.map(cat => {
              const count = selectedInCategory(cat.id);
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-3 py-3 flex items-center justify-between gap-1 border-b border-white/4 transition-colors ${
                    active
                      ? 'bg-amber-500/12 border-l-2 border-l-amber-500'
                      : 'hover:bg-white/4 border-l-2 border-l-transparent'
                  }`}
                >
                  <span className={`text-[11px] font-semibold leading-tight ${active ? 'text-amber-300' : 'text-white/50'}`}>
                    {cat.short}
                  </span>
                  {count > 0 && (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right — drug rows */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {rightDrugs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[11px] text-white/20">No drugs</p>
              </div>
            ) : (
              rightDrugs.map(drug => {
                const added = addedIds.has(drug.id);
                return (
                  <button
                    key={drug.id}
                    onClick={() => toggleDrug(drug)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-white/4 last:border-0 transition-colors ${
                      added ? 'bg-amber-500/8 hover:bg-amber-500/12' : 'hover:bg-white/4'
                    }`}
                  >
                    {/* Color dot */}
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: drug.color || '#6366f1' }} />

                    {/* Name + unit */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-[12px] font-semibold truncate ${added ? 'text-amber-200' : 'text-white/80'}`}>
                        {drug.name}
                      </p>
                      <p className="text-[9px] text-white/25">{drug.unit}</p>
                    </div>

                    {/* High alert */}
                    {drug.isHighAlert && (
                      <span className="text-[8px] font-bold flex-shrink-0" style={{ color: '#f59e0b' }}>⚠</span>
                    )}

                    {/* Toggle */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      added
                        ? 'bg-amber-500/25 text-amber-400'
                        : 'bg-white/5 text-white/25 hover:bg-white/10 hover:text-white/60'
                    }`}>
                      {added
                        ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                      }
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* ── Draft result list ── */}
      {draftItems.length > 0 && (
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full" />
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Drug List</span>
            <span className="text-[10px] text-white/20">{draftItems.length} drugs</span>
          </div>
          <div className="divide-y divide-white/4">
            {draftItems.map(item => (
              <DraftDrugRow
                key={item.id}
                item={item}
                patient={patient}
                ready={ready}
                onUpdate={changes => updateItem(item.id, changes)}
                onRemove={() => removeDrug(item.id)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function DraftDrugRow({ item, patient, ready, onUpdate, onRemove }) {
  const { drug, dose, unit, weightBasis, concIdx = 0 } = item;
  const doseNum  = parseFloat(dose);
  const isCustom = drug.isCustom || false;
  const concs    = drug.concentration || [];
  const conc     = concs[concIdx] ?? concs[0];

  const isMcg      = unit.includes('mcg') && !unit.includes('/min');
  const isFixed    = unit === 'mg' || unit === 'mcg';
  const isInfusion = unit.includes('/min') || unit.includes('/h');

  const dosingWt = useMemo(() => {
    if (!ready) return 0;
    if (weightBasis === 'IBW') return calcIBW(patient.sex, patient.heightCm);
    if (weightBasis === 'LBW') return calcLBW(patient.sex, patient.weightKg, patient.heightCm);
    return patient.weightKg;
  }, [weightBasis, patient, ready]);

  const hasDoses    = drug.doses?.standard?.min != null;
  const calcPatient = useMemo(() => ({ ...patient, weightKg: dosingWt || patient.weightKg }), [patient, dosingWt]);
  const calc        = ready && hasDoses && !isCustom ? calcDose(drug, calcPatient, conc) : null;

  let result = null;
  if (doseNum > 0 && ready) {
    const wt = dosingWt || patient.weightKg;
    if (isFixed) {
      const totalMg = isMcg ? doseNum / 1000 : doseNum;
      result = { totalMg, totalMcg: isMcg ? doseNum : null, vol: conc ? totalMg / conc.mgPerMl : null };
    } else if (isInfusion) {
      result = { ratePerMin: doseNum * wt };
    } else {
      const totalMg  = isMcg ? (doseNum * wt) / 1000 : doseNum * wt;
      const totalMcg = isMcg ? doseNum * wt : null;
      result = { totalMg, totalMcg, vol: conc ? totalMg / conc.mgPerMl : null };
    }
  }

  return (
    <div className="px-3 py-2.5 space-y-2">

      {/* Row 1: dot · name · badges · × */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: drug.color || '#6366f1' }} />
        <span className="text-[13px] font-semibold text-white truncate">{drug.name}</span>
        {drug.isHighAlert && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: '#f59e0b18', color: '#f59e0b' }}>⚠ HIGH ALERT</span>
        )}
        {isCustom && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: '#f59e0b18', color: '#f59e0b' }}>custom</span>
        )}
        <button onClick={onRemove} className="ml-auto flex-shrink-0 p-1 text-white/15 hover:text-red-400 transition-colors rounded">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Row 2: weight basis + preparation (separate sections) */}
      <div className="flex items-center gap-3">
        {/* Weight basis */}
        {!isFixed && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider mr-0.5">Wt</span>
            {['TBW','IBW','LBW'].map(wb => (
              <button key={wb} onClick={() => onUpdate({ weightBasis: wb })}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                  weightBasis === wb
                    ? 'bg-indigo-500/25 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/4 border-white/8 text-white/25 hover:text-white/50'
                }`}>
                {wb}
              </button>
            ))}
            {ready && <span className="text-[10px] text-white/25 pl-0.5">{dosingWt.toFixed(0)} kg</span>}
          </div>
        )}

        {/* Preparation — only if multiple concentrations */}
        {concs.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-wider mr-0.5">Prep</span>
            {concs.map((c, i) => (
              <button key={i} onClick={() => onUpdate({ concIdx: i })}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                  concIdx === i
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/4 border-white/8 text-white/25 hover:text-white/50'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row 3: dose input · unit · = result */}
      <div className="flex items-center gap-1.5">
        <input
          type="number" min="0" step="any"
          value={dose}
          onChange={e => onUpdate({ dose: e.target.value })}
          placeholder="Dose"
          className="w-24 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5
                     text-sm text-white placeholder-white/20 focus:outline-none
                     focus:border-amber-500/40 transition-all"
        />

        {isCustom ? (
          <select value={unit} onChange={e => onUpdate({ unit: e.target.value })}
            className="appearance-none bg-white/5 border border-white/10 rounded-lg
                       px-2 py-1 text-[10px] font-semibold text-white/50 focus:outline-none
                       focus:border-amber-500/40 cursor-pointer transition-all"
            style={{ background: 'var(--bg-surface)' }}>
            {CUSTOM_UNITS.map(u => <option key={u} value={u} style={{ background: 'var(--bg-surface)' }}>{u}</option>)}
          </select>
        ) : (
          <span className="text-[10px] font-semibold text-white/35 flex-shrink-0">{drug.unit || 'mg/kg'}</span>
        )}

        {result ? (
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-lg border border-blue-500/30 bg-blue-500/12">
            <span className="text-sm font-bold text-blue-200 leading-none">
              {!isFixed && !isInfusion && (
                result.totalMcg != null
                  ? `${result.totalMcg.toFixed(1)} mcg`
                  : `${result.totalMg.toFixed(2)} mg`
              )}
              {isFixed && `${doseNum} ${isMcg ? 'mcg' : 'mg'}`}
              {isInfusion && `${result.ratePerMin.toFixed(1)} ${isMcg ? 'mcg' : 'mg'}/min`}
            </span>
            {result.vol != null && (
              <>
                <span className="text-[9px] text-blue-400/40">·</span>
                <span className="text-xs font-semibold text-blue-300/80 leading-none">{result.vol.toFixed(1)} mL</span>
              </>
            )}
          </div>
        ) : (
          calc && !drug.isInfusion && (
            <span className="text-[9px] text-indigo-400/40 ml-auto flex-shrink-0">
              {calc.minDose}–{calc.maxDose} {drug.unit}
            </span>
          )
        )}
      </div>

    </div>
  );
}
