/*
  Warnings:

  - The primary key for the `song` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[idx]` on the table `song` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "song"
  ALTER COLUMN "idx" DROP DEFAULT;

DROP SEQUENCE IF EXISTS "song_idx_seq";
-- CreateIndex
CREATE UNIQUE INDEX "song_idx_key" ON "song"("idx");
