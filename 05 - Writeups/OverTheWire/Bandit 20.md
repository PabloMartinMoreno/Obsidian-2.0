---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit20.html
dificultad: Fácil
autor: 
relacionados:
  - "[[nc]]"
  - "[[Bandit 19]]"
  - "[[Bandit 21]]"
  - "[[SUID]]"
---
# Datos

> [!TODO] Objetivo
> Hay un binario setuid en el homedirectory que hace lo siguiente: establece una conexión con localhost en el puerto que especifiques como argumento en la línea de comandos. Luego lee una línea de texto de la conexión y la compara con la contraseña del nivel anterior (bandit20). Si la contraseña es correcta, transmitirá la contraseña para el siguiente nivel (bandit21).
>
NOTA: Prueba a conectarte a tu propio demonio de red para ver si funciona como crees
^objetivo

> [!TIP] Recursos
> ssh, nc, cat, bash, screen, tmux, Unix ‘job control’ (bg, fg, jobs, &, CTRL-Z, …)
^recursos

# Conceptos clave

Ver [[SUID]] y [[nc]]

# Resolución

Al ejecutar `suconnect` me dice: 
```
Este programa se conectará al puerto dado en localhost usando TCP. Si recibe la contraseña correcta del otro lado, la siguiente contraseña se transmite de vuelta.
```

Me conecto desde dos sesiones distintas a `bandit20`.

En una voy a usar `nc` y ponerme en escucha: 
```bash
nc -l -p 3333
```

En otra voy a usar el binario `suconnect` y ponerle el mismo puerto que puse en escucha:
```bash
./suconnect 3333
```

Al enviar la contraseña de `bandit20` desde la sesión de `nc`, recibo en la sesión que ejecuto `suconnect` la contraseña para [[Bandit 21]]

# Bandera(s)

> [!FLAG] `EeoULMCra2q0dSkYj561DX7s1CpBuOBt`
^bandera
