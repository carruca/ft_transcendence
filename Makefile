all:
#docker-compose -f src/docker-compose.yaml up --build
	docker-compose -f src/docker-compose.yaml up --build -d

re:	clean all


clean:
	docker-compose -f src/docker-compose.yaml down
	docker volume rm frontend-volume backend-volume postgresql-volume || true
