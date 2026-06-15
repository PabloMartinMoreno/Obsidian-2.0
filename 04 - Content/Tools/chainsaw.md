---
aliases:
  - Chainsaw
tags:
  - tool/chainsaw
  - env/windows
  - topic/forensics
  - topic/detection
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[Digital Forensics]]"
  - "[[Respuesta]]"
tertiary categories:
  - "[[Digital Forensics Respuesta]]"
kind: CheatSheet
linked:
  - "[[Sigma]]"
  - "[[Windows Event Logs]]"
  - "[[Metodología Forense]]"
---

**Chainsaw** es una herramienta de línea de comandos potente y rápida, diseñada específicamente para el análisis forense y la **caza de amenazas (Threat Hunting)** en registros de eventos de Windows (`.evtx`).

## Módulos Principales

Chainsaw opera principalmente a través de dos subcomandos: **Hunt** y **Search**.

### 1. Módulo `hunt` (Cacería)

Este es el comando más potente. Utiliza reglas de detección (generalmente Sigma) para escanear los logs y alertar sobre patrones de ataque específicos (como inyección de procesos, creación de usuarios sospechosos, uso de Mimikatz, etc.).

**Sintaxis básica:**
```Bash
chainsaw hunt [directorio_logs] --rules [directorio_reglas] --mapping [archivo_mapeo]
```
- **`--rules`**: La ruta a la carpeta que contiene las reglas Sigma (`.yml`).
- **`--mapping`**: Un archivo vital (generalmente `sigma-mapping.yml` incluido con la herramienta) que le dice a Chainsaw cómo traducir las reglas Sigma a los campos específicos de los archivos `.evtx`.

### 2. Módulo `search` (Búsqueda)

Funciona como un `grep` súper vitaminado para logs de Windows. Te permite buscar cadenas de texto o patrones Regex específicos sin necesidad de una regla compleja.

**Sintaxis básica:**
```Bash
chainsaw search [termino_busqueda] [directorio_logs]
```

---

## Ejemplos de Uso Práctico

Supongamos que tienes una carpeta con logs extraídos de una máquina comprometida en `C:\Evidencia\Logs`.

### Escenario A: Detección automática de amenazas (Hunt)

Quieres ver si hay algo malicioso basándote en la base de conocimientos de Sigma.
```Bash
chainsaw hunt C:\Evidencia\Logs \
    --rules sigma_rules/ \
    --mapping mappings/sigma-event-logs-all.yml \
    --level critical,high
```

- **Explicación:** Este comando escanea los logs usando las reglas en la carpeta `sigma_rules`, aplica el mapeo correcto y **filtra** para mostrarte solo alertas de nivel "crítico" o "alto".
    

### Escenario B: Buscar un IOC específico (Search)

Sabes que el atacante usó un archivo llamado `malware.exe` o una IP `192.168.1.50`.
```Bash
chainsaw search "malware.exe" C:\Evidencia\Logs -i
```
- **`-i`**: Hace la búsqueda insensible a mayúsculas/minúsculas (case-insensitive).

### Escenario C: Buscar con Regex

Quieres buscar cualquier comando de PowerShell codificado en Base64.
```Bash
chainsaw search "powershell.*-e" C:\Evidencia\Logs --regex
```

---

## Interpretación de la Salida (Output)

Chainsaw ofrece varios formatos de salida, lo cual es crucial para el análisis posterior.
1. **Tabla ASCII (Por defecto):** Bonita para ver en la terminal, pero difícil de procesar si hay muchos datos.
2. **CSV (`--csv`):** Ideal para abrir en Excel o importar a una base de datos.
3. **JSON (`--json`):** Perfecto para enviar los datos a un SIEM (como Splunk o ELK) o procesarlos con scripts de Python.

**Ejemplo exportando a CSV:**
```Bash
chainsaw hunt C:\Logs --rules sigma/ --mapping map.yml --output results.csv
```

---

## Resumen de Flags (Argumentos) Útiles

|**Flag**|**Descripción**|
|---|---|
|`--level`|Filtra por severidad de la alerta (ej. `critical`, `high`, `medium`).|
|`--from` / `--to`|Permite especificar un rango de tiempo (ej. "2023-01-01"). Útil para incidentes con fecha conocida.|
|`--csv`|Guarda la salida en formato CSV.|
|`--json`|Guarda la salida en formato JSON (NDJSON).|
|`--skip-errors`|Continúa el análisis aunque encuentre un archivo `.evtx` corrupto (muy común en forense).|

---

## ¿Cuándo utilizar Chainsaw?

1. **Respuesta a Incidentes (IR):** Tienes una imagen de disco o una colección de logs de una máquina hackeada y necesitas un triaje rápido ("¿Qué pasó aquí?") antes de profundizar.
2. **Análisis Offline:** Cuando no puedes instalar agentes en la máquina infectada y debes analizar los logs en tu propia estación de trabajo segura.
3. **Blue Teaming:** Para probar si tus reglas Sigma actuales realmente detectarían ataques pasados usando logs históricos.