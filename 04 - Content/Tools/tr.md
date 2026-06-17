---
aliases:
  - tr
tags:
  - tool/tr
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
---
# Comando `tr`

> [!info] tr (**Tr**anslate)
> Traduce o elimina caracteres de stdin → stdout. Útil para transformar texto. Sintaxis: `tr [opciones] set1 [set2]`. Opera sobre **caracteres**, no líneas (a diferencia de sed).
^definicion

---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `echo "hello" \| tr 'a-z' 'A-Z'` | Minúsculas → mayúsculas | Normalizar texto |
| `tr -d '0-9' < file` | Elimina los dígitos | Limpiar |
| `tr -s ' ' < file` | Comprime espacios repetidos a uno | Normalizar whitespace |
| `tr -cd 'a-zA-Z0-9' < file` | Borra todo lo que **no** sea alfanumérico | Sanitizar input |
| `tr ',' '\n' < file` | Reemplaza comas por saltos de línea | CSV → lista |
| `echo "txt" \| tr 'A-Za-z' 'N-ZA-Mn-za-m'` | ROT13 (cifra/descifra) | Ofuscación simple |
^tr-cheatsheet

---

## Opciones

| Flag | Qué hace |
|---|---|
| `-d` | **Elimina** los caracteres de `set1` |
| `-s` | **Comprime** (squeeze) repeticiones de `set1` a un solo carácter |
| `-c` | **Complementa** `set1` (todos **menos** los de `set1`) |
| `-t` | Trunca `set1` al largo de `set2` |

> `-c` + `-d` (`-cd`) = elimina todo lo que no esté en el set. Ej: `tr -cd 'a-zA-Z'` deja solo letras.

---

## ROT13

```bash
echo "Texto a rotar" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

- `A-M` ↔ `N-Z` (y minúsculas igual): cada letra rota 13 posiciones.
- Es **simétrico**: aplicar el mismo comando a un texto cifrado lo descifra (26 letras / 2 = 13).

> Útil para ocultar texto legible (spoilers, respuestas a acertijos). **No** es seguridad — trivial de descifrar.
