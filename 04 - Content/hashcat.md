---
aliases:
  - Hashcat
tags:
  - type/tool
  - technique/credential-access
  - tool/hashcat
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
type: CheatSheet
linked:
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[Responder]]"
  - "[[JWT Attacks]]"
---
# hashcat

***

## Cheatsheet
^hashcat-cheatsheet

| Hash | `-m` modo | Ejemplo |
| --- | --- | --- |
| **MD5** | 0 | `5f4dcc3b5aa765d61d8327deb882cf99` |
| **SHA1** | 100 | `5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8` |
| **SHA256** | 1400 | `5e884898...` |
| **SHA512** | 1700 | | 
| **bcrypt** | 3200 | `$2a$10$...` |
| **MD5 Unix ($1$)** | 500 | `$1$salt$hash` |
| **SHA-256 Unix ($5$)** | 7400 | `$5$salt$hash` |
| **SHA-512 Unix ($6$)** | 1800 | `$6$salt$hash` |
| **NTLM** | 1000 | `aad3b435...:abc123...` (NT part) |
| **LM** | 3000 | Legacy, parsed separately |
| **NetNTLMv1** | 5500 | `user::dom:abc:def:12345...` |
| **NetNTLMv2** (Responder) | 5600 | `user::dom:abc:def...` |
| **Kerberos 5 TGS-REP (Kerberoast)** | 13100 | `$krb5tgs$23$*user$dom$...` |
| **Kerberos 5 TGS-REP AES256** | 19700 | `$krb5tgs$18$...` |
| **Kerberos 5 AS-REP (etype 23)** | 18200 | `$krb5asrep$23$user@dom...` |
| **JWT HS256** | 16500 | `eyJhbG...token` |
| **WPA-EAPOL-PBKDF2 (old handshake)** | 2500 | `.cap/.hccapx` |
| **WPA-EAPOL-PBKDF2 (22000)** | 22000 | `.hc22000` modern |
| **Office 2013-2019** | 9600 | Office 2007: 9400 / 2010: 9500 |
| **PDF 1.7 Level 8 (AES256)** | 10500 | 10400/10500 varieties |
| **ZIP (7z)** | 11600 | |
| **KeePass 1/2** | 13400 | |
| **NTDS (ntds.dit NT hash)** | 1000 | Mismo que NTLM |
| **MSSQL (2012+)** | 1731 | |
| **MySQL (4.1/5+)** | 300 | |
| **Cisco-IOS SHA256** | 5700 | `$4$...` |
| **Cisco-IOS PBKDF2** | 9200 | `$8$...` |
| **Cisco-IOS scrypt** | 9300 | `$9$...` |

Listar todos: `hashcat --example-hashes | less` o https://hashcat.net/wiki/doku.php?id=example_hashes

***

## Modos de ataque (`-a`)

| `-a` | Modo | Descripción |
| --- | --- | --- |
| **0** | Straight | Diccionario + rules opcionales |
| **1** | Combinator | dict1 + dict2 concatenados |
| **3** | Brute-force | Mask `?a?a?a?a` |
| **6** | Hybrid Wordlist + Mask | `word?d?d` |
| **7** | Hybrid Mask + Wordlist | `?d?dword` |
| **9** | Association | Un hash por línea con hint |

## Charsets para mask

| | Charset |
| --- | --- |
| `?l` | `abcdefghijklmnopqrstuvwxyz` |
| `?u` | `ABCDEFGHIJKLMNOPQRSTUVWXYZ` |
| `?d` | `0123456789` |
| `?h` | `0123456789abcdef` |
| `?H` | `0123456789ABCDEF` |
| `?s` | `!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ ` |
| `?a` | `?l?u?d?s` |
| `?b` | `0x00 - 0xff` (raw byte) |

Custom charset:
```bash
-1 ?l?u?d   # charset 1 = lowercase+upper+digits
hashcat -m 0 -a 3 hash.txt "?1?1?1?1?1?1?1?1"
```

## Comandos típicos

```bash
# Straight dict
hashcat -m 1000 hashes.txt /usr/share/wordlists/rockyou.txt

# Con rules
hashcat -m 1000 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule
hashcat -m 1000 hashes.txt rockyou.txt -r d3ad0ne.rule
hashcat -m 1000 hashes.txt rockyou.txt -r OneRuleToRuleThemAll.rule

# Brute 1-8 chars lowercase
hashcat -m 0 -a 3 hash.txt "?l?l?l?l?l?l?l?l" -i  # incremento

# Hybrid: word + 3 digits
hashcat -m 0 -a 6 hash.txt rockyou.txt ?d?d?d

# Mask attack pattern típico
hashcat -m 0 -a 3 hash.txt "?u?l?l?l?l?l?l?d?d"   # Abcdefg12

# GPU status / benchmark
hashcat -I                # Info cards
hashcat -b                # Benchmark
hashcat -b -m 1000        # Solo NTLM

# Restore session
hashcat --session=krb --restore

# Optimizado (limited pass length)
hashcat -m 1000 hashes.txt rockyou.txt -O    # -O: optimized kernel, max len 31

# Workload (calor/laptop)
-w 1  # Low (default)
-w 2  # Default
-w 3  # High
-w 4  # Nightmare

# Output
--outfile=cracked.txt --outfile-format=2   # hash:plain
--show                                      # Solo mostrar ya cracked
--left                                      # Solo left uncracked
--potfile-path=custom.pot
--status --status-timer=30                 # Status regular
```

## Rules

Rules transforman palabras de diccionario: `password` → `P@ssw0rd!`, `Password1`, etc.

Built-in en `/usr/share/hashcat/rules/`:
- `best64.rule` — 64 rules comunes (rápido).
- `d3ad0ne.rule` — 34k rules.
- `dive.rule` — 99k rules (lento).
- `rockyou-30000.rule` — top 30k derivado de rockyou.

External popular:
- `OneRuleToRuleThemAll.rule` (NotSoSecure).
- `rockyou-improved`.

### Sintaxis rule (operaciones sobre candidate)
```
c          # Capitalize
u          # Uppercase
l          # Lowercase
r          # Reverse
T3         # Toggle case en pos 3
$1 $2 $3   # Append "123"
^!         # Prepend "!"
se3        # Replace 'e' → '3'
p          # Duplicate (passpass)
d          # Reverse + append (password → passworddrowssap)
$\n1       # Append newline+1
```

Ejemplo: `c $1 $!` sobre `password` → `Password1!`.

### Aplicar múltiples rule files
```bash
hashcat -m 1000 h.txt dict.txt -r r1.rule -r r2.rule   # Combinadas
```

## Wordlists

```bash
# Ubicaciones típicas
/usr/share/wordlists/rockyou.txt          # 14M entries
/usr/share/seclists/Passwords/             # SecLists
/usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000000.txt

# Generar custom con CeWL (scrape web)
cewl -d 2 -m 5 http://target > custom.txt

# Generar con crunch (pattern)
crunch 8 8 abcdefgh -t "pass@@@@"

# Derivar con rules + save
hashcat -m 0 -a 0 /dev/null rockyou.txt -r best64.rule --stdout > candidates.txt
```

## Workflows comunes

### Kerberoasting (modo 13100)
```bash
impacket-GetUserSPNs dom.local/user:pass -request -outputfile tgs.txt
hashcat -m 13100 tgs.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule -O
```

### AS-REP Roasting (modo 18200)
```bash
impacket-GetNPUsers dom.local/ -dc-ip DC -usersfile users.txt -format hashcat -outputfile asrep.txt -no-pass
hashcat -m 18200 asrep.txt rockyou.txt
```

### NetNTLMv2 from Responder (modo 5600)
```bash
cat /usr/share/responder/logs/SMB-NTLMv2-SSP-*.txt > hashes.txt
hashcat -m 5600 hashes.txt rockyou.txt -r OneRuleToRuleThemAll.rule
```

### NTDS dump (modo 1000)
```bash
# Desde secretsdump output: user:RID:LM:NT:::
awk -F: '{print $4}' ntds.txt > nt_hashes.txt
hashcat -m 1000 nt_hashes.txt rockyou.txt -r d3ad0ne.rule

# Show user → password mapping
hashcat -m 1000 nt_hashes.txt --show --username
# usando archivo con formato user:hash
```

### JWT HS256 (modo 16500)
```bash
echo "eyJhbGciOiJIUzI1NiIs..." > jwt.txt
hashcat -m 16500 jwt.txt rockyou.txt
```

### WPA handshake
```bash
# Convert con hcxpcapngtool (modern)
hcxpcapngtool -o handshake.hc22000 capture.pcap
hashcat -m 22000 handshake.hc22000 rockyou.txt

# Masks típicas WPA (8-16 chars min)
hashcat -m 22000 -a 3 handshake.hc22000 "?d?d?d?d?d?d?d?d"  # 8 dígitos
```

### Office / PDF / ZIP
```bash
# Office
office2john.py doc.docx > hash.txt
hashcat -m 9600 hash.txt rockyou.txt

# PDF
pdf2john.py doc.pdf > hash.txt
hashcat -m 10500 hash.txt rockyou.txt

# ZIP
zip2john.py file.zip > hash.txt
hashcat -m 13600 hash.txt rockyou.txt

# 7z
7z2john.pl file.7z > hash.txt
hashcat -m 11600 hash.txt rockyou.txt
```

## Performance

### Optimizations
- **`-O`** optimized kernel (max password len 31) — 2-3x speedup donde aplica.
- **`-w 3`** workload profile alto (no usar en laptop con batería).
- **`--force`** ignora warnings de driver (requerido en docker/VM sometimes).
- Usar GPU dedicada — CPU cracking 100-1000x más lento.

### Check GPU
```bash
hashcat -I
# Device #1: NVIDIA GeForce RTX 4090 → OK
# Device #2: Intel UHD → muy lento, disable
hashcat -d 1 ...   # Usar solo device 1
```

### Benchmarks típicos (RTX 4090, aprox H/s)
- NTLM: ~300 GH/s
- NetNTLMv2: ~10 GH/s
- WPA2: ~2 MH/s
- bcrypt cost 5: ~75 KH/s
- Kerberos 5 TGS (13100): ~10 GH/s

## Tips

- **Potfile** (`~/.hashcat/hashcat.potfile`): cracked hashes persisten entre runs. `--show` lee de ahí.
- **`--username`** cuando hash tiene formato `user:hash` — muestra user con crack.
- **`--quiet`** minimiza output.
- **Session restore** si crash: `--session=name` + `--restore`.
- **No usar `-a 3` puro** para passwords >8 chars — masks inteligentes + rules siempre mejor.
- **Fingerprint hash** ambiguo: `hash-identifier`, `hashid`, o `name-that-hash`:
  ```bash
  hashid '$krb5asrep$23$user...'
  nth -t '$2a$10$...'
  ```

## Recursos

- [Hashcat Wiki](https://hashcat.net/wiki/)
- [Example hashes](https://hashcat.net/wiki/doku.php?id=example_hashes)
- [OneRuleToRuleThemAll](https://github.com/NotSoSecure/password_cracking_rules)
- [SecLists - Passwords](https://github.com/danielmiessler/SecLists/tree/master/Passwords)

***
