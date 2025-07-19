FROM oven/bun:1

WORKDIR /app

COPY . .

RUN apt update && apt install -y netcat-openbsd
RUN bun add -g @nestjs/cli
RUN bun install
RUN bun run build
