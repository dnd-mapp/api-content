# syntax=docker/dockerfile:1

# The Node.js and pnpm versions match devEngines in package.json, which engineStrict enforces during the install.
ARG NODE_VERSION=24.21.0
ARG PNPM_VERSION=12.8.2

# Installs every dependency and compiles the application into dist.
FROM node:${NODE_VERSION}-alpine AS build
ARG PNPM_VERSION
RUN npm install --global pnpm@${PNPM_VERSION}
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Installs only the runtime dependencies, so the image ships without the build and test tooling.
FROM node:${NODE_VERSION}-alpine AS dependencies
ARG PNPM_VERSION
RUN npm install --global pnpm@${PNPM_VERSION}
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Runs the compiled application as the unprivileged node user.
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
USER node
EXPOSE 3000

# Docker marks the container unhealthy once the liveness endpoint fails three times in a row.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health/live').then((response) => process.exit(response.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "dist/main.js"]
