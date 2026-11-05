(() => {
	"use strict";
	// ============================================================================
	// SECTION 1: GLOBAL LIFECYCLE & TEARDOWN REGISTRY
	// ============================================================================
	const G = window.__OMNITOOL__ ||= {};
	try { G.teardown?.(); } catch (e) { console.warn("Omnitool: previous cleanup failed", e); }
	const cleanups = [];
	const onTeardown = fn => cleanups.push(fn);
	G.teardown = () => {
		while (cleanups.length) try { cleanups.pop()(); } catch (e) { console.warn("Omnitool: cleanup error", e); }
	};
	// ============================================================================
	// SECTION 2: TRUSTED TYPES SECURITY LAYER
	// ============================================================================
	const toSafeHTML = html => {
		if (!G.tt) {
			const pass = { createHTML: s => s };
			for (const name of ["omnitool", "default"]) try { G.tt ||= window.trustedTypes?.createPolicy?.(name, pass); } catch {}
			G.tt ||= window.trustedTypes?.defaultPolicy || pass;
		}
		return G.tt.createHTML(html);
	};
	// ============================================================================
	// SECTION 3: SHARED DOM & ASYNC UTILITY LIBRARY
	// ============================================================================
	const Utils = {
		sleep: ms => new Promise(r => setTimeout(r, ms)),
		$: (s, p = document) => p.querySelector(s),
		$$: (s, p = document) => [...p.querySelectorAll(s)],
		toSafeHTML,
		isoDate: (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
		createEl(tag, { parent, onClick, style, text, html, ...props } = {}) {
			const el = document.createElement(tag);
			if (text !== undefined) el.textContent = text;
			if (html !== undefined) el.innerHTML = toSafeHTML(html);
			if (style) typeof style === "string" ? (el.style.cssText = style) : Object.assign(el.style, style);
			if (onClick) el.addEventListener("click", onClick);
			for (const [k, v] of Object.entries(props)) k.startsWith("data-") ? el.setAttribute(k, v) : (el[k] = v);
			if (parent) parent.appendChild(el);
			return el;
		},
		addStyle(id, text) {
			document.getElementById(id)?.remove();
			Utils.createEl("style", { id, text, parent: document.head || document.documentElement });
		},
		waitForElement: (selector, timeout = 5000) => new Promise((resolve, reject) => {
			const el = document.querySelector(selector);
			if (el) return resolve(el);
			const obs = new MutationObserver(() => {
				const found = document.querySelector(selector);
				if (found) { obs.disconnect(); clearTimeout(timer); resolve(found); }
			});
			obs.observe(document.documentElement, { childList: true, subtree: true });
			const timer = setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout waiting for: ${selector}`)); }, timeout);
		}),
		escapeHtml: s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]))
	};
	const { $, $$ } = Utils;
	// ============================================================================
	// SECTION 7&8: CASES CONNECT WORKFLOW & FOLLOW-UP AUTOMATION (CasesConnect)
	// ============================================================================
	const BASE_COMMENTS = ["Setup Conversion Linker", "Guided the advertiser how to see the report", "Survey pitched"];
	const GA4_COMMENTS = [...BASE_COMMENTS, "Linked GA4 and Google Ads", "Turned on Google signals data collection", "Turned on User Data Collection Acknowledgement", "Tested with Tag Assistant and Real time in GA4"];
	const CONV_BASE = subStatus => ({
		subStatus,
		subStatusReason: "Implement Ads Conversion Tracking",
		tagsImplemented: "Ads Conversion Tracking",
		comments: ["Implemented Google Ads conversions for { Hotline / Zalo / Purchase / Form } via GTM / Gtag", "Tested with Tag Assistant", "No recent conversions", ...BASE_COMMENTS]
	});
	const STEP_OPTIONS = {
		0: [
			["SO - Solution Offered", [
				["SO - Implementation Only", "IMPLEMENTATION_ONLY"],
				["SO - Education Only", "EDUCATION_ONLY"],
				["SO - Troubleshooting Only", "TROUBLESHOOTING_ONLY"],
				["SO - Verified", "VERIFIED"]
			]],
			["IN - Inactive", [
				["IN - Instruction Share", "INSTRUCTION_SHARE"],
				["IN - Out of Scope", "OUT_OF_SCOPE"],
				["IN - Not Reachable", "NOT_REACHABLE"],
				["IN - Infeasible", "INFEASIBLE"],
				["IN - Not Interested", "NOT_INTERESTED"]
			]]
		],
		1: [["AS - Reschedule 1", "RESCHEDULE_1"], ["NI - Attempted Contact", "ATTEMPT_CONTACT"]],
		2: [
			["NI - Awaiting Inputs (Setup GTM)", "WAITING_INPUT"],
			["NI - Awaiting Validation", [
				["GA4 Event", "GA4"],
				["GA4 UPD", "GA4_UPD"],
				["Remarketing", "REMARKETING"]
			]],
			["NI - In Consult", "IN_CONSULT"]
		],
		5: [["NI - Awaiting Validation (Enhanced Conversion)", "EC"]]
	};
	STEP_OPTIONS[3] = STEP_OPTIONS[2];
	const PALETTE = [
		["#A5D8FF", "#183B56"], ["#B2F2BB", "#1E5E2A"], ["#D0BFFF", "#3A2A59"],
		["#FFEC99", "#5C3A00"], ["#FCC2D7", "#610B2A"], ["#D8F5A2", "#2B5200"],
		["#FFD8A8", "#66181D"], ["#EAEAEA", "#333333"], ["#C5F6FA", "#0B7285"]
	];
	const CasesConnect = {
		NOTE_TEMPLATES: {
			EC: {
				subStatus: "NI - Awaiting Validation",
				subStatusReason: "Implemented Ads Enhanced Conversion",
				taskTypes: "Ads Enhanced Conversions for web",
				tagsImplemented: "Ads Enhanced Conversions",
				comments: ["Implemented Google Ads enhanced conversions for { Purchase, Form Submit } via GTM / Gtag", "Tested with Tag Assistant", "Turn on Enhanced Conversion in conversion action", "No recent conversions", "Awaiting enhanced conversion to record data", ...BASE_COMMENTS]
			},
			GA4_LINK: { subStatus: "SO - Implementation Only", subStatusReason: "Implement GA4", taskTypes: "GA4 Setup", comments: ["Implemented GA4 tag via GTM", ...GA4_COMMENTS] },
			WAITING_INPUT: { subStatus: "NI - Awaiting Inputs", subStatusReason: "waiting for Adv to setup GTM", comments: ["Waiting for advertiser to setup GTM"] },
			RESCHEDULE_1: { subStatus: "AS - Reschedule 1" },
			IN_CONSULT: { subStatus: "NI - In Consult", subStatusReason: "Waiting for SME to confirm" },
			INSTRUCTION_SHARE: { subStatus: "IN - Instruction Share" },
			CONVERSION_TRACKING: CONV_BASE("SO - { Implementation / Education / Troubleshooting } Only"),
			IMPLEMENTATION_ONLY: CONV_BASE("SO - Implementation Only"),
			EDUCATION_ONLY: CONV_BASE("SO - Education Only"),
			TROUBLESHOOTING_ONLY: CONV_BASE("SO - Troubleshooting Only"),
			VERIFIED: CONV_BASE("SO - Verified"),
			OUT_OF_SCOPE: { subStatus: "IN - Out of Scope" },
			NOT_REACHABLE: { subStatus: "IN - Not Reachable" },
			INFEASIBLE: { subStatus: "IN - Infeasible" },
			NOT_INTERESTED: { subStatus: "IN - Not Interested" },
			GA4: {
				subStatus: "NI - Awaiting Validation",
				subStatusReason: "Implement GA4 Event",
				tagsImplemented: "Analytics Event Tracking",
				comments: ["Implemented GA4 event { Hotline / Zalo / Purchase / Form } via GTM / Gtag code", "Recording data", "Awaiting events to be processed in GA4 Event Report", "Guide advertiser import GA4 event to Google Ads", ...GA4_COMMENTS]
			},
			GA4_UPD: {
				subStatus: "NI - Awaiting Validation",
				subStatusReason: "Implement User-Provided Data",
				tagsImplemented: "GA4 User-Provided Data",
				comments: ["Implemented GA4 User-Provided Data collection", "Tested with Tag Assistant and Real time in GA4", ...GA4_COMMENTS]
			},
			REMARKETING: {
				subStatus: "NI - Awaiting Validation",
				subStatusReason: "Implement Ads Audiences",
				tagsImplemented: "Ads Remarketing",
				comments: ["Implemented GA4 Audiences for Pageview < {10} s via GTM", ...GA4_COMMENTS]
			},
			ATTEMPT_CONTACT: { subStatus: "NI - Attempted Contact", subStatusReason: "Adv not answer the phone", comments: ["Attempted to contact advertiser, call was not answered"] }
		},
		parseDate(val) {
			if (!val) return null;
			const ts = Number(val);
			if (!isNaN(ts) && ts > 1e11) return new Date(ts);
			const p = String(val).match(/\d+/g);
			return p?.length >= 3 ? (p[0].length === 4 ? new Date(+p[0], +p[1] - 1, +p[2]) : new Date(+p[2], +p[1] - 1, +p[0])) : null;
		},
		promptCaseType: daysOffset => new Promise(resolve => {
			$("#qm-modal-overlay")?.remove();
			const rootOpts = STEP_OPTIONS[daysOffset];
			if (!rootOpts) return resolve(null);
			const overlay = Utils.createEl("div", {
				id: "qm-modal-overlay",
				parent: document.body,
				style: "position:fixed;inset:0;background:rgba(0,0,0,0.15);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:2147483647;"
			});
			const modal = Utils.createEl("div", {
				parent: overlay,
				style: "background:#FFF;border-radius:16px;padding:22px;width:320px;box-shadow:0 16px 36px rgba(0,0,0,0.12);text-align:center;border:1px solid rgba(0,0,0,0.05);max-height:85vh;overflow-y:auto;"
			});
			const close = val => { overlay.remove(); resolve(val); };
			onTeardown(() => close(null));
			const render = (title, items, backFn) => {
				modal.textContent = "";
				Utils.createEl("div", { text: title, parent: modal, style: "font-size:18px;font-weight:700;color:#1D1D1F;margin-bottom:4px;" });
				Utils.createEl("div", { text: "Choose sub-status:", parent: modal, style: "font-size:14px;color:#86868B;margin-bottom:18px;" });
				const actions = Utils.createEl("div", { parent: modal, style: "display:flex;flex-direction:column;gap:8px;" });
				[
					...items.map(([label, val], i) => [
						label,
						...PALETTE[i % PALETTE.length],
						() => Array.isArray(val) ? render(label, val, () => render(`Options for ${daysOffset} Day(s)`, rootOpts)) : close(val)
					]),
					backFn ? ["← Back", "#F1F3F5", "#495057", backFn] : ["Skip / Keep Default", "#F1F3F5", "#495057", () => close(null)]
				].forEach(([label, bg, color, onClick]) => Utils.createEl("button", {
					text: label,
					parent: actions,
					style: `padding:10px 14px;border-radius:10px;border:none;font-size:16px;font-weight:600;cursor:pointer;background:${bg};color:${color};`,
					onClick
				}));
			};
			render(`Options for ${daysOffset} Day(s)`, rootOpts);
		}),
		buildNoteTemplateHTML(templateKey, followUpVal, speakeasyId = "NA", verifiedTags = "", isAppt1WeekBefore = false) {
			let cfg = CasesConnect.NOTE_TEMPLATES[templateKey];
			if (cfg && isAppt1WeekBefore && ["IMPLEMENTATION_ONLY", "TROUBLESHOOTING_ONLY", "EDUCATION_ONLY"].includes(templateKey)) {
				cfg = { ...cfg, taskTypes: "Ads Enhanced Conversions for web", tagsImplemented: "Ads Enhanced Conversions", comments: ["Verified Google Ads enhanced conversions for { Purchase, Form Submit } via GTM / Gtag", ...BASE_COMMENTS] };
			}
			const esc = Utils.escapeHtml;
			const td = "border:1pt solid #000;vertical-align:top;padding:5pt;overflow:hidden;word-break:break-word;box-sizing:border-box;";
			const font = "font-size:11pt;font-family:'Google Sans',sans-serif;color:#000;white-space:pre-wrap;";
			const cid = esc($(".above-section div:nth-child(5) .capitalized")?.innerText?.trim()?.replace(/\D/g, "")?.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") || "NA");
			const apptTasks = $$(`.form-label`).find(el => el.textContent.trim() === "Appointment tasks")?.parentElement.querySelectorAll("sanitized-content");
			const domTasks = apptTasks?.length ? [...apptTasks].map(el => el.textContent.trim().replace(/s$/i, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).replace(/\bGa4\b/g, "GA4")).join(", ") : "";
			const g = s => `<span style="color:#188038;">${s}</span>`;
			const head = title => `<tr style="height:21pt"><td colspan="2" style="${td}background:#fff2cc;text-align:center;"><span style="${font}font-weight:700;">${title}</span> <span style="${font}font-style:italic;">(Mandatory)</span></td></tr>`;
			const row = (lbl, desc, val, bg = "transparent") => `<tr style="height:21pt"><td style="${td}width:30%;"><span style="${font}background:${bg};font-weight:700;">${lbl}</span>${desc ? `<div style="font-size:9.5pt;font-family:'Google Sans',sans-serif;color:#5f6368;margin-top:2px;line-height:1.25;">${desc}</div>` : ""}</td><td style="${td}width:70%;"><span style="${font}background:${bg};">${val}</span></td></tr>`;
			const comments = cfg?.comments?.length ? `<ul dir="auto" style="margin:0;padding-left:18px;">${cfg.comments.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : "NA";
			const consent = cfg?.subStatus && !/Attempted Contact|Not Reachable|Unreachable/i.test(cfg.subStatus) ? "Yes" : "NA";
			return `<div id="noteCaseUI" class="cdtx__uioncall"><div class="cdtx__uioncall_control"><span class="cdtx__uioncall_control-load" data-text="Split &amp; Transfer" data-btnclk="oncall_templ_lt_template">&nbsp;</span><span class="cdtx__uioncall_control-load" data-text="List" data-btnclk="oncall_templ_act_load">&nbsp;</span><span class="cdtx__uioncall_control-save" data-text="Save" data-btnclk="oncall_templ_act_save" data-btntooltip="Save template Reuse">&nbsp;</span><span class="cdtx__uioncall_control-remove" data-text="Remove" data-btnclk="oncall_templ_act_remove">&nbsp;</span></div><article class="cdtx__uioncall_outer"><table style="width:100% !important;table-layout:fixed !important;border-collapse:collapse !important;margin:8px 0 !important;box-sizing:border-box !important;"><tbody>${head("General Details")
				+ row("Date:", "[YYYY-MM-DD — Date when the SpeakEasy call, Attempted Contact dial, or follow-up action occurred]", Utils.isoDate(), "#c9daf8")
				+ row("Speakeasy ID:", `[Exact SpeakEasy session ID copied from the SpeakEasy dashboard (e.g., ${g("P100000000381267617")}). List all IDs separated by comma if multiple dials were made; write ${g("NA")} for offline/email-only updates]`, esc(speakeasyId || "NA"))
				+ row("Sub-status:", '[Exact Connect Cases Sub-Status selected in Q+ per <a href="http://goto.google.com/tsStatuses" target="_blank" style="color:#1155cc;">go/tsStatuses</a>]', `<span class="_sub_i" data-btnclk="choice_status_list" data-infocase="status_case">${esc(cfg?.subStatus || "NA")}</span>`)
				+ row("Next Follow-Up Date", `[YYYY-MM-DD — Date when the next follow-up is due; or ${g("NA")}]`, `<span data-btnclk="oncall_templ_act_flchoice" data-dateformat="Y-m-d" data-text="oncall_templ_act_flchoice-text">${esc(followUpVal || "NA")}</span>`)
				+ row("Task types:", `[Primary Task Type(s) worked on the call separated by comma (e.g., ${g("Ads Conversion Tracking, Ads Enhanced Conversions for web")}); write ${g("NA")} only if no tasks were involved in emails or call]`, esc(domTasks || cfg?.taskTypes || cfg?.tagsImplemented || "NA"))
				+ row("Implemented tags:", `[Exact name(s) of conversion actions created, verified, or troubleshot in Google Ads separated by comma (e.g., ${g("Phone_call, lead_form, Purchase_Shopify, Add_to_Cart")}); write ${g("NA")} if not applicable]`, `<span>${esc(verifiedTags || cfg?.tagsImplemented || "NA")}</span>`)
				+ row("CID:", `[10-digit external Google Ads Customer ID (${g("XXX-XXX-XXXX")}) confirmed with the advertiser on the call and worked upon. If multiple CIDs or a different CID than the CUF intake form was worked upon, list all CIDs separated by comma; write ${g("NA")} if not applicable]`, cid)
				+ row("Checked and obtained recording consent from the customer before proceeding with the call", `[${g("Yes")} / ${g("No")} — Whether mandatory call recording consent was obtained at the beginning of the call per country SOP; write ${g("NA")} for ${g("NI - Attempted Contact")} / ${g("IN - Not Reachable")}]`, consent)
				+ row("Call Summary:", "Concise sentence summary of what transpired on the call/email", cfg?.comments?.length ? esc(cfg.comments[0]) : "NA")
				+ row("Sub-status Reason :", "exact justification for the selected sub-status", `<span class="cdtx__uioncall-oct_test">${esc(cfg?.subStatusReason || "NA")}</span>`)
				+ row("Additional information:&nbsp;", "Additional information related to case and call can be put here", comments)
				+ head("Screenshots")
				+ row("Website URL worked upon:", `[Attach Tag Assistant screenshot showing the website URL connected in Google Tag Assistant (e.g., ${g("https://www.exampleclient.com")}); write ${g("NA")} only if no tasks were involved]`, "NA")
				+ row("Q+ entry:", "[Attach screenshot URL of the completed Q+ tool submission when closing or transferring the case]", "NA")
				+ row("GVC Chat:", `[Attach screenshot(s) of Google Meet chat if links or instructions were shared on the call; otherwise write ${g("NA")}]`, "NA")
				+ row("GAM:", `[Attach screenshot URL of the Google Chat ping sent to the Seller / GAM immediately after the call with call outcome, current status, and next steps (+ Seller chat confirmation if additional participants were added, or OOS redirection). Write ${g("NA - DFA Case")} for DFA cases]`, "NA")
				+ row("Additional Screenshots", `[Attach any additional screenshots of ${g("implementation, troubleshooting, validation, discrepancies etc.")} that are required based on the troubleshooting scenario encountered.] ✨`, "NA")
				}</tbody></table></article></div>`;
		},
		currentFollowUp: () => {
			const val = $('[data-infocase="follow_up_time"]')?.dataset?.valchoice;
			if (!val) return "NA";
			const ts = Number(val);
			return !isNaN(ts) && ts > 1e11 ? Utils.isoDate(new Date(ts)) : val;
		},
		insertNote(templateHTML, replaceExisting) {
			const caseNote = $$('[aria-label="Case Note"]').filter(el => el.offsetParent !== null).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] || $('[aria-label="Case Note"]');
			const existing = replaceExisting && caseNote && $("#noteCaseUI", caseNote);
			if (existing) existing.outerHTML = toSafeHTML(templateHTML);
			else if (caseNote) caseNote.insertAdjacentHTML("beforeend", toSafeHTML(templateHTML));
			caseNote?.dispatchEvent(new Event("input", { bubbles: true }));
			return Boolean(existing || caseNote);
		},
		async executeFollowUp(flupBtn) {
			if (flupBtn.dataset.busy) return;
			flupBtn.dataset.busy = "1";
			flupBtn.style.opacity = "0.6";
			flupBtn.style.pointerEvents = "none";
			try {
				if (!$("._connectcase_info--outer")) $('[data-btnclk="_connectcase_info-act_recrawl"]')?.click();
				$('[aria-label="Overview"]')?.click();
				await Utils.sleep(300);
				const daysOffset = parseInt($("#qm-flup-in")?.value, 10) || 0;
				const apptEl = $('[data-infocase="appointment_time"]');
				let isAppt1WeekBefore = false;
				if (apptEl) {
					if (!apptEl.dataset.valchoice) {
						apptEl.click();
						await Utils.sleep(150);
						(await Utils.waitForElement(".datepicker-grid .today")).click();
						await Utils.sleep(200);
					} else {
						const apptDate = CasesConnect.parseDate(apptEl.dataset.valchoice || apptEl.innerText);
						if (apptDate && !isNaN(apptDate)) {
							isAppt1WeekBefore = Math.round((new Date().setHours(0, 0, 0, 0) - apptDate.setHours(0, 0, 0, 0)) / 864e5) >= 5;
						}
					}
				}
				const templateKey = await CasesConnect.promptCaseType(daysOffset);
				$('[data-infocase="follow_up_time"]')?.click();
				await Utils.sleep(150);
				if (daysOffset > 0) {
					const start = new Date(), target = new Date(start);
					for (let c = 0; c < daysOffset;) {
						target.setDate(target.getDate() + 1);
						if (target.getDay() % 6 !== 0) c++;
					}
					let dayEl = await Utils.waitForElement(".datepicker-grid .today");
					for (let i = 0, diff = Math.round((target - start) / 864e5); i < diff && dayEl; i++) dayEl = dayEl.nextElementSibling;
					if (dayEl) { dayEl.click(); await Utils.sleep(200); }
				} else {
					(await Utils.waitForElement('[data-thischoice="Finish"]')).click();
					await Utils.sleep(200);
				}
				(await Utils.waitForElement("[data-type=follow_up_time]")).click();
				await Utils.sleep(200);
				$('[aria-label="Case log"]')?.click();
				await Utils.sleep(200);
				$('[aria-haspopup="dialog"]')?.click();
				await Utils.sleep(200);
				const checkAllBtn = $('[debug-id="check-all-box"]');
				if (checkAllBtn?.getAttribute("aria-checked") === "false") {
					checkAllBtn.click();
					await Utils.sleep(150);
					$('[debug-id="apply-filter"]')?.click();
					await Utils.sleep(300);
				}
				const lastCall = $$(".outbound-call").at(-1);
				if (lastCall) { lastCall.click(); await Utils.sleep(300); }
				for (const h of $$('.message-header.note[aria-expanded="false"]')) {
					if (/successfully verified for the below listed conversion actions/i.test(h.innerText)) h.click();
				}
				await Utils.sleep(300);
				const verifiedTags = [...new Set($$(".message-body.note").flatMap(el => /successfully verified for the below listed conversion actions/i.test(el.innerText) ? [...el.innerText.matchAll(/^[ \t]*(?:-\s*)?([^\n,|]+?)\s*(?:,|\|)\s*[A-Za-z0-9_-]{10,}\s*(?:,|\|)/gm)].map(m => m[1].trim()) : []))].join(", ");
				const speakeasyId = document.body.innerText.match(/Speakeasy session ID:\s*(P\d+)/i)?.[1] || "NA";
				CasesConnect.insertNote(CasesConnect.buildNoteTemplateHTML(templateKey, CasesConnect.currentFollowUp(), speakeasyId, verifiedTags, isAppt1WeekBefore), true);
			} catch (err) {
				console.error("Follow up script failed", err);
			} finally {
				delete flupBtn.dataset.busy;
				flupBtn.style.opacity = "1";
				flupBtn.style.pointerEvents = "auto";
			}
		},
		insertSignature() {
			const sel = window.getSelection();
			if (!sel?.rangeCount) return alert("Please click inside the email body to place your cursor first.");
			const start = sel.getRangeAt(0).startContainer;
			const node = start.nodeType === Node.ELEMENT_NODE ? start : start.parentElement;
			if (!node?.isContentEditable) return alert("Please place your cursor inside the text area where you want the signature.");
			$$(".qm-sig").forEach(el => el.remove());
			let sigName = localStorage.getItem("__signature_name");
			if (!sigName) localStorage.setItem("__signature_name", sigName = prompt("Enter your name:") || "Agent");
			const html = `<table class="qm-sig" style="width:348px;padding:0 30px;" data-sig-injected="true"><tbody><tr align="left"><td style="width:52px;vertical-align:top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display:block;border-radius:10px;"></td><td style="width:12px;"></td><td style="vertical-align:middle;"><p style="font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;margin:0;line-height:1.4;color:#1D1D1F;"><strong style="font-size:105%;color:#1D1D1F;">${Utils.escapeHtml(sigName)}</strong><br><span style="color:#86868B;">Technical Solutions Team</span><br><span style="color:#86868B;font-weight:500;">TDCX, on behalf of Google</span></p></td></tr></tbody></table>`;
			document.execCommand("insertHTML", false, toSafeHTML(html));
		},
		init() {
			const C = CasesConnect;
			$("#qm-panel")?.remove();
			Utils.addStyle("qm-styles", "@import url('https://fonts.googleapis.com/css2?family=Eczar:wght@400;600;700&display=swap'); #qm-panel, #qm-panel *, #qm-modal-overlay, #qm-modal-overlay * { font-family: \"Eczar\", serif !important; } #qm-panel { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 99999; font-size: 14px; } .qm-btn { z-index: 10; color: #1D1D1F; padding: 10px 16px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); backdrop-filter: blur(6px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.6); user-select: none; } .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); filter: brightness(0.97); } .qm-btn:active { transform: scale(0.96); } #qm-flup-in { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.95); color: #1D1D1F; font-weight: 700; font-size: 14px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); transition: all 0.2s ease; -moz-appearance: textfield; z-index: 20; cursor: text; user-select: text; } #qm-flup-in:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #74B9FF; } .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF8787; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; color: #FFFFFF; } .qm-sig { margin: 12px 0; } .dock-container { max-height: 400px !important; overflow-y: auto !important; }");
			const panel = Utils.createEl("div", { id: "qm-panel", parent: document.body });
			let clickerInterval = null, removeTimer = null, badgeObserver = null;
			const setAuto = (btn, on) => {
				clearInterval(clickerInterval);
				clickerInterval = on ? setInterval(() => {
					if (C.insertNote(C.buildNoteTemplateHTML(null, C.currentFollowUp()), false)) {
						clearTimeout(removeTimer);
						removeTimer = setTimeout(() => $(".cdtx__uioncall_control-remove")?.click(), 6000);
					}
				}, 16000) : null;
				btn.textContent = on ? "on" : "off";
				btn.style.backgroundColor = on ? "#B2F2BB" : "#FFA8A8";
				btn.style.color = on ? "#1E5E2A" : "#6A1A1A";
			};
			const autoBtn = Utils.createEl("button", { title: "Auto Click", className: "qm-btn", parent: panel, onClick: () => setAuto(autoBtn, !clickerInterval) });
			setAuto(autoBtn, true);
			Utils.createEl("button", {
				html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width:20px;height:20px;filter:brightness(0.2);"><span id="flup-badge" class="qm-badge">+</span>',
				title: "Click Follow-up Item",
				className: "qm-btn",
				style: "background-color:#A5D8FF;",
				parent: panel,
				onClick: async () => {
					$('[debug-id="dock-item-home"]')?.click();
					try { (await Utils.waitForElement(".li-popup_lstcasefl")).click(); } catch {}
				}
			});
			Utils.waitForElement(".li-popup_lstcasefl").then(el => {
				if (!panel.isConnected) return;
				const badge = $("#flup-badge", panel);
				const update = () => (badge.style.display = el.dataset.attr && el.dataset.attr !== "0" ? "block" : "none");
				badgeObserver = new MutationObserver(update);
				badgeObserver.observe(el, { attributes: true, attributeFilter: ["data-attr"] });
				update();
			}).catch(() => {});
			const flupBtn = Utils.createEl("div", {
				text: "FL Up:",
				title: "Set Follow-up",
				className: "qm-btn",
				style: "background-color:#99E9F2;color:#0C5460;padding-right:44px;user-select:none;cursor:pointer;",
				parent: panel,
				onClick: e => e.target.id !== "qm-flup-in" && C.executeFollowUp(flupBtn)
			});
			Utils.createEl("input", {
				id: "qm-flup-in",
				type: "text",
				value: "2",
				parent: flupBtn,
				onmousedown: e => e.stopPropagation(),
				onClick: e => {
					e.stopPropagation();
					e.target.select();
				},
				onfocus: e => e.target.select(),
				onkeydown: e => {
					if (e.key === "Enter") {
						e.preventDefault();
						C.executeFollowUp(flupBtn);
					} else if (/^[0-9]$/.test(e.key)) {
						e.preventDefault();
						e.target.value = e.key;
					}
				},
				oninput: e => {
					const d = e.target.value.replace(/\D/g, "");
					e.target.value = d ? d.slice(-1) : "";
				}
			});
			Utils.createEl("button", {
				text: "Sign",
				title: "Insert Signature at Cursor",
				className: "qm-btn",
				style: "background-color:#CED4DA;color:#343A40;",
				parent: panel,
				onmousedown: e => e.preventDefault(),
				onClick: () => C.insertSignature()
			});
			onTeardown(() => {
				clearInterval(clickerInterval);
				clearTimeout(removeTimer);
				badgeObserver?.disconnect();
				panel.remove();
			});
		}
	};
	// ============================================================================
	// SECTION 10: CONTEXT-AWARE ROUTER & BOOTSTRAP DISPATCHER
	// ============================================================================
	const pickFeature = () => "chrome-extension:" === location.protocol ? QPlusAutomator : location.host.includes("casemon2.corp") ? Dash : location.host.includes("cases.connect") ? CasesConnect : location.host.includes("adwords.corp") ? AdWords : TagInspector;
	const start = () => Promise.resolve().then(() => pickFeature().init()).catch(err => console.error("Omnitool error:", err));
	"loading" === document.readyState ? document.addEventListener("DOMContentLoaded", start, { once: true }) : start();
})();