# Security policy

## Reporting a vulnerability

Report it privately: on this repository's **Security** tab, choose **Report a vulnerability**.
Please do not open a public issue or pull request for it. Say what you found, how to reproduce it,
and what it exposes.

The cards run in the Home Assistant frontend with the signed-in user's rights: they read states and
history, and call services when you tap them. A flaw that lets a card call a service nobody asked
for, or sends anything from a home to a third party beyond what the README says (map imagery and
building footprints around the home point for the sun card's 3D sky, three.js from a CDN), is a
vulnerability.

## Supported versions

The latest [release](https://github.com/alejandroerickson/homeassistant-collage-theme/releases).

## How the repository is checked

The checks that keep secrets and private material out of this repository are in
[security checks](okf/operations/security-checks.md).
