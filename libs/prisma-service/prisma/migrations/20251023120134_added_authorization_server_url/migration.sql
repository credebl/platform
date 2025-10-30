/*
  Warnings:

  - Added the required column `authorizationServerUrl` to the `oidc_issuer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "oidc_issuer" ADD COLUMN     "authorizationServerUrl" TEXT NOT NULL;
