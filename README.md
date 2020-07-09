[npm]: https://img.shields.io/npm/v/rollup-plugin-velcro
[npm-url]: https://www.npmjs.com/package/rollup-plugin-velcro
[size]: https://packagephobia.now.sh/badge?p=rollup-plugin-velcro
[size-url]: https://packagephobia.now.sh/result?p=rollup-plugin-velcro

[![npm][npm]][npm-url]
[![size][size]][size-url]

# rollup-plugin-velcro

👟 A Rollup plugin to to resolve and read dependencies straight from the cloud ☁ using [Velcro](https://github.com/ggoodman/velcro).

## Requirements

This plugin must be configured with an http request function having a signature of `(href: string) => Promise<ArrayBuffer>`.

When running in the browser or environments other than Node.js, an promisified [fs](https://nodejs.org/dist/latest-v12.x/docs/api/fs.html)-equivalent must be provided that implements:

```ts
type Dirent = {
  isFile(): boolean;
  isDirectory(): boolean;
  name: string;
};

interface FsInterface {
  readdir(
    path: string,
    options: {
      encoding: 'utf-8';
      withFileTypes: true;
    }
  ): Promise<Dirent[]>;
  readFile(path: string): Promise<ArrayBuffer>;
  realpath(path: string): Promise<string>;
}
```

## Install

Using npm:

```bash
npm install rollup-plugin-velcro --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import velcro from 'rollup-plugin-velcro';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs',
  },
  plugins: [velcro()],
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

### `cdn`

Type: `'jsDelivr' | 'unpkg'`<br>
Default: `'jsDelivr'`

Selects the CDN that will be used for resolving and reading the files.

### `debug`

Type: `boolean`<br>
Default: `false`

Opt into verbose logging of [velcro](https://github.com/ggoodman/velcro) resolver operations.

### `extensions`

Type: `string[]`<br>
Default: `[".js", ".json", ".mjs", ".cjs"]`

An ordered list of file extensions that will be consulted for resolving dependencies between modules that don't specify the extension.

### `fs`

Type: `import('fs')`<br>
Default: `require('fs')`

An implementation of the promisified `fs` interface that will be used for reading local files.

### `packageMain`

Type: `('browser' | 'main' | 'module')[]`<br>
Default: `["module", "main"]`

An ordered list of `package.json` fields that will be consulted when resolving the default file of an npm module.

> Note: This _should_ fully support the sementics of `browser` overrides and exclusions.

## Using with @rollup/plugin-commonjs

Since most packages in your node_modules folder are probably legacy CommonJS rather than JavaScript modules, you may need to use [@rollup/plugin-commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs):

```js
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'MyModule',
  },
  plugins: [resolve(), commonjs()],
};
```

## Resolving Built-Ins (like `fs`)

This plugin won't resolve any builtins (e.g. `fs`). If you need to resolve builtins you can install local modules and set `preferBuiltins` to `false`, or install a plugin like [rollup-plugin-node-polyfills](https://github.com/ionic-team/rollup-plugin-node-polyfills) which provides stubbed versions of these methods.

If you want to silence warnings about builtins, you can add the list of builtins to the `externals` option; like so:

```js
import resolve from '@rollup/plugin-node-resolve';
import builtins from 'builtin-modules'
export default ({
  input: ...,
  plugins: [resolve()],
  external: builtins,
  output: ...
})
```

## Meta

[LICENSE (MIT)](/LICENSE)
