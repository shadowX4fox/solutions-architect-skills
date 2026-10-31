// sa-alia — a solution architect's UX layer over sa-skills. Optional: the skills work without it; it reads what their
// scripts write and draws it, never writes an architecture document. One hooks module per plugin: each mod lives in its
// own folder with its drawing hooks, lifecycle.tsx holds the session.start / turn.complete hooks they share, and state.ts
// the values they keep.
import type { Register } from 'claude-code'

import { registerAlia } from './alia/register'
import { registerMilestones } from './milestones/register'
import { registerRows } from './rows/register'
import { registerConfirm } from './confirm/register'
import { registerExplorer } from './explorer/register'
import { registerLifecycle } from './lifecycle'
import { registerNextSteps } from './next-steps/register'
import { registerRadar } from './radar/register'

export const register: Register = (on, options) => {
  registerLifecycle(on, options)
  registerAlia(on, options)
  registerNextSteps(on)
  registerExplorer(on)
  registerRadar(on)
  registerRows(on)
  registerMilestones(on)
  registerConfirm(on)
}
