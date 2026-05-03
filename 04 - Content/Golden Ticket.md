---
aliases:
  - Golden Ticket Attack
  - Golden TGT
  - Forged TGT
tags:
  - type/hub
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
type: Hub
linked:
  - "[[Active Directory Explotación 1]]"
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

```tabs
tabs:
  - title: krbtgt hash
    content: "![[Golden Ticket - Prereqs y Recolección#^gt-pre-krbtgt]]"
  - title: AES keys
    content: "![[Golden Ticket - Prereqs y Recolección#^gt-pre-aes]]"
  - title: Domain SID
    content: "![[Golden Ticket - Prereqs y Recolección#^gt-pre-sid]]"
  - title: FQDN
    content: "![[Golden Ticket - Prereqs y Recolección#^gt-pre-fqdn]]"
  - title: Verificar prereqs
    content: "![[Golden Ticket - Prereqs y Recolección#^gt-pre-verify]]"
  - title: OPSEC checklist
    content: "![[Golden Ticket - Prereqs y Recolección#^gt-pre-opsec]]"
```

___

## Forging Linux

```tabs
tabs:
  - title: RC4 básico
    content: "![[Golden Ticket - Forging Linux#^gt-forge-rc4]]"
  - title: AES256 stealth
    content: "![[Golden Ticket - Forging Linux#^gt-forge-aes]]"
  - title: Flags avanzados
    content: "![[Golden Ticket - Forging Linux#^gt-forge-flags]]"
  - title: Cross-domain
    content: "![[Golden Ticket - Forging Linux#^gt-forge-crossdomain]]"
  - title: Verificar
    content: "![[Golden Ticket - Forging Linux#^gt-forge-verify]]"
  - title: Output / conversión
    content: "![[Golden Ticket - Forging Linux#^gt-forge-output]]"
```

___

## Forging Windows

```tabs
tabs:
  - title: Rubeus RC4
    content: "![[Golden Ticket - Forging Windows#^gt-forge-rubeus-rc4]]"
  - title: Rubeus AES256
    content: "![[Golden Ticket - Forging Windows#^gt-forge-rubeus-aes]]"
  - title: Rubeus flags avanzados
    content: "![[Golden Ticket - Forging Windows#^gt-forge-rubeus-flags]]"
  - title: mimikatz
    content: "![[Golden Ticket - Forging Windows#^gt-forge-mimi]]"
  - title: Diamond Ticket
    content: "![[Golden Ticket - Forging Windows#^gt-forge-diamond]]"
  - title: Sapphire Ticket
    content: "![[Golden Ticket - Forging Windows#^gt-forge-sapphire]]"
```

___

## Uso y Lateral Movement

```tabs
tabs:
  - title: Linux — impacket
    content: "![[Golden Ticket - Uso y Lateral Movement#^gt-uso-linux]]"
  - title: Windows — post-inject
    content: "![[Golden Ticket - Uso y Lateral Movement#^gt-uso-windows]]"
  - title: DC específico
    content: "![[Golden Ticket - Uso y Lateral Movement#^gt-uso-dc]]"
  - title: Cross-domain
    content: "![[Golden Ticket - Uso y Lateral Movement#^gt-uso-crossdomain]]"
  - title: Verificar acceso
    content: "![[Golden Ticket - Uso y Lateral Movement#^gt-uso-verify]]"
  - title: Persistencia
    content: "![[Golden Ticket - Uso y Lateral Movement#^gt-uso-persist]]"
```

___

## Detection y Mitigations

```tabs
tabs:
  - title: Events
    content: "![[Golden Ticket - Detection y Mitigations#^gt-detect-events]]"
  - title: MDI Alerts
    content: "![[Golden Ticket - Detection y Mitigations#^gt-detect-mdi]]"
  - title: KQL Hunt
    content: "![[Golden Ticket - Detection y Mitigations#^gt-detect-kql]]"
  - title: OPSEC Tips
    content: "![[Golden Ticket - Detection y Mitigations#^gt-detect-opsec]]"
  - title: Invalidación
    content: "![[Golden Ticket - Detection y Mitigations#^gt-detect-invalidate]]"
  - title: Hardening Checklist
    content: "![[Golden Ticket - Detection y Mitigations#^gt-detect-checklist]]"
```

___

## Tooling

```tabs
tabs:
  - title: impacket-ticketer
    content: "![[Golden Ticket - Tooling#^gt-tool-ticketer]]"
  - title: impacket-lookupsid
    content: "![[Golden Ticket - Tooling#^gt-tool-lookupsid]]"
  - title: Rubeus
    content: "![[Golden Ticket - Tooling#^gt-tool-rubeus]]"
  - title: mimikatz
    content: "![[Golden Ticket - Tooling#^gt-tool-mimi]]"
  - title: New-KrbtgtKeys.ps1
    content: "![[Golden Ticket - Tooling#^gt-tool-krbtgt]]"
  - title: Recursos
    content: "![[Golden Ticket - Tooling#^gt-tool-resources]]"
```

***
