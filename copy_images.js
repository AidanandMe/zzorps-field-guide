/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\customer\\.gemini\\antigravity\\brain\\59a24315-10fb-41e0-846f-f5c4aab7b829';
const destDir = 'c:\\Users\\customer\\OneDrive\\Desktops\\TUTTO DESKTOP\\NUFE2025_26_ZORP\\Zzorp APP 2026\\Antigravity_03_26\\zzorps-field-guide\\public\\assets';

const filesToCopy = [
  { file: 'bg_command_center_1773936394319.png', rename: 'bg_command_center.png' },
  { file: 'bg_earth_1773936428832.png', rename: 'bg_earth.png' },
  { file: 'bg_garden_1773936347274.png', rename: 'bg_garden.png' },
  { file: 'bg_landfill_1773936361418.png', rename: 'bg_landfill.png' },
  { file: 'bg_reusables_1773936376677.png', rename: 'bg_reusables.png' }
];

filesToCopy.forEach(item => {
  fs.copyFileSync(path.join(srcDir, item.file), path.join(destDir, item.rename));
});
console.log('Images copied successfully.');
