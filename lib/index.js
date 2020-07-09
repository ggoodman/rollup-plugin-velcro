//@ts-check
'use strict';

const { Uri } = require('@velcro/common');
const { Resolver } = require('@velcro/resolver');
const { CdnStrategy } = require('@velcro/strategy-cdn');
const { CompoundStrategy } = require('@velcro/strategy-compound');
const { FsStrategy } = require('@velcro/strategy-fs');
const createFetch = require('fetch-ponyfill');

/**
 * @typedef Options
 * @property {'jsDelivr' | 'unpkg'} cdn
 * @property {import('@velcro/resolver').Resolver.Settings['debug']} debug
 * @property {import('@velcro/resolver').Resolver.Settings['extensions']} extensions
 * @property {import('@velcro/strategy-fs').FsStrategy.FsInterface} fs
 * @property {import('@velcro/resolver').Resolver.Settings['packageMain']} packageMain
 */

/** @type {Options} */
const defaultResolverOptions = {
  cdn: 'jsDelivr',
  debug: false,
  extensions: ['.js', '.json', '.mjs', '.cjs'],
  get fs() {
    return require('fs');
  },
  packageMain: ['module', 'main'],
};

function cdnStrategyFactoryFactory(cdn) {
  switch (cdn.toLowerCase()) {
    case 'jsdelivr':
      return CdnStrategy.forJsDelivr;
    case 'unpkg':
      return CdnStrategy.forUnpkg;
    default:
      throw new Error(`An unexpected value for the "cdn" options was provided: "${cdn}"`);
  }
}

/**
 *
 * @param {Partial<Options>} options
 * @returns {import('rollup').Plugin}
 */
function RollupPluginVelcro(options = {}) {
  const { fetch } = createFetch();

  const readUrl = async (href) => {
    const res = await fetch(href, { redirect: 'follow' });
    const buf = await res.arrayBuffer();

    return buf;
  };

  const settings = {
    ...defaultResolverOptions,
    ...options,
  };
  const cdnFactory = cdnStrategyFactoryFactory(settings.cdn);
  // The CDN strategy is a ResolverStrategy that supports generating mapping a
  // bare module to an un-canonicalized Uri.
  //
  // For example, given 'react@^16.13.1', it would produce:
  //   https://cdn.jsdelivr.net/npm/react@^16.13.1
  // The CdnStrategy relies on CDN's like jsDelivr and unpkg to respond with a
  // http 3XX redirect when the supplied url isn't canonicalized.
  //
  // Also, since Velcro is designed to be portable between environments, a
  // function must be supplied to actually make http requests. This function
  // _must_ follow redirects and produce an `Promise<ArrayBuffer>`.
  const cdnStrategy = cdnFactory(readUrl);

  /// The FS strategy will be used to load local files from disk
  const fsStrategy = new FsStrategy({ fs: settings.fs });

  // The CompoundStrategy is used to delegate operations to
  // child strategies according to those strategies' `rootUri`
  // properties.
  const strategy = new CompoundStrategy({
    strategies: [cdnStrategy, fsStrategy],
  });

  // Wire up the compound strategy with settings
  const resolver = new Resolver(strategy, settings);
  const resolvedHrefs = new Map();

  return {
    name: 'rollup-plugin-velcro',
    async resolveId(spec, importer) {
      // We will not attempt to resolve entrypoints using Velcro
      // It is assumed that these will be resolved by Rollup's
      // default fallback resolution.
      if (!importer) {
        return null;
      }

      // If the spec or the importer starts with NUL, then we can assume
      // that another plugin owns these assets so we defer to them.
      if (spec.charCodeAt(0) === 0 || importer.charCodeAt(0) === 0) {
        // Ignore stuff from other plugins
        return null;
      }

      if (resolvedHrefs.has(spec)) {
        return spec;
      }

      let fromUri;
      try {
        // We will only handle resolveId calls when the importer is
        // resolveable as a Uri.
        // Note: `Uri.parse` will succeed for absolute paths and will
        // result in a Uri starting with file:///
        fromUri = Uri.parse(importer);
      } catch (_) {
        return null;
      }

      // Delegate resolution to the Velcro Resolver
      const { uri } = await resolver.resolve(spec, fromUri);

      // Having now resolved the spec from the importer, let's cache
      // the result.
      // This serves a couple purposes:
      //   1. It allows us to test if the spec is something we have already resolved
      //   2. It allows us to guard the load hook for only id's we have resolved
      resolvedHrefs.set(uri.toString(), uri);

      // Return the Uri's string representation.
      return uri.toString();
    },
    async load(id) {
      const uri = resolvedHrefs.get(id);

      if (!uri) {
        return null;
      }

      const { content } = await resolver.readFileContent(uri);

      // Calls to readFileContent always produce an ArrayBuffer
      // because it is the most portable, low-level representation.
      // Fortunately, Velcro resolvers come with a `decode` method to
      // get a string out of them.
      return resolver.decode(content);
    },
  };
}

module.exports = RollupPluginVelcro;
