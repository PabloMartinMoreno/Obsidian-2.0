---
tags:
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/240
dificultad: Media
ip: 10.10.10.184
os: Windows
linked:
  - "[[NVMS-1000 Exploitation]]"
  - "[[Directory Traversal]]"
  - "[[File Inclusion|Local FIle Inclusion]]"
  - "[[Local Port Forwarding]]"
  - "[[NSClient++ Exploitation]]"
  - "[[Password Reuse]]"
  - "[[ssh tunneling]]"
---
# HackTheBox - Servmon

## Reconocimiento

### Escaneo de Puertos con Nmap

Para comenzar mi análisis, realicé un escaneo completo de puertos TCP en la máquina objetivo `10.10.10.184` utilizando `nmap`. El objetivo inicial era identificar todos los servicios expuestos.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Reconnaissance/allports
nmap -sCV -p21,22,80,8443 $(cat ip) -oN 00_Reconnaissance/sCV
```

Los resultados revelaron varios puertos abiertos de interés:
- **21/tcp (FTP):** vsftpd 3.0.3, permite el inicio de sesión anónimo.
- **22/tcp (SSH):** OpenSSH 7.6p1.
- **80/tcp (HTTP):** Microsoft IIS httpd 10.0.
- **8443/tcp (HTTPS):** Microsoft IIS httpd 10.0.
    
### Enumeración del servicio FTP

Dado que el servicio FTP permitía el acceso anónimo, decidí explorarlo en busca de información útil.
```Bash
ftp 10.10.10.184
# Usuario: anonymous
# Contraseña: (en blanco)
```

Una vez dentro, activé el modo pasivo y listé el contenido. Encontré un directorio `Users` que contenía subdirectorios para dos usuarios: `Nadine` y `Nathan`. Dentro de cada uno, había un archivo de texto.

Encontré dos archivos particularmente reveladores:

1. `Nadine\Confidential.txt`: Este archivo contenía una nota que me alertó sobre un archivo de contraseñas en el escritorio de otro usuario.

> [!note] Contenido de Confidential.txt
> 
> Nathan,
> 
> I left your Passwords.txt file on your Desktop. Please remove this once you have edited it yourself and place it back into the secure folder.
> 
> Regards
> 
> Nadine

2. `Nathan\Notes to do.txt`: Este archivo ofrecía un contexto sobre las aplicaciones instaladas y las tareas de seguridad pendientes, mencionando específicamente **NVMS** y **NSClient**.

> [!note] Contenido de `Notes to do.txt`
>
> 1. Change the password for NVMS - Complete
> 2. Lock down the NSClient Access - Complete
> 3. Upload the passwords
> 4. Remove public access to NVMS
> 5. Place the secret files in SharePoint

Esta información fue crucial, ya que me proporcionó nombres de usuario (`Nadine`, `Nathan`) y un objetivo claro: encontrar el archivo `Passwords.txt` en el escritorio de Nathan.

### Inspección de los servicios Web

Al visitar la dirección IP en el puerto 80, encontré la página de inicio de sesión del software **NVMS-1000** (Network Video Management System). Intenté usar credenciales por defecto (`admin:123456`) sin éxito.

En el puerto 8443, se presentaba una página de inicio de sesión para **NSClient++**. De igual manera, los intentos con credenciales comunes no funcionaron.


---

## Análisis de vulnerabilidades

### NVMS-1000 - Local File Inclusion (LFI)

Con el nombre del software `NVMS-1000` identificado, realicé una búsqueda en Exploit-DB y encontré una vulnerabilidad de **Inclusión Local de Archivos (LFI)**, catalogada como **CVE-2019-20085**.

> [!VULNERABILITY] Local File Inclusion (LFI)
> 
> Esta vulnerabilidad permite a un atacante leer archivos locales del servidor a los que no debería tener acceso a través de la aplicación web. Esto ocurre cuando la aplicación utiliza la entrada del usuario para construir la ruta de un archivo sin una validación o saneamiento adecuados.

Para validar esta vulnerabilidad, utilicé un payload común que intenta leer el archivo `win.ini`, un archivo de configuración presente en la mayoría de las instalaciones de Windows y legible por cualquier usuario.

---

## Explotación de vulnerabilidades

### Obteniendo Acceso Inicial (Foothold)

Mi objetivo era combinar la información del FTP con la vulnerabilidad LFI del NVMS-1000 para obtener las credenciales y acceder al sistema.

### Lectura de Credenciales vía LFI

Utilicé Burp Suite para interceptar una petición al servidor web del puerto 80 y la envié al Repeater. Modifiqué la solicitud `GET` para explotar la vulnerabilidad LFI y leer el archivo `Passwords.txt` que, según la nota encontrada en el FTP, se encontraba en el escritorio de Nathan.
```HTTP
GET /../../../../../../../../../../Users/Nathan/Desktop/Passwords.txt HTTP/1.1
Host: 10.10.10.184
...
```

La respuesta del servidor confirmó la vulnerabilidad y me devolvió una lista de contraseñas.

> [!CAUTION] Contraseñas Obtenidas
> 
> ```
> 1nsp3ctTh3Way2Mars!
> Th3r34r3To0M4nyTrait0r5!
> B3WithM30r4ga1n5tMe
> L1k3B1gBut7s@W0rk
> 0nly7h3y0unGWi11F0l10w
> IfH3s4b0Utg0t0H1sH0me
> Gr4etN3w5w17hMySk1Pa5$
> ```

### Acceso por SSH

Con una lista de usuarios (`nadine`, `nathan`) y una lista de contraseñas, realicé un ataque de _password spraying_ contra el servicio SSH utilizando el módulo `netexec`.
```Bash
netexec ssh $(cat ip) -u users -p passwords --continue-on-success
```

El ataque fue exitoso, encontrando una credencial válida: **`nadine:L1k3B1gBut7s@W0rk`**. Con esto, logré acceder a la máquina a través de SSH y capturé la bandera de usuario en `C:\Users\Nadine\Desktop\user.txt`.


---

## Escalada de privilegios

### Enumeración Interna como 'nadine'

Una vez dentro como `nadine`, mi primer paso fue enumerar el sistema en busca de vectores de escalada. Descubrí el directorio `C:\Program Files\NSClient++` y, dentro de él, el archivo de configuración `nsclient.ini`. Al leerlo, encontré la contraseña del panel web de NSClient++.

> [!info] Credencial Encontrada en nsclient.ini
> 
> ew2x6SsGTxjRwXOT

El archivo también especificaba que solo se permitían conexiones desde `allowed_hosts = 127.0.0.1`, lo que significaba que la interfaz web solo era accesible localmente.

### Evadiendo la Restricción de 'localhost' con SSH Tunneling

Para eludir la restricción de `localhost` y acceder al panel web de NSClient++ desde mi máquina, creé un túnel SSH (redirección de puertos local).
```Bash
ssh -L 8443:127.0.0.1:8443 nadine@10.10.10.184
```

Este comando redirige el puerto 8443 de mi máquina local al puerto 8443 de la máquina víctima a través de la conexión SSH. Ahora, al acceder a `https://localhost:8443` en mi navegador, estaría interactuando con el panel web de NSClient++ en el servidor.

### Abuso de NSClient++ para Ejecución de Comandos

Con el túnel activo, accedí a la interfaz web y me autentiqué con la contraseña que había encontrado. Procedí a abusar de la funcionalidad de "scripts externos":

1. Navegué a **Settings > External Scripts > Scripts**.
2. Añadí un nuevo script. Configuré un alias (`shell`) para que ejecutara un archivo por lotes que crearía más tarde en `C:\Temp\pwn.bat`.
3. Guardé la configuración. Este cambio no se aplicaría hasta que el servicio se reiniciara.
    
Mi usuario `nadine` tenía los permisos necesarios para reiniciar el servicio, lo cual confirmé con `Get-Service nscp`. La propiedad `CanStop` estaba en `true`.

### Obteniendo una Shell como SYSTEM

Para obtener una shell reversa como `SYSTEM`, seguí estos pasos:

1. **Crear el payload**: Usé **GreatSCT** para generar un payload de Meterpreter en formato DLL (`serv.dll`) que evadiera las defensas comunes.
    
2. **Transferir el payload**: Inicié un servidor web con Python en mi máquina para alojar el `serv.dll`. Desde la shell de `nadine`, descargué el archivo a `C:\Temp\serv.dll`.
    
3. **Crear el script de ejecución (`pwn.bat`)**: Creé el archivo `pwn.bat` en la máquina víctima con el comando que ejecutaría mi payload DLL usando `regsvcs.exe`.
    ```PowerShell
    cmd /c "echo C:\Windows\Microsoft.NET\Framework\v4.0.30319\regsvcs.exe C:\Temp\serv.dll > C:\Temp\pwn.bat"
    ```
    
4. **Iniciar el listener**: En mi máquina, configuré `msfconsole` para recibir la conexión entrante.
    
5. **Reiniciar el servicio**: Para que mi nuevo script `shell` fuera cargado por NSClient++, reinicié el servicio `nscp`.
    ```PowerShell
    sc.exe stop nscp
    sc.exe start nscp
    ```
    
6. **Ejecutar el payload**: De vuelta en la interfaz web de NSClient++, navegué a la sección de consola, escribí `shell` (el alias de mi script) y lo ejecuté.
    
Inmediatamente, recibí una conexión en mi listener de Metasploit con una sesión de `NT AUTHORITY\SYSTEM`. Con estos privilegios, pude leer la bandera final en `C:\Users\Administrator\Desktop\root.txt`.


---

## Bandera(s)

> [!flag] `flag{user}`
> f9dcd6faa29be662c8a4e7e78116d616
^bandera-user

> [!flag] `flag{root}`
^bandera-root
