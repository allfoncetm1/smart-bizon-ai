-- Оплата доступа к платформе через ApiPay (Kaspi).
-- Добавляет Subscription (1:1 с User), Payment (счета ApiPay) и WebhookEvent
-- (дедупликация входящих вебхуков). Существующие пользователи с доступом
-- переносятся как accessVia = ADMIN, чтобы триал их не затронул.

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "AccessVia" AS ENUM ('TRIAL', 'PAID', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PayMethod" AS ENUM ('QR', 'PHONE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'ERROR', 'REFUNDED');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "accessVia" "AccessVia" NOT NULL DEFAULT 'TRIAL',
    "plan" "PlanId",
    "phone" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "plan" "PlanId" NOT NULL,
    "method" "PayMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "apipayInvoiceId" TEXT,
    "kaspiInvoiceId" TEXT,
    "qrTokenUrl" TEXT,
    "qrImageUrl" TEXT,
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'apipay',
    "event" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_apipayInvoiceId_key" ON "Payment"("apipayInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_dedupeKey_key" ON "WebhookEvent"("dedupeKey");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: у всех, кому доступ уже открыт вручную, фиксируем accessVia = ADMIN
-- и status = ACTIVE — их триал не касается, автозакрытия нет. cuid здесь не
-- нужен строгий, генерируем достаточно уникальный id из md5.
INSERT INTO "Subscription" ("id", "userId", "status", "accessVia", "updatedAt")
SELECT 'sub_' || substr(md5(u."id" || '_billing_backfill'), 1, 21),
       u."id", 'ACTIVE'::"SubscriptionStatus", 'ADMIN'::"AccessVia", CURRENT_TIMESTAMP
FROM "User" u
WHERE u."hasAccess" = true;
