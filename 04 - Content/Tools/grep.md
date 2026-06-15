---
aliases:
tags:
  - tool/grep
kind: Tool
linked:
---
# Comando `grep`

## Definición 

> [!INFO] grep (**G**lobal **R**egular **E**xpression **P**rint) 
>Se utiliza para buscar patrones de texto en uno o más archivos. Busca líneas que coinciden con una expresión regular dada en uno o más archivos y las imprime en la salida estándar.
^definicion

```bash
grep [opciones] patron [archivo(s)]
```

- `patron`: es la expresión regular que se va a buscar.
- `archivo(s)`: son los archivos en los que se realizará la búsqueda. Si no se especifica ningún archivo, `grep` leerá desde la entrada estándar.

## Ejemplos de uso común

#### 1. Buscar una cadena de texto en un archivo:

```bash
grep "palabra" archivo.txt
```
Esto imprimirá todas las líneas en `archivo.txt` que contengan la palabra "palabra".

#### 2. Buscar en varios archivos:

```bash
grep "patron" archivo1.txt archivo2.txt
```
Buscará la cadena "patron" en `archivo1.txt` y `archivo2.txt`.

#### 3. Utilizar [[Expresiones regulares|Expresiones Regulares (RegEx)]]:

- Buscará todas las líneas que comiencen con "inicio" en todos los archivos del directorio actual.
```bash
grep "^inicio" archivos/*
```

- Buscar todas las líneas que terminen con "final" en todos los archivos del directorio actual:
```bash
grep "final$" *
```
El patrón `final$` utiliza el símbolo `$` para indicar el final de la línea. Esto buscará todas las líneas que terminen con la cadena "final" en todos los archivos del directorio actual.

- Buscar todas las líneas que terminen con un número en todos los archivos del directorio actual:
```bash
grep "[0-9]$" *
```
La expresión regular `[0-9]$` utiliza una clase de caracteres `[0-9]` para coincidir con cualquier dígito del 0 al 9, y `$` para indicar que ese dígito debe estar al final de la línea.

- Buscar todas las líneas que terminen con un espacio en blanco (espacios, tabuladores, etc.) en todos los archivos del directorio actual:
```bash
grep "[ \t]$" *
```
La expresión regular `[ \t]$` utiliza una clase de caracteres `[ \t]` para coincidir con un espacio en blanco (espacio o tabulador), y `$` para indicar que ese espacio en blanco debe estar al final de la línea.

- Buscar todas las líneas que comiencen con "inicio" y terminen con "final" en todos los archivos del directorio actual:
```bash
grep "^inicio.*final$" *
```
Esta expresión regular combina `^inicio` para buscar líneas que comiencen con "inicio", `.*` para coincidir con cualquier cadena de caracteres en el medio, y `final$` para buscar líneas que terminen con "final".

#### 4. Hacer coincidir un patrón e ignorar mayúsculas y minúsculas:
```bash
grep -i "PatRon" archivo.txt
```
La opción `-i` hace que la búsqueda sea insensible a mayúsculas y minúsculas.

## Ejemplos avanzados

#### 1. **Excluir líneas**
Usar la opción `-v` para excluir las líneas que coinciden con el patrón:
```bash
grep -v "patron" archivo.txt
```
Imprimirá todas las líneas que no contienen "patron".

También se puede concatenar palabras que no queremos ver de la siguiente forma:
```bash
cat combinations.txt | nc localhost 30002 | grep -vE "Wrong|Please enter"
```

#### 2. **Contar coincidencias**
La opción `-c` cuenta el número de líneas coincidentes:
```bash
grep -c "patron" archivo.txt
```
Mostrará el número de líneas que contienen "patron" en `archivo.txt`.

#### 3. **Buscar en directorios recursivamente**
La opción `-r` busca recursivamente en subdirectorios:
```bash
grep -r "patron" directorio/
```
Buscará "patron" en todos los archivos dentro del directorio y sus subdirectorios.

#### 4. **Mostrar números de línea**
La opción `-n` muestra los números de línea junto con las líneas coincidentes:
```bash
grep -n "patron" archivo.txt
```
Imprimirá el número de línea seguido de la línea que contiene "patron".

#### 5. **Búsqueda inversa**
La opción `-v` junto con `-x` imprime las líneas que no coinciden exactamente con el patrón:
```bash
grep -vx "patron" archivo.txt
```
Mostrará todas las líneas que no sean exactamente iguales a "patron".

#### 6. **Busqueda recursiva:**
La opción`-r`  busca en todos los archivos en los directorios especificados.
   ```
   grep -r "patrón" directorio/
   ```
Buscará el "patrón" especificado en todos los archivos dentro del directorio y sus subdirectorios.

#### 7. **Expresiones regulares extendidas** 
`-E` (o `--extended-regexp`): Permite usar patrones de búsqueda.
   ```
   grep -E "[0-9]{3}-[0-9]{3}-[0-9]{4}" archivo.txt
   ```
Buscará líneas que contengan patrones que coincidan con la expresión regular extendida proporcionada (en este caso, un formato de número de teléfono en Estados Unidos).

#### 8. **Mostrar una palabra que no esté dentro de otras palabras**: `\b`
```
grep '\bv' /etc/passwd
```
- `'\bv'`: Utiliza una expresión regular para buscar la letra "v" como una palabra completa.
    - `\b`: En una expresión regular, `\b` representa un límite de palabra. Esto significa que `'\bv'` busca la letra "v" que está precedida y/o seguida por un límite de palabra. Esto garantiza que solo coincidirá con la letra "v" si aparece como una palabra independiente y no como parte de una palabra más larga.

#### 9. **Búsqueda con coincidencia de patrón solamente**
La opción `-o`
```
grep -o "patrón" archivo.txt
```
Indica que sólo muestre las partes de las líneas que coincidan con el patrón de búsqueda, en lugar de mostrar toda la línea

#### 10. **Líneas adicionales:**
- `-A`: Muestra lineas después de la coincidencia.
   ```
   grep -A 2 "error" archivo.txt
   ```
Imprimirá las líneas que contienen la palabra "error" y las 2 líneas siguientes después de cada coincidencia.

- `-B`: Muestra líneas adicionales antes de la coincidencia.
    ```
    grep -B 2 "error" archivo.txt
    ```
Imprimirá las 2 líneas antes de cada línea que contiene la palabra "error", además de las líneas coincidentes.

- `-C`: Muestra líneas adicionales antes y después de la coincidencia.
    ```
    grep -C 2 "error" archivo.txt
    ```
Imprimirá las 2 líneas antes y después de cada línea que contiene la palabra "error", además de las líneas coincidentes.

    
## Ejemplos combinados

### 

```
grep -oE 'https?://www\.inlanefreight\.com/[^"]+' | sort -u
```
- `grep -oE 'https?://www\.inlanefreight\.com/[^"']+'`: Utiliza una expresión regular para extraer todas las rutas que comienzan con "http://" o "https://" seguido de "[www.inlanefreight.com/](http://www.inlanefreight.com/)" y cualquier ruta posterior hasta encontrar un espacio en blanco o comillas.
- `sort -u`: Ordena las rutas extraídas y elimina las duplicadas.

### 

```
curl -s -X GET 'http://symfonos.local/h3l105/' | grep "wp-content" | grep -oP "'.*?'"
```

- **`.`**: Coincide con cualquier carácter, excepto saltos de línea.
- **`*`**: Indica que puede haber cero o más repeticiones del carácter anterior (en este caso, cualquier carácter).
- **`?`**: Hace que el `*` sea "no codicioso" (lazy), es decir, que intente coincidir con la menor cantidad posible de caracteres, deteniéndose en el primer cierre de comillas (`'`).

El `?` en una expresión regular cambia cómo se comporta el operador anterior (en este caso, el `*`).

- **`*`** por sí solo indica que el patrón anterior (en este caso, `.`) puede repetirse **cero o más veces**. Sin embargo, esto hace que la expresión busque de manera **codiciosa** (greedy), es decir, captura la mayor cantidad posible de caracteres.

- **`?`** después de un `*` hace que el patrón sea **no codicioso** (lazy). Esto significa que en lugar de intentar capturar la mayor cantidad posible de caracteres, buscará la **menor cantidad posible** de caracteres que aún cumplan con la expresión regular.

*Ejemplo con `'.*?'`:*

Supongamos que tenemos el siguiente texto:

```text
'abc' '123' 'xyz'
```

- Si usamos la expresión `'.*'` (sin `?`), coincidirá con la cadena `'abc' '123' 'xyz'` completa, porque intenta capturar todo lo posible.
  
- En cambio, si usamos `'.*?'`, coincidirá con **cada par de comillas simples** por separado, porque intenta capturar solo hasta la primera comilla de cierre (`'`), es decir:
  - `'abc'`
  - `'123'`
  - `'xyz'`

El `?` hace que el `*` se comporte de manera más conservadora, deteniéndose en la primera coincidencia de cierre de comillas.

---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `grep -r 'password' /var/www` | Recursive search | Hunt credentials en webroot |
| `grep -rIn 'api_key' .` | Recursive + ignore binary + show line nums | Secrets en source code |
| `grep -E 'pattern1\|pattern2' file` | OR regex extendido | Múltiples patrones |
| `grep -v '#' file \| grep -v '^$'` | Excluir comentarios + líneas vacías | Limpiar config files |
| `grep -A 3 -B 1 'error' log` | Contexto: 3 líneas after, 1 before | Análisis logs |
| `grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' file` | Solo match (sin línea completa) | Extraer IPs |
| `grep -l 'pattern' *.md` | Solo nombres de archivo matched | Filtrar archivos |
| `grep -c 'pattern' file` | Contar matches | Stats |

---

## Recon patterns útiles

```bash
# Hunt credentials en filesystem
grep -rIn -E 'password\s*=|api_key|secret\s*=|token' /var/www /opt /home

# Extract IPs
grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' file

# Extract emails
grep -oE '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b' file

# Buscar en bash history
grep -rE 'curl|wget|ssh|nc' ~/.bash_history /root/.bash_history 2>/dev/null
```

---

## Notas Relacionadas

- [[find]]
- [[Linux PrivEsc - SUID y SGID]]

