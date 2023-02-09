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
DOCKER_COMPOSE		= docker-compose -f $(SRC_PATH)/docker-compose.yaml
DOCKER				= docker

COMMANDS			= top ps stop start restart pause unpause down config events up images

POSTGRES_PATH		= $(SRC_PATH)/$(REQUIREMENTS_PATH)/$(POSTGRESQL)/vol/db/
POSTGRES_DIRS		= pg_notify pg_replslot pg_tblspc pg_twophase pg_commit_ts pg_stat_tmp pg_logical/snapshots pg_logical/mappings
POSTGRES_DIRS	   := $(addprefix $(POSTGRES_PATH), $(POSTGRES_DIRS))

all:	build

build:	$(VOLUMES) | $(POSTGRES_DIRS)
	$(DOCKER_COMPOSE) up --build -d

re:	clean all

$(VOLUMES):
	$(MKDIR) $@

$(POSTGRES_DIRS):
	$(MKDIR) $@ || true

clean:
	$(DOCKER_COMPOSE) down -v

fclean: clean
	$(DOCKER_COMPOSE) rm -v

print:
	echo $(VOLUMES)
	echo $(CONTAINERS)
	echo $(UID)
	echo $(GID)

logs:
	$(DOCKER_COMPOSE) $@ -f

$(CONTAINERS):
	$(DOCKER) exec -ti $(addprefix $(CONTAINER_PREFIX), $@) sh

$(COMMANDS):
#	$(DOCKER_COMPOSE) $@ $(filter-out $@, $(MAKECMDGOALS))
	$(DOCKER_COMPOSE) $@

.SILENT: fclean clean print $(COMMANDS) $(CONTAINERS)
.PHONY: fclean clean re all print $(COMMANDS)
