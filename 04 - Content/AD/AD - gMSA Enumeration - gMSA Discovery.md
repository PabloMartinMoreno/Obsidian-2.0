---
aliases:
  - gMSA Discovery
  - msDS-GroupManagedServiceAccount
  - KDS Root Key
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[AD - gMSA Enumeration]]"
  - "[[AD - gMSA Enumeration - gMSA Password Dump]]"
---
# AD - gMSA Enumeration - gMSA Discovery

---

## Schema Detection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase (Get-ADRootDSE).SchemaNamingContext -Filter {Name -like "*ms-ds-groupmanagedserviceaccount*"}` | Schema gMSA | Test deployment. |
| `Get-ADObject -SearchBase (Get-ADRootDSE).SchemaNamingContext -Filter {Name -like "msds-managedpassword*"}` | Atributo `msDS-ManagedPassword` (blob) | Schema check. |
| `Get-ADDomain \| Select DomainMode` | DFL — gMSA requiere ≥2012 | Compatibility. |
^ad-gmsa-schema

**Requirements:**
- Domain Functional Level ≥ 2012.
- KDS Root Key creado (10h delay para propagación inicial).
- Schema con `msDS-GroupManagedServiceAccount` class.

---

## gMSA Account Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter * -Properties *` | Todos gMSA + sMSA | Standard. |
| `Get-ADServiceAccount -Filter {ObjectClass -eq "msDS-GroupManagedServiceAccount"}` | Solo gMSA | Filter. |
| `Get-ADObject -Filter {ObjectClass -eq "msDS-GroupManagedServiceAccount"} -Pr *` | Generic AD object query | Sin RSAT-AD specific. |
| `nxc ldap <DC> -u u -p p --gmsa` | Bulk dump (intenta read passwords si autorizado) | Quick. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(objectClass=msDS-GroupManagedServiceAccount)" samAccountName servicePrincipalName memberOf msDS-GroupMSAMembership` | LDAP raw | Linux. |
^ad-gmsa-discovery

```bash
# Quick discovery + dump
nxc ldap <DC> -u user -p pass --gmsa

# Output format:
# Account: SQL_gMSA$        NTLM: aabbccdd...
# Account: WEB_gMSA$        NTLM: 11223344...
```

---

## gMSA Critical Attributes

| **Atributo** | **Significado** | **Importancia** |
|:---:|:---:|:---:|
| `samAccountName` | Nombre con `$` final | Login identifier. |
| `servicePrincipalName` | SPNs (kerberoastable si readable) | Service identity. |
| `userAccountControl` | UAC bits (no `WORKSTATION_TRUST_ACCOUNT`) | Account type. |
| `memberOf` | Group memberships | Privilege check. |
| `msDS-GroupMSAMembership` | Security descriptor — quién puede leer pwd | **CRITICAL** — read access ACL. |
| `msDS-ManagedPassword` | Password blob (binary) | Read = NT hash + Kerberos keys. |
| `msDS-ManagedPasswordId` | KDS key identifier | Crypto reference. |
| `msDS-ManagedPasswordPreviousId` | Previous KDS key | Rotation tracking. |
| `msDS-ManagedPasswordInterval` | Rotation period (días, default 30) | Audit. |
^ad-gmsa-attrs

```powershell
Get-ADServiceAccount -Filter * -Properties * |
  Select Name,SamAccountName,
         @{n='SPNs';e={$_.ServicePrincipalName -join '; '}},
         @{n='Members';e={$_.PrincipalsAllowedToRetrieveManagedPassword -join '; '}},
         ManagedPasswordIntervalInDays,
         @{n='Groups';e={$_.MemberOf -join '; '}}
```

---

## KDS Root Key

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-KdsRootKey` | KDS Root Keys (priv read) | Forensic + GoldenGMSA. |
| `Get-KdsRootKey \| Select KeyId,EffectiveTime,DomainController` | Detail | Audit rotation. |
| `Add-KdsRootKey -EffectiveImmediately` | Crear KDS Root Key (priv) | Setup gMSA. |
| `ldapsearch ... -b "CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,CN=Configuration,DC=corp,DC=local" "(objectClass=msKds-ProvRootKey)" cn msKds-RootKeyData` | KDS via LDAP raw | Linux/forensic. |
^ad-gmsa-kdskey

**Por qué importa:**
- KDS Root Key derives passwords de todos gMSA.
- Atacante con KDS Root Key access (privileged) + `msDS-ManagedPasswordId` puede calcular pwd offline = **GoldenGMSA**.
- Root key rotation: change `KeyId` → todos gMSA pwds derivan del nuevo.

```powershell
# Inventario KDS keys
Get-KdsRootKey | Select KeyId,EffectiveTime,@{n='AgeDays';e={((Get-Date) - $_.EffectiveTime).Days}}
```

---

## Container Storage

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase "CN=Managed Service Accounts,DC=corp,DC=local" -Filter *` | Default container gMSA/sMSA | Standard storage. |
| `ldapsearch ... -b "CN=Managed Service Accounts,DC=corp,DC=local" "(objectClass=msDS-GroupManagedServiceAccount)"` | LDAP raw default container | Linux. |
| `Get-ADServiceAccount -Filter * \| Group { ($_.DistinguishedName -split ',OU=')[1] }` | Custom OUs con gMSAs | Custom locations. |
^ad-gmsa-container

**Default DN:** `CN=Managed Service Accounts,DC=corp,DC=local`. Custom locations = OUs delegadas.

---

## Anonymous Discovery (Limited)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -b "DC=corp,DC=local" "(objectClass=msDS-GroupManagedServiceAccount)"` | Anonymous attempt | Test misconfig. |
| `nxc ldap <DC> -u '' -p '' --gmsa` | Quick anonymous test | Quick. |
^ad-gmsa-anonymous

**Realidad:** anonymous LDAP read sobre gMSAs casi siempre bloqueado. Auth obligatoria.

---

## Forest-Wide gMSA

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-ADForest).Domains \| % { Get-ADServiceAccount -Filter * -Server $_ }` | gMSAs forest-wide | Multi-domain. |
| `ldapsearch -h <DC> -p 3268 -D 'corp\u' -w pass -b "" "(objectClass=msDS-GroupManagedServiceAccount)"` | GC port (forest scope) | Cross-domain LDAP. |
^ad-gmsa-multidomain

```powershell
# Forest gMSA inventory
foreach ($d in (Get-ADForest).Domains) {
  Write-Host "`n=== $d ==="
  Get-ADServiceAccount -Filter * -Server $d -Properties ServicePrincipalName,MemberOf |
    Select Name,SamAccountName,
           @{n='SPNs';e={$_.ServicePrincipalName -join ';'}},
           @{n='Groups';e={$_.MemberOf -join ';'}}
}
```

---
