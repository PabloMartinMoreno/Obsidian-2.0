---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit4.html
dificultad: Fácil
autor: 
relacionados:
  - "[[file]]"
  - "[[xargs]]"
  - "[[find]]"
  - "[[grep]]"
  - "[[awk]]"
  - "[[Bandit 03]]"
  - "[[Bandit 05]]"
  - "[[Expresiones regulares]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se almacena en el único archivo legible por humanos en el directorio `inhere`. Consejo: si su terminal está estropeada, pruebe el comando "reset".
^objetivo

> [!tip] Recursos
> **Comandos**
> - [ls](https://man7.org/linux/man-pages/man1/ls.1.html)
> - [cd](https://man7.org/linux/man-pages/man1/cd.1.html)
> - [cat](https://man7.org/linux/man-pages/man1/cat.1.html)
> - [file](https://man7.org/linux/man-pages/man1/file.1.html)
> - [du](https://man7.org/linux/man-pages/man1/find.1.html)
> - [find](https://man7.org/linux/man-pages/man1/find.1.html)
^recursos
# Resolución

```bash
ls inhere

-file00  -file01  -file02  -file03  -file04  -file05  -file06  -file07  -file08  -file09
```

Podría usar el comando  [[file]] archivo por archivo hasta encontrar el archivo legible, pero hay formas más completas para hacerlo sin tener que revisar archivo por archivo:
```bash 
find . | grep '\-file' | xargs file

./inhere/-file00: data
./inhere/-file03: data
./inhere/-file08: data
./inhere/-file02: data
./inhere/-file04: data
./inhere/-file01: data
./inhere/-file07: ASCII text
./inhere/-file06: data
./inhere/-file05: data
./inhere/-file09: data
```

También podría hacer lo siguiente para ver lo mismo (o similar) que con el comando anterior y de forma más sencilla:
```bash
cd inhere/
file ./*
```
```
./-file00: data
./-file01: data
./-file02: data
./-file03: data
./-file04: data
./-file05: data
./-file06: data
./-file07: ASCII text
./-file08: data
./-file09: data
```

Ahí ya puedo hacer un `cat ./-filename07` al archivo de texto leible y obtener la contraseña.

>[!tip] Otras formas más avanzadas podrían ser:
>```bash
> find . | grep '\-file' | xargs file | grep 'ASCII text' | awk -F: '{print $1}' | xargs cat
> # o
> find . -name "*-file*" -exec file {} + | grep 'ASCII text' | awk -F: '{print $1}' | xargs cat
> # o
> file ./* | grep ASCII | awk -F: '{print $1}' | xargs cat
>```
- `find . -name "*-file*"`: Busca todos los archivos cuyo nombre contenga "-file".
- `-exec file {} +`: Ejecuta el comando `file` en todos los archivos encontrados por `find`.
- `grep 'ASCII text'`: Filtra la salida de `file` para mostrar solo las líneas que contienen 'ASCII text'.
- `awk -F: '{print $1}'`: Extrae el nombre del archivo de la salida del comando `file`.
- `xargs cat`: Usa `xargs` para pasar el nombre del archivo a `cat` y mostrar su contenido.

La mayor diferencia entre los primeros dos ejemplos, repercute en que el primero ejecuta el comando `file` agregando una interacción con el `xargs` y el segundo lo hace directamente desde el `find`.  En el caso del tercer ejemplo es sin el `find` usando `file` directamente.

# Bandera

> [!flag] `2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ`
^bandera
