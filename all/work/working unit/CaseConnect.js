(() => {
	"use strict";
	// ============================================================================
	// SECTION 1: GLOBAL LIFECYCLE & TEARDOWN REGISTRY
	// ============================================================================
	const G = window.__OMNITOOL__ ||= {};
	try {
		G.teardown?.();
	} catch (e) {
		console.warn("Omnitool: previous cleanup failed", e);
	}
	const cleanups = [];
	const onTeardown = fn => cleanups.push(fn);
	G.teardown = () => {
		for (; cleanups.length;) try {
			cleanups.pop()();
		} catch (e) {
			console.warn("Omnitool: cleanup error", e);
		}
	};
	// ============================================================================
	// SECTION 2: TRUSTED TYPES SECURITY LAYER
	// ============================================================================
	const toSafeHTML = html => {
		if (!G.tt) {
			const pass = {
				createHTML: s => s
			};
			for (const name of ["omnitool", "default"]) try {
				G.tt ||= window.trustedTypes?.createPolicy?.(name, pass);
			} catch { }
			G.tt ||= window.trustedTypes?.defaultPolicy || pass;
		}
		return G.tt.createHTML(html);
	};
	// ============================================================================
	// SECTION 3: SHARED DOM & ASYNC UTILITY LIBRARY
	// ============================================================================
	const Utils = {
		sleep: ms => new Promise((resolve => setTimeout(resolve, ms))),
		$: (selector, parent = document) => parent.querySelector(selector),
		$$: (selector, parent = document) => [...parent.querySelectorAll(selector)],
		toSafeHTML,
		createEl(tag, { parent, onClick, style, text, html, ...props } = {}) {
			const el = document.createElement(tag);
			if (void 0 !== text) el.textContent = text;
			if (void 0 !== html) el.innerHTML = toSafeHTML(html);
			if (style) if ("string" === typeof style) el.style.cssText = style; else Object.assign(el.style, style);
			if (onClick) el.addEventListener("click", onClick);
			for (const [key, value] of Object.entries(props)) if (key.startsWith("data-")) el.setAttribute(key, value); else el[key] = value;
			if (parent) parent.appendChild(el);
			return el;
		},
		addStyle(id, cssText) {
			document.getElementById(id)?.remove();
			const styleEl = document.createElement("style");
			styleEl.id = id;
			styleEl.textContent = cssText;
			(document.head || document.documentElement).appendChild(styleEl);
		},
		waitForElement: (selector, timeout = 5e3) => new Promise(((resolve, reject) => {
			const existing = document.querySelector(selector);
			if (existing) return resolve(existing);
			const observer = new MutationObserver((() => {
				const found = document.querySelector(selector);
				if (found) {
					observer.disconnect();
					clearTimeout(timer);
					resolve(found);
				}
			}));
			observer.observe(document.documentElement, {
				childList: true,
				subtree: true
			});
			const timer = setTimeout((() => {
				observer.disconnect();
				reject(new Error(`Timeout waiting for: ${selector}`));
			}), timeout);
		})),
		setupCopy(element, text, successMsg = "✓ Copied!") {
			let timer;
			element.addEventListener("click", (async () => {
				try {
					await navigator.clipboard.writeText(text);
				} catch (err) {
					return console.error("Copy failed", err);
				}
				element.dataset.origText ||= element.textContent;
				element.textContent = successMsg;
				element.classList.add("is-copied");
				clearTimeout(timer);
				timer = setTimeout((() => {
					element.textContent = element.dataset.origText;
					element.classList.remove("is-copied");
				}), 1500);
			}));
		},
		escapeHtml: str => String(str ?? "").replace(/[&<>"']/g, (ch => ({
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#039;"
		}[ch]))),
		escapeRegExp: str => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	};
	const { $, $$ } = Utils;
	// ============================================================================
	// SECTION 7&8: CASES CONNECT WORKFLOW & FOLLOW-UP AUTOMATION (CasesConnect)
	// ============================================================================
	const BASE_COMMENTS = ["Setup Conversion Linker", "Guided the advertiser how to see the report", "Survey pitched"];
	const GA4_COMMENTS = [...BASE_COMMENTS, "Linked GA4 and Google Ads", "Turned on Google signals data collection", "Turned on User Data Collection Acknowledgement", "Tested with Tag Assistant and Real time in GA4"];
	const CasesConnect = {
		NOTE_TEMPLATES: {
			EC: {
				subStatus: "NI - Awaiting Validation",
				subStatusReason: "Implemented Ads Enhanced Conversion",
				taskTypes: "Ads Enhanced Conversions for web",
				tagsImplemented: "Ads Enhanced Conversions",
				comments: ["Implemented Google Ads enhanced conversions for Purchase via GTM / Gtag", "Tested with Tag Assistant", "Turn on Enhanced Conversion in conversion action", "No recent conversions", "Awaiting enhanced conversion to record data", ...BASE_COMMENTS]
			},
			CONVERSION_TRACKING: {
				subStatus: "SO - { Implementation / Education / Troubleshooting } Only",
				subStatusReason: "Implement Ads Conversion Tracking",
				tagsImplemented: "Ads Conversion Tracking",
				comments: ["Implemented Google Ads conversions for { Hotline / Zalo / Purchase / Form } via GTM / Gtag", "Tested with Tag Assistant", "No recent conversions", ...BASE_COMMENTS]
			},
			GA4_LINK: {
				subStatus: "SO - Implementation Only",
				subStatusReason: "Implement GA4",
				taskTypes: "GA4 Setup",
				comments: ["Implemented GA4 tag via GTM", ...GA4_COMMENTS]
			},
			WAITING_INPUT: {
				subStatus: "NI - Waiting Input",
				subStatusReason: "waiting for Adv to setup GTM",
				comments: []
			},
			GA4: {
				subStatus: "NI - Waiting Validation",
				subStatusReason: "Implement GA4 Event",
				tagsImplemented: "Analytics Event Tracking",
				comments: ["Implemented GA4 event { Hotline / Zalo / Purchase / Form } via GTM / Gtag code", "Recording data", "Awaiting events to be processed in GA4 Event Report", "Guide advertiser import GA4 event to Google Ads", ...GA4_COMMENTS]
			},
			REMARKETING: {
				subStatus: "NI - Waiting Validation",
				subStatusReason: "Implement Ads Audiences",
				tagsImplemented: "Ads Remarketing",
				comments: ["Implemented GA4 Audiences for Pageview < {10} s via GTM", ...GA4_COMMENTS]
			}
		},
		isDateToday(val) {
			if (!val) return false;
			const now = new Date;
			const timestamp = Number(val);
			if (!isNaN(timestamp) && timestamp > 1e11) return new Date(timestamp).toDateString() === now.toDateString();
			const pad = n => String(n).padStart(2, "0");
			const d = now.getDate();
			const m = now.getMonth() + 1;
			const y = now.getFullYear();
			const str = String(val).trim().toLowerCase();
			if (str.includes("today")) return true; else return [`${pad(d)}/${pad(m)}/${y}`, `${d}/${m}/${y}`, `${y}-${pad(m)}-${pad(d)}`, `${pad(m)}/${pad(d)}/${y}`].some((p => new RegExp(`(^|\\D)${p}(\\D|$)`).test(str)));
		},
		promptCaseType: daysOffset => new Promise((resolve => {
			$("#qm-modal-overlay")?.remove();
			const overlay = Utils.createEl("div", {
				id: "qm-modal-overlay",
				parent: document.body,
				style: "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.15); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 2147483647;"
			});
			const modal = Utils.createEl("div", {
				parent: overlay,
				style: "background-color: #FFFFFF; border-radius: 16px; padding: 22px; width: 320px; box-shadow: 0 16px 36px rgba(0,0,0,0.12); text-align: center; font-family: 'Eczar', serif; border: 1px solid rgba(0,0,0,0.05);"
			});
			const close = value => {
				overlay.remove();
				resolve(value);
			};
			onTeardown((() => close(null)));
			const renderStep = (title, subtitle, buttons) => {
				modal.textContent = "";
				Utils.createEl("div", {
					text: title,
					parent: modal,
					style: "font-size: 18px; font-weight: 700; color: #1D1D1F; margin-bottom: 4px;"
				});
				Utils.createEl("div", {
					text: subtitle,
					parent: modal,
					style: "font-size: 14px; color: #86868B; margin-bottom: 18px;"
				});
				const actions = Utils.createEl("div", {
					parent: modal,
					style: "display: flex; flex-direction: column; gap: 8px;"
				});
				buttons.forEach((([label, bg, color, onClick]) => {
					Utils.createEl("button", {
						text: label,
						parent: actions,
						style: `padding: 10px 14px; border-radius: 10px; border: none; font-size: 16px; font-weight: 600; cursor: pointer; background-color: ${bg}; color: ${color}; transition: all 0.15s ease;`,
						onmouseenter: e => e.currentTarget.style.filter = "brightness(0.96)",
						onmouseleave: e => e.currentTarget.style.filter = "none",
						onClick
					});
				}));
			};
			const SKIP = ["Skip / Keep Default", "#F1F3F5", "#495057", () => close(null)];
			if (0 === daysOffset) return renderStep("Select Same-Day Task", "Appointment is today. Choose case type:", [["Ads CT", "#A5D8FF", "#183B56", () => close("CONVERSION_TRACKING")], ["GA4 Link", "#B2F2BB", "#1E5E2A", () => close("GA4_LINK")], SKIP]);
			const showValidationStep = () => renderStep("Validation Scope", "Select the task validated on call:", [["GA4 Event", "#B2F2BB", "#1E5E2A", () => close("GA4")], ["Ads Remarketing", "#D0BFFF", "#3A2A59", () => close("REMARKETING")], ["← Back", "#F1F3F5", "#495057", () => showInitialStep()]]);
			const showInitialStep = () => renderStep("Select Follow-Up Note", `Follow-up set to ${daysOffset} days. Choose status:`, [["Waiting Input", "#A5D8FF", "#183B56", () => close("WAITING_INPUT")], ["Waiting Validation", "#B2F2BB", "#1E5E2A", () => showValidationStep()], SKIP]);
			showInitialStep();
		})),
		buildNoteTemplateHTML(templateKey, followUpVal, speakeasyId = "NA", verifiedTags = "") {
			const cfg = CasesConnect.NOTE_TEMPLATES[templateKey];
			const esc = Utils.escapeHtml;
			const now = new Date;
			const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
			const td = "border: 1pt solid #000; vertical-align: top; padding: 5pt; overflow: hidden; word-break: break-word; box-sizing: border-box;";
			const font = "font-size: 11pt; font-family: 'Google Sans', sans-serif; color: #000; white-space: pre-wrap;";
			const cid = esc($(".above-section div:nth-child(5) .capitalized")?.innerText?.trim()?.replace(/\D/g, "")?.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") || "NA");
			const apptTasks = $$(`.form-label`).find(el => el.textContent.trim() === "Appointment tasks")?.parentElement.querySelectorAll("sanitized-content");
			const domTasks = apptTasks?.length ? [...apptTasks].map(el => el.textContent.trim().replace(/s$/i, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).replace(/\bGa4\b/g, "GA4")).join(", ") : "";
			const g = s => `<span style="color:#188038;">${s}</span>`;
			const head = title => `<tr style="height:21pt"><td colspan="2" style="${td} background:#fff2cc; text-align:center;"><span style="${font} font-weight:700;">${title}</span> <span style="${font} font-style:italic;">(Mandatory)</span></td></tr>`;
			const row = (lbl, desc, val, bg = "transparent") => `<tr style="height:21pt"><td style="${td} width:30%;"><span style="${font} background:${bg}; font-weight:700;">${lbl}</span>${desc ? `<div style="font-size:9.5pt; font-family:'Google Sans',sans-serif; color:#5f6368; margin-top:2px; line-height:1.25;">${desc}</div>` : ""}</td><td style="${td} width:70%;"><span style="${font} background:${bg};">${val}</span></td></tr>`;
			const comments = cfg?.comments?.length ? `<ul dir="auto" style="margin:0; padding-left:18px;">${cfg.comments.map((c => `<li>${esc(c)}</li>`)).join("")}</ul>` : "NA";
			const consent = cfg?.subStatus && !/Attempted Contact|Not Reachable|Unreachable/i.test(cfg.subStatus) ? "Yes" : "NA";
			return `<div id="noteCaseUI" class="cdtx__uioncall"><div class="cdtx__uioncall_control"><span class="cdtx__uioncall_control-load" data-text="Split &amp; Transfer" data-btnclk="oncall_templ_lt_template">&nbsp;</span><span class="cdtx__uioncall_control-load" data-text="List" data-btnclk="oncall_templ_act_load">&nbsp;</span><span class="cdtx__uioncall_control-save" data-text="Save" data-btnclk="oncall_templ_act_save" data-btntooltip="Save template Reuse">&nbsp;</span><span class="cdtx__uioncall_control-remove" data-text="Remove" data-btnclk="oncall_templ_act_remove">&nbsp;</span></div><article class="cdtx__uioncall_outer"><table style="width:100% !important; table-layout:fixed !important; border-collapse:collapse !important; margin:8px 0 !important; box-sizing:border-box !important;"><tbody>${head("General Details")
				+ row("Date:", "[YYYY-MM-DD — Date when the SpeakEasy call, Attempted Contact dial, or follow-up action occurred]", today, "#c9daf8")
				+ row("Speakeasy ID:", `[Exact SpeakEasy session ID copied from the SpeakEasy dashboard (e.g., ${g("P100000000381267617")}). List all IDs separated by comma if multiple dials were made; write ${g("NA")} for offline/email-only updates]`, esc(speakeasyId || "NA"))
				+ row("Sub-status:", '[Exact Connect Cases Sub-Status selected in Q+ per <a href="http://goto.google.com/tsStatuses" target="_blank" style="color:#1155cc;">go/tsStatuses</a>]', `<span class="_sub_i" data-btnclk="choice_status_list" data-infocase="status_case">${esc(cfg?.subStatus || "NA")}</span>`)
				+ row("Next Follow-Up Date", `[YYYY-MM-DD — Date when the next follow-up is due; or ${g("NA")}]`, `<span data-btnclk="oncall_templ_act_flchoice" data-dateformat="d/m/Y" data-text="oncall_templ_act_flchoice-text">${esc(followUpVal || "NA")}</span>`)
				+ row("Task types:", `[Primary Task Type(s) worked on the call separated by comma (e.g., ${g("Ads Conversion Tracking, Ads Enhanced Conversions for web")}); write ${g("NA")} only if no tasks were involved in emails or call]`, esc(domTasks || cfg?.taskTypes || cfg?.tagsImplemented || "NA"))
				+ row("Implemented tags:", `[Exact name(s) of conversion actions created, verified, or troubleshot in Google Ads separated by comma (e.g., ${g("Phone_call, lead_form, Purchase_Shopify, Add_to_Cart")}); write ${g("NA")} if not applicable]`, `<span data-btnclk="oncall_templ_act_taskchoice" data-text="oncall_templ_act_taskchoice-text">${esc(verifiedTags || cfg?.tagsImplemented || "NA")}</span>`)
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
		currentFollowUp: () => $('[data-infocase="follow_up_time"]')?.dataset?.valchoice || "NA",
		insertNote(templateHTML, replaceExisting) {
			const caseNote = $$('[aria-label="Case Note"]').filter(el => el.offsetParent !== null).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] || $('[aria-label="Case Note"]');
			const existing = replaceExisting && caseNote && $("#noteCaseUI", caseNote);
			if (existing) existing.outerHTML = toSafeHTML(templateHTML); else if (caseNote) caseNote.insertAdjacentHTML("beforeend", toSafeHTML(templateHTML));
			caseNote?.dispatchEvent(new Event("input", {
				bubbles: true
			}));
			return Boolean(existing || caseNote);
		},
		async executeFollowUp(flupBtn) {
			if (!flupBtn.dataset.busy) {
				flupBtn.dataset.busy = "1";
				flupBtn.style.opacity = "0.6";
				flupBtn.style.pointerEvents = "none";
				try {
					if (!$("._connectcase_info--outer")) $('[data-btnclk="_connectcase_info-act_recrawl"]')?.click();
					$('[aria-label="Overview"]')?.click();
					await Utils.sleep(300);
					const daysOffset = parseInt($("#qm-flup-in")?.value, 10) || 0;
					const apptEl = $('[data-infocase="appointment_time"]');
					let isApptToday = false;
					if (apptEl) if (!apptEl.dataset.valchoice) {
						apptEl.click();
						await Utils.sleep(150);
						(await Utils.waitForElement(".datepicker-grid .today")).click();
						await Utils.sleep(200);
						isApptToday = true;
					} else isApptToday = CasesConnect.isDateToday(apptEl.dataset.valchoice) || CasesConnect.isDateToday(apptEl.innerText);
					let templateKey = null;
					if (5 === daysOffset) templateKey = "EC"; else if (0 === daysOffset && isApptToday) templateKey = await CasesConnect.promptCaseType(0); else if (2 === daysOffset || 3 === daysOffset) templateKey = await CasesConnect.promptCaseType(daysOffset);
					$('[data-infocase="follow_up_time"]')?.click();
					await Utils.sleep(150);
					if (daysOffset > 0) {
						const start = new Date;
						const targetDate = new Date(start);
						for (let count = 0; count < daysOffset;) {
							targetDate.setDate(targetDate.getDate() + 1);
							if (targetDate.getDay() % 6 !== 0) count++;
						}
						const diffDays = Math.round((targetDate - start) / 864e5);
						let dayEl = await Utils.waitForElement(".datepicker-grid .today");
						for (let i = 0; i < diffDays && dayEl; i++) dayEl = dayEl.nextElementSibling;
						if (dayEl) {
							dayEl.click();
							await Utils.sleep(200);
						} else console.warn("Follow-up: target day not found in datepicker grid.");
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
					if (lastCall) {
						lastCall.click();
						await Utils.sleep(300);
					}
					for (const h of $$('.message-header.note[aria-expanded="false"]')) {
						if (/successfully verified for the below listed conversion actions/i.test(h.innerText)) h.click();
					}
					await Utils.sleep(300);
					const verifiedTags = [...new Set($$(".message-body.note").flatMap(el => /successfully verified for the below listed conversion actions/i.test(el.innerText) ? [...el.innerText.matchAll(/^[ \t]*(?:-\s*)?([^\n,|]+?)\s*(?:,|\|)\s*[A-Za-z0-9_-]{10,}\s*(?:,|\|)/gm)].map(m => m[1].trim()) : []))].join(", ");
					const speakeasyId = document.body.innerText.match(/Speakeasy session ID:\s*(P\d+)/i)?.[1] || "NA";
					CasesConnect.insertNote(CasesConnect.buildNoteTemplateHTML(templateKey, CasesConnect.currentFollowUp(), speakeasyId, verifiedTags), true);
				} catch (err) {
					console.error("Follow up script failed", err);
				} finally {
					delete flupBtn.dataset.busy;
					flupBtn.style.opacity = "1";
					flupBtn.style.pointerEvents = "auto";
				}
			}
		},
		insertSignature() {
			const sel = window.getSelection();
			if (!sel?.rangeCount) return alert("Please click inside the email body to place your cursor first.");
			const start = sel.getRangeAt(0).startContainer;
			const node = start.nodeType === Node.ELEMENT_NODE ? start : start.parentElement;
			if (!node?.isContentEditable) return alert("Please place your cursor inside the text area where you want the signature.");
			$$(".qm-sig").forEach((el => el.remove()));
			let sigName = localStorage.getItem("__signature_name");
			if (!sigName) {
				sigName = prompt("Enter your name:") || "Agent";
				localStorage.setItem("__signature_name", sigName);
			}
			const html = `<table class="qm-sig" style="width: 348px; padding: 0 30px;" data-sig-injected="true"><tbody><tr align="left"> <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 10px;"></td> <td style="width: 12px;"></td> <td style="vertical-align: middle;"><p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; line-height: 1.4; color: #1D1D1F;"> <strong style="font-size: 105%; color: #1D1D1F;">${Utils.escapeHtml(sigName)}</strong><br> <span style="color: #86868B;">Technical Solutions Team</span><br> <span style="color: #86868B; font-weight: 500;">TDCX, on behalf of Google</span> </p></td> </tr></tbody></table>`;
			document.execCommand("insertHTML", false, toSafeHTML(html));
		},
		init() {
			const C = CasesConnect;
			$("#qm-panel")?.remove();
			Utils.addStyle("qm-styles", "@import url('https://fonts.googleapis.com/css2?family=Eczar:wght@400;600;700&display=swap'); #qm-panel, #qm-panel *, #qm-modal-overlay, #qm-modal-overlay * { font-family: \"Eczar\", serif !important; } #qm-panel { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 99999; font-size: 14px; } .qm-btn { z-index: 10; color: #1D1D1F; padding: 10px 16px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.6); } .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); filter: brightness(0.97); } .qm-btn:active { transform: scale(0.96); } #qm-flup-in { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.95); color: #1D1D1F; font-weight: 700; font-size: 14px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); transition: all 0.2s ease; -moz-appearance: textfield; } #qm-flup-in:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #74B9FF; } .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF8787; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; color: #FFFFFF; } .qm-sig { margin: 12px 0; } .dock-container { max-height: 400px !important; overflow-y: auto !important; }");
			const panel = Utils.createEl("div", {
				id: "qm-panel",
				parent: document.body
			});
			let clickerInterval = null;
			let removeTimer = null;
			const autoClickTask = () => {
				if (C.insertNote(C.buildNoteTemplateHTML(null, C.currentFollowUp()), false)) {
					clearTimeout(removeTimer);
					removeTimer = setTimeout((() => $(".cdtx__uioncall_control-remove")?.click()), 6e3);
				}
			};
			const setAuto = (btn, on) => {
				clearInterval(clickerInterval);
				clickerInterval = on ? setInterval(autoClickTask, 16e3) : null;
				btn.textContent = on ? "OFF" : "ON";
				btn.style.backgroundColor = on ? "#FFA8A8" : "#B2F2BB";
				btn.style.color = on ? "#6A1A1A" : "#1E5E2A";
			};
			const autoBtn = Utils.createEl("button", {
				title: "Auto Click",
				className: "qm-btn",
				parent: panel,
				onClick: () => setAuto(autoBtn, !clickerInterval)
			});
			setAuto(autoBtn, true);
			Utils.createEl("button", {
				html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px; filter: brightness(0.2);"><span id="flup-badge" class="qm-badge">+</span>',
				title: "Click Follow-up Item",
				className: "qm-btn",
				style: "background-color: #A5D8FF;",
				parent: panel,
				onClick: async () => {
					$('[debug-id="dock-item-home"]')?.click();
					try {
						(await Utils.waitForElement(".li-popup_lstcasefl")).click();
					} catch {
						console.warn("Follow-up popup not found");
					}
				}
			});
			let badgeObserver = null;
			Utils.waitForElement(".li-popup_lstcasefl").then((el => {
				if (!panel.isConnected) return;
				const badge = $("#flup-badge", panel);
				const updateBadge = () => badge.style.display = el.dataset.attr && "0" !== el.dataset.attr ? "block" : "none";
				badgeObserver = new MutationObserver(updateBadge);
				badgeObserver.observe(el, {
					attributes: true,
					attributeFilter: ["data-attr"]
				});
				updateBadge();
			})).catch((() => { }));
			const flupBtn = Utils.createEl("button", {
				text: "FL Up:",
				title: "Set Follow-up",
				className: "qm-btn",
				style: "background-color: #99E9F2; color: #0C5460; padding-right: 44px;",
				parent: panel,
				onClick: e => {
					if ("qm-flup-in" !== e.target.id) C.executeFollowUp(flupBtn);
				}
			});
			Utils.createEl("input", {
				id: "qm-flup-in",
				type: "text",
				value: "2",
				parent: flupBtn,
				onClick: e => e.stopPropagation(),
				onfocus: e => e.target.select(),
				oninput: e => e.target.value = e.target.value.replace(/\D/g, "").slice(0, 1),
				onkeydown: e => {
					if ("Enter" === e.key) {
						e.preventDefault();
						C.executeFollowUp(flupBtn);
					}
				}
			});
			Utils.createEl("button", {
				text: "Sign",
				title: "Insert Signature at Cursor",
				className: "qm-btn",
				style: "background-color: #CED4DA; color: #343A40;",
				parent: panel,
				onmousedown: e => e.preventDefault(),
				onClick: () => C.insertSignature()
			});
			onTeardown((() => {
				clearInterval(clickerInterval);
				clearTimeout(removeTimer);
				badgeObserver?.disconnect();
				panel.remove();
			}));
		}
	};
	// ============================================================================
	// SECTION 10: CONTEXT-AWARE ROUTER & BOOTSTRAP DISPATCHER
	// ============================================================================
	const pickFeature = () => "chrome-extension:" === location.protocol ? QPlusAutomator : location.host.includes("casemon2.corp") ? Dash : location.host.includes("cases.connect") ? CasesConnect : location.host.includes("adwords.corp") ? AdWords : TagInspector;
	const start = () => Promise.resolve().then((() => pickFeature().init())).catch((err => console.error("Omnitool error:", err)));
	"loading" === document.readyState ? document.addEventListener("DOMContentLoaded", start, {
		once: true
	}) : start();
})();