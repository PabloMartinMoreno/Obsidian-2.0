---
aliases:
  - MDI
  - Microsoft Defender for Identity
  - Azure ATP
  - MDI Sensors
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - Health y Security Auditing]]'
---
# AD - Health & Security Auditing - Microsoft Defender for Identity

***

## Detección desde el lado atacante

| **Técnica que loguea** | **Alerta MDI** | **Bypass / OPSEC** |
|:---:|:---:|:---:|
| DCSync | `Suspected DCSync attack` | Replicar desde DC mismo / pacing. |
| Kerberoast bulk | `Suspected Kerberoasting` | Pedir TGS uno por uno + sleep. |
| AS-REProast bulk | `Suspected AS-REP roasting` | Targeted (no bulk). |
| Golden Ticket (clock skew) | `Suspected Golden Ticket usage (time anomaly)` | Match clock + lifetime real. |
| Golden Ticket (encryption) | `Suspected Golden Ticket (encryption downgrade)` | Forge AES256 no RC4. |
| Skeleton Key | `Suspected skeleton key attack` | No usar. |
| LDAP recon (BloodHound default) | `Suspicious LDAP enumeration` | Stealth flags + `--no-pass`. |
| SAMR enum (net user /domain) | `Account enumeration reconnaissance` | LDAP en vez de SAMR. |
| Honey-token access | `Honeytoken activity` | Identificar honey-tokens primero. |
| Pass-the-Hash | `Suspected identity theft (PTH)` | Match host source. |
| Pass-the-Ticket | `Suspected identity theft (PTT)` | Match host source. |
| Overpass-the-Hash | `Suspected overpass-the-hash` | Match host source. |
| PetitPotam | `Suspected NTLM relay (Exchange/EFSRPC)` | Targeted (no bulk). |
| DCShadow | `Suspected DCShadow attack` | No usar. |
^ad-mdi-detect

___

## Identificar MDI desde el atacante

| **Indicador** | **Cómo verificar** | **Acción** |
|:---:|:---:|:---:|
| MDI Sensor en DC | `Get-Service "AATPSensor"` o `"Azure Advanced Threat Protection Sensor"` | Pacing + stealth. |
| Process en DC | `Microsoft.Tri.Sensor.exe` | Identificar coverage. |
| MDI Standalone | Service en non-DC | Network sensor. |
| Listening port DC | TCP 444 (gMSA) | Confirmar sensor activo. |
| LDAP audit policy | `auditpol /get /subcategory:"Directory Service Access"` | Ver verbosity. |
| Honey-token accounts | `Get-ADUser -LDAPFilter "(description=*honey*)"` | Identificar antes de tocar. |
^ad-mdi-identify

```powershell
# Check rápido DC con MDI
Invoke-Command -ComputerName dc01 -ScriptBlock {
    Get-Service | ? { $_.Name -match 'AATP|Sensor|Tri' }
    Get-Process | ? { $_.Name -match 'Microsoft.Tri.Sensor' }
}
```

___

## Honey-tokens identification

| **Tipo** | **Detección** | **Notas** |
|:---:|:---:|:---:|
| User honey-token | Cuenta nunca logueada + en priv group | `lastLogon = 0` + `adminCount = 1`. |
| Computer honey-token | Computer nunca registrado | Sin `lastLogonTimestamp`. |
| SPN honey-token | SPN en cuenta sin uso | Kerberoast trampa. |
| Description tag | Description con "honey" / "trap" | Defender lazy. |
| Modified by SecOps | `whenCreated` reciente + creador SecOps | Trace creator. |
^ad-mdi-honey

```powershell
# Identificar candidatos a honey-tokens
Get-ADUser -Filter "adminCount -eq 1" -Properties lastLogon,whenCreated,description |
    Where-Object { $_.lastLogon -eq 0 -or $_.lastLogon -eq $null } |
    Select-Object SamAccountName,whenCreated,description
```

___

## MDI desde el lado defensor

| **Acción** | **Cómo** | **Cuándo** |
|:---:|:---:|:---:|
| Portal | `https://security.microsoft.com` → Identities | Triage diario. |
| Alert API | Graph API `/security/alerts_v2` | Automation SOAR. |
| Honey-token deploy | Set description + adminCount | Hardening. |
| Sensor health | Portal → Settings → Sensors | Coverage check. |
| Tune false positives | Portal → Action center | Reducir noise. |
| Action accounts | Service account con priv DC | Remediation actions. |
| Network Name Resolution | DNS reverse lookup | Source IP enrichment. |
| LDAP audit | Subcategory 14080 verbose | Catch bulk LDAP. |
^ad-mdi-defender

___

## OPSEC durante red team

| **Concepto** | **Detalle** |
|:---:|:---:|
| Identificar sensors antes de actuar | Service `AATPSensor` en DCs. |
| Pacing | Sleep entre queries (>5s). |
| LDAP `pageSize` reducido | <100 por página. |
| Targeted en vez de bulk | Por cuenta/grupo específico, no `--all`. |
| Domain User credentials low-priv | Reduce exposure surface. |
| Time-of-day matching | Office hours legitimate. |
| Source host pivot | Workstation usuaria (no Kali externo). |
| Honey-token lookup primero | LDAP filter `adminCount=1 + lastLogon=0`. |
| BloodHound stealth flags | `--stealth --collectionmethod LoggedOn`. |
| No RC4 en Kerberos | AES256 only para Golden/Silver. |
^ad-mdi-opsec

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| MDI docs | `https://learn.microsoft.com/defender-for-identity/` |
| MDI alert reference | `https://learn.microsoft.com/defender-for-identity/alerts-overview` |
| Health alerts | `https://learn.microsoft.com/defender-for-identity/health-alerts` |
| Security Operations Guide | `https://learn.microsoft.com/defender-for-identity/security-operations-guide` |
^ad-mdi-resources

***
