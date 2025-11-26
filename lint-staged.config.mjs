export const prettierConfig = Object.freeze({
  '*': ['prettier --write --ignore-unknown --no-error-on-unmatched-pattern'],
});

export const eslintConfig = Object.freeze({
  './**/src/**/*.?(m)(j|t)(s|sx)': [
    // We use a flag here to ensure eslint uses correct config files.
    // The flag should be stable in eslint v10,
    // see https://eslint.org/docs/v9.x/use/configure/configuration-files#experimental-configuration-file-resolution
    'eslint --flag v10_config_lookup_from_file --fix',
  ],
});

export default {
  ...prettierConfig,
  ...eslintConfig,
};
