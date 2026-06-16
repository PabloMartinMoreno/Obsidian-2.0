---
aliases:
  - file
tags:
  - tool/file
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

# Comando `file`

### Definición 

> [!INFO] file
>Se utiliza para determinar el tipo de archivo. Este comando examina los archivos y trata de clasificarlos basándose en su contenido. Es útil para identificar tipos de archivos desconocidos o para verificar que un archivo sea del tipo esperado.
^definicion

### Sintaxis básica
```bash
file [opciones] archivo1 [archivo2 ...]
```

### Opciones más usadas y ejemplos

1. **Sin opciones (predeterminada)**
   - **Descripción**: Muestra el tipo de archivo de cada archivo listado.
   - **Ejemplo**:
     ```bash
     file ejemplo.txt
     ```
     Salida:
     ```
     ejemplo.txt: ASCII text
     ```

2. **`-b` o `--brief`**
   - **Descripción**: Muestra solo el tipo de archivo sin el nombre del archivo.
   - **Ejemplo**:
     ```bash
     file -b ejemplo.txt
     ```
     Salida:
     ```
     ASCII text
     ```

3. **`-i` o `--mime`**
   - **Descripción**: Muestra el tipo MIME del archivo.
   - **Ejemplo**:
     ```bash
     file -i ejemplo.txt
     ```
     Salida:
     ```
     ejemplo.txt: text/plain; charset=us-ascii
     ```

4. **`-z` o `--uncompress`**
   - **Descripción**: Examina el contenido de los archivos comprimidos.
   - **Ejemplo**:
     ```bash
     file -z archivo_comprimido.gz
     ```
     Salida:
     ```
     archivo_comprimido.gz: gzip compressed data, was "archivo_comprimido", from Unix, last modified: Mon Jun 1 00:00:00 2020
     ```

5. **`-f`**
   - **Descripción**: Lee los nombres de archivo desde un archivo de texto especificado.
   - **Ejemplo**:
     ```bash
     echo "ejemplo.txt" > lista_archivos.txt
     file -f lista_archivos.txt
     ```
     Salida:
     ```
     ejemplo.txt: ASCII text
     ```

6. **`--version`**
   - **Descripción**: Muestra la versión del programa `file`.
   - **Ejemplo**:
     ```bash
     file --version
     ```
     Salida:
     ```
     file-5.39
     ```

### Ejemplos adicionales

- Identificar múltiples archivos:
  ```bash
  file archivo1.jpg archivo2.png archivo3.pdf
  ```
  Salida:
  ```
  archivo1.jpg: JPEG image data, JFIF standard 1.01
  archivo2.png: PNG image data, 800 x 600, 8-bit/color RGB, non-interlaced
  archivo3.pdf: PDF document, version 1.4
  ```

- Uso con comodines:
  ```bash
  file *.txt
  ```
  Salida:
  ```
  archivo1.txt: ASCII text
  archivo2.txt: ASCII text, with very long lines
  ```

El comando `file` es una herramienta poderosa y versátil para determinar el tipo de archivos en sistemas Unix y Linux. Sus múltiples opciones permiten personalizar la salida según las necesidades del usuario.