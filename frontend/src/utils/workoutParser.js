/**
 * Parse free-text workout descriptions into structured set data.
 *
 * Supported patterns:
 *   "Bench Press 3x8 @80"        → { name: "Bench Press", sets: 3, reps: 8, weight: 80 }
 *   "Squat 5x5 100kg"            → { name: "Squat", sets: 5, reps: 5, weight: 100 }
 *   "Deadlift 1x5 @140.5"       → { name: "Deadlift", sets: 1, reps: 5, weight: 140.5 }
 *   "Pull Ups 3x10"              → { name: "Pull Ups", sets: 3, reps: 10, weight: 0 }
 *
 * Each non-empty line is parsed independently. Lines that don't match are skipped.
 */

const LINE_RE = /^(.+?)\s+(\d+)\s*[xX×]\s*(\d+)(?:\s*[@]?\s*([\d.]+)\s*(?:kg|lbs?)?)?$/;

export function parseWorkoutText(text) {
  if (!text) return [];

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(LINE_RE);
      if (!match) return null;
      return {
        name: match[1].trim(),
        sets: parseInt(match[2], 10),
        reps: parseInt(match[3], 10),
        weight: match[4] ? parseFloat(match[4]) : 0,
      };
    })
    .filter(Boolean);
}
