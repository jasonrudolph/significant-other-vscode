const matchmaker = require("./matchmaker")
const vscode = require("vscode")

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("significant-other.toggle", toggle),
  )
}

function deactivate() {}

async function toggle() {
  const activeTextEditor = vscode.window.activeTextEditor
  if (!activeTextEditor) {
    vscode.window.showErrorMessage(
      "Whoops. You need to open a text file first.",
    )
    return
  }

  const activePath = activeTextEditor.document.uri.path
  const complementaryPath = await matchmaker.for(activePath).complementaryPath()
  if (complementaryPath) {
    vscode.window.showTextDocument(vscode.Uri.file(complementaryPath))
  } else {
    vscode.window.showInformationMessage("No significant other found 😱")
  }
}

module.exports = {
  activate,
  deactivate,
}
