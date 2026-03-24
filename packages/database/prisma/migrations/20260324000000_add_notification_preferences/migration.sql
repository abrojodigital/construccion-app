-- AlterTable: Add notificationPreferences column to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;
