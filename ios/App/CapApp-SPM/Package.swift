// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.5.2"),
        .package(name: "CapacitorFilesystem", path: "../../../node_modules/@capacitor/filesystem"),
        .package(name: "CapgoCapacitorShareTarget", path: "../../../node_modules/@capgo/capacitor-share-target"),
        .package(name: "CapgoCapacitorSpeechRecognition", path: "../../../node_modules/@capgo/capacitor-speech-recognition")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorFilesystem", package: "CapacitorFilesystem"),
                .product(name: "CapgoCapacitorShareTarget", package: "CapgoCapacitorShareTarget"),
                .product(name: "CapgoCapacitorSpeechRecognition", package: "CapgoCapacitorSpeechRecognition")
            ]
        )
    ]
)
