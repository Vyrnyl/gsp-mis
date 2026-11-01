-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "municipality_id" UUID;

-- CreateTable
CREATE TABLE "municipalities" (
    "id" UUID NOT NULL,
    "council_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "municipalities_council_id_idx" ON "municipalities"("council_id");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_council_id_name_key" ON "municipalities"("council_id", "name");

-- CreateIndex
CREATE INDEX "schools_municipality_id_idx" ON "schools"("municipality_id");

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "councils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

