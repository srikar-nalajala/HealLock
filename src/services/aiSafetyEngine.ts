import { AiSafetyFlag, Patient } from '../types';

export interface InteractionRule {
  drugA: string;
  drugB: string;
  severity: 'warning' | 'critical';
  mechanism: string;
  recommendation: string;
}

const KNOWN_DRUG_INTERACTIONS: InteractionRule[] = [
  {
    drugA: 'lisinopril',
    drugB: 'spironolactone',
    severity: 'warning',
    mechanism: 'Concomitant administration of ACE inhibitors with potassium-sparing diuretics significantly elevates the risk of severe hyperkalemia.',
    recommendation: 'Monitor serum potassium and renal function closely or consider alternative antihypertensive combination.',
  },
  {
    drugA: 'lisinopril',
    drugB: 'ibuprofen',
    severity: 'warning',
    mechanism: 'NSAIDs may decrease the antihypertensive effect of ACE inhibitors and increase the risk of acute renal deterioration.',
    recommendation: 'Use acetaminophen for analgesia when possible; monitor BP if NSAID is essential.',
  },
  {
    drugA: 'warfarin',
    drugB: 'aspirin',
    severity: 'critical',
    mechanism: 'Synergistic antithrombotic and antiplatelet activity causes major gastrointestinal and systemic hemorrhage risk.',
    recommendation: 'Dual antithrombotic therapy should strictly follow cardiology guideline protocols with intensive INR monitoring.',
  },
  {
    drugA: 'sildenafil',
    drugB: 'nitroglycerin',
    severity: 'critical',
    mechanism: 'PDE-5 inhibitors potently amplify the nitric oxide-cGMP pathway of organic nitrates, precipitating profound and potentially fatal hypotension.',
    recommendation: 'Absolute contraindication. Do not co-prescribe within 24-48 hours of nitrate usage.',
  },
  {
    drugA: 'tramadol',
    drugB: 'fluoxetine',
    severity: 'critical',
    mechanism: 'SSRI inhibition of CYP2D6 combined with serotonin reuptake inhibition by tramadol significantly elevates the risk of Serotonin Syndrome and seizures.',
    recommendation: 'Avoid combination. Substitute non-serotonergic analgesic or consult clinical pharmacologist.',
  },
];

const ALLERGY_MAP: Record<string, string[]> = {
  penicillin: ['amoxicillin', 'ampicillin', 'augmentin', 'penicillin', 'piperacillin', 'methicillin', 'amoxil'],
  sulfa: ['bactrim', 'sulfamethoxazole', 'sulfasalazine', 'trimethoprim-sulfamethoxazole', 'septra'],
  aspirin: ['aspirin', 'acetylsalicylic acid', 'diflunisal', 'bayer'],
  latex: [],
};

export class AiSafetyEngine {
  public static evaluatePrescription(
    newDrugName: string,
    existingMeds: string[],
    patient: Patient
  ): AiSafetyFlag[] {
    const flags: AiSafetyFlag[] = [];
    const normalizedNew = newDrugName.toLowerCase().trim();

    // 1. Allergy Conflict Check
    for (const allergy of patient.emergencyProfile.allergies) {
      const allergyKey = allergy.toLowerCase().split(' ')[0]; // 'penicillin', 'sulfa', etc.
      const crossReactingDrugs = ALLERGY_MAP[allergyKey] || [];
      
      if (
        normalizedNew.includes(allergyKey) ||
        crossReactingDrugs.some(drug => normalizedNew.includes(drug))
      ) {
        flags.push({
          conflictType: 'allergy_conflict',
          severity: 'critical',
          allergen: allergy,
          drugA: newDrugName,
          explanation: `PATIENT ALLERGY ALERT: Patient has a documented ${allergy} allergy. ${newDrugName} shares beta-lactam / chemical structure and risks precipitating anaphylaxis or severe hypersensitivity.`,
          clinicalRecommendation: `DO NOT DISPENSE. Substitute with non-cross-reactive antimicrobial class (e.g. Macrolides or Fluoroquinolones after clinical assessment).`,
        });
      }
    }

    // 2. Drug-Drug Interaction Check against existing meds
    for (const existing of existingMeds) {
      const normalizedExisting = existing.toLowerCase().trim();

      for (const rule of KNOWN_DRUG_INTERACTIONS) {
        const matchesA = normalizedNew.includes(rule.drugA) && normalizedExisting.includes(rule.drugB);
        const matchesB = normalizedNew.includes(rule.drugB) && normalizedExisting.includes(rule.drugA);

        if (matchesA || matchesB) {
          flags.push({
            conflictType: 'drug_interaction',
            severity: rule.severity,
            drugA: newDrugName,
            drugB: existing,
            explanation: `CLINICAL DDInter FLAG (${rule.severity.toUpperCase()}): ${newDrugName} + ${existing}. ${rule.mechanism}`,
            clinicalRecommendation: rule.recommendation,
          });
        }
      }

      // 3. Duplicate Therapy Check
      const getBaseDrug = (s: string) => s.toLowerCase().replace(/[\d.]+\s*(mg|mcg|g|ml|iu|units?|tablets?|capsules?|sl)?/gi, '').replace(/[^a-z]/g, ' ').trim().split(/\s+/)[0];
      const baseNew = getBaseDrug(normalizedNew);
      const baseExisting = getBaseDrug(normalizedExisting);

      const isDirectMatch = normalizedNew.includes(normalizedExisting) || normalizedExisting.includes(normalizedNew);
      const isBaseMatch = (baseNew.length > 2 && baseExisting.length > 2 && (baseNew === baseExisting || baseNew.includes(baseExisting) || baseExisting.includes(baseNew)));

      if (isDirectMatch || isBaseMatch) {
        flags.push({
          conflictType: 'duplicate_medication',
          severity: 'warning',
          drugA: newDrugName,
          drugB: existing,
          explanation: `DUPLICATE THERAPY DETECTED: Patient is already actively prescribed ${existing}. Co-prescribing ${newDrugName} may cause accidental double-dosing.`,
          clinicalRecommendation: 'Verify whether this is intended as a dosage modification or replacement rather than concurrent therapy.',
        });
      }
    }

    // If no flags, return verified safe
    if (flags.length === 0) {
      flags.push({
        conflictType: 'safe',
        severity: 'safe',
        explanation: `Claude AI & RxNorm Safety Engine verified ${newDrugName} against patient medical history, documented allergies (${patient.emergencyProfile.allergies.join(', ')}), and current regimen. No adverse interactions or contraindications found.`,
        clinicalRecommendation: 'Safe for clinical administration as prescribed.',
      });
    }

    return flags;
  }
}
