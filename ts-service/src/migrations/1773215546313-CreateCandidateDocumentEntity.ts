import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCandidateDocumentEntity1773215546313 implements MigrationInterface {
    name = 'CreateCandidateDocumentEntity1773215546313'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sample_candidates" DROP CONSTRAINT IF EXISTS "fk_sample_candidates_workspace_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_sample_candidates_workspace_id"`);
        await queryRunner.query(`CREATE TYPE "public"."candidate_documents_document_type_enum" AS ENUM('resume', 'cover_letter', 'other')`);
        await queryRunner.query(`CREATE TABLE "candidate_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "candidate_id" character varying(64) NOT NULL, "document_type" "public"."candidate_documents_document_type_enum" NOT NULL, "file_name" character varying(255) NOT NULL, "storage_key" character varying(500) NOT NULL, "raw_text" text NOT NULL, CONSTRAINT "PK_a7b7572a2c5c1320a4249ce2b4c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sample_candidates" ADD CONSTRAINT "FK_8acbadc1075b949c0d0b5d2ea47" FOREIGN KEY ("workspace_id") REFERENCES "sample_workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_documents" ADD CONSTRAINT "FK_2d1a14e9cb167a840b369a6cb71" FOREIGN KEY ("candidate_id") REFERENCES "sample_candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_documents" DROP CONSTRAINT "FK_2d1a14e9cb167a840b369a6cb71"`);
        await queryRunner.query(`ALTER TABLE "sample_candidates" DROP CONSTRAINT "FK_8acbadc1075b949c0d0b5d2ea47"`);
        await queryRunner.query(`DROP TABLE "candidate_documents"`);
        await queryRunner.query(`DROP TYPE "public"."candidate_documents_document_type_enum"`);
        await queryRunner.query(`CREATE INDEX "idx_sample_candidates_workspace_id" ON "sample_candidates" ("workspace_id") `);
        await queryRunner.query(`ALTER TABLE "sample_candidates" ADD CONSTRAINT "fk_sample_candidates_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "sample_workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
