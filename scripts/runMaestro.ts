import { execSync, ExecSyncOptions } from 'child_process'
import { table } from 'console'
import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'
const cwd = path.join(__dirname, '..')
const execSyncOpts: ExecSyncOptions = { cwd, stdio: 'inherit' }
type Tag = Record<string, Set<string>>
type TagRegex = Record<string, Set<RegExp>>

const green = '\x1b[32m'
const reset = '\x1b[0m'
const bright = '\x1b[1m'
const yellow = '\x1b[33m'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class Maestro {
  private static readonly TAG_PATTERN = /((?<rawGroup>([\w*-]+\*?)?):(?<rawTag>[\w*-]+\*?)?)/g
  private static readonly TEST_ID_PATTERN = /\b\d+(:\d+)?\b/g

  private static compileRegex(tags: Set<string>): Set<RegExp> {
    return new Set(Array.from(tags).map(tag => (tag?.length === 0 ? /''/ : new RegExp(tag))))
  }

  private static extractTags(args?: string): Tag {
    if (args == null) return {}
    const tags = Array.from(args.matchAll(Maestro.TAG_PATTERN)).reduce<Tag>((acc, match) => {
      const { rawGroup, rawTag } = match.groups ?? {}
      const group = rawGroup === '' ? '.*' : rawGroup
      const tag = rawTag === '' ? '.*' : rawTag
      acc[group] ??= new Set<string>()
      acc[group].add(tag)
      return acc
    }, {})
    return tags
  }

  private static extractIds(args: string): number[] {
    const ids =
      args.match(Maestro.TEST_ID_PATTERN)?.flatMap(match => {
        if (match.includes(':')) {
          const [start, end] = match.split(':').map(Number)
          if ((start | end) < 0 || start >= end)
            throw new Error(`Invalid test range: [${match}] Test IDs must be non - negative, distinct, and in ascending order.`)
          return Array.from({ length: end - start + 1 }, (_, i) => i + start)
        }
        const id = Number(match)
        if (id < 0) throw new Error('Test IDs cannot be negative.')
        if (!Number.isInteger(id)) throw new Error('Test IDs must be integers.')
        return id
      }) ?? []
    return ids
  }

  private static hasWildcardMatch(compiledTags: TagRegex, tags: Tag): boolean {
    const groupList = Object.keys(tags)
    const groupListRegex = Object.keys(compiledTags)

    const tagList = groupList.flatMap(group => [...tags[group]])
    const tagListRegex = groupListRegex.flatMap(group => [...compiledTags[group]])

    return tagList.some(tag => tagListRegex.some(tagRegex => tagRegex.test(tag))) && groupList.some(group => groupListRegex.includes(group))
  }

  private static compileTags(tags?: Tag): TagRegex {
    return tags != null ? Object.fromEntries(Object.entries(tags).map(([group, tags]) => [group, Maestro.compileRegex(tags)])) : {}
  }

  private static extractTagsFromYaml(file: string): string[] {
    const tagRegex = /tags:\n(?:- \w+\n)+/g
    return (
      fs
        .readFileSync(file, 'utf8')
        .match(tagRegex)
        ?.flatMap((match: string) =>
          match
            .split('\n')
            .slice(1, -1)
            .map(line => line.trim().substring(2))
        ) ?? []
    )
  }

  private static runTests(testPaths: string[]) {
    testPaths.forEach(testPath => execSync(`maestro test ${testPath}`, execSyncOpts))
  }

  public static findTests = async (testIDs: Set<number>, includedTags: TagRegex, excludedTags: TagRegex, includeSkipped: boolean): Promise<string[]> => {
    const tests: string[] = []

    for await (const file of glob.stream('maestro/**/C*.yaml')) {
      const [groupIdentifiers, testId] = [
        path
          .dirname(file as string)
          .split('-')
          .slice(1),
        Number(
          path
            .basename(file as string, '.yaml')
            .split('-')[0]
            .substring(1)
        )
      ]
      const flowTags = Maestro.extractTagsFromYaml(file as string)
      const testTags: Tag = Object.fromEntries(groupIdentifiers.map(group => [group, new Set(flowTags)]))

      const includedMatched = Maestro.hasWildcardMatch(includedTags, testTags)
      const excludedMatched = Maestro.hasWildcardMatch(excludedTags, testTags)
      const normalMatched = includedMatched && !excludedMatched
      const skipTakesPrecedence = includedMatched && excludedMatched && includeSkipped

      // Test IDs take precedence over tags
      if (testIDs.has(testId) || normalMatched || skipTakesPrecedence) {
        tests.push(file as string)
      }
    }

    return tests
  }

  public static generateTestIds(testIDs: string, testIDsToIgnore?: string): Set<number> {
    const extractedIDs = Maestro.extractIds(testIDs)
    const ignoredIDs = new Set(Maestro.extractIds(testIDsToIgnore ?? ''))
    const ids = new Set([...extractedIDs].filter(id => !ignoredIDs.has(id)))
    return ids
  }

  static runMaestro = async ({ includedTests, excludedTests, skipTakesPrecedence }: MaestroOptions) => {
    const includedTags = Maestro.compileTags(Maestro.extractTags(includedTests))
    const ignoreTags = Maestro.compileTags(Maestro.extractTags(excludedTests))
    const testIds = Maestro.generateTestIds(includedTests, excludedTests)
    const testPaths = await Maestro.findTests(testIds, includedTags, ignoreTags, skipTakesPrecedence)
    const header = ['Test ID', 'Test Name', 'Tags']
    const tableData = testPaths.map(file => {
      const testName = path.basename(file, '.yaml')
      const testId = Number(path.basename(file, '.yaml').split('-')[0].substring(1))
      const flowTags = Maestro.extractTagsFromYaml(file).join(', ')
      return { 'Test ID': testId, 'Test Name': testName, Tags: flowTags }
    })

    console.log(table(tableData, header))
    Maestro.runTests(testPaths)
  }
}

const printHelp = () => {
  console.log(`
Usage:
  yarn maestro <Test IDs> [--skip <Test IDs>] [--include-skipped]

Options:
  <Tests>                 Run maestro tests with these IDs or tags. See examples below for more details.
  --skip <Tests>          Skip tests with these IDs or tags. See examples below for more details.
  --include-skipped       Skip tests that were both included and excluded. Overrides the default behavior of including tests.

Examples:

  # Run test ID 314 and 315. Use a comma to separate multiple IDs / ID ranges / tags.
    ${green}yarn maestro 314,315${reset}

  # Run all tests in the "login" test group
    ${green}yarn maestro :login${reset}

  # Run all tests in the "login" test group with the test tag "2fa"
    ${green}yarn maestro login:2fa${reset}

  # Run test ID 311 through to 400 and all tests with the tag "2fa"
    ${green}yarn maestro 311:400,:2fa${reset}

  # Run test ID 314 through to 350, but skip 315
    ${green}yarn maestro 314:350 --skip 315${reset}

  # Run all tests with the tag "login", but skip the ones with the tag "crash"
    ${green}yarn maestro :login --skip :crash${reset}

  # Run all tests with the tag "login" and "crash"
    ${green}yarn maestro :login --skip :crash --include-skipped${reset}

  `)
}

interface MaestroOptions {
  includedTests: string
  excludedTests: string
  skipTakesPrecedence: boolean
}
const runMaestro = async (options: MaestroOptions) => {
  try {
    await Maestro.runMaestro(options)
  } catch (error) {
    console.error(error)
  }
}

const runTests = async (options: MaestroOptions) => {
  const { includedTests } = options
  if (includedTests === '') {
    console.log(
      `
    ${yellow} No test IDs or tags were provided.
    ${bright}${green}Running all tests in 3 seconds.${reset}
`
    )
    setTimeout(async () => {
      await runMaestro({ ...options, includedTests: '0:200913' })
    }, 3000)
  } else {
    await runMaestro(options)
  }
}
const args = process.argv.slice(2)
if (args.includes('--help')) {
  printHelp()
} else {
  const options: MaestroOptions = {
    includedTests: args[0] ?? '',
    excludedTests: args.includes('--skip') ? args[args.indexOf('--skip') + 1] : '',
    skipTakesPrecedence: !!args.includes('--include-skipped')
  }
  runTests(options)
}
