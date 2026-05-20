---
aliases:
  - Domain Root ACL Audit
  - Replication GUID Filter
  - DCSync ACL Discovery
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - DCSync Rights Discovery]]'
---
# AD - DCSync Rights Discovery - ACL Audit on Domain Root

***

## PowerShell DCSync Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:DC=corp,DC=local").Access \| ? ObjectType -in "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2","1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"` | Solo ACEs DCSync | Standard. |
| `(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access \| ? {$_.ActiveDirectoryRights -match "ExtendedRight" -and $_.ObjectType -in (DCSync GUIDs)}` | Filter + decode | Standard. |
| `(Get-ADForest).Domains \| % { (Get-Acl "AD:$((Get-ADDomain $_).DistinguishedName)").Access \| ? ObjectType -in (DCSync GUIDs) }` | Forest-wide | Multi-domain. |
^ad-dcsyncacl-pwsh

```powershell
# Pipeline standard
$DCSync = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",  # GetChanges
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"   # GetChangesAll
)

(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in $DCSync
  } |
  Select IdentityReference,
         @{n='Right';e={
           if ($_.ObjectType -eq "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2") { "GetChanges" }
           else { "GetChangesAll" }
         }}
```

___

## PowerView DCSync ACL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainObjectAcl -Identity "DC=corp,DC=local" -ResolveGUIDs \| ? ObjectAceType -match "Replicating-Directory-Changes"` | DCSync ACEs decoded | Standard. |
| `Get-ObjectAcl -DistinguishedName "DC=corp,DC=local" -ResolveGUIDs \| ? {$_.ObjectAceType -match "Get-Changes"}` | Older PowerView | Adjacent. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? ObjectAceType -match "Replicating-Directory-Changes"` | Bulk hunt | Forest-wide. |
^ad-dcsyncacl-pv

```powershell
Import-Module .\PowerView.ps1

Get-DomainObjectAcl -Identity (Get-ADDomain).DistinguishedName -ResolveGUIDs |
  Where { $_.ObjectAceType -in "Replicating-Directory-Changes","Replicating-Directory-Changes-All" } |
  Select @{n='Right';e={$_.ObjectAceType}},
         @{n='Principal';e={(Convert-SidToName $_.SecurityIdentifier)}},
         AccessControlType
```

___

## Linux DCSync ACL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass get object "DC=corp,DC=local" --resolve-sd \| grep -E "GetChanges\|Replication"` | DACL + filter DCSync | Linux. |
| `dacledit.py corp.local/u:p -dc-ip <DC> -principal <victim-or-self> -target "DC=corp,DC=local" -action read` | DACL Linux | Edge. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" -s base "(objectClass=*)" nTSecurityDescriptor \| python3 sd-parser.py` | Custom raw | DIY. |
^ad-dcsyncacl-linux

```bash
bloodyAD --host <DC> -d corp -u auditor -p 'Pass!' \
  get object "$(echo "DC=corp,DC=local")" --resolve-sd |
  grep -E "GetChanges|Replication"
```

___

## BloodHound DCSync Edges

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[r:GetChanges\|GetChangesAll]->(d:Domain) RETURN u.name,d.name,type(r)` | All DCSync ACEs | Audit. |
| `MATCH (u)-[r1:GetChanges]->(d:Domain) MATCH (u)-[r2:GetChangesAll]->(d) RETURN u.name` | Combo (full DCSync) | Critical. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(d:Domain)) WHERE any(r IN relationships(p) WHERE type(r) IN ["GetChanges","GetChangesAll"]) RETURN p` | Path owned → DCSync | Privesc. |
| `MATCH (u)-[r:GetChanges\|GetChangesAll]->(d) WHERE NOT u.objectid ENDS WITH '-512' AND NOT u.objectid ENDS WITH '-519' RETURN u.name` | Non-default holders | Audit. |
^ad-dcsyncacl-bh

___

## Native dsacls

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dsacls "DC=corp,DC=local"` | DACL native | Sin RSAT. |
| `dsacls "DC=corp,DC=local" \| findstr /i "Replicating Directory Changes"` | Solo DCSync | Quick filter. |
| `dsacls "DC=corp,DC=local" /G "corp\atacante:CA;Replicating Directory Changes"` | Add ACE (priv) | Privesc step. |
| `dsacls "DC=corp,DC=local" /R "corp\atacante"` | Revoke (cleanup) | Post-engagement. |
^ad-dcsyncacl-dsacls

```cmd
:: Quick DCSync ACE check
dsacls "DC=corp,DC=local" | findstr /i "Replicating Directory Changes"
```

___

## Per-Quarter Compliance

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Run `Get-Acl` snapshot cada Q | Baseline | Trimestral. |
| Diff con baseline | Persistence detection | Audit. |
| PingCastle rule `S-DC-DCSync` | Auto detection en quarterly audit | Standard. |
| `Microsoft.LAPS.Cmdlet`-style audit + custom for DCSync | Custom helper | Compliance pack. |
^ad-dcsyncacl-quarterly

```powershell
# Quarterly snapshot + diff
$Q = "2026-Q2"
$Path = "C:\dcsync-audits"
$Snap = "$Path\$Q.csv"

(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access |
  Where {
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
    )
  } |
  Select IdentityReference,ObjectType,ActiveDirectoryRights |
  Export-Csv $Snap -NoTypeInformation

# Diff
$Prev = "$Path\2026-Q1.csv"
Compare-Object (Import-Csv $Prev) (Import-Csv $Snap) -Property IdentityReference,ObjectType |
  Where SideIndicator -eq "=>" |
  Format-Table
```

***
