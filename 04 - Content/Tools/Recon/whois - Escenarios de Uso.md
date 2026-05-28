---
aliases:
tags:
  - technique/recon/passive
kind: Concept
linked:
  - "[[whois]]"
---

# whois - Escenarios de Uso

___

## Escenario 1: Investigación de phishing

Un gateway de seguridad de correo marca un email sospechoso enviado a varios empleados de una empresa. El correo afirma ser del banco de la compañía y urge a los destinatarios a hacer clic en un enlace para actualizar la información de su cuenta.  
Un analista de seguridad investiga el correo y comienza realizando una consulta WHOIS sobre el dominio incluido en el mensaje.

El registro WHOIS revela lo siguiente:

- **Fecha de registro:** el dominio fue registrado hace apenas unos días.
- **Registrante:** la información del registrante está oculta detrás de un servicio de privacidad.
- **Servidores de nombres:** los servidores de nombres están asociados a un proveedor de hosting “bulletproof” conocido, frecuentemente utilizado para actividades maliciosas.

Esta combinación de factores levanta importantes banderas rojas para el analista. La fecha de registro reciente, la información del registrante oculta y el hosting sospechoso sugieren fuertemente una campaña de phishing.  
El analista alerta de inmediato al departamento de TI de la empresa para que bloquee el dominio y advierte a los empleados sobre la estafa.

Una investigación adicional sobre el proveedor de hosting y las direcciones IP asociadas puede descubrir dominios de phishing adicionales o infraestructura que el actor de la amenaza utiliza.

## Escenario 2: Análisis de malware

Un investigador de seguridad está analizando una nueva cepa de malware que ha infectado varios sistemas dentro de una red. El malware se comunica con un servidor remoto para recibir comandos y exfiltrar datos robados.  
Para obtener información sobre la infraestructura del actor de la amenaza, el investigador realiza una consulta WHOIS sobre el dominio asociado al servidor de comando y control (C2).

El registro WHOIS revela:
- **Registrante:** el dominio está registrado a nombre de una persona que usa un servicio de correo gratuito conocido por ofrecer anonimato.
- **Ubicación:** la dirección del registrante está en un país con alta prevalencia de ciberdelitos.
- **Registrador:** el dominio fue registrado a través de un registrador con historial de políticas de abuso poco estrictas.

Basándose en esta información, el investigador concluye que el servidor C2 probablemente está alojado en un servidor comprometido o “bulletproof”.  
Luego, usa los datos WHOIS para identificar al proveedor de hosting y notificarle sobre la actividad maliciosa.

## Escenario 3: Informe de inteligencia de amenazas

Una firma de ciberseguridad rastrea las actividades de un grupo de actores de amenazas sofisticado conocido por atacar instituciones financieras.  
Los analistas recopilan datos WHOIS de múltiples dominios asociados con las campañas previas del grupo para elaborar un informe integral de inteligencia de amenazas.

Al analizar los registros WHOIS, los analistas descubren los siguientes patrones:
- **Fechas de registro:** los dominios se registraron en grupos, a menudo poco antes de los ataques principales.
- **Registrantes:** los registrantes utilizan varios alias e identidades falsas.
- **Servidores de nombres:** los dominios comparten con frecuencia los mismos servidores de nombres, lo que sugiere una infraestructura común.
- **Historial de bajas:** muchos dominios fueron dados de baja tras los ataques, lo que indica intervenciones previas de las fuerzas de seguridad o de equipos de respuesta.

Estos hallazgos permiten a los analistas crear un perfil detallado de las tácticas, técnicas y procedimientos (TTP) del grupo.  
El informe incluye indicadores de compromiso (IOC) basados en los datos WHOIS, que otras organizaciones pueden usar para detectar y bloquear futuros ataques.
