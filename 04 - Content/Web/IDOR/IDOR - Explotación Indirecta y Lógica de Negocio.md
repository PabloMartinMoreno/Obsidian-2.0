---
aliases:
tags:
  - type/technique
  - vuln/idor
  - technique/discovery
  - asset/api
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[BOLA - IDOR]]"
---
# IDOR - Explotación Indirecta y Lógica de Negocio

***

## Cheatsheet

| **Técnica**                                                  | **Descripción**                                                                                                                                                                                  | **Escenario de Uso (Ejemplo)**                                                                        | **Consecuencia Esperada**                                                                                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br><br>**Blind IDOR (IDOR Ciego)**                          | <br>Modificación de un identificador que desencadena una acción en el backend sin reflejar datos en la respuesta. Requiere interacción fuera de banda ([[OAST]]) o comprobación lateral.<br><br> | <br>`POST /api/send_receipt` con `{"user_id": 106}`. No se muestran datos en la respuesta HTTP.       | <br>El sistema envía por correo electrónico información confidencial del usuario 106 a la dirección del atacante (si también se manipuló el email), o ejecuta una acción destructiva de forma silenciosa. |
| <br><br>**IDOR de Segunda Orden (Stored IDOR)**              | <br>El identificador manipulado se guarda de forma persistente en una petición inicial permitida, pero se utiliza de forma insegura en una función posterior o por otro microservicio.<br><br>   | <br>Actualizar perfil: `{"linked_account": 106}`. Posteriormente, ejecutar `GET /export_linked_data`. | <br>La función de exportación confía en el identificador almacenado previamente sin revalidar la autorización en el momento de la ejecución.                                                              |
| <br><br>**Manipulación de Estado o Flujo**                   | <br>Alteración del identificador de un objeto no humano (como una transacción, una orden o un ticket) para forzar un cambio de estado no autorizado.<br><br>                                     | <br>Cambiar el estado de una orden: `PUT /order/105/status` a `PUT /order/106/status`.                | <br>Confirmar, cancelar o modificar el pago de la orden de otro usuario, alterando el flujo comercial de la plataforma.                                                                                   |
| <br>**Escalada de Privilegios Vertical**                     | <br>Cambio del identificador que vincula a un usuario con un grupo, rol o entidad organizativa, permitiendo adquirir permisos administrativos.<br><br>                                           | <br>`POST /join_team` con `{"team_id": "admin_group"}` o `{"role_id": 1}`.                            | <br>El usuario adquiere capacidades superiores al asociarse ilícitamente con un grupo privilegiado mediante la alteración de su identificador.                                                            |
| <br>**Derivación Multi-Fase (Multi-Step Bypass)**            | <br>Reemplazar el identificador en un paso intermedio de un flujo complejo asumiendo que el backend solo validó la autorización en el primer paso.<br><br>                                       | <br>En el paso 3 de pago: `POST /checkout/step3` enviando `cart_id=106`.                              | <br>Procesar los artículos de la cesta de otro usuario o transferir el estado de validación propio a un objeto ajeno.                                                                                     |
| <br>**IDOR en Funciones de Exportación / Tareas Asíncronas** | <br>Solicitud de generación de reportes (PDF, CSV) referenciando el identificador de la cuenta de una víctima. Generalmente procesado por colas de trabajo en segundo plano.<br><br>             | <br><br>`POST /generate_report` con `{"account_id": 106}`.                                            | <br><br>El reporte se genera con datos de un tercero y queda disponible en la bandeja de descargas del atacante (ej. `GET /downloads/latest.pdf`).                                                        |
^idor-indirecta

## Estrategias de Evaluación y Testing

Para descubrir estas vulnerabilidades complejas en la arquitectura subyacente y la lógica de la aplicación, el enfoque debe trascender la simple observación de respuestas inmediatas:
- Mapear exhaustivamente los flujos de trabajo de múltiples pasos (ej. registro, pago, recuperación de contraseñas, _wizards_) e identificar en qué momento específico se vinculan los identificadores de sesión con los identificadores de objetos.
- Monitorear activamente los efectos secundarios y cambios de estado. Al enviar un _payload_ de alteración de ID, es imperativo revisar otras áreas de la aplicación (bandeja de entrada, registros de actividad, colas de descargas) para comprobar si la acción tuvo éxito de forma silenciosa.
- Integrar pruebas de concurrencia y condiciones de carrera ([[Race Conditions]]), evaluando si la manipulación rápida de un ID entre la fase de validación de un flujo y su fase de ejecución final puede generar estados inconsistentes o evadir el [[Control de Acceso]].

### Principios de Mitigación

La defensa contra el IDOR indirecto y las fallas de lógica de negocio requiere un diseño de software basado en un estado inmutable y validaciones ubicuas:
- Implementar un modelo de validación independiente donde cada microservicio, _job_ asíncrono o paso de un flujo de trabajo revalide de manera autónoma la autorización del usuario sobre el objeto afectado, sin heredar la confianza de validaciones previas.
- Mantener el estado de los procesos de múltiples pasos íntegramente en el lado del servidor. El estado debe estar fuertemente acoplado al token de sesión del usuario, evitando delegar en el cliente la transmisión de identificadores para mantener la continuidad del flujo.
- Requerir referencias indirectas u _one-time tokens_ (Tokens de un solo uso) para funciones críticas como exportaciones masivas o cambios de roles, neutralizando la capacidad de predecir o manipular identificadores de bases de datos directas.


***
