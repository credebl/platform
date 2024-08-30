/*
  Warnings:

  - Added the required column `userEmail` to the `user_org_delete_activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_org_delete_activity" ADD COLUMN     "userEmail" TEXT NOT NULL;
