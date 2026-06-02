---
aliases:
  - DCSync Misconfigurations
  - Service Account DCSync
  - Authenticated Users DCSync
tags:
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - DCSync Rights Discovery]]"
---
# AD - DCSync Rights Discovery - Common Misconfigs

---

## Authenticated Users / Domain Users

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access \| ? {$_.IdentityReference -match "Authenticated Users\|Domain Users\|Everyone" -and $_.ObjectType -in (DCSync GUIDs)}` | DCSync ACE para wide groups | **CATASTROFIC**. |
^ad-dcsyncmisc-authusers

**Si pega:** cualquier user del domain puede DCSync = full hash dump trivial. Game over instantáneo.

---

## Service Accounts

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access \| ? {$_.IdentityReference -match "(?i)svc\|service" -and $_.ObjectType -in (DCSync GUIDs)}` | Service accounts con DCSync | Audit. |
| Cross-ref con SPN-bound users (kerberoastable) | Kerberoast → DCSync chain | Critical. |
| `Get-ADUser -Filter {ServicePrincipalName -like "*"} \| ? {(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access \| ? IdentityReference -match $_.SamAccountName}` | Kerberoastable + DCSync | Critical. |
^ad-dcsyncmisc-svc

**Common pattern:** backup software, monitoring tools, AD migration agents (ADMT) requieren DCSync. Frecuentemente over-privileged. Audit + scope minimum.

---

## Exchange Legacy (CVE-2019-1040)

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access \| ? IdentityReference -match "Exchange"` | ACEs Exchange-related | Legacy audit. |
| `Get-ADGroupMember "Exchange Trusted Subsystem" -Recursive` | Members del group histórico privilegiado | Cross-ref. |
| `Get-ADGroupMember "Exchange Windows Permissions" -Recursive` | Igual | Cross-ref. |
^ad-dcsyncmisc-exchange

**Status:** patched 2019 con `Exchange Split Permissions Model`. Deploy moderno = sin DCSync directo. Environments unpatched o con custom ACEs siguen vulnerables.

---

## Cross-Trust Foreign Principals

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<domain-root>").Access \| ? IdentityReference -match "ForeignSecurityPrincipals\|<other-domain>"` | Foreign con DCSync | Cross-trust critical. |
| BloodHound `MATCH (u)-[r:GetChanges\|GetChangesAll]->(d:Domain) WHERE u.domain <> d.name RETURN u.name,u.domain,d.name` | Cross-domain DCSync | Visual. |
^ad-dcsyncmisc-crosstrust

**Por qué importa:** atacante con DCSync rights cross-trust + SID Filter OFF = forest takeover via inter-realm TGT forge.

---

## Stale / Disabled Principals

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<domain-root>").Access \| ? IdentityReference -in (Get-ADUser -Filter {Enabled -eq $false}).SamAccountName \| ? ObjectType -in (DCSync GUIDs)` | DCSync ACE de disabled accounts | Cleanup risk (re-enable). |
| Cross-ref con `LastLogonDate -lt 180d` | Stale priv | Audit. |
^ad-dcsyncmisc-stale

---

## Recursive Group Membership

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<domain-root>").Access \| ? ObjectType -in (DCSync GUIDs) \| % { Get-ADGroupMember $_.IdentityReference -Recursive -EA SilentlyContinue }` | Effective members con DCSync (recursive) | Hidden privesc paths. |
| BloodHound `MATCH (u:User)-[:MemberOf*1..]->(g:Group)-[:GetChanges\|GetChangesAll]->(d:Domain) RETURN u.name,g.name` | Recursive DCSync paths | Visual. |
^ad-dcsyncmisc-recursive

**Common pattern:** ACE granted a group → group contiene otros groups → effective members crece con cada nesting. Audit recursive.

---

## AdminSDHolder Modify

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:CN=AdminSDHolder,CN=System,$((Get-ADDomain).DistinguishedName)").Access \| ? {$_.ObjectType -in (DCSync GUIDs) -or $_.ActiveDirectoryRights -match "WriteDacl\|GenericAll"}` | Backdoor en AdminSDHolder | Persistence detection. |
| `Get-ADObject "CN=AdminSDHolder,CN=System,$((Get-ADDomain).DistinguishedName)" -Pr whenChanged` | Last modify | Tampering audit. |
^ad-dcsyncmisc-asdh

**Por qué importa:** ACE en AdminSDHolder se propaga via SDProp cada 60min a todos Tier 0 objects. Backdoor self-restoring incluso si lo limpian del priv group.

---

## Per-Trust Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-ADForest).Domains \| % { Write-Host "=== $_ ==="; (Get-Acl "AD:$((Get-ADDomain $_).DistinguishedName)").Access \| ? ObjectType -in (DCSync GUIDs) }` | Per-domain DCSync ACEs | Forest audit. |
| `Get-ADTrust -Filter * \| % { Get-ADGroupMember "Domain Admins" -Server $_.Target -Recursive -EA SilentlyContinue }` | Cross-trust DA chains | Cross-trust DCSync risk. |
^ad-dcsyncmisc-pertrust

```powershell
# Forest-wide DCSync audit
$DCSync = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
)

foreach ($d in (Get-ADForest).Domains) {
  Write-Host "`n=== $d ==="
  $dn = (Get-ADDomain $d).DistinguishedName
  (Get-Acl "AD:$dn").Access |
    Where { $_.AccessControlType -eq "Allow" -and $_.ObjectType -in $DCSync } |
    Where { $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|Domain Controllers|SYSTEM|BUILTIN" } |
    Select @{n='Domain';e={$d}},IdentityReference,ObjectType
}
```

---
