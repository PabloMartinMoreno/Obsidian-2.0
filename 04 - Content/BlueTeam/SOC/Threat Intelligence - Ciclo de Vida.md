---
aliases:
  - Intelligence Cycle
  - Ciclo de Inteligencia
tags:
  - topic/threat-intel
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SOC]]"
  - "[[Identificación]]"
tertiary categories:
  - "[[SOC Identificación]]"
kind: SubCheatSheet
linked:
  - "[[Threat Intelligence]]"
---
# Threat Intelligence - Ciclo de Vida

> El **Intelligence Cycle**: proceso iterativo que convierte datos crudos en inteligencia accionable. 6 fases que se retroalimentan.

---

## Las 6 Fases

| **#** | **Fase** | **Qué ocurre** |
|:---:|:---|:---|
| 1 | **Direction** | Definir requisitos: ¿qué necesita proteger la organización? ¿qué preguntas responder? |
| 2 | **Collection** | Recolectar datos crudos: feeds, OSINT, logs, honeypots, dark web, ISACs. |
| 3 | **Processing** | Normalizar y estructurar lo recolectado (deduplicar, traducir, formatear a STIX). |
| 4 | **Analysis** | Convertir datos procesados en inteligencia: contexto, correlación, evaluación de relevancia. |
| 5 | **Dissemination** | Distribuir la inteligencia al consumidor correcto en el formato correcto (ver [[Threat Intelligence - Niveles]]). |
| 6 | **Feedback** | El consumidor evalúa la utilidad → ajusta la Direction del próximo ciclo. |
^cti-ciclo

```
Direction ▶ Collection ▶ Processing ▶ Analysis ▶ Dissemination ▶ Feedback
    ▲                                                                  │
    └──────────────────────────────────────────────────────────────────┘
```

## Dato vs Información vs Inteligencia

| **Término** | **Qué es** | **Ejemplo** |
|:---|:---|:---|
| **Dato** | Hecho crudo, sin contexto | Una IP: `185.220.101.5` |
| **Información** | Dato con algo de contexto | "Esa IP apareció en nuestros logs 200 veces" |
| **Inteligencia** | Información analizada y accionable | "Es un nodo C2 de APT28; bloquearla y huntear `T1071`" |
^cti-dato-info-intel

> Solo la **inteligencia** (analizada + contextualizada + accionable) tiene valor para decidir. Un feed de IPs sin análisis es solo información.
^cti-valor
