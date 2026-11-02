import { describe, expect, test } from 'claude-code/testing'

import { saSkillsDir } from './lifecycle'

// a Windows machine: no HOME, USERPROFILE with backslashes, sa-skills found through Claude Code's install registry
function fake(files: Record<string, string>, env: Record<string, string>) {
  return {
    env: { get: async (k: string) => env[k] },
    fs: { exists: async (p: string) => p in files, read: async (p: string) => { if (!(p in files)) throw new Error(`ENOENT ${p}`); return files[p] },
      stat: async () => ({ realPath: 'C:\\Users\\ana\\.claude\\plugins\\cache\\m\\sa-alia\\1.3.1' }) },
    plugin: { root: 'C:\\Users\\ana\\.claude\\plugins\\cache\\m\\sa-alia\\1.3.1' },
    session: { root: async () => 'C:\\Users\\ana\\ClaudeProjects\\northwind' },
    process: { run: async () => { throw new Error('no process expected') } },
  } as never
}

describe('where sa-skills is', () => {
  test('Windows: USERPROFILE and the install registry, every path with forward slashes', async () => {
    const sa = 'C:/Users/ana/.claude/plugins/cache/m/sa-skills/11.7.5'
    const files = {
      'C:/Users/ana/.claude/plugins/installed_plugins.json': JSON.stringify({ version: 2, plugins: { 'sa-skills@m': [{ scope: 'user', installPath: 'C:\\Users\\ana\\.claude\\plugins\\cache\\m\\sa-skills\\11.7.5' }] } }),
      [`${sa}/scripts/shared/findings.js`]: '',
    }
    expect(await saSkillsDir(fake(files, { USERPROFILE: 'C:\\Users\\ana' }))).toBe(sa)
  })

  test('a project-scope install of this project wins over the user\'s', async () => {
    const files = {
      '/home/ana/.claude/plugins/installed_plugins.json': JSON.stringify({ version: 2, plugins: { 'sa-skills@m': [
        { scope: 'user', installPath: '/u/sa-skills' }, { scope: 'project', projectPath: 'C:\\Users\\ana\\ClaudeProjects\\northwind', installPath: '/p/sa-skills' }] } }),
      '/u/sa-skills/scripts/shared/findings.js': '', '/p/sa-skills/scripts/shared/findings.js': '',
    }
    expect(await saSkillsDir(fake(files, { HOME: '/home/ana' }))).toBe('/p/sa-skills')
  })

  test('nothing installed and no home: none, never a guess', async () => {
    expect(await saSkillsDir(fake({}, {}))).toBeNull()
  })
})
