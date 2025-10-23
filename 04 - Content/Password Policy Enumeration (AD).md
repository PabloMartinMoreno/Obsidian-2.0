---
aliases:
  - Enumeración de políticas de contraseñas (AD)
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
linked: "[[Password Spraying]]"
---
# Enumeración de políticas de contraseñas (AD)

***

## Cheatsheet

````tabs
tab: Authenticated

| **Comando**                                                     | **Descripción**                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `nxc smb <dc> -u <user> -p <password> --pass-pol`           | **(Linux)** Recupera la política de contraseñas desde un Domain Controller usando SMB vía NetExec.                       |
| `Get-DomainPolicy`                                          | **(PowerView)** Recupera la política de contraseñas y la política de Kerberos a nivel de dominio desde Active Directory. |
| `net accounts`                                              | **(CMD)** Muestra políticas locales de contraseñas y bloqueo de cuentas en un host Windows.                              |

tab: SMB NULL Session

| **Comando**                                                               | **Descripción**                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nxc smb <dc> -pass-pol`                                              | **(Linux)** Recupera la política de contraseñas del dominio vía sesión NULL de SMB, si está permitida, usando NetExec.                                                                                                                                                                            |
| `rpcclient -U "" -N <dc>`<br><br>`querydominfo`<br><br>`getdompwinfo` | <br><br> **(Linux)** Utiliza la sesión SMB NULL, si está habilitada, para consultar la información sobre el dominio y la política de contraseñas a través de rpcclient. |


tab: LDAP Anonymous Bind

| **Comando**                                                                                                                                                                                                                     | **Descripción**                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ldapsearch -H ldap://<dc> -x -b "<domain-dn>" -s sub "*" \| grep -m 1 -B 10 pwdHistoryLength`<br><br>La estructura del Distinguished Name (DN) del dominio sigue ese formato.<br>`Domain: BRM.COM → DN: DC=BRM,DC=COM`<br> | <br><br>**(Linux)** Recupera la política de contraseñas del controlador de dominio usando un bind LDAP anónimo, si está permitido; filtra para mostrar la configuración `pwdHistoryLength` y contexto. |

````

---

**Notas**:
- Ambas técnicas (SMB NULL y LDAP anónimo) sólo funcionan si el controlador de dominio permite binds/accs anónimos — cada vez menos común en entornos actualizados.
- Ejecutá estos comandos desde una máquina con visibilidad al DC y respetá las políticas y permisos aplicables.


---
## Overview

Enumerar la política de contraseñas de Active Directory es un paso clave para entender la configuración de seguridad de un dominio y planificar estrategias de ataque como el password spraying.  
Conocer los requisitos de complejidad de contraseñas, los umbrales de bloqueo y las políticas de expiración permite formular intentos que minimicen el riesgo de provocar bloqueos de cuenta y aumenten las probabilidades de éxito.

Si se dispone de credenciales de usuario del dominio, obtener la política de contraseñas es directo. Sin embargo, incluso sin credenciales puede ser posible recuperar esta información mediante configuraciones heredadas como sesiones NULL de SMB o binds LDAP anónimos.  

Las sesiones NULL de SMB permiten a atacantes no autenticados acceder a información sensible del dominio —incluyendo listas de usuarios, grupos, cuentas de equipo y la política de contraseñas— cuando el controlador de dominio mantiene configuraciones inseguras. Estas configuraciones suelen ser resultado de Controladores de Dominio antiguos actualizados sin endurecer adecuadamente las opciones de seguridad.  

Los binds LDAP anónimos ofrecen un acceso similar a datos del dominio usando el protocolo LDAP. Aunque las versiones más recientes de Windows Server restringen el acceso LDAP anónimo, muchos entornos todavía lo permiten, posibilitando la extracción de detalles de la política de contraseñas sin autenticación.

***

## Artículos relacionados

- [[Password Spraying]]: Es crucial conocer la política de contraseñas antes de realizar ataques de password spraying.

---

