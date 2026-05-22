---
aliases:
  - "Diamond Ticket"
  - "Sapphire Ticket"
  - "Golden Certificate"
  - Golden Ticket Attack
  - Golden TGT
  - Forged TGT
tags:
  - type/concept
  - technique/persistence
  - technique/credential-access
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
  - "[[DCSync]]"
  - "[[Pass-the-Ticket]]"
  - "[[Rubeus]]"
  - "[[Impacket Toolkit]]"
  - "[[Mimikatz Cheatsheet]]"
  - "[[Golden Ticket - Prereqs y Recolección]]"
  - "[[Golden Ticket - Forging Linux]]"
  - "[[Golden Ticket - Forging Windows]]"
  - "[[Golden Ticket - Uso y Lateral Movement]]"
  - "[[Golden Ticket - Detection y Mitigations]]"
  - "[[Golden Ticket - Tooling]]"
---

# Golden Ticket

Con el NT hash (o AES key) de **krbtgt** se puede forjar un TGT arbitrario. Como krbtgt firma todos los TGTs del dominio, el ticket forjado es aceptado por cualquier servicio Kerberos. Válido hasta doble rotación de krbtgt — persistence indefinida post-DA.

**Requiere**: krbtgt hash (vía [[DCSync]]) + Domain SID + FQDN. No es vector de escalación inicial.

***

## Prereqs y Recolección

````tabs
tab: **krbtgt hash**
![[Golden Ticket - Prereqs y Recolección#^gt-pre-krbtgt]]

tab: **AES keys**
![[Golden Ticket - Prereqs y Recolección#^gt-pre-aes]]

tab: **Domain SID**
![[Golden Ticket - Prereqs y Recolección#^gt-pre-sid]]

tab: **FQDN**
![[Golden Ticket - Prereqs y Recolección#^gt-pre-fqdn]]

tab: **Verificar prereqs**
![[Golden Ticket - Prereqs y Recolección#^gt-pre-verify]]

tab: **OPSEC checklist**
![[Golden Ticket - Prereqs y Recolección#^gt-pre-opsec]]
````

___

## Forging Linux

````tabs
tab: **RC4 básico**
![[Golden Ticket - Forging Linux#^gt-forge-rc4]]

tab: **AES256 stealth**
![[Golden Ticket - Forging Linux#^gt-forge-aes]]

tab: **Flags avanzados**
![[Golden Ticket - Forging Linux#^gt-forge-flags]]

tab: **Cross-domain**
![[Golden Ticket - Forging Linux#^gt-forge-crossdomain]]

tab: **Verificar**
![[Golden Ticket - Forging Linux#^gt-forge-verify]]

tab: **Output / conversión**
![[Golden Ticket - Forging Linux#^gt-forge-output]]
````

___

## Forging Windows

````tabs
tab: **Rubeus RC4**
![[Golden Ticket - Forging Windows#^gt-forge-rubeus-rc4]]

tab: **Rubeus AES256**
![[Golden Ticket - Forging Windows#^gt-forge-rubeus-aes]]

tab: **Rubeus flags avanzados**
![[Golden Ticket - Forging Windows#^gt-forge-rubeus-flags]]

tab: **mimikatz**
![[Golden Ticket - Forging Windows#^gt-forge-mimi]]

tab: **Diamond Ticket**
![[Golden Ticket - Forging Windows#^gt-forge-diamond]]

tab: **Sapphire Ticket**
![[Golden Ticket - Forging Windows#^gt-forge-sapphire]]
````

___

## Uso y Lateral Movement

````tabs
tab: **Linux — impacket**
![[Golden Ticket - Uso y Lateral Movement#^gt-uso-linux]]

tab: **Windows — post-inject**
![[Golden Ticket - Uso y Lateral Movement#^gt-uso-windows]]

tab: **DC específico**
![[Golden Ticket - Uso y Lateral Movement#^gt-uso-dc]]

tab: **Cross-domain**
![[Golden Ticket - Uso y Lateral Movement#^gt-uso-crossdomain]]

tab: **Verificar acceso**
![[Golden Ticket - Uso y Lateral Movement#^gt-uso-verify]]

tab: **Persistencia**
![[Golden Ticket - Uso y Lateral Movement#^gt-uso-persist]]
````

___

## Detection y Mitigations

````tabs
tab: **Events**
![[Golden Ticket - Detection y Mitigations#^gt-detect-events]]

tab: **MDI Alerts**
![[Golden Ticket - Detection y Mitigations#^gt-detect-mdi]]

tab: **KQL Hunt**
![[Golden Ticket - Detection y Mitigations#^gt-detect-kql]]

tab: **OPSEC Tips**
![[Golden Ticket - Detection y Mitigations#^gt-detect-opsec]]

tab: **Invalidación**
![[Golden Ticket - Detection y Mitigations#^gt-detect-invalidate]]

tab: **Hardening Checklist**
![[Golden Ticket - Detection y Mitigations#^gt-detect-checklist]]
````

___

## Tooling

````tabs
tab: **impacket-ticketer**
![[Golden Ticket - Tooling#^gt-tool-ticketer]]

tab: **impacket-lookupsid**
![[Golden Ticket - Tooling#^gt-tool-lookupsid]]

tab: **Rubeus**
![[Golden Ticket - Tooling#^gt-tool-rubeus]]

tab: **mimikatz**
![[Golden Ticket - Tooling#^gt-tool-mimi]]

tab: **New-KrbtgtKeys.ps1**
![[Golden Ticket - Tooling#^gt-tool-krbtgt]]

tab: **Recursos**
![[Golden Ticket - Tooling#^gt-tool-resources]]
````

***
