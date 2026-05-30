---
aliases:
  - "Codificación"
  - "Bypass por Contaminación de Parámetros"
  - "Bypass de Restricciones"
  - "Expresiones regulares"
  - "Bypass de Funciones Deshabilitadas"
  - "Bypass de Filtros con Wrappers PHP"
  - "preg_match"
  - "Bypass de Restricciones de Filtros"
  - Sanitization
  - Input Validation
tags:
  - estado/completo
  - asset/web-app
kind: Concept
linked:
---
# Sanitización

> [!info]
> Limpieza/transformación de input antes de usarlo en operación crítica. Diferencia con **validación** (decisión accept/reject). Falla de sanitización = vector de injection.

***

## Sanitización vs Validación vs Encoding

| Concepto | Acción | Ejemplo |
|---|---|---|
| **Validación** | Accept/reject input que no matchea regla | "email format only" → rechazar lo demás |
| **Sanitización** | Remove/replace chars peligrosos | Strip `<script>` tags |
| **Encoding/Escaping** | Transformar a representación segura para contexto | `<` → `&lt;` en HTML |

Buena defensa = contextual escaping al usar, NO sanitización temprana.

***

## Vectores de bypass común

### HTML
- Tags case-mixing: `<ScRiPt>`
- Tags fragmentados: `<scr<script>ipt>`
- Encoding: `%3Cscript%3E`, `&#x3C;script&#x3E;`
- mXSS: parser de browser difiere de sanitizer (DOMPurify edge cases)

### SQL
- Comments: `'; DROP/*comment*/TABLE`
- Encoding: `0x` hex literals
- Stacked queries con `;`
- Quote escaping: `''` vs `\'`

### Command Injection
- Operadores no filtrados: `&`, `|`, `;`, backticks, `$()`
- Espacios: `${IFS}`, `<<<`, `,`
- Encoding: base64+eval

Ver [[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)]], [[XSS - Filtros XSS y WAF mediante Codificaciones Múltiples]].

***

## Sanitización lib bypasses comunes

| Lib | Bypass conocido |
|---|---|
| DOMPurify | mXSS via SVG, MathML namespaces |
| bleach (Python) | Markdown rendering post-sanitize |
| sanitize-html (Node) | Attribute injection via SVG |
| WordPress `wp_kses` | Encoding tricks |

Buscar issues/CVEs específicos del lib + version.

***

## Defensa correcta

1. **Allowlist > blocklist** (chars permitidos, no prohibidos)
2. **Contextual encoding** al output, no al input
3. **Parametrized queries** (no string concat en SQL)
4. **CSP** para defense-in-depth XSS
5. **Type system fuerte** (TypeScript, etc.) limita inputs raros

***

## Notas Relacionadas

- [[Cross-Site Scripting (XSS)]]
- [[SQL Injection (SQLi)]]
- [[OS Command Injection]]
- [[HTML Injection - Bypass de Filtros]]
