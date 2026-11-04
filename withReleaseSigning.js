const { withAppBuildGradle } = require('@expo/config-plugins');

// Signs release builds with upload-keystore.jks from the project root. The keystore is gitignored and the
// credentials come from ~/.gradle/gradle.properties (UPLOAD_STORE_PASSWORD, UPLOAD_KEY_ALIAS, UPLOAD_KEY_PASSWORD),
// so neither ends up in the repo. Machines without them keep signing release builds with the debug keystore.
const MARKER = '// Release signing from upload-keystore.jks (see withReleaseSigning.js)';

const DECLARATIONS = `${MARKER}
def uploadKeystoreFile = rootProject.file('../upload-keystore.jks')
def hasUploadKeystore = uploadKeystoreFile.exists() && findProperty('UPLOAD_STORE_PASSWORD') != null

`;

const RELEASE_SIGNING_CONFIG = `
        if (hasUploadKeystore) {
            release {
                storeFile uploadKeystoreFile
                storePassword findProperty('UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('UPLOAD_KEY_ALIAS')
                keyPassword findProperty('UPLOAD_KEY_PASSWORD')
            }
        }`;

function replaceOrThrow(contents, pattern, replacement, description) {
  if (!pattern.test(contents)) {
    throw new Error(`withReleaseSigning: could not find ${description} in android/app/build.gradle.`);
  }
  return contents.replace(pattern, replacement);
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes(MARKER)) return config;

    contents = replaceOrThrow(contents, /^android \{/m, `${DECLARATIONS}android {`, 'the android block');
    contents = replaceOrThrow(
      contents,
      /(keyPassword 'android'\r?\n\s*\})/,
      `$1${RELEASE_SIGNING_CONFIG}`,
      'the debug signing config'
    );
    contents = replaceOrThrow(
      contents,
      /(release \{\r?\n(?:\s*\/\/.*\r?\n)*\s*)signingConfig signingConfigs\.debug/,
      '$1signingConfig hasUploadKeystore ? signingConfigs.release : signingConfigs.debug',
      'the release build type signing config'
    );

    config.modResults.contents = contents;
    return config;
  });
};
