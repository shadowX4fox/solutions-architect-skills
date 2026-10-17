@echo off
rem hooks/route-architecture-docs.cmd
rem
rem UserPromptSubmit hook — Windows cmd.exe implementation. If
rem %CLAUDE_PROJECT_DIR%\ARCHITECTURE.md (or %CD%\ARCHITECTURE.md when the
rem env var is unset) exists, emit the static JSON payload at
rem hooks\route-architecture-docs.payload.json. Otherwise exit 0 silently.
rem
rem No bun, no node, no JS runtime. The only requirements are cmd.exe
rem builtins (`if exist`, `type`, `set`) — all available by default on
rem every Windows install. Cold start is sub-millisecond.
rem
rem Companion wrappers (share the same payload.json file):
rem   - route-architecture-docs.sh   (Linux, macOS, WSL, Git Bash — what
rem                                   scripts/setup-permissions.ts writes on
rem                                   every OS, Windows included, v6.9.1+)
rem   - route-architecture-docs.ps1  (Windows PowerShell / pwsh on any OS)
rem
rem Payload source of truth: hooks\route-architecture-docs.payload.json
rem (single-line valid JSON; edit there, not in this script).
rem
rem NOT written by /setup any more. Claude Code runs command hooks through
rem Git Bash on Windows whenever Git Bash is installed, and Git Bash's MSYS
rem layer rewrites the `/c` argument of `cmd /c "..."` into `C:\`, so
rem cmd.exe starts interactively and echoes the hook's stdin JSON into the
rem model's context instead of the payload. Hand-wire this wrapper only
rem with the MSYS escape, `cmd //c "<abs-path>\hooks\route-architecture-docs.cmd"`,
rem or with `"shell": "powershell"` on the hook entry.

setlocal
set "PROJECT_DIR=%CLAUDE_PROJECT_DIR%"
if "%PROJECT_DIR%"=="" set "PROJECT_DIR=%CD%"
if not exist "%PROJECT_DIR%\ARCHITECTURE.md" (
  endlocal
  exit /b 0
)
type "%~dp0route-architecture-docs.payload.json"
endlocal
exit /b 0
