/**
 * Figma Code Connect mapping for FeatureGate.
 *
 * Steps to activate:
 *   1. Open your Figma file and copy the component node link
 *      (right-click the component → Copy link to selection).
 *   2. Replace the placeholder figmaUrl below with that link.
 *   3. Run: npx @figma/code-connect publish
 *
 * Docs: https://github.com/figma/code-connect
 */
import figma from '@figma/code-connect';
import FeatureGate from './FeatureGate';

figma.connect(
  FeatureGate,
  // TODO: replace with your Figma component URL
  'https://www.figma.com/file/REPLACE_FILE_ID/ForgeMode?node-id=REPLACE_NODE_ID',
  {
    props: {
      feature: figma.enum('Feature', {
        'AI Coach': 'ai_coach',
        'Export': 'export',
        'Equipment Profiles': 'equipment_profiles',
        'Advanced Charts': 'advanced_charts',
        'Workout Generator': 'workout_generator',
      }),
    },
    example: ({ feature }) => (
      <FeatureGate feature={feature}>
        <div>Pro feature content</div>
      </FeatureGate>
    ),
  }
);
