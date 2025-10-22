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
---
# Enumeración NFS (111, 2049)

***

## Cheatsheet

| **Acción**                                                                                                                 | **Descripción**                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `sudo nmap --script nfs* -sV -p111,2049 -v <target>`<br><br>                                                               | Identifica/huella NFS con Nmap.                                                                                            |
| `showmount -e <target>`<br><br>                                                                                            | Muestra los recursos compartidos NFS disponibles.<br>                                                                      |
| ****Esto no puede hacerse mediante proxychains.****<br>`sudo mount -t nfs <target>:/<share> <local-dir> -o nolock`<br><br> | <br>Monta el recurso compartido NFS específico en un directorio del sistema de archivos local.                             |
| `mount \| grep nfs`                                                                                                        | Después del montaje, obtenga la configuración para compartir.<br><br>                                                      |
| `sudo umount <local-dir>`                                                                                                  | Desmonta el recurso compartido NFS específico del sistema de archivos local.                                               |
| <br>`lsof \| grep '<target-NFS>'`                                                                                          | Si no se puede desmontar porque el destino está ocupado, busque el PID de los procesos que utilizan el recurso compartido. |
| `kill -9 <PID>`                                                                                                            | Mata los procesos para permitir el desmontaje.                                                                             |
**Nota:** Si un recurso compartido NFS no es accesible, se puede eludir la configuración de ACL.****  

## Overview

**NFS (Network File System) es un protocolo que permite el acceso remoto a sistemas de archivos a través de una red, haciendo que parezcan locales.**

Se utiliza comúnmente en entornos basados en Unix, a diferencia de la [[SMB Enumeration (139, 445)]], que se usa principalmente en Windows.

**NFS carece de autenticación o autorización integradas, dependiendo de las opciones del protocolo RPC para la seguridad.** La autenticación se basa en las asignaciones UID/GID, que, si están mal configuradas, pueden provocar accesos no autorizados.

Los puertos predeterminados para NFS son **TCP 2049 (NFS)** y **111 (RPC)**.