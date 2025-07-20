FROM oven/bun:1

WORKDIR /app

COPY apps/backend/ ./
COPY apps/backend/package.json ./package.json
COPY apps/backend/bun.lockb ./bun.lockb
COPY apps/backend/tsconfig.json ./tsconfig.json

RUN apt update && apt install -y netcat-openbsd curl
RUN bun add -g @nestjs/cli
RUN bun install
RUN bun run build

EXPOSE 3000

CMD ["sh", "-c", "bun run prepare:full-clean && bun run start:prod"]
