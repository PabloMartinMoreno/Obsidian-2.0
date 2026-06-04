---
aliases:
  - Favicon Hash
  - Favicon Fingerprint
tags:
  - technique/recon/active
  - technique/recon/passive
  - asset/web-app
  - service/http
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: CheatSheet
linked:
  - "[[Web Fingerprinting]]"
---
# Favicon Hashing

El favicon (`/favicon.ico`) suele ser único por producto/stack. Su **hash** identifica la tecnología y permite **pivotear** a otros hosts con el mismo favicon vía Shodan — útil para mapear infraestructura relacionada sin tocar el target.

---

## Comandos

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `curl -s <URL>/favicon.ico \| md5sum` | Hash MD5 del favicon | Comparar contra favicons conocidos |
| `python3 -c "import mmh3,requests,codecs; r=requests.get('<URL>/favicon.ico'); print(mmh3.hash(codecs.encode(r.content,'base64')))"` | Hash **mmh3** (formato Shodan) | Generar el hash para buscar |
| Shodan: `http.favicon.hash:<mmh3>` | Otros hosts con el mismo favicon | Pivot / atribución / mismo stack |
| FavFreak (`cat urls.txt \| python3 favfreak.py`) | Agrupa hosts por favicon hash | Bulk sobre muchos hosts |

^favicon-hash

---

## Notas relacionadas
- [[Web Fingerprinting]] · [[Web Enumeración]] · [[Certificate Transparency Logs]]
