export const CATEGORIES = [
  { key: "Construction", short: "CNST" },
  { key: "Modification", short: "MOD" },
  { key: "Major Work", short: "MJR" },
  { key: "Minor Work", short: "MNR" },
  { key: "Mobilization", short: "MOB" },
  { key: "Other Small Works", short: "OSW" },
];

export const CHECKLISTS = {
  Construction: [
    "Title deed copy",
    "Owner Emirates ID / passport",
    "Architectural drawings (plans, elevations, sections)",
    "Structural calculations (signed & stamped)",
    "Building Permit Application",
    "Soil investigation report",
    "Additional GFA application (if applicable)",
  ],
  Modification: [
    "Modifications Permit application",
    "NOC for Modifications",
    "Before vs after drawings",
    "Owner Emirates ID / passport",
  ],
  "Major Work": [
    "Title deed copy",
    "Detailed renovation / extension plans",
    "Structural calculations",
    "Soil investigation report",
    "Structural Stability Report",
    "Security deposit receipt",
  ],
  "Minor Work": ["NOC application", "Layout / landscape drawing", "EHOS approval (if landscaping)"],
  Mobilization: [
    "Contractor registration confirmation",
    "Trade license copy",
    "Insurance certificate",
    "Method statement",
  ],
  "Other Small Works": ["Daily / short-term access pass application", "Gate pass request"],
};

export const AUTHORITIES = ["Meydan", "Nakheel", "Dubai Holding (DCM)", "Dubai Municipality", "Trakhees", "DEWA"];
export const PHASES = ["Phase 1", "Phase 2", "Phase 3A", "Phase 3B", "Other"];
export const STATUSES = ["Pending", "Submitted", "Under Review", "Approved", "In Progress", "Completed", "Rejected"];

export const STATUS_COLOR = {
  Pending: "var(--amber)",
  Submitted: "var(--cyan)",
  "Under Review": "var(--cyan)",
  Approved: "var(--green)",
  "In Progress": "var(--amber)",
  Completed: "var(--green)",
  Rejected: "var(--red)",
};

export function docsProgress(documents) {
  const items = Object.values(documents || {});
  const done = items.filter(Boolean).length;
  return { done, total: items.length };
}

export function emptyDocuments(category) {
  const list = CHECKLISTS[category] || [];
  return Object.fromEntries(list.map((d) => [d, false]));
    }
