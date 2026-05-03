---
aliases:
  - PtT
  - Kerberos Pass-the-Ticket
  - Ticket Injection
tags:
  - type/vulnerability
  - technique/lateral-movement
  - technique/credential-access
  - technique/kerberos
  - env/windows
  - asset/active-directory
  - cred/kerberos
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
  - '[[Active Directory]]'
tertiary categories:
  - '[[Active Directory Explotación]]'
type: CheatSheet
linked:
  - '[[Pass-the-Ticket - Formatos y Conversión]]'
  - '[[Pass-the-Ticket - Windows Extraction]]'
  - '[[Pass-the-Ticket - Linux Extraction]]'
  - '[[Pass-the-Ticket - Inyección y Uso]]'
  - '[[Pass-the-Ticket - Detection y Mitigations]]'
  - '[[Pass-the-Ticket - Tooling]]'
  - '[[Pass-the-Hash]]'
  - '[[Golden Ticket]]'
  - '[[Silver Ticket]]'
  - '[[LSASS Dumping]]'
  - '[[Rubeus]]'
  - '[[Impacket Toolkit]]'
---
# Pass-the-Ticket

***

## Cheatsheet

### 🎫 Formatos y Conversión

````tabs
tab: **.kirbi (Windows)**
![[Pass-the-Ticket - Formatos y Conversión#^ptt-fmt-kirbi]]

tab: **.ccache (Linux)**
![[Pass-the-Ticket - Formatos y Conversión#^ptt-fmt-ccache]]

tab: **Base64 (Rubeus)**
![[Pass-the-Ticket - Formatos y Conversión#^ptt-fmt-base64]]

tab: **ticketConverter**
![[Pass-the-Ticket - Formatos y Conversión#^ptt-fmt-convert]]

tab: **klist verify**
![[Pass-the-Ticket - Formatos y Conversión#^ptt-fmt-verify]]

tab: **Purge**
![[Pass-the-Ticket - Formatos y Conversión#^ptt-fmt-purge]]
````

### 🪟 Windows Extraction

````tabs
tab: **Rubeus dump**
![[Pass-the-Ticket - Windows Extraction#^ptt-win-dump]]

tab: **Rubeus monitor**
![[Pass-the-Ticket - Windows Extraction#^ptt-win-monitor]]

tab: **Rubeus harvest**
![[Pass-the-Ticket - Windows Extraction#^ptt-win-harvest]]

tab: **mimikatz list**
![[Pass-the-Ticket - Windows Extraction#^ptt-win-mimi-list]]

tab: **mimikatz export**
![[Pass-the-Ticket - Windows Extraction#^ptt-win-mimi-export]]

tab: **LUID targeting**
![[Pass-the-Ticket - Windows Extraction#^ptt-win-luid]]
````

### 🐧 Linux Extraction

````tabs
tab: **ccache Locations**
![[Pass-the-Ticket - Linux Extraction#^ptt-linux-locations]]

tab: **Robar ccache**
![[Pass-the-Ticket - Linux Extraction#^ptt-linux-steal]]

tab: **KRB5CCNAME**
![[Pass-the-Ticket - Linux Extraction#^ptt-linux-krb5]]

tab: **getST (S4U)**
![[Pass-the-Ticket - Linux Extraction#^ptt-linux-getst]]

tab: **kinit**
![[Pass-the-Ticket - Linux Extraction#^ptt-linux-kinit]]

tab: **SSSD / realmd**
![[Pass-the-Ticket - Linux Extraction#^ptt-linux-sssd]]
````

### 💉 Inyección y Uso

````tabs
tab: **Rubeus ptt**
![[Pass-the-Ticket - Inyección y Uso#^ptt-inject-rubeus]]

tab: **mimikatz ptt**
![[Pass-the-Ticket - Inyección y Uso#^ptt-inject-mimi]]

tab: **impacket -k -no-pass**
![[Pass-the-Ticket - Inyección y Uso#^ptt-inject-impacket]]

tab: **OverPass-the-Hash**
![[Pass-the-Ticket - Inyección y Uso#^ptt-inject-opth]]

tab: **S4U (getST / delegation)**
![[Pass-the-Ticket - Inyección y Uso#^ptt-inject-s4u]]

tab: **Requirements**
![[Pass-the-Ticket - Inyección y Uso#^ptt-inject-req]]
````

### 🛡️ Detection & Mitigations

````tabs
tab: **Detection Events**
![[Pass-the-Ticket - Detection y Mitigations#^ptt-detect-events]]

tab: **MDI Alerts**
![[Pass-the-Ticket - Detection y Mitigations#^ptt-detect-mdi]]

tab: **Anomaly Hunt**
![[Pass-the-Ticket - Detection y Mitigations#^ptt-detect-anomaly]]

tab: **Protected Users**
![[Pass-the-Ticket - Detection y Mitigations#^ptt-detect-protected]]

tab: **Credential Guard**
![[Pass-the-Ticket - Detection y Mitigations#^ptt-detect-credguard]]

tab: **Hardening Checklist**
![[Pass-the-Ticket - Detection y Mitigations#^ptt-detect-checklist]]
````

### 🛠️ Tooling

````tabs
tab: **Rubeus**
![[Pass-the-Ticket - Tooling#^ptt-tool-rubeus]]

tab: **mimikatz kerberos**
![[Pass-the-Ticket - Tooling#^ptt-tool-mimi]]

tab: **impacket**
![[Pass-the-Ticket - Tooling#^ptt-tool-impacket]]

tab: **klist / kinit**
![[Pass-the-Ticket - Tooling#^ptt-tool-klist]]

tab: **ticketConverter**
![[Pass-the-Ticket - Tooling#^ptt-tool-convert]]

tab: **Recursos**
![[Pass-the-Ticket - Tooling#^ptt-tool-resources]]
````

___

## Overview

**Pass-the-Ticket (PtT)** = inyectar un Kerberos ticket (TGT o TGS) en una sesión Windows para autenticarse como el owner del ticket sin conocer su password ni NT hash. El ticket puede ser robado de memoria (LSASS), de disco (ccache en Linux), o forjado (Golden/Silver Ticket).

**Variantes:**
- **TGT robado** → full acceso: pedir cualquier TGS como el user.
- **TGS robado** → acceso al servicio específico del ticket.
- **Golden Ticket** (forge TGT con krbtgt hash) → mismo mecanismo de inyección.
- **Silver Ticket** (forge TGS con service hash) → acceso directo al service.
- **OverPass-the-Hash** → NTLM hash → solicitar TGT vía Kerberos → inject.

### PtT vs PtH

| | **Pass-the-Hash** | **Pass-the-Ticket** |
|---|---|---|
| Protocolo | NTLM | Kerberos |
| Credential | NT hash | TGT / TGS (.kirbi / .ccache) |
| Requiere auth previa | Hash solo | Ticket (de LSASS o forjado) |
| Detection | Event 4624 Type 3 NTLM | Event 4769 anomalous source |
| Evasion potencial | Evita Kerberos-focused alerts | Evita NTLM-focused alerts |
| Tiempo de vida | Indefinido (hash no expira) | Lifetime del ticket (default 10h TGT) |

___

## Workflow

```
1. Obtener ticket:
   a. Windows: Rubeus dump / monitor / harvest — desde LSASS (local admin requerido).
   b. Windows: mimikatz sekurlsa::tickets /export — .kirbi files.
   c. Linux: robar /tmp/krb5cc_<UID> si host AD-joined y tenés access.
   d. Generar: impacket-getST (S4U/delegation abuse) — no requiere robar de memoria.
   e. Forge: Golden Ticket (si tenés krbtgt hash) / Silver Ticket.

2. Convertir si necesario:
   - Windows → Linux: ticketConverter .kirbi → .ccache
   - Linux → Windows: ticketConverter .ccache → .kirbi

3. Inyectar:
   - Windows: Rubeus.exe ptt /ticket:<B64 or kirbi>
   - Windows: mimikatz kerberos::ptt <kirbi>
   - Linux: export KRB5CCNAME=/path/ticket.ccache

4. Verificar: klist

5. Usar:
   - Windows: dir \\target\c$, psexec, wmiexec, etc.
   - Linux: impacket-psexec/wmiexec/secretsdump -k -no-pass

6. Cleanup: Rubeus.exe purge / klist purge / kdestroy
```

___

## Detección rápida

```powershell
# Windows — dump TGT de DA que logueó
.\Rubeus.exe triage
.\Rubeus.exe dump /luid:<LUID_del_DA> /service:krbtgt /nowrap
.\Rubeus.exe purge
.\Rubeus.exe ptt /ticket:<BASE64>
klist
dir \\dc01.corp.local\c$
```

```bash
# Linux — getST + uso con impacket
impacket-getST -spn cifs/target.corp.local -impersonate administrator corp.local/svc:'P@ss'
export KRB5CCNAME=administrator@cifs_target.corp.local.ccache
impacket-psexec -k -no-pass corp.local/administrator@target.corp.local
```

___

## Impacto

- **TGT de DA robado** → full domain access vía cualquier servicio Kerberos.
- **TGS de DC$ robado** → acceso SMB/WMI/WinRM a ese DC.
- **OverPass-the-Hash** → convierte NTLM hash en ticket Kerberos (evade NTLM-focused detections).
- **Unconstrained delegation** → TGTs de cualquier user que loguee al server comprometido.
- **S4U / RBCD abuse** → forge TGS impersonating admin sin robar nada de LSASS.
- **Golden Ticket post-dump** → persistencia post-DA via krbtgt hash.
- **Lateral movement encadenado** → TGT robado → nuevas máquinas → más TGTs → escalada progresiva.

___

## Mitigación (defender)

- **Protected Users group** — DA accounts: NTLM disabled, RC4 disabled, 4h TGT. Bloquea OverPtH con NT hash y limita ventana de abuso.
- **Credential Guard (VBS)** — LSASS en VSM. Rubeus dump / mimikatz sekurlsa bloquados.
- **Tiered Admin Model** — DA no loguea interactivamente en workstations. Sin TGTs de DA en Tier 1/2.
- **Monitor Event 4769 RC4** — OverPass-the-Hash indicator en dominio AES-only.
- **MDI en todos los DCs** — detecta cross-IP ticket usage.
- **Disable RC4 Kerberos** (`msDS-SupportedEncryptionTypes`) — fuerza AES-only.
- **Short TGT lifetime** — reducir default 10h a 4h via GPO (Default Domain Policy).
- **Auditoría de delegation** — revisar cuentas con `TRUSTED_FOR_DELEGATION` (unconstrained).

___

## Para entender Pass-the-Ticket

**Por qué Kerberos permite esto:**
Kerberos diseñado para SSO sin transmitir passwords. El ticket (TGT o TGS) es la prueba de identidad. KDC firma tickets con sus claves — el service verifica la firma. Si el ticket es válido, el service confía en él independientemente de dónde vino. No hay binding ticket↔IP en Kerberos estándar (existe `S4U2Proxy` binding pero no obligatorio).

**Por qué PtT es diferente de PtH:**
PtH abusa NTLM — el hash se usa directamente como equivalente de password en challenge-response. PtT abusa Kerberos — el ticket (cifrado, firmado) se inyecta en la sesión Windows donde el Kerberos SSP lo usa transparentemente. Son dos authentication paths diferentes — un dominio puede tener detecciones para NTLM pero no para Kerberos anómalo, y viceversa.

**Por qué OverPass-the-Hash existe:**
Algunos servicios modernos ya no aceptan NTLM (SMB signing, LDAP signing). Con PtH clásico, te quedás sin opciones. OverPtH convierte el NT hash → AS-REQ al KDC → TGT Kerberos válido → PtT desde ahí. Permite usar un NT hash en entornos que bloquean NTLM.

**Por qué Rubeus monitor es poderoso:**
Unconstrained Delegation abuse: si comprometés un server con `TRUSTED_FOR_DELEGATION`, cualquier user que autentique contra ese server (ej: impersonando a él para un printer bug) deposita su TGT en LSASS del server. Rubeus monitor lo captura al instante. Si la víctima es un DC$ con DA, tenés un DA TGT sin haber necesitado DA previamente.

**Por qué credential guard no siempre es suficiente:**
Bloquea extracción desde LSASS memoria — Rubeus dump y mimikatz sekurlsa fallan. Pero: ccache files en disco (Linux hosts), getTGT con credenciales válidas, getST con delegation abuse — ninguno requiere tocar LSASS. Credential Guard protege un vector específico, no todos.

___

## Recursos

- [Rubeus](https://github.com/GhostPack/Rubeus) — toolkit Kerberos.
- [impacket](https://github.com/fortra/impacket) — getST, ticketConverter, -k flag.
- [HackTricks — PtT](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/pass-the-ticket) — comprehensive.
- [The Hacker Recipes — PtT](https://www.thehacker.recipes/ad/movement/kerberos/ptt) — reference.
- [ired.team — PtT](https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/pass-the-ticket) — practical.
- [MITRE ATT&CK T1550.003](https://attack.mitre.org/techniques/T1550/003/) — Use Alternate Authentication Material: Pass the Ticket.

***
