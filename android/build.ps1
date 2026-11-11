$ErrorActionPreference='Stop'
$taskRoot=$env:BAGAPLAY_TASK_ROOT
$jdk=Join-Path $env:JAVA_HOME 'bin'
$bt=Join-Path $env:ANDROID_HOME 'build-tools/36.0.0'
$platform=Join-Path $env:ANDROID_HOME 'platforms/android-36/android.jar'
if($env:BAGAPLAY_BUILD_TOOLS){$bt=$env:BAGAPLAY_BUILD_TOOLS}
if($env:BAGAPLAY_ANDROID_JAR){$platform=$env:BAGAPLAY_ANDROID_JAR}
$app=$PSScriptRoot
New-Item -ItemType Directory -Force "$app/build/classes","$app/assets/www","$taskRoot/outputs" | Out-Null
Get-ChildItem (Split-Path $app -Parent) -File | Where-Object Extension -In '.js','.css','.html','.png','.svg','.webmanifest' | Copy-Item -Destination "$app/assets/www"
function Check-Exit([string]$step){if($LASTEXITCODE -ne 0){throw "$step failed"}}
& "$jdk/javac.exe" -encoding UTF-8 -source 8 -target 8 -bootclasspath "$platform;$bt/core-lambda-stubs.jar" -d "$app/build/classes" "$app/src/fr/bagattini/bagaplay/continuous/MainActivity.java"
Check-Exit 'Java compilation'
& "$bt/aapt2.exe" compile --dir "$app/res" -o "$app/build/resources.zip"
Check-Exit 'Resource compilation'
# Bundle assets separately, avoiding Windows archive path separators in AAPT2.
& "$bt/aapt2.exe" link -o "$app/build/unsigned.apk" -I $platform --manifest "$app/AndroidManifest.xml" --min-sdk-version 30 --target-sdk-version 36 "$app/build/resources.zip"
Check-Exit 'APK resource linking'
& "$jdk/jar.exe" "-J-Djava.io.tmpdir=$app/build" --create --file "$app/build/classes.jar" -C "$app/build/classes" .
Check-Exit 'Class packaging'
& "$jdk/java.exe" "-Djava.io.tmpdir=$app/build" -cp "$bt/lib/d8.jar" com.android.tools.r8.D8 --lib $platform --min-api 30 --output "$app/build" "$app/build/classes.jar"
Check-Exit 'DEX compilation'
node "$app/package-apk.cjs";Check-Exit 'Asset packaging'
& "$bt/zipalign.exe" -f -p 4 "$app/build/unsigned.apk" "$app/build/aligned.apk"
Check-Exit 'Alignment'
$keyPath=Join-Path $taskRoot 'work/bagaplay-signing/bagaplay-release.p12'
$passPath=Join-Path $taskRoot 'work/bagaplay-signing/password.txt'
$env:BAGAPLAY_SIGN_PASS=[IO.File]::ReadAllText($passPath)
$out=Join-Path $taskRoot 'outputs/BagaPlay-5.7.3.apk'
try {
 & "$jdk/java.exe" "-Djava.io.tmpdir=$app/build" -jar "$bt/lib/apksigner.jar" sign --ks $keyPath --ks-key-alias bagaplay --ks-pass env:BAGAPLAY_SIGN_PASS --key-pass env:BAGAPLAY_SIGN_PASS --v1-signing-enabled false --v2-signing-enabled true --v3-signing-enabled true --v4-signing-enabled false --out $out "$app/build/aligned.apk"
 Check-Exit 'APK signing'
} finally {Remove-Item Env:BAGAPLAY_SIGN_PASS}
& "$jdk/java.exe" -jar "$bt/lib/apksigner.jar" verify --verbose --print-certs $out
Check-Exit 'Signature verification'
& "$bt/zipalign.exe" -c -p 4 $out
Check-Exit 'Alignment verification'
& "$bt/aapt.exe" dump badging $out
Check-Exit 'Manifest validation'
Get-FileHash -LiteralPath $out -Algorithm SHA256
Get-Item -LiteralPath $out | Select-Object Name,Length
