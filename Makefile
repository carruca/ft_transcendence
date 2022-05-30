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

all:	$(VOLUMES)
	docker-compose -f $(SRC_PATH)docker-compose.yaml up --build -d

re:	clean all

$(VOLUMES):
	$(MKDIR) $@

clean:
	docker-compose -f $(SRC_PATH)docker-compose.yaml down
	docker volume rm frontend-volume backend-volume postgresql-volume || true

print:
	echo $(VOLUMES)

.SILENT: clean print
.PHONY: clean re all print
