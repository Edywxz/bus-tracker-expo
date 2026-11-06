#!/usr/bin/env bash
# Localiza o Android Studio / SDK / JDK no macOS e deixa o Expo pronto para rodar no emulador Android.
# Uso (no Terminal do Mac, na pasta do projeto):  bash scripts/configurar-android.sh
# Não instala nada: só procura, mostra o que achou e, se você aceitar, grava as variáveis no ~/.zshrc.
set -u

ok()   { printf "  \033[32m✔\033[0m %s\n" "$1"; }
falha(){ printf "  \033[31m✘\033[0m %s\n" "$1"; }
info() { printf "  \033[33m•\033[0m %s\n" "$1"; }

echo "1) Android Studio"
STUDIO=""
for p in "/Applications/Android Studio.app" "$HOME/Applications/Android Studio.app" "/Applications/Android Studio Preview.app"; do
  [ -d "$p" ] && STUDIO="$p" && break
done
if [ -n "$STUDIO" ]; then ok "$STUDIO"; else falha "Android Studio não encontrado em /Applications (instale em developer.android.com/studio)"; fi

echo "2) Android SDK"
SDK=""
for p in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "$HOME/Library/Android/sdk"; do
  [ -n "$p" ] && [ -d "$p/platform-tools" ] && SDK="$p" && break
done
if [ -n "$SDK" ]; then
  ok "$SDK"
  [ -x "$SDK/platform-tools/adb" ] && ok "adb: $("$SDK/platform-tools/adb" version | head -1)" || falha "adb ausente (SDK Manager → SDK Tools → Android SDK Platform-Tools)"
  [ -x "$SDK/emulator/emulator" ] && ok "emulator instalado" || falha "emulator ausente (SDK Manager → SDK Tools → Android Emulator)"
else
  falha "SDK não encontrado. Abra o Android Studio uma vez e conclua o assistente (instala o SDK em ~/Library/Android/sdk)."
fi

echo "3) Java (JDK)"
JAVA_H=""
if [ -n "$STUDIO" ] && [ -d "$STUDIO/Contents/jbr/Contents/Home" ]; then
  JAVA_H="$STUDIO/Contents/jbr/Contents/Home"; ok "JDK do Android Studio: $JAVA_H"
elif /usr/libexec/java_home -v 17 >/dev/null 2>&1; then
  JAVA_H="$(/usr/libexec/java_home -v 17)"; ok "JDK 17: $JAVA_H"
else
  falha "JDK 17+ não encontrado (o do Android Studio costuma servir)"
fi

echo "4) Emuladores (AVD)"
if [ -n "$SDK" ] && [ -x "$SDK/emulator/emulator" ]; then
  AVDS="$("$SDK/emulator/emulator" -list-avds 2>/dev/null)"
  if [ -n "$AVDS" ]; then echo "$AVDS" | while read -r a; do ok "$a"; done
  else
    falha "Nenhum emulador criado."
    info "Android Studio → More Actions → Virtual Device Manager → Create Device → Pixel (API 34 ou mais, imagem com Google APIs)."
  fi
fi

echo "5) Node / Expo"
command -v node >/dev/null && ok "node $(node -v)" || falha "node não encontrado"
[ -d node_modules ] && ok "dependências instaladas" || info "rode: npm install"

# Grava o ambiente no ~/.zshrc (bloco com marcadores; roda de novo sem duplicar).
if [ -n "$SDK" ]; then
  BEGIN="# >>> vanescolar android >>>"; END="# <<< vanescolar android <<<"
  if grep -qF "$BEGIN" "$HOME/.zshrc" 2>/dev/null; then
    ok "~/.zshrc já tem o bloco do Android (nada a gravar)"
  else
    echo
    printf "Gravar ANDROID_HOME, PATH e JAVA_HOME no ~/.zshrc? [s/N] "
    read -r R
    if [ "$R" = "s" ] || [ "$R" = "S" ]; then
      {
        echo
        echo "$BEGIN"
        echo "export ANDROID_HOME=\"$SDK\""
        echo 'export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"'
        [ -n "$JAVA_H" ] && echo "export JAVA_HOME=\"$JAVA_H\"" && echo 'export PATH="$JAVA_HOME/bin:$PATH"'
        echo "$END"
      } >> "$HOME/.zshrc"
      ok "gravado. Abra um novo Terminal (ou rode: source ~/.zshrc)"
    else
      info "ok, nada foi gravado."
    fi
  fi
fi

cat <<'MSG'

Como rodar no emulador:
  1) Abra o emulador (Android Studio → Virtual Device Manager → ▶) ou:  emulator -avd NOME_DO_AVD
  2) Na pasta do projeto:        npx expo start     e aperte  a
     (instala o Expo Go no emulador; o mapa funciona sem chave do Google no Expo Go)
  3) Build próprio (precisa da chave do Google Maps para o mapa aparecer no Android):
       GOOGLE_MAPS_ANDROID_API_KEY=sua_chave npx expo run:android
MSG
