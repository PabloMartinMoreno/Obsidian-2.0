---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
---

### Definición y Fundamentos del SOC

#### ¿Qué es un SOC?

Un **Centro de Operaciones de Seguridad** (SOC, por sus siglas en inglés: _Security Operations Center_) es una instalación esencial que alberga a un equipo de expertos en seguridad de la información responsables de monitorear y evaluar continuamente el estado de seguridad de una organización.1 El objetivo principal de un equipo SOC es identificar, examinar y abordar incidentes de ciberseguridad empleando una combinación de soluciones tecnológicas y un conjunto integral de procedimientos.

El equipo del SOC generalmente consta de analistas de seguridad competentes, ingenieros y gerentes que supervisan las operaciones de seguridad. Colaboran estrechamente con los equipos de respuesta a incidentes de la organización para garantizar que los problemas de seguridad se detecten y resuelvan rápidamente.

El equipo del SOC utiliza varias soluciones tecnológicas, como sistemas de **Gestión de Información y Eventos de Seguridad (SIEM)**, **Sistemas de Detección y Prevención de Intrusiones (IDS/IPS)** y herramientas de **Detección y Respuesta en Endpoints (EDR)**, para monitorear e identificar amenazas de seguridad.2 También hacen uso de inteligencia de amenazas (_threat intelligence_) y participan en iniciativas de búsqueda de amenazas (_threat hunting_) para detectar proactivamente amenazas y vulnerabilidades potenciales.3

Además de emplear soluciones tecnológicas, el equipo del SOC sigue una serie de procesos bien definidos para abordar incidentes de seguridad.4 Estos procesos abarcan el triaje de incidentes, la contención, la eliminación y la recuperación. El equipo del SOC coopera estrechamente con el equipo de respuesta a incidentes para garantizar el manejo adecuado de los incidentes de seguridad, salvaguardando la postura de seguridad de la organización.5

En resumen, un SOC es un elemento vital del enfoque de ciberseguridad de una organización. Ofrece capacidades continuas de monitoreo y respuesta, permitiendo a las organizaciones detectar y abordar rápidamente incidentes de seguridad, minimizando las consecuencias de una brecha de seguridad y disminuyendo la probabilidad de ataques futuros.6

#### ¿Cómo funciona un SOC?

La función principal del equipo del SOC es gestionar el aspecto operativo continuo de la seguridad de la información empresarial, en lugar de concentrarse en el desarrollo de estrategias de seguridad, el diseño de la arquitectura de seguridad o la implementación de medidas de protección.

El equipo del SOC consiste principalmente en analistas de seguridad que trabajan colectivamente para detectar, evaluar, responder, informar y prevenir incidentes de ciberseguridad.7

Además de las responsabilidades principales de un equipo SOC, algunos SOCs pueden poseer capacidades avanzadas como análisis forense y análisis de malware. Estas habilidades permiten al equipo del SOC realizar investigaciones en profundidad de incidentes de seguridad y examinar la causa raíz del incidente para evitar ataques futuros.8

Como se mencionó anteriormente, el equipo del SOC también colabora estrechamente con el equipo de respuesta a incidentes para garantizar el manejo adecuado de los incidentes de seguridad y la preservación de la postura de seguridad de la organización.9

### Roles dentro de un SOC

Un equipo SOC consta de diversos roles responsables de manejar el aspecto operativo continuo de la seguridad de la información empresarial.10 Estos roles pueden abarcar:

- **Director del SOC:** Responsable de la gestión general y la planificación estratégica del SOC, incluyendo presupuestos, dotación de personal y alineación con los objetivos de seguridad de la organización.
    
- **Gerente del SOC:** Supervisa las operaciones diarias, gestiona el equipo, coordina los esfuerzos de respuesta a incidentes y garantiza una colaboración fluida con otros departamentos.
    
- **Analista Nivel 1 (Tier 1):** Monitorea alertas y eventos de seguridad, realiza el triaje de posibles incidentes y los escala a niveles superiores para una investigación adicional.
    
- **Analista Nivel 2 (Tier 2):** Realiza análisis en profundidad de incidentes escalados, identifica patrones y tendencias, y desarrolla estrategias de mitigación para abordar amenazas de seguridad.
    
- **Analista Nivel 3 (Tier 3):** Proporciona experiencia avanzada en el manejo de incidentes de seguridad complejos, realiza actividades de _threat hunting_ y colabora con otros equipos para mejorar la postura de seguridad de la organización.11
    
- **Ingeniero de Detección:** Responsable de desarrollar, implementar y mantener reglas de detección y firmas para herramientas de monitoreo de seguridad (SIEM, IDS/IPS, EDR). Trabajan de cerca con analistas para identificar brechas en la cobertura de detección.
    
- **Respondedor de Incidentes (Incident Responder):** Se hace cargo de incidentes de seguridad activos, lleva a cabo análisis forenses digitales en profundidad y esfuerzos de contención y remediación.12
    
- **Analista de Inteligencia de Amenazas:** Recopila, analiza y difunde datos de inteligencia de amenazas para ayudar al equipo a comprender mejor el panorama de amenazas.13
    
- **Ingeniero de Seguridad:** Desarrolla, despliega y mantiene herramientas, tecnologías e infraestructura de seguridad.
    
- **Especialista en Cumplimiento y Gobernanza:** Asegura que las prácticas de seguridad se adhieran a los estándares y regulaciones relevantes.
    
- **Coordinador de Concientización y Capacitación en Seguridad:** Desarrolla programas para educar a los empleados sobre las mejores prácticas de ciberseguridad.
    

Es importante tener en cuenta que los roles y responsabilidades específicos dentro de cada nivel pueden variar según el tamaño de la organización, la industria y los requisitos de seguridad específicos.

En general, la estructura por niveles se puede describir de la siguiente manera:

- **Analistas Nivel 1:** También conocidos como "primeros respondedores", su objetivo principal es identificar y priorizar rápidamente los incidentes de seguridad.
    
- **Analistas Nivel 2:** Más experimentados, realizan análisis más profundos, desarrollan estrategias de mitigación y ajustan las herramientas de monitoreo para reducir falsos positivos.14
    
- **Analistas Nivel 3:** Los analistas más experimentados, manejan los incidentes más complejos y de alto perfil, realizan caza de amenazas proactiva y desarrollan estrategias avanzadas de prevención.
    

### Etapas del SOC

Los Centros de Operaciones de Seguridad (SOCs) han evolucionado significativamente desde sus primeros días.

1. **SOC 1.0 (Primera Generación):**
    
    - Enfoque principal en seguridad de red y perimetral.
        
    - Organizaciones invirtieron en capas de seguridad aisladas (plataformas de inteligencia, gestión de identidad) sin integración adecuada.
        
    - Resultó en alertas no correlacionadas y acumulación de tareas.
        
    - Algunas organizaciones todavía dependen de este enfoque obsoleto.
        
2. **SOC 2.0 (Segunda Generación):**
    
    - Impulsado por amenazas sofisticadas (ataques multivectoriales, persistentes, asincrónicos).
        
    - Malware móvil y botnets como métodos de entrega principales.
        
    - Se basa en la inteligencia: integra telemetría de seguridad, inteligencia de amenazas, análisis de flujo de red y detección de anomalías.15
        
    - Emplea análisis de capa 7 para identificar ataques lentos y ocultos.
        
    - Énfasis en la conciencia situacional completa, preparación previa al evento (gestión de vulnerabilidades) y análisis posterior al evento (forense).16
        
3. **SOC Cognitivo (Next-Generation SOC):**
    
    - Busca abordar las deficiencias del SOC 2.0, como la falta de experiencia operativa y la colaboración ineficaz entre equipos de negocio y seguridad.
        
    - Incorpora **sistemas de aprendizaje** que compensan las brechas de experiencia en la toma de decisiones de seguridad.
        
    - Apunta a crear reglas que detecten amenazas específicas a los procesos y sistemas empresariales.
        

---

