---
tags:
  - CTF
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit07.html
dificultad: Fácil
autor: 
relacionados:
  - "[[grep]]"
  - "[[awk]]"
  - "[[Bandit 06]]"
  - "[[Bandit 08]]"
---
# Datos

> [!TODO] Objetivo
> La contraseña para el siguiente nivel se almacena en el archivo data.txt junto a la palabra `millionth`
^objetivo

> [!TIP] Recursos
> **Comandos**:
> [man](https://manpages.ubuntu.com/manpages/noble/man1/man.1.html), grep, sort, uniq, strings, base64, tr, tar, gzip, bzip2, xxd
^recursos

# Conceptos clave

[[grep]]

# Resolución

```bash
grep millionth data.txt | awk '{print $NF}'
```

# Bandera(s)

> [!FLAG] `dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc`
^bandera
