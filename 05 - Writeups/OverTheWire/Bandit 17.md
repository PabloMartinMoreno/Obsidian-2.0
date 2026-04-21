---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit17.html
dificultad: Fácil
autor: 
relacionados:
  - "[[diff]]"
  - "[[Bandit 16]]"
  - "[[Bandit 18]]"
---
# Datos

> [!TODO] Objetivo
> Hay 2 archivos en el homedirectory: passwords.old y passwords.new. La contraseña para el siguiente nivel está en passwords.new y es la única línea que ha cambiado entre passwords.old y passwords.new.
>
NOTA: si has resuelto este nivel y ves "¡Adiós!" cuando intentas entrar en bandit18, esto está relacionado con el siguiente nivel, bandit19.
^objetivo

> [!TIP] Recursos
**Comandos:**
> cat, grep, ls, diff
^recursos

# Conceptos clave

Ver [[diff]]

# Resolución

```bash
diff password.old password.new
```
```
42c42
< bSrACvJvvBSxEM2SGsV5sn09vc3xgqyp
---
> x2gLTTjFwMOhQ8oWNbMN362QKxfRqGlO
```

# Bandera(s)

> [!FLAG] `x2gLTTjFwMOhQ8oWNbMN362QKxfRqGlO`
^bandera
