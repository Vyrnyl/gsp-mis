-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "date_from" DATE,
ADD COLUMN     "date_to" DATE,
ADD COLUMN     "troop_id" UUID;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_troop_id_fkey" FOREIGN KEY ("troop_id") REFERENCES "troops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
