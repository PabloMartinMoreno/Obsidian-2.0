---
aliases:
tags:
  - tool/x64dbg
  - env/windows
  - technique/discovery
kind: Tool
linked:
  - "[[Binary Analysis Fundamentals]]"
---
# Debugging with x64dbg

> [!info]
> Open-source debugger Windows x86/x64. GUI moderna, scripting integrado, plugin ecosystem. Reemplazo libre de OllyDbg/IDA debugger.

***

## Layout principal

- **CPU** — disassembly + regs + stack en tiempo real
- **Memory Map** — secciones del proceso
- **Breakpoints** — bp activos
- **Modules** — DLLs cargadas
- **Threads** — threads del proceso
- **Symbols** — exports/imports/labels
- **Source** — source view si PDB available

***

## Atajos clave

| Tecla | Acción |
|---|---|
| `F2` | Toggle breakpoint en línea |
| `F3` | Step Over |
| `F7` | Step Into |
| `F8` | Step Out (return) |
| `F9` | Run |
| `F4` | Run hasta cursor |
| `Ctrl+G` | Goto address |
| `Ctrl+F` | Search en disasm |
| `Ctrl+B` | Search bytes |
| `Ctrl+N` | Search referenced strings |

***

## Breakpoint types

- **Software** (`bp <addr>`) — INT3, modifica byte
- **Hardware** (`bphwc`) — DRx registers, no modifica memoria
- **Memory** — break al leer/escribir/ejecutar región
- **Conditional** — break si condición Python-like se cumple
- **Trace** — log sin parar

```
bp kernel32.LoadLibraryA          ; Software bp en API call
bphws 0x401000 r                  ; HW read bp
bpm 0x402000 w                    ; Memory write bp
```

***

## Scripting

x64dbg script tab — sintaxis tipo asm + comandos custom.

```
// Auto-unpack stub: ESP trick
init: bp 0x401000
run

dump_when_oep:
    bpc                   // clear all bp
    SetMemoryBreakPoint <oep-addr>
    run
    pause
    ; Use Scylla plugin to dump + fix IAT
```

PyCommand plugin permite Python directo.

***

## Plugins esenciales

- **Scylla** — IAT recovery + dumping (built-in en x64dbg)
- **OllyDumpEx** — dump process
- **xAnalyzer** — auto-comment API calls
- **SwissArmyKnife** — multi-utility (hash, base64, etc.)
- **OllyMacro** — record/replay macros

***

## Common workflow: unpack packed binary

1. Open packed.exe en x64dbg
2. Run hasta entry (`F9`)
3. Set bp en `VirtualAlloc` o `VirtualProtect` (común en packers)
4. Step until unpacker termina y salta al OEP
5. Use Scylla → IAT autosearch + Get Imports + Dump + Fix Dump
6. Resultado: unpacked.exe analizable estáticamente

***

## Anti-debug evasion

Packers detectan x64dbg via:
- `IsDebuggerPresent` API
- `NtGlobalFlag` flag en PEB
- `PEB.BeingDebugged` byte
- Process name check (`x64dbg.exe`)

Bypass:
- **ScyllaHide** plugin — patcha estas checks
- Rename `x64dbg.exe` → otro nombre

***

## Notas Relacionadas

- [[Binary Analysis Fundamentals]]
- [[Debugging with GDB]]
- [[Disassembling with Ghidra]]
- [[Decompiling .NET Assemblies]]
