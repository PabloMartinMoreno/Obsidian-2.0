---
aliases:
tags:
  - tool/find
kind: Tool
linked:
  - "[[Linux PrivEsc - SUID y SGID]]"
---
# Comando `find`

## Definición 

> [!INFO] find
>Se utiliza para buscar archivos y directorios en un sistema de archivos. Tiene una amplia variedad de opciones que permiten personalizar la búsqueda según diferentes criterios.
^definicion

```
find [directorio] [opciones] [expresión de búsqueda]
```
- `[directorio]`: Especifica el directorio donde comenzará la búsqueda. Si no se especifica, `find` comenzará la búsqueda desde el directorio actual.
- `[opciones]`: Son modificadores que alteran el comportamiento de `find`, como limitar la profundidad de búsqueda o especificar el tipo de archivo
- `[expresión de búsqueda]`: Define los criterios de búsqueda, como el nombre del archivo, propietario, permisos, etc.

## Ejemplos de opciones comunes:

1. **Buscar por nombre de archivo:**
   ```bash
   find /ruta/del/directorio -name "archivo.txt"
   ```
   Esto buscará un archivo llamado `archivo.txt` dentro de `/ruta/del/directorio` y sus subdirectorios.

2. **Buscar por tipo de archivo:**
   ```bash
   find /ruta/del/directorio -type f
   ```
   Esto buscará solo archivos regulares (no directorios ni enlaces simbólicos).

3. **Buscar por tamaño de archivo:**
   ```bash
   find /ruta/del/directorio -size +1M
   ```
   Esto buscará archivos mayores a 1 megabyte dentro del directorio especificado.

4. **Buscar por permisos:**
   ```bash
   find /ruta/del/directorio -perm 644
   ```
   Esto buscará archivos con permisos `644` (lectura y escritura para el propietario, solo lectura para grupo y otros).

5. **Buscar por fechas**
```bash
find /ruta/del/directorio -newermt 2020-03-03 ! -newermt 2024-04-29
```
	Esto buscará todos los archivos creados despues del 2020-03-03 y anteriores al 2024-04-29

6. **Buscar y ejecutar una acción:**
   ```bash
   find /ruta/del/directorio -name "*.log" -exec rm {} \;
   ```
   Esto buscará todos los archivos con extensión `.log` y los eliminará.

7. **Combinar múltiples criterios:**
   ```bash
	find / -type f -name *.conf -size +25k -size -28k -newermt 2020-03-03 2>/dev/null
   ```
   Esto buscará archivos regulares (no directorios) con extensión `.txt` y tamaño mayor a 100 kilobytes.

## Algunas opciones importantes:

- `-name`: Filtra por nombre de archivo.
- `-type`: Filtra por tipo de archivo (`f` para regular file, `d` para directorio, etc.).
- `-size`: Filtra por tamaño de archivo.
- `-perm`: Filtra por permisos de archivo.
- `-newermt`: Filtra por fechas
- `-exec`: Ejecuta un comando en cada archivo encontrado.
- `-depth`: Controla la profundidad máxima de búsqueda.
- `-user`/`-group`: Busca por propietario/grupo del archivo.

## Tamaños de `-size`:

Se puede buscar archivos con un tamaño específico utilizando `c` para bytes, `k` para kilobytes (1024 bytes), `M` para megabytes (1024 kilobytes), `G` para gigabytes (1024 megabytes), etc.

-  Para buscar archivos de exactamente 100 bytes:
  ```bash
  find /ruta/a/buscar -size 100c
  ```

- Para buscar archivos mayores a 1 megabyte:
  ```bash
  find /ruta/a/buscar -size +1M
  ```

- Para buscar archivos menores a 100 kilobytes:
  ```bash
  find /ruta/a/buscar -size -100k
  ```

- Para buscar archivos entre 500 kilobytes y 1 megabyte:
  ```bash
  find /ruta/a/buscar -size +500k -size -1M
  ```

- **Buscar archivos grandes modificados en los últimos 30 días:**
  ```bash
  find /ruta/a/buscar -type f -size +10M -mtime -30
  ```

## Más sobre `-perm`

1. **Buscar archivos con permisos exactos**:
   Para encontrar archivos con permisos exactamente igual a 755:
   ```
   find /ruta/inicio -type f -perm 0755
   ```

2. **Buscar archivos con al menos estos permisos**:
   Usando el carácter `-` antes del patrón, puedes buscar archivos que tengan al menos los permisos especificados. Por ejemplo, para buscar archivos que sean legibles, escribibles y ejecutables por su propietario:
   ```
   find /ruta/inicio -type f -perm -u=rwx
   ```

3. **Buscar archivos con cualquiera de los permisos especificados**:
   Usando el carácter `/` antes del patrón, puedes buscar archivos que tengan al menos uno de los permisos especificados. Por ejemplo, para buscar archivos que sean legibles, escribibles o ejecutables por su propietario:
   ```
   find /ruta/inicio -type f -perm /u=rwx
   ```

4. **Buscar archivos sin ciertos permisos**:
   Si deseas encontrar archivos que no tengan un cierto permiso, puedes combinar `-perm` con `!`. Por ejemplo, para encontrar archivos que no sean legibles por el propietario:
   ```
   find /ruta/inicio -type f ! -perm -u=r
   ```
Los números que se utilizan para describir los permisos, como `0755`, son representaciones octales de los permisos del archivo. En este caso, `7` (en octal) es equivalente a `rwx` (read, write, execute), `5` es equivalente a `r-x`, y así sucesivamente.

---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `find / -perm -4000 -type f 2>/dev/null` | Todos los SUID binaries | [[Linux PrivEsc - SUID y SGID]] |
| `find / -perm -2000 -type f 2>/dev/null` | Todos los SGID | Idem |
| `find / -writable -type d 2>/dev/null` | Directorios world-writable | Drop point para exploits |
| `find / -name "*.conf" -readable 2>/dev/null` | Configs leíbles | Hunt credentials |
| `find /home -name ".ssh" -type d 2>/dev/null` | SSH dirs | Cred reuse, key theft |
| `find / -name "id_rsa" 2>/dev/null` | SSH private keys | Cred theft |
| `find / -mtime -1 -type f 2>/dev/null` | Modificados últimas 24h | Recent activity |
| `find / -size +100M 2>/dev/null` | Archivos > 100MB | Backups, dumps |
| `find / -user root -perm -u+s 2>/dev/null` | SUID owned by root | Idem SUID enum |
| `find / -name "*.bak" 2>/dev/null` | Backup files | Source / config leaks |
| `find / -path '*/proc' -prune -o -name '.git' -print 2>/dev/null` | `.git` dirs (excluyendo /proc) | Source disclosure |

---

## SUID exploitation flow

```bash
# 1. List SUID bins
find / -perm -4000 -type f 2>/dev/null

# 2. Check GTFOBins for each unusual one
# https://gtfobins.github.io/

# 3. Exploit via documented technique
# Ej: find with SUID
/usr/bin/find . -exec /bin/sh -p \; -quit
```

---

## Notas Relacionadas

- [[Linux PrivEsc - SUID y SGID]]
- [[Linux Privilege Escalation]]
- [[grep]]
