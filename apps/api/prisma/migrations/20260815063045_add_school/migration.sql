-- AlterTable
ALTER TABLE "members" ADD COLUMN     "school_id" UUID;

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "council_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schools_council_id_idx" ON "schools"("council_id");

-- CreateIndex
CREATE UNIQUE INDEX "schools_council_id_name_key" ON "schools"("council_id", "name");

-- CreateIndex
CREATE INDEX "members_school_id_idx" ON "members"("school_id");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "councils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
