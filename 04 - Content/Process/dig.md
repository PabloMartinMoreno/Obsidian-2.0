---
aliases:
tags:
  - type/command
primary categories:
secondary categories:
tertiary categories:
type: Command
linked:
---
# Dig

***
<pre><code>``</code></pre>
## Cheatsheet

| **Comando**                                                | **Descripción**                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| <pre><code>`dig $TARGET @<nameserver/IP>`</code></pre>     | <br>Identifica el registro **A** del dominio objetivo.             |
| <pre><code>`dig a $TARGET @<nameserver/IP>`</code></pre>   | <br>Identifica el registro **A** del dominio objetivo.             |
| <pre><code>`dig -x <IP> @<nameserver/IP>`</code></pre>     | <br>Identifica el registro **PTR** de la dirección IP objetivo.    |
| <pre><code>`dig any $TARGET @<nameserver/IP>`</code></pre> | <br>Identifica **todos los registros (ANY)** del dominio objetivo. |
| <pre><code>`dig txt $TARGET @<nameserver/IP>`</code></pre> | <br>Identifica los registros **TXT** del dominio objetivo.         |
| <pre><code>`dig mx $TARGET @<nameserver/IP>`</code></pre>  | <br>Identifica los registros **MX** del dominio objetivo.          |
^dig-enum-pasiva

dig inlanefreight.com
dig +short inlanefreight.com
dig -x 134.209.24.248
dig MX facebook.com

***

## Overview


Envía una **consulta DNS** (query) a un **servidor de nombres** para resolver un dominio.
Ejemplo básico:
```bash
dig example.com
```

**Por defecto usa el DNS configurado en mi sistema** (por ejemplo, 8.8.8.8 de Google o el DNS de mi ISP) y devuelve los registros A (dirección IPv4) del dominio.

También se puede especificar un servidor DNS concreto:
```bash
dig @8.8.8.8 example.com
```

Ahí se le está pidiendo explícitamente a Google que resuelva `example.com`.

### Tipos de información que se puede obtener

* `dig example.com A` → dirección IPv4
* `dig example.com AAAA` → dirección IPv6
* `dig example.com MX` → servidores de correo
* `dig example.com NS` → servidores de nombres
* `dig example.com TXT` → registros de texto (SPF, verificación, etc.)

También se puede ver la **cadena completa de resolución**:
```bash
dig +trace example.com
```

Esto muestra todos los saltos desde los **root servers** hasta los **autoritativos**.


***

## Notas Relacionadas
