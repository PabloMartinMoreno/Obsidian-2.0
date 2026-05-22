---
aliases:
tags:
  - estado/completo
  - technique/discovery
kind: Concept
linked:
  - "[[Binary Analysis Fundamentals]]"
---
# Decompiling Java Applications

> [!info]
> Java compila a **bytecode** (.class files) que JVM ejecuta. JAR = ZIP con .class files. Bytecode trivialmente decompilable. Para Android (DEX), ver [[Android APK Reversing]].

***

## Tools

| Tool | Caract |
|---|---|
| **JD-GUI** | GUI viewer .class/.jar — clásico |
| **CFR** | Decompiler comandline, output muy limpio |
| **Procyon** | CLI, fork rendimiento |
| **Fernflower** | IntelliJ engine, también CLI |
| **JADX** | Soporta DEX + JAR, GUI moderna |
| **Recaf** | Edit + recompile bytecode |
| **javap** | JDK stdlib — bytecode disassembly (no decompile) |

***

## Workflow CLI

```bash
# JAR extraction
unzip app.jar -d app-extracted/

# CFR decompile (one shot)
java -jar cfr.jar app.jar --outputdir cfr-out/

# Procyon
java -jar procyon-decompiler.jar -jar app.jar -o procyon-out/

# javap bytecode (low-level)
javap -p -c -v com/example/MyClass

# jadx (ZIP + APK soporte)
jadx app.jar -d jadx-out/
```

***

## Búsqueda en source decompiled

```bash
# Tras decompile a directorio
cd cfr-out/

# Credentials hunt
grep -rIn -E 'password|api_key|secret|token' --include='*.java'

# SQL
grep -rIn 'PreparedStatement\|executeQuery\|createStatement' --include='*.java'

# Reflection / dynamic load
grep -rIn 'Class.forName\|getDeclaredMethod' --include='*.java'

# Crypto
grep -rIn 'Cipher\.getInstance\|MessageDigest' --include='*.java'

# Network
grep -rIn 'HttpURLConnection\|OkHttpClient\|Socket' --include='*.java'

# Process exec
grep -rIn 'Runtime\.getRuntime\(\)\.exec\|ProcessBuilder' --include='*.java'

# Deserialization
grep -rIn 'ObjectInputStream\|readObject' --include='*.java'
```

***

## JAR Manifest

```bash
unzip -p app.jar META-INF/MANIFEST.MF
```

Muestra Main-Class, classpath, signing. `Main-Class` indica entry point.

***

## Obfuscation

Java obfuscators:
- **ProGuard** — most popular, free
- **R8** — Android default (sucesor ProGuard)
- **DashO**
- **Zelix KlassMaster**

Deobf:
- **java-deobfuscator** (github.com/java-deobfuscator/deobfuscator)
- Recaf — manual rename via Lookup tables

***

## Bytecode editing

```bash
# Modificar in-place vía Recaf GUI
# O programmatic con ASM library

# Quick patch: cambiar byte específico
xxd app.class | head
# encontrar instruction
# patch + reZIP
```

***

## Java Web Apps (WAR)

```bash
# WAR = ZIP de webapp
unzip app.war -d war-extracted/

# Servlets en WEB-INF/classes/
# Libs en WEB-INF/lib/
# Config en WEB-INF/web.xml
```

***

## Notas Relacionadas

- [[Binary Analysis Fundamentals]]
- [[Decompiling .NET Assemblies]]
- [[Android APK Reversing]]
- [[Insecure Deserialization]]
- [[Source Code Review]]
