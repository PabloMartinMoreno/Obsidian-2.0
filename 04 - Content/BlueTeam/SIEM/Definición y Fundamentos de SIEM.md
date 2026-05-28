---
aliases:
tags:
  - asset/network
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### Definición y Fundamentos de SIEM

#### ¿Qué es SIEM?

Crucial dentro del ámbito de la protección informática, la **Gestión de Información y Eventos de Seguridad** (SIEM, por sus siglas en inglés: _Security Information and Event Management_) abarca la utilización de ofertas de software y soluciones que fusionan la gestión de datos de seguridad con la supervisión de eventos de seguridad. Estos instrumentos facilitan evaluaciones en tiempo real de alertas relacionadas con la seguridad, las cuales son producidas por el hardware de red y las aplicaciones.

Las herramientas SIEM poseen una amplia gama de funcionalidades principales, tales como la **recopilación y administración de eventos de registro (logs)**, la capacidad de examinar eventos de registro y datos complementarios de varias fuentes, así como características operativas como gestión de incidentes, resúmenes visuales y documentación.

Empleando innovaciones SIEM, el personal de TI puede detectar ciberataques en el momento en que ocurren o incluso antes, mejorando así la velocidad de su respuesta durante la resolución de incidentes. En consecuencia, el SIEM juega un papel indispensable en la efectividad y supervisión continua del marco de seguridad de la información de una empresa. Sirve como la base de las tácticas de seguridad de una organización, ofreciendo un método holístico para identificar y gestionar amenazas potenciales.

#### La Evolución de la Tecnología SIEM

El acrónimo "SIEM" surgió de la colaboración de dos analistas de Gartner que sugirieron un marco de información de seguridad novedoso que integraba dos tecnologías precedentes: **Gestión de Información de Seguridad (SIM)** y **Gestión de Eventos de Seguridad (SEM)**. Esta propuesta apareció en un documento de Gartner de 2005 titulado "Mejorar la seguridad de TI a través de la gestión de vulnerabilidades".

1. **Tecnología SIM de primera generación:** Se desarrolló sobre sistemas convencionales de gestión de recopilación de logs, permitiendo el almacenamiento extendido, el examen y la generación de informes de datos de logs, al tiempo que incorporaba los logs con inteligencia de amenazas.
    
2. **Tecnología SEM de segunda generación:** Abordó los eventos de seguridad entregando consolidación, correlación y notificación de eventos de una gama de aparatos de seguridad, como software antivirus, firewalls, Sistemas de Detección de Intrusos (IDS), además de eventos divulgados directamente por autenticación, trampas SNMP, servidores y bases de datos.
    

En los años siguientes, los proveedores amalgamaron las capacidades de SIM y SEM para idear el SIEM, llevando a una nueva definición según la investigación de Gartner. Esta tecnología naciente ganó aceptación generalizada ya que ofrecía una metodología integral para detectar y gestionar amenazas, incluida la capacidad de acumular, preservar y escudinar logs y eventos de seguridad de varios orígenes.

#### ¿Cómo funciona una solución SIEM?

Los sistemas SIEM funcionan reuniendo datos de una variedad de fuentes, incluyendo PCs, dispositivos de red, servidores y más. Estos datos luego se estandarizan y consolidan para facilitar el análisis.

Las plataformas SIEM emplean expertos en seguridad que escudriñan los datos para identificar y detectar amenazas potenciales. Este procedimiento permite a las empresas localizar brechas de seguridad y examinar alertas, ofreciendo conocimientos cruciales sobre la situación de seguridad de la organización.

Las **alertas** notifican al personal de Operaciones de Seguridad/Monitoreo que deben investigar un (posible) evento o incidente de seguridad. Estas notificaciones suelen ser concisas e informan al personal de un ataque específico dirigido a los sistemas de información de la organización. Las alertas pueden transmitirse a través de múltiples canales, como correos electrónicos, mensajes emergentes en consola, mensajes de texto o llamadas telefónicas a teléfonos inteligentes.

Los sistemas SIEM generan una gran cantidad de alertas debido al volumen sustancial de eventos producidos por cada plataforma monitoreada. No es inusual que un registro horario de eventos oscile entre cientos y miles. Como resultado, **ajustar el SIEM** (_fine-tuning_) para detectar y alertar sobre eventos de alto riesgo es crucial.

La capacidad de identificar con precisión eventos de alto riesgo es lo que distingue al SIEM de otras herramientas de monitoreo y detección de redes, como los Sistemas de Prevención de Intrusos (IPS) o los Sistemas de Detección de Intrusos (IDS). El SIEM no suplanta las capacidades de registro de estos dispositivos; más bien, opera junto con ellos procesando y amalgamando sus datos de registro para reconocer eventos que podrían conducir potencialmente a la explotación del sistema. Al integrar datos de numerosas fuentes, las soluciones SIEM ofrecen una estrategia holística para la detección y gestión de amenazas.

### Requisitos de Negocio y Casos de Uso de SIEM

#### Agregación y Normalización de Logs

La importancia de la visibilidad de amenazas a través de la consolidación de logs ofrecida por los sistemas SIEM no puede subestimarse. En su ausencia, la ciberseguridad de una organización tiene tanto valor como un simple pisapapeles. La consolidación de logs implica reunir terabytes de información de seguridad de firewalls vitales, bases de datos confidenciales y aplicaciones esenciales. Este proceso faculta al equipo del SOC para examinar los datos y discernir conexiones, mejorando significativamente la visibilidad de amenazas.

Utilizando la consolidación de logs del SIEM, el equipo del SOC puede identificar y escudriñar incidentes y eventos de seguridad en toda la infraestructura de TI de la organización. Al centralizar y correlacionar información de varias fuentes, el SIEM ofrece una estrategia holística.

#### Alerta de Amenazas

Tener una solución SIEM que pueda identificar y notificar a los equipos de seguridad de TI sobre posibles amenazas dentro del vasto volumen de datos de eventos de seguridad recopilados es esencial. Esta característica es crítica ya que permite al equipo de seguridad de TI llevar a cabo investigaciones más rápidas y específicas y responder a incidentes de seguridad potenciales de manera oportuna y eficiente.

Las soluciones SIEM emplean análisis avanzado e inteligencia de amenazas para reconocer amenazas potenciales y generar alertas en tiempo real.

#### Contextualización y Respuesta

Es importante entender que simplemente generar alertas no es suficiente. Si una solución SIEM envía alertas por cada posible evento de seguridad, el equipo de seguridad de TI pronto se verá abrumado por el mero volumen de alertas, y los **falsos positivos** pueden convertirse en un problema frecuente. Como resultado, la **contextualización de amenazas** es crucial para clasificar las alertas, determinando los actores involucrados en el evento de seguridad, las partes afectadas de la red y el momento.

La contextualización permite a los equipos identificar amenazas potenciales genuinas y actuar rápidamente. Una solución SIEM ideal debería permitir a una empresa gestionar amenazas directamente, a menudo deteniendo operaciones mientras se realizan las investigaciones.

#### Cumplimiento (Compliance)

Las soluciones SIEM juegan un papel significativo en el cumplimiento al ayudar a las organizaciones a cumplir con los requisitos regulatorios. Regulaciones como **PCI DSS, HIPAA y GDPR** exigen a las organizaciones implementar medidas de seguridad robustas, incluido el monitoreo y análisis en tiempo real del tráfico de red.

Las soluciones SIEM también proporcionan capacidades automatizadas de informes y auditoría, permitiendo a las organizaciones producir informes de cumplimiento de manera rápida y precisa para auditores y reguladores.

### Flujos de Datos Dentro de un SIEM

Veamos brevemente cómo viajan los datos dentro de un SIEM hasta que están listos para el análisis.

1. **Ingesta:** Las soluciones SIEM ingieren logs de varias fuentes de datos. Este proceso se conoce como ingesta de datos o recopilación de datos.
    
2. **Procesamiento y Normalización:** Los datos reunidos se procesan y normalizan para ser entendidos por el motor de correlación del SIEM. Los datos crudos (_raw data_) deben convertirse a un formato común desde varios tipos de conjuntos de datos.
    
3. **Análisis:** Finalmente, la parte más crucial, donde los equipos del SOC utilizan los datos normalizados para crear varias reglas de detección, tableros (_dashboards_), visualizaciones, alertas e incidentes.
    

### ¿Cuáles son los Beneficios de Usar una Solución SIEM?

Es evidente que las ventajas de desplegar un sistema SIEM superan significativamente los riesgos potenciales asociados con no tener uno.

En ausencia de un SIEM, el personal de TI no tendría una perspectiva centralizada de todos los logs y eventos, lo que podría resultar en pasar por alto eventos cruciales. Por el contrario, un SIEM debidamente calibrado refuerza el proceso de respuesta a incidentes, mejorando la eficiencia y ofreciendo un tablero centralizado.

- **Ejemplo:** Si un firewall registra cinco intentos de inicio de sesión incorrectos sucesivos, resultando en el bloqueo de la cuenta de administrador, es necesario un sistema de registro centralizado que correlacione todos los logs para monitorear la situación. De manera similar, un software de filtrado web que registra una computadora conectándose a un sitio web malicioso 100 veces en una hora puede ser visto y actuado dentro de una sola interfaz usando un SIEM.
    

Los SIEM contemporáneos a menudo incluyen inteligencia incorporada capaz de detectar límites de umbral configurables y eventos dentro de plazos específicos. Los SIEM más sofisticados ahora están integrando **Inteligencia Artificial (IA)** para notificar basándose en análisis de comportamiento y patrones.

Esta inteligencia puede reducir los gastos asociados con una brecha de seguridad a gran escala, ahorrando a las organizaciones un daño financiero y reputacional significativo. Numerosas organizaciones reguladas (Banca, Finanzas, Seguros, Salud) tienen el mandato de tener un SIEM gestionado, ya sea en las instalaciones (_on-premise_) o en la nube.