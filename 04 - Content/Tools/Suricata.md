---
aliases:
  - IDS Rules
tags:
  - tool/suricata
  - topic/network
  - topic/detection
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SIEM Detección]]"
kind: CheatSheet
linked:
  - "[[Wireshark]]"
  - "[[Stack Tecnológico del SOC]]"
---
# Suricata

> [!abstract] TL;DR
> **NIDS/NIPS** open-source de alto rendimiento. Inspecciona tráfico (vivo o PCAP) contra reglas de firma, detecta y opcionalmente bloquea. Genera además metadata de protocolos (tipo [[Wireshark|Zeek]]) y alertas en JSON (`eve.json`) que se ingieren al SIEM.

---

## Ejecución

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `suricata -r captura.pcap -l ./out/` | Analiza un PCAP offline → `eve.json` | DFIR / triage de captura |
| `suricata -i eth0` | IDS en vivo sobre interfaz | Monitoreo de red |
| `suricata -T -c suricata.yaml` | Valida config y reglas | Antes de desplegar |
| `suricata-update` | Descarga/actualiza rulesets (ET Open) | Mantener firmas al día |
| `jq 'select(.event_type=="alert")' out/eve.json` | Filtra solo alertas del output | Revisar detecciones |
^suri-run

## Anatomía de una Regla

```
alert http $HOME_NET any -> $EXTERNAL_NET any ( \
    msg:"Posible C2 - User-Agent sospechoso"; \
    flow:established,to_server; \
    http.user_agent; content:"EvilBot"; \
    classtype:trojan-activity; sid:1000001; rev:1; \
    metadata:mitre_technique_id T1071; )
```

| **Parte** | **Qué define** |
|:---|:---|
| `alert` | Acción: `alert`, `drop` (IPS), `pass`, `reject` |
| `http ... -> ...` | Protocolo + dirección (`$HOME_NET` → `$EXTERNAL_NET`) |
| `msg` | Descripción de la alerta |
| `content` / `pcre` | Patrón a matchear (string o regex) |
| `flow` | Estado de conexión (`established,to_server`) |
| `sid` / `rev` | ID único + revisión de la regla |
^suri-regla

## Buffers Útiles

| **Buffer** | **Matchea** |
|:---|:---|
| `http.uri` / `http.host` / `http.user_agent` | Campos HTTP |
| `tls.sni` | SNI de HTTPS (dominio sin descifrar) |
| `dns.query` | Queries DNS (DGA, tunneling) |
| `file.data` | Contenido de archivos transferidos |
^suri-buffers

> Suricata cubre la detección de red que [[Wireshark]] hace manualmente, pero **automatizada y a escala**. Su `eve.json` alimenta el SIEM ([[Stack Tecnológico del SOC]]); las alertas se mapean a [[MITRE ATT&CK]] vía el campo `metadata`.
^suri-siem
