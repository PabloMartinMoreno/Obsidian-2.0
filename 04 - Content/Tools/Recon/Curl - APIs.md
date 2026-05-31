---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
kind: Sub-Command
linked:
---
# Curl - APIs

***

## Cheatsheet

| **Comando**                                                                                                                                             | **Descripción**                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `curl http://<IP>:<PORT>/api.php/city/london`                                                                                                    | Leer una entrada                              |
| `curl -s http://<IP>:<PORT>/api.php/city/ \| jq`                                                                                                 | Leer todas las entradas (formateado con `jq`) |
| `curl -X POST http://<IP>:<PORT>/api.php/city/ -d '{"city_name":"HTB_City", "country_name":"HTB"}' -H 'Content-Type: application/json'`          | Crear (agregar) una entrada                   |
| `curl -X PUT http://<IP>:<PORT>/api.php/city/london -d '{"city_name":"New_HTB_City", "country_name":"HTB"}' -H 'Content-Type: application/json'` | Actualizar (modificar) una entrada            |
| `curl -X DELETE http://<IP>:<PORT>/api.php/city/New_HTB_City`                                                                                    | Eliminar una entrada                          |
^curl-api