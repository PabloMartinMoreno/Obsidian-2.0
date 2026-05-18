---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit16.html
dificultad: Fácil
autor: 
relacionados:
  - "[[nmap]]"
  - "[[ncat]]"
  - "[[SSL - TLS]]"
  - "[[Bandit 15]]"
  - "[[Bandit 17]]"
  - "[[Pares de claves SSH]]"
  - "[[SSH (22) - Enumeración|ssh]]"
---
# Datos

> [!TODO] Objetivo
> Las credenciales para el siguiente nivel se pueden recuperar enviando la contraseña del nivel actual a un puerto en localhost en el rango 31000 a 32000. Primero averigua cuáles de estos puertos tienen un servidor escuchando en ellos. Luego averigua cuáles de ellos hablan SSL y cuáles no. Sólo hay 1 servidor que dará las siguientes credenciales, los demás simplemente te devolverán lo que le envíes.
^objetivo

> [!TIP] Recursos
>**Comandos:**
> ssh, telnet, nc, openssl, s_client, nmap
> 
> **Material:**
> [Port scanner on Wikipedia](https://en.wikipedia.org/wiki/Port_scanner)
^recursos

# Conceptos clave

Ver [[nmap]], [[ncat]], [[SSL - TLS]], [[Pares de claves SSH]]

# Resolución

Busco los puertos abiertos en los rangos dados:

```bash
nmap --open -T5 -v -n -p31000-32000 127.0.0.1
```
- `--open`: Esta opción le indica a Nmap que solo muestre los hosts que tienen al menos un puerto abierto. Esto filtra la salida para mostrar solo los sistemas que tienen servicios activos.

- `-T5`: Especifica el nivel de agresividad del escaneo, donde T5 es la velocidad de escaneo más alta. Los niveles van de T0 (más lento) a T5 (más rápido). El valor T5 puede aumentar la velocidad del escaneo a costa de un mayor consumo de recursos y mayor intrusividad en la red.

- `-v`: Habilita el modo verboso (verbose), lo que significa que mostrará más detalles durante el escaneo. Esto puede ser útil para obtener información detallada sobre el progreso del escaneo.

- `-n`: Le indica a Nmap que no realice la resolución de nombres DNS durante el escaneo. Esto acelera el escaneo al evitar la búsqueda de nombres de host.

- `-p31000-32000`: Define el rango de puertos que se escanearán. En este caso, el rango es desde el puerto 31000 hasta el puerto 32000. Solo se escanearán los puertos en este intervalo.

- `127.0.0.1`: Es la dirección IP del host que se va a escanear. En este caso, se está escaneando el localhost (la propia máquina donde se ejecuta el comando).

Me devuelve:
```
31046/tcp open  unknown
31518/tcp open  unknown
31691/tcp open  unknown
31790/tcp open  unknown
31960/tcp open  unknown
```

Si quiero obtener más información puedo usar:

Pruebo entre los puertos abiertos para conectarme: 
```bash
nmap --open -sV -p31000-32000 localhost
```
```
31046/tcp open  echo
31518/tcp open  ssl/echo
31691/tcp open  echo
31790/tcp open  ssl/unknown
31960/tcp open  echo
```

Veo dos puertos que dice `ssl`, por lo que me parece más lógico probar con esos primero. 

```bash
 ncat --ssl localhost 31790

# Pongo la contraseña anterior y devuelve una clave privada:

-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAvmOkuifmMg6HL2YPIOjon6iWfbp7c3jx34YkYWqUH57SUdyJ
imZzeyGC0gtZPGujUSxiJSWI/oTqexh+cAMTSMlOJf7+BrJObArnxd9Y7YT2bRPQ
Ja6Lzb558YW3FZl87ORiO+rW4LCDCNd2lUvLE/GL2GWyuKN0K5iCd5TbtJzEkQTu
DSt2mcNn4rhAL+JFr56o4T6z8WWAW18BR6yGrMq7Q/kALHYW3OekePQAzL0VUYbW
JGTi65CxbCnzc/w4+mqQyvmzpWtMAzJTzAzQxNbkR2MBGySxDLrjg0LWN6sK7wNX
x0YVztz/zbIkPjfkU1jHS+9EbVNj+D1XFOJuaQIDAQABAoIBABagpxpM1aoLWfvD
KHcj10nqcoBc4oE11aFYQwik7xfW+24pRNuDE6SFthOar69jp5RlLwD1NhPx3iBl
J9nOM8OJ0VToum43UOS8YxF8WwhXriYGnc1sskbwpXOUDc9uX4+UESzH22P29ovd
d8WErY0gPxun8pbJLmxkAtWNhpMvfe0050vk9TL5wqbu9AlbssgTcCXkMQnPw9nC
YNN6DDP2lbcBrvgT9YCNL6C+ZKufD52yOQ9qOkwFTEQpjtF4uNtJom+asvlpmS8A
vLY9r60wYSvmZhNqBUrj7lyCtXMIu1kkd4w7F77k+DjHoAXyxcUp1DGL51sOmama
+TOWWgECgYEA8JtPxP0GRJ+IQkX262jM3dEIkza8ky5moIwUqYdsx0NxHgRRhORT
8c8hAuRBb2G82so8vUHk/fur85OEfc9TncnCY2crpoqsghifKLxrLgtT+qDpfZnx
SatLdt8GfQ85yA7hnWWJ2MxF3NaeSDm75Lsm+tBbAiyc9P2jGRNtMSkCgYEAypHd
HCctNi/FwjulhttFx/rHYKhLidZDFYeiE/v45bN4yFm8x7R/b0iE7KaszX+Exdvt
SghaTdcG0Knyw1bpJVyusavPzpaJMjdJ6tcFhVAbAjm7enCIvGCSx+X3l5SiWg0A
R57hJglezIiVjv3aGwHwvlZvtszK6zV6oXFAu0ECgYAbjo46T4hyP5tJi93V5HDi
Ttiek7xRVxUl+iU7rWkGAXFpMLFteQEsRr7PJ/lemmEY5eTDAFMLy9FL2m9oQWCg
R8VdwSk8r9FGLS+9aKcV5PI/WEKlwgXinB3OhYimtiG2Cg5JCqIZFHxD6MjEGOiu
L8ktHMPvodBwNsSBULpG0QKBgBAplTfC1HOnWiMGOU3KPwYWt0O6CdTkmJOmL8Ni
blh9elyZ9FsGxsgtRBXRsqXuz7wtsQAgLHxbdLq/ZJQ7YfzOKU4ZxEnabvXnvWkU
YOdjHdSOoKvDQNWu6ucyLRAWFuISeXw9a/9p7ftpxm0TSgyvmfLF2MIAEwyzRqaM
77pBAoGAMmjmIJdjp+Ez8duyn3ieo36yrttF5NSsJLAbxFpdlc1gvtGCWW+9Cq0b
dxviW8+TFVEBl1O4f7HVm6EpTscdDxU+bCXWkfjuRb7Dy9GOtt9JPsX8MBTakzh3
vBgsyi/sN3RqRBcGU40fOoZyfAMT8s1m/uYv52O6IgeuZ/ujbjY=
-----END RSA PRIVATE KEY-----

```

Pongo la clave privada en un archivo llamado `id_rsa` en una carpeta temporal. 

Le doy el permiso 600 `chmod 600 id_rsa`

Me conecto 
```bash
ssh -i id_rsa bandit17@localhost -p 2220
```

# Bandera(s)

> [!FLAG] `EReVavePLFHtFlFsjn3hyzMlvSuSAcRD`
^bandera
