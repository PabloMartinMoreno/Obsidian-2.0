---
aliases:
tags:
  - asset/web-app
  - technique/discovery
kind: Concept
linked:
---
# JavaScript Deobfuscation

> [!info]
> JS minified/obfuscated en bundles modernos (webpack, rollup, etc.) o protectores (JScrambler, Obfuscator.io). Deobfuscate para entender lógica client-side, encontrar API endpoints, secrets, anti-bot logic.

***

## Niveles típicos

| Nivel | Características | Tool |
|---|---|---|
| **Minified** | Vars cortas, no whitespace, mismo control flow | js-beautify, Prettier |
| **Obfuscated básico** | String arrays + index lookups, hex literals | de4js, synchrony |
| **Obfuscated avanzado** | Control flow flattening, dead code, anti-debug | Manual + Babel AST tools |
| **VM-based** | Custom bytecode interpreter | RE manual del VM |

***

## Beautify + initial cleanup

```bash
# Pretty-print minified
npm install -g js-beautify
js-beautify minified.js > pretty.js

# Browser DevTools también tiene "Pretty print" `{}` button
```

***

## Deobfuscation tools

| Tool | Targets |
|---|---|
| **de4js** (`https://lelinhtinh.github.io/de4js/`) | Web-based, popular obfuscator.io patterns |
| **synchrony** (`relative/synchrony`) | CLI, varios protectors |
| **Webcrack** (`relative/webcrack`) | Webpack unbundler + deobf |
| **deminifier** | Sourcemap recovery si .map disponible |
| **AST Explorer** (`astexplorer.net`) | Visualiza AST, escribe Babel transforms custom |
| **JStillery** | Online deobfuscator |

```bash
# Webcrack (unbundle webpack + deob)
npx webcrack input.js -o output/

# synchrony
npx synchrony input.js
```

***

## Webpack bundle reversal

Apps modernas bundlean con webpack/rollup. Result = un solo file con todos los modules. Para analizar:

```bash
# webcrack separa modules a archivos individuales
npx webcrack bundle.js -o modules/

# Resultado: modules/0.js, modules/1.js... con código original
```

Si sourcemap (.map) disponible → puede reconstruir source EXACTO del dev:
```bash
curl -O http://target/bundle.js.map
# Use online sourcemap visualizers o jsbeautifier con map support
```

***

## Manual deobfuscation con Babel

Para casos custom, escribir AST transform:

```javascript
// remove-string-array.js
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const fs = require('fs');

const code = fs.readFileSync('obfuscated.js', 'utf-8');
const ast = parser.parse(code);

traverse(ast, {
    CallExpression(path) {
        if (path.node.callee.name === '_0xABC123') {
            // Replace lookup con string literal
            const index = path.node.arguments[0].value;
            path.replaceWith({ type: 'StringLiteral', value: STRINGS[index] });
        }
    }
});

console.log(generator(ast).code);
```

***

## Hunt en JS bundles

```bash
# API endpoints
grep -oE 'https?://[a-zA-Z0-9./?=_-]+' bundle.js | sort -u
grep -oE '/api/[a-zA-Z0-9/_-]+' bundle.js | sort -u

# Secrets
grep -iE 'api_?key|secret|token|password' bundle.js
grep -oE '[A-Za-z0-9_-]{40,}' bundle.js | head

# Webpack public path (otros bundles relacionados)
grep -oE 'webpack_require\.p\s*=\s*"[^"]+"' bundle.js

# Sourcemap reference
grep '//# sourceMappingURL=' bundle.js
```

Tools automatizadas:
- **SecretFinder** — extension Burp para JS secrets
- **LinkFinder** — JS endpoint discovery
- **JSscanner**, **GetJS**

***

## Anti-debug bypass

```javascript
// Algunos obfuscators agregan debugger; statements en loop
// Bypass en Chrome DevTools: right-click sobre debugger line → "Never pause here"

// O override en código deobfuscated:
Function.prototype.constructor = function() { return {}; };
```

***

## Notas Relacionadas

- [[Source Code Review]]
- [[Cross-Site Scripting (XSS)]]
- [[DOM]]
- [[Binary Analysis Fundamentals]]
