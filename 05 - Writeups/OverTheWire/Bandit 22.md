---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit22.html
dificultad: Fácil
autor:
relacionados:
  - "[[crontab]]"
  - "[[md5sum]]"
  - "[[Bandit 21]]"
  - "[[Bandit 23]]"
---
# Datos

> [!todo] Objetivo
> Un programa se está ejecutando automáticamente a intervalos regulares desde cron, el programador de trabajos basado en el tiempo. Busque en /etc/cron.d/ la configuración y vea qué comando se está ejecutando.
>
NOTA: Mirar scripts de shell escritos por otras personas es una habilidad muy útil. El script para este nivel está hecho intencionalmente fácil de leer. Si tienes problemas para entender lo que hace, intenta ejecutarlo para ver la información de depuración que imprime.
^objetivo

> [!tip] Recursos
> cron, crontab, crontab(5) (use “man 5 crontab” to access this)
^recursos

# Conceptos clave

Ver [[Cron]] y [[crontab]]

# Resolución

```bash
cat /etc/cron.d/cronjob_bandit23
```
```
@reboot bandit23 /usr/bin/cronjob_bandit23.sh  &> /dev/null
* * * * * bandit23 /usr/bin/cronjob_bandit23.sh  &> /dev/null
```
```bash
cat /usr/bin/cronjob_bandit23.sh
```
```bash
#!/bin/bash

myname=$(whoami)
mytarget=$(echo I am user $myname | md5sum | cut -d ' ' -f 1)

echo "Copying passwordfile /etc/bandit_pass/$myname to /tmp/$mytarget"

cat /etc/bandit_pass/$myname > /tmp/$mytarget

```

Le esta haciendo un `md5sum` a la variable `myname` que corresponde al usuario `bandit22`.

```bash
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
```
```
8ca319486bfbbc3663ea0fbe81326349
```

```bash
cat /tmp/8ca319486bfbbc3663ea0fbe81326349
```
Listo.

# Bandera(s)

> [!flag] `0Zf11ioIjMVN551jX3CmStKLYqjk54Ga`
^bandera
