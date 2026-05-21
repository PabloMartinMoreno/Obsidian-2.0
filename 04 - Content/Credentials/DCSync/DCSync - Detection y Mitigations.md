---
aliases:
  - DCSync Detection
  - DCSync Mitigations
  - 4662 DCSync
tags:
  - type/concept
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[DCSync]]"
---
# DCSync - Detection y Mitigations

***

## Detection Events

| **Event ID** | **Source** | **Indica** | **Cuándo** |
|:---:|:---:|:---:|:---:|
| `4662` | Security (DC) | Object access con replication GUIDs | DCSync request — DRSUAPI call |
| `5136` | Security (DC) | DS object attribute modification | DACL change en domain root (grant DCSync) |
| `4624` | Security | Logon del user que inició el sync | Remote auth pre-DCSync |
| `4776` | Security | NTLM auth (si PtH usado) | PtH-based DCSync |
^dcsync-detect-events

```powershell
# Hunt Event 4662 con DCSync GUIDs
$guids = @(
    '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2',  # GetChanges
    '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'   # GetChangesAll
)
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4662} |
  Where-Object { $_.Message -match ($guids -join '|') } |
  Where-Object { $_.Message -notmatch 'NT AUTHORITY\\SYSTEM' } |
  Select-Object TimeCreated, Message | Format-List
```

___

## MDI Alerts

| **Alerta** | **Trigger** | **False positive** |
|:---:|:---:|:---:|
| "Suspected DCSync attack" | 4662 GetChangesAll desde non-DC IP | Bajo — `MSOL_*` accounts son FP conocido |
| "Remote code execution attempt" | Adjunto si usaste psexec previamente | N/A |
| "Sensitive account membership changed" | DA added / DACL modified | Bajo |
^dcsync-detect-mdi

**MDI FP notable:** `MSOL_*` y `AAD_*` accounts de Azure AD Connect realizan DCSync legítimamente → excluded normalmente en MDI. Si comprometés esa cuenta, el DCSync parece legítimo para MDI.

___

## KQL / Sentinel Hunt

| **Query** | **Detecta** | **Cuándo** |
|:---:|:---:|:---:|
| Event 4662 + GetChangesAll GUID + non-DC subject | DCSync activo | SIEM hunt. |
| Event 5136 + domain root DN + DACL property | Grant DCSync via DACL | Hunt proactivo. |
^dcsync-detect-kql

```kql
// Sentinel — DCSync detection
SecurityEvent
| where EventID == 4662
| where ObjectType == "domainDNS"
| where Properties has "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"  // GetChangesAll
| where SubjectUserName !endswith "$"  // Excluir computer accounts (DCs legítimos)
| where SubjectUserName !startswith "MSOL_"  // Excluir Azure AD Connect
| project TimeGenerated, SubjectUserName, SubjectDomainName, Computer, IpAddress
| order by TimeGenerated desc
```

___

## Mitigations

| **Control** | **Qué previene** | **Implementación** |
|:---:|:---:|:---:|
| Tiered Admin Model | DA no loguea en Tier 1/2 — hash nunca en workstations | GPO + PAWs |
| Auditar DCSync ACEs regularmente | Detectar cuentas con GetChangesAll no-DC | PowerView / script mensual |
| Protected Users para DA | NTLM PtH disabled — bloquea PtH-based DCSync | Add DA to Protected Users |
| MDI en todos los DCs | Detecta DCSync desde non-DC | MDI sensor deployment |
| Restrict WriteDACL en domain root | Previene grant DCSync via DACL | ACL audit + remove non-admin write |
| krbtgt password reset x2 | Invalida Golden Tickets post-incident | Rotation cada 6 meses + post-breach |
^dcsync-detect-mitigations

___

## Hardening Checklist

| **Check** | **Comando** | **Estado ideal** |
|:---:|:---:|:---:|
| ¿Quién tiene GetChangesAll? | `Get-ObjectAcl -DN "DC=corp,DC=local" -ResolveGUIDs \| ? ObjectAceType -match "GetChangesAll"` | Solo `ENTERPRISE DOMAIN CONTROLLERS` + legit service accounts |
| ¿MSOL/AAD accounts necesarias? | Revisar uso de Azure AD Connect | Documentar y excluir de alert |
| ¿MDI activo en todos DCs? | MDI console → Sensors | All DCs: Running |
| ¿krbtgt password age? | `Get-ADUser krbtgt -Properties PasswordLastSet` | < 180 días |
| ¿DA en Protected Users? | `Get-ADGroupMember "Protected Users"` | Todos los DA |
^dcsync-detect-checklist

___

## Bypass Notes (Red Team)

| **Técnica** | **Evade MDI DCSync alert?** | **Nota** |
|:---:|:---:|:---:|
| DCSync desde MSOL_* comprometida | Sí (FP exclusion) | Requiere comprometer AAD sync account |
| ntdsutil IFM en DC local | Sí | RCE en DC requerido, diferente alert |
| VSS + ntds.dit copy en DC | Sí | RCE en DC requerido |
| DCSync targeted (solo krbtgt) | Parcial — menos logs | < ruido que full dump |
| DCSync desde DC comprometido (self-sync) | Potencial blind-spot | On-DC execution |
^dcsync-detect-bypass

***
