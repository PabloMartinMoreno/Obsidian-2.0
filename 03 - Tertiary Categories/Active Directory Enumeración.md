---
aliases:
  - Active Directory Enumeration
  - AD Enumeration
  - Enumeración de Active Directory
  - AD Enumeration
tags:
  - asset/active-directory
  - technique/recon/active
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
kind: Tertiary Category
linked:
  - "[[Active Directory Explotación]]"
  - "[[Windows & Active Directory Movimiento Lateral]]"
---
# Active Directory Enumeración

Discovery → Identities → Permissions → Attack Paths.

---

## 🗺 Domain & Network Discovery
Identificación de hosts, topología y características generales del dominio.

- [[AD - Hosts Enumeration]] (DC location via SRV records, computer objects, sites, subnets, OUs, RID brute, RPC enum.)
- [[AD - DNS & SRV Records]] (Discovery via `_ldap._tcp.dc._msdcs`, AXFR transfer, adidnsdump, AD-integrated zones.)
- [[AD - Domain & Forest Trusts]] (Trust enum, direction/type, transitive vs non-transitive, cross-forest mapping.)


## 🆔 Users, Groups & Privileged Identities
Recopilación de información sobre identidades, atributos y asociaciones privilegiadas.

- [[AD - Users Enumeration]] (samAccountName, UPN, attributes, UAC flags, SPNs, asreproastable, kerberoastable.)
- [[AD - Groups Enumeration]] (Privileged groups, recursive membership, nested chains, foreign security principals.)
- [[AD - Password Policy Enumeration]] (Default policy, fine-grained PSO, lockout threshold, krbtgt password age.)
- [[AD - LAPS Enumeration]] (Legacy `ms-Mcs-AdmPwd`, modern `msLAPS-Password`, password readers discovery.)
- [[AD - gMSA Enumeration]] (Group Managed Service Accounts, password readers, gMSADumper.)


## 🔎 Object Permissions & ACL Auditing
Inspección detallada de objetos del directorio y controles de seguridad.

- [[AD - ACL Enumeration]] (DACL inspection, dangerous ACEs, BloodHound edges, dsacls, Get-ObjectAcl.)
- [[AD - DCSync Rights Discovery]] (Get-Changes/Get-Changes-All extended rights, non-default holders.)
- [[AD - Delegation Enumeration]] (Unconstrained, Constrained S4U, RBCD targets, Shadow Credentials.)
- [[AD - ADCS Enumeration]] (Templates, ESC1-15 candidates, Enterprise CAs, certipy find.)
- [[AD - GPO y SYSVOL Enumeration|AD - GPO & SYSVOL Enumeration]] (Linked GPOs per OU, gPCFileSysPath, cpassword search, SYSVOL scripts.)


## 🗺 Attack Path & Vulnerability Analysis
Mapeo visual de relaciones y búsqueda automatizada de debilidades estructurales.

- [[BloodHound & SharpHound]] (Collection con SharpHound/RustHound/AzureHound, ingest CE, queries Cypher, edges built-in, custom analytics.)
- [[AD - Health y Security Auditing|AD - Health & Security Auditing]] (PingCastle, Purple Knight, ADRecon — auditorías automatizadas de configuraciones riesgosas.)


---
