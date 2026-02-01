---
aliases:
  - Enumeración de Active Directory
tags:
  - type/moc/tertiary
  - asset/active-directory
  - technique/recon/active
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
type: Tertiary Category
---
# Enumeración de Active Directory

Discovery: ¿Qué hay ahí? (Hosts, Redes).
Identities: ¿Quién está ahí? (Users, Groups).
Permissions: ¿Qué pueden hacer? (ACLs, GPOs, Delegation).
Attack Paths: ¿Cómo llego al objetivo? (BloodHound, Grafos).

***

## 🗺 Domain & Network Discovery
  Identificación de hosts, topología y características generales del dominio.

- [[AD - Hosts Enumeration]] (Descubrimiento de máquinas unidas al dominio.)
- [[AD - Network Layout]] (Mapeo de la estructura de red y subredes.)
- [[AD - Domain & Forest Trusts]] (Identificación de relaciones de confianza entre dominios y bosques.)
- [[AD - DNS & SRV Records]] (Enumeración de registros DNS específicos de AD como _ldap y _kerberos.)


## 🆔 User & Group Intelligence
  Recopilación de información sobre identidades y sus asociaciones.

- [[AD - Users & Groups Enumeration]] (Obtención de listas de usuarios, grupos y sus atributos.)
- [[AD - Password Policy Enumeration]] (Descubrimiento de la política de contraseñas del dominio.)
- [[AD - LAPS Enumeration]] (Verificar si LAPS está implementado y quién puede leer las contraseñas de administrador local.)


## 🔎 Object & Security Auditing
  Inspección detallada de objetos del directorio y controles de seguridad.

- [[AD - Object Permissions Enumeration]] (Auditoría de ACLs en objetos AD para identificar configuraciones inseguras.)
- [[AD - Security Controls Enumeration]] (Identificación de configuraciones de seguridad, como GPOs o políticas de auditoría.)
- [[AD - Certificate Services (AD CS) Enumeration]] (Enumeración de plantillas de certificados vulnerables - CRÍTICO hoy en día.)
- [[AD - Delegation Enumeration]] (Identificación de computadoras/usuarios con delegación incondicional o restringida.)
- [[AD - GPO & SYSVOL Enumeration]] (Búsqueda específica de contraseñas en scripts o preferencias de grupo en SYSVOL.)


 ## 🗺 Attack Path & Vulnerability Analysis
Mapeo visual de relaciones y búsqueda automatizada de debilidades estructurales.

- [[AD - Attack Path Mapping]] (Identificación de rutas de ataque complejas hacia objetivos de alto valor - *Enlaza a BloodHound*).
- [[AD - Health & Security Auditing]] (Auditoría automatizada de configuraciones riesgosas - *Enlaza a PingCastle*).


***

