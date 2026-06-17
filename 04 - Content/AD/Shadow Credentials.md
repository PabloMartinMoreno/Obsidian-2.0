---
aliases:
  - msDS-KeyCredentialLink Abuse
  - Shadow Creds
  - KeyCredentialLink Attack
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
  - "[[Shadow Credentials - Discovery y Certipy]]"
  - "[[Shadow Credentials - Whisker y Relay]]"
  - "[[AD CS Abuse]]"
  - "[[UnPAC-the-hash]]"
  - "[[Certipy]]"
---
# Shadow Credentials

`msDS-KeyCredentialLink` es un atributo (Windows Hello for Business) que contiene public keys para autenticación **PKINIT**. Con `GenericWrite`/`GenericAll`/`AddKeyCredentialLink` sobre un target, el atacante agrega su propia public key → autentica vía PKINIT con su private key → recibe **TGT + NT hash del target**. Sin cambiar el password (reversible, sigiloso).

---

## Cheatsheet

### 1. Discovery y Certipy

````tabs
tab: **Identificar Target (BloodHound)**
![[Shadow Credentials - Discovery y Certipy#^shadowcred-discovery]]

tab: **Certipy (Linux)**
![[Shadow Credentials - Discovery y Certipy#^shadowcred-certipy]]
````

### 2. Whisker y Relay

````tabs
tab: **Whisker (Windows)**
![[Shadow Credentials - Whisker y Relay#^shadowcred-whisker]]

tab: **Vía NTLM Relay**
![[Shadow Credentials - Whisker y Relay#^shadowcred-relay]]
````

---

## Overview

**Requisitos:** AD CS con CA online + template de client auth (default en dominios con AD CS); `GenericWrite`/`GenericAll`/`WriteProperty` sobre `msDS-KeyCredentialLink` del target; functional level ≥ 2016; conectividad LDAP+Kerberos al DC.

**Ventaja sobre `ForceChangePassword`:** no cambia el password (no rompe servicios), es **reversible** (quitás el KCL), y más silencioso.

| Primitiva | Target | Resultado |
|:---|:---|:---|
| `AddKeyCredentialLink` sobre user | Shadow cred user | NT hash del user |
| `GenericWrite` sobre computer | Shadow cred computer | NT hash + TGT → lateral |
| `GenericAll` sobre `DC$` | Shadow cred DC | Hash del DC → DCSync |

> [!tip] Puente cert → hash
> El NT hash sale del PAC del TGT obtenido por PKINIT ([[UnPAC-the-hash]]), ya integrado en `certipy auth` y `Rubeus /getcredentials`.

## Detección y Mitigación

- Auditar cambios sobre `msDS-KeyCredentialLink` (SACL → evento `5136`).
- PKINIT auth (`4768` con "Certificate Information") desde host que no usa smartcards = anómalo.
- Restringir quién escribe el atributo; evitar abuso en cuentas con audit estricto (DA/DCs).

---

## Recursos

- [Elad Shamir — Shadow Credentials paper](https://posts.specterops.io/shadow-credentials-abusing-key-trust-account-mapping-for-takeover-8ee1a53566ec)
- [Certipy Wiki — Shadow Credentials](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Shadow-Credentials)
- [Whisker](https://github.com/eladshamir/Whisker)
