---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/services
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[Spidering SMB Shares]]"
  - "[[Interacting from Windows]]"
  - "[[RpcClient]]"
---
# Enumeración SMB (139, 445)


---

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`nxc smb <target> -u '' -p '' --shares`|Inicio de sesión anónimo en SMB, lista los recursos compartidos disponibles.|
|`nxc smb <target> -u 'guest' -p '' --shares`|Inicio de sesión como **guest** en SMB, lista los recursos compartidos disponibles.|
|`nxc smb <target> -u 'anonymous' -p '' --shares`|Inicio de sesión anónimo con el usuario **'anonymous'** en SMB, lista los recursos compartidos disponibles.|
|`nxc smb <target> -u <user> -p '<password>' --shares`|Inicio de sesión con usuario y contraseña especificados, lista los recursos compartidos disponibles.|
|`smbclient -L <target>`|Lista los recursos compartidos SMB sin autenticación.|
|`smbclient -L <target> -U '' -p ''`|Lista los recursos compartidos SMB con autenticación anónima.|
|`smbclient -L <target> -U '<user>' -p '<password>'`|Lista los recursos compartidos SMB con autenticación de usuario normal.|
|`smbclient -N //<target>/<share>`|Se conecta a un recurso compartido SMB específico con autenticación anónima.|
|`smbclient -U <user> //<target>/<share>`|Se conecta a un recurso compartido SMB específico con autenticación de usuario. (Puede aparecer el prompt de contraseña)|
|`sudo mount //<target>/<share> <local-dir> -o`|Monta un recurso compartido SMB en un directorio local para acceder a archivos. Útil para archivos grandes.|
|`sudo mount //<target>/<share> <local-dir> -o username=<username>,password=<password>`|Monta un recurso compartido SMB con autenticación de usuario. Ideal para acceso a archivos grandes.|
|`sudo umount <local-dir>`|Desmonta el recurso compartido SMB del directorio local. Puede generar un **seg fault**, pero no es un problema.|

---

**Nota: **Si se esta experimentando *timeouts* al descargar archivos grandes, probar *montar el recurso compartido SMB*.

**Nota:** En un entorno de **Active Directory**, incluí el flag `-d <domain>`.

---

## Artículos Relacionados

- [[Spidering SMB Shares]]: Uso de **NetExec** para buscar archivos en recursos compartidos.
- [[Interacting from Windows]]: Uso de **PowerShell** y **CMD** para interactuar con recursos SMB.
- [[RpcClient]]: Uso de la herramienta CLI **RpcClient** para enumeración.

---

## Overview

***Server Message Block (SMB)** es un protocolo de red que permite el **intercambio de archivos e impresoras**, así como la comunicación entre dispositivos en una red local.*

Aunque SMB se usa principalmente en entornos **Microsoft Windows**, también es compatible con **Linux** y **macOS**, lo que lo hace **multiplataforma**.

El propósito principal de SMB es facilitar el **uso compartido de archivos, impresoras y otros recursos** a través de una red, permitiendo a los usuarios acceder e interactuar con los datos y dispositivos compartidos de forma fluida.

Un servidor SMB puede compartir partes arbitrarias de su sistema de archivos local como **shares**, aplicando control de acceso mediante **Access Control Lists (ACLs)**.

SMB utiliza **NetBIOS**, aunque son protocolos distintos. **NetBIOS** es un servicio de capa de sesión para la comunicación en redes locales. Si bien las versiones modernas de SMB pueden funcionar sin él, **NetBIOS over TCP (NBT)** suele estar habilitado por compatibilidad con versiones anteriores.

Los puertos predeterminados para SMB son:
- **139 (NetBIOS)**
- **445 (Direct SMB)**

---

## Autenticación

La **autenticación SMB** ocurre durante el establecimiento de la conexión, cuando el cliente y el servidor negocian el dialecto del protocolo.  
El cliente demuestra su identidad mediante **mecanismos de desafío-respuesta**, como **NTLM** o **Kerberos**, durante la configuración de la sesión.

Si la autenticación es exitosa, el usuario obtiene acceso a los recursos compartidos basándose en sus credenciales.

*SMB puede configurarse para permitir **sesiones nulas (null sessions)**, es decir, sin autenticación.* Sin embargo, esto puede **exponer datos sensibles**, incluyendo credenciales, y ser vulnerable a **exploits** como **EternalBlue**, especialmente en versiones obsoletas de SMB.

---

**#porhacer:** Hacer una nota sobre **EternalBlue** y vincularla.