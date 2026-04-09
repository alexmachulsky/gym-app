/**
 * Figma Code Connect mapping for ProBadge.
 *
 * Steps to activate:
 *   1. Copy the Figma component node link (right-click → Copy link to selection).
 *   2. Replace the placeholder figmaUrl below with that link.
 *   3. Run: npx @figma/code-connect publish
 */
import figma from '@figma/code-connect';
import ProBadge from './ProBadge';

figma.connect(
  ProBadge,
  // TODO: replace with your Figma component URL
  'https://www.figma.com/file/REPLACE_FILE_ID/ForgeMode?node-id=REPLACE_NODE_ID',
  {
    example: () => <ProBadge />,
  }
);
