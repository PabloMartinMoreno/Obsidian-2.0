---
tags:
  - CTF
  - estado/incompleto
platform: "[[Hack the Box]]"
type: CTF
web: https://app.hackthebox.com/machines/Bashed
difficulty: Easy
ip:
os: Linux
linked:
---
# HackTheBox - Bashed

---

## Enumeración

La fase de enumeración tiene dos objetivos:

1. **A nivel de red:** identificar qué servicios están expuestos.
2. **A nivel de aplicación web:** descubrir contenido oculto que no esté enlazado desde la página principal.

### Nmap

Nmap es la herramienta estándar para escanear puertos y detectar servicios. Lanzamos un escaneo con detección de versiones y scripts por defecto:

```bash
nmap -sC -sV <ip-objetivo>
```

Donde:
- `-sC` ejecuta los scripts NSE por defecto (información adicional sobre cada servicio).
- `-sV` intenta determinar la versión del software escuchando en cada puerto.

> [!success] Resultado El escaneo revela únicamente un **servidor Apache corriendo en el puerto 80**.

Al haber un solo vector de entrada (HTTP), toda la fase siguiente se concentra en la aplicación web.

### Inspección manual del sitio

Antes de lanzar herramientas de fuzzing automatizadas, vale la pena navegar manualmente la web. La página principal incluye un **post de blog** que insinúa la existencia de una ruta de desarrollo. Esta pista es fundamental: el contenido del blog apunta hacia el directorio que luego confirmaremos por fuerza bruta.

> [!tip] Pista en el blog Siempre revisar el contenido visible del sitio antes de fuzzear. La ruta `/dev` está referenciada de forma indirecta en el post del blog de la página principal.

### Dirbuster

Dirbuster es una herramienta de **fuzzing web** que prueba rutas comunes contra el servidor para descubrir directorios y archivos no enlazados públicamente. Funciona enviando peticiones HTTP usando un diccionario de palabras y observando los códigos de respuesta.

Entre los resultados, Dirbuster revela un directorio `/dev` que contiene una **copia funcional de phpbash**.

> [!note] ¿Qué es phpbash? **phpbash** es una webshell escrita en PHP que emula una terminal directamente en el navegador. Cuando está expuesta sin autenticación, cualquier visitante puede ejecutar comandos en el servidor con los privilegios del proceso de Apache (`www-data` por defecto).

El hallazgo de `/dev/phpbash.php` confirma la pista del blog y nos da el primer punto de apoyo sobre la máquina.

---

## Explotación

### Acceso inicial vía phpbash

Dado que phpbash ya entrega una terminal interactiva en el navegador, **obtener una shell completa es trivial**. La interfaz web permite ejecutar comandos como `www-data` directamente, pero conviene migrar a una shell "real" en nuestra máquina atacante por dos motivos:

1. **Estabilidad:** la interfaz web puede tener limitaciones en comandos interactivos o de larga duración.
2. **Comodidad:** una shell local permite usar herramientas como `tmux`, autocompletado, historial, etc.

#### Opción A — Reverse shell (connect-back)

Se ejecuta a través de phpbash un comando "connect-back" que abre una conexión saliente desde el objetivo hacia un listener controlado por el atacante. Existen muchas variantes (bash, python, nc, perl, php, etc.); cualquiera de ellas funciona aquí porque el servidor tiene salida hacia el atacante y phpbash ejecuta comandos arbitrarios sin filtrado.

#### Opción B — Stager de Meterpreter

Alternativamente, se puede usar phpbash para descargar y ejecutar un **stager de Meterpreter**, lo que entrega una sesión más rica en funcionalidades a través de Metasploit (transferencia de archivos, port forwarding, módulos post, etc.).

> [!success] Foothold Independientemente del método, el resultado es una shell como el usuario `www-data` (el usuario bajo el que corre Apache).

---

## Escalada de privilegios

### Reconocimiento local

Una vez dentro como `www-data`, el siguiente paso es enumerar el sistema buscando rutas para escalar privilegios. Explorando los directorios del objetivo aparece rápidamente un directorio llamado `/scripts`, que llama la atención por dos razones:

1. **No es un directorio estándar de Linux**, por lo que muy probablemente forme parte de la lógica específica de la máquina.
2. **Su propietario es el usuario `scriptmanager`**, no root ni www-data — lo que sugiere que existe un usuario intermedio relevante.

### Pivote a `scriptmanager` mediante `sudo -l`

El comando `sudo -l` lista qué comandos puede ejecutar el usuario actual mediante `sudo`, y bajo qué identidad. Es una de las primeras comprobaciones obligatorias en cualquier escalada de privilegios en Linux:

```bash
sudo -l
```

> [!success] Resultado La salida muestra que el usuario `www-data` puede ejecutar **cualquier comando** como el usuario `scriptmanager`, **sin contraseña**.

Esta configuración es lo que conecta la webshell con el siguiente nivel de privilegios. Para aprovecharla, basta con spawnear una shell interactiva impersonando a `scriptmanager`:

```bash
sudo -u scriptmanager bash -i
```

Donde:

- `-u scriptmanager` indica el usuario destino.
- `bash -i` lanza Bash en modo **interactivo**, dejando un prompt usable.

A partir de ese momento, el contexto del proceso es `scriptmanager`, y por lo tanto se obtiene **acceso completo de lectura y escritura** sobre `/scripts`, ya que ese directorio le pertenece a este usuario.

### Root vía cron job en `/scripts`

Con permisos de escritura sobre `/scripts`, hay que entender qué se está ejecutando ahí dentro y por quién. Inspeccionando el directorio aparecen dos archivos relevantes:

- `test.py` — un script de Python.
- `test.txt` — un archivo de salida generado por el script.

Hay dos observaciones clave que se obtienen mirando estos archivos:

1. **El contenido de `test.py`** indica claramente que su trabajo es escribir/actualizar `test.txt`. Es decir, `test.txt` es el producto de ejecutar `test.py`.
2. **El timestamp de `test.txt` se actualiza cada minuto.** Esto se puede comprobar listando los archivos repetidamente y observando que la fecha de modificación cambia con frecuencia regular.

La conclusión es directa: **`test.py` se está ejecutando cada minuto de forma automática**, lo que apunta a una entrada en el cron del sistema.

#### ¿Por qué se asume que el cron corre como root?

El detalle decisivo es el **propietario** de `test.txt`: el archivo pertenece a `root`. Como el archivo lo genera `test.py`, el proceso que ejecuta `test.py` necesariamente corre con privilegios de root (de lo contrario no podría producir un archivo cuyo dueño sea root). Por lo tanto, la entrada del cron que dispara `test.py` está configurada bajo el usuario `root`.

> [!warning] Vector de escalada confirmado
> 
> - `/scripts` es escribible por `scriptmanager` (usuario que ya controlamos).
> - El cron de root ejecuta scripts dentro de `/scripts` cada minuto.
> - Por lo tanto, **cualquier código que coloquemos ahí se ejecutará como root**.

#### Obteniendo la shell de root

A partir de aquí hay dos caminos equivalentes, ambos mencionados en el writeup oficial:

- **Modificar `test.py`** añadiendo código que ejecute una acción privilegiada (por ejemplo, una reverse shell hacia el atacante, escribir un binario SUID, modificar `/etc/passwd`, etc.).
- **Crear un nuevo archivo Python** dentro de `/scripts` con el payload deseado, ya que **todos los scripts del directorio se ejecutan**, no solo `test.py`.

La segunda opción suele ser preferible porque **no altera el archivo original** y, por tanto, es menos intrusiva sobre el comportamiento esperado de la máquina.

En cualquiera de los dos casos, basta con esperar al siguiente ciclo del cron (un minuto como máximo) para que el código se ejecute con privilegios de root.

> [!success] Root Shell obtenida como `root` a través del cron job en `/scripts`.

---

## Resumen del ataque

|Etapa|Técnica|Indicador clave|Usuario resultante|
|---|---|---|---|
|Enumeración de red|`nmap -sC -sV`|Solo Apache (puerto 80)|—|
|Enumeración web|Inspección manual + Dirbuster|`/dev/phpbash.php` insinuado en el blog|—|
|Foothold|phpbash → reverse shell o stager Meterpreter|Webshell sin autenticación|`www-data`|
|Movimiento lateral|`sudo -l` → `sudo -u scriptmanager bash -i`|`www-data` puede correr comandos como `scriptmanager`|`scriptmanager`|
|Escalada a root|Drop/edit de script Python en `/scripts`|`test.txt` pertenece a root y se actualiza cada minuto|`root`|

## Lecciones aprendidas

- La **enumeración manual del contenido visible** (en este caso, el blog) suele aportar pistas que reducen drásticamente el espacio de búsqueda del fuzzing.
- Dejar una **webshell expuesta** en un directorio "de desarrollo" sin autenticación es equivalente a publicar RCE.
- `sudo -l` es la primera consulta obligatoria tras conseguir cualquier shell en Linux.
- Los **timestamps** y la **propiedad de archivos** son indicadores fiables para deducir tareas programadas cuando no se tiene acceso directo al crontab.
- Un cron de root que ejecuta scripts desde un directorio escribible por otro usuario es un patrón clásico de mala configuración que conduce directamente a privilegios de root.


___

## Bandera(s)

> [!FLAG] `flag{user}`
^bandera

> [!FLAG] `flag{root}`
^bandera