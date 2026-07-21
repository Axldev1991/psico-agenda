import { Patient } from "./patient.types";

/**
 * Calculates a patient's age in years based on their YYYY-MM-DD birthdate string.
 */
export function calculateAge(birthDateString: string, todayOverride?: Date): number {
  const birth = new Date(birthDateString);
  const today = todayOverride || new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Sorts patients alphabetically by their full name (A-Z).
 */
export function sortPatientsAlphabetically(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => a.fullName.localeCompare(b.fullName));
}
