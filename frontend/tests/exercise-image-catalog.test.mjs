import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testsDir, '..');
const catalogDataPath = path.join(frontendRoot, 'src/data/exerciseCatalogData.js');
const imageCatalogPath = path.join(frontendRoot, 'src/data/exerciseImageCatalog.js');

async function importModule(modulePath, label) {
  if (!existsSync(modulePath)) {
    assert.fail(`${label} is missing: ${path.relative(process.cwd(), modulePath)}`);
  }

  return import(pathToFileURL(modulePath).href);
}

test('reviewed image catalog covers every library exercise', async () => {
  const { EXERCISE_CATALOG_ROWS } = await importModule(catalogDataPath, 'exercise catalog data');
  const { validateExerciseImageCatalog } = await importModule(imageCatalogPath, 'exercise image catalog');

  const exerciseNames = EXERCISE_CATALOG_ROWS.map(([name]) => name);
  const errors = validateExerciseImageCatalog(exerciseNames);

  assert.deepEqual(errors, []);
});

test('unknown exercise names resolve to a neutral placeholder record', async () => {
  const { getReviewedExerciseImageRecord } = await importModule(imageCatalogPath, 'exercise image catalog');

  assert.deepEqual(getReviewedExerciseImageRecord('Custom Ladder Pull'), {
    sourceType: 'placeholder',
    sourceIdOrPath: 'exercise-placeholder',
    reviewStatus: 'approved',
    reviewNote: 'Neutral placeholder for non-curated exercise names.',
  });
});

test('cable glute kickback uses the reviewed placeholder until an exact image is curated', async () => {
  const { getReviewedExerciseImageRecord } = await importModule(imageCatalogPath, 'exercise image catalog');

  assert.deepEqual(getReviewedExerciseImageRecord('Cable Glute Kickback'), {
    sourceType: 'local',
    sourceIdOrPath: 'exercise-placeholder',
    reviewStatus: 'approved',
    reviewNote: 'Neutral fallback until an exact reviewed cable glute kickback image is curated.',
    reviewedAt: '2026-04-06',
    searchTerms: ['cable glute kickback'],
  });
});
