---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit0.html
dificultad: Fácil
autor: 
relacionados:
  - "[[Pares de claves SSH]]"
  - "[[Bandit 01]]"
  - "[[SSH (22) - Enumeración|ssh]]"
---
# Datos

> [!TODO] Objetivo
> **Conectarse al juego usando [[SSH (22) - Enumeración|SSH]].**
> El objetivo de este nivel es que te conectes al juego usando SSH. El host al que necesitas conectarte es bandit.labs.overthewire.org, en el puerto 2220. El nombre de usuario es bandit0 y la contraseña es bandit0. Una vez conectado, ve a la página del Nivel 1 para averiguar cómo superar el Nivel 1.
^Objetivo

>[!TIP] Recursos
> **Comandos**
> - [ssh](https://man7.org/linux/man-pages/man1/ssh.1.html)
> 
> **Referencias**
> - [Secure Shell (SSH) en Wikipedia](https://en.wikipedia.org/wiki/Secure_Shell)
> - [Cómo usar SSH en WikiHow](https://en.wikipedia.org/wiki/Secure_Shell)
^recursos

# Resolución

Para conectarse:
```shell
ssh bandit0@bandit.labs.overthewire.org -p 2220
```

Para leer el archivo:
> [!SUCCESS] Este comando cumple el [[#^objetivo|objetivo]]
> ```bash 
> cat readme

>[!TIP]
Otra forma para conectarse a ssh es usando [[sshpass]]: 
>```bash
>sshpass -p '[contraseña]' ssh bandit2@bandit.labs.overthewire.org -p 2220
>```
o cargandolo desde un fichero que contenga la contraseña: 
>```bash
sshpass -f [fichero] ssh bandit20@bandit.labs.overthewire.org -p 2220
>```

# Bandera

> [!FLAG]  `ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If`

