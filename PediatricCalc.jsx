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
// Remove trailing zeros from numbers (safety: prevents confusion between 1.0 and 10)
const stripTrailingZeros = (num) => {
  if (typeof num === 'string') return num;
  return parseFloat(num.toFixed(10).replace(/\.?0+$/, "")).toString();
};

// ─── CALCULATOR DEFINITIONS ──────────────────────────────────────────────────
const CATEGORIES = [
  { id: "neonatal", label: "Neonatal", icon: "👶" },
  { id: "neurologic", label: "Neurologic", icon: "🧠" },
  { id: "withdrawal", label: "Withdrawal", icon: "⚠️" },
  { id: "toxicology", label: "Toxicology", icon: "☣️" },
  { id: "hepatic", label: "Hepatic", icon: "🫀" },
  { id: "respiratory", label: "Respiratory", icon: "🫁" },
  { id: "fluid", label: "Fluids/Nutrition", icon: "💧" },
  { id: "dosing", label: "Dosing/Weight", icon: "⚖️" },
  { id: "renal", label: "Renal", icon: "🩺" },
  { id: "sepsis", label: "Sepsis/Infection", icon: "🦠" },
  { id: "cardiac", label: "Cardiac", icon: "❤️" },
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
    guidelines: "Widely adopted standard, though recent evidence suggests possible hyponatremia risk",
    summary: "100 mL/kg/day for first 10kg, plus 50 mL/kg/day for next 10kg, plus 20 mL/kg/day for each kg >20kg. Provides ~5% dextrose maintenance. Consider reduced rates in certain clinical contexts."
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
  catch: {
    title: "CATCH Head CT Rule (Canadian Assessment of Tomography for Childhood Head Injury)",
    reference: "Osmond MH, Klassen TP, Wells GA, et al. CATCH: a clinical decision rule for the use of computed tomography in children with minor head injury. CMAJ. 2010;182(4):341-348.",
    guidelines: "Validated in Canadian emergency departments, ages 0-16 years",
    summary: "High-risk factors (GCS <15 at 2h, suspected skull fracture, worsening headache/vomiting) predict need for neurologic intervention (~4% risk). Medium-risk factors predict any brain injury on CT."
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
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 5, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "5px 10px",
              borderRadius: 3,
              border: `1px solid ${value === opt.value ? COLORS.accent : COLORS.border}`,
              background: value === opt.value ? COLORS.accentGlow : COLORS.bg,
              color: value === opt.value ? COLORS.accent : COLORS.textSub,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.1s",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 500,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1, unit }) {
  // Remove trailing zeros for display
  const displayValue = value === 0 ? '0' : parseFloat(value).toString();
  
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 5, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
        {label}{unit && <span style={{ color: COLORS.textSub, fontWeight: 400 }}> ({unit})</span>}
      </div>
      <input
        type="number"
        value={displayValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const val = e.target.value;
          // Allow empty string during editing, otherwise parse to number
          onChange(val === '' ? 0 : parseFloat(val) || 0);
        }}
        onFocus={(e) => {
          // Select all on focus for easy replacement
          e.target.select();
        }}
        style={{
          width: "100%",
          padding: "7px 10px",
          borderRadius: 3,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bg,
          color: COLORS.navy,
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 500,
          boxSizing: "border-box",
          outline: "none",
        }}
      />
    </div>
  );
}

function ResultBadge({ score, label, color, sublabel }) {
  // Remove trailing zeros from numeric scores
  const displayScore = typeof score === 'number' ? parseFloat(score).toString() : score;
  
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
      <div style={{ color, fontSize: 28, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.1 }}>{displayScore}</div>
      <div style={{ color, fontSize: 13, fontWeight: 600, marginTop: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>{label}</div>
      {sublabel && <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 6, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.4 }}>{sublabel}</div>}
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
      <NumberInput label="Patient Weight" value={weight} onChange={setWeight} min={1} max={150} unit="kg" />
      
      {mode === "dose" && (
        <>
          <NumberInput label="Dose Ingested" value={dose} onChange={setDose} min={0} max={500} step={0.1} unit="mg/kg" />
          <div style={{marginTop:20,padding:"18px 20px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
            <div style={{color:COLORS.textSub,fontSize:12,fontFamily:"'DM Mono',monospace",marginBottom:8}}>DOSE ASSESSMENT</div>
            <div style={{color:COLORS.text,fontSize:14,fontFamily:"'DM Mono',monospace",lineHeight:1.7}}>
              <div>Total dose: <span style={{color:COLORS.accent,fontWeight:700}}>{(weight*dose).toFixed(0).replace(/\.?0+$/, "")} mg</span></div>
              <div style={{marginTop:8,color:dose<150?COLORS.success:dose<200?COLORS.warning:COLORS.danger,fontSize:13,fontWeight:600}}>
                {dose === 0 ? "▸ Enter dose to assess" : dose < 75 ? "▸ Non-toxic range (<75 mg/kg)" : dose < 150 ? "▸ Borderline toxic (75–150 mg/kg)" : dose < 200 ? "▸ Potentially toxic (150–200 mg/kg)" : "▸ Toxic — consider NAC"}
              </div>
              {dose > 0 && (
                <div style={{marginTop:8,color:COLORS.textMuted,fontSize:12}}>
                  NAC loading dose: <span style={{color:COLORS.accent,fontWeight:600}}>{nac_dose.toFixed(0).replace(/\.?0+$/, "")} mg IV</span> (150 mg/kg)
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {mode === "level" && (
        <>
          <NumberInput label="Hours Post-Ingestion" value={hours} onChange={setHours} min={1} max={24} unit="hr" />
          <NumberInput label="Serum Acetaminophen Level" value={level} onChange={setLevel} min={0} max={300} step={1} unit="mcg/mL" />
          
          {/* Show nomogram when valid data entered */}
          {hours >= 4 && hours <= 24 && level > 0 && <NomogramGraph />}
          
          {/* Results */}
          {rumackThreshold(hours) && level > 0 && (
            <ResultBadge
              score={toxic() ? "TREAT WITH NAC" : "BELOW LINE"}
              label={toxic() ? "Above Treatment Line → Start NAC Protocol" : "Below Treatment Line — No Treatment Indicated"}
              color={toxic() ? COLORS.danger : COLORS.success}
              sublabel={`Threshold at ${hours}h: ${rumackThreshold(hours).toFixed(1).replace(/\.?0+$/, "")} mcg/mL • Patient level: ${level} mcg/mL`}
            />
          )}
          
          {/* NAC dosing if toxic */}
          {toxic() && (
            <div style={{marginTop:14,padding:"14px 16px",borderRadius:12,background:"rgba(220,38,38,0.08)",border:`1.5px solid ${COLORS.danger}`}}>
              <div style={{color:COLORS.danger,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:600,marginBottom:8}}>
                NAC (N-Acetylcysteine) Protocol
              </div>
              <div style={{color:COLORS.text,fontSize:12,fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
                <div>• <strong>Loading:</strong> {nac_dose.toFixed(0).replace(/\.?0+$/, "")} mg IV over 1 hour</div>
                <div>• <strong>2nd dose:</strong> {(weight * 50).toFixed(0).replace(/\.?0+$/, "")} mg IV over 4 hours</div>
                <div>• <strong>3rd dose:</strong> {(weight * 100).toFixed(0).replace(/\.?0+$/, "")} mg IV over 16 hours</div>
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
      <NumberInput label="Total Serum Bilirubin" value={bili} onChange={setBili} min={0} max={35} step={0.1} unit="mg/dL" />
      <NumberInput label="Age" value={age_hrs} onChange={setAgeHrs} min={1} max={168} unit="hours of life" />
      <NumberInput label="Gestational Age at Birth" value={gestage} onChange={setGestage} min={35} max={42} unit="weeks" />
      <ScoreRow label="Risk Factors" value={risk} onChange={setRisk} options={[{value:"low",label:"Low (no risk factors)"},{value:"medium",label:"Medium"},{value:"high",label:"High (DAT+, isoimmune)"}]} />
      
      {bili > 0 && age_hrs >= 12 && (
        <>
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
        </>
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
    gcs:null, ams:null, scalp:null, loss:null, history:null, severe_mech:null,
    basal:null, vomit:null, ha:null
  });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  
  const highRisk = ageGroup === "younger"
    ? (vals.gcs===1 || vals.ams===1 || vals.scalp===2 || vals.loss===1 || vals.history===1 || vals.severe_mech===1)
    : (vals.gcs===1 || vals.ams===1 || vals.loss===1 || vals.vomit===1 || severe(vals) || vals.basal===1);
  
  function severe(v) { return v.severe_mech===1 || v.ha===1; }
  
  const filled = Object.values(vals).filter(v=>v!==null).length >= 5;
  const color = highRisk ? COLORS.danger : COLORS.success;
  const label = highRisk ? "CT Recommended" : "CT NOT Required (Low Risk)";
  
  return (
    <div>
      <ScoreRow label="Age Group" value={ageGroup} onChange={setAgeGroup} options={[{value:"younger",label:"<2 years"},{value:"older",label:"≥2 years"}]} />
      <ScoreRow label="GCS" value={vals.gcs} onChange={v=>set("gcs",v)} options={[{value:0,label:"0 — GCS 15"},{value:1,label:"1 — GCS 14 or <15"}]} />
      <ScoreRow label="Altered Mental Status" value={vals.ams} onChange={v=>set("ams",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes (agitation/slow/repetitive)"}]} />
      {ageGroup === "younger" && <>
        <ScoreRow label="Scalp Hematoma" value={vals.scalp} onChange={v=>set("scalp",v)} options={[{value:0,label:"0 — None/Frontal"},{value:1,label:"1 — Small non-frontal"},{value:2,label:"2 — Large non-frontal"}]} />
        <ScoreRow label="Loss of Consciousness" value={vals.loss} onChange={v=>set("loss",v)} options={[{value:0,label:"0 — No or <5 sec"},{value:1,label:"1 — ≥5 sec"}]} />
        <ScoreRow label="Not Acting Normally per Parent" value={vals.history} onChange={v=>set("history",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
        <ScoreRow label="Severe Mechanism" value={vals.severe_mech} onChange={v=>set("severe_mech",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes (MVC/fall >3ft)"}]} />
      </>}
      {ageGroup === "older" && <>
        <ScoreRow label="Loss of Consciousness" value={vals.loss} onChange={v=>set("loss",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
        <ScoreRow label="Vomiting" value={vals.vomit} onChange={v=>set("vomit",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
        <ScoreRow label="Severe Mechanism" value={vals.severe_mech} onChange={v=>set("severe_mech",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes (MVC/fall >5ft)"}]} />
        <ScoreRow label="Severe Headache" value={vals.ha} onChange={v=>set("ha",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
        <ScoreRow label="Signs of Basilar Skull Fx" value={vals.basal} onChange={v=>set("basal",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      </>}
      {filled && <ResultBadge score={label} label={highRisk ? "ciTBI risk elevated" : "ciTBI risk <1%"} color={color} sublabel="PECARN 2009 • ciTBI = clinically important TBI" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: FLUID MAINTENANCE (Holliday-Segar)
// ═══════════════════════════════════════════════════════════════════════════════
function FluidCalc() {
  const [weight, setWeight] = useState(20);
  const ml_day = weight <= 10 ? weight * 100 : weight <= 20 ? 1000 + (weight-10)*50 : 1500 + (weight-20)*20;
  const ml_hr = (ml_day / 24).toFixed(1).replace(/\.?0+$/, "");
  const d5w = (ml_day * 0.05 / 1000).toFixed(1).replace(/\.?0+$/, "");
  return (
    <div>
      <NumberInput label="Weight" value={weight} onChange={setWeight} min={0.5} max={100} step={0.5} unit="kg" />
      <div style={{marginTop:20,padding:"20px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:14}}>HOLLIDAY-SEGAR CALCULATION</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {label:"mL/day",value:ml_day.toFixed(0).replace(/\.?0+$/, "")},
            {label:"mL/hr",value:ml_hr},
            {label:"Formula",value:weight<=10?"100×wt":weight<=20?"1000+50×(wt−10)":"1500+20×(wt−20)"},
            {label:"Dextrose 5%",value:`${d5w} g dextrose`}
          ].map(item=>(
            <div key={item.label} style={{padding:"12px 14px",borderRadius:10,background:COLORS.bg,border:`1px solid ${COLORS.border}`}}>
              <div style={{color:COLORS.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em"}}>{item.label}</div>
              <div style={{color:COLORS.accent,fontSize:18,fontWeight:700,fontFamily:"'Sora',sans-serif",marginTop:4}}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: DOSE / WEIGHT CONVERSIONS
// ═══════════════════════════════════════════════════════════════════════════════
function DoseCalc() {
  const [weight, setWeight] = useState(20);
  const [drug, setDrug] = useState("acetaminophen");
  const DRUGS = {
    acetaminophen: { name:"Acetaminophen", dose:[10,15], unit:"mg/kg", max:"1000 mg/dose", freq:"q4–6h", route:"PO/IV/PR" },
    ibuprofen:     { name:"Ibuprofen", dose:[5,10], unit:"mg/kg", max:"400 mg/dose", freq:"q6–8h", route:"PO (≥6mo)" },
    amoxicillin:   { name:"Amoxicillin (standard)", dose:[25,45], unit:"mg/kg/day ÷ 2", max:"500 mg BID", freq:"BID", route:"PO" },
    azithromycin:  { name:"Azithromycin", dose:[10,10], unit:"mg/kg/day×1, then 5mg/kg", max:"500 mg", freq:"Daily ×5d", route:"PO/IV" },
    ceftriaxone:   { name:"Ceftriaxone", dose:[50,100], unit:"mg/kg/day", max:"2 g", freq:"Daily", route:"IV/IM" },
    morphine:      { name:"Morphine IV", dose:[0.05,0.1], unit:"mg/kg/dose", max:"4 mg", freq:"q3–4h PRN", route:"IV" },
    ondansetron:   { name:"Ondansetron", dose:[0.15,0.15], unit:"mg/kg/dose", max:"4 mg/dose", freq:"q8h PRN", route:"PO/IV" },
    dexamethasone: { name:"Dexamethasone (croup)", dose:[0.6,0.6], unit:"mg/kg×1", max:"10 mg", freq:"Single dose", route:"PO/IV/IM" },
    epinephrine:   { name:"Epinephrine (cardiac arrest)", dose:[0.01,0.01], unit:"mg/kg (1:10,000)", max:"1 mg", freq:"q3–5 min", route:"IV/IO" },
    atropine:      { name:"Atropine (bradycardia)", dose:[0.02,0.02], unit:"mg/kg", max:"1 mg", freq:"PRN q5min", route:"IV/IO" },
  };
  const d = DRUGS[drug];
  const low = (weight * d.dose[0]).toFixed(1).replace(/\.?0+$/, "");
  const high = (weight * d.dose[1]).toFixed(1).replace(/\.?0+$/, "");
  return (
    <div>
      <NumberInput label="Weight" value={weight} onChange={setWeight} min={0.5} max={100} step={0.5} unit="kg" />
      <div style={{marginBottom:14}}>
        <div style={{color:COLORS.textSub,fontSize:12,marginBottom:8,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em"}}>Drug</div>
        <select value={drug} onChange={e=>setDrug(e.target.value)} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.text,fontSize:14,fontFamily:"'DM Mono',monospace",outline:"none"}}>
          {Object.entries(DRUGS).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
        </select>
      </div>
      <div style={{marginTop:20,padding:"20px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:12}}>{d.name.toUpperCase()}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {label:"Low Dose",value:`${low} mg`},
            {label:"High Dose",value:`${high} mg`},
            {label:"Max Dose",value:d.max},
            {label:"Frequency",value:d.freq},
            {label:"Route",value:d.route},
            {label:"Per kg",value:`${d.dose[0]}–${d.dose[1]} ${d.unit}`}
          ].map(item=>(
            <div key={item.label} style={{padding:"10px 12px",borderRadius:8,background:COLORS.bg,border:`1px solid ${COLORS.border}`}}>
              <div style={{color:COLORS.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>{item.label}</div>
              <div style={{color:COLORS.accent,fontSize:15,fontWeight:700,fontFamily:"'Sora',sans-serif",marginTop:3}}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
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
  const [sex, setSex] = useState("male");
  
  // U25 Creatinine-based eGFR
  const k = sex === "male" ? 41.3 : 39.1;
  const egfr_scr = (k * height / creatinine).toFixed(1).replace(/\.?0+$/, "");
  
  // U25 Cystatin-C based eGFR  
  const egfr_cys = (70.69 * Math.pow(cystatin, -0.931)).toFixed(1).replace(/\.?0+$/, "");
  
  // Combined U25 equation (when both available)
  const egfr_combined = (39.8 * Math.pow(height / creatinine, 0.456) * Math.pow(1.8 / cystatin, 0.418) * Math.pow(30 / 18.5, 0.127)).toFixed(1).replace(/\.?0+$/, "");
  
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
  
  return (
    <div>
      <ScoreRow label="Calculation Method" value={method} onChange={setMethod} options={[
        {value:"scr",label:"SCr only"},
        {value:"cys",label:"Cystatin-C only"},
        {value:"both",label:"Combined (both)"}
      ]} />
      <NumberInput label="Age" value={age} onChange={setAge} min={0} max={25} step={0.5} unit="years (≤25)" />
      <NumberInput label="Height" value={height} onChange={setHeight} min={30} max={200} unit="cm" />
      <ScoreRow label="Sex" value={sex} onChange={setSex} options={[{value:"male",label:"Male"},{value:"female",label:"Female"}]} />
      
      {(method === "scr" || method === "both") && (
        <NumberInput label="Serum Creatinine" value={creatinine} onChange={setCreatinine} min={0.1} max={15} step={0.01} unit="mg/dL" />
      )}
      
      {(method === "cys" || method === "both") && (
        <NumberInput label="Cystatin C" value={cystatin} onChange={setCystatin} min={0.1} max={8} step={0.01} unit="mg/L" />
      )}
      
      <div style={{marginTop:16,padding:"14px 16px",borderRadius:10,background:COLORS.card,border:`1px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:10}}>CALCULATED eGFR VALUES</div>
        {(method === "scr" || method === "both") && (
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`}}>
            <span style={{color:COLORS.textSub,fontSize:13,fontFamily:"'DM Mono',monospace"}}>SCr-based (U25)</span>
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
function CATCHCalc() {
  const [vals, setVals] = useState({ gcs:null, skull_open:null, worsen:null, skull_sign:null, hematoma:null, dangerous:null });
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const high_risk = vals.gcs===1 || vals.skull_open===1 || vals.worsen===1;
  const medium_risk = vals.skull_sign===1 || vals.hematoma===1 || vals.dangerous===1;
  const filled = Object.values(vals).every(v=>v!==null);
  const color = high_risk ? COLORS.danger : medium_risk ? COLORS.warning : COLORS.success;
  const label = high_risk ? "HIGH RISK — CT Required" : medium_risk ? "MEDIUM RISK — CT Recommended" : "Low Risk — CT Likely Not Required";
  return (
    <div>
      <div style={{color:COLORS.textMuted,fontSize:11,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>HIGH RISK FACTORS</div>
      <ScoreRow label="GCS Score <15 at 2 hours" value={vals.gcs} onChange={v=>set("gcs",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Suspected Open/Depressed Skull Fx" value={vals.skull_open} onChange={v=>set("skull_open",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Worsening Headache or Vomiting" value={vals.worsen} onChange={v=>set("worsen",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <div style={{color:COLORS.textMuted,fontSize:11,marginBottom:10,marginTop:16,fontFamily:"'DM Mono',monospace"}}>MEDIUM RISK FACTORS</div>
      <ScoreRow label="Signs of Basilar Skull Fx" value={vals.skull_sign} onChange={v=>set("skull_sign",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Large Boggy Scalp Hematoma" value={vals.hematoma} onChange={v=>set("hematoma",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} />
      <ScoreRow label="Dangerous Mechanism" value={vals.dangerous} onChange={v=>set("dangerous",v)} options={[{value:0,label:"0 — No"},{value:1,label:"1 — MVC/Fall >3ft/Bike w/o helmet"}]} />
      {filled && <ResultBadge score={label} label={high_risk?"Neurologic intervention risk ~4%":medium_risk?"Brain injury risk elevated":"Low ciTBI risk"} color={color} sublabel="CATCH rule • Age 0–16 years" />}
    </div>
  );
}

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
function BurnsCalc() {
  const [weight, setWeight] = useState(20);
  const [bsa, setBsa] = useState(20);
  const parkland_24h = 4 * weight * bsa;
  const first8h = parkland_24h / 2;
  const next16h = parkland_24h / 2;
  return (
    <div>
      <NumberInput label="Weight" value={weight} onChange={setWeight} min={1} max={150} step={0.5} unit="kg" />
      <NumberInput label="% Total Body Surface Area (TBSA) Burned" value={bsa} onChange={setBsa} min={0} max={99} step={0.5} unit="%" />
      <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:COLORS.card,border:`1px solid ${COLORS.border}`,color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
        ⚠ Exclude superficial (1st degree) burns. Use Lund-Browder chart for pediatric BSA estimation.
      </div>
      <div style={{marginTop:16,padding:"20px",borderRadius:14,background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:12}}>PARKLAND FORMULA (4 mL/kg/% TBSA LR)</div>
        {[
          {l:"Total 24hr", v:`${parkland_24h.toFixed(0).replace(/\.?0+$/, "")} mL LR`},
          {l:"First 8hr", v:`${first8h.toFixed(0).replace(/\.?0+$/, "")} mL`},
          {l:"Next 16hr", v:`${next16h.toFixed(0).replace(/\.?0+$/, "")} mL`},
          {l:"Hourly (8hr window)", v:`${(first8h/8).toFixed(0).replace(/\.?0+$/, "")} mL/hr`},
        ].map(item=>(
          <div key={item.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${COLORS.border}`}}>
            <span style={{color:COLORS.textSub,fontSize:13,fontFamily:"'DM Mono',monospace"}}>{item.l}</span>
            <span style={{color:COLORS.accent,fontWeight:700,fontSize:14,fontFamily:"'Sora',sans-serif"}}>{item.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: CORRECTED QT (Bazett)
// ═══════════════════════════════════════════════════════════════════════════════
function QTcCalc() {
  const [qt, setQt] = useState(380);
  const [rr, setRr] = useState(800);
  const [hr, setHr] = useState(75);
  const [mode, setMode] = useState("hr");
  const rrMs = mode === "hr" ? (60000 / hr) : rr;
  const qtc = (qt / Math.sqrt(rrMs / 1000)).toFixed(0).replace(/\.?0+$/, "");
  const color = parseFloat(qtc) > 500 ? COLORS.danger : parseFloat(qtc) > 460 ? COLORS.warning : COLORS.success;
  const label = parseFloat(qtc) > 500 ? "Severely Prolonged — High TdP Risk" : parseFloat(qtc) > 480 ? "Borderline Prolonged" : parseFloat(qtc) > 440 ? "Mildly Prolonged" : "Normal QTc";
  return (
    <div>
      <ScoreRow label="HR Input Mode" value={mode} onChange={setMode} options={[{value:"hr",label:"Heart Rate (bpm)"},{value:"rr",label:"RR Interval (ms)"}]} />
      <NumberInput label="QT Interval" value={qt} onChange={setQt} min={200} max={800} unit="ms" />
      {mode==="hr" && <NumberInput label="Heart Rate" value={hr} onChange={setHr} min={30} max={250} unit="bpm" />}
      {mode==="rr" && <NumberInput label="RR Interval" value={rr} onChange={setRr} min={300} max={2000} unit="ms" />}
      <ResultBadge score={`${qtc} ms`} label={label} color={color} sublabel={`Bazett formula: QTc = QT / √(RR in sec) • RR = ${rrMs.toFixed(0).replace(/\.?0+$/, "")}ms`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: BISHOP SCORE (for completeness in peds context)
// Replaced with: PEDIATRIC PAIN SCALE (FLACC)
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
// CALCULATOR: NEONATAL BLOOD GLUCOSE — RISK ASSESSMENT
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
      <NumberInput label="Blood Glucose" value={glucose} onChange={setGlucose} min={0} max={500} step={1} unit="mg/dL" />
      <NumberInput label="Age" value={age_hrs} onChange={setAgeHrs} min={0} max={72} step={0.5} unit="hours of life" />
      <ScoreRow label="Symptomatic?" value={symptoms} onChange={setSymptoms} options={[{value:0,label:"0 — Asymptomatic"},{value:1,label:"1 — Symptomatic (jittery/seizure/apnea)"}]} />
      <ResultBadge score={`${glucose} mg/dL`} label={label} color={color} sublabel={`AAP 2011 thresholds: 0–4h: <40, 4–24h: <45, >24h: <50 mg/dL`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PRETERM RISK (Gestational Age Context)
// ═══════════════════════════════════════════════════════════════════════════════
function PretermCalc() {
  const [ga, setGa] = useState(32);
  const [birth_weight, setBirthWeight] = useState(1500);
  
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
      <NumberInput label="Gestational Age at Birth" value={ga} onChange={setGa} min={22} max={42} step={0.1} unit="weeks" />
      <NumberInput label="Birth Weight" value={birth_weight} onChange={setBirthWeight} min={200} max={6000} step={10} unit="grams" />
      <ResultBadge score={category} label={sga ? "SGA + Prematurity" : "AGA"} color={color} sublabel={`GA ${ga}w • BW ${birth_weight}g`} />
      {concerns.length > 0 && (
        <div style={{marginTop:14,padding:"14px 16px",borderRadius:12,background:COLORS.card,border:`1px solid ${COLORS.border}`}}>
          <div style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginBottom:10}}>ANTICIPATED CONCERNS</div>
          {concerns.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
              <span style={{color:COLORS.warning}}>▸</span>
              <span style={{color:COLORS.textSub,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PEDIATRIC DEHYDRATION (GORELICK)
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
          {l:"Na deficit",v:`${tbd.toFixed(1).replace(/\.?0+$/, "")} mEq`},
          {l:"Max correction rate",v:`${max_rate_hr} mEq/L/hr`},
          {l:"Max per 24hr",v:`${max_per_day} mEq/L/day`},
          {l:"NS (154 mEq/L) needed",v:`${ns_vol.toFixed(0).replace(/\.?0+$/, "")} mL`},
          {l:"3% NaCl needed",v:`${threePercent_vol.toFixed(0).replace(/\.?0+$/, "")} mL`},
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
  { id:"apgar", category:"neonatal", name:"APGAR Score", desc:"Neonatal vitality assessment at 1, 5, 10 min", component: ApgarCalc },
  { id:"pgcs", category:"neurologic", name:"Pediatric Glasgow Coma Scale", desc:"GCS adapted for infants and children", component: PGCSCalc },
  { id:"cows", category:"withdrawal", name:"COWS Score", desc:"Clinical Opiate Withdrawal Scale", component: COWSCalc },
  { id:"finnegan", category:"withdrawal", name:"Modified Finnegan NAS", desc:"Neonatal Abstinence Syndrome scoring", component: FinneganCalc },
  { id:"wat1", category:"withdrawal", name:"WAT-1", desc:"Withdrawal Assessment Tool — iatrogenic opioid/benzo", component: WATCalc },
  { id:"apap", category:"toxicology", name:"Acetaminophen Toxicity", desc:"Dose assessment + Rumack-Matthew nomogram", component: AcetaminophenCalc },
  { id:"bilirubin", category:"hepatic", name:"Neonatal Hyperbilirubinemia", desc:"Bhutani nomogram + phototherapy thresholds", component: BilirubinCalc },
  { id:"readmission", category:"readmission", name:"Pediatric Readmission Risk", desc:"30-day readmission risk estimation", component: ReadmissionCalc },
  { id:"pews", category:"readmission", name:"PEWS", desc:"Pediatric Early Warning Score", component: PEWSCalc },
  { id:"pecarn", category:"neurologic", name:"PECARN Head CT", desc:"CT rule for pediatric head trauma", component: PECARNCalc },
  { id:"fluid", category:"fluid", name:"Maintenance Fluids", desc:"Holliday-Segar method", component: FluidCalc },
  { id:"dose", category:"dosing", name:"Common Drug Doses", desc:"Weight-based pediatric dosing reference", component: DoseCalc },
  { id:"u25gfr", category:"renal", name:"U25 eGFR", desc:"Cystatin-C and SCr-based GFR for age ≤25 years", component: U25GFRCalc },
  { id:"sepsis", category:"sepsis", name:"Pediatric SIRS/Sepsis", desc:"Age-adjusted SIRS criteria and sepsis screening", component: SepsisCalc },
  { id:"dvt", category:"cardiac", name:"Wells DVT Score", desc:"DVT probability in children (adapted Wells)", component: DVTCalc },
  { id:"catch", category:"neurologic", name:"CATCH Head CT Rule", desc:"Canadian CT head injury rule for children", component: CATCHCalc },
  { id:"bronchiolitis", category:"respiratory", name:"Bronchiolitis Severity", desc:"Respiratory severity scoring for bronchiolitis", component: BronchiolitisCalc },
  { id:"asthma", category:"respiratory", name:"Asthma Severity (PRAM)", desc:"Pediatric Respiratory Assessment Measure", component: AsthmaCalc },
  { id:"burns", category:"fluid", name:"Burn Fluid Resuscitation", desc:"Parkland formula for pediatric burns", component: BurnsCalc },
  { id:"qtc", category:"cardiac", name:"Corrected QT (Bazett)", desc:"QTc calculation and risk assessment", component: QTcCalc },
  { id:"flacc", category:"readmission", name:"FLACC Pain Scale", desc:"Behavioral pain scale for non-verbal children", component: FLACCCalc },
  { id:"glucose", category:"neonatal", name:"Neonatal Hypoglycemia", desc:"AAP 2011 glucose thresholds by postnatal age", component: NeonatalGlucoseCalc },
  { id:"preterm", category:"neonatal", name:"Prematurity Risk Assessment", desc:"Category and anticipated concerns by GA/weight", component: PretermCalc },
  { id:"dehydration", category:"fluid", name:"Dehydration Score", desc:"Clinical dehydration assessment (WHO/Gorelick)", component: DehydrationCalc },
  { id:"kawasaki", category:"cardiac", name:"Kawasaki Disease Criteria", desc:"AHA 2017 diagnostic criteria", component: KawasakiCalc },
  { id:"natfrac", category:"sepsis", name:"NAT Fracture Risk", desc:"Non-accidental trauma fracture indicators", component: ChildAbuseFracCalc },
  { id:"sodium", category:"renal", name:"Hyponatremia Correction", desc:"Sodium deficit and correction rate calculation", component: SodiumCalc },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
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
              ←
            </button>
          )}
          <div style={{ flex: 1 }}>
            {activeCalc ? (
              <div style={{ animation: "fadeUp 0.2s ease" }}>
                <div style={{ color: COLORS.accentDim, fontSize: 9, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>
                  {CATEGORIES.find(c => c.id === activeCalc.category)?.label}
                </div>
                <div style={{ color: "#ffffff", fontSize: 16, fontWeight: 600, lineHeight: 1.2, marginTop: 2 }}>{activeCalc.name}</div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ color: "#ffffff", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>PediCalc</span>
                  <span style={{ color: COLORS.accentDim, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", marginLeft: 2 }}>EMR</span>
                </div>
                <div style={{ color: COLORS.accentDim, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
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
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.success, boxShadow: `0 0 6px ${COLORS.success}` }} />
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
            {/* CATEGORY TABS */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
              <button onClick={() => setActiveCategory("all")} style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 2, border: `1px solid ${activeCategory === "all" ? COLORS.accent : COLORS.border}`, background: activeCategory === "all" ? COLORS.accentGlow : COLORS.bg, color: activeCategory === "all" ? COLORS.accent : COLORS.textMuted, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap", fontWeight: 500 }}>
                All ({CALCULATORS.length})
              </button>
              {CATEGORIES.map(cat => {
                const count = CALCULATORS.filter(c => c.category === cat.id).length;
                if (!count) return null;
                return (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 2, border: `1px solid ${activeCategory === cat.id ? COLORS.accent : COLORS.border}`, background: activeCategory === cat.id ? COLORS.accentGlow : COLORS.bg, color: activeCategory === cat.id ? COLORS.accent : COLORS.textMuted, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap", fontWeight: 500 }}>
                    {cat.icon} {cat.label}
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
            {/* DISCLAIMER */}
            <div style={{ margin: "12px 0 8px", padding: "8px 12px", borderRadius: 2, background: "rgba(217,130,43,0.06)", border: `1px solid ${COLORS.warning}` }}>
              <div style={{ color: COLORS.warning, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.5, fontWeight: 500 }}>
                ⚠ For clinical decision support only. Always verify with clinical judgment and current guidelines.
              </div>
            </div>

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
                      padding: "10px 12px",
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
                    <div style={{ width: 32, height: 32, borderRadius: 2, background: COLORS.accentGlow, border: `1px solid ${COLORS.accentDim}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {cat?.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: COLORS.navy, fontSize: 13, fontWeight: 600, lineHeight: 1.2, fontFamily: "'IBM Plex Sans', sans-serif" }}>{calc.name}</div>
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
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "8px 16px 20px", background: `linear-gradient(transparent, ${COLORS.bg} 40%)`, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", display: "flex", justifyContent: "center" }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 2, padding: "5px 12px", fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textMuted, fontWeight: 500 }}>
            PediCalc EMR · {CALCULATORS.length} tools · Clinical Support
          </div>
        </div>
      </div>
    </div>
  );
}
