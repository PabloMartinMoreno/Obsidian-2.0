---
aliases:
tags:
  - tool/more
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[less]]"
  - "[[Linux PrivEsc - SUID y SGID]]"
  - "[[Common Linux Utilities]]"
---
# Comando `more`

> [!info] more
> Visualiza archivos de texto **paginado** (pantalla por pantalla). Útil para archivos largos sin abrir un editor. Sintaxis: `more [opciones] archivo`.

> [!tip] `less` es mejor
> `less` permite navegar **hacia adelante y atrás**, más búsqueda y opciones. Preferir `less` salvo entornos mínimos. (Dato: en algunos binarios SUID, escapar vía `more`/`less` da shell — ver [[Linux PrivEsc - SUID y SGID]]).
^definicion

---

## Navegación (dentro de more)

| **Tecla** | **Acción** |
|---|---|
| `Espacio` | Avanza una página |
| `Enter` | Avanza una línea |
| `b` | Retrocede una página |
| `/cadena` | Busca hacia adelante |
| `n` | Repite la última búsqueda |
| `h` | Ayuda (lista de comandos) |
| `q` | Salir |
^more-nav

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-num` | Líneas por pantalla (ej. `more -10 file`) |
| `-d` | Mensajes de error amigables |
| `-c` | Limpia la pantalla antes de cada página (en vez de scroll) |
| `-s` | Comprime líneas en blanco consecutivas en una |
