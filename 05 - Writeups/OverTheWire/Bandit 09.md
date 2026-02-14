---
tags:
  - CTF
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit09.html
dificultad: Fácil
autor: 
relacionados:
  - "[[strings]]"
  - "[[awk]]"
  - "[[tail]]"
  - "[[Bandit 08]]"
  - "[[Bandit 10]]"
---
# Datos

> [!TODO] Objetivo
> La contraseña para el siguiente nivel se almacena en el archivo `data.txt` en una de las pocas cadenas legibles por humanos, precedida de varios caracteres "=".
^objetivo

> [!TIP] Recursos
> grep, sort, uniq, strings, base64, tr, tar, gzip, bzip2, xxd
^recursos

# Conceptos clave

[[strings]]

# Resolución

```bash
strings data.txt | grep === | tail -n 1 | awk '{print $NF}'
```

# Bandera(s)

> [!FLAG] `FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey`
^bandera
