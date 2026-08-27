# Upgrade Gradle and AGP to support Java 25

The project currently uses Gradle 8.11.1 and Android Gradle Plugin (AGP) 8.7.2, which do not support Java 25 (the version currently selected in your IDE). This plan will upgrade both to versions that are compatible with Java 25.

## Proposed Changes

### [Gradle Configuration]

#### [MODIFY] [gradle-wrapper.properties](file:///C:/Users/DELL/AndroidStudioProjects/Smart-India-Hackathon-repository/frontend/android/gradle/wrapper/gradle-wrapper.properties)
- Upgrade `distributionUrl` to use Gradle 9.7.1.

### [Android Gradle Plugin]

#### [MODIFY] [build.gradle (root)](file:///C:/Users/DELL/AndroidStudioProjects/Smart-India-Hackathon-repository/frontend/android/build.gradle)
- Update the AGP classpath dependency from `8.7.2` to `9.3.2`.

#### [MODIFY] [build.gradle (capacitor-cordova-android-plugins)](file:///C:/Users/DELL/AndroidStudioProjects/Smart-India-Hackathon-repository/frontend/android/capacitor-cordova-android-plugins/build.gradle)
- Update the AGP classpath dependency from `8.7.2` to `9.3.2`.

## Verification Plan

### Automated Tests
- Run `./gradlew help` to verify the new Gradle version starts correctly with Java 25.
- Run `gradle_sync` in the IDE to ensure all dependencies are resolved.

### Manual Verification
- Verify the "Incompatible Gradle JVM version" error in Android Studio disappears.
- Build the project to ensure no breaking changes from Gradle 9 or AGP 9 impact the build.
