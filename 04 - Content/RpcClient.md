---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# RpcClient

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`rpcclient -U "" -N <target>`|Conecta al servidor SMB **sin autenticación**, si está permitido.|
|`rpcclient -U "<user>" <target>`|Conecta al servidor SMB con **autenticación**.|
|`srvinfo`|Recupera información sobre el servidor SMB objetivo.|
|`enumdomains`|Enumera todos los **dominios** desplegados en la red.|
|`querydominfo`|Proporciona información detallada sobre el **dominio**, el servidor y los usuarios en la red.|
|`netshareenumall`|Lista todos los **shares** disponibles en el servidor SMB.|
|`netsharegetinfo <share>`|Recupera información sobre un **share** SMB específico.|
|`enumdomusers`|Enumera todos los usuarios de dominio y sus RIDs asociados (p. ej., `user[:<username>] rid:[<rid>]`).|
|`queryuser <User_RID>`|Proporciona información detallada sobre un usuario específico basado en su **RID**.|
|`querygroup <Group_RID>`|Recupera información detallada sobre un grupo específico basado en su **RID**.|

## Overview

***RPCclient** es una herramienta de línea de comandos que permite la interacción con el servicio de **Remote Procedure Call (RPC)** de un sistema Windows, específicamente a través del protocolo **SMB**.*

Forma parte de la suite **Samba** y se usa frecuentemente en pruebas de penetración y diagnósticos de red para consultar sistemas basados en Windows y obtener distintos tipos de información.

*Esta herramienta puede utilizarse para **enumerar** diversos aspectos de una red SMB, como **shares disponibles**, información de dominios y cuentas de usuarios o grupos.*