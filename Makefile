QML_DIR   = src/paraspots/qml
BRIDGE_PY = src/paraspots/bridge.py

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



.PHONY: help lint check stubs qmllint lintall run web

help:
	@printf "$(BOLD)lint$(RESET)     - run ruff check --fix and ruff format\n"
	@printf "$(BOLD)check$(RESET)    - run ruff check and ty (read-only)\n"
	@printf "$(BOLD)stubs$(RESET)    - regenerate QML type stubs from bridge.py\n"
	@printf "$(BOLD)qmllint$(RESET)  - lint all QML files (regenerates stubs first if needed)\n"
	@printf "$(BOLD)run$(RESET)      - launch the app\n"
	@printf "$(BOLD)web$(RESET)      - serve the html_js_port web build and open it in a browser\n"

lint:
	$(call printstart,Running ruff check --fix and format...)
	uv run ruff check --fix src/
	uv run ruff format src/
	$(done)

check:
	$(call printstart,Running 'ruff check' and 'ty check'...)
	uv run ruff check src/
	uv run ty check
	$(done)

$(QML_DIR)/paraspots.qmltypes: $(BRIDGE_PY)
	@printf "$(CYAN)### bridge.py has changed. Rebuilding .qmltypes... ###$(RESET)\n"
	uv run pyside6-metaobjectdump $(BRIDGE_PY) --out-file $(QML_DIR)/bridge.json
	uv run pyside6-qmltyperegistrar \
		--generate-qmltypes $(QML_DIR)/paraspots.qmltypes \
		--import-name qml --major-version 1 --minor-version 0 \
		$(QML_DIR)/bridge.json > /dev/null
	rm -f $(QML_DIR)/bridge.json
	$(done)

stubs: $(QML_DIR)/paraspots.qmltypes

qmllint: stubs
	@printf "$(CYAN)### Running linter on QML files... ###$(RESET)\n"
	uv run pyside6-qmllint -I $(QML_DIR) $(QML_DIR)/*.qml
	$(done)

lintall:
	@$(MAKE) --no-print-directory qmllint || (printf "\n$(RED)$(BOLD)### FAILED: qmllint ###$(RESET)\n" && exit 1)
	@$(MAKE) --no-print-directory lint    || (printf "\n$(RED)$(BOLD)### FAILED: lint ###$(RESET)\n"    && exit 1)
	@$(MAKE) --no-print-directory check   || (printf "\n$(RED)$(BOLD)### FAILED: check ###$(RESET)\n"   && exit 1)
	@printf "\n$(GREEN)$(BOLD)### ALL CHECKS PASSED! ###$(RESET)\n"

run:
	uv run paraspots

web:
	$(call printstart,Serving docs/ at http://localhost:8000 ...)
	@cd docs && (xdg-open http://localhost:8000 &) && python3 -m http.server
