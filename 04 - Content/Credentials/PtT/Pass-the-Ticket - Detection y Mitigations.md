---
aliases:
  - PtT Detection
  - Kerberos ticket detection
tags:
  - technique/lateral-movement
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Pass-the-Ticket]]"
---
# Pass-the-Ticket - Detection y Mitigations

---

## Detection Events (Windows Logs)

| **Event ID** | **Source** | **Indica** | **Cuándo** |
|:---:|:---:|:---:|:---:|
| `4769` | Security | TGS request (Kerberos Service Ticket) | Anomalous source IP / user para ese service |
| `4768` | Security | TGT request (AS-REQ) | Ausente si ticket inyectado (no solicitó TGT) |
| `4624 (Type 9)` | Security | Logon explicit credentials | Rubeus asktgt (OverPass-the-Hash) |
| `4624 (Type 3)` sin `4768` | Security | Kerberos network logon sin TGT request | Ticket inyectado de otra sesión |
| `4672` | Security | Special privileges (desde ticket) | Post-inject acceso con DA privileges |
| Sysmon `Event 10` | Sysmon | LSASS access | Rubeus / mimikatz dump previo al inject |
^ptt-detect-events

```powershell
# Hunt: 4769 sin 4768 correlacionado (ticket inyectado)
Get-WinEvent -FilterHashtable @{LogName='Security';Id=4769} |
  Where-Object { $_.Message -match "EncryptionType.*0x17" } |  # RC4 — sospechoso si AES domain
  Select-Object TimeCreated, Message | Format-List
```

---

## MDI (Microsoft Defender for Identity) Alerts

| **Alerta** | **Trigger** | **False positive** |
|:---:|:---:|:---:|
| "Pass-the-Ticket attack" | TGS/TGT usado desde IP diferente a donde se solicitó | Bajo |
| "Suspicious Kerberos ticket usage" | Ticket con anomalías en flags/lifetime | Bajo |
| "Account enumeration via Kerberos" | AS-REQ masivo (adjacent) | Medio |
| "Overpass-the-Hash attack" | RC4 AS-REQ en dominio AES-only | Bajo |
| "Suspected Kerberos service ticket forgery" | Golden/Silver ticket pattern | Muy bajo |
^ptt-detect-mdi

**Key:** MDI correlaciona IP origen del ticket vs IP donde se usó — core detection logic.

---

## Anomaly Indicators (manual hunt)

| **Indicador** | **Qué significa** | **KQL / Query** |
|:---:|:---:|:---:|
| TGS request desde IP ≠ donde se obtuvo TGT | Ticket inyectado cross-host | Correlate 4768 source con 4769 source |
| EncryptionType `0x17` (RC4) en dominio AES-only | OverPass-the-Hash con NT hash | `Event 4769 TicketEncryptionType = 0x17` |
| Ticket lifetime anómalo (muy largo o ≠ policy) | Forged ticket (Golden/Silver) | Compare `4769 TicketOptions` con baseline |
| Account logon sin sesión interactiva previa | Lateral con inyected ticket | 4624 sin 4647 previo |
| `krbtgt` TGS request desde workstation | Golden Ticket creation step | 4769 con ServiceName = krbtgt |
^ptt-detect-anomaly

```kql
// KQL — Sentinel: RC4 TGS requests (OverPass-the-Hash indicator)
SecurityEvent
| where EventID == 4769
| where TicketEncryptionType == "0x17"
| where AccountName !endswith "$"
| project TimeGenerated, AccountName, IpAddress, ServiceName
```

---

## Protected Users Group

| **Protección** | **Detalle** | **Impact en PtT** |
|:---:|:---:|:---:|
| NTLM disabled | Sin NTLM auth para estos accounts | OverPass-the-Hash RC4 falla — no puede solicitar TGT con RC4 |
| RC4 encryption disabled | Solo AES128/AES256 | Tickets de Protected Users usan solo AES |
| TGT lifetime = 4 horas | Corta ventana de uso | Ticket robado expira más rápido |
| No credential caching | Sin mscash | Pass-the-Cache en offline hosts falla |
| No delegation | Tickets no delegables | getST / S4U falla con estos accounts |
^ptt-detect-protected

```powershell
# Agregar DA accounts a Protected Users
Add-ADGroupMember -Identity "Protected Users" -Members "DomainAdmin1","DomainAdmin2"

# Verificar miembros
Get-ADGroupMember "Protected Users"
```

---

## Credential Guard (VBS)

| **Protección** | **Detalle** | **Impact en PtT** |
|:---:|:---:|:---:|
| VSM-isolated LSASS | `LsaIso.exe` en Virtual Secure Mode | Tickets no extractables desde LSASS memory |
| Rubeus dump bloqueado | No puede leer tickets desde VSM-LSASS | `Rubeus.exe dump` falla |
| mimikatz sekurlsa bloqueado | Mismo motivo — LSASS aislado | `sekurlsa::tickets` falla |
| ccache files en disco (Linux) | Credential Guard es solo Windows | ccache theft en Linux no afectado |
^ptt-detect-credguard

```powershell
# Verificar si Credential Guard activo
Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard |
  Select-Object -ExpandProperty SecurityServicesRunning
# 1 = Credential Guard running
```

---

## Hardening Checklist

| **Control** | **Qué previene** | **Implementación** |
|:---:|:---:|:---:|
| Protected Users para DA | RC4 PtT + NTLM + long tickets | Add DA to Protected Users group |
| Credential Guard en PAWs | LSASS memory ticket theft | UEFI + Hyper-V + GPO |
| Tiered admin model | DA tickets no expuestos en Tier 1/2 | Tier 0 isolation — no DA interactive on workstations |
| Monitor Event 4769 RC4 | OverPass-the-Hash detection | SIEM rule + MDI |
| Disable RC4 encryption (KerberosArmoring) | Fuerza AES-only | `Network security: Configure encryption types allowed for Kerberos` GPO |
| MDI deployment en todos los DCs | Detecta cross-IP ticket usage | MDI sensors |
| Short ticket lifetime policy | Limita ventana de abuso | Default 10h TGT — reducir a 4h via GPO |
^ptt-detect-checklist

---
