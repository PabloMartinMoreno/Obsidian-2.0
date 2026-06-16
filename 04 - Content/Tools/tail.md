---
aliases:
  - tail
tags:
  - tool/tail
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
---

# tail

## Definición 

> [!INFO] tail
>Se utiliza para mostrar las últimas líneas de un archivo de texto. Es especialmente útil para monitorear archivos de log en tiempo real, verificar el final de archivos largos y realizar análisis rápidos sin necesidad de abrir el archivo completo.
^definicion

## Uso básico

La sintaxis básica de `tail` es la siguiente:

```bash
tail [opciones] [archivo]
```

Por defecto, `tail` muestra las últimas 10 líneas del archivo especificado. Si no se proporciona un archivo, `tail` leerá desde la entrada estándar.

## Opciones comunes

### -n, --lines

Esta opción permite especificar el número de líneas que se desean mostrar. Por ejemplo:

```bash
tail -n 20 archivo.txt
```

Este comando muestra las últimas 20 líneas de `archivo.txt`.

### -f, --follow

La opción `-f` es utilizada para seguir el crecimiento de un archivo en tiempo real. Es ideal para monitorear archivos de log que se actualizan continuamente.

```bash
tail -f archivo.log
```

Con este comando, `tail` mostrará nuevas líneas a medida que se agreguen al final de `archivo.log`.

### -c, --bytes

Permite mostrar los últimos bytes de un archivo en lugar de las líneas. Por ejemplo:

```bash
tail -c 100 archivo.txt
```

Muestra los últimos 100 bytes de `archivo.txt`.

### --retry

Esta opción hace que `tail` intente acceder al archivo hasta que esté disponible, útil cuando se espera que el archivo aparezca eventualmente.

```bash
tail --retry -f archivo.log
```

### -q, --quiet, --silent

Supprime los encabezados de los archivos cuando se está trabajando con múltiples archivos.

```bash
tail -q -n 5 archivo1.txt archivo2.txt
```

### -v, --verbose

Muestra encabezados de archivos incluso cuando se trabaja con un solo archivo.

```bash
tail -v archivo.txt
```

## Ejemplos prácticos

### Ver las últimas 15 líneas de un archivo

```bash
tail -n 15 /var/log/syslog
```

### Monitorear un archivo de log en tiempo real

```bash
tail -f /var/log/apache2/access.log
```

### Mostrar los últimos 200 bytes de un archivo

```bash
tail -c 200 archivo.bin
```

### Seguir múltiples archivos simultáneamente

```bash
tail -f archivo1.log archivo2.log
```

Este comando mostrará las actualizaciones en ambos archivos en tiempo real.

## Casos de uso

### Depuración de aplicaciones

Al desarrollar o depurar aplicaciones, es común revisar los archivos de log para identificar errores o comportamientos inesperados. `tail -f` permite monitorear estos archivos en tiempo real mientras se ejecuta la aplicación.

### Supervisión del sistema

Los administradores de sistemas utilizan `tail` para supervisar logs del sistema, como los logs de seguridad, de red o de servicios específicos, facilitando la detección de problemas o actividades inusuales.

### Análisis de datos

En situaciones donde se generan grandes volúmenes de datos, `tail` permite acceder rápidamente a las últimas entradas sin cargar el archivo completo, optimizando el tiempo y recursos.

## Combinación con otros comandos

`tail` se puede combinar con otros comandos mediante tuberías para realizar operaciones más complejas. Por ejemplo, para buscar una palabra específica en las últimas 50 líneas de un archivo:

```bash
tail -n 50 archivo.log | grep "ERROR"
```

Este comando muestra las últimas 50 líneas de `archivo.log` y filtra aquellas que contienen la palabra "ERROR".
