---
aliases:
  - "PHP"
  - "PHP Source Code Analysis"
  - "Python"
  - "Bash Source Code Analysis"
  - "Macro Inspection"
  - "Olevba"
  - Code Review
  - SAST
tags:
  - estado/completo
  - asset/source-code
  - technique/discovery
kind: Concept
linked:
  - "[[GitHub Dorking]]"
---
# Source Code Review

> [!info]
> Análisis estático de source code para identificar vulnerabilidades. Manual + assisted con linters/SAST. Disponible cuando se logra disclosure (.git exposed, decompilación) o en whitebox engagement.

***

## Patterns de hunt (grep-based)

```bash
# Credenciales hardcoded
grep -rIn -E 'password\s*=|api_key|secret\s*=|access_token|aws_[a-z]+_key' .

# SQL injection patterns
grep -rIn -E 'execute\(|query\(.*\$|cursor\.execute.*%' .

# Command injection
grep -rIn -E 'system\(|shell_exec|popen|subprocess\.call.*shell=True' .

# XXE / SSRF
grep -rIn -E 'XMLParser|DocumentBuilder|loadXML|urllib\.urlopen|requests\.get' .

# Deserialization (Python, PHP, Java, .NET)
grep -rIn -E 'p\\1ckle\\.loads|yaml\\.load[^_]|json\\.loads.*input' .
grep -rIn -E 'unserialize\(|ObjectInputStream|JsonConvert' .

# Crypto issues
grep -rIn -E 'DES|MD5|SHA1|ECB|Math\\.random|Random\\(\\)' .

# Secrets en env / config
grep -rIn 'process\\.env|os\\.environ' .
find . -name '*.env*' -o -name 'config*.yml' -o -name '.npmrc'
```

***

## Tools SAST

| Tool | Lenguajes |
|---|---|
| **Semgrep** | Multi (Python, JS, Go, Java, etc.) — rules opensource |
| **CodeQL** (GitHub) | Multi — queries SQL-like |
| **Bandit** | Python — security linter |
| **Brakeman** | Ruby on Rails |
| **phpcs-security-audit** | PHP |
| **gosec** | Go |
| **trivy fs** | Multi + dependencies |
| **truffleHog** | Secrets en repos |
| **gitleaks** | Secrets en git history |

```bash
# Semgrep quick scan
semgrep --config=p/security-audit .

# truffleHog en repo
trufflehog filesystem --directory=./repo

# gitleaks
gitleaks detect --source=./repo
```

***

## Decompiling cuando no hay source

| Lang | Tool |
|---|---|
| **.NET** | dnSpy, ILSpy, dotPeek |
| **Java** | JD-GUI, CFR, procyon |
| **Android APK** | jadx, apktool |
| **iOS IPA** | otool, class-dump, Hopper |
| **Native binaries** | Ghidra, IDA Free, radare2, Binary Ninja |

***

## Notas Relacionadas

- [[GitHub Dorking]]
- [[Fingerprinting Web Technologies]]
- [[git-dumper]]
- [[githack]]
