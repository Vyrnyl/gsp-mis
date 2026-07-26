-- AlterTable
ALTER TABLE "members" ADD COLUMN     "pre_archive_status_id" UUID;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_pre_archive_status_id_fkey" FOREIGN KEY ("pre_archive_status_id") REFERENCES "member_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
