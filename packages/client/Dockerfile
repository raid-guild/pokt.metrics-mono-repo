FROM node:20-alpine

RUN apk update && apk upgrade --no-cache

WORKDIR /app

ENV CI=true

COPY pnpm-lock.yaml package.json ./

COPY . .

RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --filter client...

RUN pnpm --filter client build

EXPOSE 3000

CMD ["pnpm", "--filter", "client", "start"]
