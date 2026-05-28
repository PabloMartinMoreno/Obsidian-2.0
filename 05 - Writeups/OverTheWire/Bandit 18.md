---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit18.html
dificultad: Fácil
autor:
relacionados:
  - "[[Bash]]"
  - "[[Bandit 17]]"
  - "[[Bandit 19]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se almacena en un archivo readme en el homedirectory. Desafortunadamente, alguien ha modificado .bashrc para cerrar la sesión cuando te conectas con SSH.
^objetivo

> [!tip] Recursos
> **Comandos:**
> ssh, ls, cat
^recursos

# Resolución

```bash
sshpass -f bandit18 ssh bandit18@bandit.labs.overthewire.org -p 2220
```
```
Connection to bandit.labs.overthewire.org closed.
```

La sesión se cierra, así que pruebo mandarle comandos directamente para ver si loso recibe antes de cerrarse. 
```bash
sshpass -f bandit18 ssh bandit18@bandit.labs.overthewire.org -p 2220 whoami
```
```
bandit18
```

Recibe los comandos, así que pruebo mandarle una bash: 
```bash
sshpass -f bandit18 ssh bandit18@bandit.labs.overthewire.org -p 2220 bash
```

Listo, estoy adentro, sólo sigue leer el readme

>[!Tip] 
> Entendiendo que ya sé como se llama el archivo, también podría ver la contraseña sin necesidad de ejecutar una bash
> ```
sshpass -f bandit18 ssh bandit18@bandit.labs.overthewire.org -p 2220 'cat readme'
>```

# Bandera(s)

> [!flag] `cGWpMaKXVwDUNgPAVJbWYuGHVn9zl3j8`
^bandera
