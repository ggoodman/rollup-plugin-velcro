const RollupPluginCommonjs = require('@rollup/plugin-commonjs');
const RollupPluginVelcro = require('../');

/** @type {import('rollup').RollupOptions} */
const config = {
  input: './lib/index.js',
  output: {
    dir: './dist',
    format: 'esm',
  },
  plugins: [RollupPluginVelcro(), RollupPluginCommonjs()],
};

module.exports = config;
