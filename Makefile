MKDIR				=	mkdir -p

SRC_PATH			=	./src/

VOLUMES_PATH		=	vol/

REQUIREMENTS_PATH	=	requirements/

BACKEND				=	backend
CONTAINERS			+=	$(BACKEND)

FRONTEND			=	frontend
CONTAINERS			+=	$(FRONTEND)

POSTGRESQL			=	postgresql
CONTAINERS			+=	$(POSTGRESQL)

VOLUMES				=	$(addprefix	$(SRC_PATH)$(REQUIREMENTS_PATH),		\
							$(addsuffix /$(VOLUMES_PATH), $(CONTAINERS))	\
						)
DOCKER_COMPOSE		= docker-compose -f $(SRC_PATH)docker-compose.yaml

POSTGRES_PATH		= src/requirements/postgresql/vol/db/
POSTGRES_DIRS		= pg_notify pg_replslot pg_tblspc pg_twophase pg_commit_ts pg_stat_tmp pg_logical/snapshots pg_logical/mappings
POSTGRES_DIRS	   := $(addprefix $(POSTGRES_PATH), $(POSTGRES_DIRS))

all:	$(VOLUMES) $(POSTGRES_DIRS)
	$(DOCKER_COMPOSE) up --build -d

re:	clean all

$(VOLUMES):
	$(MKDIR) $@

$(POSTGRES_DIRS):
	$(MKDIR) $@

clean:
	$(DOCKER_COMPOSE) down
	docker volume rm $$(docker volume ls -q) || true

fclean: clean
	docker rmi $$(docker images -q)
	docker system prune -f
	chown -R $(USER) .

print:
	echo $(VOLUMES)

ps:
	$(DOCKER_COMPOSE) ps

logs:
	$(DOCKER_COMPOSE) logs

.SILENT: fclean clean print
.PHONY: fclean clean re all print
