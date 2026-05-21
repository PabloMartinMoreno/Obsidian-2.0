---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit08.html
dificultad: Fácil
autor:
relacionados:
  - "[[sort]]"
  - "[[uniq]]"
  - "[[Bandit 07]]"
  - "[[Bandit 09]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se almacena en el archivo data.txt y es la única línea de texto que aparece una sola vez
^objetivo

> [!tip] Recursos
> grep, sort, uniq, strings, base64, tr, tar, gzip, bzip2, xxd
^recursos

# Conceptos clave

[[sort]]
[[uniq]]

# Resolución

```bash
sort data.txt | uniq -u

4CKMh1JI91bUIZZPXDqGanal4xvAg0JM
```


# Bandera(s)

> [!flag] `4CKMh1JI91bUIZZPXDqGanal4xvAg0JM`
^bandera
