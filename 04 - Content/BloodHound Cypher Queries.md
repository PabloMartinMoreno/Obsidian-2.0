---
aliases:
  - Cypher Queries Cheatsheet
  - BloodHound Cypher
tags:
  - type/atomic
  - technique/enumeration
  - env/windows
  - asset/active-directory
  - tool/bloodhound
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[BloodHound & SharpHound]]"
  - "[[Active Directory Explotación]]"
---
# BloodHound Cypher Queries

***

## Cheatsheet
^bh-cypher

| Target | Query |
| --- | --- |
| **Shortest path to DA** | `MATCH p=shortestPath((u {owned:true})-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOM.LOCAL"})) RETURN p` |
| **Kerberoasteables** | `MATCH (u:User {hasspn:true}) RETURN u` |
| **AS-REP roasteables** | `MATCH (u:User {dontreqpreauth:true}) RETURN u` |
| **Users sin expiración** | `MATCH (u:User {pwdneverexpires:true}) RETURN u` |
| **Computers con Unconstrained Deleg** | `MATCH (c:Computer {unconstraineddelegation:true}) RETURN c` |
| **Constrained Delegation** | `MATCH (s)-[:AllowedToDelegate]->(t) RETURN s,t` |
| **ACL owned → priv** | `MATCH p=(u {owned:true})-[r:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner]->(t) RETURN p` |

Correr en web UI (antigua Neo4j browser o BloodHound CE) pegando en la Raw Query box.

***

## Marcar nodos owned

```cypher
MATCH (u:User {name:"USER@DOM.LOCAL"}) SET u.owned=true
MATCH (c:Computer {name:"HOST.DOM.LOCAL"}) SET c.owned=true

// Listar owned
MATCH (n {owned:true}) RETURN n
```

## Paths a Domain Admins

### Desde cualquier owned
```cypher
MATCH p=shortestPath(
  (n {owned:true})-[*1..]->(g:Group)
) WHERE g.name = "DOMAIN ADMINS@DOM.LOCAL"
RETURN p
```

### Desde user específico
```cypher
MATCH p=shortestPath(
  (u:User {name:"USER@DOM.LOCAL"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOM.LOCAL"})
) RETURN p
```

### All paths (no solo shortest)
```cypher
MATCH p=(u {owned:true})-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOM.LOCAL"})
RETURN p LIMIT 25
```

## Kerberos attacks

### Kerberoasteables owned-reachable
```cypher
MATCH p=shortestPath((u {owned:true})-[*1..]->(k:User {hasspn:true}))
RETURN p
```

### AS-REP roasteables
```cypher
MATCH (u:User {dontreqpreauth:true}) RETURN u.name, u.enabled
```

### Unconstrained Delegation
```cypher
MATCH (c:Computer {unconstraineddelegation:true, enabled:true})
RETURN c.name
```

### Constrained Delegation
```cypher
MATCH (s)-[:AllowedToDelegate]->(t)
RETURN s.name AS source, t.name AS target
```

### RBCD (Resource-based constrained delegation)
```cypher
MATCH (s)-[:AllowedToAct]->(t)
RETURN s.name, t.name
```

## ACL abuse

### GenericAll / Write desde owned
```cypher
MATCH p=(u {owned:true})-[r:GenericAll|GenericWrite|WriteDacl|WriteOwner|AllExtendedRights]->(t)
RETURN p
```

### Write sobre GPOs
```cypher
MATCH p=(u {owned:true})-[:GenericAll|GenericWrite|WriteDacl|WriteOwner]->(g:GPO)
RETURN p
```

### AddMember a grupos privilegiados
```cypher
MATCH p=(u)-[:AddMember]->(g:Group)
WHERE g.name =~ ".*(ADMIN|OPERATOR|EXCHANGE).*"
RETURN p
```

### ForceChangePassword
```cypher
MATCH p=(u {owned:true})-[:ForceChangePassword]->(t:User)
RETURN p
```

## High-value targets

### Users con admin count
```cypher
MATCH (u:User {admincount:true}) RETURN u.name
```

### Sessions en DCs
```cypher
MATCH (c:Computer)<-[:HasSession]-(u:User)
WHERE c.name CONTAINS "DC"
RETURN u.name, c.name
```

### Users activos con passwords viejos (>1 año)
```cypher
MATCH (u:User {enabled:true})
WHERE u.pwdlastset < (timestamp()/1000 - 31536000)
RETURN u.name, datetime({epochSeconds: toInteger(u.pwdlastset)})
```

### Computers con SMB signing off (pre-recolectado con custom collector)
```cypher
MATCH (c:Computer) WHERE c.smbsigning = false RETURN c.name
```

## Domain / Forest recon

### Confianzas
```cypher
MATCH (d1:Domain)-[r:TrustedBy]->(d2:Domain)
RETURN d1.name, type(r), d2.name
```

### Foreign group membership (cross-domain)
```cypher
MATCH (u:User)-[:MemberOf]->(g:Group)
WHERE u.domain <> g.domain
RETURN u.name, g.name
```

## AD CS (con Certipy → BloodHound.py -c Certs)

### CAs
```cypher
MATCH (c:EnterpriseCA) RETURN c
```

### Templates vulnerables
```cypher
MATCH (ct:CertTemplate) WHERE ct.`Enroll Privileges` IS NOT NULL
RETURN ct.name, ct.`Enroll Privileges`
```

### ESC1 (SAN + Client Auth + enroll low-priv)
```cypher
MATCH p=(u {owned:true})-[:Enroll]->(ct:CertTemplate)-[:PublishedTo]->(ca:EnterpriseCA)
WHERE ct.enrolleesuppliessubject = true
  AND ct.requiresmanagerapproval = false
  AND ("Client Authentication" IN ct.ekus OR "Any Purpose" IN ct.ekus OR size(ct.ekus)=0)
RETURN p
```

## Misc

### Todos los usuarios habilitados
```cypher
MATCH (u:User {enabled:true}) RETURN count(u)
```

### DCs
```cypher
MATCH (c:Computer) WHERE c.distinguishedname CONTAINS "OU=DOMAIN CONTROLLERS"
RETURN c.name
```

### Computers sin parches recientes (via LAPS timestamp como proxy)
```cypher
MATCH (c:Computer) WHERE c.haslaps = false RETURN c.name
```

### Operator groups
```cypher
MATCH (g:Group)
WHERE g.name IN ["ACCOUNT OPERATORS@DOM.LOCAL", "SERVER OPERATORS@DOM.LOCAL", "BACKUP OPERATORS@DOM.LOCAL", "PRINT OPERATORS@DOM.LOCAL"]
RETURN g
```

***

## Custom prebuilt queries

Editar `~/.config/bloodhound/customqueries.json` (BH legacy) para guardar:

```json
{
  "queries": [
    {
      "name": "Shortest paths to DA from owned",
      "queryList": [
        {
          "final": true,
          "query": "MATCH p=shortestPath((u {owned:true})-[*1..]->(g:Group {name:'DOMAIN ADMINS@DOM.LOCAL'})) RETURN p"
        }
      ]
    }
  ]
}
```

Para BH CE: Explore → Saved queries → Custom.

## Tips

- `LIMIT N` siempre al explorar paths largos.
- `shortestPath()` mucho más rápido que `*1..`.
- Marcar todos los compromised antes de querear paths desde owned.
- Collector completo: `bloodhound-python -u u -p p -d dom.local -c all --zip`.
- Para ADCS: agregar `Certipy-BloodHound.py` o `bloodhound.py -c Certs`.

## Recursos

- [BloodHound CE docs](https://bloodhound.specterops.io/)
- [hausec - Cypher for Bloodhound](https://hausec.com/2019/09/09/bloodhound-cypher-cheatsheet/)
- [CompassSecurity - Custom queries](https://github.com/CompassSecurity/BloodHoundQueries)

***
