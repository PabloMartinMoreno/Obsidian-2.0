---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit10.html
dificultad: Fácil
autor:
relacionados:
  - "[[base64]]"
  - "[[Bandit 09]]"
  - "[[Bandit 11]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se almacena en el archivo `data.txt`, que contiene datos codificados en base64
^objetivo

> [!tip] Recursos
> **Comandos:**
> grep, sort, uniq, strings, base64, tr, tar, gzip, bzip2, xxd
> 
> **Material:**
> [Base64](https://en.wikipedia.org/wiki/Base64)
^recursos

# Conceptos clave

[[base64]]

# Resolución

```bash
base64 -d data.txt
```

# Bandera(s)

> [!flag] `dtR173fZKb0RRsDFSGsg2RWnpNVj3qRr`
^bandera
