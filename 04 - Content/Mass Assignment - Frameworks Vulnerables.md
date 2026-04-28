---
aliases:
  - Rails Strong Params
  - Django ModelForm
  - Spring Autobinding
  - Laravel Fillable
  - Mongoose Strict
tags:
  - type/cheatsheet
  - vuln/mass-assignment
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Mass Assignment]]'
---
# Mass Assignment - Frameworks Vulnerables

***

## Rails

| **Pattern** | **Vulnerable** | **Notas** |
|:---:|:---:|:---:|
| `User.create(params[:user])` | Pre-Rails 4 (legacy `attr_accessible`) | Direct mass assign. |
| `User.update(params[:user])` | Same. |
| `attr_accessible` empty | Open to all attrs | Default before strong_params. |
| `attr_accessible :name, :email` | Whitelist mode (legacy) | If field missing → vulnerable. |
| `params.permit!` | Permit ALL (anti-pattern) | Direct mass assignment vulnerability. |
| `params.require(:user).permit!` | Same. |
| `params.permit(:name, :email)` | Strong params correct | Safe. |
| Missing `permit` | Forgot to filter | Common bug. |
| GitHub Rails MA (2012) | Famous case (Egor Homakov) | Historic. |
| `<<= ` accept_nested_attributes | Nested attrs allow injection | Custom logic needed. |
| `model.update_attributes(params)` | Old Rails alias | Vulnerable. |
| Devise — `:admin` flag | Common scenario | If permit incluye admin. |
| Validation skip | `model.save(validate: false)` | Validation bypass. |
| ActiveModel `attribute=` | Direct setter | If used in permit. |
^ma-fw-rails

### Rails ejemplo strong_params bypass

```ruby
# VULN — params.permit! (permit all)
def update
  @user = User.find(params[:id])
  @user.update(params[:user].permit!)  # ← BAD
end

# VULN — incomplete whitelist (forgot is_admin)
def update
  @user.update(params.require(:user).permit(:name, :email, :phone))
  # If atacante POST con is_admin → backend strips it
  # But if backend permit shows incomplete coverage of fields → bug
end

# SAFE
def user_params
  params.require(:user).permit(:name, :email, :phone)
  # is_admin nunca permitted → safe
end

# Atacante:
PATCH /users/1 con body: {"user": {"name":"x", "is_admin": true}}
```

___

## Django

| **Pattern** | **Vulnerable** | **Notas** |
|:---:|:---:|:---:|
| `Model(**request.POST.dict())` | Direct mass assign | Anti-pattern. |
| `Model.objects.create(**dict)` | Same. |
| `ModelForm.fields = '__all__'` | All model fields editable | Vulnerable. |
| `ModelForm.fields = ['name', 'email']` | Whitelist | Safe if complete. |
| `ModelForm.exclude = ['is_admin']` | Blacklist mode | Easy to forget fields. |
| `serializer.save(**validated_data)` | DRF serializer | Save uses validated, but if no validation → vulnerable. |
| DRF `ModelSerializer` con `fields = '__all__'` | Same | Vulnerable. |
| DRF `Meta.read_only_fields` | Should mark sensitive read-only | If forgotten → mass assign. |
| `instance.__dict__.update(data)` | Direct dict update | Catastrophic. |
| `setattr(instance, key, value)` loop | Manual mass assign | Vulnerable. |
| Custom views con `request.data` direct | `instance.field = request.data['field']` | Per-field — depends on validation. |
| Forms vs ModelForms | Forms validate input, but if save uses `**form.cleaned_data` direct → mass assign | Common pattern. |
| `is_staff`, `is_superuser` | Default sensitive Django fields | Always exclude. |
^ma-fw-django

___

## Spring (Java)

| **Pattern** | **Vulnerable** | **Notas** |
|:---:|:---:|:---:|
| `@RequestBody UserDTO user` | Spring autobind via Jackson | If DTO contains all fields → mass assign. |
| `@ModelAttribute User user` | Form binding | Same. |
| `BeanUtils.copyProperties(form, model)` | Copy ALL props | Anti-pattern. |
| `@JsonAutoDetect` ALL | Expose all setters | Mass assign vector. |
| Missing `@JsonIgnore` on sensitive fields | `password`, `isAdmin`, etc deserialized | Common bug. |
| `objectMapper.readerForUpdating(existing).readValue(json)` | Updates existing in-place | Mass assign on update. |
| Spring DataREST default | Default exposes all CRUD endpoints with full DTO | Heavy auto-bind. |
| `@DataBinder` no whitelist | Default permite all params | Vulnerable. |
| `WebDataBinder.setAllowedFields()` | Whitelist | Manual config. |
| `WebDataBinder.setDisallowedFields()` | Blacklist | Easy to forget. |
| Jackson polymorphic | If TypeNameHandling enabled → arbitrary class instantiation | Combine con Insecure Deserialization. |
| Lombok `@Data` | Auto-generates setters | All fields mutable. |
^ma-fw-spring

___

## Laravel (PHP)

| **Pattern** | **Vulnerable** | **Notas** |
|:---:|:---:|:---:|
| `$user->fill(request()->all())` | Mass assign | Standard. |
| `User::create(request()->all())` | Same. |
| `User::update(request()->all())` | Same. |
| `protected $fillable = []` empty | Whitelist mode but empty → nothing fillable... or full | Depends on guarded. |
| `protected $fillable = ['name','email']` | Whitelist | Safe if complete. |
| `protected $guarded = []` | Blacklist mode con empty array → ALL fillable | Vulnerable. |
| `protected $guarded = ['*']` | Block all | Safe. |
| `protected $guarded = ['id']` | Common but incomplete | Often forgets `is_admin`. |
| `forceFill()` | Bypass fillable/guarded | Direct mass assign. |
| Spatie Permission | Role assignment via `assignRole()` | Should be admin-gated. |
| Eloquent `update()` con request->all() | Default vulnerable | Standard. |
| Eloquent `firstOrCreate(['email' => $x], request()->all())` | Second array uses fill | Vulnerable. |
| Validation Rule pero no `safe()` | `$validated = $request->validate(...)` permite extra | Edge. |
^ma-fw-laravel

### Laravel ejemplo bug

```php
// VULN — guarded=[] (defaults a todo fillable)
class User extends Model {
    protected $guarded = [];  // ← BAD
}

// In controller:
public function update(Request $request, User $user) {
    $user->update($request->all());  // ← Mass assign vector
    return $user;
}

// SAFE
class User extends Model {
    protected $fillable = ['name', 'email', 'phone'];
    // is_admin never fillable → safe
}
```

___

## Mongoose / NoSQL ORMs

| **Pattern** | **Vulnerable** | **Notas** |
|:---:|:---:|:---:|
| `Schema strict: false` | All fields acceptable | Vulnerable. |
| `Schema strict: 'throw'` | Reject unknown fields | Safer. |
| `Schema strict: true` (default) | Strip unknown fields | Default safer. |
| `Model.findOneAndUpdate({_id}, req.body)` | Update completo | Body controlado. |
| `Object.assign(doc, req.body)` | Direct merge | Anti-pattern. |
| `_.merge(doc, req.body)` (lodash) | Recursive mass assign + Prototype Pollution | Combo vector. |
| `Schema.set('toJSON', ...)` | Hide fields en response — but doesn't prevent input | Output filter ≠ input filter. |
| Mongoose plugins | Plugins custom | Audit. |
| `findByIdAndUpdate(id, data, {strict: false})` | Per-call override | Vulnerable. |
| `model.set(key, value)` con loop | Direct setter | Same. |
| Sequelize `update(req.body)` | Default mass assign | Vulnerable unless `fields:[]`. |
| TypeORM `repository.merge(entity, req.body)` | Merge | Vulnerable. |
| Prisma | Schema-typed → safer | Less common vector. |
^ma-fw-mongoose

___

## GraphQL Input Types

| **Pattern** | **Vulnerable** | **Notas** |
|:---:|:---:|:---:|
| Input type con todos los fields del modelo | Atacante envía sensitive field via mutation | Standard MA. |
| `input UpdateUserInput { name, email, isAdmin }` | If `isAdmin` exposed | Direct vector. |
| Discover via introspection | `__type(name:"UpdateUserInput")` reveals fields | Easy recon. |
| Resolver: `User.update(args.input)` | Direct mass assign en resolver | Same as REST. |
| Variables injection | `{"input":{"isAdmin":true}}` | Standard. |
| Apollo type-safe but resolver not | Type system NO defends — resolver logic must filter | Per-resolver task. |
| GraphQL spec doesn't enforce | Spec agnostic — depends on implementation | Reality. |
| Combine con custom scalars | JSON / Object scalars permite arbitrary | Edge. |
| Combine con Relay | Mutations with input type follow same risk | Standard. |
| Subscriptions | Subscribe with input → server applies | Less common. |
^ma-fw-graphql

***
