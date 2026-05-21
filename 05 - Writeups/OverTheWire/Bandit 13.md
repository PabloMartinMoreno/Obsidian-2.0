---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit13.html
dificultad: Fácil
autor:
relacionados:
  - "[[Pares de claves SSH]]"
  - "[[Bandit 12]]"
  - "[[Bandit 14]]"
  - "[[SSH (22) - Enumeración|ssh]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se almacena en /etc/bandit_pass/bandit14 y sólo puede ser leída por el usuario bandit14. Para este nivel, no obtienes la siguiente contraseña, pero obtienes una clave SSH privada que puede ser usada para iniciar sesión en el siguiente nivel. Nota: localhost es un nombre de host que se refiere a la máquina en la que estás trabajando.
^objetivo

> [!tip] Recursos
> **Comandos:**
> ssh, telnet, nc, openssl, s_client, nmap
> 
> **Material:**
> [OpenSSH/Keys](https://help.ubuntu.com/community/SSH/OpenSSH/Keys)
^recursos

# Conceptos clave

Ver [[Pares de claves SSH]]

# Resolución

Nos dan una clave privada, para uno poder acceder a través de ella tuvo que haber un paso previo donde la clave publica está en authorized_keys. La forma de conectarse a través de la clave privada filtrada es: 

```bash
ssh -i sshkey.private bandit14@localhost -p 2220
```

# Bandera(s)

> [!flag] `MU4VWeTyJk8ROof1qqmcBPaLh7lDCPvS`
^bandera
