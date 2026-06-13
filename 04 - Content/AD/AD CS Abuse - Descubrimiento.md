---
aliases:
  - ADCS Discovery
  - Certipy find
tags:
  - technique/discovery
  - asset/active-directory
  - env/windows
  - service/ad-cs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: SubCheatSheet
linked:
  - "[[AD CS Abuse]]"
---
# AD CS Abuse - Descubrimiento

> Variables: `U=user`, `P=pass`, `DC=dc01.corp.local`, `CA=corp-CA`. Primero identificar CAs y plantillas vulnerables (ESCx).

---

## Enumeración de CAs y Templates

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy find -u $U@corp.local -p $P -dc-ip $IP -vulnerable -stdout` | CAs + templates vulnerables (ESC detectados) | Recon principal (Linux). |
| `certipy find -u $U@corp.local -p $P -dc-ip $IP -vulnerable -enabled` | Solo templates habilitados → zip+json | Output reportable. |
| `certipy find -u $U -hashes :NTHASH -dc-ip $IP -vulnerable` | Enum con hash (PtH) | Sin password en claro. |
| `certipy find -u $U -k -no-pass -target $DC -dc-ip $IP` | Enum con ticket Kerberos | Tras PtT. |
| `.\Certify.exe find /vulnerable` | Enum de templates vulnerables (Windows) | On-host. |
| `.\Certify.exe find /vulnerable /currentuser` | Templates enrollables por el user actual | Targeting. |
| `Invoke-PKIAudit` (PSPKIAudit) | Audit ofensivo/defensivo de la PKI | Reporte detallado. |
^adcs-disco

### PoC certipy find

```bash
certipy find -u user@corp.local -p 'Pass123!' -dc-ip 10.10.10.10 -vulnerable -stdout
# → lista cada CA, sus templates y qué ESC aplica (ESC1, ESC8, etc.)
```

---

> Según el ESC detectado, ir a: [[AD CS Abuse - Template ESCs]] (ESC1-4), [[AD CS Abuse - CA y Relay ESCs]] (ESC6-8/11), [[AD CS Abuse - Mapping ESCs]] (ESC9-15).
