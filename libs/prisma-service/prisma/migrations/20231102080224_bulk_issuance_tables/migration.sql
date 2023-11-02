-- CreateTable
CREATE TABLE "file_upload" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT,
    "upload_type" TEXT,
    "orgId" TEXT NOT NULL DEFAULT '1',
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL DEFAULT '1',
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" TEXT NOT NULL DEFAULT '1',
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "file_upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_data" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT,
    "isError" TEXT,
    "error" TEXT,
    "detailError" TEXT,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL DEFAULT '1',
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" TEXT NOT NULL DEFAULT '1',
    "deletedAt" TIMESTAMP(6),
    "fileUploadId" TEXT NOT NULL,

    CONSTRAINT "file_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file_data" ADD CONSTRAINT "file_data_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "file_upload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
