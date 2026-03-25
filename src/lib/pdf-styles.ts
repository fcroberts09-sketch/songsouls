/**
 * PDF Report visual constants and helpers.
 * Light-themed (white background) for print/email readability.
 */

// Page dimensions (Letter, points)
export const PAGE = {
  width: 612,
  height: 792,
  marginX: 40,
  marginTop: 40,
  marginBottom: 50,
  contentWidth: 532, // width - 2 * marginX
} as const;

// Brand colors [R, G, B]
export const COLORS = {
  brand: [37, 99, 235] as [number, number, number],       // blue-600
  brandLight: [219, 234, 254] as [number, number, number], // blue-100
  black: [15, 23, 42] as [number, number, number],         // slate-900
  dark: [51, 65, 85] as [number, number, number],          // slate-600
  muted: [100, 116, 139] as [number, number, number],      // slate-500
  light: [148, 163, 184] as [number, number, number],      // slate-400
  bg: [248, 250, 252] as [number, number, number],         // slate-50
  white: [255, 255, 255] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],        // green-600
  amber: [217, 119, 6] as [number, number, number],        // amber-600
  red: [220, 38, 38] as [number, number, number],          // red-600
  blue: [37, 99, 235] as [number, number, number],         // blue-600
} as const;

// Font sizes (pt)
export const FONT = {
  title: 24,
  h1: 16,
  h2: 13,
  body: 10,
  small: 8.5,
  tiny: 7.5,
} as const;

/**
 * Map a letter grade to a color triplet.
 */
export function gradeColor(grade: string): [number, number, number] {
  const letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return COLORS.green;
  if (letter === "B") return COLORS.blue;
  if (letter === "C") return COLORS.amber;
  return COLORS.red;
}

/**
 * Map a status to a color triplet.
 */
export function statusColor(status: string): [number, number, number] {
  if (status === "good") return COLORS.green;
  if (status === "warning") return COLORS.amber;
  return COLORS.red;
}

/**
 * Map a priority to a color triplet.
 */
export function priorityColor(priority: string): [number, number, number] {
  if (priority === "high") return COLORS.red;
  if (priority === "medium") return COLORS.amber;
  return COLORS.green;
}
