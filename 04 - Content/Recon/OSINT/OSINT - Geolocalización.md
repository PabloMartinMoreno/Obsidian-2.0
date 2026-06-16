---
aliases:
  - OSINT - Nacionalización
  - Geolocation
  - Geolocalización
  - Cronolocalización
tags:
  - technique/recon/passive
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
kind: CheatSheet
linked:
  - "[[OSINT]]"
  - "[[OSINT - Metadata (EXIF)]]"
  - "[[OSINT - Reverse Image Search]]"
---
# OSINT - Geolocalización

> [!info] Overview
> Deducir el lugar de una imagen por lo que se ve (las redes borran el GPS del [[OSINT - Metadata (EXIF)|EXIF]], así que casi nunca lo tenés). Razonamiento contrastado contra mapas. Metodología iterativa estilo **Bellingcat**.

---

## Pistas a buscar (de fuerte a sutil)

| **Pista** | **Qué acota** |
|:---|:---|
| Idioma / texto (carteles, patentes, comercios) | País o región |
| Arquitectura, mobiliario urbano (semáforos, postes, hidrantes, tapas de cloaca) | País — muy delatores |
| Vehículos (patentes, lado de manejo, modelos típicos) | Región |
| Naturaleza (vegetación, terreno, clima) | Latitud / bioma |
| Hitos (monumentos, montañas reconocibles) | Directo — a veces vía [[OSINT - Reverse Image Search]] |
| Sol y sombras (dirección y largo) | Orientación + hora (**cronolocalización**) |
^geo-pistas

## Herramientas de Contraste

| **Herramienta** | **Uso** |
|:---|:---|
| **Google Maps / Street View / Earth** | Confirmar el punto exacto matcheando edificios/carteles |
| **Yandex Maps** | Mejor Street View en algunas regiones |
| **Mapillary / KartaView** | Street View colaborativo donde Google no llega |
| **OpenStreetMap + Overpass Turbo** | **Consultar** el mapa por características ("estadios en esta área") |
| **SunCalc** (`suncalc.org`) | Posición del sol/sombras por fecha → estimar hora y orientación |
^geo-tools

## Metodología (Bellingcat)

1. **Inventariar** cada pista de la imagen.
2. Hipótesis de región con las pistas fuertes (idioma, patentes).
3. Acotar con secundarias (arquitectura, vegetación).
4. **Overpass Turbo** para hallar lugares candidatos con esos rasgos.
5. Confirmar con Street View / satélite (un detalle específico).
6. Cruzar sol/sombras para verificar consistencia.
^geo-metodologia

## Práctica

**GeoGuessr** (entrena leer lugares) · **Bellingcat** (desafíos y guías) · **GeoHints / Geotips** (catálogos de pistas por país: bolardos, patentes, líneas de asfalto).
^geo-practica

> [!warning] Límite
> Geolocalizar una imagen pública para **verificar** autenticidad es legítimo. Geolocalizar las fotos de una persona para saber dónde vive o está en tiempo real = vigilancia/acoso. Geolocalizamos para verificar, no para rastrear personas.
