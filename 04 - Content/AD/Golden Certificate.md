---
aliases:
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
kind: CheatSheet
linked:
  - "[[Golden Certificate - CA Key Theft]]"
  - "[[Golden Certificate - Forge y Auth]]"
  - "[[Golden Certificate - Detección y Mitigación]]"
  - "[[AD CS Abuse]]"
  - "[[UnPAC-the-hash]]"
---
# Golden Certificate

Persistencia de dominio robando la **clave privada de la Enterprise CA** (AD CS). Con la private key + el cert de la CA se pueden **forjar certificados válidos para cualquier identidad** (incluido un DA) de forma offline e ilimitada. Equivale al [[Golden Ticket]] pero en el plano de certificados: mientras no se rote la CA, es llave maestra del dominio (técnica **DPERSIST1** de Certified Pre-Owned).

---

## Cheatsheet

### 1. Robo de la CA Key

````tabs
tab: **Localizar la CA**
![[Golden Certificate - CA Key Theft#^gc-theft-locate]]

tab: **Exportar Private Key**
![[Golden Certificate - CA Key Theft#^gc-theft-export]]
````

### 2. Forge y Autenticación

````tabs
tab: **Forjar el Certificado**
![[Golden Certificate - Forge y Auth#^gc-forge-make]]

tab: **Autenticar (cert → hash)**
![[Golden Certificate - Forge y Auth#^gc-forge-auth]]
````

### 3. Detección y Mitigación

````tabs
tab: **Detección (Blue)**
![[Golden Certificate - Detección y Mitigación#^gc-detect-hunt]]

tab: **Mitigación**
![[Golden Certificate - Detección y Mitigación#^gc-detect-mitigate]]
````

---

## Overview

AD CS confía en cualquier certificado firmado por su CA. Con la **private key de la CA** se pueden firmar certificados arbitrarios sin pasar por el enrollment ni dejar registro de emisión → el DC los acepta para PKINIT/Schannel.

**Por qué es persistencia top:** la única revocación efectiva es **rotar la CA entera**. Sobrevive a reset de passwords, krbtgt, etc.

**Diferencia con [[AD CS Abuse]] (ESCx):** ESC explota *misconfiguraciones* de templates para que la CA te emita un cert. Golden Certificate **roba la CA misma** → no necesita ninguna misconfig, forja todo offline. Requiere **admin local en el CA host**, así que es post-compromiso (persistencia), no escalada.

---

## Recursos

- [SpecterOps — Certified Pre-Owned (DPERSIST1)](https://posts.specterops.io/certified-pre-owned-d95910965cd2)
- [ly4k/Certipy — ca / forge / auth](https://github.com/ly4k/Certipy)
- [GhostPack/ForgeCert](https://github.com/GhostPack/ForgeCert)
