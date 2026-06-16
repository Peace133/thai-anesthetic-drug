import { calcBMI, calcIBW, calcLBW, bmiClass } from '../utils.js';

const COMORBIDITIES = [
  { id: 'cardiac',      label: 'Cardiac Disease',    icon: '❤️' },
  { id: 'hypovolemia',  label: 'Hypovolemia/Shock',  icon: '💧' },
  { id: 'renal',        label: 'Renal Failure',      icon: '🫘' },
  { id: 'hepatic',      label: 'Hepatic Failure',    icon: '🟡' },
  { id: 'copd',         label: 'COPD',               icon: '🌬️' },
  { id: 'dm',           label: 'Diabetes',           icon: '🩸' },
  { id: 'raised_icp',   label: 'Raised ICP',         icon: '🧠' },
  { id: 'mh',           label: 'Malignant Hyperthermia', icon: '🔥' },
  { id: 'burns',        label: 'Burns / Crush',      icon: '🩹' },
  { id: 'dmd',          label: 'Neuromuscular Dz',   icon: '💪' },
  { id: 'hyperkalemia', label: 'Hyperkalemia',       icon: '⚡' },
  { id: 'porphyria',    label: 'Porphyria',          icon: '🧬' },
];

export default function PatientForm({ patient, onChange, onReset }) {
  const { weightKg, heightCm, age, sex, comorbidities } = patient;
  const ready = weightKg > 0 && heightCm > 0 && age > 0;

  const bmi = ready ? calcBMI(weightKg, heightCm) : null;
  const ibw = ready ? calcIBW(sex, heightCm) : null;
  const lbw = ready ? calcLBW(sex, weightKg, heightCm) : null;
  const bc  = bmi ? bmiClass(bmi) : null;

  function toggleComorbidity(id) {
    const next = comorbidities.includes(id)
      ? comorbidities.filter(c => c !== id)
      : [...comorbidities, id];
    onChange({ ...patient, comorbidities: next });
  }

  function set(field, value) {
    onChange({ ...patient, [field]: value });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-500 rounded-full" />
          <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Patient</span>
        </div>
        {ready && (
          <button
            onClick={onReset}
            className="text-[10px] text-white/25 hover:text-white/50 transition-colors px-2 py-0.5 rounded"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Basic inputs — 2-column grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Weight (kg)">
            <input
              type="number" min="1" max="300"
              value={weightKg || ''}
              onChange={e => set('weightKg', parseFloat(e.target.value) || 0)}
              className="input-base"
              placeholder="70"
            />
          </Field>
          <Field label="Height (cm)">
            <input
              type="number" min="50" max="250"
              value={heightCm || ''}
              onChange={e => set('heightCm', parseFloat(e.target.value) || 0)}
              className="input-base"
              placeholder="170"
            />
          </Field>
          <Field label="Age">
            <input
              type="number" min="0" max="120"
              value={age || ''}
              onChange={e => set('age', parseInt(e.target.value) || 0)}
              className="input-base"
              placeholder="40"
            />
          </Field>
          <Field label="Sex">
            <select
              value={sex}
              onChange={e => set('sex', e.target.value)}
              className="input-base"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
        </div>

        {/* Status — either prompt or stats */}
        {!ready ? (
          <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2.5">
            <p className="text-[11px] text-blue-400/60 text-center">Enter weight, height &amp; age to calculate doses</p>
          </div>
        ) : (
          <>
            {/* Calculated weights */}
            <div className="grid grid-cols-3 gap-1.5">
              <StatBox label="BMI" value={bmi.toFixed(1)}>
                <span className="text-[10px] font-bold mt-0.5" style={{ color: bc.color }}>{bc.label}</span>
              </StatBox>
              <StatBox label="IBW" value={`${ibw.toFixed(0)} kg`} />
              <StatBox label="LBW" value={`${lbw.toFixed(0)} kg`} />
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-1">
              {age >= 65 && <Flag text="Elderly ≥65" color="#f97316" />}
              {bmi >= 40 && <Flag text="Morbid Obese" color="#ef4444" />}
              {bmi >= 30 && bmi < 40 && <Flag text={`Obese BMI ${bmi.toFixed(0)}`} color="#f97316" />}
              {bmi < 18.5 && <Flag text="Underweight" color="#60a5fa" />}
            </div>
          </>
        )}

        {/* Comorbidities */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Comorbidities</p>
            {comorbidities.length > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-400 rounded-full px-1.5 py-0.5 font-bold">
                {comorbidities.length}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {COMORBIDITIES.map(c => {
              const active = comorbidities.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleComorbidity(c.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all border ${
                    active
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : 'bg-white/3 border-white/6 text-white/45 hover:bg-white/6 hover:text-white/65'
                  }`}
                >
                  <span className="text-[12px] flex-shrink-0">{c.icon}</span>
                  <span className="text-[11px] font-medium">{c.label}</span>
                  {active && (
                    <span className="ml-auto text-[10px] text-red-400 font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function StatBox({ label, value, children }) {
  return (
    <div className="rounded-lg p-2.5 flex flex-col" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <p className="text-[9px] text-white/35 uppercase tracking-wider font-bold">{label}</p>
      <p className="text-sm font-bold text-white mt-0.5">{value}</p>
      {children}
    </div>
  );
}

function Flag({ text, color }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: color + '22', color }}>
      ⚠ {text}
    </span>
  );
}
