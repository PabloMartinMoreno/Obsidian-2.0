---
aliases:
tags:
  - env/linux
  - tool/awk
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
---
# Comando `awk`

## Definición 

> [!INFO] awk
>Es una poderosa herramienta de procesamiento de texto, utilizada para manipular y analizar datos estructurados en archivos de texto o flujos de entrada. `awk` funciona por medio de patrones y acciones especificadas por el usuario para realizar diversas tareas como extracción, transformación y reporte de datos.
^definicion

## Sintaxis Básica

La sintaxis básica de `awk` es:
```sh
awk 'pattern { action }' file
```
- **pattern**: un patrón que se busca en el texto.
- **action**: una acción que se realiza cuando se encuentra el patrón.

## Comandos y Funciones Comunes

### 1. Campos y Variables
- **`$0`**: Representa la línea completa de entrada.
- **`$1, $2, ..., $n`**: Representa los campos individuales de una línea, separados por el delimitador de campo (por defecto es el espacio en blanco).
Ejemplo:
```sh
echo "hello world" | awk '{print $1}'
# Salida: hello
```

### 2. BEGIN y END
- **`BEGIN`**: Bloque de código que se ejecuta antes de procesar cualquier línea de entrada.
- **`END`**: Bloque de código que se ejecuta después de procesar todas las líneas de entrada.
Ejemplo:
```sh
awk 'BEGIN {print "Start"} {print $0} END {print "End"}' file.txt
```

### 3. FS y OFS
- **`FS`** (Field Separator): Define el delimitador de campo de entrada.
- **`OFS`** (Output Field Separator): Define el delimitador de campo de salida.
Ejemplo:
```sh
echo "hello,world" | awk 'BEGIN {FS=","} {print $1, $2}'
# Salida: hello world
```

### 4. NR y NF
- **`NR`**: Número de Registro, representa el número de la línea actual.
- **`NF`**: Número de Campos, representa el número de campos en la línea actual.
Ejemplo:
```sh
awk '{print NR, NF, $0}' file.txt
```

### 5. Condicionales y Bucles
- **`if`**: Condicional para ejecutar acciones basadas en condiciones.
- **`for`**: Bucle para iterar sobre campos o realizar tareas repetitivas.
Ejemplo:
```sh
awk '{if ($3 > 100) print $0}' file.txt
```

### 6. Funciones Incorporadas
- **`length()`**: Retorna la longitud de una cadena.
- **`substr()`**: Extrae una subcadena.
- **`toupper()` y `tolower()`**: Convierte cadenas a mayúsculas o minúsculas.
Ejemplo:
```sh
echo "hello world" | awk '{print toupper($0)}'
# Salida: HELLO WORLD
```

## Ejemplos Prácticos

1. **Imprimir la segunda columna de un archivo**:
```sh
awk '{print $2}' file.txt
```

2. **Imprimir líneas donde el tercer campo es mayor que 100**:
```sh
awk '$3 > 100' file.txt
```

3. **Calcular la suma de la segunda columna**:
```sh
awk '{sum += $2} END {print sum}' file.txt
```

4. **Reemplazar el delimitador de campo y cambiarlo a tabulación**:
```sh
awk 'BEGIN {FS=","; OFS="\t"} {print $1, $2, $3}' file.csv
```

5. **Imprimir solo las líneas que contienen una palabra específica**:
```sh
awk '/pattern/' file.txt
```

## Ejemplos más avanzados

### Ejemplo 1: Imprimir líneas con un número específico de campos

Supongamos que tienes un archivo CSV donde cada línea tiene un número fijo de campos separados por comas. Puedes usar `NF` para filtrar las líneas que tienen un cierto número de campos.
```bash
# Supongamos que queremos imprimir solo las líneas con exactamente 3 campos
awk -F',' 'NF == 3 { print }' archivo.csv
```
En este ejemplo:
- `-F','` especifica que el delimitador de campos es la coma.
- `NF == 3` verifica si el número de campos (`NF`) es igual a 3.
- `{ print }` es la acción que se ejecuta para las líneas que cumplen la condición, simplemente imprimiendo la línea.

### Ejemplo 2: Sumar valores de una columna específica

Supongamos que tienes un archivo de texto con valores numéricos en la segunda columna, separados por espacios. Puedes usar `NF` para sumar estos valores.
```bash
# Sumar los valores en la segunda columna
awk '{ sum += $2 } END { print "La suma de la columna 2 es:", sum }' archivo.txt
```
En este ejemplo:
- `$2` se refiere al segundo campo de cada línea.
- `sum += $2` acumula la suma de todos los valores en el segundo campo a medida que AWK procesa cada línea.
- `END { print "La suma de la columna 2 es:", sum }` se ejecuta al final del procesamiento de todas las líneas e imprime el resultado final de la suma.

### Ejemplo 3: Reversión de líneas con campos invertidos

Puedes usar `NF` para revertir el orden de los campos en cada línea.
```bash
# Revertir el orden de los campos en cada línea
awk '{ for (i = NF; i > 0; i--) printf("%s ", $i); printf("\n") }' archivo.txt
```
En este ejemplo:
- `for (i = NF; i > 0; i--) printf("%s ", $i)` recorre cada campo desde el último hasta el primero (`NF` hasta `1`).
- `printf("\n")` imprime una nueva línea después de imprimir todos los campos en orden inverso.

## Comando `'NF{print $NF}'`

> Es una forma de imprimir el último campo (columna) de cada línea de entrada. Aquí está una explicación detallada:
1. **NF**: Es una variable especial en awk que almacena el número de campos (columnas) presentes en la línea de entrada actual. NF significa "Number of Fields" (Número de Campos).
2. `$NF`: En `awk`, el símbolo `$` se utiliza para acceder al valor de un campo específico. `$0` se refiere a la línea completa, `$1` al primer campo, `$2` al segundo campo, y así sucesivamente. `$NF` se refiere al último campo de la línea actual, ya que NF contiene el número total de campos.
3. **{print $NF}**: Esta es la acción que se realizará para cada línea de entrada. Las llaves `{}` encierran el bloque de código que se ejecutará. `print` es una instrucción que imprime la expresión que le sigue. En este caso, `print $NF` imprimirá el valor del último campo de cada línea.
es una forma de imprimir el último campo (columna) de cada línea de entrada. Aquí está una explicación detallada:
4. **NF**: Es una variable especial en awk que almacena el número de campos (columnas) presentes en la línea de entrada actual. NF significa "Number of Fields" (Número de Campos).
5. `$NF`: En `awk`, el símbolo `$` se utiliza para acceder al valor de un campo específico. `$0` se refiere a la línea completa, `$1` al primer campo, `$2` al segundo campo, y así sucesivamente. `$NF` se refiere al último campo de la línea actual, ya que NF contiene el número total de campos.
6. **{print $NF}**: Esta es la acción que se realizará para cada línea de entrada. Las llaves `{}` encierran el bloque de código que se ejecutará. `print` es una instrucción que imprime la expresión que le sigue. En este caso, `print $NF` imprimirá el valor del último campo de cada línea.
---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `awk '{print $1}' file` | Primera columna | Default separator = whitespace |
| `awk -F',' '{print $2}' file` | Columna por separator (CSV) | Parseo CSV |
| `awk '/pattern/{print}' file` | Líneas que matchean regex | Filtro |
| `awk 'NR==5' file` | Línea específica | Pinpoint |
| `awk 'NR>1' file` | Skip header | Cleanup |
| `awk '!seen[$0]++' file` | Dedup preservando orden | Unique (sin sort) |
| `awk '{sum+=$1} END {print sum}' file` | Suma de columna | Stats |
| `awk -F: '{print $1}' /etc/passwd` | Users del sistema | Linux enum |
| `awk '{print $NF}' file` | Última columna | Variable |

---

## Patterns útiles en pentest

```bash
# Extract IPs from output
awk '/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/ {print $0}' file

# nmap: extract open ports
nmap -p- <target> | awk '/open/ {print $1}' | cut -d/ -f1

# Parse /etc/passwd con UID > 1000 (real users)
awk -F: '$3 > 1000 {print $1}' /etc/passwd

# Mostrar archivos > 10MB en find output
find / -type f -size +10M | xargs ls -lh 2>/dev/null | awk '{print $5, $9}'

# Filter SUID list output
find / -perm -4000 2>/dev/null | awk -F/ '{print $NF}'
```

---

## Notas Relacionadas

- [[grep]]
- [[find]]
