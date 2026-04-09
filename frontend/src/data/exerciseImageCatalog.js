const REVIEWED_AT = '2026-04-09';

function reviewedRecord(sourceType, sourceIdOrPath, reviewNote, searchTerms = []) {
  return {
    sourceType,
    sourceIdOrPath: String(sourceIdOrPath),
    reviewStatus: 'approved',
    reviewNote,
    reviewedAt: REVIEWED_AT,
    searchTerms,
  };
}

const reviewedPexels = (id, reviewNote, searchTerms = []) =>
  reviewedRecord('pexels', id, reviewNote, searchTerms);

const reviewedLocal = (assetKey, reviewNote, searchTerms = []) =>
  reviewedRecord('local', assetKey, reviewNote, searchTerms);

export const reviewedUrl = (url, reviewNote, searchTerms = []) =>
  reviewedRecord('url', url, reviewNote, searchTerms);

export const EXERCISE_PLACEHOLDER_ASSET_KEY = 'exercise-placeholder';

export const UNKNOWN_EXERCISE_IMAGE_RECORD = {
  sourceType: 'placeholder',
  sourceIdOrPath: EXERCISE_PLACEHOLDER_ASSET_KEY,
  reviewStatus: 'approved',
  reviewNote: 'Neutral placeholder for non-curated exercise names.',
};

export function createPexelsUrl(id) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=338&fit=crop`;
}

export function normalizeExerciseName(exerciseName) {
  return exerciseName.trim().toLowerCase();
}

const REVIEWED_EXERCISE_IMAGES = {
  'Bench Press': reviewedPexels(3837757, 'Reviewed flat barbell bench press image.', ['bench press']),
  'Incline Dumbbell Press': reviewedPexels(29526383, 'Man lifting dumbbells on an incline bench in gym.', ['incline dumbbell press']),
  'Decline Bench Press': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed flat press, not decline. Awaiting accurate decline bench press photo.', ['decline bench press']),
  'Push-Up': reviewedPexels(14623739, 'Reviewed push-up exercise image.', ['push-up']),
  'Weighted Dip': reviewedPexels(4162453, 'Muscular man performing weighted dip exercise at modern gym.', ['weighted dip']),
  'Cable Fly': reviewedPexels(32695897, 'Reviewed standing cable fly image.', ['cable fly']),
  'Pec Deck Machine': reviewedPexels(3838937, 'Sportsman training on pec deck machine bringing hands together.', ['pec deck machine']),
  'Machine Chest Press': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed pec deck, not chest press machine. Awaiting accurate photo.', ['machine chest press']),

  'Pull-Up': reviewedPexels(4162478, 'Reviewed pull-up bar image.', ['pull-up']),
  'Chin-Up': reviewedPexels(14591604, 'Woman doing chin-ups with underhand grip.', ['chin-up']),
  'Lat Pulldown': reviewedPexels(17210044, 'Reviewed lat pulldown image.', ['lat pulldown']),
  'Barbell Row': reviewedPexels(4720780, 'Reviewed bent-over barbell row image.', ['barbell row']),
  'Single-Arm Dumbbell Row': reviewedPexels(34587497, 'Woman performing dumbbell row in gym.', ['single-arm dumbbell row']),
  'Seated Cable Row': reviewedPexels(5769127, 'Muscular man performing cable row exercise in gym.', ['seated cable row']),
  'T-Bar Row': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed T-bar row image is curated.', ['t-bar row']),
  'Face Pull': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed metal chain exercise, not rope face pull. Awaiting accurate photo.', ['face pull']),

  'Back Squat': reviewedPexels(5327530, 'Man performing barbell squat in gym.', ['back squat']),
  'Front Squat': reviewedPexels(1552249, 'Reviewed front squat image.', ['front squat']),
  'Leg Press': reviewedPexels(6539793, 'Woman using leg press machine at gym.', ['leg press']),
  'Romanian Deadlift': reviewedPexels(4853280, 'Reviewed Romanian deadlift image.', ['romanian deadlift']),
  'Walking Lunge': reviewedPexels(6455813, 'Man and woman doing lunges exercise with weight balls in gym.', ['walking lunge']),
  'Bulgarian Split Squat': reviewedPexels(4587373, 'Woman doing single-leg squat with dumbbells.', ['bulgarian split squat']),
  'Hack Squat': reviewedPexels(5799855, 'Reviewed hack squat image.', ['hack squat']),
  'Leg Extension': reviewedPexels(20379157, 'Reviewed leg extension machine image.', ['leg extension']),
  'Lying Leg Curl': reviewedPexels(28731788, 'Woman exercising on leg curl machine in gym.', ['lying leg curl']),

  'Hip Thrust': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed floor glute bridge, not bench-supported hip thrust. Awaiting accurate photo.', ['hip thrust']),
  'Barbell Glute Bridge': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed barbell glute bridge image is curated.', ['barbell glute bridge']),
  'Cable Glute Kickback': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed upper-body cable work, not glute kickback. Awaiting accurate photo.', ['cable glute kickback']),
  'Step-Up': reviewedPexels(11713861, 'Woman stepping one leg on exercise box.', ['step-up']),
  'Sumo Deadlift': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed conventional deadlift, not wide-stance sumo. Awaiting accurate photo.', ['sumo deadlift']),
  'Curtsy Lunge': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed curtsy lunge image is curated.', ['curtsy lunge']),

  'Standing Calf Raise': reviewedPexels(13965339, 'Close-up of calves on raised platform performing standing calf raise.', ['standing calf raise']),
  'Seated Calf Raise': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed standing calf raise, not seated. Awaiting accurate photo.', ['seated calf raise']),
  'Donkey Calf Raise': reviewedPexels(13965338, 'Woman using bent-forward calf raise machine, donkey-style hip hinge position.', ['donkey calf raise']),

  'Overhead Press': reviewedPexels(14591561, 'Reviewed standing barbell overhead press image.', ['overhead press']),
  'Arnold Press': reviewedPexels(5327463, 'Man performing Arnold press with dumbbells at bottom position, palms toward torso.', ['arnold press']),
  'Lateral Raise': reviewedPexels(5327464, 'Man performing dumbbell lateral raise at shoulder height, arms abducted.', ['lateral raise']),
  'Rear Delt Fly': reviewedPexels(5327508, 'Man performing seated bent-over rear delt fly with dumbbells.', ['rear delt fly']),
  'Upright Row': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed generic overhead hold, not upright row. Awaiting accurate photo.', ['upright row']),
  'Landmine Press': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed landmine press image is curated.', ['landmine press']),

  'Barbell Curl': reviewedPexels(30284374, 'Male bodybuilder performing barbell curl in gym.', ['barbell curl']),
  'Hammer Curl': reviewedPexels(3838389, 'Reviewed hammer curl image.', ['hammer curl']),
  'Preacher Curl': reviewedPexels(14524650, 'Reviewed preacher curl image.', ['preacher curl']),
  'Cable Curl': reviewedPexels(17210046, 'Reviewed standing cable curl image.', ['cable curl']),
  'Triceps Rope Pushdown': reviewedPexels(13616289, 'Woman doing triceps pushdowns on cable machine.', ['triceps rope pushdown']),
  'Skull Crusher': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed skull crusher image is curated.', ['skull crusher']),
  'Close-Grip Bench Press': reviewedPexels(3837781, 'Reviewed close-grip bench press image.', ['close-grip bench press']),
  'Overhead Triceps Extension': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed overhead triceps extension image is curated.', ['overhead triceps extension']),

  'Plank': reviewedPexels(5000219, 'Woman doing standard plank exercise in bright modern studio.', ['plank']),
  'Side Plank': reviewedPexels(8436141, 'Reviewed side plank image.', ['side plank']),
  'Hanging Knee Raise': reviewedPexels(4803688, 'Man hanging on pull-up bar performing knee raise.', ['hanging knee raise']),
  'Hanging Leg Raise': reviewedPexels(4803688, 'Man hanging on pull-up bar with legs raised.', ['hanging leg raise']),
  'Ab Wheel Rollout': reviewedPexels(3076515, 'Woman using ab roller in gym setting.', ['ab wheel rollout']),
  'Cable Crunch': reviewedPexels(20379141, 'Reviewed cable crunch image.', ['cable crunch']),
  'Russian Twist': reviewedPexels(5128466, 'Reviewed Russian twist image.', ['russian twist']),
  'Pallof Press': reviewedPexels(6339458, 'Man using resistance band in standing position.', ['pallof press']),

  'Deadlift': reviewedPexels(841125, 'Reviewed barbell deadlift image.', ['deadlift']),
  'Kettlebell Swing': reviewedPexels(622297, 'Reviewed kettlebell swing image.', ['kettlebell swing']),
  'Thruster': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed overhead squat, not front-squat-to-press thruster. Awaiting accurate photo.', ['thruster']),
  'Farmer Carry': reviewedPexels(6293103, 'Man carrying heavy dumbbells for farmer walk.', ['farmer carry']),
  'Sled Push': reviewedPexels(1552102, 'Muscular man pushing weighted sled in indoor gym.', ['sled push']),
  'Burpee': reviewedPexels(30246184, 'Female athlete performing burpee exercise in studio.', ['burpee']),
  'Turkish Get-Up': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed Turkish get-up image is curated.', ['turkish get-up']),
  'Renegade Row': reviewedPexels(2247179, 'Reviewed renegade row image.', ['renegade row']),
  'Wall Ball': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed wall ball throw image is curated.', ['wall ball']),

  'Treadmill Run': reviewedPexels(4944970, 'Reviewed treadmill running image.', ['treadmill run']),
  'Incline Walk': reviewedPexels(16640768, 'Woman walking on a treadmill at the gym.', ['incline walk']),
  'Rowing Erg': reviewedPexels(6389866, 'Reviewed rowing erg image.', ['rowing erg']),
  'Assault Bike': reviewedPexels(6389076, 'Reviewed assault bike image.', ['assault bike']),
  'Jump Rope': reviewedPexels(6339602, 'Reviewed jump rope image.', ['jump rope']),
  'Stair Climber': reviewedPexels(31012859, 'Person exercising on StairMaster machine.', ['stair climber']),
  'Cycling Intervals': reviewedPexels(8765704, 'Reviewed cycling intervals image.', ['cycling intervals']),
  'Sprint Intervals': reviewedPexels(19787364, 'Reviewed sprint intervals image.', ['sprint intervals']),

  'Power Clean': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image was generic barbell lift, not identifiable power clean. Awaiting accurate photo.', ['power clean']),
  'Clean and Jerk': reviewedPexels(16966286, 'Reviewed clean and jerk image.', ['clean and jerk']),
  'Snatch': reviewedPexels(34237215, 'Reviewed snatch image.', ['snatch']),
  'Push Press': reviewedPexels(4720786, 'Man lifting barbell overhead in indoor gym.', ['push press']),
  'High Pull': reviewedPexels(7674492, 'Reviewed high pull image.', ['high pull']),

  'Worlds Greatest Stretch': reviewedPexels(6454059, 'Revolved crescent lunge with torso rotation, close to WGS pattern.', ['worlds greatest stretch']),
  'Thoracic Rotation Drill': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image showed generic back stretching, not thoracic rotation. Awaiting accurate photo.', ['thoracic rotation drill']),
  'Shoulder CARs': reviewedPexels(6339454, 'Woman doing shoulder rotation exercise on yoga mat.', ['shoulder cars']),
  'Ankle Dorsiflexion Drill': reviewedPexels(6926036, 'Person stretching ankle on floor for mobility.', ['ankle dorsiflexion drill']),
  '90/90 Hip Switch': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Previous image was generic floor warmup, not 90/90 hip switch. Awaiting accurate photo.', ['90/90 hip switch']),
};

const EXERCISE_IMAGE_RECORDS_BY_NORMALIZED_NAME = new Map(
  Object.entries(REVIEWED_EXERCISE_IMAGES).map(([name, record]) => [normalizeExerciseName(name), record])
);

export function getReviewedExerciseImageRecord(exerciseName) {
  return EXERCISE_IMAGE_RECORDS_BY_NORMALIZED_NAME.get(normalizeExerciseName(exerciseName)) || UNKNOWN_EXERCISE_IMAGE_RECORD;
}

export function validateExerciseImageCatalog(exerciseNames) {
  const errors = [];
  const seen = new Set();

  for (const name of exerciseNames) {
    const normalizedName = normalizeExerciseName(name);
    if (seen.has(normalizedName)) {
      errors.push(`Duplicate exercise name in catalog: ${name}`);
      continue;
    }

    seen.add(normalizedName);

    const record = EXERCISE_IMAGE_RECORDS_BY_NORMALIZED_NAME.get(normalizedName);
    if (!record) {
      errors.push(`Missing reviewed image record for ${name}`);
      continue;
    }

    if (record.reviewStatus !== 'approved') {
      errors.push(`Image record for ${name} is not approved`);
    }

    if (!record.reviewNote) {
      errors.push(`Image record for ${name} is missing a review note`);
    }

    if (!record.reviewedAt) {
      errors.push(`Image record for ${name} is missing reviewedAt`);
    }

    if (record.sourceType === 'pexels' && !/^\d+$/.test(record.sourceIdOrPath)) {
      errors.push(`Image record for ${name} has an invalid Pexels id`);
    }

    if (record.sourceType === 'local' && !record.sourceIdOrPath) {
      errors.push(`Image record for ${name} is missing a local asset key`);
    }

    if (!['pexels', 'local', 'url'].includes(record.sourceType)) {
      errors.push(`Image record for ${name} uses unsupported sourceType ${record.sourceType}`);
    }
  }

  for (const existingName of EXERCISE_IMAGE_RECORDS_BY_NORMALIZED_NAME.keys()) {
    if (!seen.has(existingName)) {
      errors.push(`Stale reviewed image record for ${existingName}`);
    }
  }

  return errors;
}
