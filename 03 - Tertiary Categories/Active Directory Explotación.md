---
aliases:
  - "Active Directory Exploitation"
  - "AD Exploitation"
  - Explotación de Active Directory
  - AD Exploitation
  - ADX
tags:
  - asset/active-directory
  - env/windows
  - technique/lateral-movement
  - technique/privilege-escalation
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Explotación]]"
kind: Tertiary Category
---
# Active Directory Explotación

Roadmap post-foothold inicial: credential access → privilege escalation → dominance & persistence.

---

## 🔑 Kerberos / NTLM Authentication Attacks
Ataques contra mecanismos de autenticación AD para obtener credentials offline-crackeables o reusables.

- [[Kerberoasting]] (Request TGS para SPN-bound accounts → hash RC4/AES crackeable offline.)
- [[AS-REP Roasting]] (Cuentas con `DONT_REQ_PREAUTH` → AS-REP crackeable sin auth previa.)
- [[Timeroasting]] (NTLM hash de computer accounts vía NTP auth, sin creds previas — 2024.)
- [[Pass-the-Hash]] (NTLM hash reuse para auth sin password — wmiexec/smbexec/winrm/RDP.)
- [[Pass-the-Ticket]] (Inyectar TGT/TGS robado en sesión Windows o Linux con Rubeus/ticketer.)
- [[Overpass-the-Hash]] (NT hash → request TGT vía Rubeus asktgt — combo PtH + Kerberos.)


## 📡 Coercion & Network Attacks
Forzar autenticación de máquinas/usuarios para captura o relay.

- [[NTLM Relay]] (Relay de auth NTLM hacia LDAP/LDAPS/SMB/MSSQL/HTTP — combos ADCS ESC8, RBCD, Shadow Credentials.)
- [[Authentication Coercion]] (PrinterBug, PetitPotam, DFSCoerce, ShadowCoerce — forzar DC a autenticar contra atacante.)
- [[LLMNR & NBT-NS Poisoning]] (Responder/Inveigh — capturar NTLMv2 hashes via name resolution poisoning.)
- [[mitm6 - IPv6 DHCP Spoofing]] (Default IPv6 → DHCPv6 + DNS takeover → WPAD relay.)


## 🎭 Delegation Abuse
Abuso de delegations Kerberos para impersonación.

- [[Unconstrained Delegation]] (`TRUSTED_FOR_DELEGATION` flag — capturar TGTs de DA loguees en host comprometido.)
- [[Constrained Delegation (S4U)]] (`msDS-AllowedToDelegateTo` — S4U2Self + S4U2Proxy para impersonar.)
- [[Resource-Based Constrained Delegation (RBCD)]] (`msDS-AllowedToActOnBehalfOfOtherIdentity` — escribir + impersonar.)
- [[Shadow Credentials]] (`msDS-KeyCredentialLink` write — añadir cert key para auth como target.)


## ⬆️ Privilege Escalation en el Dominio
ACL abuse, replication rights, certificate template abuse para escalar a Domain Admin.

- [[ACL Abuse]] (GenericAll/GenericWrite/WriteDACL/WriteOwner/ForceChangePassword sobre user/group/computer/domain.)
- [[DCSync]] (Replication rights `GetChangesAll` → dump completo NTDS.dit incluido krbtgt hash.)
- [[AD CS Abuse]] (ESC1-ESC15 — vulnerable certificate templates, web enrollment relay, EDITF_ATTRIBUTESUBJECTALTNAME2.)
- [[GPO Abuse]] (SharpGPOAbuse, immediate scheduled tasks/scripts/MSI install vía GPO write.)
- [[SYSVOL y GPP cpassword]] (Legacy Group Policy Preferences en SYSVOL — cpassword AES con clave pública.)


## 🪙 Forged Tickets
Ticket Kerberos forging para auth arbitraria post-credentials de service o KDC.

- [[Golden Ticket]] (krbtgt hash → forge TGT para cualquier user en dominio — persistente.)
- [[Silver Ticket]] (Service account hash → forge TGS para servicio específico — stealthier.)
- [[Diamond Ticket]] (Patched real PAC — evade detection vs Golden/Silver clásicos.)
- [[Sapphire Ticket]] (S4U2Self con PAC manipulation — forge avanzado evade SIDFiltering.)


## 🪤 Domain Persistence
Mantener acceso post-DA con backdoors stealth y mecanismos de re-entry.

- [[DSRM Backdoor]] (Directory Services Restore Mode password reset + DsrmAdminLogonBehavior=2 → login local DC.)
- [[Skeleton Key]] (Mimikatz misc::skeleton — patchea LSASS DC con master password universal.)
- [[AdminSDHolder Abuse]] (Modify AdminSDHolder DACL → SDProp propaga permisos cada 60min a Tier 0.)
- [[Custom SSP]] (Mimikatz misc::memssp — capture clear-text passwords from LSASS via custom Security Support Provider.)
- [[Golden Certificate]] (CA private key extraction → forge certificates con cualquier identity arbitraria.)


## 🌐 Trust Abuse
Explotación de relaciones de confianza intra-forest e inter-forest.

- [[Intra-Forest Trust Abuse]] (Parent-child trusts dentro de forest — SID History inyección, ExtraSids para escalar a forest root.)
- [[Inter-Forest Trust Abuse]] (External/forest trusts cross-forest — SID filtering bypass, Rubeus asktgs cross-realm.)


## 🔐 Credential Dumping
Extracción de credenciales desde memoria, disco y bases de datos AD.

- [[LSASS Dumping]] (Mimikatz `sekurlsa::logonpasswords`, comsvcs.dll MiniDump, procdump, Pypykatz offline.)
- [[DPAPI Abuse]] (Master keys, credential blobs, vault credentials, browser saved passwords vía DPAPI.)
- [[SAM y SECURITY Hive Dump]] (Local SAM hashes + LSA secrets via reg save / impacket-secretsdump LOCAL.)
- [[NTDS.dit Extraction]] (Offline DC database — `ntdsutil ifm` create + secretsdump NTDS / volume shadow copy.)
- [[Cached Credentials (mscash)]] (Domain cached credentials para offline logon — registry HKLM\SECURITY\Cache.)


## 🚀 Lateral Movement
Movimiento a través del dominio post-credential access.

- [[WinRM (PSRemoting)]] (Evil-WinRM, Enter-PSSession — requiere Remote Management Users.)
- [[WMI y DCOM Lateral]] (Impacket wmiexec/dcomexec, MMC20.Application, ShellWindows DCOM objects.)
- [[PsExec y SMBExec]] (Impacket psexec/smbexec — ruido alto pero clásico, requiere SMB admin.)
- [[RDP con Pass-the-Hash]] (`xfreerdp /pth:HASH` o `mstsc /restrictedAdmin` — Restricted Admin mode.)
- [[SCM Service Lateral]] (Service Control Manager remoto — sc create/start, modify binPath, payload SYSTEM.)


---
