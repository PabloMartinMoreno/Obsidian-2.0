---
aliases:
  - sort
tags:
  - tool/sort
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

# Comando `sort`

## Definición 

> [!INFO] sort
>Se utiliza para ordenar líneas de texto en un archivo o datos de entrada proporcionados.
^definicion
## Uso Básico:

1. **Ordenar un Archivo:**
   ```bash
   sort archivo.txt
   ```
   Esto ordenará las líneas del archivo `archivo.txt` alfabéticamente y mostrará el resultado en la salida estándar.

2. **Ordenar la Salida de otro Comando:**
   ```bash
   comando_generador | sort
   ```
   Puedes usar `sort` para ordenar la salida de otro comando.

## Opciones Útiles:

- **Orden Numérico (`-n`):**
  ```bash
  sort -n archivo.txt
  ```
  Ordena las líneas numéricamente en lugar de alfabéticamente.

- **Orden Revertido (`-r`):**
  ```bash
  sort -r archivo.txt
  ```
  Ordena en orden descendente.

- **Ignorar Mayúsculas y Minúsculas (`-f`):**
  ```bash
  sort -f archivo.txt
  ```
  Realiza un ordenamiento ignorando las diferencias entre mayúsculas y minúsculas.

- **Ordenar por Campo (`-k`):**
  ```bash
  sort -k 2,2 archivo.txt
  ```
  Ordena por el segundo campo del archivo (por defecto, los campos están separados por espacios en blanco).

- **Ordenar un Archivo sin Modificar (`-o`):**
  ```bash
  sort archivo.txt -o archivo_ordenado.txt
  ```
  Guarda la salida ordenada en un nuevo archivo (`archivo_ordenado.txt`) sin modificar el original.

## Ejemplos:

- **Ordenar y Mostrar Números:**
  ```bash
  echo -e "5\n2\n10\n1\n8" | sort -n
  ```
  Salida: 
  ```
  1
  2
  5
  8
  10
  ```

- **Ordenar un Archivo y Guardar la Salida:**
  ```bash
  sort -r archivo.txt -o archivo_ordenado.txt
  ```
  Esto ordena `archivo.txt` en orden descendente y guarda el resultado en `archivo_ordenado.txt`.

- **Ordenar por Campo Específico:**
  Supongamos que tienes un archivo CSV (`datos.csv`) con nombres en la primera columna y edades en la segunda:
  ```bash
  sort -t',' -k2,2n datos.csv
  ```
  Esto ordenará `datos.csv` por la segunda columna (edades) numéricamente.
