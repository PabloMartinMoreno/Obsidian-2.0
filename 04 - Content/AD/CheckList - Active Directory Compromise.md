---
aliases:
  - AD Compromise Checklist
  - Checklist de Compromiso AD
  - AD Kill Chain
tags:
  - asset/active-directory
  - meta/checklist
  - technique/discovery
  - technique/privilege-escalation
  - technique/lateral-movement
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Playbook
linked:
  - "[[AD - Security Controls Enumeration]]"
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[DCSync]]"
  - "[[BloodHound & SharpHound]]"
---
# CheckList - Active Directory Compromise

> Playbook de progresión de un compromiso AD: de **sin credenciales** en la red → **Domain Admin / DA-equivalente**. Cada paso linkea a su cheatsheet. Marcá lo que vas confirmando.

---

## 0. Acceso a la Red (sin credenciales)

- [ ] Capturar hashes en la red: Responder + relay → [[NTLM Relay]] (`responder -I eth0`).
- [ ] Poisoning LLMNR/NBT-NS/mDNS → [[LLMNR & NBT-NS Poisoning]].
- [ ] Coerción de autenticación (PetitPotam/PrinterBug) → [[Authentication Coercion]].
- [ ] Probar **null / guest session**: `nxc smb $DC -u '' -p ''` y `-u guest -p ''`.
- [ ] Enum anónima de usuarios (RID cycling, `--users`, `kerbrute userenum`).
- [ ] **AS-REP Roasting** sin auth (usuarios con `DONT_REQ_PREAUTH`) → [[AS-REP Roasting]].

---

## 1. Foothold (primer usuario de dominio)

- [ ] **Password spray** controlado (respetar lockout) → ver política en [[AD - Password Policy Enumeration]].
- [ ] Validar credenciales: `nxc smb $DC -u U -p P` (¿`Pwn3d!`?).
- [ ] **SharpHound / BloodHound** — recolección completa → [[BloodHound & SharpHound]] (`-c All`).
- [ ] Enum de **controles defensivos** antes de tooling ruidoso → [[AD - Security Controls Enumeration]].

---

## 2. Recon Autenticado

- [ ] Usuarios, grupos, equipos, OUs, GPOs, trusts → hubs `AD - * Enumeration`.
- [ ] **Kerberoasting** (cuentas con SPN) → [[Kerberoasting]].
- [ ] **AS-REP Roasting** (cuentas sin preauth) → [[AS-REP Roasting]].
- [ ] ACLs peligrosas (GenericAll, WriteDACL, etc.) → [[AD - ACL Enumeration]].
- [ ] Delegaciones (Unconstrained/Constrained/RBCD) → [[AD - Delegation Enumeration]].
- [ ] AD CS (plantillas ESC1-ESC15) → [[AD - ADCS Enumeration]].
- [ ] LAPS / gMSA legibles → [[AD - LAPS Enumeration]] · [[AD - gMSA Enumeration]].
- [ ] GPP cpassword en SYSVOL → [[AD - GPO y SYSVOL Enumeration]].

---

## 3. Escalada de Privilegios

- [ ] Explotar la **ruta más corta a DA** que muestra BloodHound.
- [ ] Abuso de ACL (ForceChangePassword, AddMember, WriteDACL → DCSync).
- [ ] Abuso de delegación (S4U, RBCD, Shadow Credentials).
- [ ] Abuso de AD CS (ESC1/ESC8 relay → cert de DA).
- [ ] Local privesc si hace falta (token, servicio, [[AD - LAPS Enumeration|LAPS]] password).

---

## 4. Movimiento Lateral

- [ ] **Pass-the-Hash** → [[Pass-the-Hash]] (`nxc smb -H HASH`).
- [ ] **Pass-the-Ticket** → [[Pass-the-Ticket]].
- [ ] Ejecución remota: PsExec / WMI / WinRM → [[WMI and WinRM]].
- [ ] Dumpear secretos de cada host pivote (LSASS / SAM) → [[LSASS Dumping]].

---

## 5. Dominación del Dominio

- [ ] **DCSync** del `krbtgt` y de todos los usuarios → [[DCSync]].
- [ ] Dump de **NTDS.dit** completo → [[NTDS.dit Extraction]].
- [ ] Verificar acceso DA: `nxc smb $DC -u DA -p P` → `Pwn3d!`.

---

## 6. Persistencia (post-DA)

- [ ] **Golden Ticket** (hash krbtgt) / **Silver Ticket** (hash de servicio).
- [ ] **DCShadow**, AdminSDHolder, ACL backdoors.
- [ ] Cuenta máquina / Shadow Credentials como acceso de respaldo.

---

## Notas Relacionadas

- [[AD - Security Controls Enumeration]] · [[BloodHound & SharpHound]]
- [[Kerberoasting]] · [[AS-REP Roasting]] · [[DCSync]] · [[NTDS.dit Extraction]]
- [[Pass-the-Hash]] · [[Pass-the-Ticket]]
