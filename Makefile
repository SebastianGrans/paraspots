PY_DIR    = py
UV        = cd $(PY_DIR) && uv run
QML_DIR   = $(PY_DIR)/src/paraspots/qml
BRIDGE_PY = $(PY_DIR)/src/paraspots/bridge.py

CYAN  = \033[36m
GREEN = \033[32m
RED   = \033[31m
BOLD  = \033[1m
RESET = \033[0m


define printstart
@printf "$(CYAN)### $(1) ###$(RESET)\n"
endef

# NOTE: The hashtags need to be escaped to prevent make from thinking they are comments...
done = @printf "$(GREEN)\#\#\# DONE! \#\#\#$(RESET)\n\n"



.PHONY: help lint check stubs qmllint lintall run web mobileweb

help:
	@printf "$(BOLD)lint$(RESET)     - run ruff check --fix and ruff format\n"
	@printf "$(BOLD)check$(RESET)    - run ruff check and ty (read-only)\n"
	@printf "$(BOLD)stubs$(RESET)    - regenerate QML type stubs from bridge.py\n"
	@printf "$(BOLD)qmllint$(RESET)  - lint all QML files (regenerates stubs first if needed)\n"
	@printf "$(BOLD)run$(RESET)      - launch the app\n"
	@printf "$(BOLD)web$(RESET)      - serve the html_js_port web build and open it in a browser\n"
	@printf "$(BOLD)mobileweb$(RESET) - serve the web build and open it in a phone-sized Chromium window\n"

lint:
	$(call printstart,Running ruff check --fix and format...)
	$(UV) ruff check --fix src/
	$(UV) ruff format src/
	$(done)

check:
	$(call printstart,Running 'ruff check' and 'ty check'...)
	$(UV) ruff check src/
	$(UV) ty check
	$(done)

$(QML_DIR)/paraspots.qmltypes: $(BRIDGE_PY)
	@printf "$(CYAN)### bridge.py has changed. Rebuilding .qmltypes... ###$(RESET)\n"
	$(UV) pyside6-metaobjectdump src/paraspots/bridge.py --out-file src/paraspots/qml/bridge.json
	$(UV) pyside6-qmltyperegistrar \
		--generate-qmltypes src/paraspots/qml/paraspots.qmltypes \
		--import-name qml --major-version 1 --minor-version 0 \
		src/paraspots/qml/bridge.json > /dev/null
	rm -f $(QML_DIR)/bridge.json
	$(done)

stubs: $(QML_DIR)/paraspots.qmltypes

qmllint: stubs
	@printf "$(CYAN)### Running linter on QML files... ###$(RESET)\n"
	$(UV) pyside6-qmllint -I src/paraspots/qml src/paraspots/qml/*.qml
	$(done)

lintall:
	@$(MAKE) --no-print-directory qmllint || (printf "\n$(RED)$(BOLD)### FAILED: qmllint ###$(RESET)\n" && exit 1)
	@$(MAKE) --no-print-directory lint    || (printf "\n$(RED)$(BOLD)### FAILED: lint ###$(RESET)\n"    && exit 1)
	@$(MAKE) --no-print-directory check   || (printf "\n$(RED)$(BOLD)### FAILED: check ###$(RESET)\n"   && exit 1)
	@printf "\n$(GREEN)$(BOLD)### ALL CHECKS PASSED! ###$(RESET)\n"

run:
	$(UV) paraspots

web: PORT = 8000
web:
	$(call printstart,Serving docs/ at http://localhost:$(PORT) ...)
	@cd docs && (xdg-open http://localhost:$(PORT) &) && python3 -m http.server $(PORT)

mobileweb: PORT = 8000
mobileweb:
	$(call printstart,Serving docs/ at http://localhost:$(PORT) in a phone-sized window ...)
	@cd docs && (sleep 1 && /snap/bin/chromium --app=http://localhost:$(PORT) --window-size=390,844 &) && python3 -m http.server $(PORT)
