# BagaPlay Continu 5.7.4

Application Android séparée : `fr.bagattini.bagaplay.continuous`, Android 11 minimum. Les jeux sont embarqués et BagaStore fonctionne hors ligne. Les fonctions en ligne nécessitent Internet. Les sauvegardes de l'ancienne application ne sont pas importées automatiquement. Ce conteneur ne fournit pas de service de notifications Android en arrière-plan.

## Construction sous Windows

Installer JDK 21, Android Build Tools 36 et la plateforme Android 36, Node.js et `jszip`. Définir `JAVA_HOME`, `ANDROID_HOME` et `BAGAPLAY_TASK_ROOT` (dossier de travail contenant `outputs/` et `work/bagaplay-signing/`). Si nécessaire, définir `BAGAPLAY_JSZIP` avec le chemin du module `jszip`, `BAGAPLAY_BUILD_TOOLS` avec le dossier des outils et `BAGAPLAY_ANDROID_JAR` avec le chemin de `android.jar`.

La signature utilise `work/bagaplay-signing/bagaplay-release.p12`, alias `bagaplay`, et son mot de passe dans `work/bagaplay-signing/password.txt`. Conserver ces fichiers privés pour signer les futures mises à jour. Ils sont exclus du dépôt.

Exécuter `./android/build.ps1`. Le script recopie les ressources web du dépôt, compile, signe puis vérifie l'APK et ses ressources embarquées. Résultat : `outputs/BagaPlay-5.7.4.apk`.

Tests du moteur : `node --test tests/store.test.mjs`.
