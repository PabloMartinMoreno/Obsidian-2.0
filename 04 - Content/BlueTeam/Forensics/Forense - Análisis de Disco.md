---
aliases:
  - Disk Forensics
  - Sleuth Kit
tags:
  - topic/forensics
  - asset/endpoint
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[Digital Forensics]]"
  - "[[Respuesta]]"
tertiary categories:
  - "[[Digital Forensics Respuesta]]"
kind: SubCheatSheet
linked:
  - "[[Metodología Forense]]"
  - "[[Windows Event Logs]]"
---
# Forense - Análisis de Disco

> Análisis de la imagen de disco desde CLI Linux. Montar siempre **solo lectura**.

---

## Búsqueda y Montaje

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `strings -a -t d imagen.img \| grep -i "password"` | Texto legible (URLs, creds, keywords) | Búsqueda bruta sin saber qué buscás |
| `strings -a -t d imagen.img \| grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}"` | IPs embebidas | Hallar C2/IOCs |
| `mount -o ro,loop,noexec imagen.img /mnt/analisis` | Imagen montada (read-only) | Explorar el filesystem sin alterar |
^disk-busqueda

## Timeline (Sleuth Kit)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `fls -r -m / imagen.img > timeline.body` | Bodyfile de todos los archivos (MAC times) | Construir línea de tiempo |
| `mactime -b timeline.body -d > timeline.csv` | Timeline legible en CSV | Ordenar eventos cronológicamente |
^disk-timeline

## Checklist de Artefactos Windows

| **Pregunta** | **Artefactos** |
|:---|:---|
| ¿Qué corrió? | `Prefetch`, `Shimcache`, `Amcache` (ejecución pasada, aunque el `.exe` se borró) |
| ¿Cómo persiste? | Registro `Run`/`RunOnce`, Servicios, Tareas Programadas, carpeta Startup |
| ¿Acceso/lateral? | Event Logs Security (4624/4625), System — ver [[Windows Event Logs]] |
| ¿Actividad de usuario? | `Shellbags` (carpetas), `LNK`/`Jumplists` (archivos recientes), historial de navegador |
^disk-artefactos
