-- DropIndex
DROP INDEX "troops_leader_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "troops_leader_id_key" ON "troops"("leader_id");
