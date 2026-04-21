---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit06.html
dificultad: Fácil
autor: 
relacionados:
  - "[[find]]"
  - "[[xargs]]"
  - "[[dev null]]"
  - "[[Bandit 05]]"
  - "[[Bandit 07]]"
---
# Datos

> [!TODO] Objetivo
> La contraseña para el siguiente nivel se almacena en algún lugar del servidor y tiene todas las propiedades siguientes:
>
>- propiedad del usuario bandit7
>- propiedad del grupo bandit6
>- 33 bytes de tamaño
^objetivo

> [!TIP] Recursos
> [ls](https://man7.org/linux/man-pages/man1/ls.1.html) , [cd](https://man7.org/linux/man-pages/man1/cd.1p.html) , [cat](https://man7.org/linux/man-pages/man1/cat.1.html) , [file](https://man7.org/linux/man-pages/man1/file.1.html) , [du](https://man7.org/linux/man-pages/man1/du.1.html) , [find](https://man7.org/linux/man-pages/man1/find.1.html) , [grep](https://man7.org/linux/man-pages/man1/grep.1.html)
^recursos

# Conceptos clave

[[find]]
[[dev null]]

# Resolución

```bash
find / -user bandit7 -group bandit6 -size 33c 2>/dev/null | xargs cat
```

# Bandera(s)

> [!FLAG] `HWasnPhtq9AVKe0dmk45nxy20cvUa6EG`
^bandera
