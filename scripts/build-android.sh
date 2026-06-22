#!/bin/bash
# ============================================================
# build-android.sh — Gera o APK de release do app Android
# Uso: ./scripts/build-android.sh
#
# Na primeira execução, cria a keystore automaticamente.
# Nas próximas, usa a keystore existente.
# O APK final fica em: releases/obreasy-vX.X.X.apk
# ============================================================

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── Configurar Java e Android SDK ────────────────────────
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

KEYSTORE_FILE="$ROOT/obreasy-keystore.jks"
KEYSTORE_PROPS="$ROOT/android/keystore.properties"
APK_OUTPUT="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
RELEASES_DIR="$ROOT/releases"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")

echo ""
echo "=== OBREASY Android Build ==="
echo "Versão: $VERSION"
echo ""

# ── 1. Sincronizar Capacitor ──────────────────────────────
echo "→ Sincronizando Capacitor com Android..."
npx cap sync android
echo "✓ Capacitor sincronizado"
echo ""

# ── 2. Criar keystore se não existir ─────────────────────
if [ ! -f "$KEYSTORE_FILE" ]; then
  echo "→ Keystore não encontrada. Criando agora..."
  echo "  IMPORTANTE: Guarde a senha em local seguro!"
  echo "  Sem a keystore, não é possível atualizar o app no futuro."
  echo ""

  read -s -p "  Digite uma senha para a keystore (mínimo 6 chars): " KS_PASS
  echo ""
  read -s -p "  Confirme a senha: " KS_PASS_CONFIRM
  echo ""

  if [ "$KS_PASS" != "$KS_PASS_CONFIRM" ]; then
    echo "✗ Senhas não conferem. Tente novamente."
    exit 1
  fi

  keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias obreasy \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KS_PASS" \
    -keypass "$KS_PASS" \
    -dname "CN=Obreasy, OU=Dev, O=Obreasy, L=Brasil, S=SP, C=BR"

  # Salva as propriedades para o Gradle usar
  cat > "$KEYSTORE_PROPS" <<EOF
storeFile=../obreasy-keystore.jks
storePassword=$KS_PASS
keyAlias=obreasy
keyPassword=$KS_PASS
EOF

  echo ""
  echo "✓ Keystore criada em: $KEYSTORE_FILE"
  echo "  Faça backup desse arquivo!"
  echo ""
else
  echo "✓ Keystore encontrada: $KEYSTORE_FILE"

  # Pede senha se o arquivo de props não existir
  if [ ! -f "$KEYSTORE_PROPS" ]; then
    read -s -p "  Digite a senha da keystore: " KS_PASS
    echo ""
    cat > "$KEYSTORE_PROPS" <<EOF
storeFile=../obreasy-keystore.jks
storePassword=$KS_PASS
keyAlias=obreasy
keyPassword=$KS_PASS
EOF
  fi
  echo ""
fi

# ── 3. Configurar signing no build.gradle se necessário ──
if ! grep -q "signingConfigs" "$ROOT/android/app/build.gradle"; then
  echo "→ Configurando signing no build.gradle..."

  # Adiciona signingConfig ao build.gradle
  sed -i '' '/buildTypes {/i\
\
    signingConfigs {\
        release {\
            def props = new Properties()\
            def propsFile = file("keystore.properties")\
            if (propsFile.exists()) props.load(propsFile.newDataInputStream())\
            storeFile props["storeFile"] ? file(props["storeFile"]) : null\
            storePassword props["storePassword"]\
            keyAlias props["keyAlias"]\
            keyPassword props["keyPassword"]\
        }\
    }\
' "$ROOT/android/app/build.gradle"

  sed -i '' '/minifyEnabled false/a\
            signingConfig signingConfigs.release\
' "$ROOT/android/app/build.gradle"

  echo "✓ Signing configurado"
  echo ""
fi

# ── 4. Build do APK ──────────────────────────────────────
echo "→ Gerando APK de release..."
cd "$ROOT/android"
./gradlew assembleRelease --quiet
cd "$ROOT"

# ── 5. Copiar APK para pasta releases ────────────────────
mkdir -p "$RELEASES_DIR"
DEST="$RELEASES_DIR/obreasy-v$VERSION.apk"
cp "$APK_OUTPUT" "$DEST"

echo ""
echo "=================================="
echo "✓ APK gerado com sucesso!"
echo "  $DEST"
echo "=================================="
echo ""
echo "Para instalar via USB (Android com USB debugging ativo):"
echo "  adb install \"$DEST\""
echo ""
echo "Para instalar manualmente:"
echo "  Envie o arquivo APK para o celular e abra-o."
echo ""
