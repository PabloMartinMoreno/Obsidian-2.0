---
aliases:
tags:
kind: Concept
linked:
---
# Generación de Base64 para Windows 

---

Windows PowerShell usa codificación **UTF-16LE**, por lo que un base64 normal de Linux no funcionará. Usa este comando para generar el payload correcto para Windows desde tu Kali:
```Bash
echo -n "whoami" | iconv -f utf-8 -t utf-16le | base64
```
