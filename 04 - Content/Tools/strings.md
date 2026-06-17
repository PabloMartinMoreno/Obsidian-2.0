---
aliases:
  - strings
tags:
  - tool/strings
  - topic/reversing
  - topic/forensics
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Reverse Engineering]]"
kind: Tool
linked:
  - "[[Hex Dump]]"
  - "[[Common Linux Utilities]]"
---
# Comando `strings`

> [!info] strings
> Extrae las secuencias de caracteres **imprimibles** de un binario (o cualquier archivo). Primer paso del análisis de un ejecutable/dump: revela URLs, rutas, mensajes, credenciales hardcodeadas, nombres de funciones. Sintaxis: `strings [opciones] archivo`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `strings file.bin` | Todas las cadenas imprimibles | Triage inicial de un binario |
| `strings -n 8 file.bin` | Solo cadenas de ≥8 chars | Reducir ruido |
| `strings file.bin \| grep -iE 'pass\|key\|http\|flag'` | Filtrar lo interesante | Hunt de secrets/IOCs |
| `strings -e l file.exe` | Cadenas Unicode UTF-16LE | Binarios **Windows** |
| `strings -t x file.bin` | Cadenas + offset hex | Ubicar para editar con [[Hex Dump]] |
| `strings -a file.bin` | Escanea el archivo entero | No solo secciones de datos |
^strings-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-n N` | Largo mínimo de cadena (default 4) |
| `-a` | Escanea todo el archivo (no solo secciones inicializadas) |
| `-t {o,d,x}` | Muestra el offset en octal / decimal / hex |
| `-e {s,b,l,B,L}` | Codificación: single-byte, 16/32-bit big/little-endian (`-e l` para Windows Unicode) |
| `-f` | Antepone el nombre del archivo (varios archivos) |
| `-o` | Offset en octal (equiv. `-t o`) |

> Las cadenas de programas Windows suelen ser **UTF-16LE** → sin `-e l`, `strings` no las ve. Complementa con [[Hex Dump]] para inspeccionar los bytes exactos.
