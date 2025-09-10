-- Migration: Add Creem payment fields to UserPaymentInfo table
-- Created: 2025-09-03
-- Purpose: Support Creem payment system integration

-- Add Creem-specific fields
ALTER TABLE "user_payment_info" 
ADD COLUMN "creem_customer_id" VARCHAR,
ADD COLUMN "creem_subscription_id" VARCHAR;

-- Update default subscription provider to Creem
ALTER TABLE "user_payment_info" 
ALTER COLUMN "subscription_provider" SET DEFAULT 'creem';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_user_payment_info_creem_customer_id" 
ON "user_payment_info" ("creem_customer_id");

CREATE INDEX IF NOT EXISTS "idx_user_payment_info_creem_subscription_id" 
ON "user_payment_info" ("creem_subscription_id");

-- Add index for subscription provider filtering
CREATE INDEX IF NOT EXISTS "idx_user_payment_info_subscription_provider" 
ON "user_payment_info" ("subscription_provider");

-- Add comments for documentation
COMMENT ON COLUMN "user_payment_info"."creem_customer_id" IS 'Creem customer ID for payment processing';
COMMENT ON COLUMN "user_payment_info"."creem_subscription_id" IS 'Creem subscription ID for tracking active subscriptions';
COMMENT ON COLUMN "user_payment_info"."subscription_provider" IS 'Payment provider: creem, paypal, or stripe';