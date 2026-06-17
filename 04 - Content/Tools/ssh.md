---
aliases:
  - ssh
tags:
  - tool/ssh
  - env/linux
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
  - "[[Pivoting & Port Forwarding]]"
---
# Comando `ssh`

> [!info] ssh (**S**ecure **Sh**ell)
> Acceso remoto a un servidor por un canal cifrado. Además de shell, hace **port forwarding / túneles** (`-L`, `-R`) — base del pivoting. Sintaxis: `ssh [opciones] usuario@servidor`. Ver [[03 - Conceptos/SSH|SSH (concepto)]].
^Definicion

---

## Cheatsheet

| Comando | Qué hace |
|---|---|
| `ssh user@host` | Conexión básica (puerto 22) |
| `ssh -p 2222 user@host` | Puerto no estándar |
| `ssh -i ~/.ssh/id_rsa user@host` | Autenticación con clave privada |
| `ssh -L 8080:localhost:80 user@host` | **Local forward**: puerto local 8080 → :80 del remoto |
| `ssh -R 9090:localhost:90 user@host` | **Remote forward**: puerto remoto 9090 → :90 local |
| `ssh -f -N -L 8080:localhost:80 user@host` | Túnel en background, sin shell |
^ssh-cheatsheet

---

## Opciones

| Flag | Qué hace |
|---|---|
| `-p puerto` | Puerto del servidor (default 22) |
| `-i clave` | Archivo de clave privada |
| `-L lport:host:rport` | Túnel **local** → recurso remoto (acceder a algo del otro lado) |
| `-R rport:host:lport` | Túnel **remoto** → recurso local (exponer algo tuyo al server) |
| `-C` | Compresión (conexiones lentas) |
| `-N` | No ejecuta comandos, solo el túnel |
| `-f` | Manda ssh a background tras autenticar |

> `-L`/`-R` + `-N -f` = pivoting clásico. Detalle en [[Pivoting & Port Forwarding]].

---

## Ejemplo Completo

Conectar a `mi-servidor.com` como `juan`, puerto 2222, con clave, y forward del 8080 local al 80 remoto:

```sh
ssh -p 2222 -i ~/.ssh/mi_clave -L 8080:localhost:80 juan@mi-servidor.com
```
