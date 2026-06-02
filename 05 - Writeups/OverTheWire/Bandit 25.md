---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit25.html
dificultad: Fácil
autor:
linked:
  - "[[more]]"
  - "[[Bandit 24]]"
  - "[[Bandit 26]]"
---
# Datos

> [!todo] Objetivo
> Entrar en bandit26 desde bandit25 debería ser bastante fácil... El shell para el usuario bandit26 no es /bin/bash, sino otra cosa. Averigua qué es, cómo funciona y cómo salir de él.
^objetivo

> [!tip] Recursos
> ssh, cat, more, vi, ls, id, pwd
^recursos

# Conceptos clave

Ver [[more]]

# Resolución

Empieza con una clave ssh privada.
```bash
ssh -i bandit26.sshkey bandit26@localhost -p 2220
```


De entrada nos dice que no tiene una shell, por lo que puedo fijarme a ver que tiene bandit26.
```bash
cat /etc/passwd | grep bandit26

bandit26:x:11026:11026:bandit level 26:/home/bandit26:/usr/bin/showtext
```

Hago un [[cat]] para ver que es eso que me dice que esta utilizando:
```bash
cat /usr/bin/showtext

#!/bin/sh
export TERM=linux

exec more ~/text.txt
exit 0
```

Pruebo ver el archivo que menciona: 
```bash
cat /home/bandit26/text.txt

cat: /home/bandit26/text.txt: Permission denied
```

No lo puedo ver, pero al menos sé que está haciendo un [[more]]

*Lo que sé es que more funciona de forma rara con comandos muy específicos y que cuando aparece el banner de bandit26, me saca*.

Para que no me saque necesito que no se termine de ver el banner, para eso debo achicar considerablemente la ventana para que no la termine de cargar. **En mi caso no funciona con la terminal `st`, pero sí usando `tmux`**.

Luego de eso sigue apretar `v` para entrar en el modo visual y `esc + shift + :` para poder poner el siguiente comando: 
```bash
set shell=/bin/bash
```

A continuación sigue volver a apretar `esc + shift + :` para ahora escribir `shell`. De esta forma me da una bash para bandit26. 

# Bandera(s)

> [!flag] `s0773xxkk0MXfdqOfPRVr9L3jJBUOgCZ`
^bandera
