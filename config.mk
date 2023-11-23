CONFIG_FILE 		= 	.config
CONFIG_LOAD 		= 	load_configuration

configure: MAKEFLAGS += --silent --always-make --no-print-directory
configure:
	$(MAKE) $(CONFIG_FILE)

$(CONFIG_FILE):
	echo "Please enter the following information:"
	read -p "Intra 42 UID: " INTRA42_UID; \
	read -p "Intra 42 Secret: " INTRA42_SECRET; \
	read -p "Intra 42 Redirect URI: " INTRA42_REDIRECT_URI; \
	read -p "Enable MOCK?: " INTRA42_MOCK; \
	echo "export INTRA42_UID=$$INTRA42_UID" > .config; \
	echo "export INTRA42_SECRET=$$INTRA42_SECRET" >> .config; \
	echo "export INTRA42_REDIRECT_URI=$$INTRA42_REDIRECT_URI" >> .config; \
	echo "export INTRA42_MOCK (true/false)=$$INTRA42_MOCK" >> .config; \
	echo "Configuration file generated."

include $(CONFIG_FILE)

.SILENT: configure $(CONFIG_FILE)
.PHONY: configure
