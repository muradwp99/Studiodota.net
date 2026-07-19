-- AlterTable
ALTER TABLE `block` ADD COLUMN `draft` JSON NULL,
    ADD COLUMN `snapshot` JSON NULL,
    ADD COLUMN `snapshotAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `contactmessage` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `galleryitem` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `snapshot` JSON NULL,
    ADD COLUMN `snapshotAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `media` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `page` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `draft` JSON NULL,
    ADD COLUMN `snapshot` JSON NULL,
    ADD COLUMN `snapshotAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `post` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `snapshot` JSON NULL,
    ADD COLUMN `snapshotAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `project` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `snapshot` JSON NULL,
    ADD COLUMN `snapshotAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `ContactMessage_deletedAt_idx` ON `ContactMessage`(`deletedAt`);

-- CreateIndex
CREATE INDEX `GalleryItem_deletedAt_idx` ON `GalleryItem`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Media_deletedAt_idx` ON `Media`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Page_deletedAt_idx` ON `Page`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Post_deletedAt_idx` ON `Post`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Project_deletedAt_idx` ON `Project`(`deletedAt`);
