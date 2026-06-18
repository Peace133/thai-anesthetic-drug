// AnesdrugDB — merged anesthetic drug database
// Sources: Miller's Anesthesia 9e (drugs.js) + Barash Clinical Anesthesia 8e (barash_calc_drugs.js)
// Deduplicated by drug name (case-insensitive). Miller's entries take priority.
// Exports full drug objects so any component can import from here alone.

import { DRUGS as MILLERS_DRUGS } from './drugs.js';
import { DRUGS as BARASH_DRUGS }  from './barash_calc_drugs.js';

export const CATEGORY_LABELS = {
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

// Tag each drug with its source book, Miller's listed first (priority)
const tagged = [
  ...MILLERS_DRUGS.map(d => ({ ...d, source: "Miller's" })),
  ...BARASH_DRUGS.map(d  => ({ ...d, source: 'Barash'   })),
];

// Deduplicate by name only — one entry per unique drug name, full object preserved
const nameSeen = new Set();
export const AnesdrugDB = tagged.filter(d => {
  const key = d.name.toLowerCase();
  if (nameSeen.has(key)) return false;
  nameSeen.add(key);
  return true;
});

// Unique drug names
export const DRUG_NAMES = AnesdrugDB.map(d => d.name);

// Grouped by category id
export const AnesdrugDB_GROUPED = AnesdrugDB.reduce((acc, d) => {
  const cat = d.category || 'other';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(d);
  return acc;
}, {});
