---
aliases:
  - Herramientas
  - Tools MOC
tags:
  - meta/index
kind: Concept
linked:
---

# Tools MOC

Índice de herramientas del vault. Auto-poblado vía Dataview por categoría.

***

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM "04 - Content/Tools"
WHERE file.name != this.file.name
GROUP BY true
```

***

## Recon / OSINT

```dataview
TABLE WITHOUT ID
  file.link as "Tool",
  kind as "Kind"
FROM "04 - Content/Tools/Recon"
SORT file.name ASC
```

***

## AD / Credenciales

```dataview
LIST
FROM "04 - Content/Tools"
WHERE contains(file.name, "BloodHound") OR contains(file.name, "Rubeus") OR contains(file.name, "Impacket") OR contains(file.name, "Certipy") OR contains(file.name, "GetUserSPNs") OR contains(file.name, "Mimikatz") OR contains(file.name, "Responder") OR contains(file.name, "PowerView") OR contains(file.name, "RpcClient") OR contains(file.name, "netexec") OR contains(file.name, "evil-winrm")
SORT file.name ASC
```

***

## Web / Exploit

```dataview
LIST
FROM "04 - Content/Tools"
WHERE contains(file.name, "Burp") OR contains(file.name, "sqlmap") OR contains(file.name, "Hydra") OR contains(file.name, "EyeWitness")
SORT file.name ASC
```

***

## Cracking

```dataview
LIST
FROM "04 - Content/Tools"
WHERE contains(file.name, "hashcat") OR contains(file.name, "john")
SORT file.name ASC
```

***

## Network / Pivoting

```dataview
LIST
FROM "04 - Content/Tools"
WHERE contains(file.name, "Proxychains") OR contains(file.name, "TcpDump")
SORT file.name ASC
```

***

## Payloads / Frameworks

```dataview
LIST
FROM "04 - Content/Tools"
WHERE contains(file.name, "Metasploit") OR contains(file.name, "MSFVenom") OR contains(file.name, "CanaryToken")
SORT file.name ASC
```

***

## Obsidian (meta)

```dataview
LIST
FROM "04 - Content/Tools"
WHERE contains(file.name, "Templater") OR contains(file.name, "Dataview") OR contains(file.name, "Admonition") OR contains(file.name, "Emoji")
SORT file.name ASC
```

***

## Todos (vista plana)

```dataview
TABLE WITHOUT ID
  file.link as "Tool",
  kind as "Kind",
  file.folder as "Carpeta"
FROM "04 - Content/Tools"
WHERE file.name != this.file.name
SORT file.name ASC
```
