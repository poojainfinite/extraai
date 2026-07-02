#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  ExtraAI — Termux Ubuntu Setup Automation
#  ─────────────────────────────────────────────────────────────────
#  Yeh script Termux mein automatically Ubuntu + Android SDK + Bubblewrap
#  install karta hai — ARM64 verified working method.
#
#  USAGE:
#    STAGE 1 (Termux mein): bash termux-setup-ubuntu.sh init
#    STAGE 2 (Ubuntu mein):  bash termux-setup-ubuntu.sh sdk
#    STAGE 3 (Ubuntu mein):  bash termux-setup-ubuntu.sh build <VERCEL_URL>
# ═══════════════════════════════════════════════════════════════════

set -e

STAGE="${1:-help}"

# Colors
P='\033[1;35m'  # Pink
C='\033[1;36m'  # Cyan
G='\033[1;32m'  # Green
Y='\033[1;33m'  # Yellow
R='\033[1;31m'  # Red
N='\033[0m'     # Reset

banner() {
  echo -e "${P}"
  echo "  ╔══════════════════════════════════════════════╗"
  echo "  ║      ✨ ExtraAI Termux Build Wizard ✨      ║"
  echo "  ║      ARM64 Verified Method                   ║"
  echo "  ╚══════════════════════════════════════════════╝"
  echo -e "${N}"
}

show_help() {
  banner
  echo -e "${C}Usage:${N}"
  echo ""
  echo -e "  ${Y}Stage 1 (in Termux):${N}"
  echo -e "    ${G}bash termux-setup-ubuntu.sh init${N}"
  echo -e "    → Installs proot-distro + Ubuntu"
  echo ""
  echo -e "  ${Y}Stage 2 (in Ubuntu after login):${N}"
  echo -e "    ${G}proot-distro login ubuntu${N}"
  echo -e "    ${G}bash /path/to/termux-setup-ubuntu.sh sdk${N}"
  echo -e "    → Installs Java, SDK, Node, Bubblewrap"
  echo ""
  echo -e "  ${Y}Stage 3 (in Ubuntu):${N}"
  echo -e "    ${G}bash /path/to/termux-setup-ubuntu.sh build https://your.vercel.app${N}"
  echo -e "    → Builds signed AAB + APK"
  echo ""
  echo -e "  ${Y}Verify (in Ubuntu):${N}"
  echo -e "    ${G}bash /path/to/termux-setup-ubuntu.sh verify${N}"
  echo ""
}

# ─────────────────────────────────────────────
# Stage 1: Termux (install Ubuntu)
# ─────────────────────────────────────────────
stage_init() {
  banner
  echo -e "${C}[Stage 1] Installing Ubuntu in Termux...${N}"
  echo ""

  if [ -d "/data/data/com.termux" ]; then
    echo -e "${G}✓ Termux detected${N}"
  else
    echo -e "${R}✗ Yeh Termux mein chalao, Ubuntu mein nahi${N}"
    exit 1
  fi

  echo -e "${C}Updating packages...${N}"
  pkg update -y
  pkg upgrade -y

  echo -e "${C}Installing prerequisites...${N}"
  pkg install -y proot-distro termux-api

  echo -e "${C}Setting up storage access...${N}"
  termux-setup-storage

  echo -e "${C}Installing Ubuntu (yeh 15-20 min lag sakta hai)...${N}"
  proot-distro install ubuntu || echo -e "${Y}(Ubuntu already installed — OK)${N}"

  echo ""
  echo -e "${G}"
  echo "  ✅ STAGE 1 COMPLETE!"
  echo -e "${N}"
  echo -e "${C}Ab yeh commands chalao:${N}"
  echo -e "  ${G}proot-distro login ubuntu${N}"
  echo -e "  ${G}bash $(pwd)/termux-setup-ubuntu.sh sdk${N}"
  echo ""
}

# ─────────────────────────────────────────────
# Stage 2: Ubuntu (install Java, SDK, Node, Bubblewrap)
# ─────────────────────────────────────────────
stage_sdk() {
  banner
  echo -e "${C}[Stage 2] Installing Java + Android SDK + Bubblewrap...${N}"
  echo ""

  if [ -f "/etc/os-release" ] && grep -q "Ubuntu" /etc/os-release; then
    echo -e "${G}✓ Ubuntu environment detected${N}"
  else
    echo -e "${R}✗ Yeh Ubuntu mein chalao (proot-distro login ubuntu ke baad)${N}"
    exit 1
  fi

  # Update
  apt update -y
  apt upgrade -y

  # Essential
  echo -e "${C}Installing essential packages...${N}"
  apt install -y \
    openjdk-17-jdk \
    wget unzip git curl nano zip \
    aapt build-essential

  # Node.js 20
  echo -e "${C}Installing Node.js 20...${N}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs

  # Verify
  echo ""
  echo -e "${C}Verifying installations:${N}"
  java -version 2>&1 | head -1
  echo "Node: $(node --version)"
  echo "npm: $(npm --version)"
  echo -n "aapt2 arch: "
  file /usr/bin/aapt2 | grep -o 'ARM aarch64\|x86-64' || echo "unknown"

  # Android SDK
  echo ""
  echo -e "${C}Downloading Android SDK command-line tools...${N}"
  cd ~
  if [ ! -d "android-sdk/cmdline-tools/latest" ]; then
    wget -q --show-progress \
      https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
      -O sdk-tools.zip
    unzip -q sdk-tools.zip
    mkdir -p android-sdk/cmdline-tools
    mv cmdline-tools android-sdk/cmdline-tools/latest
    rm sdk-tools.zip
  fi

  # Environment variables (persistent)
  echo -e "${C}Setting up environment variables...${N}"
  if ! grep -q "ANDROID_HOME" ~/.bashrc; then
    cat >> ~/.bashrc << 'EOF'

# ExtraAI: Android build environment
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64
export PATH=$JAVA_HOME/bin:$PATH
EOF
  fi

  # Apply
  export ANDROID_HOME=$HOME/android-sdk
  export ANDROID_SDK_ROOT=$HOME/android-sdk
  export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64
  export PATH=$JAVA_HOME/bin:$PATH

  # Accept licenses
  echo -e "${C}Accepting SDK licenses...${N}"
  yes | sdkmanager --licenses > /dev/null 2>&1

  # Install SDK components
  echo -e "${C}Installing SDK components (500 MB+, wait please)...${N}"
  sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

  # Bubblewrap
  echo -e "${C}Installing Bubblewrap globally...${N}"
  npm install -g @bubblewrap/cli

  # Verify
  echo ""
  echo -e "${C}Final verification:${N}"
  bubblewrap --version && echo -e "${G}✓ Bubblewrap OK${N}"

  echo ""
  echo -e "${G}"
  echo "  ✅ STAGE 2 COMPLETE!"
  echo -e "${N}"
  echo -e "${C}Ab AAB build karें:${N}"
  echo -e "  ${G}bash $(pwd)/termux-setup-ubuntu.sh build https://your-app.vercel.app${N}"
  echo ""
  echo -e "${Y}Note: ~/.bashrc mein env vars save ho gaye — new session mein bhi kaam karega.${N}"
  echo -e "${Y}Current session mein: source ~/.bashrc chalao ya naya terminal kholें.${N}"
  echo ""
}

# ─────────────────────────────────────────────
# Stage 3: Build the TWA (AAB + APK)
# ─────────────────────────────────────────────
stage_build() {
  banner
  local VERCEL_URL="$2"
  if [ -z "$VERCEL_URL" ]; then
    echo -e "${R}✗ Vercel URL zaroori hai${N}"
    echo -e "${C}Usage:${N} bash $0 build https://extraai-xxx.vercel.app"
    exit 1
  fi

  echo -e "${C}[Stage 3] Building signed AAB for: $VERCEL_URL${N}"
  echo ""

  # Env vars
  export ANDROID_HOME=$HOME/android-sdk
  export ANDROID_SDK_ROOT=$HOME/android-sdk
  export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64
  export PATH=$JAVA_HOME/bin:$PATH

  # Create build directory
  mkdir -p ~/extraai-android
  cd ~/extraai-android

  # If not initialized yet
  if [ ! -f "twa-manifest.json" ]; then
    echo -e "${C}First-time Bubblewrap init...${N}"
    echo -e "${Y}Yeh interactive hai — prompts par values daalें (guide mein diya hai).${N}"
    bubblewrap init --manifest="${VERCEL_URL%/}/manifest.webmanifest"
  else
    echo -e "${G}✓ twa-manifest.json exists — skipping init${N}"
    echo -e "${C}(Agar re-init karna hai to yeh folder delete karें: ~/extraai-android)${N}"
  fi

  # Apply the aapt2 fix (may already be needed)
  echo -e "${C}Ensuring ARM64 aapt2 in Gradle cache...${N}"
  find ~/.gradle -name 'aapt2-*-linux.jar' -type f 2>/dev/null | \
    xargs -I{} jar -u -f {} -C /usr/bin aapt2 2>/dev/null || true

  # Try build (first attempt may fail if aapt2 not cached yet)
  echo -e "${C}Building (attempt 1)...${N}"
  bubblewrap build --skipPwaValidation || true

  # Re-apply aapt2 fix (now definitely cached)
  echo -e "${C}Re-applying ARM64 aapt2 fix...${N}"
  find ~/.gradle -name 'aapt2-*-linux.jar' -type f 2>/dev/null | \
    xargs -I{} jar -u -f {} -C /usr/bin aapt2 2>/dev/null || true

  # Final build
  echo -e "${C}Building (attempt 2 — this should succeed)...${N}"
  bubblewrap build --skipPwaValidation

  # Check results
  if [ -f "app-release-bundle.aab" ]; then
    # Copy to Termux downloads
    TERMUX_DL="/data/data/com.termux/files/home/storage/downloads"
    if [ -d "$TERMUX_DL" ]; then
      cp app-release-bundle.aab "$TERMUX_DL/ExtraAI.aab"
      cp app-release-signed.apk "$TERMUX_DL/ExtraAI.apk" 2>/dev/null || true
      cp android.keystore "$TERMUX_DL/extraai-keystore-BACKUP.keystore"
      cp twa-manifest.json "$TERMUX_DL/twa-manifest-BACKUP.json"
      echo -e "${G}✓ Files copied to phone Downloads folder${N}"
    fi

    echo ""
    echo -e "${G}"
    echo "  ✅ BUILD SUCCESSFUL!"
    echo -e "${N}"
    echo -e "${C}Generated files:${N}"
    ls -lh app-release-signed.apk 2>/dev/null && echo "  📱 app-release-signed.apk (install to test)"
    ls -lh app-release-bundle.aab 2>/dev/null && echo "  🛒 app-release-bundle.aab (upload to Play Store)"
    ls -lh android.keystore 2>/dev/null && echo "  🔐 android.keystore (BACKUP THIS!)"
    echo ""
    echo -e "${Y}Next steps:${N}"
    echo -e "  1. Phone Downloads mein files check karें"
    echo -e "  2. Keystore + password Google Drive par backup karें"
    echo -e "  3. bubblewrap fingerprint list  → SHA-256 lो"
    echo -e "  4. assetlinks.json update karें project mein"
    echo -e "  5. Play Console par ExtraAI.aab upload karें"
    echo ""
  else
    echo ""
    echo -e "${R}✗ Build failed. Check errors above.${N}"
    echo -e "${Y}Common fixes:${N}"
    echo -e "  • Ensure Vercel URL is live + HTTPS"
    echo -e "  • Check manifest.webmanifest is accessible"
    echo -e "  • Free up storage (needs 2 GB+)"
    echo -e "  • Try: rm -rf ~/.gradle/caches && bash $0 build $VERCEL_URL"
    exit 1
  fi
}

# ─────────────────────────────────────────────
# Verify installation
# ─────────────────────────────────────────────
stage_verify() {
  banner
  echo -e "${C}Verifying installation...${N}"
  echo ""

  # Java
  if command -v java > /dev/null; then
    JAVA_VER=$(java -version 2>&1 | head -1)
    echo -e "${G}✓ Java:${N} $JAVA_VER"
  else
    echo -e "${R}✗ Java not found${N}"
  fi

  # Node
  if command -v node > /dev/null; then
    echo -e "${G}✓ Node:${N} $(node --version)"
  else
    echo -e "${R}✗ Node not found${N}"
  fi

  # aapt2 arch
  if [ -f "/usr/bin/aapt2" ]; then
    ARCH=$(file /usr/bin/aapt2 | grep -o 'ARM aarch64\|x86-64')
    if [ "$ARCH" = "ARM aarch64" ]; then
      echo -e "${G}✓ aapt2:${N} ARM aarch64 (correct)"
    else
      echo -e "${R}✗ aapt2:${N} $ARCH (wrong architecture!)"
    fi
  else
    echo -e "${R}✗ /usr/bin/aapt2 not found${N}"
  fi

  # Bubblewrap
  if command -v bubblewrap > /dev/null; then
    echo -e "${G}✓ Bubblewrap:${N} $(bubblewrap --version)"
  else
    echo -e "${R}✗ Bubblewrap not found${N}"
  fi

  # Android SDK
  if [ -d "$HOME/android-sdk" ]; then
    echo -e "${G}✓ Android SDK:${N} $HOME/android-sdk"
  else
    echo -e "${R}✗ Android SDK not found${N}"
  fi

  # ANDROID_HOME env
  echo -e "${C}ANDROID_HOME:${N} ${ANDROID_HOME:-not set}"
  echo -e "${C}JAVA_HOME:${N} ${JAVA_HOME:-not set}"

  echo ""
}

# Router
case "$STAGE" in
  init)   stage_init ;;
  sdk)    stage_sdk ;;
  build)  stage_build "$@" ;;
  verify) stage_verify ;;
  *)      show_help ;;
esac
