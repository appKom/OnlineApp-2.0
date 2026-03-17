const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withCustomDrawables(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const srcDir = path.join(config.modRequest.projectRoot, 'assets', 'drawable');
      const destDir = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'drawable'
      );

      if (!fs.existsSync(srcDir)) {
        console.warn('No assets/drawable directory found.');
        return config;
      }

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        fs.copyFileSync(srcFile, destFile);
      }

      return config;
    },
  ]);
};
