---
aliases:
  - Silver Ticket Attack
  - Forged TGS
tags:
  - technique/persistence
  - technique/lateral-movement
  - technique/kerberos
  - env/windows
  - env/linux
  - asset/active-directory
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: Technique
linked:
  - "[[Active Directory Explotación]]"
  - "[[Golden Ticket]]"
  - "[[Pass-the-Ticket]]"
  - "[[Kerberoasting]]"
  - "[[Rubeus]]"
  - "[[Impacket Toolkit]]"
  - "[[Mimikatz Cheatsheet]]"
  - "[[Silver Ticket - Prereqs y SPNs]]"
  - "[[Silver Ticket - Hash Collection]]"
  - "[[Silver Ticket - Forging Linux]]"
  - "[[Silver Ticket - Forging Windows]]"
  - "[[Silver Ticket - Detection y Mitigations]]"
  - "[[Silver Ticket - Tooling]]"
---

# Silver Ticket

Con NT hash (o AES key) de **service/computer account** se forja un TGS arbitrario para un servicio específico. Target valida con su propia key — **no pasa por el DC**. Menor scope que [[Golden Ticket]] pero menos ruido (sin 4768/4769 en DC).

**Requiere**: hash del service/computer account + Domain SID + SPN del servicio + FQDN target.

***

## Prereqs y SPNs

````tabs
tab: **Domain SID**
![[Silver Ticket - Prereqs y SPNs#^st-pre-sid]]

tab: **SPN discovery**
![[Silver Ticket - Prereqs y SPNs#^st-pre-spns]]

tab: **FQDN target**
![[Silver Ticket - Prereqs y SPNs#^st-pre-fqdn]]

tab: **Test hash**
![[Silver Ticket - Prereqs y SPNs#^st-pre-test]]

tab: **Verify SPN existe**
![[Silver Ticket - Prereqs y SPNs#^st-pre-verify]]

tab: **OPSEC pre-attack**
![[Silver Ticket - Prereqs y SPNs#^st-pre-opsec]]
````

___

## Hash Collection

````tabs
tab: **Kerberoast → crack**
![[Silver Ticket - Hash Collection#^st-hash-kerberoast]]

tab: **DCSync (computer/service)**
![[Silver Ticket - Hash Collection#^st-hash-dcsync]]

tab: **LSASS dump**
![[Silver Ticket - Hash Collection#^st-hash-lsass]]

tab: **LSA Secrets**
![[Silver Ticket - Hash Collection#^st-hash-lsa]]

tab: **Verify hash**
![[Silver Ticket - Hash Collection#^st-hash-verify]]
````

___

## Forging Linux

````tabs
tab: **RC4 básico**
![[Silver Ticket - Forging Linux#^st-forge-linux-rc4]]

tab: **AES256 OPSEC**
![[Silver Ticket - Forging Linux#^st-forge-linux-aes]]

tab: **Flags avanzados**
![[Silver Ticket - Forging Linux#^st-forge-linux-flags]]

tab: **DCSync via silver (LDAP)**
![[Silver Ticket - Forging Linux#^st-forge-linux-dcsync]]

tab: **Verify y usar**
![[Silver Ticket - Forging Linux#^st-forge-linux-verify]]
````

___

## Forging Windows

````tabs
tab: **Rubeus RC4**
![[Silver Ticket - Forging Windows#^st-forge-win-rc4]]

tab: **Rubeus AES256**
![[Silver Ticket - Forging Windows#^st-forge-win-aes]]

tab: **Rubeus flags avanzados**
![[Silver Ticket - Forging Windows#^st-forge-win-flags]]

tab: **mimikatz**
![[Silver Ticket - Forging Windows#^st-forge-win-mimi]]

tab: **DCSync via silver (LDAP)**
![[Silver Ticket - Forging Windows#^st-forge-win-dcsync]]
````

___

## Detection y Mitigations

````tabs
tab: **Events**
![[Silver Ticket - Detection y Mitigations#^st-detect-events]]

tab: **MDI Alerts**
![[Silver Ticket - Detection y Mitigations#^st-detect-mdi]]

tab: **KQL Hunt**
![[Silver Ticket - Detection y Mitigations#^st-detect-kql]]

tab: **OPSEC Tips**
![[Silver Ticket - Detection y Mitigations#^st-detect-opsec]]

tab: **Invalidación**
![[Silver Ticket - Detection y Mitigations#^st-detect-invalidate]]

tab: **Hardening Checklist**
![[Silver Ticket - Detection y Mitigations#^st-detect-checklist]]
````

___

## Tooling

````tabs
tab: **impacket-ticketer**
![[Silver Ticket - Tooling#^st-tool-ticketer]]

tab: **impacket-GetUserSPNs**
![[Silver Ticket - Tooling#^st-tool-getuserspns]]

tab: **Rubeus**
![[Silver Ticket - Tooling#^st-tool-rubeus]]

tab: **mimikatz**
![[Silver Ticket - Tooling#^st-tool-mimi]]

tab: **Uso post-silver**
![[Silver Ticket - Tooling#^st-tool-uso]]

tab: **Recursos**
![[Silver Ticket - Tooling#^st-tool-resources]]
````

***
