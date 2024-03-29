CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS "user_link";
DROP TABLE IF EXISTS "channel";
DROP TABLE IF EXISTS "channel_user";
DROP TABLE IF EXISTS "match";
DROP TABLE IF EXISTS "match_type";
DROP TABLE IF EXISTS "match_user";
DROP TABLE IF EXISTS "message";
DROP TABLE IF EXISTS "achievement";
DROP TABLE IF EXISTS "achievement_info";

CREATE TABLE "user" (
	"id_user" uuid DEFAULT uuid_generate_v4(),
	"nick" varchar(15) NOT NULL UNIQUE,
	"avatar_uri" TEXT NOT NULL,
	"status" integer NOT NULL,
	"token" TEXT NOT NULL,
	"win_count" numeric NOT NULL DEFAULT '0',
	"lose_count" numeric NOT NULL DEFAULT '0',
	"admin" bool NOT NULL,
	"ranking" integer NOT NULL DEFAULT '1000',
	"last_seen" DATE NOT NULL,
	CONSTRAINT "user_pk" PRIMARY KEY ("id_user")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "user_link" (
	"id_user_link" serial NOT NULL,
	"id_user" uuid,
	"id_other" uuid NOT NULL,
	"flags" integer NOT NULL DEFAULT '0',
	CONSTRAINT "user_link_pk" PRIMARY KEY ("id_user_link","id_user","id_other")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "channel" (
	"id_channel" uuid DEFAULT uuid_generate_v4(),
	"name" varchar(25) NOT NULL,
	"private" bool NOT NULL,
	"password" varchar(20) NOT NULL,
	CONSTRAINT "channel_pk" PRIMARY KEY ("id_channel")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "channel_user" (
	"id_channel" uuid NOT NULL,
	"id_user" uuid NOT NULL,
	"flags" integer NOT NULL DEFAULT '0',
	CONSTRAINT "channel_user_pk" PRIMARY KEY ("id_channel","id_user")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "match" (
	"id_match" uuid DEFAULT uuid_generate_v4(),
	"id_match_type" integer NOT NULL,
	"date" DATE NOT NULL,
	CONSTRAINT "match_pk" PRIMARY KEY ("id_match")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "match_type" (
	"id_match_type" serial NOT NULL,
	"name" varchar(25) NOT NULL,
	"description" TEXT NOT NULL,
	"max_score" integer NOT NULL,
	CONSTRAINT "match_type_pk" PRIMARY KEY ("id_match_type")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "match_user" (
	"id_match" uuid NOT NULL,
	"id_user" uuid NOT NULL,
	"score" integer NOT NULL DEFAULT '0',
	CONSTRAINT "match_user_pk" PRIMARY KEY ("id_match","id_user")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "message" (
	"id_message" serial NOT NULL,
	"id_channel" uuid NOT NULL,
	"id_user" uuid NOT NULL,
	"date" DATE NOT NULL,
	"message" TEXT NOT NULL,
	CONSTRAINT "message_pk" PRIMARY KEY ("id_message","id_channel","id_user")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "achievement" (
	"id_user" uuid DEFAULT uuid_generate_v4(),
	"id_achievement_info" uuid NOT NULL,
	CONSTRAINT "achievement_pk" PRIMARY KEY ("id_user")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "achievement_info" (
	"id_achievement_info" uuid DEFAULT uuid_generate_v4(),
	"name" varchar(30) NOT NULL,
	"description" TEXT NOT NULL,
	CONSTRAINT "achievement_info_pk" PRIMARY KEY ("id_achievement_info")
) WITH (
  OIDS=FALSE
);




ALTER TABLE "user_link" ADD CONSTRAINT "user_link_fk0" FOREIGN KEY ("id_user") REFERENCES "user"("id_user");
ALTER TABLE "user_link" ADD CONSTRAINT "user_link_fk1" FOREIGN KEY ("id_other") REFERENCES "user"("id_user");


ALTER TABLE "channel_user" ADD CONSTRAINT "channel_user_fk0" FOREIGN KEY ("id_channel") REFERENCES "channel"("id_channel");
ALTER TABLE "channel_user" ADD CONSTRAINT "channel_user_fk1" FOREIGN KEY ("id_user") REFERENCES "user"("id_user");

ALTER TABLE "match" ADD CONSTRAINT "match_fk0" FOREIGN KEY ("id_match_type") REFERENCES "match_type"("id_match_type");


ALTER TABLE "match_user" ADD CONSTRAINT "match_user_fk0" FOREIGN KEY ("id_match") REFERENCES "match"("id_match");
ALTER TABLE "match_user" ADD CONSTRAINT "match_user_fk1" FOREIGN KEY ("id_user") REFERENCES "user"("id_user");

ALTER TABLE "message" ADD CONSTRAINT "message_fk0" FOREIGN KEY ("id_channel") REFERENCES "channel"("id_channel");
ALTER TABLE "message" ADD CONSTRAINT "message_fk1" FOREIGN KEY ("id_user") REFERENCES "user"("id_user");

ALTER TABLE "achievement" ADD CONSTRAINT "achievement_fk0" FOREIGN KEY ("id_user") REFERENCES "user"("id_user");
ALTER TABLE "achievement" ADD CONSTRAINT "achievement_fk1" FOREIGN KEY ("id_achievement_info") REFERENCES "user"("id_user");

