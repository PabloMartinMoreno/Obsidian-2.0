---
aliases:
  - crontab
tags:
  - tool/crontab
  - env/linux
  - technique/persistence
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
  - "[[Linux PrivEsc - Cron Jobs]]"
---
# Comando `crontab`

> [!info] crontab (**cron tab**le)
> Programa tareas automáticas (*cron jobs*) en Unix, desde cada minuto hasta una vez al año. Es el archivo donde se guardan las tareas y el comando para gestionarlas. Crontabs de usuario en `/var/spool/cron/crontabs/`.
>
> **Red Team:** un cron job es un vector clásico de **persistencia** y **privesc** (cron de root sobre script escribible). Ver [[Linux PrivEsc - Cron Jobs]].
^definicion

---

## Sintaxis

```
# ┌── min (0-59)
# │ ┌── hora (0-23)
# │ │ ┌── día del mes (1-31)
# │ │ │ ┌── mes (1-12)
# │ │ │ │ ┌── día de semana (0-7, 0 y 7 = domingo)
# * * * * * /ruta/comando
```

Cada campo: valor, rango (`9-18`), lista (`1,15`), paso (`*/15`) o `*` (cualquiera).

---

## Comandos

| **Comando** | **Qué hace** |
|---|---|
| `crontab -e` | Edita el crontab del usuario |
| `crontab -l` | Lista las tareas programadas |
| `crontab -r` | Elimina **todo** el crontab |
| `crontab -u usuario -e` | Edita el de otro usuario (root) |

---

## Ejemplos de Schedule

| **Entrada** | **Cuándo** |
|---|---|
| `30 2 * * * /script.sh` | Todos los días 2:30 AM |
| `0 17 * * 1 /cmd` | Lunes 5:00 PM |
| `*/15 * * * * /cmd` | Cada 15 minutos |
| `0 0 1 1 * /script.sh` | 1 de enero a medianoche |
| `0 9-18 * * 1-5 /cmd` | Cada hora 9-18h, lun-vie |

**Atajos:** `@reboot` (al iniciar), `@hourly`, `@daily`, `@weekly`, `@monthly`, `@yearly`.

---

## Consideraciones

- **Entorno:** cron **no** carga el entorno del usuario → definir `PATH` en el crontab o usar **rutas absolutas**.
- **Salida:** si el job imprime algo, se envía mail al usuario. Silenciar con `> /dev/null 2>&1`, o loguear con `>> /ruta/log 2>&1`.
