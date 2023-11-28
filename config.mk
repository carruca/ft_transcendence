CONFIG_FILE     = .config
CONFIG_LOAD     = load_configuration
TRANSC_HOST     = localhost

configure: MAKEFLAGS += --silent --always-make --no-print-directory
configure: $(CONFIG_FILE)

$(CONFIG_FILE):
	@echo "Please enter the following information:"
	@read -p "Intra 42 UID <none>: " INTRA42_UID; \
	read -p "Intra 42 Secret <none>: " INTRA42_SECRET; \
	read -p "Intra 42 Redirect URI <none>: " INTRA42_REDIRECT_URI; \
	read -p "Transcendence host <localhost>: " TRANSC_HOST; \
	read -p "Enable MOCK? <false>: " INTRA42_MOCK; \
	echo "export INTRA42_UID=$$INTRA42_UID" > $@; \
	echo "export INTRA42_SECRET=$$INTRA42_SECRET" >> $@; \
	echo "export INTRA42_REDIRECT_URI=$$INTRA42_REDIRECT_URI" >> $@; \
	echo "export TRANSC_HOST=$$TRANSC_HOST" >> $@; \
	echo "export INTRA42_MOCK=$$INTRA42_MOCK" >> $@; \
	echo "Configuration file generated."

include $(CONFIG_FILE)

.SILENT: configure $(CONFIG_FILE)
.PHONY: configure

