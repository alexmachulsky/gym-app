const KG_TO_LBS = 2.20462;
const KM_TO_MI = 0.621371;

export function formatWeight(value, unit = 'kg') {
  if (value == null) return '–';
  const n = Number(value);
  if (unit === 'lbs') return `${(n * KG_TO_LBS).toFixed(1)} lbs`;
  return `${n.toFixed(1)} kg`;
}

export function formatDistance(value, unit = 'km') {
  if (value == null) return '–';
  const n = Number(value);
  if (unit === 'mi') return `${(n * KM_TO_MI).toFixed(2)} mi`;
  return `${n.toFixed(2)} km`;
}

export function convertWeightToKg(value, unit = 'kg') {
  if (unit === 'lbs') return Number(value) / KG_TO_LBS;
  return Number(value);
}

export function convertWeightFromKg(value, unit = 'kg') {
  if (unit === 'lbs') return Number(value) * KG_TO_LBS;
  return Number(value);
}
