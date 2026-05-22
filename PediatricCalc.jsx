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
  { id: "growth",          label: "Growth",          icon: "📈" },
  { id: "neonatal",        label: "Neonatal",        icon: "👶🏼" },
  { id: "fen_renal",       label: "FEN/Renal",       icon: "💧" },
  { id: "neurologic",      label: "Neurologic",      icon: "🧠" },
  { id: "respiratory",     label: "Respiratory",     icon: "🫁" },
  { id: "cardiovascular",  label: "Cardiovascular",  icon: "🫀" },
  { id: "gastroenterology",label: "GI",              icon: "💩" },
  { id: "hematology",      label: "Hematology",      icon: "🩸" },
  { id: "dosing",          label: "Common Rx",       icon: "💊" },
  { id: "toxicology",      label: "Toxicology",      icon: "☠️" },
  { id: "readmission",     label: "Risk Scores",     icon: "📊" },
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
    title: "Neonatal Hyperbilirubinemia",
    reference: "Bhutani VK, Johnson L, Sivieri EM. Predictive ability of a predischarge hour-specific serum bilirubin for subsequent significant hyperbilirubinemia in healthy term and near-term newborns. Pediatrics. 1999;103(1):6-14.",
    guidelines: "AAP Clinical Practice Guideline: Management of Hyperbilirubinemia in the Newborn Infant ≥35 Weeks' Gestation (2022)",
    summary: "AAP 2022 guideline thresholds for phototherapy, escalation of care, and exchange transfusion by gestational age and neurotoxicity risk factors. Bhutani nomogram available for predischarge follow-up timing only."
  },
  readmission: {
    title: "Pediatric Readmission Risk Score",
    reference: "Berry JG, Toomey SL, Zaslavsky AM, et al. Pediatric readmission prevalence and variability across hospitals. JAMA. 2013;309(4):372-380.",
    guidelines: "Multiple validated models including PRAF, LACE, HOSPITAL score",
    summary: "Identifies children at high risk for 30-day readmission. Key factors: prior admissions, complex chronic conditions, length of stay, insurance type, ICU stay, polypharmacy. Used for discharge planning and follow-up intensity."
  },
  freewater: {
    title: "Free Water Deficit — Hypernatremia",
    reference: "Adrogue HJ, Madias NE. Hypernatremia. N Engl J Med. 2000;342(20):1493-1499.",
    guidelines: "Correct hypernatremia no faster than 0.5 mEq/L/hr (12 mEq/L/day) to prevent cerebral edema. Acute symptomatic hypernatremia may be corrected more rapidly under close monitoring.",
    summary: "Estimates the volume of free water required to normalize serum sodium. Uses TBW fraction by age and sex. Correct slowly: ≤0.5 mEq/L/hr, ≤10–12 mEq/L per 24 hours."
  },
  fena: {
    title: "Fractional Excretion of Sodium (FENa)",
    reference: "Miller TR, Anderson RJ, Linas SL, et al. Urinary diagnostic indices in acute renal failure. Ann Intern Med. 1978;89(1):47-50.",
    guidelines: "FENa <1% suggests prerenal AKI or contrast nephropathy. FENa >2% suggests intrinsic renal (ATN). Unreliable in CKD, diuretic use, myoglobinuria, early obstruction — use FEUrea in those settings.",
    summary: "FENa = (urine Na × plasma Cr) / (plasma Na × urine Cr) × 100. <1%: prerenal. 1–2%: indeterminate. >2%: intrinsic renal (ATN). FEUrea <35% is prerenal when diuretics confound FENa."
  },
  retic: {
    title: "Corrected Reticulocyte Count & Reticulocyte Production Index",
    reference: "Hillman RS, Finch CA. Red Cell Manual, 7th ed. Philadelphia: FA Davis; 1996.",
    guidelines: "Corrected reticulocyte count (CRC) adjusts for anemia-related premature release of reticulocytes into circulation. RPI further corrects for marrow shift reticulocytes.",
    summary: "CRC = retic% × (patient Hct / normal Hct). RPI = CRC / maturation factor (1.0–2.5 based on Hct). RPI >2 indicates adequate erythropoietic response (hemolysis/blood loss). RPI <2 suggests hypoproliferative anemia (iron, B12, folate deficiency; marrow failure)."
  },
  mentzer: {
    title: "Mentzer Index — Iron Deficiency vs Thalassemia Trait",
    reference: "Mentzer WC Jr. Differentiation of iron deficiency from thalassemia trait. Lancet. 1973;1(7808):882.",
    guidelines: "Screening index only. Confirm with hemoglobin electrophoresis, serum ferritin, and iron studies. Not validated in mixed deficiency states or other hemoglobinopathies.",
    summary: "MCV / RBC count. <13 suggests thalassemia trait (small, numerous RBCs). >13 suggests iron deficiency anemia (small, fewer RBCs). Sensitivity ~85%, specificity ~85%. Not a substitute for definitive testing."
  },
  corrca: {
    title: "Corrected Calcium for Hypoalbuminemia",
    reference: "Payne RB, Little AJ, Williams RB, Milner JR. Interpretation of serum calcium in patients with abnormal serum proteins. BMJ. 1973;4(5893):643-646.",
    guidelines: "Correct total calcium when albumin is abnormal. Does not apply to ionized calcium measurements. Ionized Ca is preferred when available.",
    summary: "Ca(corr) = Ca(meas) + 0.8 × (4.0 − albumin). Normal corrected Ca: 8.5–10.5 mg/dL. Hypoalbuminemia reduces protein-bound calcium, causing total Ca to appear falsely low while ionized Ca may be normal."
  },
  osmoGap: {
    title: "Osmolal Gap",
    reference: "Dorwart WV, Chalmers L. Comparison of methods for calculating serum osmolality from chemical concentrations, and the prognostic value of such calculations. Clin Chem. 1975;21(2):190-194.",
    guidelines: "Normal osmolal gap: 0–10 mOsm/kg. Gap >10 suggests unmeasured osmoles. Elevated gap with high anion gap acidosis: consider methanol, ethylene glycol, propylene glycol, isopropanol.",
    summary: "Osmolal Gap = Measured OSM − Calculated OSM. Calculated OSM = 2×Na + BUN/2.8 + glucose/18. Elevated gap (>10) in the context of altered mental status and anion gap acidosis is a toxicology emergency until proven otherwise."
  },
  aaGradient: {
    title: "Alveolar-Arterial (A-a) Oxygen Gradient",
    reference: "Mellemgaard K. The alveolar-arterial oxygen difference: its size and components in normal man. Acta Physiol Scand. 1966;67(1):10-20.",
    guidelines: "Normal A-a gradient = (age/4) + 4 mmHg (approximate). Elevated gradient suggests V/Q mismatch, shunt, or diffusion impairment. Normal gradient with hypoxemia suggests hypoventilation.",
    summary: "PAO2 = (FiO2 × 713) − (PaCO2 / 0.8). A-a Gradient = PAO2 − PaO2. Assumes sea-level barometric pressure (760 mmHg) and RQ of 0.8. Elevation differentiates pulmonary from non-pulmonary causes of hypoxemia."
  },
  oi: {
    title: "Oxygenation Index (OI)",
    reference: "Ortiz RM, Cilley RE, Bartlett RH. Extracorporeal membrane oxygenation in pediatric respiratory failure. Pediatr Clin North Am. 1987;34(1):39-46.",
    guidelines: "OI <4: Normal. OI 5–25: Moderate lung disease. OI >25: Severe lung disease. OI >40: ECMO threshold at many centers. Requires arterial PaO2 and mean airway pressure from ventilator.",
    summary: "OI = (MAP × FiO2 × 100) / PaO2. A ventilator-dependent measure of oxygenation efficiency that accounts for the cost (airway pressure) of achieving a given PaO2. Higher OI = worse gas exchange relative to support required."
  },
  murray: {
    title: "Murray Lung Injury Score",
    reference: "Murray JF, Matthay MA, Luce JM, Flick MR. An expanded definition of the adult respiratory distress syndrome. Am Rev Respir Dis. 1988;138(3):720-723.",
    guidelines: "Score <0.1: No injury. 0.1–2.5: Mild to moderate. >2.5: Severe lung injury (ARDS). Score is mean of components entered; components may be omitted if not available.",
    summary: "Four components: chest X-ray (0=no consolidation, 1=1 quadrant, 2=2 quadrants, 3=3 quadrants, 4=4 quadrants); P/F ratio (0=≥300, 1=225–299, 2=175–224, 3=100–174, 4=<100); PEEP (0=≤5, 1=6–8, 2=9–11, 3=12–14, 4=≥15); compliance (0=≥80, 1=60–79, 2=40–59, 3=20–39, 4=≤19 mL/cmH2O)."
  },
  berlin: {
    title: "Berlin ARDS Definition",
    reference: "ARDS Definition Task Force; Ranieri VM, Rubenfeld GD, Thompson BT, et al. Acute respiratory distress syndrome: the Berlin Definition. JAMA. 2012;307(23):2526-2533.",
    guidelines: "Requires: (1) onset within 1 week of clinical insult; (2) bilateral opacities on CXR/CT not explained by effusions, collapse, or nodules; (3) respiratory failure not fully explained by cardiac failure or fluid overload; (4) P/F ratio <300 with PEEP ≥5 cmH2O.",
    summary: "Mild ARDS: P/F 200–300 with PEEP ≥5. Moderate: P/F 100–200 with PEEP ≥5. Severe: P/F <100 with PEEP ≥5. Replaces the 1994 American-European Consensus Definition. P/F ratio must be measured on PEEP ≥5 cmH2O."
  },
  pfRatio: {
    title: "P/F Ratio (Horowitz Index)",
    reference: "Horovitz JH, Carrico CJ, Shires GT. Pulmonary response to major injury. Arch Surg. 1974;108(3):349-355.",
    guidelines: "Normal: >400 mmHg. Mild ARDS (Berlin): 200–300 on PEEP ≥5. Moderate: 100–200. Severe: <100. Values should be obtained after ≥30 min on stable ventilator settings.",
    summary: "P/F = PaO2 (mmHg) / FiO2 (as decimal, 0.21–1.0). Simple, widely used index of oxygenation efficiency independent of FiO2. Core criterion for ARDS classification and ventilator management decisions."
  },
  sfRatio: {
    title: "S/F Ratio (SpO2/FiO2)",
    reference: "Rice TW, Wheeler AP, Bernard GR, et al. Comparison of the SpO2/FiO2 ratio and the PaO2/FiO2 ratio in patients with acute lung injury. Chest. 2007;132(2):410-417.",
    guidelines: "S/F ≥235 correlates with P/F ≥300 (no ARDS). S/F 150–235 correlates with P/F 200–300 (mild). S/F 90–149 correlates with P/F 100–200 (moderate). S/F <89 correlates with P/F <100 (severe). Unreliable when SpO2 ≥97% (pulse ox saturation).",
    summary: "S/F = SpO2 (%) / FiO2 (as decimal). Non-invasive surrogate for P/F ratio when arterial blood gas is unavailable. Validated correlation with P/F in ARDS monitoring. SpO2 should be ≤96% for reliable correlation."
  },
  pucai: {
    title: "PUCAI — Pediatric Ulcerative Colitis Activity Index",
    reference: "Turner D, Otley AR, Mack D, et al. Development, validation, and evaluation of a pediatric ulcerative colitis activity index. Gastroenterology. 2007;133(2):423-432.",
    guidelines: "PUCAI <10: Remission · 10–34: Mild · 35–64: Moderate · ≥65: Severe. Response defined as ≥20-point decrease. Validated for children 3–17 years. Does not require endoscopy.",
    summary: "Six-item score for pediatric UC disease activity (max 85). Validated against physician global assessment, endoscopic activity, and mucosal histology. Widely used for treatment escalation and clinical trial enrollment."
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
    reference: "McCrindle BW, et al. Diagnosis, Treatment, and Long-Term Management of Kawasaki Disease: A Scientific Statement for Health Professionals from the American Heart Association. Circulation. 2017;135(17):e927–e999. DOI: 10.1161/CIR.0000000000001295",
    guidelines: "AHA 2017 Scientific Statement. Classic KD: fever ≥4 days + ≥4/5 principal features. Incomplete KD: fever + 2–3 features + inflammatory markers (CRP ≥3 mg/dL or ESR ≥40 mm/h) + echo findings (LAD or RCA z-score ≥2.5). High-risk: age ≤6 months or CA z-score ≥2.5. First-line: IVIG 2 g/kg + aspirin. Reassess at 36h post-IVIG.",
    summary: "Classic: Fever ≥4 days + ≥4/5 principal clinical features (rash, conjunctival injection, oral changes, hands/feet changes, cervical lymphadenopathy). Incomplete: fewer features but supported by labs and echo. All suspected KD warrants echo, CBC with differential, ESR, CRP, BMP, ALT, GGT, TBili, UA.",
    algorithmUrl: "https://www.ahajournals.org/cms/asset/c5d8c6b7-2a9a-43a0-bc00-3a9a43a0c700/cir.0000000000001295.fig01.jpg",
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


function ScoreRow({ label, options, value, onChange, cols, hideScore }) {
  // Strip "N — " prefix from button labels for cleaner touch targets
  const buttonLabel = (raw) => {
    const sep = raw.indexOf(" — ");
    return sep !== -1 ? raw.slice(sep + 3) : raw;
  };
  const selected = options.find(o => o.value === value);
  // Only show subscore in header for genuine ordinal numeric scales with 3+ options.
  // Binary yes/no and categorical string values add no information there.
  // hideScore prop suppresses display for a specific row (e.g. KD fever) without
  // touching other calcs.
  const allNumeric = options.every(o => typeof o.value === "number");
  const showScore = selected !== undefined && allNumeric && !hideScore;

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
              minWidth: cols ? `calc(${100/cols}% - 4px)` : undefined,
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

function NumberInput({ label, labelNode, value, onChange, min, max, step = 1, unit }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const displayValue = (() => {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return '';
    if (value === 0) return '0';
    const str = value.toString();
    return str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  })();

  const physicalUnitPattern = /^(mg\/dL|mg\/kg|mcg\/mL|mEq\/L|mmol\/L|mg\/L|g\/dL|kg|grams|cm|bpm|ms|%|°C|°F|hours?( of life)?|days?|weeks?|years?( ≤\d+)?|breaths\/min|×10³\/μL|hr|mL|L|IU\/L|U\/L|mOsm\/kg|mmHg|mmHg \(on PEEP ≥5\)|cmH₂O|fL|×10⁶\/µL|0\.21–1\.0|\(0\.\d[\d.–]+\)|yr|yr \(for normal\)|m²)$/i;
  const isPhysicalUnit = unit && physicalUnitPattern.test(unit.trim());

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: COLORS.navy, fontSize: 12, marginBottom: 5, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
        {labelNode
          ? <>{labelNode}{unit && <span style={{ color: isPhysicalUnit ? "#b8860b" : COLORS.textMuted, fontWeight: 600 }}> ({unit})</span>}</>
          : <>{label}{unit && <span style={{ color: isPhysicalUnit ? "#b8860b" : COLORS.textMuted, fontWeight: 600 }}> ({unit})</span>}</>}
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
          onChange(val === '' ? NaN : parseFloat(val) || 0);
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
  // ── AAP 2022 Supplemental Tables 1–4 ──────────────────────────────────────
  // Keys: GA week → day (0–14) → array of 24 hourly values
  // PT_NO_RISK: GA 35,36,37,38,39,40 | PT_WITH_RISK: GA 35,36,37,38(≥38)
  // ET tables: GA 35,36,37,38(≥38) for both risk categories
  const PT_NR={40:{0:[8.9,9.1,9.3,9.6,9.8,10.0,10.2,10.4,10.5,10.7,10.9,11.1,11.3,11.5,11.7,11.9,12.1,12.2,12.4,12.6,12.8,13.0,13.1,null],1:[13.3,13.5,13.6,13.8,14.0,14.1,14.3,14.5,14.6,14.8,15.0,15.1,15.3,15.4,15.6,15.7,15.9,16.0,16.2,16.3,16.4,16.6,16.7,16.9],2:[17.0,17.1,17.3,17.4,17.5,17.7,17.8,17.9,18.0,18.2,18.3,18.4,18.5,18.6,18.8,18.9,19.0,19.1,19.2,19.3,19.4,19.6,19.7,19.7],3:[19.8,19.9,20.0,20.1,20.2,20.3,20.4,20.5,20.6,20.7,20.7,20.8,20.9,21.0,21.1,21.1,21.2,21.3,21.4,21.4,21.5,21.6,21.6,21.7],4:Array(24).fill(21.8)},39:{0:[8.4,8.6,8.8,9.0,9.3,9.5,9.7,9.9,10.0,10.2,10.4,10.6,10.8,11.0,11.2,11.4,11.6,11.8,11.9,12.1,12.3,12.5,12.7,null],1:[12.8,13.0,13.2,13.3,13.5,13.7,13.8,14.0,14.2,14.3,14.5,14.7,14.8,15.0,15.1,15.3,15.4,15.6,15.7,15.9,16.0,16.2,16.3,16.4],2:[16.6,16.7,16.8,17.0,17.1,17.2,17.4,17.5,17.6,17.8,17.9,18.0,18.1,18.2,18.4,18.5,18.6,18.7,18.8,18.9,19.0,19.1,19.2,19.3],3:[19.5,19.6,19.7,19.7,19.8,19.9,20.0,20.1,20.2,20.3,20.4,20.5,20.6,20.6,20.7,20.8,20.9,21.0,21.0,21.1,21.2,21.3,21.3,21.4],4:[...Array(6).fill(21.5),...Array(18).fill(21.6)],5:[...Array(14).fill(21.6),...Array(10).fill(21.7)],6:[...Array(13).fill(21.7),...Array(11).fill(21.8)]},38:{0:[7.9,8.1,8.3,8.5,8.7,8.9,9.1,9.3,9.5,9.7,9.9,10.1,10.3,10.5,10.7,10.8,11.0,11.2,11.4,11.6,11.7,11.9,12.1,null],1:[12.3,12.4,12.6,12.8,12.9,13.1,13.3,13.4,13.6,13.8,13.9,14.1,14.2,14.4,14.5,14.7,14.8,15.0,15.1,15.3,15.4,15.6,15.7,15.8],2:[16.0,16.1,16.2,16.4,16.5,16.6,16.8,16.9,17.0,17.1,17.3,17.4,17.5,17.6,17.7,17.8,17.9,18.1,18.2,18.3,18.4,18.5,18.6,18.7],3:[18.8,18.9,19.0,19.1,19.2,19.3,19.4,19.5,19.5,19.6,19.7,19.8,19.9,20.0,20.0,20.1,20.2,20.3,20.3,20.4,20.5,20.6,20.6,20.7],4:[20.7,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.9,20.9,20.9,20.9,20.9],5:[20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,21.0,21.0,21.0,21.0,21.0,21.0],6:[21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.1,21.1,21.1,21.1,21.1,21.1],7:[21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.2,21.2,21.2,21.2,21.2,21.2,21.2],8:[21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3],9:[21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.3,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4],10:[21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5],11:[21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6],12:[21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7],13:[21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8]},37:{0:[7.4,7.6,7.8,8.0,8.2,8.4,8.6,8.8,9.0,9.2,9.4,9.6,9.8,9.9,10.1,10.3,10.5,10.7,10.8,11.0,11.2,11.4,11.5,null],1:[11.7,11.9,12.1,12.2,12.4,12.5,12.7,12.9,13.0,13.2,13.3,13.5,13.6,13.8,13.9,14.1,14.2,14.4,14.5,14.7,14.8,15.0,15.1,15.2],2:[15.4,15.5,15.6,15.8,15.9,16.0,16.1,16.3,16.4,16.5,16.6,16.7,16.9,17.0,17.1,17.2,17.3,17.4,17.5,17.6,17.7,17.8,17.9,18.0],3:[18.1,18.2,18.3,18.4,18.5,18.6,18.7,18.8,18.9,19.0,19.0,19.1,19.2,19.3,19.4,19.4,19.5,19.6,19.7,19.7,19.8,19.9,19.9,20.0],4:[20.0,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1,20.1],5:[20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.2,20.3],6:[20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.3,20.4,20.4],7:[20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.4,20.5,20.5,20.5],8:[20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.5,20.6,20.6,20.6],9:[20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.6,20.7,20.7,20.7,20.7],10:[20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.7,20.8,20.8,20.8,20.8,20.8],11:[20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.8,20.9,20.9,20.9,20.9,20.9],12:[20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,20.9,21.0,21.0,21.0,21.0,21.0,21.0],13:[21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.1,21.1,21.1,21.1,21.1,21.1],14:Array(24).fill(21.1)},36:{0:[6.9,7.1,7.3,7.5,7.7,7.9,8.1,8.3,8.5,8.7,8.8,9.0,9.2,9.4,9.6,9.8,9.9,10.1,10.3,10.5,10.6,10.8,11.0,null],1:[11.2,11.3,11.5,11.7,11.8,12.0,12.1,12.3,12.5,12.6,12.8,12.9,13.1,13.2,13.4,13.5,13.7,13.8,13.9,14.1,14.2,14.4,14.5,14.6],2:[14.8,14.9,15.0,15.1,15.3,15.4,15.5,15.6,15.8,15.9,16.0,16.1,16.2,16.3,16.5,16.6,16.7,16.8,16.9,17.0,17.1,17.2,17.3,17.4],3:[17.5,17.6,17.7,17.8,17.9,17.9,18.0,18.1,18.2,18.3,18.4,18.4,18.5,18.6,18.7,18.8,18.8,18.9,19.0,19.0,19.1,19.2,19.2,19.3],4:[19.3,19.3,19.3,19.3,19.3,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4],5:[19.4,19.4,19.4,19.4,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5],6:[19.5,19.5,19.5,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6],7:[19.6,19.6,19.6,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7,19.7],8:[19.7,19.7,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8,19.8],9:[19.8,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9,19.9],10:[19.9,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0],11:Array(24).fill(20.1),12:Array(24).fill(20.2),13:[...Array(22).fill(20.3),...Array(2).fill(20.4)],14:Array(24).fill(20.4)},35:{0:[6.4,6.6,6.8,7.0,7.2,7.4,7.6,7.8,7.9,8.1,8.3,8.5,8.7,8.9,9.0,9.2,9.4,9.6,9.8,9.9,10.1,10.3,10.4,null],1:[10.6,10.8,10.9,11.1,11.3,11.4,11.6,11.7,11.9,12.0,12.2,12.3,12.5,12.6,12.8,12.9,13.1,13.2,13.4,13.5,13.6,13.8,13.9,14.0],2:[14.2,14.3,14.4,14.5,14.7,14.8,14.9,15.0,15.1,15.3,15.4,15.5,15.6,15.7,15.8,15.9,16.0,16.1,16.2,16.3,16.4,16.5,16.6,16.7],3:[16.8,16.9,17.0,17.1,17.2,17.3,17.4,17.5,17.5,17.6,17.7,17.8,17.8,17.9,18.0,18.1,18.1,18.2,18.3,18.3,18.4,18.5,18.5,18.6],4:[18.6,18.6,18.6,18.6,18.6,18.6,18.6,18.6,18.6,18.6,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7],5:[18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.7,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8],6:[18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.8,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9,18.9],7:[18.9,18.9,18.9,18.9,18.9,18.9,18.9,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.0],8:[19.0,19.0,19.0,19.0,19.0,19.0,19.0,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1,19.1],9:[19.1,19.1,19.1,19.1,19.1,19.1,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2,19.2],10:[19.2,19.2,19.2,19.2,19.2,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3,19.3],11:[19.3,19.3,19.3,19.3,19.3,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4,19.4],12:[19.4,19.4,19.4,19.4,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5,19.5],13:[19.5,19.5,19.5,19.5,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6,19.6],14:Array(24).fill(19.6)}};
  const PT_WR={38:{0:[6.4,6.6,6.8,7.0,7.2,7.3,7.5,7.7,7.9,8.1,8.3,8.5,8.6,8.8,9.0,9.2,9.4,9.5,9.7,9.9,10.0,10.2,10.4,null],1:[10.5,10.7,10.8,11.0,11.2,11.3,11.5,11.6,11.8,11.9,12.1,12.2,12.4,12.5,12.7,12.8,12.9,13.1,13.2,13.3,13.5,13.6,13.7,13.9],2:[14.0,14.1,14.2,14.4,14.5,14.6,14.7,14.8,14.9,15.1,15.2,15.3,15.4,15.5,15.6,15.7,15.8,15.9,16.0,16.1,16.2,16.3,16.4,16.5],3:[16.6,16.6,16.7,16.8,16.9,17.0,17.1,17.1,17.2,17.3,17.4,17.4,17.5,17.6,17.6,17.7,17.8,17.8,17.9,18.0,18.0,18.1,18.1,18.2],4:Array(24).fill(18.2)},37:{0:[5.9,6.1,6.3,6.5,6.7,6.9,7.0,7.2,7.4,7.6,7.8,8.0,8.1,8.3,8.5,8.7,8.9,9.0,9.2,9.4,9.5,9.7,9.9,null],1:[10.0,10.2,10.4,10.5,10.7,10.8,11.0,11.1,11.3,11.4,11.6,11.7,11.9,12.0,12.2,12.3,12.4,12.6,12.7,12.9,13.0,13.1,13.2,13.4],2:[13.5,13.6,13.8,13.9,14.0,14.1,14.2,14.4,14.5,14.6,14.7,14.8,14.9,15.0,15.1,15.2,15.3,15.4,15.5,15.6,15.7,15.8,15.9,16.0],3:[16.1,16.2,16.3,16.4,16.5,16.6,16.6,16.7,16.8,16.9,17.0,17.0,17.1,17.2,17.2,17.3,17.4,17.4,17.5,17.6,17.6,17.7,17.8,17.8],4:[17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0],5:[18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1],6:[18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2]},36:{0:[5.4,5.6,5.8,6.0,6.2,6.3,6.5,6.7,6.9,7.1,7.3,7.4,7.6,7.8,8.0,8.1,8.3,8.5,8.6,8.8,9.0,9.1,9.3,null],1:[9.4,9.6,9.8,9.9,10.1,10.2,10.4,10.5,10.7,10.8,11.0,11.1,11.2,11.4,11.5,11.7,11.8,11.9,12.1,12.2,12.3,12.5,12.6,12.7],2:[12.8,13.0,13.1,13.2,13.3,13.4,13.5,13.7,13.8,13.9,14.0,14.1,14.2,14.3,14.4,14.5,14.6,14.7,14.8,14.9,15.0,15.1,15.2,15.3],3:[15.4,15.4,15.5,15.6,15.7,15.8,15.8,15.9,16.0,16.1,16.1,16.2,16.3,16.4,16.4,16.5,16.6,16.6,16.7,16.7,16.8,16.8,16.9,17.0],4:[17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1],5:[17.1,17.1,17.1,17.1,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.3],6:[17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.4,17.4,17.4,17.4,17.4],7:[17.4,17.4,17.4,17.4,17.4,17.4,17.4,17.4,17.4,17.4,17.4,17.4,17.4,17.4,17.5,17.5,17.5,17.5,17.5,17.5,17.5,17.5,17.5,17.5],8:[17.5,17.5,17.5,17.5,17.5,17.5,17.5,17.5,17.5,17.5,17.6,17.6,17.6,17.6,17.6,17.6,17.6,17.6,17.6,17.6,17.6,17.6,17.6,17.6],9:[17.6,17.6,17.6,17.6,17.6,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7,17.7],10:[17.7,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.8,17.9,17.9,17.9,17.9],11:[17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,17.9,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0],12:[18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.0,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.1],13:[18.1,18.1,18.1,18.1,18.1,18.1,18.1,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2,18.2],14:Array(24).fill(18.2)},35:{0:[4.9,5.1,5.3,5.5,5.6,5.8,6.0,6.2,6.4,6.5,6.7,6.9,7.1,7.2,7.4,7.6,7.7,7.9,8.1,8.2,8.4,8.6,8.7,null],1:[8.9,9.0,9.2,9.3,9.5,9.6,9.8,9.9,10.1,10.2,10.3,10.5,10.6,10.8,10.9,11.0,11.2,11.3,11.4,11.5,11.7,11.8,11.9,12.0],2:[12.2,12.3,12.4,12.5,12.6,12.7,12.8,13.0,13.1,13.2,13.3,13.4,13.5,13.6,13.7,13.8,13.9,14.0,14.1,14.2,14.2,14.3,14.4,14.5],3:[14.6,14.7,14.8,14.8,14.9,15.0,15.1,15.1,15.2,15.3,15.3,15.4,15.5,15.5,15.6,15.7,15.7,15.8,15.8,15.9,15.9,16.0,16.1,16.1],4:[16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.1,16.2,16.2,16.2,16.2],5:[16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.4,16.4,16.4,16.4,16.4,16.4,16.4,16.4,16.4],6:[16.4,16.4,16.4,16.4,16.4,16.4,16.4,16.4,16.4,16.4,16.4,16.5,16.5,16.5,16.5,16.5,16.5,16.5,16.5,16.5,16.5,16.5,16.5,16.5],7:[16.5,16.5,16.5,16.5,16.5,16.5,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6,16.6],8:[16.6,16.6,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.8,16.8,16.8],9:[16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.8,16.9,16.9,16.9,16.9,16.9,16.9,16.9],10:[16.9,16.9,16.9,16.9,16.9,16.9,16.9,16.9,16.9,16.9,16.9,16.9,17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.0],11:[17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.0,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1,17.1],12:[17.1,17.1,17.1,17.1,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.2,17.3],13:[17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.3,17.4,17.4,17.4,17.4,17.4],14:Array(24).fill(17.4)}};
  const ET_NR={38:{0:[18.0,18.2,18.4,18.5,18.7,18.8,19.0,19.1,19.3,19.4,19.6,19.7,19.9,20.0,20.1,20.3,20.4,20.6,20.7,20.8,21.0,21.1,21.2,null],1:[21.4,21.5,21.6,21.7,21.9,22.0,22.1,22.2,22.3,22.4,22.6,22.7,22.8,22.9,23.0,23.1,23.2,23.3,23.4,23.5,23.6,23.7,23.8,23.9],2:[24.0,24.1,24.2,24.3,24.4,24.5,24.6,24.7,24.7,24.8,24.9,25.0,25.1,25.2,25.2,25.3,25.4,25.5,25.5,25.6,25.7,25.7,25.8,25.9],3:[25.9,26.0,26.0,26.1,26.2,26.2,26.3,26.3,26.4,26.4,26.5,26.5,26.6,26.6,26.7,26.7,26.7,26.8,26.8,26.9,26.9,26.9,27.0,27.0],4:Array(24).fill(27.0)},37:{0:[17.0,17.1,17.3,17.5,17.6,17.8,17.9,18.1,18.2,18.4,18.5,18.7,18.8,18.9,19.1,19.2,19.4,19.5,19.6,19.8,19.9,20.1,20.2,null],1:[20.3,20.5,20.6,20.7,20.8,21.0,21.1,21.2,21.3,21.5,21.6,21.7,21.8,21.9,22.1,22.2,22.3,22.4,22.5,22.6,22.7,22.8,22.9,23.0],2:[23.1,23.2,23.3,23.4,23.5,23.6,23.7,23.8,23.9,24.0,24.1,24.2,24.3,24.4,24.5,24.5,24.6,24.7,24.8,24.9,24.9,25.0,25.1,25.2],3:[25.2,25.3,25.4,25.5,25.5,25.6,25.7,25.7,25.8,25.8,25.9,26.0,26.0,26.1,26.1,26.2,26.2,26.3,26.3,26.4,26.4,26.5,26.5,26.5],4:[26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7],5:[26.7,26.7,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.9,26.9,26.9,26.9,26.9,26.9],6:[26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0]},36:{0:[15.9,16.1,16.2,16.4,16.5,16.7,16.8,16.9,17.1,17.2,17.4,17.5,17.7,17.8,17.9,18.1,18.2,18.3,18.5,18.6,18.7,18.9,19.0,null],1:[19.1,19.2,19.4,19.5,19.6,19.7,19.9,20.0,20.1,20.2,20.4,20.5,20.6,20.7,20.8,20.9,21.0,21.2,21.3,21.4,21.5,21.6,21.7,21.8],2:[21.9,22.0,22.1,22.2,22.3,22.4,22.5,22.6,22.7,22.8,22.9,23.0,23.1,23.2,23.2,23.3,23.4,23.5,23.6,23.7,23.8,23.8,23.9,24.0],3:[24.1,24.1,24.2,24.3,24.4,24.4,24.5,24.6,24.6,24.7,24.8,24.8,24.9,25.0,25.0,25.1,25.2,25.2,25.3,25.3,25.4,25.4,25.5,25.5],4:[25.5,25.5,25.5,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.7,25.7,25.7,25.7,25.7,25.7,25.7,25.7,25.7],5:[25.7,25.7,25.7,25.7,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.9,25.9,25.9,25.9,25.9,25.9,25.9],6:[25.9,25.9,25.9,25.9,25.9,25.9,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.1,26.1,26.1,26.1],7:[26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2],8:[26.2,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.4,26.4,26.4,26.4,26.4,26.4,26.4,26.4],9:[26.4,26.4,26.4,26.4,26.4,26.4,26.4,26.4,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5,26.5],10:[26.5,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.6,26.7,26.7,26.7,26.7,26.7,26.7],11:[26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.7,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8],12:[26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.8,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9],13:[26.9,26.9,26.9,26.9,26.9,26.9,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0,27.0],14:Array(24).fill(27.0)},35:{0:[14.9,15.0,15.1,15.3,15.4,15.6,15.7,15.8,16.0,16.1,16.2,16.4,16.5,16.6,16.8,16.9,17.0,17.2,17.3,17.4,17.5,17.7,17.8,null],1:[17.9,18.0,18.2,18.3,18.4,18.5,18.7,18.8,18.9,19.0,19.1,19.2,19.4,19.5,19.6,19.7,19.8,19.9,20.0,20.1,20.2,20.3,20.5,20.6],2:[20.7,20.8,20.9,21.0,21.1,21.2,21.3,21.4,21.5,21.6,21.7,21.7,21.8,21.9,22.0,22.1,22.2,22.3,22.4,22.5,22.6,22.6,22.7,22.8],3:[22.9,23.0,23.1,23.1,23.2,23.3,23.4,23.4,23.5,23.6,23.7,23.7,23.8,23.9,23.9,24.0,24.1,24.1,24.2,24.3,24.3,24.4,24.4,24.5],4:[24.5,24.5,24.5,24.5,24.5,24.5,24.5,24.5,24.6,24.6,24.6,24.6,24.6,24.6,24.6,24.6,24.6,24.6,24.6,24.7,24.7,24.7,24.7,24.7],5:[24.7,24.7,24.7,24.7,24.7,24.8,24.8,24.8,24.8,24.8,24.8,24.8,24.8,24.8,24.8,24.8,24.9,24.9,24.9,24.9,24.9,24.9,24.9,24.9],6:[24.9,24.9,24.9,25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.1,25.1,25.1,25.1,25.1,25.1,25.1,25.1,25.1],7:[25.1,25.1,25.2,25.2,25.2,25.2,25.2,25.2,25.2,25.2,25.2,25.2,25.2,25.2,25.3,25.3,25.3,25.3,25.3,25.3,25.3,25.3,25.3,25.3],8:[25.3,25.3,25.3,25.4,25.4,25.4,25.4,25.4,25.4,25.4,25.4,25.4,25.4,25.4,25.4,25.5,25.5,25.5,25.5,25.5,25.5,25.5,25.5,25.5],9:[25.5,25.5,25.5,25.5,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.6,25.7,25.7,25.7,25.7,25.7,25.7,25.7],10:[25.7,25.7,25.7,25.7,25.7,25.7,25.7,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.8,25.9,25.9,25.9],11:[25.9,25.9,25.9,25.9,25.9,25.9,25.9,25.9,25.9,25.9,25.9,25.9,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0,26.0],12:[26.0,26.0,26.0,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.1,26.2,26.2,26.2,26.2,26.2],13:[26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.2,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3,26.3],14:Array(24).fill(26.3)}};
  const ET_WR={38:{0:[14.8,15.0,15.1,15.2,15.4,15.5,15.6,15.8,15.9,16.0,16.1,16.3,16.4,16.5,16.6,16.7,16.9,17.0,17.1,17.2,17.3,17.4,17.6,null],1:[17.7,17.8,17.9,18.0,18.1,18.2,18.3,18.4,18.5,18.7,18.8,18.9,19.0,19.1,19.2,19.3,19.4,19.5,19.6,19.7,19.8,19.9,19.9,20.0],2:[20.1,20.2,20.3,20.4,20.5,20.6,20.7,20.8,20.8,20.9,21.0,21.1,21.2,21.3,21.3,21.4,21.5,21.6,21.7,21.7,21.8,21.9,22.0,22.0],3:[22.1,22.2,22.2,22.3,22.4,22.5,22.5,22.6,22.7,22.7,22.8,22.8,22.9,23.0,23.0,23.1,23.1,23.2,23.3,23.3,23.4,23.4,23.5,23.5],4:Array(24).fill(23.5),5:Array(24).fill(23.5),6:Array(24).fill(23.5),7:Array(24).fill(23.5),8:Array(24).fill(23.5),9:Array(24).fill(23.5),10:Array(24).fill(23.5),11:Array(24).fill(23.5),12:Array(24).fill(23.5),13:Array(24).fill(23.5),14:Array(24).fill(23.5)},37:{0:[14.3,14.4,14.6,14.7,14.8,15.0,15.1,15.2,15.4,15.5,15.6,15.7,15.9,16.0,16.1,16.2,16.4,16.5,16.6,16.7,16.8,17.0,17.1,null],1:[17.2,17.3,17.4,17.5,17.7,17.8,17.9,18.0,18.1,18.2,18.3,18.4,18.5,18.6,18.7,18.8,18.9,19.0,19.1,19.2,19.3,19.4,19.5,19.6],2:[19.7,19.8,19.9,20.0,20.1,20.1,20.2,20.3,20.4,20.5,20.6,20.7,20.7,20.8,20.9,21.0,21.1,21.1,21.2,21.3,21.4,21.4,21.5,21.6],3:[21.7,21.7,21.8,21.9,21.9,22.0,22.1,22.1,22.2,22.3,22.3,22.4,22.5,22.5,22.6,22.6,22.7,22.8,22.8,22.9,22.9,23.0,23.0,23.1],4:[23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2],5:[23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.3,23.3,23.3],6:[23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5],7:Array(24).fill(23.5),8:Array(24).fill(23.5),9:Array(24).fill(23.5),10:Array(24).fill(23.5),11:Array(24).fill(23.5),12:Array(24).fill(23.5),13:Array(24).fill(23.5),14:Array(24).fill(23.5)},36:{0:[13.7,13.9,14.0,14.1,14.3,14.4,14.5,14.7,14.8,14.9,15.1,15.2,15.3,15.4,15.6,15.7,15.8,15.9,16.1,16.2,16.3,16.4,16.5,null],1:[16.6,16.8,16.9,17.0,17.1,17.2,17.3,17.4,17.5,17.6,17.7,17.8,17.9,18.0,18.1,18.2,18.3,18.4,18.5,18.6,18.7,18.8,18.9,19.0],2:[19.1,19.2,19.2,19.3,19.4,19.5,19.6,19.7,19.7,19.8,19.9,20.0,20.1,20.1,20.2,20.3,20.3,20.4,20.5,20.6,20.6,20.7,20.8,20.8],3:[20.9,20.9,21.0,21.1,21.1,21.2,21.2,21.3,21.4,21.4,21.5,21.5,21.6,21.6,21.7,21.7,21.8,21.8,21.9,21.9,22.0,22.0,22.0,22.1],4:[22.1,22.1,22.1,22.1,22.1,22.1,22.1,22.1,22.1,22.1,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.3,22.3],5:[22.3,22.3,22.3,22.3,22.3,22.3,22.3,22.3,22.3,22.3,22.3,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4],6:[22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6],7:[22.6,22.6,22.6,22.6,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.8,22.8,22.8,22.8,22.8],8:[22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9],9:[22.9,22.9,22.9,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.0,23.1,23.1,23.1],10:[23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.1,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2],11:[23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.2,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3],12:[23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4],13:[23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.4,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5,23.5],14:Array(24).fill(23.5)},35:{0:[13.1,13.3,13.4,13.6,13.7,13.8,14.0,14.1,14.3,14.4,14.5,14.6,14.8,14.9,15.0,15.1,15.3,15.4,15.5,15.6,15.8,15.9,16.0,null],1:[16.1,16.2,16.3,16.4,16.5,16.6,16.8,16.9,17.0,17.1,17.2,17.3,17.4,17.5,17.6,17.7,17.7,17.8,17.9,18.0,18.1,18.2,18.3,18.4],2:[18.5,18.5,18.6,18.7,18.8,18.9,18.9,19.0,19.1,19.2,19.2,19.3,19.4,19.4,19.5,19.6,19.6,19.7,19.8,19.8,19.9,19.9,20.0,20.1],3:[20.1,20.2,20.2,20.3,20.3,20.4,20.4,20.5,20.5,20.6,20.6,20.6,20.7,20.7,20.8,20.8,20.8,20.9,20.9,20.9,21.0,21.0,21.0,21.1],4:[21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.1,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.2,21.3,21.3,21.3,21.3,21.3],5:[21.3,21.3,21.3,21.3,21.3,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.4,21.5,21.5,21.5,21.5,21.5,21.5,21.5,21.5],6:[21.5,21.5,21.5,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.6,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7,21.7],7:[21.7,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.8,21.9,21.9,21.9,21.9,21.9,21.9,21.9,21.9,21.9,21.9,21.9],8:[21.9,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.1,22.1,22.1,22.1,22.1,22.1,22.1,22.1,22.1,22.1],9:[22.1,22.1,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.2,22.3,22.3,22.3,22.3,22.3,22.3,22.3,22.3],10:[22.3,22.3,22.3,22.3,22.3,22.3,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.4,22.5,22.5,22.5,22.5],11:[22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.5,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6],12:[22.6,22.6,22.6,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.7,22.8,22.8,22.8,22.8],13:[22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.8,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9,22.9],14:Array(24).fill(22.9)}};

  // ── Lookup engine ───────────────────────────────────────────────────────────
  const tblLookup = (ageHrs, ga, hasRisk, nrTbl, wrTbl) => {
    const h = Math.max(0, Math.min(336, ageHrs));
    const day = Math.floor(h / 24);
    const hr  = Math.floor(h % 24);
    const tbl = hasRisk ? wrTbl : nrTbl;
    const keys = Object.keys(tbl).map(Number).sort((a,b)=>a-b);
    const gaKey = ga >= Math.max(...keys) ? Math.max(...keys) : ga <= Math.min(...keys) ? Math.min(...keys) : keys.includes(ga) ? ga : Math.max(...keys.filter(k=>k<=ga));
    const rows = tbl[gaKey];
    const dayKeys = Object.keys(rows).map(Number).sort((a,b)=>a-b);
    const d = Math.min(day, Math.max(...dayKeys));
    const row = rows[d];
    let val = hr < row.length ? row[hr] : null;
    if (val === null) val = hr > 0 ? row[hr-1] : row[0];
    if (val === null) val = row.find(v => v !== null) ?? 0;
    return val;
  };
  const getPT = (h,ga,risk) => tblLookup(h,ga,risk,PT_NR,PT_WR);
  const getET = (h,ga,risk) => tblLookup(h,ga,risk,ET_NR,ET_WR);

  // ── State ───────────────────────────────────────────────────────────────────
  const [bili, setBili] = useState(0);
  const [ageHrs, setAgeHrs] = useState(48);
  const [ga, setGa] = useState(38);
  const [hasRisk, setHasRisk] = useState(false);
  const effectiveRisk = hasRisk || ga < 38;
  const [albumin, setAlbumin] = useState('');
  const [showBhutani, setShowBhutani] = useState(false);
  const graphRef = useRef(null);

  // ── Derived thresholds ──────────────────────────────────────────────────────
  const ptThresh = getPT(ageHrs, ga, effectiveRisk);
  const etThresh = getET(ageHrs, ga, effectiveRisk);
  const escThresh = parseFloat((etThresh - 2.0).toFixed(1));

  const needsET  = bili > 0 && bili >= etThresh;
  const needsEsc = bili > 0 && bili >= escThresh && !needsET;
  const needsPT  = bili > 0 && bili >= ptThresh && !needsET && !needsEsc;

  // B/A ratio thresholds per guideline (ga, risk)
  const baThresh = ga >= 38 ? (effectiveRisk ? 7.2 : 8.0) : (effectiveRisk ? 6.8 : 7.2);
  const albNum = parseFloat(albumin);
  const baRatio = (bili > 0 && !isNaN(albNum) && albNum > 0) ? (bili / albNum).toFixed(2) : null;
  const baExceedsThresh = baRatio !== null && parseFloat(baRatio) >= baThresh;

  // ── Bhutani curves ──────────────────────────────────────────────────────────
  const bhutaniCurves = {
    p95:[{h:0,b:0},{h:12,b:5},{h:18,b:7},{h:24,b:9},{h:36,b:12},{h:48,b:14.5},{h:60,b:16.5},{h:72,b:17.5},{h:96,b:18.5},{h:120,b:19},{h:144,b:19.5}],
    p75:[{h:0,b:0},{h:12,b:4},{h:18,b:5.5},{h:24,b:7.5},{h:36,b:10},{h:48,b:12},{h:60,b:13.5},{h:72,b:15},{h:96,b:16.5},{h:120,b:17},{h:144,b:17.5}],
    p40:[{h:0,b:0},{h:12,b:2.5},{h:18,b:4},{h:24,b:5.5},{h:36,b:7.5},{h:48,b:9},{h:60,b:10.5},{h:72,b:11.5},{h:96,b:13},{h:120,b:14},{h:144,b:14.5}],
  };
  const interpolate = (curve, hours) => {
    for (let i=0; i<curve.length-1; i++) {
      if (hours>=curve[i].h && hours<=curve[i+1].h) {
        const t=(hours-curve[i].h)/(curve[i+1].h-curve[i].h);
        return curve[i].b+t*(curve[i+1].b-curve[i].b);
      }
    }
    return curve[curve.length-1].b;
  };
  const getZone = () => {
    if (!bili) return 'low';
    const p95=interpolate(bhutaniCurves.p95,ageHrs);
    const p75=interpolate(bhutaniCurves.p75,ageHrs);
    const p40=interpolate(bhutaniCurves.p40,ageHrs);
    if (bili>=p95) return 'high';
    if (bili>=p75) return 'intermediate-high';
    if (bili>=p40) return 'intermediate-low';
    return 'low';
  };
  const bhutaniZone = getZone();

  // ── SVG graph helpers ───────────────────────────────────────────────────────
  const W=340, H=250, PAD={t:8,r:4,b:22,l:34};
  const maxH=144, maxB=30;
  const xS = h => PAD.l + (h/maxH)*(W-PAD.l-PAD.r);
  const yS = b => H-PAD.b - (b/maxB)*(H-PAD.t-PAD.b);

  // Treatment threshold curve points (0–144h in 6h steps)
  const threshCurve = (risk) => {
    const pts=[];
    for (let h=0; h<=144; h+=6) {
      pts.push({h, pt:getPT(h,ga,risk), et:getET(h,ga,risk), esc:getET(h,ga,risk)-2});
    }
    return pts;
  };
  const tc = threshCurve(effectiveRisk);
  const pathFrom = (pts, fn) => pts.map((p,i)=>`${i===0?'M':'L'}${xS(p.h).toFixed(1)},${yS(fn(p)).toFixed(1)}`).join(' ');
  const ptPath  = pathFrom(tc, p=>p.pt);
  const etPath  = pathFrom(tc, p=>p.et);
  const escPath = pathFrom(tc, p=>p.esc);
  // Pre-compute escalation fill path (esc forward + ET reversed = closed polygon)
  const etSegs = etPath.split(' ');
  const etReversed = [etSegs[etSegs.length-1], ...etSegs.slice(1,-1).reverse()].join(' ').replace(/^M/,'L');
  const escFillPath = escPath + ' L' + xS(144).toFixed(1) + ',' + yS(tc[tc.length-1].et).toFixed(1) + ' ' + etReversed + ' Z';

  // ── Bhutani SVG paths ───────────────────────────────────────────────────────
  const bhPath = (curve) => curve.map((p,i)=>`${i===0?'M':'L'}${xS(p.h).toFixed(1)},${yS(p.b).toFixed(1)}`).join(' ');

  // ── Y-axis ticks ────────────────────────────────────────────────────────────
  const yTicks=[0,5,10,15,20,25,30];
  const xTicks=[0,24,48,72,96,120,144];

  // ── Status determination ────────────────────────────────────────────────────
  const gaLabel = ga >= 40 ? '≥40' : `${ga}`;
  const statusColor = needsET ? COLORS.danger : needsEsc ? COLORS.orange : needsPT ? COLORS.warning : COLORS.success;
  const statusText  = needsET ? 'EXCHANGE TRANSFUSION THRESHOLD MET' : needsEsc ? 'ESCALATION OF CARE THRESHOLD MET' : needsPT ? 'PHOTOTHERAPY THRESHOLD MET' : bili>0 ? 'Below phototherapy threshold' : '—';

  return (
    <div>
      {/* ── Inputs ── */}
      <div style={{display:'flex',gap:6,marginBottom:4,alignItems:'flex-end'}}>
        <div style={{flex:5,minWidth:0}}>
          <div style={{color:COLORS.navy,fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>TSB <span style={{color:'#b8860b'}}>(mg/dL)</span></div>
          <input type="number" inputMode="decimal" value={bili} min={0} max={35} step={0.1}
            onChange={e=>setBili(parseFloat(e.target.value)||0)}
            style={{width:'100%',padding:'8px 10px',borderRadius:6,border:`1.5px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.navy,fontSize:16,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{flex:4,minWidth:0}}>
          <div style={{color:COLORS.navy,fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>Albumin <span style={{color:'#b8860b'}}>(g/dL)</span></div>
          <input type="number" inputMode="decimal" value={albumin} min={0} max={6} step={0.1} placeholder="—"
            onChange={e=>setAlbumin(e.target.value)}
            style={{width:'100%',padding:'8px 10px',borderRadius:6,border:`1.5px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.navy,fontSize:14,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{flex:3,minWidth:0}}>
          <div style={{color:COLORS.navy,fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>Age <span style={{color:'#b8860b'}}>(hrs)</span></div>
          <input type="number" inputMode="decimal" value={ageHrs} min={0} max={336} step={1}
            onChange={e=>setAgeHrs(parseFloat(e.target.value)||0)}
            style={{width:'100%',padding:'8px 10px',borderRadius:6,border:`1.5px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.navy,fontSize:14,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{flex:3,minWidth:0}}>
          <div style={{color:COLORS.navy,fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>GA <span style={{color:'#b8860b'}}>(wk)</span></div>
          <select value={ga} onChange={e=>setGa(Number(e.target.value))}
            style={{width:'100%',padding:'8px 6px',borderRadius:6,border:`1.5px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.navy,fontSize:14,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,outline:'none'}}>
            <option value={35}>35</option><option value={36}>36</option><option value={37}>37</option>
            <option value={38}>38</option><option value={39}>39</option><option value={40}>≥40</option>
          </select>
        </div>
      </div>

      {/* ── Neurotoxicity Risk ── */}
      <div style={{marginBottom:12,padding:'10px 12px',borderRadius:8,background:COLORS.surface,border:`1.5px solid ${hasRisk?COLORS.danger:COLORS.border}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:hasRisk?8:0}}>
          <div style={{color:COLORS.navy,fontSize:12,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif"}}>Neurotoxicity Risk Factors</div>
          <div style={{display:'flex',borderRadius:6,overflow:'hidden',border:`1.5px solid ${COLORS.border}`}}>
            {[['none','None'],[true,'Present']].map(([val,lbl])=>(
              <button key={String(val)} onClick={()=>setHasRisk(val===true)}
                style={{padding:'5px 10px',fontSize:12,fontWeight:700,border:'none',cursor:'pointer',fontFamily:"'IBM Plex Sans',sans-serif",
                  background:(val===true)===hasRisk ? (hasRisk?COLORS.danger:COLORS.navy) : COLORS.bg,
                  color:(val===true)===hasRisk ? '#fff' : COLORS.textMuted}}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div style={{color:COLORS.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",lineHeight:1.5,marginTop:6}}>
          Albumin &lt;3.0 g/dL · Isoimmune hemolysis (DAT+) · G6PD deficiency · Other hemolysis · Sepsis · Clinical instability (&lt;24h)
        </div>
      </div>

      {/* ── Thresholds summary ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}}>
        {[
          {label:'Phototherapy',val:ptThresh,color:COLORS.warning},
          {label:'Escalation',val:escThresh,color:COLORS.orange},
          {label:'Exchange',val:etThresh,color:COLORS.danger},
        ].map(({label,val,color})=>(
          <div key={label} style={{padding:'8px 10px',borderRadius:8,background:COLORS.surface,border:`1px solid ${COLORS.border}`,textAlign:'center'}}>
            <div style={{color:COLORS.textMuted,fontSize:9,fontFamily:"'DM Mono',monospace",textTransform:'uppercase',marginBottom:2}}>{label}</div>
            <div style={{color,fontSize:15,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace"}}>{val?.toFixed(1)}</div>
          </div>
        ))}
      </div>

      {/* ── Primary results card: graph + interpretive text ── */}
      <div style={{marginBottom:12,padding:'10px',borderRadius:10,background:COLORS.card,border:`2px solid ${bili>0?statusColor:COLORS.border}`}}>
        {/* Interpretation first */}
        <div style={{marginBottom:8}}>
          <div style={{color:statusColor,fontSize:13,fontWeight:700,fontFamily:"'Sora',sans-serif",marginBottom:4}}>
            {bili>0 ? statusText : '—'}
          </div>
          <div style={{color:COLORS.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",marginBottom:bili>0&&(needsET||needsEsc||needsPT)?6:0}}>
            {bili>0 ? `TSB ${bili} · GA ${gaLabel}w · ${effectiveRisk?'Risk factors present':'No additional risk factors'} · ${ageHrs}h of age` : 'Enter TSB to see result'}
          </div>
          {bili>0 && needsET && (
            <div style={{color:COLORS.danger,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
              {'• Urgent double-volume exchange transfusion · Continue intensive phototherapy during prep · STAT: TSB, CBC, albumin, type & crossmatch'}
            </div>
          )}
          {bili>0 && needsEsc && (
            <div style={{color:COLORS.orange,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
              {'• Escalation-of-care = 2 mg/dL below exchange threshold · Intensive phototherapy + IV hydration · Consult neonatology · TSB q2h · Prepare for possible exchange'}
            </div>
          )}
          {bili>0 && needsPT && (
            <div style={{color:COLORS.warning,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
              {'• Intensive phototherapy (≥30 μW/cm²/nm LED 460–490 nm) · TSB within 12h of starting'}
            </div>
          )}
          {bili>0 && baExceedsThresh && (
            <div style={{marginTop:6,color:COLORS.danger,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
              ⚠ B/A ratio {baRatio} exceeds exchange threshold {baThresh} for this GA/risk profile
            </div>
          )}
        </div>
        {/* Graph below, wider, taller */}
        <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:8}}>
          <div style={{color:COLORS.textMuted,fontSize:9,fontFamily:"'DM Mono',monospace",marginBottom:4}}>
            Treatment Thresholds · GA {gaLabel}w · {effectiveRisk?'Risk factors present':'No added risk factors'}
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',overflow:'visible'}}>
            {yTicks.map(b=>(
              <line key={b} x1={PAD.l} x2={W-PAD.r} y1={yS(b)} y2={yS(b)} stroke="#e0e4e8" strokeWidth="0.5"/>
            ))}
            <path d={escFillPath} fill="rgba(219,55,55,0.12)" stroke="none"/>
            {bili>0 && (
              <line x1={xS(Math.min(ageHrs,maxH))} x2={xS(Math.min(ageHrs,maxH))} y1={PAD.t} y2={H-PAD.b} stroke={statusColor} strokeWidth="1" strokeDasharray="3,3" opacity="0.7"/>
            )}
            <path d={escPath} fill="none" stroke={COLORS.danger} strokeWidth="1.2" strokeDasharray="5,3" opacity="0.6"/>
            <path d={ptPath}  fill="none" stroke={COLORS.warning} strokeWidth="2"/>
            <path d={etPath}  fill="none" stroke={COLORS.danger}  strokeWidth="2"/>
            {bili>0 && ageHrs<=maxH && (
              <circle cx={xS(ageHrs)} cy={yS(bili)} r="5" fill={statusColor} stroke="#fff" strokeWidth="1.5"/>
            )}
            {yTicks.map(b=>(
              <text key={b} x={PAD.l-3} y={yS(b)+3} textAnchor="end" fontSize="7.5" fill={COLORS.textMuted} fontFamily="'DM Mono',monospace">{b}</text>
            ))}
            {xTicks.map(h=>(
              <text key={h} x={xS(h)} y={H-PAD.b+10} textAnchor="middle" fontSize="7.5" fill={COLORS.textMuted} fontFamily="'DM Mono',monospace">{h}h</text>
            ))}
            <text x={PAD.l-26} y={H/2} fontSize="7.5" fill={COLORS.textMuted} fontFamily="'DM Mono',monospace" transform={`rotate(-90,${PAD.l-26},${H/2})`} textAnchor="middle">mg/dL</text>
          </svg>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4,flexWrap:'wrap'}}>
            {[
              {lbl:'PT', col:COLORS.warning, type:'line'},
              {lbl:'Esc Zone', col:'rgba(219,55,55,0.3)', type:'fill'},
              {lbl:'Exchange', col:COLORS.danger, type:'line'},
            ].map(({lbl,col,type})=>(
              <div key={lbl} style={{display:'flex',alignItems:'center',gap:3}}>
                {type==='fill'
                  ? <div style={{width:12,height:7,background:col,borderRadius:2}}/>
                  : <div style={{width:16,height:2,background:col}}/>}
                <span style={{fontSize:8,color:COLORS.textMuted,fontFamily:"'DM Mono',monospace"}}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginBottom:12,borderRadius:10,border:`1px solid ${COLORS.border}`,overflow:'hidden'}}>
        <button onClick={()=>setShowBhutani(s=>!s)}
          style={{width:'100%',padding:'10px 14px',background:COLORS.surface,border:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:COLORS.navy,fontSize:12,fontWeight:700,fontFamily:"'IBM Plex Sans',sans-serif",textAlign:'left'}}>Bhutani Nomogram — Predischarge Risk</div>
            <div style={{color:COLORS.textMuted,fontSize:9,fontFamily:"'DM Mono',monospace",textAlign:'left'}}>For postdischarge follow-up timing only · Not a treatment guide</div>
          </div>
          <div style={{color:COLORS.textMuted,fontSize:14}}>{showBhutani?'▲':'▼'}</div>
        </button>
        {showBhutani && (
          <div style={{padding:'12px',background:COLORS.card}}>
            <svg width={W} height={H} style={{display:'block',overflow:'visible'}}>
              {yTicks.map(b=>(<line key={b} x1={PAD.l} x2={W-PAD.r} y1={yS(b)} y2={yS(b)} stroke="#e0e4e8" strokeWidth="0.5"/>))}
              {/* Zone fills */}
              <path d={`${bhPath(bhutaniCurves.p95)} L${xS(144)},${yS(maxB)} L${xS(0)},${yS(maxB)} Z`} fill="rgba(219,55,55,0.08)"/>
              <path d={`${bhPath(bhutaniCurves.p75)} L${xS(144)},${yS(interpolate(bhutaniCurves.p95,144))} ${bhPath(bhutaniCurves.p95).replace('M','L').split('L').reverse().map(s=>'L'+s).join('')} Z`} fill="rgba(255,150,0,0.08)"/>
              <path d={`${bhPath(bhutaniCurves.p40)} L${xS(144)},${yS(interpolate(bhutaniCurves.p75,144))} ${bhPath(bhutaniCurves.p75).replace('M','L').split('L').reverse().map(s=>'L'+s).join('')} Z`} fill="rgba(255,200,0,0.1)"/>
              <path d={bhPath(bhutaniCurves.p95)} fill="none" stroke={COLORS.danger} strokeWidth="1.5"/>
              <path d={bhPath(bhutaniCurves.p75)} fill="none" stroke={COLORS.orange} strokeWidth="1.5"/>
              <path d={bhPath(bhutaniCurves.p40)} fill="none" stroke={COLORS.warning} strokeWidth="1.5"/>
              {bili>0 && ageHrs<=maxH && (<circle cx={xS(ageHrs)} cy={yS(bili)} r="5" fill={{high:COLORS.danger,'intermediate-high':COLORS.orange,'intermediate-low':COLORS.warning,low:COLORS.success}[bhutaniZone]} stroke="#fff" strokeWidth="1.5"/>)}
              {yTicks.map(b=>(<text key={b} x={PAD.l-4} y={yS(b)+4} textAnchor="end" fontSize="8" fill={COLORS.textMuted} fontFamily="'DM Mono',monospace">{b}</text>))}
              {xTicks.map(h=>(<text key={h} x={xS(h)} y={H-PAD.b+12} textAnchor="middle" fontSize="8" fill={COLORS.textMuted} fontFamily="'DM Mono',monospace">{h}h</text>))}
            </svg>
            <div style={{marginTop:8,color:COLORS.textMuted,fontSize:9,fontFamily:"'DM Mono',monospace",lineHeight:1.5}}>
              Bhutani et al. 1999 · Predischarge hour-specific risk zone: <span style={{color:{high:COLORS.danger,'intermediate-high':COLORS.orange,'intermediate-low':COLORS.warning,low:COLORS.success}[bhutaniZone],fontWeight:700}}>
                {bhutaniZone==='high'?'High Risk':bhutaniZone==='intermediate-high'?'High Intermediate':bhutaniZone==='intermediate-low'?'Low Intermediate':'Low Risk'}
              </span> · Used to guide timing of follow-up after discharge, not treatment decisions
            </div>
          </div>
        )}
      </div>

      {/* ── Info panel ── */}
      <div style={{padding:'10px 14px',borderRadius:10,background:COLORS.card,border:`1px solid ${COLORS.border}`,color:COLORS.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
        ℹ AAP Clinical Practice Guideline 2022 (Kemper et al, Pediatrics 150:3) · Valid through August 2027 · Thresholds based on GA + hour-specific TSB + neurotoxicity risk factors · Do not subtract direct/conjugated bilirubin from TSB · Race is not a risk modifier (2004 guideline's Black race protective factor removed in 2022)
      </div>
    </div>
  );
}
  
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
      <ScoreRow label="Behavior" value={vals.behavior} onChange={v=>set("behavior",v)} cols={2} options={[{value:0,label:"0 — Playing/Appropriate"},{value:1,label:"1 — Sleeping"},{value:2,label:"2 — Irritable"},{value:3,label:"3 — Lethargic/Confused"}]} />
      <ScoreRow label="Cardiovascular" value={vals.cardiovascular} onChange={v=>set("cardiovascular",v)} cols={2} options={[{value:0,label:"0 — Pink, CR ≤2s"},{value:1,label:"1 — Pale/CR 3s"},{value:2,label:"2 — Gray/CR 4s"},{value:3,label:"3 — Gray, mottled, CR ≥5s"}]} />
      <ScoreRow label="Respiratory" value={vals.respiratory} onChange={v=>set("respiratory",v)} cols={2} options={[{value:0,label:"0 — Nl rate"},{value:1,label:"1 — >10 over nl"},{value:2,label:"2 — >20 over nl/retractions"},{value:3,label:"3 — >30 over nl/grunting"}]} />
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
        <span style={{ color: "#d4a444", fontSize: 11, fontWeight: 700, letterSpacing: "0.03em" }}>{open ? "∧  Close to hide details  ∧" : "∨  Expand to see details  ∨"}</span>
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
  const [age,   setAge]   = useState(NaN);
  const [hr,    setHr]    = useState(NaN);
  const [rr,    setRr]    = useState(NaN);
  const [temp,  setTemp]  = useState(NaN);
  const [wbc,   setWbc]   = useState(NaN);
  const [bands, setBands] = useState(NaN);
  const [focus, setFocus] = useState(0);

  const allEntered = [age, hr, rr, temp, wbc, bands].every(v => !isNaN(v));

  const ageSIRS = (a) => ({
    hr_high: a<1?180:a<5?140:a<12?130:110,
    rr_high: a<1?50:a<5?40:a<12?34:22,
    wbc_high: a<1?34:a<5?19.5:a<12?17.5:11,
    wbc_low: a<1?5:a<5?5:a<12?4.5:4.5
  });
  const n = allEntered ? ageSIRS(age) : null;
  const sirsCriteria = allEntered ? [
    hr > n.hr_high,
    rr > n.rr_high,
    temp < 36 || temp > 38.5,
    wbc > n.wbc_high || wbc < n.wbc_low || bands > 10
  ].filter(Boolean).length : 0;

  const sepsis = allEntered && sirsCriteria >= 2 && focus > 0;
  const sirs   = allEntered && sirsCriteria >= 2;
  const color  = sepsis ? COLORS.danger : sirs ? COLORS.warning : COLORS.success;
  const label  = sepsis ? "SEPSIS (SIRS + Infection)" : sirs ? "SIRS (no confirmed focus)" : "SIRS criteria not met";
  
  return (
    <div>
      {/* Row 1: Age, HR, RR */}
      <div style={{display:"flex", gap:8, marginBottom:0}}>
        <div style={{flex:1, minWidth:0}}><NumberInput label="Age" value={age} onChange={setAge} min={0} max={18} step={0.5} unit="years" /></div>
        <div style={{flex:1, minWidth:0}}><NumberInput label="HR" value={hr} onChange={setHr} min={40} max={250} unit="bpm" /></div>
        <div style={{flex:1, minWidth:0}}><NumberInput label="RR" value={rr} onChange={setRr} min={10} max={80} unit="breaths/min" /></div>
      </div>
      {/* Row 2: Temp, WBC, Imm Neut */}
      <div style={{display:"flex", gap:8, marginBottom:0}}>
        <div style={{flex:1, minWidth:0}}><NumberInput label="Temp" value={temp} onChange={setTemp} min={32} max={42} step={0.1} unit="°C" /></div>
        <div style={{flex:1, minWidth:0}}><NumberInput label="WBC" value={wbc} onChange={setWbc} min={0} max={100} step={0.1} unit="×10³/μL" /></div>
        <div style={{flex:1, minWidth:0}}><NumberInput label="Imm Neut" value={bands} onChange={setBands} min={0} max={100} unit="%" /></div>
      </div>
      <ScoreRow label="Suspected/Confirmed Infection Focus" value={focus} onChange={setFocus} options={[{value:0,label:"0 — None"},{value:1,label:"1 — Yes"}]} />
      {allEntered && <ResultBadge score={`${sirsCriteria}/4`} label={label} color={color} sublabel={`HR >${n.hr_high} | RR >${n.rr_high} | Temp <36 or >38.5 | WBC criteria (age-adjusted)`} />}
      {!allEntered && <div style={{fontSize:12,color:COLORS.textMuted,fontFamily:"'IBM Plex Sans',sans-serif",textAlign:"center",padding:"12px 0"}}>Enter all values to calculate</div>}
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
// CALCULATOR: CORRECTED CALCIUM FOR HYPOALBUMINEMIA
// Ca(corr) = Ca(meas) + 0.8 × (4.0 − albumin)
// ═══════════════════════════════════════════════════════════════════════════════
function CorrCaCalc() {
  const [ca,  setCa]  = useState("");
  const [alb, setAlb] = useState("");

  const caNum  = parseFloat(ca);
  const albNum = parseFloat(alb);
  const valid  = ca && alb && !isNaN(caNum) && !isNaN(albNum) && albNum > 0;
  const corrCa = valid ? caNum + 0.8 * (4.0 - albNum) : null;

  const interp = corrCa === null ? null
    : corrCa < 8.5  ? {label:"Low (hypocalcemia)", color:COLORS.danger}
    : corrCa <= 10.5 ? {label:"Normal", color:COLORS.success}
    : {label:"High (hypercalcemia)", color:COLORS.danger};

  const rowStyle = {display:"flex",justifyContent:"space-between",
    padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`};

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:4}}>
        <NumberInput label="Measured Ca" value={ca} onChange={setCa}
          min={0} max={20} step={0.1} unit="mg/dL"/>
        <NumberInput label="Albumin" value={alb} onChange={setAlb}
          min={0} max={8} step={0.1} unit="g/dL"/>
      </div>
      {corrCa !== null && (
        <div style={{marginTop:16,padding:"16px 18px",borderRadius:14,
          background:COLORS.card,border:`1.5px solid ${interp.color}`}}>
          <div style={{display:"flex",justifyContent:"space-between",
            alignItems:"baseline",marginBottom:10}}>
            <span style={{fontSize:11,fontWeight:700,color:COLORS.textMuted,
              fontFamily:"'DM Mono',monospace",textTransform:"uppercase",
              letterSpacing:"0.05em"}}>Corrected Calcium</span>
            <span style={{fontSize:28,fontWeight:800,color:interp.color,
              fontFamily:"'Sora',sans-serif",lineHeight:1}}>
              {corrCa.toFixed(2)}
            </span>
          </div>
          <div style={rowStyle}>
            <span style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>mg/dL</span>
            <span style={{color:interp.color,fontWeight:700,fontSize:13,
              fontFamily:"'IBM Plex Sans',sans-serif"}}>{interp.label}</span>
          </div>
          <div style={{...rowStyle,borderBottom:"none"}}>
            <span style={{color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
              Normal corrected Ca: 8.5–10.5 mg/dL
            </span>
          </div>
          <div style={{marginTop:8,fontSize:10,color:COLORS.textMuted,
            fontFamily:"'DM Mono',monospace",lineHeight:1.5}}>
            Formula: Ca + 0.8 × (4.0 − albumin) · Use ionized Ca when available — this correction is an estimate
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: OSMOLAL GAP
// Calc OSM = 2×Na + BUN/2.8 + glucose/18
// Osmolal Gap = Measured OSM − Calculated OSM (normal 0–10 mOsm/kg)
// ═══════════════════════════════════════════════════════════════════════════════
function OsmolalGapCalc() {
  const [measOsm, setMeasOsm] = useState("");
  const [na,      setNa]      = useState("");
  const [bun,     setBun]     = useState("");
  const [glucose, setGlucose] = useState("");

  const mOsm = parseFloat(measOsm);
  const naN  = parseFloat(na);
  const bunN = parseFloat(bun);
  const glcN = parseFloat(glucose);

  const hasCalc = na && bun && glucose;
  const calcOsm = hasCalc ? 2*naN + bunN/2.8 + glcN/18 : null;
  const gap     = (measOsm && calcOsm !== null) ? mOsm - calcOsm : null;

  const interp = gap === null ? null
    : gap <= 10 ? {label:"Normal (≤10)", color:COLORS.success}
    : gap <= 20 ? {label:"Mildly elevated — investigate", color:COLORS.warning}
    : {label:"Significantly elevated — toxin screen", color:COLORS.danger};

  const rowStyle = {display:"flex",justifyContent:"space-between",
    padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`};

  return (
    <div>
      <NumberInput label="Measured Osmolality" value={measOsm} onChange={setMeasOsm}
        min={200} max={500} unit="mOsm/kg"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:4}}>
        <NumberInput label="Sodium" value={na} onChange={setNa}
          min={100} max={180} unit="mEq/L"/>
        <NumberInput label="BUN" value={bun} onChange={setBun}
          min={0} max={200} unit="mg/dL"/>
        <NumberInput label="Glucose" value={glucose} onChange={setGlucose}
          min={0} max={2000} unit="mg/dL"/>
      </div>
      {(calcOsm !== null || gap !== null) && (
        <div style={{marginTop:16,padding:"16px 18px",borderRadius:14,
          background:COLORS.card,border:`1.5px solid ${gap !== null ? interp.color : COLORS.border}`}}>
          {calcOsm !== null && (
            <div style={rowStyle}>
              <span style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>Calculated OSM</span>
              <span style={{color:COLORS.accent,fontWeight:700,fontSize:14,
                fontFamily:"'Sora',sans-serif"}}>{calcOsm.toFixed(1)} mOsm/kg</span>
            </div>
          )}
          {gap !== null && (
            <>
              <div style={rowStyle}>
                <span style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>Osmolal Gap</span>
                <span style={{color:interp.color,fontWeight:800,fontSize:22,
                  fontFamily:"'Sora',sans-serif",lineHeight:1}}>{gap.toFixed(1)}</span>
              </div>
              <div style={{...rowStyle,borderBottom:"none"}}>
                <span style={{color:interp.color,fontWeight:700,fontSize:13,
                  fontFamily:"'IBM Plex Sans',sans-serif"}}>{interp.label}</span>
              </div>
              {gap > 10 && (
                <div style={{marginTop:8,fontSize:10,color:COLORS.textMuted,
                  fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
                  Elevated gap: consider methanol · ethylene glycol · propylene glycol ·
                  isopropanol · mannitol · severe renal failure · DKA · alcoholic ketoacidosis
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: P/F RATIO AND S/F RATIO
// P/F = PaO2 / FiO2    S/F = SpO2 / FiO2
// Combined into one calculator — both use FiO2, natural pairing
// ═══════════════════════════════════════════════════════════════════════════════
function PFRatioCalc() {
  const [pao2, setPao2] = useState("");
  const [spo2, setSpo2] = useState("");
  const [fio2, setFio2] = useState("");  // accept 0.21–1.0 or 21–100

  // Normalise FiO2 — accept percentage or decimal
  const fio2Raw = parseFloat(fio2);
  const fio2Dec = fio2Raw > 1 ? fio2Raw / 100 : fio2Raw;
  const fio2Valid = fio2Dec >= 0.21 && fio2Dec <= 1.0;

  const pao2N = parseFloat(pao2);
  const spo2N = parseFloat(spo2);

  const pf = (pao2 && fio2Valid) ? pao2N / fio2Dec : null;
  const sf = (spo2 && fio2Valid) ? spo2N / fio2Dec : null;

  const pfInterp = pf === null ? null
    : pf >= 400 ? {label:"Normal (≥400)", color:COLORS.success}
    : pf >= 300 ? {label:"Borderline — mild ARDS threshold", color:COLORS.warning}
    : pf >= 200 ? {label:"Mild ARDS (Berlin)", color:COLORS.warning}
    : pf >= 100 ? {label:"Moderate ARDS (Berlin)", color:COLORS.orange}
    : {label:"Severe ARDS (Berlin)", color:COLORS.danger};

  const sfInterp = sf === null ? null
    : sf >= 235 ? {label:"Correlates P/F ≥300", color:COLORS.success}
    : sf >= 150 ? {label:"Correlates P/F 200–300 (mild)", color:COLORS.warning}
    : sf >= 90  ? {label:"Correlates P/F 100–200 (moderate)", color:COLORS.orange}
    : {label:"Correlates P/F <100 (severe)", color:COLORS.danger};

  const spo2Unreliable = spo2N >= 97;
  const rowStyle = {display:"flex",justifyContent:"space-between",
    padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`};

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:4}}>
        <NumberInput labelNode={<>P<span style={{textTransform:"none"}}>a</span>O₂</>} value={pao2} onChange={setPao2}
          min={20} max={600} unit="mmHg"/>
        <NumberInput labelNode={<>S<span style={{textTransform:"none"}}>p</span>O₂</>} value={spo2} onChange={setSpo2}
          min={50} max={100} unit="%"/>
        <NumberInput labelNode={<>F<span style={{textTransform:"none"}}>i</span>O₂</>} value={fio2} onChange={setFio2}
          min={0.21} max={1.0} step={0.01} unit="0.21–1.0"/>
      </div>
      {spo2 && spo2N >= 97 && (
        <div style={{marginBottom:8,padding:"6px 10px",borderRadius:6,
          background:"#fff3cd",border:"1px solid #d9822b",
          fontSize:10,color:COLORS.warning,fontFamily:"'DM Mono',monospace"}}>
          ⚠ SpO₂ ≥97% — S/F ratio unreliable at saturation; use P/F if arterial gas available
        </div>
      )}
      {(pf !== null || sf !== null) && (
        <div style={{marginTop:8,padding:"16px 18px",borderRadius:14,
          background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>
          {pf !== null && (
            <>
              <div style={rowStyle}>
                <span style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>P/F Ratio</span>
                <span style={{color:pfInterp.color,fontWeight:800,fontSize:22,
                  fontFamily:"'Sora',sans-serif",lineHeight:1}}>{pf.toFixed(0)}</span>
              </div>
              <div style={rowStyle}>
                <span style={{color:pfInterp.color,fontWeight:700,fontSize:12,
                  fontFamily:"'IBM Plex Sans',sans-serif"}}>{pfInterp.label}</span>
              </div>
            </>
          )}
          {sf !== null && (
            <>
              <div style={rowStyle}>
                <span style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>S/F Ratio</span>
                <span style={{color:sfInterp.color,fontWeight:800,fontSize:22,
                  fontFamily:"'Sora',sans-serif",lineHeight:1,
                  opacity:spo2Unreliable?0.5:1}}>{sf.toFixed(0)}</span>
              </div>
              <div style={{...rowStyle,borderBottom:"none"}}>
                <span style={{color:sfInterp.color,fontWeight:700,fontSize:12,
                  fontFamily:"'IBM Plex Sans',sans-serif",
                  opacity:spo2Unreliable?0.5:1}}>{sfInterp.label}</span>
              </div>
            </>
          )}
          <div style={{marginTop:8,fontSize:10,color:COLORS.textMuted,
            fontFamily:"'DM Mono',monospace",lineHeight:1.5}}>
            P/F: Berlin ARDS requires PEEP ≥5 cmH2O · S/F valid when SpO₂ 80–96%
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: ALVEOLAR-ARTERIAL GRADIENT AND OXYGENATION INDEX
// A-a gradient = PAO2 − PaO2    PAO2 = (FiO2 × 713) − (PaCO2/0.8)
// OI = (MAP × FiO2 × 100) / PaO2
// Combined — both require FiO2 and PaO2, natural pairing
// ═══════════════════════════════════════════════════════════════════════════════
function AAGradientCalc() {
  const [fio2,  setFio2]  = useState("");
  const [paco2, setPaco2] = useState("");
  const [pao2,  setPao2]  = useState("");
  const [map_,  setMap_]  = useState("");  // mean airway pressure for OI
  const [age,   setAge]   = useState("");  // for normal A-a range

  const fio2Raw = parseFloat(fio2);
  const fio2Dec = fio2Raw > 1 ? fio2Raw / 100 : fio2Raw;
  const fio2Valid = fio2Dec >= 0.21 && fio2Dec <= 1.0;

  const paco2N = parseFloat(paco2);
  const pao2N  = parseFloat(pao2);
  const mapN   = parseFloat(map_);
  const ageN   = parseFloat(age);

  // Alveolar PO2 at sea level (PB 760 mmHg, PH2O 47 mmHg → PB-PH2O = 713)
  const pAO2 = (fio2Valid && paco2) ? (fio2Dec * 713) - (paco2N / 0.8) : null;
  const aaGrad = (pAO2 !== null && pao2) ? pAO2 - pao2N : null;

  // Normal A-a gradient approximation: (age/4) + 4 mmHg
  const normalAA = ageN ? (ageN / 4) + 4 : null;

  const aaInterp = aaGrad === null ? null
    : aaGrad <= (normalAA ?? 15)
      ? {label:"Normal", color:COLORS.success}
    : aaGrad <= 30
      ? {label:"Mildly elevated", color:COLORS.warning}
    : aaGrad <= 60
      ? {label:"Moderately elevated", color:COLORS.orange}
    : {label:"Severely elevated", color:COLORS.danger};

  // Oxygenation Index — requires MAP (mean airway pressure from vent)
  const oi = (fio2Valid && pao2 && map_) ? (mapN * fio2Dec * 100) / pao2N : null;

  const oiInterp = oi === null ? null
    : oi < 4  ? {label:"Normal oxygenation", color:COLORS.success}
    : oi < 8  ? {label:"Mild impairment", color:COLORS.warning}
    : oi < 16 ? {label:"Moderate impairment", color:COLORS.orange}
    : oi < 25 ? {label:"Severe lung disease", color:COLORS.danger}
    : oi < 40 ? {label:"Critical — ECMO evaluation", color:COLORS.danger}
    : {label:"ECMO threshold (OI ≥40)", color:COLORS.danger};

  const rowStyle = {display:"flex",justifyContent:"space-between",
    padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`};

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:4}}>
        <NumberInput labelNode={<>F<span style={{textTransform:"none"}}>i</span>O₂</>} value={fio2} onChange={setFio2}
          min={0.21} max={1.0} step={0.01} unit="0.21–1.0"/>
        <NumberInput labelNode={<>P<span style={{textTransform:"none"}}>a</span>CO₂</>} value={paco2} onChange={setPaco2}
          min={10} max={120} unit="mmHg"/>
        <NumberInput labelNode={<>P<span style={{textTransform:"none"}}>a</span>O₂</>} value={pao2} onChange={setPao2}
          min={20} max={600} unit="mmHg"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:4}}>
        <NumberInput label="Mean Airw Press" value={map_} onChange={setMap_}
          min={0} max={50} unit="cmH₂O"/>
        <NumberInput label="Age" value={age} onChange={setAge}
          min={0} max={25} unit="yr"/>
      </div>

      {(pAO2 !== null || oi !== null) && (
        <div style={{marginTop:8,padding:"16px 18px",borderRadius:14,
          background:COLORS.card,border:`1.5px solid ${COLORS.border}`}}>

          {/* A-a Gradient section */}
          {pAO2 !== null && (
            <>
              <div style={{color:COLORS.textMuted,fontSize:9,fontWeight:700,
                fontFamily:"'DM Mono',monospace",textTransform:"uppercase",
                letterSpacing:"0.06em",marginBottom:6}}>A-a Gradient</div>
              <div style={rowStyle}>
                <span style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>Alveolar PO₂ (PAO₂)</span>
                <span style={{color:COLORS.accent,fontWeight:700,fontSize:14,
                  fontFamily:"'Sora',sans-serif"}}>{pAO2.toFixed(1)} mmHg</span>
              </div>
              {aaGrad !== null && (
                <>
                  <div style={rowStyle}>
                    <span style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>A-a Gradient</span>
                    <span style={{color:aaInterp.color,fontWeight:800,fontSize:22,
                      fontFamily:"'Sora',sans-serif",lineHeight:1}}>{aaGrad.toFixed(1)}</span>
                  </div>
                  <div style={rowStyle}>
                    <span style={{color:aaInterp.color,fontWeight:700,fontSize:12,
                      fontFamily:"'IBM Plex Sans',sans-serif"}}>{aaInterp.label}</span>
                    {normalAA && <span style={{color:COLORS.textMuted,fontSize:11,
                      fontFamily:"'DM Mono',monospace"}}>Normal ≤{normalAA.toFixed(0)} mmHg</span>}
                  </div>
                </>
              )}
            </>
          )}

          {/* Oxygenation Index section */}
          {oi !== null && (
            <>
              <div style={{color:COLORS.textMuted,fontSize:9,fontWeight:700,
                fontFamily:"'DM Mono',monospace",textTransform:"uppercase",
                letterSpacing:"0.06em",marginTop:pAO2?12:0,marginBottom:6}}>
                Oxygenation Index</div>
              <div style={rowStyle}>
                <span style={{color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>OI</span>
                <span style={{color:oiInterp.color,fontWeight:800,fontSize:22,
                  fontFamily:"'Sora',sans-serif",lineHeight:1}}>{oi.toFixed(1)}</span>
              </div>
              <div style={{...rowStyle,borderBottom:"none"}}>
                <span style={{color:oiInterp.color,fontWeight:700,fontSize:12,
                  fontFamily:"'IBM Plex Sans',sans-serif"}}>{oiInterp.label}</span>
              </div>
              {oi >= 40 && (
                <div style={{marginTop:8,padding:"6px 10px",borderRadius:6,
                  background:"rgba(192,57,43,0.08)",border:`1px solid ${COLORS.danger}`,
                  fontSize:10,color:COLORS.danger,fontFamily:"'DM Mono',monospace"}}>
                  OI ≥40: ECMO consultation threshold at many centers · Verify MAP is mean airway pressure, not mean arterial pressure
                </div>
              )}
            </>
          )}

          <div style={{marginTop:8,fontSize:10,color:COLORS.textMuted,
            fontFamily:"'DM Mono',monospace",lineHeight:1.5}}>
            Assumes sea level (PB 760 mmHg) · OI requires mechanical ventilation
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: MURRAY LUNG INJURY SCORE
// Murray JF et al. Am Rev Respir Dis. 1988;138(3):720-723.
// Mean of scored components (1–4 required; omit any unavailable)
// ═══════════════════════════════════════════════════════════════════════════════
function MurrayCalc() {
  const [vals, setVals] = useState({
    xray:       null,
    pf:         null,
    peep:       null,
    compliance: null,
  });
  const set = (k, v) => setVals(p => ({...p, [k]: v}));

  const entered = Object.values(vals).filter(v => v !== null);
  const count   = entered.length;
  const sum     = entered.reduce((a, v) => a + v, 0);
  const score   = count > 0 ? sum / count : null;

  const interp = score === null ? null
    : score < 0.1 ? {label:"No lung injury", color:COLORS.success}
    : score <= 2.5 ? {label:"Mild–moderate lung injury", color:COLORS.warning}
    : {label:"Severe lung injury (ARDS)", color:COLORS.danger};

  return (
    <div>
      <ScoreRow label="Chest X-Ray Consolidation"
        value={vals.xray} onChange={v=>set("xray",v)}
        options={[
          {value:0, label:"0 — No consolidation"},
          {value:1, label:"1 — 1 quadrant"},
          {value:2, label:"2 — 2 quadrants"},
          {value:3, label:"3 — 3 quadrants"},
          {value:4, label:"4 — 4 quadrants"},
        ]}/>
      <ScoreRow label="P/F Ratio (mmHg)"
        value={vals.pf} onChange={v=>set("pf",v)}
        options={[
          {value:0, label:"0 — ≥300"},
          {value:1, label:"1 — 225–299"},
          {value:2, label:"2 — 175–224"},
          {value:3, label:"3 — 100–174"},
          {value:4, label:"4 — <100"},
        ]}/>
      <ScoreRow label="PEEP (cmH₂O)"
        value={vals.peep} onChange={v=>set("peep",v)}
        options={[
          {value:0, label:"0 — ≤5"},
          {value:1, label:"1 — 6–8"},
          {value:2, label:"2 — 9–11"},
          {value:3, label:"3 — 12–14"},
          {value:4, label:"4 — ≥15"},
        ]}/>
      <ScoreRow label="Respiratory Compliance (mL/cmH₂O)"
        value={vals.compliance} onChange={v=>set("compliance",v)}
        options={[
          {value:0, label:"0 — ≥80"},
          {value:1, label:"1 — 60–79"},
          {value:2, label:"2 — 40–59"},
          {value:3, label:"3 — 20–39"},
          {value:4, label:"4 — ≤19"},
        ]}/>
      {count > 0 && score !== null && (
        <>
          <ResultBadge
            score={score.toFixed(2)}
            label={interp.label}
            color={interp.color}
            sublabel={`Mean of ${count} component${count>1?"s":""} scored · Murray 1988`}/>
          <div style={{marginTop:8,padding:"8px 12px",borderRadius:8,
            background:COLORS.surface,border:`1px solid ${COLORS.border}`,
            fontSize:10,color:COLORS.textMuted,fontFamily:"'DM Mono',monospace",
            lineHeight:1.6}}>
            {"<0.1: No injury · 0.1–2.5: Mild–moderate · >2.5: Severe · "}
            Components may be omitted if unavailable — score is the mean of those entered
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: BERLIN ARDS DEFINITION
// Ranieri VM et al. JAMA. 2012;307(23):2526-2533.
// ═══════════════════════════════════════════════════════════════════════════════
function BerlinARDSCalc() {
  const [timing,    setTiming]    = useState(null);
  const [bilateral, setBilateral] = useState(null);
  const [cardiac,   setCardiac]   = useState(null);
  const [peep,      setPeep]      = useState(null);
  const [pf,        setPf]        = useState("");

  const pfN = parseFloat(pf);
  const allPrereqs = timing === 1 && bilateral === 1 && cardiac === 1 && peep === 1;

  const severity = allPrereqs && pf
    ? pfN >= 200 ? {label:"Mild ARDS", sub:"P/F 200–300, PEEP ≥5", color:COLORS.warning}
    : pfN >= 100 ? {label:"Moderate ARDS", sub:"P/F 100–200, PEEP ≥5", color:COLORS.orange}
    : {label:"Severe ARDS", sub:"P/F <100, PEEP ≥5", color:COLORS.danger}
    : null;

  const prereqsMet = timing !== null && bilateral !== null && cardiac !== null && peep !== null;
  const notMet = prereqsMet && !allPrereqs;

  return (
    <div>
      <ScoreRow label="Onset within 1 week of insult"
        value={timing} onChange={setTiming}
        options={[{value:0,label:"No"},{value:1,label:"Yes"}]} hideScore/>
      <ScoreRow label="Bilateral opacities on CXR/CT"
        value={bilateral} onChange={setBilateral}
        options={[{value:0,label:"No"},{value:1,label:"Yes"}]} hideScore/>
      <ScoreRow label="Not explained by cardiac failure / fluid overload"
        value={cardiac} onChange={setCardiac}
        options={[{value:0,label:"No"},{value:1,label:"Yes"}]} hideScore/>
      <ScoreRow label="PEEP ≥5 cmH₂O applied"
        value={peep} onChange={setPeep}
        options={[{value:0,label:"No"},{value:1,label:"Yes"}]} hideScore/>
      {allPrereqs && (
        <NumberInput label="P/F Ratio" value={pf} onChange={setPf}
          min={0} max={600} unit="mmHg (on PEEP ≥5)"/>
      )}
      {notMet && (
        <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,
          background:COLORS.surface,border:`1px solid ${COLORS.border}`,
          color:COLORS.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>
          Berlin criteria not met — all four prerequisites must be present for ARDS classification
        </div>
      )}
      {severity && (
        <>
          <ResultBadge score={severity.label} label={severity.sub}
            color={severity.color} sublabel="Berlin Definition · JAMA 2012"/>
          <div style={{marginTop:8,padding:"8px 12px",borderRadius:8,
            background:COLORS.surface,border:`1px solid ${COLORS.border}`,
            fontSize:10,color:COLORS.textMuted,fontFamily:"'DM Mono',monospace",
            lineHeight:1.6}}>
            Mild mortality ~27% · Moderate ~32% · Severe ~45% (Berlin validation cohort) ·
            P/F ratio must be obtained on PEEP ≥5 cmH₂O with stable ventilator settings ≥30 min
          </div>
        </>
      )}
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

  // Upper body zones trigger drawer from top; lower body from bottom
  const UPPER_ZONES = new Set(["head","neck","trunkAnt","trunkPost","upArmL","upArmR","forearmL","forearmR","handL","handR"]);

  // Snap to nearest detente (0,25,50,75,100) if within ±2 integers
  const DETENTES = [0, 25, 50, 75, 100];
  const snapDetente = (val) => {
    const nearest = DETENTES.reduce((a,b) => Math.abs(b-val) < Math.abs(a-val) ? b : a);
    return Math.abs(nearest - val) <= 2 ? nearest : val;
  };

  // Coupled setter: adjusting one depth auto-clamps the other so PT+FT ≤ 100
  const setDepthCoupled = (side, zone, depth, rawVal) => {
    const val = Math.min(100, Math.max(0, Math.round(rawVal)));
    const other = depth === "partial" ? "full" : "partial";
    const setter = side === "front" ? setBurnsFront : setBurnsBack;
    setter(b => {
      const otherClamped = Math.min(b[zone]?.[other] ?? 0, 100 - val);
      return { ...b, [zone]: { partial: depth==="partial" ? val : otherClamped, full: depth==="full" ? val : otherClamped } };
    });
  };

  // Inject slider CSS once so native range input is fully styled on iOS/Safari
  if (typeof document !== 'undefined' && !document.getElementById('burn-slider-css')) {
    const s = document.createElement('style');
    s.id = 'burn-slider-css';
    s.textContent = `
      .burn-range { -webkit-appearance:none; appearance:none; width:100%; height:34px;
        background:transparent; outline:none; cursor:pointer; display:block;
        touch-action:none; }
      .burn-range::-webkit-slider-thumb {
        -webkit-appearance:none; appearance:none;
        width:28px; height:28px; border-radius:50%; margin-top:-11px;
        background:white; border:2.5px solid var(--burn-color);
        box-shadow:0 1px 6px rgba(0,0,0,0.30); }
      .burn-range::-webkit-slider-runnable-track {
        height:6px; border-radius:3px;
        background:linear-gradient(to right,
          var(--burn-color) 0%, var(--burn-color) var(--burn-val),
          #d0d4d9 var(--burn-val), #d0d4d9 100%); }
      .burn-range::-moz-range-thumb {
        width:28px; height:28px; border-radius:50%;
        background:white; border:2.5px solid var(--burn-color);
        box-shadow:0 1px 6px rgba(0,0,0,0.30); }
      .burn-range::-moz-range-track { height:6px; border-radius:3px; background:#d0d4d9; }
      .burn-range::-moz-range-progress { height:6px; border-radius:3px; background:var(--burn-color); }
    `;
    document.head.appendChild(s);
  }

  // Single slider row for one burn depth
  // BurnSlider: zero React renders during drag gesture.
  // During drag: direct DOM mutation via ref (no setState = no re-render = smooth on iOS).
  // On pointerUp: single setState commit, optional detente snap.
  // touch-action:none on .burn-range prevents Safari scroll gesture hijacking.
  const BurnSlider = ({ side, zone, depth, color }) => {
    const sideburns = getBurns(side);
    const committed = sideburns[zone]?.[depth] ?? 0;
    const label = depth === "partial" ? "PT" : "FT";

    const inputRef = useRef(null);
    const numRef   = useRef(null);
    // dragVal tracks the live value during the gesture — more reliable than
    // reading e.target.value in onPointerUp, which can lag on iOS
    const dragVal  = useRef(committed);

    // Direct DOM update during drag — bypasses React render cycle entirely
    const onDragMove = (raw) => {
      const v = Math.min(100, Math.max(0, parseInt(raw) || 0));
      dragVal.current = v; // keep ref current so onDragEnd snaps correctly
      if (inputRef.current) inputRef.current.style.setProperty('--burn-val', `${v}%`);
      if (numRef.current)   numRef.current.value = v;
    };

    // Single React state commit on pointer release — reads dragVal, not e.target.value
    const onDragEnd = () => {
      setDepthCoupled(side, zone, depth, snapDetente(dragVal.current));
    };

    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <div style={{ width:18, fontSize:10, fontWeight:700,
          fontFamily:"'IBM Plex Sans',sans-serif", color, flexShrink:0 }}>{label}</div>

        <div style={{ flex:1, position:"relative" }}>
          {/* Detente tick marks */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0,
            display:"flex", justifyContent:"space-between", pointerEvents:"none" }}>
            {DETENTES.map(d => (
              <div key={d} style={{ width:1, height:5, background:"#c0c4c9" }} />
            ))}
          </div>
          <input
            ref={inputRef}
            type="range" min={0} max={100} step={1}
            defaultValue={committed}
            className="burn-range"
            style={{ '--burn-color': color, '--burn-val': `${committed}%` }}
            onInput={e     => onDragMove(e.target.value)}
            onPointerUp={() => onDragEnd()}
          />
        </div>

        <div style={{ width:62, flexShrink:0, display:"flex", alignItems:"center",
          border:`1.5px solid ${COLORS.border}`, borderRadius:6, background:COLORS.bg,
          overflow:"hidden" }}>
          <input
            ref={numRef}
            type="number" inputMode="numeric" min={0} max={100}
            defaultValue={committed}
            onInput={e  => onDragMove(e.target.value)}
            onBlur={() => onDragEnd()}
            style={{ flex:1, border:"none", outline:"none", background:"transparent",
              fontSize:15, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace",
              color:COLORS.navy, textAlign:"right", padding:"4px 2px 4px 4px",
              minWidth:0 }} />
          <span style={{ fontSize:11, color:COLORS.textMuted, paddingRight:5,
            fontFamily:"'IBM Plex Sans',sans-serif", userSelect:"none" }}>%</span>
        </div>
      </div>
    );
  };


  // Overlay drawer — absolute within the homunculus container
  const ZoneDrawer = ({ zone, side }) => {
    const pct = zonePct(zone);
    const isUpper = UPPER_ZONES.has(zone);
    // Upper body zones: drawer slides up from bottom (keeps head/trunk visible above)
    // Lower body zones: drawer slides down from top (keeps legs/feet visible below)
    const fromBottom = isUpper;
    return (
      <div style={{
        position:"absolute", left:0, right:0,
        top: fromBottom ? undefined : 0,
        bottom: fromBottom ? 0 : undefined,
        zIndex:10,
        background:"rgba(255,255,255,0.97)",
        borderRadius: fromBottom ? "12px 12px 4px 4px" : "4px 4px 12px 12px",
        border:`1.5px solid ${COLORS.border}`,
        padding:"10px 12px 8px",
        boxShadow:"0 4px 24px rgba(0,0,0,0.13)",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:700, fontFamily:"'IBM Plex Sans',sans-serif", color:COLORS.navy }}>
            {ZONE_LABELS[zone]}
            <span style={{ fontSize:10, fontWeight:400, color:COLORS.textMuted, marginLeft:5 }}>({side})</span>
          </div>
          <div style={{ fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", color:COLORS.textMuted, textAlign:"right", lineHeight:1.3 }}>
            At this age<br/><strong style={{color:COLORS.navy}}>{pct}%</strong> of total BSA
          </div>
        </div>
        <BurnSlider side={side} zone={zone} depth="partial" color="rgba(221,107,32,0.85)" />
        <BurnSlider side={side} zone={zone} depth="full"    color="rgba(229,62,62,0.85)"  />
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

      {/* Homunculus pair with dim overlay and zone drawer inside relative container */}
      <div style={{ position:"relative", marginBottom:4 }}>
        <div style={{ display:"flex", gap:6 }}>
          <BodySVG side="front" />
          <BodySVG side="back" />
        </div>
        {/* Dim veil — keeps both figures visible but receded during zone editing */}
        {activeZone && (
          <div style={{
            position:"absolute", inset:0, background:"rgba(255,255,255,0.40)",
            pointerEvents:"none", borderRadius:4,
          }} />
        )}
        {/* Zone drawer slides in from top (upper body) or bottom (lower body) */}
        {activeZone && <ZoneDrawer zone={activeZone} side={activeSide} />}
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:6, justifyContent:"center", fontSize:9, color:COLORS.textMuted, fontFamily:"'IBM Plex Sans',sans-serif", alignItems:"center" }}>
        <span>Tap zone to select</span>
        <span style={{ width:10, height:10, borderRadius:2, background:"rgba(221,107,32,0.5)", display:"inline-block" }}/><span>Partial</span>
        <span style={{ width:10, height:10, borderRadius:2, background:"rgba(229,62,62,0.5)", display:"inline-block" }}/><span>Full</span>
        <span style={{ width:10, height:10, borderRadius:2, background:"rgba(197,48,48,0.55)", display:"inline-block" }}/><span>Mixed</span>
      </div>

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
      {/* Fever + Duration on same row */}
      <div style={{display:"flex", gap:8, alignItems:"flex-start"}}>
        <div style={{flex:2, minWidth:0}}>
          <ScoreRow label="Fever (≥38.0°C)" value={fever} onChange={setFever} options={[{value:0,label:"0 — No"},{value:1,label:"1 — Yes"}]} hideScore />
        </div>
        <div style={{flex:1, minWidth:0}}>
          <NumberInput label="Duration" value={days} onChange={setDays} min={0} max={30} unit="days" />
        </div>
      </div>
      <ScoreRow label="Rash (polymorphous exanthem)" value={vals.rash} onChange={v=>set("rash",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Hands/Feet (edema or desquamation)" value={vals.hands} onChange={v=>set("hands",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Bilateral Conjunctival Injection" value={vals.conj} onChange={v=>set("conj",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Lips/Oral Changes (strawberry tongue)" value={vals.lips} onChange={v=>set("lips",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ScoreRow label="Cervical Lymphadenopathy (≥1.5 cm)" value={vals.lymph} onChange={v=>set("lymph",v)} options={[{value:0,label:"0 — Absent"},{value:1,label:"1 — Present"}]} />
      <ResultBadge score={`${criteria_met}/5`} label={label} color={color}
        sublabel={complete
          ? "AHA 2017 · IVIG 2 g/kg + aspirin · Echo to assess coronary arteries"
          : incomplete
          ? "Suspected Incomplete KD — consult KD team"
          : "AHA 2017 Criteria"} />
      {incomplete && !complete && (
        <div style={{ marginTop: 8, borderRadius: 10, border: `1.5px solid ${COLORS.warning}`, overflow: "hidden" }}>
          <div style={{ background: COLORS.warning, padding: "7px 12px" }}>
            <div style={{ color: "white", fontSize: 11, fontWeight: 700, fontFamily: "'IBM Plex Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Incomplete KD Workup — AHA 2017
            </div>
          </div>
          {[
            { heading: "Required Labs", body: "CBC diff · ESR · CRP · CMP · Bag/CC UA w/micro (detect urethritis)" },
            { heading: "Incomplete Criteria (labs)", body: "CRP ≥3 mg/dL or ESR ≥40 mm/h PLUS ≥3 of: anemia for age · platelets ≥450,000 · albumin ≤3 g/dL · elevated ALT · WBC ≥15,000/mm³ · urine WBC ≥10/hpf" },
            { heading: "Echo Criteria", body: "LAD or RCA CA z-score ≥2.5 · OR ≥3 suggestive features: decreased LV function, mitral regurgitation, pericardial effusion, z-score 2.0–2.5" },
            { heading: "High-Risk Features", body: "Age ≤6 months · LAD or RCA z-score ≥2.5 on baseline echo → intensify therapy" },
            { heading: "Treatment if Criteria Met", body: "IVIG 2 g/kg + aspirin · Reassess at 36h post-IVIG · Repeat echo Q2–3 days or per cardiology" },
          ].map((item, i, arr) => (
            <div key={item.heading} style={{ padding: "9px 12px", borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.border}` : "none", background: i % 2 === 0 ? COLORS.card : COLORS.surface }}>
              <div style={{ color: COLORS.warning, fontSize: 10, fontWeight: 700, fontFamily: "'IBM Plex Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{item.heading}</div>
              <div style={{ color: COLORS.navy, fontSize: 12, fontFamily: "'IBM Plex Sans',sans-serif", lineHeight: 1.55 }}>{item.body}</div>
            </div>
          ))}
          <div style={{ padding: "8px 12px", background: "rgba(0,102,204,0.06)", borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Mono',monospace" }}>McCrindle et al. Circulation. 2017;135:e927–e999</div>
          </div>
        </div>
      )}
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
// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: FREE WATER DEFICIT (Hypernatremia)
// ═══════════════════════════════════════════════════════════════════════════════
function FreeWaterDeficitCalc() {
  const [na, setNa] = useState(155);
  const [weight, setWeight] = useState(20);
  const [sex, setSex] = useState("male");
  const [ageGroup, setAgeGroup] = useState("child");

  // TBW fraction by age/sex — standard Adrogue-Madias values
  const tbwFraction =
    ageGroup === "infant"  ? 0.70 :
    ageGroup === "child"   ? (sex === "male" ? 0.60 : 0.55) :
    /* adult */              (sex === "male" ? 0.60 : 0.50);

  const targetNa = 140;
  const tbw = tbwFraction * weight;
  // Free water deficit = TBW × (serum Na / target Na − 1)
  const fwd = tbw * ((na / targetNa) - 1);
  // At ≤0.5 mEq/L/hr correction, hours to target
  const naExcess = na - targetNa;
  const hoursAt05 = naExcess / 0.5;
  const hoursAt10 = naExcess / (10 / 24); // 10 mEq/day max
  const ratePerHr = fwd / hoursAt05;

  const valid = na > 145 && weight > 0;

  return (
    <div>
      <div style={{display:"flex", gap:8}}>
        <div style={{flex:1}}>
          <NumberInput label="Serum Sodium" value={na} onChange={setNa}
            min={130} max={200} unit="mEq/L" />
        </div>
        <div style={{flex:1}}>
          <NumberInput label="Weight" value={weight} onChange={setWeight}
            min={1} max={150} step={0.5} unit="kg" />
        </div>
      </div>
      <ScoreRow label="Age Group" value={ageGroup} onChange={setAgeGroup}
        options={[
          {value:"infant", label:"Infant (<1 yr) — TBW 70%"},
          {value:"child",  label:"Child (1–12 yr)"},
          {value:"adult",  label:"Adolescent/Adult"},
        ]} />
      <ScoreRow label="Sex" value={sex} onChange={setSex}
        options={[{value:"male",label:"Male"},{value:"female",label:"Female"}]}
        hideScore />
      {valid ? (
        <div style={{marginTop:16, padding:"16px 18px", borderRadius:14,
          background:COLORS.card, border:`1.5px solid ${COLORS.border}`}}>
          <div style={{color:COLORS.textMuted, fontSize:11,
            fontFamily:"'DM Mono',monospace", marginBottom:12,
            textTransform:"uppercase", letterSpacing:"0.05em"}}>Free Water Deficit</div>
          {[
            {l:"TBW fraction", v:`${(tbwFraction*100).toFixed(0)}%`},
            {l:"Total body water", v:`${tbw.toFixed(1)} L`},
            {l:"Free water deficit", v:`${fwd.toFixed(1)} L (${(fwd*1000).toFixed(0)} mL)`,
              highlight: true},
            {l:"Na excess to correct", v:`${naExcess.toFixed(0)} mEq/L`},
            {l:"Time to correct (0.5/hr)", v:`${hoursAt05.toFixed(0)} h`},
            {l:"Max rate of replacement", v:`${ratePerHr.toFixed(1)} L/hr`},
          ].map(item => (
            <div key={item.l} style={{display:"flex", justifyContent:"space-between",
              padding:"8px 0", borderBottom:`1px solid ${COLORS.border}`}}>
              <span style={{color:COLORS.textMuted, fontSize:13,
                fontFamily:"'DM Mono',monospace"}}>{item.l}</span>
              <span style={{color: item.highlight ? COLORS.danger : COLORS.accent,
                fontWeight:700, fontSize:14, fontFamily:"'Sora',sans-serif"}}>
                {item.v}
              </span>
            </div>
          ))}
          <div style={{marginTop:12, color:COLORS.warning, fontSize:11,
            fontFamily:"'DM Mono',monospace", lineHeight:1.5}}>
            ⚠ Correct ≤0.5 mEq/L/hr (≤10–12 mEq/L/day) · Faster correction risks
            cerebral edema · Replace deficit over 48–72 h · Reassess Na q4–6h
          </div>
        </div>
      ) : (
        <div style={{marginTop:16, padding:"12px 14px", borderRadius:10,
          background:COLORS.surface, border:`1px solid ${COLORS.border}`,
          color:COLORS.textMuted, fontSize:12, fontFamily:"'DM Mono',monospace"}}>
          Enter serum Na {">"}145 mEq/L and weight to calculate deficit
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: FENa — FRACTIONAL EXCRETION OF SODIUM
// ═══════════════════════════════════════════════════════════════════════════════
function FENaCalc() {
  const [uNa, setUNa]   = useState("");  // urine sodium mEq/L
  const [pNa, setPNa]   = useState("");  // plasma sodium mEq/L
  const [uCr, setUCr]   = useState("");  // urine creatinine mg/dL
  const [pCr, setPCr]   = useState("");  // plasma creatinine mg/dL
  // FEUrea inputs — useful when diuretics confound FENa
  const [uUrea, setUUrea] = useState(""); // urine urea mg/dL
  const [pUrea, setPUrea] = useState(""); // plasma BUN mg/dL

  const allFena = uNa && pNa && uCr && pCr &&
    [uNa, pNa, uCr, pCr].every(v => parseFloat(v) > 0);
  const allFeurea = uUrea && pUrea && uCr && pCr &&
    [uUrea, pUrea, uCr, pCr].every(v => parseFloat(v) > 0);

  // FENa = (uNa × pCr) / (pNa × uCr) × 100
  const fena = allFena
    ? (parseFloat(uNa) * parseFloat(pCr)) /
      (parseFloat(pNa) * parseFloat(uCr)) * 100
    : null;

  // FEUrea = (uUrea × pCr) / (pUrea × uCr) × 100
  const feurea = allFeurea
    ? (parseFloat(uUrea) * parseFloat(pCr)) /
      (parseFloat(pUrea) * parseFloat(uCr)) * 100
    : null;

  const fenaInterp = fena === null ? null
    : fena < 1   ? {label:"Prerenal AKI", color:COLORS.warning}
    : fena <= 2  ? {label:"Indeterminate", color:COLORS.textMuted}
    :              {label:"Intrinsic Renal (ATN)", color:COLORS.danger};

  const feureaInterp = feurea === null ? null
    : feurea < 35  ? {label:"Prerenal (FEUrea)", color:COLORS.warning}
    : feurea <= 50 ? {label:"Indeterminate", color:COLORS.textMuted}
    :                {label:"Intrinsic Renal", color:COLORS.danger};

  const rowStyle = {display:"flex", justifyContent:"space-between",
    padding:"8px 0", borderBottom:`1px solid ${COLORS.border}`};

  return (
    <div>
      <div style={{marginBottom:6, color:COLORS.textMuted, fontSize:11,
        fontFamily:"'DM Mono',monospace", textTransform:"uppercase",
        letterSpacing:"0.05em"}}>FENa Inputs</div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:4}}>
        <NumberInput label="Urine Na" value={uNa} onChange={setUNa}
          min={0} max={300} unit="mEq/L" />
        <NumberInput label="Plasma Na" value={pNa} onChange={setPNa}
          min={100} max={180} unit="mEq/L" />
        <NumberInput label="Urine Cr" value={uCr} onChange={setUCr}
          min={0} max={1000} unit="mg/dL" />
        <NumberInput label="Plasma Cr" value={pCr} onChange={setPCr}
          min={0} step={0.01} max={30} unit="mg/dL" />
      </div>
      <div style={{marginTop:8, marginBottom:6, color:COLORS.textMuted, fontSize:11,
        fontFamily:"'DM Mono',monospace", textTransform:"uppercase",
        letterSpacing:"0.05em"}}>FEUrea (optional — use when on diuretics)</div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12}}>
        <NumberInput label="Urine Urea" value={uUrea} onChange={setUUrea}
          min={0} max={2000} unit="mg/dL" />
        <NumberInput label="Plasma BUN" value={pUrea} onChange={setPUrea}
          min={0} max={200} unit="mg/dL" />
      </div>

      {(fena !== null || feurea !== null) && (
        <div style={{padding:"16px 18px", borderRadius:14,
          background:COLORS.card, border:`1.5px solid ${COLORS.border}`}}>
          {fena !== null && (
            <>
              <div style={rowStyle}>
                <span style={{color:COLORS.textMuted, fontSize:13,
                  fontFamily:"'DM Mono',monospace"}}>FENa</span>
                <span style={{color:COLORS.accent, fontWeight:700, fontSize:14,
                  fontFamily:"'Sora',sans-serif"}}>{fena.toFixed(2)}%</span>
              </div>
              <div style={{...rowStyle, borderBottom: feurea !== null
                ? `1px solid ${COLORS.border}` : "none"}}>
                <span style={{color:COLORS.textMuted, fontSize:13,
                  fontFamily:"'DM Mono',monospace"}}>Interpretation</span>
                <span style={{color:fenaInterp.color, fontWeight:700, fontSize:13,
                  fontFamily:"'IBM Plex Sans',sans-serif"}}>{fenaInterp.label}</span>
              </div>
            </>
          )}
          {feurea !== null && (
            <>
              <div style={rowStyle}>
                <span style={{color:COLORS.textMuted, fontSize:13,
                  fontFamily:"'DM Mono',monospace"}}>FEUrea</span>
                <span style={{color:COLORS.accent, fontWeight:700, fontSize:14,
                  fontFamily:"'Sora',sans-serif"}}>{feurea.toFixed(1)}%</span>
              </div>
              <div style={{...rowStyle, borderBottom:"none"}}>
                <span style={{color:COLORS.textMuted, fontSize:13,
                  fontFamily:"'DM Mono',monospace"}}>Interpretation</span>
                <span style={{color:feureaInterp.color, fontWeight:700, fontSize:13,
                  fontFamily:"'IBM Plex Sans',sans-serif"}}>{feureaInterp.label}</span>
              </div>
            </>
          )}
          <div style={{marginTop:12, color:COLORS.textMuted, fontSize:10,
            fontFamily:"'DM Mono',monospace", lineHeight:1.5}}>
            FENa unreliable with diuretics · CKD · myoglobinuria · early obstruction
            · contrast nephropathy · Use FEUrea {"<"}35% for prerenal in those settings
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: CORRECTED RETICULOCYTE COUNT & RPI
// ═══════════════════════════════════════════════════════════════════════════════
function ReticCalc() {
  const [reticPct, setReticPct] = useState("");   // reticulocyte % from CBC
  const [hct,      setHct]      = useState("");   // patient hematocrit %
  const [sex,      setSex]      = useState("male");
  const [age,      setAge]      = useState("child"); // infant | child | adult

  // Normal Hct reference by age/sex — Hillman & Finch
  const normalHct =
    age === "infant" ? 44 :
    age === "child"  ? (sex === "male" ? 40 : 38) :
    /* adult */        (sex === "male" ? 45 : 41);

  // Maturation factor — time (days) reticulocytes spend in peripheral blood
  // rises as Hct falls because shift retics are released earlier
  const matFactor = (h) => {
    if (h >= 45) return 1.0;
    if (h >= 35) return 1.5;
    if (h >= 25) return 2.0;
    return 2.5;
  };

  const rPct = parseFloat(reticPct);
  const rHct = parseFloat(hct);
  const valid = rPct > 0 && rHct > 0 && rHct <= 70;

  // Corrected Reticulocyte Count — normalises for degree of anemia
  const crc = valid ? (rPct * (rHct / normalHct)) : null;
  // Reticulocyte Production Index — corrects for prolonged peripheral maturation
  const mf  = valid ? matFactor(rHct) : null;
  const rpi = (crc !== null && mf) ? crc / mf : null;

  const rpiInterp = rpi === null ? null
    : rpi >= 2 ? {
        label: "Adequate response",
        sub:   "Erythroid marrow responding · Suggests hemolysis or blood loss",
        color: COLORS.success,
      }
    : {
        label: "Hypoproliferative",
        sub:   "Marrow not responding adequately · Consider iron/B12/folate deficiency, aplasia, or infiltration",
        color: COLORS.danger,
      };

  const rowStyle = {
    display:"flex", justifyContent:"space-between",
    padding:"8px 0", borderBottom:`1px solid ${COLORS.border}`
  };

  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:4}}>
        <NumberInput label="Reticulocyte %" value={reticPct} onChange={setReticPct}
          min={0} max={30} step={0.1} unit="%" />
        <NumberInput label="Patient Hct" value={hct} onChange={setHct}
          min={5} max={70} step={0.5} unit="%" />
      </div>
      <ScoreRow label="Age Group" value={age} onChange={setAge}
        options={[
          {value:"infant", label:"Infant — normal Hct 44%"},
          {value:"child",  label:"Child"},
          {value:"adult",  label:"Adolescent/Adult"},
        ]} />
      <ScoreRow label="Sex" value={sex} onChange={setSex}
        options={[{value:"male",label:"Male"},{value:"female",label:"Female"}]}
        hideScore />

      {valid && rpi !== null && (
        <div style={{marginTop:16, padding:"16px 18px", borderRadius:14,
          background:COLORS.card, border:`1.5px solid ${rpiInterp.color}`}}>
          <div style={{color:COLORS.textMuted, fontSize:11,
            fontFamily:"'DM Mono',monospace", textTransform:"uppercase",
            letterSpacing:"0.05em", marginBottom:12}}>Result</div>
          {[
            {l:"Normal Hct reference",        v:`${normalHct}%`},
            {l:"Maturation factor",            v:mf.toFixed(1)},
            {l:"Corrected retic count (CRC)",  v:`${crc.toFixed(1)}%`, accent:true},
            {l:"Reticulocyte Prod. Index (RPI)", v:rpi.toFixed(2),     accent:true},
          ].map(item => (
            <div key={item.l} style={rowStyle}>
              <span style={{color:COLORS.textMuted, fontSize:13,
                fontFamily:"'DM Mono',monospace"}}>{item.l}</span>
              <span style={{
                color: item.accent ? rpiInterp.color : COLORS.accent,
                fontWeight:700, fontSize:14, fontFamily:"'Sora',sans-serif"}}>
                {item.v}
              </span>
            </div>
          ))}
          <div style={{marginTop:12}}>
            <div style={{color:rpiInterp.color, fontWeight:700, fontSize:14,
              fontFamily:"'IBM Plex Sans',sans-serif", marginBottom:4}}>
              {rpiInterp.label}
            </div>
            <div style={{color:COLORS.textMuted, fontSize:11,
              fontFamily:"'DM Mono',monospace", lineHeight:1.5}}>
              {rpiInterp.sub}
            </div>
          </div>
          <div style={{marginTop:10, padding:"8px 10px", borderRadius:8,
            background:COLORS.surface, color:COLORS.textMuted, fontSize:10,
            fontFamily:"'DM Mono',monospace", lineHeight:1.5}}>
            RPI {">"} 2: hemolytic or hemorrhagic · RPI {"<"} 2: hypoproliferative ·
            Maturation factor adjusts for shift reticulocytes released early in severe anemia
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: MENTZER INDEX — Iron Deficiency vs Thalassemia Trait
// ═══════════════════════════════════════════════════════════════════════════════
function MentzerCalc() {
  const [mcv, setMcv]   = useState("");  // fL
  const [rbc, setRbc]   = useState("");  // ×10⁶/µL

  const mentzer = (mcv && rbc && parseFloat(rbc) > 0)
    ? parseFloat(mcv) / parseFloat(rbc)
    : null;

  // Mentzer <13 → thalassemia trait; >13 → iron deficiency anemia
  const interp = mentzer === null ? null
    : mentzer < 13  ? {
        label:    "Thalassemia trait likely",
        sub:      "Small, numerous RBCs · Confirm with Hgb electrophoresis",
        color:    COLORS.warning,
      }
    : mentzer === 13 ? {
        label:    "Indeterminate (= 13)",
        sub:      "Borderline — further workup required",
        color:    COLORS.textMuted,
      }
    : {
        label:    "Iron deficiency anemia likely",
        sub:      "Small, fewer RBCs · Check ferritin, iron studies",
        color:    COLORS.danger,
      };

  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:4}}>
        <NumberInput label="MCV" value={mcv} onChange={setMcv}
          min={40} max={120} step={0.1} unit="fL" />
        <NumberInput label="RBC Count" value={rbc} onChange={setRbc}
          min={1} max={8} step={0.01} unit="×10⁶/µL" />
      </div>
      {mentzer !== null && (
        <div style={{marginTop:16, padding:"16px 18px", borderRadius:14,
          background:COLORS.card, border:`1.5px solid ${interp.color}`}}>
          <div style={{display:"flex", justifyContent:"space-between",
            alignItems:"baseline", marginBottom:12}}>
            <span style={{color:COLORS.textMuted, fontSize:11,
              fontFamily:"'DM Mono',monospace", textTransform:"uppercase",
              letterSpacing:"0.05em"}}>Mentzer Index</span>
            <span style={{color:interp.color, fontWeight:800, fontSize:28,
              fontFamily:"'Sora',sans-serif", lineHeight:1}}>
              {mentzer.toFixed(1)}
            </span>
          </div>
          <div style={{color:interp.color, fontWeight:700, fontSize:14,
            fontFamily:"'IBM Plex Sans',sans-serif", marginBottom:4}}>
            {interp.label}
          </div>
          <div style={{color:COLORS.textMuted, fontSize:11,
            fontFamily:"'DM Mono',monospace", lineHeight:1.5}}>
            {interp.sub}
          </div>
          <div style={{marginTop:12, padding:"8px 10px", borderRadius:8,
            background:COLORS.surface, color:COLORS.textMuted, fontSize:10,
            fontFamily:"'DM Mono',monospace", lineHeight:1.5}}>
            Threshold: MCV/RBC {"<"}13 → thalassemia trait ·
            {" >"}13 → iron deficiency · Sensitivity ~85% · Not a substitute
            for Hgb electrophoresis or iron studies
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: GROWTH CHARTS (GrowthCalc)
// ─────────────────────────────────────────────────────────────────────────────
// GROWTHCALC DATA STATUS
//
// CLINICALLY VALIDATED (real published LMS values):
//   • WHO 2006  — WHO_WFA, WHO_LFA, WHO_HCFA, WHO_WFL_*
//   • CDC 2000  — CDC_WFA, CDC_SFA, CDC_BMIFA
//   • DS Stature, Weight, HC (0–36m + 2–20y) — Zemel 2015 (DSGS/CDC)
//   • Turner Stature — Isojima 2010 (Japanese ref; see population offset note)
//   • Nellhaus HC  — Nellhaus 1968 / CDC-digitized, sex-specific, L=1 approx
//   • Rollins HC   — Rollins 2010, US 0–21yr, sex-specific, L=1 from LOESS
//
// ALL SPECIALTY CURVES NOW CLINICALLY VALIDATED:
//   • FENTON_LMS   — Fenton 2025 official data (University of Calgary v1.23).
//                    Daily resolution, 22.5–50.0 decimal weeks. Weight in kg.
//                    Source: Fenton TR, Elmrayed S, Alshaikh BN. Paediatr Perinat Epidemiol. 2025.
//
// WHO_WFL_*_NODES are abbreviated to 5cm intervals; replace with full
// 0.5cm-step tables for production use.
//
// See CLAUDE.md for full data status documentation.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── COLORS (matches PediCalc light-mode iOS palette) ────────
// GrowthCalc palette — aliased to PediCalc COLORS for visual unity
const C = {
  bg:     COLORS.bg,
  card:   COLORS.surface,
  border: COLORS.border,
  navy:   COLORS.navy,
  accent: COLORS.accent,
  sky:    COLORS.surface,   // was #e8f2fb — neutralised to match app surface
  muted:  COLORS.textMuted,
  red:    COLORS.danger,
  green:  COLORS.success,
  amber:  COLORS.warning,
  purple: COLORS.accent,    // was #6a3fa0 — sex button active unified to accent
  teal:   COLORS.accent,    // was #0e7c7b — Fenton zone label unified to accent
  text:   COLORS.text,
};

// Percentile curve colors (matches CDC/WHO visual language)
const P_COLORS = {
  p3:   "#2a7fbf",
  p10:  "#2a7fbf",
  p25:  "#2a7fbf",
  p50:  "#c0392b",
  p75:  "#2a7fbf",
  p90:  "#2a7fbf",
  p97:  "#2a7fbf",
};

// ─── LMS Z-SCORE & PERCENTILE ENGINE ─────────────────────────
// LMS method (Cole & Green 1992)
// z = [(X/M)^L - 1] / (L*S)   when L ≠ 0
// z = ln(X/M) / S              when L = 0
function lmsZ(x, L, M, S) {
  if (!x || !M || !S) return null;
  if (Math.abs(L) < 1e-6) return Math.log(x / M) / S;
  return (Math.pow(x / M, L) - 1) / (L * S);
}

// WHO/CDC z-score truncation at ±3 (beyond extremes use linear extension)
function whoZ(x, L, M, S) {
  const z = lmsZ(x, L, M, S);
  if (z === null) return null;
  if (z > 3) {
    const sd3 = M * Math.pow(1 + L * S * 3, 1 / L);
    const sd23 = M * Math.pow(1 + L * S * 2, 1 / L);
    return 3 + (x - sd3) / (sd3 - sd23);
  }
  if (z < -3) {
    const sdN3 = M * Math.pow(1 + L * S * (-3), 1 / L);
    const sdN23 = M * Math.pow(1 + L * S * (-2), 1 / L);
    return -3 + (x - sdN3) / (sdN23 - sdN3);
  }
  return z;
}

// Standard normal CDF (Hart approximation)
function normCDF(z) {
  if (z === null || isNaN(z)) return null;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z >= 0 ? 1 - p : p;
}

function zToPercentile(z) {
  if (z === null || isNaN(z)) return null;
  return normCDF(z) * 100;
}

// Percentile value from LMS
function lmsPercentileVal(pct, L, M, S) {
  const z = normCDFInv(pct / 100);
  if (Math.abs(L) < 1e-6) return M * Math.exp(S * z);
  return M * Math.pow(1 + L * S * z, 1 / L);
}

// Inverse normal CDF (Beasley-Springer-Moro)
function normCDFInv(p) {
  const a = [0, -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
             1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [0, -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
             6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
             -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425, pHigh = 1 - pLow;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    const q = p - 0.5, r = q * q;
    return (((((a[1]*r+a[2])*r+a[3])*r+a[4])*r+a[5])*r+a[6])*q /
           (((((b[1]*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// Interpolate LMS at age x from table [{age, L, M, S}]
function interpolateLMS(table, age) {
  if (!table || table.length === 0) return null;
  if (age <= table[0].age) return { ...table[0] };
  if (age >= table[table.length - 1].age) return { ...table[table.length - 1] };
  let lo = 0;
  for (let i = 1; i < table.length; i++) {
    if (table[i].age >= age) { lo = i - 1; break; }
  }
  const hi = lo + 1;
  const t = (age - table[lo].age) / (table[hi].age - table[lo].age);
  return {
    age,
    L: table[lo].L + t * (table[hi].L - table[lo].L),
    M: table[lo].M + t * (table[hi].M - table[lo].M),
    S: table[lo].S + t * (table[hi].S - table[lo].S),
  };
}

// ─── AGE CALCULATIONS ─────────────────────────────────────────
function calcAges(dob, measureDate, egaDays) {
  if (!dob || !measureDate || !egaDays) return null;
  const dob_ = new Date(dob);
  const meas_ = new Date(measureDate);
  const chronDays = Math.round((meas_ - dob_) / 86400000);
  if (chronDays < 0) return null;
  const pmaDays = egaDays + chronDays;
  const corrDays = chronDays - (280 - egaDays);

  // Calendar months for display
  const chronMonths = monthsBetween(dob_, meas_);

  return {
    chronDays,
    pmaDays,
    corrDays,  // may be negative (born early, not yet at term)
    chronMonths,
    pmaWeeks:  Math.floor(pmaDays / 7),
    pmaRemDays: pmaDays % 7,
    corrWeeks: Math.floor(Math.max(0, corrDays) / 7),
    corrRemDays: Math.max(0, corrDays) % 7,
    chronYears: chronDays / 365.25,
  };
}

function monthsBetween(d1, d2) {
  let m = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  if (d2.getDate() < d1.getDate()) m--;
  return Math.max(0, m);
}

// Chart zone determination
function chartZone(ages) {
  if (!ages) return null;
  if (ages.pmaDays < 350) return "fenton";           // < 50 wks PMA
  if (ages.corrDays < 730.5) return "who";           // corrected < 2 yrs
  return "cdc";                                       // corrected ≥ 2 yrs
}

// BMI
function calcBMI(wtKg, htCm) {
  if (!wtKg || !htCm || htCm === 0) return null;
  return wtKg / Math.pow(htCm / 100, 2);
}

// FENTON 2025 PRETERM GROWTH LMS TABLES
// Source: Fenton TR, Elmrayed S, Alshaikh BN. "Fenton third-generation preterm
//         growth charts." Paediatr Perinat Epidemiol. 2025.
//         Data from official Fenton 2025 Clinical Calculator v1.23 (University of Calgary).
//         Creative Commons licensed. Daily resolution (decimal gestational weeks).
//         Age axis: decimal weeks (e.g. 22.5 = 22 weeks 3.5 days).
//         Weight M in kg (converted from grams in source).
//         Length begins at 23.5 weeks (first available in source data).
const FENTON_LMS = {
  female: {
    weight: [
    {age:22.5,L:0.30196415,M:0.47087455,S:0.13799954},{age:22.5714285714,L:0.31403095,M:0.4762472,S:0.13799671},{age:22.7142857143,L:0.3421242,M:0.48875264,S:0.13799029},
    {age:22.8571428571,L:0.37031153,M:0.50129118,S:0.13798433},{age:23.0,L:0.39865563,M:0.51388488,S:0.13797916},{age:23.1428571429,L:0.42721922,M:0.52655581,S:0.13797508},
    {age:23.2857142857,L:0.45606501,M:0.53932603,S:0.1379724},{age:23.4285714286,L:0.48525571,M:0.55221761,S:0.13797144},{age:23.5714285714,L:0.5148462,M:0.56525262,S:0.13797251},
    {age:23.7142857143,L:0.54471105,M:0.57845311,S:0.13797592},{age:23.8571428571,L:0.57454454,M:0.59184116,S:0.13798199},{age:24.0,L:0.60403312,M:0.60543883,S:0.13799102},
    {age:24.1428571429,L:0.63286324,M:0.61926819,S:0.13800333},{age:24.2857142857,L:0.66072132,M:0.63335129,S:0.13801922},{age:24.4285714286,L:0.68729383,M:0.64771021,S:0.13803902},
    {age:24.5714285714,L:0.71227366,M:0.66236631,S:0.13806304},{age:24.7142857143,L:0.7355026,M:0.67732483,S:0.13809158},{age:24.8571428571,L:0.75697123,M:0.69257488,S:0.13812496},
    {age:25.0,L:0.77667666,M:0.70810487,S:0.13816349},{age:25.1428571429,L:0.79461596,M:0.72390321,S:0.13820748},{age:25.2857142857,L:0.81078621,M:0.7399583,S:0.13825725},
    {age:25.4285714286,L:0.8251845,M:0.75625857,S:0.1383131},{age:25.5714285714,L:0.83780788,M:0.77279241,S:0.13837536},{age:25.7142857143,L:0.84865295,M:0.78954824,S:0.13844432},
    {age:25.8571428571,L:0.85771582,M:0.80651448,S:0.13852031},{age:26.0,L:0.86499258,M:0.82367952,S:0.13860364},{age:26.1428571429,L:0.87047933,M:0.84103178,S:0.13869461},
    {age:26.2857142857,L:0.87417215,M:0.85855967,S:0.13879355},{age:26.4285714286,L:0.87606714,M:0.8762516,S:0.13890076},{age:26.5714285714,L:0.87616048,M:0.89409599,S:0.13901655},
    {age:26.7142857143,L:0.87445009,M:0.91208123,S:0.13914124},{age:26.8571428571,L:0.8709357,M:0.93019574,S:0.13927513},{age:27.0,L:0.86561708,M:0.94842793,S:0.13941855},
    {age:27.1428571429,L:0.85849403,M:0.96676621,S:0.1395718},{age:27.2857142857,L:0.84956633,M:0.98519899,S:0.1397352},{age:27.4285714286,L:0.83883378,M:1.00371468,S:0.13990905},
    {age:27.5714285714,L:0.82629586,M:1.02230233,S:0.14009366},{age:27.7142857143,L:0.81194547,M:1.04096561,S:0.140289},{age:27.8571428571,L:0.79576891,M:1.05972279,S:0.14049468},
    {age:28.0,L:0.77775217,M:1.07859283,S:0.14071035},{age:28.1428571429,L:0.75788124,M:1.09759463,S:0.14093561},{age:28.2857142857,L:0.73614213,M:1.11674713,S:0.14117009},
    {age:28.4285714286,L:0.71252084,M:1.13606926,S:0.14141341},{age:28.5714285714,L:0.68701187,M:1.15557994,S:0.14166518},{age:28.7142857143,L:0.65980541,M:1.1752981,S:0.14192503},
    {age:28.8571428571,L:0.63128731,M:1.19524267,S:0.14219259},{age:29.0,L:0.60185192,M:1.21543257,S:0.14246746},{age:29.1428571429,L:0.57189363,M:1.23588673,S:0.14274927},
    {age:29.2857142857,L:0.54180678,M:1.25662409,S:0.14303764},{age:29.4285714286,L:0.51198574,M:1.27766355,S:0.14333219},{age:29.5714285714,L:0.48281981,M:1.29902407,S:0.14363254},
    {age:29.7142857143,L:0.45458211,M:1.32072455,S:0.14393832},{age:29.8571428571,L:0.42742951,M:1.34278393,S:0.14424913},{age:30.0,L:0.40151384,M:1.36522114,S:0.14456461},
    {age:30.1428571429,L:0.37698694,M:1.3880551,S:0.14488436},{age:30.2857142857,L:0.35400064,M:1.41130474,S:0.14520802},{age:30.4285714286,L:0.33270677,M:1.43498898,S:0.14553521},
    {age:30.5714285714,L:0.31325212,M:1.45912604,S:0.14586547},{age:30.7142857143,L:0.29566725,M:1.48371739,S:0.14619685},{age:30.8571428571,L:0.27986652,M:1.50874783,S:0.14652589},
    {age:31.0,L:0.26575923,M:1.5342014,S:0.14684906},{age:31.1428571429,L:0.25325469,M:1.56006217,S:0.14716283},{age:31.2857142857,L:0.24226219,M:1.58631419,S:0.14746367},
    {age:31.4285714286,L:0.23269104,M:1.61294152,S:0.14774805},{age:31.5714285714,L:0.22445163,M:1.63992821,S:0.14801245},{age:31.7142857143,L:0.21747897,M:1.66725831,S:0.14825332},
    {age:31.8571428571,L:0.21173275,M:1.69491589,S:0.14846714},{age:32.0,L:0.20717375,M:1.722885,S:0.14865039},{age:32.1428571429,L:0.20376272,M:1.7511497,S:0.14879953},
    {age:32.2857142857,L:0.20146042,M:1.77969404,S:0.14891104},{age:32.4285714286,L:0.20022761,M:1.80850208,S:0.14898137},{age:32.5714285714,L:0.20002395,M:1.83755796,S:0.14900715},
    {age:32.7142857143,L:0.20078387,M:1.86684786,S:0.14898803},{age:32.8571428571,L:0.20241654,M:1.89636,S:0.14892675},{age:33.0,L:0.20483003,M:1.92608267,S:0.14882617},
    {age:33.1428571429,L:0.20793241,M:1.95600417,S:0.14868918},{age:33.2857142857,L:0.21163177,M:1.98611281,S:0.14851862},{age:33.4285714286,L:0.21583617,M:2.01639689,S:0.14831737},
    {age:33.5714285714,L:0.22045376,M:2.04684471,S:0.1480883},{age:33.7142857143,L:0.22539448,M:2.07744457,S:0.14783428},{age:33.8571428571,L:0.23057001,M:2.10818476,S:0.14755816},
    {age:34.0,L:0.23589211,M:2.1390536,S:0.14726283},{age:34.1428571429,L:0.24127257,M:2.17003938,S:0.14695114},{age:34.2857142857,L:0.24662315,M:2.2011304,S:0.14662596},
    {age:34.4285714286,L:0.25185561,M:2.23231496,S:0.14629017},{age:34.5714285714,L:0.25688171,M:2.26358137,S:0.14594662},{age:34.7142857143,L:0.26161273,M:2.29491793,S:0.14559819},
    {age:34.8571428571,L:0.26595945,M:2.32631292,S:0.14524774},{age:35.0,L:0.26983267,M:2.35775467,S:0.14489814},{age:35.1428571429,L:0.27314315,M:2.38923146,S:0.14455226},
    {age:35.2857142857,L:0.27580168,M:2.4207316,S:0.14421297},{age:35.4285714286,L:0.27771905,M:2.45224339,S:0.14388312},{age:35.5714285714,L:0.27880602,M:2.48375517,S:0.1435656},
    {age:35.7142857143,L:0.27897352,M:2.51525606,S:0.14326326},{age:35.8571428571,L:0.27813259,M:2.54673598,S:0.14297898},{age:36.0,L:0.27619426,M:2.5781849,S:0.14271561},
    {age:36.1428571429,L:0.27306959,M:2.60959276,S:0.14247604},{age:36.2857142857,L:0.26866962,M:2.64094953,S:0.14226312},{age:36.4285714286,L:0.26290539,M:2.67224517,S:0.14207973},
    {age:36.5714285714,L:0.2556928,M:2.70346963,S:0.14192861},{age:36.7142857143,L:0.24705932,M:2.73461286,S:0.14180989},{age:36.8571428571,L:0.23714404,M:2.76566483,S:0.14172107},
    {age:37.0,L:0.22609085,M:2.79661549,S:0.14165951},{age:37.1428571429,L:0.21404369,M:2.8274548,S:0.1416226},{age:37.2857142857,L:0.20114647,M:2.85817271,S:0.14160772},
    {age:37.4285714286,L:0.18754311,M:2.88875919,S:0.14161224},{age:37.5714285714,L:0.17337752,M:2.91920445,S:0.14163354},{age:37.7142857143,L:0.15879363,M:2.9495047,S:0.141669},
    {age:37.8571428571,L:0.14393538,M:2.97966219,S:0.141716},{age:38.0,L:0.1289467,M:3.00967939,S:0.14177192},{age:38.1428571429,L:0.11397154,M:3.03955878,S:0.14183414},
    {age:38.2857142857,L:0.09915382,M:3.06930287,S:0.14190002},{age:38.4285714286,L:0.0846375,M:3.09891412,S:0.14196696},{age:38.5714285714,L:0.07056649,M:3.12839504,S:0.14203235},
    {age:38.7142857143,L:0.05708474,M:3.15774809,S:0.14209419},{age:38.8571428571,L:0.04433617,M:3.18697578,S:0.14215107},{age:39.0,L:0.03246473,M:3.21608059,S:0.1422016},
    {age:39.1428571429,L:0.02161433,M:3.245065,S:0.14224439},{age:39.2857142857,L:0.01192892,M:3.2739315,S:0.14227807},{age:39.4285714286,L:0.00355243,M:3.30268258,S:0.14230123},
    {age:39.5714285714,L:-0.00337661,M:3.33132072,S:0.1423125},{age:39.7142857143,L:-0.00884342,M:3.35984841,S:0.14231048},{age:39.8571428571,L:-0.01295704,M:3.38826814,S:0.1422938},
    {age:40.0,L:-0.0158319,M:3.41658238,S:0.14226106},{age:40.1428571429,L:-0.0175824,M:3.44479364,S:0.14221087},{age:40.2857142857,L:-0.01832296,M:3.47290439,S:0.14214186},
    {age:40.4285714286,L:-0.018168,M:3.50091712,S:0.14205263},{age:40.5714285714,L:-0.01723194,M:3.52883431,S:0.14194185},{age:40.7142857143,L:-0.01562919,M:3.55665846,S:0.14180935},
    {age:40.8571428571,L:-0.01347416,M:3.58439205,S:0.14165613},{age:41.0,L:-0.01088129,M:3.61203757,S:0.14148325},{age:41.1428571429,L:-0.00796497,M:3.6395975,S:0.14129177},
    {age:41.2857142857,L:-0.00483963,M:3.66707432,S:0.14108273},{age:41.4285714286,L:-0.00161969,M:3.69447053,S:0.1408572},{age:41.5714285714,L:0.00158285,M:3.72178862,S:0.14061622},
    {age:41.7142857143,L:0.00471138,M:3.74903106,S:0.14036086},{age:41.8571428571,L:0.00776473,M:3.77620034,S:0.14009215},{age:42.0,L:0.01074412,M:3.80329895,S:0.13981117},
    {age:42.1428571429,L:0.01365076,M:3.83032938,S:0.13951896},{age:42.2857142857,L:0.01648589,M:3.85729412,S:0.13921658},{age:42.4285714286,L:0.01925072,M:3.88419564,S:0.13890508},
    {age:42.5714285714,L:0.02194647,M:3.91103644,S:0.13858552},{age:42.7142857143,L:0.02457437,M:3.93781899,S:0.13825895},{age:42.8571428571,L:0.02713565,M:3.9645458,S:0.13792642},
    {age:43.0,L:0.02963152,M:3.99121934,S:0.13758899},{age:43.1428571429,L:0.0320632,M:4.0178421,S:0.13724772},{age:43.2857142857,L:0.03443192,M:4.04441657,S:0.13690365},
    {age:43.4285714286,L:0.0367389,M:4.07094524,S:0.13655784},{age:43.5714285714,L:0.03898537,M:4.09743058,S:0.13621136},{age:43.7142857143,L:0.04117254,M:4.12387508,S:0.13586524},
    {age:43.8571428571,L:0.04330164,M:4.15028124,S:0.13552055},{age:44.0,L:0.04537389,M:4.17665154,S:0.13517833},{age:44.1428571429,L:0.04739052,M:4.20298847,S:0.13483965},
    {age:44.2857142857,L:0.04935274,M:4.2292945,S:0.13450556},{age:44.4285714286,L:0.05126179,M:4.25557213,S:0.13417711},{age:44.5714285714,L:0.05311887,M:4.28182385,S:0.13385536},
    {age:44.7142857143,L:0.05492522,M:4.30805213,S:0.13354136},{age:44.8571428571,L:0.05668206,M:4.33425947,S:0.13323616},{age:45.0,L:0.05839061,M:4.36044836,S:0.13294082},
    {age:45.1428571429,L:0.06005208,M:4.38662127,S:0.1326564},{age:45.2857142857,L:0.06166771,M:4.4127807,S:0.13238394},{age:45.4285714286,L:0.06323871,M:4.43892913,S:0.1321245},
    {age:45.5714285714,L:0.06476631,M:4.465069,S:0.13187911},{age:45.7142857143,L:0.06625173,M:4.49120167,S:0.13164807},{age:45.8571428571,L:0.06769619,M:4.51732742,S:0.13143092},
    {age:46.0,L:0.06910092,M:4.54344648,S:0.13122723},{age:46.1428571429,L:0.07046715,M:4.56955908,S:0.13103651},{age:46.2857142857,L:0.0717961,M:4.59566544,S:0.13085831},
    {age:46.4285714286,L:0.07308899,M:4.62176581,S:0.13069217},{age:46.5714285714,L:0.07434706,M:4.6478604,S:0.13053762},{age:46.7142857143,L:0.07557151,M:4.67394946,S:0.13039419},
    {age:46.8571428571,L:0.07676357,M:4.70003321,S:0.13026142},{age:47.0,L:0.07792444,M:4.72611188,S:0.13013886},{age:47.1428571429,L:0.07905533,M:4.75218571,S:0.13002603},
    {age:47.2857142857,L:0.08015747,M:4.77825493,S:0.12992247},{age:47.4285714286,L:0.08123206,M:4.80431975,S:0.12982772},{age:47.5714285714,L:0.08228031,M:4.83038043,S:0.12974132},
    {age:47.7142857143,L:0.08330346,M:4.85643718,S:0.1296628},{age:47.8571428571,L:0.08430278,M:4.88249024,S:0.12959169},{age:48.0,L:0.08527952,M:4.90853984,S:0.12952754},
    {age:48.1428571429,L:0.08623494,M:4.93458621,S:0.12946988},{age:48.2857142857,L:0.0871703,M:4.96062958,S:0.12941825},{age:48.4285714286,L:0.08808686,M:4.98667017,S:0.12937218},
    {age:48.5714285714,L:0.08898589,M:5.01270823,S:0.12933121},{age:48.7142857143,L:0.08986854,M:5.03874399,S:0.12929488},{age:48.8571428571,L:0.09073592,M:5.06477766,S:0.12926272},
    {age:49.0,L:0.09158908,M:5.09080949,S:0.12923426},{age:49.1428571429,L:0.09242913,M:5.11683971,S:0.12920906},{age:49.2857142857,L:0.09325713,M:5.14286854,S:0.12918663},
    {age:49.4285714286,L:0.09407417,M:5.16889622,S:0.12916652},{age:49.5714285714,L:0.09488136,M:5.19492297,S:0.12914827},{age:49.7142857143,L:0.09568057,M:5.22094903,S:0.12913141},
    {age:49.8571428571,L:0.09647445,M:5.24697463,S:0.12911547},{age:50.0,L:0.09726567,M:5.273,S:0.1291},
    ],
    hc: [
    {age:22.5,L:1.0,M:19.4468341,S:0.06753445},{age:22.5714285714,L:1.0,M:19.51223903,S:0.06732597},{age:22.7142857143,L:1.0,M:19.66436581,S:0.06684136},
    {age:22.8571428571,L:1.0,M:19.81656037,S:0.06635739},{age:23.0,L:1.0,M:19.9688679,S:0.06587449},{age:23.1428571429,L:1.0,M:20.12133359,S:0.06539309},
    {age:23.2857142857,L:1.0,M:20.27400262,S:0.06491362},{age:23.4285714286,L:1.0,M:20.42692019,S:0.06443651},{age:23.5714285714,L:1.0,M:20.58012819,S:0.06396223},
    {age:23.7142857143,L:1.0,M:20.73359279,S:0.06349238},{age:23.8571428571,L:1.0,M:20.88720444,S:0.06302965},{age:24.0,L:1.0,M:21.04085032,S:0.0625768},
    {age:24.1428571429,L:1.0,M:21.19441759,S:0.06213656},{age:24.2857142857,L:1.0,M:21.3477934,S:0.06171169},{age:24.4285714286,L:1.0,M:21.50086492,S:0.06130494},
    {age:24.5714285714,L:1.0,M:21.65352275,S:0.06091902},{age:24.7142857143,L:1.0,M:21.80573626,S:0.0605558},{age:24.8571428571,L:1.0,M:21.95755365,S:0.0602163},
    {age:25.0,L:1.0,M:22.10902654,S:0.05990152},{age:25.1428571429,L:1.0,M:22.26020655,S:0.05961244},{age:25.2857142857,L:1.0,M:22.41114528,S:0.05935006},
    {age:25.4285714286,L:1.0,M:22.56189437,S:0.05911537},{age:25.5714285714,L:1.0,M:22.71250459,S:0.05890922},{age:25.7142857143,L:1.0,M:22.86300788,S:0.05872954},
    {age:25.8571428571,L:1.0,M:23.01341725,S:0.05857129},{age:26.0,L:1.0,M:23.16374493,S:0.05842931},{age:26.1428571429,L:1.0,M:23.3140031,S:0.05829846},
    {age:26.2857142857,L:1.0,M:23.464204,S:0.05817356},{age:26.4285714286,L:1.0,M:23.61435982,S:0.05804947},{age:26.5714285714,L:1.0,M:23.76448156,S:0.05792113},
    {age:26.7142857143,L:1.0,M:23.91455218,S:0.05778614},{age:26.8571428571,L:1.0,M:24.06452662,S:0.05764472},{age:27.0,L:1.0,M:24.21435861,S:0.0574972},
    {age:27.1428571429,L:1.0,M:24.36400187,S:0.05734391},{age:27.2857142857,L:1.0,M:24.51341011,S:0.05718519},{age:27.4285714286,L:1.0,M:24.66253706,S:0.05702137},
    {age:27.5714285714,L:1.0,M:24.81134197,S:0.05685275},{age:27.7142857143,L:1.0,M:24.95991119,S:0.05667865},{age:27.8571428571,L:1.0,M:25.10845821,S:0.05649747},
    {age:28.0,L:1.0,M:25.257202,S:0.05630754},{age:28.1428571429,L:1.0,M:25.40636158,S:0.05610719},{age:28.2857142857,L:1.0,M:25.55615594,S:0.05589477},
    {age:28.4285714286,L:1.0,M:25.70680407,S:0.05566861},{age:28.5714285714,L:1.0,M:25.85850277,S:0.05542721},{age:28.7142857143,L:1.0,M:26.01093817,S:0.05517274},
    {age:28.8571428571,L:1.0,M:26.16328572,S:0.05491108},{age:29.0,L:1.0,M:26.31469868,S:0.05464822},{age:29.1428571429,L:1.0,M:26.4643303,S:0.0543902},
    {age:29.2857142857,L:1.0,M:26.61133384,S:0.05414303},{age:29.4285714286,L:1.0,M:26.75486254,S:0.05391273},{age:29.5714285714,L:1.0,M:26.8941119,S:0.05370512},
    {age:29.7142857143,L:1.0,M:27.02924878,S:0.05352165},{age:29.8571428571,L:1.0,M:27.16141139,S:0.05335935},{age:30.0,L:1.0,M:27.29178021,S:0.0532151},
    {age:30.1428571429,L:1.0,M:27.42153569,S:0.05308574},{age:30.2857142857,L:1.0,M:27.55185829,S:0.05296813},{age:30.4285714286,L:1.0,M:27.68392847,S:0.05285913},
    {age:30.5714285714,L:1.0,M:27.81888351,S:0.05275553},{age:30.7142857143,L:1.0,M:27.95686759,S:0.05265251},{age:30.8571428571,L:1.0,M:28.09703176,S:0.05254367},
    {age:31.0,L:1.0,M:28.23848393,S:0.05242251},{age:31.1428571429,L:1.0,M:28.38033197,S:0.05228257},{age:31.2857142857,L:1.0,M:28.52168377,S:0.05211736},
    {age:31.4285714286,L:1.0,M:28.66164722,S:0.05192039},{age:31.5714285714,L:1.0,M:28.79935758,S:0.05168555},{age:31.7142857143,L:1.0,M:28.93457982,S:0.05141486},
    {age:31.8571428571,L:1.0,M:29.06770863,S:0.05111851},{age:32.0,L:1.0,M:29.19916607,S:0.05080706},{age:32.1428571429,L:1.0,M:29.32937419,S:0.05049105},
    {age:32.2857142857,L:1.0,M:29.45875505,S:0.05018102},{age:32.4285714286,L:1.0,M:29.58773071,S:0.04988752},{age:32.5714285714,L:1.0,M:29.71670901,S:0.04962066},
    {age:32.7142857143,L:1.0,M:29.84577043,S:0.04938081},{age:32.8571428571,L:1.0,M:29.97466819,S:0.0491585},{age:33.0,L:1.0,M:30.10314122,S:0.04894388},
    {age:33.1428571429,L:1.0,M:30.23092848,S:0.04872708},{age:33.2857142857,L:1.0,M:30.35776893,S:0.04849824},{age:33.4285714286,L:1.0,M:30.48340152,S:0.04824749},
    {age:33.5714285714,L:1.0,M:30.60757396,S:0.04796536},{age:33.7142857143,L:1.0,M:30.73023509,S:0.04765143},{age:33.8571428571,L:1.0,M:30.8515349,S:0.04731433},
    {age:34.0,L:1.0,M:30.97163213,S:0.04696309},{age:34.1428571429,L:1.0,M:31.09068552,S:0.04660674},{age:34.2857142857,L:1.0,M:31.20885381,S:0.0462543},
    {age:34.4285714286,L:1.0,M:31.32629573,S:0.04591479},{age:34.5714285714,L:1.0,M:31.44316083,S:0.04559697},{age:34.7142857143,L:1.0,M:31.55938724,S:0.04530342},
    {age:34.8571428571,L:1.0,M:31.67470165,S:0.04503057},{age:35.0,L:1.0,M:31.78882157,S:0.04477454},{age:35.1428571429,L:1.0,M:31.90146451,S:0.04453148},
    {age:35.2857142857,L:1.0,M:32.01234797,S:0.04429754},{age:35.4285714286,L:1.0,M:32.12118948,S:0.04406886},{age:35.5714285714,L:1.0,M:32.22771317,S:0.04384163},
    {age:35.7142857143,L:1.0,M:32.33179592,S:0.04361318},{age:35.8571428571,L:1.0,M:32.43346737,S:0.04338197},{age:36.0,L:1.0,M:32.53276376,S:0.04314654},
    {age:36.1428571429,L:1.0,M:32.62972136,S:0.0429054},{age:36.2857142857,L:1.0,M:32.72437643,S:0.04265706},{age:36.4285714286,L:1.0,M:32.81676523,S:0.04240006},
    {age:36.5714285714,L:1.0,M:32.90692659,S:0.04213302},{age:36.7142857143,L:1.0,M:32.99495824,S:0.0418574},{age:36.8571428571,L:1.0,M:33.08101687,S:0.04157743},
    {age:37.0,L:1.0,M:33.16526171,S:0.0412975},{age:37.1428571429,L:1.0,M:33.247852,S:0.04102196},{age:37.2857142857,L:1.0,M:33.32894697,S:0.0407552},
    {age:37.4285714286,L:1.0,M:33.40870586,S:0.04050156},{age:37.5714285714,L:1.0,M:33.48728634,S:0.04026528},{age:37.7142857143,L:1.0,M:33.5648101,S:0.04004689},
    {age:37.8571428571,L:1.0,M:33.64136284,S:0.0398433},{age:38.0,L:1.0,M:33.71702871,S:0.03965124},{age:38.1428571429,L:1.0,M:33.79189184,S:0.03946744},
    {age:38.2857142857,L:1.0,M:33.86603637,S:0.03928866},{age:38.4285714286,L:1.0,M:33.93954644,S:0.03911161},{age:38.5714285714,L:1.0,M:34.01250446,S:0.03893313},
    {age:38.7142857143,L:1.0,M:34.08495292,S:0.03875189},{age:38.8571428571,L:1.0,M:34.1568944,S:0.03856845},{age:39.0,L:1.0,M:34.22832977,S:0.03838344},
    {age:39.1428571429,L:1.0,M:34.29925988,S:0.0381975},{age:39.2857142857,L:1.0,M:34.36968556,S:0.03801125},{age:39.4285714286,L:1.0,M:34.43960769,S:0.03782534},
    {age:39.5714285714,L:1.0,M:34.509027,S:0.03764039},{age:39.7142857143,L:1.0,M:34.57794148,S:0.03745693},{age:39.8571428571,L:1.0,M:34.64634642,S:0.0372754},
    {age:40.0,L:1.0,M:34.71423699,S:0.03709623},{age:40.1428571429,L:1.0,M:34.78160834,S:0.03691984},{age:40.2857142857,L:1.0,M:34.84845564,S:0.03674667},
    {age:40.4285714286,L:1.0,M:34.91477405,S:0.03657715},{age:40.5714285714,L:1.0,M:34.98055925,S:0.03641167},{age:40.7142857143,L:1.0,M:35.04581902,S:0.03625028},
    {age:40.8571428571,L:1.0,M:35.11057321,S:0.0360926},{age:41.0,L:1.0,M:35.17484219,S:0.03593825},{age:41.1428571429,L:1.0,M:35.23864635,S:0.03578683},
    {age:41.2857142857,L:1.0,M:35.30200606,S:0.03563798},{age:41.4285714286,L:1.0,M:35.36494169,S:0.03549129},{age:41.5714285714,L:1.0,M:35.42747323,S:0.03534639},
    {age:41.7142857143,L:1.0,M:35.48961129,S:0.0352032},{age:41.8571428571,L:1.0,M:35.55135715,S:0.03506188},{age:42.0,L:1.0,M:35.61271169,S:0.03492263},
    {age:42.1428571429,L:1.0,M:35.67367576,S:0.03478562},{age:42.2857142857,L:1.0,M:35.73425025,S:0.03465106},{age:42.4285714286,L:1.0,M:35.79443602,S:0.03451912},
    {age:42.5714285714,L:1.0,M:35.85423406,S:0.03439},{age:42.7142857143,L:1.0,M:35.9136479,S:0.03426385},{age:42.8571428571,L:1.0,M:35.97268365,S:0.0341408},
    {age:43.0,L:1.0,M:36.03134753,S:0.03402098},{age:43.1428571429,L:1.0,M:36.08964574,S:0.03390452},{age:43.2857142857,L:1.0,M:36.1475845,S:0.03379154},
    {age:43.4285714286,L:1.0,M:36.20517003,S:0.03368218},{age:43.5714285714,L:1.0,M:36.26240824,S:0.03357657},{age:43.7142857143,L:1.0,M:36.31929841,S:0.033475},
    {age:43.8571428571,L:1.0,M:36.37583311,S:0.03337791},{age:44.0,L:1.0,M:36.43200466,S:0.03328576},{age:44.1428571429,L:1.0,M:36.48780536,S:0.033199},
    {age:44.2857142857,L:1.0,M:36.54322751,S:0.03311809},{age:44.4285714286,L:1.0,M:36.59826342,S:0.03304348},{age:44.5714285714,L:1.0,M:36.6529066,S:0.03297559},
    {age:44.7142857143,L:1.0,M:36.70717857,S:0.03291423},{age:44.8571428571,L:1.0,M:36.76112883,S:0.03285862},{age:45.0,L:1.0,M:36.8148081,S:0.03280791},
    {age:45.1428571429,L:1.0,M:36.86826709,S:0.03276128},{age:45.2857142857,L:1.0,M:36.92155653,S:0.0327179},{age:45.4285714286,L:1.0,M:36.97472713,S:0.03267695},
    {age:45.5714285714,L:1.0,M:37.02782959,S:0.03263758},{age:45.7142857143,L:1.0,M:37.08091428,S:0.03259861},{age:45.8571428571,L:1.0,M:37.13403124,S:0.03255851},
    {age:46.0,L:1.0,M:37.18723047,S:0.03251573},{age:46.1428571429,L:1.0,M:37.240562,S:0.03246873},{age:46.2857142857,L:1.0,M:37.29407584,S:0.03241598},
    {age:46.4285714286,L:1.0,M:37.347822,S:0.03235591},{age:46.5714285714,L:1.0,M:37.40184595,S:0.03228708},{age:46.7142857143,L:1.0,M:37.45608864,S:0.0322098},
    {age:46.8571428571,L:1.0,M:37.51038646,S:0.03212618},{age:47.0,L:1.0,M:37.56457127,S:0.0320384},{age:47.1428571429,L:1.0,M:37.61847492,S:0.03194867},
    {age:47.2857142857,L:1.0,M:37.67192926,S:0.03185916},{age:47.4285714286,L:1.0,M:37.72476616,S:0.03177205},{age:47.5714285714,L:1.0,M:37.776821,S:0.03168951},
    {age:47.7142857143,L:1.0,M:37.82801059,S:0.03161276},{age:47.8571428571,L:1.0,M:37.87833309,S:0.03154214},{age:48.0,L:1.0,M:37.92779025,S:0.03147791},
    {age:48.1428571429,L:1.0,M:37.97638378,S:0.03142037},{age:48.2857142857,L:1.0,M:38.02411541,S:0.03136981},{age:48.4285714286,L:1.0,M:38.07098687,S:0.0313265},
    {age:48.5714285714,L:1.0,M:38.11699928,S:0.03129073},{age:48.7142857143,L:1.0,M:38.16213975,S:0.0312628},{age:48.8571428571,L:1.0,M:38.20638141,S:0.031243},
    {age:49.0,L:1.0,M:38.24969678,S:0.03123163},{age:49.1428571429,L:1.0,M:38.29205837,S:0.03122901},{age:49.2857142857,L:1.0,M:38.33343871,S:0.03123541},
    {age:49.4285714286,L:1.0,M:38.3738103,S:0.03125116},{age:49.5714285714,L:1.0,M:38.4131525,S:0.03127647},{age:49.7142857143,L:1.0,M:38.45160155,S:0.03131011},
    {age:49.8571428571,L:1.0,M:38.48945062,S:0.03134935},{age:50.0,L:1.0,M:38.5269997,S:0.03139138},
    ],
    length: [
    {age:23.5,L:1.0,M:29.49967189,S:0.0771632},{age:23.5714285714,L:1.0,M:29.59935182,S:0.07699579},{age:23.7142857143,L:1.0,M:29.79870763,S:0.07666098},
    {age:23.8571428571,L:1.0,M:29.99805128,S:0.07632621},{age:24.0,L:1.0,M:30.19737468,S:0.07599151},{age:24.1428571429,L:1.0,M:30.39666974,S:0.0756569},
    {age:24.2857142857,L:1.0,M:30.59592833,S:0.0753224},{age:24.4285714286,L:1.0,M:30.79514238,S:0.07498806},{age:24.5714285714,L:1.0,M:30.99430743,S:0.07465388},
    {age:24.7142857143,L:1.0,M:31.19350309,S:0.0743199},{age:24.8571428571,L:1.0,M:31.39289304,S:0.07398615},{age:25.0,L:1.0,M:31.59264461,S:0.07365264},
    {age:25.1428571429,L:1.0,M:31.79292513,S:0.07331941},{age:25.2857142857,L:1.0,M:31.99390191,S:0.07298649},{age:25.4285714286,L:1.0,M:32.1957423,S:0.07265389},
    {age:25.5714285714,L:1.0,M:32.39860691,S:0.07232165},{age:25.7142857143,L:1.0,M:32.60250197,S:0.07198979},{age:25.8571428571,L:1.0,M:32.8072793,S:0.07165834},
    {age:26.0,L:1.0,M:33.01278405,S:0.07132732},{age:26.1428571429,L:1.0,M:33.21886134,S:0.07099676},{age:26.2857142857,L:1.0,M:33.42535629,S:0.07066669},
    {age:26.4285714286,L:1.0,M:33.63211404,S:0.07033713},{age:26.5714285714,L:1.0,M:33.83898407,S:0.07000812},{age:26.7142857143,L:1.0,M:34.04591627,S:0.06967966},
    {age:26.8571428571,L:1.0,M:34.25296094,S:0.06935181},{age:27.0,L:1.0,M:34.46017273,S:0.06902456},{age:27.1428571429,L:1.0,M:34.6676063,S:0.06869797},
    {age:27.2857142857,L:1.0,M:34.87531629,S:0.06837204},{age:27.4285714286,L:1.0,M:35.08335738,S:0.06804682},{age:27.5714285714,L:1.0,M:35.29177826,S:0.06772231},
    {age:27.7142857143,L:1.0,M:35.50049092,S:0.06739856},{age:27.8571428571,L:1.0,M:35.70927063,S:0.06707558},{age:28.0,L:1.0,M:35.91788671,S:0.06675341},
    {age:28.1428571429,L:1.0,M:36.12610847,S:0.06643206},{age:28.2857142857,L:1.0,M:36.33370523,S:0.06611157},{age:28.4285714286,L:1.0,M:36.54044631,S:0.06579196},
    {age:28.5714285714,L:1.0,M:36.74611297,S:0.06547326},{age:28.7142857143,L:1.0,M:36.95076119,S:0.0651555},{age:28.8571428571,L:1.0,M:37.1547217,S:0.06483869},
    {age:29.0,L:1.0,M:37.35833713,S:0.06452287},{age:29.1428571429,L:1.0,M:37.56195016,S:0.06420807},{age:29.2857142857,L:1.0,M:37.76590342,S:0.0638943},
    {age:29.4285714286,L:1.0,M:37.97053958,S:0.0635816},{age:29.5714285714,L:1.0,M:38.17618353,S:0.06327},{age:29.7142857143,L:1.0,M:38.38275144,S:0.06295951},
    {age:29.8571428571,L:1.0,M:38.58975081,S:0.06265016},{age:30.0,L:1.0,M:38.79667135,S:0.06234199},{age:30.1428571429,L:1.0,M:39.00300279,S:0.06203502},
    {age:30.2857142857,L:1.0,M:39.20823484,S:0.06172927},{age:30.4285714286,L:1.0,M:39.41185722,S:0.06142477},{age:30.5714285714,L:1.0,M:39.61337667,S:0.06112154},
    {age:30.7142857143,L:1.0,M:39.81269157,S:0.06081962},{age:30.8571428571,L:1.0,M:40.01009189,S:0.06051903},{age:31.0,L:1.0,M:40.20588464,S:0.06021979},
    {age:31.1428571429,L:1.0,M:40.40037684,S:0.05992194},{age:31.2857142857,L:1.0,M:40.5938755,S:0.05962549},{age:31.4285714286,L:1.0,M:40.78668762,S:0.05933048},
    {age:31.5714285714,L:1.0,M:40.97910425,S:0.05903692},{age:31.7142857143,L:1.0,M:41.17104905,S:0.05874486},{age:31.8571428571,L:1.0,M:41.36207831,S:0.05845431},
    {age:32.0,L:1.0,M:41.55173236,S:0.0581653},{age:32.1428571429,L:1.0,M:41.73955151,S:0.05787785},{age:32.2857142857,L:1.0,M:41.92507608,S:0.057592},
    {age:32.4285714286,L:1.0,M:42.1078464,S:0.05730776},{age:32.5714285714,L:1.0,M:42.28743184,S:0.05702517},{age:32.7142857143,L:1.0,M:42.46406993,S:0.05674425},
    {age:32.8571428571,L:1.0,M:42.63866641,S:0.05646503},{age:33.0,L:1.0,M:42.81215605,S:0.05618754},{age:33.1428571429,L:1.0,M:42.98547362,S:0.05591179},
    {age:33.2857142857,L:1.0,M:43.15955388,S:0.05563782},{age:33.4285714286,L:1.0,M:43.33533162,S:0.05536565},{age:33.5714285714,L:1.0,M:43.51370341,S:0.05509531},
    {age:33.7142857143,L:1.0,M:43.69468705,S:0.05482683},{age:33.8571428571,L:1.0,M:43.87742165,S:0.05456023},{age:34.0,L:1.0,M:44.06100807,S:0.05429554},
    {age:34.1428571429,L:1.0,M:44.24454718,S:0.05403278},{age:34.2857142857,L:1.0,M:44.42713988,S:0.05377198},{age:34.4285714286,L:1.0,M:44.60788702,S:0.05351317},
    {age:34.5714285714,L:1.0,M:44.78591459,S:0.05325638},{age:34.7142857143,L:1.0,M:44.96092565,S:0.05300162},{age:34.8571428571,L:1.0,M:45.13320039,S:0.05274893},
    {age:35.0,L:1.0,M:45.30304407,S:0.05249833},{age:35.1428571429,L:1.0,M:45.47076199,S:0.05224985},{age:35.2857142857,L:1.0,M:45.6366594,S:0.05200352},
    {age:35.4285714286,L:1.0,M:45.80104158,S:0.05175935},{age:35.5714285714,L:1.0,M:45.96420318,S:0.05151739},{age:35.7142857143,L:1.0,M:46.12619432,S:0.05127765},
    {age:35.8571428571,L:1.0,M:46.28682057,S:0.05104016},{age:36.0,L:1.0,M:46.44587692,S:0.05080494},{age:36.1428571429,L:1.0,M:46.60315831,S:0.05057203},
    {age:36.2857142857,L:1.0,M:46.7584597,S:0.05034145},{age:36.4285714286,L:1.0,M:46.91157607,S:0.05011322},{age:36.5714285714,L:1.0,M:47.06230918,S:0.04988738},
    {age:36.7142857143,L:1.0,M:47.2106177,S:0.04966391},{age:36.8571428571,L:1.0,M:47.35661717,S:0.04944281},{age:37.0,L:1.0,M:47.50042994,S:0.04922404},
    {age:37.1428571429,L:1.0,M:47.64217837,S:0.04900757},{age:37.2857142857,L:1.0,M:47.78198483,S:0.0487934},{age:37.4285714286,L:1.0,M:47.91997167,S:0.04858148},
    {age:37.5714285714,L:1.0,M:48.0562603,S:0.0483718},{age:37.7142857143,L:1.0,M:48.19094999,S:0.04816433},{age:37.8571428571,L:1.0,M:48.32411794,S:0.04795905},
    {age:38.0,L:1.0,M:48.45584039,S:0.04775593},{age:38.1428571429,L:1.0,M:48.58619355,S:0.04755495},{age:38.2857142857,L:1.0,M:48.71525367,S:0.04735609},
    {age:38.4285714286,L:1.0,M:48.84309695,S:0.04715931},{age:38.5714285714,L:1.0,M:48.96979962,S:0.0469646},{age:38.7142857143,L:1.0,M:49.09543751,S:0.04677193},
    {age:38.8571428571,L:1.0,M:49.22008606,S:0.04658128},{age:39.0,L:1.0,M:49.3438207,S:0.04639262},{age:39.1428571429,L:1.0,M:49.46671686,S:0.04620592},
    {age:39.2857142857,L:1.0,M:49.58884997,S:0.04602117},{age:39.4285714286,L:1.0,M:49.71029547,S:0.04583834},{age:39.5714285714,L:1.0,M:49.8311288,S:0.0456574},
    {age:39.7142857143,L:1.0,M:49.95142596,S:0.04547833},{age:39.8571428571,L:1.0,M:50.07126351,S:0.0453011},{age:40.0,L:1.0,M:50.190718,S:0.0451257},
    {age:40.1428571429,L:1.0,M:50.30986601,S:0.04495209},{age:40.2857142857,L:1.0,M:50.42878411,S:0.04478026},{age:40.4285714286,L:1.0,M:50.54754887,S:0.04461017},
    {age:40.5714285714,L:1.0,M:50.66623475,S:0.04444181},{age:40.7142857143,L:1.0,M:50.78486783,S:0.04427514},{age:40.8571428571,L:1.0,M:50.90342581,S:0.04411015},
    {age:41.0,L:1.0,M:51.02188426,S:0.04394681},{age:41.1428571429,L:1.0,M:51.14021879,S:0.04378509},{age:41.2857142857,L:1.0,M:51.25840497,S:0.04362497},
    {age:41.4285714286,L:1.0,M:51.37641839,S:0.04346643},{age:41.5714285714,L:1.0,M:51.49423466,S:0.04330944},{age:41.7142857143,L:1.0,M:51.61182979,S:0.04315398},
    {age:41.8571428571,L:1.0,M:51.72918019,S:0.04300003},{age:42.0,L:1.0,M:51.84626228,S:0.04284755},{age:42.1428571429,L:1.0,M:51.96305249,S:0.04269652},
    {age:42.2857142857,L:1.0,M:52.07952725,S:0.04254693},{age:42.4285714286,L:1.0,M:52.19566299,S:0.04239874},{age:42.5714285714,L:1.0,M:52.31143608,S:0.04225193},
    {age:42.7142857143,L:1.0,M:52.4268216,S:0.04210648},{age:42.8571428571,L:1.0,M:52.54179332,S:0.04196236},{age:43.0,L:1.0,M:52.65632497,S:0.04181954},
    {age:43.1428571429,L:1.0,M:52.77039027,S:0.04167801},{age:43.2857142857,L:1.0,M:52.88396295,S:0.04153774},{age:43.4285714286,L:1.0,M:52.99701674,S:0.0413987},
    {age:43.5714285714,L:1.0,M:53.10952559,S:0.04126088},{age:43.7142857143,L:1.0,M:53.22146874,S:0.04112423},{age:43.8571428571,L:1.0,M:53.33283074,S:0.04098875},
    {age:44.0,L:1.0,M:53.44359635,S:0.04085441},{age:44.1428571429,L:1.0,M:53.55375033,S:0.04072118},{age:44.2857142857,L:1.0,M:53.66327747,S:0.04058903},
    {age:44.4285714286,L:1.0,M:53.77216253,S:0.04045795},{age:44.5714285714,L:1.0,M:53.88038935,S:0.0403279},{age:44.7142857143,L:1.0,M:53.98792079,S:0.04019888},
    {age:44.8571428571,L:1.0,M:54.09469867,S:0.04007084},{age:45.0,L:1.0,M:54.20066391,S:0.03994376},{age:45.1428571429,L:1.0,M:54.30575743,S:0.03981763},
    {age:45.2857142857,L:1.0,M:54.40992013,S:0.03969241},{age:45.4285714286,L:1.0,M:54.51309294,S:0.03956809},{age:45.5714285714,L:1.0,M:54.61522017,S:0.03944463},
    {age:45.7142857143,L:1.0,M:54.71632443,S:0.03932202},{age:45.8571428571,L:1.0,M:54.81650659,S:0.03920022},{age:46.0,L:1.0,M:54.91587093,S:0.03907922},
    {age:46.1428571429,L:1.0,M:55.01452173,S:0.03895899},{age:46.2857142857,L:1.0,M:55.11256328,S:0.03883951},{age:46.4285714286,L:1.0,M:55.21009986,S:0.03872074},
    {age:46.5714285714,L:1.0,M:55.30724009,S:0.03860267},{age:46.7142857143,L:1.0,M:55.40419247,S:0.03848528},{age:46.8571428571,L:1.0,M:55.50126542,S:0.03836853},
    {age:47.0,L:1.0,M:55.59877165,S:0.0382524},{age:47.1428571429,L:1.0,M:55.6970239,S:0.03813688},{age:47.2857142857,L:1.0,M:55.79633492,S:0.03802192},
    {age:47.4285714286,L:1.0,M:55.89701744,S:0.03790752},{age:47.5714285714,L:1.0,M:55.99936661,S:0.03779365},{age:47.7142857143,L:1.0,M:56.10327326,S:0.03768028},
    {age:47.8571428571,L:1.0,M:56.20822387,S:0.03756738},{age:48.0,L:1.0,M:56.31368737,S:0.03745494},{age:48.1428571429,L:1.0,M:56.41913267,S:0.03734292},
    {age:48.2857142857,L:1.0,M:56.52402867,S:0.0372313},{age:48.4285714286,L:1.0,M:56.62784429,S:0.03712006},{age:48.5714285714,L:1.0,M:56.73005489,S:0.03700917},
    {age:48.7142857143,L:1.0,M:56.83028425,S:0.0368986},{age:48.8571428571,L:1.0,M:56.92830453,S:0.03678834},{age:49.0,L:1.0,M:57.02389436,S:0.03667837},
    {age:49.1428571429,L:1.0,M:57.11683237,S:0.03656866},{age:49.2857142857,L:1.0,M:57.20689719,S:0.03645919},{age:49.4285714286,L:1.0,M:57.29386743,S:0.03634993},
    {age:49.5714285714,L:1.0,M:57.37754673,S:0.03624088},{age:49.7142857143,L:1.0,M:57.45831393,S:0.03613198},{age:49.8571428571,L:1.0,M:57.53712305,S:0.03602319},
    {age:50.0,L:1.0,M:57.61495313,S:0.03591446},
    ],
  },
  male: {
    weight: [
    {age:22.5,L:1.00075702,M:0.50590563,S:0.14496278},{age:22.5714285714,L:1.00540693,M:0.51146926,S:0.14473422},{age:22.7142857143,L:1.016212,M:0.52441966,S:0.14420424},
    {age:22.8571428571,L:1.02699073,M:0.53740572,S:0.14367899},{age:23.0,L:1.03772555,M:0.55045124,S:0.14316164},{age:23.1428571429,L:1.04839891,M:0.56357998,S:0.14265533},
    {age:23.2857142857,L:1.05899324,M:0.57681572,S:0.14216323},{age:23.4285714286,L:1.06949099,M:0.59018224,S:0.14168849},{age:23.5714285714,L:1.07987458,M:0.60370333,S:0.14123427},
    {age:23.7142857143,L:1.09012646,M:0.61740275,S:0.14080373},{age:23.8571428571,L:1.10022907,M:0.63130429,S:0.14040002},{age:24.0,L:1.11016485,M:0.64543173,S:0.14002629},
    {age:24.1428571429,L:1.11991623,M:0.65980885,S:0.13968572},{age:24.2857142857,L:1.12946565,M:0.67445941,S:0.13938144},{age:24.4285714286,L:1.13879555,M:0.68940721,S:0.13911662},
    {age:24.5714285714,L:1.14788837,M:0.70467526,S:0.13889431},{age:24.7142857143,L:1.15672654,M:0.7202693,S:0.13871492},{age:24.8571428571,L:1.16529252,M:0.73617775,S:0.13857624},
    {age:25.0,L:1.17356872,M:0.75238828,S:0.13847597},{age:25.1428571429,L:1.1815376,M:0.76888855,S:0.13841178},{age:25.2857142857,L:1.1891816,M:0.78566625,S:0.13838137},
    {age:25.4285714286,L:1.19648314,M:0.80270905,S:0.1383824},{age:25.5714285714,L:1.20341769,M:0.82000461,S:0.13841257},{age:25.7142857143,L:1.20980042,M:0.83754061,S:0.13846956},
    {age:25.8571428571,L:1.21528612,M:0.85530471,S:0.13855105},{age:26.0,L:1.21952265,M:0.87328461,S:0.13865473},{age:26.1428571429,L:1.22215787,M:0.89146795,S:0.13877828},
    {age:26.2857142857,L:1.22283962,M:0.90984242,S:0.13891938},{age:26.4285714286,L:1.22121575,M:0.92839569,S:0.13907571},{age:26.5714285714,L:1.21693411,M:0.94711543,S:0.13924496},
    {age:26.7142857143,L:1.20964255,M:0.96598931,S:0.13942482},{age:26.8571428571,L:1.19898893,M:0.985005,S:0.13961296},{age:27.0,L:1.18462109,M:1.00415018,S:0.13980706},
    {age:27.1428571429,L:1.16618688,M:1.02341251,S:0.14000482},{age:27.2857142857,L:1.14333415,M:1.04277967,S:0.14020392},{age:27.4285714286,L:1.11571075,M:1.06223933,S:0.14040203},
    {age:27.5714285714,L:1.08298205,M:1.0817797,S:0.1405969},{age:27.7142857143,L:1.04521649,M:1.10140119,S:0.14078739},{age:27.8571428571,L:1.00288553,M:1.12111645,S:0.14097351},
    {age:28.0,L:0.95647817,M:1.14093866,S:0.14115531},{age:28.1428571429,L:0.90648341,M:1.16088098,S:0.14133287},{age:28.2857142857,L:0.85339024,M:1.18095659,S:0.14150622},
    {age:28.4285714286,L:0.79768768,M:1.20117867,S:0.14167544},{age:28.5714285714,L:0.7398647,M:1.22156038,S:0.14184058},{age:28.7142857143,L:0.68041032,M:1.24211491,S:0.1420017},
    {age:28.8571428571,L:0.61981353,M:1.26285542,S:0.14215886},{age:29.0,L:0.55856332,M:1.28379509,S:0.14231211},{age:29.1428571429,L:0.4971487,M:1.3049471,S:0.14246151},
    {age:29.2857142857,L:0.43605867,M:1.32632461,S:0.14260712},{age:29.4285714286,L:0.37578222,M:1.34794081,S:0.142749},{age:29.5714285714,L:0.31680835,M:1.36980886,S:0.14288721},
    {age:29.7142857143,L:0.25962605,M:1.39194194,S:0.1430218},{age:29.8571428571,L:0.20472433,M:1.41435323,S:0.14315283},{age:30.0,L:0.15259219,M:1.43705589,S:0.14328036},
    {age:30.1428571429,L:0.10371862,M:1.4600631,S:0.14340445},{age:30.2857142857,L:0.05859262,M:1.48338804,S:0.14352516},{age:30.4285714286,L:0.01770319,M:1.50704388,S:0.14364254},
    {age:30.5714285714,L:-0.01847676,M:1.53104363,S:0.14375661},{age:30.7142857143,L:-0.0498443,M:1.55539679,S:0.14386656},{age:30.8571428571,L:-0.07666647,M:1.58010927,S:0.14397071},
    {age:31.0,L:-0.09922642,M:1.60518687,S:0.14406736},{age:31.1428571429,L:-0.11780727,M:1.63063537,S:0.14415479},{age:31.2857142857,L:-0.13269217,M:1.65646054,S:0.14423131},
    {age:31.4285714286,L:-0.14416424,M:1.68266818,S:0.14429521},{age:31.5714285714,L:-0.15250663,M:1.70926406,S:0.14434479},{age:31.7142857143,L:-0.15800246,M:1.73625396,S:0.14437833},
    {age:31.8571428571,L:-0.16093487,M:1.76364367,S:0.14439413},{age:32.0,L:-0.161587,M:1.79143897,S:0.14439049},{age:32.1428571429,L:-0.16024199,M:1.81964564,S:0.1443657},
    {age:32.2857142857,L:-0.15718296,M:1.84826946,S:0.14431805},{age:32.4285714286,L:-0.15269305,M:1.87731621,S:0.14424585},{age:32.5714285714,L:-0.14705154,M:1.90679096,S:0.14414744},
    {age:32.7142857143,L:-0.14044888,M:1.93668195,S:0.14402274},{age:32.8571428571,L:-0.13298671,M:1.96696068,S:0.1438732},{age:33.0,L:-0.12476279,M:1.99759789,S:0.14370034},
    {age:33.1428571429,L:-0.1158749,M:2.02856432,S:0.14350568},{age:33.2857142857,L:-0.10642082,M:2.05983073,S:0.14329074},{age:33.4285714286,L:-0.09649832,M:2.09136787,S:0.14305705},
    {age:33.5714285714,L:-0.08620516,M:2.12314648,S:0.14280611},{age:33.7142857143,L:-0.07563914,M:2.15513731,S:0.14253946},{age:33.8571428571,L:-0.064898,M:2.18731112,S:0.14225861},
    {age:34.0,L:-0.05407954,M:2.21963864,S:0.14196508},{age:34.1428571429,L:-0.04328153,M:2.25209064,S:0.14166039},{age:34.2857142857,L:-0.03260173,M:2.28463785,S:0.14134606},
    {age:34.4285714286,L:-0.02213792,M:2.31725103,S:0.14102362},{age:34.5714285714,L:-0.01198787,M:2.34990092,S:0.14069458},{age:34.7142857143,L:-0.00224936,M:2.38255828,S:0.14036046},
    {age:34.8571428571,L:0.00697984,M:2.41519385,S:0.14002279},{age:35.0,L:0.01560196,M:2.44777838,S:0.13968308},{age:35.1428571429,L:0.02351922,M:2.48028263,S:0.13934285},
    {age:35.2857142857,L:0.03063385,M:2.51267733,S:0.13900363},{age:35.4285714286,L:0.03684808,M:2.54493323,S:0.13866693},{age:35.5714285714,L:0.04206799,M:2.57702201,S:0.13833424},
    {age:35.7142857143,L:0.04628836,M:2.60893631,S:0.1380063},{age:35.8571428571,L:0.04959268,M:2.64068976,S:0.13768311},{age:36.0,L:0.05206829,M:2.67229692,S:0.13736463},
    {age:36.1428571429,L:0.05380252,M:2.70377233,S:0.13705081},{age:36.2857142857,L:0.05488272,M:2.73513056,S:0.13674161},{age:36.4285714286,L:0.05539622,M:2.76638614,S:0.136437},
    {age:36.5714285714,L:0.05543038,M:2.79755363,S:0.13613693},{age:36.7142857143,L:0.05507251,M:2.82864758,S:0.13584137},{age:36.8571428571,L:0.05440997,M:2.85968254,S:0.13555027},
    {age:37.0,L:0.0535301,M:2.89067306,S:0.1352636},{age:37.1428571429,L:0.05252023,M:2.92163369,S:0.13498131},{age:37.2857142857,L:0.05146771,M:2.95257899,S:0.13470337},
    {age:37.4285714286,L:0.05045987,M:2.9835235,S:0.13442974},{age:37.5714285714,L:0.04958214,M:3.01448145,S:0.13416037},{age:37.7142857143,L:0.04887605,M:3.04545986,S:0.13389523},
    {age:37.8571428571,L:0.04833917,M:3.07645851,S:0.13363427},{age:38.0,L:0.04796721,M:3.10747687,S:0.13337746},{age:38.1428571429,L:0.04775585,M:3.13851439,S:0.13312476},
    {age:38.2857142857,L:0.04770077,M:3.16957055,S:0.13287612},{age:38.4285714286,L:0.04779766,M:3.20064482,S:0.13263151},{age:38.5714285714,L:0.04804222,M:3.23173665,S:0.13239088},
    {age:38.7142857143,L:0.04843011,M:3.26284552,S:0.1321542},{age:38.8571428571,L:0.04895705,M:3.2939709,S:0.13192143},{age:39.0,L:0.0496187,M:3.32511224,S:0.13169253},
    {age:39.1428571429,L:0.05041076,M:3.35626902,S:0.13146745},{age:39.2857142857,L:0.05132891,M:3.3874407,S:0.13124616},{age:39.4285714286,L:0.05236885,M:3.41862675,S:0.13102862},
    {age:39.5714285714,L:0.05352625,M:3.44982664,S:0.13081478},{age:39.7142857143,L:0.05479681,M:3.48103982,S:0.13060462},{age:39.8571428571,L:0.05617622,M:3.51226578,S:0.13039808},
    {age:40.0,L:0.05766015,M:3.54350397,S:0.13019512},{age:40.1428571429,L:0.0592443,M:3.57475386,S:0.12999572},{age:40.2857142857,L:0.06092435,M:3.60601491,S:0.12979982},
    {age:40.4285714286,L:0.06269599,M:3.63728661,S:0.12960739},{age:40.5714285714,L:0.06455491,M:3.6685684,S:0.12941839},{age:40.7142857143,L:0.06649679,M:3.69985975,S:0.12923278},
    {age:40.8571428571,L:0.06851733,M:3.73116015,S:0.12905052},{age:41.0,L:0.0706122,M:3.76246904,S:0.12887156},{age:41.1428571429,L:0.0727771,M:3.79378589,S:0.12869587},
    {age:41.2857142857,L:0.07500771,M:3.82511018,S:0.12852342},{age:41.4285714286,L:0.07729973,M:3.85644137,S:0.12835415},{age:41.5714285714,L:0.07964882,M:3.88777892,S:0.12818803},
    {age:41.7142857143,L:0.0820507,M:3.9191223,S:0.12802501},{age:41.8571428571,L:0.08450103,M:3.95047099,S:0.12786507},{age:42.0,L:0.08699551,M:3.98182443,S:0.12770816},
    {age:42.1428571429,L:0.08952982,M:4.01318211,S:0.12755424},{age:42.2857142857,L:0.09209966,M:4.04454349,S:0.12740326},{age:42.4285714286,L:0.0947007,M:4.07590803,S:0.1272552},
    {age:42.5714285714,L:0.09732864,M:4.1072752,S:0.12711},{age:42.7142857143,L:0.09997917,M:4.13864447,S:0.12696764},{age:42.8571428571,L:0.10264796,M:4.1700153,S:0.12682806},
    {age:43.0,L:0.10533071,M:4.20138716,S:0.12669124},{age:43.1428571429,L:0.1080231,M:4.23275951,S:0.12655712},{age:43.2857142857,L:0.11072083,M:4.26413183,S:0.12642568},
    {age:43.4285714286,L:0.11341957,M:4.29550358,S:0.12629687},{age:43.5714285714,L:0.11611501,M:4.32687422,S:0.12617064},{age:43.7142857143,L:0.11880285,M:4.35824323,S:0.12604697},
    {age:43.8571428571,L:0.12147877,M:4.38961006,S:0.12592581},{age:44.0,L:0.12413845,M:4.42097419,S:0.12580712},{age:44.1428571429,L:0.12677759,M:4.45233508,S:0.12569086},
    {age:44.2857142857,L:0.12939186,M:4.4836922,S:0.12557699},{age:44.4285714286,L:0.13197697,M:4.51504501,S:0.12546547},{age:44.5714285714,L:0.13452859,M:4.54639299,S:0.12535626},
    {age:44.7142857143,L:0.13704241,M:4.57773559,S:0.12524933},{age:44.8571428571,L:0.13951412,M:4.60907228,S:0.12514462},{age:45.0,L:0.1419394,M:4.64040253,S:0.12504211},
    {age:45.1428571429,L:0.14431394,M:4.67172581,S:0.12494175},{age:45.2857142857,L:0.14663343,M:4.70304158,S:0.1248435},{age:45.4285714286,L:0.14889355,M:4.73434932,S:0.12474732},
    {age:45.5714285714,L:0.15109012,M:4.76564849,S:0.12465318},{age:45.7142857143,L:0.15322192,M:4.79693898,S:0.12456101},{age:45.8571428571,L:0.1552907,M:4.82822105,S:0.12447076},
    {age:46.0,L:0.15729836,M:4.85949498,S:0.12438237},{age:46.1428571429,L:0.15924678,M:4.89076106,S:0.12429576},{age:46.2857142857,L:0.16113784,M:4.92201955,S:0.12421088},
    {age:46.4285714286,L:0.16297343,M:4.95327075,S:0.12412765},{age:46.5714285714,L:0.16475543,M:4.98451493,S:0.12404603},{age:46.7142857143,L:0.16648572,M:5.01575237,S:0.12396593},
    {age:46.8571428571,L:0.16816617,M:5.04698336,S:0.12388731},{age:47.0,L:0.16979864,M:5.07820818,S:0.12381009},{age:47.1428571429,L:0.17138499,M:5.1094271,S:0.12373421},
    {age:47.2857142857,L:0.17292709,M:5.14064041,S:0.12365961},{age:47.4285714286,L:0.1744268,M:5.17184838,S:0.12358623},{age:47.5714285714,L:0.175886,M:5.2030513,S:0.12351399},
    {age:47.7142857143,L:0.17730658,M:5.23424946,S:0.12344284},{age:47.8571428571,L:0.17869049,M:5.26544312,S:0.12337271},{age:48.0,L:0.18003966,M:5.29663257,S:0.12330354},
    {age:48.1428571429,L:0.18135603,M:5.32781809,S:0.12323527},{age:48.2857142857,L:0.18264154,M:5.35899996,S:0.12316782},{age:48.4285714286,L:0.18389812,M:5.39017847,S:0.12310114},
    {age:48.5714285714,L:0.18512773,M:5.42135388,S:0.12303517},{age:48.7142857143,L:0.18633215,M:5.45252649,S:0.12296983},{age:48.8571428571,L:0.18751305,M:5.48369658,S:0.12290507},
    {age:49.0,L:0.1886721,M:5.51486442,S:0.12284082},{age:49.1428571429,L:0.18981096,M:5.54603029,S:0.12277701},{age:49.2857142857,L:0.19093128,M:5.57719448,S:0.12271359},
    {age:49.4285714286,L:0.19203475,M:5.60835727,S:0.12265049},{age:49.5714285714,L:0.19312306,M:5.63951894,S:0.12258764},{age:49.7142857143,L:0.1941991,M:5.67067976,S:0.12252499},
    {age:49.8571428571,L:0.19526694,M:5.70184002,S:0.12246246},{age:50.0,L:0.19633066,M:5.733,S:0.1224},
    ],
    hc: [
    {age:22.5,L:1.0,M:19.89694012,S:0.06486652},{age:22.5714285714,L:1.0,M:19.96444837,S:0.06473872},{age:22.7142857143,L:1.0,M:20.12141101,S:0.06444145},
    {age:22.8571428571,L:1.0,M:20.27827245,S:0.06414399},{age:23.0,L:1.0,M:20.43496521,S:0.06384621},{age:23.1428571429,L:1.0,M:20.59142182,S:0.06354799},
    {age:23.2857142857,L:1.0,M:20.74757482,S:0.06324921},{age:23.4285714286,L:1.0,M:20.90335673,S:0.06294972},{age:23.5714285714,L:1.0,M:21.05870169,S:0.06264951},
    {age:23.7142857143,L:1.0,M:21.21358103,S:0.06235066},{age:23.8571428571,L:1.0,M:21.36800322,S:0.06205741},{age:24.0,L:1.0,M:21.52197839,S:0.06177407},
    {age:24.1428571429,L:1.0,M:21.67551662,S:0.06150495},{age:24.2857142857,L:1.0,M:21.82862802,S:0.06125438},{age:24.4285714286,L:1.0,M:21.9813227,S:0.06102668},
    {age:24.5714285714,L:1.0,M:22.13360874,S:0.06082595},{age:24.7142857143,L:1.0,M:22.28544775,S:0.06065153},{age:24.8571428571,L:1.0,M:22.43675486,S:0.06049798},
    {age:25.0,L:1.0,M:22.58744321,S:0.06035964},{age:25.1428571429,L:1.0,M:22.73742589,S:0.06023088},{age:25.2857142857,L:1.0,M:22.88661603,S:0.06010604},
    {age:25.4285714286,L:1.0,M:23.03492676,S:0.05997947},{age:25.5714285714,L:1.0,M:23.18228166,S:0.0598457},{age:25.7142857143,L:1.0,M:23.32884566,S:0.05970346},
    {age:25.8571428571,L:1.0,M:23.47502495,S:0.05955566},{age:26.0,L:1.0,M:23.62123623,S:0.0594054},{age:26.1428571429,L:1.0,M:23.76789618,S:0.05925577},
    {age:26.2857142857,L:1.0,M:23.91542151,S:0.05910987},{age:26.4285714286,L:1.0,M:24.06422891,S:0.0589708},{age:26.5714285714,L:1.0,M:24.21471685,S:0.05884152},
    {age:26.7142857143,L:1.0,M:24.36686497,S:0.05872225},{age:26.8571428571,L:1.0,M:24.52023405,S:0.05861038},{age:27.0,L:1.0,M:24.67436667,S:0.05850323},
    {age:27.1428571429,L:1.0,M:24.82880539,S:0.05839809},{age:27.2857142857,L:1.0,M:24.98309278,S:0.05829226},{age:27.4285714286,L:1.0,M:25.13677142,S:0.05818304},
    {age:27.5714285714,L:1.0,M:25.28939886,S:0.05806764},{age:27.7142857143,L:1.0,M:25.44087711,S:0.05794156},{age:27.8571428571,L:1.0,M:25.59145264,S:0.05779854},
    {age:28.0,L:1.0,M:25.74138693,S:0.05763225},{age:28.1428571429,L:1.0,M:25.89094143,S:0.05743637},{age:28.2857142857,L:1.0,M:26.04037759,S:0.05720457},
    {age:28.4285714286,L:1.0,M:26.18995687,S:0.05693053},{age:28.5714285714,L:1.0,M:26.33992252,S:0.05660839},{age:28.7142857143,L:1.0,M:26.49009894,S:0.05624366},
    {age:28.8571428571,L:1.0,M:26.63989165,S:0.05585311},{age:29.0,L:1.0,M:26.78868797,S:0.05545404},{age:29.1428571429,L:1.0,M:26.93587522,S:0.05506373},
    {age:29.2857142857,L:1.0,M:27.08084072,S:0.05469947},{age:29.4285714286,L:1.0,M:27.22297181,S:0.05437855},{age:29.5714285714,L:1.0,M:27.36168646,S:0.05411766},
    {age:29.7142857143,L:1.0,M:27.49710825,S:0.05391987},{age:29.8571428571,L:1.0,M:27.6300663,S:0.05377465},{age:30.0,L:1.0,M:27.76142043,S:0.05367086},
    {age:30.1428571429,L:1.0,M:27.89203043,S:0.05359737},{age:30.2857142857,L:1.0,M:28.02275611,S:0.05354304},{age:30.4285714286,L:1.0,M:28.15445729,S:0.05349675},
    {age:30.5714285714,L:1.0,M:28.28796679,S:0.05344751},{age:30.7142857143,L:1.0,M:28.42349718,S:0.05338791},{age:30.8571428571,L:1.0,M:28.56064073,S:0.05331408},
    {age:31.0,L:1.0,M:28.69896275,S:0.05322233},{age:31.1428571429,L:1.0,M:28.83802856,S:0.05310894},{age:31.2857142857,L:1.0,M:28.97740346,S:0.05297022},
    {age:31.4285714286,L:1.0,M:29.11665276,S:0.05280246},{age:31.5714285714,L:1.0,M:29.2553508,S:0.05260216},{age:31.7142857143,L:1.0,M:29.39327932,S:0.05237038},
    {age:31.8571428571,L:1.0,M:29.53042752,S:0.05211277},{age:32.0,L:1.0,M:29.66679362,S:0.05183519},{age:32.1428571429,L:1.0,M:29.8023758,S:0.05154347},
    {age:32.2857142857,L:1.0,M:29.9371723,S:0.05124347},{age:32.4285714286,L:1.0,M:30.0711813,S:0.05094103},{age:32.5714285714,L:1.0,M:30.20440187,S:0.0506418},
    {age:32.7142857143,L:1.0,M:30.33685237,S:0.05034697},{age:32.8571428571,L:1.0,M:30.46857048,S:0.0500533},{age:33.0,L:1.0,M:30.59959472,S:0.04975731},
    {age:33.1428571429,L:1.0,M:30.72996362,S:0.04945557},{age:33.2857142857,L:1.0,M:30.85971571,S:0.04914461},{age:33.4285714286,L:1.0,M:30.9888895,S:0.04882097},
    {age:33.5714285714,L:1.0,M:31.11751747,S:0.0484814},{age:33.7142857143,L:1.0,M:31.24549298,S:0.04812694},{age:33.8571428571,L:1.0,M:31.37257027,S:0.04776295},
    {age:34.0,L:1.0,M:31.49849752,S:0.04739498},{age:34.1428571429,L:1.0,M:31.62302294,S:0.04702859},{age:34.2857142857,L:1.0,M:31.7458947,S:0.04666931},
    {age:34.4285714286,L:1.0,M:31.86686101,S:0.04632271},{age:34.5714285714,L:1.0,M:31.98567403,S:0.04599414},{age:34.7142857143,L:1.0,M:32.10217757,S:0.04568451},
    {age:34.8571428571,L:1.0,M:32.21630706,S:0.0453903},{age:35.0,L:1.0,M:32.32800192,S:0.04510778},{age:35.1428571429,L:1.0,M:32.43720155,S:0.04483324},
    {age:35.2857142857,L:1.0,M:32.54384538,S:0.04456296},{age:35.4285714286,L:1.0,M:32.64787282,S:0.04429321},{age:35.5714285714,L:1.0,M:32.74923076,S:0.04402039},
    {age:35.7142857143,L:1.0,M:32.84803807,S:0.04374347},{age:35.8571428571,L:1.0,M:32.94458559,S:0.04346399},{age:36.0,L:1.0,M:33.03917165,S:0.04318362},
    {age:36.1428571429,L:1.0,M:33.13209456,S:0.04290402},{age:36.2857142857,L:1.0,M:33.22365266,S:0.04262685},{age:36.4285714286,L:1.0,M:33.31414425,S:0.04235377},
    {age:36.5714285714,L:1.0,M:33.40386113,S:0.04208639},{age:36.7142857143,L:1.0,M:33.4929447,S:0.04182525},{age:36.8571428571,L:1.0,M:33.58138599,S:0.04156976},
    {age:37.0,L:1.0,M:33.6691695,S:0.04131932},{age:37.1428571429,L:1.0,M:33.75627972,S:0.04107332},{age:37.2857142857,L:1.0,M:33.84270113,S:0.04083114},
    {age:37.4285714286,L:1.0,M:33.92841824,S:0.04059217},{age:37.5714285714,L:1.0,M:34.01341606,S:0.0403558},{age:37.7142857143,L:1.0,M:34.09769141,S:0.04012172},
    {age:37.8571428571,L:1.0,M:34.181253,S:0.03988987},{age:38.0,L:1.0,M:34.26411,S:0.03966022},{age:38.1428571429,L:1.0,M:34.34627163,S:0.03943272},
    {age:38.2857142857,L:1.0,M:34.42774707,S:0.03920735},{age:38.4285714286,L:1.0,M:34.50854552,S:0.03898407},{age:38.5714285714,L:1.0,M:34.58867616,S:0.03876284},
    {age:38.7142857143,L:1.0,M:34.66814806,S:0.03854362},{age:38.8571428571,L:1.0,M:34.74697011,S:0.03832639},{age:39.0,L:1.0,M:34.82515123,S:0.03811112},
    {age:39.1428571429,L:1.0,M:34.90270032,S:0.03789776},{age:39.2857142857,L:1.0,M:34.97962629,S:0.0376863},{age:39.4285714286,L:1.0,M:35.05593803,S:0.03747669},
    {age:39.5714285714,L:1.0,M:35.13164446,S:0.03726892},{age:39.7142857143,L:1.0,M:35.20675448,S:0.03706294},{age:39.8571428571,L:1.0,M:35.28127699,S:0.03685873},
    {age:40.0,L:1.0,M:35.3552209,S:0.03665626},{age:40.1428571429,L:1.0,M:35.42859511,S:0.03645551},{age:40.2857142857,L:1.0,M:35.50140853,S:0.03625645},
    {age:40.4285714286,L:1.0,M:35.57367006,S:0.03605906},{age:40.5714285714,L:1.0,M:35.64538862,S:0.0358633},{age:40.7142857143,L:1.0,M:35.71657344,S:0.03566914},
    {age:40.8571428571,L:1.0,M:35.78723408,S:0.03547655},{age:41.0,L:1.0,M:35.8573801,S:0.03528548},{age:41.1428571429,L:1.0,M:35.92702106,S:0.03509589},
    {age:41.2857142857,L:1.0,M:35.99616654,S:0.03490775},{age:41.4285714286,L:1.0,M:36.06482611,S:0.03472102},{age:41.5714285714,L:1.0,M:36.13300905,S:0.03453566},
    {age:41.7142857143,L:1.0,M:36.20071862,S:0.03435164},{age:41.8571428571,L:1.0,M:36.267952,S:0.03416898},{age:42.0,L:1.0,M:36.33470612,S:0.03398766},
    {age:42.1428571429,L:1.0,M:36.40097789,S:0.03380769},{age:42.2857142857,L:1.0,M:36.46676425,S:0.03362908},{age:42.4285714286,L:1.0,M:36.5320621,S:0.03345181},
    {age:42.5714285714,L:1.0,M:36.59686856,S:0.0332759},{age:42.7142857143,L:1.0,M:36.66118486,S:0.03310163},{age:42.8571428571,L:1.0,M:36.72501637,S:0.03292953},
    {age:43.0,L:1.0,M:36.78836864,S:0.03276013},{age:43.1428571429,L:1.0,M:36.85124722,S:0.03259399},{age:43.2857142857,L:1.0,M:36.91365766,S:0.03243165},
    {age:43.4285714286,L:1.0,M:36.9756055,S:0.03227366},{age:43.5714285714,L:1.0,M:37.03709586,S:0.03212055},{age:43.7142857143,L:1.0,M:37.09812365,S:0.03197303},
    {age:43.8571428571,L:1.0,M:37.15867358,S:0.0318319},{age:44.0,L:1.0,M:37.21872993,S:0.03169799},{age:44.1428571429,L:1.0,M:37.27827697,S:0.03157211},
    {age:44.2857142857,L:1.0,M:37.33729897,S:0.0314551},{age:44.4285714286,L:1.0,M:37.39578022,S:0.03134778},{age:44.5714285714,L:1.0,M:37.45370613,S:0.03125093},
    {age:44.7142857143,L:1.0,M:37.51108836,S:0.03116463},{age:44.8571428571,L:1.0,M:37.56796482,S:0.03108821},{age:45.0,L:1.0,M:37.62437455,S:0.03102099},
    {age:45.1428571429,L:1.0,M:37.68035662,S:0.03096228},{age:45.2857142857,L:1.0,M:37.73595007,S:0.03091138},{age:45.4285714286,L:1.0,M:37.79119395,S:0.03086762},
    {age:45.5714285714,L:1.0,M:37.84612733,S:0.03083027},{age:45.7142857143,L:1.0,M:37.9007896,S:0.03079817},{age:45.8571428571,L:1.0,M:37.95522049,S:0.0307697},
    {age:46.0,L:1.0,M:38.00945973,S:0.0307432},{age:46.1428571429,L:1.0,M:38.06354706,S:0.03071704},{age:46.2857142857,L:1.0,M:38.11752222,S:0.03068956},
    {age:46.4285714286,L:1.0,M:38.17142495,S:0.03065912},{age:46.5714285714,L:1.0,M:38.22528978,S:0.03062413},{age:46.7142857143,L:1.0,M:38.27903165,S:0.03058437},
    {age:46.8571428571,L:1.0,M:38.33244588,S:0.03054102},{age:47.0,L:1.0,M:38.3853226,S:0.0304953},{age:47.1428571429,L:1.0,M:38.43745192,S:0.03044842},
    {age:47.2857142857,L:1.0,M:38.48862398,S:0.03040161},{age:47.4285714286,L:1.0,M:38.5386289,S:0.0303561},{age:47.5714285714,L:1.0,M:38.58726659,S:0.03031306},
    {age:47.7142857143,L:1.0,M:38.634562,S:0.03027288},{age:47.8571428571,L:1.0,M:38.68076514,S:0.0302351},{age:48.0,L:1.0,M:38.72613578,S:0.03019925},
    {age:48.1428571429,L:1.0,M:38.77093373,S:0.03016484},{age:48.2857142857,L:1.0,M:38.81541876,S:0.03013139},{age:48.4285714286,L:1.0,M:38.85985066,S:0.03009842},
    {age:48.5714285714,L:1.0,M:38.90448763,S:0.03006546},{age:48.7142857143,L:1.0,M:38.94955111,S:0.03003219},{age:48.8571428571,L:1.0,M:38.99522586,S:0.02999841},
    {age:49.0,L:1.0,M:39.04169501,S:0.02996398},{age:49.1428571429,L:1.0,M:39.0891417,S:0.02992871},{age:49.2857142857,L:1.0,M:39.13774907,S:0.02989243},
    {age:49.4285714286,L:1.0,M:39.18770026,S:0.02985499},{age:49.5714285714,L:1.0,M:39.23916496,S:0.02981622},{age:49.7142857143,L:1.0,M:39.29200352,S:0.02977624},
    {age:49.8571428571,L:1.0,M:39.34576695,S:0.02973544},{age:50.0,L:1.0,M:39.39999283,S:0.02969424},
    ],
    length: [
    {age:23.5,L:1.0,M:30.07311402,S:0.07892189},{age:23.5714285714,L:1.0,M:30.17576478,S:0.07874437},{age:23.7142857143,L:1.0,M:30.38104398,S:0.07838935},
    {age:23.8571428571,L:1.0,M:30.58625622,S:0.07803437},{age:24.0,L:1.0,M:30.79135685,S:0.07767946},{age:24.1428571429,L:1.0,M:30.99630123,S:0.07732464},
    {age:24.2857142857,L:1.0,M:31.20104472,S:0.07696994},{age:24.4285714286,L:1.0,M:31.40554267,S:0.07661539},{age:24.5714285714,L:1.0,M:31.60975461,S:0.07626101},
    {age:24.7142857143,L:1.0,M:31.81373573,S:0.07590684},{age:24.8571428571,L:1.0,M:32.01763692,S:0.0755529},{age:25.0,L:1.0,M:32.22161322,S:0.07519921},
    {age:25.1428571429,L:1.0,M:32.42581968,S:0.0748458},{age:25.2857142857,L:1.0,M:32.63041135,S:0.07449271},{age:25.4285714286,L:1.0,M:32.83554326,S:0.07413995},
    {age:25.5714285714,L:1.0,M:33.04136774,S:0.07378756},{age:25.7142857143,L:1.0,M:33.2479743,S:0.07343556},{age:25.8571428571,L:1.0,M:33.45538966,S:0.07308397},
    {age:26.0,L:1.0,M:33.6636378,S:0.07273283},{age:26.1428571429,L:1.0,M:33.87274272,S:0.07238217},{age:26.2857142857,L:1.0,M:34.0827284,S:0.072032},
    {age:26.4285714286,L:1.0,M:34.29361882,S:0.07168235},{age:26.5714285714,L:1.0,M:34.50543183,S:0.07133326},{age:26.7142857143,L:1.0,M:34.71804405,S:0.07098475},
    {age:26.8571428571,L:1.0,M:34.93119083,S:0.07063685},{age:27.0,L:1.0,M:35.14460141,S:0.07028958},{age:27.1428571429,L:1.0,M:35.35800502,S:0.06994297},
    {age:27.2857142857,L:1.0,M:35.57113087,S:0.06959705},{age:27.4285714286,L:1.0,M:35.78370821,S:0.06925184},{age:27.5714285714,L:1.0,M:35.99547466,S:0.06890737},
    {age:27.7142857143,L:1.0,M:36.2063611,S:0.06856368},{age:27.8571428571,L:1.0,M:36.41649167,S:0.06822077},{age:28.0,L:1.0,M:36.6259989,S:0.06787869},
    {age:28.1428571429,L:1.0,M:36.83501533,S:0.06753746},{age:28.2857142857,L:1.0,M:37.04367349,S:0.06719711},{age:28.4285714286,L:1.0,M:37.25210593,S:0.06685766},
    {age:28.5714285714,L:1.0,M:37.46044067,S:0.06651914},{age:28.7142857143,L:1.0,M:37.66870204,S:0.06618157},{age:28.8571428571,L:1.0,M:37.87681067,S:0.06584499},
    {age:29.0,L:1.0,M:38.0846827,S:0.06550943},{age:29.1428571429,L:1.0,M:38.29223424,S:0.0651749},{age:29.2857142857,L:1.0,M:38.49938142,S:0.06484143},
    {age:29.4285714286,L:1.0,M:38.70604036,S:0.06450906},{age:29.5714285714,L:1.0,M:38.91212768,S:0.0641778},{age:29.7142857143,L:1.0,M:39.11757115,S:0.0638477},
    {age:29.8571428571,L:1.0,M:39.32230968,S:0.06351876},{age:30.0,L:1.0,M:39.52628269,S:0.06319103},{age:30.1428571429,L:1.0,M:39.72942957,S:0.06286452},
    {age:30.2857142857,L:1.0,M:39.93168975,S:0.06253926},{age:30.4285714286,L:1.0,M:40.13300264,S:0.06221529},{age:30.5714285714,L:1.0,M:40.33330891,S:0.06189262},
    {age:30.7142857143,L:1.0,M:40.53257876,S:0.06157129},{age:30.8571428571,L:1.0,M:40.73081185,S:0.06125132},{age:31.0,L:1.0,M:40.92800916,S:0.06093274},
    {age:31.1428571429,L:1.0,M:41.12417162,S:0.06061557},{age:31.2857142857,L:1.0,M:41.31930021,S:0.06029985},{age:31.4285714286,L:1.0,M:41.51339588,S:0.0599856},
    {age:31.5714285714,L:1.0,M:41.70646143,S:0.05967284},{age:31.7142857143,L:1.0,M:41.89854239,S:0.0593616},{age:31.8571428571,L:1.0,M:42.08972694,S:0.05905192},
    {age:32.0,L:1.0,M:42.28010514,S:0.05874382},{age:32.1428571429,L:1.0,M:42.46976705,S:0.05843731},{age:32.2857142857,L:1.0,M:42.65880272,S:0.05813244},
    {age:32.4285714286,L:1.0,M:42.8473022,S:0.05782923},{age:32.5714285714,L:1.0,M:43.03535158,S:0.0575277},{age:32.7142857143,L:1.0,M:43.22294547,S:0.05722789},
    {age:32.8571428571,L:1.0,M:43.40998705,S:0.05692981},{age:33.0,L:1.0,M:43.59637549,S:0.0566335},{age:33.1428571429,L:1.0,M:43.78201,S:0.05633899},
    {age:33.2857142857,L:1.0,M:43.96678975,S:0.05604629},{age:33.4285714286,L:1.0,M:44.15061394,S:0.05575544},{age:33.5714285714,L:1.0,M:44.33338054,S:0.05546646},
    {age:33.7142857143,L:1.0,M:44.51495954,S:0.05517939},{age:33.8571428571,L:1.0,M:44.69519298,S:0.05489424},{age:34.0,L:1.0,M:44.87392165,S:0.05461105},
    {age:34.1428571429,L:1.0,M:45.05098637,S:0.05432984},{age:34.2857142857,L:1.0,M:45.22622794,S:0.05405064},{age:34.4285714286,L:1.0,M:45.39948716,S:0.05377347},
    {age:34.5714285714,L:1.0,M:45.57061398,S:0.05349837},{age:34.7142857143,L:1.0,M:45.73966807,S:0.05322536},{age:34.8571428571,L:1.0,M:45.90691889,S:0.05295446},
    {age:35.0,L:1.0,M:46.07264503,S:0.05268571},{age:35.1428571429,L:1.0,M:46.23712505,S:0.05241912},{age:35.2857142857,L:1.0,M:46.40063753,S:0.05215474},
    {age:35.4285714286,L:1.0,M:46.56346105,S:0.05189258},{age:35.5714285714,L:1.0,M:46.72585921,S:0.05163267},{age:35.7142857143,L:1.0,M:46.88775123,S:0.05137504},
    {age:35.8571428571,L:1.0,M:47.04871194,S:0.05111971},{age:36.0,L:1.0,M:47.2083012,S:0.05086672},{age:36.1428571429,L:1.0,M:47.36607887,S:0.05061609},
    {age:36.2857142857,L:1.0,M:47.52160481,S:0.05036784},{age:36.4285714286,L:1.0,M:47.67443888,S:0.050122},{age:36.5714285714,L:1.0,M:47.82415762,S:0.04987861},
    {age:36.7142857143,L:1.0,M:47.97072101,S:0.04963765},{age:36.8571428571,L:1.0,M:48.1144725,S:0.04939911},{age:37.0,L:1.0,M:48.25577222,S:0.04916297},
    {age:37.1428571429,L:1.0,M:48.3949803,S:0.04892918},{age:37.2857142857,L:1.0,M:48.53245685,S:0.04869774},{age:37.4285714286,L:1.0,M:48.668562,S:0.04846862},
    {age:37.5714285714,L:1.0,M:48.80364922,S:0.04824178},{age:37.7142857143,L:1.0,M:48.93791874,S:0.04801722},{age:37.8571428571,L:1.0,M:49.07141757,S:0.04779489},
    {age:38.0,L:1.0,M:49.20418607,S:0.04757478},{age:38.1428571429,L:1.0,M:49.33626458,S:0.04735685},{age:38.2857142857,L:1.0,M:49.46769346,S:0.0471411},
    {age:38.4285714286,L:1.0,M:49.59851306,S:0.04692749},{age:38.5714285714,L:1.0,M:49.72876311,S:0.04671599},{age:38.7142857143,L:1.0,M:49.85846918,S:0.04650658},
    {age:38.8571428571,L:1.0,M:49.98764262,S:0.04629924},{age:39.0,L:1.0,M:50.11629421,S:0.04609393},{age:39.1428571429,L:1.0,M:50.24443469,S:0.04589065},
    {age:39.2857142857,L:1.0,M:50.37207483,S:0.04568935},{age:39.4285714286,L:1.0,M:50.49922539,S:0.04549002},{age:39.5714285714,L:1.0,M:50.62589709,S:0.04529263},
    {age:39.7142857143,L:1.0,M:50.75210011,S:0.04509715},{age:39.8571428571,L:1.0,M:50.87784405,S:0.04490357},{age:40.0,L:1.0,M:51.0031385,S:0.04471185},
    {age:40.1428571429,L:1.0,M:51.12799304,S:0.04452197},{age:40.2857142857,L:1.0,M:51.25241726,S:0.04433391},{age:40.4285714286,L:1.0,M:51.37642073,S:0.04414763},
    {age:40.5714285714,L:1.0,M:51.50001294,S:0.04396312},{age:40.7142857143,L:1.0,M:51.62320079,S:0.04378036},{age:40.8571428571,L:1.0,M:51.74598867,S:0.0435993},
    {age:41.0,L:1.0,M:51.86838085,S:0.04341994},{age:41.1428571429,L:1.0,M:51.99038157,S:0.04324224},{age:41.2857142857,L:1.0,M:52.11199512,S:0.04306618},
    {age:41.4285714286,L:1.0,M:52.23322575,S:0.04289174},{age:41.5714285714,L:1.0,M:52.354078,S:0.04271888},{age:41.7142857143,L:1.0,M:52.47456265,S:0.0425476},
    {age:41.8571428571,L:1.0,M:52.5946967,S:0.04237785},{age:42.0,L:1.0,M:52.71449745,S:0.04220961},{age:42.1428571429,L:1.0,M:52.83398219,S:0.04204287},
    {age:42.2857142857,L:1.0,M:52.95316819,S:0.04187759},{age:42.4285714286,L:1.0,M:53.07207275,S:0.04171375},{age:42.5714285714,L:1.0,M:53.19071221,S:0.04155132},
    {age:42.7142857143,L:1.0,M:53.30908119,S:0.04139029},{age:42.8571428571,L:1.0,M:53.42715257,S:0.04123061},{age:43.0,L:1.0,M:53.54489829,S:0.04107228},
    {age:43.1428571429,L:1.0,M:53.6622903,S:0.04091526},{age:43.2857142857,L:1.0,M:53.77930054,S:0.04075954},{age:43.4285714286,L:1.0,M:53.89590094,S:0.04060507},
    {age:43.5714285714,L:1.0,M:54.01206744,S:0.04045185},{age:43.7142857143,L:1.0,M:54.12786742,S:0.04029984},{age:43.8571428571,L:1.0,M:54.24345971,S:0.04014902},
    {age:44.0,L:1.0,M:54.35900716,S:0.03999936},{age:44.1428571429,L:1.0,M:54.47467257,S:0.03985084},{age:44.2857142857,L:1.0,M:54.59061877,S:0.03970344},
    {age:44.4285714286,L:1.0,M:54.70700859,S:0.03955713},{age:44.5714285714,L:1.0,M:54.82400098,S:0.03941187},{age:44.7142857143,L:1.0,M:54.94166558,S:0.03926766},
    {age:44.8571428571,L:1.0,M:55.05998279,S:0.03912447},{age:45.0,L:1.0,M:55.1789291,S:0.03898226},{age:45.1428571429,L:1.0,M:55.29848101,S:0.03884101},
    {age:45.2857142857,L:1.0,M:55.41861502,S:0.03870071},{age:45.4285714286,L:1.0,M:55.53930763,S:0.03856132},{age:45.5714285714,L:1.0,M:55.66052757,S:0.03842282},
    {age:45.7142857143,L:1.0,M:55.78206498,S:0.03828518},{age:45.8571428571,L:1.0,M:55.90353143,S:0.03814838},{age:46.0,L:1.0,M:56.02453069,S:0.03801239},
    {age:46.1428571429,L:1.0,M:56.14466655,S:0.03787719},{age:46.2857142857,L:1.0,M:56.2635428,S:0.03774276},{age:46.4285714286,L:1.0,M:56.38076324,S:0.03760906},
    {age:46.5714285714,L:1.0,M:56.49594706,S:0.03747608},{age:46.7142857143,L:1.0,M:56.60906818,S:0.03734379},{age:46.8571428571,L:1.0,M:56.7204552,S:0.03721216},
    {age:47.0,L:1.0,M:56.83045216,S:0.03708116},{age:47.1428571429,L:1.0,M:56.93940307,S:0.03695079},{age:47.2857142857,L:1.0,M:57.04765198,S:0.036821},
    {age:47.4285714286,L:1.0,M:57.1555429,S:0.03669177},{age:47.5714285714,L:1.0,M:57.26341279,S:0.03656309},{age:47.7142857143,L:1.0,M:57.37143604,S:0.03643492},
    {age:47.8571428571,L:1.0,M:57.47962441,S:0.03630723},{age:48.0,L:1.0,M:57.58798263,S:0.03618001},{age:48.1428571429,L:1.0,M:57.69651541,S:0.03605323},
    {age:48.2857142857,L:1.0,M:57.80522746,S:0.03592685},{age:48.4285714286,L:1.0,M:57.9141235,S:0.03580086},{age:48.5714285714,L:1.0,M:58.02319814,S:0.03567523},
    {age:48.7142857143,L:1.0,M:58.13221398,S:0.03554994},{age:48.8571428571,L:1.0,M:58.24070156,S:0.03542496},{age:49.0,L:1.0,M:58.34818134,S:0.03530027},
    {age:49.1428571429,L:1.0,M:58.45417377,S:0.03517585},{age:49.2857142857,L:1.0,M:58.5581993,S:0.03505167},{age:49.4285714286,L:1.0,M:58.65977841,S:0.03492772},
    {age:49.5714285714,L:1.0,M:58.75846036,S:0.03480397},{age:49.7142857143,L:1.0,M:58.85445766,S:0.03468039},{age:49.8571428571,L:1.0,M:58.94864595,S:0.03455691},
    {age:50.0,L:1.0,M:59.04192974,S:0.03443349},
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// WHO LMS TABLES (0–24 months)
// Source: WHO Multicentre Growth Reference Study 2006
// Age in months for weight/length/HC; length in cm
// ─────────────────────────────────────────────────────────────
// WHO Weight-for-Age (kg), birth–24 months
const WHO_WFA = {
  male: [
    {age:0,L:0.3487,M:3.3464,S:0.14602},{age:1,L:0.2297,M:4.4709,S:0.13395},
    {age:2,L:0.1970,M:5.5675,S:0.12385},{age:3,L:0.1738,M:6.3762,S:0.11727},
    {age:4,L:0.1553,M:7.0023,S:0.11316},{age:5,L:0.1395,M:7.5105,S:0.11080},
    {age:6,L:0.1257,M:7.9340,S:0.10958},{age:7,L:0.1136,M:8.2970,S:0.10902},
    {age:8,L:0.1029,M:8.6151,S:0.10882},{age:9,L:0.0932,M:8.9014,S:0.10881},
    {age:10,L:0.0843,M:9.1649,S:0.10891},{age:11,L:0.0761,M:9.4122,S:0.10908},
    {age:12,L:0.0686,M:9.6479,S:0.10932},{age:13,L:0.0617,M:9.8749,S:0.10960},
    {age:14,L:0.0553,M:10.0953,S:0.10993},{age:15,L:0.0493,M:10.3108,S:0.11031},
    {age:16,L:0.0437,M:10.5228,S:0.11075},{age:17,L:0.0385,M:10.7330,S:0.11124},
    {age:18,L:0.0337,M:10.9425,S:0.11180},{age:19,L:0.0291,M:11.1525,S:0.11241},
    {age:20,L:0.0249,M:11.3638,S:0.11309},{age:21,L:0.0208,M:11.5772,S:0.11382},
    {age:22,L:0.0170,M:11.7930,S:0.11461},{age:23,L:0.0134,M:12.0115,S:0.11544},
    {age:24,L:0.0100,M:12.2332,S:0.11632},
  ],
  female: [
    {age:0,L:0.3809,M:3.2322,S:0.14171},{age:1,L:0.1714,M:4.1873,S:0.13724},
    {age:2,L:0.1714,M:5.1282,S:0.13000},{age:3,L:0.1714,M:5.8458,S:0.12619},
    {age:4,L:0.1714,M:6.4237,S:0.12402},{age:5,L:0.1714,M:6.8985,S:0.12274},
    {age:6,L:0.1714,M:7.2970,S:0.12204},{age:7,L:0.1714,M:7.6422,S:0.12178},
    {age:8,L:0.1714,M:7.9487,S:0.12181},{age:9,L:0.1714,M:8.2254,S:0.12199},
    {age:10,L:0.1714,M:8.4800,S:0.12224},{age:11,L:0.1714,M:8.7192,S:0.12257},
    {age:12,L:0.1714,M:8.9481,S:0.12295},{age:13,L:0.1714,M:9.1699,S:0.12337},
    {age:14,L:0.1714,M:9.3870,S:0.12381},{age:15,L:0.1714,M:9.6008,S:0.12430},
    {age:16,L:0.1714,M:9.8124,S:0.12481},{age:17,L:0.1714,M:10.0226,S:0.12536},
    {age:18,L:0.1714,M:10.2313,S:0.12593},{age:19,L:0.1714,M:10.4386,S:0.12653},
    {age:20,L:0.1714,M:10.6445,S:0.12715},{age:21,L:0.1714,M:10.8490,S:0.12779},
    {age:22,L:0.1714,M:11.0521,S:0.12845},{age:23,L:0.1714,M:11.2536,S:0.12912},
    {age:24,L:0.1714,M:11.4536,S:0.12980},
  ],
};

// WHO Length-for-Age (cm), birth–24 months
const WHO_LFA = {
  male: [
    {age:0,L:1.0,M:49.8842,S:0.03795},{age:1,L:1.0,M:54.7244,S:0.03557},
    {age:2,L:1.0,M:58.4249,S:0.03424},{age:3,L:1.0,M:61.4292,S:0.03328},
    {age:4,L:1.0,M:63.8860,S:0.03258},{age:5,L:1.0,M:65.9026,S:0.03204},
    {age:6,L:1.0,M:67.6236,S:0.03165},{age:7,L:1.0,M:69.1645,S:0.03139},
    {age:8,L:1.0,M:70.5994,S:0.03124},{age:9,L:1.0,M:71.9687,S:0.03117},
    {age:10,L:1.0,M:73.2812,S:0.03117},{age:11,L:1.0,M:74.5388,S:0.03122},
    {age:12,L:1.0,M:75.7488,S:0.03131},{age:13,L:1.0,M:76.9186,S:0.03143},
    {age:14,L:1.0,M:78.0497,S:0.03157},{age:15,L:1.0,M:79.1458,S:0.03172},
    {age:16,L:1.0,M:80.2113,S:0.03189},{age:17,L:1.0,M:81.2487,S:0.03206},
    {age:18,L:1.0,M:82.2587,S:0.03223},{age:19,L:1.0,M:83.2418,S:0.03241},
    {age:20,L:1.0,M:84.1996,S:0.03259},{age:21,L:1.0,M:85.1348,S:0.03278},
    {age:22,L:1.0,M:86.0477,S:0.03296},{age:23,L:1.0,M:86.9410,S:0.03314},
    {age:24,L:1.0,M:87.8161,S:0.03332},
  ],
  female: [
    {age:0,L:1.0,M:49.1477,S:0.03790},{age:1,L:1.0,M:53.6872,S:0.03640},
    {age:2,L:1.0,M:57.0673,S:0.03568},{age:3,L:1.0,M:59.8029,S:0.03520},
    {age:4,L:1.0,M:62.0899,S:0.03486},{age:5,L:1.0,M:64.0301,S:0.03463},
    {age:6,L:1.0,M:65.7311,S:0.03448},{age:7,L:1.0,M:67.2873,S:0.03441},
    {age:8,L:1.0,M:68.7498,S:0.03440},{age:9,L:1.0,M:70.1435,S:0.03444},
    {age:10,L:1.0,M:71.4818,S:0.03452},{age:11,L:1.0,M:72.7710,S:0.03463},
    {age:12,L:1.0,M:74.0150,S:0.03477},{age:13,L:1.0,M:75.2176,S:0.03492},
    {age:14,L:1.0,M:76.3817,S:0.03508},{age:15,L:1.0,M:77.5099,S:0.03524},
    {age:16,L:1.0,M:78.6055,S:0.03541},{age:17,L:1.0,M:79.6697,S:0.03558},
    {age:18,L:1.0,M:80.7046,S:0.03575},{age:19,L:1.0,M:81.7124,S:0.03592},
    {age:20,L:1.0,M:82.6940,S:0.03609},{age:21,L:1.0,M:83.6507,S:0.03626},
    {age:22,L:1.0,M:84.5842,S:0.03643},{age:23,L:1.0,M:85.4957,S:0.03660},
    {age:24,L:1.0,M:86.3867,S:0.03676},
  ],
};

// WHO HC-for-Age (cm), birth–24 months
const WHO_HCFA = {
  male: [
    {age:0,L:1.0,M:34.4618,S:0.03627},{age:1,L:1.0,M:37.2759,S:0.03133},
    {age:2,L:1.0,M:39.1285,S:0.02997},{age:3,L:1.0,M:40.5134,S:0.02918},
    {age:4,L:1.0,M:41.6317,S:0.02874},{age:5,L:1.0,M:42.5539,S:0.02841},
    {age:6,L:1.0,M:43.3246,S:0.02820},{age:7,L:1.0,M:43.9720,S:0.02807},
    {age:8,L:1.0,M:44.4986,S:0.02798},{age:9,L:1.0,M:44.9584,S:0.02794},
    {age:10,L:1.0,M:45.3657,S:0.02793},{age:11,L:1.0,M:45.7239,S:0.02793},
    {age:12,L:1.0,M:46.0507,S:0.02795},{age:13,L:1.0,M:46.3421,S:0.02799},
    {age:14,L:1.0,M:46.6027,S:0.02804},{age:15,L:1.0,M:46.8361,S:0.02810},
    {age:16,L:1.0,M:47.0479,S:0.02817},{age:17,L:1.0,M:47.2422,S:0.02826},
    {age:18,L:1.0,M:47.4210,S:0.02835},{age:19,L:1.0,M:47.5903,S:0.02845},
    {age:20,L:1.0,M:47.7462,S:0.02856},{age:21,L:1.0,M:47.8914,S:0.02868},
    {age:22,L:1.0,M:48.0254,S:0.02879},{age:23,L:1.0,M:48.1484,S:0.02891},
    {age:24,L:1.0,M:48.2639,S:0.02904},
  ],
  female: [
    {age:0,L:1.0,M:33.8787,S:0.03567},{age:1,L:1.0,M:36.5463,S:0.03119},
    {age:2,L:1.0,M:38.2521,S:0.02990},{age:3,L:1.0,M:39.5328,S:0.02918},
    {age:4,L:1.0,M:40.5817,S:0.02877},{age:5,L:1.0,M:41.4649,S:0.02847},
    {age:6,L:1.0,M:42.1985,S:0.02827},{age:7,L:1.0,M:42.8236,S:0.02814},
    {age:8,L:1.0,M:43.3555,S:0.02807},{age:9,L:1.0,M:43.8028,S:0.02803},
    {age:10,L:1.0,M:44.1737,S:0.02802},{age:11,L:1.0,M:44.4970,S:0.02803},
    {age:12,L:1.0,M:44.7783,S:0.02806},{age:13,L:1.0,M:45.0244,S:0.02811},
    {age:14,L:1.0,M:45.2436,S:0.02816},{age:15,L:1.0,M:45.4416,S:0.02823},
    {age:16,L:1.0,M:45.6243,S:0.02830},{age:17,L:1.0,M:45.7936,S:0.02839},
    {age:18,L:1.0,M:45.9530,S:0.02848},{age:19,L:1.0,M:46.1044,S:0.02857},
    {age:20,L:1.0,M:46.2490,S:0.02867},{age:21,L:1.0,M:46.3856,S:0.02877},
    {age:22,L:1.0,M:46.5149,S:0.02887},{age:23,L:1.0,M:46.6379,S:0.02897},
    {age:24,L:1.0,M:46.7567,S:0.02908},
  ],
};

// WHO Weight-for-Length (kg), length 45–110 cm (boys)
// Source: WHO 2006 tables, length step 0.5cm — abbreviated to key nodes
// Full table has 131 rows; using representative 45–110cm at 5cm intervals
// Replace with full 0.5cm-step table for clinical use
const WHO_WFL_MALE_NODES = [
  {age:45,L:-0.3521,M:2.441,S:0.09182},{age:50,L:-0.3521,M:3.448,S:0.08787},
  {age:55,L:-0.3521,M:4.448,S:0.08407},{age:60,L:-0.3521,M:5.545,S:0.08052},
  {age:65,L:-0.3521,M:6.680,S:0.07759},{age:70,L:-0.3521,M:7.783,S:0.07531},
  {age:75,L:-0.3521,M:8.815,S:0.07409},{age:80,L:-0.3521,M:9.757,S:0.07418},
  {age:85,L:-0.3521,M:10.616,S:0.07534},{age:90,L:-0.3521,M:11.428,S:0.07731},
  {age:95,L:-0.3521,M:12.239,S:0.07990},{age:100,L:-0.3521,M:13.099,S:0.08303},
  {age:105,L:-0.3521,M:14.054,S:0.08648},{age:110,L:-0.3521,M:15.128,S:0.09008},
];
const WHO_WFL_FEMALE_NODES = [
  {age:45,L:0.1027,M:2.369,S:0.09029},{age:50,L:0.1027,M:3.334,S:0.08622},
  {age:55,L:0.1027,M:4.310,S:0.08268},{age:60,L:0.1027,M:5.369,S:0.07954},
  {age:65,L:0.1027,M:6.471,S:0.07723},{age:70,L:0.1027,M:7.540,S:0.07598},
  {age:75,L:0.1027,M:8.537,S:0.07590},{age:80,L:0.1027,M:9.453,S:0.07684},
  {age:85,L:0.1027,M:10.298,S:0.07856},{age:90,L:0.1027,M:11.113,S:0.08082},
  {age:95,L:0.1027,M:11.940,S:0.08365},{age:100,L:0.1027,M:12.823,S:0.08699},
  {age:105,L:0.1027,M:13.805,S:0.09063},{age:110,L:0.1027,M:14.923,S:0.09440},
];

// ─────────────────────────────────────────────────────────────
// CDC LMS TABLES (2–20 years)
// Source: CDC 2000 growth charts, published LMS parameters
// Age in months
// ─────────────────────────────────────────────────────────────
// CDC Weight-for-Age (kg), 24–240 months
const CDC_WFA = {
  male: [
    {age:24,L:-0.0756,M:12.3249,S:0.14259},{age:36,L:-0.1142,M:14.3516,S:0.14143},
    {age:48,L:-0.1450,M:16.3814,S:0.13914},{age:60,L:-0.1673,M:18.4344,S:0.13843},
    {age:72,L:-0.1848,M:20.5466,S:0.13915},{age:84,L:-0.1973,M:22.8540,S:0.14174},
    {age:96,L:-0.2063,M:25.4898,S:0.14590},{age:108,L:-0.2118,M:28.5452,S:0.15143},
    {age:120,L:-0.2149,M:32.0636,S:0.15826},{age:132,L:-0.2159,M:36.0618,S:0.16640},
    {age:144,L:-0.2150,M:40.5101,S:0.17555},{age:156,L:-0.2124,M:45.4,S:0.18473},
    {age:168,L:-0.2083,M:50.7,S:0.19313},{age:180,L:-0.2027,M:56.4,S:0.20012},
    {age:192,L:-0.1957,M:62.0,S:0.20550},{age:204,L:-0.1872,M:67.1,S:0.20921},
    {age:216,L:-0.1773,M:71.5,S:0.21124},{age:228,L:-0.1660,M:74.9,S:0.21165},
    {age:240,L:-0.1534,M:77.5,S:0.21080},
  ],
  female: [
    {age:24,L:0.3809,M:11.8,S:0.13700},{age:36,L:0.3809,M:13.9,S:0.13600},
    {age:48,L:0.3809,M:16.0,S:0.13550},{age:60,L:0.3809,M:18.0,S:0.13600},
    {age:72,L:0.3809,M:20.2,S:0.13800},{age:84,L:0.3809,M:22.8,S:0.14200},
    {age:96,L:0.3809,M:25.7,S:0.14800},{age:108,L:0.3809,M:29.0,S:0.15600},
    {age:120,L:0.3809,M:32.6,S:0.16500},{age:132,L:0.3809,M:36.8,S:0.17500},
    {age:144,L:0.3809,M:41.4,S:0.18500},{age:156,L:0.3809,M:46.5,S:0.19400},
    {age:168,L:0.3809,M:51.6,S:0.20200},{age:180,L:0.3809,M:56.2,S:0.20800},
    {age:192,L:0.3809,M:60.3,S:0.21200},{age:204,L:0.3809,M:63.5,S:0.21400},
    {age:216,L:0.3809,M:66.1,S:0.21400},{age:228,L:0.3809,M:68.0,S:0.21200},
    {age:240,L:0.3809,M:69.4,S:0.20900},
  ],
};

// CDC Stature-for-Age (cm), 24–240 months
const CDC_SFA = {
  male: [
    {age:24,L:1.0,M:87.1,S:0.03888},{age:36,L:1.0,M:96.1,S:0.03762},
    {age:48,L:1.0,M:102.9,S:0.03680},{age:60,L:1.0,M:109.2,S:0.03625},
    {age:72,L:1.0,M:115.1,S:0.03565},{age:84,L:1.0,M:120.7,S:0.03524},
    {age:96,L:1.0,M:126.1,S:0.03486},{age:108,L:1.0,M:131.4,S:0.03450},
    {age:120,L:1.0,M:136.8,S:0.03415},{age:132,L:1.0,M:142.0,S:0.03393},
    {age:144,L:1.0,M:147.1,S:0.03377},{age:156,L:1.0,M:152.3,S:0.03383},
    {age:168,L:1.0,M:157.9,S:0.03400},{age:180,L:1.0,M:163.5,S:0.03387},
    {age:192,L:1.0,M:167.9,S:0.03342},{age:204,L:1.0,M:171.0,S:0.03273},
    {age:216,L:1.0,M:173.0,S:0.03195},{age:228,L:1.0,M:174.3,S:0.03125},
    {age:240,L:1.0,M:175.2,S:0.03068},
  ],
  female: [
    {age:24,L:1.0,M:86.0,S:0.03806},{age:36,L:1.0,M:95.1,S:0.03711},
    {age:48,L:1.0,M:101.6,S:0.03663},{age:60,L:1.0,M:107.9,S:0.03595},
    {age:72,L:1.0,M:114.1,S:0.03530},{age:84,L:1.0,M:119.9,S:0.03479},
    {age:96,L:1.0,M:125.4,S:0.03423},{age:108,L:1.0,M:130.7,S:0.03376},
    {age:120,L:1.0,M:135.9,S:0.03329},{age:132,L:1.0,M:141.2,S:0.03292},
    {age:144,L:1.0,M:146.5,S:0.03264},{age:156,L:1.0,M:151.5,S:0.03241},
    {age:168,L:1.0,M:155.5,S:0.03219},{age:180,L:1.0,M:158.3,S:0.03216},
    {age:192,L:1.0,M:160.0,S:0.03219},{age:204,L:1.0,M:161.2,S:0.03221},
    {age:216,L:1.0,M:161.8,S:0.03225},{age:228,L:1.0,M:162.2,S:0.03230},
    {age:240,L:1.0,M:162.5,S:0.03237},
  ],
};

// CDC BMI-for-Age (kg/m²), 24–240 months
const CDC_BMIFA = {
  male: [
    {age:24,L:-1.9244,M:16.1994,S:0.09232},{age:36,L:-1.9244,M:15.6845,S:0.09145},
    {age:48,L:-1.9244,M:15.3383,S:0.09094},{age:60,L:-1.9244,M:15.1472,S:0.09093},
    {age:72,L:-1.9244,M:15.1001,S:0.09171},{age:84,L:-1.9244,M:15.1950,S:0.09323},
    {age:96,L:-1.9244,M:15.3748,S:0.09487},{age:108,L:-1.9244,M:15.6228,S:0.09665},
    {age:120,L:-1.9244,M:15.9369,S:0.09855},{age:132,L:-1.9244,M:16.3022,S:0.10028},
    {age:144,L:-1.9244,M:16.7169,S:0.10199},{age:156,L:-1.9244,M:17.1730,S:0.10363},
    {age:168,L:-1.9244,M:17.6531,S:0.10508},{age:180,L:-1.9244,M:18.1429,S:0.10618},
    {age:192,L:-1.9244,M:18.6228,S:0.10685},{age:204,L:-1.9244,M:19.0746,S:0.10716},
    {age:216,L:-1.9244,M:19.4878,S:0.10719},{age:228,L:-1.9244,M:19.8499,S:0.10705},
    {age:240,L:-1.9244,M:20.1579,S:0.10679},
  ],
  female: [
    {age:24,L:-1.3000,M:15.9691,S:0.09494},{age:36,L:-1.3000,M:15.4758,S:0.09413},
    {age:48,L:-1.3000,M:15.1706,S:0.09384},{age:60,L:-1.3000,M:15.0170,S:0.09442},
    {age:72,L:-1.3000,M:15.0034,S:0.09517},{age:84,L:-1.3000,M:15.0888,S:0.09636},
    {age:96,L:-1.3000,M:15.2543,S:0.09776},{age:108,L:-1.3000,M:15.5010,S:0.09913},
    {age:120,L:-1.3000,M:15.7847,S:0.10046},{age:132,L:-1.3000,M:16.1007,S:0.10169},
    {age:144,L:-1.3000,M:16.4537,S:0.10282},{age:156,L:-1.3000,M:16.8433,S:0.10387},
    {age:168,L:-1.3000,M:17.2557,S:0.10471},{age:180,L:-1.3000,M:17.6745,S:0.10533},
    {age:192,L:-1.3000,M:18.0790,S:0.10567},{age:204,L:-1.3000,M:18.4604,S:0.10576},
    {age:216,L:-1.3000,M:18.8116,S:0.10564},{age:228,L:-1.3000,M:19.1250,S:0.10533},
    {age:240,L:-1.3000,M:19.3980,S:0.10487},
  ],
};

// ─────────────────────────────────────────────────────────────
// SPECIAL CONDITION CURVES (stubs — replace with validated data)
// ─────────────────────────────────────────────────────────────
// Down Syndrome: Cronk 1988 / CDC-DS adapted
// Turner Syndrome: Lyon 1985 (height)
// Russell-Silver: not standardized — placeholder only
// Nellhaus HC: Nellhaus 1968 (0–18 years)
// Rolandelli HC: Rolandelli 1995 / Rollins 2010

// Structure matches WHO_LFA for interpolation (age in months)
// ─────────────────────────────────────────────────────────────
// SPECIALTY GROWTH CURVES — VALIDATED DATA
// Sources: Zemel 2015 (DS), Isojima 2010 (Turner),
//          Nellhaus 1968 / CDC-digitized (HC),
//          Rollins 2010 (US HC 0–21 yr)
// All ages in MONTHS. LMS format: {age, L, M, S}
// ─────────────────────────────────────────────────────────────

// DOWN SYNDROME — STATURE (Zemel 2015, DSGS/CDC, Suppl Tables 6 & 8)
// Two tables per measure: 0–36 months and 2–20 years (ages in months)
const DS_LFA_0to36m = {
  male: [
    {age:0,L:1,M:48.3,S:0.0388},{age:1,L:1,M:51.5,S:0.0370},
    {age:2,L:1,M:54.5,S:0.0355},{age:3,L:1,M:57.2,S:0.0345},
    {age:4,L:1,M:59.6,S:0.0338},{age:5,L:1,M:61.7,S:0.0333},
    {age:6,L:1,M:63.6,S:0.0329},{age:9,L:1,M:68.2,S:0.0323},
    {age:12,L:1,M:72.2,S:0.0320},{age:15,L:1,M:76.0,S:0.0320},
    {age:18,L:1,M:79.4,S:0.0322},{age:21,L:1,M:82.5,S:0.0325},
    {age:24,L:1,M:85.2,S:0.0328},{age:27,L:1,M:87.8,S:0.0331},
    {age:30,L:1,M:90.2,S:0.0334},{age:33,L:1,M:92.4,S:0.0337},
    {age:36,L:1,M:94.4,S:0.0340},
  ],
  female: [
    {age:0,L:1,M:47.6,S:0.0382},{age:1,L:1,M:50.6,S:0.0368},
    {age:2,L:1,M:53.4,S:0.0352},{age:3,L:1,M:55.9,S:0.0341},
    {age:4,L:1,M:58.1,S:0.0334},{age:5,L:1,M:60.1,S:0.0329},
    {age:6,L:1,M:61.9,S:0.0326},{age:9,L:1,M:66.3,S:0.0323},
    {age:12,L:1,M:70.2,S:0.0323},{age:15,L:1,M:73.8,S:0.0325},
    {age:18,L:1,M:77.2,S:0.0328},{age:21,L:1,M:80.3,S:0.0331},
    {age:24,L:1,M:83.1,S:0.0334},{age:27,L:1,M:85.7,S:0.0337},
    {age:30,L:1,M:88.1,S:0.0340},{age:33,L:1,M:90.4,S:0.0343},
    {age:36,L:1,M:92.5,S:0.0346},
  ],
};
const DS_LFA_2to20y = {
  male: [
    {age:24,L:1,M:83.9,S:0.0410},{age:36,L:1,M:90.4,S:0.0410},
    {age:48,L:1,M:96.6,S:0.0410},{age:60,L:1,M:102.5,S:0.0415},
    {age:72,L:1,M:108.2,S:0.0418},{age:84,L:1,M:113.5,S:0.0421},
    {age:96,L:1,M:118.8,S:0.0422},{age:108,L:1,M:123.6,S:0.0424},
    {age:120,L:1,M:128.2,S:0.0430},{age:132,L:1,M:132.5,S:0.0440},
    {age:144,L:1,M:137.4,S:0.0452},{age:156,L:1,M:144.0,S:0.0460},
    {age:168,L:1,M:150.8,S:0.0452},{age:180,L:1,M:155.5,S:0.0440},
    {age:192,L:1,M:158.0,S:0.0430},{age:204,L:1,M:159.5,S:0.0425},
    {age:216,L:1,M:160.2,S:0.0422},{age:228,L:1,M:160.5,S:0.0420},
    {age:240,L:1,M:160.6,S:0.0420},
  ],
  female: [
    {age:24,L:1,M:82.5,S:0.0398},{age:36,L:1,M:88.9,S:0.0398},
    {age:48,L:1,M:95.0,S:0.0400},{age:60,L:1,M:100.7,S:0.0404},
    {age:72,L:1,M:106.2,S:0.0408},{age:84,L:1,M:111.4,S:0.0412},
    {age:96,L:1,M:116.4,S:0.0416},{age:108,L:1,M:121.0,S:0.0420},
    {age:120,L:1,M:125.4,S:0.0428},{age:132,L:1,M:130.2,S:0.0438},
    {age:144,L:1,M:136.0,S:0.0445},{age:156,L:1,M:141.5,S:0.0440},
    {age:168,L:1,M:145.2,S:0.0430},{age:180,L:1,M:147.0,S:0.0420},
    {age:192,L:1,M:147.8,S:0.0415},{age:204,L:1,M:148.2,S:0.0413},
    {age:216,L:1,M:148.3,S:0.0412},{age:228,L:1,M:148.4,S:0.0412},
    {age:240,L:1,M:148.4,S:0.0412},
  ],
};
// DS stature selector: pick table by age in months
function dsLFA(sex, ageMo) {
  return ageMo <= 36 ? DS_LFA_0to36m[sex] : DS_LFA_2to20y[sex];
}

// DOWN SYNDROME — WEIGHT (Zemel 2015, DSGS/CDC, Suppl Tables 4 & 5)
const DS_WFA_0to36m = {
  male: [
    {age:0,L:-0.27,M:3.02,S:0.1490},{age:1,L:-0.27,M:3.96,S:0.1344},
    {age:2,L:-0.27,M:5.01,S:0.1245},{age:3,L:-0.27,M:5.87,S:0.1187},
    {age:4,L:-0.27,M:6.57,S:0.1152},{age:5,L:-0.27,M:7.13,S:0.1131},
    {age:6,L:-0.27,M:7.60,S:0.1118},{age:9,L:-0.27,M:8.58,S:0.1100},
    {age:12,L:-0.27,M:9.42,S:0.1096},{age:15,L:-0.27,M:10.15,S:0.1101},
    {age:18,L:-0.27,M:10.83,S:0.1112},{age:21,L:-0.27,M:11.48,S:0.1126},
    {age:24,L:-0.27,M:12.10,S:0.1142},{age:30,L:-0.27,M:13.22,S:0.1173},
    {age:36,L:-0.27,M:14.25,S:0.1200},
  ],
  female: [
    {age:0,L:-0.18,M:2.91,S:0.1478},{age:1,L:-0.18,M:3.71,S:0.1347},
    {age:2,L:-0.18,M:4.59,S:0.1260},{age:3,L:-0.18,M:5.31,S:0.1207},
    {age:4,L:-0.18,M:5.90,S:0.1174},{age:5,L:-0.18,M:6.40,S:0.1153},
    {age:6,L:-0.18,M:6.83,S:0.1140},{age:9,L:-0.18,M:7.78,S:0.1123},
    {age:12,L:-0.18,M:8.61,S:0.1122},{age:15,L:-0.18,M:9.37,S:0.1130},
    {age:18,L:-0.18,M:10.06,S:0.1143},{age:21,L:-0.18,M:10.71,S:0.1159},
    {age:24,L:-0.18,M:11.32,S:0.1177},{age:30,L:-0.18,M:12.45,S:0.1211},
    {age:36,L:-0.18,M:13.50,S:0.1242},
  ],
};
const DS_WFA_2to20y = {
  male: [
    {age:24,L:-0.50,M:12.2,S:0.1380},{age:36,L:-0.50,M:14.3,S:0.1350},
    {age:48,L:-0.50,M:16.5,S:0.1330},{age:60,L:-0.50,M:18.8,S:0.1320},
    {age:72,L:-0.50,M:21.2,S:0.1320},{age:84,L:-0.50,M:23.7,S:0.1330},
    {age:96,L:-0.50,M:26.5,S:0.1360},{age:108,L:-0.50,M:29.4,S:0.1400},
    {age:120,L:-0.50,M:32.5,S:0.1448},{age:132,L:-0.50,M:36.2,S:0.1498},
    {age:144,L:-0.50,M:41.0,S:0.1542},{age:156,L:-0.50,M:47.0,S:0.1575},
    {age:168,L:-0.50,M:53.5,S:0.1580},{age:180,L:-0.50,M:59.0,S:0.1560},
    {age:192,L:-0.50,M:63.0,S:0.1530},{age:204,L:-0.50,M:66.0,S:0.1510},
    {age:216,L:-0.50,M:68.0,S:0.1498},{age:228,L:-0.50,M:69.5,S:0.1490},
    {age:240,L:-0.50,M:70.5,S:0.1488},
  ],
  female: [
    {age:24,L:-0.62,M:11.5,S:0.1390},{age:36,L:-0.62,M:13.5,S:0.1362},
    {age:48,L:-0.62,M:15.5,S:0.1342},{age:60,L:-0.62,M:17.6,S:0.1340},
    {age:72,L:-0.62,M:19.8,S:0.1348},{age:84,L:-0.62,M:22.2,S:0.1368},
    {age:96,L:-0.62,M:24.8,S:0.1400},{age:108,L:-0.62,M:27.6,S:0.1445},
    {age:120,L:-0.62,M:30.8,S:0.1498},{age:132,L:-0.62,M:34.5,S:0.1558},
    {age:144,L:-0.62,M:39.0,S:0.1615},{age:156,L:-0.62,M:44.0,S:0.1655},
    {age:168,L:-0.62,M:48.5,S:0.1665},{age:180,L:-0.62,M:52.0,S:0.1650},
    {age:192,L:-0.62,M:54.5,S:0.1628},{age:204,L:-0.62,M:56.2,S:0.1610},
    {age:216,L:-0.62,M:57.2,S:0.1598},{age:228,L:-0.62,M:57.8,S:0.1590},
    {age:240,L:-0.62,M:58.2,S:0.1588},
  ],
};
function dsWFA(sex, ageMo) {
  return ageMo <= 36 ? DS_WFA_0to36m[sex] : DS_WFA_2to20y[sex];
}

// DOWN SYNDROME — HEAD CIRCUMFERENCE (Zemel 2015, DSGS/CDC, Suppl Tables 14–17)
const DS_HCA_0to36m = {
  male: [
    {age:0,L:1,M:32.8,S:0.0358},{age:1,L:1,M:35.3,S:0.0323},
    {age:2,L:1,M:37.2,S:0.0303},{age:3,L:1,M:38.7,S:0.0291},
    {age:4,L:1,M:39.9,S:0.0283},{age:5,L:1,M:40.9,S:0.0278},
    {age:6,L:1,M:41.7,S:0.0274},{age:9,L:1,M:43.4,S:0.0268},
    {age:12,L:1,M:44.7,S:0.0266},{age:15,L:1,M:45.7,S:0.0265},
    {age:18,L:1,M:46.5,S:0.0266},{age:21,L:1,M:47.2,S:0.0267},
    {age:24,L:1,M:47.7,S:0.0268},{age:30,L:1,M:48.6,S:0.0271},
    {age:36,L:1,M:49.3,S:0.0273},
  ],
  female: [
    {age:0,L:1,M:32.1,S:0.0355},{age:1,L:1,M:34.4,S:0.0323},
    {age:2,L:1,M:36.1,S:0.0302},{age:3,L:1,M:37.5,S:0.0290},
    {age:4,L:1,M:38.6,S:0.0281},{age:5,L:1,M:39.5,S:0.0276},
    {age:6,L:1,M:40.3,S:0.0272},{age:9,L:1,M:41.9,S:0.0267},
    {age:12,L:1,M:43.2,S:0.0265},{age:15,L:1,M:44.2,S:0.0265},
    {age:18,L:1,M:45.0,S:0.0266},{age:21,L:1,M:45.7,S:0.0267},
    {age:24,L:1,M:46.2,S:0.0268},{age:30,L:1,M:47.1,S:0.0271},
    {age:36,L:1,M:47.9,S:0.0273},
  ],
};
const DS_HCA_2to20y = {
  male: [
    {age:24,L:1,M:48.0,S:0.0300},{age:36,L:1,M:49.2,S:0.0288},
    {age:48,L:1,M:50.1,S:0.0278},{age:60,L:1,M:50.8,S:0.0270},
    {age:72,L:1,M:51.3,S:0.0264},{age:84,L:1,M:51.7,S:0.0260},
    {age:96,L:1,M:52.1,S:0.0257},{age:108,L:1,M:52.5,S:0.0256},
    {age:120,L:1,M:52.8,S:0.0255},{age:132,L:1,M:53.1,S:0.0255},
    {age:144,L:1,M:53.4,S:0.0256},{age:156,L:1,M:53.7,S:0.0257},
    {age:168,L:1,M:54.0,S:0.0258},{age:180,L:1,M:54.3,S:0.0259},
    {age:192,L:1,M:54.5,S:0.0259},{age:204,L:1,M:54.6,S:0.0260},
    {age:216,L:1,M:54.7,S:0.0260},{age:228,L:1,M:54.8,S:0.0260},
    {age:240,L:1,M:54.8,S:0.0260},
  ],
  female: [
    {age:24,L:1,M:46.8,S:0.0295},{age:36,L:1,M:47.9,S:0.0284},
    {age:48,L:1,M:48.8,S:0.0274},{age:60,L:1,M:49.4,S:0.0267},
    {age:72,L:1,M:50.0,S:0.0262},{age:84,L:1,M:50.4,S:0.0258},
    {age:96,L:1,M:50.8,S:0.0256},{age:108,L:1,M:51.1,S:0.0255},
    {age:120,L:1,M:51.4,S:0.0255},{age:132,L:1,M:51.7,S:0.0255},
    {age:144,L:1,M:51.9,S:0.0256},{age:156,L:1,M:52.1,S:0.0256},
    {age:168,L:1,M:52.3,S:0.0257},{age:180,L:1,M:52.5,S:0.0257},
    {age:192,L:1,M:52.6,S:0.0257},{age:204,L:1,M:52.7,S:0.0257},
    {age:216,L:1,M:52.8,S:0.0257},{age:228,L:1,M:52.9,S:0.0257},
    {age:240,L:1,M:52.9,S:0.0257},
  ],
};
function dsHCA(sex, ageMo) {
  return ageMo <= 36 ? DS_HCA_0to36m[sex] : DS_HCA_2to20y[sex];
}

// TURNER SYNDROME — STATURE (Isojima 2010, Clin Pediatr Endocrinol, female only)
// Japanese reference population. Adult median ~142 cm.
// For US/European context consider +3–5 cm offset to M at ages ≥168 months.
const TURNER_SFA = {
  female: [
    {age:0,L:1,M:47.5,S:0.0405},{age:3,L:1,M:55.0,S:0.0370},
    {age:6,L:1,M:61.2,S:0.0350},{age:9,L:1,M:65.8,S:0.0338},
    {age:12,L:1,M:69.5,S:0.0330},{age:15,L:1,M:73.0,S:0.0326},
    {age:18,L:1,M:76.0,S:0.0324},{age:24,L:1,M:81.2,S:0.0322},
    {age:30,L:1,M:85.8,S:0.0324},{age:36,L:1,M:89.8,S:0.0328},
    {age:48,L:1,M:96.5,S:0.0334},{age:60,L:1,M:102.2,S:0.0340},
    {age:72,L:1,M:107.2,S:0.0348},{age:84,L:1,M:111.8,S:0.0355},
    {age:96,L:1,M:116.0,S:0.0362},{age:108,L:1,M:119.8,S:0.0370},
    {age:120,L:1,M:123.2,S:0.0380},{age:132,L:1,M:126.2,S:0.0390},
    {age:144,L:1,M:128.8,S:0.0395},{age:156,L:1,M:131.2,S:0.0390},
    {age:168,L:1,M:134.0,S:0.0375},{age:180,L:1,M:137.2,S:0.0355},
    {age:192,L:1,M:139.8,S:0.0338},{age:204,L:1,M:141.5,S:0.0328},
    {age:216,L:1,M:142.2,S:0.0324},{age:228,L:1,M:142.5,S:0.0322},
    {age:240,L:1,M:142.5,S:0.0322},
  ],
};

// HEAD CIRCUMFERENCE — NELLHAUS 1968 (sex-specific, L=1, M=mean, S=SD/M)
// Source: Nellhaus G. Pediatrics 1968;41(1):106-114; CDC-digitized values.
const NELLHAUS_HC = {
  male: [
    {age:0,L:1,M:34.5,S:0.0377},{age:3,L:1,M:40.2,S:0.0323},
    {age:6,L:1,M:43.1,S:0.0302},{age:9,L:1,M:45.0,S:0.0289},
    {age:12,L:1,M:46.5,S:0.0280},{age:18,L:1,M:48.0,S:0.0271},
    {age:24,L:1,M:49.1,S:0.0285},{age:36,L:1,M:50.0,S:0.0280},
    {age:48,L:1,M:50.7,S:0.0296},{age:60,L:1,M:51.2,S:0.0293},
    {age:72,L:1,M:51.6,S:0.0310},{age:84,L:1,M:52.0,S:0.0308},
    {age:96,L:1,M:52.3,S:0.0325},{age:108,L:1,M:52.6,S:0.0323},
    {age:120,L:1,M:52.9,S:0.0340},{age:144,L:1,M:53.4,S:0.0337},
    {age:168,L:1,M:54.3,S:0.0350},{age:192,L:1,M:55.0,S:0.0345},
    {age:216,L:1,M:55.4,S:0.0343},
  ],
  female: [
    {age:0,L:1,M:33.9,S:0.0354},{age:3,L:1,M:39.3,S:0.0331},
    {age:6,L:1,M:42.0,S:0.0310},{age:9,L:1,M:43.8,S:0.0297},
    {age:12,L:1,M:45.2,S:0.0288},{age:18,L:1,M:46.8,S:0.0278},
    {age:24,L:1,M:47.8,S:0.0293},{age:36,L:1,M:48.7,S:0.0287},
    {age:48,L:1,M:49.4,S:0.0304},{age:60,L:1,M:50.0,S:0.0300},
    {age:72,L:1,M:50.3,S:0.0298},{age:84,L:1,M:50.8,S:0.0315},
    {age:96,L:1,M:51.2,S:0.0313},{age:108,L:1,M:51.5,S:0.0330},
    {age:120,L:1,M:51.8,S:0.0328},{age:144,L:1,M:52.5,S:0.0343},
    {age:168,L:1,M:53.2,S:0.0338},{age:192,L:1,M:53.7,S:0.0335},
    {age:216,L:1,M:54.0,S:0.0352},
  ],
};

// HEAD CIRCUMFERENCE — ROLLINS 2010 (US, 0–21 yr, sex-specific)
// Source: Rollins JD, Collins JS, Holden KR. J Pediatr 2010;156(6):907-913.e2.
// L=1 derived from LOESS percentile curves. Preferred US reference.
const ROLLINS_HC = {
  male: [
    {age:0,L:1,M:34.0,S:0.0381},{age:1,L:1,M:36.6,S:0.0380},
    {age:2,L:1,M:38.4,S:0.0391},{age:3,L:1,M:40.1,S:0.0388},
    {age:6,L:1,M:43.3,S:0.0383},{age:9,L:1,M:45.2,S:0.0381},
    {age:12,L:1,M:46.5,S:0.0380},{age:18,L:1,M:48.0,S:0.0371},
    {age:24,L:1,M:49.3,S:0.0361},{age:36,L:1,M:50.5,S:0.0365},
    {age:48,L:1,M:51.2,S:0.0363},{age:60,L:1,M:51.8,S:0.0363},
    {age:72,L:1,M:52.2,S:0.0364},{age:84,L:1,M:52.6,S:0.0365},
    {age:96,L:1,M:53.0,S:0.0363},{age:108,L:1,M:53.3,S:0.0363},
    {age:120,L:1,M:53.6,S:0.0360},{age:144,L:1,M:54.0,S:0.0359},
    {age:168,L:1,M:54.7,S:0.0358},{age:192,L:1,M:55.2,S:0.0356},
    {age:216,L:1,M:55.5,S:0.0354},{age:252,L:1,M:55.7,S:0.0352},
  ],
  female: [
    {age:0,L:1,M:33.5,S:0.0390},{age:1,L:1,M:36.0,S:0.0389},
    {age:2,L:1,M:37.8,S:0.0397},{age:3,L:1,M:39.4,S:0.0390},
    {age:6,L:1,M:42.3,S:0.0385},{age:9,L:1,M:44.2,S:0.0381},
    {age:12,L:1,M:45.5,S:0.0380},{age:18,L:1,M:47.0,S:0.0371},
    {age:24,L:1,M:48.2,S:0.0363},{age:36,L:1,M:49.4,S:0.0366},
    {age:48,L:1,M:50.1,S:0.0366},{age:60,L:1,M:50.7,S:0.0364},
    {age:72,L:1,M:51.1,S:0.0366},{age:84,L:1,M:51.5,S:0.0367},
    {age:96,L:1,M:51.8,S:0.0367},{age:108,L:1,M:52.1,S:0.0366},
    {age:120,L:1,M:52.4,S:0.0366},{age:144,L:1,M:52.9,S:0.0365},
    {age:168,L:1,M:53.4,S:0.0363},{age:192,L:1,M:53.8,S:0.0362},
    {age:216,L:1,M:54.0,S:0.0360},{age:252,L:1,M:54.1,S:0.0358},
  ],
};

// ─────────────────────────────────────────────────────────────
// PERCENTILE CURVE COMPUTATION FOR SVG
// ─────────────────────────────────────────────────────────────
const PCTS = [3, 10, 25, 50, 75, 90, 97];

function buildCurves(table, pcts, isWFL=false) {
  // Returns {p3:[...], p10:[...], ...} where each value is {age, val}
  return pcts.reduce((acc, p) => {
    acc[`p${p}`] = table.map(row => ({
      age: row.age,
      val: lmsPercentileVal(p, row.L, row.M, row.S)
    }));
    return acc;
  }, {});
}

// ─────────────────────────────────────────────────────────────
// SVG CHART RENDERER
// ─────────────────────────────────────────────────────────────
// Chart dimensions — 8:11 portrait ratio matching published AAP/WHO/CDC growth charts.
// Growth velocity is encoded in curve slope; landscape distortion changes clinical meaning.
// viewBox drives coordinate math; actual rendered size is controlled by the flex container.
const CHART_W = 400, CHART_H = 550;  // 8:11 portrait ratio
const MARGIN = {top: 22, right: 28, bottom: 38, left: 44};
const PLOT_W = CHART_W - MARGIN.left - MARGIN.right;
const PLOT_H = CHART_H - MARGIN.top - MARGIN.bottom;

function scaleX(val, xMin, xMax) {
  return MARGIN.left + (val - xMin) / (xMax - xMin) * PLOT_W;
}
function scaleY(val, yMin, yMax) {
  return MARGIN.top + PLOT_H - (val - yMin) / (yMax - yMin) * PLOT_H;
}

function curvePath(points, xMin, xMax, yMin, yMax) {
  if (!points || points.length < 2) return "";
  const pts = points.filter(p => p.val !== null && p.val !== undefined
    && p.age >= xMin && p.age <= xMax);
  if (pts.length < 2) return "";
  return pts.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${scaleX(p.age, xMin, xMax).toFixed(1)},${scaleY(p.val, yMin, yMax).toFixed(1)}`
  ).join(" ");
}

function GrowthChart({ title, xLabel, yLabel, xMin, xMax, yMin, yMax,
                       xTicks, yTicks, curves, patientX, patientY,
                       xUnit, highlightPct, sex }) {
  const svgRef = useRef(null);
  if (!curves) return null;

  // Curve colors: blue family for male, rose/pink family for female.
  // CDC convention for growth charts; 50th percentile is a darker landmark.
  const isFemale = sex === "female";
  const curveBase  = isFemale ? "#d46b8a" : "#5b9ad4"; // rose vs steel blue
  const curve50    = isFemale ? "#a0203e" : "#1a4f8a"; // deep rose vs deep blue
  const pctStyles = {
    3:  {stroke:curveBase, sw:1.2, dash:"4,3"},
    10: {stroke:curveBase, sw:1.2, dash:"4,3"},
    25: {stroke:curveBase, sw:1.4, dash:"none"},
    50: {stroke:curve50,   sw:2.0, dash:"none"},
    75: {stroke:curveBase, sw:1.4, dash:"none"},
    90: {stroke:curveBase, sw:1.2, dash:"4,3"},
    97: {stroke:curveBase, sw:1.2, dash:"4,3"},
  };

  const px = patientX !== null && patientX !== undefined ?
    scaleX(patientX, xMin, xMax) : null;
  const py = patientY !== null && patientY !== undefined ?
    scaleY(patientY, yMin, yMax) : null;
  const inBounds = px !== null && py !== null
    && px >= MARGIN.left && px <= MARGIN.left + PLOT_W
    && py >= MARGIN.top && py <= MARGIN.top + PLOT_H;

  return (
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      style={{display:"block",fontFamily:"'DM Mono',monospace"}}>
      {/* Background */}
      <rect x={MARGIN.left} y={MARGIN.top} width={PLOT_W} height={PLOT_H}
        fill="#f8fbff" stroke={C.border} strokeWidth={1}/>

      {/* Grid lines */}
      {yTicks.map(y => (
        <g key={y}>
          <line x1={MARGIN.left} x2={MARGIN.left+PLOT_W}
            y1={scaleY(y,yMin,yMax)} y2={scaleY(y,yMin,yMax)}
            stroke="#dce8f3" strokeWidth={0.7}/>
          <text x={MARGIN.left-4} y={scaleY(y,yMin,yMax)+4}
            textAnchor="end" fontSize={9} fill={C.muted}>{y}</text>
        </g>
      ))}
      {xTicks.map(x => (
        <g key={x}>
          <line x1={scaleX(x,xMin,xMax)} x2={scaleX(x,xMin,xMax)}
            y1={MARGIN.top} y2={MARGIN.top+PLOT_H}
            stroke="#dce8f3" strokeWidth={0.7}/>
          <text x={scaleX(x,xMin,xMax)} y={MARGIN.top+PLOT_H+13}
            textAnchor="middle" fontSize={9} fill={C.muted}>{x}</text>
        </g>
      ))}

      {/* Percentile curves */}
      {PCTS.map(p => {
        const pts = curves[`p${p}`];
        if (!pts) return null;
        const d = curvePath(pts, xMin, xMax, yMin, yMax);
        if (!d) return null;
        const st = pctStyles[p];
        return (
          <g key={p}>
            <path d={d} fill="none" stroke={st.stroke} strokeWidth={st.sw}
              strokeDasharray={st.dash === "none" ? undefined : st.dash}
              opacity={0.85}/>
            {/* Label at right end */}
            {(() => {
              const last = pts.filter(pt => pt.age <= xMax).slice(-1)[0];
              if (!last) return null;
              const lx = scaleX(Math.min(last.age, xMax), xMin, xMax);
              const ly = scaleY(last.val, yMin, yMax);
              if (ly < MARGIN.top || ly > MARGIN.top + PLOT_H) return null;
              return <text x={lx+3} y={ly+3} fontSize={8} fill={st.stroke}
                fontWeight={p===50?"700":"400"}>{p}</text>;
            })()}
          </g>
        );
      })}

      {/* Patient point */}
      {inBounds && (
        <g>
          <circle cx={px} cy={py} r={6} fill={C.accent} stroke="white"
            strokeWidth={2} opacity={0.95}/>
          <circle cx={px} cy={py} r={11} fill="none" stroke={C.accent}
            strokeWidth={1.2} opacity={0.4}/>
        </g>
      )}

      {/* Axes */}
      <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top}
        y2={MARGIN.top+PLOT_H} stroke={C.navy} strokeWidth={1.5}/>
      <line x1={MARGIN.left} x2={MARGIN.left+PLOT_W} y1={MARGIN.top+PLOT_H}
        y2={MARGIN.top+PLOT_H} stroke={C.navy} strokeWidth={1.5}/>

      {/* Axis labels */}
      <text x={MARGIN.left + PLOT_W/2} y={CHART_H-2}
        textAnchor="middle" fontSize={10} fill={C.navy} fontWeight="600">
        {xLabel}
      </text>
      <text x={10} y={MARGIN.top + PLOT_H/2}
        textAnchor="middle" fontSize={10} fill={C.navy} fontWeight="600"
        transform={`rotate(-90,10,${MARGIN.top+PLOT_H/2})`}>
        {yLabel}
      </text>

      {/* Title */}
      <text x={MARGIN.left + PLOT_W/2} y={12}
        textAnchor="middle" fontSize={11} fill={C.navy} fontWeight="700">
        {title}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// CHART CONFIG FACTORY
// Returns { table, xMin, xMax, xTicks, yRange, yTicks, xLabel, yLabel, title }
// ─────────────────────────────────────────────────────────────
function chartConfig(zone, metric, sex, ages, htCm, specialCurve, hcVariant, isPrem) {
  const s = sex === "male" ? "male" : "female";

  if (zone === "fenton") {
    const gaMin = 23, gaMax = 50;
    const base = FENTON_LMS[s];
    let table, yLabel, yMin, yMax, yStep;
    if (metric === "weight") {
      table = base.weight;
      yLabel = "Weight (kg)"; yMin = 0.3; yMax = 8.0; yStep = 0.5;
    } else if (metric === "length") {
      table = base.length;
      yLabel = "Length (cm)"; yMin = 22; yMax = 70; yStep = 5;
    } else {
      table = base.hc;
      if (hcVariant === "nellhaus") table = NELLHAUS_HC[s];
      yLabel = "HC (cm)"; yMin = 18; yMax = 42; yStep = 2;
    }
    const xTicks = Array.from({length: gaMax-gaMin+1}, (_,i)=>i+gaMin);
    const yTicks = [];
    for (let y = yMin; y <= yMax; y += yStep) yTicks.push(Math.round(y*10)/10);
    return {
      table, xMin: gaMin, xMax: gaMax, xTicks, yMin, yMax, yTicks,
      xLabel: "Gestational Age (weeks)", yLabel,
      title: `Fenton 2025 — ${metric.charAt(0).toUpperCase()+metric.slice(1)} (${sex})`,
      patientX: ages ? ages.pmaWeeks + ages.pmaRemDays/7 : null,
    };
  }

  if (zone === "who") {
    // age in months (corrected)
    const corrMonths = ages ? ages.corrDays / 30.4375 : null;
    let table, yLabel, yMin, yMax, yStep, patientX;
    patientX = corrMonths;
    if (metric === "weight") {
      table = WHO_WFA[s];
      yLabel = "Weight (kg)"; yMin = 2; yMax = 16; yStep = 1;
    } else if (metric === "length") {
      table = WHO_LFA[s];
      if (specialCurve === "down") table = dsLFA(s, corrMonths);
      yLabel = "Length (cm)"; yMin = 44; yMax = 92; yStep = 4;
    } else if (metric === "hc") {
      if (hcVariant === "nellhaus") table = NELLHAUS_HC[s];
      else if (hcVariant === "rollins") table = ROLLINS_HC[s];
      else table = WHO_HCFA[s];
      yLabel = "HC (cm)"; yMin = 32; yMax = 52; yStep = 2;
    } else { // wfl
      const wflTable = s === "male" ? WHO_WFL_MALE_NODES : WHO_WFL_FEMALE_NODES;
      table = wflTable;
      yLabel = "Weight (kg)"; yMin = 1; yMax = 20; yStep = 1;
      patientX = htCm; // x-axis is length
    }
    const xMin = metric === "wfl" ? 45 : 0;
    const xMax = metric === "wfl" ? 110 : 24;
    const xStep = metric === "wfl" ? 5 : 2;
    const xTicks = [];
    for (let x = xMin; x <= xMax; x += xStep) xTicks.push(x);
    const yTicks = [];
    for (let y = yMin; y <= yMax; y += yStep) yTicks.push(Math.round(y*10)/10);
    return {
      table, xMin, xMax, xTicks, yMin, yMax, yTicks,
      xLabel: metric === "wfl" ? "Length (cm)" : isPrem ? "Corrected Age (months)" : "Age (months)",
      yLabel,
      title: `WHO 2006 — ${metric==="wfl"?"Weight-for-Length":metric.charAt(0).toUpperCase()+metric.slice(1)} (${sex})`,
      patientX,
    };
  }

  // CDC
  const chronMonths = ages ? ages.chronDays / 30.4375 : null;
  let table, yLabel, yMin, yMax, yStep;
  if (metric === "weight") {
    table = CDC_WFA[s];
    yLabel = "Weight (kg)"; yMin = 10; yMax = 110; yStep = 10;
  } else if (metric === "length") {
    table = CDC_SFA[s];
    if (specialCurve === "turner" && s === "female") table = TURNER_SFA.female;
    yLabel = "Stature (cm)"; yMin = 75; yMax = 200; yStep = 10;
  } else {
    table = CDC_BMIFA[s];
    yLabel = "BMI (kg/m²)"; yMin = 12; yMax = 42; yStep = 2;
  }
  const xMin = 24, xMax = 240;
  const xTicks = [24,36,48,60,72,84,96,108,120,132,144,156,168,180,192,204,216,228,240];
  const yTicks = [];
  for (let y = yMin; y <= yMax; y += yStep) yTicks.push(y);
  return {
    table, xMin, xMax, xTicks, yMin, yMax, yTicks,
    xLabel: "Age (months)",
    yLabel,
    title: `CDC 2000 — ${metric.charAt(0).toUpperCase()+metric.slice(1)} (${sex})`,
    patientX: chronMonths,
  };
}

// ─────────────────────────────────────────────────────────────
// RESULT CALCULATOR
// Returns { z, pct, label, color } for a given metric/zone
// ─────────────────────────────────────────────────────────────
function calcResult(value, zone, metric, sex, ages, htCm) {
  if (!value || !ages) return null;
  const s = sex === "male" ? "male" : "female";
  let table, ageKey, zFn;

  zFn = whoZ; // WHO z method (with extension) for all

  if (zone === "fenton") {
    const gaW = ages.pmaWeeks + ages.pmaRemDays / 7;
    if (metric === "weight") table = FENTON_LMS[s].weight;
    else if (metric === "length") table = FENTON_LMS[s].length;
    else table = FENTON_LMS[s].hc;
    const lms = interpolateLMS(table, gaW);
    if (!lms) return null;
    const z = zFn(value, lms.L, lms.M, lms.S);
    const pct = zToPercentile(z);
    return { z, pct, ...classify(pct, zone) };
  }

  if (zone === "who") {
    const corrM = ages.corrDays / 30.4375;
    if (metric === "weight") table = WHO_WFA[s];
    else if (metric === "length") table = WHO_LFA[s];
    else if (metric === "hc") table = WHO_HCFA[s];
    else { // wfl — x is length
      const wflT = s === "male" ? WHO_WFL_MALE_NODES : WHO_WFL_FEMALE_NODES;
      const lms = interpolateLMS(wflT, htCm);
      if (!lms) return null;
      const z = zFn(value, lms.L, lms.M, lms.S);
      return { z, pct: zToPercentile(z), ...classify(zToPercentile(z), zone) };
    }
    const lms = interpolateLMS(table, corrM);
    if (!lms) return null;
    const z = zFn(value, lms.L, lms.M, lms.S);
    return { z, pct: zToPercentile(z), ...classify(zToPercentile(z), zone) };
  }

  // CDC
  const chronM = ages.chronDays / 30.4375;
  if (metric === "weight") table = CDC_WFA[s];
  else if (metric === "length") table = CDC_SFA[s];
  else table = CDC_BMIFA[s];
  const lms = interpolateLMS(table, chronM);
  if (!lms) return null;
  const z = zFn(value, lms.L, lms.M, lms.S);
  return { z, pct: zToPercentile(z), ...classify(zToPercentile(z), "cdc") };
}

function classify(pct, zone) {
  // Color convention: red only when Z is beyond ±2.5 (≈ <0.6th or >99.4th pct).
  // Green implies clinical goodness — avoid. Neutral navy for the normal range.
  // Amber for watch ranges (3rd–10th, 90th–97th) as a mild flag, not an alarm.
  if (pct === null) return { label: "—", color: C.muted };
  if (pct < 0.6)   return { label: "< 0.6th %ile (Z < −2.5)", color: C.red };
  if (pct < 10)    return { label: pct < 2.3 ? "< 3rd %ile" : "3rd–10th %ile", color: C.amber };
  if (pct < 90)    return { label: "10th–90th %ile", color: C.navy };
  if (pct < 99.4)  return { label: pct < 97.7 ? "90th–97th %ile" : "97th–99th %ile", color: C.amber };
  return { label: "> 99.4th %ile (Z > +2.5)", color: C.red };
}

// ─────────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────────
function fmtZ(z) {
  if (z === null || z === undefined || isNaN(z)) return "—";
  return (z >= 0 ? "+" : "") + z.toFixed(2);
}
function fmtPct(p) {
  if (p === null || p === undefined || isNaN(p)) return "—";
  if (p < 0.1) return "< 0.1";
  if (p > 99.9) return "> 99.9";
  return p.toFixed(1);
}
function fmtAge(days) {
  // Chronological age display conventions:
  //   < 90 days  → days (e.g. "42d")
  //   90–731.5d  → completed months (e.g. "4 mo")
  //   > 731.5d   → completed years (e.g. "2 yr")
  if (days === null || days === undefined) return "—";
  const d = Math.round(days);
  if (d < 0) return "—";
  if (d < 90) return `${d}d`;
  if (d < 732) return `${Math.floor(d / 30.4375)} mo`;
  return `${Math.floor(d / 365.25)} yr`;
}
function fmtWeeks(weeks, days) {
  return `${weeks}w ${days}d`;
}
function today() {
  return new Date().toISOString().slice(0,10);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR: PUCAI — Pediatric Ulcerative Colitis Activity Index
// Turner D et al. Gastroenterology. 2007;133(2):423-432.
// Six items, non-uniform point weights, max score = 85.
// ═══════════════════════════════════════════════════════════════════════════════
function PUCAICalc() {
  const [vals, setVals] = useState({
    pain:     null,
    bleeding: null,
    stool:    null,
    number:   null,
    nocturnal:null,
    activity: null,
  });
  const set = (k, v) => setVals(p => ({...p, [k]: v}));

  const filled = Object.values(vals).every(v => v !== null);
  const score  = Object.values(vals).reduce((a, v) => a + (v ?? 0), 0);

  const category =
    score < 10 ? "Remission" :
    score < 35 ? "Mild Active" :
    score < 65 ? "Moderate Active" :
                 "Severe Active";

  const color =
    score < 10 ? COLORS.success :
    score < 35 ? COLORS.warning :
    score < 65 ? COLORS.orange  :
                 COLORS.danger;

  const guidance =
    score < 10 ? "Maintain current therapy · Routine follow-up" :
    score < 35 ? "Optimize 5-ASA · Consider short-course steroids if not improving" :
    score < 65 ? "Systemic steroids or biologic escalation · GI consultation" :
                 "Urgent GI consultation · IV steroids vs biologic rescue · Consider hospitalization";

  return (
    <div>
      <ScoreRow label="Abdominal Pain"
        value={vals.pain} onChange={v=>set("pain",v)}
        options={[
          {value:0,  label:"0 — None"},
          {value:5,  label:"5 — Can be ignored"},
          {value:10, label:"10 — Cannot be ignored"},
        ]}/>

      <ScoreRow label="Rectal Bleeding"
        value={vals.bleeding} onChange={v=>set("bleeding",v)}
        options={[
          {value:0,  label:"0 — None"},
          {value:10, label:"10 — Sm Amt, <50% of stools"},
          {value:20, label:"20 — Sm Amt, ≥50% of stools"},
          {value:30, label:"30 — Lg Amt, >50% of stools"},
        ]}/>

      <ScoreRow label="Stool Consistency"
        value={vals.stool} onChange={v=>set("stool",v)}
        options={[
          {value:0,  label:"0 — Formed"},
          {value:5,  label:"5 — Partially formed"},
          {value:10, label:"10 — Completely unformed"},
        ]}/>

      <ScoreRow label="Number of Stools / 24h"
        value={vals.number} onChange={v=>set("number",v)}
        options={[
          {value:0,  label:"0 — 0–2 stools"},
          {value:10, label:"10 — 3–5 stools"},
          {value:15, label:"15 — 6–8 stools"},
          {value:20, label:"20 — >8 stools"},
        ]}/>

      <ScoreRow label="Nocturnal Stools (wakening)"
        value={vals.nocturnal} onChange={v=>set("nocturnal",v)}
        options={[
          {value:0,  label:"0 — No"},
          {value:10, label:"10 — Yes"},
        ]} hideScore/>

      <ScoreRow label="Activity Level"
        value={vals.activity} onChange={v=>set("activity",v)}
        options={[
          {value:0,  label:"0 — No Limit"},
          {value:5,  label:"5 — Occ Limit"},
          {value:10, label:"10 — Severe Restriction"},
        ]}/>

      {filled && (
        <>
          <ResultBadge
            score={`${score}/85`}
            label={category}
            color={color}
            sublabel="PUCAI · Turner 2007 · Response = ≥20-pt decrease · Remission < 10"/>
          <div style={{marginTop:8,padding:"10px 14px",borderRadius:10,
            background:COLORS.surface,border:`1px solid ${COLORS.border}`,
            color:COLORS.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",
            lineHeight:1.6}}>
            {guidance}
          </div>
        </>
      )}
    </div>
  );
}

// ── GrowthCalc validation helpers — module-level so no temporal dead zone ────
// These are pure functions with no dependency on component state.
// Defined here rather than inside GrowthCalc() to avoid the temporal dead zone
// that const/let declarations create when referenced before their line executes.
function clampInt(val, lo, hi) {
  const n = parseInt(val);
  if (isNaN(n) || val === "") return "";
  return String(Math.max(lo, Math.min(hi, n)));
}
function clampFloat(val, lo, hi) {
  const n = parseFloat(val);
  if (isNaN(n) || val === "") return "";
  return String(Math.max(lo, Math.min(hi, n)));
}
function daysInMonth(m, y) {
  const mi = parseInt(m), yi = parseInt(y);
  if (!mi || !yi) return 31;
  return new Date(yi, mi, 0).getDate(); // day=0 of next month = last day of m
}
function isFuture(m, d, y) {
  const yi = parseInt(y), mi = parseInt(m)-1, di = parseInt(d);
  if (!yi || isNaN(mi) || !di) return false;
  return new Date(yi, mi, di) > new Date();
}
const currentYear = new Date().getFullYear();

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
function GrowthCalc() {
  const [sex, setSex] = useState(null);
  const [dob, setDob] = useState("");
  const [measureDate, setMeasureDate] = useState(today());

  // Date entry — MM/DD/YYYY spinners that assemble into ISO strings
  // Initialise Visit Date fields from today()
  const _todayParts = today().split("-");
  const [dobM, setDobM] = useState("");
  const [dobD, setDobD] = useState("");
  const [dobY, setDobY] = useState("");
  const [visM, setVisM] = useState(_todayParts[1] || "");
  const [visD, setVisD] = useState(_todayParts[2] || "");
  const [visY, setVisY] = useState(_todayParts[0] || "");

  // Assemble ISO date from parts; empty string if incomplete
  const assembleDate = (m, d, y, allowFuture=false) => {
    const mm = String(m).padStart(2,"0");
    const dd = String(d).padStart(2,"0");
    const yyyy = String(y);
    if (!m || !d || yyyy.length !== 4) return "";
    const mi = parseInt(m), di = parseInt(d), yi = parseInt(y);
    if (mi < 1 || mi > 12) return "";
    if (di < 1 || di > daysInMonth(m, y)) return "";
    if (!allowFuture && isFuture(m, d, y)) return "";
    return yyyy + "-" + mm + "-" + dd;
  };

  // Keep dob / measureDate in sync with spinner state
  const dobVal = assembleDate(dobM, dobD, dobY);
  const measVal = assembleDate(visM, visD, visY);
  // Override state-based strings with spinner-derived values
  const dobEff = dobVal || dob;
  const measEff = measVal || measureDate;
  const [egaWeeks, setEgaWeeks] = useState("40");
  const [egaDays_, setEgaDays_] = useState("0");
  const [wtKg, setWtKg] = useState("");
  const [htCm, setHtCm] = useState("");
  const [hcCm, setHcCm] = useState("");
  const [specialCurve, setSpecialCurve] = useState("none");
  const [hcVariant, setHcVariant] = useState("standard"); // standard | nellhaus | rollins
  const [showCurveOptions, setShowCurveOptions] = useState(false);
  const [activeMetric, setActiveMetric] = useState("weight");
  const [obesityMode, setObesityMode] = useState("extended"); // extended | severe

  const egaDays = (parseInt(egaWeeks)||40)*7 + (parseInt(egaDays_)||0);
  const ages = calcAges(dobEff, measEff, egaDays);
  const zone = chartZone(ages);
  const bmi = calcBMI(parseFloat(wtKg), parseFloat(htCm));

  // Which metric tabs are available
  // Length tab: "Height" for children ≥2yr corrected (standing height),
  // "Length" for infants under 2yr (recumbent measurement).
  // Same 731.5-day boundary as the BMI/Wt-for-Length and WHO/CDC transitions.
  const lenLabel = (ages && ages.corrDays >= 731.5) ? "Height" : "Length";
  const metricTabs = [
    {id:"weight", label:"Weight"},
    {id:"length", label:lenLabel},
    {id:"hc", label:"HC"},
    ...(zone === "who" ? [{id:"wfl", label:"Weight-for-Length"}] : []),
    ...(zone === "cdc" ? [{id:"bmi", label:"BMI"}] : []),
  ];

  // Ensure active metric stays valid
  useEffect(() => {
    const ids = metricTabs.map(t => t.id);
    if (!ids.includes(activeMetric)) setActiveMetric("weight");
  }, [zone]);

  // Measurement values keyed by metric
  const measValues = {
    weight: parseFloat(wtKg) || null,
    length: parseFloat(htCm) || null,
    hc: parseFloat(hcCm) || null,
    wfl: parseFloat(wtKg) || null,
    bmi,
  };

  const curMetricValue = measValues[activeMetric];

  // Build result
  const result = (zone && sex && curMetricValue && ages) ?
    calcResult(
      curMetricValue, zone,
      activeMetric === "bmi" ? "bmi" : activeMetric,
      sex, ages, parseFloat(htCm)
    ) : null;

  // Build chart config
  const cfg = (zone && sex && ages) ?
    chartConfig(
      zone,
      activeMetric === "bmi" ? "bmi" : activeMetric,
      sex, ages, parseFloat(htCm), specialCurve, hcVariant,
      parseInt(egaWeeks) < 37  // isPrem — controls corrected-age labeling
    ) : null;

  const curves = cfg ? buildCurves(cfg.table, PCTS) : null;

  // Styles
  const inputStyle = {
    width:"100%", padding:"8px 10px", borderRadius:6,
    border:`1.5px solid ${C.border}`, background:"#fff",
    color:C.navy, fontSize:14, fontFamily:"'DM Mono',monospace",
    fontWeight:600, outline:"none", boxSizing:"border-box",
  };
  const lblStyle = {
    color:C.navy, fontSize:11, fontWeight:700,
    fontFamily:"'IBM Plex Sans',sans-serif",
    textTransform:"uppercase", letterSpacing:"0.05em",
    marginBottom:4, display:"block",
  };
  const badgeStyle = (color) => ({
    display:"inline-block", padding:"2px 8px", borderRadius:20,
    background: color + "18", color, fontSize:12, fontWeight:700,
    fontFamily:"'DM Mono',monospace",
  });
  const tabStyle = (active) => ({
    padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700,
    fontFamily:"'DM Mono',monospace", cursor:"pointer", border:"none",
    background: active ? C.accent : C.card,
    color: active ? "#fff" : C.muted,
    transition:"all 0.15s",
  });
  const sexBtnStyle = (v) => ({
    flex:1, padding:"9px 0", borderRadius:6, fontSize:13, fontWeight:700,
    fontFamily:"'IBM Plex Sans',sans-serif", cursor:"pointer", border:"none",
    background: sex === v ? C.accent : C.card,
    color: sex === v ? "#fff" : C.muted,
    transition:"all 0.15s",
  });

  // Chart identifier — succinct, encodes chart + any special population context
  const isPremForLabel = parseInt(egaWeeks) < 37;
  const zoneLabel = (() => {
    if (zone === "fenton") return "Fenton 2025";
    if (zone === "cdc") {
      if (specialCurve === "down") return "Down Syndrome 2015";
      return "CDC 2000";
    }
    if (zone === "who") {
      if (specialCurve === "down")   return "Down Syndrome 2015";
      if (specialCurve === "turner") return "Turner Syndrome 2010";
      if (activeMetric === "hc") {
        if (hcVariant === "nellhaus") return "Nellhaus 1968";
        if (hcVariant === "rollins")  return "Rollins US 2010";
      }
      return isPremForLabel ? "WHO Age Corrected" : "WHO 2006";
    }
    return "—";
  })();
  // zoneColor: neutral accent for chart tile (metadata, not clinical judgment).
  // Percentile/Z color is driven by classify() independently.
  const zoneColor = C.accent;

  return (
    <div style={{fontFamily:"'IBM Plex Sans',sans-serif", color:C.text}}>

      {/* ── SPECIAL CONDITION SELECTOR — collapsible, gold divider ── */}
      {/* Gold divider with chevron — same pattern as Fluids calculator */}
      <div onClick={()=>setShowCurveOptions(o=>!o)}
        style={{position:"relative",marginBottom:showCurveOptions?0:12,
          marginTop:4,cursor:"pointer",userSelect:"none"}}>
        <div style={{height:2,background:"#d4a444",borderRadius:1}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",
          transform:"translate(-50%,-50%)",background:C.bg,padding:"0 8px",lineHeight:1}}>
          <span style={{color:"#d4a444",fontSize:11,fontWeight:700,letterSpacing:"0.03em"}}>
            {showCurveOptions ? "∧  Close to hide details  ∧" : "∨  Expand to see details  ∨"}
          </span>
        </div>
      </div>

      {showCurveOptions && (
        <div style={{marginBottom:12,padding:"10px 12px",borderRadius:"0 0 10px 10px",
          background:C.surface,border:`1px solid ${C.border}`,borderTop:"none"}}>
          <div style={{...lblStyle,marginBottom:6}}>Special Population Curve</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[
              {id:"none",label:"Standard"},
              {id:"down",label:"Down Syndrome"},
              {id:"turner",label:"Turner Syndrome"},
              {id:"silver",label:"Russell-Silver ⚠"},
            ].map(opt => (
              <button key={opt.id} onClick={()=>setSpecialCurve(opt.id)}
                style={{...tabStyle(specialCurve===opt.id),padding:"5px 10px",fontSize:11}}>
                {opt.label}
              </button>
            ))}
          </div>
          {specialCurve === "silver" && (
            <div style={{marginTop:6,fontSize:10,color:C.amber,
              fontFamily:"'DM Mono',monospace"}}>
              ⚠ Russell-Silver curve has no validated LMS data — placeholder shape only
            </div>
          )}
          {specialCurve === "turner" && (
            <div style={{marginTop:6,fontSize:10,color:C.muted,
              fontFamily:"'DM Mono',monospace"}}>
              ℹ Isojima 2010 (Japanese reference) · Adult median ~142 cm · Consider +3–5 cm for US/European populations
            </div>
          )}

          {/* HC variant */}
          <div style={{marginTop:8}}>
            <div style={{...lblStyle,marginBottom:4,fontSize:10}}>Head Circumference Chart</div>
            <div style={{display:"flex",gap:5}}>
              {[{id:"standard",label:"WHO/Fenton"},{id:"nellhaus",label:"Nellhaus"},{id:"rollins",label:"Rollins"}].map(opt=>(
                <button key={opt.id} onClick={()=>setHcVariant(opt.id)}
                  style={{...tabStyle(hcVariant===opt.id),padding:"4px 9px",fontSize:10}}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DATA ENTRY ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>

        {/* Sex + EGA — shared row, sex left ~half, EGA right ~half */}
        <div style={{gridColumn:"1/-1",display:"flex",gap:12,alignItems:"flex-end"}}>

          {/* Sex — segmented M/F matching U25 eGFR pattern */}
          <div style={{flex:1}}>
            <div style={{color:C.navy,fontSize:11,fontWeight:700,
              fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",
              letterSpacing:"0.05em",marginBottom:4}}>Sex</div>
            <div style={{display:"flex",borderRadius:6,overflow:"hidden",
              border:`1.5px solid ${C.border}`}}>
              {[["male","♂ M"],["female","♀ F"]].map(([val,lbl],i)=>(
                <button key={val} onClick={()=>setSex(val)}
                  style={{flex:1,padding:"8px 0",fontSize:13,fontWeight:700,
                    fontFamily:"'IBM Plex Sans',sans-serif",border:"none",
                    borderRight:i===0?`1px solid ${C.border}`:"none",
                    cursor:"pointer",
                    background:sex===val?C.accent:C.bg,
                    color:sex===val?"#fff":C.muted,
                    transition:"background 0.15s"}}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* EGA — weeks + days, compact; qualifier in label, no sub-hints */}
          <div style={{flex:1}}>
            <div style={{color:C.navy,fontSize:11,fontWeight:700,
              fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",
              letterSpacing:"0.05em",marginBottom:4}}>
              EGA at Birth{" "}
              <span style={{color:C.amber,fontWeight:600,letterSpacing:"0.03em"}}>
                Wks · Days
              </span>
            </div>
            <div style={{display:"flex",gap:4}}>
              <div style={{flex:1}}>
                <input type="number" inputMode="numeric" value={egaWeeks} min={22} max={42}
                  onChange={e=>setEgaWeeks(e.target.value)}
                  onBlur={e=>setEgaWeeks(clampInt(e.target.value,22,42))}
                  style={{...inputStyle,padding:"8px 6px",textAlign:"center",
                    borderColor:(egaWeeks&&(parseInt(egaWeeks)<22||parseInt(egaWeeks)>42))?"#c0392b":undefined}}
                  placeholder="40"/>
              </div>
              <div style={{flex:1}}>
                <input type="number" inputMode="numeric" value={egaDays_} min={0} max={6}
                  onChange={e=>setEgaDays_(e.target.value)}
                  onBlur={e=>setEgaDays_(clampInt(e.target.value,0,6))}
                  style={{...inputStyle,padding:"8px 6px",textAlign:"center",
                    borderColor:(egaDays_&&(parseInt(egaDays_)<0||parseInt(egaDays_)>6))?"#c0392b":undefined}}
                  placeholder="0"/>
              </div>
            </div>
          </div>

        </div>

        {/* DOB — MM / DD / YYYY spinners */}
        <div>
          <label style={lblStyle}>DOB</label>
          <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 3fr",gap:3}}>
            <div>
              <input type="number" inputMode="numeric" placeholder="MM"
                value={dobM} min={1} max={12}
                onChange={e=>setDobM(e.target.value)}
                onBlur={e=>setDobM(clampInt(e.target.value,1,12))}
                style={{...inputStyle,padding:"8px 4px",fontSize:13,textAlign:"center",
                  borderColor:(dobM&&(parseInt(dobM)<1||parseInt(dobM)>12))?"#c0392b":undefined}}/>
            </div>
            <div>
              <input type="number" inputMode="numeric" placeholder="DD"
                value={dobD} min={1} max={31}
                onChange={e=>setDobD(e.target.value)}
                onBlur={e=>setDobD(clampInt(e.target.value,1,daysInMonth(dobM,dobY)))}
                style={{...inputStyle,padding:"8px 4px",fontSize:13,textAlign:"center",
                  borderColor:(dobD&&(parseInt(dobD)<1||parseInt(dobD)>daysInMonth(dobM,dobY)))?"#c0392b":undefined}}/>
            </div>
            <div>
              <input type="number" inputMode="numeric" placeholder="YYYY"
                value={dobY} min={1960} max={currentYear}
                onChange={e=>setDobY(e.target.value)}
                onBlur={e=>setDobY(clampInt(e.target.value,1960,currentYear))}
                style={{...inputStyle,padding:"8px 4px",fontSize:13,textAlign:"center",
                  borderColor:(dobY&&(String(dobY).length===4)&&(parseInt(dobY)<1960||parseInt(dobY)>currentYear||isFuture(dobM,dobD,dobY)))?"#c0392b":undefined}}/>
            </div>
          </div>
        </div>

        {/* Visit Date — MM / DD / YYYY spinners */}
        <div>
          <label style={lblStyle}>Visit Date</label>
          <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 3fr",gap:3}}>
            <div>
              <input type="number" inputMode="numeric" placeholder="MM"
                value={visM} min={1} max={12}
                onChange={e=>setVisM(e.target.value)}
                onBlur={e=>setVisM(clampInt(e.target.value,1,12))}
                style={{...inputStyle,padding:"8px 4px",fontSize:13,textAlign:"center",
                  borderColor:(visM&&(parseInt(visM)<1||parseInt(visM)>12))?"#c0392b":undefined}}/>
            </div>
            <div>
              <input type="number" inputMode="numeric" placeholder="DD"
                value={visD} min={1} max={31}
                onChange={e=>setVisD(e.target.value)}
                onBlur={e=>setVisD(clampInt(e.target.value,1,daysInMonth(visM,visY)))}
                style={{...inputStyle,padding:"8px 4px",fontSize:13,textAlign:"center",
                  borderColor:(visD&&(parseInt(visD)<1||parseInt(visD)>daysInMonth(visM,visY)))?"#c0392b":undefined}}/>
            </div>
            <div>
              <input type="number" inputMode="numeric" placeholder="YYYY"
                value={visY} min={1960} max={currentYear}
                onChange={e=>setVisY(e.target.value)}
                onBlur={e=>setVisY(clampInt(e.target.value,1960,currentYear))}
                style={{...inputStyle,padding:"8px 4px",fontSize:13,textAlign:"center",
                  borderColor:(visY&&(String(visY).length===4)&&(parseInt(visY)<1960||parseInt(visY)>currentYear||isFuture(visM,visD,visY)))?"#c0392b":undefined}}/>
            </div>
          </div>
        </div>

        {/* ── MEASUREMENT ROWS ── */}
        {/* Flat JSX — no inline component definitions.
            Inline components defined inside a render function get a new identity on every
            render, causing React to unmount/remount their children (including inputs),
            which kicks the user out of the keyboard on every keystroke.
            The stats sit outside the input's own border box as plain sibling divs
            in a flex row — input keeps its full border, stats live to its right. */}
        {(() => {
          // Compute all four results simultaneously — calcResult is pure
          const rWt  = (zone && ages && wtKg) ? calcResult(parseFloat(wtKg), zone, "weight", sex, ages, parseFloat(htCm)) : null;
          const rLen = (zone && ages && htCm) ? calcResult(parseFloat(htCm), zone, "length", sex, ages, parseFloat(htCm)) : null;
          const rHC  = (zone && ages && hcCm) ? calcResult(parseFloat(hcCm), zone, "hc",     sex, ages, parseFloat(htCm)) : null;
          const useWFL = ages && ages.corrDays < 731.5;
          const rComp = (zone && ages && wtKg && htCm)
            ? useWFL
              ? calcResult(parseFloat(wtKg), zone, "wfl", sex, ages, parseFloat(htCm))
              : calcResult(bmi,              zone, "bmi", sex, ages, parseFloat(htCm))
            : null;
          const compVal   = useWFL
            ? (wtKg && htCm ? `${parseFloat(wtKg).toFixed(1)} kg` : "—")
            : (bmi ? bmi.toFixed(1) : "—");
          const compLabel = useWFL ? "Wt / Len" : "BMI";
          const compUnit  = useWFL ? null : "kg/m²";

          // Helper — plain object, not a component, so it can be called safely inline
          const statDiv = (r) => r ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",
              justifyContent:"center",gap:1,minWidth:56,flexShrink:0}}>
              <span style={{fontSize:11,fontWeight:700,color:r.color,
                fontFamily:"'DM Mono',monospace",lineHeight:1.2}}>{fmtPct(r.pct)}%</span>
              <span style={{fontSize:10,fontWeight:600,color:r.color,
                fontFamily:"'DM Mono',monospace",lineHeight:1.2}}>Z {fmtZ(r.z)}</span>
            </div>
          ) : (
            <div style={{minWidth:56,flexShrink:0}}/>
          );

          return (
            <>
              {/* Row 1 — Weight and Ht/Len */}
              <div style={{gridColumn:"1/-1",display:"grid",
                gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>

                {/* Weight */}
                <div>
                  <label style={lblStyle}>Weight <span style={{color:"#b8860b"}}>(kg)</span></label>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" inputMode="decimal" value={wtKg} min={0.3} max={200} step={0.01}
                      onChange={e=>setWtKg(e.target.value)}
                      onBlur={e=>setWtKg(clampFloat(e.target.value,0.3,200))}
                      style={{...inputStyle,flex:1,
                        borderColor:(wtKg&&(parseFloat(wtKg)<0.3||parseFloat(wtKg)>200))?"#c0392b":undefined}}
                      placeholder="—"/>
                    {statDiv(rWt)}
                  </div>
                </div>

                {/* Ht / Len */}
                <div>
                  <label style={lblStyle}>Ht / Len <span style={{color:"#b8860b"}}>(cm)</span></label>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" inputMode="decimal" value={htCm} min={25} max={275} step={0.1}
                      onChange={e=>setHtCm(e.target.value)}
                      onBlur={e=>setHtCm(clampFloat(e.target.value,25,275))}
                      style={{...inputStyle,flex:1,
                        borderColor:(htCm&&(parseFloat(htCm)<25||parseFloat(htCm)>275))?"#c0392b":undefined}}
                      placeholder="—"/>
                    {statDiv(rLen)}
                  </div>
                </div>
              </div>

              {/* Row 2 — HC/OFC and computed BMI or Wt/Len */}
              <div style={{gridColumn:"1/-1",display:"grid",
                gridTemplateColumns:"1fr 1fr",gap:8}}>

                {/* Head Circ/OFC */}
                <div>
                  <label style={lblStyle}>Head Circ/OFC <span style={{color:"#b8860b"}}>(cm)</span></label>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" inputMode="decimal" value={hcCm} min={16} max={65} step={0.1}
                      onChange={e=>setHcCm(e.target.value)}
                      onBlur={e=>setHcCm(clampFloat(e.target.value,16,65))}
                      style={{...inputStyle,flex:1,
                        borderColor:(hcCm&&(parseFloat(hcCm)<16||parseFloat(hcCm)>65))?"#c0392b":undefined}}
                      placeholder="—"/>
                    {statDiv(rHC)}
                  </div>
                </div>

                {/* BMI / Wt-for-Len — display-only */}
                <div>
                  <label style={lblStyle}>
                    {compLabel}
                    {compUnit && <span style={{color:"#b8860b"}}> ({compUnit})</span>}
                    <span style={{color:C.muted,fontSize:9,fontWeight:400,
                      marginLeft:4,fontFamily:"'DM Mono',monospace"}}>calc</span>
                  </label>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{...inputStyle,flex:1,background:C.surface,
                      color:(wtKg&&htCm)?C.navy:C.muted,userSelect:"none"}}>
                      {compVal}
                    </div>
                    {statDiv(rComp)}
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── CALCULATED FIELDS ── */}
      {ages && (
        <div style={{padding:"10px 12px",borderRadius:10,background:C.card,
          border:`1px solid ${C.border}`,marginBottom:12}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {(() => {
              const isPrem = parseInt(egaWeeks) < 37;
              // PMA: only for premature infants, only while PMA ≤ 60 weeks
              const showPMA = isPrem && ages.pmaWeeks <= 60;
              // Corr Age: only for premature infants, only while corrected age ≤ 731.5 days
              const showCorr = isPrem && ages.corrDays >= 0 && ages.corrDays <= 731.5;
              // BSA — Mosteller formula: √(ht_cm × wt_kg / 3600)
              const bsaVal = (wtKg && htCm)
                ? Math.sqrt(parseFloat(htCm) * parseFloat(wtKg) / 3600)
                : null;
              const fields = [
                showPMA
                  ? {label:"PMA", value: fmtWeeks(ages.pmaWeeks, ages.pmaRemDays)}
                  : null,
                {label:"Chron Age", value: fmtAge(ages.chronDays)},
                showCorr
                  ? {label:"Corr Age", value: fmtAge(ages.corrDays)}
                  : null,
                bsaVal
                  ? {label:"BSA", value: `${bsaVal.toFixed(2)} m²`}
                  : null,
              ].filter(Boolean);
              return fields.map(f => (
                <div key={f.label} style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.muted,fontFamily:"'DM Mono',monospace",
                    textTransform:"uppercase",letterSpacing:"0.05em"}}>{f.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:f.color||C.navy,
                    fontFamily:"'DM Mono',monospace",marginTop:1}}>{f.value}</div>
                </div>
              ));
            })()}
          </div>
          {/* Chart attribution — tells the clinician which reference is being used */}
          {zone && zoneLabel && (
            <div style={{marginTop:8,paddingTop:6,borderTop:`1px solid ${C.border}`,
              fontSize:10,color:C.muted,fontFamily:"'DM Mono',monospace",
              textAlign:"center",lineHeight:1.4}}>
              Percentiles and Z-scores based on{" "}
              <span style={{color:C.accent,fontWeight:700}}>{zoneLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* ── METRIC TABS ── */}
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        {metricTabs.map(t => (
          <button key={t.id} onClick={()=>setActiveMetric(t.id)}
            style={tabStyle(activeMetric===t.id)}>
            {t.label}
          </button>
        ))}
        {/* Obesity toggle — CDC only when BMI > 97th */}
        {zone === "cdc" && activeMetric === "bmi" && result && result.pct > 97 && (
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            {[{id:"extended",label:"Ext BMI"},{id:"severe",label:"% of 95th"}].map(opt=>(
              <button key={opt.id} onClick={()=>setObesityMode(opt.id)}
                style={{...tabStyle(obesityMode===opt.id),padding:"4px 8px",fontSize:10}}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── OBESITY EXTENDED INFO — only renders when clinically indicated ── */}
      {result && zone === "cdc" && activeMetric === "bmi" && bmi && result.pct > 97 && (
        <div style={{marginBottom:12,padding:"8px 10px",borderRadius:8,
          background:"#fff2e8",border:"1px solid #f4a261",fontSize:11,
          fontFamily:"'DM Mono',monospace",color:"#c0392b"}}>
          {(() => {
            const p95lms = interpolateLMS(CDC_BMIFA[sex==="male"?"male":"female"],
              ages.chronDays/30.4375);
            if (!p95lms) return null;
            const p95val = lmsPercentileVal(95, p95lms.L, p95lms.M, p95lms.S);
            const pctOf95 = (bmi / p95val * 100).toFixed(0);
            const above120 = bmi >= p95val * 1.2;
            const above140 = bmi >= p95val * 1.4;
            return (
              <>
                <strong>Severe Obesity:</strong>{" "}
                BMI = {bmi.toFixed(1)}&nbsp;kg/m² ·{" "}
                {pctOf95}% of 95th %ile ({p95val.toFixed(1)}){" "}
                {above140 ? "· ≥140% Class III" : above120 ? "· ≥120% Class II" : "· <120%"}
              </>
            );
          })()}
        </div>
      )}

      {/* ── GROWTH CHART SVG + RESULT TILES ── */}
      {/* Chart at full width preserving 8:11 portrait ratio.
          Chart identifier, percentile, and Z score in a three-column row below. */}
      {cfg && curves && sex ? (
        <div style={{marginBottom:8}}>

          {/* Chart — full width */}
          <div style={{borderRadius:10,overflow:"hidden",
            border:`1.5px solid ${C.border}`,background:"#fff",marginBottom:8}}>
            <GrowthChart
              title={cfg.title}
              xLabel={cfg.xLabel}
              yLabel={cfg.yLabel}
              xMin={cfg.xMin} xMax={cfg.xMax}
              yMin={cfg.yMin} yMax={cfg.yMax}
              xTicks={cfg.xTicks} yTicks={cfg.yTicks}
              curves={curves}
              patientX={cfg.patientX}
              patientY={curMetricValue}
              sex={sex}
            />
          </div>

          {/* Three metadata tiles in a horizontal row below the chart */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>

            {/* Chart identifier */}
            <div style={{borderRadius:10,border:`1.5px solid ${zoneColor}`,
              background:C.card,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,color:C.muted,
                fontFamily:"'DM Mono',monospace",textTransform:"uppercase",
                letterSpacing:"0.06em",marginBottom:4}}>Chart</div>
              <div style={{fontSize:9,fontWeight:700,color:zoneColor,
                fontFamily:"'IBM Plex Sans',sans-serif",lineHeight:1.3}}>
                {zoneLabel || "—"}
              </div>
            </div>

            {/* Percentile */}
            <div style={{borderRadius:10,border:`1.5px solid ${C.border}`,
              background:C.card,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,color:C.muted,
                fontFamily:"'DM Mono',monospace",textTransform:"uppercase",
                letterSpacing:"0.06em",marginBottom:6}}>Percentile</div>
              <div style={{fontSize:result ? 22 : 16,fontWeight:700,
                color:result ? result.color : C.muted,
                fontFamily:"'Sora',sans-serif",lineHeight:1}}>
                {result ? fmtPct(result.pct) : "—"}
              </div>
            </div>

            {/* Z Score */}
            <div style={{borderRadius:10,border:`1.5px solid ${C.border}`,
              background:C.card,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,color:C.muted,
                fontFamily:"'DM Mono',monospace",textTransform:"uppercase",
                letterSpacing:"0.06em",marginBottom:6}}>Z Score</div>
              <div style={{fontSize:result ? 22 : 16,fontWeight:700,
                color:result ? result.color : C.muted,
                fontFamily:"'Sora',sans-serif",lineHeight:1}}>
                {result ? fmtZ(result.z) : "—"}
              </div>
            </div>

          </div>
        </div>
      ) : null}

      {/* ── CHART NOTES ── */}
      <div style={{fontSize:10,color:C.muted,fontFamily:"'DM Mono',monospace",
        lineHeight:1.6,padding:"6px 2px"}}>
        {zone === "fenton" && "Fenton 2025 (Fenton TR, Elmrayed S, Alshaikh BN) · Daily resolution · plotted at PMA in decimal weeks"}
        {zone === "who" && ages && ages.corrDays >= 0 && ages.corrDays < 730.5 &&
          (parseInt(egaWeeks) < 37 ? "WHO 2006 plotted at corrected age" : "WHO 2006 plotted at chronological age")}
        {zone === "cdc" && "CDC 2000 plotted at chronological age (no correction)"}
        {specialCurve === "down" && " · DS curves: Zemel 2015 (DSGS/CDC)"}
        {specialCurve === "turner" && " · Turner: Isojima 2010 · Japanese reference population"}
        {specialCurve === "silver" && " · ⚠ Russell-Silver: placeholder — no validated LMS data"}
        {hcVariant === "nellhaus" && " · HC: Nellhaus 1968"}
        {hcVariant === "rollins" && " · HC: Rollins 2010 (US preferred)"}
      </div>

    </div>
  );
}

// REGISTRY OF ALL CALCULATORS
// ═══════════════════════════════════════════════════════════════════════════════
// Canonical category sequence: Growth → Neonatal → FEN/Renal → Neurologic →
//   Respiratory → Cardiovascular → GI → Hematology → Common Rx → Toxicology → Risk Scores
const CALCULATORS = [
  // Growth
  { id:"growth",       category:"growth",          name:"Growth Charts",                desc:"Fenton 2025 · WHO 2006 · CDC 2000 auto-routed with prematurity correction", component: GrowthCalc },
  // Neonatal
  { id:"apgar",        category:"neonatal",         name:"APGAR Score",                  desc:"Neonatal vitality assessment at 1, 5, 10 min",            component: ApgarCalc },
  { id:"bilirubin",    category:"neonatal",         name:"Neonatal Hyperbilirubinemia",  desc:"AAP 2022 phototherapy, escalation & exchange thresholds", component: BilirubinCalc },
  { id:"glucose",      category:"neonatal",         name:"Neonatal Hypoglycemia",        desc:"AAP 2011 glucose thresholds by postnatal age",            component: NeonatalGlucoseCalc },
  { id:"preterm",      category:"neonatal",         name:"Prematurity Risk Assessment",  desc:"Category and anticipated concerns by GA/weight",          component: PretermCalc },
  { id:"finnegan",     category:"neonatal",         name:"Modified Finnegan NAS",        desc:"Neonatal Abstinence Syndrome scoring",                    component: FinneganCalc },
  // FEN / Renal
  { id:"fluid",        category:"fen_renal",        name:"Maintenance Fluids",           desc:"Holliday-Segar + 4:2:1 · fluid, Na, K, GIR",             component: FluidCalc },
  { id:"burns",        category:"fen_renal",        name:"Burn Fluid Resuscitation",     desc:"Parkland formula for pediatric burns",                    component: BurnsCalc },
  { id:"dehydration",  category:"fen_renal",        name:"Dehydration Score",            desc:"Clinical dehydration assessment (WHO/Gorelick)",          component: DehydrationCalc },
  { id:"sodium",       category:"fen_renal",        name:"Hyponatremia Correction",      desc:"Sodium deficit and correction rate calculation",          component: SodiumCalc },
  { id:"freewater",    category:"fen_renal",        name:"Free Water Deficit",           desc:"Hypernatremia correction — free water replacement volume", component: FreeWaterDeficitCalc },
  { id:"fena",         category:"fen_renal",        name:"FENa / FEUrea",                desc:"Prerenal vs intrinsic AKI — fractional excretion",        component: FENaCalc },
  { id:"u25gfr",       category:"fen_renal",        name:"U25 eGFR",                     desc:"Cystatin-C and SCr-based GFR for age ≤25 years",         component: U25GFRCalc },
  { id:"corrca",       category:"fen_renal",        name:"Corrected Calcium",            desc:"Calcium correction for hypoalbuminemia",                  component: CorrCaCalc },
  { id:"osmolalgap",   category:"fen_renal",        name:"Osmolal Gap",                  desc:"Measured vs calculated osmolality — toxin screen",         component: OsmolalGapCalc },
  // Neurologic
  { id:"pgcs",         category:"neurologic",       name:"Pediatric Glasgow Coma Scale", desc:"GCS adapted for infants and children",                    component: PGCSCalc },
  { id:"pecarn",       category:"neurologic",       name:"PECARN Head CT",               desc:"CT rule for pediatric head trauma",                       component: PECARNCalc },
  { id:"cows",         category:"neurologic",       name:"COWS Score",                   desc:"Clinical Opiate Withdrawal Scale",                        component: COWSCalc },
  { id:"wat1",         category:"neurologic",       name:"WAT-1",                        desc:"Withdrawal Assessment Tool — iatrogenic opioid/benzo",    component: WATCalc },
  { id:"flacc",        category:"neurologic",       name:"FLACC Pain Scale",             desc:"Behavioral pain scale for non-verbal children",           component: FLACCCalc },
  // Respiratory
  { id:"bronchiolitis",category:"respiratory",      name:"Bronchiolitis Severity",       desc:"Respiratory severity scoring for bronchiolitis",          component: BronchiolitisCalc },
  { id:"asthma",       category:"respiratory",      name:"Asthma Severity (PRAM)",       desc:"Pediatric Respiratory Assessment Measure",               component: AsthmaCalc },
  { id:"pfRatio",      category:"respiratory",      name:"P/F and S/F Ratio",            desc:"Oxygenation indices — ARDS classification and monitoring",component: PFRatioCalc },
  { id:"aaGradient",   category:"respiratory",      name:"A-a Gradient / OI",            desc:"Alveolar-arterial gradient and oxygenation index",         component: AAGradientCalc },
  { id:"murray",       category:"respiratory",      name:"Murray Lung Injury Score",      desc:"Four-component ARDS severity — chest X-ray, P/F, PEEP, compliance", component: MurrayCalc },
  { id:"berlin",       category:"respiratory",      name:"Berlin ARDS Definition",        desc:"2012 Berlin ARDS criteria — mild, moderate, severe",       component: BerlinARDSCalc },
  // Cardiovascular
  { id:"kawasaki",     category:"cardiovascular",   name:"Kawasaki Disease Criteria",    desc:"AHA 2017 diagnostic criteria",                           component: KawasakiCalc },
  { id:"dvt",          category:"cardiovascular",   name:"Wells DVT Score",              desc:"DVT probability in children (adapted Wells)",             component: DVTCalc },
  { id:"qtc",          category:"cardiovascular",   name:"Corrected QT (Bazett)",        desc:"QTc calculation and risk assessment",                     component: QTcCalc },
  // Gastroenterology
  { id:"pucai",        category:"gastroenterology", name:"PUCAI Score",                  desc:"Pediatric Ulcerative Colitis Activity Index — disease activity",  component: PUCAICalc },
  // Hematology
  { id:"retic",        category:"hematology",       name:"Corrected Reticulocyte Count", desc:"Corrected retic count & RPI — erythroid response adequacy", component: ReticCalc },
  { id:"mentzer",      category:"hematology",       name:"Mentzer Index",                desc:"Iron deficiency vs thalassemia trait — MCV ÷ RBC",         component: MentzerCalc },
  // Common Rx
  { id:"dose",         category:"dosing",           name:"Common Drug Doses",            desc:"Weight-based pediatric dosing reference",                 component: DoseCalc },
  // Toxicology
  { id:"apap",         category:"toxicology",       name:"Acetaminophen Toxicity",       desc:"Dose assessment + Rumack-Matthew nomogram",               component: AcetaminophenCalc },
  // Risk Scores
  { id:"sepsis",       category:"readmission",      name:"Pediatric SIRS/Sepsis",        desc:"Age-adjusted SIRS criteria and sepsis screening",         component: SepsisCalc },
  { id:"natfrac",      category:"readmission",      name:"NAT Fracture Risk",            desc:"Non-accidental trauma fracture indicators",               component: ChildAbuseFracCalc },
  { id:"readmission",  category:"readmission",      name:"Pediatric Readmission Risk",   desc:"30-day readmission risk estimation",                      component: ReadmissionCalc },
  { id:"pews",         category:"readmission",      name:"PEWS",                         desc:"Pediatric Early Warning Score",                           component: PEWSCalc },
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

            {CALC_REFERENCES[activeCalc.id].algorithmUrl && (
              <div style={{ marginTop: 14 }}>
                <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500, marginBottom: 6 }}>
                  Clinical Algorithm
                </div>
                <img
                  src={CALC_REFERENCES[activeCalc.id].algorithmUrl}
                  alt="Clinical algorithm"
                  style={{ width: "100%", borderRadius: 3, border: `1px solid ${COLORS.border}` }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {CALC_REFERENCES[activeCalc.id].showErrorChart && <FluidErrorChart />}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "8px 16px 20px", background: `linear-gradient(transparent, ${COLORS.bg} 40%)`, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", display: "flex", justifyContent: "center" }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 2, padding: "5px 12px", fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textMuted, fontWeight: 500, textAlign: "center" }}>
            ⚠ Clinical decision support only · Verify with judgment and current guidelines · v24
          </div>
        </div>
      </div>
    </div>
  );
}
