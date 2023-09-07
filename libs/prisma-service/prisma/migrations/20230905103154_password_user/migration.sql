/*
  Warnings:

  - You are about to drop the column `password` on the `user_devices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "password" VARCHAR;

-- AlterTable
ALTER TABLE "user_devices" DROP COLUMN "password";
