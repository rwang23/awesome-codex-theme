# Security

## Installation boundary

The website cannot execute local commands. Its Install button only shows and
copies a command for the visitor to review.

The installers:

- accept one registry theme id;
- reject path traversal and unsupported image formats;
- download or copy only the package paths declared by the registry;
- verify SHA-256 hashes before writing;
- write only to the Codex Dream Skin saved-theme directory;
- put the image in place before theme.json, which is the package commit marker;
- support a dry-run that performs validation without installation.

Do not run an installer from a mirror you do not trust. Inspect the script and
the registry first.

## Reporting

Do not open a public issue for a vulnerability that exposes credentials or
private local paths. Contact the repository owner privately after the GitHub
remote is configured.
