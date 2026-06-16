---
aliases:
tags:
  - env/linux
  - technique/recon/active
  - asset/dns
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
kind: Tool
linked:
---
# host

---

## Cheatsheet

| **Comando**                                                                    | **Descripción**                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| <pre><code>`host <domain> <optional-nameserver>`</code></pre>                  | <br>Recupera todos los tipos de registros<br>                             |
| <pre><code>`host -t <record-type> <domain> <optional-nameserver>`</code></pre> | <br>Consulta un tipo de registro específico (por ejemplo, A, TXT, NS, MX) |
| <pre><code>`host -l <domain> <nameserver>`</code></pre>                        | <br>Intenta una transferencia de zona                                     |
| <pre><code>`host -v ...`</code></pre>                                          | <br>Resultados más fáciles de entender para los humanos                   |
^host-enum

---

## Overview


---

## Notas Relacionadas


---
