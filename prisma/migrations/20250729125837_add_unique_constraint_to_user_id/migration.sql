/*
  Warnings:

  - You are about to drop the column `credit` on the `charge_order` table. All the data in the column will be lost.
  - You are about to drop the column `credit` on the `charge_product` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `charge_product` table. All the data in the column will be lost.
  - You are about to drop the column `original_amount` on the `charge_product` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `charge_product` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `charge_product` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `charge_product` table. All the data in the column will be lost.
  - You are about to drop the `claimed_activity_order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `flux_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `flux_downloads` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `flux_views` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gift_code` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `newsletters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscribers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_billing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_credit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_credit_transaction` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,locale]` on the table `charge_product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `user_payment_info` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `charge_product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "charge_order" DROP COLUMN "credit",
ADD COLUMN     "provider_order_id" VARCHAR;

-- AlterTable
ALTER TABLE "charge_product" DROP COLUMN "credit",
DROP COLUMN "message",
DROP COLUMN "original_amount",
DROP COLUMN "state",
DROP COLUMN "tag",
DROP COLUMN "title",
ADD COLUMN     "description" VARCHAR,
ADD COLUMN     "features" JSON,
ADD COLUMN     "name" VARCHAR NOT NULL,
ALTER COLUMN "locale" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_payment_info" ADD COLUMN     "paypal_subscription_id" VARCHAR,
ADD COLUMN     "subscription_expires_at" TIMESTAMP(6),
ADD COLUMN     "subscription_plan_id" VARCHAR,
ADD COLUMN     "subscription_provider" VARCHAR DEFAULT 'paypal',
ADD COLUMN     "subscription_status" VARCHAR;

-- DropTable
DROP TABLE "claimed_activity_order";

-- DropTable
DROP TABLE "flux_data";

-- DropTable
DROP TABLE "flux_downloads";

-- DropTable
DROP TABLE "flux_views";

-- DropTable
DROP TABLE "gift_code";

-- DropTable
DROP TABLE "media";

-- DropTable
DROP TABLE "newsletters";

-- DropTable
DROP TABLE "subscribers";

-- DropTable
DROP TABLE "user_billing";

-- DropTable
DROP TABLE "user_credit";

-- DropTable
DROP TABLE "user_credit_transaction";

-- CreateTable
CREATE TABLE "user_conversion_usage" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(200) NOT NULL,
    "daily_conversion_count" INTEGER NOT NULL DEFAULT 0,
    "last_conversion_date" DATE,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_conversion_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_history" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(200) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "original_file_size" INTEGER NOT NULL,
    "converted_file_name" VARCHAR(255),
    "download_url" TEXT,
    "url_expires_at" TIMESTAMP(6),
    "conversion_cost" DOUBLE PRECISION,
    "status" VARCHAR(50) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_conversion_usage_user_id_key" ON "user_conversion_usage"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "charge_product_name_locale_key" ON "charge_product"("name", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "user_payment_info_user_id_key" ON "user_payment_info"("user_id");
