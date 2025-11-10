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
# dnsenum

***

## Cheatsheet


| **Comando**                                                                                              | **Descripción**                                                       |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| <pre><code>`dnsenum example.com`</code></pre>                                                            | <br>Enumeración básica con brute force usando la wordlist por defecto |
| <pre><code>`dnsenum --dnsserver 8.8.8.8 --threads 10 --file subdomain-list.txt example.com`</code></pre> | <br>Con una wordlist personalizada y guardando resultados             |
| <pre><code>`dnsenum --axfr --rev example.com`</code></pre>                                               | <br>Intenta AXFR explícitamente y hace reverse lookups                |
^dnsenum-enum

***

## Overview


***

## Notas Relacionadas


***