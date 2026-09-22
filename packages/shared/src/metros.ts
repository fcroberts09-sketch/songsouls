/**
 * Pilot metros. A metro is the coarsest location unit stored on an observation.
 * Never store precise GPS. H3 cells at resolution 5 (~250 km^2) are the finest we keep.
 */
export const METROS = {
  HOU: { name: 'Houston', state: 'TX', zip3: ['770', '772', '773', '774', '775', '776', '777'] },
  DFW: {
    name: 'Dallas-Fort Worth',
    state: 'TX',
    zip3: ['750', '751', '752', '753', '760', '761', '762'],
  },
  AUS: { name: 'Austin', state: 'TX', zip3: ['786', '787', '789'] },
  SAT: { name: 'San Antonio', state: 'TX', zip3: ['780', '781', '782'] },
} as const;

export type MetroCode = keyof typeof METROS;
export const METRO_CODES = Object.keys(METROS) as MetroCode[];

/** Coarse H3 resolution used for the optional cell column. Resolution 5 keeps k-anonymity workable. */
export const H3_COARSE_RESOLUTION = 5;

export function metroForZip(zip: string): MetroCode | null {
  const z3 = zip.slice(0, 3);
  for (const code of METRO_CODES) {
    if ((METROS[code].zip3 as readonly string[]).includes(z3)) return code;
  }
  return null;
}
