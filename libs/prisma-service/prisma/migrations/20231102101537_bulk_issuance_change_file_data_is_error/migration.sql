/*
  Warnings:

  - The `isError` column on the `file_data` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "file_data" DROP COLUMN "isError",
ADD COLUMN     "isError" BOOLEAN;
