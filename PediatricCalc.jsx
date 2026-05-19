import { useState, useEffect, useRef } from "react";

// ─── COLOR SYSTEM ────────────────────────────────────────────────────────────
const COLORS = {
  bg: "#ffffff",
  surface: "#f8f9fb",
  card: "#ffffff",
  cardHover: "#f0f4f8",
  border: "#d0d9e3",
  accent: "#0066cc",
  accentDim: "#4d94ff",
  accentGlow: "rgba(0,102,204,0.08)",
  success: "#0f9960",
  warning: "#d9822b",
  danger: "#db3737",
  dangerBright: "#c23030",
  text: "#1a2332",
  textMuted: "#5f6b7c",
  textSub: "#8a9ba8",
  green: "#0f9960",
  orange: "#d9822b",
  navy: "#1a2332",
};

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
// Remove trailing zeros ONLY after decimal point (preserves 8000, removes from 12.50)
const stripTrailingZeros = (num) => {
  if (typeof num === 'string') return num;
  const str = num.toFixed(10);
  // Only strip zeros after decimal: 12.500 → 12.5, 8000.0 → 8000
  return str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
};

// ─── CALCULATOR DEFINITIONS ──────────────────────────────────────────────────
const CATEGORIES = [
  { id: "neonatal",    label: "Neonatal",    icon: "👶🏼" },
  { id: "fluid",       label: "FEN",         icon: "💧" },
  { id: "neurologic",  label: "Neurologic",  icon: "🧠" },
  { id: "respiratory", label: "Respiratory", icon: "🫁" },
  { id: "cardiac",     label: "Cardiac",     icon: "♥️" },
  { id: "toxicology",  label: "Toxicology",  icon: "☠️" },
  { id: "dosing",      label: "Common Rx",   icon: "💊" },
  { id: "readmission", label: "Risk Scores", icon: "📊" },
];

// ─── CALCULATOR REFERENCE INFORMATION ────────────────────────────────────────
const CALC_REFERENCES = {
  apgar: {
    title: "APGAR Score",
    reference: "Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32(4):260-267.",
    guidelines: "AAP/ACOG Guidelines for Perinatal Care, 8th Edition (2017)",
    summary: "Assessment of newborn vitality at 1, 5, and 10 minutes of life. Scores ≥7 are generally normal. Scores 4-6 indicate moderate depression. Scores ≤3 indicate severe depression requiring immediate intervention."
  },
  pgcs: {
    title: "Pediatric Glasgow Coma Scale",
    reference: "James HE. Neurologic Evaluation and Support in the Child with an Acute Brain Insult. Pediatr Ann. 1986;15(1):16-22.",
    guidelines: "Modified for infants <2 years with age-appropriate verbal responses",
    summary: "Score 13-15: Mild TBI. Score 9-12: Moderate TBI. Score 3-8: Severe TBI. Assess eye opening, verbal response, and motor response."
  },
  cows: {
    title: "Clinical Opiate Withdrawal Scale",
    reference: "Wesson DR, Ling W. The Clinical Opiate Withdrawal Scale (COWS). J Psychoactive Drugs. 2003;35(2):253-259.",
    guidelines: "SAMHSA Treatment Improvement Protocol (TIP) 63",
    summary: "Score 5-12: Mild withdrawal. Score 13-24: Moderate withdrawal. Score 25-36: Moderately severe. Score >36: Severe withdrawal. Consider pharmacotherapy at score ≥8."
  },
  finnegan: {
    title: "Modified Finnegan Neonatal Abstinence Score",
    reference: "Finnegan LP, Connaughton JF Jr, Kron RE, Emich JP. Neonatal abstinence syndrome: assessment and management. Addict Dis. 1975;2(1-2):141-158.",
    guidelines: "AAP Clinical Report on Neonatal Drug Withdrawal (2012)",
    summary: "Score ≥8 for three consecutive assessments or ≥12 for two consecutive assessments indicates need for pharmacologic treatment. Assess every 3-4 hours."
  },
  wat1: {
    title: "Withdrawal Assessment Tool-1 (WAT-1)",
    reference: "Franck LS, Harris SK, Soetenga DJ, et al. The Withdrawal Assessment Tool-Version 1 (WAT-1): An Assessment Instrument for Monitoring Opioid and Benzodiazepine Withdrawal Symptoms in Pediatric Patients. Pediatr Crit Care Med. 2008;9(6):573-580.",
    guidelines: "Society of Critical Care Medicine PICU Sedation Guidelines (2016)",
    summary: "Score ≥3 suggests iatrogenic withdrawal from opioids/benzodiazepines. Assess over 2-hour observation window in PICU patients."
  },
  apap: {
    title: "Acetaminophen Toxicity (Rumack-Matthew Nomogram)",
    reference: "Rumack BH, Matthew H. Acetaminophen poisoning and toxicity. Pediatrics. 1975;55(6):871-876.",
    guidelines: "AAP Clinical Report on Acetaminophen Toxicity (2001), Updated 2019",
    summary: "Treatment line: 150 mcg/mL at 4h, declining to 4.7 mcg/mL at 24h. Levels above line require N-acetylcysteine (NAC). Levels <4h unreliable. NAC protocol: 150 mg/kg load over 1h, then 50 mg/kg over 4h, then 100 mg/kg over 16h."
  },
  bilirubin: {
    title: "Neonatal Hyperbilirubinemia (Bhutani Nomogram)",
    reference: "Bhutani VK, Johnson L, Sivieri EM. Predictive ability of a predischarge hour-specific serum bilirubin for subsequent significant hyperbilirubinemia in healthy term and near-term newborns. Pediatrics. 1999;103(1):6-14.",
    guidelines: "AAP Clinical Practice Guideline: Management of Hyperbilirubinemia in the Newborn Infant ≥35 Weeks' Gestation (2022)",
    summary: "Risk zones predict likelihood of severe hyperbilirubinemia. Phototherapy and exchange transfusion thresholds adjusted for gestational age and risk factors. High-risk: isoimmune hemolytic disease, G6PD deficiency, asphyxia, sepsis, acidosis."
  },
  readmission: {
    title: "Pediatric Readmission Risk Score",
    reference: "Berry JG, Toomey SL, Zaslavsky AM, et al. Pediatric readmission prevalence and variability across hospitals. JAMA. 2013;309(4):372-380.",
    guidelines: "Multiple validated models including PRAF, LACE, HOSPITAL score",
    summary: "Identifies children at high risk for 30-day readmission. Key factors: prior admissions, complex chronic conditions, length of stay, insurance type, ICU stay, polypharmacy. Used for discharge planning and follow-up intensity."
  },
  pews: {
    title: "Pediatric Early Warning Score (PEWS)",
    reference: "Monaghan A. Detecting and managing deterioration in children. Paediatr Nurs. 2005;17(1):32-35.",
    guidelines: "Multiple institutional versions; Brighton PEWS widely validated",
    summary: "Score 0-1: Routine care. Score 2-3: Close monitoring, increase assessment frequency. Score 4-5: Urgent medical review. Score ≥6: Immediate intervention, consider rapid response team."
  },
  pecarn: {
    title: "PECARN Head CT Rule",
    reference: "Kuppermann N, Holmes JF, Dayan PS, et al. Identification of children at very low risk of clinically-important brain injuries after head trauma: a prospective cohort study. Lancet. 2009;374(9696):1160-1170.",
    guidelines: "PECARN TBI Algorithm (2009)",
    summary: "Age-stratified decision rule (<2y vs ≥2y). High-risk criteria mandate CT. Medium-risk suggests CT or observation. Sensitivity >96% for clinically important TBI."
  },
  fluid: {
    title: "Maintenance Fluids (Holliday-Segar)",
    reference: "Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics. 1957;19(5):823-832.",
    guidelines: "AAP 2018 recommends isotonic solutions (NS or LR) for maintenance to reduce hyponatremia risk. Holliday-Segar modified rates appropriate for clinical context.",
    summary: "100 mL/kg/day for first 10 kg + 50 mL/kg/day for next 10 kg + 20 mL/kg/day for each kg >20 kg. The 4:2:1 rule approximates this hourly. The two methods converge exactly at 35 kg; below this the 4:2:1 underestimates H-S, above it overestimates.",
    showErrorChart: true,
  },
  dose: {
    title: "Common Pediatric Drug Dosing",
    reference: "Compiled from Lexicomp Pediatric & Neonatal Dosage Handbook (2024) and AAP Red Book (2024)",
    guidelines: "AAP dosing recommendations and FDA pediatric labeling",
    summary: "Weight-based dosing for commonly used pediatric medications. Always verify dosing, check for drug interactions, and confirm patient allergies before administration."
  },
  u25gfr: {
    title: "U25 eGFR (Pediatric & Young Adult)",
    reference: "Pierce CB, Muñoz A, Ng DK, et al. Age- and sex-dependent clinical equations to estimate glomerular filtration rates in children and young adults with chronic kidney disease. Kidney Int. 2021;99(4):948-956.",
    guidelines: "KDIGO 2024 CKD Guidelines recommend U25 equations for age ≤25 years",
    summary: "Replaces older Schwartz equations. SCr-based: uses height and sex. Cystatin-C based: more accurate, less affected by muscle mass. Combined equation preferred when both biomarkers available. Valid for ages 1-25 years."
  },
  sepsis: {
    title: "Pediatric SIRS/Sepsis Criteria",
    reference: "Goldstein B, Giroir B, Randolph A. International pediatric sepsis consensus conference: definitions for sepsis and organ dysfunction in pediatrics. Pediatr Crit Care Med. 2005;6(1):2-8.",
    guidelines: "Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock in Children (2020)",
    summary: "SIRS: ≥2 criteria (abnormal temp or WBC count, plus tachycardia or tachypnea). Sepsis: SIRS + suspected/proven infection. Age-specific vital sign thresholds apply."
  },
  dvt: {
    title: "Wells DVT Score (Adapted for Pediatrics)",
    reference: "Wells PS, Anderson DR, Bormanis J, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. Lancet. 1997;350(9094):1795-1798. Pediatric adaptation: Faustino EV, et al. Thromb Res. 2014;134(6):1207-1212.",
    guidelines: "CHEST Guidelines on Antithrombotic Therapy in Neonates and Children (2012)",
    summary: "Score <1: Low probability. Score 1-2: Moderate probability. Score ≥3: High probability. Use with D-dimer and compression ultrasound for diagnostic workup."
  },
  bronchiolitis: {
    title: "Bronchiolitis Severity Assessment",
    reference: "Compiled from multiple validated scores including Respiratory Distress Assessment Instrument (RDAI) and Wang Bronchiolitis Score",
    guidelines: "AAP Clinical Practice Guideline: Diagnosis and Management of Bronchiolitis (2014, reaffirmed 2019)",
    summary: "Severity score guides disposition and need for respiratory support. Mild: discharge candidate. Moderate: observation or admission. Severe: admission, consider PICU for intensive monitoring/support."
  },
  asthma: {
    title: "PRAM (Pediatric Respiratory Assessment Measure)",
    reference: "Chalut DS, Ducharme FM, Davis GM. The Preschool Respiratory Assessment Measure (PRAM): a responsive index of acute asthma severity. J Pediatr. 2000;137(6):762-768.",
    guidelines: "NHLBI EPR-3 Guidelines for the Diagnosis and Management of Asthma (2007), updated 2020",
    summary: "Score 0-3: Mild. Score 4-7: Moderate. Score 8-12: Severe. Guides intensity of bronchodilator therapy and need for systemic corticosteroids. Validated for ages 2-17 years."
  },
  burns: {
    title: "Parkland Formula & Pediatric Burn Resuscitation",
    reference: "Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci. 1968;150(3):874-894. Lund-Browder chart: Lund CC, Browder NC. Surg Gynecol Obstet. 1944;79:352-358.",
    guidelines: "American Burn Association Practice Guidelines (2016)",
    summary: "Parkland: 4 mL/kg/% TBSA lactated Ringer's over 24h (half in first 8h, half in next 16h). Pediatric BSA estimation requires age-adjusted Lund-Browder chart. Exclude superficial (1st degree) burns from TBSA calculation."
  },
  qtc: {
    title: "Corrected QT Interval (Bazett Formula)",
    reference: "Bazett HC. An analysis of the time-relations of electrocardiograms. Heart. 1920;7:353-370.",
    guidelines: "AHA/ACCF/HRS Guidelines for Electrocardiography (2009)",
    summary: "Bazett formula: QTc = QT / √RR (in seconds). Normal QTc: <440 ms (prepubertal), <450 ms (adult males), <460 ms (adult females). Prolonged QTc >480 ms increases risk of torsades de pointes. Drug-induced, congenital LQTS, electrolyte abnormalities."
  },
  flacc: {
    title: "FLACC Pain Scale",
    reference: "Merkel SI, Voepel-Lewis T, Shayevitz JR, Malviya S. The FLACC: a behavioral scale for scoring postoperative pain in young children. Pediatr Nurs. 1997;23(3):293-297.",
    guidelines: "Used widely in pediatric perioperative and procedural settings",
    summary: "Behavioral pain assessment for ages 2 months to 7 years or non-verbal patients. Score 0: Relaxed/comfortable. Score 1-3: Mild discomfort. Score 4-6: Moderate pain. Score 7-10: Severe pain/discomfort."
  },
  glucose: {
    title: "Neonatal Hypoglycemia",
    reference: "Adamkin DH. Postnatal glucose homeostasis in late-preterm and term infants. Pediatrics. 2011;127(3):575-579.",
    guidelines: "AAP Clinical Report: Postnatal Glucose Homeostasis (2011)",
    summary: "Operational thresholds: 0-4h: ≥40 mg/dL, 4-24h: ≥45 mg/dL, >24h: ≥50 mg/dL. Symptomatic hypoglycemia at any level requires immediate IV glucose. Risk factors: IDM, SGA, LGA, late preterm, perinatal stress."
  },
  preterm: {
    title: "Prematurity Risk Assessment",
    reference: "WHO Definition of Preterm Birth. Engle WA, et al. 'Late-Preterm' Infants: A Population at Risk. Pediatrics. 2007;120(6):1390-1401.",
    guidelines: "AAP Committee on Fetus and Newborn Policy Statements",
    summary: "Extremely preterm: <28w. Very preterm: 28-31w. Moderate preterm: 32-33w. Late preterm: 34-36w. ELBW: <1000g. VLBW: <1500g. LBW: <2500g. SGA: <10th percentile for GA."
  },
  dehydration: {
    title: "Clinical Dehydration Assessment (WHO/Gorelick)",
    reference: "Gorelick MH, Shaw KN, Murphy KO. Validity and reliability of clinical signs in the diagnosis of dehydration in children. Pediatrics. 1997;99(5):E6.",
    guidelines: "WHO Treatment of Diarrhoea Manual (2005), CDC Guideline for Managing Acute Gastroenteritis (2003)",
    summary: "Score 0-2: <5% (minimal). Score 3-5: 5-9% (mild-moderate). Score 6-10: 10-14% (moderate-severe). Score >10: ≥15% (severe). Guides oral vs IV rehydration."
  },
  kawasaki: {
    title: "Kawasaki Disease Diagnostic Criteria",
    reference: "Kawasaki T. Acute febrile mucocutaneous syndrome with lymphoid involvement with specific desquamation of the fingers and toes in children. Arerugi. 1967;16(3):178-222.",
    guidelines: "AHA Scientific Statement: Diagnosis, Treatment, and Long-Term Management of Kawasaki Disease (2017)",
    summary: "Classic: Fever ≥5 days + ≥4 of 5 principal features. Incomplete: Fever + 2-3 features + inflammatory markers + echo findings. Treatment: IVIG 2 g/kg + aspirin. Echo to assess coronary arteries."
  },
  natfrac: {
    title: "Non-Accidental Trauma (NAT) Fracture Indicators",
    reference: "Kleinman PK. Diagnostic Imaging of Child Abuse, 3rd ed. Cambridge University Press; 2015. Kemp AM, et al. Patterns of skeletal fractures in child abuse. Arch Dis Child. 2008;93(3):182-186.",
    guidelines: "AAP Clinical Report: Child Abuse Evaluation and Diagnosis (2018)",
    summary: "High specificity fractures: classic metaphyseal lesions (CMLs), posterior rib fractures, scapular fractures, spinous process fractures, sternal fractures. Moderate specificity: multiple fractures of different ages, complex skull fractures. Low specificity but concerning in infants: any fracture in non-mobile infant."
  },
  sodium: {
    title: "Hyponatremia Correction",
    reference: "Moritz ML, Ayus JC. Disorders of water metabolism in children: hyponatremia and hypernatremia. Pediatr Rev. 2002;23(11):371-380.",
    guidelines: "NEJM Clinical Practice: Hyponatremia (2015), Pediatric adaptations",
    summary: "Acute symptomatic (<48h): correct rapidly 1-2 mEq/L/h until symptoms resolve, max 10-12 mEq/L in 24h. Chronic asymptomatic (>48h): correct slowly ≤10 mEq/L per 24h to prevent osmotic demyelination syndrome. Use 3% NaCl for severe/symptomatic."
  },
};


function ScoreRow({ label, options, value, onChange }) {
  // Strip "N — " prefix from button labels for cleaner touch targets
  const buttonLabel = (raw) => {
    const sep = raw.indexOf(" — ");
    return sep !== -1 ? raw.slice(sep + 3) : raw;
  };
  const selected = options.find(o => o.value === value);
  // Only show subscore in header for genuine ordinal numeric scales with 3+ options.
  // Binary yes/no and categorical string values add no information there.
  const allNumeric = options.every(o => typeof o.value === "number");
  const showScore = selected !== undefined && allNumeric;

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Label row: category name left, subscore right (numeric multi-option only) */}
      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom: 5 }}>
        <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
          {label}
        </div>
        {showScore && (
          <div style={{ color: COLORS.accent, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
            {selected.value}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: "8px 6px",
              borderRadius: 3,
              border: `1px solid #d0d4d9`,
              background: value === opt.value ? "#e8eaed" : COLORS.bg,
              color: COLORS.navy,
              fontSize: 15,
              cursor: "pointer",
              transition: "all 0.1s",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {buttonLabel(opt.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1, unit }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const displayValue = (() => {
    if (value === 0) return '0';
    const str = value.toString();
    return str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  })();

  const physicalUnitPattern = /^(mg\/dL|mg\/kg|mcg\/mL|mEq\/L|mmol\/L|mg\/L|g\/dL|kg|grams|cm|bpm|ms|%|°C|°F|hours?( of life)?|days?|weeks?|years?( ≤\d+)?|breaths\/min|×10³\/μL|hr|mL|L|IU\/L|U\/L)$/i;
  const isPhysicalUnit = unit && physicalUnitPattern.test(unit.trim());

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: COLORS.navy, fontSize: 12, marginBottom: 5, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
        {label}{unit && <span style={{ color: isPhysicalUnit ? "#b8860b" : COLORS.textMuted, fontWeight: 600 }}> ({unit})</span>}
      </div>
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        enterKeyHint="done"
        value={displayValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? 0 : parseFloat(val) || 0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            inputRef.current?.blur();
          }
        }}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "9px 10px",
          borderRadius: 3,
          border: focused ? `2px solid ${COLORS.navy}` : `1px solid #d0d4d9`,
          background: COLORS.bg,
          color: COLORS.navy,
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 500,
          boxSizing: "border-box",
          outline: "none",
          transition: "border 0.1s",
        }}
      />
    </div>
  );
}

function ResultBadge({ score, label, color, sublabel, detail }) {
  const displayScore = typeof score === 'number' 
    ? score.toString().replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
    : score;
  
  return (
    <div style={{
      marginTop: 16,
      padding: "14px 16px",
      borderRadius: 3,
      background: `rgba(${color === COLORS.success ? "15,153,96" : color === COLORS.warning ? "217,130,43" : color === COLORS.danger ? "219,55,55" : "0,102,204"},0.06)`,
      border: `1px solid ${color}`,
      textAlign: "left",
    }}>
      <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 500 }}>Result</div>
      <div style={{ color, fontSize: 28, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.2, whiteSpace: "pre-line" }}>{displayScore}</div>
      <div style={{ color, fontSize: 13, fontWeight: 600, marginTop: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>{label}</div>
      {sublabel && <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 6, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.4 }}>{sublabel}</div>}
      {detail && (
        <div style={{ marginTop: 10, borderTop: `1px solid ${color}`, paddingTop: 10, opacity: 0.85 }}>
          {detail.title && <div style={{ color: COLORS.navy, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500, marginBottom: 6 }}>{detail.title}</div>}
          {detail.bullets && detail.bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.navy, flexShrink: 0, marginTop: 6 }} />
              <div style={{ color: COLORS.navy, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: APGAR
// ═══════════════════════════════════════════════════════════════════════════════
function ApgarCalc() {
  const [vals, setVals] = useState({ appearance: null, pulse: null, grimace: null, activity: null, respiration: null });
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }));
  const score = Object.values(vals).reduce((a, v) => a + (v ?? 0), 0);
  const filled = Object.values(vals).every(v => v !== null);
  const color = score >= 7 ? COLORS.success : score >= 4 ? COLORS.warning : COLORS.danger;
  const label = score >= 7 ? "Normal" : score >= 4 ? "Moderate Depression" : "Severe Depression";
  return (
    <div>
      <ScoreRow label="Appearance (Color)" value={vals.appearance} onChange={v => set("appearance", v)} options={[{value:0,label:"0 — Blue/Pale"},{value:1,label:"1 — Acrocyanotic"},{value:2,label:"2 — Pink"}]} />
      <ScoreRow label="Pulse (Heart Rate)" value={vals.pulse} onChange={v => set("pulse", v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — <100 bpm"},{value:2,label:"2 — ≥100 bpm"}]} />
      <ScoreRow label="Grimace (Reflex)" value={vals.grimace} onChange={v => set("grimace", v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Grimace"},{value:2,label:"2 — Cry/Cough"}]} />
      <ScoreRow label="Activity (Tone)" value={vals.activity} onChange={v => set("activity", v)} options={[{value:0,label:"0 — Limp"},{value:1,label:"1 — Some Flexion"},{value:2,label:"2 — Active"}]} />
      <ScoreRow label="Respiration" value={vals.respiration} onChange={v => set("respiration", v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Irregular"},{value:2,label:"2 — Good Cry"}]} />
      {filled && <ResultBadge score={score} label={label} color={color} sublabel={`Score 0–10 • Assess at 1, 5, 10 min`} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PEDIATRIC GLASGOW COMA SCALE
// ═══════════════════════════════════════════════════════════════════════════════
function PGCSCalc() {
  const [age, setAge] = useState("older");
  const [eye, setEye] = useState(null);
  const [verbal, setVerbal] = useState(null);
  const [motor, setMotor] = useState(null);
  const eyeOpts = [
    {value:4,label:"4 — Spontaneous"},{value:3,label:"3 — To voice"},{value:2,label:"2 — To pain"},{value:1,label:"1 — None"}
  ];
  const verbalOpts = age === "older" ? [
    {value:5,label:"5 — Oriented"},{value:4,label:"4 — Confused"},{value:3,label:"3 — Words"},{value:2,label:"2 — Sounds"},{value:1,label:"1 — None"}
  ] : [
    {value:5,label:"5 — Coos/Babbles"},{value:4,label:"4 — Irritable cry"},{value:3,label:"3 — Cry to pain"},{value:2,label:"2 — Moan"},{value:1,label:"1 — None"}
  ];
  const motorOpts = [
    {value:6,label:"6 — Obeys commands"},{value:5,label:"5 — Localizes pain"},{value:4,label:"4 — Withdraws"},{value:3,label:"3 — Flexion"},{value:2,label:"2 — Extension"},{value:1,label:"1 — None"}
  ];
  const score = (eye??0)+(verbal??0)+(motor??0);
  const filled = eye && verbal && motor;
  const color = score >= 13 ? COLORS.success : score >= 9 ? COLORS.warning : COLORS.danger;
  const label = score >= 13 ? "Mild" : score >= 9 ? "Moderate" : score >= 3 ? "Severe" : "—";
  return (
    <div>
      <ScoreRow label="Patient Age" value={age} onChange={setAge} options={[{value:"older",label:"≥2 years"},{value:"infant",label:"<2 years (infant)"}]} />
      <ScoreRow label="Eye Opening" value={eye} onChange={setEye} options={eyeOpts} />
      <ScoreRow label="Verbal Response" value={verbal} onChange={setVerbal} options={verbalOpts} />
      <ScoreRow label="Motor Response" value={motor} onChange={setMotor} options={motorOpts} />
      {filled && <ResultBadge score={score} label={`${label} TBI`} color={color} sublabel={`E${eye}+V${verbal}+M${motor} • Max 15`} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: COWS (Clinical Opiate Withdrawal Scale)
// ═══════════════════════════════════════════════════════════════════════════════
function COWSCalc() {
  const [vals, setVals] = useState({
    pulse:null, sweating:null, restlessness:null, pupils:null, aches:null, rhinorrhea:null,
    nausea:null, tremor:null, yawning:null, anxiety:null, gooseflesh:null
  });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const score = Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled = Object.values(vals).every(v=>v!==null);
  const color = score>=36?COLORS.danger:score>=25?COLORS.dangerBright:score>=13?COLORS.warning:score>=5?COLORS.orange:COLORS.success;
  const label = score>=36?"Severe":score>=25?"Moderately Severe":score>=13?"Moderate":score>=5?"Mild":"Minimal";
  return (
    <div>
      <ScoreRow label="Pulse Rate (bpm)" value={vals.pulse} onChange={v=>set("pulse",v)} options={[{value:0,label:"0 — ≤80"},{value:1,label:"1 — 81–100"},{value:2,label:"2 — 101–120"},{value:4,label:"4 — >120"}]} />
      <ScoreRow label="Sweating" value={vals.sweating} onChange={v=>set("sweating",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Damp"},{value:2,label:"2 — Beads"},{value:3,label:"3 — Sweating"},{value:4,label:"4 — Drenched"}]} />
      <ScoreRow label="Restlessness" value={vals.restlessness} onChange={v=>set("restlessness",v)} options={[{value:0,label:"0 — Able to sit still"},{value:1,label:"1 — Difficulty"},{value:3,label:"3 — Frequently shifts"},{value:5,label:"5 — Unable to sit"}]} />
      <ScoreRow label="Pupil Size" value={vals.pupils} onChange={v=>set("pupils",v)} options={[{value:0,label:"0 — Constricted"},{value:1,label:"1 — Normal"},{value:2,label:"2 — Dilated"},{value:5,label:"5 — Max dilated"}]} />
      <ScoreRow label="Bone/Joint Aches" value={vals.aches} onChange={v=>set("aches",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Mild"},{value:2,label:"2 — Significant"},{value:4,label:"4 — Severe"}]} />
      <ScoreRow label="Rhinorrhea/Tearing" value={vals.rhinorrhea} onChange={v=>set("rhinorrhea",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Sniffling"},{value:2,label:"2 — Running nose"},{value:4,label:"4 — Tears streaming"}]} />
      <ScoreRow label="GI Upset" value={vals.nausea} onChange={v=>set("nausea",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Nausea"},{value:2,label:"2 — Cramping"},{value:3,label:"3 — Vomiting"},{value:5,label:"5 — Diarrhea"}]} />
      <ScoreRow label="Tremor" value={vals.tremor} onChange={v=>set("tremor",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Fine tremor"},{value:2,label:"2 — Coarse tremor"},{value:4,label:"4 — Severe"}]} />
      <ScoreRow label="Yawning" value={vals.yawning} onChange={v=>set("yawning",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Once or twice"},{value:2,label:"2 — 3x/10 min"},{value:4,label:"4 — Constant"}]} />
      <ScoreRow label="Anxiety/Irritability" value={vals.anxiety} onChange={v=>set("anxiety",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Mild"},{value:2,label:"2 — Moderate"},{value:4,label:"4 — Severe"}]} />
      <ScoreRow label="Gooseflesh" value={vals.gooseflesh} onChange={v=>set("gooseflesh",v)} options={[{value:0,label:"0 — None"},{value:3,label:"3 — Piloerection"},{value:5,label:"5 — Skin rippling"}]} />
      {filled && <ResultBadge score={score} label={`${label} Withdrawal`} color={color} sublabel="Score 0–48 • Consider treatment ≥8" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: MODIFIED FINNEGAN NEONATAL ABSTINENCE SCORE
// ═══════════════════════════════════════════════════════════════════════════════
function FinneganCalc() {
  const [vals, setVals] = useState({
    cry:null, sleep:null, moro:null, tremors_undisturbed:null, tremors_disturbed:null, tone:null,
    excoriation:null, myclonic:null, seizures:null, sweating:null, fever:null, frequent_yawn:null,
    mottling:null, nasal_stuffiness:null, sneezing:null, nasal_flaring:null, resp_rate:null,
    retractions:null, excessive_suck:null, feeding_poor:null, regurg:null, proj_vomit:null,
    loose_stools:null, watery_stools:null
  });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const score = Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled = Object.values(vals).filter(v=>v!==null).length >= 12;
  const color = score>=8?COLORS.danger:score>=5?COLORS.warning:COLORS.success;
  const label = score>=8?"Treat — Pharmacotherapy Consider":score>=5?"Monitor Closely":"Low Risk";
  return (
    <div>
      <div style={{color:COLORS.textMuted,fontSize:11,marginBottom:12,fontFamily:"'DM Mono',monospace"}}>CNS DISTURBANCE</div>
      <ScoreRow label="High Pitched Cry" value={vals.cry} onChange={v=>set("cry",v)} options={[{value:0,label:"0 — None"},{value:2,label:"2 — Continuous"},{value:3,label:"3 — High pitch"}]} />
      <ScoreRow label="Sleep After Feeding" value={vals.sleep} onChange={v=>set("sleep",v)} options={[{value:0,label:"0 — >3 hrs"},{value:1,label:"1 — 2–3 hrs"},{value:2,label:"2 — 1–2 hrs"},{value:3,label:"3 — <1 hr"}]} />
      <ScoreRow label="Moro Reflex" value={vals.moro} onChange={v=>set("moro",v)} options={[{value:0,label:"0 — Normal"},{value:2,label:"2 — Hyperactive"},{value:3,label:"3 — Markedly hyper"}]} />
      <ScoreRow label="Tremors (Undisturbed)" value={vals.tremors_undisturbed} onChange={v=>set("tremors_undisturbed",v)} options={[{value:0,label:"0 — None"},{value:3,label:"3 — Mild"},{value:4,label:"4 — Moderate–Severe"}]} />
      <ScoreRow label="Tremors (Disturbed)" value={vals.tremors_disturbed} onChange={v=>set("tremors_disturbed",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Mild"},{value:2,label:"2 — Moderate–Severe"}]} />
      <ScoreRow label="Muscle Tone" value={vals.tone} onChange={v=>set("tone",v)} options={[{value:0,label:"0 — Normal"},{value:1,label:"1 — Increased"},{value:2,label:"2 — Rigidity"}]} />
      <ScoreRow label="Excoriation" value={vals.excoriation} onChange={v=>set("excoriation",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Myoclonic Jerks" value={vals.myclonic} onChange={v=>set("myclonic",v)} options={[{value:0,label:"0 — None"},{value:3,label:"3 — Present"}]} />
      <ScoreRow label="Seizures" value={vals.seizures} onChange={v=>set("seizures",v)} options={[{value:0,label:"0 — None"},{value:5,label:"5 — Present"}]} />
      <div style={{color:COLORS.textMuted,fontSize:11,marginBottom:8,marginTop:12,fontFamily:"'DM Mono',monospace"}}>METABOLIC / VASOMOTOR / RESP</div>
      <ScoreRow label="Sweating" value={vals.sweating} onChange={v=>set("sweating",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Fever" value={vals.fever} onChange={v=>set("fever",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — 37.2–38.3°C"},{value:2,label:"2 — >38.4°C"}]} />
      <ScoreRow label="Frequent Yawning" value={vals.frequent_yawn} onChange={v=>set("frequent_yawn",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — >3–4×/assessment"}]} />
      <ScoreRow label="Mottling" value={vals.mottling} onChange={v=>set("mottling",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Nasal Stuffiness" value={vals.nasal_stuffiness} onChange={v=>set("nasal_stuffiness",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Sneezing" value={vals.sneezing} onChange={v=>set("sneezing",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — >3–4×"}]} />
      <ScoreRow label="Nasal Flaring" value={vals.nasal_flaring} onChange={v=>set("nasal_flaring",v)} options={[{value:0,label:"0 — No"},{value:2,label:"2 — Yes"}]} />
      <ScoreRow label="Respiratory Rate" value={vals.resp_rate} onChange={v=>set("resp_rate",v)} options={[{value:0,label:"0 — <60"},{value:1,label:"1 — 60–80"},{value:2,label:"2 — >80"}]} />
      <ScoreRow label="Retractions" value={vals.retractions} onChange={v=>set("retractions",v)} options={[{value:0,label:"0 — No"},{value:2,label:"2 — Yes"}]} />
      <div style={{color:COLORS.textMuted,fontSize:11,marginBottom:8,marginTop:12,fontFamily:"'DM Mono',monospace"}}>GI DISTURBANCE</div>
      <ScoreRow label="Excessive Sucking" value={vals.excessive_suck} onChange={v=>set("excessive_suck",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Poor Feeding" value={vals.feeding_poor} onChange={v=>set("feeding_poor",v)} options={[{value:0,label:"0 — No"},{value:2,label:"2 — Yes"}]} />
      <ScoreRow label="Regurgitation" value={vals.regurg} onChange={v=>set("regurg",v)} options={[{value:0,label:"0 — No"},{value:2,label:"2 — Yes"}]} />
      <ScoreRow label="Projectile Vomiting" value={vals.proj_vomit} onChange={v=>set("proj_vomit",v)} options={[{value:0,label:"0 — No"},{value:3,label:"3 — Yes"}]} />
      <ScoreRow label="Stools" value={vals.loose_stools} onChange={v=>set("loose_stools",v)} options={[{value:0,label:"0 — Normal"},{value:2,label:"2 — Loose"},{value:3,label:"3 — Watery"}]} />
      {filled && <ResultBadge score={score} label={label} color={color} sublabel={`Score 0–40+ • Treat ≥8 for 3 scores or ≥12 for 2 scores`} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: WAT-1 (Withdrawal Assessment Tool)
// ═══════════════════════════════════════════════════════════════════════════════
function WATCalc() {
  const [vals, setVals] = useState({
    loose_watery:null, vomit_retch:null, temp:null, mottling:null,
    state:null, tremor:null, sweating:null, uncoordinated:null,
    yawn_sneeze:null, startle:null, muscle_tone:null
  });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const score = Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled = Object.values(vals).every(v=>v!==null);
  const color = score>=3?COLORS.danger:score>=2?COLORS.warning:COLORS.success;
  const label = score>=3?"Significant Withdrawal":"Low/No Withdrawal";
  return (
    <div>
      <div style={{color:COLORS.textMuted,fontSize:11,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>Score 2-hour observation window. Each = 1 pt unless noted.</div>
      <ScoreRow label="Loose/Watery Stools" value={vals.loose_watery} onChange={v=>set("loose_watery",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Vomiting/Retching" value={vals.vomit_retch} onChange={v=>set("vomit_retch",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Temperature >37.8°C" value={vals.temp} onChange={v=>set("temp",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Mottling" value={vals.mottling} onChange={v=>set("mottling",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="State: Worst in 2hr" value={vals.state} onChange={v=>set("state",v)} options={[{value:0,label:"0 — Sleep/calm"},{value:1,label:"1 — Irritable"},{value:2,label:"2 — High pitch"}]} />
      <ScoreRow label="Tremor" value={vals.tremor} onChange={v=>set("tremor",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Mild/disturbed"},{value:2,label:"2 — Moderate–Severe"}]} />
      <ScoreRow label="Sweating" value={vals.sweating} onChange={v=>set("sweating",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Uncoordinated/Repetitive Movements" value={vals.uncoordinated} onChange={v=>set("uncoordinated",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Yawning/Sneezing ≥3×" value={vals.yawn_sneeze} onChange={v=>set("yawn_sneeze",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Startle to Touch" value={vals.startle} onChange={v=>set("startle",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Muscle Tone" value={vals.muscle_tone} onChange={v=>set("muscle_tone",v)} options={[{value:0,label:"0 — Normal"},{value:1,label:"1 — Increased"},{value:2,label:"2 — Rigid/Jittery"}]} />
      {filled && <ResultBadge score={score} label={label} color={color} sublabel="Score 0–12 • ≥3 suggests iatrogenic withdrawal" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: ACETAMINOPHEN TOXICITY (Rumack-Matthew)
// ═══════════════════════════════════════════════════════════════════════════════
function AcetaminophenCalc() {
  const [weight, setWeight] = useState(20);
  const [dose, setDose] = useState(0);
  const [level, setLevel] = useState(0);
  const [hours, setHours] = useState(4);
  const [mode, setMode] = useState("dose");
  const graphRef = useRef(null);

  const showNomogram = mode === "level" && hours >= 4 && hours <= 24 && level > 0;

  const scrollToGraph = () => {
    if (graphRef.current) {
      graphRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  
  const rumackThreshold = (h) => {
    if (h < 4) return null;
    if (h > 24) return null;
    const threshold = 150 * Math.pow(10, (4 - h) * Math.log10(2) / 4);
    return threshold;
  };
  
  const toxic = () => {
    const threshold = rumackThreshold(hours);
    if (!threshold || level === 0) return null;
    return level >= threshold;
  };
  
  const nac_dose = weight * 150;
  
  // Nomogram Graph Component
  const NomogramGraph = () => {
    const width = 340;
    const height = 240;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    // Scale functions
    const xScale = (x) => padding.left + (x - 4) * (graphWidth / 20);
    const yScale = (y) => padding.top + graphHeight - (y / 300) * graphHeight;
    
    // Generate treatment line points
    const treatmentPoints = [];
    for (let h = 4; h <= 24; h += 0.5) {
      const y = rumackThreshold(h);
      if (y) treatmentPoints.push({ x: h, y });
    }
    
    const treatmentPath = treatmentPoints.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`
    ).join(' ');
    
    // Probable hepatotoxicity line (lower line)
    const probablePath = treatmentPoints.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y * 0.75)}`
    ).join(' ');
    
    // Patient point
    const patientX = hours >= 4 && hours <= 24 ? xScale(hours) : null;
    const patientY = level > 0 && level <= 300 ? yScale(level) : null;
    const showPoint = patientX !== null && patientY !== null;
    const isToxic = toxic();
    
    return (
      <div style={{marginTop:16,padding:"16px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.08em"}}>
          Rumack-Matthew Nomogram
        </div>
        <svg width={width} height={height} style={{display:"block",margin:"0 auto"}}>
          {/* Background zones */}
          <defs>
            <linearGradient id="toxicZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"rgb(220,38,38)",stopOpacity:0.08}} />
              <stop offset="100%" style={{stopColor:"rgb(220,38,38)",stopOpacity:0.02}} />
            </linearGradient>
            <linearGradient id="safeZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"rgb(5,150,105)",stopOpacity:0.02}} />
              <stop offset="100%" style={{stopColor:"rgb(5,150,105)",stopOpacity:0.08}} />
            </linearGradient>
          </defs>
          
          <rect x={padding.left} y={padding.top} width={graphWidth} height={yScale(150)-padding.top} fill="url(#toxicZone)" />
          <rect x={padding.left} y={yScale(150)} width={graphWidth} height={yScale(0)-yScale(150)} fill="url(#safeZone)" />
          
          {/* Grid lines */}
          {[0, 50, 100, 150, 200, 250, 300].map(y => (
            <g key={`grid-y-${y}`}>
              <line x1={padding.left} y1={yScale(y)} x2={width-padding.right} y2={yScale(y)} 
                    stroke={COLORS.border} strokeWidth="1" strokeDasharray="2,2" />
              <text x={padding.left-8} y={yScale(y)+4} textAnchor="end" fontSize="10" fill={COLORS.textMuted} fontFamily="'DM Mono', monospace">
                {y}
              </text>
            </g>
          ))}
          
          {[4, 8, 12, 16, 20, 24].map(x => (
            <g key={`grid-x-${x}`}>
              <line x1={xScale(x)} y1={padding.top} x2={xScale(x)} y2={height-padding.bottom} 
                    stroke={COLORS.border} strokeWidth="1" strokeDasharray="2,2" />
              <text x={xScale(x)} y={height-padding.bottom+20} textAnchor="middle" fontSize="10" fill={COLORS.textMuted} fontFamily="'DM Mono', monospace">
                {x}
              </text>
            </g>
          ))}
          
          {/* Probable hepatotoxicity line */}
          <path d={probablePath} fill="none" stroke={COLORS.orange} strokeWidth="1.5" strokeDasharray="4,3" />
          
          {/* Treatment line */}
          <path d={treatmentPath} fill="none" stroke={COLORS.danger} strokeWidth="2.5" />
          
          {/* Labels */}
          <text x={xScale(8)} y={yScale(200)-8} fontSize="10" fontWeight="600" fill={COLORS.danger} fontFamily="'DM Mono', monospace">
            Treatment Line
          </text>
          
          <text x={xScale(12)} y={yScale(90)-8} fontSize="9" fill={COLORS.orange} fontFamily="'DM Mono', monospace">
            Probable Hepatotoxicity
          </text>
          
          {/* Patient point */}
          {showPoint && (
            <g>
              <circle cx={patientX} cy={patientY} r="8" fill="none" 
                      stroke={isToxic ? COLORS.danger : COLORS.success} strokeWidth="1.5" opacity="0.3">
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={patientX} cy={patientY} r="5" fill={isToxic ? COLORS.danger : COLORS.success} 
                      stroke="white" strokeWidth="2" />
              <text x={patientX} y={patientY-15} textAnchor="middle" fontSize="11" fontWeight="700" 
                    fill={isToxic ? COLORS.danger : COLORS.success} fontFamily="'Sora', sans-serif">
                Patient
              </text>
            </g>
          )}
          
          {/* Axes labels */}
          <text x={width/2} y={height-8} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLORS.text} fontFamily="'DM Mono', monospace">
            Hours Post-Ingestion
          </text>
          <text x={18} y={height/2} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLORS.text} fontFamily="'DM Mono', monospace"
                transform={`rotate(-90, 18, ${height/2})`}>
            Acetaminophen (mcg/mL)
          </text>
        </svg>
        <div style={{marginTop:10,fontSize:10,color:COLORS.textMuted,fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
          Treatment line: 150 mcg/mL @ 4hr → 37.5 mcg/mL @ 16hr → 4.7 mcg/mL @ 24hr
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <ScoreRow label="Assessment Mode" value={mode} onChange={setMode} options={[{value:"dose",label:"Ingestion Dose"},{value:"level",label:"Serum Level (Rumack)"}]} />

      {mode === "dose" && (
        <>
          <NumberInput label="Patient Weight" value={weight} onChange={setWeight} min={1} max={150} unit="kg" />
          <NumberInput label="Dose Ingested" value={dose} onChange={setDose} min={0} max={500} step={0.1} unit="mg/kg" />
          <div style={{marginTop:20,padding:"18px 20px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
            <div style={{color:COLORS.textSub,fontSize:12,fontFamily:"'DM Mono',monospace",marginBottom:8}}>DOSE ASSESSMENT</div>
            <div style={{color:COLORS.text,fontSize:14,fontFamily:"'DM Mono',monospace",lineHeight:1.7}}>
              <div>Total dose: <span style={{color:COLORS.accent,fontWeight:700}}>{(weight*dose).toFixed(0)} mg</span></div>
              <div style={{marginTop:8,color:dose<150?COLORS.success:dose<200?COLORS.warning:COLORS.danger,fontSize:13,fontWeight:600}}>
                {dose === 0 ? "▸ Enter dose to assess" : dose < 75 ? "▸ Non-toxic range (<75 mg/kg)" : dose < 150 ? "▸ Borderline toxic (75–150 mg/kg)" : dose < 200 ? "▸ Potentially toxic (150–200 mg/kg)" : "▸ Toxic — consider NAC"}
              </div>
              {dose > 0 && (
                <div style={{marginTop:8,color:COLORS.textMuted,fontSize:12}}>
                  NAC loading dose: <span style={{color:COLORS.accent,fontWeight:600}}>{nac_dose.toFixed(0)} mg IV</span> (150 mg/kg)
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {mode === "level" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><NumberInput label="Patient Weight" value={weight} onChange={setWeight} min={1} max={150} unit="kg" /></div>
            <div style={{ flex: 1 }}><NumberInput label="Hours Post-Ingestion" value={hours} onChange={setHours} min={1} max={24} unit="hr" /></div>
          </div>
          <NumberInput label="Acetaminophen Level" value={level} onChange={setLevel} min={0} max={300} step={1} unit="mcg/mL" />

          {showNomogram && (
            <button
              onClick={scrollToGraph}
              style={{ width: "100%", marginTop: 8, marginBottom: 4, padding: "10px", borderRadius: 3, border: `1px solid ${COLORS.navy}`, background: COLORS.navy, color: "#ffffff", fontSize: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 600, cursor: "pointer" }}
            >
              View Nomogram ↓
            </button>
          )}

          {/* Show nomogram when valid data entered */}
          {showNomogram && <div ref={graphRef}><NomogramGraph /></div>}
          
          {/* Results */}
          {rumackThreshold(hours) && level > 0 && (
            <ResultBadge
              score={toxic() ? "TREAT WITH NAC" : "BELOW LINE"}
              label={toxic() ? "Above Treatment Line → Start NAC Protocol" : "Below Treatment Line — No Treatment Indicated"}
              color={toxic() ? COLORS.danger : COLORS.success}
              sublabel={`Threshold at ${hours}h: ${rumackThreshold(hours).toFixed(1)} mcg/mL • Patient level: ${level} mcg/mL`}
            />
          )}
          
          {/* NAC dosing if toxic */}
          {toxic() && (
            <div style={{marginTop:14,padding:"14px 16px",borderRadius:12,background:"rgba(220,38,38,0.08)",border:`1.5px solid ${COLORS.danger}`}}>
              <div style={{color:COLORS.danger,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:600,marginBottom:8}}>
                NAC (N-Acetylcysteine) Protocol
              </div>
              <div style={{color:COLORS.text,fontSize:12,fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
                <div>• <strong>Loading:</strong> {nac_dose.toFixed(0)} mg IV over 1 hour</div>
                <div>• <strong>2nd dose:</strong> {(weight * 50).toFixed(0)} mg IV over 4 hours</div>
                <div>• <strong>3rd dose:</strong> {(weight * 100).toFixed(0)} mg IV over 16 hours</div>
                <div style={{marginTop:6,color:COLORS.danger,fontSize:11}}>
                  ⚠ Start NAC immediately — do not delay for level if ingestion &gt;150 mg/kg
                </div>
              </div>
            </div>
          )}
          
          {/* Warnings */}
          {hours < 4 && (
            <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:"rgba(217,119,6,0.08)",border:`1px solid ${COLORS.warning}`,color:COLORS.warning,fontSize:12,fontFamily:"'DM Mono',monospace"}}>
              ⚠ Levels drawn &lt;4h post-ingestion are unreliable. Redraw at 4 hours.
            </div>
          )}
          
          {hours > 24 && (
            <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:"rgba(217,119,6,0.08)",border:`1px solid ${COLORS.warning}`,color:COLORS.warning,fontSize:12,fontFamily:"'DM Mono',monospace"}}>
              ⚠ Nomogram not validated &gt;24h. Consider LFTs, PT/INR, and toxicology consult.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: HYPERBILIRUBINEMIA RISK (Bhutani Nomogram)
// ═══════════════════════════════════════════════════════════════════════════════
function BilirubinCalc() {
  const [bili, setBili] = useState(0);
  const [age_hrs, setAgeHrs] = useState(48);
  const [gestage, setGestage] = useState(38);
  const [risk, setRisk] = useState("low");
  const graphRef = useRef(null);

  const showGraph = bili > 0 && age_hrs >= 12;

  const scrollToGraph = () => {
    if (graphRef.current) {
      graphRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  
  // Bhutani percentile curves (approximated from nomogram)
  const bhutaniCurves = {
    p95: [ // High risk zone (95th percentile)
      {h:0,b:0},{h:12,b:5},{h:18,b:7},{h:24,b:9},{h:36,b:12},{h:48,b:14.5},
      {h:60,b:16.5},{h:72,b:17.5},{h:96,b:18.5},{h:120,b:19},{h:144,b:19.5}
    ],
    p75: [ // High intermediate (75th percentile)
      {h:0,b:0},{h:12,b:4},{h:18,b:5.5},{h:24,b:7.5},{h:36,b:10},{h:48,b:12},
      {h:60,b:13.5},{h:72,b:15},{h:96,b:16.5},{h:120,b:17},{h:144,b:17.5}
    ],
    p40: [ // Low intermediate (40th percentile)
      {h:0,b:0},{h:12,b:2.5},{h:18,b:4},{h:24,b:5.5},{h:36,b:7.5},{h:48,b:9},
      {h:60,b:10.5},{h:72,b:11.5},{h:96,b:13},{h:120,b:14},{h:144,b:14.5}
    ]
  };
  
  // AAP 2022 Phototherapy thresholds by GA and risk
  const getPhototherapyThreshold = (hrs, ga, riskLevel) => {
    const riskAdj = riskLevel === "high" ? -2 : riskLevel === "medium" ? -1 : 0;
    const gaAdj = ga < 38 ? -2 : 0;
    
    if (hrs <= 24) return Math.max(12 + riskAdj + gaAdj, 8);
    if (hrs <= 48) return Math.max(15 + riskAdj + gaAdj, 10);
    if (hrs <= 72) return Math.max(18 + riskAdj + gaAdj, 12);
    return Math.max(20 + riskAdj + gaAdj, 13);
  };
  
  const getExchangeThreshold = (hrs, ga) => {
    const gaAdj = ga < 38 ? -2 : 0;
    if (hrs <= 24) return Math.max(20 + gaAdj, 15);
    if (hrs <= 48) return Math.max(25 + gaAdj, 18);
    if (hrs <= 72) return Math.max(27 + gaAdj, 20);
    return Math.max(30 + gaAdj, 22);
  };
  
  const getZone = () => {
    const h = age_hrs;
    const b = bili;
    
    // Find zone by comparing to percentile curves
    const p95Val = interpolate(bhutaniCurves.p95, h);
    const p75Val = interpolate(bhutaniCurves.p75, h);
    const p40Val = interpolate(bhutaniCurves.p40, h);
    
    if (b >= p95Val) return "high";
    if (b >= p75Val) return "intermediate-high";
    if (b >= p40Val) return "intermediate-low";
    return "low";
  };
  
  const interpolate = (curve, hours) => {
    for (let i = 0; i < curve.length - 1; i++) {
      if (hours >= curve[i].h && hours <= curve[i+1].h) {
        const t = (hours - curve[i].h) / (curve[i+1].h - curve[i].h);
        return curve[i].b + t * (curve[i+1].b - curve[i].b);
      }
    }
    return curve[curve.length-1].b;
  };
  
  const ptThreshold = getPhototherapyThreshold(age_hrs, gestage, risk);
  const exThreshold = getExchangeThreshold(age_hrs, gestage);
  const needsPT = bili >= ptThreshold;
  const needsExchange = bili >= exThreshold;
  const zone = getZone();
  const zoneColor = zone === "high" ? COLORS.danger : zone === "intermediate-high" ? COLORS.orange : zone === "intermediate-low" ? COLORS.warning : COLORS.success;
  const zoneLabel = { high: "High Risk Zone", "intermediate-high": "Upper Intermediate", "intermediate-low": "Lower Intermediate", low: "Low Risk Zone" }[zone];
  
  // Nomogram Graph Components
  const BhutaniRiskZones = () => {
    const width = 340;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    const xScale = (h) => padding.left + (h / 144) * graphWidth;
    const yScale = (b) => padding.top + graphHeight - (b / 22) * graphHeight;
    
    const createPath = (curve) => curve.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(p.h)} ${yScale(p.b)}`
    ).join(' ');
    
    const p95Path = createPath(bhutaniCurves.p95);
    const p75Path = createPath(bhutaniCurves.p75);
    const p40Path = createPath(bhutaniCurves.p40);
    
    const patientX = age_hrs <= 144 ? xScale(age_hrs) : null;
    const patientY = bili <= 22 ? yScale(bili) : null;
    const showPoint = patientX !== null && patientY !== null && bili > 0;
    const showArrow = patientX !== null && bili > 22;
    
    return (
      <div style={{marginTop:16,padding:"16px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.08em"}}>
          Bhutani Risk Zones
        </div>
        <svg width={width} height={height} style={{display:"block",margin:"0 auto"}}>
          <defs>
            <linearGradient id="highRiskZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"rgb(220,38,38)",stopOpacity:0.12}} />
              <stop offset="100%" style={{stopColor:"rgb(220,38,38)",stopOpacity:0.04}} />
            </linearGradient>
            <linearGradient id="highIntZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"rgb(245,158,11)",stopOpacity:0.1}} />
              <stop offset="100%" style={{stopColor:"rgb(245,158,11)",stopOpacity:0.03}} />
            </linearGradient>
            <linearGradient id="lowIntZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"rgb(217,119,6)",stopOpacity:0.08}} />
              <stop offset="100%" style={{stopColor:"rgb(217,119,6)",stopOpacity:0.02}} />
            </linearGradient>
            <linearGradient id="lowRiskZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"rgb(5,150,105)",stopOpacity:0.02}} />
              <stop offset="100%" style={{stopColor:"rgb(5,150,105)",stopOpacity:0.1}} />
            </linearGradient>
          </defs>
          
          {/* Filled zones */}
          <path d={`${p95Path} L ${xScale(144)} ${yScale(22)} L ${xScale(0)} ${yScale(22)} Z`} fill="url(#highRiskZone)" />
          <path d={`${p75Path} L ${xScale(144)} ${yScale(bhutaniCurves.p95[bhutaniCurves.p95.length-1].b)} ${p95Path.split('M')[1].split('L').reverse().map(s => 'L '+s).join('')} Z`} fill="url(#highIntZone)" />
          <path d={`${p40Path} L ${xScale(144)} ${yScale(bhutaniCurves.p75[bhutaniCurves.p75.length-1].b)} ${p75Path.split('M')[1].split('L').reverse().map(s => 'L '+s).join('')} Z`} fill="url(#lowIntZone)" />
          <path d={`M ${padding.left} ${yScale(0)} ${p40Path.substring(1)} L ${xScale(144)} ${yScale(0)} Z`} fill="url(#lowRiskZone)" />
          
          {/* Grid */}
          {[0, 5, 10, 15, 20].map(b => (
            <g key={`grid-y-${b}`}>
              <line x1={padding.left} y1={yScale(b)} x2={width-padding.right} y2={yScale(b)} 
                    stroke={COLORS.border} strokeWidth="1" strokeDasharray="2,2" />
              <text x={padding.left-8} y={yScale(b)+4} textAnchor="end" fontSize="10" fill={COLORS.textMuted} fontFamily="'DM Mono', monospace">
                {b}
              </text>
            </g>
          ))}
          
          {[0, 24, 48, 72, 96, 120, 144].map(h => (
            <g key={`grid-x-${h}`}>
              <line x1={xScale(h)} y1={padding.top} x2={xScale(h)} y2={height-padding.bottom} 
                    stroke={COLORS.border} strokeWidth="1" strokeDasharray="2,2" />
              <text x={xScale(h)} y={height-padding.bottom+20} textAnchor="middle" fontSize="10" fill={COLORS.textMuted} fontFamily="'DM Mono', monospace">
                {h}
              </text>
            </g>
          ))}
          
          {/* Percentile curves */}
          <path d={p95Path} fill="none" stroke={COLORS.danger} strokeWidth="2" />
          <path d={p75Path} fill="none" stroke={COLORS.orange} strokeWidth="2" />
          <path d={p40Path} fill="none" stroke={COLORS.warning} strokeWidth="2" />
          
          {/* Labels */}
          <text x={xScale(120)} y={yScale(19)-5} fontSize="9" fontWeight="600" fill={COLORS.danger} fontFamily="'DM Mono', monospace">
            95th %ile
          </text>
          <text x={xScale(120)} y={yScale(16.5)-5} fontSize="9" fontWeight="600" fill={COLORS.orange} fontFamily="'DM Mono', monospace">
            75th %ile
          </text>
          <text x={xScale(120)} y={yScale(13.5)-5} fontSize="9" fontWeight="600" fill={COLORS.warning} fontFamily="'DM Mono', monospace">
            40th %ile
          </text>
          
          {/* Patient point */}
          {showPoint && (
            <g>
              <circle cx={patientX} cy={patientY} r="8" fill="none" 
                      stroke={zoneColor} strokeWidth="1.5" opacity="0.3">
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={patientX} cy={patientY} r="5" fill={zoneColor} 
                      stroke="white" strokeWidth="2" />
              <text x={patientX} y={patientY-15} textAnchor="middle" fontSize="11" fontWeight="700" 
                    fill={zoneColor} fontFamily="'Sora', sans-serif">
                Patient
              </text>
            </g>
          )}

          {/* Off-scale arrow — bili > 22 mg/dL */}
          {showArrow && (
            <g>
              {/* Arrow shaft — shorter */}
              <line x1={patientX} y1={padding.top + 14} x2={patientX} y2={padding.top + 5}
                    stroke={COLORS.danger} strokeWidth="2.5" />
              {/* Arrowhead with pulse */}
              <polygon
                points={`${patientX},${padding.top} ${patientX - 5},${padding.top + 8} ${patientX + 5},${padding.top + 8}`}
                fill={COLORS.danger}
                opacity="0.9"
              >
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite" />
              </polygon>
              {/* Value label near tail */}
              <text x={patientX} y={padding.top + 26} textAnchor="middle" fontSize="10" fontWeight="700"
                    fill={COLORS.danger} fontFamily="'DM Mono', monospace">
                {bili}
              </text>
            </g>
          )}
          
          {/* Axes */}
          <text x={width/2} y={height-8} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLORS.text} fontFamily="'DM Mono', monospace">
            Postnatal Age (hours)
          </text>
          <text x={18} y={height/2} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLORS.text} fontFamily="'DM Mono', monospace"
                transform={`rotate(-90, 18, ${height/2})`}>
            TSB (mg/dL)
          </text>
        </svg>
        <div style={{marginTop:10,fontSize:10,color:COLORS.textMuted,fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
          Zone placement predicts risk of subsequent severe hyperbilirubinemia
        </div>
      </div>
    );
  };
  
  const PhototherapyThresholdGraph = () => {
    const width = 340;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    const xScale = (h) => padding.left + (h / 144) * graphWidth;
    const yScale = (b) => padding.top + graphHeight - (b / 25) * graphHeight;
    
    // Generate PT threshold curves for different risk levels
    const generatePTCurve = (riskLevel) => {
      const points = [];
      for (let h = 12; h <= 144; h += 6) {
        const thresh = getPhototherapyThreshold(h, gestage, riskLevel);
        points.push({ h, b: thresh });
      }
      return points;
    };
    
    // Generate exchange threshold curve
    const generateExCurve = () => {
      const points = [];
      for (let h = 12; h <= 144; h += 6) {
        const thresh = getExchangeThreshold(h, gestage);
        points.push({ h, b: thresh });
      }
      return points;
    };
    
    const highRiskPT = generatePTCurve("high");
    const medRiskPT = generatePTCurve("medium");
    const lowRiskPT = generatePTCurve("low");
    const exchangeCurve = generateExCurve();
    
    const createPath = (curve) => curve.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(p.h)} ${yScale(p.b)}`
    ).join(' ');
    
    const currentPTPath = createPath(risk === "high" ? highRiskPT : risk === "medium" ? medRiskPT : lowRiskPT);
    const exchangePath = createPath(exchangeCurve);
    
    const patientX = age_hrs <= 144 && age_hrs >= 12 ? xScale(age_hrs) : null;
    const patientY = bili <= 25 ? yScale(bili) : null;
    const showPoint = patientX !== null && patientY !== null && bili > 0;
    
    return (
      <div style={{marginTop:16,padding:"16px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.08em"}}>
          Treatment Thresholds (GA {gestage}w)
        </div>
        <svg width={width} height={height} style={{display:"block",margin:"0 auto"}}>
          <defs>
            <linearGradient id="ptZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"rgb(217,119,6)",stopOpacity:0.08}} />
              <stop offset="100%" style={{stopColor:"rgb(217,119,6)",stopOpacity:0.02}} />
            </linearGradient>
            <linearGradient id="exchangeZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"rgb(220,38,38)",stopOpacity:0.12}} />
              <stop offset="100%" style={{stopColor:"rgb(220,38,38)",stopOpacity:0.04}} />
            </linearGradient>
          </defs>
          
          {/* Shaded zones */}
          <path d={`${currentPTPath} L ${xScale(144)} ${yScale(0)} L ${xScale(12)} ${yScale(0)} Z`} fill="url(#ptZone)" />
          <path d={`${exchangePath} L ${xScale(144)} ${yScale(25)} L ${xScale(12)} ${yScale(25)} Z`} fill="url(#exchangeZone)" />
          
          {/* Grid */}
          {[0, 5, 10, 15, 20, 25].map(b => (
            <g key={`grid-y2-${b}`}>
              <line x1={padding.left} y1={yScale(b)} x2={width-padding.right} y2={yScale(b)} 
                    stroke={COLORS.border} strokeWidth="1" strokeDasharray="2,2" />
              <text x={padding.left-8} y={yScale(b)+4} textAnchor="end" fontSize="10" fill={COLORS.textMuted} fontFamily="'DM Mono', monospace">
                {b}
              </text>
            </g>
          ))}
          
          {[0, 24, 48, 72, 96, 120, 144].map(h => (
            <g key={`grid-x2-${h}`}>
              <line x1={xScale(h)} y1={padding.top} x2={xScale(h)} y2={height-padding.bottom} 
                    stroke={COLORS.border} strokeWidth="1" strokeDasharray="2,2" />
              <text x={xScale(h)} y={height-padding.bottom+20} textAnchor="middle" fontSize="10" fill={COLORS.textMuted} fontFamily="'DM Mono', monospace">
                {h}
              </text>
            </g>
          ))}
          
          {/* Threshold lines */}
          <path d={exchangePath} fill="none" stroke={COLORS.danger} strokeWidth="2.5" />
          <path d={currentPTPath} fill="none" stroke={COLORS.warning} strokeWidth="2.5" />
          
          {/* Labels */}
          <text x={xScale(100)} y={yScale(getExchangeThreshold(100, gestage))-8} fontSize="10" fontWeight="600" fill={COLORS.danger} fontFamily="'DM Mono', monospace">
            Exchange Transfusion
          </text>
          <text x={xScale(90)} y={yScale(getPhototherapyThreshold(90, gestage, risk))-8} fontSize="10" fontWeight="600" fill={COLORS.warning} fontFamily="'DM Mono', monospace">
            Phototherapy ({risk} risk)
          </text>
          
          {/* Patient point */}
          {showPoint && (
            <g>
              <circle cx={patientX} cy={patientY} r="8" fill="none" 
                      stroke={needsExchange ? COLORS.danger : needsPT ? COLORS.warning : COLORS.success} 
                      strokeWidth="1.5" opacity="0.3">
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={patientX} cy={patientY} r="5" 
                      fill={needsExchange ? COLORS.danger : needsPT ? COLORS.warning : COLORS.success} 
                      stroke="white" strokeWidth="2" />
              <text x={patientX} y={patientY-15} textAnchor="middle" fontSize="11" fontWeight="700" 
                    fill={needsExchange ? COLORS.danger : needsPT ? COLORS.warning : COLORS.success} 
                    fontFamily="'Sora', sans-serif">
                Patient
              </text>
            </g>
          )}
          
          {/* Axes */}
          <text x={width/2} y={height-8} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLORS.text} fontFamily="'DM Mono', monospace">
            Postnatal Age (hours)
          </text>
          <text x={18} y={height/2} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLORS.text} fontFamily="'DM Mono', monospace"
                transform={`rotate(-90, 18, ${height/2})`}>
            TSB (mg/dL)
          </text>
        </svg>
        <div style={{marginTop:10,fontSize:10,color:COLORS.textMuted,fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
          AAP 2022 guidelines • Adjusted for GA and risk factors
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}><NumberInput label="Bilirubin" value={bili} onChange={setBili} min={0} max={35} step={0.1} unit="mg/dL" /></div>
        <div style={{ flex: 1 }}><NumberInput label="Age" value={age_hrs} onChange={setAgeHrs} min={1} max={168} unit="hours of life" /></div>
      </div>
      <NumberInput label="Gestational Age at Birth" value={gestage} onChange={setGestage} min={35} max={42} unit="weeks" />
      <ScoreRow label="Risk Factors" value={risk} onChange={setRisk} options={[{value:"low",label:"Low (no risk factors)"},{value:"medium",label:"Medium"},{value:"high",label:"High (DAT+, isoimmune)"}]} />

      {showGraph && (
        <button
          onClick={scrollToGraph}
          style={{ width: "100%", marginTop: 8, marginBottom: 4, padding: "10px", borderRadius: 3, border: `1px solid ${COLORS.navy}`, background: COLORS.navy, color: "#ffffff", fontSize: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 600, cursor: "pointer" }}
        >
          View Nomogram ↓
        </button>
      )}
      
      {showGraph && (
        <div ref={graphRef}>
          {/* Bhutani Risk Zones Graph */}
          <BhutaniRiskZones />
          
          {/* Phototherapy Threshold Graph */}
          <PhototherapyThresholdGraph />
          
          {/* Summary Result Badge */}
          <ResultBadge 
            score={zoneLabel} 
            label={needsExchange ? "▸ EXCHANGE TRANSFUSION RANGE" : needsPT ? "▸ Meets Phototherapy Threshold" : "▸ Below Phototherapy Threshold"} 
            color={needsExchange ? COLORS.danger : needsPT ? COLORS.warning : zoneColor} 
            sublabel={`PT threshold: ${ptThreshold} mg/dL • Exchange: ${exThreshold} mg/dL`} 
          />
          
          {/* Treatment Recommendations */}
          {needsPT && (
            <div style={{marginTop:14,padding:"14px 16px",borderRadius:12,background:needsExchange ? "rgba(220,38,38,0.08)" : "rgba(217,119,6,0.08)",border:`1.5px solid ${needsExchange ? COLORS.danger : COLORS.warning}`}}>
              <div style={{color:needsExchange ? COLORS.danger : COLORS.warning,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:600,marginBottom:8}}>
                {needsExchange ? "⚠ URGENT: Exchange Transfusion Criteria Met" : "Phototherapy Recommended"}
              </div>
              <div style={{color:COLORS.text,fontSize:12,fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
                {needsExchange ? (
                  <>
                    <div>• Immediate double-volume exchange transfusion</div>
                    <div>• Continue intensive phototherapy during preparation</div>
                    <div>• Volume: 160-180 mL/kg (2× blood volume)</div>
                    <div>• Monitor glucose, calcium, electrolytes</div>
                    <div style={{marginTop:6,color:COLORS.danger,fontSize:11}}>
                      ⚠ Risk of kernicterus — do not delay
                    </div>
                  </>
                ) : (
                  <>
                    <div>• Intensive phototherapy (irradiance ≥30 μW/cm²/nm)</div>
                    <div>• Maximize skin exposure, eye protection</div>
                    <div>• Recheck TSB in 4-6 hours</div>
                    <div>• Ensure adequate hydration and feeding</div>
                    {gestage < 38 && <div style={{marginTop:6,color:COLORS.warning,fontSize:11}}>
                      ⚠ Lower threshold for preterm infant — monitor closely
                    </div>}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Additional warnings */}
          {bili >= 25 && !needsExchange && (
            <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:"rgba(220,38,38,0.08)",border:`1px solid ${COLORS.danger}`,color:COLORS.danger,fontSize:12,fontFamily:"'DM Mono',monospace"}}>
              ⚠ TSB ≥25 mg/dL — Approaching exchange threshold. Urgent evaluation required.
            </div>
          )}
        </div>
      )}
      
      {bili > 0 && age_hrs < 12 && (
        <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:"rgba(217,119,6,0.08)",border:`1px solid ${COLORS.warning}`,color:COLORS.warning,fontSize:12,fontFamily:"'DM Mono',monospace"}}>
          ℹ Bhutani nomogram and treatment thresholds validated for age ≥12 hours. Interpret with caution.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PEDIATRIC READMISSION RISK (PRAF-style)
// ═══════════════════════════════════════════════════════════════════════════════
function ReadmissionCalc() {
  const [vals, setVals] = useState({
    prior_admit:null, chronic_condition:null, length_stay:null, insurance:null,
    age:null, discharge_disp:null, icu:null, polypharmacy:null
  });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const score = Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled = Object.values(vals).every(v=>v!==null);
  const risk_pct = Math.min(Math.round(5 + score * 3.5), 75);
  const color = score>=10?COLORS.danger:score>=6?COLORS.warning:COLORS.success;
  const label = score>=10?"High Risk":score>=6?"Intermediate":score<6?"Low Risk":"—";
  return (
    <div>
      <ScoreRow label="Prior Admission (12 mo)" value={vals.prior_admit} onChange={v=>set("prior_admit",v)} options={[{value:0,label:"0 — None"},{value:2,label:"2 — 1 prior"},{value:4,label:"4 — ≥2 prior"}]} />
      <ScoreRow label="Complex Chronic Condition" value={vals.chronic_condition} onChange={v=>set("chronic_condition",v)} options={[{value:0,label:"0 — None"},{value:2,label:"2 — 1 CCC"},{value:4,label:"4 — ≥2 CCC"}]} />
      <ScoreRow label="Length of Stay" value={vals.length_stay} onChange={v=>set("length_stay",v)} options={[{value:0,label:"0 — <3 days"},{value:1,label:"1 — 3–7 days"},{value:2,label:"2 — >7 days"}]} />
      <ScoreRow label="Insurance Type" value={vals.insurance} onChange={v=>set("insurance",v)} options={[{value:0,label:"0 — Private"},{value:1,label:"1 — Medicaid/Public"},{value:2,label:"2 — Uninsured"}]} />
      <ScoreRow label="Age Group" value={vals.age} onChange={v=>set("age",v)} options={[{value:0,label:"0 — 2–17 yrs"},{value:1,label:"1 — <2 years"}]} />
      <ScoreRow label="ICU Stay" value={vals.icu} onChange={v=>set("icu",v)} options={[{value:0,label:"0 — No ICU"},{value:2,label:"2 — ICU stay"}]} />
      <ScoreRow label="Discharge Disposition" value={vals.discharge_disp} onChange={v=>set("discharge_disp",v)} options={[{value:0,label:"0 — Home"},{value:1,label:"1 — Home+services"},{value:2,label:"2 — SNF/Rehab"}]} />
      <ScoreRow label="Polypharmacy (≥5 meds)" value={vals.polypharmacy} onChange={v=>set("polypharmacy",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      {filled && <ResultBadge score={`${risk_pct}%`} label={`${label} 30-day Readmission`} color={color} sublabel={`Score: ${score} • Composite risk estimate`} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PEWS (Pediatric Early Warning Score)
// ═══════════════════════════════════════════════════════════════════════════════
function PEWSCalc() {
  const [vals, setVals] = useState({ behavior:null, cardiovascular:null, respiratory:null, nebulizer:null, vomit:null });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const score = (vals.behavior??0)+(vals.cardiovascular??0)+(vals.respiratory??0)+(vals.nebulizer??0)+(vals.vomit??0);
  const filled = Object.values(vals).every(v=>v!==null);
  const color = score>=6?COLORS.danger:score>=4?COLORS.orange:score>=2?COLORS.warning:COLORS.success;
  const label = score>=6?"Immediate Intervention":score>=4?"Urgent Review":score>=2?"Close Monitoring":"Routine";
  return (
    <div>
      <ScoreRow label="Behavior" value={vals.behavior} onChange={v=>set("behavior",v)} options={[{value:0,label:"0 — Playing/Appropriate"},{value:1,label:"1 — Sleeping"},{value:2,label:"2 — Irritable"},{value:3,label:"3 — Lethargic/Confused"}]} />
      <ScoreRow label="Cardiovascular" value={vals.cardiovascular} onChange={v=>set("cardiovascular",v)} options={[{value:0,label:"0 — Pink, CRT ≤2s"},{value:1,label:"1 — Pale/CRT 3s"},{value:2,label:"2 — Gray/CRT 4s"},{value:3,label:"3 — Gray, mottled, CRT ≥5s"}]} />
      <ScoreRow label="Respiratory" value={vals.respiratory} onChange={v=>set("respiratory",v)} options={[{value:0,label:"0 — Normal rate"},{value:1,label:"1 — >10 above normal"},{value:2,label:"2 — >20 above/retractions"},{value:3,label:"3 — >30 above/grunting"}]} />
      <ScoreRow label="Nebulizer Treatments" value={vals.nebulizer} onChange={v=>set("nebulizer",v)} options={[{value:0,label:"0 — None in last hour"},{value:2,label:"2 — Any nebulizer"}]} />
      <ScoreRow label="Persistent Vomiting Post-Op" value={vals.vomit} onChange={v=>set("vomit",v)} options={[{value:0,label:"0 — No"},{value:2,label:"2 — Yes"}]} />
      {filled && <ResultBadge score={score} label={label} color={color} sublabel="Score 0–13 • Consider rapid response ≥6" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PECARN HEAD TRAUMA
// ═══════════════════════════════════════════════════════════════════════════════
function PECARNCalc() {
  const [ageGroup, setAgeGroup] = useState("older");
  const [vals, setVals] = useState({
    gcs:null, ams:null, skull:null, scalp:null, loss:null, history:null, severe_mech:null,
    basal:null, vomit:null, ha:null
  });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const [showMechInfo, setShowMechInfo] = useState(false);
  const [showAMSInfo, setShowAMSInfo] = useState(false);

  // <2 years: high-risk tier (any one = CT Recommended)
  const highRiskYounger = vals.gcs === "low" || vals.ams === "yes" || vals.skull === "yes";

  // <2 years: intermediate tier (shared decision-making)
  const intermediateYounger = !highRiskYounger && (
    vals.scalp === "small" || vals.scalp === "large" || vals.loss === "yes" || vals.history === "yes" || vals.severe_mech === "yes"
  );

  // ≥2 years: high-risk tier (any one = CT)
  const highRiskOlder = vals.gcs === "low" || vals.ams === "yes" || vals.basal === "yes";

  // ≥2 years: intermediate tier
  const intermediateOlder = !highRiskOlder && (
    vals.vomit === "yes" || vals.loss === "yes" || vals.ha === "yes" || vals.severe_mech === "yes"
  );

  const highRisk = ageGroup === "younger" ? highRiskYounger : highRiskOlder;
  const intermediate = ageGroup === "younger" ? intermediateYounger : intermediateOlder;

  const youngerFilled = vals.gcs !== null && vals.ams !== null && vals.skull !== null &&
    vals.scalp !== null && vals.loss !== null && vals.history !== null && vals.severe_mech !== null;
  const olderFilled = vals.gcs !== null && vals.ams !== null && vals.basal !== null &&
    vals.vomit !== null && vals.loss !== null && vals.ha !== null && vals.severe_mech !== null;
  const filled = ageGroup === "younger" ? youngerFilled : olderFilled;

  const showResult = ageGroup === "younger"
    ? (highRiskYounger || youngerFilled)
    : (highRiskOlder || olderFilled);

  const score = highRisk ? "CT Recommended" : intermediate ? "Observation vs. CT\nUsing shared decision-making" : "CT NOT Indicated (Observe)";
  const color = highRisk ? COLORS.danger : intermediate ? COLORS.warning : COLORS.success;
  const label = null;
  const sublabel = ageGroup === "younger"
    ? (highRisk ? "ciTBI risk 4.4% · PECARN 2009" : intermediate ? "ciTBI risk 0.9% · PECARN 2009" : "ciTBI risk <0.02% · PECARN 2009")
    : (highRisk ? "ciTBI risk 4.3% · PECARN 2009" : intermediate ? "ciTBI risk 0.8% · PECARN 2009" : "ciTBI risk <0.05% · PECARN 2009");

  const youngerDetail = intermediate && ageGroup === "younger" ? {
    title: "Clinical factors to guide decision-making:",
    bullets: [
      "Multiple vs. isolated factors",
      "Worsening findings (AMS, H/A, vomiting) during observation",
      "Physician experience",
      "Parental preference",
      "Very young infant (< 3 months old)",
    ]
  } : null;
  const olderDetail = intermediate && ageGroup === "older" ? {
    title: "Clinical factors to guide decision-making:",
    bullets: [
      "Multiple vs. isolated factors",
      "Worsening findings during observation (AMS, headache, vomiting)",
      "Physician experience",
      "Parental preference",
    ]
  } : null;
  const detail = ageGroup === "younger" ? youngerDetail : olderDetail;

  return (
    <div>
      <ScoreRow label="Age Group" value={ageGroup} onChange={v => { setAgeGroup(v); setVals({gcs:null,ams:null,skull:null,scalp:null,loss:null,history:null,severe_mech:null,basal:null,vomit:null,ha:null}); }} options={[{value:"younger",label:"<2 years"},{value:"older",label:"≥2 years"}]} />

      {ageGroup === "younger" && <>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><ScoreRow label="GCS" value={vals.gcs} onChange={v=>set("gcs",v)} options={[{value:"normal",label:"15"},{value:"low",label:"14 or less"}]} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>AMS</div>
                <button onClick={() => setShowAMSInfo(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 14, lineHeight: 1, padding: "0 0 0 4px" }}>ℹ</button>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[{value:"no",label:"No"},{value:"yes",label:"Yes"}].map(opt => (
                  <button key={opt.value} onClick={() => set("ams", opt.value)} style={{ flex: 1, padding: "8px 6px", borderRadius: 3, border: "1px solid #d0d4d9", background: vals.ams === opt.value ? "#e8eaed" : COLORS.bg, color: COLORS.navy, fontSize: 15, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 500, whiteSpace: "nowrap" }}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <ScoreRow label="Palpable Skull Fracture" value={vals.skull} onChange={v=>set("skull",v)} options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]} />
        <ScoreRow label="Scalp Hematoma" value={vals.scalp} onChange={v=>set("scalp",v)} options={[{value:"none",label:"None"},{value:"frontal",label:"Frontal"},{value:"small",label:"S Non-Frontal"},{value:"large",label:"L Non-Frontal"}]} />
        <ScoreRow label="Loss of Consciousness" value={vals.loss} onChange={v=>set("loss",v)} options={[{value:"no",label:"No or <5 sec"},{value:"yes",label:"≥5 sec"}]} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><ScoreRow label="Not Acting Normally" value={vals.history} onChange={v=>set("history",v)} options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Severe Mechanism</div>
                <button onClick={() => setShowMechInfo(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 14, lineHeight: 1, padding: "0 0 0 4px" }}>ℹ</button>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[{value:"no",label:"No"},{value:"yes",label:"Yes"}].map(opt => (
                  <button key={opt.value} onClick={() => set("severe_mech", opt.value)} style={{ flex: 1, padding: "8px 6px", borderRadius: 3, border: "1px solid #d0d4d9", background: vals.severe_mech === opt.value ? "#e8eaed" : COLORS.bg, color: COLORS.navy, fontSize: 15, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 500, whiteSpace: "nowrap" }}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </>}

      {ageGroup === "older" && <>
        {/* HIGH-RISK: GCS + AMS on same row */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><ScoreRow label="GCS" value={vals.gcs} onChange={v=>set("gcs",v)} options={[{value:"normal",label:"15"},{value:"low",label:"14 or less"}]} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>AMS</div>
                <button onClick={() => setShowAMSInfo(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 14, lineHeight: 1, padding: "0 0 0 4px" }}>ℹ</button>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[{value:"no",label:"No"},{value:"yes",label:"Yes"}].map(opt => (
                  <button key={opt.value} onClick={() => set("ams", opt.value)} style={{ flex: 1, padding: "8px 6px", borderRadius: 3, border: "1px solid #d0d4d9", background: vals.ams === opt.value ? "#e8eaed" : COLORS.bg, color: COLORS.navy, fontSize: 15, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 500, whiteSpace: "nowrap" }}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <ScoreRow label="Signs of Basilar Skull Fracture" value={vals.basal} onChange={v=>set("basal",v)} options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]} />

        {/* INTERMEDIATE */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><ScoreRow label="Vomiting" value={vals.vomit} onChange={v=>set("vomit",v)} options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]} /></div>
          <div style={{ flex: 1 }}><ScoreRow label="Severe Headache" value={vals.ha} onChange={v=>set("ha",v)} options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><ScoreRow label="Loss of Consciousness" value={vals.loss} onChange={v=>set("loss",v)} options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Severe Mechanism</div>
                <button onClick={() => setShowMechInfo(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 14, lineHeight: 1, padding: "0 0 0 4px" }}>ℹ</button>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[{value:"no",label:"No"},{value:"yes",label:"Yes"}].map(opt => (
                  <button key={opt.value} onClick={() => set("severe_mech", opt.value)} style={{ flex: 1, padding: "8px 6px", borderRadius: 3, border: "1px solid #d0d4d9", background: vals.severe_mech === opt.value ? "#e8eaed" : COLORS.bg, color: COLORS.navy, fontSize: 15, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 500, whiteSpace: "nowrap" }}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>}

      {/* AMS Info Modal — shared across both age groups */}
      {showAMSInfo && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,35,50,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", animation: "fadeUp 0.2s ease" }} onClick={() => setShowAMSInfo(false)}>
          <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: COLORS.bg, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: "20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 4 }}>PECARN · Altered Mental Status</div>
                <div style={{ color: COLORS.navy, fontSize: 16, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>Signs of AMS</div>
              </div>
              <button onClick={() => setShowAMSInfo(false)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
            </div>
            {["Agitation", "Somnolence", "Slow response", "Repetitive questioning"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.navy, flexShrink: 0, marginTop: 6 }} />
                <div style={{ color: COLORS.navy, fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.5 }}>{item}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, color: COLORS.textMuted, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>PECARN 2009 · Kuppermann et al.</div>
          </div>
        </div>
      )}

      {/* Severe Mechanism Info Modal — shared across both age groups */}
      {showMechInfo && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,35,50,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", animation: "fadeUp 0.2s ease" }} onClick={() => setShowMechInfo(false)}>
          <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: COLORS.bg, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: "20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 4 }}>PECARN · Severe Mechanism</div>
                <div style={{ color: COLORS.navy, fontSize: 16, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>Examples of High-Impact Mechanism</div>
              </div>
              <button onClick={() => setShowMechInfo(false)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
            </div>
            {[
              ageGroup === "younger" ? "Fall > 3 ft" : "Fall > 5 ft",
              "MVA with ejection, rollover, or fatality",
              "Bike or pedestrian struck by vehicle without helmet",
              "Struck by high-impact object",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.navy, flexShrink: 0, marginTop: 6 }} />
                <div style={{ color: COLORS.navy, fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.5 }}>{item}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, color: COLORS.textMuted, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>PECARN 2009 · Kuppermann et al.</div>
          </div>
        </div>
      )}

      {showResult && <ResultBadge score={score} label={label} color={color} sublabel={sublabel} detail={detail} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: FLUID MAINTENANCE (Holliday-Segar)
// ═══════════════════════════════════════════════════════════════════════════════
function FluidCalc() {
  const [weight, setWeight] = useState(20);
  const [rateMethod, setRateMethod] = useState("hs");
  const [fluid, setFluid] = useState("d5ns");
  const [kcl, setKcl] = useState(20);
  const [insensibleIdx, setInsensibleIdx] = useState(2);
  const [tempIdx, setTempIdx] = useState(3);
  const [metabolic, setMetabolic] = useState(0);

  // Holliday-Segar
  const hsDaily = weight <= 10 ? weight * 100
    : weight <= 20 ? 1000 + (weight - 10) * 50
    : 1500 + (weight - 20) * 20;
  const hsHourly = hsDaily / 24;
  const hsFormula = weight <= 10 ? `${weight} × 100` : weight <= 20 ? `1000 + ${weight-10} × 50` : `1500 + ${weight-20} × 20`;

  // 4:2:1
  const fourTwoOneHourly = weight <= 10 ? weight * 4
    : weight <= 20 ? 40 + (weight - 10) * 2
    : 60 + (weight - 20) * 1;
  const fourTwoOneDaily = fourTwoOneHourly * 24;
  const ftwoFormula = weight <= 10 ? `${weight} × 4` : weight <= 20 ? `40 + ${weight-10} × 2` : `60 + ${weight-20} × 1`;

  // Sliders
  const INSENSIBLE = [
    { label: "Ventilator", pct: -0.10 },
    { label: "Humidified O₂", pct: -0.05 },
    { label: "Room Air", pct: 0 },
    { label: "Tachypnea", pct: 0.05 },
    { label: "Hot/Dry", pct: 0.10 },
  ];
  const TEMP = [
    { label: "34°C", pct: -0.20 },
    { label: "35°C", pct: -0.10 },
    { label: "36°C", pct: 0 },
    { label: "37°C", pct: 0 },
    { label: "38°C", pct: 0 },
    { label: "39°C", pct: 0.10 },
    { label: "40°C", pct: 0.20 },
  ];
  const METABOLIC_STEPS = [-0.40,-0.30,-0.20,-0.10,0,0.10,0.20,0.30,0.40];

  const insPct = INSENSIBLE[insensibleIdx].pct;
  const tempPct = TEMP[tempIdx].pct;
  const metPct = metabolic;

  // Selected base rate (pre-adjustment)
  const baseHourly = rateMethod === "hs" ? hsHourly : fourTwoOneHourly;
  const baseDaily = baseHourly * 24;

  // Adjusted volume (multiplicative) — based on selected method
  const adjustedDaily = baseHourly * 24 * (1 + insPct) * (1 + tempPct) * (1 + metPct);
  const adjustedHourly = adjustedDaily / 24;

  // Applied adjustments to selected rate
  const selectedHourly = baseHourly * (1 + insPct) * (1 + tempPct) * (1 + metPct);
  const selectedDaily = selectedHourly * 24;

  // Fluid compositions
  const FLUIDS = {
    ns:    { label: "NS (0.9%)",  na: 154, dex: 0,  warning: null },
    d5ns:  { label: "D5NS",       na: 154, dex: 5,  warning: null },
    d5hns: { label: "D5½NS",      na: 77,  dex: 5,  warning: "⚠ Hypotonic — AAP 2018 recommends isotonic solutions" },
    d10ns: { label: "D10NS",      na: 154, dex: 10, warning: null },
    d10w:  { label: "D10W",       na: 0,   dex: 10, warning: "⚠ No sodium — requires separate Na supplementation" },
  };
  const f = FLUIDS[fluid];

  // Requirements
  const naReqLow = (3 * weight).toFixed(0);
  const naReqHigh = (4 * weight).toFixed(0);
  const kReqLow = (1 * weight).toFixed(0);
  const kReqHigh = (2 * weight).toFixed(0);

  // Delivered
  const naDeliveredOld = ((f.na * selectedDaily) / 1000).toFixed(1);
  const kDeliveredOld = ((kcl * selectedDaily) / 1000).toFixed(1);
  const gir = f.dex > 0 ? ((f.dex * 10 * selectedHourly) / (60 * weight)).toFixed(2) : null;

  // Styles
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${COLORS.border}` };
  const labelStyle = { color: COLORS.textMuted, fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 };
  const reqStyle = { color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", textAlign: "right" };
  const delivStyle = (ok) => ({ color: ok === false ? COLORS.warning : ok === true ? COLORS.success : COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", textAlign: "right", fontWeight: 600 });
  const pctLabel = (pct) => pct === 0 ? "0%" : pct > 0 ? `+${(pct*100).toFixed(0)}%` : `${(pct*100).toFixed(0)}%`;

  // Pip stepper — no arrow boxes, full-width tap targets
  const Stepper = ({ label, steps, idx, setIdx, leftNote, rightNote, warning }) => {
    const pct = steps[idx].pct;
    const activeColor = pct > 0 ? COLORS.danger : pct < 0 ? COLORS.accent : COLORS.navy;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{label}</div>
          <div style={{ color: pct === 0 ? COLORS.textMuted : activeColor, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
            {steps[idx].label} · {pctLabel(pct)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {steps.map((s, i) => (
            <div key={i} onClick={() => setIdx(i)}
              style={{ flex: 1, height: 28, borderRadius: 3, background: i === idx ? activeColor : COLORS.border, cursor: "pointer", transition: "background 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i === idx && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif" }}>{leftNote}</div>
          <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textAlign: "right" }}>{rightNote}</div>
        </div>
        {warning && <div style={{ marginTop: 4, fontSize: 10, color: COLORS.warning, fontFamily: "'IBM Plex Sans', sans-serif" }}>{warning}</div>}
      </div>
    );
  };

  const metIdx = METABOLIC_STEPS.indexOf(metPct) === -1 ? 4 : METABOLIC_STEPS.indexOf(metPct);

  // Rounding convention by weight
  const roundedSuggestion = (() => {
    const raw = adjustedHourly;
    if (weight < 5)  return Math.round(raw * 10) / 10;      // tenths
    if (weight <= 25) return Math.round(raw);                // integer
    if (weight <= 85) return Math.round(raw / 5) * 5;       // nearest 5
    return 125;                                               // adult cap
  })();

  const [orderedRate, setOrderedRate] = useState(null);
  const [orderedRateInput, setOrderedRateInput] = useState("");
  const [rateConfirmed, setRateConfirmed] = useState(false);
  const [showRoundingInfo, setShowRoundingInfo] = useState(false);

  // When adjustedHourly changes, reset confirmation
  useEffect(() => {
    setRateConfirmed(false);
    setOrderedRateInput(String(roundedSuggestion));
  }, [adjustedHourly, rateMethod]);

  const confirmedRate = rateConfirmed ? orderedRate : null;
  const confirmedDaily = confirmedRate ? confirmedRate * 24 : null;
  const naDelivered = ((f.na * (confirmedDaily ?? selectedDaily)) / 1000).toFixed(1);
  const kDelivered = ((kcl * (confirmedDaily ?? selectedDaily)) / 1000).toFixed(1);
  const girDelivered = f.dex > 0 ? ((f.dex * 10 * (confirmedRate ?? adjustedHourly)) / (60 * weight)).toFixed(2) : null;
  const girOk = girDelivered ? parseFloat(girDelivered) >= 3 && parseFloat(girDelivered) <= 6 : null;

  const [detailOpen, setDetailOpen] = useState(false);

  const GoldDivider = ({ open, onToggle }) => (
    <div onClick={onToggle} style={{ position: "relative", marginBottom: open ? 0 : 10, marginTop: 10, cursor: "pointer", userSelect: "none" }}>
      <div style={{ height: 2, background: "#d4a444", borderRadius: 1 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: COLORS.bg, padding: "0 8px", lineHeight: 1 }}>
        <span style={{ color: "#d4a444", fontSize: 14, fontWeight: 700 }}>{open ? "∧" : "∨"}</span>
      </div>
    </div>
  );

  return (
    <div>
      {/* Weight + Rate toggle: equal halves, aligned labels */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <NumberInput label="Weight" value={weight} onChange={setWeight} min={0.5} max={100} step={0.5} unit="kg" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 5 }}>Rate Calculation Method</div>
          <div style={{ display: "flex" }}>
            {[{value:"hs",label:"H-S"},{value:"421",label:"4:2:1"}].map((opt, i) => (
              <button key={opt.value} onClick={() => setRateMethod(opt.value)} style={{
                flex: 1, padding: "9px 6px",
                border: "1px solid #d0d4d9",
                borderRadius: i === 0 ? "3px 0 0 3px" : "0 3px 3px 0",
                borderLeft: i === 1 ? "none" : "1px solid #d0d4d9",
                background: rateMethod === opt.value ? "#e8eaed" : COLORS.bg,
                color: COLORS.navy, fontSize: 13, cursor: "pointer",
                fontFamily: "-apple-system, sans-serif",
                fontWeight: rateMethod === opt.value ? 700 : 500,
                whiteSpace: "nowrap", textAlign: "center",
              }}>{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Gold divider with chevron — top of accordion */}
      <GoldDivider open={detailOpen} onToggle={() => setDetailOpen(o => !o)} />

      {/* Accordion */}
      {detailOpen && (
        <div style={{ marginBottom: 0, padding: "10px 12px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderTop: "none", borderBottom: "none" }}>
          {/* Selected method detail */}
          {rateMethod === "hs" ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, fontFamily: "-apple-system, sans-serif", fontWeight: 700, color: COLORS.navy }}>H-S</span>
                <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: COLORS.navy }}>~{hsHourly.toFixed(1)} mL/hr</span>
              </div>
              <div style={{ textAlign: "center", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}><strong style={{ color: COLORS.navy }}>{hsDaily.toFixed(0)} mL/day</strong></div>
              <div style={{ marginTop: 6, fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textMuted, lineHeight: 1.6 }}>
                <div>(100×{Math.min(weight,10)})+(50×{Math.max(0,Math.min(weight-10,10))})+(20×{Math.max(0,weight-20)})</div>
                <div>= <strong style={{ color: COLORS.navy }}>{hsDaily.toFixed(0)} mL/day</strong> [÷24 = ~{hsHourly.toFixed(1)} mL/hr]</div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, fontFamily: "-apple-system, sans-serif", fontWeight: 700, color: COLORS.navy }}>4:2:1</span>
                <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: COLORS.navy }}>{Math.round(fourTwoOneHourly)} mL/hr</span>
              </div>
              <div style={{ textAlign: "center", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}><strong style={{ color: COLORS.navy }}>{fourTwoOneDaily.toFixed(0)} mL/day</strong></div>
              <div style={{ marginTop: 6, fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textMuted, lineHeight: 1.6 }}>
                <div>(4×{Math.min(weight,10)})+(2×{Math.max(0,Math.min(weight-10,10))})+(1×{Math.max(0,weight-20)})</div>
                <div>= {Math.round(fourTwoOneHourly)} mL/hr [×24 = ~<strong style={{ color: COLORS.navy }}>{fourTwoOneDaily.toFixed(0)} mL/day</strong>]</div>
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, marginTop: 4 }}>
            <Stepper label="Insensible Losses" steps={INSENSIBLE} idx={insensibleIdx} setIdx={setInsensibleIdx} leftNote="Ventilator / humidified circuit" rightNote="Tachypnea / hot-dry environment" />
            <Stepper label="Temperature" steps={TEMP} idx={tempIdx} setIdx={setTempIdx} leftNote="Hypothermia / cooling protocol" rightNote="Fever ≥39°C" warning={tempIdx === 6 ? "⚠ >40°C requires individualized assessment" : null} />
            <Stepper label="Metabolic State" steps={METABOLIC_STEPS.map(p => ({ label: p === 0 ? "Baseline" : pctLabel(p), pct: p }))} idx={metIdx} setIdx={i => setMetabolic(METABOLIC_STEPS[i])} leftNote="Coma · paralysis · deep sedation" rightNote="Burn · sepsis · status · thyroid storm" />
          </div>
        </div>
      )}

      {/* Gold divider — bottom only shown when open */}
      {detailOpen && <GoldDivider open={detailOpen} onToggle={() => setDetailOpen(o => !o)} />}

      {/* IV fluid */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 5 }}>IV Fluid</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Object.entries(FLUIDS).map(([key, fl]) => (
            <button key={key} onClick={() => setFluid(key)} style={{ flex: 1, padding: "8px 6px", borderRadius: 3, border: `1px solid ${fluid === key && fl.warning ? COLORS.warning : "#d0d4d9"}`, background: fluid === key ? "#e8eaed" : COLORS.bg, color: COLORS.navy, fontSize: 13, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 500, whiteSpace: "nowrap" }}>{fl.label}</button>
          ))}
        </div>
        {f.warning && (
          <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 3, background: "rgba(217,130,43,0.07)", border: `1px solid ${COLORS.warning}`, color: COLORS.warning, fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif" }}>{f.warning}</div>
        )}
      </div>

      <ScoreRow label="KCl Concentration" value={kcl} onChange={setKcl} options={[{value:10,label:"10 mEq/L"},{value:20,label:"20 mEq/L"},{value:30,label:"30 mEq/L"},{value:40,label:"40 mEq/L"}]} />

      {/* Result card */}
      <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 3, background: `rgba(15,153,96,0.06)`, border: `1px solid ${COLORS.success}` }}>
        <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 500 }}>{rateMethod === "hs" ? "H-S" : "4:2:1"} Calculated Fluid Requirement</div>
        <div style={{ color: COLORS.success, fontSize: 28, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.2 }}>{adjustedHourly.toFixed(1)} mL/hr</div>
        <div style={{ color: COLORS.success, fontSize: 13, fontWeight: 600, marginTop: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>{adjustedDaily.toFixed(0)} mL/day</div>
        <div style={{ borderTop: `1px solid ${COLORS.success}`, marginTop: 10, paddingTop: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.navy, lineHeight: 1.9, opacity: 0.85 }}>
          {insPct !== 0 && <div>× Insensible: <span style={{ color: insPct < 0 ? COLORS.accent : COLORS.danger }}>(1 {insPct > 0 ? "+" : ""}{(insPct*100).toFixed(0)}%) = {(1+insPct).toFixed(2)}</span></div>}
          {tempPct !== 0 && <div>× Temperature: <span style={{ color: tempPct < 0 ? COLORS.accent : COLORS.danger }}>(1 {tempPct > 0 ? "+" : ""}{(tempPct*100).toFixed(0)}%) = {(1+tempPct).toFixed(2)}</span></div>}
          {metPct !== 0 && <div>× Metabolic: <span style={{ color: metPct < 0 ? COLORS.accent : COLORS.danger }}>(1 {metPct > 0 ? "+" : ""}{(metPct*100).toFixed(0)}%) = {(1+metPct).toFixed(2)}</span></div>}
          {(insPct === 0 && tempPct === 0 && metPct === 0) && <div style={{ color: COLORS.textMuted }}>No clinical modifiers applied</div>}
        </div>
      </div>

      {/* Ordered Rate field */}
      <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 3, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Ordered Rate (mL/hr)</div>
          <button onClick={() => setShowRoundingInfo(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 14, lineHeight: 1, padding: "0 0 0 4px" }}>ℹ</button>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="number"
            inputMode="decimal"
            enterKeyHint="done"
            value={orderedRateInput}
            onChange={e => { setOrderedRateInput(e.target.value); setRateConfirmed(false); }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
            style={{ flex: 1, padding: "9px 10px", borderRadius: 3, border: `1px solid #d0d4d9`, background: COLORS.bg, color: COLORS.navy, fontSize: 16, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
          />
          <button
            onClick={() => {
              const val = parseFloat(orderedRateInput);
              if (!isNaN(val) && val > 0) { setOrderedRate(val); setRateConfirmed(true); }
            }}
            style={{ padding: "9px 14px", borderRadius: 3, border: `1px solid ${rateConfirmed ? COLORS.success : COLORS.navy}`, background: rateConfirmed ? COLORS.success : COLORS.navy, color: "#fff", fontSize: 13, fontFamily: "-apple-system, sans-serif", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {rateConfirmed ? "✓ Confirmed" : "Confirm"}
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textMuted }}>
          Suggested: {roundedSuggestion} mL/hr · Calculated: {adjustedHourly.toFixed(1)} mL/hr
          {parseFloat(orderedRateInput) !== roundedSuggestion && !isNaN(parseFloat(orderedRateInput)) && (
            <span style={{ color: COLORS.warning }}> · ⚠ Modified from suggestion</span>
          )}
        </div>
      </div>

      {/* Rounding info modal */}
      {showRoundingInfo && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,35,50,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={() => setShowRoundingInfo(false)}>
          <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: COLORS.bg, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: "20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 4 }}>IV Fluid Orders · Rounding Conventions</div>
                <div style={{ color: COLORS.navy, fontSize: 16, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>Suggested Rate Basis</div>
              </div>
              <button onClick={() => setShowRoundingInfo(false)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
            </div>
            {[
              { range: "< 5 kg", convention: "Tenths precision (e.g. 5.2 mL/hr)", rationale: "NICU precision — small volumes, high relative error" },
              { range: "5 – 25 kg", convention: "Nearest integer (e.g. 21 mL/hr)", rationale: "Infant/toddler — pump resolution, clinical convention" },
              { range: "25 – 85 kg", convention: "Nearest 5 mL/hr (e.g. 65 mL/hr)", rationale: "School-age/adolescent — practical order entry" },
              { range: "> 85 kg", convention: "125 mL/hr (adult cap)", rationale: "Adult maintenance ceiling per convention" },
            ].map((row, i) => (
              <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < 3 ? `1px solid ${COLORS.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <div style={{ color: COLORS.navy, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{row.range}</div>
                  <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>{row.convention}</div>
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif" }}>{row.rationale}</div>
              </div>
            ))}
            <div style={{ marginTop: 4, color: COLORS.textMuted, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>Ordered rate is an active clinical decision — confirm or adjust before use.</div>
          </div>
        </div>
      )}

      {/* Delivered vs Requirements — resequenced */}
      <div style={{ marginTop: 10, padding: "14px 16px", borderRadius: 3, background: COLORS.surface, border: `1px solid ${rateConfirmed ? COLORS.success : COLORS.border}` }}>
        {!rateConfirmed && <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: 8, fontStyle: "italic" }}>Confirm ordered rate to calculate delivered values</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
          <div style={{ ...labelStyle, fontSize: 10 }}></div>
          <div style={{ ...labelStyle, fontSize: 10, textAlign: "right" }}>REQUIRED</div>
          <div style={{ ...labelStyle, fontSize: 10, textAlign: "right" }}>DELIVERED</div>
        </div>
        <div style={rowStyle}>
          <div style={labelStyle}>Rate (mL/hr)</div>
          <div style={reqStyle}>{adjustedHourly.toFixed(1)}</div>
          <div style={delivStyle(null)}>{rateConfirmed ? (confirmedRate?.toFixed(1) ?? "—") : "—"}</div>
        </div>
        <div style={rowStyle}>
          <div style={labelStyle}>GIR (mg/kg/min)</div>
          <div style={reqStyle}>3–6</div>
          <div style={delivStyle(rateConfirmed ? girOk : null)}>{rateConfirmed ? (girDelivered ?? "—") : "—"}</div>
        </div>
        <div style={rowStyle}>
          <div style={labelStyle}>Fluid (mL/day)</div>
          <div style={reqStyle}>{adjustedDaily.toFixed(0)}</div>
          <div style={delivStyle(null)}>{rateConfirmed ? (confirmedDaily?.toFixed(0) ?? "—") : "—"}</div>
        </div>
        <div style={rowStyle}>
          <div style={labelStyle}>Sodium (mEq/day)</div>
          <div style={reqStyle}>{naReqLow}–{naReqHigh}</div>
          <div style={delivStyle(rateConfirmed ? (parseFloat(naDelivered) >= parseFloat(naReqLow) && parseFloat(naDelivered) <= parseFloat(naReqHigh)) : null)}>{rateConfirmed ? naDelivered : "—"}</div>
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div style={labelStyle}>Potassium (mEq/day)</div>
          <div style={reqStyle}>{kReqLow}–{kReqHigh}</div>
          <div style={delivStyle(rateConfirmed ? (parseFloat(kDelivered) >= parseFloat(kReqLow) && parseFloat(kDelivered) <= parseFloat(kReqHigh)) : null)}>{rateConfirmed ? kDelivered : "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textMuted, lineHeight: 1.5 }}>
        Holliday-Segar 1957 · AAP 2018 isotonic recommendation · KCl {kcl} mEq/L
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOSE ENGINE — pure JS, no React dependencies
// ═══════════════════════════════════════════════════════════════════════════════

const FREQ_DOSES = {
  "Daily": 1, "Once": 1,
  "BID": 2, "q12h": 2,
  "TID": 3, "q8h": 3,
  "q6h": 4, "q4-6h": 4,
  "q5h": 5,
  "q4h": 6, "q3-4h PRN": 4,
};

function freqToDoses(str) {
  if (!str) return null;
  for (const [k, v] of Object.entries(FREQ_DOSES)) {
    if (str.includes(k)) return v;
  }
  return null;
}

// Returns sorted array of achievable mg doses for a tablet formulation
function buildTabSteps(strength, divisibility) {
  let steps;
  if (divisibility === "quarter") {
    steps = [
      strength * 0.25,
      strength * 0.50,
      strength * 0.75,
      strength * 1.00,
      strength * 1.25,
      strength * 1.50,
      strength * 1.75,
      strength * 2.00,
    ];
  } else if (divisibility === "half") {
    steps = [
      strength * 0.5,
      strength * 1.0,
      strength * 1.5,
      strength * 2.0,
    ];
  } else {
    // "whole"
    steps = [strength, strength * 2];
  }
  return steps.sort((a, b) => a - b);
}

// Returns { thresholdKg, tabFracAtMax } for advisory display
function backCalcThreshold(maxDayMg, hiDosePerKg, dosesPerDay, tabStrength, divisibility) {
  if (!maxDayMg || !hiDosePerKg || !dosesPerDay) return null;
  if (tabStrength == null) {
    // Suspension
    const thresholdKg = maxDayMg / (hiDosePerKg * dosesPerDay);
    return { thresholdKg, tabFracAtMax: null };
  }
  // Tablet
  const maxPerDose = maxDayMg / dosesPerDay;
  const steps = buildTabSteps(tabStrength, divisibility);
  const validSteps = steps.filter(mg => mg <= maxPerDose * 1.01);
  if (!validSteps.length) return null;
  const largestStep = validSteps[validSteps.length - 1];
  const thresholdKg = (largestStep * dosesPerDay) / (hiDosePerKg * dosesPerDay);
  // tabFrac label
  const frac = largestStep / tabStrength;
  const fracMap = {
    0.25: "¼ tab", 0.5: "½ tab", 0.75: "¾ tab", 1: "1 tab",
    1.25: "1¼ tabs", 1.5: "1½ tabs", 1.75: "1¾ tabs", 2: "2 tabs",
  };
  const tabFracAtMax = fracMap[Math.round(frac * 4) / 4] || `${Math.round(frac * 4) / 4} tabs`;
  return { thresholdKg, tabFracAtMax };
}

// Returns { perDoseMg, vol, dailyMg, syringeLabel, inBracket }
// Spec: dose[] is already mg/kg/DOSE — multiply directly by weight, no /dosesPerDay
function selectSuspDose(w, loDosePerKg, hiDosePerKg, dosesPerDay, maxDayMg, strengthPer5) {
  const loDose  = loDosePerKg * w;
  const hiDose  = Math.min(hiDosePerKg * w, maxDayMg ? maxDayMg / dosesPerDay : Infinity);
  const midDose = (loDose + hiDose) / 2;
  const exactVol = (midDose / strengthPer5) * 5;
  const snapIncr = exactVol <= 3.0 ? 0.1 : 0.5;
  const snappedUl = Math.round(Math.round(exactVol * 1000) / Math.round(snapIncr * 1000)) * Math.round(snapIncr * 1000);
  const vol = snappedUl / 1000;
  const perDoseMg = (vol / 5) * strengthPer5;
  const dailyMg = perDoseMg * dosesPerDay;
  const inBracket = perDoseMg >= loDose * 0.999 && perDoseMg <= hiDose * 1.001;
  let syringeLabel;
  if      (vol <= 1.0) syringeLabel = "1 mL oral syringe";
  else if (vol <= 3.0) syringeLabel = "3 mL oral syringe";
  else if (vol <= 5.0) syringeLabel = "5 mL oral syringe";
  else                 syringeLabel = "10 mL oral syringe";
  return { perDoseMg, vol, dailyMg, syringeLabel, inBracket };
}

// Returns { perDoseMg, dailyMg, tabFrac, capped } or null
// Spec: dose[] is already mg/kg/DOSE — multiply directly by weight, no /dosesPerDay
function selectTabDose(w, loDosePerKg, hiDosePerKg, dosesPerDay, maxDayMg, tabStrength, divisibility, override) {
  const weightHiPerDose = hiDosePerKg * w;
  const absCapPerDose   = maxDayMg ? maxDayMg / dosesPerDay : Infinity;
  const hiCap = Math.min(weightHiPerDose, absCapPerDose);
  const atAdultMax = !override && isFinite(absCapPerDose) && weightHiPerDose > absCapPerDose;
  const steps = buildTabSteps(tabStrength, divisibility);

  const fracMap = {
    0.25: "¼ tab", 0.5: "½ tab", 0.75: "¾ tab", 1: "1 tab",
    1.25: "1¼ tabs", 1.5: "1½ tabs", 1.75: "1¾ tabs", 2: "2 tabs",
  };
  const toFracLabel = (mg) => {
    const frac = mg / tabStrength;
    return fracMap[Math.round(frac * 4) / 4] || `${(Math.round(frac * 4) / 4)} tabs`;
  };

  if (atAdultMax) {
    // Largest step at or below hiCap (bypass normal ±20% tolerance)
    let best = null;
    for (const mg of steps) {
      if (mg <= hiCap * 1.01 && (best === null || mg > best)) best = mg;
    }
    if (best === null) return null;
    return { perDoseMg: best, dailyMg: best * dosesPerDay, tabFrac: toFracLabel(best), capped: true };
  }

  // Normal: nearest to midDose within ±20%, not exceeding hiCap
  const midDose = ((loDosePerKg + hiDosePerKg) / 2) * w;
  let bestMg = null, bestDiff = Infinity;
  for (const mg of steps) {
    if (mg > hiCap * 1.01) continue;
    const diff = Math.abs(mg - midDose);
    if (diff / midDose <= 0.20 && diff < bestDiff) { bestDiff = diff; bestMg = mg; }
  }
  if (bestMg === null) return null;
  return { perDoseMg: bestMg, dailyMg: bestMg * dosesPerDay, tabFrac: toFracLabel(bestMg), capped: false };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: DOSE / WEIGHT CONVERSIONS
// ═══════════════════════════════════════════════════════════════════════════════
function DoseCalc() {
  const [weight, setWeight] = useState(20);
  const [drug, setDrug] = useState("acetaminophen");
  const [fmtIdx, setFmtIdx] = useState(0);
  const DRUGS = {
    acetaminophen: { name:"acetaminophen (Tylenol)", indication:"Fever, pain", formulations:["32 mg/mL liq", "325 mg tab", "500 mg tab", "80 mg chew tab", "120 mg supp", "10 mg/mL IV"], dose:[10, 15], unit:"mg/kg/dose", max:"1000 mg/dose", maxMg:1000, freq:"q4-6h", route:"PO/IV/PR", dosesPerDay:4,
    formulationDefs:[
      { route:"susp", strengthPer5:160, maxDayMg:4000 },
      { route:"tab",  tabStrength:325,  maxDayMg:4000, divisibility:"half" },
      { route:"tab",  tabStrength:500,  maxDayMg:4000, divisibility:"half" },
      { route:"tab",  tabStrength:80,   maxDayMg:4000, divisibility:"whole" }, // chew tab
      { route:"supp" },   // 120 mg supp
      { route:"inj"  },   // 10 mg/mL IV
    ],
    brackets:[
      { range:"< 5 kg",   dose:"~10–12.5 mg/kg",  note:"Weight-based only; avoid in neonates without guidance" },
      { range:"5–10 kg",  dose:"80–120 mg" },
      { range:"10–20 kg", dose:"120–240 mg" },
      { range:"20–30 kg", dose:"240–325 mg" },
      { range:"30–52 kg", dose:"325–500 mg" },
      { range:"> 52 kg",  dose:"650 mg q4h  or  1000 mg q6h", note:"Adult caps; do not exceed 4000 mg/day" },
    ],
    pearl:"Preferred schedule: 15 mg/kg q6h (max 75 mg/kg/day = 4 doses). If q4h interval needed, reduce to 12.5 mg/kg/dose. Post-op: alternate with ibuprofen q6h staggered 3 hours — provides effective q3h analgesia without exceeding daily limits of either drug.",
    },
    adapalene: { name:"adapalene (Differin)", indication:"Acne vulgaris (teens)", formulations:["0.1% top gel 0.3% top gel 0.1% top"] },
    albuterol: { name:"albuterol (ProAir, Ventolin)", indication:"Asthma, bronchospasm", formulations:["90 mcg/actuation MDI", "0.63 mg/mL neb liq", "1.25 mg/mL neb liq", "2.5 mg/mL neb liq", "0.4 mg/mL syrup"] },
    amoxicillin: { name:"amoxicillin (Amoxil)", defaultFmt:2, indication:"AOM, pharyngitis, sinusitis, pneumonia", formulations:["25 mg/mL liq", "50 mg/mL liq", "80 mg/mL liq", "125 mg chew tab", "250 mg chew tab", "500 mg cap", "875 mg tab", "1000 mg tab"], dose:[12.5, 45], unit:"mg/kg/dose", max:"1000 mg/dose", maxMg:1000, freq:"BID", route:"PO", dosesPerDay:2, formulationDefs:[
      { route:"susp", strengthPer5:125, maxDayMg:3000 },
      { route:"susp", strengthPer5:250, maxDayMg:3000 },
      { route:"susp", strengthPer5:400, maxDayMg:3000 },
      { route:"tab",  tabStrength:125,  maxDayMg:3000, divisibility:"whole" }, // 125 mg chew tab
      { route:"tab",  tabStrength:250,  maxDayMg:3000, divisibility:"whole" }, // 250 mg chew tab
      { route:"tab",  tabStrength:500,  maxDayMg:3000, divisibility:"whole" }, // 500 mg cap
      { route:"tab",  tabStrength:875,  maxDayMg:3000, divisibility:"half" },
      { route:"tab",  tabStrength:1000, maxDayMg:3000, divisibility:"half" },
    ] },
    amoxicillin_clavulanate: { name:"amoxicillin-clavulanate (Augmentin)", defaultFmt:2, indication:"AOM, sinusitis, skin/bite infections", formulations:["40 mg/mL liq (amox component)", "80 mg/mL liq (amox component)", "120 mg/mL liq (amox component)", "500 mg tab", "875 mg tab"], dose:[12.5, 45], unit:"mg/kg/dose", max:"1000 mg/dose", maxMg:1000, freq:"BID", route:"PO", dosesPerDay:2, formulationDefs:[
      { route:"susp", strengthPer5:200, maxDayMg:1760 },
      { route:"susp", strengthPer5:400, maxDayMg:3600 },
      { route:"susp", strengthPer5:600, maxDayMg:3600 },
      { route:"tab",  tabStrength:500,  maxDayMg:1760, divisibility:"quarter" },
      { route:"tab",  tabStrength:875,  maxDayMg:1760, divisibility:"quarter" },
    ] },
    aripiprazole: { name:"ARIPiprazole (Abilify)", indication:"Autism-related irritability, bipolar disorder, schizophrenia", formulations:["1 mg/mL liq", "2 mg tab", "5 mg tab", "10 mg tab", "15 mg tab", "10 mg ODT"] },
    atomoxetine: { name:"atomoxetine (Strattera)", indication:"ADHD (non-stimulant)", formulations:["10 mg cap", "18 mg cap", "25 mg cap", "40 mg cap", "60 mg cap", "80 mg cap", "100 mg cap"] },
    atropine: { name:"atropine (AtroPen)", indication:"Bradycardia, organophosphate poisoning", formulations:["0.05 mg/mL IV", "0.1 mg/mL IV", "0.4 mg/mL IV", "1 mg/mL IV"], dose:[0.02, 0.02], unit:"mg/kg/dose", max:"1 mg/dose", maxMg:1, freq:"PRN q5min", route:"IV/IO", dosesPerDay:null, formulationDefs:[
      { route:"inj" },
      { route:"inj" },
      { route:"inj" },
      { route:"inj" },
    ] },
    azathioprine: { name:"azathioprine (Imuran)", indication:"IBD, transplant immunosuppression", formulations:["50 mg tab", "5 mg/mL IV"] },
    azithromycin: { name:"azithromycin (Zithromax)", indication:"AOM, pharyngitis, community-acquired pneumonia, pertussis", formulations:["20 mg/mL liq", "40 mg/mL liq", "250 mg tab", "500 mg tab", "1% ophthalmic liq"], dose:[5, 10],  unit:"mg/kg/dose", max:"1000 mg/dose", maxMg:1000, freq:"Daily", route:"PO/IV", dosesPerDay:1, formulationDefs:[
      { route:"susp", strengthPer5:100, maxDayMg:500 },
      { route:"susp", strengthPer5:200, maxDayMg:500 },
      { route:"tab",  tabStrength:250,  maxDayMg:500, divisibility:"half" },
      { route:"tab",  tabStrength:500,  maxDayMg:500, divisibility:"whole" },
      { route:"other" }, // 1% ophthalmic
    ] },
    budesonide: { name:"budesonide (Pulmicort, Rhinocort)", indication:"Asthma (ICS controller), allergic rhinitis (nasal)", formulations:["0.125 mg/mL neb liq", "0.25 mg/mL neb liq", "0.5 mg/mL neb liq", "90 mcg/actuation inhaler", "180 mcg/actuation inhaler", "32 mcg/spray nasal spray"] },
    cefazolin: { name:"ceFAZolin (Ancef)", indication:"Surgical prophylaxis, skin/soft tissue infections", formulations:["20 mg/mL IV", "500 mg IM/IV vial", "1 g IM/IV vial"] },
    cefdinir: { name:"cefdinir (Omnicef)", indication:"AOM, sinusitis, pharyngitis, skin infections", formulations:["25 mg/mL liq", "50 mg/mL liq", "300 mg cap"] },
    ceftriaxone: { name:"ceftriaxone (Rocephin)", indication:"Bacterial infections, sepsis, meningitis", formulations:["250 mg/mL IV/IM", "500 mg/mL IV/IM", "1 g/mL IV/IM", "2 g/mL IV/IM"], dose:[50, 100], unit:"mg/kg/dose", max:"2000 mg/dose", maxMg:2000, freq:"Daily-BID", route:"IV/IM", dosesPerDay:null, formulationDefs:[
      { route:"inj" },
      { route:"inj" },
      { route:"inj" },
      { route:"inj" },
    ] },
    cefuroxime: { name:"cefuroxime (Ceftin)", indication:"AOM, sinusitis, Lyme disease, skin infections", formulations:["25 mg/mL liq", "250 mg tab", "500 mg tab"] },
    cephalexin: { name:"cephalexin (Keflex)", indication:"Skin/soft tissue infections, UTI", formulations:["25 mg/mL liq", "50 mg/mL liq", "250 mg cap", "500 mg cap", "500 mg tab"] },
    cetirizine: { name:"cetirizine (Zyrtec)", indication:"Allergic rhinitis, urticaria", formulations:["1 mg/mL liq", "5 mg chew tab", "10 mg tab"] },
    ciprofloxacin_dexamethasone: { name:"ciprofloxacin-dexamethasone (otic) (Ciprodex)", indication:"Acute otitis externa, otitis media with tubes", formulations:["0.3%/0.1% otic liq"] },
    clindamycin: { name:"clindamycin (Cleocin)", indication:"MRSA skin/soft tissue, dental infections, PCP prophylaxis", formulations:["15 mg/mL liq", "75 mg cap", "150 mg cap", "300 mg cap", "150 mg/mL IV 1% top liq/gel"] },
    clonazepam: { name:"cloNAZepam (Klonopin)", indication:"Seizures, anxiety disorders", formulations:["0.5 mg tab", "1 mg tab", "2 mg tab", "0.125 mg ODT", "0.25 mg ODT"] },
    clonidine: { name:"cloNIDine (Kapvay, Catapres)", indication:"ADHD (adjunct), hypertension, tic disorders, sleep", formulations:["0.1 mg tab", "0.2 mg tab", "0.1 mg/24 hr patch", "0.1 mg ER tab", "0.2 mg ER tab"] },
    clotrimazole: { name:"clotrimazole (Lotrimin)", indication:"Tinea, candidiasis", formulations:["1% top liq 1% top", "10 mg lozenge"] },
    combined_oral_contraceptives: { name:"combined oral contraceptives (Various)", indication:"Contraception, dysmenorrhea, acne, PCOS (teens)", formulations:["EE 20–35 mcg / progestin tab 21- or 28-day packs"] },
    desmopressin: { name:"desmopressin (DDAVP)", indication:"Nocturnal enuresis, diabetes insipidus, von Willebrand disease", formulations:["100 mcg/mL nasal spray", "0.1 mg tab", "0.2 mg tab", "4 mcg/mL IV/SC"] },
    dexamethasone: { name:"dexAMETHasone (Decadron)", indication:"Croup, asthma exacerbation, inflammatory/immune conditions", formulations:["4 mg/mL liq (oral)", "0.5 mg tab", "4 mg tab", "4 mg/mL IV/IM", "10 mg/mL IV/IM"], dose:[0.6, 0.6], unit:"mg/kg/dose", max:"10 mg/dose", maxMg:10, freq:"Once", route:"PO/IV/IM", dosesPerDay:1,
    formulationDefs:[
      { route:"susp", strengthPer5:20, maxDayMg:10 },
      { route:"tab",  tabStrength:0.5, maxDayMg:10, divisibility:"half" },
      { route:"tab",  tabStrength:4,   maxDayMg:10, divisibility:"quarter" },
      { route:"inj" }, // 4 mg/mL IV/IM
      { route:"inj" }, // 10 mg/mL IV/IM
    ],
    brackets:[
      { range:"< 5 kg",   dose:"~3 mg",   note:"Weight-based; single dose only" },
      { range:"5–10 kg",  dose:"3–6 mg",  note:"4 mg/mL oral liquid; 0.75–1.5 mL" },
      { range:"10–17 kg", dose:"6–10 mg", note:"Use 4 mg tab (score to ½ or ¼ as needed)" },
      { range:"> 17 kg",  dose:"10 mg",   note:"Adult cap applies; single dose" },
    ],
    pearl:"For croup: oral dexamethasone (0.6 mg/kg, single dose) is as effective as IM and preferred when tolerated. Use the 4 mg/mL IV solution given orally — widely available and palatable with juice. A single dose is sufficient for mild-moderate croup; repeat dosing is not standard.",
    },
    dexmethylphenidate: { name:"dexmethylphenidate (Focalin)", indication:"ADHD", formulations:["2.5 mg tab", "5 mg tab", "10 mg tab", "5 mg ER cap", "10 mg ER cap", "20 mg ER cap"] },
    diphenhydramine: { name:"diphenhydrAMINE (Benadryl)", indication:"Allergic reactions, urticaria, nausea, dystonia", formulations:["2.5 mg/mL liq", "25 mg tab", "50 mg tab", "50 mg/mL IV/IM"] },
    doxycycline: { name:"doxycycline (Vibramycin, Doryx)", indication:"Community-acquired pneumonia, Lyme disease, acne (≥8 yrs)", formulations:["5 mg/mL liq", "50 mg tab", "100 mg tab", "50 mg cap", "100 mg cap", "100 mg IV"] },
    epinephrine__racemic: { name:"EPINEPHrine, racemic (S2)", indication:"Croup (emergency)", formulations:["22.5 mg/mL neb liq (2.25%)"] },
    epinephrine_cardiac: { name:"epinephrine - cardiac (Adrenalin)", indication:"Cardiac arrest, pulseless arrest", formulations:["0.1 mg/mL (1:10,000) IV", "1 mg/mL (1:1,000) IM"], dose:[0.01, 0.01], unit:"mg/kg/dose", max:"1 mg/dose", maxMg:1, freq:"q3-5 min", route:"IV/IO", dosesPerDay:null, formulationDefs:[
      { route:"inj" },
      { route:"inj" },
    ] },
    ergocalciferol___cholecalciferol: { name:"ergocalciferol / cholecalciferol (Drisdol / various)", indication:"Vitamin D deficiency, rickets", formulations:["400 IU/mL oral drops 1,000 IU cap 50,000 IU cap (ergocalciferol Rx)"] },
    erythromycin: { name:"erythromycin (ophthalmic) (Ilotycin)", indication:"Neonatal conjunctivitis prophylaxis", formulations:["5 mg/g ophthalmic top (0.5%)"] },
    escitalopram: { name:"escitalopram (Lexapro)", indication:"Depression, anxiety disorders (teens)", formulations:["1 mg/mL liq", "5 mg tab", "10 mg tab", "20 mg tab"] },
    famotidine: { name:"famotidine (Pepcid)", indication:"GERD, peptic ulcer disease", formulations:["8 mg/mL liq", "20 mg tab", "40 mg tab", "10 mg/mL IV"] },
    ferrous_sulfate: { name:"ferrous sulfate (Fer-In-Sol)", indication:"Iron deficiency anemia", formulations:["15 mg/mL drops (elemental Fe)", "8.8 mg/mL liq (elemental Fe)", "325 mg tab (65 mg elemental Fe)"] },
    fexofenadine: { name:"fexofenadine (Allegra)", indication:"Allergic rhinitis, urticaria", formulations:["6 mg/mL liq", "30 mg tab", "60 mg tab", "180 mg tab"] },
    fluconazole: { name:"fluconazole (Diflucan)", indication:"Candidiasis (oral, esophageal, systemic), tinea", formulations:["10 mg/mL liq", "40 mg/mL liq", "50 mg tab", "100 mg tab", "150 mg tab", "2 mg/mL IV"] },
    fludrocortisone: { name:"fludrocortisone (Florinef)", indication:"Congenital adrenal hyperplasia, adrenal insufficiency", formulations:["0.1 mg tab"] },
    fluoxetine: { name:"fluoxetine (Prozac)", indication:"Depression, OCD, anxiety disorders", formulations:["4 mg/mL liq", "10 mg tab", "20 mg cap", "40 mg cap"] },
    fluticasone: { name:"fluticasone (nasal) (Flonase)", indication:"Allergic rhinitis", formulations:["50 mcg/spray nasal spray"] },
    fluticasone_propionate: { name:"fluticasone propionate (inhaled) (Flovent)", indication:"Asthma (ICS controller)", formulations:["44 mcg/actuation MDI", "110 mcg/actuation MDI", "220 mcg/actuation MDI", "50 mcg/actuation DPI", "100 mcg/actuation DPI", "250 mcg/actuation DPI"] },
    fluticasone_salmeterol: { name:"fluticasone-salmeterol (Advair)", indication:"Asthma ≥4 yrs, persistent/moderate-severe", formulations:["100/50 mcg DPI 250/50 mcg DPI 45/21 mcg MDI 115/21 mcg MDI"] },
    fluvoxamine: { name:"fluvoxamine (Luvox)", indication:"OCD, anxiety disorders", formulations:["25 mg tab", "50 mg tab", "100 mg tab", "100 mg ER cap", "150 mg ER cap"] },
    folic_acid: { name:"folic acid (Various)", indication:"Folate deficiency, neural tube defect prevention (teens)", formulations:["1 mg tab", "5 mg tab", "5 mg/mL liq"] },
    griseofulvin: { name:"griseofulvin (Grifulvin V)", indication:"Tinea capitis, tinea unguium", formulations:["25 mg/mL liq", "250 mg tab (microsize)", "500 mg tab (microsize)", "125 mg tab (ultramicrosize)", "250 mg tab (ultramicrosize)"] },
    growth_hormone: { name:"growth hormone (somatropin) (Norditropin, Genotropin)", indication:"Growth hormone deficiency, Turner syndrome, SGA, Prader-Willi", formulations:["3.3 mg/mL SC pen", "6.7 mg/mL SC pen", "10 mg/mL SC pen", "5 mg SC cartridge", "12 mg SC cartridge"] },
    guanfacine: { name:"guanFACINE (Intuniv, Tenex)", indication:"ADHD (adjunct/monotherapy), Tourette syndrome", formulations:["1 mg tab", "2 mg tab", "1 mg ER tab", "2 mg ER tab", "3 mg ER tab", "4 mg ER tab"] },
    hydrocodone: { name:"hydrocodone (Vicodin, combo)", indication:"Moderate-severe pain (limited/declining pediatric use)", formulations:["5/325 mg tab (w/ APAP) 7.5/325 mg tab (w/ APAP)", "1 mg/mL liq (combo)"] },
    hydrocortisone: { name:"hydrocortisone (topical) (Hytone, various)", indication:"Eczema, contact dermatitis, inflammatory dermatoses", formulations:["0.5% top 1% top 2.5% top"] },
    hydroxyzine: { name:"hydrOXYzine (Vistaril, Atarax)", indication:"Anxiety, pruritus, procedural sedation", formulations:["2 mg/mL liq", "25 mg cap", "50 mg cap", "25 mg/mL IM", "50 mg/mL IM"] },
    ibuprofen: { name:"ibuprofen (Motrin, Advil)", indication:"Fever, pain, inflammation, juvenile arthritis", formulations:["40 mg/mL infant drops", "20 mg/mL liq", "200 mg tab", "400 mg tab", "600 mg tab", "800 mg tab", "4 mg/mL IV"], dose:[5, 10],  unit:"mg/kg/dose", max:"800 mg/dose",  maxMg:800,  freq:"q6-8h", route:"PO (>=6mo)", dosesPerDay:4,
    formulationDefs:[
      { route:"other" }, // 40 mg/mL infant drops — weight/age restricted
      { route:"susp", strengthPer5:100, maxDayMg:2400 },
      { route:"tab",  tabStrength:200,  maxDayMg:2400, divisibility:"half" },
      { route:"tab",  tabStrength:400,  maxDayMg:2400, divisibility:"half" },
      { route:"tab",  tabStrength:600,  maxDayMg:2400, divisibility:"whole" },
      { route:"tab",  tabStrength:800,  maxDayMg:2400, divisibility:"whole" },
      { route:"inj"  }, // 4 mg/mL IV
    ],
    brackets:[
      { range:"6–10 kg",  dose:"100 mg",  note:"Infant drops (40 mg/mL) for < 6 months only with provider guidance" },
      { range:"10–20 kg", dose:"100–200 mg" },
      { range:"20–30 kg", dose:"200–300 mg" },
      { range:"30–40 kg", dose:"300–400 mg" },
      { range:"≥ 40 kg",  dose:"400–600 mg", note:"Max 600 mg/dose q6h; 800 mg reserved for adult musculoskeletal q8h" },
    ],
    pearl:"Standard pediatric dose is 10 mg/kg q6h (max 600 mg/dose, 40 mg/kg/day). The 5 mg/kg lower end is rarely used clinically. Avoid in infants < 6 months and in dehydrated children due to renal risk. Post-op: alternate with acetaminophen q6h staggered 3 hours for continuous q3h coverage.",
    },
    insulin_aspart: { name:"insulin aspart (NovoLog)", indication:"Type 1 diabetes (rapid-acting)", formulations:["100 units/mL SC vial", "100 units/mL SC pen"] },
    insulin_glargine: { name:"insulin glargine (Lantus, Basaglar)", indication:"Type 1 & 2 diabetes (basal)", formulations:["100 units/mL SC vial", "100 units/mL SC pen", "300 units/mL SC pen (Toujeo)"] },
    insulin_lispro: { name:"insulin lispro (Humalog)", indication:"Type 1 diabetes (rapid-acting)", formulations:["100 units/mL SC vial", "100 units/mL SC pen", "200 units/mL SC pen"] },
    ipratropium: { name:"ipratropium (Atrovent)", indication:"Asthma/bronchospasm exacerbations, allergic rhinitis", formulations:["0.2 mg/mL neb liq", "17 mcg/actuation MDI 0.03% nasal spray 0.06% nasal spray"] },
    lamotrigine: { name:"lamotrigine (Lamictal)", indication:"Epilepsy, bipolar disorder", formulations:["25 mg tab", "100 mg tab", "150 mg tab", "200 mg tab", "2 mg chew tab", "5 mg chew tab", "25 mg ODT", "50 mg ER tab", "100 mg ER tab"] },
    lansoprazole: { name:"lansoprazole (Prevacid)", indication:"GERD, peptic ulcer disease, H. pylori", formulations:["3 mg/mL liq (compounded)", "15 mg sprinkle cap", "30 mg cap", "15 mg ODT", "30 mg ODT", "30 mg IV"] },
    levalbuterol: { name:"levalbuterol (Xopenex)", indication:"Asthma, bronchospasm", formulations:["0.1 mg/mL neb liq", "0.21 mg/mL neb liq", "0.42 mg/mL neb liq", "45 mcg/actuation MDI"] },
    levetiracetam: { name:"levETIRAcetam (Keppra)", indication:"Focal & generalized epilepsy, status epilepticus", formulations:["100 mg/mL liq", "250 mg tab", "500 mg tab", "750 mg tab 1,000 mg tab", "500 mg ER tab", "100 mg/mL IV"] },
    levonorgestrel: { name:"levonorgestrel (IUD/implant) (Mirena, Nexplanon)", indication:"Contraception (teens)", formulations:["52 mg IUD (~20 mcg/day release)", "68 mg subdermal implant"] },
    levothyroxine: { name:"levothyroxine (Synthroid, Levoxyl)", indication:"Hypothyroidism (including congenital)", formulations:["25 mcg tab", "50 mcg tab", "75 mcg tab", "100 mcg tab", "125 mcg tab", "13 mcg/mL oral liq", "100 mcg/mL IV"] },
    lisdexamfetamine: { name:"lisdexamfetamine (Vyvanse)", indication:"ADHD, binge eating disorder (teens)", formulations:["10 mg cap", "20 mg cap", "30 mg cap", "40 mg cap", "50 mg cap", "60 mg cap", "70 mg cap", "10 mg chew tab", "20 mg chew tab", "30 mg chew tab"] },
    lorazepam: { name:"LORazepam (Ativan)", indication:"Seizures (acute/status), procedural anxiety", formulations:["2 mg/mL liq", "0.5 mg tab", "1 mg tab", "2 mg tab", "2 mg/mL IV/IM", "4 mg/mL IV/IM"] },
    medroxyprogesterone: { name:"medroxyprogesterone (Depo-Provera)", indication:"Contraception (teens)", formulations:["150 mg/mL IM", "160 mg/mL SC"] },
    metformin: { name:"metFORMIN (Glucophage)", indication:"Type 2 diabetes, PCOS (teens)", formulations:["100 mg/mL liq", "500 mg tab", "850 mg tab 1,000 mg tab", "500 mg ER tab", "750 mg ER tab"] },
    methylphenidate: { name:"methylphenidate (Ritalin, Concerta)", indication:"ADHD", formulations:["1 mg/mL liq", "5 mg tab", "10 mg tab", "20 mg tab", "18 mg ER tab", "27 mg ER tab", "36 mg ER tab", "54 mg ER tab", "10 mg/9 hr patch"] },
    methylprednisolone: { name:"methylPREDNISolone (Medrol, Solu-Medrol)", indication:"Asthma exacerbation, inflammatory/immune conditions", formulations:["2 mg tab", "4 mg tab (dose pack)", "8 mg tab", "16 mg tab", "40 mg/mL IV/IM", "62.5 mg/mL IV/IM"] },
    metoclopramide: { name:"metoclopramide (Reglan)", indication:"GERD, gastroparesis, nausea/vomiting (used cautiously)", formulations:["1 mg/mL liq", "5 mg tab", "10 mg tab", "5 mg/mL IV/IM"] },
    mometasone: { name:"mometasone (nasal) (Nasonex)", indication:"Allergic rhinitis, nasal polyps", formulations:["50 mcg/spray nasal spray"] },
    montelukast: { name:"montelukast (Singulair)", indication:"Asthma (controller), allergic rhinitis", formulations:["4 mg granules (packet)", "4 mg chew tab", "5 mg chew tab", "10 mg tab"] },
    morphine: { name:"morphine (various)", indication:"Moderate-severe pain. IV is primary pediatric route. Oral liq/tab doses shown for reference only — verify with pharmacy for oral conversions.", formulations:["2 mg/mL IV", "4 mg/mL IV", "10 mg/5 mL oral liq", "15 mg tab", "30 mg tab"], dose:[0.05, 0.1], unit:"mg/kg/dose", max:"4 mg/dose", maxMg:4, freq:"q3-4h PRN", route:"IV", dosesPerDay:4, formulationDefs:[
      { route:"inj" }, // 2 mg/mL IV
      { route:"inj" }, // 4 mg/mL IV
      { route:"susp", strengthPer5:10, maxDayMg:16 },
      { route:"tab",  tabStrength:15,  maxDayMg:16, divisibility:"whole" },
      { route:"tab",  tabStrength:30,  maxDayMg:16, divisibility:"whole" },
    ] },
    mupirocin: { name:"mupirocin (Bactroban)", indication:"Impetigo, infected skin lesions, MRSA decolonization", formulations:["2% top 2% nasal top"] },
    mycophenolate_mofetil: { name:"mycophenolate mofetil (CellCept)", indication:"Transplant immunosuppression, autoimmune nephritis", formulations:["200 mg/mL liq", "250 mg cap", "500 mg tab", "500 mg IV"] },
    neomycin_polymyxin_hydrocortisone: { name:"neomycin-polymyxin-hydrocortisone (otic) (Cortisporin)", indication:"Otitis externa", formulations:["3.5 mg / 10,000 units /", "10 mg per mL otic liq"] },
    norethindrone: { name:"norethindrone (Camila, Errin)", indication:"Contraception, abnormal uterine bleeding (teens)", formulations:["0.35 mg tab", "5 mg tab"] },
    nystatin: { name:"nystatin (topical) (Mycostatin)", indication:"Cutaneous candidiasis, diaper dermatitis", formulations:["100,000 units/g top 100,000 units/g powder"] },
    ofloxacin: { name:"ofloxacin (otic) (Floxin Otic)", indication:"Otitis externa, otitis media with perforation/tubes", formulations:["3 mg/mL otic liq (0.3%)"] },
    omeprazole: { name:"omeprazole (Prilosec)", indication:"GERD, peptic ulcer disease (often off-label in infants)", formulations:["2 mg/mL liq (compounded)", "10 mg cap", "20 mg cap", "40 mg cap", "20 mg tab"] },
    ondansetron: { name:"ondansetron (Zofran)", indication:"Nausea/vomiting (acute gastroenteritis, chemo, post-op)", formulations:["0.8 mg/mL liq", "4 mg tab", "8 mg tab", "4 mg ODT", "8 mg ODT", "2 mg/mL IV"], dose:[0.15, 0.15], unit:"mg/kg/dose", max:"4 mg/dose", maxMg:4, freq:"q8h PRN", route:"PO/IV", dosesPerDay:3,
    formulationDefs:[
      { route:"susp", strengthPer5:4,  maxDayMg:12 },
      { route:"tab",  tabStrength:4,   maxDayMg:12, divisibility:"half" },
      { route:"tab",  tabStrength:8,   maxDayMg:12, divisibility:"whole" },
      { route:"tab",  tabStrength:4,   maxDayMg:12, divisibility:"whole" }, // 4 mg ODT
      { route:"tab",  tabStrength:8,   maxDayMg:12, divisibility:"whole" }, // 8 mg ODT
      { route:"inj"  }, // 2 mg/mL IV
    ],
    brackets:[
      { range:"8–15 kg",  dose:"2 mg",  note:"Use 0.8 mg/mL liquid: 2.5 mL" },
      { range:"15–30 kg", dose:"4 mg",  note:"4 mg tab, ODT, or 5 mL liquid" },
      { range:"> 30 kg",  dose:"8 mg",  note:"8 mg tab or ODT" },
    ],
    pearl:"For acute gastroenteritis, a single dose is often sufficient — routine scheduled q8h dosing is rarely needed. Bracket dosing (2/4/8 mg by weight) is the standard institutional approach; 0.15 mg/kg formula is the derivation. ODT dissolves on tongue — useful in actively vomiting children.",
    },
    oxcarbazepine: { name:"OXcarbazepine (Trileptal)", indication:"Focal epilepsy, trigeminal neuralgia", formulations:["60 mg/mL liq", "150 mg tab", "300 mg tab", "600 mg tab", "150 mg ER tab", "300 mg ER tab", "600 mg ER tab"] },
    penicillin_vk: { name:"penicillin VK (Pen-Vee K)", indication:"Streptococcal pharyngitis, dental infections, rheumatic fever prophylaxis", formulations:["25 mg/mL liq", "50 mg/mL liq", "250 mg tab", "500 mg tab"] },
    permethrin: { name:"permethrin (Elimite, Nix)", indication:"Scabies (5%), head lice (1%)", formulations:["1% top liq (rinse) 5% top"] },
    phenobarbital: { name:"phenobarbital (Luminal)", indication:"Neonatal seizures, epilepsy", formulations:["4 mg/mL liq", "15 mg tab", "30 mg tab", "60 mg tab", "100 mg tab", "65 mg/mL IV/IM", "130 mg/mL IV/IM"] },
    polyethylene_glycol_3350: { name:"polyethylene glycol 3350 (MiraLax)", indication:"Constipation, fecal disimpaction", formulations:["17 g/dose powder for liq"] },
    prednisolone: { name:"prednisoLONE (oral) (Prelone, Orapred)", indication:"Asthma exacerbation, croup, nephrotic syndrome, inflammatory conditions", formulations:["1 mg/mL liq", "3 mg/mL liq", "5 mg tab"] },
    prednisolone_acetate: { name:"prednisolone acetate (ophthalmic) (Pred Forte)", indication:"Ocular inflammation, uveitis", formulations:["10 mg/mL ophthalmic liq (1%)"] },
    prednisone: { name:"predniSONE (Deltasone)", indication:"Asthma, inflammatory/immune conditions, nephrotic syndrome", formulations:["1 mg/mL liq", "1 mg tab", "5 mg tab", "10 mg tab", "20 mg tab", "50 mg tab"] },
    quetiapine: { name:"QUEtiapine (Seroquel)", indication:"Bipolar disorder, schizophrenia, insomnia (teens; off-label)", formulations:["25 mg tab", "50 mg tab", "100 mg tab", "200 mg tab", "300 mg tab", "50 mg ER tab", "150 mg ER tab", "200 mg ER tab", "300 mg ER tab"] },
    risperidone: { name:"risperiDONE (Risperdal)", indication:"Autism-related irritability, schizophrenia, bipolar disorder", formulations:["1 mg/mL liq", "0.25 mg tab", "0.5 mg tab", "1 mg tab", "2 mg tab", "3 mg tab", "4 mg tab", "0.5 mg ODT", "1 mg ODT"] },
    semaglutide: { name:"semaglutide (Wegovy)", indication:"Obesity (≥12 yrs)", formulations:["0.5 mg/mL SC pen", "1 mg/mL SC pen", "2 mg/mL SC pen", "2.27 mg/mL SC pen", "3.2 mg/mL SC pen"] },
    sertraline: { name:"sertraline (Zoloft)", indication:"Depression, OCD, anxiety disorders, PTSD", formulations:["20 mg/mL liq", "25 mg tab", "50 mg tab", "100 mg tab"] },
    tobramycin: { name:"tobramycin (ophthalmic) (Tobrex)", indication:"Bacterial conjunctivitis", formulations:["3 mg/mL ophthalmic liq (0.3%)", "3 mg/g ophthalmic top (0.3%)"] },
    topiramate: { name:"topiramate (Topamax)", indication:"Epilepsy, migraine prophylaxis", formulations:["25 mg tab", "50 mg tab", "100 mg tab", "200 mg tab", "15 mg sprinkle cap", "25 mg sprinkle cap", "50 mg ER cap", "100 mg ER cap", "200 mg ER cap"] },
    tramadol: { name:"tramadol (Ultram)", indication:"Moderate pain (declining use; contraindicated <12 yrs)", formulations:["50 mg tab", "100 mg ER tab", "200 mg ER tab"] },
    tretinoin: { name:"tretinoin (Retin-A)", indication:"Acne vulgaris (teens)", formulations:["0.025% top 0.05% top 0.1% top 0.025% top gel 0.05% top gel"] },
    triamcinolone: { name:"triamcinolone (topical) (Kenalog, Aristocort)", indication:"Eczema, inflammatory dermatoses, psoriasis", formulations:["0.025% top 0.1% top 0.5% top"] },
    trimethoprim_sulfamethoxazole: { name:"trimethoprim-sulfamethoxazole (Bactrim, Septra)", indication:"UTI, MRSA skin infections, PCP prophylaxis, sinusitis", formulations:["8/40 mg/mL liq (TMP/SMX) 80/400 mg tab (SS) 160/800 mg tab (DS)", "16 mg/mL IV (TMP component)"] },
    valproic_acid___divalproex: { name:"valPROic acid / divalproex (Depakote, Depakene)", indication:"Epilepsy, bipolar disorder, migraine prophylaxis", formulations:["50 mg/mL liq", "125 mg sprinkle cap", "250 mg cap", "125 mg ER tab", "250 mg ER tab", "500 mg ER tab", "100 mg/mL IV"] },
    zolpidem: { name:"zolpidem (Ambien)", indication:"Insomnia (adolescents; off-label)", formulations:["5 mg tab", "10 mg tab", "6.25 mg ER tab", "12.5 mg ER tab"] },
    zonisamide: { name:"zonisamide (Zonegran)", indication:"Focal & generalized epilepsy", formulations:["25 mg cap", "50 mg cap", "100 mg cap"] },
  };
  // ── Step 3: New state ────────────────────────────────────────────────────────
  const [route, setRoute]                     = useState("susp");
  const [routeManuallySet, setRouteManuallySet] = useState(false);
  const [overrideActive, setOverrideActive]   = useState(false);

  const d    = DRUGS[drug] || DRUGS.acetaminophen;
  const fmts = d.formulations || [];
  const fmtDefs = d.formulationDefs || [];
  const hasDose = !!d.dose;
  const dosesPerDay = d.dosesPerDay ?? freqToDoses(d.freq);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const selStyle = {width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.text,fontSize:14,fontFamily:"'DM Mono',monospace",outline:"none"};
  const lblStyle = {color:COLORS.navy,fontSize:12,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5};

  // Safe trailing-zero-free format (fixes the existing regex bug)
  const fmtMg = (n) => stripTrailingZeros(n) + " mg";

  const calcLow  = hasDose ? Math.min(weight * d.dose[0], d.maxMg ?? Infinity) : null;
  const calcHigh = hasDose ? Math.min(weight * d.dose[1], d.maxMg ?? Infinity) : null;
  const low  = hasDose ? fmtMg(calcLow)  : "—";
  const high = hasDose ? fmtMg(calcHigh) : "—";

  // ── Step 4: Drug/weight change handlers ─────────────────────────────────────
  const handleDrugChange = (key) => {
    setDrug(key);
    setOverrideActive(false);
    setRouteManuallySet(false);
    const def = DRUGS[key];
    // Auto-select route based on weight
    const autoRoute = weight >= 30 ? "tab" : "susp";
    setRoute(autoRoute);
    // Pick default formulation index for that route (or fallback to 0)
    const defs = def?.formulationDefs || [];
    const firstMatch = defs.findIndex(fd => fd.route === autoRoute);
    setFmtIdx(firstMatch >= 0 ? firstMatch : (def?.defaultFmt ?? 0));
  };

  const handleWeightChange = (val) => {
    setWeight(val);
    if (!routeManuallySet) {
      const autoRoute = val >= 30 ? "tab" : "susp";
      setRoute(autoRoute);
      // Reselect formulation for new route
      const firstMatch = fmtDefs.findIndex(fd => fd.route === autoRoute);
      if (firstMatch >= 0) setFmtIdx(firstMatch);
    }
  };

  const handleRouteChange = (r) => {
    setRoute(r);
    setRouteManuallySet(true);
    setOverrideActive(false);
    // Auto-select first formulation of this route
    const firstMatch = fmtDefs.findIndex(fd => fd.route === r);
    if (firstMatch >= 0) setFmtIdx(firstMatch);
  };

  // ── Step 5: Formulation picker — filter by current route ─────────────────────
  // For drugs without formulationDefs, show all; for those with, filter by route
  const hasDefs = fmtDefs.length > 0;
  const visibleFmts = fmts.map((f, i) => ({ label: f, idx: i, fmtDef: fmtDefs[i] ?? { route: "other" } }))
    .filter(item => !hasDefs || item.fmtDef.route === route || item.fmtDef.route === "other" && !hasDefs);

  // If current fmtIdx doesn't match the active route, pick first matching
  const currentFmtDef = fmtDefs[fmtIdx] ?? null;
  const fmtMatchesRoute = !hasDefs || (currentFmtDef?.route === route);

  // ── Step 6: Threshold advisory ───────────────────────────────────────────────
  let thresholdInfo = null;
  if (hasDose && hasDefs && dosesPerDay && currentFmtDef && currentFmtDef.route !== "other") {
    const fd = currentFmtDef;
    if (fd.maxDayMg) {
      if (fd.route === "susp") {
        thresholdInfo = backCalcThreshold(fd.maxDayMg, d.dose[1], dosesPerDay, null, null);
      } else if (fd.route === "tab") {
        thresholdInfo = backCalcThreshold(fd.maxDayMg, d.dose[1], dosesPerDay, fd.tabStrength, fd.divisibility);
      }
    }
  }
  const weightExceedsThreshold = thresholdInfo && weight > thresholdInfo.thresholdKg;

  // ── Step 7: Give card calculation ────────────────────────────────────────────
  let giveResult = null;
  if (hasDose && hasDefs && dosesPerDay && weight > 0 && fmtMatchesRoute && currentFmtDef) {
    const fd = currentFmtDef;
    const effectiveMaxDay = overrideActive ? null : fd.maxDayMg;
    if (fd.route === "susp" && fd.strengthPer5) {
      giveResult = selectSuspDose(weight, d.dose[0], d.dose[1], dosesPerDay, effectiveMaxDay, fd.strengthPer5);
      giveResult.type = "susp";
    } else if (fd.route === "tab" && fd.tabStrength) {
      const tr = selectTabDose(weight, d.dose[0], d.dose[1], dosesPerDay, effectiveMaxDay, fd.tabStrength, fd.divisibility, overrideActive);
      if (tr) { giveResult = { ...tr, type: "tab" }; }
    }
  }

  // Formatted freq for display
  const freqDisplay = d.freq || "—";

  return (
    <div>
      {/* Weight row with SUSP|TAB segmented control */}
      <div style={{display:"flex",gap:8,marginBottom:4,alignItems:"flex-end"}}>
        <div style={{flex:2,minWidth:0,marginBottom:10}}>
          <div style={lblStyle}>Weight <span style={{color:"#b8860b"}}>(kg)</span></div>
          <input type="number" inputMode="decimal" value={weight} min={0.5} max={200} step={0.5}
            onChange={e => handleWeightChange(parseFloat(e.target.value) || 0)}
            style={{width:"100%",padding:"8px 10px",borderRadius:6,border:`1.5px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.navy,fontSize:15,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,outline:"none",boxSizing:"border-box"}} />
        </div>
        <div style={{flex:5,minWidth:0,marginBottom:10}}>
          <div style={lblStyle}>Drug</div>
          <select value={drug} onChange={e=>handleDrugChange(e.target.value)} style={selStyle}>
            {Object.entries(DRUGS).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
      </div>

      {/* Segmented route control — dynamic, shows only routes present in this drug's formulationDefs */}
      {hasDefs && hasDose && (() => {
        const ROUTE_META = [
          { key:"susp",  label:"SUSP" },
          { key:"tab",   label:"TAB"  },
          { key:"inj",   label:"INJ"  },
          { key:"supp",  label:"SUPP" },
          { key:"other", label:"OTHER"},
        ];
        const availableRoutes = ROUTE_META.filter(rm =>
          fmtDefs.some(fd => fd.route === rm.key)
        );
        if (availableRoutes.length <= 1) return null; // no toggle needed for single-route drugs
        return (
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",gap:0,borderRadius:8,overflow:"hidden",border:`1.5px solid ${COLORS.border}`,width:"fit-content"}}>
              {availableRoutes.map((rm, i) => (
                <button key={rm.key} onClick={() => handleRouteChange(rm.key)}
                  style={{
                    padding:"7px 16px", fontSize:13, fontWeight:700, border:"none",
                    borderRight: i < availableRoutes.length - 1 ? `1px solid ${COLORS.border}` : "none",
                    background: route === rm.key ? COLORS.accent : COLORS.bg,
                    color: route === rm.key ? "#fff" : COLORS.textMuted,
                    cursor:"pointer", fontFamily:"'IBM Plex Sans',sans-serif", letterSpacing:"0.05em",
                    transition:"background 0.15s,color 0.15s",
                  }}>
                  {rm.label}
                </button>
              ))}
            </div>
            {route === "tab" && routeManuallySet && weight < 30 && (
              <div style={{marginTop:5,fontSize:11,color:COLORS.warning,fontFamily:"'IBM Plex Sans',sans-serif"}}>
                Tablet selected for weight &lt; 30 kg — confirm child can swallow tablets
              </div>
            )}
          </div>
        );
      })()}

      {/* Formulation picker */}
      <div style={{marginBottom:14}}>
        <div style={lblStyle}>Formulation</div>
        {hasDefs ? (
          <select value={fmtIdx} onChange={e => { setFmtIdx(Number(e.target.value)); setOverrideActive(false); }} style={selStyle}>
            {fmts.map((f, i) => {
              const fd = fmtDefs[i] ?? { route:"other" };
              if (fd.route !== route) return null;
              return <option key={i} value={i}>{f}</option>;
            })}
          </select>
        ) : (
          <select value={fmtIdx} onChange={e=>setFmtIdx(Number(e.target.value))} style={selStyle}>
            {fmts.map((f,i)=><option key={i} value={i}>{f}</option>)}
          </select>
        )}
      </div>

      {/* Step 6: Threshold advisory — only when weight exceeds threshold */}
      {weightExceedsThreshold && (
        <div style={{marginBottom:14,borderRadius:10,overflow:"hidden",border:`1.5px solid #90c4ff`,background:"#e5f3ff"}}>
          <div style={{padding:"9px 12px",borderBottom:`1px solid #90c4ff`,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13}}>ℹ️</span>
            <span style={{fontSize:12,fontWeight:700,color:"#004a99",fontFamily:"'IBM Plex Sans',sans-serif"}}>
              Weight Threshold Advisory
            </span>
          </div>
          <div style={{padding:"9px 12px"}}>
            <div style={{fontSize:12,color:"#004a99",fontFamily:"'IBM Plex Sans',sans-serif",lineHeight:1.5}}>
              Adult max ({currentFmtDef.maxDayMg?.toLocaleString()} mg/day
              {thresholdInfo.tabFracAtMax ? ` = ${thresholdInfo.tabFracAtMax}` : ""})
              {" applies above "}
              <strong>{Math.round(thresholdInfo.thresholdKg)} kg</strong>
            </div>
          </div>
          {/* Override toggle — shown when weight exceeds threshold */}
          <div style={{padding:"9px 12px",borderTop:`1px solid #90c4ff`,background:"#fff8e6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:12,color:"#7a5700",fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500}}>
                ⚠️ Override adult max cap
              </span>
              <button onClick={() => setOverrideActive(v => !v)}
                style={{width:44,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",
                  background: overrideActive ? COLORS.warning : "#aeaeb2",
                  transition:"background 0.2s",flexShrink:0}}>
                <span style={{position:"absolute",width:22,height:22,borderRadius:"50%",background:"white",
                  top:2,left: overrideActive ? 20 : 2,transition:"left 0.2s",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}} />
              </button>
            </div>
        </div>
      )}

      {/* Existing 6-cell output grid — unchanged */}
      <div style={{padding:"16px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`,marginBottom: giveResult ? 10 : 0}}>
        <div style={{color:COLORS.navy,fontSize:13,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",marginBottom:12}}>
          {d.indication || "—"}
        </div>
        {hasDose ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* Row 1: three columns — Dose Per kg | Low Dose | High Dose */}
            <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1.5fr",gap:6}}>
              {[
                { label:"Dose Per kg",
                  value: d.dose ? `${d.dose[0]}–${d.dose[1]} ${d.unit.replace("/dose","")}` : "—" },
                { label:"Low Dose",
                  value: low },
                { label:"High Dose",
                  value: calcHigh >= (d.maxMg ?? Infinity) * 0.99
                    ? `${high} (max)`
                    : high },
              ].map(item => (
                <div key={item.label} style={{padding:"8px 8px",borderRadius:8,background:COLORS.bg,border:`1px solid ${COLORS.border}`,minWidth:0}}>
                  <div style={{color:COLORS.textMuted,fontSize:9,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</div>
                  <div style={{color:COLORS.accent,fontSize:14,fontWeight:700,fontFamily:"'Sora',sans-serif",marginTop:2,whiteSpace:"nowrap"}}>{item.value}</div>
                </div>
              ))}
            </div>
            {/* Row 2: two columns — Route | Frequency */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                { label:"Route", value: (() => {
                    if (!currentFmtDef || currentFmtDef.route === "other") return d.route || "—";
                    if (currentFmtDef.route === "susp") return "PO";
                    if (currentFmtDef.route === "tab")  return "PO";
                    return d.route || "—";
                  })() },
                { label:"Frequency", value: freqDisplay },
              ].map(item => (
                <div key={item.label} style={{padding:"10px 12px",borderRadius:8,background:COLORS.bg,border:`1px solid ${COLORS.border}`}}>
                  <div style={{color:COLORS.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>{item.label}</div>
                  <div style={{color:COLORS.accent,fontSize:15,fontWeight:700,fontFamily:"'Sora',sans-serif",marginTop:3}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace",fontStyle:"italic"}}>
            Pedi-Calc does not currently contain dosing recommendations for this drug.
          </div>
        )}
      </div>

      {/* Pearl card — bracket row removed; pearl and formulations remain */}
      {d.pearl && (
        <div style={{marginTop:10,borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`,overflow:"hidden"}}>

          {/* Section 2: Pearl */}
          <div style={{
            display:"flex", gap:10, alignItems:"flex-start",
            padding:"12px 14px",
            background:COLORS.surface,
          }}>
            <div style={{width:3,flexShrink:0,alignSelf:"stretch",borderRadius:2,background:COLORS.accent,marginTop:1}} />
            <div style={{fontSize:13,fontFamily:"'IBM Plex Sans',sans-serif",color:COLORS.navy,lineHeight:1.55}}>
              {d.pearl}
            </div>
          </div>

        </div>
      )}

      {/* Give card — rendered below bracket/pearl card */}
      {giveResult && (
        <div style={{borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`,overflow:"hidden",marginTop:10}}>
          {/* Override warning banner */}
          {overrideActive && (
            <div style={{background:"#fff3cd",borderBottom:`1px solid ${COLORS.warning}`,padding:"8px 14px",display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:13}}>⚠️</span>
              <span style={{fontSize:12,color:"#7a5700",fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600}}>
                Adult maximum cap overridden — weight-based dose in use without daily limit
              </span>
            </div>
          )}
          {/* Capped (not override) info banner */}
          {giveResult.capped && !overrideActive && (
            <div style={{background:"#e5f3ff",borderBottom:`1px solid #90c4ff`,padding:"8px 14px",display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:13}}>ℹ️</span>
              <span style={{fontSize:12,color:"#004a99",fontFamily:"'IBM Plex Sans',sans-serif"}}>
                Adult maximum dose applied — weight-based calculation exceeds daily max
              </span>
            </div>
          )}
          {/* Out-of-bracket info (suspension) */}
          {giveResult.type === "susp" && giveResult.inBracket === false && (
            <div style={{background:"#e5f3ff",borderBottom:`1px solid #90c4ff`,padding:"8px 14px",display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:13}}>ℹ️</span>
              <span style={{fontSize:12,color:"#004a99",fontFamily:"'IBM Plex Sans',sans-serif"}}>
                Snapped volume is nearest achievable — verify clinically
              </span>
            </div>
          )}

          {/* Give card rows */}
          {[
            { label:"Formulation", value: fmts[fmtIdx] },
            { label:"Total Daily",
              value: `${Math.round(giveResult.dailyMg)} mg/day (= ${(giveResult.dailyMg/weight).toFixed(1)} mg/kg/day)` },
            { label:"Per-Dose",
              value: giveResult.type === "susp"
                ? `${Math.round(giveResult.perDoseMg)} mg ${freqDisplay} (= ${(giveResult.perDoseMg/weight).toFixed(2)} mg/kg/dose)`
                : `${Math.round(giveResult.perDoseMg)} mg ${freqDisplay} (= ${(giveResult.perDoseMg/weight).toFixed(2)} mg/kg/dose)` },
          ].map(item => (
            <div key={item.label} style={{padding:"10px 14px",borderBottom:`1px solid ${COLORS.border}`}}>
              <div style={{color:COLORS.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>{item.label}</div>
              <div style={{color:COLORS.text,fontSize:14,fontWeight:600,fontFamily:"'IBM Plex Mono',monospace",marginTop:2}}>{item.value}</div>
            </div>
          ))}

          {/* Hero: Give per dose */}
          <div style={{padding:"14px 14px 12px"}}>
            <div style={{color:COLORS.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Give Per Dose</div>
            <div style={{color:COLORS.accent,fontSize:22,fontWeight:700,fontFamily:"'Sora',sans-serif",lineHeight:1.2,letterSpacing:"-0.3px"}}>
              {giveResult.type === "susp"
                ? `${Math.round(giveResult.perDoseMg)} mg = ${giveResult.vol} mL ${freqDisplay}`
                : `${Math.round(giveResult.perDoseMg)} mg = ${giveResult.tabFrac} ${freqDisplay}`}
            </div>
            {giveResult.type === "susp" && (
              <div style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif",marginTop:4}}>
                Use a {giveResult.syringeLabel}
              </div>
            )}
            <div style={{color:COLORS.textSub,fontSize:11,fontFamily:"'IBM Plex Mono',monospace",marginTop:4}}>
              = {(giveResult.perDoseMg/weight).toFixed(2)} mg/kg/dose
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: U25 eGFR (Cystatin-C and Creatinine based)
// ═══════════════════════════════════════════════════════════════════════════════
function U25GFRCalc() {
  const [method, setMethod] = useState("both");
  const [height, setHeight] = useState(120);
  const [creatinine, setCreatinine] = useState(0.5);
  const [cystatin, setCystatin] = useState(0.9);
  const [age, setAge] = useState(10);
  const [sex, setSex] = useState(null);
  const [bun, setBun] = useState(15);
  const [useBUN, setUseBUN] = useState(false);
  
  const hM = height / 100; // height in metres
  // Eq 1 — Bedside Schwartz 2009 (SCr only)
  const egfr_scr_eq1 = (0.413 * height / creatinine).toFixed(1);
  // Eq 2 — Modified Schwartz 2009 (SCr + BUN)
  const egfr_scr_eq2 = (40.7 * Math.pow(hM / creatinine, 0.640) * Math.pow(30 / bun, 0.25)).toFixed(1);
  const egfr_scr = useBUN ? egfr_scr_eq2 : egfr_scr_eq1;

  // U25 Cystatin-C based eGFR (Filler & Lepage 2003)
  const egfr_cys = (70.69 * Math.pow(cystatin, -0.931)).toFixed(1);

  // Combined U25 (CKiD): arithmetic mean of active SCr and CysC equations
  const egfr_combined = ((parseFloat(egfr_scr) + parseFloat(egfr_cys)) / 2).toFixed(1);

  // CKiD 2012 full combined (Schwartz): SCr + CysC + BUN + height + sex
  const sexFactor2012 = sex === "male" ? 1.076 : 1.0;
  const egfr_ckid2012 = (39.8
    * Math.pow(hM / creatinine, 0.456)
    * Math.pow(1.8 / cystatin, 0.418)
    * Math.pow(30 / bun, 0.079)
    * Math.pow(hM / 1.4, 0.179)
    * sexFactor2012
  ).toFixed(1);
  
  const getStage = (gfr) => {
    const g = parseFloat(gfr);
    if (g >= 90) return { stage: "G1 — Normal/High", color: COLORS.success };
    if (g >= 60) return { stage: "G2 — Mildly Reduced", color: COLORS.success };
    if (g >= 45) return { stage: "G3a — Mild–Moderate", color: COLORS.warning };
    if (g >= 30) return { stage: "G3b — Moderate–Severe", color: COLORS.warning };
    if (g >= 15) return { stage: "G4 — Severely Reduced", color: COLORS.danger };
    return { stage: "G5 — Kidney Failure", color: COLORS.danger };
  };
  
  const displayGFR = method === "scr" ? egfr_scr : method === "cys" ? egfr_cys : egfr_combined;
  const { stage, color } = getStage(displayGFR);
  const { stage: stage2012, color: color2012 } = getStage(egfr_ckid2012);
  
  return (
    <div>
      <ScoreRow label="Calculation Method" value={method} onChange={setMethod} options={[
        {value:"scr",label:"SCr only"},
        {value:"cys",label:"Cystatin-C only"},
        {value:"both",label:"Combined (both)"}
      ]} />
      <div style={{display:"flex",gap:8,marginBottom:4,alignItems:"flex-end"}}>
        <div style={{flex:3,minWidth:0}}><NumberInput label="Age" value={age} onChange={setAge} min={0} max={25} step={0.5} unit="years (≤25)" /></div>
        <div style={{flex:3,minWidth:0}}><NumberInput label="Height" value={height} onChange={setHeight} min={30} max={200} unit="cm" /></div>
        <div style={{flex:2,minWidth:0,marginBottom:10}}>
          <div style={{color:COLORS.navy,fontSize:12,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Sex</div>
          <div style={{display:"flex",borderRadius:6,overflow:"hidden",border:`1.5px solid ${COLORS.border}`}}>
            {[[null,"—"],["male","M"],["female","F"]].map(([val,lbl])=>(
              <button key={String(val)} onClick={()=>setSex(val)}
                style={{flex:1,padding:"8px 0",fontSize:13,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",border:"none",borderRight:val==="male"?`1px solid ${COLORS.border}`:"none",cursor:"pointer",
                  background:sex===val?COLORS.navy:COLORS.bg,
                  color:sex===val?"#fff":COLORS.textMuted,
                  transition:"background 0.15s"}}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"flex-end"}}>
        <div style={{flex:1,minWidth:0}}><NumberInput label="BUN" value={bun} onChange={setBun} min={1} max={200} step={0.1} unit="mg/dL" /></div>
        <div style={{flex:1,minWidth:0}}><NumberInput label="SCr" value={creatinine} onChange={setCreatinine} min={0.1} max={15} step={0.01} unit="mg/dL" /></div>
        <div style={{flex:1,minWidth:0}}><NumberInput label="Cystatin C" value={cystatin} onChange={setCystatin} min={0.1} max={8} step={0.01} unit="mg/L" /></div>
      </div>
      <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,cursor:"pointer",userSelect:"none"}}>
        <input type="checkbox" checked={useBUN} onChange={e=>setUseBUN(e.target.checked)}
          style={{width:16,height:16,accentColor:COLORS.navy,cursor:"pointer"}} />
        <span style={{fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif",color:COLORS.navy,fontWeight:600}}>
          Include BUN in SCr equation (Schwartz Eq 2)
        </span>
      </label>
      
      <div style={{marginTop:16,padding:"14px 16px",borderRadius:10,background:COLORS.card,border:`1px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:10}}>CALCULATED eGFR VALUES</div>
        {(method === "scr" || method === "both") && (
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`}}>
            <span style={{color:COLORS.textSub,fontSize:13,fontFamily:"'DM Mono',monospace"}}>SCr {useBUN ? "+ BUN (Eq 2)" : "only (Eq 1)"}</span>
            <span style={{color:COLORS.accent,fontWeight:700,fontSize:14,fontFamily:"'Sora',sans-serif"}}>{egfr_scr} mL/min/1.73m²</span>
          </div>
        )}
        {(method === "cys" || method === "both") && (
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`}}>
            <span style={{color:COLORS.textSub,fontSize:13,fontFamily:"'DM Mono',monospace"}}>Cystatin-C (U25)</span>
            <span style={{color:COLORS.accent,fontWeight:700,fontSize:14,fontFamily:"'Sora',sans-serif"}}>{egfr_cys} mL/min/1.73m²</span>
          </div>
        )}
        {method === "both" && (
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}>
            <span style={{color:COLORS.textSub,fontSize:13,fontFamily:"'DM Mono',monospace"}}>Combined U25</span>
            <span style={{color:COLORS.accent,fontWeight:700,fontSize:14,fontFamily:"'Sora',sans-serif"}}>{egfr_combined} mL/min/1.73m²</span>
          </div>
        )}
      </div>
      
      <ResultBadge 
        score={displayGFR} 
        label={stage} 
        color={color} 
        sublabel={`U25 equation (2021) • Age ≤25 years • KDIGO staging`} 
      />
      
      <div style={{marginTop:12,padding:"14px 16px",borderRadius:10,background:COLORS.card,border:`1.5px solid ${COLORS.navy}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:8}}>CKiD 2012 FULL COMBINED</div>
        <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:COLORS.textMuted,marginBottom:10,opacity:0.8}}>
          39.8 × (ht/SCr)⁰·⁴⁵⁶ × (1.8/CysC)⁰·⁴¹⁸ × (30/BUN)⁰·⁰⁷⁹ × (ht/1.4)⁰·¹⁷⁹ {sex === "male" ? "× 1.076 (male)" : ""}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{color:color2012,fontSize:28,fontWeight:700,fontFamily:"'Sora',sans-serif"}}>{egfr_ckid2012}</span>
          <span style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace"}}>mL/min/1.73m²</span>
        </div>
        <div style={{color:color2012,fontSize:13,fontFamily:"'Sora',sans-serif",fontWeight:600,marginTop:2}}>{stage2012}</div>
      </div>
      <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:COLORS.card,border:`1px solid ${COLORS.border}`,color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
        ℹ U25 equations developed for children and young adults. Combined equation preferred when both biomarkers available.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PEDIATRIC SEPSIS (qSOFA / SIRS)
// ═══════════════════════════════════════════════════════════════════════════════
function SepsisCalc() {
  const [age, setAge] = useState(5);
  const [hr, setHr] = useState(100);
  const [rr, setRr] = useState(25);
  const [temp, setTemp] = useState(37.5);
  const [wbc, setWbc] = useState(12);
  const [bands, setBands] = useState(5);
  const [focus, setFocus] = useState(0);
  
  const ageSIRS = (a) => ({
    hr_high: a<1?180:a<5?140:a<12?130:110,
    rr_high: a<1?50:a<5?40:a<12?34:22,
    wbc_high: a<1?34:a<5?19.5:a<12?17.5:11,
    wbc_low: a<1?5:a<5?5:a<12?4.5:4.5
  });
  const n = ageSIRS(age);
  const sirsCriteria = [
    hr > n.hr_high,
    rr > n.rr_high,
    temp < 36 || temp > 38.5,
    wbc > n.wbc_high || wbc < n.wbc_low || bands > 10
  ].filter(Boolean).length;
  
  const sepsis = sirsCriteria >= 2 && focus > 0;
  const sirs = sirsCriteria >= 2;
  const color = sepsis ? COLORS.danger : sirs ? COLORS.warning : COLORS.success;
  const label = sepsis ? "SEPSIS (SIRS + Infection)" : sirs ? "SIRS (no confirmed focus)" : "SIRS criteria not met";
  
  return (
    <div>
      <NumberInput label="Age" value={age} onChange={setAge} min={0} max={18} step={0.5} unit="years" />
      <NumberInput label="Heart Rate" value={hr} onChange={setHr} min={40} max={250} unit="bpm" />
      <NumberInput label="Respiratory Rate" value={rr} onChange={setRr} min={10} max={80} unit="breaths/min" />
      <NumberInput label="Temperature" value={temp} onChange={setTemp} min={32} max={42} step={0.1} unit="°C" />
      <NumberInput label="WBC" value={wbc} onChange={setWbc} min={0} max={100} step={0.1} unit="×10³/μL" />
      <NumberInput label="Band Forms" value={bands} onChange={setBands} min={0} max={100} unit="%" />
      <ScoreRow label="Suspected/Confirmed Infection Focus" value={focus} onChange={setFocus} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Yes"}]} />
      <ResultBadge score={`${sirsCriteria}/4`} label={label} color={color} sublabel={`HR >${n.hr_high} | RR >${n.rr_high} | Temp <36 or >38.5 | WBC criteria (age-adjusted)`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: MODIFIED WELLS (DVT in children)
// ═══════════════════════════════════════════════════════════════════════════════
function DVTCalc() {
  const [vals, setVals] = useState({ active_cancer:null, bedridden:null, tenderness:null, swelling:null, calf_swelling:null, pitting:null, collateral:null, immobile:null, prev:null, alt_dx:null });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const score = Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled = Object.values(vals).every(v=>v!==null);
  const color = score>=3?COLORS.danger:score>=1?COLORS.warning:COLORS.success;
  const label = score>=3?"High Probability DVT":score>=1?"Moderate Probability":"Low Probability";
  return (
    <div>
      {[
        {k:"active_cancer",l:"Active Cancer (on treatment/within 6mo)",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"bedridden",l:"Bedridden >3 days or Major Surgery <12wks",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"tenderness",l:"Localized Tenderness Along Veins",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"swelling",l:"Entire Leg Swollen",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"calf_swelling",l:"Calf Swelling >3 cm Compared to Asymptomatic Leg",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"pitting",l:"Pitting Edema",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"collateral",l:"Collateral Superficial Veins",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"immobile",l:"Immobilization/Cast",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"prev",l:"Prior DVT/PE",opts:[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]},
        {k:"alt_dx",l:"Alternative Diagnosis as Likely",opts:[{value:0,label:"0 — No"},{value:-2,label:"−2 — Yes"}]},
      ].map(({k,l,opts})=>(
        <ScoreRow key={k} label={l} value={vals[k]} onChange={v=>set(k,v)} options={opts} />
      ))}
      {filled && <ResultBadge score={score} label={label} color={color} sublabel="Wells DVT Criteria • Adapted for pediatric use" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: CATCH (Head CT Rule — Canadian)
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: BRONCHIOLITIS SEVERITY
// ═══════════════════════════════════════════════════════════════════════════════
function BronchiolitisCalc() {
  const [vals, setVals] = useState({ rr:null, spo2:null, retractions:null, aeration:null, feeding:null });
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));
  const score=Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled=Object.values(vals).every(v=>v!==null);
  const color=score>=7?COLORS.danger:score>=4?COLORS.warning:COLORS.success;
  const label=score>=7?"Severe — Admit/Consider PICU":score>=4?"Moderate — Observe/Admit":"Mild — Discharge Candidate";
  return (
    <div>
      <ScoreRow label="Respiratory Rate" value={vals.rr} onChange={v=>set("rr",v)} options={[{value:0,label:"0 — <40"},{value:1,label:"1 — 40–59"},{value:2,label:"2 — 60–69"},{value:3,label:"3 — ≥70"}]} />
      <ScoreRow label="SpO₂ on Room Air" value={vals.spo2} onChange={v=>set("spo2",v)} options={[{value:0,label:"0 — >94%"},{value:1,label:"1 — 90–94%"},{value:2,label:"2 — <90%"}]} />
      <ScoreRow label="Retractions" value={vals.retractions} onChange={v=>set("retractions",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Subcostal/Intercostal"},{value:2,label:"2 — Supraclavicular"},{value:3,label:"3 — Severe all groups"}]} />
      <ScoreRow label="Aeration/Wheeze" value={vals.aeration} onChange={v=>set("aeration",v)} options={[{value:0,label:"0 — Normal"},{value:1,label:"1 — End-expiratory wheeze"},{value:2,label:"2 — Expiratory wheeze"},{value:3,label:"3 — Insp + Exp wheeze"}]} />
      <ScoreRow label="Feeding/Hydration" value={vals.feeding} onChange={v=>set("feeding",v)} options={[{value:0,label:"0 — Normal"},{value:1,label:"1 — Slightly reduced"},{value:2,label:"2 — Not feeding well"}]} />
      {filled && <ResultBadge score={score} label={label} color={color} sublabel="Score 0–13 • Evidence-based bronchiolitis severity" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: ASTHMA SEVERITY (PRAM/PASS)
// ═══════════════════════════════════════════════════════════════════════════════
function AsthmaCalc() {
  const [vals, setVals] = useState({ spo2:null, auscult:null, retractions:null, dyspnea:null });
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));
  const score=Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled=Object.values(vals).every(v=>v!==null);
  const color=score>=9?COLORS.danger:score>=5?COLORS.warning:COLORS.success;
  const label=score>=9?"Severe — PICU Consideration":score>=5?"Moderate — Treatment Required":"Mild — Outpatient Possible";
  return (
    <div>
      <div style={{color:COLORS.textMuted,fontSize:11,marginBottom:8,fontFamily:"'DM Mono',monospace"}}>PRAM (Pediatric Respiratory Assessment Measure)</div>
      <ScoreRow label="SpO₂" value={vals.spo2} onChange={v=>set("spo2",v)} options={[{value:0,label:"0 — ≥95%"},{value:1,label:"1 — 92–94%"},{value:2,label:"2 — <92%"}]} />
      <ScoreRow label="Auscultation" value={vals.auscult} onChange={v=>set("auscult",v)} options={[{value:0,label:"0 — Normal/Mild wheeze"},{value:1,label:"1 — Expiratory wheeze"},{value:2,label:"2 — Inspiratory+Expiratory"},{value:3,label:"3 — Silent chest"}]} />
      <ScoreRow label="Suprasternal Retractions" value={vals.retractions} onChange={v=>set("retractions",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Present"},{value:2,label:"2 — Severe"}]} />
      <ScoreRow label="Accessory Muscle Use / Dyspnea" value={vals.dyspnea} onChange={v=>set("dyspnea",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Moderate"},{value:2,label:"2 — Maximal"}]} />
      {filled && <ResultBadge score={score} label={label} color={color} sublabel="PRAM Score 0–12 • Validated in children 2–17y" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: BURNS — PARKLAND + BSA (Pediatric Lund-Browder)
// ═══════════════════════════════════════════════════════════════════════════════
// SVG PATH DATA — Lund-Browder zones, traced from clinical diagrams
// ═══════════════════════════════════════════════════════════════════════════════
const BURN_SVG = {
  baby: {
    front: { vw:100.0, vh:196.45, paths: {
      head: "M 48.04,1.68 L 45.00,2.71 L 42.38,3.93 L 39.95,5.61 L 37.29,8.27 L 34.91,11.59 L 33.36,14.91 L 32.52,17.80 L 32.20,20.75 L 32.24,24.35 L 32.76,27.90 L 34.11,31.59 L 36.45,35.51 L 39.16,38.60 L 41.78,40.61 L 44.81,42.10 L 48.36,43.18 L 52.38,43.55 L 56.82,43.18 L 60.47,42.29 L 62.85,41.21 L 65.05,39.72 L 67.57,37.38 L 69.95,34.25 L 71.73,30.75 L 72.76,27.43 L 73.18,24.16 L 73.18,20.70 L 72.76,17.43 L 71.78,14.21 L 70.05,10.79 L 67.52,7.52 L 64.91,5.09 L 62.66,3.64 L 60.56,2.71 L 59.07,2.20 L 57.62,1.82 L 54.67,1.45 L 50.47,1.31 Z",
      neck: "M 65.79,39.25 L 64.25,39.58 L 62.01,40.70 L 58.97,42.10 L 56.17,42.94 L 53.46,43.22 L 50.47,43.08 L 47.66,42.52 L 45.33,41.73 L 43.46,40.79 L 41.82,39.95 L 40.70,40.00 L 40.51,41.21 L 41.26,43.36 L 42.76,45.93 L 44.58,47.94 L 46.82,49.30 L 49.21,50.23 L 51.59,50.61 L 54.39,50.56 L 56.78,50.23 L 58.64,49.58 L 60.70,48.46 L 62.29,47.29 L 63.13,46.40 L 64.02,45.14 L 65.00,43.22 L 65.79,40.93 Z",
      trunkAnt: "M 40.56,43.93 L 38.79,44.63 L 37.43,45.19 L 35.98,45.75 L 34.21,46.45 L 31.73,47.48 L 29.07,48.97 L 28.04,50.37 L 28.32,51.40 L 28.69,52.34 L 29.21,53.74 L 29.86,55.65 L 30.37,57.34 L 30.79,59.16 L 31.36,62.34 L 31.82,66.59 L 31.87,70.47 L 31.54,73.64 L 30.93,76.50 L 30.14,81.68 L 29.53,90.37 L 29.44,97.38 L 29.86,100.47 L 30.98,102.52 L 33.46,105.05 L 37.15,107.71 L 40.61,109.67 L 43.36,110.84 L 46.26,111.68 L 50.19,112.20 L 54.63,112.24 L 58.04,111.87 L 60.75,111.12 L 63.32,110.09 L 65.05,109.25 L 66.03,108.74 L 66.87,108.27 L 68.32,107.38 L 70.89,105.51 L 73.18,103.55 L 74.30,102.10 L 74.95,100.70 L 75.19,97.71 L 75.09,91.82 L 75.00,86.03 L 74.86,82.48 L 74.72,80.42 L 74.63,79.35 L 74.44,78.60 L 74.16,77.62 L 73.83,75.70 L 73.41,72.29 L 73.22,67.80 L 73.55,63.36 L 74.39,59.02 L 75.70,54.63 L 76.78,51.26 L 76.54,49.30 L 74.39,47.90 L 70.98,46.54 L 67.80,45.33 L 65.47,44.44 L 63.88,44.49 L 62.57,45.70 L 60.98,47.29 L 59.16,48.55 L 57.01,49.49 L 54.39,50.09 L 51.59,50.09 L 48.97,49.49 L 46.78,48.50 L 44.86,47.10 L 43.27,45.42 L 42.24,43.93 Z",
      upArmR: "M 27.10,49.72 L 25.89,50.84 L 23.97,53.04 L 22.15,55.75 L 20.84,58.50 L 19.72,62.10 L 18.83,66.26 L 18.41,68.74 L 18.22,69.58 L 18.04,70.56 L 17.90,72.20 L 17.85,74.11 L 17.71,75.37 L 17.48,76.12 L 18.08,77.06 L 19.63,77.76 L 21.03,78.13 L 22.34,78.55 L 23.88,79.21 L 25.61,80.33 L 27.29,81.45 L 28.46,81.78 L 29.44,80.98 L 30.61,79.02 L 31.40,76.64 L 31.68,75.00 L 31.82,73.46 L 31.92,70.84 L 32.06,67.71 L 32.01,65.14 L 31.68,63.50 L 31.50,61.92 L 31.50,60.42 L 31.45,59.67 L 31.26,59.21 L 30.98,58.32 L 30.61,56.31 L 29.77,53.27 L 28.41,49.72 Z",
      upArmL: "M 78.32,49.91 L 76.87,50.47 L 75.79,52.15 L 74.81,55.05 L 73.83,59.11 L 73.13,65.14 L 72.99,71.59 L 73.36,75.79 L 74.35,78.74 L 75.89,81.07 L 77.62,81.40 L 79.81,80.09 L 82.43,78.69 L 84.95,77.85 L 86.82,76.96 L 87.29,74.30 L 86.54,68.83 L 85.51,63.41 L 84.95,61.07 L 84.67,60.14 L 84.30,58.97 L 83.69,57.38 L 82.38,54.81 L 80.56,51.96 Z",
      forearmR: "M 17.38,77.01 L 16.92,77.57 L 16.26,78.55 L 14.63,81.40 L 12.43,85.98 L 10.89,90.19 L 9.95,94.07 L 9.35,97.80 L 9.25,99.91 L 9.49,100.42 L 9.95,100.51 L 11.07,100.70 L 12.90,101.21 L 14.72,102.01 L 15.98,102.80 L 17.01,103.36 L 18.93,102.34 L 21.31,99.77 L 22.52,98.13 L 23.32,96.82 L 24.91,93.50 L 26.64,88.69 L 27.71,84.86 L 28.13,82.90 L 27.57,81.26 L 25.70,79.49 L 23.08,78.18 L 20.00,77.20 Z",
      forearmL: "M 85.05,77.20 L 82.20,78.04 L 79.81,79.07 L 78.04,80.23 L 76.96,81.50 L 76.92,83.74 L 77.85,87.76 L 79.53,92.71 L 82.15,97.90 L 84.81,102.01 L 86.31,103.60 L 87.38,103.41 L 88.93,102.52 L 91.03,101.54 L 93.27,100.93 L 94.63,100.05 L 94.81,97.62 L 94.25,93.64 L 93.22,89.25 L 92.10,85.84 L 91.36,84.02 L 90.70,82.52 L 89.53,80.33 L 88.36,78.36 L 87.85,77.38 Z",
      handR: "M 14.95,101.12 L 11.96,100.37 L 9.30,100.37 L 7.38,101.12 L 5.89,102.10 L 4.53,103.27 L 3.46,104.77 L 2.57,106.26 L 1.92,107.20 L 1.59,108.13 L 1.68,109.39 L 2.48,110.19 L 3.22,111.07 L 3.04,112.62 L 2.66,114.11 L 2.76,115.42 L 3.41,116.31 L 4.35,116.82 L 4.91,117.43 L 5.61,117.85 L 6.73,118.04 L 7.90,118.22 L 9.11,118.22 L 10.33,118.08 L 11.64,117.90 L 12.85,116.68 L 14.39,113.79 L 16.31,110.28 L 17.38,106.82 L 17.24,103.74 L 16.26,101.87 Z",
      handL: "M 95.14,100.37 L 92.76,100.51 L 90.05,101.21 L 87.66,102.43 L 86.50,103.55 L 86.21,105.33 L 86.31,108.18 L 87.01,110.93 L 88.22,113.74 L 89.25,116.40 L 89.86,117.76 L 90.61,118.08 L 91.68,118.22 L 92.71,118.41 L 93.64,118.41 L 94.63,118.22 L 95.61,118.08 L 96.26,117.76 L 96.92,117.15 L 97.85,116.50 L 98.36,115.33 L 98.22,113.41 L 98.36,111.78 L 99.21,111.03 L 99.77,110.33 L 99.77,109.21 L 99.49,108.08 L 98.97,106.82 L 98.32,105.05 L 97.43,103.08 L 96.45,101.50 Z",
      genitalia: "M 49.35,113.08 L 48.69,113.69 L 47.94,114.81 L 47.43,116.64 L 47.43,118.88 L 48.13,120.84 L 49.44,122.29 L 51.36,123.04 L 53.64,123.08 L 55.42,122.57 L 56.64,121.50 L 57.48,120.19 L 57.85,118.64 L 57.76,116.68 L 57.10,114.77 L 56.03,113.41 L 54.91,112.66 L 53.46,112.38 L 51.03,112.34 Z",
      thighR: "M 31.21,103.36 L 30.56,105.37 L 29.77,108.55 L 29.07,112.29 L 28.69,116.96 L 28.79,123.22 L 29.35,128.74 L 30.14,132.34 L 31.12,135.33 L 31.96,138.64 L 32.24,141.59 L 32.29,143.22 L 32.52,144.86 L 33.08,147.01 L 33.74,148.50 L 34.58,149.25 L 36.12,149.81 L 39.16,150.19 L 43.69,150.05 L 47.34,149.44 L 48.93,148.55 L 49.67,146.96 L 50.14,144.21 L 50.33,141.21 L 50.51,139.39 L 50.84,138.27 L 51.31,135.98 L 51.92,131.45 L 52.38,126.36 L 52.24,123.41 L 51.40,122.52 L 50.23,121.92 L 49.02,120.70 L 48.08,119.11 L 47.80,117.66 L 48.13,116.31 L 48.97,114.91 L 50.05,113.79 L 50.75,112.99 L 50.70,112.29 L 49.30,111.78 L 46.21,111.03 L 42.62,109.77 L 39.67,108.36 L 36.96,106.68 L 34.39,104.81 L 32.71,103.36 Z",
      thighL: "M 73.64,103.36 L 72.24,103.64 L 70.47,104.81 L 68.27,106.40 L 66.82,107.34 L 65.33,108.22 L 62.15,109.77 L 58.60,111.12 L 56.12,111.73 L 54.63,112.24 L 54.25,112.94 L 54.91,113.64 L 56.12,114.95 L 57.10,116.82 L 57.15,118.64 L 56.31,120.42 L 55.14,121.78 L 53.97,122.43 L 52.94,124.07 L 52.57,127.48 L 52.85,131.40 L 53.55,135.84 L 54.30,140.65 L 54.63,144.44 L 54.95,146.73 L 55.79,148.36 L 57.62,149.53 L 61.17,150.09 L 65.37,150.19 L 68.36,149.81 L 70.33,148.60 L 71.68,146.54 L 72.24,143.50 L 72.66,139.35 L 73.64,135.37 L 74.86,131.50 L 75.75,127.34 L 76.17,122.76 L 76.12,117.20 L 75.65,111.96 L 74.91,107.94 L 74.16,105.19 L 73.64,103.93 Z",
      legR: "M 34.02,148.97 L 33.88,149.58 L 33.69,151.21 L 33.41,155.00 L 33.46,160.70 L 34.25,166.87 L 35.42,171.87 L 36.45,174.21 L 37.62,174.49 L 39.77,174.30 L 42.71,174.30 L 45.00,174.49 L 46.21,174.30 L 46.78,173.60 L 47.06,172.71 L 47.43,171.45 L 48.04,169.49 L 48.83,166.07 L 49.49,160.61 L 49.53,154.39 L 48.79,150.09 L 47.52,148.93 L 45.79,149.35 L 42.99,149.77 L 39.49,149.77 L 36.82,149.35 L 35.33,148.79 Z",
      legL: "M 55.70,148.79 L 55.14,154.39 L 55.00,159.81 L 55.28,163.69 L 56.21,168.08 L 57.80,172.76 L 59.53,174.49 L 61.78,174.30 L 64.53,174.30 L 66.73,174.44 L 67.99,174.30 L 68.69,173.13 L 69.49,170.37 L 70.42,166.40 L 71.03,160.93 L 71.03,154.44 L 70.37,150.00 L 69.35,148.93 L 67.80,149.35 L 65.14,149.77 L 61.73,149.77 L 58.93,149.35 L 57.20,148.79 Z",
      footR: "M 36.82,174.02 L 36.12,175.00 L 35.61,177.06 L 35.19,179.44 L 34.44,181.78 L 33.32,184.02 L 32.24,185.84 L 31.59,187.76 L 31.59,189.81 L 32.15,190.98 L 32.80,191.36 L 33.36,191.73 L 34.11,192.10 L 34.91,192.43 L 35.37,192.80 L 35.89,193.04 L 36.64,193.22 L 37.24,193.60 L 37.99,193.93 L 39.07,194.21 L 40.05,194.67 L 41.21,195.05 L 42.76,195.00 L 44.07,194.44 L 45.09,193.04 L 46.07,190.70 L 46.73,187.76 L 46.78,184.49 L 46.50,181.73 L 46.50,179.67 L 46.73,177.34 L 46.73,175.19 L 46.03,174.21 L 43.36,173.93 L 38.32,173.83 Z",
      footL: "M 58.50,174.02 L 58.27,174.16 L 57.94,174.53 L 57.66,175.79 L 57.66,177.71 L 57.85,179.72 L 57.80,182.15 L 57.52,184.91 L 57.57,187.66 L 58.13,190.37 L 58.88,192.52 L 59.58,193.83 L 60.33,194.58 L 61.59,195.00 L 63.18,195.05 L 64.25,194.72 L 65.09,194.35 L 66.26,193.97 L 67.43,193.50 L 68.27,193.22 L 68.83,192.94 L 69.58,192.43 L 70.51,191.92 L 71.31,191.50 L 72.15,191.07 L 72.76,189.91 L 72.76,187.90 L 72.10,185.98 L 70.93,184.02 L 69.86,181.82 L 69.21,179.77 L 68.88,177.90 L 68.74,176.36 L 68.55,175.19 L 67.80,174.35 L 65.28,173.93 L 60.56,173.83 Z",
    } },
    back: { vw:100.0, vh:203.88, paths: {
      head: "M 35.27,5.43 L 32.80,7.99 L 30.38,11.29 L 28.68,14.58 L 27.81,17.30 L 27.37,20.25 L 27.23,23.79 L 27.37,26.65 L 27.86,29.02 L 28.83,31.93 L 30.33,34.98 L 32.46,37.84 L 35.03,39.97 L 37.50,40.55 L 40.70,40.12 L 45.93,39.68 L 51.84,39.63 L 56.10,39.97 L 59.01,40.41 L 61.29,40.50 L 62.89,39.78 L 64.73,37.69 L 66.76,34.88 L 68.12,32.32 L 69.04,29.51 L 69.62,25.48 L 69.72,21.08 L 69.48,18.17 L 68.94,16.13 L 68.07,13.81 L 66.91,11.48 L 65.12,9.01 L 62.69,6.44 L 60.56,4.65 L 58.67,3.54 L 56.54,2.57 L 53.97,1.79 L 50.53,1.31 L 46.75,1.26 L 43.36,1.74 L 40.26,2.71 L 37.60,3.88 Z",
      neck: "M 35.66,40.70 L 35.85,42.20 L 36.24,44.09 L 36.68,46.08 L 37.55,47.72 L 39.05,49.18 L 40.79,50.44 L 42.93,51.41 L 46.37,52.08 L 50.29,52.23 L 53.20,51.74 L 55.52,50.78 L 57.70,49.32 L 59.45,47.63 L 60.32,46.41 L 60.56,45.83 L 60.76,45.16 L 60.90,44.04 L 61.14,42.97 L 61.48,42.01 L 60.95,40.99 L 58.43,40.16 L 52.81,39.68 L 45.11,39.68 L 38.57,40.12 Z",
      trunkPost: "M 23.45,50.58 L 23.45,51.89 L 23.69,53.15 L 24.13,54.84 L 24.81,57.12 L 25.44,58.87 L 25.82,60.03 L 26.07,61.48 L 26.36,63.18 L 26.70,65.60 L 27.03,68.12 L 27.33,70.25 L 27.28,72.53 L 26.99,74.42 L 26.60,76.84 L 26.02,79.70 L 25.58,82.07 L 25.48,84.69 L 25.34,86.77 L 25.15,88.57 L 25.15,93.60 L 25.15,100.63 L 25.34,104.84 L 26.60,107.22 L 28.59,109.25 L 29.84,110.17 L 30.62,110.76 L 31.83,111.43 L 32.85,111.87 L 33.24,112.16 L 33.53,112.35 L 34.35,112.65 L 36.63,113.42 L 39.92,114.24 L 42.15,114.63 L 43.17,114.83 L 44.04,114.97 L 45.35,115.07 L 47.19,114.97 L 48.35,114.78 L 48.74,114.83 L 49.13,114.97 L 50.24,115.07 L 53.00,114.97 L 55.86,114.53 L 57.51,114.10 L 59.74,113.61 L 63.03,112.60 L 65.99,111.19 L 68.12,109.84 L 69.67,108.53 L 70.88,107.12 L 71.66,105.77 L 71.95,102.81 L 71.85,97.58 L 71.66,92.10 L 71.56,86.63 L 71.17,81.69 L 70.45,77.96 L 69.91,73.69 L 69.96,68.12 L 70.59,62.74 L 71.61,58.33 L 72.77,54.80 L 73.55,52.42 L 73.55,51.07 L 73.01,50.48 L 72.43,50.29 L 71.71,49.90 L 70.06,49.18 L 67.83,48.45 L 65.55,47.72 L 63.13,46.66 L 61.24,45.83 L 60.08,45.93 L 58.72,47.14 L 57.07,48.89 L 56.06,49.85 L 55.18,50.24 L 54.02,50.87 L 52.96,51.41 L 51.74,51.65 L 50.48,51.89 L 48.89,52.03 L 46.51,51.79 L 43.90,51.07 L 41.57,49.95 L 39.63,48.59 L 38.13,47.09 L 36.92,45.93 L 35.76,45.74 L 34.59,46.27 L 33.62,46.90 L 33.09,47.38 L 32.46,47.63 L 31.10,47.87 L 29.65,48.26 L 28.92,48.59 L 28.34,48.89 L 27.13,49.03 Z",
      upArmL: "M 22.29,51.36 L 20.69,52.71 L 18.80,54.84 L 17.44,56.98 L 17.01,58.19 L 16.76,58.67 L 16.38,59.06 L 16.04,59.64 L 15.70,60.42 L 15.41,61.39 L 15.21,62.21 L 14.83,63.23 L 14.29,65.31 L 13.91,67.34 L 13.66,68.22 L 13.47,68.90 L 13.32,70.20 L 13.18,71.61 L 12.94,72.53 L 12.74,73.21 L 12.69,74.22 L 12.69,75.73 L 12.55,76.74 L 12.31,77.76 L 13.03,79.51 L 15.12,80.67 L 17.49,81.40 L 19.77,82.56 L 21.66,83.82 L 22.92,84.64 L 24.27,84.06 L 25.78,81.88 L 26.55,79.51 L 26.74,77.96 L 26.94,76.02 L 27.08,72.87 L 27.23,69.82 L 27.18,67.54 L 26.94,65.79 L 26.74,63.52 L 26.41,61.19 L 26.07,59.93 L 25.73,58.28 L 25.10,56.20 L 24.52,55.18 L 24.27,54.55 L 24.13,53.44 L 23.84,52.52 L 23.55,51.99 L 23.45,51.36 Z",
      upArmR: "M 75.19,51.74 L 74.08,51.84 L 73.21,52.23 L 72.38,53.88 L 71.37,56.98 L 70.69,59.93 L 70.40,61.87 L 70.11,63.03 L 69.91,63.86 L 69.86,64.83 L 69.82,67.83 L 69.67,72.72 L 69.62,75.82 L 69.72,76.79 L 69.91,77.47 L 70.25,78.63 L 70.54,80.38 L 71.03,81.98 L 72.00,83.48 L 73.11,84.59 L 74.47,84.40 L 76.55,83.04 L 78.78,81.69 L 80.14,81.10 L 80.81,80.91 L 81.73,80.67 L 82.90,80.43 L 83.72,80.28 L 84.25,79.36 L 84.45,77.57 L 84.35,76.16 L 84.16,75.19 L 83.91,74.03 L 83.77,72.38 L 83.62,70.83 L 83.43,69.96 L 83.24,69.19 L 82.99,67.54 L 82.51,64.97 L 81.64,61.97 L 80.43,58.82 L 78.97,56.06 L 77.33,53.68 Z",
      forearmL: "M 13.95,79.84 L 11.92,80.72 L 10.03,83.24 L 8.24,87.06 L 6.78,90.94 L 5.81,94.48 L 5.14,98.26 L 4.75,101.79 L 4.80,103.78 L 5.14,104.31 L 5.72,104.41 L 7.12,104.65 L 9.40,105.33 L 11.53,106.35 L 13.03,107.12 L 14.83,106.20 L 17.44,102.71 L 19.57,98.84 L 20.45,96.80 L 20.78,96.12 L 21.03,95.69 L 21.32,95.01 L 21.61,93.65 L 21.80,92.01 L 22.09,91.18 L 22.38,90.94 L 22.53,90.60 L 22.72,89.87 L 22.97,88.18 L 23.16,86.29 L 23.35,85.22 L 23.16,84.30 L 22.14,83.14 L 20.49,82.03 L 18.51,81.06 L 16.28,80.23 Z",
      forearmR: "M 82.75,79.84 L 80.57,80.33 L 78.39,81.06 L 76.16,82.27 L 74.27,83.67 L 73.50,84.74 L 73.55,85.56 L 73.74,86.39 L 73.98,87.65 L 74.32,89.29 L 74.71,90.55 L 75.05,91.47 L 75.24,92.59 L 75.92,94.82 L 77.42,98.35 L 79.51,102.13 L 81.83,105.47 L 83.43,107.17 L 84.59,107.07 L 86.14,106.25 L 88.18,105.28 L 90.41,104.65 L 91.96,104.41 L 92.54,103.78 L 92.49,101.50 L 92.01,97.77 L 91.13,93.80 L 89.97,90.07 L 88.66,86.77 L 87.06,83.62 L 85.51,81.01 L 84.69,79.84 Z",
      handL: "M 4.26,104.26 L 2.62,106.98 L 1.70,109.11 L 1.26,110.56 L 0.82,111.68 L 0.48,112.94 L 0.53,114.29 L 1.21,115.16 L 1.99,115.99 L 2.08,117.78 L 2.08,119.82 L 2.71,120.83 L 3.54,121.22 L 4.02,121.71 L 4.70,122.14 L 5.72,122.38 L 6.78,122.58 L 7.95,122.58 L 9.16,122.34 L 10.51,121.66 L 11.53,120.11 L 12.35,117.73 L 13.47,115.07 L 14.20,112.26 L 14.20,109.25 L 13.71,107.12 L 12.55,106.01 L 10.61,105.14 L 9.01,104.60 L 8.33,104.36 L 7.90,104.22 L 7.56,104.07 Z",
      handR: "M 92.64,103.88 L 90.02,104.17 L 87.65,104.75 L 85.56,105.72 L 84.11,106.88 L 83.58,108.77 L 83.58,111.39 L 84.01,113.66 L 85.03,115.75 L 86.19,118.02 L 87.11,120.25 L 87.74,121.71 L 88.57,122.19 L 89.73,122.38 L 90.84,122.58 L 91.91,122.58 L 92.97,122.38 L 94.09,122.14 L 94.86,121.56 L 95.45,120.83 L 96.27,120.45 L 96.80,119.62 L 96.61,117.44 L 96.51,115.12 L 97.29,114.10 L 97.97,113.37 L 97.97,112.11 L 97.58,111.05 L 96.90,109.98 L 96.08,108.38 L 95.16,106.59 Z",
      buttockL: "M 26.55,107.56 L 25.87,110.90 L 25.63,113.28 L 25.39,114.44 L 25.10,115.12 L 24.95,115.94 L 24.85,117.34 L 24.90,119.57 L 25.10,121.71 L 25.29,123.45 L 25.44,125.19 L 25.48,126.79 L 25.82,128.39 L 26.79,130.43 L 28.25,132.51 L 30.09,134.16 L 32.36,135.37 L 34.88,136.09 L 37.21,136.39 L 38.86,136.29 L 40.26,136.05 L 42.49,135.80 L 45.16,135.13 L 47.14,134.16 L 48.01,133.48 L 48.26,132.56 L 48.35,128.88 L 48.40,122.48 L 48.55,117.68 L 48.16,115.75 L 47.19,115.07 L 45.98,114.87 L 44.38,114.83 L 43.36,114.68 L 42.68,114.39 L 41.38,114.10 L 39.97,113.81 L 38.76,113.52 L 37.74,113.28 L 37.02,113.08 L 36.34,112.79 L 35.37,112.35 L 34.30,111.92 L 32.99,111.34 L 31.06,110.22 L 29.12,108.82 L 27.71,107.56 Z",
      buttockR: "M 70.93,107.36 L 69.72,107.61 L 68.51,108.48 L 66.96,109.69 L 65.50,110.61 L 64.63,111.24 L 64.00,111.68 L 62.65,112.11 L 60.80,112.79 L 59.69,113.28 L 58.58,113.57 L 57.07,114.05 L 56.06,114.49 L 54.89,114.63 L 52.91,114.63 L 51.11,114.73 L 49.95,114.87 L 48.98,116.28 L 48.55,122.14 L 48.93,130.14 L 50.53,134.30 L 53.63,135.51 L 57.51,136.24 L 61.00,136.34 L 63.61,136.00 L 65.89,135.22 L 68.22,133.82 L 70.20,131.88 L 71.56,129.65 L 72.38,127.37 L 72.77,125.15 L 72.82,123.40 L 72.77,121.37 L 72.67,117.59 L 72.29,113.18 Z",
      thighL: "M 23.84,120.54 L 23.98,127.23 L 24.47,132.27 L 25.29,136.09 L 26.55,139.87 L 27.76,144.14 L 28.20,147.97 L 28.39,150.34 L 28.97,152.13 L 29.80,153.73 L 30.91,154.65 L 33.04,155.18 L 36.72,155.47 L 40.70,155.38 L 43.41,154.94 L 45.06,154.07 L 46.08,152.47 L 46.56,149.66 L 46.95,146.03 L 47.58,142.73 L 48.21,139.68 L 48.55,136.39 L 48.35,133.82 L 47.53,133.14 L 46.17,133.82 L 43.94,134.84 L 40.79,135.66 L 37.55,135.90 L 35.03,135.61 L 33.09,134.98 L 31.35,134.11 L 29.84,133.04 L 28.49,131.64 L 27.28,129.89 L 26.31,127.71 L 25.53,124.56 L 25.00,120.54 Z",
      thighR: "M 73.26,125.97 L 72.34,126.31 L 71.61,127.71 L 70.64,129.84 L 69.23,131.78 L 66.96,133.62 L 63.91,135.17 L 60.90,135.90 L 57.99,135.90 L 55.14,135.42 L 52.86,134.69 L 51.21,133.87 L 49.81,133.19 L 48.84,134.01 L 48.84,137.55 L 49.61,142.10 L 50.34,146.12 L 50.78,150.00 L 51.36,152.91 L 52.81,154.41 L 55.28,155.23 L 58.28,155.57 L 61.68,155.52 L 64.68,155.18 L 66.52,154.70 L 67.59,153.78 L 68.46,151.99 L 69.09,150.00 L 69.28,147.63 L 69.43,144.62 L 70.25,141.42 L 71.66,137.40 L 72.77,133.09 L 73.45,129.07 Z",
      legL: "M 30.04,154.07 L 29.65,156.83 L 29.36,160.80 L 29.36,165.36 L 29.75,169.82 L 30.33,173.21 L 30.72,174.81 L 31.25,176.89 L 32.51,180.09 L 33.87,181.44 L 34.84,181.01 L 36.34,180.38 L 38.61,179.89 L 40.70,179.99 L 42.34,180.43 L 43.51,180.33 L 44.14,179.22 L 44.77,177.08 L 45.59,173.30 L 46.27,167.39 L 46.41,161.34 L 46.08,157.12 L 45.30,154.80 L 44.23,154.17 L 43.17,154.46 L 41.52,154.84 L 38.95,155.14 L 35.90,155.09 L 33.09,154.65 L 31.20,154.07 Z",
      legR: "M 51.94,154.07 L 51.50,156.15 L 51.11,160.80 L 51.16,167.59 L 51.79,173.45 L 52.57,176.94 L 53.10,178.83 L 53.73,180.09 L 54.65,180.52 L 55.62,180.23 L 57.12,179.94 L 59.30,179.99 L 61.24,180.43 L 62.55,181.06 L 63.61,181.59 L 64.87,180.47 L 66.23,177.08 L 67.25,173.06 L 67.88,169.33 L 68.17,165.41 L 68.17,161.14 L 67.93,157.46 L 67.25,154.99 L 66.13,154.22 L 64.39,154.65 L 61.53,155.09 L 58.24,155.14 L 55.67,154.84 L 54.12,154.46 L 53.29,154.07 Z",
      footL: "M 41.67,179.46 L 39.78,179.36 L 37.02,179.65 L 34.45,180.47 L 32.99,181.49 L 32.36,182.56 L 32.07,184.50 L 31.88,187.26 L 31.44,189.63 L 30.57,191.52 L 29.55,193.27 L 28.88,195.30 L 28.83,197.53 L 29.31,198.89 L 30.09,199.37 L 30.77,199.61 L 31.20,199.85 L 31.83,200.10 L 32.66,200.34 L 33.58,200.68 L 34.64,201.11 L 35.56,201.65 L 36.82,202.03 L 38.71,201.99 L 40.36,201.45 L 41.38,200.48 L 41.96,199.27 L 42.25,196.95 L 42.54,193.27 L 43.02,190.41 L 43.56,189.15 L 44.14,188.13 L 44.72,186.14 L 44.86,183.77 L 44.53,182.41 L 44.14,181.73 L 43.90,181.01 L 43.60,180.23 Z",
      footR: "M 55.81,179.46 L 54.12,180.23 L 53.39,181.01 L 53.05,181.88 L 52.52,182.85 L 52.18,184.11 L 52.23,185.80 L 52.71,187.55 L 53.59,189.29 L 54.36,191.28 L 54.75,193.85 L 54.89,196.61 L 55.23,198.84 L 56.01,200.58 L 57.07,201.65 L 58.67,202.03 L 60.51,202.08 L 61.72,201.74 L 62.65,201.21 L 63.71,200.78 L 64.78,200.39 L 65.79,200.00 L 66.72,199.61 L 67.64,199.18 L 68.41,198.55 L 68.75,197.43 L 68.70,195.78 L 68.02,193.80 L 66.72,191.38 L 65.70,189.15 L 65.36,186.97 L 65.16,184.16 L 64.58,181.93 L 63.32,180.67 L 61.72,179.84 L 60.47,179.46 Z",
    } },
  },
  child: {
    front: { vw:100.0, vh:218.2, paths: {
      footR: "M 38.92,194.73 L 45.51,193.77 L 46.41,195.04 L 46.71,197.19 L 46.11,199.05 L 46.11,202.44 L 47.31,206.15 L 47.90,209.54 L 47.60,214.17 L 46.41,216.33 L 45.21,216.33 L 44.61,215.72 L 44.61,213.86 L 44.91,213.55 L 44.61,211.70 L 44.31,213.86 L 43.41,215.41 L 42.51,215.10 L 42.22,214.48 L 42.51,212.31 L 42.22,211.09 L 41.32,214.48 L 40.12,214.17 L 39.82,213.55 L 40.12,210.47 L 38.92,213.55 L 38.32,212.93 L 38.02,210.16 L 37.13,212.31 L 36.53,211.70 L 36.83,207.69 L 37.43,206.76 L 38.32,202.13 L 38.02,197.19 L 38.32,195.35 Z",
      footL: "M 53.29,193.77 L 56.59,194.73 L 58.98,194.73 L 59.58,195.35 L 59.88,198.43 L 59.28,200.28 L 59.88,203.06 L 60.48,203.68 L 62.28,209.23 L 62.57,212.00 L 61.68,212.93 L 61.08,212.31 L 60.78,211.09 L 60.48,213.86 L 59.28,213.55 L 58.68,211.40 L 58.08,214.79 L 56.89,213.86 L 56.89,211.40 L 56.29,212.00 L 56.59,214.79 L 55.99,215.41 L 55.39,215.41 L 54.49,214.48 L 54.49,212.62 L 53.89,211.70 L 53.89,213.86 L 54.19,214.17 L 53.89,216.03 L 52.99,216.33 L 51.80,215.41 L 51.20,214.17 L 50.90,208.30 L 51.80,203.68 L 51.80,199.67 L 51.20,197.81 L 51.20,196.26 L 51.80,194.10 Z",
      legR: "M 34.73,157.40 L 35.63,157.40 L 36.83,158.07 L 44.61,157.73 L 46.41,158.07 L 47.31,165.82 L 47.01,166.83 L 47.31,169.86 L 45.81,181.30 L 45.51,186.02 L 45.81,192.75 L 45.21,193.43 L 39.82,194.42 L 38.32,194.10 L 37.43,188.72 L 35.93,183.67 L 33.83,172.56 L 34.13,161.11 L 33.83,160.10 L 34.13,158.07 Z",
      legL: "M 50.90,157.06 L 52.40,157.73 L 61.98,157.40 L 62.57,158.07 L 63.47,164.13 L 63.47,171.21 L 62.57,178.62 L 60.78,186.69 L 60.48,190.07 L 59.88,191.40 L 59.58,194.42 L 55.09,194.10 L 51.80,192.75 L 50.90,181.30 L 50.00,175.92 L 50.00,172.56 L 49.40,169.86 L 49.40,164.47 L 50.00,162.45 L 50.30,158.41 Z",
      thighR: "M 31.14,98.64 L 35.03,103.52 L 44.61,113.63 L 44.61,114.64 L 44.01,115.65 L 44.01,119.69 L 44.61,122.05 L 45.81,124.40 L 47.90,125.75 L 48.20,126.43 L 47.31,134.50 L 46.11,156.06 L 44.91,157.40 L 43.11,157.73 L 36.23,157.40 L 34.13,156.06 L 33.53,147.97 L 30.24,135.51 L 28.44,124.06 L 28.44,111.67 L 29.04,105.81 L 30.24,99.94 Z",
      thighL: "M 65.57,98.31 L 66.17,98.96 L 67.07,101.89 L 67.66,105.48 L 67.96,117.34 L 67.07,122.39 L 66.77,129.45 L 65.87,132.49 L 64.67,141.57 L 63.17,148.31 L 62.87,154.37 L 62.28,156.73 L 59.28,157.40 L 51.50,157.06 L 50.90,156.73 L 50.30,155.38 L 50.30,151.33 L 49.40,144.27 L 49.10,133.16 L 48.50,131.14 L 48.50,126.43 L 49.10,125.75 L 50.90,125.41 L 52.40,123.73 L 52.99,122.39 L 53.59,119.69 L 53.59,115.99 L 52.69,113.63 L 54.49,110.69 L 59.28,104.83 Z",
      handR: "M 14.97,105.81 L 16.77,107.76 L 16.47,110.37 L 11.38,121.04 L 9.58,124.06 L 8.38,125.08 L 8.08,124.06 L 9.28,122.39 L 9.88,120.03 L 7.78,124.06 L 6.29,125.75 L 5.39,125.08 L 5.99,124.40 L 8.08,119.69 L 8.08,119.01 L 5.39,124.40 L 4.49,125.41 L 3.59,125.08 L 3.59,123.73 L 5.99,118.68 L 5.39,119.01 L 3.59,123.06 L 2.40,123.39 L 2.69,120.36 L 4.79,115.31 L 5.69,114.30 L 7.49,113.30 L 7.78,112.64 L 4.49,114.30 L 1.80,117.34 L 0.90,117.00 L 1.20,115.65 L 2.40,114.30 L 4.19,111.02 L 5.69,109.39 L 8.98,107.43 L 10.78,104.83 L 12.28,104.50 Z",
      handL: "M 85.33,107.43 L 87.43,106.45 L 89.82,106.45 L 91.62,108.08 L 94.61,109.72 L 96.11,111.35 L 97.01,113.63 L 98.80,116.66 L 98.20,117.66 L 95.21,114.30 L 91.92,112.97 L 92.22,113.63 L 94.91,114.64 L 96.41,116.66 L 98.80,123.39 L 98.50,124.40 L 97.01,123.73 L 95.51,120.70 L 95.51,120.03 L 94.31,118.68 L 94.31,119.35 L 94.91,120.03 L 94.91,120.70 L 97.01,124.74 L 97.01,125.41 L 96.41,126.09 L 95.81,126.09 L 95.21,125.41 L 92.51,119.35 L 91.92,119.01 L 91.92,119.69 L 92.81,121.04 L 94.31,125.08 L 93.41,125.75 L 92.81,125.08 L 91.02,120.36 L 90.42,120.36 L 90.42,121.04 L 92.22,125.08 L 91.32,125.41 L 90.12,124.06 L 88.92,120.70 L 85.63,116.33 L 83.83,112.64 L 83.53,109.39 Z",
      forearmR: "M 20.36,78.76 L 24.55,80.71 L 26.05,82.34 L 26.65,83.65 L 26.65,85.27 L 25.75,90.16 L 24.55,93.75 L 20.66,100.92 L 18.26,104.50 L 17.66,106.45 L 16.77,107.10 L 14.67,105.16 L 12.87,104.18 L 11.68,104.18 L 11.08,103.52 L 11.98,97.98 L 11.98,95.38 L 12.57,92.44 L 13.77,89.19 L 14.67,87.88 L 17.07,81.04 L 18.56,78.76 Z",
      forearmL: "M 76.35,79.09 L 79.94,79.41 L 81.74,82.67 L 85.03,89.84 L 85.63,93.42 L 86.53,95.38 L 88.62,103.52 L 89.22,104.50 L 88.92,105.81 L 86.23,106.45 L 84.13,108.08 L 82.63,108.41 L 81.44,106.13 L 76.95,99.94 L 74.55,96.02 L 73.65,93.42 L 72.46,91.46 L 71.56,88.54 L 70.96,84.30 L 71.56,83.00 L 73.05,81.04 Z",
      upArmR: "M 23.05,48.45 L 23.65,48.45 L 26.35,52.03 L 28.14,56.28 L 29.34,61.82 L 29.64,66.05 L 29.34,73.55 L 28.74,75.50 L 28.44,78.76 L 26.65,82.34 L 23.95,79.73 L 20.36,78.11 L 19.16,78.11 L 18.56,77.46 L 18.86,73.87 L 20.06,68.65 L 20.06,60.51 L 20.66,54.65 L 21.86,50.41 Z",
      upArmL: "M 74.55,48.13 L 76.35,51.07 L 77.84,56.61 L 77.84,69.31 L 78.74,73.55 L 78.74,75.50 L 79.64,77.78 L 79.04,78.44 L 75.75,78.76 L 72.75,80.71 L 71.56,82.34 L 70.06,83.00 L 68.26,78.76 L 67.37,75.17 L 67.07,64.75 L 68.26,59.21 L 69.76,54.65 L 72.16,50.09 L 73.95,48.13 Z",
      genitalia: "M 47.90,112.64 L 51.20,113.30 L 52.99,115.65 L 53.29,118.00 L 52.99,121.04 L 52.10,123.39 L 50.00,125.08 L 47.60,125.08 L 46.11,123.73 L 45.21,122.05 L 44.31,118.34 L 44.31,116.33 L 44.91,114.64 L 45.81,113.63 Z",
      trunkAnt: "M 40.80,38.03 L 44.12,41.10 L 47.06,43.23 L 49.61,43.88 L 51.98,43.17 L 54.41,41.71 L 57.07,40.54 L 60.10,40.34 L 63.67,41.42 L 67.32,43.22 L 70.34,45.23 L 71.91,47.12 L 71.98,49.36 L 70.87,52.75 L 69.21,57.88 L 67.53,64.57 L 66.20,71.75 L 65.41,78.38 L 65.10,83.90 L 65.09,88.62 L 64.90,92.99 L 64.27,97.48 L 63.13,102.19 L 61.13,106.63 L 57.53,110.05 L 51.68,111.58 L 44.82,111.05 L 38.69,108.14 L 34.81,103.17 L 32.73,96.54 L 31.72,89.09 L 31.04,81.22 L 30.42,73.17 L 29.55,65.44 L 28.39,58.62 L 27.13,53.28 L 26.46,49.35 L 26.96,46.57 L 28.92,44.49 L 31.84,42.75 Z",
      neck: "M 49.40,45.11 L 47.06,42.96 L 45.10,40.70 L 43.84,38.54 L 43.50,36.87 L 44.04,36.03 L 45.28,35.93 L 46.97,36.22 L 48.96,36.48 L 51.04,36.48 L 53.03,36.22 L 54.72,35.93 L 55.96,36.03 L 56.50,36.87 L 56.16,38.54 L 54.90,40.70 L 52.94,42.96 L 50.60,45.11 Z",
      head: "M 52.23,2.02 L 56.67,3.70 L 59.20,6.71 L 60.47,10.98 L 60.15,12.15 L 60.47,14.87 L 60.15,17.98 L 60.79,17.98 L 61.43,18.75 L 61.43,20.31 L 60.15,24.19 L 57.62,26.92 L 56.03,30.80 L 54.12,33.52 L 52.54,35.06 L 50.32,36.23 L 48.73,36.62 L 46.51,36.23 L 43.65,34.30 L 40.80,30.80 L 38.89,26.53 L 37.30,24.58 L 36.36,20.31 L 36.68,17.98 L 37.94,17.98 L 37.30,14.87 L 37.30,10.98 L 38.57,6.71 L 41.12,3.70 L 43.97,2.36 Z",
    } },
    back: { vw:100.0, vh:219.7, paths: {
      footL: "M 47.03,189.99 L 47.88,190.33 L 48.73,191.34 L 48.44,192.36 L 46.74,192.03 L 44.48,193.04 L 44.19,193.73 L 44.76,193.73 L 45.89,192.71 L 48.44,193.04 L 49.29,194.40 L 49.29,196.98 L 46.74,203.20 L 46.46,204.74 L 46.74,210.34 L 46.46,211.58 L 45.04,214.07 L 45.61,214.69 L 43.91,216.86 L 43.06,217.17 L 42.49,216.56 L 42.49,215.00 L 41.93,216.24 L 40.79,216.24 L 40.51,214.37 L 40.51,215.00 L 39.66,215.63 L 39.09,215.00 L 39.38,213.44 L 39.09,212.20 L 37.96,213.44 L 38.24,210.96 L 37.11,211.27 L 37.11,210.03 L 37.96,208.47 L 37.96,206.92 L 38.53,204.74 L 40.51,200.08 L 41.08,197.60 L 41.36,193.04 L 42.78,191.01 L 44.48,189.99 Z",
      footR: "M 55.24,190.33 L 56.66,190.33 L 58.07,191.01 L 60.62,194.06 L 60.34,200.08 L 61.47,207.54 L 62.32,209.41 L 61.76,210.34 L 60.62,210.03 L 61.19,210.65 L 61.47,211.90 L 60.91,212.51 L 60.06,211.58 L 60.62,213.14 L 60.06,213.76 L 59.21,212.83 L 59.49,215.31 L 58.64,215.31 L 58.36,214.37 L 57.79,214.07 L 58.36,215.93 L 57.51,216.86 L 56.94,216.86 L 55.52,215.31 L 55.81,214.07 L 55.24,214.07 L 54.11,212.20 L 53.82,211.27 L 53.82,208.17 L 54.11,207.85 L 53.82,202.88 L 52.97,201.64 L 52.97,201.01 L 52.12,200.08 L 51.56,197.91 L 51.84,195.08 L 52.97,193.73 L 54.67,193.04 L 56.66,194.40 L 56.09,193.38 L 53.54,192.36 L 53.54,191.69 L 54.39,190.67 Z",
      legL: "M 37.39,159.14 L 39.38,158.46 L 45.04,158.46 L 48.44,159.14 L 49.86,160.16 L 49.86,162.53 L 50.71,165.93 L 50.99,170.00 L 48.44,189.99 L 44.48,189.66 L 40.79,191.69 L 40.23,186.94 L 38.81,182.54 L 37.68,174.74 L 37.68,172.37 L 37.11,170.00 L 36.83,159.83 Z",
      legR: "M 54.96,159.14 L 56.66,158.81 L 60.62,159.14 L 64.02,160.16 L 64.59,160.84 L 64.87,170.00 L 64.31,177.12 L 63.46,180.17 L 63.46,181.86 L 60.62,192.36 L 60.06,192.36 L 58.36,190.67 L 56.66,189.99 L 55.52,189.99 L 54.11,190.67 L 53.26,188.98 L 52.41,183.21 L 51.27,170.33 L 52.12,164.91 L 52.12,160.84 L 52.69,160.16 Z",
      thighR: "M 50.00,123.21 L 51.30,124.12 L 52.60,124.90 L 53.90,125.56 L 55.21,126.09 L 56.51,126.51 L 57.81,126.81 L 59.11,127.00 L 60.41,127.06 L 61.71,127.00 L 63.01,126.81 L 64.31,126.51 L 65.62,126.09 L 66.92,125.56 L 68.22,124.90 L 69.52,124.12 L 70.82,123.21 L 70.71,123.89 L 70.58,124.57 L 70.43,125.24 L 70.25,125.93 L 70.06,126.61 L 69.86,127.28 L 69.64,127.96 L 69.41,128.64 L 69.17,129.31 L 68.95,129.99 L 68.75,130.68 L 68.56,131.35 L 68.38,132.03 L 68.22,132.71 L 68.07,133.38 L 67.94,134.06 L 67.83,134.73 L 67.74,135.42 L 67.65,136.10 L 67.54,136.77 L 67.40,137.45 L 67.23,138.13 L 67.04,138.80 L 66.86,139.48 L 66.68,140.17 L 66.52,140.84 L 66.36,141.52 L 66.22,142.20 L 66.08,142.87 L 65.94,143.55 L 65.80,144.23 L 65.67,144.90 L 65.56,145.59 L 65.49,146.27 L 65.44,146.94 L 65.39,147.62 L 65.31,148.30 L 65.21,148.97 L 65.08,149.65 L 64.95,150.34 L 64.82,151.01 L 64.72,151.69 L 64.65,152.37 L 64.61,153.04 L 64.59,153.72 L 64.59,154.41 L 64.59,155.08 L 64.59,155.76 L 64.59,156.44 L 64.58,157.11 L 64.55,157.79 L 64.45,158.46 L 64.27,159.14 L 64.02,159.83 L 50.00,159.83 Z",
      thighL: "M 50.00,123.21 L 48.86,124.12 L 47.72,124.90 L 46.57,125.56 L 45.43,126.09 L 44.29,126.51 L 43.15,126.81 L 42.01,127.00 L 40.86,127.06 L 39.72,127.00 L 38.58,126.81 L 37.44,126.51 L 36.30,126.09 L 35.15,125.56 L 34.01,124.90 L 32.87,124.12 L 31.73,123.21 L 31.90,123.89 L 32.05,124.57 L 32.18,125.24 L 32.29,125.93 L 32.41,126.61 L 32.54,127.28 L 32.69,127.96 L 32.84,128.64 L 32.98,129.31 L 33.09,129.99 L 33.18,130.68 L 33.27,131.35 L 33.38,132.03 L 33.50,132.71 L 33.64,133.38 L 33.78,134.06 L 33.92,134.73 L 34.06,135.42 L 34.21,136.10 L 34.35,136.77 L 34.49,137.45 L 34.63,138.13 L 34.77,138.80 L 34.90,139.48 L 35.01,140.17 L 35.09,140.84 L 35.17,141.52 L 35.25,142.20 L 35.36,142.87 L 35.49,143.55 L 35.64,144.23 L 35.80,144.90 L 35.96,145.59 L 36.10,146.27 L 36.21,146.94 L 36.30,147.62 L 36.39,148.30 L 36.51,148.97 L 36.65,149.65 L 36.81,150.34 L 36.96,151.01 L 37.09,151.69 L 37.19,152.37 L 37.26,153.04 L 37.29,153.72 L 37.27,154.41 L 37.22,155.08 L 37.16,155.76 L 37.27,156.44 L 38.00,157.11 L 40.05,157.79 L 43.87,158.46 L 49.01,159.14 L 50.00,159.83 Z",
      handL: "M 15.01,109.80 L 15.58,110.46 L 14.16,113.08 L 13.60,115.75 L 9.63,124.23 L 8.78,125.24 L 7.93,124.91 L 9.92,120.51 L 9.63,119.82 L 7.65,124.57 L 5.67,125.93 L 5.67,124.57 L 8.22,119.14 L 7.65,119.14 L 7.37,120.51 L 5.38,123.89 L 5.10,125.24 L 4.53,125.93 L 3.40,125.93 L 3.68,123.89 L 6.23,118.12 L 5.38,118.81 L 5.10,120.16 L 3.40,123.56 L 2.27,123.56 L 3.12,119.82 L 4.25,117.79 L 4.82,115.75 L 6.23,113.74 L 5.67,113.74 L 2.27,118.47 L 1.42,118.12 L 1.42,117.45 L 3.68,112.75 L 5.67,110.46 L 7.93,108.82 L 9.07,107.18 L 10.20,106.85 L 11.61,108.17 Z",
      handR: "M 84.99,111.44 L 90.37,108.82 L 91.50,108.82 L 91.50,109.48 L 96.03,114.06 L 98.30,119.49 L 97.73,120.84 L 97.17,120.51 L 94.90,116.77 L 94.90,117.45 L 96.60,121.18 L 97.17,124.23 L 97.73,124.91 L 97.73,125.93 L 96.88,126.61 L 96.03,125.59 L 95.47,122.87 L 94.05,119.49 L 93.77,120.16 L 95.18,123.21 L 96.32,127.28 L 95.47,127.96 L 94.90,127.28 L 92.92,122.54 L 91.78,121.52 L 94.33,126.94 L 94.05,127.96 L 93.48,127.96 L 92.07,125.93 L 91.78,124.57 L 90.65,122.54 L 90.08,122.19 L 90.37,123.56 L 91.22,124.57 L 91.78,127.63 L 91.22,127.63 L 89.24,124.91 L 88.67,123.21 L 87.54,121.86 L 86.40,119.49 L 84.70,113.74 Z",
      forearmL: "M 20.68,82.90 L 26.35,86.51 L 28.61,87.50 L 28.61,88.48 L 25.78,94.05 L 20.68,101.93 L 19.26,104.88 L 15.86,109.48 L 15.01,109.48 L 10.76,106.85 L 10.20,106.20 L 10.20,105.54 L 12.18,101.60 L 15.86,89.79 L 16.43,89.13 L 17.28,86.51 L 19.55,83.23 Z",
      forearmR: "M 81.87,81.27 L 82.44,81.27 L 83.00,81.91 L 86.69,90.77 L 86.69,91.76 L 87.54,93.73 L 88.67,98.97 L 88.67,100.62 L 90.65,106.85 L 90.65,107.83 L 89.80,108.82 L 84.99,111.11 L 84.14,110.12 L 83.57,108.17 L 80.74,102.91 L 76.49,96.68 L 74.50,92.08 L 72.80,86.51 L 73.09,85.20 L 75.07,84.87 L 75.92,84.22 L 77.05,84.22 L 78.19,83.23 L 81.30,81.91 Z",
      upArmL: "M 26.63,49.44 L 29.46,53.38 L 31.73,57.64 L 33.14,61.26 L 34.56,67.81 L 34.28,73.06 L 32.86,76.34 L 30.59,83.88 L 29.46,86.51 L 28.33,86.84 L 20.68,82.57 L 20.40,80.93 L 20.96,79.95 L 21.25,77.33 L 22.10,74.70 L 23.80,65.84 L 24.08,55.01 L 25.50,50.75 Z",
      upArmR: "M 78.47,49.11 L 79.32,50.43 L 80.17,55.35 L 79.60,62.24 L 79.60,67.81 L 80.17,74.38 L 80.74,77.33 L 81.87,79.62 L 81.87,80.61 L 81.02,81.59 L 74.79,84.54 L 73.09,84.87 L 72.24,84.54 L 71.95,83.88 L 71.95,82.90 L 71.39,81.91 L 71.10,79.95 L 70.25,77.98 L 70.25,76.34 L 69.69,75.02 L 69.41,73.39 L 69.69,66.50 L 70.54,62.89 L 72.80,56.98 L 76.20,51.08 L 77.62,49.44 Z",
      buttockR: "M 50.00,97.99 L 69.12,97.99 L 69.48,98.65 L 69.78,99.31 L 70.00,99.96 L 70.18,100.62 L 70.32,101.28 L 70.46,101.93 L 70.59,102.59 L 70.71,103.25 L 70.82,103.89 L 70.92,104.55 L 71.01,105.21 L 71.10,105.86 L 71.20,106.52 L 71.28,107.18 L 71.35,107.83 L 71.42,108.49 L 71.49,109.15 L 71.56,109.80 L 71.62,110.46 L 71.65,111.11 L 71.67,111.77 L 71.67,112.43 L 71.67,113.08 L 71.67,113.74 L 71.67,114.40 L 71.67,115.07 L 71.67,115.75 L 71.67,116.44 L 71.67,117.11 L 71.65,117.79 L 71.62,118.47 L 71.55,119.14 L 71.44,119.82 L 71.33,120.51 L 71.21,121.18 L 71.09,121.86 L 70.96,122.54 L 70.82,123.21 L 70.82,123.21 L 69.52,124.12 L 68.22,124.90 L 66.92,125.56 L 65.62,126.09 L 64.31,126.51 L 63.01,126.81 L 61.71,127.00 L 60.41,127.06 L 59.11,127.00 L 57.81,126.81 L 56.51,126.51 L 55.21,126.09 L 53.90,125.56 L 52.60,124.90 L 51.30,124.12 L 50.00,123.21 Z",
      buttockL: "M 50.00,97.99 L 34.28,97.99 L 33.89,98.65 L 33.57,99.31 L 33.35,99.96 L 33.22,100.62 L 33.16,101.28 L 33.13,101.93 L 33.07,102.59 L 32.98,103.25 L 32.84,103.89 L 32.68,104.55 L 32.52,105.21 L 32.37,105.86 L 32.24,106.52 L 32.12,107.18 L 32.01,107.83 L 31.92,108.49 L 31.84,109.15 L 31.76,109.80 L 31.69,110.46 L 31.63,111.11 L 31.57,111.77 L 31.55,112.43 L 31.57,113.08 L 31.62,113.74 L 31.67,114.40 L 31.69,115.07 L 31.67,115.75 L 31.62,116.44 L 31.55,117.11 L 31.50,117.79 L 31.46,118.47 L 31.45,119.14 L 31.46,119.82 L 31.50,120.51 L 31.55,121.18 L 31.62,121.86 L 31.68,122.54 L 31.73,123.21 L 31.73,123.21 L 32.87,124.12 L 34.01,124.90 L 35.15,125.56 L 36.30,126.09 L 37.44,126.51 L 38.58,126.81 L 39.72,127.00 L 40.86,127.06 L 42.01,127.00 L 43.15,126.81 L 44.29,126.51 L 45.43,126.09 L 46.57,125.56 L 47.72,124.90 L 48.86,124.12 L 50.00,123.21 Z",
      trunkPost: "M 28.46,46.77 L 30.86,44.40 L 41.45,37.96 L 45.05,34.13 L 45.64,34.13 L 48.35,36.09 L 51.35,36.88 L 56.16,36.48 L 59.16,35.31 L 59.76,34.53 L 60.66,34.53 L 60.96,35.31 L 63.37,37.61 L 75.67,44.73 L 77.77,47.78 L 75.35,51.41 L 72.52,56.66 L 69.97,63.55 L 69.12,67.49 L 68.84,74.38 L 68.27,76.34 L 68.27,83.23 L 68.84,86.51 L 68.84,90.11 L 69.69,93.73 L 69.69,97.00 L 69.12,97.66 L 66.86,98.32 L 62.04,98.65 L 40.51,98.65 L 37.11,98.32 L 34.84,97.66 L 33.99,97.00 L 33.71,96.36 L 35.98,82.25 L 35.13,76.01 L 35.13,68.79 L 34.28,63.55 L 32.29,57.64 L 29.75,52.72 L 26.91,49.11 L 26.91,48.46 Z",
      neck: "M 59.76,28.66 L 60.06,33.36 L 59.16,34.53 L 57.36,35.71 L 53.15,36.48 L 48.65,35.71 L 46.25,34.13 L 45.35,32.96 L 45.64,28.66 L 47.15,27.88 L 52.85,27.09 L 58.26,27.88 Z",
      head: "M 44.15,6.37 L 45.64,4.41 L 47.45,3.39 L 51.65,2.37 L 56.75,2.72 L 60.66,4.41 L 62.47,6.75 L 63.66,11.06 L 63.37,16.53 L 63.66,18.87 L 64.56,19.66 L 62.76,25.92 L 62.16,26.70 L 60.96,26.70 L 60.06,27.88 L 53.75,26.70 L 48.65,27.09 L 46.85,27.88 L 45.05,27.49 L 44.74,26.32 L 43.25,26.32 L 42.35,24.74 L 42.35,23.18 L 41.14,20.05 L 41.45,18.49 L 42.64,18.10 L 42.04,16.53 L 42.04,12.23 L 42.35,10.27 Z",
    } },
  },
  adult: {
    front: { vw:100.0, vh:194.0, paths: {
      head: "M 52.10,1.80 L 56.29,3.29 L 58.68,5.69 L 59.88,8.98 L 59.58,9.88 L 59.88,11.98 L 59.58,14.37 L 60.18,14.37 L 60.78,14.97 L 60.78,16.17 L 59.58,19.16 L 57.19,21.26 L 55.69,24.25 L 53.89,26.35 L 52.40,27.54 L 50.30,28.44 L 48.80,28.74 L 46.71,28.44 L 44.01,26.95 L 41.32,24.25 L 39.52,20.96 L 38.02,19.46 L 37.13,16.17 L 37.43,14.37 L 38.62,14.37 L 38.02,11.98 L 38.02,8.98 L 39.22,5.69 L 41.62,3.29 L 44.31,2.10 Z",
      neck: "M 56.29,28.44 L 56.29,29.64 L 55.39,31.14 L 51.20,35.33 L 49.40,36.23 L 47.31,35.33 L 44.31,32.93 L 41.92,29.64 L 42.51,26.35 L 44.31,27.84 L 44.91,27.84 L 46.11,28.74 L 49.70,29.04 L 51.80,28.44 L 55.69,26.05 Z",
      trunkAnt: "M 41.32,29.94 L 44.91,34.13 L 48.20,36.23 L 49.40,36.53 L 51.50,35.63 L 54.19,33.23 L 56.89,29.94 L 58.98,31.14 L 60.48,31.44 L 68.86,35.03 L 72.75,37.13 L 73.65,38.02 L 73.35,38.92 L 71.56,40.72 L 68.86,45.81 L 66.77,52.99 L 66.17,61.98 L 64.37,69.16 L 64.67,72.46 L 65.27,74.55 L 65.57,82.04 L 65.27,83.83 L 64.07,85.63 L 54.19,95.81 L 52.10,98.80 L 50.30,97.90 L 47.31,97.90 L 45.21,98.80 L 35.93,90.12 L 30.84,83.83 L 30.84,76.05 L 32.04,70.06 L 30.24,63.47 L 29.94,51.80 L 29.04,47.31 L 27.25,42.81 L 23.95,38.32 L 25.45,36.83 L 27.25,35.93 L 32.34,34.13 Z",
      genitalia: "M 47.90,98.20 L 51.20,98.80 L 52.99,100.90 L 53.29,102.99 L 52.99,105.69 L 52.10,107.78 L 50.00,109.28 L 47.60,109.28 L 46.11,108.08 L 45.21,106.59 L 44.31,103.29 L 44.31,101.50 L 44.91,100.00 L 45.81,99.10 Z",
      thighL: "M 65.57,85.03 L 66.17,85.63 L 67.07,88.32 L 67.66,91.62 L 67.96,102.40 L 67.07,106.89 L 66.77,113.17 L 65.87,115.87 L 64.67,123.95 L 63.17,129.94 L 62.87,135.33 L 62.28,137.43 L 59.28,138.02 L 51.50,137.72 L 50.90,137.43 L 50.30,136.23 L 50.30,132.63 L 49.40,126.35 L 49.10,116.47 L 48.50,114.67 L 48.50,110.48 L 49.10,109.88 L 50.90,109.58 L 52.40,108.08 L 52.99,106.89 L 53.59,104.49 L 53.59,101.20 L 52.69,99.10 L 54.49,96.41 L 59.28,91.02 Z",
      thighR: "M 31.14,85.33 L 35.03,89.82 L 44.61,99.10 L 44.61,100.00 L 44.01,100.90 L 44.01,104.49 L 44.61,106.59 L 45.81,108.68 L 47.90,109.88 L 48.20,110.48 L 47.31,117.66 L 46.11,136.83 L 44.91,138.02 L 43.11,138.32 L 36.23,138.02 L 34.13,136.83 L 33.53,129.64 L 30.24,118.56 L 28.44,108.38 L 28.44,97.31 L 29.04,91.92 L 30.24,86.53 Z",
      legL: "M 50.90,137.72 L 52.40,138.32 L 61.98,138.02 L 62.57,138.62 L 63.47,144.01 L 63.47,150.30 L 62.57,156.89 L 60.78,164.07 L 60.48,167.07 L 59.88,168.26 L 59.58,170.96 L 55.09,170.66 L 51.80,169.46 L 50.90,159.28 L 50.00,154.49 L 50.00,151.50 L 49.40,149.10 L 49.40,144.31 L 50.00,142.51 L 50.30,138.92 Z",
      legR: "M 34.73,138.02 L 35.63,138.02 L 36.83,138.62 L 44.61,138.32 L 46.41,138.62 L 47.31,145.51 L 47.01,146.41 L 47.31,149.10 L 45.81,159.28 L 45.51,163.47 L 45.81,169.46 L 45.21,170.06 L 39.82,170.96 L 38.32,170.66 L 37.43,165.87 L 35.93,161.38 L 33.83,151.50 L 34.13,141.32 L 33.83,140.42 L 34.13,138.62 Z",
      footL: "M 53.29,170.36 L 56.59,171.26 L 58.98,171.26 L 59.58,171.86 L 59.88,174.85 L 59.28,176.65 L 59.88,179.34 L 60.48,179.94 L 62.28,185.33 L 62.57,188.02 L 61.68,188.92 L 61.08,188.32 L 60.78,187.13 L 60.48,189.82 L 59.28,189.52 L 58.68,187.43 L 58.08,190.72 L 56.89,189.82 L 56.89,187.43 L 56.29,188.02 L 56.59,190.72 L 55.99,191.32 L 55.39,191.32 L 54.49,190.42 L 54.49,188.62 L 53.89,187.72 L 53.89,189.82 L 54.19,190.12 L 53.89,191.92 L 52.99,192.22 L 51.80,191.32 L 51.20,190.12 L 50.90,184.43 L 51.80,179.94 L 51.80,176.05 L 51.20,174.25 L 51.20,172.75 L 51.80,170.66 Z",
      footR: "M 38.92,171.26 L 45.51,170.36 L 46.41,171.56 L 46.71,173.65 L 46.11,175.45 L 46.11,178.74 L 47.31,182.34 L 47.90,185.63 L 47.60,190.12 L 46.41,192.22 L 45.21,192.22 L 44.61,191.62 L 44.61,189.82 L 44.91,189.52 L 44.61,187.72 L 44.31,189.82 L 43.41,191.32 L 42.51,191.02 L 42.22,190.42 L 42.51,188.32 L 42.22,187.13 L 41.32,190.42 L 40.12,190.12 L 39.82,189.52 L 40.12,186.53 L 38.92,189.52 L 38.32,188.92 L 38.02,186.23 L 37.13,188.32 L 36.53,187.72 L 36.83,183.83 L 37.43,182.93 L 38.32,178.44 L 38.02,173.65 L 38.32,171.86 Z",
      upArmL: "M 74.55,38.92 L 76.35,41.62 L 77.84,46.71 L 77.84,58.38 L 78.74,62.28 L 78.74,64.07 L 79.64,66.17 L 79.04,66.77 L 75.75,67.07 L 72.75,68.86 L 71.56,70.36 L 70.06,70.96 L 68.26,67.07 L 67.37,63.77 L 67.07,54.19 L 68.26,49.10 L 69.76,44.91 L 72.16,40.72 L 73.95,38.92 Z",
      upArmR: "M 23.05,39.22 L 23.65,39.22 L 26.35,42.51 L 28.14,46.41 L 29.34,51.50 L 29.64,55.39 L 29.34,62.28 L 28.74,64.07 L 28.44,67.07 L 26.65,70.36 L 23.95,67.96 L 20.36,66.47 L 19.16,66.47 L 18.56,65.87 L 18.86,62.57 L 20.06,57.78 L 20.06,50.30 L 20.66,44.91 L 21.86,41.02 Z",
      forearmL: "M 76.35,67.37 L 79.94,67.66 L 81.74,70.66 L 85.03,77.25 L 85.63,80.54 L 86.53,82.34 L 88.62,89.82 L 89.22,90.72 L 88.92,91.92 L 86.23,92.51 L 84.13,94.01 L 82.63,94.31 L 81.44,92.22 L 76.95,86.53 L 74.55,82.93 L 73.65,80.54 L 72.46,78.74 L 71.56,76.05 L 70.96,72.16 L 71.56,70.96 L 73.05,69.16 Z",
      forearmR: "M 20.36,67.07 L 24.55,68.86 L 26.05,70.36 L 26.65,71.56 L 26.65,73.05 L 25.75,77.54 L 24.55,80.84 L 20.66,87.43 L 18.26,90.72 L 17.66,92.51 L 16.77,93.11 L 14.67,91.32 L 12.87,90.42 L 11.68,90.42 L 11.08,89.82 L 11.98,84.73 L 11.98,82.34 L 12.57,79.64 L 13.77,76.65 L 14.67,75.45 L 17.07,69.16 L 18.56,67.07 Z",
      handL: "M 85.33,93.41 L 87.43,92.51 L 89.82,92.51 L 91.62,94.01 L 94.61,95.51 L 96.11,97.01 L 97.01,99.10 L 98.80,101.80 L 98.20,102.69 L 95.21,99.70 L 91.92,98.50 L 92.22,99.10 L 94.91,100.00 L 96.41,101.80 L 98.80,107.78 L 98.50,108.68 L 97.01,108.08 L 95.51,105.39 L 95.51,104.79 L 94.31,103.59 L 94.31,104.19 L 94.91,104.79 L 94.91,105.39 L 97.01,108.98 L 97.01,109.58 L 96.41,110.18 L 95.81,110.18 L 95.21,109.58 L 92.51,104.19 L 91.92,103.89 L 91.92,104.49 L 92.81,105.69 L 94.31,109.28 L 93.41,109.88 L 92.81,109.28 L 91.02,105.09 L 90.42,105.09 L 90.42,105.69 L 92.22,109.28 L 91.32,109.58 L 90.12,108.38 L 88.92,105.39 L 85.63,101.50 L 83.83,98.20 L 83.53,95.21 Z",
      handR: "M 14.97,91.92 L 16.77,93.71 L 16.47,96.11 L 11.38,105.69 L 9.58,108.38 L 8.38,109.28 L 8.08,108.38 L 9.28,106.89 L 9.88,104.79 L 7.78,108.38 L 6.29,109.88 L 5.39,109.28 L 5.99,108.68 L 8.08,104.49 L 8.08,103.89 L 5.39,108.68 L 4.49,109.58 L 3.59,109.28 L 3.59,108.08 L 5.99,103.59 L 5.39,103.89 L 3.59,107.49 L 2.40,107.78 L 2.69,105.09 L 4.79,100.60 L 5.69,99.70 L 7.49,98.80 L 7.78,98.20 L 4.49,99.70 L 1.80,102.40 L 0.90,102.10 L 1.20,100.90 L 2.40,99.70 L 4.19,96.71 L 5.69,95.21 L 8.98,93.41 L 10.78,91.02 L 12.28,90.72 Z",
    } },
    back: { vw:100.0, vh:183.6, paths: {
      footL: "M 47.03,156.94 L 47.88,157.22 L 48.73,158.07 L 48.44,158.92 L 46.74,158.64 L 44.48,159.49 L 44.19,160.06 L 44.76,160.06 L 45.89,159.21 L 48.44,159.49 L 49.29,160.62 L 49.29,162.89 L 46.74,168.56 L 46.46,169.97 L 46.74,175.07 L 46.46,176.20 L 45.04,178.47 L 45.61,179.04 L 43.91,181.02 L 43.06,181.30 L 42.49,180.74 L 42.49,179.32 L 41.93,180.45 L 40.79,180.45 L 40.51,178.75 L 40.51,179.32 L 39.66,179.89 L 39.09,179.32 L 39.38,177.90 L 39.09,176.77 L 37.96,177.90 L 38.24,175.64 L 37.11,175.92 L 37.11,174.79 L 37.96,173.37 L 37.96,171.95 L 38.53,169.97 L 40.51,165.72 L 41.08,163.46 L 41.36,159.49 L 42.78,157.79 L 44.48,156.94 Z",
      footR: "M 55.24,157.22 L 56.66,157.22 L 58.07,157.79 L 60.62,160.34 L 60.34,165.72 L 61.47,172.52 L 62.32,174.22 L 61.76,175.07 L 60.62,174.79 L 61.19,175.35 L 61.47,176.49 L 60.91,177.05 L 60.06,176.20 L 60.62,177.62 L 60.06,178.19 L 59.21,177.34 L 59.49,179.60 L 58.64,179.60 L 58.36,178.75 L 57.79,178.47 L 58.36,180.17 L 57.51,181.02 L 56.94,181.02 L 55.52,179.60 L 55.81,178.47 L 55.24,178.47 L 54.11,176.77 L 53.82,175.92 L 53.82,173.09 L 54.11,172.80 L 53.82,168.27 L 52.97,167.14 L 52.97,166.57 L 52.12,165.72 L 51.56,163.74 L 51.84,161.19 L 52.97,160.06 L 54.67,159.49 L 56.66,160.62 L 56.09,159.77 L 53.54,158.92 L 53.54,158.36 L 54.39,157.51 Z",
      legL: "M 37.39,131.16 L 39.38,130.59 L 45.04,130.59 L 48.44,131.16 L 49.86,132.01 L 49.86,133.99 L 50.71,136.83 L 50.99,140.23 L 48.44,156.94 L 44.48,156.66 L 40.79,158.36 L 40.23,154.39 L 38.81,150.71 L 37.68,144.19 L 37.68,142.21 L 37.11,140.23 L 36.83,131.73 Z",
      legR: "M 54.96,131.16 L 56.66,130.88 L 60.62,131.16 L 64.02,132.01 L 64.59,132.58 L 64.87,140.23 L 64.31,146.18 L 63.46,148.73 L 63.46,150.14 L 60.62,158.92 L 60.06,158.92 L 58.36,157.51 L 56.66,156.94 L 55.52,156.94 L 54.11,157.51 L 53.26,156.09 L 52.41,151.27 L 51.27,140.51 L 52.12,135.98 L 52.12,132.58 L 52.69,132.01 Z",
      thighL: "M 50.00,101.13 Q 40.86,107.56 31.73,101.13 L 31.90,101.70 L 32.05,102.27 L 32.18,102.83 L 32.29,103.40 L 32.41,103.97 L 32.54,104.53 L 32.69,105.10 L 32.84,105.67 L 32.98,106.23 L 33.09,106.80 L 33.18,107.37 L 33.27,107.93 L 33.38,108.50 L 33.50,109.07 L 33.64,109.63 L 33.78,110.20 L 33.92,110.76 L 34.06,111.33 L 34.21,111.90 L 34.35,112.46 L 34.49,113.03 L 34.63,113.60 L 34.77,114.16 L 34.90,114.73 L 35.01,115.30 L 35.09,115.86 L 35.17,116.43 L 35.25,117.00 L 35.36,117.56 L 35.49,118.13 L 35.64,118.70 L 35.80,119.26 L 35.96,119.83 L 36.10,120.40 L 36.21,120.96 L 36.30,121.53 L 36.39,122.10 L 36.51,122.66 L 36.65,123.23 L 36.81,123.80 L 36.96,124.36 L 37.09,124.93 L 37.19,125.50 L 37.26,126.06 L 37.29,126.63 L 37.27,127.20 L 37.22,127.76 L 37.16,128.33 L 37.27,128.90 L 38.00,129.46 L 40.05,130.03 L 43.87,130.59 L 49.01,131.16 L 50.00,131.73 L 50.00,101.13 Z",
      thighR: "M 50.00,101.13 Q 60.41,107.56 70.82,101.13 L 70.71,101.70 L 70.58,102.27 L 70.43,102.83 L 70.25,103.40 L 70.06,103.97 L 69.86,104.53 L 69.64,105.10 L 69.41,105.67 L 69.17,106.23 L 68.95,106.80 L 68.75,107.37 L 68.56,107.93 L 68.38,108.50 L 68.22,109.07 L 68.07,109.63 L 67.94,110.20 L 67.83,110.76 L 67.74,111.33 L 67.65,111.90 L 67.54,112.46 L 67.40,113.03 L 67.23,113.60 L 67.04,114.16 L 66.86,114.73 L 66.68,115.30 L 66.52,115.86 L 66.36,116.43 L 66.22,117.00 L 66.08,117.56 L 65.94,118.13 L 65.80,118.70 L 65.67,119.26 L 65.56,119.83 L 65.49,120.40 L 65.44,120.96 L 65.39,121.53 L 65.31,122.10 L 65.21,122.66 L 65.08,123.23 L 64.95,123.80 L 64.82,124.36 L 64.72,124.93 L 64.65,125.50 L 64.61,126.06 L 64.59,126.63 L 64.59,127.20 L 64.59,127.76 L 64.59,128.33 L 64.59,128.90 L 64.58,129.46 L 64.55,130.03 L 64.45,130.59 L 64.27,131.16 L 64.02,131.73 L 50.00,131.73 L 50.00,101.13 Z",
      handL: "M 15.01,89.80 L 15.58,90.37 L 14.16,92.63 L 13.60,94.90 L 9.63,101.98 L 8.78,102.83 L 7.93,102.55 L 9.92,98.87 L 9.63,98.30 L 7.65,102.27 L 5.67,103.40 L 5.67,102.27 L 8.22,97.73 L 7.65,97.73 L 7.37,98.87 L 5.38,101.70 L 5.10,102.83 L 4.53,103.40 L 3.40,103.40 L 3.68,101.70 L 6.23,96.88 L 5.38,97.45 L 5.10,98.58 L 3.40,101.42 L 2.27,101.42 L 3.12,98.30 L 4.25,96.60 L 4.82,94.90 L 6.23,93.20 L 5.67,93.20 L 2.27,97.17 L 1.42,96.88 L 1.42,96.32 L 3.68,92.35 L 5.67,90.37 L 7.93,88.95 L 9.07,87.54 L 10.20,87.25 L 11.61,88.39 Z",
      handR: "M 84.99,91.22 L 90.37,88.95 L 91.50,88.95 L 91.50,89.52 L 96.03,93.48 L 98.30,98.02 L 97.73,99.15 L 97.17,98.87 L 94.90,95.75 L 94.90,96.32 L 96.60,99.43 L 97.17,101.98 L 97.73,102.55 L 97.73,103.40 L 96.88,103.97 L 96.03,103.12 L 95.47,100.85 L 94.05,98.02 L 93.77,98.58 L 95.18,101.13 L 96.32,104.53 L 95.47,105.10 L 94.90,104.53 L 92.92,100.57 L 91.78,99.72 L 94.33,104.25 L 94.05,105.10 L 93.48,105.10 L 92.07,103.40 L 91.78,102.27 L 90.65,100.57 L 90.08,100.28 L 90.37,101.42 L 91.22,102.27 L 91.78,104.82 L 91.22,104.82 L 89.24,102.55 L 88.67,101.13 L 87.54,100.00 L 86.40,98.02 L 84.70,93.20 Z",
      forearmL: "M 20.68,66.57 L 26.35,69.69 L 28.61,70.54 L 28.61,71.39 L 25.78,76.20 L 20.68,83.00 L 19.26,85.55 L 15.86,89.52 L 15.01,89.52 L 10.76,87.25 L 10.20,86.69 L 10.20,86.12 L 12.18,82.72 L 15.86,72.52 L 16.43,71.95 L 17.28,69.69 L 19.55,66.86 Z",
      forearmR: "M 81.87,65.16 L 82.44,65.16 L 83.00,65.72 L 86.69,73.37 L 86.69,74.22 L 87.54,75.92 L 88.67,80.45 L 88.67,81.87 L 90.65,87.25 L 90.65,88.10 L 89.80,88.95 L 84.99,90.93 L 84.14,90.08 L 83.57,88.39 L 80.74,83.85 L 76.49,78.47 L 74.50,74.50 L 72.80,69.69 L 73.09,68.56 L 75.07,68.27 L 75.92,67.71 L 77.05,67.71 L 78.19,66.86 L 81.30,65.72 Z",
      upArmL: "M 26.63,37.68 L 29.46,41.08 L 31.73,44.76 L 33.14,47.88 L 34.56,53.54 L 34.28,58.07 L 32.86,60.91 L 30.59,67.42 L 29.46,69.69 L 28.33,69.97 L 20.68,66.29 L 20.40,64.87 L 20.96,64.02 L 21.25,61.76 L 22.10,59.49 L 23.80,51.84 L 24.08,42.49 L 25.50,38.81 Z",
      upArmR: "M 78.47,37.39 L 79.32,38.53 L 80.17,42.78 L 79.60,48.73 L 79.60,53.54 L 80.17,59.21 L 80.74,61.76 L 81.87,63.74 L 81.87,64.59 L 81.02,65.44 L 74.79,67.99 L 73.09,68.27 L 72.24,67.99 L 71.95,67.42 L 71.95,66.57 L 71.39,65.72 L 71.10,64.02 L 70.25,62.32 L 70.25,60.91 L 69.69,59.77 L 69.41,58.36 L 69.69,52.41 L 70.54,49.29 L 72.80,44.19 L 76.20,39.09 L 77.62,37.68 Z",
      buttockL: "M 50.00,79.60 L 34.28,79.60 L 33.89,80.17 L 33.57,80.74 L 33.35,81.30 L 33.22,81.87 L 33.16,82.44 L 33.13,83.00 L 33.07,83.57 L 32.98,84.14 L 32.84,84.70 L 32.68,85.27 L 32.52,85.84 L 32.37,86.40 L 32.24,86.97 L 32.12,87.54 L 32.01,88.10 L 31.92,88.67 L 31.84,89.24 L 31.76,89.80 L 31.69,90.37 L 31.63,90.93 L 31.57,91.50 L 31.55,92.07 L 31.57,92.63 L 31.62,93.20 L 31.67,93.77 L 31.69,94.33 L 31.67,94.90 L 31.62,95.47 L 31.55,96.03 L 31.50,96.60 L 31.46,97.17 L 31.45,97.73 L 31.46,98.30 L 31.50,98.87 L 31.55,99.43 L 31.62,100.00 L 31.68,100.57 L 31.73,101.13 Q 40.86,107.56 50.00,101.13 L 50.00,79.60 Z",
      buttockR: "M 50.00,79.60 L 69.12,79.60 L 69.48,80.17 L 69.78,80.74 L 70.00,81.30 L 70.18,81.87 L 70.32,82.44 L 70.46,83.00 L 70.59,83.57 L 70.71,84.14 L 70.82,84.70 L 70.92,85.27 L 71.01,85.84 L 71.10,86.40 L 71.20,86.97 L 71.28,87.54 L 71.35,88.10 L 71.42,88.67 L 71.49,89.24 L 71.56,89.80 L 71.62,90.37 L 71.65,90.93 L 71.67,91.50 L 71.67,92.07 L 71.67,92.63 L 71.67,93.20 L 71.67,93.77 L 71.67,94.33 L 71.67,94.90 L 71.67,95.47 L 71.67,96.03 L 71.65,96.60 L 71.62,97.17 L 71.55,97.73 L 71.44,98.30 L 71.33,98.87 L 71.21,99.43 L 71.09,100.00 L 70.96,100.57 L 70.82,101.13 Q 60.41,107.56 50.00,101.13 L 50.00,79.60 Z",
      trunkPost: "M 28.33,35.41 L 31.16,33.43 L 41.93,28.05 L 45.33,25.21 L 45.89,25.21 L 48.44,26.63 L 51.27,27.20 L 55.81,26.91 L 58.64,26.06 L 59.21,25.50 L 60.06,25.50 L 60.34,26.06 L 62.61,27.76 L 75.35,33.71 L 78.19,36.26 L 75.35,39.38 L 72.52,43.91 L 69.97,49.86 L 69.12,53.26 L 68.84,59.21 L 68.27,60.91 L 68.27,66.86 L 68.84,69.69 L 68.84,72.80 L 69.69,75.92 L 69.69,78.75 L 69.12,79.32 L 66.86,79.89 L 62.04,80.17 L 40.51,80.17 L 37.11,79.89 L 34.84,79.32 L 33.99,78.75 L 33.71,78.19 L 35.98,66.01 L 35.13,60.62 L 35.13,54.39 L 34.28,49.86 L 32.29,44.76 L 29.75,40.51 L 26.91,37.39 L 26.91,36.83 Z",
      neck: "M 59.21,21.25 L 59.49,24.65 L 58.64,25.50 L 56.94,26.35 L 52.97,26.91 L 48.73,26.35 L 46.46,25.21 L 45.61,24.36 L 45.89,21.25 L 47.31,20.68 L 52.69,20.11 L 57.79,20.68 Z",
      head: "M 44.48,5.10 L 45.89,3.68 L 47.59,2.83 L 51.56,1.98 L 56.37,2.27 L 60.06,3.68 L 61.76,5.38 L 62.89,8.50 L 62.61,12.46 L 62.89,14.16 L 63.74,14.73 L 62.04,19.26 L 61.47,19.83 L 60.34,19.83 L 59.49,20.68 L 53.54,19.83 L 48.73,20.11 L 47.03,20.68 L 45.33,20.40 L 45.04,19.55 L 43.63,19.55 L 42.78,18.41 L 42.78,17.28 L 41.64,15.01 L 41.93,13.88 L 43.06,13.60 L 42.49,12.46 L 42.49,9.35 L 42.78,7.93 Z",
    } },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: BURN FLUID RESUSCITATION (PARKLAND / GALVESTON + LUND-BROWDER)
// ═══════════════════════════════════════════════════════════════════════════════
function BurnsCalc() {
  const AGE_BANDS = [
    { label: "0–1 y",   lbIdx: 0, img: "baby"  },
    { label: "1–4 y",   lbIdx: 1, img: "child" },
    { label: "5–9 y",   lbIdx: 2, img: "child" },
    { label: "10–14 y", lbIdx: 3, img: "child" },
    { label: "15–18 y", lbIdx: 4, img: "adult" },
    { label: "Adult",   lbIdx: 5, img: "adult" },
  ];

  const LB = {
    head:      [9.5,  8.5,  6.5,  5.5,  4.5,  3.5],
    neck:      [1,    1,    1,    1,    1,    1  ],  // per surface (was doubled)
    trunkAnt:  [13,   13,   13,   13,   13,   13 ],
    trunkPost: [13,   13,   13,   13,   13,   13 ],
    genitalia: [1,    1,    1,    1,    1,    1  ],
    upArmL:    [2,    2,    2,    2,    2,    2  ],  // per surface (was doubled)
    upArmR:    [2,    2,    2,    2,    2,    2  ],  // per surface (was doubled)
    forearmL:  [1.5,  1.5,  1.5,  1.5,  1.5,  1.5],  // per surface (was doubled)
    forearmR:  [1.5,  1.5,  1.5,  1.5,  1.5,  1.5],  // per surface (was doubled)
    handL:     [1.25, 1.25, 1.25, 1.25, 1.25, 1.25],  // per surface (was doubled)
    handR:     [1.25, 1.25, 1.25, 1.25, 1.25, 1.25],  // per surface (was doubled)
    buttockL:  [2.5,  2.5,  2.5,  2.5,  2.5,  2.5],
    buttockR:  [2.5,  2.5,  2.5,  2.5,  2.5,  2.5],
    thighL:    [2.75, 3.25, 4.0,  4.25, 4.5,  4.75],
    thighR:    [2.75, 3.25, 4.0,  4.25, 4.5,  4.75],
    legL:      [2.5,  2.5,  2.75, 3.0,  3.25, 3.5],
    legR:      [2.5,  2.5,  2.75, 3.0,  3.25, 3.5],
    footL:     [1.75, 1.75, 1.75, 1.75, 1.75, 1.75],  // per surface (was doubled)
    footR:     [1.75, 1.75, 1.75, 1.75, 1.75, 1.75],  // per surface (was doubled)
  };

  const ZONE_LABELS = {
    head:"Head", neck:"Neck", trunkAnt:"Trunk Ant.", trunkPost:"Trunk Post.",
    genitalia:"Genitalia", upArmL:"Arm L", upArmR:"Arm R",
    forearmL:"Forearm L", forearmR:"Forearm R", handL:"Hand L", handR:"Hand R",
    buttockL:"Buttock L", buttockR:"Buttock R",
    thighL:"Thigh L", thighR:"Thigh R", legL:"Leg L", legR:"Leg R",
    footL:"Foot L", footR:"Foot R",
  };

  const BURN_ZONE_COLORS = {
    head:"#f5d485", thighR:"#a8c8e8", thighL:"#a8c8e8",
    legR:"#a8d4a8", legL:"#a8d4a8", _default:"#e8eaed",
  };
  const RENDER_ORDER = ["footL","footR","legL","legR","thighL","thighR","handL","handR","forearmL","forearmR","upArmL","upArmR","buttockL","buttockR","genitalia","trunkAnt","trunkPost","neck","head"];
  const zoneCol = (n) => BURN_ZONE_COLORS[n] || BURN_ZONE_COLORS._default;

  const FRACS = [{label:"¼",val:25},{label:"½",val:50},{label:"¾",val:75},{label:"All",val:100}];

  const [ageIdx, setAgeIdx] = useState(0);
  const [weight, setWeight] = useState(10);
  const [height, setHeight] = useState(75);
  const [formula, setFormula] = useState("parkland");
  const initBurns = () => {
    const init = {};
    Object.keys(LB).forEach(z => { init[z] = { partial:0, full:0 }; });
    return init;
  };
  const [burnsFront, setBurnsFront] = useState(initBurns);
  const [burnsBack,  setBurnsBack]  = useState(initBurns);
  const [activeZone, setActiveZone] = useState(null);
  const [activeSide, setActiveSide] = useState("front");

  const band = AGE_BANDS[ageIdx];
  const lbIdx = band.lbIdx;
  const imgVariant = band.img;

  const getBurns = (side) => side === "front" ? burnsFront : burnsBack;
  const setBurnSide = (side, zone, depth, val) => {
    const setter = side === "front" ? setBurnsFront : setBurnsBack;
    const other  = depth === "partial" ? "full" : "partial";
    setter(b => {
      const otherVal = b[zone]?.[other] ?? 0;
      const clamped = Math.min(100 - otherVal, Math.max(0, val));
      return { ...b, [zone]: { ...b[zone], [depth]: clamped } };
    });
  };

  const zonePct = (z) => LB[z]?.[lbIdx] ?? 0;
  // TBSA: sum both front and back (non-overlapping zones)
  const FRONT_ZONES = ["head","neck","trunkAnt","genitalia","upArmL","upArmR","forearmL","forearmR","handL","handR","thighL","thighR","legL","legR","footL","footR"];
  const BACK_ZONES  = ["head","neck","trunkPost","buttockL","buttockR","upArmL","upArmR","forearmL","forearmR","handL","handR","thighL","thighR","legL","legR","footL","footR"];
  // Zones that appear on both sides — average the two entries
  const BOTH = ["head","neck","upArmL","upArmR","forearmL","forearmR","handL","handR","thighL","thighR","legL","legR","footL","footR"];

  const totalPartial = (() => {
    let s = 0;
    // Front-only zones
    ["trunkAnt","genitalia"].forEach(z => { s += (burnsFront[z]?.partial/100)*zonePct(z); });
    // Back-only zones
    ["trunkPost","buttockL","buttockR"].forEach(z => { s += (burnsBack[z]?.partial/100)*zonePct(z); });
    // Each surface tap contributes its full per-surface LB value — no averaging
    BOTH.forEach(z => {
      s += (burnsFront[z]?.partial/100)*zonePct(z) + (burnsBack[z]?.partial/100)*zonePct(z);
    });
    return s;
  })();
  const totalFull = (() => {
    let s = 0;
    ["trunkAnt","genitalia"].forEach(z => { s += (burnsFront[z]?.full/100)*zonePct(z); });
    ["trunkPost","buttockL","buttockR"].forEach(z => { s += (burnsBack[z]?.full/100)*zonePct(z); });
    BOTH.forEach(z => {
      s += (burnsFront[z]?.full/100)*zonePct(z) + (burnsBack[z]?.full/100)*zonePct(z);
    });
    return s;
  })();
  const totalTBSA = totalPartial + totalFull;

  const parkland24  = 4 * weight * totalTBSA;
  const bsaM2       = Math.sqrt((height * weight) / 3600);
  const burnedBSA   = bsaM2 * (totalTBSA / 100);
  const galveston24 = (5000 * burnedBSA) + (2000 * bsaM2);
  const total24     = formula === "parkland" ? parkland24 : galveston24;

  const BodySVG = ({ side }) => {
    const svgData = BURN_SVG[imgVariant]?.[side];
    if (!svgData) return null;
    const { vw, vh, paths } = svgData;
    const sideburns = getBurns(side);
    const zonesOrdered = [...RENDER_ORDER.filter(z => paths[z]), ...Object.keys(paths).filter(z => !RENDER_ORDER.includes(z) && paths[z])];
    return (
      <div style={{ position:"relative", flex:1 }}>
        <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width:"100%", display:"block" }}>
          <rect width={vw} height={vh} fill="white"/>
          {zonesOrdered.map(name => {
            const path = paths[name];
            if (!path) return null;
            const p = sideburns[name] || {partial:0,full:0};
            let fill = zoneCol(name);
            if (p.full > 0 && p.partial > 0) fill = "rgba(197,48,48,0.55)";
            else if (p.full > 0) fill = "rgba(229,62,62,0.5)";
            else if (p.partial > 0) fill = "rgba(221,107,32,0.45)";
            const isActive = activeZone === name && activeSide === side;
            return (
              <path key={name} d={path}
                fill={isActive ? "rgba(26,35,50,0.2)" : fill}
                stroke={isActive ? "#1a2332" : "#555"}
                strokeWidth={isActive ? "1" : "0.5"}
                opacity={0.92}
                onClick={() => { setActiveZone(name === activeZone && activeSide === side ? null : name); setActiveSide(side); }}
                style={{ cursor:"pointer" }}
              />
            );
          })}
        </svg>
        <div style={{ textAlign:"center", fontSize:9, color:COLORS.textMuted, fontFamily:"'IBM Plex Sans',sans-serif", marginTop:2 }}>
          {side === "front" ? "FRONT" : "BACK"}
        </div>
      </div>
    );
  };

  const btnBase = { flex:1, padding:"7px 4px", borderRadius:3, border:"1px solid #d0d4d9", background:COLORS.bg, color:COLORS.navy, fontSize:12, cursor:"pointer", fontFamily:"-apple-system,sans-serif", fontWeight:500, textAlign:"center" };
  const btnSel  = { ...btnBase, background:"#e8eaed", fontWeight:700 };

  const ZonePopover = ({ zone, side }) => {
    const sideburns = getBurns(side);
    const pct = zonePct(zone);
    return (
      <div style={{ marginTop:8, padding:"12px 14px", borderRadius:3, background:COLORS.surface, border:`1px solid ${COLORS.navy}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 }}>
          <div style={{ color:COLORS.navy, fontSize:13, fontFamily:"'IBM Plex Sans',sans-serif", fontWeight:700 }}>{ZONE_LABELS[zone]} <span style={{color:COLORS.textMuted,fontSize:10,fontWeight:400}}>({side})</span></div>
          <div style={{ color:COLORS.textMuted, fontSize:10, fontFamily:"'IBM Plex Mono',monospace" }}>{pct}% BSA</div>
        </div>
        {[["partial","Partial Thickness",COLORS.warning],["full","Full Thickness",COLORS.danger]].map(([depth,dlabel,dcolor]) => (
          <div key={depth} style={{ marginBottom:10 }}>
            <div style={{ color:dcolor, fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{dlabel}</div>
            <div style={{ display:"flex", gap:3, marginBottom:5 }}>
              <button style={sideburns[zone]?.[depth]===0?btnSel:btnBase} onClick={()=>setBurnSide(side,zone,depth,0)}>0</button>
              {FRACS.map(fr=>(
                <button key={fr.val} style={sideburns[zone]?.[depth]===fr.val?btnSel:btnBase} onClick={()=>setBurnSide(side,zone,depth,fr.val)}>{fr.label}</button>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input type="number" inputMode="decimal" min={0} max={100} value={sideburns[zone]?.[depth] ?? 0}
                onChange={e=>setBurnSide(side,zone,depth,parseFloat(e.target.value)||0)}
                style={{ width:60, padding:"6px 8px", borderRadius:3, border:"1px solid #d0d4d9", background:COLORS.bg, color:COLORS.navy, fontSize:14, fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, outline:"none" }} />
              <span style={{ fontSize:10, color:COLORS.textMuted, fontFamily:"'IBM Plex Mono',monospace" }}>
                % → {((sideburns[zone]?.[depth]??0)/100*pct).toFixed(2)}% TBSA
              </span>
            </div>
          </div>
        ))}
        <button onClick={()=>setActiveZone(null)}
          style={{ width:"100%", padding:"7px", borderRadius:3, border:`1px solid ${COLORS.border}`, background:COLORS.bg, color:COLORS.textMuted, fontSize:12, cursor:"pointer", fontFamily:"-apple-system,sans-serif" }}>
          Done ✓
        </button>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ color:COLORS.navy, fontSize:12, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:700, marginBottom:5 }}>Age</div>
          <select value={ageIdx} onChange={e=>setAgeIdx(parseInt(e.target.value))}
            style={{ width:"100%", padding:"9px 10px", borderRadius:3, border:"1px solid #d0d4d9", background:COLORS.bg, color:COLORS.navy, fontSize:13, fontFamily:"-apple-system,sans-serif", fontWeight:500, outline:"none" }}>
            {AGE_BANDS.map((b,i)=><option key={i} value={i}>{b.label}</option>)}
          </select>
        </div>
        <div style={{ flex:1 }}>
          <NumberInput label="Weight" value={weight} onChange={setWeight} min={1} max={150} step={0.5} unit="kg" />
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:4 }}>
        <BodySVG side="front" />
        <BodySVG side="back" />
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:6, justifyContent:"center", fontSize:9, color:COLORS.textMuted, fontFamily:"'IBM Plex Sans',sans-serif", alignItems:"center" }}>
        <span>Tap zone to select</span>
        <span style={{ width:10, height:10, borderRadius:2, background:"rgba(221,107,32,0.5)", display:"inline-block" }}/><span>Partial</span>
        <span style={{ width:10, height:10, borderRadius:2, background:"rgba(229,62,62,0.5)", display:"inline-block" }}/><span>Full</span>
        <span style={{ width:10, height:10, borderRadius:2, background:"rgba(197,48,48,0.55)", display:"inline-block" }}/><span>Mixed</span>
      </div>

      {activeZone && <ZonePopover zone={activeZone} side={activeSide} />}

      <div style={{ display:"flex", gap:6, marginTop:10, marginBottom:8 }}>
        {[{label:"Partial",val:totalPartial,color:COLORS.warning},{label:"Full",val:totalFull,color:COLORS.danger},{label:"Total TBSA",val:totalTBSA,color:COLORS.navy}].map(item=>(
          <div key={item.label} style={{ flex:1, padding:"8px 10px", borderRadius:3, background:COLORS.surface, border:`1px solid ${COLORS.border}`, textAlign:"center" }}>
            <div style={{ fontSize:9, color:COLORS.textMuted, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", marginBottom:3 }}>{item.label}</div>
            <div style={{ fontSize:16, fontFamily:"'IBM Plex Mono',monospace", color:item.color, fontWeight:700 }}>{item.val.toFixed(2)}%</div>
          </div>
        ))}
      </div>

      <ScoreRow label="Resuscitation Formula" value={formula} onChange={setFormula}
        options={[{value:"parkland",label:"Parkland"},{value:"galveston",label:"Galveston"}]} />

      {formula === "galveston" && (
        <div style={{ marginBottom:8 }}>
          <NumberInput label="Height" value={height} onChange={setHeight} min={30} max={200} step={1} unit="cm" />
          <div style={{ fontSize:10, fontFamily:"'IBM Plex Mono',monospace", color:COLORS.textMuted }}>
            BSA: {bsaM2.toFixed(3)} m² · Burned BSA: {burnedBSA.toFixed(3)} m²
          </div>
        </div>
      )}

      {totalTBSA > 0 && (
        <div style={{ marginTop:4, padding:"14px 16px", borderRadius:3, background:"rgba(219,55,55,0.06)", border:`1px solid ${COLORS.danger}` }}>
          <div style={{ color:COLORS.textMuted, fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, fontWeight:500 }}>
            {formula==="parkland" ? "Parkland · 4 mL/kg/%TBSA · LR" : "Galveston · 5000 mL/m²burned + 2000 mL/m²total"}
          </div>
          <div style={{ color:COLORS.danger, fontSize:28, fontWeight:600, fontFamily:"'IBM Plex Sans',sans-serif" }}>{total24.toFixed(0)} mL</div>
          <div style={{ color:COLORS.danger, fontSize:13, fontWeight:600, marginTop:4, fontFamily:"'IBM Plex Sans',sans-serif" }}>Total over 24 hours · Lactated Ringer's</div>
          <div style={{ borderTop:`1px solid ${COLORS.danger}`, marginTop:10, paddingTop:10 }}>
            {[{label:"First 8 hours",vol:total24/2,rate:(total24/2)/8},{label:"Next 16 hours",vol:total24/2,rate:(total24/2)/16}].map(row=>(
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                <span style={{ fontSize:12, color:COLORS.navy, fontFamily:"'IBM Plex Sans',sans-serif" }}>{row.label}</span>
                <span style={{ fontSize:12, fontFamily:"'IBM Plex Mono',monospace", color:COLORS.navy, fontWeight:600 }}>
                  {row.vol.toFixed(0)} mL · {row.rate.toFixed(0)} mL/hr
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:6, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", color:COLORS.textMuted }}>
            ⚠ Time zero = time of injury. Adjust if delayed presentation.
          </div>
        </div>
      )}

      <div style={{ marginTop:8, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", color:COLORS.textMuted, lineHeight:1.5 }}>
        Lund-Browder · Parkland: Baxter CE 1974 · Galveston: Shriners 1980 · Superficial burns excluded
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PEDIATRIC DEHYDRATION (GORELICK)
// ═══════════════════════════════════════════════════════════════════════════════
function NeonatalGlucoseCalc() {
  const [glucose, setGlucose] = useState(40);
  const [age_hrs, setAgeHrs] = useState(2);
  const [symptoms, setSymptoms] = useState(0);
  
  const critical = glucose < 25;
  const low = glucose < 40;
  const threshold = age_hrs <= 4 ? 40 : age_hrs <= 24 ? 45 : 50;
  const belowThreshold = glucose < threshold;
  const color = critical || (symptoms===1 && belowThreshold) ? COLORS.danger : belowThreshold ? COLORS.warning : COLORS.success;
  const label = critical ? "CRITICAL — IV glucose immediately" : symptoms===1 && belowThreshold ? "Symptomatic Hypoglycemia — IV glucose" : belowThreshold ? `Below threshold (<${threshold} mg/dL at ${age_hrs}h)` : "Acceptable glucose level";
  
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}><NumberInput label="Blood Glucose" value={glucose} onChange={setGlucose} min={0} max={500} step={1} unit="mg/dL" /></div>
        <div style={{ flex: 1 }}><NumberInput label="Age" value={age_hrs} onChange={setAgeHrs} min={0} max={72} step={0.5} unit="hours of life" /></div>
      </div>
      <ScoreRow label="Symptomatic?" value={symptoms} onChange={setSymptoms} options={[{value:0,label:"0 — Asymptomatic"},{value:1,label:"1 — Symptomatic (jittery/seizure/apnea)"}]} />
      <ResultBadge score={`${glucose} mg/dL`} label={label} color={color} sublabel={`AAP 2011 thresholds: 0–4h: <40, 4–24h: <45, >24h: <50 mg/dL`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PRETERM RISK (Gestational Age Context)
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PRETERM RISK (Gestational Age Context)
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
function PretermCalc() {
  const [gaWeeks, setGaWeeks] = useState(32);
  const [gaDays, setGaDays] = useState(0);
  const [birth_weight, setBirthWeight] = useState(1500);

  const ga = gaWeeks + (gaDays / 7);

  const iuga = birth_weight < (ga * 100 - 1600);
  const category = ga >= 37 ? "Term" : ga >= 34 ? "Late Preterm (34–36⁶)" : ga >= 32 ? "Moderate Preterm (32–33⁶)" : ga >= 28 ? "Very Preterm (28–31⁶)" : "Extremely Preterm (<28w)";
  const sga = birth_weight < (ga < 37 ? ga*100-1600 : 2500);
  const color = ga < 28 ? COLORS.danger : ga < 32 ? COLORS.orange : ga < 34 ? COLORS.warning : COLORS.success;

  const concerns = [
    ga < 28 && "Extreme immaturity — surfactant, IVH, NEC, ROP risk",
    ga < 32 && "High RDS risk — surfactant, CPAP",
    ga < 34 && "Feeding immaturity, thermoregulation concerns",
    ga < 34 && "Apnea of prematurity risk",
    sga && "SGA — hypoglycemia, polycythemia surveillance",
    birth_weight < 1000 && "ELBW — NICU-level care required",
    birth_weight < 1500 && "VLBW — parenteral nutrition likely",
  ].filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 2 }}><NumberInput label="Estimated Gestational Age" value={gaWeeks} onChange={v => setGaWeeks(Math.min(42, Math.max(22, Math.floor(v))))} min={22} max={42} step={1} unit="weeks" /></div>
        <div style={{ flex: 1 }}><NumberInput label="EGA Days" value={gaDays} onChange={v => setGaDays(Math.min(6, Math.max(0, Math.floor(v))))} min={0} max={6} step={1} unit="days" /></div>
      </div>
      <NumberInput label="Birth Weight" value={birth_weight} onChange={setBirthWeight} min={200} max={6000} step={10} unit="grams" />
      <ResultBadge score={category} label={sga ? "SGA + Prematurity" : "AGA"} color={color} sublabel={`EGA ${gaWeeks}w${gaDays > 0 ? `${gaDays}d` : ""} · BW ${birth_weight}g`} />
      {concerns.length > 0 && (
        <div style={{marginTop:14,padding:"14px 16px",borderRadius:3,background:COLORS.surface,border:`1px solid ${COLORS.border}`}}>
          <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:700,marginBottom:10}}>Anticipated Concerns</div>
          {concerns.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
              <span style={{color:COLORS.warning,flexShrink:0}}>▸</span>
              <span style={{color:COLORS.navy,fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif"}}>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: FLACC PAIN SCALE
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
function FLACCCalc() {
  const [vals, setVals] = useState({ face:null, legs:null, activity:null, cry:null, consolability:null });
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));
  const score=Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled=Object.values(vals).every(v=>v!==null);
  const color=score>=7?COLORS.danger:score>=4?COLORS.warning:COLORS.success;
  const label=score>=7?"Severe Pain":score>=4?"Moderate Pain":"Mild/No Pain";
  return (
    <div>
      <ScoreRow label="Face" value={vals.face} onChange={v=>set("face",v)} options={[{value:0,label:"0 — Neutral/Smiling"},{value:1,label:"1 — Grimace/Frown"},{value:2,label:"2 — Frequent/Clenched jaw"}]} />
      <ScoreRow label="Legs" value={vals.legs} onChange={v=>set("legs",v)} options={[{value:0,label:"0 — Normal/Relaxed"},{value:1,label:"1 — Uneasy/Tense"},{value:2,label:"2 — Kicking/Drawn up"}]} />
      <ScoreRow label="Activity" value={vals.activity} onChange={v=>set("activity",v)} options={[{value:0,label:"0 — Lying quietly"},{value:1,label:"1 — Squirming/Tense"},{value:2,label:"2 — Arched/Rigid/Jerking"}]} />
      <ScoreRow label="Cry" value={vals.cry} onChange={v=>set("cry",v)} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Moans/Whimpers"},{value:2,label:"2 — Steady cry/Screams"}]} />
      <ScoreRow label="Consolability" value={vals.consolability} onChange={v=>set("consolability",v)} options={[{value:0,label:"0 — Content/Relaxed"},{value:1,label:"1 — Reassured by touch"},{value:2,label:"2 — Difficult to console"}]} />
      {filled && <ResultBadge score={`${score}/10`} label={label} color={color} sublabel="FLACC Scale • Ages 2mo–7yr or non-verbal patients" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: CORRECTED QT (QTc)
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
function QTcCalc() {
  const [qt, setQt] = useState(380);
  const [rr, setRr] = useState(800);
  const [hr, setHr] = useState(75);
  const [mode, setMode] = useState("hr");
  const rrMs = mode === "hr" ? (60000 / hr) : rr;
  const qtc = (qt / Math.sqrt(rrMs / 1000)).toFixed(0);
  const color = parseFloat(qtc) > 500 ? COLORS.danger : parseFloat(qtc) > 460 ? COLORS.warning : COLORS.success;
  const label = parseFloat(qtc) > 500 ? "Severely Prolonged — High TdP Risk" : parseFloat(qtc) > 480 ? "Borderline Prolonged" : parseFloat(qtc) > 440 ? "Mildly Prolonged" : "Normal QTc";
  return (
    <div>
      <ScoreRow label="HR Input Mode" value={mode} onChange={setMode} options={[{value:"hr",label:"Heart Rate (bpm)"},{value:"rr",label:"RR Interval (ms)"}]} />
      <NumberInput label="QT Interval" value={qt} onChange={setQt} min={200} max={800} unit="ms" />
      {mode==="hr" && <NumberInput label="Heart Rate" value={hr} onChange={setHr} min={30} max={250} unit="bpm" />}
      {mode==="rr" && <NumberInput label="RR Interval" value={rr} onChange={setRr} min={300} max={2000} unit="ms" />}
      <ResultBadge score={`${qtc} ms`} label={label} color={color} sublabel={`Bazett formula: QTc = QT / √(RR in sec) • RR = ${rrMs.toFixed(0)}ms`} />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
function DehydrationCalc() {
  const [vals, setVals] = useState({ general:null, eyes:null, mucous:null, tears:null, skin:null, pulse:null, resp:null, urine:null });
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));
  const score=Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled=Object.values(vals).every(v=>v!==null);
  const pct = score<=2?"<5% (Minimal)":score<=4?"5–9% (Mild–Moderate)":score<=6?"10–14% (Moderate–Severe)":"≥15% (Severe)";
  const color=score<=2?COLORS.success:score<=4?COLORS.warning:score<=6?COLORS.orange:COLORS.danger;
  return (
    <div>
      {[
        {k:"general",l:"General Appearance",opts:[{value:0,label:"0 — Normal"},{value:1,label:"1 — Restless/Irritable"},{value:2,label:"2 — Lethargic/Unconscious"}]},
        {k:"eyes",l:"Eyes",opts:[{value:0,label:"0 — Normal"},{value:1,label:"1 — Slightly sunken"},{value:2,label:"2 — Very sunken/dry"}]},
        {k:"mucous",l:"Mucous Membranes",opts:[{value:0,label:"0 — Moist"},{value:1,label:"1 — Dry"},{value:2,label:"2 — Very dry"}]},
        {k:"tears",l:"Tears",opts:[{value:0,label:"0 — Present"},{value:1,label:"1 — Decreased"},{value:2,label:"2 — Absent"}]},
        {k:"skin",l:"Skin Turgor",opts:[{value:0,label:"0 — Normal"},{value:1,label:"1 — Goes back slowly"},{value:2,label:"2 — Goes back very slowly"}]},
        {k:"pulse",l:"Pulse",opts:[{value:0,label:"0 — Normal"},{value:1,label:"1 — Rapid"},{value:2,label:"2 — Very rapid/weak"}]},
        {k:"resp",l:"Respiration",opts:[{value:0,label:"0 — Normal"},{value:1,label:"1 — Deep/Rapid"},{value:2,label:"2 — Very deep/irregular"}]},
        {k:"urine",l:"Urine Output",opts:[{value:0,label:"0 — Normal"},{value:1,label:"1 — Decreased"},{value:2,label:"2 — Absent"}]},
      ].map(({k,l,opts})=>(<ScoreRow key={k} label={l} value={vals[k]} onChange={v=>set(k,v)} options={opts} />))}
      {filled && <ResultBadge score={`${score}/16`} label={pct} color={color} sublabel="WHO/Gorelick clinical dehydration scoring" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: KAWASAKI CRITERIA
// ═══════════════════════════════════════════════════════════════════════════════
function KawasakiCalc() {
  const [fever, setFever] = useState(0);
  const [days, setDays] = useState(0);
  const [vals, setVals] = useState({ rash:null, hands:null, conj:null, lips:null, lymph:null });
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));
  const criteria_met = Object.values(vals).filter(v=>v===1).length;
  const complete = fever===1 && days>=5 && criteria_met>=4;
  const incomplete = fever===1 && days>=5 && criteria_met>=2;
  const color = complete ? COLORS.danger : incomplete ? COLORS.warning : COLORS.success;
  const label = complete ? "Complete Kawasaki Disease" : incomplete ? "Incomplete KD — Consider Echo/CRP" : "Criteria Not Met";
  return (
    <div>
      <ScoreRow label="Fever" value={fever} onChange={setFever} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes (≥38.5°C)"}]} />
      <NumberInput label="Duration of Fever" value={days} onChange={setDays} min={0} max={30} unit="days" />
      <ScoreRow label="Rash (polymorphous exanthem)" value={vals.rash} onChange={v=>set("rash",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Hands/Feet (edema or desquamation)" value={vals.hands} onChange={v=>set("hands",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Bilateral Conjunctival Injection" value={vals.conj} onChange={v=>set("conj",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Lips/Oral Changes (strawberry tongue)" value={vals.lips} onChange={v=>set("lips",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Cervical Lymphadenopathy (≥1.5 cm)" value={vals.lymph} onChange={v=>set("lymph",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ResultBadge score={`${criteria_met}/5`} label={label} color={color} sublabel={`AHA 2017 Criteria • IVIG 2g/kg if complete KD`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: STEN / PITTOCK THYROID (neonatal TSH)
// Replaced with: PEDIATRIC FRACTURE RISK (Toddler's Fx)
// ═══════════════════════════════════════════════════════════════════════════════
function ChildAbuseFracCalc() {
  const [vals, setVals] = useState({ age:null, fx_type:null, history:null, pattern:null, delay:null, other:null });
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));
  const score=Object.values(vals).reduce((a,v)=>a+(v??0),0);
  const filled=Object.values(vals).every(v=>v!==null);
  const color=score>=6?COLORS.danger:score>=3?COLORS.warning:COLORS.success;
  const label=score>=6?"High Concern for NAT":score>=3?"Moderate Concern — Full Workup":"Low Concern";
  return (
    <div>
      <div style={{color:COLORS.textMuted,fontSize:11,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>NON-ACCIDENTAL TRAUMA (NAT) FRACTURE RISK INDICATORS</div>
      <ScoreRow label="Age" value={vals.age} onChange={v=>set("age",v)} options={[{value:0,label:"0 — >2 years"},{value:2,label:"2 — 6–24 months"},{value:3,label:"3 — <6 months"}]} />
      <ScoreRow label="Fracture Type" value={vals.fx_type} onChange={v=>set("fx_type",v)} options={[{value:0,label:"0 — Simple spiral/transverse"},{value:2,label:"2 — Classic metaphyseal lesion"},{value:3,label:"3 — Posterior rib, spinous process"}]} />
      <ScoreRow label="History Consistent?" value={vals.history} onChange={v=>set("history",v)} options={[{value:0,label:"0 — Consistent"},{value:2,label:"2 — Inconsistent/changing"},{value:3,label:"3 — No history given"}]} />
      <ScoreRow label="Injury Pattern" value={vals.pattern} onChange={v=>set("pattern",v)} options={[{value:0,label:"0 — Single fracture"},{value:2,label:"2 — Multiple fractures"},{value:3,label:"3 — Bilateral/different ages"}]} />
      <ScoreRow label="Delayed Presentation (>24hr)" value={vals.delay} onChange={v=>set("delay",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Other Injuries (bruising, burns)" value={vals.other} onChange={v=>set("other",v)} options={[{value:0,label:"0 — None"},{value:2,label:"2 — Yes"}]} />
      {filled && <ResultBadge score={`${score}`} label={label} color={color} sublabel="CPS screen; skeletal survey, ophthalmology, social work" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: SODIUM CORRECTION (Hyponatremia)
// ═══════════════════════════════════════════════════════════════════════════════
function SodiumCalc() {
  const [current_na, setCurrentNa] = useState(120);
  const [target_na, setTargetNa] = useState(130);
  const [weight, setWeight] = useState(20);
  const [acuity, setAcuity] = useState("chronic");
  const tbd = 0.6 * weight * (target_na - current_na);
  const max_rate_hr = acuity === "acute" ? 2 : 0.5; // mEq/L/hr
  const max_per_day = acuity === "chronic" ? 10 : 24;
  const ns_vol = (tbd / 154) * 1000;
  const threePercent_vol = (tbd / 513) * 1000;
  return (
    <div>
      <NumberInput label="Current Sodium" value={current_na} onChange={setCurrentNa} min={100} max={180} unit="mEq/L" />
      <NumberInput label="Target Sodium" value={target_na} onChange={setTargetNa} min={100} max={180} unit="mEq/L" />
      <NumberInput label="Weight" value={weight} onChange={setWeight} min={1} max={150} step={0.5} unit="kg" />
      <ScoreRow label="Onset" value={acuity} onChange={setAcuity} options={[{value:"acute",label:"Acute (<48h) — symptomatic"},{value:"chronic",label:"Chronic (>48h) — asymptomatic"}]} />
      <div style={{marginTop:20,padding:"20px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:12}}>CORRECTION PLAN</div>
        {[
          {l:"Na deficit",v:`${tbd.toFixed(1)} mEq`},
          {l:"Max correction rate",v:`${max_rate_hr} mEq/L/hr`},
          {l:"Max per 24hr",v:`${max_per_day} mEq/L/day`},
          {l:"NS (154 mEq/L) needed",v:`${ns_vol.toFixed(0)} mL`},
          {l:"3% NaCl needed",v:`${threePercent_vol.toFixed(0)} mL`},
        ].map(item=>(
          <div key={item.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`}}>
            <span style={{color:COLORS.textSub,fontSize:13,fontFamily:"'DM Mono',monospace"}}>{item.l}</span>
            <span style={{color:COLORS.accent,fontWeight:700,fontSize:14,fontFamily:"'Sora',sans-serif"}}>{item.v}</span>
          </div>
        ))}
        <div style={{marginTop:12,color:COLORS.warning,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
          ⚠ Correct chronic hyponatremia slowly to prevent osmotic demyelination syndrome
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY OF ALL CALCULATORS
// ═══════════════════════════════════════════════════════════════════════════════
const CALCULATORS = [
  // Neonatal
  { id:"apgar",        category:"neonatal",    name:"APGAR Score",                  desc:"Neonatal vitality assessment at 1, 5, 10 min",            component: ApgarCalc },
  { id:"bilirubin",    category:"neonatal",    name:"Neonatal Hyperbilirubinemia",  desc:"Bhutani nomogram + phototherapy thresholds",              component: BilirubinCalc },
  { id:"glucose",      category:"neonatal",    name:"Neonatal Hypoglycemia",        desc:"AAP 2011 glucose thresholds by postnatal age",            component: NeonatalGlucoseCalc },
  { id:"preterm",      category:"neonatal",    name:"Prematurity Risk Assessment",  desc:"Category and anticipated concerns by GA/weight",          component: PretermCalc },
  { id:"finnegan",     category:"neonatal",    name:"Modified Finnegan NAS",        desc:"Neonatal Abstinence Syndrome scoring",                    component: FinneganCalc },
  // Neurologic (expanded)
  { id:"pgcs",         category:"neurologic",  name:"Pediatric Glasgow Coma Scale", desc:"GCS adapted for infants and children",                    component: PGCSCalc },
  { id:"pecarn",       category:"neurologic",  name:"PECARN Head CT",               desc:"CT rule for pediatric head trauma",                       component: PECARNCalc },
  { id:"cows",         category:"neurologic",  name:"COWS Score",                   desc:"Clinical Opiate Withdrawal Scale",                        component: COWSCalc },
  { id:"wat1",         category:"neurologic",  name:"WAT-1",                        desc:"Withdrawal Assessment Tool — iatrogenic opioid/benzo",    component: WATCalc },
  { id:"flacc",        category:"neurologic",  name:"FLACC Pain Scale",             desc:"Behavioral pain scale for non-verbal children",           component: FLACCCalc },
  // Toxicology
  { id:"apap",         category:"toxicology",  name:"Acetaminophen Toxicity",       desc:"Dose assessment + Rumack-Matthew nomogram",               component: AcetaminophenCalc },
  // Respiratory
  { id:"bronchiolitis",category:"respiratory", name:"Bronchiolitis Severity",       desc:"Respiratory severity scoring for bronchiolitis",          component: BronchiolitisCalc },
  { id:"asthma",       category:"respiratory", name:"Asthma Severity (PRAM)",       desc:"Pediatric Respiratory Assessment Measure",               component: AsthmaCalc },
  // FEN (Fluids, Electrolytes & Nutrition)
  { id:"fluid",        category:"fluid",       name:"Maintenance Fluids",           desc:"Holliday-Segar + 4:2:1 · fluid, Na, K, GIR",             component: FluidCalc },
  { id:"burns",        category:"fluid",       name:"Burn Fluid Resuscitation",     desc:"Parkland formula for pediatric burns",                    component: BurnsCalc },
  { id:"dehydration",  category:"fluid",       name:"Dehydration Score",            desc:"Clinical dehydration assessment (WHO/Gorelick)",          component: DehydrationCalc },
  { id:"sodium",       category:"fluid",       name:"Hyponatremia Correction",      desc:"Sodium deficit and correction rate calculation",          component: SodiumCalc },
  { id:"u25gfr",       category:"fluid",       name:"U25 eGFR",                     desc:"Cystatin-C and SCr-based GFR for age ≤25 years",         component: U25GFRCalc },
  // Common Rx
  { id:"dose",         category:"dosing",      name:"Common Drug Doses",            desc:"Weight-based pediatric dosing reference",                 component: DoseCalc },
  // Cardiac
  { id:"dvt",          category:"cardiac",     name:"Wells DVT Score",              desc:"DVT probability in children (adapted Wells)",             component: DVTCalc },
  { id:"qtc",          category:"cardiac",     name:"Corrected QT (Bazett)",        desc:"QTc calculation and risk assessment",                     component: QTcCalc },
  { id:"kawasaki",     category:"cardiac",     name:"Kawasaki Disease Criteria",    desc:"AHA 2017 diagnostic criteria",                           component: KawasakiCalc },
  // Risk Scores
  { id:"sepsis",       category:"readmission", name:"Pediatric SIRS/Sepsis",        desc:"Age-adjusted SIRS criteria and sepsis screening",         component: SepsisCalc },
  { id:"natfrac",      category:"readmission", name:"NAT Fracture Risk",            desc:"Non-accidental trauma fracture indicators",               component: ChildAbuseFracCalc },
  { id:"readmission",  category:"readmission", name:"Pediatric Readmission Risk",   desc:"30-day readmission risk estimation",                      component: ReadmissionCalc },
  { id:"pews",         category:"readmission", name:"PEWS",                         desc:"Pediatric Early Warning Score",                           component: PEWSCalc },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function FluidErrorChart() {
  const W = 320, H = 220;
  const padL = 44, padR = 12, padT = 16, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxWt = 80;
  const minErr = -0.06, maxErr = 0.10;

  const xScale = (w) => padL + (w / maxWt) * chartW;
  const yScale = (e) => padT + ((maxErr - e) / (maxErr - minErr)) * chartH;

  const hs = (w) => w <= 10 ? w*100/24 : w <= 20 ? (1000+(w-10)*50)/24 : (1500+(w-20)*20)/24;
  const fto = (w) => w <= 10 ? w*4 : w <= 20 ? 40+(w-10)*2 : 60+(w-20)*1;
  // Positive = 4:2:1 overestimates H-S (above 35kg), negative = underestimates (below 35kg)
  const err = (w) => (fto(w) - hs(w)) / hs(w);

  const points = (w1, w2) => {
    const pts = [];
    for (let w = w1; w <= w2; w += 0.5) {
      pts.push(`${xScale(w).toFixed(1)},${yScale(err(w)).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  const xTicks = [0, 20, 40, 60, 80];
  const yTicks = [-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08, 0.10];

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500, marginBottom: 6 }}>4:2:1 Approximation Error vs. Holliday-Segar</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {/* Grid lines at 2% intervals */}
        {yTicks.map(e => (
          <line key={e} x1={padL} x2={W - padR} y1={yScale(e)} y2={yScale(e)}
            stroke={e === 0 ? "#888" : COLORS.border} strokeWidth={e === 0 ? 1 : 0.5} />
        ))}

        {/* Y axis labels */}
        {yTicks.map(e => (
          <text key={e} x={padL - 4} y={yScale(e) + 3.5} textAnchor="end" fontSize="7" fill={COLORS.textMuted}>
            {e === 0 ? "0%" : `${e > 0 ? "+" : ""}${(e * 100).toFixed(0)}%`}
          </text>
        ))}

        {/* X axis labels */}
        {xTicks.map(w => (
          <text key={w} x={xScale(w)} y={H - padB + 10} textAnchor="middle" fontSize="7" fill={COLORS.textMuted}>{w}</text>
        ))}

        {/* Axis labels */}
        <text x={padL + chartW / 2} y={H - 2} textAnchor="middle" fontSize="7.5" fill={COLORS.textMuted}>Weight (kg)</text>
        <text x={8} y={padT + chartH / 2} textAnchor="middle" fontSize="7.5" fill={COLORS.textMuted} transform={`rotate(-90, 8, ${padT + chartH / 2})`}>Error</text>

        {/* Error curves — three segments */}
        <polyline points={points(0.5, 10)} fill="none" stroke="#e53e3e" strokeWidth="1.8" strokeLinejoin="round" />
        <polyline points={points(10, 20)} fill="none" stroke="#805ad5" strokeWidth="1.8" strokeLinejoin="round" />
        <polyline points={points(20, 80)} fill="none" stroke="#2b6cb0" strokeWidth="1.8" strokeLinejoin="round" />

        {/* Zero crossover marker at 35 kg */}
        <circle cx={xScale(35)} cy={yScale(0)} r="3" fill="#d4a444" />
        <text x={xScale(35) + 5} y={yScale(0) - 4} fontSize="7" fill="#d4a444">35 kg</text>

        {/* Legend */}
        <line x1={padL} y1={padT - 4} x2={padL + 18} y2={padT - 4} stroke="#e53e3e" strokeWidth="2" />
        <text x={padL + 21} y={padT - 1} fontSize="7" fill={COLORS.textMuted}>≤10 kg</text>
        <line x1={padL + 52} y1={padT - 4} x2={padL + 70} y2={padT - 4} stroke="#805ad5" strokeWidth="2" />
        <text x={padL + 73} y={padT - 1} fontSize="7" fill={COLORS.textMuted}>10–20 kg</text>
        <line x1={padL + 114} y1={padT - 4} x2={padL + 132} y2={padT - 4} stroke="#2b6cb0" strokeWidth="2" />
        <text x={padL + 135} y={padT - 1} fontSize="7" fill={COLORS.textMuted}>&gt;20 kg</text>
      </svg>
      <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textMuted, marginTop: 4, lineHeight: 1.5 }}>
        Gold marker: exact agreement at 35 kg · Positive = 4:2:1 overestimates · Negative = underestimates
      </div>
    </div>
  );
}

export default function App() {
  const [activeCalc, setActiveCalc] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const contentRef = useRef(null);

  const filtered = CALCULATORS.filter(c => {
    const matchCat = activeCategory === "all" || c.category === activeCategory;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openCalc = (calc) => {
    setActiveCalc(calc);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const CalcComponent = activeCalc ? activeCalc.component : null;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "'IBM Plex Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      {/* FONT IMPORTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        select option { background: #ffffff; color: #1a2332; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "48px 16px 0", background: COLORS.navy, position: "sticky", top: 0, zIndex: 100, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          {activeCalc && (
            <button onClick={() => setActiveCalc(null)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 2, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.navy, fontSize: 14, fontWeight: 600 }}>
              ⬅️
            </button>
          )}
          <div style={{ flex: 1 }}>
            {activeCalc ? (
              <div style={{ animation: "fadeUp 0.2s ease" }}>
                <div style={{ color: "#d4a444", fontSize: 9, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>
                  {CATEGORIES.find(c => c.id === activeCalc.category)?.label}
                </div>
                <div style={{ color: "#ffffff", fontSize: 16, fontWeight: 600, lineHeight: 1.2, marginTop: 2 }}>{activeCalc.name}</div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ color: "#ffffff", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>PediCalc</span>
                  <span style={{ color: "#d4a444", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", marginLeft: 2 }}>EMR</span>
                </div>
                <div style={{ color: "#d4a444", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
                  {CALCULATORS.length} clinical calculators
                </div>
              </div>
            )}
          </div>
          {activeCalc && (
            <button 
              onClick={() => setShowInfo(true)} 
              style={{ 
                background: COLORS.surface, 
                border: `1px solid ${COLORS.border}`, 
                borderRadius: 2, 
                width: 32, 
                height: 32, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                cursor: "pointer", 
                color: COLORS.accent, 
                fontSize: 16,
                fontWeight: 600
              }}
              title="References & Guidelines"
            >
              ℹ️
            </button>
          )}
        </div>

        {!activeCalc && (
          <>
            {/* SEARCH */}
            <div style={{ marginBottom: 10, position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted, fontSize: 13 }}>🔍</span>
              <input
                placeholder="Search calculators..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: 2, border: `1px solid ${search ? COLORS.accent : COLORS.border}`, background: COLORS.bg, color: COLORS.navy, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", outline: "none", transition: "border 0.1s" }}
              />
            </div>
            {/* CATEGORY TABS — 40×40 touch targets, 22px emoji */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
              <button
                onClick={() => setActiveCategory("all")}
                title="All calculators"
                style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 2, border: `1px solid ${activeCategory === "all" ? COLORS.accent : COLORS.border}`, background: activeCategory === "all" ? COLORS.accentGlow : COLORS.bg, color: activeCategory === "all" ? "#d4a444" : COLORS.textMuted, fontSize: 8, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ALL
              </button>
              {CATEGORIES.map(cat => {
                const count = CALCULATORS.filter(c => c.category === cat.id).length;
                if (!count) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    title={cat.label}
                    style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 2, border: `1px solid ${activeCategory === cat.id ? COLORS.accent : COLORS.border}`, background: activeCategory === cat.id ? COLORS.accentGlow : COLORS.bg, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {cat.icon}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CONTENT */}
      <div ref={contentRef} style={{ padding: "0 16px 100px", overflowY: "auto", maxHeight: "calc(100vh - 180px)" }}>
        {!activeCalc ? (
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            {/* CALC GRID */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>No calculators found</div>
            ) : (
              filtered.map((calc, i) => {
                const cat = CATEGORIES.find(c => c.id === calc.category);
                const isEven = i % 2 === 0;
                return (
                  <button
                    key={calc.id}
                    onClick={() => openCalc(calc)}
                    style={{
                      width: "100%",
                      padding: "2px 12px 2px 0",
                      borderRadius: 0,
                      border: "none",
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: isEven ? COLORS.bg : COLORS.surface,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      animation: `fadeUp 0.15s ease ${i * 0.02}s both`,
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = COLORS.cardHover; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isEven ? COLORS.bg : COLORS.surface; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 2, background: "#f0f1f3", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {cat?.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: COLORS.navy, fontSize: 15, fontWeight: 600, lineHeight: 1.2, fontFamily: "'IBM Plex Sans', sans-serif" }}>{calc.name}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{calc.desc}</div>
                    </div>
                    <span style={{ color: COLORS.textMuted, fontSize: 16, flexShrink: 0 }}>›</span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div style={{ paddingTop: 20, animation: "slideIn 0.2s ease" }}>
            <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Mono', monospace", marginBottom: 18, lineHeight: 1.5 }}>{activeCalc.desc}</div>
            <CalcComponent />
          </div>
        )}
      </div>

      {/* INFO MODAL */}
      {showInfo && activeCalc && CALC_REFERENCES[activeCalc.id] && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(26,35,50,0.85)", 
            zIndex: 200, 
            display: "flex", 
            alignItems: "flex-end",
            animation: "fadeUp 0.2s ease"
          }}
          onClick={() => setShowInfo(false)}
        >
          <div 
            style={{ 
              width: "100%", 
              maxWidth: 430, 
              margin: "0 auto",
              background: COLORS.bg, 
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              padding: "20px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.15)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <div style={{ color: COLORS.accent, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 4 }}>
                  Clinical Reference
                </div>
                <div style={{ color: COLORS.navy, fontSize: 16, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {CALC_REFERENCES[activeCalc.id].title}
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                style={{ 
                  background: "transparent",
                  border: "none",
                  color: COLORS.textMuted,
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500, marginBottom: 6 }}>
                Summary
              </div>
              <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.6, padding: "10px 12px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3 }}>
                {CALC_REFERENCES[activeCalc.id].summary}
              </div>
            </div>
            
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500, marginBottom: 6 }}>
                Primary Reference
              </div>
              <div style={{ color: COLORS.navy, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.5, padding: "10px 12px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3 }}>
                {CALC_REFERENCES[activeCalc.id].reference}
              </div>
            </div>
            
            <div>
              <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500, marginBottom: 6 }}>
                Guidelines
              </div>
              <div style={{ color: COLORS.navy, fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.5, padding: "10px 12px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3 }}>
                {CALC_REFERENCES[activeCalc.id].guidelines}
              </div>
            </div>
            
            <div style={{ marginTop: 16, padding: "8px 12px", background: "rgba(0,102,204,0.06)", border: `1px solid ${COLORS.accent}`, borderRadius: 3 }}>
              <div style={{ color: COLORS.accent, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.5, fontWeight: 500 }}>
                ℹ️ Always verify dosing, contraindications, and current guidelines at point of care. This tool provides decision support only.
              </div>
            </div>

            {CALC_REFERENCES[activeCalc.id].showErrorChart && <FluidErrorChart />}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "8px 16px 20px", background: `linear-gradient(transparent, ${COLORS.bg} 40%)`, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", display: "flex", justifyContent: "center" }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 2, padding: "5px 12px", fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textMuted, fontWeight: 500, textAlign: "center" }}>
            ⚠ Clinical decision support only · Verify with judgment and current guidelines · v15
          </div>
        </div>
      </div>
    </div>
  );
}
