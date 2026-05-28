---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit21.html
dificultad: Fácil
autor:
relacionados:
  - "[[crontab]]"
  - "[[Bandit 20]]"
  - "[[Bandit 22]]"
---
# Datos

> [!todo] Objetivo
> Un programa se está ejecutando automáticamente a intervalos regulares desde cron, el programador de trabajos basado en el tiempo. Busque en /etc/cron.d/ la configuración y vea qué comando se está ejecutando.
^objetivo

> [!tip] Recursos
> cron, crontab, crontab(5) (use “man 5 crontab” to access this)
^recursos

# Conceptos clave

Ver [[Cron]] y [[crontab]]

# Resolución

```bash
cd /etc/cron.d/
ls
cat cronjob_bandit22
```
```
@reboot bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null
* * * * * bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null
```

```bash
cat /usr/bin/cronjob_bandit22.sh
```
```bash
#!/bin/bash
chmod 644 /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
cat /etc/bandit_pass/bandit22 > /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
```

Por lo que veo, está mandando la contraseña de `/etc/bandit_pass/bandit22` a `/tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv`.

Por ende:
```bash
cat /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
```

Y obtengo la pass.

# Bandera(s)

> [!flag] `tRae0UfB9v0UzbCdn9cY0gQnds9GF58Q`
^bandera
