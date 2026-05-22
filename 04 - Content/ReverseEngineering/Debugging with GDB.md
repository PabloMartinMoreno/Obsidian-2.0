---
aliases:
tags:
  - estado/completo
  - tool/gdb
  - technique/discovery
kind: Tool
linked:
  - "[[Binary Analysis Fundamentals]]"
---
# Debugging with GDB

> [!info]
> GNU Debugger — Linux estándar de facto. Extensiones pwndbg / GEF / peda agregan UI mejorada para exploitation. Para Windows usar [[Debugging with x64dbg]].

***

## Setup recomendado

```bash
# pwndbg (recomendado moderno)
git clone https://github.com/pwndbg/pwndbg
cd pwndbg && ./setup.sh

# GEF (alternativa)
bash -c "$(curl -fsSL https://gef.blah.cat/sh)"

# peda (legacy)
git clone https://github.com/longld/peda.git ~/peda
echo "source ~/peda/peda.py" >> ~/.gdbinit
```

***

## Comandos esenciales

| Comando | Acción |
|---|---|
| `gdb ./binary` | Load binary |
| `gdb ./binary core` | Load con core dump |
| `run [args]` (`r`) | Start execution |
| `break <addr/func>` (`b`) | Set breakpoint |
| `info break` | List breakpoints |
| `delete <N>` (`d N`) | Delete breakpoint |
| `continue` (`c`) | Resume |
| `step` (`s`) | Step into |
| `next` (`n`) | Step over |
| `finish` | Run hasta function return |
| `disas <func>` | Disassemble |
| `x/<n><fmt> <addr>` | Examine memory (e.g., `x/20wx $rsp`) |
| `info registers` (`i r`) | Show regs |
| `print <expr>` (`p`) | Evaluate expression |
| `set $rax=0x1337` | Modify register |
| `info functions` | List functions |
| `info proc mappings` | Memory map |

***

## Examine memory formats

```
x/<count><format><size> <addr>

format: x (hex), d (dec), u (unsigned), o (octal), t (binary), c (char), s (string), i (instruction)
size:   b (byte), h (halfword 2B), w (word 4B), g (giant 8B)
```

Examples:
```
x/40wx $rsp          # 40 words hex desde stack pointer
x/s 0x400600         # string en addr
x/10i $rip           # 10 instructions desde EIP/RIP
```

***

## Exploit dev (pwndbg highlights)

```
# Auto context (regs, stack, code, disasm)
context

# Pattern (cyclic input para encontrar offset)
cyclic 200           # generate
cyclic -l 0x6161616a # find offset of pattern

# Search memory por bytes
search "/bin/sh"
search -e -t executable "ret"   # ROP gadget hunt

# ROP
rop --grep "pop rdi; ret"

# Checksec del binary
checksec
```

***

## Attach a process running

```bash
gdb -p <PID>
# or interactivamente
gdb
(gdb) attach <PID>
```

Requires `ptrace_scope=0` o root.

***

## Reverse shell / remote debug

```bash
# Target
gdbserver :1234 ./binary

# Attacker
gdb ./binary
(gdb) target remote <target>:1234
```

***

## Notas Relacionadas

- [[Binary Analysis Fundamentals]]
- [[Disassembling with Ghidra]]
- [[Buffer Overflow]]
- [[Debugging with x64dbg]]
