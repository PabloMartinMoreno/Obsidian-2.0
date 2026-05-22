---
aliases:
tags:
  - estado/completo
  - technique/discovery
  - asset/mobile
kind: Concept
linked:
---
# iOS App Reversing

> [!info]
> iOS apps = `.ipa` (ZIP) con Mach-O binary + plists + resources. Encrypted por Apple FairPlay DRM en App Store builds — requiere device jailbroken para decrypt. Tools: Hopper, otool, class-dump, Frida, Ghidra.

***

## Estructura IPA

```
app.ipa (ZIP)
└── Payload/
    └── App.app/
        ├── App                       # Mach-O binary (encrypted en App Store)
        ├── Info.plist                # bundle id, capabilities, etc.
        ├── embedded.mobileprovision  # provisioning
        ├── _CodeSignature/
        └── assets, *.nib, *.plist, etc.
```

***

## Decrypt FairPlay-protected binary

Apple cifra binarios distribuidos por App Store. Para análisis estático completo, decrypt:

| Tool | Method |
|---|---|
| **frida-ios-dump** | Frida script para dump in-memory |
| **bagbak** | LLDB-based |
| **Clutch** (legacy) | Pre-iOS 12 |
| **Iridium** | Modern jailbroken |

Requiere device jailbroken.

***

## Análisis estático

```bash
# Info de architecture + load commands
otool -l App
otool -hv App      # header info
otool -L App       # libraries linked
otool -Iv App      # imports

# Strings
strings -a App

# Class dump (Obj-C symbol info)
class-dump App > classes.h

# Disasm
otool -tV App | less

# Ghidra
ghidraRun → Import → App → analyze
```

***

## Common findings

```bash
# URLs / endpoints
strings App | grep -iE 'http[s]?://'

# API keys
strings App | grep -iE '[A-Za-z0-9_-]{32,}'

# Plist files (config)
plutil -p Info.plist
plutil -p PreferenceSpecifiers.plist

# Hardcoded crypto keys
strings App | grep -iE 'AES|DES|RSA|SHA256'

# Insecure storage paths
strings App | grep -iE 'NSUserDefaults|Documents|tmp'
```

***

## Decompilation Swift/Obj-C

- **Hopper Disassembler** — pseudo-C output, mac/linux
- **IDA Pro + Hex-Rays** — best decompiler para ARM64
- **Ghidra** — free, decent ARM64 support
- **Binary Ninja** — modern alternative

Swift Stripping = nombres de funciones perdidos al strip. Class-dump no funciona en Swift puro (solo Obj-C).

***

## Dynamic analysis

| Tool | Uso |
|---|---|
| **Frida** | Hook functions in-memory |
| **Objection** | Frida wrapper, SSL unpin, jailbreak detect bypass |
| **Cycript** (legacy) | Inject runtime in Obj-C |
| **LLDB** | Apple's debugger, requires jailbreak para attach |
| **Burp + Proxy on device** | MITM HTTPS |

Frida bypass SSL pinning:
```bash
frida -U -f com.app -l ios-pinning-bypass.js
```

***

## Jailbreak detection bypass

Apps verifican jailbreak via:
- `fork()` works (no en sandbox)
- `/Applications/Cydia.app` exists
- `/private/var/lib/apt/` exists
- `/usr/bin/ssh` exists
- Sysctl `kern.proc.all` info

Bypass: Frida script hookea these checks y retorna falsedad.

***

## Privacy / Sensitive APIs

```bash
# Buscar uso de APIs sensibles
class-dump App | grep -iE 'CLLocationManager|CMMotion|AVAudioRecorder|AVCaptureSession|CNContactStore|EKEventStore'

# Info.plist privacy strings (cuáles permissions pide)
plutil -p Info.plist | grep -iE 'UsageDescription'
```

***

## Notas Relacionadas

- [[Android APK Reversing]]
- [[Binary Analysis Fundamentals]]
- [[Decompiling .NET Assemblies]]
- [[Disassembling with Ghidra]]
