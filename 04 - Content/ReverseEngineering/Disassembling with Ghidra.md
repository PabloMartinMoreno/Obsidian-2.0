---
aliases:
  - "ghidra"
tags:
  - tool/ghidra
  - technique/discovery
kind: Tool
linked:
  - "[[Binary Analysis Fundamentals]]"
---
# Disassembling with Ghidra

> [!info]
> NSA reverse engineering platform. Free, open-source. Decompiles a pseudo-C, supports ELF/PE/Mach-O/raw, scripting Python/Java. Alternativa a IDA Pro paid.

---

## Workflow básico

```
1. File → New Project → Non-Shared Project
2. File → Import File → binary
3. Análisis automático (run con default options)
4. Symbol Tree → entry → doble-click → Listing + Decompile views
```

---

## Atajos clave

| Tecla | Acción |
|---|---|
| `G` | Goto address |
| `L` | Rename label/variable |
| `Ctrl+L` | Retype variable |
| `;` | Add comment (EOL) |
| `:` | Add pre-comment |
| `F` | Create function en address |
| `D` | Disassemble |
| `Ctrl+Shift+F` | Search references |
| `Ctrl+Shift+G` | Goto function |
| `H` | Toggle hex/dec representation |

---

## Decompiler tips

- **Auto-rename**: identificar API calls + nombrar variables.
- **Retype struct**: declarar `MyStruct` via Data Type Manager → re-decompile.
- **Function signatures**: ajustar args para match real signature (e.g., main(int argc, char**argv)).
- **String references**: doble-click string → ver code que la usa.

---

## Scripting

Ghidra scripts en `~/ghidra_scripts/` (Python o Java).

```python
# Ejemplo: dump todas funciones con nombre + address
fm = currentProgram.getFunctionManager()
for f in fm.getFunctions(True):
    print(f"{f.getEntryPoint()}: {f.getName()}")
```

Built-in scripts útiles: `WindowsResourceReference.java`, `BatchSegmentImport.java`.

---

## Comparación con IDA

| Feature | Ghidra | IDA Free | IDA Pro |
|---|---|---|---|
| Cost | Free | Free | Paid ($1k+) |
| Decompiler | Yes | x64 only | Yes (with Hex-Rays) |
| Architectures | Many | x86/x64/ARM | Many |
| Scripting | Python/Java | IDC, Python | Idem |
| Collab | Built-in (server) | No | No (paid Hex-Rays Lumina) |
| Headless | Yes | No | Yes |

---

## Headless mode

```bash
# Import + analyze sin GUI
analyzeHeadless ~/project_dir ProjectName -import binary -postScript MyScript.py
```

Útil para batch processing.

---

## Notas Relacionadas

- [[Binary Analysis Fundamentals]]
- [[Debugging with GDB]]
- [[Debugging with x64dbg]]
- [[Decompiling .NET Assemblies]]
