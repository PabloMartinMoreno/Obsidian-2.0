---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit29.html
dificultad: Fácil
autor:
relacionados:
  - "[[git]]"
  - "[[Bandit 28]]"
  - "[[Bandit 30]]"
---
# Datos

> [!todo] Objetivo
> Hay un repositorio git en ssh://bandit29-git@localhost/home/bandit29-git/repo a través del puerto 2220. La contraseña para el usuario bandit29-git es la misma que para el usuario bandit29.
>
Clona el repositorio y encuentra la contraseña para el siguiente nivel.
^objetivo

> [!tip] Recursos
> git
^recursos

# Resolución

Mismo comienzo que los anteriores.

La contraseña no parece estar en los logs, por lo que podría probar viendo las distintas ramas. 
```bash
git branch -a # para listar las ramas

# Se ve lo siguiente
* master
  remotes/origin/HEAD -> origin/master
  remotes/origin/dev
  remotes/origin/master
  remotes/origin/sploits-dev
```
**`-a`**: Muestra una lista de **todas las ramas locales y remotas**.

Esto hace pensar que si bien en producción no está la contraseña, la misma sí podría estar en la rama de desarrollo:
```bash
git checkout dev
```

La contraseña está a simple vista. 

# Bandera(s)

> [!flag] `qp30ex3VLz5MDG1n91YowTv4Q8l7CDZL`
^bandera
