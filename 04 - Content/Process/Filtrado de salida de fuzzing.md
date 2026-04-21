---
aliases:
tags:
  - type/cheatsheet
  - asset/web-app
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Filtrado de salida de fuzzing

Las herramientas de fuzzing web como **gobuster**, **ffuf** y **wenum** están diseñadas para realizar escaneos exhaustivos, lo que suele generar una gran cantidad de datos. Rebuscar entre esta salida para identificar los hallazgos más relevantes puede ser una tarea abrumadora. Sin embargo, estas herramientas ofrecen mecanismos de filtrado potentes para agilizar tu análisis y centrarte en los resultados que realmente importan.

## Gobuster

Gobuster ofrece varias opciones de filtrado según el módulo que se ejecute, para ayudarte a enfocarte en respuestas específicas y simplificar tu análisis. Hay una pequeña salvedad: las opciones `-s` y `-b` sólo están disponibles en el modo **dir** (dir fuzzing).

| Flag               | Descripción                                                                                       | Escenario de ejemplo                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `-s` (include)     | Incluir sólo respuestas con los códigos de estado especificados (separados por comas).            | Buscas redirecciones, filtras por los códigos `301,302,307`.                     |
| `-b` (exclude)     | Excluir respuestas con los códigos de estado especificados (separados por comas).                 | El servidor devuelve muchos `404`. Exclúyelos con `-b 404`.                      |
| `--exclude-length` | Excluir respuestas con longitudes de contenido específicas (separadas por comas, soporta rangos). | No te interesan respuestas de 0 bytes o 404 bytes, usa `--exclude-length 0,404`. |

Al combinar estratégicamente estas opciones de filtrado puedes adaptar la salida de Gobuster a tus necesidades y centrarte en los resultados más relevantes para tus evaluaciones de seguridad.

```bash
# Buscar directorios con códigos 200 o 301, pero excluir respuestas con tamaño 0 (vacías)
vsoci3tyv@htb[/htb]$ gobuster dir -u http://example.com/ -w wordlist.txt -s 200,301 --exclude-length 0
```

## FFUF

FFUF ofrece un sistema de filtrado muy personalizable, permitiendo un control preciso sobre la salida mostrada. Esto facilita depurar grandes cantidades de datos y centrarse en los hallazgos más relevantes. Las opciones de filtrado de FFUF se agrupan en varios tipos, cada una con un propósito concreto.

| Flag                     | Descripción                                                                                                                                                                                                      | Escenario de ejemplo                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `-mc` (match code)       | Incluir sólo respuestas que coincidan con los códigos de estado especificados. Se acepta un código, varios separados por comas o rangos con `-`. Por defecto coincide con `200-299,301,302,307,401,403,405,500`. | Observas muchas redirecciones `302`, pero te interesan `200`. Usa `-mc 200`.               |
| `-fc` (filter code)      | Excluir respuestas que coincidan con los códigos especificados (mismo formato que `-mc`). Útil para eliminar errores comunes como `404`.                                                                         | El escaneo arrojó muchos `404`. Usa `-fc 404`.                                             |
| `-fs` (filter size)      | Excluir respuestas con un tamaño específico o rango. Especifica tamaños individuales o rangos con `-`.                                                                                                           | Sospechas que las respuestas interesantes serán mayores a 1KB. Usa `-fs 0-1023`.           |
| `-ms` (match size)       | Incluir sólo respuestas que coincidan con un tamaño o rango específico (misma sintaxis que `-fs`).                                                                                                               | Buscas un archivo de respaldo exactamente `3456` bytes. Usa `-ms 3456`.                    |
| `-fw` (filter words)     | Excluir respuestas que contengan el número especificado de palabras.                                                                                                                                             | Filtrás respuestas que tengan exactamente `219` palabras con `-fw 219`.                    |
| `-mw` (match word count) | Incluir sólo respuestas con la cantidad de palabras especificada en el cuerpo.                                                                                                                                   | Buscas mensajes de error cortos. Usa `-mw 5-10`.                                           |
| `-fl` (filter line)      | Excluir respuestas con un número específico de líneas o rango.                                                                                                                                                   | Observas mensajes de error de `10` líneas. Usa `-fl 10`.                                   |
| `-ml` (match line count) | Incluir sólo respuestas con el número de líneas especificado en el cuerpo.                                                                                                                                       | Quieres respuestas con formato de `20` líneas. Usa `-ml 20`.                               |
| `-mt` (match time)       | Incluir sólo respuestas que cumplan una condición de tiempo-to-first-byte (TTFB). Útil para identificar respuestas inusualmente lentas o rápidas.                                                                | La aplicación responde lento para ciertos inputs. Usa `-mt >500` para TTFB mayor a 500 ms. |

Se pueden combinar múltiples filtros. Por ejemplo:

```bash
# Encontrar directorios con código 200, según la cantidad de palabras y tamaño mayor a 500 bytes
vsoci3tyv@htb[/htb]$ ffuf -u http://example.com/FUZZ -w wordlist.txt -mc 200 -fw 427 -ms >500

# Excluir respuestas con códigos 404, 401 y 302
vsoci3tyv@htb[/htb]$ ffuf -u http://example.com/FUZZ -w wordlist.txt -fc 404,401,302

# Buscar archivos .bak con tamaño entre 10KB y 100KB
vsoci3tyv@htb[/htb]$ ffuf -u http://example.com/FUZZ.bak -w wordlist.txt -fs 0-10239 -ms 10240-102400

# Descubrir endpoints que tardan más de 500ms en responder
vsoci3tyv@htb[/htb]$ ffuf -u http://example.com/FUZZ -w wordlist.txt -mt >500
```

## wenum

`wenum` ofrece un sistema de filtrado robusto para gestionar y refinar la gran cantidad de datos generados durante el fuzzing. Puedes filtrar por códigos de estado, tamaño/longitud de respuesta, recuento de palabras, líneas e incluso expresiones regulares.

| Flag                         | Descripción                                                                                               | Escenario de ejemplo                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--hc` (hide code)           | Excluir respuestas que coincidan con los códigos de estado especificados.                                 | El servidor devolvió muchos `400`. Usa `--hc 400` para ocultarlos.                                                                    |
| `--sc` (show code)           | Incluir sólo respuestas que coincidan con los códigos especificados.                                      | Sólo te interesan `200 OK`. Usa `--sc 200`.                                                                                           |
| `--hl` (hide length)         | Excluir respuestas con la longitud de contenido especificada (en líneas).                                 | El servidor devuelve mensajes de error verbosos con muchas líneas. Usa `--hl` con un valor alto.                                      |
| `--sl` (show length)         | Incluir sólo respuestas con la longitud de contenido especificada (en líneas).                            | Sospechas de una respuesta con un conteo de líneas conocido. Usa `--sl`.                                                              |
| `--hw` (hide word)           | Excluir respuestas con el número de palabras especificado.                                                | El servidor incluye frases comunes; usa `--hw` para filtrarlas.                                                                       |
| `--sw` (show word)           | Incluir sólo respuestas con el número de palabras especificado.                                           | Buscas mensajes de error cortos; usa `--sw 5-10`.                                                                                     |
| `--hs` (hide size)           | Excluir respuestas por tamaño (bytes o caracteres).                                                       | El servidor envía archivos grandes para peticiones válidas; usa `--hs` para ocultarlos.                                               |
| `--ss` (show size)           | Incluir sólo respuestas con el tamaño especificado (bytes o caracteres).                                  | Buscas un archivo con tamaño conocido; usa `--ss`.                                                                                    |
| `--hr` (hide regex)          | Excluir respuestas cuyo cuerpo coincida con la expresión regular dada.                                    | Filtra respuestas que contienen "Internal Server Error" con `--hr "Internal Server Error"`.                                           |
| `--sr` (show regex)          | Incluir sólo respuestas cuyo cuerpo coincida con la expresión regular.                                    | Filtra respuestas que contienen "admin" con `--sr "admin"`.                                                                           |
| `--filter` / `--hard-filter` | Filtro general para mostrar/ocultar respuestas o prevenir su post-procesado usando una expresión regular. | `--filter "Login"` mostrará sólo respuestas con "Login"; `--hard-filter "Login"` las ocultará y evitará que los plugins las procesen. |

Ejemplos combinados:

```bash
# Mostrar sólo solicitudes exitosas y redirecciones
vsoci3tyv@htb[/htb]$ wenum -w wordlist.txt --sc 200,301,302 -u https://example.com/FUZZ

# Ocultar respuestas con códigos de error comunes
vsoci3tyv@htb[/htb]$ wenum -w wordlist.txt --hc 404,400,500 -u https://example.com/FUZZ

# Mostrar sólo mensajes de error cortos (5-10 palabras)
vsoci3tyv@htb[/htb]$ wenum -w wordlist.txt --sw 5-10 -u https://example.com/FUZZ

# Ocultar archivos grandes y enfocarse en respuestas pequeñas
vsoci3tyv@htb[/htb]$ wenum -w wordlist.txt --hs 10000 -u https://example.com/FUZZ

# Filtrar por respuestas que contengan "admin" o "password"
vsoci3tyv@htb[/htb]$ wenum -w wordlist.txt --sr "admin\|password" -u https://example.com/FUZZ
```

## Feroxbuster

El sistema de filtrado de Feroxbuster está diseñado para ser potente y flexible, permitiéndote afinar los resultados a nivel de petición y de respuesta.

| Flag                    | Descripción                                                                                                         | Escenario de ejemplo                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `--dont-scan` (Request) | Excluir URLs o patrones específicos de ser escaneados (incluso si se encuentran en enlaces durante la recursión).   | Sabes que `/uploads` contiene sólo imágenes, exclúyelo con `--dont-scan /uploads`.   |
| `-S, --filter-size`     | Excluir respuestas basadas en su tamaño (bytes). Se pueden especificar tamaños únicos o rangos separados por comas. | Observaste muchas páginas de error de 1KB. Usa `-S 1024` para excluirlas.            |
| `-X, --filter-regex`    | Excluir respuestas cuyo cuerpo o cabeceras coincidan con la expresión regular.                                      | Filtra páginas con "Access Denied" usando `-X "Access Denied"`.                      |
| `-W, --filter-words`    | Excluir respuestas con un recuento de palabras o rango específico.                                                  | Elimina respuestas con pocas palabras (p. ej. mensajes de error) con `-W 0-10`.      |
| `-N, --filter-lines`    | Excluir respuestas con un recuento de líneas o rango específico.                                                    | Filtra páginas muy largas con `-N 50-`.                                              |
| `-C, --filter-status`   | Excluir respuestas según códigos HTTP específicos (denylist).                                                       | Suprime `404` y `500` con `-C 404,500`.                                              |
| `--filter-similar-to`   | Excluir respuestas que sean similares a una página dada.                                                            | Elimina duplicados o páginas casi idénticas usando `--filter-similar-to error.html`. |
| `-s, --status-codes`    | Incluir sólo respuestas con los códigos de estado especificados (allowlist). Por defecto: todos.                    | Centrarte en respuestas exitosas con `-s 200,204,301,302`.                           |

Ejemplo combinado:

```bash
# Encontrar directorios con código 200, excluir respuestas mayores a 10KB o que contengan la palabra "error"
vsoci3tyv@htb[/htb]$ feroxbuster --url http://example.com -w wordlist.txt -s 200 -S 10240 -X "error"
```

## Una breve demostración

Para seguir el ejemplo en tu entorno, inicia el sistema objetivo y añade el vhost indicado a tu archivo `hosts` reemplazando `IP` por la dirección IP de la instancia. Usaremos el wordlist `/usr/share/seclists/Discovery/Web-Content/common.txt` para estas tareas de fuzzing.

A lo largo del módulo habrás notado que muchos comandos usan filtrado de resultados, o que los propios fuzzers aplican filtrados por defecto. Por ejemplo, en fuzzing `POST` con `ffuf`, si quitamos el filtro de códigos de coincidencia, `ffuf` volverá a una serie de filtros por defecto.

```bash
vsoci3tyv@htb[/htb]$ ffuf -u http://IP:PORT/post.php -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "y=FUZZ" -w /usr/share/seclists/Discovery/Web-Content/common.txt -v
```

En la salida verás algo como:

```
:: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
```

La línea `:: Matcher : Response status: 200-299,301,302,307,401,403,405,500` indica que, por defecto, `ffuf` sólo coincide con esos códigos específicos. Este filtrado intencional minimiza el ruido generado por respuestas `404 NOT FOUND`, manteniendo los resultados de interés en primer plano.

Si ejecutas el mismo escaneo con `-mc all` (coincidir todos los códigos), la salida crecerá mucho y verás multitud de entradas `404` y otras respuestas menos relevantes:

```bash
vsoci3tyv@htb[/htb]$ ffuf -u http://IP:PORT/post.php -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "y=FUZZ" -w /usr/share/seclists/Discovery/Web-Content/common.txt -v -mc all
```

Salida (ejemplo):

```
[Status: 404, Size: 36, Words: 4, Lines: 3, Duration: 1ms]
| URL | http://IP:PORT/post.php
    * FUZZ: .cache

[Status: 404, Size: 43, Words: 4, Lines: 3, Duration: 2ms]
| URL | http://IP:PORT/post.php
    * FUZZ: .bash_history

...
```

---
