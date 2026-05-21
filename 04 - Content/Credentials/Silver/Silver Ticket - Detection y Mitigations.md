---
aliases:
  - Silver Ticket Detection
  - Silver Ticket Mitigations
tags:
  - type/concept
  - technique/persistence
  - technique/kerberos
  - env/windows
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Silver Ticket]]"
---

# Silver Ticket - Detection y Mitigations

***

## Detection Events

| **Event ID** | **Source** | **Indica** | **Cuándo** |
|:---:|:---:|:---:|:---:|
| `4624` | Security (target) | Logon Kerberos type 3 | Uso del silver ticket en el host |
| `4672` | Security (target) | Special privileges assigned | Admin via silver |
| `4769` ausente | DC | TGS sin 4769 en DC previo | Ticket inyectado — no pasó por DC |
| `4768` ausente | DC | TGT sin AS-REQ previo | No hubo login normal |
^st-detect-events

**Indicadores específicos de Silver Ticket:**
- `4624` logon type 3 en target **sin correlación 4769 en DC** para ese user
- EncryptionType `0x17` (RC4) en dominio AES-only
- Ticket lifetime fuera de policy normal
- SPN en ticket no corresponde con SPNs registrados en AD
- Username en ticket no existe o RID incorrecto

___

## MDI Alerts

| **Alerta** | **Trigger** | **False positive** |
|:---:|:---:|:---:|
| "Suspected forged Kerberos ticket (Silver Ticket)" | TGS sin TGT previo o PAC inconsistente | Bajo |
| "Encryption downgrade activity" | RC4 en dominio AES-only | Bajo en entornos modernos |
^st-detect-mdi

**Limitación MDI:** Silver Ticket no pasa por DC → MDI no ve el TGS. Solo detecta anomalías cuando analiza tráfico entre target y otros servicios, o via PAC validation.

___

## KQL / Sentinel Hunt

| **Hunt** | **Indicador** | **Query** |
|:---:|:---:|:---:|
| Logon sin TGS request previo | `4624` sin `4769` correlacionado | Temporal join |
| RC4 logon en dominio AES-only | EncryptionType 0x17 en evento destino | Filter en 4624 |
| Logon fuera de horario | `4624` en horario anómalo para el user | Baseline + alert |
^st-detect-kql

```kql
// Sentinel — 4624 Kerberos logon sin 4769 previo en DC (posible silver ticket)
let tgs_requests = SecurityEvent
| where EventID == 4769
| project AccountName, IpAddress, TimeGenerated;
SecurityEvent
| where EventID == 4624
| where LogonType == 3
| where AuthenticationPackageName == "Kerberos"
| join kind=leftanti tgs_requests on AccountName
| project TimeGenerated, AccountName, WorkstationName, IpAddress
| order by TimeGenerated desc
```

___

## OPSEC Tips (Red Team)

| **Tip** | **Detalle** | **Implementación** |
|:---:|:---:|:---:|
| Usar AES256 | Evita RC4 downgrade detection | `-aesKey` / `/aes256:` |
| User real con RID correcto | "administrator" con /id:500 | `/user:administrator /id:500` |
| `/ldap` en Rubeus | PAC consultado de AD — más realista | `Rubeus.exe silver /ldap` |
| Lifetime realista | 10h end, 7d renew | `/endin:600 /renewmax:10080` |
| Purge pre-inject | Evitar ticket collision | `kerberos::purge` / `Rubeus.exe purge` |
| Target host con SPN real | SPN debe existir en AD | Verificar con GetUserSPNs |
^st-detect-opsec

___

## Invalidación (Blue Team)

| **Acción** | **Efecto** | **Cuándo** |
|:---:|:---:|:---:|
| Reset password de computer account | Invalida todos los silver tickets basados en ese computer | Post-incident (host comprometido). |
| Reset password de service account | Invalida silver tickets de ese service | Post-incident (service comprometida). |
| Habilitar PAC validation | KDC valida PAC de TGS — detecta inconsistencias | Proactivo (Windows Server 2019+). |
| Monitorear 4624 sin 4769 correlacionado | Detección de uso de silver tickets | SIEM correlation rule. |
^st-detect-invalidate

___

## Hardening Checklist

| **Control** | **Qué previene** | **Implementación** |
|:---:|:---:|:---:|
| PAC validation enable | KDC revalida PAC en cada TGS use | KB5014754 — habilitar en DCs |
| Disable RC4 Kerberos | Silver RC4 más detectable | GPO `Network security: Configure encryption types` |
| Protected Users para service accounts | NTLM off, RC4 off, TGT lifetime 4h | Add service accounts a Protected Users |
| Rotation frecuente de computer accounts | Limita ventana de uso del hash | gMSA en lugar de computer accounts estáticos |
| MDI en todos los DCs | Detecta uso anómalo de tickets | MDI sensor deployment |
| Correlación SIEM 4624 + 4769 | Detecta silver tickets sin TGS DC-side | Alert rule en SIEM |
^st-detect-checklist

***
