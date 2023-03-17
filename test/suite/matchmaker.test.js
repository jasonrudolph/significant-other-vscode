const assert = require("assert")
const fs = require("fs")
const matchmaker = require("../../matchmaker")
const path = require("path")
const vscode = require("vscode")
const rimraf = require("rimraf")

suite("finding the complementary path for a file", () => {
  const workspaceFolderPath = vscode.workspace.workspaceFolders[0].uri.path

  function setupDirectoryContents(rootPath, filePaths) {
    // Delete any existing content in the directory
    for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
      const absolutePath = path.join(rootPath, entry.name)
      if (entry.isDirectory()) {
        rimraf.sync(absolutePath)
      } else {
        fs.unlinkSync(absolutePath)
      }
    }

    // Create the given file structure
    for (let filePath of filePaths) {
      filePath = path.join(rootPath, filePath)
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, "")
    }
  }

  function testMatchingFor(significantOthers) {
    for (const { srcPath, testPath } of significantOthers) {
      test(`identifies ${testPath} as the complementary path for ${srcPath}`, async () => {
        const actualPath = await matchmaker.for(srcPath).complementaryPath()
        assert.strictEqual(actualPath, path.join(workspaceFolderPath, testPath))
      })

      test(`identifies ${srcPath} as the complementary path for ${testPath}`, async () => {
        const actualPath = await matchmaker.for(testPath).complementaryPath()
        assert.strictEqual(actualPath, path.join(workspaceFolderPath, srcPath))
      })
    }
  }

  suite("in a typical Ruby gem", () => {
    suiteSetup(() => {
      // A representative sample of files from the Octokit gem
      // (https://github.com/octokit/octokit.rb/tree/v3.5.2)
      let filePaths = [
        "README.md",
        "lib/octokit/client/authorizations.rb",
        "lib/octokit/client/pull_requests.rb",
        "lib/octokit/client.rb",
        "lib/octokit/version.rb",
        "lib/octokit.rb",
        "octokit.gemspec",
        "spec/helper.rb",
        "spec/client/authorizations_spec.rb",
        "spec/client/pull_requests_spec.rb",
        "spec/client_spec.rb",
        "spec/octokit_spec.rb",
      ]
      setupDirectoryContents(workspaceFolderPath, filePaths)
    })

    testMatchingFor([
      {
        srcPath: "lib/octokit.rb",
        testPath: "spec/octokit_spec.rb",
      },
      {
        srcPath: "lib/octokit/client/pull_requests.rb",
        testPath: "spec/client/pull_requests_spec.rb",
      },
    ])
  })

  suite("in a typical Rails app", () => {
    suiteSetup(() => {
      const filePaths = [
        "README.md",
        "app/controllers/application_controller.rb",
        "app/controllers/comments_controller.rb",
        "app/controllers/posts_controller.rb",
        "app/helpers/application_helper.rb",
        "app/helpers/comments_helper.rb",
        "app/helpers/posts_helper.rb",
        "app/models/comment.rb",
        "app/models/post.rb",
        "test/controllers/comments_controller_test.rb",
        "test/controllers/posts_controller_test.rb",
        "test/helpers/comments_helper_test.rb",
        "test/helpers/posts_helper_test.rb",
        "test/models/comment_test.rb",
        "test/models/post_test.rb",
      ]
      setupDirectoryContents(workspaceFolderPath, filePaths)
    })

    testMatchingFor([
      {
        srcPath: "app/controllers/posts_controller.rb",
        testPath: "test/controllers/posts_controller_test.rb",
      },
      {
        srcPath: "app/models/post.rb",
        testPath: "test/models/post_test.rb",
      },
    ])
  })

  suite("in a typical Golang library", () => {
    suiteSetup(() => {
      let filePaths = [
        "README.md",
        "main.go",
        "main_test.go",
        "lib/kv.go",
        "lib/kv_test.go",
      ]
      setupDirectoryContents(workspaceFolderPath, filePaths)
    })

    testMatchingFor([
      {
        srcPath: "main.go",
        testPath: "main_test.go",
      },
      {
        srcPath: "lib/kv.go",
        testPath: "lib/kv_test.go",
      },
    ])
  })

  suite("in a basic Elixir app", () => {
    // Tests for Elixir (.EX) are in Elixir scripts (.EXS)
    suiteSetup(() => {
      const filePaths = [
        "README.md",
        "config/test.exs",
        "lib/simple.ex",
        "lib/app_name/some_thing.ex",
        "lib/app_name/mod_name/mod_name.ex",
        "test/test_helper.exs",
        "test/simple_test.exs",
        "test/app_name/some_thing_test.exs",
        "test/app_name/mod_name/mod_name_test.exs",
      ]
      setupDirectoryContents(workspaceFolderPath, filePaths)
    })

    testMatchingFor([
      {
        srcPath: "lib/simple.ex",
        testPath: "test/simple_test.exs",
      },
      {
        srcPath: "lib/app_name/some_thing.ex",
        testPath: "test/app_name/some_thing_test.exs",
      },
      {
        srcPath: "lib/app_name/mod_name/mod_name.ex",
        testPath: "test/app_name/mod_name/mod_name_test.exs",
      },
    ])
  })

  suite("in a typical VS Code extension", () => {
    suiteSetup(() => {
      let filePaths = [
        "README.md",
        "extension.js",
        "test/suite/extension.test.js",
      ]
      setupDirectoryContents(workspaceFolderPath, filePaths)
    })

    testMatchingFor([
      {
        srcPath: "extension.js",
        testPath: "test/suite/extension.test.js",
      },
    ])
  })

  suite("when no complementary path exists", () => {
    suiteSetup(() => {
      let filePaths = ["main.js"]
      setupDirectoryContents(workspaceFolderPath, filePaths)
    })

    test("resolves to null", async () => {
      const complementaryPath = await matchmaker
        .for("main.js")
        .complementaryPath()
      assert.strictEqual(null, complementaryPath)
    })
  })
})
