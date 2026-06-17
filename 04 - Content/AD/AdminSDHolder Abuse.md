---
aliases:
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
kind: CheatSheet
linked:
  - "[[AdminSDHolder Abuse - Plantar y Auditar]]"
  - "[[AdminSDHolder Abuse - Abuso del Permiso]]"
  - "[[ACL Abuse]]"
  - "[[DCShadow]]"
---
# AdminSDHolder Abuse

`AdminSDHolder` (en `CN=System`) es el objeto cuyo DACL sirve de **plantilla de permisos** para las cuentas protegidas (Domain Admins, Enterprise Admins, etc.). El proceso **SDProp** del DC copia ese DACL a todos los objetos protegidos **cada ~60 min**, sobrescribiendo cambios. Agregando tu cuenta con `GenericAll` al DACL de AdminSDHolder, SDProp propaga ese control a todo Tier 0 → backdoor **self-healing**.

---

## Cheatsheet

### 1. Plantar y Auditar

````tabs
tab: **Auditar (Recon)**
![[AdminSDHolder Abuse - Plantar y Auditar#^asdh-plant-audit]]

tab: **Plantar Backdoor**
![[AdminSDHolder Abuse - Plantar y Auditar#^asdh-plant-set]]
````

### 2. Abuso del Permiso

````tabs
tab: **Re-escalada**
![[AdminSDHolder Abuse - Abuso del Permiso#^asdh-abuse-use]]
````

---

## Overview

Persistencia **Tier 0 self-healing**: el permiso vive en una plantilla que el propio DC re-aplica cada hora. Aunque el defensor saque a tu cuenta de Domain Admins o limpie las ACLs de los admins, **SDProp lo vuelve a poner** mientras el DACL de AdminSDHolder siga modificado. La limpieza real exige revertir el cambio en **AdminSDHolder mismo** (fácil de pasar por alto).

> [!tip] SDProp
> Default 60 min (`AdminSDProtectFrequency`). Propaga a cualquier objeto con `adminCount=1`.

> [!warning] Requiere DA
> Plantar necesita write sobre AdminSDHolder (= DA). El abuso posterior lo hace la cuenta low-priv. Combinable con [[DCShadow]] para plantarlo sin logs.

---

## Recursos

- [adsecurity.org — AdminSDHolder / SDProp](https://adsecurity.org/?p=1906) — Sean Metcalf.
- [The Hacker Recipes — AdminSDHolder](https://www.thehacker.recipes/ad/persistence/adminsdholder)
