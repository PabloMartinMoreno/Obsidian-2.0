
# Cheat Sheet: Metodología Forense & Orden de Volatilidad

**Estándar:** RFC 3227

**Regla de Oro:** Recolectar evidencia desde lo más volátil (desaparece rápido) a lo menos volátil (persistente).

## 1. Orden de Volatilidad (Prioridad de Extracción)

_Si la máquina está encendida, seguir este orden estricto antes de cualquier otra acción._

1. **Memoria RAM:** 🔥 **CRÍTICO.** Contiene contraseñas en texto plano, claves de cifrado, conexiones activas, procesos inyectados. (Se pierde al apagar).
2. **Estado de Red / Caché:** Tablas ARP, routing, conexiones activas.
3. **Procesos en ejecución:** Estado actual del sistema.
4. **Disco Duro (HDD/SSD):** Sistema de archivos, logs guardados, documentos.
5. **Medios Externos/Archivos:** Backups, DVDs, Logs remotos.


---

## 2. Flujo de Trabajo (Procedimiento)

**Caso A: Equipo ENCENDIDO (Live Forensics)**
- **NO APAGAR.** Se pierde la RAM.
- **Acción:** Ejecutar herramientas desde USB externo (preparado con binarios estáticos) para dumperar la RAM (`DumpIt`, `FTK Imager Portable`, `WinPMEM`).
- Minimizar interacción para no alterar la huella de memoria.

**Caso B: Equipo APAGADO (Dead Forensics)**
- **NO ENCENDER.** Bootear altera metadatos (Last Access), logs de inicio, registro y archivos temporales.
- **Acción:** Extraer disco y conectar a estación forense usando **Bloqueador de Escritura (Write Blocker)**.


---

## 3. Adquisición de Imagen (Disco)

- **Objetivo:** Nunca trabajar sobre la evidencia original.
- **Método:** Clonación **Bit-a-Bit** (incluye espacio no asignado y borrado). No es un "Copy-Paste".
- **Integridad (Hashing):** Calcular Hash (MD5/SHA256) del disco original y de la imagen final.
    - `Hash(Original) == Hash(Imagen)` -> Evidencia válida.
    - Si no coinciden, la evidencia está contaminada/invalidad.


---

## 4. Checklist de Análisis (Triaje Rápido)

_Orden lógico para investigar artefactos en Windows:_

1. **Ejecución (¿Qué corrió?):**
    - `Prefetch`: Qué apps se ejecutaron, cuántas veces y cuándo.
    - `Shimcache` / `Amcache`: Evidencia de ejecución pasada (incluso si el .exe fue borrado).

2. **Persistencia (¿Cómo se mantiene?):**
    - Registro: `HKCU\...\Run`, `HKLM\...\RunOnce`.
    - Servicios y Tareas Programadas (`schtasks`).
    - Carpeta Inicio (Startup).

3. **Acceso/Movimiento Lateral:**
    - Event Logs: Security (ID 4624 - Login Exitoso, 4625 - Fallido).
    - System (Servicios iniciados/parados).

4. **Actividad de Usuario:**
    - `Shellbags`: Qué carpetas navegó el usuario.
    - `LNK Files` / `Jumplists`: Archivos abiertos recientemente.
    - Navegadores: Historial y descargas.


---

## 5. Herramientas Clave

- **RAM:** Volatility 3 (Análisis), FTK Imager (Adquisición).
- **Disco:** Autopsy (Suite completa), Eric Zimmerman Tools (Artefactos específicos: Registry, Prefetch, etc.).
- **Imagen:** Guymager (Linux), FTK Imager (Win).