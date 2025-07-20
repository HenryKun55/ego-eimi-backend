FROM oven/bun:1

WORKDIR /app

COPY . .

RUN apt update 
RUN apt install -y netcat-openbsd
RUN apt install -y curl
RUN bun add -g @nestjs/cli
RUN bun install
RUN bun run build
