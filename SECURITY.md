# Security

Please report a vulnerability privately through GitHub's **Report a vulnerability** (Security → Advisories) on this
repository rather than in a public issue. Include what is affected, how to reproduce it and its impact.

The plugin runs locally inside Claude Code: its scripts read and write the project's files, and the optional judge engines
call third-party APIs with keys read from the environment — never store a key in a versioned file.
