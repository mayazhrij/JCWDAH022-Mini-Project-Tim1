-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('CUSTOMER', 'ORGANIZER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizer_profile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "organizer_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_event" (
    "category_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "category_event_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "public"."location" (
    "location_id" SERIAL NOT NULL,
    "city" TEXT NOT NULL,
    "address_details" TEXT,

    CONSTRAINT "location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "public"."event" (
    "event_id" SERIAL NOT NULL,
    "organizer_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "location_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "public"."ticket_type" (
    "ticket_type_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price_idr" INTEGER NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "available_seats" INTEGER NOT NULL,

    CONSTRAINT "ticket_type_pkey" PRIMARY KEY ("ticket_type_id")
);

-- CreateTable
CREATE TABLE "public"."promotion_voucher" (
    "voucher_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_voucher_pkey" PRIMARY KEY ("voucher_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_profile_userId_key" ON "public"."organizer_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "category_event_name_key" ON "public"."category_event"("name");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_voucher_code_key" ON "public"."promotion_voucher"("code");

-- AddForeignKey
ALTER TABLE "public"."organizer_profile" ADD CONSTRAINT "organizer_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event" ADD CONSTRAINT "event_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event" ADD CONSTRAINT "event_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event" ADD CONSTRAINT "event_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category_event"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_type" ADD CONSTRAINT "ticket_type_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_voucher" ADD CONSTRAINT "promotion_voucher_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;
