---
aliases:
  - PSO
  - Fine-Grained Password Policy
  - msDS-PasswordSettings
  - Password Settings Container
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[AD - Password Policy Enumeration]]"
---
# AD - Password Policy Enumeration - Fine-Grained Password Policies (PSO)

---

## PSO Overview

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADFineGrainedPasswordPolicy -Filter *` | Lista PSOs | Standard. |
| `Get-ADFineGrainedPasswordPolicy -Filter * -Properties *` | Atributos completos | Detail. |
| `Get-ADFineGrainedPasswordPolicySubject <pso-name>` | Quién aplica | Scope check. |
| `ldapsearch ... -b "CN=Password Settings Container,CN=System,DC=corp,DC=local" "(objectClass=msDS-PasswordSettings)"` | LDAP raw | Linux. |
| `nxc ldap <DC> -u u -p p --query "(objectClass=msDS-PasswordSettings)" "*"` | Wrapper netexec | Quick. |
^ad-pso-overview

**Container DN:** `CN=Password Settings Container,CN=System,DC=corp,DC=local`. PSOs override Default Domain Policy para users/groups específicos. Solo aplica a users (no computers). Requiere Domain Functional Level ≥2008.

```bash
ldapsearch -h <DC> -D 'corp\u' -w pass \
  -b "CN=Password Settings Container,CN=System,DC=corp,DC=local" \
  "(objectClass=msDS-PasswordSettings)" \
  cn msDS-PasswordSettingsPrecedence msDS-PSOAppliesTo
```

---

## PSO Critical Attributes

| **Atributo** | **Significado** | **Importancia** |
|:---:|:---:|:---:|
| `msDS-PasswordSettingsPrecedence` | Int — menor = mayor precedencia (resuelve conflicts) | Si user en múltiples PSOs. |
| `msDS-PasswordReversibleEncryptionEnabled` | Bool — reversible storage | CRITICAL si `True`. |
| `msDS-PasswordHistoryLength` | History count | Audit. |
| `msDS-PasswordComplexityEnabled` | Bool | Audit. |
| `msDS-MinimumPasswordLength` | Min chars | Audit. |
| `msDS-MinimumPasswordAge` / `msDS-MaximumPasswordAge` | Int64 (ticks) | Spray window. |
| `msDS-LockoutThreshold` | Int (0 = no lockout) | Spray prep. |
| `msDS-LockoutDuration` / `msDS-LockoutObservationWindow` | Int64 (ticks) | Spray pacing. |
| `msDS-PSOAppliesTo` | DN array — users/groups con PSO aplicado | Scope. |
^ad-pso-attrs

```powershell
Get-ADFineGrainedPasswordPolicy -Filter * -Properties * |
  Select Name,Precedence,
         @{n='Reversible';e={$_.ReversibleEncryptionEnabled}},
         @{n='Complexity';e={$_.ComplexityEnabled}},
         MinPasswordLength,
         LockoutThreshold,
         @{n='Applies';e={$_.AppliesTo -join '; '}}
```

---

## PSO Scope (msDS-PSOAppliesTo)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADFineGrainedPasswordPolicySubject <pso>` | Subjects directos del PSO | Scope per-PSO. |
| `Get-ADUser -Filter * -Properties msDS-ResultantPSO \| ? msDS-ResultantPSO` | Users con PSO efectivo | Effective scope. |
| `(Get-ADUser <user> -Pr msDS-ResultantPSO).'msDS-ResultantPSO'` | PSO efectivo del user | Per-user. |
^ad-pso-scope

**Resolución:**
1. PSO directo en user (mayor prioridad).
2. PSO en cualquier group del user.
3. Si múltiples → menor `Precedence` gana.
4. Tie → menor GUID.
5. Si nada → Default Domain Policy.

```powershell
# Map PSOs → users efectivos
Get-ADFineGrainedPasswordPolicy -Filter * | % {
  $pso = $_
  $pso.AppliesTo | % {
    [PSCustomObject]@{
      PSO = $pso.Name
      Precedence = $pso.Precedence
      Subject = $_
    }
  }
}
```

---

## Resultant Password Policy

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUserResultantPasswordPolicy -Identity <user>` | Policy efectivo del user (PSO o DDP) | Per-user check. |
| `Get-ADUser <user> -Pr msDS-ResultantPSO` | DN del PSO aplicado (null = DDP) | Quick check. |
| `Get-ADFineGrainedPasswordPolicy -Identity (Get-ADUser <user> -Pr msDS-ResultantPSO).'msDS-ResultantPSO'` | Detail del PSO efectivo | Compose. |
^ad-pso-resultant

```powershell
# Per-user effective policy
$u = "jsmith"
$pso = (Get-ADUser $u -Properties msDS-ResultantPSO).'msDS-ResultantPSO'

if ($pso) {
  Write-Host "$u → PSO: $pso"
  Get-ADFineGrainedPasswordPolicy -Identity $pso |
    Select MinPasswordLength,LockoutThreshold,ComplexityEnabled
} else {
  Write-Host "$u → Default Domain Policy"
  Get-ADDefaultDomainPasswordPolicy
}
```

---

## PSO Misconfigurations

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `Get-ADFineGrainedPasswordPolicy -Filter {ReversibleEncryptionEnabled -eq $true}` | PSO con reversible encryption | DCSync recovera cleartext. |
| `Get-ADFineGrainedPasswordPolicy -Filter {LockoutThreshold -eq 0}` | PSO sin lockout (spray fácil) | Critical para spray. |
| `Get-ADFineGrainedPasswordPolicy -Filter {MinPasswordLength -lt 8}` | PSO con min length débil | Audit. |
| `Get-ADFineGrainedPasswordPolicy -Filter {ComplexityEnabled -eq $false}` | Sin complejidad | Audit. |
| `Get-ADFineGrainedPasswordPolicy -Filter * -Pr AppliesTo \| ? {$_.AppliesTo -match "Domain Users"}` | PSO aplicado a `Domain Users` (afecta a todo el domain) | Wide blast. |
^ad-pso-misconfig

```powershell
# Audit comprehensive PSOs débiles
Get-ADFineGrainedPasswordPolicy -Filter * -Properties * | % {
  $issues = @()
  if ($_.ReversibleEncryptionEnabled) { $issues += "REVERSIBLE" }
  if ($_.LockoutThreshold -eq 0)      { $issues += "NO_LOCKOUT" }
  if ($_.MinPasswordLength -lt 8)     { $issues += "WEAK_LEN" }
  if (-not $_.ComplexityEnabled)      { $issues += "NO_COMPLEXITY" }
  if ($issues) {
    [PSCustomObject]@{
      PSO = $_.Name
      Precedence = $_.Precedence
      Issues = $issues -join ','
      Applies = $_.AppliesTo -join '; '
    }
  }
}
```

---

## PSO Read Permission ACL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=Password Settings Container,CN=System,DC=corp,DC=local" \| Select -Expand Access` | DACL del container | Audit read perms. |
| `(Get-Acl "AD:<pso-DN>").Access \| ? IdentityReference -notmatch "BUILTIN\|NT AUTHORITY\|Domain Admins"` | Non-default principals con access | Detect anomaly. |
| `dsacls "CN=Password Settings Container,CN=System,DC=corp,DC=local"` | Native ACL | Sin RSAT. |
^ad-pso-acl

**Default:** solo Domain Admins / Enterprise Admins / SYSTEM pueden leer PSOs. Usuarios normales sin permisos = no ven PSOs aunque les apliquen. Modificación DACL para extender visibility = audit finding.

---

## Anonymous PSO Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -b "CN=Password Settings Container,CN=System,DC=corp,DC=local" "(objectClass=msDS-PasswordSettings)"` | Anonymous attempt | Test. |
| `nxc ldap <DC> -u '' -p '' --query "(objectClass=msDS-PasswordSettings)" "*"` | Vía netexec | Quick. |
^ad-pso-anonymous

**Casi siempre bloqueado** — PSOs requieren auth. Si pega anónimo = misconfig grave.

---
