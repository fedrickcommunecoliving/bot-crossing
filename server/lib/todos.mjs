/**
 * Open work, read out of a repo's own `TODO.md`.
 *
 * A thread is a conversation; it is not the list of things that conversation left undone. Those
 * live in a file at the repo root, written by whoever was working there, and until now the map
 * could not see them — so a zone with nothing running looked finished when it had a dozen things
 * outstanding.
 *
 * Deliberately only `TODO.md`, and deliberately only checkboxes. Every other markdown file in a
 * repo is full of `- [ ]` that is not a task: specification documents listing requirements,
 * training manuals, feature write-ups. Counting those turns "14 open" into "159 open" and the
 * number stops meaning anything — a count you cannot trust is worse than no count, because you
 * stop looking at the one place that was telling the truth.
 *
 * Read-only, like everything else here. Nothing writes to a repo.
 */
import fsp from 'node:fs/promises'
import path from 'node:path'

/** Directories that are never the user's own work, and are enormous. */
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', '.vercel', 'out', 'coverage'])

/**
 * Folders somebody has already retired, by the name they gave them.
 *
 * A superseded copy of a repo keeps its old `TODO.md`, and every line in it counts as open work
 * forever — one folder here called "Booking system (OLD - DO NOT USE)" contributed thirteen items
 * to a count of twenty-six. Half the backlog was work that had been done or abandoned months ago,
 * which is precisely how a number stops being worth reading.
 *
 * Narrow on purpose, and matched on the folder name only: someone who writes "DO NOT USE" on a
 * directory has already told us what it is. A real folder is not called "old".
 */
const RETIRED = /(^|[\s(_-])(old|older|deprecated|backup|backups|archive|archived|unused)([\s)_-]|$)|do.?not.?use/i

/**
 * How deep to look. `TODO.md` is usually at the repo root, but a zone is a *working directory* and
 * a person's working directory is often the folder that holds the repo rather than the repo — so
 * one or two levels down is the common case, not the exception. Past that it is someone else's
 * vendored file.
 */
const MAX_DEPTH = 2

/** Enough to see the shape of the work without shipping a 137 KB file to the browser. */
const MAX_ITEMS = 200

const OPEN_LINE = /^\s*[-*]\s+\[ \]\s+(.*\S)\s*$/
const DONE_LINE = /^\s*[-*]\s+\[[xX]\]/
const HEADING = /^\s{0,3}(#{1,6})\s+(.*\S)\s*$/

/** Every TODO.md at or under `root`, breadth-first so the root's own file is found first. */
async function findTodoFiles(root, depth = 0, found = []) {
  if (depth > MAX_DEPTH || found.length > 20) return found
  let entries
  try {
    entries = await fsp.readdir(root, { withFileTypes: true })
  } catch {
    return found
  }
  const dirs = []
  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase() === 'todo.md') found.push(path.join(root, e.name))
    else if (e.isDirectory() && !e.name.startsWith('.') && !SKIP.has(e.name) && !RETIRED.test(e.name))
      dirs.push(path.join(root, e.name))
  }
  for (const dir of dirs) await findTodoFiles(dir, depth + 1, found)
  return found
}

/**
 * Markdown emphasis, read as text.
 *
 * These lines were written to be read in an editor, where `**FOUND**` is bold. In a panel that
 * renders them as plain text the asterisks are just noise in front of the words that matter, and
 * a backlog is skimmed — anything between the eye and the first real word costs a reading.
 *
 * Link text is kept and the target dropped, which is the half a person can act on; an image is
 * dropped entirely, since its alt text is rarely a task.
 */
function plain(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*\*|\*\*|\*|__|_|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300)
}

/**
 * The open items in one file, each carrying the heading it sits under.
 *
 * The heading is what makes a line readable out of context — a backlog is grouped by priority or
 * area, and "Fix the totals" means something different under "Critical" than under "Someday".
 */
function parse(text) {
  const open = []
  let done = 0
  let heading = ''
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const h = HEADING.exec(line)
    if (h) {
      heading = plain(h[2])
      continue
    }
    if (DONE_LINE.test(line)) {
      done++
      continue
    }
    const m = OPEN_LINE.exec(line)
    if (m) open.push({ text: plain(m[1]), section: heading, line: i + 1 })
  }
  return { open, done }
}

/**
 * Every open checkbox under a project folder, with the totals.
 *
 * `truncated` rather than a silent cut: a list that quietly stops at two hundred reads as a
 * complete list, and the whole point of this is to be the thing you can trust.
 */
export async function readTodos(root) {
  const files = await findTodoFiles(root)
  const items = []
  let done = 0
  let openTotal = 0
  for (const file of files) {
    let text
    try {
      text = await fsp.readFile(file, 'utf8')
    } catch {
      continue
    }
    const parsed = parse(text)
    done += parsed.done
    openTotal += parsed.open.length
    for (const item of parsed.open) {
      if (items.length < MAX_ITEMS) items.push({ ...item, file: path.relative(root, file) || path.basename(file) })
    }
  }
  return {
    ok: true,
    open: items,
    openTotal,
    done,
    files: files.map((f) => path.relative(root, f) || path.basename(f)),
    truncated: openTotal > items.length,
  }
}
