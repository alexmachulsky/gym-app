import armsImage from '../assets/photos/arms.jpg';
import backImage from '../assets/photos/back.jpg';
import cardioImage from '../assets/photos/cardio.jpg';
import chestImage from '../assets/photos/chest.jpg';
import coreImage from '../assets/photos/core.jpg';
import exercisePlaceholderImage from '../assets/photos/exercise-placeholder.svg';
import fullBodyImage from '../assets/photos/fullbody.jpg';
import glutesImage from '../assets/photos/glutes.jpg';
import legsImage from '../assets/photos/legs.jpg';
import mobilityImage from '../assets/photos/mobility.jpg';
import olympicImage from '../assets/photos/olympic.jpg';
import shouldersImage from '../assets/photos/shoulders.jpg';
import { EXERCISE_CATALOG_ROWS, STRETCH_SUGGESTIONS } from './exerciseCatalogData';
import {
  createPexelsUrl,
  EXERCISE_PLACEHOLDER_ASSET_KEY,
  getReviewedExerciseImageRecord,
} from './exerciseImageCatalog';

const imageByCategory = {
  Chest: chestImage,
  Back: backImage,
  Legs: legsImage,
  Glutes: glutesImage,
  Calves: legsImage,
  Shoulders: shouldersImage,
  Arms: armsImage,
  Core: coreImage,
  'Full Body': fullBodyImage,
  Cardio: cardioImage,
  Olympic: olympicImage,
  Mobility: mobilityImage,
};

const localImageByKey = {
  [EXERCISE_PLACEHOLDER_ASSET_KEY]: exercisePlaceholderImage,
};

function resolveExerciseImage(record, category) {
  if (record.sourceType === 'pexels') {
    return createPexelsUrl(record.sourceIdOrPath);
  }

  if (record.sourceType === 'local') {
    return localImageByKey[record.sourceIdOrPath] || localImageByKey[EXERCISE_PLACEHOLDER_ASSET_KEY];
  }

  return localImageByKey[EXERCISE_PLACEHOLDER_ASSET_KEY] || imageByCategory[category] || fullBodyImage;
}

export const EXERCISE_LIBRARY = EXERCISE_CATALOG_ROWS.map(([name, category, focus, difficulty, description, equipment]) => {
  const reviewedImage = getReviewedExerciseImageRecord(name);
  return {
    name,
    category,
    focus,
    difficulty,
    description,
    equipment,
    image: resolveExerciseImage(reviewedImage, category),
  };
});

export const LIBRARY_CATEGORIES = ['All', ...Object.keys(imageByCategory)];

export const EQUIPMENT_TYPES = ['All', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands'];

export function getStretchSuggestionsForExercises(exerciseNames) {
  const categories = new Set();
  for (const name of exerciseNames) {
    const entry = EXERCISE_LIBRARY.find((exercise) => exercise.name.toLowerCase() === name.trim().toLowerCase());
    if (entry) categories.add(entry.category);
  }
  const suggestions = new Set();
  for (const category of categories) {
    (STRETCH_SUGGESTIONS[category] || []).forEach((suggestion) => suggestions.add(suggestion));
  }
  return [...suggestions];
}

export function getExerciseImageByName(exerciseName) {
  const fromLibrary = EXERCISE_LIBRARY.find((exercise) => exercise.name.toLowerCase() === exerciseName.trim().toLowerCase());
  if (fromLibrary) return fromLibrary.image;

  const reviewedImage = getReviewedExerciseImageRecord(exerciseName);
  return resolveExerciseImage(reviewedImage);
}
