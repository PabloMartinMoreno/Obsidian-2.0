---
aliases:
tags:
  - technique/discovery
kind: Concept
linked:
  - "[[Binary Analysis Fundamentals]]"
---
# API Monitoring & Hooking

> [!info]
> Interceptar llamadas a API (OS/library/app) en runtime para entender comportamiento, modificar valores, bypass de checks. Útil cuando estático es complejo (obfuscated) o para identificar IOCs (malware analysis).

***

## Conceptos

- **Monitoring**: observar calls sin modificar (read-only)
- **Hooking**: interceptar + modificar args/return value
- **Instrumentation**: inject code para profiling/coverage

***

## Tools por OS

| OS | Tool | Caract |
|---|---|---|
| **Windows** | Process Monitor (procmon) | FS, registry, network, process events |
| **Windows** | API Monitor | API calls con args decoded |
| **Windows** | Frida | Cross-platform, JS scripting |
| **Linux** | strace | Syscalls trace |
| **Linux** | ltrace | Library function trace |
| **Linux** | Frida | Idem |
| **macOS** | dtrace / dtruss | Syscalls trace |
| **Android** | Frida + Objection | Method hook |
| **iOS** | Frida (jailbreak required) | Idem |

***

## strace / ltrace (Linux)

```bash
# Syscalls
strace ./binary
strace -f -e network ./binary   # Solo net syscalls
strace -p <pid>                 # Attach
strace -e openat ./binary       # Solo openat (file access)

# Library calls
ltrace ./binary
ltrace -l libssl* ./binary      # Solo libssl
```

Output útil para entender qué hace un binary sin decompilarlo.

***

## Frida (cross-platform)

Frida inject JS runtime en proceso target.

```bash
# Install
pip install frida-tools

# List processes
frida-ps -U          # Mobile USB
frida-ps             # Local

# Spawn + attach
frida -U -f com.app -l script.js
frida -U -n SafariViewService -l script.js
```

Script básico (`script.js`):
```javascript
Java.perform(function() {
    // Android Java method hook
    var MyClass = Java.use("com.app.MyClass");
    MyClass.checkLicense.implementation = function() {
        console.log("checkLicense called, forcing true");
        return true;
    };
});

// Native function hook (cualquier OS)
Interceptor.attach(Module.findExportByName("libc.so", "open"), {
    onEnter: function(args) {
        console.log("open(" + args[0].readCString() + ")");
    },
    onLeave: function(retval) {
        console.log("→ " + retval);
    }
});
```

***

## Process Monitor (Windows)

```
1. Run procmon.exe → capture inicia
2. Filter → Process Name → contains → app.exe
3. Run target binary
4. Stop capture
5. Análisis: FS events (writes a temp), Registry (keys leídas), Net (TCP connections)
```

Útil para detect:
- Hardcoded paths
- Sequences de operación
- Errores silentes
- Files temporales con secrets

***

## API Monitor (Windows)

GUI rich con args decoded (e.g., HKEY values for registry APIs, file path strings).

```
1. File → Monitor New Process → seleccionar exe
2. API filter → habilitar categorías (Files, Registry, Networking, Crypto)
3. Run
4. Análisis del log
```

***

## Microsoft Detours (programmatic hook)

C/C++ library para Windows API hooking en código compilable.

```c
#include <detours.h>

// Hook MessageBoxA
static int (WINAPI *Real_MessageBoxA)(HWND, LPCSTR, LPCSTR, UINT) = MessageBoxA;
int WINAPI Hook_MessageBoxA(HWND h, LPCSTR txt, LPCSTR cap, UINT type) {
    return Real_MessageBoxA(h, "Hooked!", cap, type);
}

// DllMain
DetourTransactionBegin();
DetourUpdateThread(GetCurrentThread());
DetourAttach((PVOID*)&Real_MessageBoxA, Hook_MessageBoxA);
DetourTransactionCommit();
```

***

## eBPF (Linux moderno)

Sin reboot, sin modules, observa syscalls + filtros complejos.

```bash
# bpftrace (high-level)
bpftrace -e 'tracepoint:syscalls:sys_enter_openat /comm == "myapp"/ { printf("%s\n", str(args->filename)); }'

# bcc tools — execsnoop, opensnoop, tcpconnect, etc.
opensnoop-bpfcc
```

***

## Notas Relacionadas

- [[Binary Analysis Fundamentals]]
- [[Disassembling with Ghidra]]
- [[Debugging with GDB]]
- [[Debugging with x64dbg]]
- [[Android APK Reversing]]
- [[iOS App Reversing]]
