FROM node:20-alpine

RUN apk update && apk upgrade --no-cache

WORKDIR /app

ENV CI=true

COPY ../../pnpm-lock.yaml ../../package.json ./

COPY . .

RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --filter api...

EXPOSE 4000

CMD ["pnpm", "--filter", "api", "start"]
