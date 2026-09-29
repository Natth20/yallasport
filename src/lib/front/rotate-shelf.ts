/** Shared official shelf: same window for every visitor, no invented rows. */

export const HALL_SLOT_MS = 8 * 60 * 1000;

export function hallSlot(now = Date.now()) {
  return Math.floor(now / HALL_SLOT_MS);
}

/** Cycle stored rows so the hall changes without shuffling randomly. */
export function rotateStart<T>(rows: T[], salt = 0): T[] {
  if (rows.length < 2) return rows;
  const start = (hallSlot() + salt) % rows.length;
  return rows.map((_, index) => rows[(start + index) % rows.length]);
}

export function rotateTake<T>(rows: T[], count: number, salt = 0): T[] {
  if (count <= 0 || rows.length === 0) return [];
  if (rows.length <= count) return rotateStart(rows, salt);
  return rotateStart(rows, salt).slice(0, count);
}

export function pinThenRotate<T>(rows: T[], match: (row: T) => boolean): T[] {
  const index = rows.findIndex(match);
  if (index < 0) return rotateStart(rows, 2);
  const pinned = rows[index];
  const rest = rows.filter((_, i) => i !== index);
  return [pinned, ...rotateStart(rest, 2)];
}
