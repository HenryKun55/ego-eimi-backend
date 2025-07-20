FROM oven/bun:1

WORKDIR /app

COPY apps/backend ./
COPY package.json ./
COPY bun.lockb ./
COPY tsconfig.json ./

RUN apt update && apt install -y netcat-openbsd curl
RUN bun add -g @nestjs/cli
RUN bun install
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start:prod"]
