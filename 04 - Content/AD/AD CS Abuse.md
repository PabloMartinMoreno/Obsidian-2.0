---
aliases:
  - "Certificados (PKINIT)"
  - "Cracking .PFX File"
  - "Reading .PFX File"
  - Active Directory Certificate Services Abuse
  - ADCS Abuse
  - ESC1-ESC15
tags:
  - technique/privilege-escalation
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - service/ad-cs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[AD CS Abuse - Descubrimiento]]"
  - "[[AD CS Abuse - Template ESCs]]"
  - "[[AD CS Abuse - CA y Relay ESCs]]"
  - "[[AD CS Abuse - Mapping ESCs]]"
  - "[[AD CS Abuse - Tooling]]"
  - "[[Certifried (CVE-2022-26923)]]"
  - "[[Shadow Credentials]]"
  - "[[UnPAC-the-hash]]"
---
# AD CS Abuse

Abuso de **Active Directory Certificate Services**. Plantillas o CAs mal configuradas permiten que un usuario común obtenga un certificado que **autentica como cualquier identidad** (incluido un DA), o que la CA emita certs bajo coerción/relay. Las misconfiguraciones se catalogan como **ESC1-ESC15**. El cert obtenido se convierte en TGT + NT hash vía [[UnPAC-the-hash]].

---

## Cheatsheet

### 1. Descubrimiento

````tabs
tab: **Enum CAs y Templates**
![[AD CS Abuse - Descubrimiento#^adcs-disco]]
````

### 2. Template ESCs (ESC1-4)

````tabs
tab: **ESC1 — SAN + Client Auth**
![[AD CS Abuse - Template ESCs#^adcs-esc1]]

tab: **ESC2 — Any Purpose**
![[AD CS Abuse - Template ESCs#^adcs-esc2]]

tab: **ESC3 — Enrollment Agent**
![[AD CS Abuse - Template ESCs#^adcs-esc3]]

tab: **ESC4 — WriteProperty**
![[AD CS Abuse - Template ESCs#^adcs-esc4]]
````

### 3. CA y Relay ESCs (ESC6-8, 11)

````tabs
tab: **ESC6 — SAN flag en CA**
![[AD CS Abuse - CA y Relay ESCs#^adcs-esc6]]

tab: **ESC7 — ManageCA**
![[AD CS Abuse - CA y Relay ESCs#^adcs-esc7]]

tab: **ESC8 — Web Enrollment Relay**
![[AD CS Abuse - CA y Relay ESCs#^adcs-esc8]]

tab: **ESC11 — RPC Relay**
![[AD CS Abuse - CA y Relay ESCs#^adcs-esc11]]
````

### 4. Mapping ESCs (ESC9-15)

````tabs
tab: **ESC9/10 — UPN Spoofing**
![[AD CS Abuse - Mapping ESCs#^adcs-esc9-10]]

tab: **ESC13 — Policy OID → Group**
![[AD CS Abuse - Mapping ESCs#^adcs-esc13]]

tab: **ESC15 — v1 Template (EKUwu)**
![[AD CS Abuse - Mapping ESCs#^adcs-esc15]]
````

### 5. Tooling

````tabs
tab: **Herramientas**
![[AD CS Abuse - Tooling#^adcs-tooling]]
````

---

## Overview

| ESC | Misconfig | Impacto |
|:---:|:---|:---|
| **ESC1** | SAN + Client Auth + enroll | Cert como cualquier user |
| **ESC2** | Any Purpose EKU | Cert arbitrario |
| **ESC3** | Enrollment Agent | Cert on-behalf-of |
| **ESC4** | WriteProperty sobre template | Convertir en ESC1 |
| **ESC5** | Control sobre objeto PKI/CA | Compromiso ADCS completo |
| **ESC6** | `EDITF_ATTRIBUTESUBJECTALTNAME2` | SAN injection en cualquier template |
| **ESC7** | `ManageCA`/`ManageCertificates` | Aprobar requests, habilitar templates |
| **ESC8** | Web enrollment sin signing | Relay NTLM → cert DA |
| **ESC9/10** | Mapeo débil (no SID) | Cert con UPN de otro user |
| **ESC11** | RPC sin encryption | Relay a RPC CA |
| **ESC13** | Policy OID → AD group | Cert otorga membership |
| **ESC15** | v1 template + Client Auth (EKUwu) | SAN injection (CVE-2024-49019) |

**Flujo general:** `certipy find -vulnerable` → identificar el ESC → pedir el cert (`certipy req`) → autenticar (`certipy auth`) → TGT + NT hash → DCSync / PtH. ESC8/11 usan relay+coerción en vez de enroll directo.

> [!tip] Relacionadas
> Machine account → cert de DA sin template vulnerable: [[Certifried (CVE-2022-26923)]]. Robo de la CA key para forjar offline: [[Golden Certificate]].

---

## Recursos

- [SpecterOps — Certified Pre-Owned](https://specterops.io/wp-content/uploads/sites/3/2022/06/Certified_Pre-Owned.pdf) — paper original (ESC1-8).
- [ly4k/Certipy](https://github.com/ly4k/Certipy) — herramienta + wiki (ESC9-15).
- [The Hacker Recipes — AD CS](https://www.thehacker.recipes/ad/movement/ad-cs)
