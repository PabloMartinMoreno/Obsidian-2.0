---
aliases:
tags:
  - technique/recon/active
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[curl]]"
---
# Curl - Enumeración Pasiva de Sub-Dominios

---

## Cheatsheet

| **Acción**                                                                                                                                                                                                     | **Descripción**                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| <pre><code>`curl -s https://crt.sh/\?q\=<target>\&output\=json \| jq .`</code></pre>                                                                                                                           | Obtiene los registros de transparencia de certificados para un dominio desde Crt.sh.      |
| <pre><code>`curl -s https://crt.sh/\?q\=<target>\&output\=json \| jq . \| grep name \| cut -d":" -f2 \| grep -v "CN=" \| cut -d'"' -f2 \| awk '{gsub(/\\n/,"\n");}1;' \| sort -u > subdomain.lst`</code></pre> | <br>Extrae subdominios únicos de los registros de Crt.sh y los guarda en `subdomain.lst`. |
^curl-enum-pasiva-subdominios

