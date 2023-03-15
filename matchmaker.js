const pathUtils = require("path")
const vscode = require("vscode")

class Matchmaker {
  // Public: Construct a {Matchmaker} for the given path.
  //
  // * `path` A {String} representing the absolute path to the file whose
  //   "significant other" you're seeking.
  //
  // Returns a {Matchmaker}.
  static for(path) {
    return new Matchmaker(path)
  }

  constructor(path) {
    this.path = path
  }

  // Public: Get the complementary path (i.e., the path to the "significant
  // other").
  //
  // Returns a Promise that resolves to:
  // * the {String} representing the absolute path to the complementary file.
  // * `null` if no complementary path is found.
  async complementaryPath() {
    return this.findComplementaryPath(this.path)
  }

  // Internal: In the given directory, search for a complementary path for the
  // given matchee.
  //
  // The following examples demonstrate the algorithm used to perform the
  // search:
  //
  //   EXAMPLE A - Given a file at `app/models/post.rb`:
  //
  //   1. Examine the filename to determine whether it has a suffix that
  //      indicates that it is a test file. In this case, `post.rb` does not
  //      appear to be a test, so assume that it's an implementation file and
  //      that we're looking for its corresponding test file.
  //
  //   2. Drop the leading directory, and look for a file whose path matches:
  //
  //        `**/models/post{.test,_test,_spec,-spec}.rb`
  //
  //     If such a file exists, use that file as the match. If no such file
  //     exists, continue to the next step.
  //
  //   3. Drop the leading directory used in the preceding step. Look for a file
  //      whose path matches:
  //
  //        `**/post{.test,_test,_spec,-spec}.rb`
  //
  //     If such a file exists, use that file as the match. If no such file
  //     exists, then stop searching (since there are no more leading
  //     directories to drop).
  //
  //   EXAMPLE B - Given a file at `test/models/post_test.rb`:
  //
  //   1. Examine the filename to determine whether it has a suffix that
  //      indicates that it is a test file. In this case, `post_test.rb` does
  //      appear to be a test, so assume we're looking for its corresponding
  //      implementation file.
  //
  //   2. Drop the leading directory, and look for a file whose path matches:
  //
  //        `**/models/post.rb'
  //
  //     If such a file exists, use that file as the match. If no such file
  //     exists, continue to the next step.
  //
  //   3. Drop the leading directory used in the preceding step. Look for a file
  //      whose path matches:
  //
  //        `**/post.rb'
  //
  //     If such a file exists, use that file as the match. If no such file
  //     exists, then stop searching (since there are no more leading
  //     directories to drop).
  //
  // Returns a Promise.
  async findComplementaryPath(matcheePath, leadingDirectoriesToExclude = 1) {
    const relativeMatcheePath = vscode.workspace.asRelativePath(matcheePath)
    const partialMatcheePath = this.withoutLeadingDirectory(
      relativeMatcheePath,
      leadingDirectoriesToExclude
    )
    const directoryPattern = this.directoryPattern(partialMatcheePath)

    const basenamePattern = this.basenamePattern(relativeMatcheePath)
    const ext_name = pathUtils.extname(relativeMatcheePath)
    const extensionPattern = this.altExtensionPattern(ext_name)
    const filenamePattern = `${basenamePattern}${extensionPattern}`
    const pattern = [directoryPattern, filenamePattern].join(pathUtils.sep)

    const matches = await vscode.workspace.findFiles(pattern)

    if (matches.length > 0) {
      return matches[0].path
    } else if (this.hasDirectory(partialMatcheePath)) {
      return this.findComplementaryPath(
        matcheePath,
        leadingDirectoriesToExclude + 1
      )
    } else {
      return null
    }
  }

  // Internal: Use Alternate File Extension for Test versus Implementation
  //
  // * `ext_name` A {String} representing the File Name Extension for
  //   the path a complementary file is being sought for.
  //
  // Example:
  //
  //   this.altExtensionPattern('.ex')
  //   # => '.exs'
  //
  //   this.altExtensionPattern('.exs')
  //   # => '.ex'
  //
  //   this.altExtensionPattern('.rb')
  //   # => '.rb'
  //
  // Returns a {String}.
  //   * defaults to return the given value if no alternate.
  altExtensionPattern(ext_name) {
    switch(ext_name) {
       case '.ex': {
          return '.exs'
       }
       case '.exs': {
          return '.ex'
       }
       default: {
          // No known alternate: Return given value.
          return ext_name
       }
    }
  }

  // Internal: Does the given path include at least one directory?
  //
  // Examples
  //
  //   this.hasDirectory('a/b.js')
  //   # => true
  //
  //   this.hasDirectory('b.js')
  //   # => false
  //
  // Returns a Boolean.
  hasDirectory(path) {
    return pathUtils.dirname(path) !== "."
  }

  // Internal
  directoryPattern(path) {
    if (this.hasDirectory(path)) {
      const directoryPath = pathUtils.dirname(path)
      return ["**", directoryPath].join(pathUtils.sep)
    } else {
      return "**"
    }
  }

  // Internal
  withoutLeadingDirectory(path, leadingDirectoriesToExclude = 1) {
    const directoriesInPath = pathUtils.dirname(path).split(pathUtils.sep)
    const subdirectoriesInPath = directoriesInPath.slice(
      leadingDirectoriesToExclude
    )
    const basename = pathUtils.basename(path)

    return subdirectoriesInPath.concat(basename).join(pathUtils.sep)
  }

  // Internal: Returns a {String} for use as a VS Code glob pattern (https://github.com/DefinitelyTyped/DefinitelyTyped/blob/8d74f0f88fa51ff71ccfa7e42d7a14e7cf8e3e9a/types/vscode/index.d.ts#L1995-L2012).
  basenamePattern(path) {
    const basename = pathUtils.basename(path, pathUtils.extname(path))

    // TODO Refactor and/or use better names or comments

    // If this file already ends with `_test` or `.test` or `_spec` or `-spec`,
    // then remove that from the name. If it does NOT end with `_test` or
    // `.test` or `_spec` or `-spec`, then add those items as optional suffixes
    // for the pattern.
    if (basename.match("(.test|_test|_spec|-spec)$")) {
      return basename.replace(new RegExp("(.test|_test|_spec|-spec)$"), "")
    } else {
      return `${basename}{.test,_test,_spec,-spec}`
    }
  }
}

module.exports = { for: Matchmaker.for }
