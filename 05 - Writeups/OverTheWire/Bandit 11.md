---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit11.html
dificultad: Fácil
autor: 
relacionados:
  - "[[tr]]"
  - "[[Bandit 10]]"
  - "[[Bandit 12]]"
---
# Datos

> [!todo] Objetivo
La contraseña para el siguiente nivel se almacena en el archivo data.txt, donde todas las letras minúsculas (a-z) y mayúsculas (A-Z) se han girado 13 posiciones
^objetivo

> [!tip] Recursos
> **Comandos:**
grep, sort, uniq, strings, base64, tr, tar, gzip, bzip2, xxd
> 
> **Material:**
> [Rot13](https://en.wikipedia.org/wiki/Rot13)
^recursos

# Conceptos clave

[[tr]]
[[ROT13]]

# Resolución

```bash
cat data.txt | tr A-Za-z N-ZA-Mn-za-m
```

# Bandera(s)

> [!flag] `7x16WNeHIi5YkIhWsfFIqoognUTyj9Q4`
^bandera
