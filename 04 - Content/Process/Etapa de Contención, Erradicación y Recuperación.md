---
aliases:
tags:
  - type/concept
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### Etapa de Contención, Erradicación y Recuperación

Cuando la investigación está completa y hemos comprendido el tipo de incidente y el impacto en el negocio (basado en todas las pistas reunidas y la información ensamblada en la línea de tiempo), es hora de entrar en la etapa de contención para evitar que el incidente cause más daños.
![[Etapa de Contención, Erradicación y Recuperación.png]]
#### Contención

En esta etapa, tomamos medidas para prevenir la propagación del incidente. Dividimos las acciones en **contención a corto plazo** y **contención a largo plazo**. Es importante que las acciones de contención se coordinen y ejecuten en todos los sistemas simultáneamente. De lo contrario, corremos el riesgo de notificar a los atacantes que vamos tras ellos, en cuyo caso podrían cambiar sus técnicas y herramientas para persistir en el entorno.

##### Contención a Corto Plazo:

Las acciones tomadas dejan una huella mínima en los sistemas donde ocurren. Algunas de estas acciones pueden incluir:
- Colocar un sistema en una VLAN separada/aislada.
- Desconectar el cable de red del sistema(s).
- Modificar el nombre DNS del C2 (Comando y Control) del atacante hacia un sistema bajo nuestro control (_sinkholing_) o hacia uno inexistente.

Estas acciones contienen el daño y brindan tiempo para desarrollar una estrategia de remediación más concreta. Además, dado que mantenemos los sistemas inalterados (tanto como sea posible), tenemos la oportunidad de **tomar imágenes forenses y preservar evidencia** si esto no se hizo ya durante la investigación (esto también se conoce como la sub-etapa de respaldo de la etapa de contención). Si una acción de contención a corto plazo requiere apagar un sistema, debemos asegurarnos de que esto se comunique al negocio y se otorguen los permisos adecuados.

##### Contención a Largo Plazo:

Nos enfocamos en acciones y cambios persistentes. Estos pueden incluir:
- Cambiar contraseñas de usuario.
- Aplicar reglas de firewall.
- Insertar un sistema de detección de intrusos en el host (HIDS).
- Aplicar un parche del sistema.
- Apagar sistemas definitivamente.

Mientras realizamos estas actividades, debemos mantener actualizados al negocio y a las partes interesadas relevantes (_stakeholders_). Ten en cuenta que solo porque un sistema ahora esté parcheado no significa que el incidente haya terminado. La erradicación, la recuperación y las actividades posteriores al incidente aún están pendientes.

#### Erradicación

Una vez contenido el incidente, la erradicación es necesaria para eliminar tanto la causa raíz del incidente como lo que queda de él, para asegurar que el adversario esté fuera de los sistemas y la red. Algunas de las actividades en esta etapa incluyen:

- Eliminar el malware detectado de los sistemas.
- Reconstruir algunos sistemas (formateo y reinstalación).
- Restaurar otros desde copias de seguridad (_backups_).

Durante la etapa de erradicación, podemos extender las actividades de contención realizadas previamente aplicando parches adicionales que no eran requeridos de inmediato. A menudo se realizan actividades adicionales de endurecimiento del sistema (**hardening**) durante la etapa de erradicación (no solo en el sistema impactado, sino en toda la red en algunos casos).

#### Recuperación

En la etapa de recuperación, llevamos los sistemas de vuelta a su operación normal. Por supuesto, el negocio necesita verificar que un sistema esté funcionando de hecho como se espera y que contenga todos los datos necesarios. Cuando todo está verificado, estos sistemas se llevan al entorno de producción.

Todos los sistemas restaurados estarán sujetos a **un registro y monitoreo intensivo (_heavy logging and monitoring_)** después de un incidente, ya que los sistemas comprometidos tienden a ser objetivos nuevamente si el adversario recupera el acceso al entorno en un corto período de tiempo. Los eventos sospechosos típicos a monitorear son:

- Inicios de sesión inusuales (por ejemplo, cuentas de usuario o de servicio que nunca antes habían iniciado sesión allí).
- Procesos inusuales.
- Cambios en el registro en ubicaciones que generalmente son modificadas por malware.

La etapa de recuperación en algunos incidentes grandes puede llevar meses, ya que a menudo se aborda en fases. Durante las fases tempranas, el enfoque está en aumentar la seguridad general para prevenir incidentes futuros a través de "victorias rápidas" (_quick wins_) y la eliminación de vulnerabilidades fáciles (_low-hanging fruit_). Las fases posteriores se centran en cambios permanentes y a largo plazo para mantener a la organización lo más segura posible.

---

