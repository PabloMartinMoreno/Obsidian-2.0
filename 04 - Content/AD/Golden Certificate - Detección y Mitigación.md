---
aliases:
  - Golden Certificate Detection
tags:
  - technique/persistence
  - asset/active-directory
  - env/windows
  - service/ad-cs
  - topic/forensics
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Golden Certificate]]"
---
# Golden Certificate - Detección y Mitigación

> Por qué es difícil: los certs forjados se firman **offline** con la CA key → **no hay registro de emisión** en la CA. La detección se centra en el robo de la key y en el uso del cert.

---

## Detección (Blue)

| **Señal / Comando** | **Qué detecta** | **Cuándo** |
|:---|:---|:---|
| Event `4103/4104` + `crypto::` / `certipy ca -backup` en el CA host | Intento de export de la CA private key | Monitoreo del CA server. |
| Backup/export del store de la CA (`Microsoft-Windows-CertificationAuthority`) | Acceso al material de la CA | Auditar el rol CA. |
| Cert auth (Event `4768` con cert) cuyo serial **no existe** en la DB de la CA | Cert válido pero no emitido por la CA → forjado | Correlación TGT-cert vs registros de emisión. |
| `4887/4886` (cert issued/requested) ausentes para un cert en uso | Uso de cert sin emisión registrada | Indicador fuerte de Golden Cert. |
^gc-detect-hunt

## Mitigación (Defender)

| **Acción** | **Efecto** | **Cuándo** |
|:---|:---|:---|
| Proteger la CA key con **HSM** | La private key nunca es exportable por software | Hardening preventivo. |
| Restringir admin local del CA host (Tier 0) | Reduce quién puede robar la key | Principio de menor privilegio. |
| **Rotar la CA** (re-key + re-emitir) | Única forma de invalidar certs forjados existentes | Post-compromiso confirmado. |
| Strong certificate mapping (**KB5014754**) | Liga el cert al SID del solicitante → forja necesita el SID correcto | Sube la barra (no elimina). |
^gc-detect-mitigate

> [!warning] Remediación
> Si se confirmó robo de la CA key, **no alcanza con resetear passwords ni krbtgt** — hay que rotar la CA entera. Es el costo de esta persistencia.
