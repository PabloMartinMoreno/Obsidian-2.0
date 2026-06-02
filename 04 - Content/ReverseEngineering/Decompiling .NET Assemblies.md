---
aliases:
tags:
  - technique/discovery
kind: Concept
linked:
  - "[[Binary Analysis Fundamentals]]"
---
# Decompiling .NET Assemblies

> [!info]
> Binaries .NET (C#, VB.NET, F#) compilan a **IL (Intermediate Language)** ejecutado por CLR. IL es trivialmente decompilable a near-original source. Tools: dnSpy, ILSpy, dotPeek.

---

## Tools

| Tool | Caract |
|---|---|
| **dnSpy** | Edit-in-place + debugger integrated. **Top pick.** |
| **dnSpyEx** | Fork mantenido actualizado |
| **ILSpy** | View-only, lightweight, soporta más lenguajes target |
| **dotPeek** (JetBrains) | Free, integra con Visual Studio |
| **JustDecompile** | Telerik |
| **de4dot** | De-obfuscator pre-decompile (Confuser, Eazfuscator, etc.) |

---

## dnSpy workflow

```
1. File → Open → assembly.exe / .dll
2. Tree view → Namespace → Class → Method
3. Doble-click method → decompiled C# en panel
4. Right-click → Edit Method (C#) → modificar source → Compile
5. File → Save Module → save patched binary
```

Edit-in-place permite:
- Bypass license checks
- Inject calling code
- Add backdoor methods
- Modify constants

---

## Búsqueda en código

`Ctrl+Shift+K` — Search across all loaded assemblies:
- "String" — buscar string literals
- "Method" — buscar method names
- "Type" — buscar classes
- "Member declared in type" — refs

Patterns útiles para hunt:
```
ConnectionString
RegistryKey
HttpClient
File.WriteAll
Process.Start
Marshal.PtrToString
LoadLibrary
```

---

## Common findings

| Finding | Notas |
|---|---|
| **Hardcoded creds** | Constants en clases de connection / config |
| **Crypto keys** | AES/RSA keys embedded para "license", "config encryption" |
| **API endpoints** | URLs hardcoded → recon adicional |
| **Cmd execution** | `Process.Start("cmd.exe /c " + userInput)` → CMDi |
| **Web.config encryption keys** | machineKey leak → ViewState forging |

---

## Obfuscation

Packers/obfuscators .NET comunes:
- **ConfuserEx** — multi-protection
- **Eazfuscator** — string encryption + flow obfuscation
- **Crypto Obfuscator**
- **Babel.NET**
- **SmartAssembly**

Workflow contra obf:
1. **de4dot** primero — detecta protector + deobf básico
2. dnSpy con código deobf
3. Manual: rename Symbol-Renamer plugin

```bash
de4dot --un-name '!^<>[a-z\d]+|^_+$' obfuscated.exe
```

---

## CLR Internals útiles

```
.NET Reflector → ver IL crudo (más bajo nivel que C# decompilado)
Mono.Cecil → librería para programmatic IL manipulation
```

---

## Notas Relacionadas

- [[Binary Analysis Fundamentals]]
- [[Decompiling Java Applications]]
- [[Disassembling with Ghidra]]
- [[Source Code Review]]
