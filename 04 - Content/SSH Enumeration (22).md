---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# SSH Enumeration (22)

***

## CheatSheet

| **Acción**                                                                    | **Descripción**                                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ssh-audit <target>`                                                          | Realiza una auditoría de seguridad del servicio SSH en el objetivo, detectando vulnerabilidades y configuraciones incorrectas. |
| `ssh <user>@<target>`                                                         | Inicia sesión en el servidor SSH usando el cliente SSH.                                                                        |
| `ssh -i private.key <user>@<target>`                                          | Inicia sesión en el servidor SSH usando una clave privada para autenticación.                                                  |
| `ssh <user>@<target> -o PreferredAuthentications=password`                    | Fuerza la autenticación basada en contraseña, ignorando métodos de clave pública.                                              |
| `cat /etc/ssh/sshd_config \| grep -E 'PermitRootLogin\|PubkeyAuthentication'` | Comprobar si el inicio de sesión como root o la autenticación con clave pública están habilitados en el servidor.              |

---

## Articulos Relacionados

- [[SSH Exploitation (22)]]: Para la explotación de SSH. 

---

## Overview

**Secure Shell (SSH) permite establecer una conexión de shell cifrada entre dos equipos a través de una red insegura.**.
Se utiliza para ejecutar comandos, transferir archivos y habilitar **port forwarding**.

El servicio SSH puede configurarse para permitir o denegar el acceso root, así como habilitar o deshabilitar túneles y reenvío de puertos.  

---

## Versiones del protocolo

- **SSH-1:** Versión original con vulnerabilidades conocidas (ej. ataques Man-in-the-Middle).
- **SSH-2:** Versión moderna y segura, con mejor cifrado, estabilidad y rendimiento.  
    → Actualmente es el estándar recomendado.

**Puerto por defecto:** TCP `22`

---

## Métodos de autenticación (OpenSSH)

1. **Password Authentication:**  
    Requiere cuenta local en el servidor y contraseña válida.
2. **Public-Key Authentication:**  
    El cliente usa su clave privada, el servidor valida con la clave pública.
3. **Host-Based Authentication:**  
    Autenticación basada en el host cliente (útil para automatización).
4. **Keyboard-Interactive Authentication:**  
    Método usado para MFA o desafíos interactivos.
5. **Challenge-Response Authentication:**  
    Usa desafíos dinámicos para evitar ataques de fuerza bruta o replay.
6. **GSSAPI Authentication:**  
    Permite autenticación mediante Kerberos u otros mecanismos SSO.

---

## Consejos

Durante la enumeración:

- Comprobar si el banner de SSH revela la versión (`nmap -sV -p22 <target>`).
- Si se ven versiones antiguas (por ejemplo `OpenSSH 4.x` o `5.x`), pueden existir vulnerabilidades conocidas.
- Buscar configuraciones débiles como `PermitRootLogin yes` o `PasswordAuthentication yes`.

---
