!(function () {
	let e = {
		sleep: (e) => new Promise((t) => setTimeout(t, e)),
		debounce(e, t) {
			let a;
			return (...n) => {
				(clearTimeout(a), (a = setTimeout(() => e(...n), t)));
			};
		},
		async pollForCondition(t, a = 500, n = 10) {
			for (let i = 0; i < n; i++) {
				if (t()) return !0;
				await e.sleep(a);
			}
			return !1;
		},
		$: (e, t = document) => t.querySelector(e),
		$$: (e, t = document) => Array.from(t.querySelectorAll(e)),
		createEl(
			e,
			{
				parent: t,
				onClick: a,
				style: n,
				className: i,
				id: o,
				html: r,
				text: s,
				...l
			} = {},
		) {
			let c = document.createElement(e);
			for (let [d, p] of (o && (c.id = o),
			i && (c.className = i),
			s && (c.innerText = s),
			r && (c.innerHTML = r),
			n && Object.assign(c.style, n),
			a && c.addEventListener("click", a),
			Object.entries(l)))
				d.startsWith("on") && "function" == typeof p
					? (c[d] = p)
					: d.startsWith("data-")
						? c.setAttribute(d, p)
						: (c[d] = p);
			return (t && t.appendChild(c), c);
		},
		addStyle(e, t) {
			if (document.getElementById(e)) return;
			let a = document.createElement("style");
			a.id = e;
			let n = window.trustedTypes?.createPolicy("default", {
				createHTML: (e) => e,
			}) ?? { createHTML: (e) => e };
			((a.textContent = n.createHTML(t)), document.head.appendChild(a));
		},
		waitForElement: (t, a = 5e3) =>
			new Promise((n, i) => {
				let o = e.$(t);
				if (o) return n(o);
				let r = new MutationObserver((a, i) => {
					let o = e.$(t);
					o && (i.disconnect(), n(o));
				});
				(r.observe(document.body, { childList: !0, subtree: !0 }),
					setTimeout(() => {
						(r.disconnect(), i(Error(`Timeout waiting for: ${t}`)));
					}, a));
			}),
		setupCopy(e, t, a = "Copied!") {
			let n;
			e.addEventListener("click", async () => {
				try {
					(await navigator.clipboard.writeText(t),
						(e.dataset.origText =
							e.dataset.origText || e.innerText),
						(e.innerText = a),
						e.classList.add("aw-copied"),
						clearTimeout(n),
						(n = setTimeout(() => {
							((e.innerText = e.dataset.origText),
								e.classList.remove("aw-copied"));
						}, 1500)));
				} catch (i) {
					console.error("Copy failed", i);
				}
			});
		},
		escapeHtml: (e) =>
			String(e || "").replace(
				/[&<>"']/g,
				(e) =>
					({
						"&": "&amp;",
						"<": "&lt;",
						">": "&gt;",
						'"': "&quot;",
						"'": "&#039;",
					})[e],
			),
	};
	class t {
		static SELECTORS = {
			questionContainer: ".question-container",
			questionText: ".question-text",
			label: "label.mdc-label",
			textarea: 'textarea[formcontrolname="selectedText"]',
			autoSuggestion: "span.auto-suggestion-text",
			radioParent: "mat-radio-button",
			checkboxParent: "mat-checkbox",
			input: "input",
			takeCase: '[aria-label="Take the task"]',
		};
		static async promptUser() {
			return new Promise((t) => {
				let a = [
						{ id: "SO", label: "Solution Offered" },
						{ id: "NI", label: "Need Attention" },
						{ id: "IN", label: "Inactive" },
					],
					n = [
						{ id: "CT", label: "Conversion Tracking" },
						{ id: "EC", label: "Enhanced Conversion Tracking" },
						{ id: "GA4", label: "GA4 setup" },
						{ id: "GA4_UPD", label: "GA4 UPD" },
						{ id: "AUD", label: "Ads Audiences" },
					],
					i = {
						SO: n,
						NI: [
							{ id: "WAIT_INPUT", label: "Waiting Input" },
							{
								id: "WAIT_VALIDATION",
								label: "Waiting Validation",
							},
							{ id: "IN_CONSULT", label: "In Consult" },
						],
						IN: [{ id: "UNREACHABLE", label: "Unreachable" }],
					},
					o = null,
					r = null,
					s = e.createEl("div", {
						style: {
							position: "fixed",
							top: "0",
							left: "0",
							width: "100%",
							height: "100%",
							background: "rgba(15, 23, 42, 0.4)",
							backdropFilter: "blur(2px)",
							WebkitBackdropFilter: "blur(2px)",
							zIndex: "99999",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontFamily: "Inter, system-ui, sans-serif",
							opacity: "0",
							transition: "opacity 0.2s ease-out",
						},
						parent: document.body,
					}),
					l = e.createEl("div", {
						style: {
							background: "#ffffff",
							padding: "16px",
							borderRadius: "12px",
							width: "90%",
							maxWidth: "260px",
							boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
							transform: "translateY(8px) scale(0.97)",
							transition:
								"all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							boxSizing: "border-box",
						},
						parent: s,
					});
				e.createEl("div", {
					style: { marginBottom: "4px" },
					html: `
                        <h3 style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">Task Profile</h3>
                        <div id="step-title" style="color: #6b7280; font-size: 12px; margin-top: 2px;"></div>
                    `,
					parent: l,
				});
				let c = e.createEl("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: "6px",
							maxHeight: "55vh",
							overflowY: "auto",
							paddingRight: "2px",
						},
						parent: l,
					}),
					d = e.createEl("div", {
						style: {
							display: "flex",
							gap: "6px",
							marginTop: "4px",
						},
						parent: l,
					});
				requestAnimationFrame(() => {
					((s.style.opacity = "1"),
						(l.style.transform = "translateY(0) scale(1)"));
				});
				let p = (e) => {
						((s.style.opacity = "0"),
							(l.style.transform = "translateY(8px) scale(0.97)"),
							setTimeout(() => {
								(s.remove(), t(e));
							}, 200));
					},
					$ = (t, a, n, i, o, r) => {
						let s = e.createEl("button", {
							text: t,
							parent: a,
							onClick: r,
							style: {
								flex: "1",
								padding: "8px 12px",
								cursor: "pointer",
								background: n,
								border: `1px solid ${"transparent" === n ? "transparent" : "#e5e7eb"}`,
								borderRadius: "8px",
								color: o,
								fontSize: "13px",
								fontWeight: "500",
								textAlign:
									"transparent" === n ? "center" : "left",
								transition: "all 0.15s ease",
							},
						});
						return (
							(s.onmouseover = () => (s.style.background = i)),
							(s.onmouseout = () => (s.style.background = n)),
							s
						);
					},
					u = () => {
						((e.$("#step-title", l).innerText =
							"Step 1: Select Status"),
							(c.innerHTML = ""),
							(d.innerHTML = ""),
							a.forEach((e) => {
								$(
									e.label,
									c,
									"#f9fafb",
									"#eff6ff",
									"#374151",
									() => {
										((o = e), g());
									},
								);
							}),
							$(
								"Cancel",
								d,
								"transparent",
								"#f3f4f6",
								"#6b7280",
								() => p(null),
							));
					},
					g = () => {
						((e.$("#step-title", l).innerText =
							"Step 2: Select Task"),
							(c.innerHTML = ""),
							(d.innerHTML = ""));
						let t = i[o.id] || [];
						(t.forEach((e) => {
							$(
								e.label,
								c,
								"#f9fafb",
								"#eff6ff",
								"#374151",
								() => {
									((r = e),
										"NI" === o.id &&
										"WAIT_VALIDATION" === e.id
											? b()
											: p({ status: o, task: r }));
								},
							);
						}),
							$("Back", d, "#f3f4f6", "#e5e7eb", "#4b5563", u),
							$(
								"Cancel",
								d,
								"transparent",
								"#f3f4f6",
								"#6b7280",
								() => p(null),
							));
					},
					b = () => {
						((e.$("#step-title", l).innerText =
							"Step 3: Select Validation Task"),
							(c.innerHTML = ""),
							(d.innerHTML = ""),
							n.forEach((e) => {
								$(
									e.label,
									c,
									"#f9fafb",
									"#eff6ff",
									"#374151",
									() => {
										p({ status: o, task: r, subTask: e });
									},
								);
							}),
							$("Back", d, "#f3f4f6", "#e5e7eb", "#4b5563", g),
							$(
								"Cancel",
								d,
								"transparent",
								"#f3f4f6",
								"#6b7280",
								() => p(null),
							));
					};
				u();
			});
		}
		static buildConfig(e) {
			let t = "",
				a = "",
				n = !1,
				i = [],
				o = "Not Applicable (N/A)",
				r = "Not Applicable (N/A)",
				s = ["Not Applicable (N/A)"],
				l = (e) => {
					switch (e) {
						case "CT":
							i = ["Ads Conversion Tracking"];
							break;
						case "EC":
							((i = ["Enhanced Conversions for Web (ECW)"]),
								(o = "No"),
								(r = "Manual"));
							break;
						case "GA4":
							((i = ["GA4 Setup (no Analytics in place yet)"]),
								(s = ["Tagging"]));
							break;
						case "GA4_UPD":
							((i = [
								"Enhanced Conversions - GA4 User Provided Data",
							]),
								(s = ["Other Conversions"]),
								(o = "No"),
								(r = "Manual"));
							break;
						case "AUD":
							((i = [
								"Ads Standard Remarketing",
								"GA4 Standard Remarketing",
							]),
								(s = ["Standard Audiences"]));
					}
				};
			"SO" === e.status.id
				? ((t = "Implemented"),
					(a = "SO - Implementation only"),
					(n = !0),
					l(e.task.id))
				: "NI" === e.status.id
					? ((t = "In Progress"),
						"WAIT_INPUT" === e.task.id
							? (a = "NI - Awaiting Inputs")
							: "WAIT_VALIDATION" === e.task.id
								? ((a = "NI - Awaiting Validation"),
									(n = !0),
									l(e.subTask.id))
								: "IN_CONSULT" === e.task.id &&
									(a = "NI - In Consult"))
					: "IN" === e.status.id &&
						((t = "Inactive"), (a = "Inactive - Unreachable"));
			let c = {
				ldap: "",
				date: "",
				status: t,
				subStatus: a,
				radioQs: [],
				checkboxQs: [],
			};
			return (
				n &&
					((c.radioQs = [
						{ title: "If task type was EC", choice: o },
						{ title: "what option was used", choice: r },
						{ title: "Was it a GTM implementation", choice: "Yes" },
						{
							title: "If COMO task was implemented",
							choice: "Not Applicable (N/A)",
						},
						{ title: "If Customer Match", choice: "None" },
						{ title: "CMS / Platform", choice: "Didn't check" },
					]),
					(c.checkboxQs = [
						{ title: "Task Type", choices: i },
						{
							title: "For GA4 Cases, what exact features",
							choices: s,
						},
					])),
				c
			);
		}
		static dispatchAngularEvents(e) {
			(["input", "change"].forEach((t) =>
				e.dispatchEvent(new Event(t, { bubbles: !0 })),
			),
				e.blur());
		}
		static selectOptions(a, n = {}) {
			let i = document;
			if (
				n.title &&
				!(i = e.$$(t.SELECTORS.questionContainer).find((e) => {
					let a = e.querySelector(t.SELECTORS.questionText);
					return a?.textContent
						.toLowerCase()
						.includes(n.title.toLowerCase());
				}))
			)
				return console.warn(
					`Question container matching "${n.title}" not found.`,
				);
			let o = Array.isArray(a) ? a : [a],
				r = n.isCheckbox ? "checkbox" : "radio";
			e.$$(t.SELECTORS.label, i).forEach((e) => {
				if (o.includes(e.textContent.trim())) {
					let a = document.getElementById(e.getAttribute("for"));
					if (!a) {
						let n = e.closest(
							"checkbox" === r
								? t.SELECTORS.checkboxParent
								: t.SELECTORS.radioParent,
						);
						a = n?.querySelector(t.SELECTORS.input);
					}
					a && ("checkbox" !== r || !a.checked) && a.click();
				}
			});
		}
		static async run() {
			let a = await t.promptUser();
			if (!a)
				return console.log(
					"\uD83D\uDED1 Form automation cancelled by user.",
				);
			let n = t.buildConfig(a);
			try {
				(console.log("Starting automation sequence..."),
					e.$(t.SELECTORS.takeCase)?.click(),
					await e.sleep(300),
					e.$(".footer " + t.SELECTORS.takeCase)?.click(),
					await e.waitForElement(t.SELECTORS.questionContainer),
					t.selectOptions(n.status),
					await e.sleep(200),
					t.selectOptions(n.subStatus),
					await e.sleep(200));
				let i = e.$$(t.SELECTORS.textarea);
				(i[0] &&
					(i[0].focus(),
					i[0].click(),
					(i[0].value = n.ldap),
					t.dispatchAngularEvents(i[0])),
					i[1] &&
						(i[1].focus(),
						i[1].click(),
						(i[1].value = n.date),
						t.dispatchAngularEvents(i[1])),
					n.radioQs.forEach((e) =>
						t.selectOptions(e.choice, { title: e.title }),
					),
					n.checkboxQs.forEach((e) =>
						t.selectOptions(e.choices, {
							title: e.title,
							isCheckbox: !0,
						}),
					),
					await e.sleep(200),
					e.$(t.SELECTORS.autoSuggestion)?.click(),
					console.log("✅ Form successfully populated."));
			} catch (o) {
				console.error("❌ Error during form automation:", o);
			}
		}
	}
	class a {
		static init() {
			if (window.dashRun) return;
			((window.dashRun = !0), e.$('[aria-selected="false"]')?.click());
			let t = "https://cdn-icons-png.flaticon.com/512",
				a = {
					uiId: "bento_agent_ui",
					target: ".agent-table-container",
					statusConfig: {
						active: {
							color: "#10B981",
							track: "#D1FAE5",
							maxSecs: 3600,
						},
						phone: {
							color: "#EF4444",
							track: "#FFE4E6",
							maxSecs: 2700,
						},
						video: {
							color: "#8B5CF6",
							track: "#F3E8FF",
							maxSecs: 2700,
						},
						email: {
							color: "#0EA5E9",
							track: "#E0F2FE",
							maxSecs: 900,
						},
						"coffee-break": {
							color: "#F59E0B",
							track: "#FFEDD5",
							maxSecs: 900,
						},
						"lunch-break": {
							color: "#EAB308",
							track: "#FEF9C3",
							maxSecs: 3600,
						},
						break: {
							color: "#6B7280",
							track: "#F3F4F6",
							maxSecs: 900,
						},
						default: {
							color: "#9CA3AF",
							track: "#F3F4F6",
							maxSecs: 2700,
						},
					},
					icons: {
						video: {
							src: `${t}/9571/9571236.png`,
							animation: "breathe",
						},
						"coffee-break": {
							src: `${t}/16108/16108931.png`,
							animation: "rock",
						},
						"lunch-break": {
							src: `${t}/1182/1182132.png`,
							animation: "bounce-y",
						},
						phone: {
							src: `${t}/13332/13332839.png`,
							animation: "ring",
						},
						email: {
							src: `${t}/7487/7487055.png`,
							animation: "fly",
						},
						break: {
							src: `${t}/5140/5140652.png`,
							animation: "fade-pulse",
						},
						close: `${t}/9403/9403346.png`,
						non_phone: `${t}/17720/17720299.png`,
						non_video: `${t}/11305/11305490.png`,
					},
					priorities: {
						active: 1,
						video: 2,
						phone: 2.5,
						"lunch-break": 3,
						email: 4,
						"coffee-break": 5,
						break: 6,
						default: 99,
					},
				},
				n = e.$(a.target);
			if (!n) return (window.dashRun = !1);
			let i =
				e
					.$("[alt='profile photo']")
					?.src?.match(/photos\/([^/?]+)/)?.[1] ?? "Unknown";
			e.addStyle(
				"bento-dash-styles",
				`
            #bento_agent_ui { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(15, 17, 21, 0.12); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; box-sizing: border-box; }
            .bento-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 320px; background: #FFFFFF; border-radius: 20px; box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04); padding: 20px; border: 1px solid #E5E7EB; color: #1F2937; transition: border-color 0.3s ease; }
            .close-btn { position: absolute; top: -10px; right: -10px; background: #FFFFFF; border: 1px solid #E5E7EB; cursor: pointer; z-index: 20; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: all 0.2s ease; }
            .close-btn:hover { background: #F3F4F6; transform: scale(1.1); }
            .close-btn img { width: 11px; height: 11px; opacity: 0.7; }
            .bento-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
            .bento-card { background: transparent; display: flex; flex-direction: column; }
            .agent-list-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
            .agent-list-header h3 { margin: 0; font-size: 12px; color: #4B5563; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; justify-content: space-between; }
            .header-counters { display: flex; gap: 6px; justify-content: flex-start; width: 100%; }
            .agent-count { font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 700; white-space: nowrap; }
            .active-badge { background: #E6F4EA; color: #137333; border: 1px solid #CEEAD6; }
            .phone-badge { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
            .break-badge { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
            .total-badge { background: #F1F3F4; color: #5F6368; border: 1px solid #E8EAED; }
            .health-warning { animation: pulseHealth 2.5s infinite; border-color: #EF4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.15); }
            @keyframes pulseHealth { 0%, 100% { border-color: #E5E7EB; } 50% { border-color: #EF4444; } }
            .health-text { font-size: 10px; color: #DC2626; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            .agent-list-container { max-height: 72vh; overflow-y: auto; padding: 2px; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid #F1F5F9; padding-top: 12px; }
            .status-group-block { display: flex; width: 100%; gap: 10px; align-items: flex-start; }
            .status-inline-label { width: 50px; min-width: 35px; text-align: left; font-size: 9px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 4px; border-left: 2px solid #E2E8F0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
            .status-inline-label.user-label { color: #2563EB; border-left-color: #2563EB; background: #EFF6FF; border-radius: 0 4px 4px 0; }
            .status-rows-stack { flex-grow: 1; display: flex; flex-direction: column; gap: 6px; }
            .agent-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 10px; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02); position: relative; background-clip: padding-box; border: 2px solid transparent; z-index: 1; }
            .agent-row:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
            .agent-row::before { content: ''; position: absolute; inset: 0; border-radius: 10px; padding: 2px; margin: -2px; background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: -1; }
            @keyframes pulseWarning { 0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); } 50% { filter: drop-shadow(0 0 8px var(--st-color)); } }
            .agent-row.over-time::before { animation: pulseWarning 1.5s infinite ease-in-out; }
            
            /* Background Icons with subtle animation */
            @keyframes bgIconFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; } 50% { transform: translateY(-2px) scale(1.1); opacity: 0.3; } }
            .row-bg-icons { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; gap: 8px; pointer-events: none; z-index: 0; }
            .row-bg-icons img { width: 22px; height: 22px; object-fit: contain; opacity: 0.15; animation: bgIconFloat 3s infinite ease-in-out; }
            .row-bg-icons img:nth-child(2) { animation-delay: 1.5s; } /* Stagger animation if both present */
            
            .agent-left { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; }
            .agent-avatar { width: 26px; height: 26px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(0,0,0,0.04); }
            
            .agent-right { position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; text-align: right; }
            .agent-meta { display: flex; flex-direction: column; }
            .time-state { font-size: 10px; font-weight: 500; opacity: 0.85; }
            .status-text { font-size: 10px; font-weight: 700; letter-spacing: 0.2px; display: inline-block; margin-top: 1px; }
            .agent-right > img { width: 18px; height: 18px; opacity: 0.8; }
            
            .stt-active { background: linear-gradient(135deg, #D1FAE5 0%, #FCE7F3 100%); color: #064E3B; } .stt-active .status-text { color: #047857; }
            .stt-phone { background: linear-gradient(135deg, #FEE2E2 0%, #CCFBF1 100%); color: #7F1D1D; } .stt-phone .status-text { color: #B91C1C; }
            .stt-video { background: linear-gradient(135deg, #F3E8FF 0%, #FEF9C3 100%); color: #4C1D95; } .stt-video .status-text { color: #6B21A8; }
            .stt-email { background: linear-gradient(135deg, #E0F2FE 0%, #FFEDD5 100%); color: #0C4A6E; } .stt-email .status-text { color: #0284C7; }
            .stt-coffee-break { background: linear-gradient(135deg, #FFEDD5 0%, #EDE9FE 100%); color: #78350F; } .stt-coffee-break .status-text { color: #B45309; }
            .stt-lunch-break { background: linear-gradient(135deg, #FEF9C3 0%, #DBEAFE 100%); color: #713F12; } .stt-lunch-break .status-text { color: #A16207; }
            .stt-break { background: linear-gradient(135deg, #F1F5F9 0%, #E7E5E4 100%); color: #374151; } .stt-break .status-text { color: #4B5563; }
            
            /* Unique Icon Animations */
            [animation="breathe"] { animation: breathe 2s infinite ease-in-out; }
            @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.2); opacity: 1; } }
            
            [animation="rock"] { animation: rock 3s infinite ease-in-out; transform-origin: bottom center; }
            @keyframes rock { 0%, 100% { transform: rotate(-12deg); } 50% { transform: rotate(12deg); } }
            
            [animation="bounce-y"] { animation: bounce-y 1.5s infinite ease-in-out; }
            @keyframes bounce-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            
            [animation="ring"] { animation: ring 2s infinite ease-in-out; }
            @keyframes ring { 0%, 100% { transform: rotate(0); } 10%, 30%, 50% { transform: rotate(15deg); } 20%, 40%, 60% { transform: rotate(-15deg); } 70% { transform: rotate(0); } }
            
            [animation="fly"] { animation: fly 2.5s infinite ease-in-out; }
            @keyframes fly { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(3px, -3px); } }
            
            [animation="fade-pulse"] { animation: fade-pulse 3s infinite ease-in-out; }
            @keyframes fade-pulse { 0%, 100% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } }

            .agent-list-container::-webkit-scrollbar { width: 4px; }
            .agent-list-container::-webkit-scrollbar-track { background: transparent; }
            .agent-list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
            @media screen and (max-width: 380px) { .status-inline-label { display: none !important; } }
            @media screen and (max-width: 320px) { .header-counters { display: none !important; } .agent-list-header h3 { margin-bottom: 0; } }
            @media screen and (max-width: 280px) { .agent-avatar { display: none !important; } }
            @media screen and (max-width: 240px) { .agent-right > img { display: none !important; } }
        `,
			);
			let o =
					document.getElementById(a.uiId) ||
					e.createEl("div", { id: a.uiId, parent: document.body }),
				r = "",
				s = /[a-zA-Z\s]+/,
				l = /\d+[hms]/g,
				c = (e) =>
					(e.match(l) || []).reduce(
						(e, t) =>
							e +
							parseInt(t, 10) *
								({ h: 3600, m: 60, s: 1 }[t.slice(-1)] || 0),
						0,
					),
				d = () => {
					try {
						let t = Array.from(n.querySelectorAll("tbody tr"))
								.map((e) => {
									let t = e.querySelectorAll("td");
									if (!t || t.length < 10) return null;
									let a = (t[5].innerText.match(s)?.[0] || "")
											.trim()
											.toLowerCase()
											.replace(/\s+/g, "-"),
										n = (t[8].innerText.match(s)?.[0] || "")
											.trim()
											.toLowerCase()
											.replace(/\s+/g, "-"),
										i = t[3].innerText.trim(),
										o = i
											.toLowerCase()
											.replace(/\s+/g, "-");
									return (
										"Active" === i &&
											"busy" === a &&
											"busy" === n &&
											((i = "Break"), (o = "break")),
										{
											img:
												e.querySelector("img")?.src ||
												"",
											ldap: t[1].innerText.trim(),
											timeInState: t[4].innerText.trim(),
											lastChangeRaw:
												t[9].innerText.trim(),
											displayStatus: i,
											statusKey: o,
											cssClass: `stt-${o}`,
											durationSeconds: c(t[9].innerText),
											rawStatus1: a,
											rawStatus2: n,
										}
									);
								})
								.filter(Boolean)
								.sort((e, t) => {
									let n = e.ldap === i,
										o = t.ldap === i;
									if (n !== o) return o - n;
									let r =
											a.priorities[e.statusKey] ??
											a.priorities.default,
										s =
											a.priorities[t.statusKey] ??
											a.priorities.default;
									return r !== s
										? r - s
										: t.durationSeconds - e.durationSeconds;
								}),
							l = t.filter(
								(e) => "active" === e.statusKey,
							).length,
							d = t.filter((e) =>
								["phone", "video"].includes(e.statusKey),
							).length,
							p = t.filter(
								(e) =>
									!["phone", "video", "active"].includes(
										e.statusKey,
									),
							).length,
							$ = t.length,
							u = ($ > 0 ? l / $ : 0) < 0.2 && $ > 0,
							g = [],
							b = null;
						t.forEach((e) => {
							let t = e.ldap === i,
								a = t ? "You" : e.displayStatus;
							(!t &&
								("phone" === e.statusKey ||
								"video" === e.statusKey
									? (a = "On Call")
									: e.statusKey.includes("break") &&
										(a = e.statusKey.split("-")[0])),
								(b && b.label === a) ||
									((b = { label: a, isUser: t, rows: [] }),
									g.push(b)),
								b.rows.push(e));
						});
						let f = `
                <div class="bento-wrapper ${u ? "health-warning" : ""}">
                    <button class="close-btn" title="Close"><img src="${a.icons.close}" alt="Close"/></button>
                    <div class="bento-grid">
                        <div class="bento-card">
                            <div class="agent-list-header">
                                <h3>
                                    <span>Team Status</span>
                                    ${u ? `<span class="health-text">⚠️ Low Availability</span>` : ""}
                                </h3>
                                <div class="header-counters">
                                    <span class="agent-count active-badge" title="Active">Act: ${l}</span> +
                                    <span class="agent-count phone-badge" title="On Phone">Phn: ${d}</span> +
                                    <span class="agent-count break-badge" title="On Break">Brk: ${p}</span> =
                                    <span class="agent-count total-badge" title="Total">Tot: ${$}</span>
                                </div>
                            </div>
                            <div class="agent-list-container">${g
								.map(
									(t) => `
                    <div class="status-group-block">
                        <div class="status-inline-label ${t.isUser ? "user-label" : ""}">${e.escapeHtml(t.label)}</div>
                        <div class="status-rows-stack">${t.rows
							.map((t) => {
								let n = a.icons[t.statusKey],
									i =
										a.statusConfig[t.statusKey] ||
										a.statusConfig.default,
									o = i.maxSecs || 2700,
									r = Math.min(
										(t.durationSeconds / o) * 100,
										100,
									).toFixed(1),
									s = t.durationSeconds >= o,
									l = `--progress: ${r}%; --st-color: ${i.color}; --st-track: ${i.track};`,
									c = "active" === t.statusKey,
									d =
										"busy" === t.rawStatus1 && c
											? `<img src="${a.icons.non_phone}" alt="non_phone" loading="lazy" />`
											: "",
									p =
										"busy" === t.rawStatus2 && c
											? `<img src="${a.icons.non_video}" alt="non_video" loading="lazy" />`
											: "";
								return `
                        <div class="agent-row ${t.cssClass} ${s ? "over-time" : ""}" style="${l}">
                            ${d || p ? `<div class="row-bg-icons">${d}${p}</div>` : ""}
                            <div class="agent-left">
                                <img class="agent-avatar" src="${e.escapeHtml(t.img)}" alt="${e.escapeHtml(t.ldap)}" loading="lazy" />
                                <span>${e.escapeHtml(t.ldap)}</span>
                            </div>
                            <div class="agent-right">
                                <div class="agent-meta">
                                    <span class="time-state">${e.escapeHtml(t.lastChangeRaw)} (${e.escapeHtml(t.timeInState)})</span>
                                    <span class="status-text">${e.escapeHtml(t.displayStatus)}</span> 
                                </div>
                                ${n ? `<img src="${n.src}" animation="${n.animation}" alt="${t.statusKey} icon" loading="lazy" />` : ""}
                            </div>
                        </div>`;
							})
							.join("")}</div>
                    </div>`,
								)
								.join("")}</div>
                        </div>
                    </div>
                </div>`;
						f !== r &&
							((o.innerHTML = f),
							(r = f),
							(o.style.display = "flex"));
					} catch (x) {
						console.error("Casemon render error:", x);
					}
				},
				p = new MutationObserver(e.debounce(d, 150));
			(p.observe(n, {
				attributes: !0,
				childList: !0,
				subtree: !0,
				characterData: !0,
			}),
				o.addEventListener("click", (e) => {
					e.target.closest(".close-btn") &&
						(o.remove(), (window.dashRun = 0), p.disconnect());
				}),
				d());
		}
	}
	class n {
		static init() {
			if (window.scrRun) return;
			((window.scrRun = !0),
				e.addStyle(
					"cases-styles",
					`
                #panelQM { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 10px; align-items: center; z-index: 9999; font-family: -apple-system, sans-serif; }
                .qm-btn { z-index: 10; color: white; padding: 10px 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(26,29,35,0.06); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 13px; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.03); }
                .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(26,29,35,0.12); }
                #flup-days-input { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 4px; background: rgba(255, 255, 255, 0.95); color: #1A1D23; font-weight: 700; font-size: 13px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08); transition: all 0.2s ease; -moz-appearance: textfield; }
                #flup-days-input:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08), 0 0 0 2px rgba(26, 29, 35, 0.2); }
                .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #D94138; border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1px solid #ffffff; }
                .aw-sig-table { margin: 12px 0; }
            `,
				));
			let t = e.createEl("div", { id: "panelQM", parent: document.body }),
				a = setInterval(n.autoClickTask, 16e3),
				i = e.createEl("button", {
					textContent: "OFF",
					title: "Auto Click",
					className: "qm-btn",
					style: { backgroundColor: "#D94138" },
					parent: t,
					onClick() {
						a
							? (clearInterval(a),
								(a = null),
								(i.textContent = "ON"),
								(i.style.backgroundColor = "#1E7F4E"))
							: ((a = setInterval(n.autoClickTask, 16e3)),
								(i.textContent = "OFF"),
								(i.style.backgroundColor = "#D94138"));
					},
				});
			(n.initFollowUpUI(t), n.initSignatureUI(t));
		}
		static autoClickTask() {
			(e.$("#cdtx__uioncall--btn")?.click(),
				setTimeout(
					() => e.$(".cdtx__uioncall_control-remove")?.click(),
					6e3,
				));
		}
		static initFollowUpUI(t) {
			(e.createEl("button", {
				html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 16px; height: 16px; filter: invert(1);"><span id="flup-badge" class="qm-badge">+</span>',
				title: "Click Follow-up Item",
				className: "qm-btn",
				style: { backgroundColor: "#3B72E6" },
				parent: t,
				async onClick() {
					e.$('[debug-id="dock-item-home"]')?.click();
					try {
						let t = await e.waitForElement(".li-popup_lstcasefl");
						t?.click();
					} catch (a) {
						console.warn("Follow-up popup not found");
					}
				},
			}),
				e
					.waitForElement(".li-popup_lstcasefl")
					.then((t) => {
						let a = e.$("#flup-badge"),
							n = () => {
								a &&
									(a.style.display =
										t.dataset.attr && "0" !== t.dataset.attr
											? "block"
											: "none");
							};
						(new MutationObserver(n).observe(t, {
							attributes: !0,
							attributeFilter: ["data-attr"],
						}),
							n());
					})
					.catch(() => {}));
			let a = e.createEl("button", {
				textContent: "FL Up:",
				title: "Set Follow-up",
				className: "qm-btn",
				style: { backgroundColor: "#1A827A", paddingRight: "44px" },
				parent: t,
				async onClick(t) {
					if ("flup-days-input" !== t.target.id)
						try {
							((a.style.opacity = "0.6"),
								(a.style.pointerEvents = "none"));
							let n =
									parseInt(
										e.$("#flup-days-input").value,
										10,
									) || 0,
								i = e.$('[data-infocase="appointment_time"]');
							if (i && !i.dataset.valchoice) {
								(i.click(), await e.sleep(150));
								let o = await e.waitForElement(
									".datepicker-grid .today",
								);
								(o && o.click(), await e.sleep(200));
							}
							let r = e.$('[data-infocase="follow_up_time"]');
							if ((r && (r.click(), await e.sleep(150)), n > 0)) {
								let s = new Date();
								for (let l = 0; l < n; )
									(s.setDate(s.getDate() + 1),
										s.getDay() % 6 != 0 && l++);
								let c = Math.round((s - new Date()) / 864e5),
									d = await e.waitForElement(
										".datepicker-grid .today",
									);
								for (let p = 0; p < c && d; p++)
									d = d.nextElementSibling;
								d && (d.click(), await e.sleep(200));
							} else {
								let $ = await e.waitForElement(
									'[data-thischoice="Finish"]',
								);
								$ && ($.click(), await e.sleep(200));
							}
							let u = await e.waitForElement(
								"[data-type=follow_up_time]",
							);
							u && u.click();
						} catch (g) {
							console.error("Follow up script failed", g);
						} finally {
							((a.style.opacity = "1"),
								(a.style.pointerEvents = "auto"));
						}
				},
			});
			e.createEl("input", {
				id: "flup-days-input",
				type: "text",
				value: "2",
				parent: a,
				onClick: (e) => e.stopPropagation(),
				onfocus: (e) => e.target.select(),
				oninput: (e) =>
					(e.target.value = e.target.value
						.replace(/\D/g, "")
						.slice(0, 1)),
			});
		}
		static initSignatureUI(t) {
			e.createEl("button", {
				textContent: "Sign",
				title: "Insert Signature at Cursor",
				className: "qm-btn",
				style: { backgroundColor: "#92400E", color: "#FFFFFF" },
				parent: t,
				onmousedown: (e) => e.preventDefault(),
				onClick() {
					let t = window.getSelection();
					if (!t.rangeCount)
						return alert(
							"Please click inside the email body to place your cursor first.",
						);
					let a = t.getRangeAt(0).startContainer.parentNode;
					if (!a || !a.closest("[contenteditable]"))
						return alert(
							"Please place your cursor inside the text area where you want the signature.",
						);
					e.$$(".aw-sig-table").forEach((e) => e.remove());
					let n = localStorage.getItem("__signature_name");
					n ||
						((n = prompt("Enter your name:") || "Agent"),
						localStorage.setItem("__signature_name", n));
					let i = `
                    <table class="aw-sig-table" style="width: 348px; padding: 0 30px;" data-sig-injected="true">
                        <tbody>
                            <tr align="left">
                                <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 8px;"></td>
                                <td style="width: 12px;"/>
                                <td style="vertical-align: middle;">
                                    <p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; line-height: 1.4; color: #1A1D23;">
                                        <strong style="font-size: 105%; color: #111111;">${e.escapeHtml(n)}</strong><br>
                                        <span style="color: #5F6368;">Technical Solutions Team</span><br>
                                        <span style="color: #5F6368; font-weight: 500;">TDCX, on behalf of Google</span>
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;
					document.execCommand(
						"insertHTML",
						!1,
						((e) => {
							if (
								window.trustedTypes &&
								window.trustedTypes.createPolicy
							) {
								let t = trustedTypes.createPolicy(
									"sig-inject",
									{ createHTML: (e) => e },
								);
								return t.createHTML(e);
							}
							return e;
						})(i),
					);
				},
			});
		}
	}
	class i {
		static async init() {
			e.addStyle(
				"aw-styles",
				`
                .aw-ga4 { background-color: #FEF3D6; color: #B07505; border: 1px solid rgba(176,117,5,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-ads { background-color: #E2F5E9; color: #1E7F4E; border: 1px solid rgba(30,127,78,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-copied { background-color: #3B72E6 !important; color: white !important; border-color: transparent !important; }
                #gpt-aw-container { position: fixed; bottom: 20px; left: 20px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
                .gpt-aw-badge { padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; }
                .gpt-aw-badge:hover { background: #2D323F; }
            `,
			);
			let t = await e.pollForCondition(
				() => window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS,
				600,
				5,
			);
			t &&
				i.processData(
					window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS,
				);
		}
		static processData(t) {
			let a = [...t.matchAll(/AW-(\d+)/g)],
				n = [...new Set(a.map((e) => e[1]))];
			if (n.length > 0) {
				let i =
					e.$("#gpt-aw-container") ||
					e.createEl("div", {
						id: "gpt-aw-container",
						parent: document.body,
					});
				((i.innerHTML = ""),
					n.forEach((t) => {
						let a = e.createEl("div", {
							className: "gpt-aw-badge",
							text: `AW-${t}`,
							parent: i,
						});
						e.setupCopy(a, t, "Copied!");
					}));
			}
			e.$$(".expand-more").forEach((e) => e.click());
			try {
				let o = JSON.parse(t);
				if (!o || !o[1]) return;
				let r = new Map(o[1].map((e) => [e[1], e]));
				setTimeout(() => {
					(e.$$(".conversion-name-cell .internal").forEach((t) => {
						let a = t.closest(".particle-table-row");
						if (
							a &&
							!a
								.querySelector(
									'[essfield="aggregated_conversion_source"]',
								)
								?.innerText?.toLowerCase()
								.includes("web")
						)
							return a.remove();
						let n = r.get(t.innerText);
						if (!n) return;
						let i = null,
							o = null;
						(1 === n[11]
							? ((i = "aw-ads"),
								(o = n[64]?.[2]?.[4]
									?.split("'")?.[7]
									?.split("/")?.[1]))
							: 32 === n[11] &&
								((i = "aw-ga4"),
								(o = n[64]?.[1]?.[4]?.split("'")?.[3])),
							i &&
								o &&
								((t.innerHTML = o),
								t.classList.add(i),
								e.setupCopy(t, o)));
					}),
						e
							.$$(
								"category-conversions-container-view, conversion-goal-card",
							)
							.forEach((e) => {
								e.querySelector(".particle-table-row") ||
									(e.style.display = "none");
							}));
				}, 1200);
			} catch (s) {
				console.error("Adwords Data parsing failed", s);
			}
		}
	}
	let o = {
		init() {
			let e = window.location.href;
			e.includes("casemon2.corp")
				? a.init()
				: e.includes("cases.connect")
					? n.init()
					: e.includes("adwords.corp")
						? i.init()
						: e.includes("chrome-extension://") && t.run();
		},
	};
	["complete", "interactive"].includes(document.readyState)
		? o.init()
		: window.addEventListener("DOMContentLoaded", () => o.init());
})();
