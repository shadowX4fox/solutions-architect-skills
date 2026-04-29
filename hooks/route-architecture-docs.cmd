@echo off
rem hooks/route-architecture-docs.cmd
rem
rem Windows CMD batch wrapper around route-architecture-docs.ts. Resolves its
rem own directory via %~dp0 so the parent settings.json entry can pass an
rem absolute path that does not depend on `~` expansion (cmd.exe does NOT
rem expand `~` to the user's home directory).
rem
rem Companion wrappers:
rem   - route-architecture-docs.sh   (Linux, macOS, WSL, Git Bash)
rem   - route-architecture-docs.ps1  (Windows PowerShell / pwsh on any OS)
rem
rem Invoked by Claude Code as: cmd /c "<abs-path>\hooks\route-architecture-docs.cmd"

bun "%~dp0route-architecture-docs.ts" %*
exit /b %errorlevel%
