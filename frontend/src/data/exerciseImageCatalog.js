const REVIEWED_AT = '2026-04-06';

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
  'Incline Dumbbell Press': reviewedPexels(3839310, 'Reviewed incline dumbbell chest press image.', ['incline dumbbell press']),
  'Decline Bench Press': reviewedPexels(7289250, 'Reviewed decline barbell press image.', ['decline bench press']),
  'Push-Up': reviewedPexels(14623739, 'Reviewed push-up exercise image.', ['push-up']),
  'Weighted Dip': reviewedPexels(4162453, 'Muscular man performing weighted dip exercise at modern gym.', ['weighted dip']),
  'Cable Fly': reviewedPexels(32695897, 'Reviewed standing cable fly image.', ['cable fly']),
  'Pec Deck Machine': reviewedPexels(3838937, 'Sportsman training on pec deck machine bringing hands together.', ['pec deck machine']),
  'Machine Chest Press': reviewedPexels(3838926, 'Man exercising on chest press machine in modern gym.', ['machine chest press']),

  'Pull-Up': reviewedPexels(4162478, 'Reviewed pull-up bar image.', ['pull-up']),
  'Chin-Up': reviewedPexels(7187872, 'Reviewed chin-up image.', ['chin-up']),
  'Lat Pulldown': reviewedPexels(17210044, 'Reviewed lat pulldown image.', ['lat pulldown']),
  'Barbell Row': reviewedPexels(4720780, 'Reviewed bent-over barbell row image.', ['barbell row']),
  'Single-Arm Dumbbell Row': reviewedPexels(34587497, 'Woman performing dumbbell row in gym.', ['single-arm dumbbell row']),
  'Seated Cable Row': reviewedPexels(5769127, 'Muscular man performing cable row exercise in gym.', ['seated cable row']),
  'T-Bar Row': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed T-bar row image is curated.', ['t-bar row']),
  'Face Pull': reviewedPexels(5327503, 'Reviewed rope cable face pull image.', ['face pull']),

  'Back Squat': reviewedPexels(28805366, 'Reviewed back squat image.', ['back squat']),
  'Front Squat': reviewedPexels(1552249, 'Reviewed front squat image.', ['front squat']),
  'Leg Press': reviewedPexels(6844939, 'Reviewed leg press machine image.', ['leg press']),
  'Romanian Deadlift': reviewedPexels(4853280, 'Reviewed Romanian deadlift image.', ['romanian deadlift']),
  'Walking Lunge': reviewedPexels(6339452, 'Reviewed walking lunge image.', ['walking lunge']),
  'Bulgarian Split Squat': reviewedPexels(4587373, 'Woman doing single-leg squat with dumbbells.', ['bulgarian split squat']),
  'Hack Squat': reviewedPexels(5799855, 'Reviewed hack squat image.', ['hack squat']),
  'Leg Extension': reviewedPexels(20379157, 'Reviewed leg extension machine image.', ['leg extension']),
  'Lying Leg Curl': reviewedPexels(28731788, 'Reviewed lying leg curl image.', ['lying leg curl']),

  'Hip Thrust': reviewedPexels(4587402, 'Woman doing hip bridge exercise on mat with trainer.', ['hip thrust']),
  'Barbell Glute Bridge': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed barbell glute bridge image is curated.', ['barbell glute bridge']),
  'Cable Glute Kickback': reviewedPexels(11121628, 'Young woman working out with cable machine indoors.', ['cable glute kickback']),
  'Step-Up': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed step-up image is curated.', ['step-up']),
  'Sumo Deadlift': reviewedPexels(13822300, 'Reviewed sumo deadlift image.', ['sumo deadlift']),
  'Curtsy Lunge': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed curtsy lunge image is curated.', ['curtsy lunge']),

  'Standing Calf Raise': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed standing calf raise image is curated.', ['standing calf raise']),
  'Seated Calf Raise': reviewedPexels(13965339, 'Reviewed seated calf raise image.', ['seated calf raise']),
  'Donkey Calf Raise': reviewedPexels(13965343, 'Woman using gym machine for calf exercise.', ['donkey calf raise']),

  'Overhead Press': reviewedPexels(14591561, 'Reviewed standing barbell overhead press image.', ['overhead press']),
  'Arnold Press': reviewedPexels(7289370, 'Man doing dumbbell shoulder press in gym.', ['arnold press']),
  'Lateral Raise': reviewedPexels(29793977, 'Muscular man performing dumbbell side raises.', ['lateral raise']),
  'Rear Delt Fly': reviewedPexels(5327464, 'Man performing dumbbell raises in modern gym.', ['rear delt fly']),
  'Upright Row': reviewedPexels(4720793, 'Man lifting barbell showcasing strength and fitness.', ['upright row']),
  'Landmine Press': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed landmine press image is curated.', ['landmine press']),

  'Barbell Curl': reviewedPexels(4853329, 'Reviewed standing barbell curl image.', ['barbell curl']),
  'Hammer Curl': reviewedPexels(3838389, 'Reviewed hammer curl image.', ['hammer curl']),
  'Preacher Curl': reviewedPexels(14524650, 'Reviewed preacher curl image.', ['preacher curl']),
  'Cable Curl': reviewedPexels(17210046, 'Reviewed standing cable curl image.', ['cable curl']),
  'Triceps Rope Pushdown': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed triceps rope pushdown image is curated.', ['triceps rope pushdown']),
  'Skull Crusher': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed skull crusher image is curated.', ['skull crusher']),
  'Close-Grip Bench Press': reviewedPexels(3837781, 'Reviewed close-grip bench press image.', ['close-grip bench press']),
  'Overhead Triceps Extension': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed overhead triceps extension image is curated.', ['overhead triceps extension']),

  'Plank': reviewedPexels(5000219, 'Woman doing standard plank exercise in bright modern studio.', ['plank']),
  'Side Plank': reviewedPexels(8436141, 'Reviewed side plank image.', ['side plank']),
  'Hanging Knee Raise': reviewedPexels(4803714, 'Reviewed hanging knee raise image.', ['hanging knee raise']),
  'Hanging Leg Raise': reviewedPexels(4803717, 'Reviewed hanging leg raise image.', ['hanging leg raise']),
  'Ab Wheel Rollout': reviewedPexels(3076515, 'Woman using ab roller in gym setting.', ['ab wheel rollout']),
  'Cable Crunch': reviewedPexels(20379141, 'Reviewed cable crunch image.', ['cable crunch']),
  'Russian Twist': reviewedPexels(5128466, 'Reviewed Russian twist image.', ['russian twist']),
  'Pallof Press': reviewedPexels(6339458, 'Man using resistance band in standing position.', ['pallof press']),

  'Deadlift': reviewedPexels(841125, 'Reviewed barbell deadlift image.', ['deadlift']),
  'Kettlebell Swing': reviewedPexels(622297, 'Reviewed kettlebell swing image.', ['kettlebell swing']),
  'Thruster': reviewedPexels(18187616, 'Reviewed thruster image.', ['thruster']),
  'Farmer Carry': reviewedPexels(6293103, 'Man carrying heavy dumbbells for farmer walk.', ['farmer carry']),
  'Sled Push': reviewedPexels(1552102, 'Muscular man pushing weighted sled in indoor gym.', ['sled push']),
  'Burpee': reviewedPexels(30246184, 'Female athlete performing burpee exercise in studio.', ['burpee']),
  'Turkish Get-Up': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed Turkish get-up image is curated.', ['turkish get-up']),
  'Renegade Row': reviewedPexels(2247179, 'Reviewed renegade row image.', ['renegade row']),
  'Wall Ball': reviewedLocal(EXERCISE_PLACEHOLDER_ASSET_KEY, 'Neutral fallback until an exact reviewed wall ball throw image is curated.', ['wall ball']),

  'Treadmill Run': reviewedPexels(4944970, 'Reviewed treadmill running image.', ['treadmill run']),
  'Incline Walk': reviewedPexels(3888343, 'Reviewed incline treadmill walk image.', ['incline walk']),
  'Rowing Erg': reviewedPexels(6389866, 'Reviewed rowing erg image.', ['rowing erg']),
  'Assault Bike': reviewedPexels(6389076, 'Reviewed assault bike image.', ['assault bike']),
  'Jump Rope': reviewedPexels(6339602, 'Reviewed jump rope image.', ['jump rope']),
  'Stair Climber': reviewedPexels(31012859, 'Person exercising on StairMaster machine.', ['stair climber']),
  'Cycling Intervals': reviewedPexels(8765704, 'Reviewed cycling intervals image.', ['cycling intervals']),
  'Sprint Intervals': reviewedPexels(19787364, 'Reviewed sprint intervals image.', ['sprint intervals']),

  'Power Clean': reviewedPexels(1566414, 'Reviewed power clean image.', ['power clean']),
  'Clean and Jerk': reviewedPexels(16966286, 'Reviewed clean and jerk image.', ['clean and jerk']),
  'Snatch': reviewedPexels(34237215, 'Reviewed snatch image.', ['snatch']),
  'Push Press': reviewedPexels(4720786, 'Man lifting barbell overhead in indoor gym.', ['push press']),
  'High Pull': reviewedPexels(7674492, 'Reviewed high pull image.', ['high pull']),

  'Worlds Greatest Stretch': reviewedPexels(6453974, 'Flexible woman doing low lunge stretch.', ['worlds greatest stretch']),
  'Thoracic Rotation Drill': reviewedPexels(8413737, 'Reviewed thoracic rotation drill image.', ['thoracic rotation drill']),
  'Shoulder CARs': reviewedPexels(6339454, 'Woman doing shoulder rotation exercise on yoga mat.', ['shoulder cars']),
  'Ankle Dorsiflexion Drill': reviewedPexels(6926036, 'Person stretching ankle on floor for mobility.', ['ankle dorsiflexion drill']),
  '90/90 Hip Switch': reviewedPexels(6454123, 'Woman doing floor warmup stretch for hip mobility.', ['90/90 hip switch']),
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

    if (!['pexels', 'local'].includes(record.sourceType)) {
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
