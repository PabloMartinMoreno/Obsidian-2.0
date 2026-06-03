# OSINT

---

## ¿Qué es OSINT?

**OSINT** son las siglas en inglés de **Open Source Intelligence** (Inteligencia de Fuentes Abiertas). Básicamente, es el arte y el proceso de **recolectar, filtrar y analizar información pública** disponible en internet para convertirla en conocimiento útil o "inteligencia".

Para entenderlo de forma simple, se divide en dos grandes pilares:
- **Fuentes Abiertas (Open Source):** Se refiere a que los datos provienen de lugares accesibles para cualquiera, de manera 100% legal. No implica hackear sistemas ni robar contraseñas. Hablamos de redes sociales, foros, registros gubernamentales públicos, artículos de prensa, metadatos de archivos, fotos o incluso la _dark web_.
- **Inteligencia (Intelligence):** Conseguir un montón de datos sueltos no sirve de nada. La inteligencia consiste en cruzar esas piezas de información, aplicar el pensamiento lateral y armar un perfil completo o resolver una investigación.

### ¿En qué se diferencia de una búsqueda común de Google?

La diferencia está en la metodología y las herramientas. Mientras que una persona común busca "cómo hacer una tarta de manzana", un analista de OSINT utiliza técnicas específicas para rastrear información oculta a simple vista, como buscar servidores expuestos a internet (usando herramientas como _Shodan_) o identificar la identidad de alguien a partir de un fragmento de foto (_búsqueda inversa de imágenes_).

> **En resumen:** OSINT es conectar los puntos de la huella digital que personas, empresas o sistemas van dejando de forma pública en internet.

## Ciclo de OSINT

El ciclo de OSINT (Inteligencia de Fuentes Abiertas) se compone de **6 pasos o fases** fundamentales:

- **Fase 1: Definición de requerimientos**
    Consiste en determinar qué es lo que se quiere saber y para quién va dirigida la información (por ejemplo, identificar las necesidades del cliente que contrató la investigación). En esta etapa también se define el formato que tendrá el resultado final, determinando si se entregará mediante un informe detallado, si se adjuntarán pruebas, entre otros aspectos de formato.

- **Fase 2: Recolección de información**
    Es la etapa donde se inicia formalmente el rastreo. Se realizan consultas en redes sociales, foros y registros públicos, abarcando plataformas tanto de la _surface web_ (internet superficial), como de la _deep web_ o la _dark web_. Asimismo, se procede a revisar contenido multimedia y a extraer metadatos.

- **Fase 3: Procesamiento**
    Dado que en la fase anterior se recopila la mayor cantidad de datos posible, en este paso el objetivo principal es depurar los resultados. Consiste en filtrar toda la "información basura" o de relleno para quedarse únicamente con los datos que tengan valor potencial.

- **Fase 4: Análisis**
    En esta fase se pone en práctica el pensamiento lateral para lograr identificar patrones, relaciones, conexiones o tendencias entre los datos limpios. Aunque se pueden emplear herramientas tecnológicas de apoyo, se destaca que la intuición y el criterio humano siempre serán superiores a cualquier automatización en este punto.

- **Fase 5: Difusión**
    Es el proceso de plasmar los hallazgos de forma estructurada. Consiste en confeccionar y hacer la entrega formal del informe final, redactado de manera clara y comprensible, para presentárselo al cliente o a la parte interesada que solicitó la auditoría.

- **Fase 6: Revisión**
    Es el paso de validación final. Sirve para constatar y auditar si efectivamente se cumplieron los objetivos y requerimientos iniciales planteados por el cliente al principio del ciclo.


---

## Herramientas
### 1. Buscadores de Infraestructura y Activos en Internet

- **[Shodan](https://www.shodan.io/)**: El motor de búsqueda para encontrar dispositivos, servidores y servicios expuestos directamente a Internet.
- **[Censys](https://censys.com/)**: Plataforma de búsqueda y análisis de seguridad para escanear y rastrear la superficie de ataque global en la red.

### 2. Búsqueda Inversa de Imágenes y Rostros (IA)

- **[TinEye](https://tineye.com/)**: Buscador clásico de imágenes que rastrea duplicados exactos o patrones modificados de una misma foto en la web.
- **[PimEyes](https://pimeyes.com/)**: Buscador de reconocimiento facial que localiza en qué páginas web aparece el rostro de una persona.
- **[Lenso.ai](https://lenso.ai/)**: Herramientas que utiliza inteligencia artificial avanzada para analizar distancias biométricas y encontrar rostros similares o idénticos.
- **[FaceCheck.id](https://facecheck.id/)**: Plataforma de búsqueda de rostros altamente precisa, capaz de indexar fotos de redes sociales, blogs y miniaturas de video.

### 3. Plataformas de Investigación de Identidad Digital

- **[OSINT Industries](https://osint.industries/)**: Herramienta profesional de pago para rastrear correos o teléfonos y reconstruir toda la huella digital y perfiles sociales de un objetivo.


---


## Pasos para la reconstrucción de Perfiles e Identidad

### Paso 1: Enumeración por Alias (El rastro del nombre de usuario)

**Objetivo:** Averiguar si el objetivo utiliza el mismo nombre de usuario (o variantes) para registrarse en foros, apps de nicho o redes alternativas.
- **Herramienta recomendada:** **[Social Searcher](https://www.social-searcher.com/)** o el script clásico **[Sherlock (GitHub)](https://github.com/sherlock-project/sherlock)**.
- **Qué hacer:** Pedile que tome un alias conocido del objetivo (por ejemplo, el que usa en Instagram o en su correo personal antes del @) y lo procese. El sistema listará en qué otras plataformas de Internet existe exactamente ese mismo usuario.

### Paso 2: Búsqueda Inversa de Correo y Teléfono (La prueba reina)

**Objetivo:** Conocer en qué redes sociales y plataformas específicas (incluidas apps de citas o mensajería secundaria) está registrada la información de contacto real del objetivo.
- **Herramienta profesional (Pago):** **[OSINT Industries](https://osint.industries/)**.
- **Herramienta alternativa (Gratuita):** **[Epieos](https://epieos.com/)** (una opción excelente y muy limpia para arrancar en clases).
- **Qué hacer:** Al colocar el correo o el teléfono en el buscador, estas herramientas consultan los registros de servidores en tiempo real. Le van a mostrar si ese correo está atado a perfiles ocultos, cuentas secundarias de Google (pudiendo ver a veces fotos de perfil antiguas o reseñas que haya dejado en Google Maps) y si está verificado en plataformas específicas.

### Paso 3: Biometría Facial y Reconocimiento de Imágenes

**Objetivo:** Descubrir si el objetivo tiene perfiles usando fotos diferentes bajo otros nombres, o si está usando fotos de otra persona (catfishing).
- **Herramienta recomendada:** **[PimEyes](https://pimeyes.com/)** o **[FaceCheck.id](https://facecheck.id/)**.
- **Qué hacer:** Tu alumna debe subir una foto clara del rostro del objetivo. La inteligencia artificial analizará los rasgos faciales y buscará coincidencias en toda la web indexada. Si el hombre tiene perfiles en redes con alias falsos pero usó una foto suya, o si aparece en el fondo de fotos de eventos de otras personas, estas herramientas lo van a saltar.

### Paso 4: Análisis Forense de Archivos (Metadatos)

**Objetivo:** Verificar si la ubicación o la hora de una foto enviada por el objetivo coinciden con su relato (comprobar si una foto "en tiempo real" es vieja o fue tomada en otro lado).
- **Herramienta recomendada:** **[Jimpl (Metadata Viewer)](https://jimpl.com/)** o de forma local con **[ExifTool](https://exiftool.org/)**.
- **Qué hacer:** Pedile que suba una imagen original que el objetivo haya enviado (las imágenes pasadas por WhatsApp pierden metadata, pero las enviadas por mail, Telegram como archivo o links de nube la conservan). Herramientas como Jimpl extraen los datos EXIF para mostrar la fecha exacta de captura, el modelo del celular y, si la opción estaba activa, las coordenadas GPS exactas en el mapa.
