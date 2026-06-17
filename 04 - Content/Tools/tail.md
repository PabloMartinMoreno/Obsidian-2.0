---
aliases:
tags:
  - tool/tail
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[head]]"
  - "[[grep]]"
  - "[[Common Linux Utilities]]"
---
# Comando `tail`

> [!info] tail
> Muestra las últimas líneas de un archivo (por defecto **10**). Sin archivo, lee de stdin. Clave para **monitorear logs en tiempo real** (`-f`). Su opuesto es `head`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `tail -f /var/log/apache2/access.log` | Sigue el log en tiempo real | Monitoreo en vivo |
| `tail -n 50 file.log` | Últimas 50 líneas | Final de un archivo largo |
| `tail -n 50 file.log \| grep ERROR` | Últimas 50 + filtro | Errores recientes ([[grep]]) |
| `tail -f a.log b.log` | Sigue varios archivos a la vez | Multi-log |
| `tail -c 200 file.bin` | Últimos 200 **bytes** | Binarios / final exacto |
| `tail --retry -f file.log` | Espera a que el archivo aparezca | Log que aún no existe |
^tail-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-n N` | Últimas N líneas (`-n +N` = desde la línea N) |
| `-f` | Follow: sigue el crecimiento del archivo |
| `-c N` | Últimos N bytes (no líneas) |
| `--retry` | Reintenta abrir el archivo hasta que exista (con `-f`) |
| `-q` | Sin encabezados al usar varios archivos |
| `-v` | Fuerza el encabezado incluso con un solo archivo |
