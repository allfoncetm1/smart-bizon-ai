-- Новое значение enum: доступ, выданный админом вручную на срок
-- (истекает по trialEndsAt, как триал, без крона).
ALTER TYPE "AccessVia" ADD VALUE 'COMP';
