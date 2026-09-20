-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'ARTICULO',
ADD COLUMN     "keyPoints" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "body" DROP NOT NULL;

