// IBW / LBW / dose calculation utilities

// Ideal Body Weight (Devine formula)
// sex: 'male' | 'female', height in cm
export function calcIBW(sex, heightCm) {
  const heightInches = heightCm / 2.54;
  const base = sex === 'male' ? 50 : 45.5;
  return Math.max(base + 2.3 * (heightInches - 60), base);
}

// Lean Body Weight (Janmahasatian formula)
// weight in kg, height in cm
export function calcLBW(sex, weightKg, heightCm) {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  if (sex === 'male') {
    return (9270 * weightKg) / (6680 + 216 * bmi);
  }
  return (9270 * weightKg) / (8780 + 244 * bmi);
}

// BMI
export function calcBMI(weightKg, heightCm) {
  return weightKg / Math.pow(heightCm / 100, 2);
}

// Determine dosing weight based on drug's weightBasis
// Returns { kg, label }
export function dosingWeight(drug, patient) {
  const { weightKg, heightCm, sex } = patient;
  const ibw = calcIBW(sex, heightCm);
  const lbw = calcLBW(sex, weightKg, heightCm);
  const bmi = calcBMI(weightKg, heightCm);
  const isObese = bmi >= 30;

  if (drug.weightBasis === 'fixed') return { kg: 1, label: 'fixed dose' };
  if (drug.weightBasis === 'IBW') {
    const w = isObese ? ibw : weightKg;
    return { kg: w, label: isObese ? `IBW ${ibw.toFixed(1)} kg` : `TBW ${weightKg} kg` };
  }
  if (drug.weightBasis === 'LBW') return { kg: lbw, label: `LBW ${lbw.toFixed(1)} kg` };
  return { kg: weightKg, label: `TBW ${weightKg} kg` };
}

// Dose adjustment multiplier based on patient characteristics
export function doseKey(drug, patient) {
  const { age, comorbidities } = patient;
  const bmi = calcBMI(patient.weightKg, patient.heightCm);
  const isObese = bmi >= 30;
  const isElderly = age >= 65;
  const isCardiac = comorbidities.includes('cardiac');

  // Pick the most appropriate dose tier from the drug's dose map
  if (drug.doses) {
    if (isCardiac && drug.doses.cardiac) return 'cardiac';
    if (comorbidities.includes('hypovolemia') && drug.doses.hypo) return 'hypo';
    if (isElderly && drug.doses.elderly) return 'elderly';
    if (isObese && drug.doses.obese) return 'obese';
  }
  return 'standard';
}

// Calculate dose range for a drug given patient data
// Returns { minMg, maxMg, minVol, maxVol, unit, concLabel, weightLabel, tier, cappedByMax }
export function calcDose(drug, patient, selectedConc) {
  const conc = selectedConc || drug.concentration[0];
  const tier = doseKey(drug, patient);
  const doses = drug.doses[tier] || drug.doses.standard;
  const { kg, label: weightLabel } = dosingWeight(drug, patient);

  let minDose = doses.min * kg;
  let maxDose = doses.max * kg;

  // Apply max cap if defined
  let capped = false;
  if (drug.maxDose) {
    if (minDose > drug.maxDose) { minDose = drug.maxDose; capped = true; }
    if (maxDose > drug.maxDose) { maxDose = drug.maxDose; capped = true; }
  }

  const minVol = minDose / conc.mgPerMl;
  const maxVol = maxDose / conc.mgPerMl;

  return {
    tier,
    weightLabel,
    unit: drug.unit,
    concLabel: conc.label,
    minDose: +minDose.toFixed(2),
    maxDose: +maxDose.toFixed(2),
    minVol: +minVol.toFixed(2),
    maxVol: +maxVol.toFixed(2),
    cappedByMax: capped,
    isMcg: drug.isMcg || false,
    isInfusion: drug.isInfusion || false,
  };
}

// Quick BMI classification
export function bmiClass(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#60a5fa' };
  if (bmi < 25)   return { label: 'Normal',       color: '#34d399' };
  if (bmi < 30)   return { label: 'Overweight',   color: '#fbbf24' };
  if (bmi < 35)   return { label: 'Obese I',      color: '#f97316' };
  if (bmi < 40)   return { label: 'Obese II',     color: '#ef4444' };
  return             { label: 'Obese III',         color: '#dc2626' };
}
