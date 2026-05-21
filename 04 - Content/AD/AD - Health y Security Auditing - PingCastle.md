---
aliases:
  - PingCastle
  - PingCastle Healthcheck
  - PingCastle Audit
  - PingCastle Modes
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - Health y Security Auditing]]'
---
# AD - Health & Security Auditing - PingCastle

***

## Healthcheck completo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `PingCastle.exe --healthcheck --server dc.dom.local` | `ad_hc_<dom>.html` + `.xml` con score 0-100 | Auditoría inicial. |
| `PingCastle.exe --healthcheck --server DC --no-enum-limit` | Sin truncar listas largas (>100 entries) | Forest grande. |
| `PingCastle.exe --healthcheck --server DC --user u --password p` | Auth explícita (no current user) | Cuenta dedicada de auditoría. |
| `PingCastle.exe --healthcheck --explore-trust` | Recorre trusts y audita cada uno | Forest multi-domain. |
| `PingCastle.exe --healthcheck --level Full` | Verbose máximo | Debug del propio PingCastle. |
| `PingCastle.exe --healthcheck --xmls-directory C:\reports` | XMLs a directorio custom | Pipeline CI/CD. |
| `PingCastle.exe --healthcheck --no-enum-limit --reachable` | Solo DCs alcanzables (skip down) | Multi-DC con caídos. |
^ad-pingcastle-healthcheck

```cmd
:: Audit estándar — 95% de los casos
PingCastle.exe --healthcheck --server dc01.corp.local --no-enum-limit

:: Output:
::   ad_hc_corp.local.xml   (datos crudos para parseo)
::   ad_hc_corp.local.html  (reporte visual con score)
```

___

## Carto (trust topology)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `PingCastle.exe --carto` | Mapa visual del forest | Discovery inicial multi-domain. |
| `PingCastle.exe --carto --server DC` | Carto desde DC específico | DC con visibilidad cross-trust. |
| `PingCastle.exe --carto --explore-trust` | Sigue trusts transitivos | Forest con trusts externos. |
| `PingCastle.exe --carto --no-enum-limit` | Sin truncar trusts | >100 trusts. |
^ad-pingcastle-carto

```cmd
:: Mapa completo del forest
PingCastle.exe --carto --server dc01.corp.local --explore-trust

:: Output: ad_carto_<forest>.html
```

___

## Scanners específicos

| **Comando** | **Qué chequea** | **Cuándo** |
|:---:|:---:|:---:|
| `PingCastle.exe --scanner zerologon --server DC` | CVE-2020-1472 vulnerable | Pre-Aug-2020 patches. |
| `PingCastle.exe --scanner null_session --server DC` | Null bind LDAP/SMB | Legacy DCs / pre-Win2003. |
| `PingCastle.exe --scanner share --server DC` | Open shares anónimos | Recon shares públicos. |
| `PingCastle.exe --scanner smb_v1 --server DC` | SMBv1 habilitado | Hosts legacy. |
| `PingCastle.exe --scanner printerbug --server DC` | MS-RPRN coercion | Pre-PetitPotam patches. |
| `PingCastle.exe --scanner petitpotam --server DC` | MS-EFSR coercion (CVE-2021-36942) | Pre-Aug-2021 patches. |
| `PingCastle.exe --scanner spooler --server DC` | Spooler RPC activo | Print Nightmare-adjacent. |
| `PingCastle.exe --scanner laps_bitlocker --server DC` | LAPS deployed + BitLocker keys | Audit LAPS coverage. |
| `PingCastle.exe --scanner localadmin --server DC` | Local admins por host | Lateral movement surface. |
| `PingCastle.exe --scanner foreignusers --server DC` | Cuentas foreign en priv groups | Cross-trust surface. |
^ad-pingcastle-scanners

```cmd
:: Scan masivo de coercion (PetitPotam + PrinterBug + DFS)
PingCastle.exe --scanner coercion --server dc01.corp.local

:: Scan con lista de hosts
PingCastle.exe --scanner null_session --scmode-file hosts.txt
```

___

## Hallazgos críticos a buscar

| **Hallazgo** | **Severidad** | **Acción inmediata** |
|:---:|:---:|:---:|
| `krbtgt password >180 days` | High | `Reset-KrbTgt` 2× con 24h gap. |
| `GPP cpassword found` | Critical | Borrar GPO + rotar passwords expuestos. |
| `Reversible encryption` | High | Quitar flag + force password change. |
| `Anonymous SAMR enabled` | High | Disable anonymous LDAP/SAMR. |
| `Authenticated Users with priv ACE` | Critical | Limpiar ACL del objeto. |
| `Unconstrained delegation non-DC` | High | Migrar a Constrained o RBCD. |
| `EDITF_ATTRIBUTESUBJECTALTNAME2` | Critical | Disable flag (ESC6). |
| `ADCS template ESC1` | Critical | Disable `ENROLLEE_SUPPLIES_SUBJECT`. |
| `LAPS not deployed` | Medium | Deploy LAPSv2. |
| `Pre-Win2000 group populated` | Low | Vaciar grupo. |
| `Cross-trust SID Filtering off` | High | `netdom trust /quarantine:yes`. |
| `Schema Admins not empty` | Low | Vaciar fuera de cambios de schema. |
^ad-pingcastle-findings

___

## Consolidación + trends

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `PingCastle.exe --conso` | Consolida XMLs del directorio actual | Comparar Q1 vs Q2. |
| `PingCastle.exe --conso --xmls-directory C:\reports\2026` | Conso de directorio custom | Per-año. |
| `PingCastle.exe --regen-report ad_hc_<dom>.xml` | Regenera HTML desde XML viejo | Rebuild reporte. |
| `PingCastle.exe --hcrules` | Lista todas las reglas con descripción | Lookup de regla específica. |
^ad-pingcastle-conso

```powershell
# Audit recurrente — 1 vez por trimestre
$Q = "2026-Q2"
$Out = "C:\audit\$Q"
New-Item -ItemType Directory -Path $Out -Force

PingCastle.exe --healthcheck --server dc01 --no-enum-limit
PingCastle.exe --carto --explore-trust
Move-Item ad_hc_*.* $Out
Move-Item ad_carto_*.* $Out

# Comparar con trimestre anterior
Copy-Item C:\audit\2026-Q1\ad_hc_*.xml $Out
PingCastle.exe --conso --xmls-directory $Out
```

___

## Score interpretation

| **Score** | **Significado** | **Acción** |
|:---:|:---:|:---:|
| 0-30 | Buena postura | Mantener + audit trimestral. |
| 30-50 | Aceptable | Atacar findings High primero. |
| 50-70 | Pobre | Plan de remediación 90 días. |
| 70-100 | Crítico | Probable compromiso latente, IR. |
^ad-pingcastle-score

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| PingCastle download | `https://www.pingcastle.com/download/` |
| PingCastle docs | `https://www.pingcastle.com/documentation/` |
| Rule reference (`--hcrules`) | Built-in |
| Source | `https://github.com/vletoux/pingcastle` |
| ADSecurity blog | `https://adsecurity.org` |
^ad-pingcastle-resources

***
