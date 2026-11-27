/**
 * CaseConnect (Omnitool) – helper bookmarklet for Connect Cases.
 *
 * Map (search "// ==="):
 *   1. Bootstrap    – safe re-run: tears down the previous instance
 *   2. Utils        – generic DOM / string / date helpers
 *   3. Config       – selectors, task types, sub-status tree, note templates, styles
 *   4. Scrapers     – read case data from the page (read-only)
 *   5. Note builder – case-note table HTML
 *   6. Note editing – insert note, EC rows, delete row, clear "NA", strip on submit
 *   7. UI           – sub-status modal, task-type picker, signature
 *   8. Follow-up    – the "fl up" workflow
 *   9. Panel + init
 *
 * Editing rules:
 *   - New sub-status preset: add it to NOTE_TEMPLATES and reference its key in STEP_OPTIONS.
 *   - New page selector: add it to SEL, never inline it.
 *   - Anything to undo on re-run (listeners, timers, observers) must be pushed to `cleanups`.
 */
(() => {
	"use strict";

	// === 1. Bootstrap ===
	const G = (window.__OMNITOOL__ ||= {});
	try {
		G.teardown?.();
	} catch (e) {
		console.warn("Omnitool: cleanup failed", e);
	}
	const cleanups = [];
	G.teardown = () => {
		while (cleanups.length)
			try {
				cleanups.pop()();
			} catch { }
	};
	const state = {
		clickerInterval: null,
		removeTimer: null,
		closeTaskPop: null,
		lastStrippedAt: 0,
	};

	// === 2. Utils ===
	const toSafeHTML = (html) => {
		if (!G.tt) {
			const pass = { createHTML: (s) => s };
			for (const name of ["omnitool", "default"])
				try {
					G.tt ||= window.trustedTypes?.createPolicy?.(name, pass);
				} catch { }
			G.tt ||= window.trustedTypes?.defaultPolicy || pass;
		}
		return G.tt.createHTML(html);
	};

	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	const $ = (s, p = document) => p.querySelector(s);
	const $$ = (s, p = document) => [...p.querySelectorAll(s)];
	const uniq = (arr) => [...new Set(arr)];
	const toElement = (n) => (n?.nodeType === 1 ? n : n?.parentElement);
	const fire = (node, ...types) =>
		types.forEach((t) =>
			node?.dispatchEvent(new Event(t, { bubbles: true })),
		);
	const cellText = (tr, i) => tr?.cells?.[i]?.textContent || "";

	const esc = (s) =>
		String(s ?? "").replace(
			/[&<>"']/g,
			(c) =>
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#039;",
				})[c],
		);
	const norm = (s) =>
		String(s ?? "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, " ")
			.trim();

	const isoDate = (d = new Date()) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	const startOfDay = (d) => new Date(d).setHours(0, 0, 0, 0);
	const dayDiff = (from, to) => Math.round((to - from) / 864e5);
	const addBusinessDays = (from, n) => {
		const d = new Date(from);
		for (let c = 0; c < n;) {
			d.setDate(d.getDate() + 1);
			if (d.getDay() % 6 !== 0) c++; // skip Sat (6) and Sun (0)
		}
		return d;
	};
	// Accepts epoch ms, "YYYY-MM-DD" or "DD/MM/YYYY"-like strings. Returns a valid Date or null.
	const parseDate = (val) => {
		if (!val) return null;
		let d = null;
		if (+val > 1e11) d = new Date(+val);
		else {
			const p = String(val).match(/\d+/g);
			if (p?.length >= 3) {
				const ymd = p[0].length === 4;
				d = new Date(
					ymd ? +p[0] : +p[2],
					+p[1] - 1,
					ymd ? +p[2] : +p[0],
				);
			}
		}
		return d && !isNaN(d) ? d : null;
	};

	const el = (tag, { parent, onClick, style, text, html, ...props } = {}) => {
		const node = Object.assign(document.createElement(tag), props);
		if (text !== undefined) node.textContent = text;
		if (html !== undefined) node.innerHTML = toSafeHTML(html);
		if (style) node.style.cssText = style;
		if (onClick) node.addEventListener("click", onClick);
		parent?.appendChild(node);
		return node;
	};

	const isVisible = (n) => {
		const shown =
			n?.checkVisibility?.({
				checkOpacity: true,
				checkVisibilityCSS: true,
			}) ?? n?.offsetParent != null;
		if (!n || !shown) return false;
		const r = n.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	};
	const visibleOr = (sel) => $$(sel).find(isVisible) || $(sel);

	// Polls until `test` (selector string or function) returns something truthy.
	const waitFor = async (test, ms = 5000) => {
		const check = typeof test === "function" ? test : () => $(test);
		for (let t = 0; t < ms; t += 100) {
			const found = check();
			if (found) return found;
			await sleep(100);
		}
		throw new Error(`Timeout: ${test.name || test}`);
	};
	const clickWait = async (node, ms) => {
		node?.click();
		await sleep(ms);
	};

	// === 3. Config ===
	const OWNER_LDAP = "vongoc"; // panel extras + auto-insert only for this user
	const SIG_KEY = "__signature_name";
	const AUTO_INSERT_MS = 16000;
	const AUTO_REMOVE_MS = 6000;

	const SEL = {
		CASE_NOTE: '[aria-label="Case Note"]',
		NOTE_ROOT: "#noteCaseUI",
		TASKS: '[data-infocase="tasks"]',
		FOLLOW_UP: '[data-infocase="follow_up_time"]',
		RECRAWL: '[data-btnclk="_connectcase_info-act_recrawl"]',
		APPT: '[data-infocase="appointment_time"]',
		PROFILE_PHOTO: "[alt='profile photo']",
		SAVE: '[data-btnsave], [data-btnclk="btnsave"]',
		EDIT: '._connectcase_info-act_edit, [data-btnclk="_connectcase_info-act_edit"]',
		FLUP_LIST_ITEM: ".li-popup_lstcasefl",
		TODAY: ".datepicker-grid .today",
		DEL_BTN: ".qm-del-row, [data-del-row]",
		DESC: '.qm-desc, [data-qm-desc], [style*="#5f6368"], [style*="95, 99, 104"]',
		TASK_PICK: ".qm-task-pick, [data-task-pick]",
		SUBMIT: '[debug-id="submit-button"]',
		IS_NEW: ".isnew", // un-crawled case: clicking it crawls data and renders the info fields
		REFRESH_SNIPS: '[data-tab-id="case-snipit"]',
		SHOT_CARD: ".cs-img-card[data-id]",
	};

	const HL = { bg: "#ffe066", fg: "#c92a2a" };
	const HL_STYLE = `background:${HL.bg};color:${HL.fg};font-weight:700;border-radius:4px;`;
	// Everything we strip/unwrap before the note is submitted.
	const HIGHLIGHT_SEL = [
		".qm-hl",
		"[data-qm-hl]",
		SEL.TASK_PICK,
		`[style*="${HL.bg}"]`,
		'[style*="255, 224, 102"]',
		`[style*="${HL.fg}"]`,
		'[style*="201, 42, 42"]',
	].join(", ");

	const TASK_TYPES = [
		"NA",
		"Ads - Conversion Tracking",
		"Ads - Customer Match",
		"Ads - Dynamic Remarketing",
		"Ads - Enhanced Conversions for Leads (ECL)",
		"Ads - Enhanced Conversions for Web (ECW)",
		"Ads - NCA implementations",
		"Ads - Offline Conversion Tracking",
		"Ads - Standard Remarketing",
		"Consent Mode (CoMo)",
		"Cross Domain Tracking",
		"GA4 - Campaign Data Import",
		"GA4 - Ecommerce Tracking",
		"GA4 - Events tracking",
		"GA4 - Setup (no Analytics in place yet)",
		"GA4 - Standard Remarketing",
		"GA4 - User Provided Data Event Tracking",
		"Google Tag Gateway",
		"Google Tag/Google Tag Manager",
		"Shopping Feed Optimization",
		"Shopping Onboarding",
	];

	// Shape: { [daysOffset]: Item[] }; Item = "label" | [label, templateKey] | [label, Item[]] (sub-menu)
	const AWAITING_OPTIONS = [
		["NI - Awaiting Inputs", "WAITING_INPUT"],
		[
			"NI - Awaiting Validation",
			[
				["GA4 Event", "GA4"],
				["GA4 UPD", "GA4_UPD"],
				["Remarketing", "REMARKETING"],
			],
		],
		["NI - In Consult", "IN_CONSULT"],
	];
	const STEP_OPTIONS = {
		0: [
			[
				"SO - Solution Offered",
				[
					"SO - Implementation Only",
					"SO - Education Only",
					"SO - Troubleshooting Only",
					"SO - Verified",
				],
			],
			[
				"IN - Inactive",
				[
					["IN - Instruction Share", "IN_INSTRUCTION_SHARE"],
					["IN - Not Reachable", "IN_NOT_REACHABLE"],
					["IN - Not Interested", "IN_NOT_INTERESTED"],
					["IN - Not Ready", "IN_NOT_READY"],
					["IN - Infeasible", "IN_INFEASIBLE"],
					["IN - Out of Scope", "IN_OUT_OF_SCOPE"],
				],
			],
		],
		1: [["AS - Reschedule 1", "RESCHEDULE"], ["NI - Attempted Contact", "ATTEMPT_CONTACT"]],
		2: AWAITING_OPTIONS,
		3: AWAITING_OPTIONS,
		7: [["NI - Awaiting Validation (Enhanced Conversion)", "EC"]], // EC follow-up = 1 calendar week
	};

	// [background, text] per modal button, cycled.
	const PALETTE = [
		["#A5D8FF", "#183B56"],
		["#B2F2BB", "#1E5E2A"],
		["#D0BFFF", "#3A2A59"],
		["#FFEC99", "#5C3A00"],
		["#FCC2D7", "#610B2A"],
		["#D8F5A2", "#2B5200"],
		["#FFD8A8", "#66181D"],
		["#EAEAEA", "#333333"],
		["#C5F6FA", "#0B7285"],
	];
	const NEUTRAL_BTN = ["#F1F3F5", "#495057"];

	// Comment bullets: "{...}" parts are highlighted as placeholders for the agent to edit.
	const BASE_COMMENTS = [
		"Setup Conversion Linker",
		"Guided the advertiser how to see the report",
		"Survey pitched",
	];
	const GA4_COMMENTS = [
		...BASE_COMMENTS,
		"Linked GA4 and Google Ads",
		"Turned on Google signals data collection",
		"Turned on User Data Collection Acknowledgement",
		"Tested with Tag Assistant and Real time in GA4",
	];

	const NOTE_TEMPLATES = {
		EC: {
			subStatus: "NI - Awaiting Validation",
			subStatusReason: "Implemented Ads Enhanced Conversion",
			taskTypes: "Ads - Enhanced Conversions for Web (ECW)",
			tagsImplemented: "Ads Enhanced Conversions",
			comments: [
				"Implemented Google Ads enhanced conversions for { Purchase, Form Submit } via GTM / Gtag",
				"Tested with Tag Assistant",
				"Turn on Enhanced Conversion in conversion action",
				"No recent conversions",
				"Awaiting enhanced conversion to record data",
				...BASE_COMMENTS,
			],
		},
		WAITING_INPUT: {
			subStatus: "NI - Awaiting Inputs",
			subStatusReason: "waiting for Adv to setup GTM",
			comments: ["Waiting for advertiser to setup GTM"],
		},
		IN_CONSULT: {
			subStatus: "NI - In Consult",
			subStatusReason: "Waiting for SME to confirm",
			comments: [
				"Raised a consult with an SME for { issue }",
				"Waiting for the SME to confirm before the next step",
			],
		},
		GA4: {
			subStatus: "NI - Awaiting Validation",
			subStatusReason: "Implement GA4 Event",
			taskTypes: "GA4 - Events tracking",
			tagsImplemented: "Analytics Event Tracking",
			comments: [
				"Implemented GA4 event { Hotline / Zalo / Purchase / Form } via GTM / Gtag code",
				"Recording data",
				"Awaiting events to be processed in GA4 Event Report",
				"Guide advertiser import GA4 event to Google Ads",
				...GA4_COMMENTS,
			],
		},
		GA4_UPD: {
			subStatus: "NI - Awaiting Validation",
			subStatusReason: "Implement User-Provided Data",
			taskTypes: "GA4 - User Provided Data Event Tracking",
			tagsImplemented: "GA4 User-Provided Data Event Tracking",
			comments: [
				"Turn on GA4 User-Provided Data collection",
				"Implemented GA4 UPD for { Purchase, Form Submit } via GTM / Gtag",
				...GA4_COMMENTS, // already includes "Tested with Tag Assistant and Real time in GA4"
			],
		},
		REMARKETING: {
			subStatus: "NI - Awaiting Validation",
			subStatusReason: "Implement Ads Audiences",
			taskTypes: "Ads - Standard Remarketing",
			tagsImplemented: "Ads Remarketing",
			comments: [
				"Implemented GA4 Audiences for Pageview < {10} s via GTM",
				...GA4_COMMENTS,
			],
		},
		ATTEMPT_CONTACT: {
			subStatus: "NI - Attempted Contact",
			subStatusReason: "Adv not answer the phone",
			comments: [
				"Attempted to contact advertiser, call was not answered",
			],
		},
		RESCHEDULE: {
			subStatus: "AS - Reschedule 1",
			subStatusReason: "Advertiser requested to reschedule the appointment",
			comments: [
				"Advertiser requested to reschedule the appointment",
				"Updated the appointment time in the case",
			],
		},
		IN_INSTRUCTION_SHARE: {
			subStatus: "IN - Instruction Share",
			subStatusReason: "Shared implementation instructions with the advertiser",
			comments: [
				"Shared step-by-step instructions with the advertiser",
				"Advertiser will implement it on their own",
			],
		},
		IN_NOT_REACHABLE: {
			subStatus: "IN - Not Reachable",
			subStatusReason: "Advertiser not reachable after multiple contact attempts",
			comments: [
				"Attempted to contact the advertiser { 2 } times, calls were not answered",
				"Sent a follow-up email, no response received",
				"Closing the case as the advertiser is not reachable",
			],
		},
		IN_NOT_INTERESTED: {
			subStatus: "IN - Not Interested",
			subStatusReason: "Advertiser is not interested in the implementation",
			comments: [
				"Advertiser confirmed they are not interested in { task }",
				"Closing the case at the advertiser's request",
			],
		},
		IN_NOT_READY: {
			subStatus: "IN - Not Ready",
			subStatusReason: "Advertiser is not ready for the implementation",
			comments: [
				"Advertiser is not ready to implement",
				"Advised the advertiser to book a new appointment when ready",
			],
		},
		IN_INFEASIBLE: {
			subStatus: "IN - Infeasible",
			subStatusReason: "Implementation is not feasible",
			comments: [
				"Implementing is not feasible",
				"Explained the limitation and possible alternatives to the advertiser",
			],
		},
		IN_OUT_OF_SCOPE: {
			subStatus: "IN - Out of Scope",
			subStatusReason: "Request is out of scope for Technical Solutions",
			comments: [
				"Advertiser's request is out of scope for Technical Solutions",
				"Referred the advertiser to relevant team",
			],
		},
	};
	// Any "SO - ..." key without its own entry above.
	const soTemplate = (subStatus) => ({
		subStatus,
		subStatusReason: "Implement Ads Conversion Tracking",
		taskTypes: "Ads - Conversion Tracking",
		tagsImplemented: "Ads Conversion Tracking",
		comments: [
			"Implemented Google Ads conversions for { Hotline / Zalo / Purchase / Form } via GTM / Gtag",
			"Tested with Tag Assistant",
			"No recent conversions",
			...BASE_COMMENTS,
		],
	});
	// Tag names to use when none were crawled: the template's pairing, or else the task name itself.
	const TASK_TAGS = Object.fromEntries(
		[...Object.values(NOTE_TEMPLATES), soTemplate("")]
			.filter((t) => t.taskTypes)
			.map((t) => [t.taskTypes, t.tagsImplemented]),
	);
	const tagsForTasks = (tasks) =>
		uniq(String(tasks).split(",").map((t) => t.trim()).filter((t) => t && t !== "NA").map((t) => TASK_TAGS[t] || t)).join(", ") || "NA";

	// SO close on an EC task 5+ days after the appointment = verification note.
	const ecVerifiedOverride = (domTasks) => ({
		taskTypes: domTasks,
		tagsImplemented: "Ads Enhanced Conversions",
		comments: [
			"Verified Google Ads enhanced conversions for { Purchase, Form Submit } via GTM / Gtag",
			...BASE_COMMENTS,
		],
	});
	const NOTE_FONT = { family: "'Google Sans', sans-serif", size: "11pt" };
	const COL = { label: "40%", value: "60%" }; // note table column widths: change here only
	const PANEL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Eczar:wght@400;600;700&display=swap');
#qm-panel, #qm-panel *, #qm-modal-overlay, #qm-modal-overlay * { font-family: "Eczar", serif !important; }
#qm-panel { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 99999; font-size: 14px; }
.qm-btn { z-index: 10; color: #1D1D1F; padding: 10px 16px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); backdrop-filter: blur(6px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.6); user-select: none; }
.qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); filter: brightness(0.97); }
.qm-btn:active { transform: scale(0.96); }\n.qm-btn[data-busy] { opacity: 0.6; pointer-events: none; }
#qm-flup-in { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.95); color: #1D1D1F; font-weight: 700; font-size: 14px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); transition: all 0.2s ease; z-index: 20; cursor: text; user-select: text; }
#qm-flup-in:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #74B9FF; }
.qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF8787; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; color: #FFFFFF; }
.qm-sig { margin: 12px 0; }
.dock-container { max-height: 400px !important; overflow-y: auto !important; }
.qm-task-pick { cursor: pointer !important; user-select: none; }
.qm-task-pick::after { content: " ▾"; font-size: 10px; }
:is(#noteCaseUI, .cdtx__uioncall) table { width: 100% !important; table-layout: auto !important; }
:is(#noteCaseUI, .cdtx__uioncall) td { position: relative !important; }
:is(#noteCaseUI, .cdtx__uioncall) .qm-del-row { position: absolute !important; top: 4px !important; right: 4px !important; float: none !important; margin: 0 !important; }
:is(#noteCaseUI, .cdtx__uioncall) tr > td:first-child:not([colspan]) { width: ${COL.label} !important; max-width: ${COL.label} !important; padding-right: 22px !important; }
:is(#noteCaseUI, .cdtx__uioncall) tr > td:nth-child(2) { width: ${COL.value} !important; max-width: ${COL.value} !important; }
${SEL.CASE_NOTE}, ${SEL.CASE_NOTE} *:not(.qm-del-row) { font-family: ${NOTE_FONT.family} !important; font-size: ${NOTE_FONT.size} !important; }
`;

	// === 4. Scrapers (read-only) ===
	const matchTaskType = (raw) => {
		const r = norm(raw);
		if (!r) return "";
		if (r === "na") return "NA";
		if (r === "ads enhanced conversions")
			return "Ads - Enhanced Conversions for Web (ECW)";
		const known = TASK_TYPES.find((t) => {
			if (t === "NA") return false;
			const nt = norm(t.replace(/\(.*?\)/g, ""));
			return norm(t) === r || nt.includes(r) || r.includes(nt);
		});
		return known || String(raw).trim().replace(/[_\s]+/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase());
	};
	const isEcTask = (s) => /enhanced conversion|\becw\b|\becl\b/i.test(s || "");

	const getVisibleCaseNote = () => {
		const visible = $$(SEL.CASE_NOTE).filter(isVisible);
		// Prefer notes not covered by another layer (hit-test the centre point).
		const onTop = visible.filter((n) => {
			const r = n.getBoundingClientRect();
			const hit = document.elementFromPoint(
				Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1),
				Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1),
			);
			const box =
				n.closest("write-card, .write-card, write-deck") ||
				n.parentElement;
			return hit && (n.contains(hit) || box?.contains(hit));
		});
		const top = (n) => n.getBoundingClientRect().top;
		return (
			(onTop.length ? onTop : visible).sort(
				(a, b) => top(a) - top(b),
			)[0] || null
		);
	};

	const currentFollowUp = () => {
		const val = $(SEL.FOLLOW_UP)?.dataset?.valchoice;
		if (!val || val === "Finish") return "NA";
		const d = parseDate(val);
		return d ? isoDate(d) : val;
	};

	const isAppt5DaysBefore = () => {
		const apptEl = $(SEL.APPT);
		const apptDate = parseDate(
			apptEl?.dataset?.valchoice || apptEl?.innerText,
		);
		const flupDate = parseDate(currentFollowUp()) || new Date();
		return Boolean(
			apptDate &&
			dayDiff(startOfDay(apptDate), startOfDay(flupDate)) >= 5,
		);
	};

	const scrapeSpeakeasyIds = () =>
		uniq(
			[
				...document.body.textContent.matchAll(
					/Speakeasy session ID:\s*(P\d+)/gi,
				),
			].map((m) => m[1]),
		).join(", ") || "NA";

	const scrapeCid = () =>
		$(".above-section div:nth-child(5) .capitalized")
			?.innerText?.trim()
			?.replace(/\D/g, "")
			?.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") || "NA";

	const scrapeDomTasks = () => {
		const els = $$(".form-label")
			.filter((l) =>
				/^(Appointment tasks|Case Summary)$/i.test(
					l.textContent.trim(),
				),
			)
			.flatMap((l) =>
				l.parentElement
					? $$(
						"sanitized-content, [debug-id='html-value']",
						l.parentElement,
					)
					: [],
			);
		const taskEl = $(SEL.TASKS);
		const raw = els.length
			? els.map((e) => e.textContent).join(",")
			: taskEl?.value || taskEl?.textContent || "";
		return uniq(
			raw
				.split(",")
				.map(matchTaskType)
				.filter((t) => t && t !== "NA"),
		).join(", ");
	};

	const VERIFIED_PHRASE =
		"successfully verified for the below listed conversion actions";
	const scrapeVerifiedTags = () =>
		uniq(
			$$(".message-body.note").flatMap((n) => {
				if (!new RegExp(VERIFIED_PHRASE, "i").test(n.textContent))
					return [];
				const clone = n.cloneNode(true);
				$$("br, p, div, li, tr", clone).forEach((b) => b.before("\n")); // keep line breaks in textContent
				const body = clone.textContent.replace(
					new RegExp(
						`^[\\s\\S]*?${VERIFIED_PHRASE}[^:\\n]*:\\s*`,
						"i",
					),
					"",
				);
				// Lines look like: "- <action name>, <id of 10+ chars>, ..."
				return [
					...body.matchAll(
						/(?:^|\n)\s*-\s*([^\n,|]+?)\s*(?:,|\|)\s*[A-Za-z0-9_-]{10,}\s*(?:,|\|)/g,
					),
				].map((m) => m[1].trim());
			}),
		).join(", ");


	// One entry per unique .cs-img-card. Uses title attributes because the time's textContent also contains the "schedule" icon text.
	const scrapeScreenshots = () =>
		[...new Map($$(SEL.SHOT_CARD).map((c) => [c.dataset.id, c])).values()].map((card) => {
			const img = $("img", card);
			return {
				id: card.dataset.id,
				url: $(".btn-copy-png-url", card)?.dataset.url || `https://screenshot-v2.corp.google.com/${card.dataset.id}`,
				thumb: img?.src || "",
				fallback: img?.dataset.fallbackSrc || "",
				title: $(".cs-img-title", card)?.title || "",
				time: $(".cs-img-time", card)?.title || "",
				note: $(".cs-note-input", card)?.value.trim() || "",
			};
		});

	// === 5. Note builder ===
	const TD_STYLE =
		"border:1pt solid #000;vertical-align:top;padding:5pt;overflow:hidden;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box;position:relative;";
	const FONT_STYLE = `font-size:${NOTE_FONT.size};font-family:${NOTE_FONT.family};color:#000;white-space:pre-wrap;`;


	const green = (s) => `<span style="color:#188038;">${s}</span>`;
	const highlightPlaceholders = (s) =>
		esc(s).replace(
			/\{[^}]+\}/g,
			`<span class="qm-hl" data-qm-hl="1" style="${HL_STYLE}padding:1px 4px;">$&</span>`,
		);
	const delBtnHTML = (title = "Delete row", sec = false) =>
		`<span class="qm-del-row" data-del-row="1"${sec ? ' data-del-sec="1"' : ""} contenteditable="false" title="${title}" style="position:absolute;top:4px;right:4px;cursor:pointer;color:#000000;background:#FF6666;font-weight:700;font-size:10pt;line-height:1;padding:1px 5px;border-radius:4px;user-select:none;">✕</span>`;
	const sectionHead = (title) =>
		`<tr data-sec-head="1" style="height:21pt"><td colspan="2" style="${TD_STYLE}background:#fff2cc;text-align:center;">${delBtnHTML("Delete section", true)}<span style="${FONT_STYLE}font-weight:700;">${title}</span> <span style="${FONT_STYLE}font-style:italic;">(Mandatory)</span></td></tr>`;
	const noteRow = (lbl, desc, val = "NA", bg = "", attr = "") => {
		const bgCss = bg ? `background:${bg};` : "";
		const descHTML = desc
			? `<div class="qm-desc" data-qm-desc="1" style="font-size:${NOTE_FONT.size};font-family:${NOTE_FONT.family};color:#5f6368;margin-top:2px;line-height:1.25;">${desc}</div>`
			: "";

		return `<tr${attr} style="height:21pt"><td width="${COL.label}" style="${TD_STYLE}width:${COL.label} !important;max-width:${COL.label} !important;">${delBtnHTML()}<span style="${FONT_STYLE}${bgCss}font-weight:700;">${lbl}</span>${descHTML}</td><td width="${COL.value}" style="${TD_STYLE}width:${COL.value} !important;max-width:${COL.value} !important;"><span style="${FONT_STYLE}${bgCss}">${val}</span></td></tr>`;
	};
	// Each entry: [label, description, value = "NA", background = ""]
	const rowsHTML = (rows) => rows.map((r) => noteRow(...r)).join("");
	const ulHTML = (items) => `<ul dir="auto" style="margin:0;padding-left:18px;">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

	const SCREENSHOT_ROWS = [
		[
			"Website URL worked upon:",
			`[Screenshot of Tag Assistant showing the connected website URL (e.g., ${green("https://www.exampleclient.com")}), or write ${green("NA")} if no website was worked on.]`,
		],
		[
			"Q+ entry:",
			"[Screenshot link of your completed Q+ submission when closing or transferring the case.]",
		],
		[
			"GVC Chat:",
			`[Screenshot of the Google Meet chat if you shared links or steps on the call, or write ${green("NA")}.]`,
		],
		[
			"GAM:",
			`[Screenshot of the Google Chat update sent to the Seller/GAM after the call showing outcome, status, and next steps (or ${green("NA - DFA Case")} for DFA cases).]`,
		],
		[
			"Additional Screenshots",
			`[Any extra screenshots showing ${green("setup, troubleshooting, validation, or issues")} needed for this case.] ✨`,
		],
	];
	const IMPL_ROWS = [
		[
			"Google Ads Conversion Status:",
			`[Screenshot of ${green("Goals &gt; Conversions &gt; Summary")} showing ${green("No recent conversions")}, ${green("Recording conversions")}, or ${green("Active")} status with the matching CID and action name, or ${green("NA")}.]`,
		],
		[
			"Google Ads Conversion Settings:",
			`[Screenshot of conversion settings (${green("Goal")}, ${green("Primary/Secondary")}, ${green("Count")}, ${green("Value")}, ${green("Data-driven")} attribution) and Tag Setup showing ${green("Conversion ID")} (${green("AW-XXXXXXXXX")}) and ${green("Conversion Label")}.]`,
		],
		[
			"GTM / Website Backend:",
			`[Screenshot of GTM showing the Conversion Tag, Conversion Linker, and Trigger, or website code showing ${green("gtag.js")} in ${green("`&lt;head&gt;`")} and the event snippet; or ${green("NA")}.]`,
		],
		[
			"Tag Assistant Tag Fired:",
			`[Screenshot of Tag Assistant showing Conversion Tag and Linker under ${green('"Tags Fired"')} with matching ${green("ID")}, ${green("Label")}, and ${green("Value")}/${green("Currency")}, or write ${green("NA")}.]`,
		],
		[
			`<i>“Hit Sent”</i> in Tag Assistant OR Network Header ${green("200 OK")}:`,
			`[Screenshot of Tag Assistant ${green('"Hit Sent"')} or DevTools Network tab showing the ${green("googleadservices.com/pagead/conversion/")} request with matching Label and ${green("200 OK")} status, or ${green("NA")}.]`,
		],
	];
	// Must stay the LAST row: syncEcRows inserts EC rows right before it.
	const IMPL_TAIL_ROW = [
		"Additional Screenshots:",
		`[Any extra screenshots of ${green("reports, errors, or discrepancies")} needed to support your troubleshooting.] ✨`,
	];
	// [label, description, kind]; kind "diag" only shows 5+ days after the appointment.
	const EC_ROWS = [
		[
			"Google Ads EC Settings: (Only for ECW)",
			`[Screenshot showing ${green("Turn on enhanced conversions")} checked and method chosen (${green("Google tag")} or ${green("GTM")}), or write ${green("NA")}.]`,
			"1",
		],
		[
			"Customer Data Terms Accepted: (Only for ECW)",
			`[Screenshot showing Customer Data Terms accepted in Google Ads, or write ${green("NA")}.]`,
			"1",
		],
		[
			`Error-Free ${green("em")} Parameter OR ${green("ecsid")} PII Stitching: (Only for ECW)`,
			`[Screenshot of Tag Assistant or Network showing valid hashed ${green("em")} (${green("em=tv.1~em.&lt;sha256&gt;")}, not ${green("em.e0")}), or 2 screenshots with matching ${green("ecsid")} across PII and conversion events; or ${green("NA")}.]`,
			"1",
		],
		[
			"Tag Diagnostics / EC Qualdash: (only for ECW)",
			`[Day 7 screenshot of Tag Diagnostics showing ${green('"Recording enhanced conversions"')} (Excellent, no alerts) and/or ${green("EC Qualdash WAI")}, or write ${green("NA")}.]`,
			"diag",
		],
	];
	const ecRowsHTML = (is5Days = isAppt5DaysBefore()) =>
		EC_ROWS.filter(([, , kind]) => is5Days || kind !== "diag")
			.map(([lbl, desc, kind]) =>
				noteRow(lbl, desc, "NA", "", ` data-ec-row="${kind}"`),
			)
			.join("");

	const resolveTemplate = (key, domTasks, is5Days) => {
		if (!key) return null;
		const cfg =
			NOTE_TEMPLATES[key] ||
			(key.startsWith("SO - ") ? soTemplate(key) : { subStatus: key });
		const isEcVerify =
			is5Days &&
			isEcTask(domTasks) &&
			/^SO - (Implementation|Troubleshooting|Education) Only$/.test(
				cfg.subStatus,
			);
		return isEcVerify ? { ...cfg, ...ecVerifiedOverride(domTasks) } : cfg;
	};

	const NOTE_CONTROLS_HTML =
		'<div class="cdtx__uioncall_control"><span class="cdtx__uioncall_control-load" data-text="Split &amp; Transfer" data-btnclk="oncall_templ_lt_template">&nbsp;</span><span class="cdtx__uioncall_control-load" data-text="List" data-btnclk="oncall_templ_act_load">&nbsp;</span><span class="cdtx__uioncall_control-save" data-text="Save" data-btnclk="oncall_templ_act_save" data-btntooltip="Save template Reuse">&nbsp;</span><span class="cdtx__uioncall_control-remove" data-text="Remove" data-btnclk="oncall_templ_act_remove">&nbsp;</span></div>';

	const buildNoteTemplateHTML = (
		templateKey,
		{ verifiedTags = "", domTasks = scrapeDomTasks(), seIds = scrapeSpeakeasyIds(), screenshots = [] } = {},
	) => {
		const is5Days = isAppt5DaysBefore();
		const cfg = resolveTemplate(templateKey, domTasks, is5Days);
		const taskVal = domTasks || cfg?.taskTypes || "NA";
		const comments = cfg?.comments || [];
		const consent =
			cfg?.subStatus &&
				!/Attempted Contact|Not Reachable|Unreachable/i.test(cfg.subStatus)
				? "No"
				: "NA";
		const commentsHTML = comments.length ? ulHTML(comments.map((c) => highlightPlaceholders(c))) : "NA";

		// Picked screenshots replace "NA" in Screenshots → Additional Screenshots.
		const shotsHTML = screenshots.length
			? ulHTML(screenshots.map((s) => `${s.note ? `${esc(s.note)}: ` : ""}<a href="${esc(s.url)}" target="_blank" style="color:#1155cc;">${esc(s.url)}</a>`))
			: "";
		const screenshotRows = SCREENSHOT_ROWS.map((r) => (shotsHTML && /^Additional Screenshots/.test(r[0]) ? [r[0], r[1], shotsHTML] : r));

		const generalRows = [
			[
				"Date:",
				`[Date of the call, contact attempt, or follow-up action in ${green("YYYY-MM-DD")} format.]`,
				isoDate(),
				"#c9daf8",
			],
			[
				"Speakeasy ID:",
				`[SpeakEasy session ID from the dashboard (e.g., ${green("P100000000381267617")}). Separate multiple IDs with commas, or write ${green("NA")} for email/offline updates.]`,
				esc(seIds),
			],
			[
				"Sub-status:",
				'[Connect Cases sub-status chosen in Q+ (see <a href="http://goto.google.com/tsStatuses" target="_blank" style="color:#1155cc;">go/tsStatuses</a>).]',
				`<span class="_sub_i" data-btnclk="choice_status_list" data-infocase="status_case">${highlightPlaceholders(cfg?.subStatus || "NA")}</span>`,
			],
			[
				"Next Follow-Up Date",
				`[Next follow-up date in ${green("YYYY-MM-DD")} format, or write ${green("NA")} if no follow-up is needed.]`,
				`<span data-btnclk="oncall_templ_act_flchoice" data-dateformat="Y-m-d" data-text="oncall_templ_act_flchoice-text">${esc(currentFollowUp())}</span>`,
			],
			[
				"Task types:",
				`[Main task type(s) worked on, separated by commas (e.g., ${green("Ads - Conversion Tracking, Ads - Enhanced Conversions for Web (ECW)")}), or ${green("NA")} if none.]`,
				`<span class="qm-task-pick" data-task-pick="1" style="${HL_STYLE}padding:1px 6px;cursor:pointer;display:inline-block;" title="Click to search/select Task Types">${esc(taskVal)}</span>`,
			],
			[
				"Implemented tags:",
				`[Exact conversion action name(s) set up, checked, or fixed in Google Ads, separated by commas (e.g., ${green("Phone_call, lead_form, Purchase_Shopify")}), or ${green("NA")}.]`,
				verifiedTags
					? `<span>${esc(verifiedTags)}</span>`
					: `<span data-tags-auto="1">${esc(tagsForTasks(taskVal))}</span>`
			],
			[
				"CID:",
				`[10-digit Google Ads Customer ID (${green("XXX-XXX-XXXX")}) confirmed and worked on during the call. Separate multiple CIDs with commas, or write ${green("NA")}.]`,
				esc(scrapeCid()),
			],
			[
				"Checked and obtained recording consent from the customer before proceeding with the call",
				`[Write ${green("Yes")} or ${green("No")} to confirm you got recording consent at the start of the call, or ${green("NA")} if unreachable.]`,
				consent,
			],
			[
				"Call Summary:",
				"[Short 1–2 sentence summary of what happened on the call or in the email.]",
				comments.length ? highlightPlaceholders(comments[0]) : "NA",
			],
			[
				"Sub-status Reason :",
				"[Clear reason for choosing this sub-status.]",
				`<span class="cdtx__uioncall-oct_test">${esc(cfg?.subStatusReason || "NA")}</span>`,
			],
			[
				"Additional information:&nbsp;",
				"[Key steps taken, test results, and extra notes from the call or case.]",
				commentsHTML,
			],
		];

		const body =
			sectionHead("General Details") +
			rowsHTML(generalRows) +
			sectionHead("Screenshots") +
			rowsHTML(screenshotRows) +
			sectionHead("Implementation Screenshots") +
			rowsHTML(IMPL_ROWS) +
			(isEcTask(taskVal) ? ecRowsHTML(is5Days) : "") +
			rowsHTML([IMPL_TAIL_ROW]);

		return `<div id="noteCaseUI" class="cdtx__uioncall">${NOTE_CONTROLS_HTML}<article class="cdtx__uioncall_outer"><table style="width:100% !important;border-collapse:collapse !important;margin:8px 0 !important;box-sizing:border-box !important;"><colgroup><col width="${COL.label}" style="width:${COL.label} !important;"><col width="${COL.value}" style="width:${COL.value} !important;"></colgroup><tbody>${body}</tbody></table></article></div>`;
	};

	// === 6. Note editing ===
	const NA_RE = /^\s*NA\s*$/i;
	const isSecHead = (tr) =>
		Boolean(tr.dataset.secHead || tr.cells?.[0]?.colSpan > 1);
	const isTaskTypesRow = (tr) => /^[✕\s]*Task types:/i.test(cellText(tr, 0));

	const insertNote = async (templateHTML, replaceExisting) => {
		let caseNote = getVisibleCaseNote();
		if (!caseNote) {
			// The "new note" FAB only shows after hover events reach its ancestors.
			for (
				let n = visibleOr("write-deck material-fab material-icon i");
				n && n !== document.body;
				n = n.parentElement
			)
				for (const t of ["pointerenter", "mouseenter", "mouseover"])
					n.dispatchEvent(new MouseEvent(t, { bubbles: true }));
			await sleep(150);
			visibleOr("div:nth-child(4) > material-fab i")?.click();
			caseNote = await waitFor(getVisibleCaseNote, 2000).catch(
				() => null,
			);
		}
		if (!caseNote) return false;
		const html = toSafeHTML(templateHTML);
		const existing = replaceExisting && $(SEL.NOTE_ROOT, caseNote);
		if (existing) existing.outerHTML = html;
		else caseNote.insertAdjacentHTML("beforeend", html);
		fire(caseNote, "input");
		return true;
	};

	// Re-adds or removes the "(Only for ECW)" rows when the task types change.
	const syncEcRows = (tbl, taskText) => {
		const tbody = tbl?.tBodies?.[0] || tbl;
		if (!tbody) return;
		for (const tr of $$("tr", tbody))
			if (tr.dataset.ecRow || /\(only for ecw\)/i.test(cellText(tr, 0)))
				tr.remove();
		const implHead = $$("tr", tbody).find((r) =>
			/implementation screenshots/i.test(r.textContent),
		);
		if (!isEcTask(taskText) || !implHead) return;
		const html = toSafeHTML(ecRowsHTML());
		const last = tbody.lastElementChild;
		if (
			last &&
			last !== implHead &&
			/additional screenshots/i.test(cellText(last, 0))
		)
			last.insertAdjacentHTML("beforebegin", html);
		else tbody.insertAdjacentHTML("beforeend", html);
	};

	const deleteRow = (delBtn) => {
		const tr = delBtn.closest("tr");
		const note = tr?.closest(SEL.CASE_NOTE);
		if (tr) {
			if (delBtn.dataset.delSec || isSecHead(tr))
				while (
					tr.nextElementSibling &&
					!isSecHead(tr.nextElementSibling)
				)
					tr.nextElementSibling.remove();
			tr.remove();
		}
		fire(note, "input");
	};

	const findNaTextNode = (root) => {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		for (let tn; (tn = walker.nextNode());)
			if (NA_RE.test(tn.nodeValue)) return tn;
		return null;
	};

	// Clicking an "NA" placeholder selects and deletes it, leaving the caret there.
	const clearNaAtNode = (raw) => {
		const note = raw?.closest(
			`${SEL.CASE_NOTE}, ${SEL.NOTE_ROOT}, .cdtx__uioncall`,
		);
		if (!note) return false;
		const editable =
			note.closest(`${SEL.CASE_NOTE}, [contenteditable="true"]`) || note;
		const td = raw.closest("td");
		const isValTd = !td || td !== td.parentElement?.cells?.[0];

		const deleteRange = (tn, start = 0, end = tn.nodeValue.length) => {
			tn.parentElement?.removeAttribute("data-btnclk");
			editable.focus?.();
			const sel = window.getSelection();
			if (!sel) return;
			const r = document.createRange();
			r.setStart(tn, start);
			r.setEnd(tn, end);
			sel.removeAllRanges();
			sel.addRange(r);
			document.execCommand("delete", false, null);
			if (tn.isConnected && NA_RE.test(tn.nodeValue)) {
				// execCommand refused (non-editable span): swap in a zero-width char and park the caret.
				tn.nodeValue = "\u200B";
				const r2 = document.createRange();
				r2.setStart(tn, 1);
				r2.collapse(true);
				sel.removeAllRanges();
				sel.addRange(r2);
			}
			fire(editable, "input");
		};

		const tn =
			(isValTd &&
				td &&
				NA_RE.test(td.textContent) &&
				findNaTextNode(td)) ||
			(NA_RE.test(raw.textContent || "") && findNaTextNode(raw));
		if (tn) {
			deleteRange(tn);
			return true;
		}

		const sel = window.getSelection();
		const a = sel?.anchorNode;
		if (isValTd && a?.nodeType === 3 && note.contains(a)) {
			for (const m of a.nodeValue.matchAll(/\bNA\b/g)) {
				if (
					sel.anchorOffset >= m.index &&
					sel.anchorOffset <= m.index + 2
				) {
					deleteRange(a, m.index, m.index + 2);
					return true;
				}
			}
		}
		return false;
	};

	// Written inline so the saved note keeps it (the panel CSS only applies while editing).
	const unifyFont = (root) => {
		let changed = false;
		for (const n of [root, ...$$("*", root)]) {
			if (n.style.fontSize === NOTE_FONT.size && /google sans/i.test(n.style.fontFamily)) continue;
			n.style.fontSize = NOTE_FONT.size;
			n.style.fontFamily = NOTE_FONT.family;
			changed = true;
		}
		return changed;
	};
	// Before submit: remove ✕ buttons and row descriptions, unwrap highlights and set one font, so only clean content is saved.
	const stripDelBtnsOnSubmit = (e) => {
		const submitBtn = toElement(e.target)?.closest(SEL.SUBMIT);
		if (!submitBtn) return;
		let removed = false;
		for (const note of $$(SEL.CASE_NOTE)) {
			const btns = $$(`${SEL.DEL_BTN}, ${SEL.DESC}`, note);
			btns.forEach((b) => b.remove());
			const hls = $$(HIGHLIGHT_SEL, note);
			hls.reverse().forEach((h) => h.replaceWith(...h.childNodes)); // innermost first
			const fontFixed = unifyFont(note);
			if (btns.length || hls.length || fontFixed) {
				note.focus();
				fire(note, "beforeinput", "input", "keyup", "change");
				removed = true;
			}
		}
		if (removed) state.lastStrippedAt = Date.now();
		// The editor needs a tick to commit the cleaned DOM: swallow this click and click again.
		if (
			e.type === "click" &&
			!submitBtn.dataset.qmCleanSubmit &&
			(removed || Date.now() - state.lastStrippedAt < 120)
		) {
			e.preventDefault();
			e.stopImmediatePropagation();
			submitBtn.dataset.qmCleanSubmit = "1";
			setTimeout(() => {
				submitBtn.click();
				delete submitBtn.dataset.qmCleanSubmit;
			}, 60);
		}
	};

	// === 7. UI ===
	const MODAL_TITLE = "font-size:18px;font-weight:700;color:#1D1D1F;margin-bottom:4px;padding:0 32px;";
	const MODAL_SUB = "font-size:14px;color:#86868B;margin-bottom:18px;";

	// Shared popup shell. close(val) removes it and resolves the caller's promise.
	// ✕ resolves null, which every caller treats as "nothing chosen" (the note keeps NA).
	const openModal = (resolve, width = "320px") => {
		$("#qm-modal-overlay")?.remove();
		const overlay = el("div", {
			id: "qm-modal-overlay",
			parent: document.body,
			style: "position:fixed;inset:0;background:rgba(0,0,0,0.15);backdrop-filter:blur(1px);pointer-events:none;display:flex;align-items:center;justify-content:center;z-index:2147483647;",
		});
		const box = el("div", {
			parent: overlay,
			style: `position:relative;display:flex;flex-direction:column;background:#FFF;border-radius:16px;padding:22px;width:${width};max-height:92vh;pointer-events:auto;box-shadow:0 16px 36px rgba(0,0,0,0.12);text-align:center;border:1px solid rgba(0,0,0,0.05);box-sizing:border-box;`,
		});
		const close = (val) => {
			overlay.remove();
			resolve(val);
		};
		el("button", {
			text: "✕",
			title: "Close",
			parent: box,
			style: "position:absolute;top:10px;right:10px;z-index:2;width:28px;height:28px;border:none;border-radius:8px;background:#F1F3F5;color:#495057;font-size:14px;font-weight:700;line-height:1;cursor:pointer;",
			onClick: () => close(null),
		});
		// The body scrolls; the box (and the ✕) stays put.
		const body = el("div", { parent: box, style: "flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;" });
		cleanups.push(() => close(null));
		return { modal: body, close };
	};
	const modalActions = (parent, extra = "") => el("div", { parent, style: `display:flex;flex-direction:column;gap:8px;${extra}` });
	const modalBtn = (parent, label, [bg, color], onClick) =>
		el("button", {
			text: label,
			parent,
			style: `padding:10px 14px;border-radius:10px;border:none;font-size:16px;font-weight:600;cursor:pointer;background:${bg};color:${color};`,
			onClick,
		});

	const promptCaseType = (daysOffset) =>
		new Promise((resolve) => {
			const rootOpts = STEP_OPTIONS[daysOffset];
			if (!rootOpts) return resolve(null);
			const { modal, close } = openModal(resolve);
			const render = (title, items, backFn) => {
				modal.textContent = "";
				el("div", { text: title, parent: modal, style: MODAL_TITLE });
				el("div", { text: "Choose sub-status:", parent: modal, style: MODAL_SUB });
				const actions = modalActions(modal);
				items.forEach((item, i) => {
					const [label, val] = Array.isArray(item) ? item : [item, item];
					modalBtn(actions, label, PALETTE[i % PALETTE.length], () => (Array.isArray(val) ? render(label, val, renderRoot) : close(val)));
				});
				if (backFn) modalBtn(actions, "← Back", NEUTRAL_BTN, backFn);
				else modalBtn(actions, "Skip / Keep Default", NEUTRAL_BTN, () => close(null));
			};
			const renderRoot = () => render(`Options for ${daysOffset} Day(s)`, rootOpts);
			renderRoot();
		});

	// Flow step 2. Returns false straight away if there are no cards.
	const askAddScreenshots = (count) =>
		new Promise((resolve) => {
			if (!count) return resolve(false);
			const { modal, close } = openModal(resolve);
			el("div", { text: "Add screenshots to the case note?", parent: modal, style: MODAL_TITLE });
			el("div", { text: `${count} screenshot(s) found`, parent: modal, style: MODAL_SUB });
			const actions = modalActions(modal);
			modalBtn(actions, "Yes, choose screenshots", PALETTE[1], () => close(true));
			modalBtn(actions, "No, skip", NEUTRAL_BTN, () => close(false));
		});

	// Flow step 7. Resolves with the picked shots in gallery order ([] if skipped). The title typed on a card goes into s.note → "title: link" in the note.
	const pickScreenshots = (shots) =>
		new Promise((resolve) => {
			const { modal, close } = openModal((v) => resolve(v || []), "min(1600px, 96vw)");
			const picked = new Set();
			el("div", { text: "Choose screenshots for the case note", parent: modal, style: MODAL_TITLE });
			el("div", { text: "Click a card to select it, then type a title for the note", parent: modal, style: MODAL_SUB });
			const grid = el("div", {
				parent: modal,
				style: "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:14px;text-align:left;",
			});
			const actions = modalActions(modal, "flex-direction:row;justify-content:center;position:sticky;bottom:0;background:#FFF;padding:8px 0;");
			const addBtn = modalBtn(actions, "Add 0 to note", PALETTE[0], () => close(shots.filter((s) => picked.has(s))));
			modalBtn(actions, "Skip", NEUTRAL_BTN, () => close([]));

			for (const s of shots) {
				const card = el("div", {
					parent: grid,
					title: s.title,
					style: "position:relative;border:2px solid #E9ECEF;border-radius:10px;padding:8px;cursor:pointer;user-select:none;",
					onClick: () => setPicked(!picked.has(s)), // setPicked is defined below; it only runs on click
				});
				const tick = el("div", {
					text: "✓",
					parent: card,
					style: "display:none;position:absolute;top:14px;right:14px;z-index:1;width:28px;height:28px;border-radius:50%;background:#1971C2;color:#FFF;font-size:18px;font-weight:700;line-height:28px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);pointer-events:none;",
				});
				el("img", {
					src: s.thumb,
					loading: "lazy",
					parent: card,
					style: "width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:6px;display:block;background:#F1F3F5;",
					onerror: (e) => s.fallback && e.target.src !== s.fallback && (e.target.src = s.fallback),
				});
				const titleIn = el("input", {
					type: "text",
					value: s.note,
					placeholder: "Type a title for the note",
					parent: card,
					style: "width:100%;box-sizing:border-box;margin-top:6px;padding:6px 8px;border:1px solid #CED4DA;border-radius:6px;font-size:13px;cursor:text;user-select:text;outline:none;",
					onClick: (e) => {
						e.stopPropagation(); // clicking the box must not unselect the card
						if (!picked.has(s)) setPicked(true);
					},
					onkeydown: (e) => e.stopPropagation(), // keep page keyboard shortcuts from firing while typing
					oninput: () => {
						s.note = titleIn.value.trim();
						if (!picked.has(s)) setPicked(true);
					},
				});
				el("div", { text: s.title || s.id, parent: card, style: "font-size:11px;color:#495057;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" });
				el("div", { text: s.time, parent: card, style: "font-size:11px;color:#868E96;" });
				const setPicked = (on) => {
					on ? picked.add(s) : picked.delete(s);
					card.style.borderColor = on ? "#1971C2" : "#E9ECEF";
					card.style.background = on ? "#E7F5FF" : "";
					tick.style.display = on ? "block" : "none";
					addBtn.textContent = `Add ${picked.size} to note`;
					if (on && document.activeElement !== titleIn) titleIn.focus();
				};
			}
		});

	// Writes task types into the case's own "tasks" field (opens edit mode if needed).
	const syncCaseTasks = (text) => {
		if (!$(SEL.SAVE)) $(SEL.EDIT)?.click();
		const setVal = () => {
			const taskEl = $(SEL.TASKS);
			if (!taskEl) return;
			const inp = taskEl.matches("input, textarea")
				? taskEl
				: $("input, textarea", taskEl);
			if (inp) {
				inp.value = text;
				fire(inp, "input", "change");
			} else {
				taskEl.textContent = text;
				fire(taskEl, "input");
			}
		};
		setVal();
		setTimeout(setVal, 50); // edit mode renders its input asynchronously
	};

	const findTaskPickTarget = (node) => {
		const n = toElement(node);
		if (!n || n.closest("#qm-task-pop")) return null;
		const direct = n.closest(SEL.TASK_PICK);
		if (direct) return direct;
		// Fallback when the highlight span is gone: value cell of the "Task types:" row.
		const td = n.closest("td");
		const tr = td?.parentElement;
		return tr && td === tr.cells?.[1] && isTaskTypesRow(tr)
			? $("span span", td) || td.firstElementChild || td
			: null;
	};

	const openTaskPicker = (initialTarget) => {
		state.closeTaskPop?.();
		let target = initialTarget;
		let taskUpdated = false;
		const current = new Set(
			target.textContent
				.split(",")
				.map((s) => matchTaskType(s.trim()))
				.filter(Boolean),
		);
		if (!current.size || current.has("NA")) {
			current.clear();
			current.add("NA");
		}

		const rect = target.getBoundingClientRect();
		const pop = el("div", {
			id: "qm-task-pop",
			parent: document.body,
			style: `position:fixed;top:${Math.max(8, Math.min(rect.bottom + 4, innerHeight - 280))}px;left:${Math.max(8, Math.min(rect.left, innerWidth - 340))}px;width:320px;max-height:260px;background:#fff;border:1px solid #ccc;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:2147483647;display:flex;flex-direction:column;padding:8px;gap:6px;font-family:sans-serif;font-size:12px;box-sizing:border-box;`,
		});
		const search = el("input", {
			type: "search",
			placeholder: "Search task types...",
			parent: pop,
			style: "padding:6px 8px;border:1px solid #ddd;border-radius:6px;outline:none;flex-shrink:0;font-size:12px;margin-right:30px;",
			oninput: () => {
				const q = search.value.toLowerCase();
				for (const l of $$("label", list))
					l.style.display = l.textContent.toLowerCase().includes(q)
						? "flex"
						: "none";
			},
		});
		el("button", {
			text: "✕",
			title: "Close",
			parent: pop,
			style: "position:absolute;top:8px;right:8px;width:24px;height:24px;border:none;border-radius:6px;background:#F1F3F5;color:#ff424b;font-size:12px;font-weight:700;line-height:1;cursor:pointer;",
			onClick: () => state.closeTaskPop?.(), // keeps ticks already applied; same as clicking outside
		});
		const list = el("div", {
			parent: pop,
			style: "flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:4px;",
		});

		const paint = (lbl, on) =>
			Object.assign(lbl.style, {
				background: on ? HL.bg : "transparent",
				color: on ? HL.fg : "#1D1D1F",
				fontWeight: on ? "700" : "400",
			});
		const refreshList = () => {
			for (const l of $$("label", list)) {
				const on = current.has(l.textContent.trim());
				$("input", l).checked = on;
				paint(l, on);
			}
		};
		// "NA" is exclusive: picking it clears everything else, picking anything else clears it.
		const toggle = (t, checked) => {
			if (t === "NA") {
				current.clear();
				if (checked) current.add("NA");
			} else {
				current.delete("NA");
				checked ? current.add(t) : current.delete(t);
			}
			if (!current.size) current.add("NA");
		};
		const apply = () => {
			const text = current.has("NA") ? "NA" : [...current].join(", ");
			// The editor may re-render and detach our span: find it again by its row label.
			if (!target.isConnected)
				target =
					findTaskPickTarget(
						$$("tr").find(isTaskTypesRow)?.cells?.[1],
					) || target;
			target.textContent = text;
			syncEcRows(target.closest("table"), text);
			const tagsEl = $("[data-tags-auto]", target.closest("table") || document);
			if (tagsEl) tagsEl.textContent = tagsForTasks(text);

			fire(target.closest(SEL.CASE_NOTE), "input");
			syncCaseTasks(text);
		};

		for (const t of uniq([...TASK_TYPES, ...current])) {
			const lbl = el("label", {
				parent: list,
				style: "flex-shrink:0;display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 6px;border-radius:4px;margin:0;line-height:1.3;",
			});
			paint(lbl, current.has(t));
			el("input", {
				type: "checkbox",
				checked: current.has(t),
				parent: lbl,
				style: "appearance:auto;-webkit-appearance:checkbox;opacity:1;position:static;width:14px;height:14px;margin:0;flex-shrink:0;cursor:pointer;",
				onchange: (ev) => {
					taskUpdated = true;
					toggle(t, ev.target.checked);
					refreshList();
					apply();
				},
			});
			lbl.append(t);
		}
		search.focus();

		const onOutside = (ev) => {
			if (!pop.contains(ev.target) && !target.contains(ev.target))
				state.closeTaskPop?.();
		};
		state.closeTaskPop = () => {
			if (taskUpdated) {
				syncCaseTasks(target.textContent);
				setTimeout(() => $(SEL.SAVE)?.click(), 100);
			}
			pop.remove();
			document.removeEventListener("mousedown", onOutside, true);
			state.closeTaskPop = null;
		};
		document.addEventListener("mousedown", onOutside, true);
	};

	const onDocClick = (e) => {
		stripDelBtnsOnSubmit(e);
		const raw = toElement(e.target);
		const delBtn = raw?.closest(SEL.DEL_BTN);
		if (delBtn) {
			e.preventDefault();
			e.stopPropagation();
			deleteRow(delBtn);
			return;
		}
		const target = findTaskPickTarget(e.target);
		if (target) {
			e.preventDefault();
			e.stopPropagation();
			openTaskPicker(target);
			return;
		}
		if (clearNaAtNode(raw)) e.stopPropagation();
	};

	const insertSignature = () => {
		const sel = window.getSelection();
		if (!sel?.rangeCount)
			return alert(
				"Please click inside the email body to place your cursor first.",
			);
		if (!toElement(sel.getRangeAt(0).startContainer)?.isContentEditable)
			return alert(
				"Please place your cursor inside the text area where you want the signature.",
			);
		$$(".qm-sig").forEach((n) => n.remove());
		let sigName = localStorage.getItem(SIG_KEY);
		if (!sigName)
			localStorage.setItem(
				SIG_KEY,
				(sigName = prompt("Enter your name:") || "Agent"),
			);
		const html = `<table class="qm-sig" style="width:348px;padding:0 30px;" data-sig-injected="true"><tbody><tr align="left"><td style="width:52px;vertical-align:top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display:block;border-radius:10px;"></td><td style="width:12px;"></td><td style="vertical-align:middle;"><p style="font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;margin:0;line-height:1.4;color:#1D1D1F;"><strong style="font-size:105%;color:#1D1D1F;">${esc(sigName)}</strong><br><span style="color:#86868B;">Technical Solutions Team</span><br><span style="color:#86868B;font-weight:500;">TDCX, on behalf of Google</span></p></td></tr></tbody></table>`;
		document.execCommand("insertHTML", false, toSafeHTML(html));
	};

	// === 8. Follow-up workflow ===
	const setFollowUpDate = async (daysOffset) => {
		await clickWait($(SEL.FOLLOW_UP), 150);
		if (daysOffset > 0) {
			const start = new Date();
			// 7 = one calendar week (same weekday next week), not 7 business days
			const diff = daysOffset === 7 ? 7 : dayDiff(start, addBusinessDays(start, daysOffset));
			let dayEl = await waitFor(SEL.TODAY);
			for (let i = 0; i < diff && dayEl; i++)
				dayEl = dayEl.nextElementSibling;
			if (dayEl) await clickWait(dayEl, 200);
		} else {
			await clickWait(await waitFor('[data-thischoice="Finish"]'), 200);
		}
		await clickWait(await waitFor("[data-type=follow_up_time]"), 200);
	};

	// Opens Case log with every filter checked and all messages expanded.
	const openFullCaseLog = async () => {
		await clickWait($('[aria-label="Case log"]'), 200);
		await clickWait($('[aria-haspopup="dialog"]'), 200);
		const checkAll = $('[debug-id="check-all-box"]');
		for (
			let i = 0;
			i < 2 &&
			checkAll &&
			checkAll.getAttribute("aria-checked") !== "true";
			i++
		)
			await clickWait(checkAll, 150);
		await clickWait($('[debug-id="apply-filter"]'), 300);
		const expandBtn = $(
			'[aria-label="Expand all messages"]:not([aria-expanded="true"])',
		);
		if (expandBtn) await clickWait(expandBtn, 300);
		await waitFor(
			".speakeasy-agent-activity, .message-body-panel",
			1500,
		).catch(() => { });
	};

	const executeFollowUp = async (flupBtn) => {
		if (flupBtn.dataset.busy) return;
		flupBtn.dataset.busy = "1"; // PANEL_CSS dims it and blocks clicks
		try {
			// Un-crawled case: the date fields don't exist until .isnew is clicked and the crawl finishes.
			if (!$(SEL.APPT)) {
				$(SEL.IS_NEW)?.click();
				await waitFor(SEL.APPT, 8000); // throws, which stops the flow, if the crawl never finishes
			}
			if (!$("._connectcase_info--outer")) $(SEL.RECRAWL)?.click();
			await sleep(250);

			await clickWait($('[aria-label="Overview"]'), 300);
			const overviewTasks = scrapeDomTasks();
			const daysOffset = parseInt($("#qm-flup-in")?.value, 10) || 0;

			const apptEl = $(SEL.APPT);
			if (
				apptEl &&
				!/^\d{2}\/\d{2}\/\d{4}$/.test(apptEl.dataset.valchoice)
			) {
				await clickWait(apptEl, 150);
				await clickWait(await waitFor(SEL.TODAY), 200); // default appointment = today
			}

			const templateKey = await promptCaseType(daysOffset);
			await setFollowUpDate(daysOffset);
			await openFullCaseLog();

			// Step 4: read Case log data (SE IDs, verified tags)
			const seIds = scrapeSpeakeasyIds();
			const verifiedTags = scrapeVerifiedTags();
			// Steps 5–7: open snipit tab, read cards, pick
			await clickWait($(SEL.REFRESH_SNIPS), 2000); // open the snipit tab so the gallery loads the latest cards
			const shots = scrapeScreenshots();
			const screenshots = (await askAddScreenshots(shots.length)) ? await pickScreenshots(shots) : [];
			// Step 8: build and insert the note
			const html = buildNoteTemplateHTML(templateKey, {
				verifiedTags,
				domTasks: overviewTasks || scrapeDomTasks(),
				seIds,
				screenshots,
			});
			await insertNote(html, true);
		} catch (err) {
			console.error("Follow up script failed", err);
		} finally {
			delete flupBtn.dataset.busy;
		}
	};

	// === 9. Panel + init ===
	const buildPanel = () => {
		$("#qm-panel")?.remove();
		$("#qm-styles")?.remove();
		el("style", {
			id: "qm-styles",
			parent: document.head || document.documentElement,
			text: PANEL_CSS,
		});
		const panel = el("div", { id: "qm-panel", parent: document.body });

		const autoBtn = el("button", {
			title: "Auto Click",
			className: "qm-btn",
			parent: panel,
			onClick: () => setAuto(!state.clickerInterval),
		});
		const flupItemBtn = el("button", {
			html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width:20px;height:20px;filter:brightness(0.2);"><span id="flup-badge" class="qm-badge">+</span>',
			title: "Click Follow-up Item",
			className: "qm-btn",
			style: "background-color:#A5D8FF;",
			parent: panel,
			onClick: async () => {
				$('[debug-id="dock-item-home"]')?.click();
				try {
					(await waitFor(SEL.FLUP_LIST_ITEM)).click();
				} catch { }
			},
		});
		const flupBtn = el("div", {
			text: "fl up:",
			title: "Set Follow-up",
			className: "qm-btn",
			style: "background-color:#99E9F2;color:#0C5460;padding-right:44px;user-select:none;cursor:pointer;",
			parent: panel,
			onClick: () => executeFollowUp(flupBtn), // the input stops its own clicks from bubbling
		});
		// Single-digit business-day offset; typing a digit replaces the value.
		el("input", {
			id: "qm-flup-in",
			type: "text",
			value: "2",
			parent: flupBtn,
			onmousedown: (e) => e.stopPropagation(),
			onClick: (e) => {
				e.stopPropagation();
				e.target.select();
			},
			onfocus: (e) => e.target.select(),
			onkeydown: (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					executeFollowUp(flupBtn);
				} else if (/^[0-9]$/.test(e.key)) {
					e.preventDefault();
					e.target.value = e.key;
				}
			},
			oninput: (e) => {
				const d = e.target.value.replace(/\D/g, "");
				e.target.value = d ? d.slice(-1) : "";
			},
		});
		const signBtn = el("button", {
			text: "sign",
			title: "Insert Signature at Cursor",
			className: "qm-btn",
			style: "background-color:#CED4DA;color:#343A40;",
			parent: panel,
			onmousedown: (e) => e.preventDefault(), // keep the editor caret
			onClick: insertSignature,
		});

		const autoInsertTick = async () => {
			const visibleNote = getVisibleCaseNote();
			if (
				flupBtn.dataset.busy ||
				(visibleNote && $(SEL.NOTE_ROOT, visibleNote))
			)
				return;
			if (!(await insertNote(buildNoteTemplateHTML(null), false))) return;
			clearTimeout(state.removeTimer);
			state.removeTimer = setTimeout(
				() =>
					$(
						".cdtx__uioncall_control-remove",
						getVisibleCaseNote() || document,
					)?.click(),
				AUTO_REMOVE_MS,
			);
		};
		const setAuto = (on) => {
			clearInterval(state.clickerInterval);
			state.clickerInterval = on
				? setInterval(autoInsertTick, AUTO_INSERT_MS)
				: null;
			autoBtn.textContent = on ? "on" : "off";
			autoBtn.style.backgroundColor = on ? "#B2F2BB" : "#FFA8A8";
			autoBtn.style.color = on ? "#1E5E2A" : "#6A1A1A";
		};

		waitFor(SEL.FLUP_LIST_ITEM)
			.then((item) => {
				if (!panel.isConnected) return;
				const badge = $("#flup-badge", panel);
				const update = () =>
				(badge.style.display =
					item.dataset.attr && item.dataset.attr !== "0"
						? "block"
						: "none");
				const observer = new MutationObserver(update);
				observer.observe(item, {
					attributes: true,
					attributeFilter: ["data-attr"],
				});
				cleanups.push(() => observer.disconnect());
				update();
			})
			.catch(() => { });

		const syncOwnerUI = () => {
			const ldap = $(SEL.PROFILE_PHOTO)
				?.src?.match(/photos\/([^/?]+)/)?.[1]
				?.toLowerCase();
			const isOwner = ldap === OWNER_LDAP;
			for (const b of [autoBtn, flupItemBtn, signBtn])
				b.style.display = isOwner ? "" : "none";
			setAuto(isOwner);
		};
		syncOwnerUI();
		if (!$(SEL.PROFILE_PHOTO))
			waitFor(SEL.PROFILE_PHOTO)
				.then(() => panel.isConnected && syncOwnerUI())
				.catch(() => { });

		return panel;
	};

	const init = () => {
		const panel = buildPanel();
		const listeners = [
			["pointerdown", stripDelBtnsOnSubmit],
			["mousedown", stripDelBtnsOnSubmit],
			["click", onDocClick],
		];
		for (const [type, fn] of listeners)
			window.addEventListener(type, fn, true);
		cleanups.push(() => {
			clearInterval(state.clickerInterval);
			clearTimeout(state.removeTimer);
			for (const [type, fn] of listeners)
				window.removeEventListener(type, fn, true);
			state.closeTaskPop?.();
			panel.remove();
		});
	};

	document.readyState === "loading"
		? document.addEventListener("DOMContentLoaded", init, { once: true })
		: init();
})();
