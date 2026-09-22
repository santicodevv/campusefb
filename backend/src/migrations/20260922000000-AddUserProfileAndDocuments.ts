import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileAndDocuments20260922000000 implements MigrationInterface {
  name = 'AddUserProfileAndDocuments20260922000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to app_users table
    await queryRunner.query(`
      ALTER TABLE "app_users"
      ADD COLUMN IF NOT EXISTS "church" VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS "profession" VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS "profile_photo_url" VARCHAR(500) NULL
    `);

    // Create user_documents table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_documents" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "document_type" VARCHAR(50) NOT NULL,
        "original_filename" VARCHAR(255) NOT NULL,
        "file_path" VARCHAR(500) NOT NULL,
        "mime_type" VARCHAR(100) NOT NULL,
        "file_size" INTEGER NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_user_documents_user" FOREIGN KEY ("user_id")
          REFERENCES "app_users" ("id") ON DELETE CASCADE
      )
    `);

    // Create index on user_id and document_type
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_documents_user_id" ON "user_documents" ("user_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_documents_user_type"
      ON "user_documents" ("user_id", "document_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_documents_user_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_documents_user_id"`);

    // Drop user_documents table
    await queryRunner.query(`DROP TABLE IF EXISTS "user_documents"`);

    // Remove columns from app_users
    await queryRunner.query(`
      ALTER TABLE "app_users"
      DROP COLUMN IF EXISTS "church",
      DROP COLUMN IF EXISTS "profession",
      DROP COLUMN IF EXISTS "profile_photo_url"
    `);
  }
}
