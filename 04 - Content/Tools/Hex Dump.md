---
aliases:
  - hexdump
  - xxd
  - hex dump
tags:
  - tool/hexdump
  - tool/xxd
  - topic/reversing
  - topic/forensics
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Reverse Engineering]]"
kind: CheatSheet
linked:
  - "[[Metodología Forense]]"
---
# Hex Dump

> [!abstract] TL;DR
> Representación de datos en **hexadecimal** (cada byte = 2 dígitos base 16) + columna ASCII. Permite ver el contenido exacto de un archivo/memoria incluyendo bytes no imprimibles. Base del análisis binario, forense y reversing. Estructura: **offset** | **bytes hex** | **ASCII**.

---

## Generar Hex Dump

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `xxd archivo.bin` | Dump hex + ASCII (8 bytes × 2 cols) | El más legible, default para CTF/reversing |
| `xxd -s 0x100 -l 64 archivo.bin` | 64 bytes desde el offset `0x100` | Inspeccionar una región puntual |
| `hexdump -C archivo.bin` | Formato canónico (offset, hex, ASCII) | Equivalente a `xxd`, en sistemas sin xxd |
| `od -Ax -tx1z archivo.bin` | Offset hex, bytes hex, ASCII (`-z`) | Cuando solo hay `od` |
| `xxd archivo \| head` / `xxd archivo \| grep -i "magic"` | Acotar la salida | Archivos grandes |
^hex-generar

## Conversiones

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `xxd -r dump.hex archivo.bin` | Hex dump → binario original | Reconstruir un archivo desde su dump |
| `xxd -p archivo.bin` | Hex plano (sin offset/ASCII) | Extraer solo los bytes para pipeline |
| `echo -n "deadbeef" \| xxd -r -p` | String hex → bytes crudos | Decodificar hex inline |
| `xxd -i archivo.bin` | Array C de bytes | Embeber un blob en código |
^hex-conversiones

## Uso

- **Reversing / CTF:** identificar **magic bytes** (`MZ`=PE, `\x7fELF`=ELF, `PK`=ZIP, `\xff\xd8`=JPEG) y estructuras de archivo.
- **Forense:** ver manipulación, recuperar strings/datos ocultos — ver [[Metodología Forense]].
- **HxD** (Windows): editor hex gráfico para ver/modificar interactivamente.
^hex-uso
