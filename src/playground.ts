/**
 * /playground - interactive MCP Playground
 *
 * A self-contained browser page that talks to the /mcp endpoint via
 * JSON-RPC over Streamable HTTP. No external JavaScript dependencies.
 *
 * Styling comes from the shared design layer in ./ui/theme; everything below
 * is playground-specific and built only from the shared tokens.
 */

import { renderPage } from "./ui/theme";

const CSS = `
.page-head {
	padding: 2.5rem 0 1.75rem;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1.5rem;
	flex-wrap: wrap;
}
.page-head p { margin-top: 0.5rem; max-width: 58ch; }

/* Connection state. A coloured dot is honest here: it encodes a real state. */
.status {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.4rem 0.75rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface-raised);
	font-size: 0.8125rem;
	flex-shrink: 0;
}
.status-dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	flex-shrink: 0;
	background: var(--text-faint);
	transition: background 0.15s ease;
}
.status-dot.connected { background: var(--success); }
.status-dot.disconnected { background: var(--danger); }
.status-dot.connecting { background: var(--text-faint); }
.status-text { color: var(--text-muted); white-space: nowrap; }
.status-text.disconnected { color: var(--danger); }

/* Tabs: an underline, not a pill. */
.tabs {
	display: flex;
	gap: 1.5rem;
	border-bottom: 1px solid var(--border);
	margin-bottom: 1.75rem;
}
.tab-btn {
	font: inherit;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--text-muted);
	background: none;
	border: 0;
	border-bottom: 2px solid transparent;
	padding: 0.6rem 0;
	margin-bottom: -1px;
	cursor: pointer;
	transition: color 0.15s ease, border-color 0.15s ease;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--text); border-bottom-color: var(--accent-line); }
.tab-count {
	font-family: var(--mono);
	font-variant-numeric: tabular-nums;
	font-size: 0.75rem;
	color: var(--text-faint);
	margin-left: 0.35rem;
}
.tab-btn.active .tab-count { color: var(--accent); }

.panel { display: none; }
.panel.active { display: block; }

/* Cards */
.card {
	padding: 1rem 1.1rem;
	margin-bottom: 0.75rem;
	transition: border-color 0.15s ease;
}
.card:hover { border-color: var(--border-strong); }

.tool-card h3 {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	margin: 0 0 0.4rem;
	cursor: pointer;
	user-select: none;
}
.tool-card h3 .arrow {
	width: 18px;
	height: 18px;
	flex-shrink: 0;
	display: grid;
	place-items: center;
	border: 1px solid var(--border-strong);
	border-radius: 4px;
	color: var(--text-muted);
	font-size: 0.5rem;
	transition: transform 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.tool-card h3:hover .arrow { color: var(--text); }
.tool-card h3 .arrow.expanded { transform: rotate(90deg); color: var(--accent); border-color: var(--accent); }
.tool-card h3 code { font-size: 0.75rem; color: var(--text-muted); font-weight: 400; }

.tool-desc {
	font-size: 0.875rem;
	color: var(--text-muted);
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.tool-hints { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.5rem; }
.hint {
	font-size: 0.6875rem;
	font-weight: 500;
	padding: 0.1rem 0.45rem;
	border-radius: 999px;
	border: 1px solid var(--border-strong);
	color: var(--text-muted);
}
.hint.read-only { color: var(--success); border-color: var(--success); background: var(--success-soft); }
.hint.destructive { color: var(--danger); border-color: var(--danger); background: var(--danger-soft); }
.hint.open-world { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }

.tool-form { overflow: hidden; transition: max-height 0.15s ease, opacity 0.15s ease; }
.tool-form.collapsed { max-height: 0; opacity: 0; margin: 0; }
.tool-form.expanded { max-height: 900px; opacity: 1; margin-top: 0.85rem; }

/* Inputs: label above the field, never a placeholder standing in for one. */
.input-group { margin-bottom: 0.75rem; }
.input-group:last-of-type { margin-bottom: 0.85rem; }
.input-label {
	display: block;
	font-size: 0.8125rem;
	font-weight: 500;
	color: var(--text);
	margin-bottom: 0.3rem;
}
.input-field {
	width: 100%;
	padding: 0.5rem 0.65rem;
	border: 1px solid var(--border-strong);
	border-radius: var(--radius-sm);
	font: inherit;
	font-size: 0.875rem;
	background: var(--bg);
	color: var(--text);
	transition: border-color 0.15s ease;
}
.input-field:hover { border-color: var(--text-faint); }
.input-field:focus-visible { outline: 2px solid var(--accent-line); outline-offset: 1px; border-color: var(--accent-line); }
.input-field::placeholder { color: var(--text-muted); opacity: 1; }
select.input-field { cursor: pointer; }
textarea.input-field { min-height: 84px; resize: vertical; font-family: var(--mono); font-size: 0.8125rem; }

/* Schema disclosure */
.schema-toggle {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	margin-top: 0.75rem;
	font-family: var(--mono);
	font-size: 0.75rem;
	color: var(--text-muted);
	cursor: pointer;
	user-select: none;
	transition: color 0.15s ease;
}
.schema-toggle:hover { color: var(--text); }
.schema-toggle .chevron { display: inline-block; font-size: 0.55rem; transition: transform 0.15s ease; }
.schema-toggle .chevron.open { transform: rotate(90deg); color: var(--accent); }
.schema-block { display: none; margin: 0.6rem 0 0; font-size: 0.75rem; }
.schema-block.open { display: block; }

/* Resources */
.resource-list { display: flex; flex-direction: column; gap: 0.5rem; }
.resource-item {
	padding: 0.75rem 0.9rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	background: var(--surface);
	display: flex;
	align-items: baseline;
	gap: 0.75rem;
	flex-wrap: wrap;
	transition: border-color 0.15s ease;
}
.resource-item:hover { border-color: var(--border-strong); }
.resource-uri {
	font-family: var(--mono);
	font-size: 0.8125rem;
	color: var(--accent);
	text-decoration: none;
}
.resource-uri:hover { text-decoration: underline; }
.resource-desc { font-size: 0.875rem; color: var(--text-muted); flex: 1; min-width: 180px; }
.resource-mime {
	font-family: var(--mono);
	font-size: 0.6875rem;
	color: var(--text-faint);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 0.1rem 0.45rem;
}

/* Prompts */
.prompt-card h3 { margin: 0 0 0.35rem; }
.prompt-args { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.5rem; }
.prompt-arg-tag {
	font-family: var(--mono);
	font-size: 0.6875rem;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 0.1rem 0.45rem;
}

/* Result dialog */
.result-dialog {
	border: 1px solid var(--border-strong);
	border-radius: var(--radius);
	background: var(--surface);
	color: var(--text);
	padding: 0;
	max-width: 780px;
	width: calc(100% - 2rem);
	margin: auto;
	font-family: var(--sans);
	box-shadow: var(--shadow);
}
.result-dialog::backdrop { background: rgb(0 0 0 / 0.45); }
.dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.85rem 1.1rem;
	border-bottom: 1px solid var(--border);
}
.dialog-title { font-size: 0.875rem; font-weight: 600; }
.dialog-close {
	font: inherit;
	font-size: 0.8125rem;
	padding: 0.3rem 0.65rem;
	border: 1px solid var(--border-strong);
	border-radius: var(--radius-sm);
	background: var(--surface);
	color: var(--text-muted);
	cursor: pointer;
	transition: color 0.15s ease, border-color 0.15s ease;
}
.dialog-close:hover { color: var(--text); border-color: var(--text-faint); }
.dialog-body { padding: 1.1rem; max-height: 62vh; overflow: auto; }
.dialog-body pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
.dialog-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.75rem 1.1rem;
	border-top: 1px solid var(--border);
}
.dialog-status { font-size: 0.8125rem; display: inline-flex; align-items: center; gap: 0.4rem; }
.dialog-status::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.dialog-status.success { color: var(--success); }
.dialog-status.error { color: var(--danger); }
.dialog-status.loading { color: var(--text-faint); }
.copy-btn {
	font: inherit;
	font-size: 0.8125rem;
	padding: 0.3rem 0.65rem;
	border: 1px solid var(--border-strong);
	border-radius: var(--radius-sm);
	background: var(--surface);
	color: var(--text-muted);
	cursor: pointer;
	transition: color 0.15s ease, border-color 0.15s ease;
}
.copy-btn:hover { color: var(--text); border-color: var(--text-faint); }
.copy-btn.copied { color: var(--success); border-color: var(--success); }

/* Empty, loading and error states */
.empty-state {
	padding: 2.25rem 1.25rem;
	text-align: center;
	font-size: 0.875rem;
	color: var(--text-muted);
	border: 1px dashed var(--border-strong);
	border-radius: var(--radius);
}
.muted { font-size: 0.875rem; }

@media (max-width: 640px) {
	.page-head { padding-top: 1.75rem; }
	.tabs { gap: 1.1rem; }
	.resource-item { flex-direction: column; align-items: flex-start; gap: 0.3rem; }
	.dialog-footer { flex-direction: column; align-items: stretch; }
}
`;

const BODY = `
<main class="wrap">
	<div class="page-head">
		<div>
			<h1>Playground</h1>
			<p>Call tools, read resources and fetch prompts straight from the browser.
			Every JSON-RPC request goes to <code>/mcp</code> on this origin, so no MCP client is required.</p>
		</div>
		<div class="status">
			<span id="status-dot" class="status-dot connecting"></span>
			<span id="status-text" class="status-text">Initializing&hellip;</span>
		</div>
	</div>

	<nav class="tabs" role="tablist">
		<button class="tab-btn active" data-tab="tools" role="tab" aria-selected="true">Tools <span class="tab-count" id="count-tools">0</span></button>
		<button class="tab-btn" data-tab="resources" role="tab" aria-selected="false">Resources <span class="tab-count" id="count-resources">0</span></button>
		<button class="tab-btn" data-tab="prompts" role="tab" aria-selected="false">Prompts <span class="tab-count" id="count-prompts">0</span></button>
	</nav>

	<section id="panel-tools" class="panel active" role="tabpanel" aria-label="Tools">
		<div id="tools-list"><p class="muted">Loading tools&hellip;</p></div>
	</section>

	<section id="panel-resources" class="panel" role="tabpanel" aria-label="Resources">
		<div id="resources-list" class="resource-list"><p class="muted">Loading resources&hellip;</p></div>
	</section>

	<section id="panel-prompts" class="panel" role="tabpanel" aria-label="Prompts">
		<div id="prompts-list"><p class="muted">Loading prompts&hellip;</p></div>
	</section>
</main>
`;

const TAIL = `<dialog id="result-dialog" class="result-dialog" aria-modal="true" aria-labelledby="dialog-title">
	<div class="dialog-header">
		<span id="dialog-title" class="dialog-title">Result</span>
		<button class="dialog-close" id="dialog-close">Close</button>
	</div>
	<div class="dialog-body" id="dialog-body"></div>
	<div class="dialog-footer">
		<span id="dialog-status" class="dialog-status"></span>
		<button class="copy-btn" id="dialog-copy">Copy</button>
	</div>
</dialog>

<script>
(function () {
	"use strict";

	var MCP_ENDPOINT = "/mcp";
	var PROTOCOL_VERSION = "2024-11-05";

	var requestId = 1;
	var serverInfo = null;

	// --- DOM helpers ---
	var $ = function (sel) { return document.getElementById(sel); };
	var statusDot = $("status-dot");
	var statusText = $("status-text");
	var resultDialog = $("result-dialog");
	var dialogBody = $("dialog-body");
	var dialogStatus = $("dialog-status");
	var dialogCopy = $("dialog-copy");
	var dialogClose = $("dialog-close");

	function setStatus(state, message) {
		statusDot.className = "status-dot " + state;
		statusText.className = "status-text " + (state === "disconnected" ? "disconnected" : "");
		statusText.innerHTML = message;
	}

	// --- Dialog helpers ---
	function openDialog() {
		if (resultDialog.open) return;
		resultDialog.showModal();
	}

	function closeDialog() {
		if (resultDialog.open) resultDialog.close();
	}

	function setDialogStatus(state, label) {
		dialogStatus.className = "dialog-status " + state;
		dialogStatus.textContent = label || "";
	}

	dialogClose.addEventListener("click", closeDialog);
	resultDialog.addEventListener("click", function (e) {
		if (e.target === resultDialog) closeDialog();
	});
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape" && resultDialog.open) closeDialog();
	});

	// --- MCP JSON-RPC client ---
	function mcpRequest(method, params) {
		var body = { jsonrpc: "2.0", id: requestId++, method: method };
		if (params !== undefined) body.params = params;

		return fetch(MCP_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json, text/event-stream",
			},
			body: JSON.stringify(body),
		}).then(function (response) {
			if (!response.ok) {
				throw new Error("HTTP " + response.status + " " + response.statusText);
			}

			var contentType = response.headers.get("content-type") || "";
			var data;

			if (contentType.indexOf("text/event-stream") !== -1) {
				return response.text().then(function (text) {
					var dataMatch = text.match(/^data: (.+)$/m);
					if (dataMatch) {
						data = JSON.parse(dataMatch[1]);
					} else {
						throw new Error("No data field in SSE response");
					}
					if (data.error) throw new Error("MCP error: " + data.error.message);
					return data.result;
				});
			}

			return response.json().then(function (json) {
				if (json.error) throw new Error("MCP error: " + json.error.message);
				return json.result;
			});
		});
	}

	// --- Tab switching ---
	document.querySelectorAll(".tab-btn").forEach(function (btn) {
		btn.addEventListener("click", function () {
			var tab = this.getAttribute("data-tab");
			document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
			document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
			this.classList.add("active");
			this.setAttribute("aria-selected", "true");
			document.getElementById("panel-" + tab).classList.add("active");
		});
	});

	// --- Render helpers ---
	function escapeHtml(str) {
		return String(str).replace(/[&<>"']/g, function (c) {
			return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
		});
	}

	function renderTools(tools) {
		var container = $("tools-list");
		if (!tools || tools.length === 0) {
			container.innerHTML = '<div class="empty-state">No tools available.</div>';
			return;
		}
		container.innerHTML = tools.map(function (tool) {
			var title = tool.title || tool.name;
			var desc = tool.description || "";
			var annotations = tool.annotations || {};
			var hints = [];
			if (annotations.readOnlyHint) hints.push({ label: "read-only", cls: "read-only" });
			if (annotations.destructiveHint) hints.push({ label: "destructive", cls: "destructive" });
			if (annotations.openWorldHint) hints.push({ label: "open-world", cls: "open-world" });
			var hintHtml = hints.map(function (h) { return '<span class="hint ' + h.cls + '">' + escapeHtml(h.label) + '</span>'; }).join("");

			var inputFields = "";
			var inputSchema = tool.inputSchema || {};
			var props = inputSchema.properties || {};
			var required = inputSchema.required || [];

			Object.keys(props).forEach(function (name) {
				var prop = props[name];
				var requiredMark = required.indexOf(name) !== -1 ? " *" : "";
				var type = prop.type || "string";
				var placeholder = prop.description || "";

				if (type === "boolean") {
					inputFields += '<div class="input-group">' +
						'<label class="input-label" for="tool-arg-' + escapeHtml(tool.name) + '-' + escapeHtml(name) + '">' + escapeHtml(name) + requiredMark + '</label>' +
						'<select class="input-field" id="tool-arg-' + escapeHtml(tool.name) + '-' + escapeHtml(name) + '">' +
						'<option value="true">true</option><option value="false">false</option>' +
						'</select></div>';
				} else if (type === "number" || type === "integer") {
					inputFields += '<div class="input-group">' +
						'<label class="input-label" for="tool-arg-' + escapeHtml(tool.name) + '-' + escapeHtml(name) + '">' + escapeHtml(name) + requiredMark + '</label>' +
						'<input type="number" class="input-field" id="tool-arg-' + escapeHtml(tool.name) + '-' + escapeHtml(name) + '" placeholder="' + escapeHtml(placeholder) + '">' +
						'</div>';
				} else if (type === "array") {
					inputFields += '<div class="input-group">' +
						'<label class="input-label" for="tool-arg-' + escapeHtml(tool.name) + '-' + escapeHtml(name) + '">' + escapeHtml(name) + requiredMark + '</label>' +
						'<input type="text" class="input-field" id="tool-arg-' + escapeHtml(tool.name) + '-' + escapeHtml(name) + '" placeholder="' + escapeHtml(placeholder) + ' (comma-separated)">' +
						'</div>';
				} else {
					inputFields += '<div class="input-group">' +
						'<label class="input-label" for="tool-arg-' + escapeHtml(tool.name) + '-' + escapeHtml(name) + '">' + escapeHtml(name) + requiredMark + '</label>' +
						'<input type="text" class="input-field" id="tool-arg-' + escapeHtml(tool.name) + '-' + escapeHtml(name) + '" placeholder="' + escapeHtml(placeholder) + '">' +
						'</div>';
				}
			});

			if (!inputFields) {
				inputFields = '<p class="muted" style="font-size:0.8rem;">No parameters.</p>';
			}

			var schemaJson = JSON.stringify(inputSchema, null, 2);

			return '<div class="card tool-card" id="tool-card-' + escapeHtml(tool.name) + '">' +
				'<h3><span class="arrow" id="arrow-' + escapeHtml(tool.name) + '">&#9654;</span> ' + escapeHtml(title) + ' <code>' + escapeHtml(tool.name) + '</code></h3>' +
				'<div class="tool-desc">' + escapeHtml(desc) + (hints.length ? ' ' + hintHtml : '') + '</div>' +
				'<div class="schema-toggle" data-target="schema-' + escapeHtml(tool.name) + '"><span class="chevron" id="chevron-schema-' + escapeHtml(tool.name) + '">&#9654;</span> Input schema</div>' +
				'<pre class="schema-block" id="schema-' + escapeHtml(tool.name) + '"><code>' + escapeHtml(schemaJson) + '</code></pre>' +
				'<form class="tool-form collapsed" id="tool-form-' + escapeHtml(tool.name) + '">' +
					inputFields +
					'<button type="submit" class="btn btn-primary">Call tool</button>' +
				'</form>' +
			'</div>';
		}).join("");

		tools.forEach(function (tool) {
			var titleEl = document.querySelector('#tool-card-' + tool.name + ' h3');
			if (titleEl) {
				titleEl.addEventListener("click", function () {
					var form = document.getElementById("tool-form-" + tool.name);
					var arrow = document.getElementById("arrow-" + tool.name);
					if (form) {
						var isExpanded = form.classList.contains("expanded");
						form.classList.toggle("expanded", !isExpanded);
						form.classList.toggle("collapsed", isExpanded);
						if (arrow) arrow.classList.toggle("expanded", !isExpanded);
					}
				});
			}

			var schemaToggle = document.querySelector('[data-target="schema-' + tool.name + '"]');
			if (schemaToggle) {
				schemaToggle.addEventListener("click", function (e) {
					e.stopPropagation();
					var block = document.getElementById("schema-" + tool.name);
					var chevron = document.getElementById("chevron-schema-" + tool.name);
					if (block) {
						var isOpen = block.classList.contains("open");
						block.classList.toggle("open", !isOpen);
						if (chevron) chevron.classList.toggle("open", !isOpen);
					}
				});
			}

			var form = document.getElementById("tool-form-" + tool.name);
			if (form) {
				form.addEventListener("submit", function (e) {
					e.preventDefault();
					callTool(tool);
				});
			}
		});
	}

	// --- Render resources ---
	function renderResources(roots) {
		var container = $("resources-list");
		var resources = [];
		if (roots && roots.resources) {
			resources = roots.resources;
		} else if (roots && Array.isArray(roots)) {
			resources = roots;
		}

		if (resources.length === 0) {
			container.innerHTML = '<div class="empty-state">No resources available.</div>';
			return;
		}

		container.innerHTML = resources.map(function (res) {
			var uri = res.uri || "";
			var name = res.name || uri;
			var desc = res.description || "";
			var mimeType = res.mimeType || "";

			return '<div class="resource-item">' +
				'<a href="#" class="read-resource resource-uri" data-uri="' + escapeHtml(uri) + '">' + escapeHtml(name) + '</a>' +
				'<span class="resource-desc">' + escapeHtml(desc || "") + '</span>' +
				(mimeType ? '<span class="resource-mime">' + escapeHtml(mimeType) + '</span>' : "") +
				'</div>';
		}).join("");

		container.querySelectorAll(".read-resource").forEach(function (link) {
			link.addEventListener("click", function (e) {
				e.preventDefault();
				var uri = this.getAttribute("data-uri");
				readResource(uri);
			});
		});
	}

	// --- Render prompts ---
	function renderPrompts(prompts) {
		var container = $("prompts-list");
		if (!prompts || prompts.length === 0) {
			container.innerHTML = '<div class="empty-state">No prompts available.</div>';
			return;
		}
		container.innerHTML = prompts.map(function (prompt) {
			var name = prompt.name;
			var desc = prompt.description || "";
			var args = prompt.arguments || [];
			var argsHtml = args.map(function (a) {
				return '<span class="prompt-arg-tag">' + escapeHtml(a.name) + (a.required ? ' *' : '') + '</span>';
			}).join("");

			var fields = args.map(function (a) {
				return '<div class="input-group">' +
					'<label class="input-label" for="prompt-arg-' + escapeHtml(name) + '-' + escapeHtml(a.name) + '">' + escapeHtml(a.name) + (a.required ? ' *' : '') + '</label>' +
					'<input type="text" class="input-field" id="prompt-arg-' + escapeHtml(name) + '-' + escapeHtml(a.name) + '" placeholder="' + escapeHtml(a.description || "") + '">' +
					'</div>';
			}).join("");

			return '<div class="card prompt-card" id="prompt-card-' + escapeHtml(name) + '">' +
				'<h3>' + escapeHtml(name) + '</h3>' +
				'<div class="tool-desc">' + escapeHtml(desc) + '</div>' +
				'<div class="prompt-args">' + argsHtml + '</div>' +
				'<form class="tool-form expanded" id="prompt-form-' + escapeHtml(name) + '" style="margin-top:0.75rem;">' +
					fields +
					'<button type="submit" class="btn btn-primary">Get prompt</button>' +
				'</form>' +
				'</div>';
		}).join("");

		prompts.forEach(function (prompt) {
			var form = document.getElementById("prompt-form-" + prompt.name);
			if (!form) return;
			form.addEventListener("submit", function (e) {
				e.preventDefault();
				getPrompt(prompt.name, prompt.arguments || []);
			});
		});
	}

	// --- Tool call ---
	function callTool(tool) {
		var args = {};
		var inputSchema = tool.inputSchema || {};
		var props = inputSchema.properties || {};
		var required = inputSchema.required || [];

		var missing = [];
		Object.keys(props).forEach(function (name) {
			var el = document.getElementById("tool-arg-" + tool.name + "-" + name);
			if (!el) return;
			var val = el.value.trim();
			var type = props[name].type || "string";

			if (required.indexOf(name) !== -1 && !val) {
				missing.push(name);
				return;
			}

			if (!val && required.indexOf(name) === -1) {
				return;
			}

			if (type === "boolean") {
				args[name] = val === "true";
			} else if (type === "number" || type === "integer") {
				args[name] = parseFloat(val);
			} else if (type === "array") {
				args[name] = val.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s; });
			} else {
				args[name] = val;
			}
		});

		if (missing.length > 0) {
			showResult("Missing required parameters: " + missing.join(", "), true);
			return;
		}

		showResult("Calling " + tool.name + "\\u2026", false, true);

		mcpRequest("tools/call", { name: tool.name, arguments: args })
			.then(function (result) {
				if (result && result.isError) {
					var errText = "";
					if (result.content && result.content[0]) {
						errText = typeof result.content[0].text === "string"
							? result.content[0].text
							: JSON.stringify(result.content[0]);
					}
					showResult("Tool returned an error:\\n" + errText, true);
				} else {
					var text = "";
					if (result && result.content) {
						text = result.content.map(function (c) {
							if (c.type === "text") return c.text;
							return JSON.stringify(c);
						}).join("\\n\\n");
					}
					try {
						text = JSON.stringify(JSON.parse(text), null, 2);
					} catch (e) { /* not JSON, show as-is */ }
					showResult(text, false);
				}
			})
			.catch(function (err) {
				showResult("Error: " + err.message, true);
			});
	}

	// --- Resource read ---
	function readResource(uri) {
		showResult("Reading " + uri + "\\u2026", false, true);

		mcpRequest("resources/read", { uri: uri })
			.then(function (result) {
				var text = "";
				if (result && result.contents && result.contents[0]) {
					var c = result.contents[0];
					text = typeof c.text === "string" ? c.text : (c.blob ? atob(c.blob) : JSON.stringify(c));
				}
				try {
					text = JSON.stringify(JSON.parse(text), null, 2);
				} catch (e) { /* not JSON */ }
				showResult(text, false);
			})
			.catch(function (err) {
				showResult("Error: " + err.message, true);
			});
	}

	// --- Prompt get ---
	function getPrompt(name, args) {
		var promptArgs = {};
		args.forEach(function (a) {
			var el = document.getElementById("prompt-arg-" + name + "-" + a.name);
			if (el && el.value.trim()) {
				promptArgs[a.name] = el.value.trim();
			}
		});

		showResult("Getting prompt " + name + "\\u2026", false, true);

		mcpRequest("prompts/get", { name: name, arguments: promptArgs })
			.then(function (result) {
				var text = JSON.stringify(result, null, 2);
				showResult(text, false);
			})
			.catch(function (err) {
				showResult("Error: " + err.message, true);
			});
	}

	// --- Result display ---
	function showResult(content, isError, isLoading) {
		openDialog();

		var statusClass = isLoading ? "loading" : (isError ? "error" : "success");
		var statusLabel = isLoading ? "Loading" : (isError ? "Error" : "Success");
		setDialogStatus(statusClass, statusLabel);

		if (isLoading) {
			dialogBody.innerHTML = '<pre><code>' + escapeHtml(content) + '</code></pre>';
			dialogCopy.style.display = "none";
		} else {
			var escaped = escapeHtml(content);
			dialogBody.innerHTML = '<pre><code>' + escaped + '</code></pre>';
			dialogCopy.style.display = "inline-block";
			dialogCopy.textContent = "Copy";
			dialogCopy.classList.remove("copied");
		}
	}

	dialogCopy.addEventListener("click", function () {
		var pre = dialogBody.querySelector("pre");
		if (!pre) return;
		navigator.clipboard.writeText(pre.innerText).then(function () {
			dialogCopy.textContent = "Copied";
			dialogCopy.classList.add("copied");
			setTimeout(function () {
				dialogCopy.textContent = "Copy";
				dialogCopy.classList.remove("copied");
			}, 1500);
		});
	});

	// --- Initialize ---
	async function init() {
		setStatus("connecting", "Initializing MCP session\\u2026");
		try {
			var result = await mcpRequest("initialize", {
				protocolVersion: PROTOCOL_VERSION,
				capabilities: {
					prompts: {},
					resources: {},
					tools: {},
					completion: {},
				},
				clientInfo: {
					name: "Duyet MCP Playground",
					version: "1.0.0",
				},
			});

			serverInfo = result.serverInfo || {};
			setStatus("connected", "Connected: " + (serverInfo.name || "MCP Server") + " v" + (serverInfo.version || "?"));

			var results = await Promise.allSettled([
				mcpRequest("tools/list").then(function (r) { return r.tools || []; }),
				mcpRequest("resources/list").then(function (r) { return r.resources || []; }),
				mcpRequest("prompts/list").then(function (r) { return r.prompts || []; }),
			]);

			var tools = results[0].status === "fulfilled" ? results[0].value : [];
			var resources = results[1].status === "fulfilled" ? results[1].value : [];
			var prompts = results[2].status === "fulfilled" ? results[2].value : [];

			renderTools(tools);
			renderResources(resources);
			renderPrompts(prompts);

			$("count-tools").textContent = String(tools.length);
			$("count-resources").textContent = String(resources.length);
			$("count-prompts").textContent = String(prompts.length);

		} catch (err) {
			setStatus("disconnected", "Connection failed: " + err.message);
			$("tools-list").innerHTML = '<div class="empty-state" style="color:var(--danger);">Failed to load. Check the console for details.</div>';
		}
	}

	init();
})();
</script>`;

export function renderPlaygroundPage(): string {
	return renderPage({
		title: "Playground - Duyet MCP Server",
		description: "Interactive MCP Playground for the Duyet MCP Server",
		current: "playground",
		css: CSS,
		body: BODY,
		tail: TAIL,
	});
}
