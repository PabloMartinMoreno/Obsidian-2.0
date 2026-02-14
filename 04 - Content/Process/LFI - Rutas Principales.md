---
aliases:
tags:
  - type/concept
type: Concept
linked:
---
# LFI - Rutas Principales

***

### Archivos del Sistema Operativo

Estos archivos contienen información del sistema, usuarios, contraseñas y configuraciones.

- **`/etc/passwd`**: Contiene una lista de usuarios del sistema. Aunque no almacena contraseñas, es un punto de partida para la enumeración.
- **`/etc/shadow`**: Almacena las contraseñas encriptadas (requiere privilegios elevados).
- **`/etc/hosts`**: Contiene información sobre los mapeos de nombres de dominio y direcciones IP locales.
- **`/etc/hostname`**: Nombre del host del sistema.
- **`/proc/self/environ`**: Variables de entorno del proceso que incluye la petición (puede exponer detalles de configuración).

### Archivos de Registro

Los archivos de registro pueden contener datos útiles como solicitudes HTTP, direcciones IP y sesiones.

- **`/var/log/apache2/access.log` o `/var/log/httpd/access.log`**: Registro de accesos al servidor web (puede incluir payloads inyectados).
- **`/var/log/apache2/error.log` o `/var/log/httpd/error.log`**: Registro de errores del servidor web (puede mostrar detalles sobre la ejecución de payloads).
- **`/var/log/syslog`**: Registro general del sistema.
- **`/var/log/messages`**: Similar al anterior, usado en algunas distribuciones.
- **`/var/log/auth.log`**: Archivo de registro relacionado con eventos de autenticación. Incluye intentos exitosos y fallidos de inicio de sesión, actividades del sistema relacionadas con `sudo` y posibles datos sensibles.
- **`/var/mail/<usuario>`**

### Configuración del Servidor Web

La configuración del servidor web puede revelar rutas importantes o información sensible:

- **`/etc/httpd/conf/httpd.conf` o ```**: Configuración principal del servidor Apache.
- **`/usr/local/etc/nginx/nginx.conf`**: Configuración de Nginx.
- **`/etc/apache2/sites-available/000-default.conf`** (con [[Wrappers]]): 
- **/etc/apache2/.htpasswd**:

### Llaves Privadas y Credenciales

Acceder a estos archivos compromete la seguridad del sistema y permite acceso remoto.

- **`~/.ssh/id_rsa`**: Clave privada SSH del usuario.
- **`/root/.ssh/id_rsa`**: Clave privada SSH del usuario root.
- **`/etc/ssl/private`**: Claves privadas relacionadas con SSL/TLS.

### Archivos de Aplicaciones Web

Estos contienen configuraciones específicas de la aplicación o credenciales:

- **`/var/www/html/config.php`**: Archivos de configuración PHP con credenciales de bases de datos.
- **`wp-config.php`**: Configuración de WordPress, incluyendo claves API y contraseñas.
- **`.env`**: Archivos de entorno con configuraciones y credenciales.

### Otros Recursos Útiles

- **`/proc/self/fd`**: contiene enlaces simbólicos que representan los descriptores de archivos abiertos por el proceso que está accediendo al directorio.
- **`/proc/self/cmdline`**: Contiene la línea de comandos utilizada para iniciar el proceso.
- **`/proc/self/status`**: Información detallada del proceso.
- **`/proc/sched_debug`**: Información detallada del planificador del kernel, útil para depuración y análisis de procesos.
- **`/home/<usuario>/`**: Directorios personales de los usuarios, pueden contener información sensible.
- **`/var/lib/mysql/`**: Bases de datos MySQL/MariaDB almacenadas localmente.
- **`/var/mail/<usuario>`**: Archivo que almacena correos internos del usuario. Algunos sistemas pueden incluir mensajes sensibles relacionados con la administración.
- **`/proc/net/fib_trie`**: Configuraciones relacionadas con la tarjeta de red.
- **`/proc/net/tcp`**: 