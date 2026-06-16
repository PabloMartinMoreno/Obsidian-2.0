---
aliases:
  - OSINT - Reconocimiento Facial
  - OSINT - Búsqueda Inversa de Imágenes
  - Reverse Image Search
tags:
  - technique/recon/passive
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
kind: CheatSheet
linked:
  - "[[OSINT]]"
  - "[[OSINT - Metadata (EXIF)]]"
  - "[[OSINT - Geolocalización]]"
---
# OSINT - Reverse Image Search

> [!info] Overview
> Tres cosas distintas: **coincidencia exacta** (¿dónde más aparece esta foto? → detectar fotos robadas), **similitud visual** (objetos/lugares → geolocalizar), y **reconocimiento facial** (buscar una cara → vigilancia, terreno minado). Ningún motor es "el mejor": **usar varios siempre**.

---

## Motores

| **Motor** | **Fuerte en** |
|:---|:---|
| **Yandex Imágenes** | El favorito OSINT — superior encontrando otras fotos de la misma persona/escena. |
| **TinEye** (`tineye.com`) | Coincidencia exacta; **ordenar por "oldest"** → fuente original de una foto robada. |
| **Google Lens / Imágenes** | Objetos, productos, lugares, logos, texto en la imagen. |
| **Bing Visual Search / Baidu** | A veces encuentran lo que otros no (Baidu: ámbito chino). |
^ris-motores

## Técnica

| **Acción** | **Por qué** |
|:---|:---|
| **Recortar** (solo cara / logo / tatuaje / cartel de fondo) | Elimina el "ruido" → cambia radicalmente los resultados. Probar completa + recortes. |
| Extensión **RevEye** / **Search by Image** | Clic derecho → consulta varios motores a la vez. |
| TinEye → ordenar por más antigua | Llegar al origen de una imagen robada. |
^ris-tecnica

## Flujo de detección de catfishing

1. Tomar las fotos del perfil sospechoso.
2. Pasarlas por **Yandex + TinEye + Google**.
3. Si las mismas fotos aparecen con **otro nombre** / en cuentas más viejas / en bancos de imágenes → perfil falso con fotos robadas.
4. **Consistencia:** fotos reales trazan a cuentas coherentes del mismo dueño; las de un catfish trazan a personas sin relación.
^ris-catfishing

> [!warning] Reconocimiento facial (PimEyes, FaceCheck)
> Buscan **la cara** en cualquier foto distinta → des-anonimizan y rastrean personas reales. Datos biométricos = datos sensibles (Ley 25.326), con sanciones en la UE. La búsqueda inversa clásica cubre la necesidad legítima (¿foto robada? ¿perfil falso?); el reconocimiento facial es un instrumento de acoso. Marcarlo como **límite**, no usarlo.

> Se encadena con [[OSINT - Metadata (EXIF)|EXIF]] (la imagen puede traer GPS/fecha) y [[OSINT - Geolocalización]].
^ris-encadena
