---
aliases:
  - sMSA
  - msDS-ManagedServiceAccount
  - dMSA
  - msDS-DelegatedManagedServiceAccount
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - gMSA Enumeration]]"
---
# AD - gMSA Enumeration - sMSA & dMSA

***

## sMSA (Standalone Managed Service Account)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| sMSA = single-host service account | Pre-gMSA legacy | Server 2008. |
| Class `msDS-ManagedServiceAccount` | LDAP class | Standard. |
| Storage default | `CN=Managed Service Accounts,DC=...` | Standard. |
| Single computer binding | One host per sMSA | Standard. |
| Auto password rotation | 30 days default | Standard. |
| `Install-ADServiceAccount` per host | Per-computer install | Privileged. |
| Discontinued by Microsoft | Replaced by gMSA | Adjacent. |
| Legacy environments still use | Edge | Edge. |
| Schema requires Server 2008+ | Standard | Standard. |
| KDS Root Key NOT required | Different from gMSA | Edge. |
| Per-host attribute | Standard | Standard. |
| `msDS-HostServiceAccount` | Computer using sMSA | Standard. |
| Detection: sMSA discovery | Standard | Standard. |
| Cross-correlate with computer | Standard | Adjacent. |
| Audit: sMSA migration to gMSA | Compliance | Standard. |
| Modern: deprecated | Adjacent | Adjacent. |
^ad-smsa-arch

### sMSA discovery

```powershell
# All sMSAs
Get-ADObject -Filter "ObjectClass -eq 'msDS-ManagedServiceAccount'" -Properties * |
  Select Name,SamAccountName,
    @{n='Host';e={$_.HostComputers -join '; '}},
    Enabled,PasswordLastSet

# Or via Get-ADServiceAccount (returns both sMSA + gMSA)
Get-ADServiceAccount -Filter * -Properties * |
  Where ObjectClass -eq "msDS-ManagedServiceAccount" |
  Select Name,SamAccountName
```

```bash
# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Managed Service Accounts,DC=dom,DC=local" \
  "(objectClass=msDS-ManagedServiceAccount)" \
  cn samAccountName servicePrincipalName msDS-HostServiceAccount
```

___

## sMSA Password Read

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| Single-host bound | Only that computer reads | Standard. |
| Atacante with computer admin → sMSA password | Standard | Standard. |
| `Install-ADServiceAccount` on bound host | Per-computer | Privileged. |
| `Test-ADServiceAccount` | Verify install | Standard. |
| LSASS contains sMSA cred (if running) | Mimikatz dump | Adjacent. |
| Per-host LSASS dump | Adjacent | Adjacent. |
| Computer hash + sMSA bound | Direct relationship | Standard. |
| netexec sMSA support | Limited (gMSA-focused) | Edge. |
| LDAP read password | If authorized (rare) | Edge. |
| msDS-ManagedPassword blob (sMSA) | Edge — different from gMSA | Edge. |
| Modern: sMSA deprecated | Adjacent | Adjacent. |
| Migration gMSA preferred | Best practice | Standard. |
| Detection: sMSA install events | Defender | Adjacent. |
| Audit: sMSA usage | Standard | Standard. |
| Per-host enumeration | `Get-ADServiceAccount` per-host | Edge. |
| Adjacent: dMSA modern replacement | Server 2025 | Modern. |
^ad-smsa-read

### sMSA password access

```powershell
# As admin on host bound to sMSA
Install-ADServiceAccount -Identity sMSA-svc01
Test-ADServiceAccount -Identity sMSA-svc01  # True if can read

# LSASS dump (if sMSA service running)
# mimikatz: sekurlsa::logonpasswords  → may show sMSA cred
```

___

## dMSA (Delegated Managed Service Account, Server 2025)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| dMSA = new in Server 2025 | Modern | Cutting-edge. |
| Class `msDS-DelegatedManagedServiceAccount` | LDAP class | Modern. |
| Replaces sMSA + gMSA hybrid | Modern | Adjacent. |
| Per-computer + group readers | Best of both | Standard. |
| Schema requires Server 2025 | Edge | Edge. |
| KDS Root Key required | Same as gMSA | Standard. |
| Auto-rotation enhanced | Modern | Standard. |
| Better integration with Azure AD Connect | Hybrid | Modern. |
| Detection: dMSA discovery | Modern | Standard. |
| BloodHound dMSA support | Future | Tool. |
| Limited tooling support yet | 2025+ | Edge. |
| Migration sMSA/gMSA → dMSA | Future | Adjacent. |
| Adjacent: Azure AD-joined dMSA | Hybrid | Modern. |
| Compliance: latest standard | Modern | Standard. |
| Audit: dMSA usage early adopters | Edge | Edge. |
| Microsoft documentation evolving | Modern | Adjacent. |
^ad-dmsa-arch

### dMSA discovery (Server 2025+)

```powershell
# Modern Server 2025
Get-ADObject -Filter "ObjectClass -eq 'msDS-DelegatedManagedServiceAccount'" -Properties *

# May not be available pre-2025
# Check schema
Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -like '*delegated-managed-service-account*'"
```

```bash
# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "DC=dom,DC=local" \
  "(objectClass=msDS-DelegatedManagedServiceAccount)" \
  cn samAccountName
```

___

## sMSA vs gMSA vs dMSA Comparison

| **Aspect** | **sMSA** | **gMSA** | **dMSA** |
|:---:|:---:|:---:|:---:|
| Server version | 2008+ | 2012+ | 2025+ |
| Multi-host support | No (single) | Yes | Yes (delegated) |
| KDS Root Key | Not required | Required | Required |
| Auto password rotation | Yes (30d default) | Yes (30d default) | Yes (modern) |
| Cluster scenarios | No | Yes | Yes |
| Cloud integration | Limited | Limited | Modern (Azure AD) |
| ACL granularity | Per-host | Per-principal (group/user/computer) | Hybrid |
| Microsoft direction | Deprecated | Recommended (until 2025) | Modern (2025+) |
| Migration path | sMSA → gMSA | gMSA → dMSA | (current modern) |
| Tool support | Limited | Mature (gMSADumper, etc.) | Emerging |
| BloodHound support | Limited | Yes (modern) | Future |
| Detection support | Standard | Mature | Emerging |
| Compliance | Legacy | Standard | Modern best |
| Adjacent risk | Single-host blast | Multi-host blast | Variable |
| Audit complexity | Low | Medium | High (modern) |
| Atacante interest | Low | High | Emerging |
^ad-msa-comparison

### Multi-MSA enumeration

```powershell
# All MSAs (sMSA + gMSA + dMSA)
Get-ADObject -Filter {
  ObjectClass -eq "msDS-ManagedServiceAccount" -or
  ObjectClass -eq "msDS-GroupManagedServiceAccount" -or
  ObjectClass -eq "msDS-DelegatedManagedServiceAccount"
} -Properties * |
  Select Name,SamAccountName,ObjectClass,DistinguishedName |
  Sort ObjectClass,Name
```

___

## Migration Patterns

| **From** | **To** | **Notas** |
|:---:|:---:|:---:|
| sMSA → gMSA | Server 2012+ | Standard. |
| gMSA → dMSA | Server 2025 | Modern. |
| Direct sMSA → dMSA | Possible | Edge. |
| Coexistence period | Common | Standard. |
| Per-host migration | Standard | Operational. |
| Service stop → uninstall sMSA → install gMSA | Standard | Procedure. |
| Application reconfigure | Required | Operational. |
| Test environment first | Best practice | Standard. |
| Atacante: detect mid-migration | Mixed | Detection. |
| Old sMSA still usable until disabled | Edge | Edge. |
| Detection: MSA type changes | Defender | Adjacent. |
| Audit: migration completion | Compliance | Standard. |
| Stale sMSAs | Cleanup post-migration | Hygiene. |
| Cross-correlate with apps | Per-app | Standard. |
| Documentation: track migration | Operational | Standard. |
| BloodHound mixed-MSA visibility | Modern | Tool. |
^ad-msa-migration

### Mid-migration detection

```powershell
# Find computers with both sMSA + gMSA
$smsaHosts = Get-ADComputer -Filter * -Properties msDS-HostServiceAccount |
  Where {$_.'msDS-HostServiceAccount'} | Select Name,'msDS-HostServiceAccount'

# Find sMSA + gMSA both targeting same hosts
foreach ($host in $smsaHosts) {
  Write-Host "$($host.Name): MSAs = $($host.'msDS-HostServiceAccount' -join '; ')"
}
```

___

## Cross-Correlate with Computer Compromise

| **Pattern** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Compromise host with sMSA → sMSA password | Standard chain | Standard. |
| Compromise host with gMSA in HostComputers → gMSA password | Standard | Standard. |
| LSASS dump on host running MSA service | Mimikatz | Adjacent. |
| Computer admin → SYSTEM → MSA password | Standard | Standard. |
| Cross-correlate priv MSA with compromised host | Strategy | Standard. |
| Privileged MSA service running | High-value target | Standard. |
| BloodHound: Computer→HasSession→User edge for MSA | Modern | Tool. |
| Detection: MSA password access from non-host | Anomaly | Defender. |
| Cross-correlate computer Tier with MSA Tier | Audit | Standard. |
| Tier 0 hosts running gMSA in DA = DCSync chain | Critical | Standard. |
| Stale MSA on decommissioned host | Edge | Edge. |
| MSA migration leftover | Audit | Standard. |
| Per-host MSA install audit | Standard | Standard. |
| Compliance: minimal hosts per MSA | Best practice | Standard. |
| Detection: bulk MSA reads | Defender | Adjacent. |
| OPSEC: per-host targeted | Stealthier | OPSEC. |
^ad-msa-correlate

### Cross-correlate priv MSA + compromised host

```powershell
# Privileged MSAs + their host computers
Get-ADServiceAccount -Filter * -Properties HostComputers,MemberOf |
  Where {
    $_.MemberOf -match "Domain Admins|Enterprise Admins|Backup Operators|Server Operators"
  } |
  Select Name,@{n='Hosts';e={$_.HostComputers -join '; '}},
    @{n='PrivGroups';e={$_.MemberOf -replace 'CN=([^,]+).*','$1' -join '; '}}

# If atacante compromises any of those hosts → priv MSA password access
```

***
