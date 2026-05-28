---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit2.html
dificultad: Fácil
autor:
relacionados:
  - "[[Bandit 01]]"
  - "[[Bandit 03]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se almacena en un archivo llamado `spaces in this filename` ubicado en el directorio raíz
^objetivo

> [!tip] Recursos
> **Comandos**
> - [ls](https://man7.org/linux/man-pages/man1/ls.1.html)
> - [cd](https://man7.org/linux/man-pages/man1/cd.1.html)
> - [cat](https://man7.org/linux/man-pages/man1/cat.1.html)
> - [file](https://man7.org/linux/man-pages/man1/file.1.html)
> - [du](https://man7.org/linux/man-pages/man1/find.1.html)
> - [find](https://man7.org/linux/man-pages/man1/find.1.html)
>   
> **Referencias**
> - ["Dashed filename" buscado en Google](https://www.google.com/search?q=dashed+filename)
> - [Guía Avanzada de Bash-Scripting - Capítulo 3 - Caracteres especiales](https://tldp.org/LDP/abs/html/special-chars.html)
^recursos

# Resolución

Al querer hacer un `cat` con espacios, no funciona porque piensa que son distintos archivos. 

> [!info] La terminal interpreta los espacios como **separadores de argumentos en los comandos**
> El siguiente comando [[cat]] se ejecutaría 4 veces: una para un fichero *spaces*, otra para *in*, otra para *this* y otra para *filename*:
> ```shell
> cat spaces in this filename
> ```
> ```text
> cat: spaces: No such file or directory
> cat: in: No such file or directory
> cat: this: No such file or directory
> cat: filename: No such file or directory
> ```

Las posibles soluciones son:
```bash
cat spaces\ in\ this\ filename
cat 'spaces in this filename'
```

# Bandera

> [!flag] `263JGJPfgU6LtdEvgfWU1XP5yac29mFx`
^bandera
