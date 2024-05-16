/*
  Warnings:

  - The `type` column on the `schema` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SchemaType" AS ENUM ('indy', 'w3c');

-- AlterTable
ALTER TABLE "schema" DROP COLUMN "type",
ADD COLUMN     "type" "SchemaType" NOT NULL DEFAULT 'indy';
