# eslint-processor-html

[![npm](https://img.shields.io/npm/v/eslint-processor-html?logo=npm)](https://www.npmjs.com/package/eslint-processor-html "View this project on npm")

ESLint HTML processor. Extracts out the following from HTML files for other ESLint plugins to lint:

* `.js`, `.mjs`, `.json`, based on `<script>` types
* `.css`, `.less`, `.scss`, `.sass`, `.styl`, based on `<style>` langs

Supports autofix and suggestions.

## Usage

### Installing

```sh
npm i -D eslint-processor-html
```

### Configuration

```js
// eslint.config.mjs
import htmlProcessor from 'eslint-processor-html'

export default [
  {
    files: ['**/*.html', '**/*.htm'],
    processor: htmlProcessor(),
  },
]
```

## Thanks

* [htmlparser2](https://github.com/fb55/htmlparser2)
* [html-eslint](https://github.com/yeonjuan/html-eslint)
* [eslint-processor-vue-blocks](https://github.com/antfu/eslint-processor-vue-blocks)
* [@eslint/markdown](https://github.com/eslint/markdown)
* [eslint-plugin-html](https://github.com/BenoitZugmeyer/eslint-plugin-html)
* [@nice-move/eslint-plugin-html](https://github.com/nice-move/eslint-plugin-html)

Can't write one so quick without them.

## License

ISC
