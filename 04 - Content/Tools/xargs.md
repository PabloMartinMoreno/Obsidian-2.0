---
aliases:
tags:
  - env/linux
  - tool/xargs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
---
# Comando `xargs`

## Definición 

> [!INFO] xargs (e**x**tended **arg**uments)
>Se utiliza para construir y ejecutar comandos a partir de la entrada estándar. Toma la salida de un comando y la utiliza como argumentos para otro comando. Es especialmente útil cuando se necesita pasar una lista de elementos a un comando que no puede procesar la entrada estándar directamente.
^definicion

## Uso Básico de `xargs`

La sintaxis básica es:
```bash
comando | xargs [opciones] comando
```

Por ejemplo, si tienes una lista de archivos generada por `find` y quieres eliminarlos:
```bash
find . -name "*.log" | xargs rm
```
Esto encontrará todos los archivos con extensión `.log` y los pasará a `rm` para eliminarlos.

## Subcomandos y Opciones Más Usados

1. **-I (Reemplazo de Cadena)**
   Permite especificar una cadena de reemplazo que se reemplazará por cada entrada de la lista.
   ```bash
   echo "file1 file2 file3" | xargs -I {} mv {} /new_directory/
   ```

2. **-n (Número de Argumentos)**
   Controla cuántos argumentos se pasan a cada invocación del comando.
   ```bash
   echo "file1 file2 file3 file4" | xargs -n 2 echo
   ```
   Salida:
   ```
   file1 file2
   file3 file4
   ```

3. **-d (Delimitador)**
   Especifica un delimitador personalizado en lugar del espacio en blanco predeterminado.
   ```bash
   echo "file1:file2:file3" | xargs -d: echo
   ```

4. **-0 (Null Terminator)**
   Utiliza el carácter nulo (`\0`) como delimitador, útil cuando se trabaja con nombres de archivo que contienen espacios o saltos de línea.
   ```bash
   find . -name "*.log" -print0 | xargs -0 rm
   ```

5. **-P (Paralelismo)**
   Permite ejecutar múltiples instancias del comando en paralelo.
   ```bash
   echo "url1 url2 url3 url4" | xargs -n 1 -P 4 curl -O
   ```

## Ejemplos

1. **Eliminar Archivos Grandes:**
   Encuentra archivos mayores de 100MB y los elimina.
   ```bash
   find /path/to/dir -type f -size +100M | xargs rm
   ```

2. **Copiar Archivos a Otro Directorio:**
   Copia todos los archivos con extensión `.txt` a `/backup`.
   ```bash
   find . -name "*.txt" | xargs -I {} cp {} /backup/
   ```

3. **Buscar y Reemplazar Texto en Archivos:**
   Reemplaza "foo" por "bar" en todos los archivos `.txt`.
   ```bash
   find . -name "*.txt" | xargs -I {} sed -i 's/foo/bar/g' {}
   ```

## Resumen de Subcomandos

- `-I {}`: Permite el uso de un marcador de posición para los argumentos.
- `-n`: Especifica el número de argumentos por línea de comando.
- `-d`: Define un delimitador personalizado para la entrada.
- `-0`: Usa el carácter nulo como delimitador.
- `-P`: Ejecuta comandos en paralelo.

Con `xargs`, se puede construir y ejecutar comandos de forma eficiente, especialmente cuando se manejan grandes cantidades de datos.

---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `find . -name '*.log' \| xargs grep 'error'` | Grep en múltiples files | Chain básico |
| `find . -name '*.log' -print0 \| xargs -0 grep 'error'` | Idem con null delim | Filenames con espacios |
| `cat ips.txt \| xargs -I {} curl http://{}/` | Sustituir token | Per-item command |
| `cat ips.txt \| xargs -P 10 -I {} nmap -sV {}` | Paralelizar 10 jobs | Recon masivo |
| `cat hashes.txt \| xargs -L 1 hashid` | Una arg per ejecución | Tools que no aceptan stdin |
| `find /var/log -name '*.gz' \| xargs -n 1 zcat` | Procesar uno a uno | Stream |
| `echo 'one two three' \| xargs -n 1` | Split args | Convertir args en lines |
| `cat creds.txt \| xargs -I{} sh -c 'curl -u {} http://target/'` | Shell wrap | Multi-arg compleja |

---

## Patterns útiles

```bash
# Parallel port scan
cat ips.txt | xargs -P 20 -I {} nmap -p- --open {}

# Mass curl GET
cat urls.txt | xargs -P 10 -I {} curl -s -o /dev/null -w "%{http_code} {}\n" {}

# Mass cred test SMB
cat ips.txt | xargs -P 10 -I {} netexec smb {} -u admin -p 'Spring2024!'

# Delete tons of files safely
find . -name '*.tmp' -print0 | xargs -0 rm -v

# Encode list of strings en base64
cat list.txt | xargs -I {} sh -c 'echo -n "{}" | base64'
```

---

## Notas Relacionadas

- [[grep]]
- [[find]]
- [[awk]]
