---
aliases:
  - Enumeración de Usuarios y Grupos (AD)
tags:
  - type/cheatsheet
  - asset/active-directory
  - technique/recon
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Enumeration]]"
type: CheatSheet
linked:
  - "[[BloodHound & SharpHound]]"
  - "[[LSASS]]"
---
# Users & Groups Enumeration (AD)

***

## Cheatsheet

### Sin acceso

| **Comando**                                                                                                                                                                                                                                                      | **Descripción**                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nxc smb <dc> --users`<br><br><br><br>`nxc smb <dc> -u '' -p '' --users`<br><br><br>                                                                                                                                                                             | **(SMB)** Intenta enumerar usuarios vía una sesión NULL de SMB. <br><br><br>Solo funciona si el objetivo permite sesiones NULL de SMB.<br>                                                                                                         |
| `ldapsearch -H ldap://<dc> -x -b "<domain-dn>" -s sub "(&(objectclass=user))" \| grep sAMAccountName: \| cut -f2 -d" "`<br><br>La estructura del Distinguished Name (DN) para el dominio sigue ese formato.<br>`Domain: BRM.COM → DN: DC=BRM,DC=COM`<br><br><br> | **(LDAP)** Intenta enumerar usuarios mediante un bind LDAP anónimo. <br><br><br>Solo funciona si el bind anónimo está habilitado (raro).                                                                                                           |
| `nxc smb <target> -u '' -p '' --rid-brute --rid-brute <max_rid>` (NXC SMB)<br><br>`nxc smb <target> -u 'guest' -p '' --rid-brute --rid-brute <max_rid>` (NXC SMB)<br><br><br>                                                                                    | **(Fuerza Bruta)** Usa RID brute-forcing para enumerar objetos del dominio. <br><br>Por defecto prueba hasta RID 4000; se recomienda usar 8000+ para mejor cobertura.                                                                              |
| `kerbrute userenum -d <domain> --dc <dc> <wordlist> -o <output-file>`<br><br>Copiar la salida a un archivo y luego extraer los usernames.<br>`sed -n 's/.*VALID USERNAME:[[:space:]]*\([^@]*\)@.*/\1/p' output.txt > users.lst`<br><br><br>                      | **(Fuerza Bruta)** Usa Kerbrute y una wordlist para enumerar usernames válidos vía Kerberos pre-autenticación. <br><br>No provoca lockouts.<br><br>Intenta determinar el formato del nombre de usuario y encuentra una lista de palabras adecuada. |
| <br><br>`sudo responder -r -I <network-interface>`                                                                                                                                                                                                               | **(Envenenamiento de Red)** Lanza Responder con ajustes por defecto. <br><br>Intercepta peticiones LLMNR/NBT-NS para capturar usernames y hashes. <br><br>Los usernames deben extraerse manualmente.                                               |
|                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                                                                    |
### Con acceso

````tabs

tab: Linux
| **Comando**                                                                                                                                                                                                                                | **Descripción**                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nxc smb <dc-ip> -u <user> -p <password> --users` (NXC SMB)<br><br>Copiar la salida a un archivo y luego extraer los usuarios con este comando `awk`:<br>`awk '$5 ~ /^[a-zA-Z0-9_]+$/ && NF >= 5 { print $5 }' output.txt > users.lst` | **(SMB)** Recupera la lista de todos los usuarios del dominio.<br><br><br><br>También muestra el conteo de intentos de contraseña fallidos por usuario.                                                                                 |
|                                                                                                                                                                                                                                        |                                                                                                                                                                                                                                         |
| <br>`nxc smb <dc-ip> -u <user> -p <password> --groups` (NXC SMB)                                                                                                                                                                       | **(SMB)** Recupera la lista de todos los grupos del dominio.<br><br>Incluye el conteo de miembros por grupo. Prestar atención especial a grupos clave como: `Administrators`, `Domain Admins`, `Executives`.<br><br>                    |
| <br>`nxc smb <host> -u <user> -p <password> --loggedon-users` (NXC SMB)                                                                                                                                                                | **(SMB)** Lista los usuarios actualmente logueados en el host especificado (requiere permisos de administrador local).<br><br>Esto puede ser una oportunidad valiosa para robar credenciales de Domain Admin en memoria o suplantarlas. |
tab: Windows
| **Comando**                                                                                                                   | **Descripción**                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Get-NetDomain`                                                                                                           | **(POWERVIEW)** Recupera información básica sobre el dominio Active Directory actual.                                                                                                                                                           |
| Toda la información:<br>`Get-NetUser`<br><br>Sólo información crucial:<br>`Get-NetUser \| select cn,pwdlastset,lastlogon` | **(POWERVIEW)** Toda la información: lista todos los usuarios del dominio.<br><br>**(POWERVIEW)** Sólo información crucial: muestra `cn`, `pwdLastSet` y `lastLogon`.                                                                           |
|                                                                                                                           | **(POWERVIEW)** Toda la información: enumera todos los grupos del dominio.                                                                                                                                                                      |
| Toda la información:<br>`Get-NetGroup`<br><br>Sólo información crucial:<br>`Get-NetGroup \| select cn`<br><br>            | <br><br>**(POWERVIEW)** Sólo información crucial: lista el `cn` de los grupos.                                                                                                                                                                  |
| `Get-NetUser -SPN \| select samaccountname,serviceprincipalname`<br><br>                                                  | **(POWERVIEW)** Encuentra cuentas con SPNs — útil para Kerberoasting.                                                                                                                                                                           |
| <br><br>`Get-NetSession -Verbose -ComputerName <cn>`                                                                      | **(POWERVIEW)** Lista sesiones de usuario activas en un equipo remoto (requiere permisos de admin local).<br><br>Esto podría ser una valiosa oportunidad para robar las credenciales de administrador del dominio de la memoria o suplantarlas. |
| Todos los usuarios:<br>`net user /domain`  <br><br>Usuario especifico:<br>`net user <user> /domain`                       | <br><br>**(CMD)** Lists all domain users or detailed info for a specific user.                                                                                                                                                                  |
| Todos los grupos:  <br>`net group /domain`  <br><br>Grupo especifico:  <br>`net group <group> /domain`                    | <br><br>**(CMD)** Lists all domain groups or members of a specified group.                                                                                                                                                                      |
````

---

## Consideraciones prácticas

- Cuando se trabaja **sin credenciales**, la información de usuarios y grupos puede estar accesible por medios limitados, pero frecuentemente será incompleta.  
- Desde un host unido al dominio con **acceso válido**, la recolección es mucho más sencilla y suele devolver información mucho más rica y detallada.  
- En la práctica, la enumeración inicial suele repetirse: primero recolectás lo que puedas sin acceso, y una vez obtenido un foothold volvés a realizar la enumeración desde una perspectiva autenticada para obtener datos más completos y precisos.

---

## Notas relacionadas

- [[BloodHound & SharpHound]]: Enumerar toda la red AD y mapear relaciones.  
- [[LSASS]] Memory Dumping: Para el robo de credenciales de usuarios logueados si tenemos permisos de administrador local.


---
