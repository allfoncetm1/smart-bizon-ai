-- Глобальные настройки, редактируемые из /admin (всегда одна строка "singleton"):
-- цены тарифов, длина триала, закрытые разделы сайта, ключи ApiPay.

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "monthlyPrice" INTEGER NOT NULL DEFAULT 5000,
    "yearlyPrice" INTEGER NOT NULL DEFAULT 50000,
    "trialDays" INTEGER NOT NULL DEFAULT 3,
    "sectionsOff" TEXT[] DEFAULT ARRAY['webinars', 'leads', 'analytics']::TEXT[],
    "payMethods" TEXT[] DEFAULT ARRAY['QR', 'PHONE']::TEXT[],
    "apipayApiBase" TEXT NOT NULL DEFAULT '',
    "apipayApiKey" TEXT NOT NULL DEFAULT '',
    "apipayWebhookSecret" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- Сразу заводим единственную строку.
INSERT INTO "AppConfig" ("id", "updatedAt") VALUES ('singleton', CURRENT_TIMESTAMP);
