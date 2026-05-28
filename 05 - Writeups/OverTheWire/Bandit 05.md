---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit5.html
dificultad: Fácil
autor:
relacionados:
  - "[[find]]"
  - "[[xargs]]"
  - "[[Bandit 04]]"
  - "[[Bandit 06]]"
---
# Datos

> [!todo] Objetivo
>  La contraseña para el siguiente nivel se almacena en un archivo en algún lugar bajo el directorio inhere y tiene todas las siguientes propiedades:
>- legible por humanos
>- 1033 bytes de tamaño
>- no ejecutable
^objetivo

> [!tip] Recursos
> [ls](https://man7.org/linux/man-pages/man1/ls.1.html) , [cd](https://man7.org/linux/man-pages/man1/cd.1p.html) , [cat](https://man7.org/linux/man-pages/man1/cat.1.html) , [file](https://man7.org/linux/man-pages/man1/file.1.html) , [du](https://man7.org/linux/man-pages/man1/du.1.html) , [find](https://man7.org/linux/man-pages/man1/find.1.html)
^recursos

# Conceptos clave

[[find]]

# Resolución

Dentro del directorio `inhere` hay muchos más directorios con ficheros, para encontrarlo sigo la consigna:
```bash
find . -readable -size 1033c ! -executable

./inhere/maybehere07/.file2
```

Ahí está la contraseña.

>[!tip]
>```bash
>find . -readable -size 1033c ! -executable | xargs cat | xargs
>```
El segundo xargs es para eliminar espacios.

# Bandera(s)

> [!flag] `4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw`
^bandera
