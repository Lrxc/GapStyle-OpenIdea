#!/usr/bin/env node
/**
 * Generates `openidea/themes/gapstyle.scheme.json` from the IntelliJ colour
 * scheme (`intellij/GapStyle/colors/GapStyle.xml`), so both ports read the same
 * source of truth.
 *
 *   node openidea/scripts/build.js          # write the scheme
 *   node openidea/scripts/build.js --check  # exit 1 when the committed file is stale
 *
 * The mapping tables mirror OpenIDEA's `src/features/plugins/intellijTheme.ts`
 * (`ICLS_COLORS` / `ICLS_ATTRIBUTES`), which is what its own "Import IntelliJ
 * Theme" uses. Re-sync them when that file gains tokens.
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..', '..')
const PACKAGE_DIR = path.join(__dirname, '..')
const ICLS_PATH = path.join(ROOT, 'intellij', 'GapStyle', 'colors', 'GapStyle.xml')
const OUT_PATH = path.join(PACKAGE_DIR, 'themes', 'gapstyle.scheme.json')

/** `.icls` `<colors>` option → OpenIDEA tokens. */
const ICLS_COLORS = {
  CARET_COLOR: ['--caret'],
  CARET_ROW_COLOR: ['--bg-current-line'],
  SELECTION_BACKGROUND: ['--bg-editor-selection'],
  SELECTION_FOREGROUND: ['--fg-editor-selection'],
  LINE_NUMBERS_COLOR: ['--fg-line-number'],
  LINE_NUMBER_ON_CARET_ROW_COLOR: ['--fg-line-number-current'],
  EDITOR_GUTTER_BACKGROUND: ['--bg-editor-gutter'],
  INDENT_GUIDE: ['--border-indent-guide'],
  SELECTED_INDENT_GUIDE: ['--border-indent-guide-active'],
  RIGHT_MARGIN_COLOR: ['--border-right-margin'],
  WHITESPACES: ['--fg-whitespace'],
  // METHOD_SEPARATORS_COLOR is not mapped: OpenIDEA's token set has no method separator colour.
  FILESTATUS_MODIFIED: ['--vcs-modified'],
  FILESTATUS_ADDED: ['--vcs-added'],
  FILESTATUS_DELETED: ['--vcs-deleted'],
  FILESTATUS_UNKNOWN: ['--vcs-untracked'],
  FILESTATUS_IDEA_FILESTATUS_IGNORED: ['--vcs-ignored'],
  FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_CONFLICTS: ['--vcs-conflict'],
  MODIFIED_LINES_COLOR: ['--gutter-modified'],
  ADDED_LINES_COLOR: ['--gutter-added'],
  DELETED_LINES_COLOR: ['--gutter-deleted'],
  CONSOLE_BACKGROUND_KEY: ['--bg-console'],
}

/** `.icls` `<attributes>` option → [part, token] pairs. */
const ICLS_ATTRIBUTES = {
  TEXT: [
    ['FOREGROUND', '--fg-editor'],
    ['BACKGROUND', '--bg-editor'],
  ],
  DIFF_MODIFIED: [
    ['BACKGROUND', '--diff-modified'],
    ['ERROR_STRIPE_COLOR', '--diff-modified-stripe'],
  ],
  DIFF_INSERTED: [
    ['BACKGROUND', '--diff-inserted'],
    ['ERROR_STRIPE_COLOR', '--diff-inserted-stripe'],
  ],
  DIFF_DELETED: [
    ['BACKGROUND', '--diff-deleted'],
    ['ERROR_STRIPE_COLOR', '--diff-deleted-stripe'],
  ],
  DIFF_CONFLICT: [['ERROR_STRIPE_COLOR', '--diff-conflict-stripe']],
  DEFAULT_KEYWORD: [['FOREGROUND', '--syn-keyword']],
  DEFAULT_STRING: [['FOREGROUND', '--syn-string']],
  DEFAULT_NUMBER: [['FOREGROUND', '--syn-number']],
  DEFAULT_LINE_COMMENT: [['FOREGROUND', '--syn-comment']],
  DEFAULT_DOC_COMMENT: [['FOREGROUND', '--syn-doc-comment']],
  DEFAULT_DOC_COMMENT_TAG: [['FOREGROUND', '--syn-doc-comment-tag']],
  DEFAULT_DOC_COMMENT_TAG_VALUE: [['FOREGROUND', '--syn-doc-comment-tag-value']],
  DEFAULT_DOC_MARKUP: [
    ['FOREGROUND', '--syn-doc-markup'],
    ['BACKGROUND', '--syn-doc-markup-bg'],
  ],
  DEFAULT_FUNCTION_DECLARATION: [['FOREGROUND', '--syn-function']],
  DEFAULT_FUNCTION_CALL: [['FOREGROUND', '--syn-function-call']],
  DEFAULT_CLASS_NAME: [['FOREGROUND', '--syn-type']],
  DEFAULT_CONSTANT: [['FOREGROUND', '--syn-constant']],
  DEFAULT_INSTANCE_FIELD: [['FOREGROUND', '--syn-property']],
  DEFAULT_IDENTIFIER: [['FOREGROUND', '--syn-variable']],
  DEFAULT_LOCAL_VARIABLE: [['FOREGROUND', '--syn-variable']],
  DEFAULT_PARAMETER: [['FOREGROUND', '--syn-param']],
  DEFAULT_GLOBAL_VARIABLE: [['FOREGROUND', '--syn-global']],
  DEFAULT_PREDEFINED_SYMBOL: [['FOREGROUND', '--syn-builtin']],
  DEFAULT_METADATA: [
    ['FOREGROUND', '--syn-annotation'],
    ['FOREGROUND', '--syn-decorator'],
  ],
  DEFAULT_OPERATION_SIGN: [['FOREGROUND', '--syn-punct']],
  DEFAULT_VALID_STRING_ESCAPE: [['FOREGROUND', '--syn-escape']],
  DEFAULT_TAG: [['FOREGROUND', '--syn-tag']],
  DEFAULT_ATTRIBUTE: [['FOREGROUND', '--syn-attribute']],
  TODO_DEFAULT_ATTRIBUTES: [['FOREGROUND', '--syn-todo']],
  BAD_CHARACTER: [['FOREGROUND', '--syn-invalid']],
  RAINBOW_COLOR1: [['FOREGROUND', '--syn-rainbow-1']],
  RAINBOW_COLOR2: [['FOREGROUND', '--syn-rainbow-2']],
  RAINBOW_COLOR3: [['FOREGROUND', '--syn-rainbow-3']],
  RAINBOW_COLOR4: [['FOREGROUND', '--syn-rainbow-4']],
  RAINBOW_COLOR5: [['FOREGROUND', '--syn-rainbow-5']],
  ERRORS_ATTRIBUTES: [['EFFECT_COLOR', '--wave-error']],
  WARNING_ATTRIBUTES: [
    ['EFFECT_COLOR', '--wave-warning'],
    ['BACKGROUND', '--editor-warning-background'],
  ],
  NOT_USED_ELEMENT_ATTRIBUTES: [['FOREGROUND', '--fg-unused']],
  MATCHED_BRACE_ATTRIBUTES: [['BACKGROUND', '--bg-matched-brace']],
  SEARCH_RESULT_ATTRIBUTES: [['BACKGROUND', '--bg-search-result']],
  TEXT_SEARCH_RESULT_ATTRIBUTES: [['BACKGROUND', '--bg-text-search-result']],
  IDENTIFIER_UNDER_CARET_ATTRIBUTES: [['BACKGROUND', '--bg-identifier-under-caret']],
  WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES: [['BACKGROUND', '--bg-identifier-under-caret-write']],
  FOLDED_TEXT_ATTRIBUTES: [
    ['FOREGROUND', '--fg-fold-placeholder'],
    ['BACKGROUND', '--bg-fold-placeholder'],
  ],
  INLINE_PARAMETER_HINT: [
    ['FOREGROUND', '--fg-inlay'],
    ['BACKGROUND', '--bg-inlay'],
  ],
  BREAKPOINT_ATTRIBUTES: [['BACKGROUND', '--bg-breakpoint-line']],
  DEBUGGER_INLINED_VALUES: [['FOREGROUND', '--syn-inline-value']],
  'PY.SELF_PARAMETER': [['FOREGROUND', '--syn-self']],
  'PY.KEYWORD_ARGUMENT': [['FOREGROUND', '--syn-keyword-arg']],
  'PY.DOC_COMMENT': [['FOREGROUND', '--syn-docstring']],
  'PY.DOC_COMMENT_TAG': [['FOREGROUND', '--syn-python-docstring-tag']],
  OPENIDEA_pyDocstringKeyword: [['FOREGROUND', '--syn-python-docstring-keyword']],
  'PY.BUILTIN_NAME': [['FOREGROUND', '--syn-predefined']],
  'BASH.EXTERNAL_COMMAND': [['FOREGROUND', '--syn-shell-command']],
  MARKDOWN_HEADER_LEVEL_1: [['FOREGROUND', '--syn-markup-heading']],
  MARKDOWN_CODE_SPAN: [['FOREGROUND', '--syn-markup-code']],
  MARKDOWN_LINK_TEXT: [['FOREGROUND', '--syn-link']],
  CONSOLE_BLACK_OUTPUT: [
    ['FOREGROUND', '--ansi-black'],
    ['FOREGROUND', '--terminal-ansi-black'],
  ],
  CONSOLE_RED_OUTPUT: [
    ['FOREGROUND', '--ansi-red'],
    ['FOREGROUND', '--terminal-ansi-red'],
  ],
  CONSOLE_GREEN_OUTPUT: [
    ['FOREGROUND', '--ansi-green'],
    ['FOREGROUND', '--terminal-ansi-green'],
  ],
  CONSOLE_YELLOW_OUTPUT: [
    ['FOREGROUND', '--ansi-yellow'],
    ['FOREGROUND', '--terminal-ansi-yellow'],
  ],
  CONSOLE_BLUE_OUTPUT: [
    ['FOREGROUND', '--ansi-blue'],
    ['FOREGROUND', '--terminal-ansi-blue'],
  ],
  CONSOLE_MAGENTA_OUTPUT: [
    ['FOREGROUND', '--ansi-magenta'],
    ['FOREGROUND', '--terminal-ansi-magenta'],
  ],
  CONSOLE_CYAN_OUTPUT: [
    ['FOREGROUND', '--ansi-cyan'],
    ['FOREGROUND', '--terminal-ansi-cyan'],
  ],
  CONSOLE_GRAY_OUTPUT: [
    ['FOREGROUND', '--ansi-white'],
    ['FOREGROUND', '--terminal-ansi-white'],
  ],
  CONSOLE_DARKGRAY_OUTPUT: [
    ['FOREGROUND', '--ansi-bright-black'],
    ['FOREGROUND', '--terminal-ansi-bright-black'],
  ],
  CONSOLE_RED_BRIGHT_OUTPUT: [
    ['FOREGROUND', '--ansi-bright-red'],
    ['FOREGROUND', '--terminal-ansi-bright-red'],
  ],
  CONSOLE_GREEN_BRIGHT_OUTPUT: [
    ['FOREGROUND', '--ansi-bright-green'],
    ['FOREGROUND', '--terminal-ansi-bright-green'],
  ],
  CONSOLE_YELLOW_BRIGHT_OUTPUT: [
    ['FOREGROUND', '--ansi-bright-yellow'],
    ['FOREGROUND', '--terminal-ansi-bright-yellow'],
  ],
  CONSOLE_BLUE_BRIGHT_OUTPUT: [
    ['FOREGROUND', '--ansi-bright-blue'],
    ['FOREGROUND', '--terminal-ansi-bright-blue'],
  ],
  CONSOLE_MAGENTA_BRIGHT_OUTPUT: [
    ['FOREGROUND', '--ansi-bright-magenta'],
    ['FOREGROUND', '--terminal-ansi-bright-magenta'],
  ],
  CONSOLE_CYAN_BRIGHT_OUTPUT: [
    ['FOREGROUND', '--ansi-bright-cyan'],
    ['FOREGROUND', '--terminal-ansi-bright-cyan'],
  ],
  CONSOLE_WHITE_OUTPUT: [
    ['FOREGROUND', '--ansi-bright-white'],
    ['FOREGROUND', '--terminal-ansi-bright-white'],
  ],
}

/** Sections of the generated file, in output order. */
const GROUPS = ['Syntax', 'Editor', 'Vcs', 'Console', 'ANSI palette', 'Terminal ANSI palette']

/** The section a token is listed under, mirroring the comments of OpenIDEA's tokens.css. */
function groupOf(token) {
  if (token.startsWith('--syn-')) return 'Syntax'
  if (token.startsWith('--terminal-ansi-')) return 'Terminal ANSI palette'
  if (token.startsWith('--ansi-')) return 'ANSI palette'
  if (/^--(vcs|gutter|diff)-/.test(token)) return 'Vcs'
  if (token === '--bg-console') return 'Console'
  return 'Editor'
}

/** `.icls` hex: RGB without `#`, leading zeros dropped (`"0"` is black, `"ff"` is #0000ff). */
function iclsColor(value) {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()
  if (!/^[0-9a-f]{1,8}$/.test(v)) return null
  return `#${v.length <= 6 ? v.padStart(6, '0') : v.padStart(8, '0')}`
}

const attr = (tag, name) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1]

/** Reads the `.icls` and returns `{ name, dark, tokens }`. */
function convertIcls(xml) {
  const tokens = {}
  const schemeTag = /<scheme\b[^>]*>/.exec(xml)?.[0] ?? ''
  const name = attr(schemeTag, 'name') ?? 'GapStyle'
  const parent = attr(schemeTag, 'parent_scheme') ?? ''
  const dark = parent ? /darcula|dark/i.test(parent) : null

  const colors = /<colors>([\s\S]*?)<\/colors>/.exec(xml)?.[1] ?? ''
  for (const m of colors.matchAll(/<option\b[^>]*\/>/g)) {
    const key = attr(m[0], 'name')
    const value = attr(m[0], 'value')
    if (!key || value === undefined || !ICLS_COLORS[key]) continue
    const color = iclsColor(value)
    if (color) for (const token of ICLS_COLORS[key]) tokens[token] = color
  }

  const body = /<attributes>([\s\S]*?)<\/attributes>/.exec(xml)?.[1] ?? ''
  const attributes = new Map()
  const empty = new Set()
  for (const m of body.matchAll(
    /<option name="([^"]+)"[^>]*>\s*(?:<value\s*\/>|<value>([\s\S]*?)<\/value>)\s*<\/option>/g,
  )) {
    if (m[2] === undefined) empty.add(m[1])
    const parts = new Map()
    for (const o of (m[2] ?? '').matchAll(/<option\b[^>]*\/>/g)) {
      const key = attr(o[0], 'name')
      const value = attr(o[0], 'value')
      if (key && value !== undefined) parts.set(key, value)
    }
    attributes.set(m[1], parts)
  }

  const textForeground = iclsColor(attributes.get('TEXT')?.get('FOREGROUND'))
  for (const [key, parts] of attributes) {
    const map = ICLS_ATTRIBUTES[key]
    if (!map) continue
    // `<value />` sets the key without colours: it shows as plain text, not with the parent's colour.
    if (empty.has(key)) {
      for (const [part, token] of map) if (part === 'FOREGROUND' && textForeground) tokens[token] = textForeground
      continue
    }
    // Last write wins. IntelliJ's export lists attributes alphabetically, so `DEFAULT_LOCAL_VARIABLE`
    // lands after `DEFAULT_IDENTIFIER` and locals keep GapStyle's #CBAD96 instead of the default text.
    for (const [part, token] of map) {
      const color = iclsColor(parts.get(part))
      if (color) tokens[token] = color
    }
    // FONT_TYPE: 1 bold, 2 italic, 3 bold italic.
    if (key === 'DEFAULT_LINE_COMMENT') {
      tokens['--syn-comment-style'] = Number(parts.get('FONT_TYPE') ?? 0) & 2 ? 'italic' : 'normal'
    }
  }

  if (tokens['--wave-error']) tokens['--editor-error-decoration'] = `underline wavy ${tokens['--wave-error']}`
  if (tokens['--bg-editor']) tokens['--bg-editor-gutter'] ??= tokens['--bg-editor']
  return { name, dark, tokens }
}

/** `{"tokens": {...}}` with the section comments readers of the template expect. */
function render(name, tokens) {
  const byGroup = new Map(GROUPS.map(title => [title, []]))
  for (const token of Object.keys(tokens).sort()) byGroup.get(groupOf(token)).push(token)
  const lines = [
    `// ${name}: editor colour scheme, generated from intellij/GapStyle/colors/GapStyle.xml.`,
    '// Do not edit: run `node openidea/scripts/build.js` after changing the IntelliJ scheme.',
    '{',
    `  "name": ${JSON.stringify(name)},`,
    '  "tokens": {',
  ]
  const sections = [...byGroup].filter(([, list]) => list.length)
  sections.forEach(([title, list], index) => {
    lines.push(`    // ${title}`)
    list.forEach((token, i) => {
      const last = index === sections.length - 1 && i === list.length - 1
      lines.push(`    ${JSON.stringify(token)}: ${JSON.stringify(tokens[token])}${last ? '' : ','}`)
    })
    if (index !== sections.length - 1) lines.push('')
  })
  lines.push('  }', '}', '')
  return lines.join('\n')
}

/** The checks OpenIDEA's theme host runs (`ide-host/src/plugins/theme.rs`). */
function validate(tokens) {
  const problems = []
  for (const [name, value] of Object.entries(tokens)) {
    const validName = name.length > 2 && name.length <= 64 && /^--[a-z0-9-]*$/.test(name)
    if (!validName) problems.push(`invalid token name ${JSON.stringify(name)}`)
    const bad = /[;{}<>\\\n\r]/.test(value) || /url\(|image\(|@import/i.test(value) || value.trim() === ''
    if (bad) problems.push(`unsupported value for ${name}: ${JSON.stringify(value)}`)
  }
  if (Object.keys(tokens).length > 512) problems.push('more than 512 tokens')
  return problems
}

/** `//` line comments are all these files use; kept in step with OpenIDEA's `stripJsonComments`. */
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, ''))

/** The package checks `openidea-plugin check` runs, for hosts without Rust: manifest, files, values. */
function checkPackage() {
  const problems = []
  const manifest = fs.readFileSync(path.join(PACKAGE_DIR, 'plugin.toml'), 'utf8')
  const field = key => new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm').exec(manifest)?.[1]
  const id = field('id')
  const version = field('version')
  if (!/^[a-z0-9][a-z0-9_-]*(\.[a-z0-9][a-z0-9_-]*)*$/.test(id ?? '')) problems.push(`invalid plugin id ${id}`)
  if (!/^\d+\.\d+\.\d+/.test(version ?? '')) problems.push(`invalid version ${version}`)
  if (!/^engines\.openidea\s*=/m.test(manifest)) problems.push('missing engines.openidea')
  if (/^wasm\s*=/m.test(manifest)) problems.push('a theme plugin must not declare `wasm`')

  const blocks = manifest
    .split(/^\[\[contributes\.themes\]\]\s*$/m)
    .slice(1)
    .map(block => block.split(/^\[/m)[0])
  if (!blocks.length) problems.push('no [[contributes.themes]] entry')
  for (const block of blocks) {
    const pathValue = /^path\s*=\s*"([^"]+)"/m.exec(block)?.[1]
    const schemeValue = /^editor-scheme\s*=\s*"([^"]+)"/m.exec(block)?.[1]
    for (const rel of [pathValue, schemeValue].filter(Boolean)) {
      if (rel.startsWith('/') || rel.split('/').includes('..')) problems.push(`path escapes the package: ${rel}`)
      const file = path.join(PACKAGE_DIR, rel)
      if (!fs.existsSync(file)) {
        problems.push(`missing ${rel}`)
        continue
      }
      let parsed
      try {
        parsed = readJson(file)
      } catch (e) {
        problems.push(`${rel}: ${e.message}`)
        continue
      }
      if (rel.endsWith('.theme.json')) {
        if (!/^[a-z0-9][a-z0-9._-]*$/.test(parsed.id ?? '')) problems.push(`${rel}: invalid theme id`)
        if (parsed.kind !== 'dark' && parsed.kind !== 'light') problems.push(`${rel}: kind must be dark or light`)
      }
      for (const [token, value] of Object.entries(parsed.tokens ?? {})) {
        const validName = token.length > 2 && token.length <= 64 && /^--[a-z0-9-]*$/.test(token)
        if (!validName) problems.push(`${rel}: invalid token name ${JSON.stringify(token)}`)
        const bad = /[;{}<>\\\n\r]/.test(value) || /url\(|image\(|@import/i.test(value) || value.trim() === ''
        if (bad) problems.push(`${rel}: unsupported value for ${token}: ${JSON.stringify(value)}`)
      }
    }
  }
  return problems
}

const { name, dark, tokens } = convertIcls(fs.readFileSync(ICLS_PATH, 'utf8'))
const problems = validate(tokens)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
if (dark === false) console.warn('warning: the IntelliJ scheme does not declare a dark parent')

const output = render(name, tokens)
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : ''
  if (current !== output) {
    console.error(`${path.relative(ROOT, OUT_PATH)} is stale: run node openidea/scripts/build.js`)
    process.exit(1)
  }
  console.log(`${path.relative(ROOT, OUT_PATH)} is up to date (${Object.keys(tokens).length} tokens)`)
  const packaging = checkPackage()
  if (packaging.length) {
    console.error(packaging.join('\n'))
    process.exit(1)
  }
  console.log('package checks pass (manifest, theme files, token values)')
} else {
  fs.writeFileSync(OUT_PATH, output)
  console.log(`wrote ${path.relative(ROOT, OUT_PATH)} (${Object.keys(tokens).length} tokens)`)
}
