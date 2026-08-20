# Security Policy

## Reporting a vulnerability

If you find a security issue in Briefly, please report it privately by opening a
[GitHub security advisory](https://github.com/bunlongheng/briefly/security/advisories/new)
or emailing the maintainer. Please do not open a public issue for undisclosed
vulnerabilities.

We aim to acknowledge reports within a few days.

## Scope notes

- Briefly stores no user accounts and no personal data. Books are plain text plus
  generated audio, kept locally (sqlite + files) and, when deployed, served as static
  assets.
- The only secret the app needs is `ELEVENLABS_API_KEY`, read from the environment and
  used server-side only. It is never exposed to the client.
- Write endpoints (`POST`/`DELETE /api/books`) are gated to localhost/LAN, or to a
  bearer token when `BRIEFLY_TOKEN` is set.
