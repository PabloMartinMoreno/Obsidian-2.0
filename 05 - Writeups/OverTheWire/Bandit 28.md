---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit28.html
dificultad: Fácil
autor: 
relacionados:
  - "[[git]]"
  - "[[Bandit 27]]"
  - "[[Bandit 29]]"
---
# Datos

> [!TODO] Objetivo
> Hay un repositorio git en ssh://bandit28-git@localhost/home/bandit28-git/repo a través del puerto 2220. La contraseña para el usuario bandit28-git es la misma que para el usuario bandit28.
> 
Clona el repositorio y encuentra la contraseña para el siguiente nivel.
^objetivo

> [!TIP] Recursos
> git
^recursos

# Resolución

Sigo los mismos pasos que en [[Bandit 27]] para clonar el repo. 

Ahora me encuentro con que la contraseña no está. Para revisar los logs uso:
```bash
git log
```

Veo esto:
```bash
commit 8cbd1e08d1879415541ba19ddee3579e80e3f61a (HEAD -> master, origin/master, origin/HEAD)
Author: Morla Porla <morla@overthewire.org>
Date:   Wed Jul 17 15:57:30 2024 +0000

    fix info leak

commit 73f5d0435070c8922da12177dc93f40b2285e22a
Author: Morla Porla <morla@overthewire.org>
Date:   Wed Jul 17 15:57:30 2024 +0000

    add missing data

commit 5f7265568c7b503b276ec20f677b68c92b43b712
Author: Ben Dover <noone@overthewire.org>
Date:   Wed Jul 17 15:57:30 2024 +0000

    initial commit of README.md
```

Reviso los logs usando `git checkout [numero de commit]`, en caso de entrar en el equivocado puedo retroceder con `git checkout -`

El correcto es el que dice add missing data: 
```bash 
git checkout 73f5d0435070c8922da12177dc93f40b2285e22a
```

la contraseña está a la vista.

>[!TIP]
>Otra alternativa es usar `git show` en el commit que dice `fix info leak` para ver los cambios
>```bash
>git show 8cbd1e08d1879415541ba19ddee3579e80e3f61a
>```
> Esto muestra los cambios realizados en el ultimo commit y el anterior: 
> 
>```bash
>commit 8cbd1e08d1879415541ba19ddee3579e80e3f61a (HEAD -> master, origin/master, origin/HEAD)
>Author: Morla Porla <morla@overthewire.org>
>Date:   Wed Jul 17 15:57:30 2024 +0000
>
 >   fix info leak
>
>diff --git a/README.md b/README.md
>index d4e3b74..5c6457b 100644
>--- a/README.md
>+++ b/README.md
>@@ -4,5 +4,5 @@ Some notes for level29 of bandit.
 >## credentials
>
> - username: bandit29
>-- password: 4pT1t5DENaYuqnqvadYs1oE4QLCdjmJ7
>+- password: xxxxxxxxxx

# Bandera(s)

> [!FLAG] `4pT1t5DENaYuqnqvadYs1oE4QLCdjmJ7`
^bandera
