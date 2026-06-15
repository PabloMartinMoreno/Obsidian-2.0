---
aliases:
  - YARA Rules
  - yara
tags:
  - tool/yara
  - topic/detection
  - topic/malware
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SIEM Detección]]"
kind: CheatSheet
linked:
  - "[[Metodología Forense]]"
  - "[[Threat Intelligence - IOCs e IOAs]]"
---
# YARA

> [!abstract] TL;DR
> "El grep de los malware researchers". Reglas que describen patrones (strings, hex, condiciones) para **clasificar e identificar malware** en archivos, procesos y memoria. Cada regla = un conjunto de strings + una condición booleana.

---

## Anatomía de una Regla

```yara
rule APT_Backdoor_Generic {
    meta:
        author = "analyst"
        description = "Detecta backdoor X"
        hash = "3461da3a2ddcced4a00f87dcd7650af4..."
    strings:
        $s1 = "cmd.exe /c whoami" ascii
        $s2 = { 6A 40 68 00 30 00 00 }          // opcode hex
        $re1 = /https?:\/\/[a-z0-9]{8}\.evil/ nocase
    condition:
        uint16(0) == 0x5A4D and 2 of ($s*)      // MZ header + 2 strings
}
```

| **Sección** | **Qué define** |
|:---|:---|
| `meta` | Metadata (autor, descripción, hash, referencia). |
| `strings` | Patrones: texto (`$s`), hex (`{ }`), regex (`/ /`). Modificadores: `ascii`, `wide`, `nocase`, `fullword`. |
| `condition` | Lógica: `all of them`, `2 of ($s*)`, `uint16(0)==0x5A4D` (magic bytes), `filesize < 1MB`. |
^yara-anatomia

## Escaneo (CLI)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `yara rule.yar archivo.exe` | Match/no-match de una regla | Test puntual |
| `yara -r rules.yar /home/` | Escaneo recursivo de un directorio | Hunting en filesystem |
| `yara -s rule.yar sample.bin` | Muestra los strings que matchearon | Entender por qué disparó |
| `yara -m rule.yar sample` | Muestra los `meta` de las reglas que matchean | Triage con contexto |
| `yara rule.yar -p 5 /malware/` | 5 threads en paralelo | Escaneo masivo |
| `yara -d filesize=10000 rule.yar f` | Define variable externa | Reglas parametrizadas |
| `yara rules.yar <PID>` | Escanea la memoria de un proceso vivo | Hunting en RAM en endpoint |
^yara-escaneo

## Integración Forense / Memoria

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `vol -f mem.raw windows.vadyarascan --yara-file r.yar` | Match de YARA en regiones de memoria (Volatility 3) | Hallar malware en un dump — ver [[Metodología Forense]] |
| `clamscan -d rules.yar -r /path` | YARA vía ClamAV | AV con reglas custom |
^yara-forense

> YARA convierte un **IOC** ([[Threat Intelligence - IOCs e IOAs]]) en detección reusable: de un hash/string puntual a un patrón que matchea variantes. Reglas comunitarias en **YARA-Rules**, **Florian Roth/signature-base**.
^yara-ioc
