import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    self.moduleName = "HitVaultV2"
    self.initialProps = [:]
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }
  
  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
