const path = require('path')
const runAction = require('..')
const { Toolkit } = require('actions-toolkit')

function mockToolkit (event, workspace = 'workspace') {
  // Load the relevant JSON file
  process.env.GITHUB_EVENT_PATH = path.join(
    __dirname,
    'fixtures',
    `${event}.json`
  )
  // Load the relevant workspace file
  process.env.GITHUB_WORKSPACE = path.join(
    __dirname,
    'fixtures',
    workspace
  )

  // Silence warning
  Toolkit.prototype.warnForMissingEnvVars = jest.fn()

  // Mock the toolkit exit functions
  const tools = new Toolkit()
  tools.exit.neutral = jest.fn()
  tools.exit.failure = jest.fn()
  tools.exit.success = jest.fn()
  return tools
}

describe('validate-semver-release', () => {
  beforeEach(() => {
    Object.assign(process.env, {
      GITHUB_EVENT: 'release',
      GITHUB_WORKSPACE: path.join(__dirname, 'fixtures', 'workspace')
    })
  })

  it('exits neutral for draft releases', () => {
    const tools = mockToolkit('release-draft')
    runAction(tools)
    expect(tools.exit.neutral).toHaveBeenCalled()
  })

  it('exits failure for invalid tag', () => {
    const tools = mockToolkit('release-invalid-tag')
    runAction(tools)
    expect(tools.exit.failure).toHaveBeenCalled()
  })

  it('exits failure for a tag/version mismatch', () => {
    const tools = mockToolkit('release-wrong-version')
    runAction(tools)
    expect(tools.exit.failure).toHaveBeenCalled()
  })

  it('exits successfully with no issues', () => {
    const tools = mockToolkit('release')
    runAction(tools)
    expect(tools.exit.success).toHaveBeenCalled()
  })

  describe('prereleases', () => {
    it('exits failure with no semver prelease on the tag', () => {
      const tools = mockToolkit('release-prerelease-not-tag')
      runAction(tools)
      expect(tools.exit.failure).toHaveBeenCalled()
    })

    it('exits failure with an invalid prerelease tag', () => {
      const tools = mockToolkit('release-prerelease-invalid-tag', 'workspace-invalid-prerelease')
      runAction(tools)
      expect(tools.exit.failure).toHaveBeenCalled()
    })

    it('writes to a file with a valid tag and version', () => {
      const tools = mockToolkit('release-prerelease', 'workspace-prerelease')
      runAction(tools)
      expect(tools.exit.success).toHaveBeenCalled()
    })
  })
})
