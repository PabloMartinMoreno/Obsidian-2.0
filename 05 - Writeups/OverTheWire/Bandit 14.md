---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit14.html
dificultad: Fácil
autor:
linked:
  - "[[nc]]"
  - "[[Bandit 13]]"
  - "[[Bandit 15]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se puede recuperar enviando la contraseña del nivel actual al puerto 30000 en localhost.
^objetivo

> [!tip] Recursos
> **Comandos:**
> ssh, telnet, nc, openssl, s_client, nmap
> 
> **Material:**
> - [How the Internet works in 5 minutes (YouTube)](https://www.youtube.com/watch?v=7_LPdttKXPc) (Para principiantes)
> - [IP Addresses](http://computer.howstuffworks.com/web-server5.htm)
>- [IP Address on Wikipedia](https://en.wikipedia.org/wiki/IP_address)
>- [Localhost on Wikipedia](https://en.wikipedia.org/wiki/Localhost)
>- [Ports](http://computer.howstuffworks.com/web-server8.htm)
>- [Port (computer networking) on Wikipedia](https://en.wikipedia.org/wiki/Port_(computer_networking))
^recursos

# Resolución

Me conecto al servidor con los datos dados en la consigna. 
```bash
nc localhost 30000
```

Pongo la contraseña del nivel anterior y listo.

>[!tip] 
>Las contraseñas se pueden enviar directamente de la siguiente forma:
>
>```bash
> echo '{contraseña}' | nc localhost 3000
># O tambien
> cat {fichero con la contraseña} | nc localhost 3000
>```

# Bandera(s)

> [!flag] `8xCjnmgoKbGLhHFAZlGE5Tmu4M2tKJQo`
^bandera
