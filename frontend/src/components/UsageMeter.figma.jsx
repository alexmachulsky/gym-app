/**
 * Figma Code Connect mapping for UsageMeter.
 *
 * Steps to activate:
 *   1. Copy the Figma component node link (right-click → Copy link to selection).
 *   2. Replace the placeholder figmaUrl below with that link.
 *   3. Run: npx @figma/code-connect publish
 */
import figma from '@figma/code-connect';
import UsageMeter from './UsageMeter';

figma.connect(
  UsageMeter,
  // TODO: replace with your Figma component URL
  'https://www.figma.com/file/REPLACE_FILE_ID/ForgeMode?node-id=REPLACE_NODE_ID',
  {
    props: {
      label: figma.string('Label'),
      used: figma.number('Used'),
      limit: figma.number('Limit'),
    },
    example: ({ label, used, limit }) => (
      <UsageMeter label={label} used={used} limit={limit} />
    ),
  }
);
