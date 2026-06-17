---
aliases:
  - Secure Shell
tags:
  - env/linux
  - asset/network
  - proto/ssh
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
kind: Concept
linked:
  - "[[ssh]]"
  - "[[Pivoting & Port Forwarding]]"
---
# SSH (Protocolo)

> [!info] Overview
> **SSH** (Secure Shell): protocolo de acceso remoto sobre un canal **cifrado**. Reemplazo seguro de Telnet/rlogin. Puerto **22/TCP** por defecto. Modelo cliente-servidor: el demonio **`sshd`** escucha; el cliente [[ssh]] conecta. Soporta shell remota, transferencia de archivos (scp/sftp) y **túneles** (port forwarding).

---

## Autenticación

| **Método** | **Cómo funciona** | **Relevancia pentest** |
|---|---|---|
| **Password** | Usuario + contraseña | Brute force / spraying si está habilitado |
| **Clave pública** | Par `id_rsa` (privada) / `id_rsa.pub` (pública); la pública va en `~/.ssh/authorized_keys` del server | **Robo de clave privada** = acceso sin password (cred reuse) |
| **Host-based** | Confianza entre máquinas | Menos común |

> La clave privada (`id_rsa`) **sin passphrase** es acceso directo. `chmod 600 id_rsa` es obligatorio o el cliente la rechaza.

---

## Host Keys (identidad del servidor)

El server presenta su **host key**; el cliente la guarda en `~/.ssh/known_hosts`. Si cambia → warning de posible **MITM**. Protege contra suplantación del servidor.

---

## Archivos Clave

| **Archivo** | **Qué es** |
|---|---|
| `~/.ssh/id_rsa` / `id_rsa.pub` | Clave privada / pública del usuario |
| `~/.ssh/authorized_keys` | Claves públicas autorizadas a entrar (en el **server**) |
| `~/.ssh/known_hosts` | Host keys de servers ya vistos |
| `~/.ssh/config` | Atajos de conexión (Host, User, Port, IdentityFile) |
| `/etc/ssh/sshd_config` | Config del demonio (PermitRootLogin, PasswordAuthentication, Port...) |

---

## Herramientas del Ecosistema

| **Comando** | **Para qué** |
|---|---|
| [[ssh]] | Cliente: shell remota + túneles (`-L`/`-R`) |
| `scp` / `sftp` | Transferencia de archivos sobre SSH |
| `ssh-keygen` | Generar par de claves |
| `ssh-copy-id` | Instalar tu clave pública en `authorized_keys` del server |

---

## Ángulos de Pentest

- **Cred theft:** `find / -name id_rsa 2>/dev/null` → reuso de claves robadas.
- **Brute force:** si `PasswordAuthentication yes` (hydra, ncrack).
- **Misconfig:** `PermitRootLogin yes`, claves sin passphrase, `authorized_keys` escribible.
- **Pivoting:** túneles `-L`/`-R` → [[Pivoting & Port Forwarding]].

## Relacionadas

- [[ssh]] — el comando cliente
- [[Pivoting & Port Forwarding]]
