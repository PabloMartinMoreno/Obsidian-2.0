---
aliases:
tags:
  - technique/discovery
  - asset/mobile
kind: Concept
linked:
---
# Android APK Reversing

> [!info]
> APK = ZIP container con DEX bytecode (Dalvik), resources, AndroidManifest.xml. Decompile a Java/Smali. Tools clave: jadx, apktool, dex2jar.

---

## Estructura APK

```
app.apk (ZIP)
├── AndroidManifest.xml      # permissions, components, intents
├── classes.dex              # bytecode Dalvik
├── classes2.dex...          # multi-dex apps
├── resources.arsc           # compiled resources
├── res/                     # XML layouts, drawables, strings
├── lib/                     # native libs por ABI (arm64, x86, etc.)
├── META-INF/                # signing certs
└── assets/                  # arbitrary files
```

---

## Workflow básico

```bash
# 1. Quick decompile + UI explore (jadx-gui)
jadx-gui app.apk

# 2. CLI decompile a Java
jadx app.apk -d jadx-out/

# 3. apktool — decompile a Smali + resources
apktool d app.apk -o apktool-out/
# Resultado: smali/ dirs + AndroidManifest.xml legible + res/ extraídos

# 4. dex2jar (legacy, complement)
d2j-dex2jar.sh app.apk
# Resulting jar abrible con JD-GUI o CFR
```

---

## AndroidManifest.xml — qué buscar

```xml
<!-- Permissions = capabilities de la app -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_CONTACTS" />

<!-- exported=true → componente accesible cross-app (vector ataque) -->
<activity android:name=".LoginActivity" android:exported="true">
<service android:name=".SyncService" android:exported="true">

<!-- debuggable=true en release → activable Frida sin root via run-as -->
<application android:debuggable="true">

<!-- allowBackup=true → adb backup permite extract data -->
<application android:allowBackup="true">

<!-- networkSecurityConfig → cleartext traffic permitido / pin override -->
<application android:networkSecurityConfig="@xml/network_security_config">
```

---

## Hunt en Java decompiled (jadx-out/)

```bash
# Credentials
grep -rIn -E 'password|api_key|secret|token' jadx-out/ --include='*.java'

# URLs / endpoints
grep -rIn -E 'http[s]?://' jadx-out/ --include='*.java' | sort -u

# Crypto keys
grep -rIn -E 'AES|DES|RSA|"[A-Za-z0-9+/]{32,}={0,2}"' jadx-out/ --include='*.java'

# Reflection / dynamic load (anti-RE)
grep -rIn 'Class.forName\|System.loadLibrary' jadx-out/ --include='*.java'

# Hardcoded paths / shared prefs
grep -rIn 'SharedPreferences\|getSharedPreferences' jadx-out/ --include='*.java'

# WebView Javascript bridges (XSS-equivalent en mobile)
grep -rIn 'addJavascriptInterface\|loadUrl' jadx-out/ --include='*.java'

# Insecure storage
grep -rIn 'MODE_WORLD_READABLE\|MODE_WORLD_WRITEABLE' jadx-out/
```

---

## Re-pack & sign

```bash
# Patch Smali manualmente
vi apktool-out/smali/com/app/MainActivity.smali

# Rebuild
apktool b apktool-out/ -o patched.apk

# Sign (require keystore)
keytool -genkeypair -keystore key.jks -alias k -keyalg RSA -keysize 2048 -validity 10000
jarsigner -keystore key.jks patched.apk k
# Or apksigner (recomendado)
apksigner sign --ks key.jks patched.apk
```

---

## Dynamic analysis

| Tool | Uso |
|---|---|
| **Frida** | Dynamic instrumentation (hook funciones runtime) |
| **Objection** | Frida wrapper para bypass de SSL pinning, bypass root detection |
| **MobSF** | Automated SAST + DAST |
| **Burp + ProxyDroid** | MITM HTTPS |
| **Drozer** | IPC fuzzing, component testing |

Frida ejemplo (bypass cert pinning):
```bash
frida -U -f com.app -l unpinning.js
```

---

## Notas Relacionadas

- [[Decompiling Java Applications]]
- [[iOS App Reversing]]
- [[Binary Analysis Fundamentals]]
