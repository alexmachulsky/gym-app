import { EXERCISE_CATALOG_ROWS } from '../src/data/exerciseCatalogData.js';
import { validateExerciseImageCatalog } from '../src/data/exerciseImageCatalog.js';

const exerciseNames = EXERCISE_CATALOG_ROWS.map(([name]) => name);
const errors = validateExerciseImageCatalog(exerciseNames);

if (errors.length > 0) {
  console.error('Exercise image verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Verified ${exerciseNames.length} reviewed exercise image records.`);
