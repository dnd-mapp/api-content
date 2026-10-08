# Local HTTPS

`pnpm run start` serves HTTPS only, at `https://localhost.content.dndmapp.dev:3000`, so local development runs in a secure context like production. A `Secure` cookie and a request from the `ui` therefore behave the same as behind the ingress. The certificate comes from [mkcert](https://github.com/FiloSottile/mkcert), which signs it with a certificate authority (CA) of its own that your machine trusts.

Each machine needs a one-time setup: install mkcert, trust its CA, and point `localhost.content.dndmapp.dev` at `127.0.0.1`. Both of the last two steps need elevated rights, so no script runs them for you. Then create the certificate of the repository with `pnpm run setup-https`.

## Installing mkcert

### Windows

Install mkcert with [Scoop](https://scoop.sh/) or [Chocolatey](https://chocolatey.org/):

```powershell
scoop bucket add extras
scoop install mkcert
```

```powershell
choco install mkcert
```

### macOS

Install mkcert with [Homebrew](https://brew.sh/). Firefox keeps its own list of trusted CAs, and mkcert needs `certutil` from `nss` to add its CA there, so install `nss` too when you use Firefox:

```bash
brew install mkcert
brew install nss
```

### Linux

Install `certutil` first, which mkcert needs to add its CA to Firefox and Chromium. Use the package of your distribution:

```bash
sudo apt install libnss3-tools
sudo dnf install nss-tools
sudo pacman -S nss
sudo zypper install mozilla-nss-tools
```

Then install mkcert with [Homebrew](https://brew.sh/) or from the [prebuilt binaries](https://github.com/FiloSottile/mkcert/releases) of its releases.

## Trusting the CA

Create the CA of mkcert and add it to the trust stores of the system and the browsers:

```bash
mkcert -install
```

It asks for your password or for a confirmation, since it changes what the machine trusts. Run it once per machine; every repository that uses mkcert shares the CA. Restart the browser afterward, so it reads the new CA.

## Adding the host

Add this line to the hosts file, which takes elevated rights to edit. The file is `C:\Windows\System32\drivers\etc\hosts` on Windows and `/etc/hosts` on macOS and Linux.

```text
127.0.0.1 localhost.content.dndmapp.dev
```

The entry leaves out `::1`, since the default `HOST` of `0.0.0.0` only listens on IPv4.

## Creating the certificate

Create the certificate and the key of the server in `.certs`, which Git ignores:

```bash
pnpm run setup-https
```

The certificate holds `localhost.content.dndmapp.dev`, `localhost`, and `127.0.0.1`, so `https://localhost:3000` works as well. It expires after a little over two years; run the script again to replace it. Start the server with `pnpm run start`, and open `https://localhost.content.dndmapp.dev:3000/health/live` to check that the browser trusts it.

The server refuses to start when the certificate or the key is missing, and names the script to run. To use files elsewhere, set `TLS_CERT_FILE` and `TLS_KEY_FILE`, as [Configuration](configuration.md#environment-variables) describes.
