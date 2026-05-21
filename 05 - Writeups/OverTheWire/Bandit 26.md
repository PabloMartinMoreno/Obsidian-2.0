---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit26.html
dificultad: Fácil
autor:
relacionados:
  - "[[Bandit 25]]"
  - "[[Bandit 27]]"
  - "[[SUID]]"
---
# Datos

> [!todo] Objetivo
>Buen trabajo consiguiendo un caparazón! ¡Ahora date prisa y consigue la contraseña para bandido27!
^objetivo

> [!tip] Recursos
> [[ls]], [[SUID]]
^recursos

# Resolución

Usando uno de los archivos que está en la carpeta de origen, se puede conseguir la contraseña rápidamente.
```bash
./bandit26-do cat /etc/bandit_pass/bandit27
```

# Bandera(s)

> [!flag] `upsNCc7vzaRDx6oZC6GiR6ERwe1MowGB`
^bandera
