if (window.location.href.includes("cases.connect")) {
	(() => {
		if (window.scrRun) return;
		window.scrRun = 1;

		const config = {
			soundUrl: "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3",
			autoClickInterval: 18000,
			autoRemoveDelay: 6000,
			selectors: {
				autoClickBtn: "#cdtx__uioncall--btn",
				autoRemoveBtn: ".cdtx__uioncall_control-remove",
				flupItem: ".li-popup_lstcasefl",
				todayBtn: ".datepicker-grid .today",
				flupInputId: "flup-days-input",
				flupBadgeId: "flup-badge",
				uiPanelId: "btn-panel",
				homeButton: '[debug-id="dock-item-home"]',
				apptBtn: '[data-infocase="appointment_time"]',
				flupBtn: '[data-infocase="follow_up_time"]',
				phoneDialog: "[debug-id=phoneTakeDialog]",
				setFlupBtn: "[data-type=follow_up_time]",
				finishBtn: '[data-thischoice="Finish"]',
			},
		};

		// --- Helpers ---
		const click = (selector) => document.querySelector(selector)?.click();
		const dayDiff = (date1, date2) => Math.round((date2 - date1) / (1000 * 60 * 60 * 24));

		const addWorkDays = (startDate, days, holidays = []) => {
			const date = new Date(startDate);
			let daysAdded = 0;
			const isHoliday = (d) => holidays.includes(d.toISOString().split('T')[0]);

			while (daysAdded < days) {
				date.setDate(date.getDate() + 1);
				const dayOfWeek = date.getDay();
				if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(date)) {
					daysAdded++;
				}
			}
			return date;
		};

		const waitEl = (selector, { interval = 500, timeout = 3000 } = {}) => new Promise((resolve, reject) => {
			const start = Date.now();
			const timer = setInterval(() => {
				const el = document.querySelector(selector);
				if (el && el.offsetParent !== null) {
					clearInterval(timer);
					resolve(el);
					return;
				}
				if (Date.now() - start > timeout) {
					clearInterval(timer);
					reject(new Error(`Timeout for ${selector}`));
				}
			}, interval);
		});

		const waitClick = async (selector, steps = 0, opts = {}) => {
			const el = await waitEl(selector, opts);
			let target = el;
			for (let i = 0; i < steps; i++) target = target?.nextElementSibling;
			if (target) target.click();
			return target;
		};

		const observeNode = (selector, cb) => {
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((m) => {
					if (m.nodeType === 1 && m.matches(selector)) cb();
				});
			});
			observer.observe(document.body, { childList: true, subtree: true });
			return observer;
		};

		// --- UI Components ---
		class Button {
			constructor({
				text = "",
				html = "",
				onClick = null,
				id = "",
				title = "",
				bgColor = "#555",
				extraStyles = {}
			}) {
				this.element = document.createElement("button");
				this.element.id = id;
				this.element.title = title;

				if (html) this.element.innerHTML = html;
				else this.element.innerText = text;

				Object.assign(this.element.style, {
					zIndex: "10",
					color: "white",
					padding: "12px 12px",
					border: "none",
					borderRadius: "5px",
					cursor: "pointer",
					fontWeight: "bold",
					boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
					transition: "all 0.3s ease",
					fontSize: "14px",
					backgroundColor: bgColor,
					position: "relative",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					...extraStyles
				});

				if (onClick) {
					this.element.addEventListener("click", (e) => onClick(e));
				}
			}

			render = (targetElement) => {
				targetElement.appendChild(this.element);
			}

			setText = (text) => {
				this.element.innerText = text;
			}

			setColor = (color) => {
				this.element.style.backgroundColor = color;
			}

			appendChild = (childElement) => {
				this.element.appendChild(childElement);
			}
		}

		const autoBtn = {
			timerId: null,
			on: false,
			btnInstance: null,

			// Cannot use arrow functions here due to 'this' usage
			start() {
				if (this.timerId) return;
				this.on = true;
				this.timerId = setInterval(() => {
					click(config.selectors.autoClickBtn);
					setTimeout(() => click(config.selectors.autoRemoveBtn), config.autoRemoveDelay);
				}, config.autoClickInterval);
				this.updateView();
			},

			stop() {
				if (!this.timerId) return;
				clearInterval(this.timerId);
				this.timerId = null;
				this.on = false;
				this.updateView();
			},

			toggle() {
				this.on ? this.stop() : this.start();
			},

			updateView() {
				if (!this.btnInstance) return;
				this.btnInstance.setText(this.on ? "ON" : "OFF");
				this.btnInstance.setColor(this.on ? "#77DD77" : "#FF746C");
			},

			create(parent) {
				this.btnInstance = new Button({
					text: "OFF",
					onClick: () => this.toggle(),
					id: "auto-btn",
					title: "Auto Click",
					bgColor: "#FF746C"
				});
				this.btnInstance.render(parent);
			}
		};

		const checkBtn = {
			// Cannot use arrow functions here due to 'this' usage logic (if extended later) or maintaining consistency
			async handleClick() {
				click(config.selectors.homeButton);
				await waitClick(config.selectors.flupItem, 0);
			},

			updateBadge(el) {
				const badge = document.getElementById(config.selectors.flupBadgeId);
				if (el && badge) {
					const count = el.getAttribute("data-attr") || "0";
					badge.style.display = (count !== "0") ? "block" : "none";
				}
			},

			create(parent) {
				const htmlContent = `
                    <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" 
                        style="width: 20px; height: 20px;">
                    <span id="${config.selectors.flupBadgeId}" style="
                        display: none; position: absolute; top: -5px; right: -5px;
                        background: red; border-radius: 50%; padding: 2px 5px; line-height: 1;
                    ">+</span>
                `;

				const btn = new Button({
					html: htmlContent,
					onClick: () => this.handleClick(),
					id: "follow-up-btn",
					title: "Click Follow-up Item",
					bgColor: "#A2BFFE"
				});

				btn.render(parent);
				waitEl(config.selectors.flupItem).then((el) => {
					const observer = new MutationObserver(() => this.updateBadge(el));
					observer.observe(el, {
						attributes: true,
						attributeFilter: ["data-attr"]
					});
					this.updateBadge(el);
				});
			},
		};

		const followUpBtn = {
			inputEl: null,

			// Cannot use arrow functions here due to 'this.inputEl' usage
			async handleFlupClick(e) {
				if (e.target.id === config.selectors.flupInputId) return;

				const apptBtn = document.querySelector(config.selectors.apptBtn);
				if (apptBtn && !apptBtn.dataset.valchoice) {
					click(config.selectors.apptBtn);
					await waitClick(config.selectors.todayBtn);
				}

				const flDays = +this.inputEl.value;
				if (!flDays) {
					await waitClick(config.selectors.finishBtn);
				} else {
					const today = new Date();
					const addDay = addWorkDays(today, flDays);
					const calendarDays = dayDiff(today, addDay);
					click(config.selectors.flupBtn);
					await waitClick(config.selectors.todayBtn, calendarDays);
				}
				await waitClick(config.selectors.setFlupBtn);
			},

			create(parent) {
				const btn = new Button({
					text: "FL Up:",
					onClick: (e) => this.handleFlupClick(e),
					title: "Set Follow-up",
					bgColor: "#55B4B0",
					extraStyles: {
						paddingRight: "48px"
					}
				});

				const input = document.createElement("input");
				input.id = config.selectors.flupInputId;
				input.type = "text";
				input.value = "2";
				input.title = "Days to follow-up";

				input.addEventListener("click", (e) => e.stopPropagation());
				input.addEventListener("input", (e) => {
					e.target.value = e.target.value.replace(/\D/g, "").substring(0, 1);
				});
				input.addEventListener("focus", (e) => e.target.select());

				this.inputEl = input;
				btn.appendChild(input);
				btn.render(parent);
			}
		};

		// --- Initialization ---
		const handleDialog = async () => {
			const sound = new Audio(config.soundUrl);
			await sound.play();
			window.focus();
		};

		const injectSelectors = () => {
			const id = "cases-connect-enhanced-styles";
			if (document.getElementById(id)) return;
			const rules = `
                #${config.selectors.flupInputId} {
                    position: absolute; top: 50%; transform: translateY(-50%);
                    right: 8px; width: 32px; height: 28px;
                    padding: 0; border: none; border-radius: 3px; 
                    background: rgba(255, 255, 255, 0.9); color: #333;
                    font-weight: bold; font-size: 14px; text-align: center;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); 
                    transition: box-shadow 0.2s ease; -moz-appearance: textfield;
                }
                #${config.selectors.flupInputId}:focus {
                    outline: none;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7);
                }
            `;
			const el = document.createElement("style");
			el.id = id;
			el.textContent = rules;
			document.head.appendChild(el);
		};

		const createPanel = () => {
			const div = document.createElement("div");
			div.id = config.selectors.uiPanelId;
			Object.assign(div.style, {
				position: "fixed",
				bottom: "16px",
				left: "16px",
				display: "flex",
				gap: "8px",
				alignItems: "center",
				zIndex: "9999",
			});
			document.body.appendChild(div);
			return div;
		};

		const init = () => {
			observeNode(config.selectors.phoneDialog, handleDialog);
			injectSelectors();
			const panel = createPanel();

			autoBtn.create(panel);
			checkBtn.create(panel);
			followUpBtn.create(panel);
		};

		init();
	})();
}