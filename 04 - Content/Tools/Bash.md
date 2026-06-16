---
aliases:
tags:
  - env/linux
  - tool/bash
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
---
# Bash

---

## Cheatsheet

### Enumeración Pasiva de Sub-Dominios

| <pre><code>`for i in $(cat subdomain.lst); do host $i \| grep "has address" \| grep <domain> \| cut -d" " -f4 >> ip-addresses.txt; done`</code></pre> | <br>Resuelve las direcciones IP de los subdominios descubiertos y las guarda en `ip-addresses.txt`.   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| <pre><code>`for i in $(cat ip-addresses.txt); do shodan host $i; done`</code></pre>                                                                   | <br>Escanea cada dirección IP resuelta usando Shodan en busca de puertos abiertos o vulnerabilidades. |
^bash-enum-pasiva-subdominios


---


## Overview


## Notas Relacionadas