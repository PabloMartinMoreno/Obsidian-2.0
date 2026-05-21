---
aliases:
tags:
  - type/concept
  - asset/network
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### Desarrollo de Casos de Uso de SIEM

#### ¿Qué es un Caso de Uso de SIEM?

Utilizar casos de uso de SIEM es un aspecto fundamental para elaborar una estrategia de ciberseguridad robusta, ya que permiten la identificación y detección efectiva de posibles incidentes de seguridad. Los casos de uso están diseñados para ilustrar situaciones específicas donde un producto o servicio puede aplicarse, y pueden ir desde escenarios generales, como intentos fallidos de inicio de sesión, hasta otros más complejos como la detección de un brote de ransomware.
![[Desarrollo de Casos de Uso de SIEM-1.png]]

Por ejemplo, considera una situación donde un usuario llamado Rob experimenta **10 intentos de autenticación fallidos consecutivos**. Estos eventos podrían originarse del usuario real que olvidó sus credenciales o de un actor malicioso tratando de aplicar fuerza bruta para entrar a la cuenta. En cualquier caso, estos 10 eventos se envían al sistema SIEM, el cual los **correlaciona** en un solo evento y desencadena una alerta para el equipo del SOC bajo la categoría de caso de uso de "fuerza bruta".

Basado en los datos de registro generados dentro del SIEM, el equipo del SOC es entonces responsable de tomar las acciones apropiadas. Este ejemplo demuestra solo uno de los muchos casos de uso posibles que se pueden desarrollar.

#### Ciclo de Vida del Desarrollo de Casos de Uso de SIEM

Las siguientes etapas críticas deben considerarse al desarrollar cualquier caso de uso:
![[Desarrollo de Casos de Uso de SIEM-2.png]]

1. **Requerimientos:** Comprender el propósito o la necesidad del caso de uso, señalando el escenario específico para el cual se necesita una alerta o notificación. Los requisitos pueden ser propuestos por clientes, analistas o empleados. Por ejemplo, el objetivo podría ser diseñar un caso de uso de detección para un ataque de fuerza bruta que active una alerta después de 10 fallos de inicio de sesión consecutivos en 4 minutos.
    
2. **Puntos de Datos (Data Points):** Identificar todos los puntos de datos dentro de la red donde una cuenta de usuario puede usarse para iniciar sesión. Reunir información sobre las fuentes de datos que generan logs para intentos de acceso no autorizados o fallos de inicio de sesión. Por ejemplo, los datos pueden provenir de máquinas Windows, Linux, endpoints, servidores o aplicaciones. Asegurarse de que los logs capturen detalles esenciales como usuario, marca de tiempo, origen, destino, etc.
    
3. **Validación de Logs:** Verificar y validar los logs, asegurando que contengan toda la información crucial como usuario, marca de tiempo, origen, destino, nombre de la máquina y nombre de la aplicación. Confirmar que todos los logs se reciban durante varios eventos de autenticación de usuarios para puntos de datos críticos (local, web, VPN, OWA).
    
4. **Diseño e Implementación:** Después de identificar y verificar todos los logs con diferentes puntos de datos y fuentes, comenzar a diseñar el caso de uso definiendo las condiciones bajo las cuales se debe activar una alerta. Considerar tres parámetros principales: **Condición**, **Agregación** y **Prioridad**. Por ejemplo, en un caso de uso de fuerza bruta, crear una alerta para 10 fallos en 4 minutos mientras se considera la agregación para evitar falsos positivos y establecer la prioridad basada en los privilegios del usuario objetivo.
    
5. **Documentación:** Los Procedimientos Operativos Estándar (**SOP**) detallan los procesos estándar que los analistas deben seguir al trabajar en alertas. Esto incluye condiciones, agregaciones, prioridades e información sobre otros equipos a los que los analistas deben informar actividades. El SOP también contiene la matriz de escalamiento.
    
6. **Incorporación (Onboarding):** Comenzar con la etapa de desarrollo antes de mover la alerta directamente al entorno de producción. Identificar y abordar cualquier brecha para reducir falsos positivos, luego proceder a producción.
    
7. **Actualización Periódica/Ajuste Fino (Fine-tuning):** Obtener retroalimentación regular de los analistas y mantener las reglas de correlación actualizadas mediante listas blancas (_whitelisting_). Refinar y optimizar continuamente el caso de uso para asegurar su efectividad y precisión.
    

#### Cómo Construir Casos de Uso de SIEM

- Comprender tus necesidades, riesgos y establecer alertas para monitorear todos los sistemas necesarios en consecuencia.
    
- Determinar la prioridad y el impacto, luego mapear la alerta a la **Cyber Kill Chain** o al marco **MITRE ATT&CK**.
    
- Establecer el Tiempo para Detectar (TTD) y Tiempo para Responder (TTR) para la alerta para evaluar la efectividad del SIEM y el rendimiento de los analistas.
    
- Crear un Procedimiento Operativo Estándar (SOP) para gestionar alertas.
    
- Delinear el proceso para refinar alertas basado en el monitoreo del SIEM.
    
- Desarrollar un Plan de Respuesta a Incidentes (IRP) para abordar incidentes verdaderos positivos.
    
- Establecer Acuerdos de Nivel de Servicio (SLAs) y Acuerdos de Nivel Operativo (OLAs) entre equipos.
    
- Implementar y mantener un proceso de auditoría para gestionar alertas.
    
- Crear documentación para revisar el estado de registro de máquinas o sistemas.
    
- Establecer un documento de base de conocimientos.
    

### Ejemplo 1 (Microsoft Build Engine Iniciado por una Aplicación de Office)

Ahora, exploremos un ejemplo práctico usando el **Elastic Stack** como solución SIEM para ayudar a entender cómo mapear cada uno de los puntos anteriores.
![[Desarrollo de Casos de Uso de SIEM-3.png]]

En la instantánea proporcionada (caso de uso de detección), necesitamos determinar nuestro riesgo y el objetivo de nuestros esfuerzos de monitoreo.

**MSBuild**, parte de Microsoft Build Engine, es un sistema de compilación de software que ensambla aplicaciones según su archivo de entrada XML.2 Típicamente, Microsoft Visual Studio genera el archivo de entrada, pero el marco .NET y otros compiladores también pueden compilar aplicaciones sin él. Los atacantes explotan la capacidad de MSBuild para incluir código fuente malicioso dentro de su configuración o archivo de proyecto.

Al monitorear los argumentos de línea de comandos de ejecución de procesos, es crucial investigar instancias donde un navegador web o un ejecutable de Microsoft Office inician MSBuild. Este comportamiento sospechoso sugiere una posible brecha. Una vez que se establece una línea base, las llamadas inusuales a MSBuild deberían ser fácilmente identificables y relativamente raras.

Para abordar este riesgo, creamos un caso de uso de detección en nuestra solución SIEM que monitorea instancias de MSBuild iniciadas por Excel o Word, ya que este comportamiento podría indicar una ejecución de carga útil de script malicioso.

A continuación, definamos la prioridad, el impacto y mapeemos la alerta a la cadena de muerte o marco MITRE.

Dada la inteligencia de amenazas y el riesgo anterior, esta técnica, conocida como **Living-off-the-land binaries (LoLBins)**, plantea una amenaza significativa si se detecta, lo que la convierte en una categoría de alto riesgo global. En consecuencia, le asignamos severidad **ALTA**.

Con respecto al mapeo MITRE:

- **Táctica:** Evasión de Defensa (TA0005).
    
- **Técnica:** Trusted Developer Utilities Proxy Execution (T1127).3
    
- **Sub-técnica:** MSBuild (T1127.001).4
    
- Además, ejecutar el binario MSBuild en el endpoint también cae bajo la táctica de **Ejecución (TA0002)**.
    

Para el ajuste fino de la regla, es esencial entender las condiciones que pueden activar falsos positivos. Por ejemplo, aunque el Build Engine es común entre los desarrolladores de Windows, su uso por parte de no ingenieros es inusual. Excluir nombres de procesos padres legítimos de la regla ayuda a evitar falsos positivos.

### Ejemplo 2 (MSBuild Realizando Conexiones de Red)

El Ejemplo 1 discutió un caso de uso y regla de detección de alta severidad. Ahora, examinemos un caso de uso de **severidad media** usando una solución SIEM.
![[Desarrollo de Casos de Uso de SIEM-4.png]]

En la instantánea dada, necesitamos determinar nuestro riesgo y lo que estamos tratando de monitorear.

Al igual que en el Ejemplo 1, nos estamos centrando nuevamente en el binario `MsBuild.exe`. Sin embargo, esta vez, consideramos el escenario en el cual una máquina intenta una comunicación saliente con una dirección IP remota o potencialmente maliciosa, y el proceso detrás de esa conexión es `MsBuild.exe`. Esto activaría una alarma, ya que puede indicar actividad adversaria. MsBuild es a menudo explotado por adversarios para ejecutar código y evadir la detección.

Para abordar este riesgo, necesitamos una solución de monitoreo capaz de detectar instancias donde MsBuild es responsable de conexiones salientes maliciosas.

A diferencia del ejemplo anterior, esta situación podría ocurrir siempre que `MsBuild.exe` establezca una conexión saliente. También es posible que este proceso se conecte a una dirección IP legítima, como una IP de Microsoft para actualizaciones. Por lo tanto, podríamos encontrar más falsos positivos a menos que implementemos un proceso robusto de inteligencia de amenazas. En consecuencia, deberíamos asignar a esta regla de detección una severidad **MEDIA** en lugar de ALTA.

Al igual que en el Ejemplo 1, llevar a cabo esta amenaza particular requiere que los atacantes ejecuten el binario MsBuild en el endpoint, lo cual cae bajo la táctica de **Ejecución (TA0002)**.

La mayoría de los otros puntos permanecen iguales, pero el SOP y el Plan de Respuesta a Incidentes diferirán al manejar este tipo específico de alerta. Los defensores deberán centrarse en `event.action`, dirección IP y la reputación de la IP, entre otros factores.