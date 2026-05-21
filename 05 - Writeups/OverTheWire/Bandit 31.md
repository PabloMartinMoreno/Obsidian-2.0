---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit31.html
dificultad: Fácil
autor: 
relacionados:
  - "[[git]]"
  - "[[Bandit 30]]"
  - "[[Bandit 32]]"
---
# Datos

> [!todo] Objetivo
> Hay un repositorio git en ssh://bandit31-git@localhost/home/bandit31-git/repo a través del puerto 2220. La contraseña para el usuario bandit31-git es la misma que para el usuario bandit31.
>
Clona el repositorio y encuentra la contraseña para el siguiente nivel.
^objetivo

> [!tip] Recursos
> git
^recursos

# Resolución

Mismo inicio que los anteriores.

Al leer el README.md me dice: 
```
This time your task is to push a file to the remote repository.

Details:
    File name: key.txt
    Content: 'May I come in?'
    Branch: master


# Traducido 
Esta vez su tarea es enviar un archivo al repositorio remoto.

Detalles:
    Nombre del fichero: key.txt
    Contenido: '¿Puedo entrar?
    Rama: master
```

Pruebo de hacer el fichero que me dice con el contenido que también dice ahí.

Agrego el archivo al seguimiento para ser enviado.
```bash
git add -f key.txt
```
**`-f`** agrega archivos al área de **staging** de manera forzada, **ignorando** lo que esté especificado en `.gitignore`.

Le hago un commit: 
```bash
git commit -m 'lo que sea'
```

Lo subo:
```bash
git push -u origin master

# Pongo la contraseña y me devuelve lo siguiente

Enumerating objects: 4, done.
Counting objects: 100% (4/4), done.
Delta compression using up to 2 threads
Compressing objects: 100% (2/2), done.
Writing objects: 100% (3/3), 321 bytes | 321.00 KiB/s, done.
Total 3 (delta 0), reused 0 (delta 0), pack-reused 0
remote: ### Attempting to validate files... ####
remote:
remote: .oOo.oOo.oOo.oOo.oOo.oOo.oOo.oOo.oOo.oOo.
remote:
remote: Well done! Here is the password for the next level:
remote: 3O9RfhqyAlVBEZpVb6LYStshZoqoSx5K
remote:
remote: .oOo.oOo.oOo.oOo.oOo.oOo.oOo.oOo.oOo.oOo.
remote:
To ssh://localhost:2220/home/bandit31-git/repo

```
**`-u`** Además de enviar los commits locales al repositorio remoto, este comando establece una **relación de seguimiento** entre la rama local y la rama remota.

La contraseña está a la vista.

# Bandera(s)

> [!flag] `3O9RfhqyAlVBEZpVb6LYStshZoqoSx5K`
^bandera
