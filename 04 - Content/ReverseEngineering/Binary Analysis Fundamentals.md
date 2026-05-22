---
aliases:
tags:
  - estado/completo
  - technique/discovery
kind: Concept
linked:
  - "[[Disassembling with Ghidra]]"
  - "[[Debugging with GDB]]"
---
# Binary Analysis Fundamentals

> [!info]
> Conceptos base para reverse engineering binarios: formatos (PE/ELF/Mach-O), headers, sections, secciones runtime, packing/protectors.

***

## Formatos por OS

| OS | Formato | Magic bytes | Tools |
|---|---|---|---|
| **Linux** | ELF | `\x7fELF` | readelf, objdump, file, GDB |
| **Windows** | PE/PE32+ | `MZ...PE\0\0` | PE-bear, CFF Explorer, dnSpy |
| **macOS** | Mach-O | `\xca\xfe\xba\xbe` (FAT) / `\xfe\xed\xfa\xce` | otool, MachOView |
| **Android** | APK (ZIP+DEX) | `PK` | jadx, apktool |
| **iOS** | IPA / Mach-O fat | `PK` (IPA) | otool, class-dump |
| **.NET** | PE + IL | Igual PE pero CLR header | dnSpy, ILSpy |
| **Java** | JAR (ZIP+class) | `PK` | jd-gui, CFR, javap |

***

## ELF anatomy (Linux)

```bash
file binary          # tipo (ELF 64-bit, dynamic, stripped, etc.)
readelf -h binary    # headers
readelf -S binary    # sections (.text, .data, .bss, .rodata, .plt, .got, etc.)
readelf -d binary    # dynamic (libraries linked)
readelf -s binary    # symbols (si no stripped)
objdump -d binary    # disassembly
strings binary       # ASCII strings extraction
nm binary            # symbols (legacy)
ltrace binary        # library call trace en runtime
strace binary        # syscall trace
```

Secciones clave:
- `.text` — código ejecutable
- `.data` — variables inicializadas
- `.bss` — variables uninit (zero-fill)
- `.rodata` — constantes (strings, etc.)
- `.plt` / `.got` — function call indirection (lazy linking)

***

## PE anatomy (Windows)

```cmd
:: PE-bear (GUI) o CFF Explorer
:: PowerShell
Get-Item .\binary.exe | Format-List Length, VersionInfo
```

Secciones típicas:
- `.text` — código
- `.data` — variables init
- `.rdata` — read-only data
- `.rsrc` — resources (icons, strings tables, manifests)
- `.reloc` — relocations
- `.idata` — import table (DLLs + functions)
- `.edata` — export table (si DLL)

Imports table = funciones de DLLs que el binary llama. Hunt aquí para identificar capabilities (`WinHttpOpen` → network, `CreateProcessA` → spawn child, `VirtualAllocEx` → injection).

***

## Calling conventions

| Convention | Args | Notas |
|---|---|---|
| **cdecl (x86)** | Stack (push right-to-left) | Caller cleans |
| **stdcall (x86)** | Stack | Callee cleans |
| **fastcall (x86)** | ECX, EDX, stack | MS |
| **SysV x64** | RDI, RSI, RDX, RCX, R8, R9 | Linux/macOS |
| **MS x64** | RCX, RDX, R8, R9 | Windows |
| **ARM64** | X0-X7 | iOS/Android moderno |

Útil para entender args en disassembly.

***

## Packing / Protectors

```bash
# Detect packer
detect-it-easy (DIE)
peid binary.exe
upx -t binary.exe   # ¿UPX-packed?

# UPX unpack (trivial)
upx -d binary.exe

# Otros packers (Themida, VMProtect, Enigma, ASPack) → manual unpack via debugger
```

***

## Strings hunt

```bash
strings -a binary > all_strings.txt
strings -el binary > unicode_strings.txt  # UTF-16 (Windows)

# Filter por patterns útiles
grep -iE 'http|password|key|token|admin|api|debug|test' all_strings.txt
```

***

## Notas Relacionadas

- [[Disassembling with Ghidra]]
- [[Debugging with x64dbg]]
- [[Debugging with GDB]]
- [[Decompiling .NET Assemblies]]
- [[Decompiling Java Applications]]
- [[Source Code Review]]
