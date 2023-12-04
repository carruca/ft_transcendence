export GID			=	$(shell id -g)
export UID			=	$(shell id -u)

MKDIR				=	mkdir -p

SRC_PATH			=	./src

VOLUMES_PATH		=	vol

REQUIREMENTS_PATH	=	requirements

CONTAINER_PREFIX	=	transc-

BACKEND				=	backend
CONTAINERS			+=	$(BACKEND)

FRONTEND			=	frontend
CONTAINERS			+=	$(FRONTEND)

POSTGRESQL			=	postgresql
CONTAINERS			+=	$(POSTGRESQL)

PGADMIN				=	pgadmin
CONTAINERS			+=	$(PGADMIN)

VOLUMES				=	$(addprefix	$(SRC_PATH)/$(REQUIREMENTS_PATH)/,		\
							$(addsuffix /$(VOLUMES_PATH), $(CONTAINERS))	\
						)
DOCKER_COMPOSE		= 	docker-compose -f $(SRC_PATH)/docker-compose.yaml
DOCKER				= 	docker

COMMANDS			= 	top ps stop start restart pause unpause down config events up images

ADMINS 				= 	dpoveda- madorna- pmira-pe tsierra- rnavarre

POSTGRES_PATH		= 	$(SRC_PATH)/$(REQUIREMENTS_PATH)/$(POSTGRESQL)/vol/db/
POSTGRES_DIRS		= 	pg_notify pg_replslot pg_tblspc pg_twophase pg_commit_ts pg_stat_tmp pg_logical/snapshots pg_logical/mappings
POSTGRES_DIRS		:= 	$(addprefix $(POSTGRES_PATH), $(POSTGRES_DIRS))

DATABASE 			= 	$(shell cat src/.env 2> /dev/null | grep "POSTGRES_DATABASE" | awk -F"POSTGRES_DATABASE=" '{print $$2;}')

all:			build

-include config.mk

build:			$(VOLUMES)
	$(DOCKER_COMPOSE) up --build -d

re: 			clean all

$(VOLUMES):
	$(MKDIR) $@

$(POSTGRES_DIRS):
#	$(MKDIR) $@ || true

clean:
	$(DOCKER_COMPOSE) down -v

fclean: 		clean
	$(DOCKER_COMPOSE) rm -v
	$(DOCKER_COMPOSE) down --rmi all

print:
	echo $(VOLUMES)
	echo $(CONTAINERS)
	echo $(UID)
	echo $(GID)
	echo $(DATABASE)

logs:
	$(DOCKER_COMPOSE) $@ -f

import:
	$(DOCKER_COMPOSE) exec -u root -t $(POSTGRESQL) pg_restore -d $(DATABASE)

export:
	$(DOCKER_COMPOSE) exec -u root -t $(POSTGRESQL) pg_dump $(DATABASE) --data-only

data:
	$(DOCKER_COMPOSE) exec -u root -t $(POSTGRESQL) psql $(DATABASE) -c "SELECT 'User' as table, * FROM \"user\"; SELECT 'Channel' as table, * FROM \"channel\"; SELECT 'ChannelUser' as table, * FROM \"channel_user\"; SELECT 'Block' as table, * FROM \"block\"; SELECT 'Ban' as table, * FROM \"ban\";"

clear:
	$(DOCKER_COMPOSE) exec -u root -t $(POSTGRESQL) psql $(DATABASE) -c "DELETE FROM \"ban\"; DELETE FROM \"channel_user\"; DELETE FROM \"channel\"; DELETE FROM \"user\"; DELETE FROM \"ban\";"


$(ADMINS): ADMINUSER := $(word 1,$(MAKECMDGOALS))
$(ADMINS): admin

admin:
	$(DOCKER_COMPOSE) exec -u root -t $(POSTGRESQL) psql $(DATABASE) -c "UPDATE \"user\" SET \"mode\" = 1 WHERE \"login\" = '$(ADMINUSER)'"

$(CONTAINERS):
	$(DOCKER) exec -ti $(addprefix $(CONTAINER_PREFIX), $@) sh

$(COMMANDS):
	$(DOCKER_COMPOSE) $@
#	$(DOCKER_COMPOSE) $@ $(filter-out $@, $(MAKECMDGOALS))

.SILENT: fclean clean print $(COMMANDS) $(CONTAINERS)
.PHONY: fclean clean re all print $(COMMANDS) $(CONTAINERS)
