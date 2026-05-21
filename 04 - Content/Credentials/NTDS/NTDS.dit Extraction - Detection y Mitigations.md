---
aliases:
  - NTDS Detection
  - NTDS Mitigations
  - DCSync Detection
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
  - "[[NTDS.dit Extraction]]"
---
# NTDS.dit Extraction - Detection y Mitigations

***

## Detection Events (Windows Logs)

| **Event ID** | **Source** | **Indica** | **Cuándo aparece** |
|:---:|:---:|:---:|:---:|
| `4662` | Security | Object access con replication GUIDs | DCSync via DRSUAPI |
| `4663` | Security | File access en `ntds.dit` path | VSS / direct file copy |
| `7036` | System | VSS service started/stopped | vssadmin / diskshadow / ntdsutil |
| `4673` | Security | Sensitive privilege use (SeBackupPrivilege) | Backup Operators extraction |
| `4656` | Security | Handle request on NTDS file | File-based method init |
| `4698`/`4702` | Security | Scheduled task created/modified | Persistence adjunta |
^ntds-detect-events

```powershell
# Buscar Event 4662 con DCSync GUIDs en DC
$DCsyncGUIDs = @(
    '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2',  # GetChanges
    '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'   # GetChangesAll
)
Get-WinEvent -FilterHashtable @{LogName='Security';Id=4662} |
  Where-Object { $_.Message -match ($DCsyncGUIDs -join '|') } |
  Select-Object TimeCreated, Message | Format-List
```

___

## MDI (Microsoft Defender for Identity) Alerts

| **Alerta MDI** | **Trigger** | **False positive rate** |
|:---:|:---:|:---:|
| "Suspected DCSync attack" | 4662 con GetChangesAll GUID desde non-DC | Bajo |
| "Suspected NTDS.dit file stealing" | ntds.dit file access pattern | Bajo |
| "Remote code execution over DNS" | Adjunto a coercion chains | N/A |
| "Suspicious replication request" | DRSUAPI desde workstation | Bajo |
| "Credential theft tool usage" | Mimikatz / secretsdump signatures | Medio (EDR overlap) |
^ntds-detect-mdi

**MDI detection hardness:** DCSync desde non-DC es casi imposible de evadir si MDI está activo en todos los DCs. VSS method en DC local puede evadir DCSync alert pero genera file access alert.

___

## MDE / Defender for Endpoint

| **Regla / Alert** | **Coverage** | **Evasión posible** |
|:---:|:---:|:---:|
| ASR: block credential stealing from LSASS | LSASS only, no NTDS | N/A |
| "Suspicious use of ntdsutil" | ntdsutil IFM detection | Renombrar binario (parcial) |
| "NTDS.dit exfiltration" | File copy of ntds.dit | Staging en VSS shadow path |
| "Vssadmin create shadow" alert | vssadmin execution | diskshadow como alternativa |
| Custom KQL hunting | DCSync via network | Ver query abajo |
^ntds-detect-mde

```kql
// KQL — Sentinel / MDE Advanced Hunting
// DCSync detection via 4662
SecurityEvent
| where EventID == 4662
| where Properties has "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"  // GetChangesAll
| where SubjectUserName !endswith "$"  // Excluir machine accounts
| project TimeGenerated, SubjectUserName, Computer, Properties
```

___

## Mitigations (Defensa)

| **Control** | **Qué previene** | **Implementación** |
|:---:|:---:|:---:|
| Tiered Admin Model | Admin de Tier 0 solo loguea a DCs | GPO + PAWs |
| Restrict DCSync ACEs | Solo DCs tienen GetChangesAll | Audit + remove non-DC replication rights |
| Protected Users group | Deshabilita NTLM + RC4 para DA cuentas | Add DA accounts to Protected Users |
| LAPS en DCs | Previene lateral con local admin hash | Deploy LAPS para DCs |
| Backup Operators hardening | Limitar quién es Backup Operator | GPO — remove non-essential members |
| MDI deployment | Detecta DCSync y NTDS file access | Sensor en todos los DCs |
| Audit object access en ntds.dit | Log 4663 para ntds.dit | SACL en `C:\Windows\NTDS\ntds.dit` |
^ntds-detect-mitigations

___

## Hardening Checklist

| **Check** | **Comando** | **Estado ideal** |
|:---:|:---:|:---:|
| ¿Quién tiene DCSync ACE? | `(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access \| ? ObjectType -in @('1131f6aa...','1131f6ad...')` | Solo `ENTERPRISE DOMAIN CONTROLLERS` |
| ¿Backup Operators vacío? | `Get-ADGroupMember "Backup Operators"` | Solo cuentas de backup legítimas |
| ¿Protected Users tiene DA? | `Get-ADGroupMember "Protected Users"` | Todos los DA accounts |
| ¿MDI sensor en DCs? | MDI console → Sensors | All DCs: Running |
| ¿LAPS en DCs? | `Get-ADComputer <DC> -Prop ms-Mcs-AdmPwd` | Populated |
| ¿SACL en ntds.dit? | `Get-Acl C:\Windows\NTDS\ntds.dit` | Audit Everyone ReadData |
^ntds-detect-checklist

___

## Bypass Comparison (Red Team)

| **Método** | **Evade MDI DCSync?** | **Evade MDI NTDS?** | **Preferido** |
|:---:|:---:|:---:|:---:|
| DCSync (secretsdump remoto) | No (4662 GUIDs) | N/A | Si no hay MDI |
| VSS + file copy (en DC) | Sí | Parcial (4663) | Si MDI activo, físico DC |
| ntdsutil IFM (en DC) | Sí | Sí (menos signature) | Post-local DA |
| nxc `--ntds vss` | Sí DCSync | Parcial | Alternativa VSS remoto |
| Robocopy /b (Backup Ops) | Sí | Parcial | Backup Operators path |
^ntds-detect-bypass

***
