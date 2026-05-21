---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit19.html
dificultad: Fácil
autor: 
relacionados:
  - "[[Bandit 18]]"
  - "[[Bandit 20]]"
  - "[[SUID]]"
---
# Datos

> [!todo] Objetivo
> Para acceder al siguiente nivel, debe utilizar el binario setuid en el directorio home. Ejecútalo sin argumentos para saber cómo usarlo. La contraseña para este nivel se puede encontrar en el lugar habitual (/etc/bandit_pass), después de haber utilizado el binario setuid.
^objetivo

> [!tip] Recursos
> [setuid on Wikipedia](https://en.wikipedia.org/wiki/Setuid)
^recursos

# Conceptos clave

Ver [[SUID]]

# Resolución

Hay un binario que al ejecutarlo y mandarle un comando, responde como si fuera bandit20

```bash
./bandit20-do whoami
```
```
bandit20
```

Por ende lo puedo usar para encontrar la contraseña del nivel:
```bash
./bandit20-do cat /etc/bandit_pass/bandit20
```

# Bandera(s)

> [!flag] `0qXahG8ZjOVMN9Ghs7iOWsCfZyXOUbYO`
^bandera
