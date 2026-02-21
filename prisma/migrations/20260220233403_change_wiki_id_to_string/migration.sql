-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SCItemCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wikiId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subType" TEXT,
    "manufacturer" TEXT,
    "size" TEXT,
    "grade" TEXT,
    "class" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SCItemCache" ("class", "createdAt", "description", "grade", "id", "imageUrl", "manufacturer", "name", "size", "subType", "type", "updatedAt", "wikiId") SELECT "class", "createdAt", "description", "grade", "id", "imageUrl", "manufacturer", "name", "size", "subType", "type", "updatedAt", "wikiId" FROM "SCItemCache";
DROP TABLE "SCItemCache";
ALTER TABLE "new_SCItemCache" RENAME TO "SCItemCache";
CREATE UNIQUE INDEX "SCItemCache_wikiId_key" ON "SCItemCache"("wikiId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
