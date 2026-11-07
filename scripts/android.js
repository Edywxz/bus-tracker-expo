#!/usr/bin/env node
// Localiza Android Studio / SDK / JDK sozinho (macOS, Windows, Linux), sobe o emulador se preciso
// e abre o app no Android. Não depende de ~/.zshrc.
//   npm run android          -> emulador + Expo Go
//   npm run android:doctor   -> só diagnostica
//   npm run android:build    -> build próprio (expo run:android)
// Opcional: ANDROID_AVD=NomeDoAVD para escolher o emulador.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const home = os.homedir();
const plat = process.platform;
const exe = (n) => (plat === 'win32' ? `${n}.exe` : n);
const bat = (n) => (plat === 'win32' ? `${n}.bat` : n);
const ok = (m) => console.log(`  \x1b[32m✔\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✘\x1b[0m ${m}`);
const info = (m) => console.log(`  \x1b[33m•\x1b[0m ${m}`);
const exists = (p) => !!p && fs.existsSync(p);

const studioCandidates = {
  darwin: ['/Applications/Android Studio.app', path.join(home, 'Applications/Android Studio.app'), '/Applications/Android Studio Preview.app'],
  win32: [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Android Studio'),
  ],
  linux: ['/opt/android-studio', '/usr/local/android-studio', path.join(home, 'android-studio'), '/snap/android-studio/current/android-studio'],
}[plat] || [];

const sdkCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  plat === 'darwin' && path.join(home, 'Library/Android/sdk'),
  plat === 'win32' && path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
  plat === 'linux' && path.join(home, 'Android/Sdk'),
].filter(Boolean);

const studio = studioCandidates.find(exists);
const sdk = sdkCandidates.find((p) => exists(path.join(p, 'platform-tools')));

// JDK: o embutido no Android Studio (jbr) é o mais seguro; senão JAVA_HOME.
const jbrs = studio
  ? [path.join(studio, 'Contents/jbr/Contents/Home'), path.join(studio, 'jbr'), path.join(studio, 'Contents/jre/Contents/Home')]
  : [];
let javaHome = jbrs.find((p) => exists(path.join(p, 'bin', exe('java'))));
if (!javaHome && exists(process.env.JAVA_HOME)) javaHome = process.env.JAVA_HOME;

console.log('Android Studio / SDK / JDK');
studio ? ok(studio) : bad('Android Studio não encontrado (developer.android.com/studio)');
sdk ? ok(`SDK: ${sdk}`) : bad('SDK não encontrado. Abra o Android Studio e conclua o assistente inicial.');
javaHome ? ok(`JDK: ${javaHome}`) : info('JDK não localizado (só é necessário para "npm run android:build")');

const adb = sdk && path.join(sdk, 'platform-tools', exe('adb'));
const emulator = sdk && path.join(sdk, 'emulator', exe('emulator'));
if (sdk) {
  exists(adb) ? ok('adb') : bad('adb ausente (SDK Manager → SDK Tools → Platform-Tools)');
  exists(emulator) ? ok('emulator') : bad('emulator ausente (SDK Manager → SDK Tools → Android Emulator)');
}

const env = { ...process.env };
if (sdk) {
  env.ANDROID_HOME = sdk;
  env.ANDROID_SDK_ROOT = sdk;
  env.PATH = [path.join(sdk, 'platform-tools'), path.join(sdk, 'emulator'), env.PATH].join(path.delimiter);
}
if (javaHome) {
  env.JAVA_HOME = javaHome;
  env.PATH = [path.join(javaHome, 'bin'), env.PATH].join(path.delimiter);
}

const run = (cmd, args) => spawnSync(cmd, args, { env, encoding: 'utf8' });
const avds = exists(emulator) ? run(emulator, ['-list-avds']).stdout.split('\n').map((s) => s.trim()).filter(Boolean) : [];
const online = () => (exists(adb) ? run(adb, ['devices']).stdout.split('\n').filter((l) => /\tdevice$/.test(l)) : []);

console.log('Emuladores');
if (avds.length) avds.forEach((a) => ok(a));
else if (exists(emulator)) {
  bad('Nenhum emulador criado.');
  info('Android Studio → More Actions → Virtual Device Manager → Create Device → Pixel, imagem API 34+ com Google APIs.');
}

const mode = process.argv[2] || 'start';
if (mode === 'doctor') process.exit(sdk && exists(adb) ? 0 : 1);
if (!sdk || !exists(adb)) {
  console.error('\nSDK do Android indisponível: corrija os itens acima e rode de novo.');
  process.exit(1);
}

function bootEmulator() {
  if (online().length) { ok(`Dispositivo já conectado: ${online()[0].split('\t')[0]}`); return Promise.resolve(); }
  if (!avds.length) { bad('Sem emulador e sem celular conectado.'); process.exit(1); }
  const avd = process.env.ANDROID_AVD && avds.includes(process.env.ANDROID_AVD) ? process.env.ANDROID_AVD : avds[0];
  info(`Iniciando emulador "${avd}"... (o primeiro boot demora)`);
  spawn(emulator, ['-avd', avd], { env, detached: true, stdio: 'ignore' }).unref();
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      const boot = online().length && run(adb, ['shell', 'getprop', 'sys.boot_completed']).stdout.trim() === '1';
      if (boot) return ok('Emulador pronto.'), resolve();
      if (Date.now() - t0 > 240000) { bad('Emulador demorou demais; abra-o pelo Android Studio e rode de novo.'); process.exit(1); }
      setTimeout(tick, 3000);
    };
    tick();
  });
}

bootEmulator().then(() => {
  const args = mode === 'build' ? ['expo', 'run:android'] : ['expo', 'start', '--android'];
  const p = spawn(plat === 'win32' ? 'npx.cmd' : 'npx', args, { env, stdio: 'inherit' });
  p.on('exit', (c) => process.exit(c ?? 0));
});
