---
tags:
  - CTF
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit15.html
dificultad: Fácil
autor: 
relacionados:
  - "[[ncat]]"
  - "[[SSL - TLS]]"
  - "[[Bandit 14]]"
  - "[[Bandit 16]]"
---
# Datos

> [!TODO] Objetivo
> La contraseña para el siguiente nivel se puede recuperar enviando la contraseña del nivel actual al puerto 30001 en localhost utilizando encriptación SSL.
>
Nota útil: ¿Obtiene "HEARTBEATING" y "Read R BLOCK"? Utilice -ign_eof y lea la sección "COMANDOS CONECTADOS" en la página de manual. Junto a 'R' y 'Q', el comando 'B' también funciona en esta versión de ese comando...
^objetivo

> [!TIP] Recursos
>**Comandos:**
> ssh, telnet, nc, openssl, s_client, nmap
> 
> **Material:**
> - [Secure Socket Layer/Transport Layer Security on Wikipedia](https://en.wikipedia.org/wiki/Secure_Socket_Layer)
>- [OpenSSL Cookbook - Testing with OpenSSL](https://www.feistyduck.com/library/openssl-cookbook/online/testing-with-openssl/index.html)
^recursos

# Conceptos clave

### Ncat y SSL/TLS

Ver [[ncat]] y [[SSL - TLS|SSL/TLS]]

# Resolución

El servidor ya está iniciado, por lo que simplemente lo que hay que hacer es conectarse a ese servidor.
```bash
ncat --ssl localhost 30001
```
Al igual que el anterior envió la contraseña anterior y listo.

# Bandera(s)

> [!FLAG] `kSkvUpMQ7lBYyCM4GBPvCvT1BfWRy0Dx`
^bandera
