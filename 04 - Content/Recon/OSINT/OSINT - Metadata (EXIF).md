---
aliases:
  - OSINT - Metadatos e Imágenes
  - Metadata OSINT
  - EXIF
tags:
  - technique/recon/passive
  - topic/forensics
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
  - "[[OSINT - Reverse Image Search]]"
  - "[[OSINT - Domain & Infrastructure]]"
---
# OSINT - Metadata (EXIF)

> [!info] Overview
> Casi todo archivo (fotos, PDFs, Office) embebe metadatos sobre cómo/cuándo/dónde/con qué se creó. En imágenes = **EXIF**. El dato estrella: **coordenadas GPS**. Aviso clave: **las redes sociales borran el EXIF al subir** — sobrevive en adjuntos de email, archivos "como documento", originales en nube.

---

## ExifTool

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `exiftool imagen.jpg` | Todos los metadatos | Análisis general (imágenes, PDF, video, Office) |
| `exiftool -gps:all imagen.jpg` | Solo coordenadas GPS | Geolocalizar la captura |
| `exiftool -all= imagen.jpg` | **Borra** todos los metadatos | Defensa: limpiar antes de compartir |
^exif-exiftool

> Visores web sin instalar: **metadata2go**, **Jeffrey's Image Metadata Viewer** (`exif.regex.info`), **Pic2Map** (ubica el GPS en mapa).

## Qué guarda el EXIF

Marca/modelo del dispositivo · fecha y hora de captura · ISO/apertura/focal · **GPS** (si geoetiquetado activo) · software de edición · a veces miniatura interna que difiere de la imagen editada (truco forense).
^exif-contenido

## Metadatos de Documentos (recon de pentest)

PDFs y Office guardan **autor, organización, software, usuarios, historial de revisiones**. Flujo clásico: `filetype:pdf` ([[Google Dorking|dorking]]) → cosechar documentos → extraer metadatos → nombres de usuario internos → [[OSINT - Username Enumeration]].

| **Herramienta** | **Qué hace** |
|:---|:---|
| **metagoofil** | Descarga documentos de un dominio y les extrae metadatos |
| **FOCA** (Windows) | Cosecha y análisis de metadatos de documentos |
^exif-documentos

## Detección de Manipulación

| **Herramienta** | **Qué hace** |
|:---|:---|
| **FotoForensics** | Error Level Analysis (ELA): resalta zonas recomprimidas/pegadas. *Sugiere, no prueba.* |
| **Forensically** (`29a.ch`) | Suite: ELA, clone detection, análisis de ruido, metadatos |
| **InVID/WeVerify** | Plugin para verificar imágenes/videos (periodismo) |
^exif-manipulacion

> [!tip] Lección defensiva
> Cada foto puede llevar dónde se sacó. `exiftool -all=` limpia los metadatos propios antes de compartir. Vale más que cualquier técnica ofensiva.
