# syntax=docker/dockerfile:1.27@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e
# check=error=true

# The standalone pnpm binary, without corepack or an install script. A COPY --from straight from the image would
# pull pnpm for the target platform, so this stage pins it to the platform of the builder.
FROM --platform=$BUILDPLATFORM ghcr.io/pnpm/pnpm:12.8.2@sha256:68daf29be83708810af256844a2e5e93cbe3abcd3a2d08587ac393add65aea46 AS pnpm

# The install and build stages run on the platform of the builder, so a multi-platform build compiles the application
# once and needs no emulation. The Node.js and pnpm versions match devEngines in package.json, which engineStrict
# enforces during the install, and Renovate moves each pair in one pull request.
FROM --platform=$BUILDPLATFORM node:24.21.0-trixie-slim@sha256:173f125896c3b47ddf056734c7ea789d04595a6a08769a8f78e0df642781fb66 AS base
COPY --from=pnpm /opt/pnpm /opt/pnpm
ENV PATH="/opt/pnpm:$PATH"
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Installs only the runtime dependencies, so the image ships without the build and test tooling. They hold no native
# code, so the files installed for the builder run on every target platform.
FROM base AS dependencies
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --prod --frozen-lockfile --store-dir=/pnpm/store

# Installs every dependency and compiles the application into dist, with its source maps. It skips the install
# scripts, since the one it allows installs the Git hooks of lefthook, which need a Git repository.
FROM base AS build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --ignore-scripts --store-dir=/pnpm/store
COPY nest-cli.json .swcrc tsconfig*.json ./
COPY src ./src
RUN pnpm run build

# Only copies files, so it needs no emulation either. The files belong to root, so the node user can read them but
# not change them, and the server writes nothing, so it runs on a read-only root filesystem.
FROM node:24.21.0-trixie-slim@sha256:173f125896c3b47ddf056734c7ea789d04595a6a08769a8f78e0df642781fb66 AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY .docker/healthcheck.js ./
USER 1000:1000
EXPOSE 3000

# Runs .docker/healthcheck.js, which requests the readiness endpoint. Docker marks the container unhealthy once it fails
# three times in a row. It probes every second during the start period, so the container turns healthy as soon as the
# server is ready.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --start-interval=1s --retries=3 \
    CMD ["node", "healthcheck.js"]

CMD ["node", "--enable-source-maps", "dist/main.js"]
