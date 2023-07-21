const fs = require("fs")
const path = require("path")
const os = require("os")

const { runTests } = require("@vscode/test-electron")

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../")

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite/index")

    // Create a temp dir for use as the workspace folder
    const workspacePath = fs.mkdtempSync(
      path.join(
        fs.realpathSync(os.tmpdir()),
        "significant-other-test-fixture-",
      ),
    )

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath],
    })
  } catch (err) {
    console.error("Failed to run tests")
    process.exit(1)
  }
}

main()
