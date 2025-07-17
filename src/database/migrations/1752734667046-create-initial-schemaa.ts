import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateInitialSchemaa1752734667046 implements MigrationInterface {
  name = 'CreateInitialSchemaa1752734667046'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "documents_chunk" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "embedding" vector, "documentId" uuid, CONSTRAINT "PK_684db396db0d5581e4273cfcab6" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sourceName" character varying NOT NULL, "content" text NOT NULL, "requiredRole" character varying NOT NULL, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "roles" text NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "documents_chunk" ADD CONSTRAINT "FK_5e249ff5b21c66c519f7332b1f9" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents_chunk" DROP CONSTRAINT "FK_5e249ff5b21c66c519f7332b1f9"`
    )
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TABLE "documents"`)
    await queryRunner.query(`DROP TABLE "documents_chunk"`)
  }
}
