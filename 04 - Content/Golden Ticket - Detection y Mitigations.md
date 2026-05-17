---
aliases:
  - Golden Ticket Detection
  - Golden Ticket Mitigations
tags:
  - type/concept
  - technique/persistence
  - technique/kerberos
  - env/windows
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Golden Ticket]]'
---

# Golden Ticket - Detection y Mitigations

***

## Detection Events

| **Event ID** | **Source** | **Indica** | **Cuándo** |
|:---:|:---:|:---:|:---:|
| `4769` | Security (DC) | TGS request con TGT anómalo | Uso del golden ticket |
| `4624` | Security (target) | Logon con ticket | Post-PtT del golden |
| `4672` | Security | Privileged logon | DA access via golden |
| `4768` ausente | — | TGT usado sin AS-REQ previo | Ticket inyectado, no solicitado |
^gt-detect-events

**Indicadores específicos de Golden Ticket:**
- EncryptionType `0x17` (RC4) en dominio AES-only
- Ticket lifetime > 10h (policy default)
- Username no existe en AD (`fakeadmin`)
- RID/SID mismatch en PAC vs AD
- TGS request desde IP que nunca solicitó AS-REQ (4768)

___

## MDI Alerts

| **Alerta** | **Trigger** | **False positive** |
|:---:|:---:|:---:|
| "Kerberos Golden Ticket activity" | TGT con PAC inconsistente vs AD | Muy bajo |
| "Suspected forged Kerberos ticket (Golden Ticket)" | Encryption downgrade RC4 en AES-only domain | Bajo |
| "Account attributes changed suspiciously" | SID History modificado | Bajo |
^gt-detect-mdi

**MDI bypass:** Diamond Ticket y Sapphire Ticket tienen PAC legítimo → MDI no puede detectar inconsistencia PAC.

___

## KQL / Sentinel Hunt

| **Hunt** | **Indicador** | **Query** |
|:---:|:---:|:---:|
| RC4 en dominio AES-only | `TicketEncryptionType = 0x17` en 4769 | Ver query abajo |
| Ticket lifetime anómalo | `endtime - starttime > 10h` | Comparar contra policy |
| User sin 4768 correlacionado | 4769 sin 4768 previo del mismo user | Correlación temporal |
^gt-detect-kql

```kql
// Sentinel — Golden Ticket: RC4 TGS en dominio AES-only
SecurityEvent
| where EventID == 4769
| where TicketEncryptionType == "0x17"  // RC4
| where AccountName !endswith "$"
| where ServiceName != "krbtgt"  // Excluir TGT requests normales
| project TimeGenerated, AccountName, IpAddress, ServiceName, TicketEncryptionType
| order by TimeGenerated desc
```

___

## OPSEC Tips (Red Team)

| **Tip** | **Detalle** | **Implementación** |
|:---:|:---:|:---:|
| Usar AES256 > RC4 | Evita downgrade detection en AES-only domains | `-aesKey` / `/aes256:` |
| User real existente | "administrator" no "fakeadmin" | `/user:administrator /id:500` |
| Lifetime realista | 10h end, 7d renew (policy default) | `/endin:600 /renewmax:10080` |
| Groups correctos | DA + DU + EA + Schema + Policy | `/groups:512,513,520,518,519` |
| Purge antes de inject | Evitar ticket collision | `kerberos::purge` / `Rubeus.exe purge` |
| Diamond > Golden si MDI | PAC legítimo — evade PAC validation | `Rubeus.exe diamond /tgtdeleg ...` |
| Sapphire si PAC validation activo | PAC 100% real | `Rubeus.exe sapphire ...` |
^gt-detect-opsec

___

## Invalidación (Blue Team)

| **Acción** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| Reset krbtgt 1ra vez | `New-KrbtgtKeys.ps1` o manual | Invalida tickets activos pero no forjados con hash anterior |
| Esperar replicación | 12h mínimo | Replicación a todos los DCs |
| Reset krbtgt 2da vez | Idem | **Invalida todos los Golden Tickets** |
| Verificar rotación | `Get-ADUser krbtgt -Properties PasswordLastSet` | Confirmar ambos resets |
^gt-detect-invalidate

```powershell
# Double krbtgt reset (Microsoft script)
# https://github.com/microsoft/New-KrbtgtKeys.ps1

.\New-KrbtgtKeys.ps1 -Mode WhatIf        # Preview
.\New-KrbtgtKeys.ps1 -Mode Reset         # 1er reset
# Esperar 12h para replicación completa
.\New-KrbtgtKeys.ps1 -Mode Reset         # 2do reset — invalida Golden Tickets
```

**Key:** Un solo reset NO es suficiente. krbtgt retiene el password anterior (N-1) para compatibilidad de replicación. El segundo reset elimina el N-1.

___

## Hardening Checklist

| **Control** | **Qué previene** | **Implementación** |
|:---:|:---:|:---:|
| MDI en todos los DCs | Detecta Golden Ticket por PAC anomalías | MDI sensor deployment |
| Disable RC4 Kerberos | Fuerza AES — Golden RC4 más detectable | `Network security: Configure encryption types` GPO |
| PAC validation enable | Valida PAC contra KDC | Habilitar en DCs (Windows Server 2019+) |
| Protected Users para DA | Reduce ventana de creden exposición | Add DA to Protected Users |
| Tier 0 isolation | Reduce chance de krbtgt hash exfil | DA solo en Tier 0 hosts |
| krbtgt rotation schedule | Limita validez de tickets históricos | Reset 2x cada 6-12 meses |
| Monitor Event 4769 RC4 | Detection de downgrade | SIEM alert |
^gt-detect-checklist

***
