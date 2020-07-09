# Example using `rollup-plugin-velcro`

This is an example of using `rollup-plugin-velcro` to bundle a little app that uses `preact` and `htm` to render `<h1>Hello world</h1>` to `document.body`.

What is interesting about this example is that you never actually have to install `preact` or `htm` locally. The appropriate versions (and their transitive dependencies) will all be resolved and loaded on the fly from the could.

## Installation

For this demo, we only install `devDependencies` since those are needed to provide `rollup` and `@rollup/plugin-commonjs`.

> _Note: It is assumed that you have already run `npm install` in the parent directory._

```sh
npm run install
```

## Example

Check out the code in [./lib/index.js] and adjust to your liking. This is the file that will be bundled

```sh
npm run build
```

Now let's read out the generated bundle!

```sh
cat dist/index.js
```

### Sanity check

Let's make sure that we didn't secretly install `preact` and `htm`:

```sh
npm ls | grep "preact|htm"
```

Output:

```
npm ERR! missing: htm@^3.0.4, required by rollup-plugin-velcro-example@0.0.0
npm ERR! missing: preact@^10.4.5, required by rollup-plugin-velcro-example@0.0.0
```
