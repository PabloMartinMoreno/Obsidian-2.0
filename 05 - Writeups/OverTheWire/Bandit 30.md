---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit30.html
dificultad: Fácil
autor:
linked:
  - "[[git]]"
  - "[[Bandit 29]]"
  - "[[Bandit 31]]"
---
# Datos

> [!todo] Objetivo
> Hay un repositorio git en ssh://bandit30-git@localhost/home/bandit30-git/repo a través del puerto 2220. La contraseña para el usuario bandit30-git es la misma que para el usuario bandit30.
>
Clona el repositorio y encuentra la contraseña para el siguiente nivel.
^objetivo

> [!tip] Recursos
> git
^recursos

# Resolución

Mismo inicio que los anteriores.

En principio no encuentro nada ni en los logs ni en las ramas. 

Sí sin embargo al hacer un:
```bash
git tag

# veo
secret
```

Para ver el contenido de la tag uso:
```bash
git show secret

# veo el contenido
fb5S2xb7bRyFmAvQYQGEqsbhVyJqhnDy
```

Esa parecería ser la contraseña.

# Bandera(s)

> [!flag] `fb5S2xb7bRyFmAvQYQGEqsbhVyJqhnDy`
^bandera
