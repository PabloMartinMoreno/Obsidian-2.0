---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit27.html
dificultad: Fácil
autor: 
relacionados:
  - "[[git]]"
  - "[[Bandit 26]]"
  - "[[Bandit 28]]"
---
# Datos

> [!todo] Objetivo
> Hay un repositorio git en ssh://bandit27-git@localhost/home/bandit27-git/repo a través del puerto 2220. La contraseña para el usuario bandit27-git es la misma que para el usuario bandit27.
>
Clona el repositorio y encuentra la contraseña para el siguiente nivel.
^objetivo

> [!tip] Recursos
> [[git]]
^recursos

# Resolución

Entro en un directorio temporal para clonar el repositorio:
```bash
cd $(mktemp -d)
```

La consigna me dice que clone el repositorio `ssh://bandit27-git@localhost/home/bandit27-git/repo` pero que entre por el puerto 2220. Para eso debo agregar el puerto luego del hostname y poniendo `:` entre estos.
```bash
git clone ssh://bandit27-git@localhost:2220/home/bandit27-git/repo
```

Pongo la contraseña de [[Bandit 26]] `upsNCc7vzaRDx6oZC6GiR6ERwe1MowGB`y me descarga el repositorio.

La contraseña está adentro.

# Bandera(s)

> [!flag] `Yz9IpL0sBcCeuG7m9uQFt8ZNpS4HZRcN`
^bandera
