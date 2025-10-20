---
aliases:
tags:
  - type/technique
primary categories:
secondary categories:
type: Technique
linked:
---
# Users & Groups Enumeration (AD)

***

## Cheatsheet

````tabs
tab: Linux
| Comando | Descripción |
|--------|-------------|


tab: Windows

| Comando | Descripción |
|--------|-------------|
````


---

## Nota previa

Este paso asume que ya completaste la enumeración de hosts y conocés el dominio y el Domain Controller (Controlador de Dominio).

---

## Con acceso

| Comando | Descripción |
|--------|-------------|
| `nxc smb <dc-ip> -u <user> -p <password> --users` (NXC SMB) | (SMB) Recupera la lista de todos los usuarios del dominio. También muestra el conteo de intentos de contraseña erróneos por cada usuario. Para extraer usuarios del output: `awk '$5 ~ /^[a-zA-Z0-9_]+$/ && NF >= 5 { print $5 }' output.txt > users.lst` |
| `nxc smb <dc-ip> -u <user> -p <password> --groups` (NXC SMB) | (SMB) Recupera la lista de todos los grupos del dominio. Incluye el recuento de miembros por grupo. Prestar atención a grupos clave como Administrators, Domain Admins y Executives. |
| `nxc smb <host> -u <user> -p <password> --loggedon-users` (NXC SMB) | (SMB) Lista los usuarios actualmente logueados en el host especificado (requiere permisos de administrador local). Oportunidad valiosa para robar credenciales de Domain Admin en memoria o para suplantación. |

---

## Consideraciones prácticas

- Cuando se trabaja **sin credenciales**, la información de usuarios y grupos puede estar accesible por medios limitados, pero frecuentemente será incompleta.  
- Desde un host unido al dominio con **acceso válido**, la recolección es mucho más sencilla y suele devolver información mucho más rica y detallada.  
- En la práctica, la enumeración inicial suele repetirse: primero recolectás lo que puedas sin acceso, y una vez obtenido un foothold volvés a realizar la enumeración desde una perspectiva autenticada para obtener datos más completos y precisos.

---

## Artículos relacionados

- BloodHound & SharpHound: Enumerar toda la red AD y mapear relaciones.  
- LSASS Memory Dumping: Para el robo de credenciales de usuarios logueados si tenemos permisos de administrador local.

---
```