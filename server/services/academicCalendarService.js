/**
 * i2A SchoolOS — Dynamic Policy-Driven Academic Calendar Engine
 * Reference: Master Prompt 08 — Educational Institution Onboarding & Governance
 */

/**
 * Calculates academic session dates dynamically based on institution category and reference date.
 * Avoids brittle hardcoded dates and respects regional Indian educational calendars.
 *
 * @param {string} category - Institution category (e.g. 'k12-schools', 'colleges-higher-ed', etc.)
 * @param {Date|string} [referenceDate] - Date to calculate session for (defaults to current date)
 * @returns {{ sessionName: string, startDate: string, endDate: string, category: string, termType: string }}
 */
export function calculateAcademicSessionPolicy(category = 'k12-schools', referenceDate = new Date()) {
  const date = new Date(referenceDate);
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1; // 1 to 12

  let startYear;
  let endYear;
  let startDate;
  let endDate;
  let termType = 'ANNUAL';

  if (category === 'colleges-higher-ed') {
    // Higher Education in India (UGC/AICTE): July 1 to June 30
    termType = 'SEMESTER';
    if (currentMonth >= 7) {
      startYear = currentYear;
      endYear = currentYear + 1;
    } else {
      startYear = currentYear - 1;
      endYear = currentYear;
    }
    startDate = `${startYear}-07-01`;
    endDate = `${endYear}-06-30`;
  } else {
    // Standard K-12 / School Groups / Coaching / Preschools: April 1 to March 31
    if (currentMonth >= 4) {
      startYear = currentYear;
      endYear = currentYear + 1;
    } else {
      startYear = currentYear - 1;
      endYear = currentYear;
    }
    startDate = `${startYear}-04-01`;
    endDate = `${endYear}-03-31`;
  }

  const sessionName = `${startYear}-${endYear}`;

  return {
    sessionName,
    startDate,
    endDate,
    category,
    termType
  };
}
