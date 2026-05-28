---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit01.html
dificultad: Fácil
autor:
relacionados:
  - "[[Bandit 00]]"
  - "[[Bandit 02]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se almacena en un archivo llamado - ubicado en el directorio home
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

El fichero a leer tiene el nombre `-`, esto hace que el programa se confunda y no se puede leer directamente con un `cat`

```bash 
cat -
# queda colgado
```

Existen varias formas para leerlo:
```bash
cat < -
cat ./-
cat $PWD/-
```

Listo, esa es la contraseña.

# Bandera

> [!flag] `ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If`
^bandera
