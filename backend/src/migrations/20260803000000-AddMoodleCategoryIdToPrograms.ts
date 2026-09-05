import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMoodleCategoryIdToPrograms20260803000000 implements MigrationInterface {
  name = 'AddMoodleCategoryIdToPrograms20260803000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'sga_programs' AND column_name = 'moodle_category_id'
        ) THEN
          ALTER TABLE "sga_programs" ADD "moodle_category_id" bigint;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sga_programs_moodle_category_id"
      ON "sga_programs" ("moodle_category_id")
      WHERE "moodle_category_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_sga_programs_moodle_category_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "sga_programs" DROP COLUMN IF EXISTS "moodle_category_id"
    `);
  }
}
