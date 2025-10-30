# Vulnerabilidades públicas
## Qué son

Vulnerabilidades en componentes del back end explotables desde el exterior que permiten tomar control del servidor sin acceso local. Suelen ser errores de código o malas configuraciones y van desde fallos básicos hasta vulnerabilidades complejas.

## Public CVE

* Muchas aplicaciones públicas (open-source o propietarias) son testeadas y sus fallos se parchean y publican con un **CVE**.
* Buscar exploits públicos es el primer paso en un test: identificar versión de la aplicación (p. ej. en el código fuente) y buscar exploits en bases públicas (Exploit DB, Rapid7, etc.).
* Interesan especialmente CVE con puntuación alta (8–10) o que dan **Remote Code Execution**.
* También hay que buscar vulnerabilidades en componentes externos usados por la app (plugins, librerías).

## CVSS (Common Vulnerability Scoring System)

* Sistema estándar para medir severidad (score 0–10) usando métricas **Base**, **Temporal** y **Environmental**.
* NVD publica principalmente **Base scores**. Existen CVSS v2 y v3 (v3 añade categorías distintas).
* Rangos de severidad (ejemplos):
  * CVSS v2: Low 0.0–3.9, Medium 4.0–6.9, High 7.0–10.0.
  * CVSS v3: None 0.0, Low 0.1–3.9, Medium 4.0–6.9, High 7.0–8.9, Critical 9.0–10.0.
* Los calculadores CVSS permiten ajustar Temporal/Environmental para adaptar el score al contexto de la organización.

## Vulnerabilidades en servidores back-end

* Buscar fallos en servidores web y componentes del back end (webserver, sistema operativo, base de datos).
* Ejemplo histórico: vulnerabilidades en servidores que permitieron control remoto (p. ej. Shell-Shock).
* Vulnerabilidades del servidor o DB suelen aprovecharse tras obtener acceso local o interno, para escalar privilegios y comprometer otros sistemas.
* Aunque no siempre explotables externamente, deben parchearse por su criticidad para la seguridad global de la aplicación.
