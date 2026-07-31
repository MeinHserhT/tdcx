// bookmarklet-domainApply: *cases.connect.corp.google.com*
(function () {
	"use strict";

	class ClipboardUtils {
		static copy(text) {
			const textArea = document.createElement("textarea");
			textArea.value = text;
			textArea.style.position = "fixed";
			textArea.style.left = "-9999px";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			let success = false;
			try {
				success = document.execCommand("copy");
			} catch (err) {
				console.error("Copy failed", err);
			} finally {
				document.body.removeChild(textArea);
			}
			return success;
		}
	}

	class ExtensionStorage {
		static extensionId = "jkoemmkocjacgolhnfegemilnlkbaolo";
		static STORAGE_KEY = "g_case_extension_data";

		static async _sendMessage(action, key, value = undefined) {
			if (!window.chrome?.runtime?.sendMessage) return null;
			return new Promise((resolve) => {
				chrome.runtime.sendMessage(
					this.extensionId,
					{ action, key, value },
					(response) => {
						if (chrome.runtime.lastError) resolve(null);
						else resolve(response);
					},
				);
			});
		}

		static migrate(storageObj) {
			if (!storageObj || typeof storageObj !== "object") return {};

			Object.keys(storageObj).forEach((key) => {
				if (key.includes("Loading")) {
					delete storageObj[key];
				}
			});

			Object.keys(storageObj).forEach((key) => {
				const item = storageObj[key];
				if (item && typeof item === "object" && item.isArchivedSample) {
					const actualCaseId =
						item.metadata?.caseId || item.casedata?.["Case ID"];
					const sampleId =
						item.metadata?.sampleId ||
						item.metadata?.eventId ||
						key;
					if (actualCaseId && actualCaseId !== key) {
						if (!storageObj[actualCaseId])
							storageObj[actualCaseId] = { casedata: {} };
						storageObj[actualCaseId][sampleId] = {
							metadata: item.metadata || {},
							workflow: item.workflow || {
								title: "",
								answers: {},
							},
						};
						if (item.casedata) {
							storageObj[actualCaseId].casedata = Object.assign(
								{},
								item.casedata,
								storageObj[actualCaseId].casedata,
							);
						}
						delete storageObj[key];
					}
				}
			});

			Object.keys(storageObj).forEach((caseId) => {
				const fullCase = storageObj[caseId];
				if (fullCase && typeof fullCase === "object") {
					const casedata = fullCase.casedata || {};

					Object.keys(fullCase).forEach((k) => {
						if (
							k !== "casedata" &&
							k !== "metadata" &&
							k !== "workflow" &&
							typeof fullCase[k] !== "object"
						) {
							if (casedata[k] === undefined)
								casedata[k] = fullCase[k];
							delete fullCase[k];
						}
					});

					const normalizeKey = (oldKey, newKey) => {
						if (casedata[oldKey] !== undefined) {
							if (!casedata[newKey] && casedata[oldKey])
								casedata[newKey] = casedata[oldKey];
							delete casedata[oldKey];
						}
					};
					normalizeKey("Contact Email", "Contact email");
					normalizeKey("Phone Numbers", "Phone number");
					normalizeKey("Full Name", "Full name");

					if (casedata.isHidden !== undefined) {
						if (casedata.isShow === undefined) {
							casedata.isShow = !casedata.isHidden;
						}
						delete casedata.isHidden;
					}

					fullCase.casedata = casedata;

					if (fullCase.metadata && fullCase.workflow) {
						const sampleId =
							fullCase.metadata.sampleId ||
							fullCase.metadata.eventId ||
							"legacy-sample-" +
								Math.random().toString(36).substring(7);
						fullCase[sampleId] = {
							metadata: fullCase.metadata,
							workflow: fullCase.workflow,
						};
						delete fullCase.metadata;
						delete fullCase.workflow;
					}
				}
			});
			return storageObj;
		}

		static getLatestSample(fullCase) {
			if (!fullCase || typeof fullCase !== "object")
				return { metadata: {}, workflow: { title: "", answers: {} } };
			let latestSample = null;
			let maxTime = -1;

			Object.keys(fullCase).forEach((k) => {
				if (
					k !== "casedata" &&
					fullCase[k] &&
					typeof fullCase[k] === "object"
				) {
					const sample = fullCase[k];
					const time = sample.metadata?.createTimeMicros || 0;
					if (time > maxTime) {
						maxTime = time;
						latestSample = sample;
					}
				}
			});
			return (
				latestSample || {
					metadata: {},
					workflow: { title: "", answers: {} },
				}
			);
		}

		static extractCaseFields(fullCase, casedata = {}) {
			const latestSample = this.getLatestSample(fullCase);
			const answers = latestSample.workflow?.answers || {};
			let state =
				answers["Select the Status of the case"] ||
				casedata["Case State"] ||
				latestSample.metadata?.actionType ||
				"N/A";
			if (Array.isArray(state)) state = state.join(", ");

			const followUpIso = answers["Follow up date"]?.isoString;
			let followUpDate = followUpIso
				? followUpIso.split("T")[0]
				: casedata["Follow Up"] ||
					answers["Follow up date"] ||
					answers["Follow Up Date"] ||
					"N/A";
			if (
				typeof followUpDate === "string" &&
				followUpDate.includes("T")
			) {
				followUpDate = followUpDate.split("T")[0];
			}

			let followUpStatus =
				answers["In Progress Sub-Status"] ||
				answers["Implemented Sub-Status"] ||
				answers["Inactive Sub-Status"] ||
				casedata["Follow Up Sub Status"] ||
				answers["Follow up status"] ||
				answers["Follow Up Status"] ||
				"N/A";
			if (Array.isArray(followUpStatus))
				followUpStatus = followUpStatus.join(", ");

			let customTasks =
				answers["Custom Tasks"] || casedata["Custom Tasks"] || "N/A";
			if (Array.isArray(customTasks))
				customTasks = customTasks.join(", ");

			let cmsPlatform =
				answers["CMS / Platform"] ||
				casedata["CMS / Platform"] ||
				casedata["CMS"] ||
				"N/A";
			if (Array.isArray(cmsPlatform))
				cmsPlatform = cmsPlatform.join(", ");

			const title = latestSample.workflow?.title || "";
			let poolName = "N/A";
			if (title.includes("Live Transfer")) poolName = "Live Transfer";
			else if (title.includes("Tag Case Update")) poolName = "Tag Case";
			else if (title.includes("Shopping Case Update"))
				poolName = "Shopping";
			else if (title.includes("LeadGen Case Update"))
				poolName = "LeadGen";

			const lastEmail =
				casedata["Last Email"] || fullCase["Last Email"] || "";
			const lastNote =
				casedata["Last Note"] || fullCase["Last Note"] || "";

			return {
				latestSample,
				state: String(state),
				followUpDate,
				followUpStatus: String(followUpStatus),
				customTasks: String(customTasks),
				cmsPlatform: String(cmsPlatform),
				poolName,
				lastEmail: String(lastEmail),
				lastNote: String(lastNote),
			};
		}

		static async get() {
			try {
				const res = await this._sendMessage(
					"STORAGE_GET",
					this.STORAGE_KEY,
				);
				const data = res?.data || {};
				const parsed =
					typeof data === "string" ? JSON.parse(data) : data;
				const originalKeysCount = parsed
					? Object.keys(parsed).length
					: 0;
				const clean = this.migrate(parsed);
				if (parsed && originalKeysCount !== Object.keys(clean).length) {
					this.set(clean);
				}
				return clean;
			} catch (e) {
				return {};
			}
		}

		static async set(data) {
			try {
				const cleanData = this.migrate(data);
				const valueStr =
					typeof cleanData === "string"
						? cleanData
						: JSON.stringify(cleanData);
				await this._sendMessage(
					"STORAGE_SET",
					this.STORAGE_KEY,
					JSON.parse(valueStr),
				);
			} catch (e) {}
			window.dispatchEvent(new Event("case_extension_data_updated"));
		}

		static async remove() {
			try {
				await this._sendMessage("STORAGE_REMOVE", this.STORAGE_KEY);
			} catch (e) {}
			window.dispatchEvent(new Event("case_extension_data_updated"));
		}
	}

	class CrawlerConfig {
		static FIXED_ID_1 = "afffa910-23c5-440e-8896-7e794cc3b450";
		static CATEGORIES = {
			shopping: {
				id2: "baf198c8-52d3-4ade-b095-fbfa00264527",
				id3: "ba134e21-1d71-45e5-a503-435fd96a95bb",
			},
			live_transfer: {
				id2: "a3ccf987-96f8-451e-a5b7-f38dd9db9145",
				id3: "0a1eb689-3d63-43b6-bb2b-7c16d347a927",
			},
			lead_gen: {
				id2: "be60accb-28e6-44d6-a3b0-efd2dda1a023",
				id3: "e8c82060-980d-47cc-a976-353c68bbb85d",
			},
			tag_case: {
				id2: "989136c7-87f6-46f6-b8bc-448940f7c5ec",
				id3: "6d45b3c6-c6b1-41f1-b9be-e83579353634",
			},
		};

		static settings = {
			fetchMode: "extension",
			delayMs: 0,
			categories: ["live_transfer"],
			timeMode: "preset",
			presetDays: "14",
			startDate: "",
			endDate: "",
			pageSize: 50,
			ldap: "",
			atToken: "",
		};

		static getPresetDates(days) {
			const now = new Date();
			const tomorrow = new Date(now);
			tomorrow.setDate(now.getDate() + 1);

			const start = new Date(tomorrow);
			start.setDate(tomorrow.getDate() - days);

			const formatOpt = (d) => {
				const y = d.getFullYear();
				const m = String(d.getMonth() + 1).padStart(2, "0");
				const day = String(d.getDate()).padStart(2, "0");
				return `${y}-${m}-${day}`;
			};

			const formatDisplay = (d) => {
				const y = d.getFullYear();
				const m = String(d.getMonth() + 1).padStart(2, "0");
				const day = String(d.getDate()).padStart(2, "0");
				return `00:00 on ${day}/${m}/${y}`;
			};

			return {
				startDateStr: formatOpt(start),
				endDateStr: formatOpt(tomorrow),
				displayStr: `${formatDisplay(start)} to ${formatDisplay(tomorrow)}`,
			};
		}

		static async initDefaults() {
			const today = new Date();
			const past30Days = new Date();
			past30Days.setDate(today.getDate() - 30);

			this.settings.endDate = today.toISOString().split("T")[0];
			this.settings.startDate = past30Days.toISOString().split("T")[0];
			this.settings.timeMode = "preset";
			this.settings.presetDays = "14";

			try {
				const saved = localStorage.getItem("gauge_crawler_settings");
				if (saved) {
					const parsed = JSON.parse(saved);
					if (parsed.category && !parsed.categories) {
						parsed.categories = [parsed.category];
					}
					Object.assign(this.settings, parsed);
				}
				const extSaved = await ExtensionStorage._sendMessage(
					"STORAGE_GET",
					"gauge_crawler_settings",
				);
				if (extSaved && extSaved.data) {
					const parsedExt =
						typeof extSaved.data === "string"
							? JSON.parse(extSaved.data)
							: extSaved.data;
					if (parsedExt.category && !parsedExt.categories) {
						parsedExt.categories = [parsedExt.category];
					}
					Object.assign(this.settings, parsedExt);
				}
			} catch (e) {}

			if (typeof window !== "undefined" && window.WIZ_global_data) {
				if (window.WIZ_global_data.oPEP7c) {
					this.settings.ldap =
						window.WIZ_global_data.oPEP7c.split("@")[0];
				}
			}
		}

		static async saveSettings(newSettings) {
			Object.assign(this.settings, newSettings);
			try {
				localStorage.setItem(
					"gauge_crawler_settings",
					JSON.stringify(this.settings),
				);
			} catch (e) {}
			try {
				await ExtensionStorage._sendMessage(
					"STORAGE_SET",
					"gauge_crawler_settings",
					this.settings,
				);
			} catch (e) {}
		}
	}

	class GaugeExtensionCrawler {
		static extensionId = "gnhkacnhcenacadhaohjdkmkgfikdkoh";

		/**
		 * Fetches raw evaluation or list data from web via Chrome Runtime extension messaging.
		 * @param {string} apiUrl - Target API endpoint.
		 * @param {string=} method - HTTP method.
		 * @param {!Object=} headers - Request headers.
		 * @param {string=} body - Request body payload.
		 * @returns {!Promise<string>}
		 */
		static async fetchFromRuntime(
			apiUrl,
			method = "POST",
			headers = {},
			body = "",
		) {
			if (
				typeof chrome === "undefined" ||
				!chrome.runtime ||
				!chrome.runtime.sendMessage
			) {
				throw new Error("chrome.runtime.sendMessage is not available");
			}

			const payload = {
				action: "FETCH_DATA_FROM_WEB",
				apiUrl: apiUrl,
				method: method,
				headers: headers,
				body: body,
				dataType: "text",
				responseType: "text",
				parseJson: false,
				isJson: false,
			};

			return await new Promise((resolve, reject) => {
				chrome.runtime.sendMessage(
					this.extensionId,
					payload,
					(response) => {
						if (chrome.runtime.lastError) {
							return reject(
								new Error(
									`Ext Error: ${chrome.runtime.lastError.message}`,
								),
							);
						}
						if (!response) {
							return reject(
								new Error("Extension returned empty response"),
							);
						}
						if (response.data) {
							return resolve(
								typeof response.data === "string"
									? response.data
									: JSON.stringify(response.data),
							);
						}
						const rawData =
							response.rawText ||
							response.raw ||
							response.text ||
							response.body ||
							response.content;
						if (rawData) {
							return resolve(
								typeof rawData === "string"
									? rawData
									: JSON.stringify(rawData),
							);
						}
						if (response.error) {
							const errStr = String(response.error);
							if (
								errStr.includes("400") ||
								errStr.includes("401") ||
								errStr.includes("403") ||
								errStr.includes("Unauthorized") ||
								errStr.includes("TOKEN_INVALID")
							) {
								return reject(new Error("TOKEN_INVALID"));
							}
							return reject(
								new Error(`API Error: ${response.error}`),
							);
						}
						resolve("");
					},
				);
			});
		}
	}

	class CaseQplusApp {
		constructor() {
			this.container = null;
			this.listContainer = null;
			this.toast = null;
			this.activeTabIndex = 0;
			this.currentFilter = { date: "All", state: "", subStatus: "" };
		}

		init(container) {
			this.container = container;
			this.activeTabIndex = 0;
			try {
				const saved = localStorage.getItem("case_gauge_qplus_filter");
				this.currentFilter = saved
					? JSON.parse(saved)
					: { date: "All", state: "", subStatus: "" };
				if (!this.currentFilter || !this.currentFilter.date) {
					this.currentFilter = this.currentFilter || {};
					this.currentFilter.date = "All";
				}
			} catch (e) {
				this.currentFilter = { date: "All", state: "", subStatus: "" };
			}

			this.renderLayout();

			if (typeof ToastNotification !== "undefined") {
				this.toast = new ToastNotification(this.container);
			}

			window.addEventListener("show_toast", (e) => {
				if (this.toast && e.detail && e.detail.message) {
					this.toast.show(e.detail.message);
				}
			});

			window.addEventListener("case_extension_data_updated", () => {
				this.updateContent();
			});

			CrawlerConfig.initDefaults().then(() => {
				this.updateContent();
			});
		}

		renderLayout() {
			const styles = `<style>.cg-app-container{display:flex;flex-direction:column;height:100%;background-color:#fff;font-family:'Google Sans',Roboto,sans-serif;position:relative}.cg-info-list{flex:1;overflow-y:auto;background-color:#fff}.cg-state-view{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#5f6368}.cg-loading-text{font-size:14px;font-weight:500}.cg-loading-sub{font-size:12px;margin-top:4px;opacity:0.8}.cg-empty-title{font-size:16px;font-weight:500}.cg-empty-sub{font-size:13px;margin-top:8px}.cg-card-header{padding:16px;border-bottom:1px solid #f1f3f4;background:#fff}.cg-header-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.cg-case-id{font-family:'Google Sans',Roboto,sans-serif;font-size:16px;font-weight:600;color:#1a73e8;letter-spacing:0.1px}.cg-badge{padding:4px 10px;border-radius:16px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px}.cg-badge.cg-lm{background-color:#e8f0fe;color:#2ab079;font-size:11px}.cg-badge.cg-la{background-color:#e6f4ea;color:#188038}.cg-list-item{padding:8px 16px;display:flex;align-items:flex-start;gap:12px}.cg-item-content{flex:1;min-width:0}.cg-item-label{font-size:12px;color:#5f6368;font-weight:500;margin-bottom:2px;display:flex;align-items:center}.cg-item-value-container{display:flex;align-items:center;gap:8px}.cg-item-value{font-size:14px;color:#202124;line-height:1.5;position:relative;overflow:hidden;text-overflow:ellipsis;display:block}.cg-item-value.cg-picker-box{display:flex;align-items:center;overflow:visible;white-space:normal}.cg-item-value.clickable{cursor:pointer;transition:color 0.2s}.cg-item-value.clickable:hover{color:#1a73e8}.cg-item-value.clickable:active{color:#1557b0}.cg-link-style{color:#1a73e8;text-decoration:none;word-break:break-all;width:214px;display:block;overflow:hidden;text-wrap:nowrap;text-overflow:ellipsis}.cg-copy-btn{background:none;border:none;padding:2px;cursor:pointer;color:#9aa0a6;display:flex;align-items:center;transition:color 0.2s}.cg-copy-btn:hover{color:#1a73e8}.cg-copy-btn .material-symbols-outlined{font-size:16px}.cg-follow-up-action{color:#1a73e8;cursor:pointer;font-weight:500;text-decoration:none}.cg-follow-up-action:hover{text-decoration:underline}.cg-follow-up-date{line-height:1!important;color:#202124;font-weight:500;cursor:pointer;margin-top:5px;display:inline-block}.cg-follow-up-date:hover{color:#1a73e8;text-decoration:underline}.cg-action-link{color:#1a73e8;cursor:pointer;font-weight:500;text-decoration:none}.cg-action-link:hover{text-decoration:underline}.cg-row-actions{display:flex;align-items:center;gap:2px;margin-left:auto}.cg-action-btn{background:none;border:none;padding:6px;border-radius:50%;cursor:pointer;color:#5f6368;display:flex;align-items:center;justify-content:center;transition:all 0.2s}.cg-action-btn:hover{background-color:#f1f3f4;color:#1a73e8}.cg-action-btn.remove:hover{background-color:#fce8e6;color:#d93025}.cg-action-btn .material-symbols-outlined{font-size:18px}.cg-icon-btn:hover{color:#1a73e8!important}.cg-form-group{margin-bottom:14px;width:100%;box-sizing:border-box}.cg-form-label{font-size:11px;color:#3c4043;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:6px;display:flex;align-items:center;gap:4px}.cg-select,.cg-input{width:100%;padding:8px 12px;border:1px solid #dadce0;border-radius:8px;background:#fff;color:#202124;font-size:13px;box-sizing:border-box;font-family:'Google Sans',Roboto,sans-serif;transition:border-color 0.2s,box-shadow 0.2s;margin-bottom:6px}.cg-select:focus,.cg-input:focus{border-color:#1a73e8;outline:none;box-shadow:0 0 0 2px rgba(26,115,232,0.2)}.cg-checkbox-group{display:flex;flex-direction:column;gap:6px;background:#f8f9fa;padding:8px 12px;border-radius:8px;border:1px solid #e8eaed;margin-top:4px}.cg-checkbox-label{display:flex;align-items:center;gap:8px;font-size:13px;color:#3c4043;cursor:pointer;font-weight:500;user-select:none}.cg-checkbox-label input[type="checkbox"]{width:16px;height:16px;accent-color:#1a73e8;cursor:pointer;margin:0}.cg-segmented-control{display:flex;background:#f1f3f4;padding:4px;border-radius:10px;gap:4px;margin-top:4px;margin-bottom:8px}.cg-segmented-label{flex:1;display:flex;align-items:center;justify-content:center;padding:8px 12px;border-radius:8px;color:#5f6368;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s cubic-bezier(0.4,0,0.2,1);text-align:center;user-select:none}.cg-segmented-label:hover{color:#202124}.cg-segmented-label:has(input:checked){background:#fff;color:#1a73e8;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.1)}.cg-segmented-label input{position:absolute;opacity:0;pointer-events:none}.cg-btn{padding:8px 16px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s cubic-bezier(0.4,0,0.2,1);font-family:'Google Sans',Roboto,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%;box-sizing:border-box;margin-bottom:6px;box-shadow:0 1px 2px rgba(60,64,67,0.15);color:#fff!important}.cg-btn .material-symbols-outlined{color:inherit!important}.cg-btn-primary{background:#1a73e8}.cg-btn-primary:hover{background:#1557b0;box-shadow:0 2px 4px rgba(26,115,232,0.3);transform:translateY(-1px)}.cg-btn-success{background:#188038}.cg-btn-success:hover{background:#137333;box-shadow:0 2px 4px rgba(24,128,56,0.3);transform:translateY(-1px)}.cg-btn-danger{background:#d93025}.cg-btn-danger:hover{background:#c5221f;box-shadow:0 2px 4px rgba(217,48,37,0.3);transform:translateY(-1px)}.cg-btn:active{transform:translateY(0);box-shadow:0 1px 1px rgba(60,64,67,0.15)}.cg-case-item-card{background:#fff;border-bottom:1px solid #e8eaed;padding:14px 16px;transition:background 0.2s}.cg-case-item-card:hover{background:#f8f9fa}</style>`;
			this.container.innerHTML =
				styles +
				'<div class="cg-app-container"><div id="case-qplus-list" class="cg-info-list"></div></div>';
			this.listContainer =
				this.container.querySelector("#case-qplus-list");
		}

		async updateContent() {
			if (!this.listContainer) return;

			const storageObj = await ExtensionStorage.get();

			const dt = new Date();
			const day = String(dt.getDate()).padStart(2, "0");
			const month = String(dt.getMonth() + 1).padStart(2, "0");
			const hrs = String(dt.getHours()).padStart(2, "0");
			const mins = String(dt.getMinutes()).padStart(2, "0");
			const secs = String(dt.getSeconds()).padStart(2, "0");
			const lastUpdatedText = `${day}/${month} ${hrs}:${mins}:${secs}`;

			const formatDDMMYYYY = (dStr) => {
				if (!dStr) return "";
				if (dStr.includes("-")) {
					const p = dStr.split("-");
					if (p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`;
				}
				return dStr;
			};

			const getComparableDate = (dStr) => {
				if (!dStr || dStr === "N/A") return "9999-99-99";
				if (dStr.includes("-")) {
					const p = dStr.split("-");
					if (p[0].length === 4) return dStr;
					if (p[2] && p[2].length === 4)
						return `${p[2]}-${p[1]}-${p[0]}`;
				}
				return "9999-99-99";
			};

			const cases = [];
			Object.keys(storageObj).forEach((caseId) => {
				const fullCase = storageObj[caseId];
				if (
					fullCase &&
					typeof fullCase === "object" &&
					caseId !== "casedata"
				) {
					const casedata = fullCase.casedata || {};
					const fields = ExtensionStorage.extractCaseFields(
						fullCase,
						casedata,
					);
					cases.push({
						caseId,
						state: fields.state,
						followUpDate: formatDDMMYYYY(fields.followUpDate),
						rawFollowUpDate: fields.followUpDate,
						followUpStatus: fields.followUpStatus,
						lastEmail:
							formatDDMMYYYY(fields.lastEmail) ||
							fields.lastEmail,
						lastNote:
							formatDDMMYYYY(fields.lastNote) || fields.lastNote,
						timeMicros:
							fields.latestSample?.metadata?.createTimeMicros ||
							0,
					});
				}
			});

			cases.sort((a, b) => {
				const dateA = getComparableDate(a.rawFollowUpDate);
				const dateB = getComparableDate(b.rawFollowUpDate);
				if (dateA !== dateB) {
					return dateA.localeCompare(dateB);
				}
				return b.timeMicros - a.timeMicros;
			});
			this._cachedCases = cases;

			const hasFilter =
				this.currentFilter &&
				((this.currentFilter.date &&
					this.currentFilter.date.toLowerCase() !== "all") ||
					this.currentFilter.state ||
					this.currentFilter.subStatus);

			const todayDDMMYYYY = `${day}-${month}-${dt.getFullYear()}`;

			let qplusHTML = `<div class="cg-qplus-container" style="padding:8px 0;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:0 16px;"><span style="font-size:11px;color:#70757a;font-weight:500;user-select:none;">Last update: <span style="color:#202124;font-weight:600;">${lastUpdatedText}</span></span><div style="display:flex;align-items:center;gap:4px;"><button id="btn-qplus-refresh" class="cg-icon-btn" title="Refresh Cases" style="background:none;border:none;cursor:pointer;color:#5f6368;padding:4px;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined" style="font-size:20px;">refresh</span></button><button id="btn-qplus-filter" class="cg-icon-btn" title="Filter Cases" style="background:none;border:none;cursor:pointer;color:${hasFilter ? "#1a73e8" : "#5f6368"};padding:4px;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined" style="font-size:20px;">filter_list</span></button></div></div>`;

			let displayCases = cases;
			if (hasFilter) {
				const d = (this.currentFilter.date || "").toLowerCase();
				const s = (this.currentFilter.state || "").toLowerCase();
				const ss = (this.currentFilter.subStatus || "").toLowerCase();
				displayCases = cases.filter((item) => {
					const matchDate =
						!d ||
						d === "all" ||
						(item.followUpDate &&
							item.followUpDate.toLowerCase() === d);
					const matchState =
						!s ||
						(item.state && item.state.toLowerCase().includes(s));
					const matchSubStatus =
						!ss ||
						(item.followUpStatus &&
							item.followUpStatus.toLowerCase().includes(ss));
					return matchDate && matchState && matchSubStatus;
				});
			}

			if (displayCases.length === 0) {
				qplusHTML += `<div class="cg-state-view" style="padding:32px 16px;text-align:center;"><span class="material-symbols-outlined" style="font-size:48px;margin-bottom:16px;color:#dadce0;user-select:none;">content_paste_search</span><div class="cg-empty-title" style="color:#5f6368;">${hasFilter ? "No matching cases found" : "No cases detected"}</div><div class="cg-empty-sub" style="color:#70757a;">${hasFilter ? "Try adjusting your filter keywords." : "Crawled cases from Gauge will appear here."}</div></div>`;
			} else {
				displayCases.forEach((item) => {
					let stateBadge = `<span class="cg-badge" style="background-color:#e8f0fe;color:#1a73e8;">${item.state}</span>`;
					if (
						item.state.toLowerCase().includes("solved") ||
						item.state.toLowerCase().includes("closed") ||
						item.state.toLowerCase().includes("done") ||
						item.state.toLowerCase().includes("implemented")
					) {
						stateBadge = `<span class="cg-badge" style="background-color:#e6f4ea;color:#137333;">${item.state}</span>`;
					} else if (
						item.state.toLowerCase().includes("action") ||
						item.state.toLowerCase().includes("progress") ||
						item.state.toLowerCase().includes("open")
					) {
						stateBadge = `<span class="cg-badge" style="background-color:#fef7e0;color:#b06000;">${item.state}</span>`;
					}

					const cardBgStyle =
						item.followUpDate === todayDDMMYYYY
							? "background-color:#e6f4ea;border-color:#ceead6;"
							: "";

					const lastEmailRow =
						item.lastEmail &&
						item.lastEmail !== "N/A" &&
						item.lastEmail !== "undefined"
							? `<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;"><span style="color:#5f6368;font-weight:500;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:16px;color:#5f6368;">mail</span> Last Email:</span><span style="color:#202124;font-weight:500;">${item.lastEmail}</span></div>`
							: "";

					const lastNoteRow =
						item.lastNote &&
						item.lastNote !== "N/A" &&
						item.lastNote !== "undefined"
							? `<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;"><span style="color:#5f6368;font-weight:500;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:16px;color:#5f6368;">edit_note</span> Last Note:</span><span style="color:#202124;font-weight:500;">${item.lastNote}</span></div>`
							: "";

					qplusHTML += `<div class="cg-case-item-card" style="${cardBgStyle}"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><div class="cg-case-id clickable-case-id" data-case-id="${item.caseId}" title="Click to copy Case ID" style="cursor:pointer;font-weight:500;color:#1a73e8;font-size:15px;">${item.caseId}</div>${stateBadge}</div><div style="display:flex;flex-direction:column;gap:6px;"><div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;"><span style="color:#5f6368;font-weight:500;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:16px;color:#5f6368;">calendar_month</span> Follow Up Date:</span><span style="color:#202124;font-weight:500;">${item.followUpDate}</span></div><div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;"><span style="color:#5f6368;font-weight:500;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:16px;color:#5f6368;">label</span> Sub Status:</span><span style="color:#202124;font-weight:500;">${item.followUpStatus}</span></div>${lastEmailRow}${lastNoteRow}</div></div>`;
				});
			}
			qplusHTML += `</div>`;

			const s = CrawlerConfig.settings;
			const cats = s.categories || ["live_transfer"];
			const tMode = s.timeMode || "preset";

			const settingsHTML = `<div class="cg-settings-container" style="padding:16px;max-width:100%;box-sizing:border-box;"><div class="cg-form-group"><label class="cg-form-label">1. Select Category</label><div class="cg-checkbox-group"><label class="cg-checkbox-label"><input type="checkbox" name="qplus-cat" value="live_transfer" ${cats.includes("live_transfer") ? "checked" : ""}> Live Transfer</label><label class="cg-checkbox-label"><input type="checkbox" name="qplus-cat" value="shopping" ${cats.includes("shopping") ? "checked" : ""}> Shopping</label><label class="cg-checkbox-label"><input type="checkbox" name="qplus-cat" value="lead_gen" ${cats.includes("lead_gen") ? "checked" : ""}> Lead Gen</label><label class="cg-checkbox-label"><input type="checkbox" name="qplus-cat" value="tag_case" ${cats.includes("tag_case") ? "checked" : ""}> Tag Case</label></div></div><div class="cg-form-group"><label class="cg-form-label">2. Time Range</label><div class="cg-segmented-control"><label class="cg-segmented-label"><input type="radio" name="qplus-time-mode" value="preset" ${tMode === "preset" ? "checked" : ""}> Preset Range</label><label class="cg-segmented-label"><input type="radio" name="qplus-time-mode" value="custom" ${tMode === "custom" ? "checked" : ""}> Custom Range</label></div><div id="qplus-preset-group" style="margin-top:8px;${tMode === "preset" ? "display:block;" : "display:none;"}"><select id="qplus-preset-days" class="cg-select"><option value="14" ${s.presetDays === "14" ? "selected" : ""}>Last 14 days</option><option value="30" ${s.presetDays === "30" ? "selected" : ""}>Last 30 days</option><option value="90" ${s.presetDays === "90" ? "selected" : ""}>Last 90 days</option></select><div id="qplus-preset-hint" style="font-size:11px;color:#1a73e8;margin-top:4px;font-weight:500;padding-left:4px;"></div></div><div id="qplus-custom-group" style="margin-top:8px;flex-direction:column;gap:8px;${tMode === "custom" ? "display:flex;" : "display:none;"}"><div><label class="cg-form-label" style="font-size:10px;color:#5f6368;">Start Date</label><input type="date" id="qplus-start-date" class="cg-input" value="${s.startDate || ""}"></div><div><label class="cg-form-label" style="font-size:10px;color:#5f6368;">End Date</label><input type="date" id="qplus-end-date" class="cg-input" value="${s.endDate || ""}"></div></div></div><div class="cg-form-group"><label class="cg-form-label">Crawl Parameters</label><div style="display:flex;gap:8px;margin-top:4px;"><div style="flex:1;"><label class="cg-form-label" style="font-size:10px;color:#5f6368;">Page Size</label><input type="number" id="qplus-page-size" class="cg-input" value="${s.pageSize !== undefined ? s.pageSize : 50}"></div><div style="flex:1;"><label class="cg-form-label" style="font-size:10px;color:#5f6368;">Delay (ms)</label><input type="number" id="qplus-delay-ms" class="cg-input" value="${s.delayMs !== undefined ? s.delayMs : 0}"></div></div></div><div class="cg-form-group"><label class="cg-form-label">Auth & LDAP</label><div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;"><div><label class="cg-form-label" style="font-size:10px;color:#5f6368;">LDAP</label><input type="text" id="qplus-ldap" class="cg-input" value="${s.ldap || ""}" disabled style="margin:0;background:#f1f3f4;color:#5f6368;"></div><div><label class="cg-form-label" style="font-size:10px;color:#5f6368;">Auth Token (at)</label><input type="text" id="qplus-at-token" class="cg-input" value="${s.atToken || ""}" disabled style="margin:0;background:#f1f3f4;color:#5f6368;font-family:monospace;font-size:11px;"></div><div style="margin-top:4px;"><button id="btn-update-token" class="cg-btn cg-btn-success" style="margin:0;display:${s.atToken ? "inline-flex" : "none"};"><span class="material-symbols-outlined" style="font-size:16px;">autorenew</span> Refresh Auth</button><a id="btn-get-token" href="https://gauge.corp.google.com/" target="_blank" class="cg-btn cg-btn-primary" style="margin:0;text-decoration:none;display:${s.atToken ? "none" : "inline-flex"};"><span class="material-symbols-outlined" style="font-size:16px;">open_in_new</span> Get Auth</a></div></div></div><div class="cg-form-group" style="margin-top:16px;border-top:1px solid #e8eaed;padding-top:14px;"><label class="cg-form-label" style="color:#d93025;margin-bottom:10px;">Storage Management</label><div style="display:flex;gap:8px;"><button id="btn-copy-data" class="cg-btn cg-btn-primary" style="flex:1;margin:0;"><span class="material-symbols-outlined" style="font-size:16px;">content_copy</span> Copy All</button><button id="btn-clear-data" class="cg-btn cg-btn-danger" style="flex:1;margin:0;"><span class="material-symbols-outlined" style="font-size:16px;">delete</span> Clear All</button></div></div></div>`;

			this.listContainer.innerHTML = "";

			if (typeof MaterialTabGroup !== "undefined") {
				const tabGroup = new MaterialTabGroup(this.listContainer);

				const qplusEl = document.createElement("div");
				qplusEl.innerHTML = qplusHTML;
				this.bindQplusEvents(qplusEl);

				const settingsEl = document.createElement("div");
				settingsEl.innerHTML = settingsHTML;
				this.bindSettingsEvents(settingsEl);

				tabGroup.addTab("Qplus", qplusEl);
				tabGroup.addTab("Settings", settingsEl);

				tabGroup.onTabChange = (index) => {
					this.activeTabIndex = index;
				};

				tabGroup.setActiveTab(this.activeTabIndex);
			} else {
				this.listContainer.innerHTML = qplusHTML;
				this.bindQplusEvents(this.listContainer);
			}
			if (typeof EventBus !== "undefined" && EventBus.emit) {
				const refreshPayload = {
					cases: this._cachedCases || [],
				};
				console.log(
					`[CaseGauge] Emitting GAUGE_DATA_REFRESHED via EventBus (${refreshPayload.cases.length} cases):`,
					refreshPayload,
				);
				if (typeof Debug !== "undefined" && Debug.log) {
					Debug.log(
						`[CaseGauge] Emitting GAUGE_DATA_REFRESHED (${refreshPayload.cases.length} cases)`,
					);
				}
				EventBus.emit("GAUGE_DATA_REFRESHED", refreshPayload);
			} else {
				console.warn(
					"[CaseGauge] EventBus not available when attempting to emit GAUGE_DATA_REFRESHED",
				);
				if (typeof Debug !== "undefined" && Debug.warn) {
					Debug.warn(
						"[CaseGauge] EventBus not available when attempting to emit GAUGE_DATA_REFRESHED",
					);
				}
			}
		}

		bindQplusEvents(container) {
			container.querySelectorAll(".clickable-case-id").forEach((el) => {
				el.addEventListener("click", (e) => {
					e.stopPropagation();
					const cid = el.getAttribute("data-case-id");
					if (cid && ClipboardUtils.copy(cid)) {
						if (this.toast)
							this.toast.show(`Copied Case ID: ${cid}`);
					}
				});
			});

			const refreshBtn = container.querySelector("#btn-qplus-refresh");
			if (refreshBtn) {
				refreshBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					console.log(
						"[CaseGauge] Refresh button clicked! Fetching latest storage data and re-emitting...",
					);
					if (typeof Debug !== "undefined" && Debug.log) {
						Debug.log(
							"[CaseGauge] Refresh button clicked! Fetching latest storage data and re-emitting...",
						);
					}
					this.updateContent();
					if (this.toast)
						this.toast.show("Refreshed cases from storage");
				});
			}

			const filterBtn = container.querySelector("#btn-qplus-filter");
			if (filterBtn) {
				filterBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					if (typeof CCModal !== "undefined") {
						const allCases = this._cachedCases || [];
						const stateOps = Array.from(
							new Set(
								allCases.map((c) => c.state).filter(Boolean),
							),
						).sort();
						const subStatusOps = Array.from(
							new Set(
								allCases
									.map((c) => c.followUpStatus)
									.filter(Boolean),
							),
						).sort();

						CCModal.show({
							title: "Filter Cases",
							fields: [
								{
									id: "date",
									label: "1. Date Filter",
									type: "date",
									value: this.currentFilter.date,
									placeholder: "All or YYYY-MM-DD",
									hasQuickPresets: true,
								},
								{
									id: "state",
									label: "2. Case State",
									type: "select",
									value: this.currentFilter.state,
									options: stateOps,
									defaultOptionLabel: "All",
								},
								{
									id: "subStatus",
									label: "3. Sub Status",
									type: "select",
									value: this.currentFilter.subStatus,
									options: subStatusOps,
									defaultOptionLabel: "All",
								},
							],
							onApply: (res) => {
								this.currentFilter = res;
								try {
									localStorage.setItem(
										"case_gauge_qplus_filter",
										JSON.stringify(res),
									);
								} catch (e) {}
								this.updateContent();
								if (this.toast)
									this.toast.show("Filter applied");
							},
							onClear: () => {
								this.currentFilter = {
									date: "All",
									state: "",
									subStatus: "",
								};
								try {
									localStorage.removeItem(
										"case_gauge_qplus_filter",
									);
								} catch (e) {}
								this.updateContent();
								if (this.toast)
									this.toast.show("Filter reset to All");
							},
							onCancel: () => {},
						});
					}
				});
			}
		}

		bindSettingsEvents(container) {
			const catCheckboxes = container.querySelectorAll(
				'input[name="qplus-cat"]',
			);
			const timeModeRadios = container.querySelectorAll(
				'input[name="qplus-time-mode"]',
			);
			const presetDaysEl = container.querySelector("#qplus-preset-days");
			const startDateEl = container.querySelector("#qplus-start-date");
			const endDateEl = container.querySelector("#qplus-end-date");
			const pageSizeEl = container.querySelector("#qplus-page-size");
			const delayMsEl = container.querySelector("#qplus-delay-ms");
			const ldapEl = container.querySelector("#qplus-ldap");
			const atTokenEl = container.querySelector("#qplus-at-token");
			const updateTokenBtn = container.querySelector("#btn-update-token");
			const getTokenBtn = container.querySelector("#btn-get-token");
			const copyDataBtn = container.querySelector("#btn-copy-data");
			const clearDataBtn = container.querySelector("#btn-clear-data");
			const presetGroup = container.querySelector("#qplus-preset-group");
			const customGroup = container.querySelector("#qplus-custom-group");
			const presetHint = container.querySelector("#qplus-preset-hint");

			const updatePresetHint = () => {
				if (!presetHint || !presetDaysEl) return;
				const days = parseInt(presetDaysEl.value) || 14;
				const preset = CrawlerConfig.getPresetDates(days);
				presetHint.innerText = preset.displayStr;
			};
			updatePresetHint();

			const saveCurrent = () => {
				const selectedMode = container.querySelector(
					'input[name="qplus-time-mode"]:checked',
				);
				const selectedCats = Array.from(
					container.querySelectorAll(
						'input[name="qplus-cat"]:checked',
					),
				).map((cb) => cb.value);
				const newSettings = {
					fetchMode: "extension",
					delayMs: delayMsEl ? parseInt(delayMsEl.value) || 0 : 0,
					categories:
						selectedCats.length > 0
							? selectedCats
							: ["live_transfer"],
					timeMode: selectedMode ? selectedMode.value : "preset",
					presetDays: presetDaysEl ? presetDaysEl.value : "14",
					startDate: startDateEl ? startDateEl.value : "",
					endDate: endDateEl ? endDateEl.value : "",
					pageSize: pageSizeEl
						? parseInt(pageSizeEl.value) || 50
						: 50,
					ldap: ldapEl ? ldapEl.value : "",
					atToken: atTokenEl ? atTokenEl.value : "",
				};
				CrawlerConfig.saveSettings(newSettings);
				if (this.toast) this.toast.show("Settings saved");
			};

			catCheckboxes.forEach((cb) =>
				cb.addEventListener("change", saveCurrent),
			);
			timeModeRadios.forEach((r) =>
				r.addEventListener("change", () => {
					if (r.value === "preset") {
						if (presetGroup) presetGroup.style.display = "block";
						if (customGroup) customGroup.style.display = "none";
						updatePresetHint();
					} else {
						if (presetGroup) presetGroup.style.display = "none";
						if (customGroup) customGroup.style.display = "flex";
					}
					saveCurrent();
				}),
			);

			if (presetDaysEl)
				presetDaysEl.addEventListener("change", () => {
					updatePresetHint();
					saveCurrent();
				});
			if (startDateEl)
				startDateEl.addEventListener("change", saveCurrent);
			if (endDateEl) endDateEl.addEventListener("change", saveCurrent);
			if (pageSizeEl) pageSizeEl.addEventListener("change", saveCurrent);
			if (delayMsEl) delayMsEl.addEventListener("change", saveCurrent);
			if (ldapEl) ldapEl.addEventListener("input", saveCurrent);
			if (atTokenEl) atTokenEl.addEventListener("input", saveCurrent);

			if (updateTokenBtn)
				updateTokenBtn.addEventListener("click", async (e) => {
					e.stopPropagation();
					try {
						const extSaved = await ExtensionStorage._sendMessage(
							"STORAGE_GET",
							"gauge_crawler_settings",
						);
						const data = extSaved?.data
							? typeof extSaved.data === "string"
								? JSON.parse(extSaved.data)
								: extSaved.data
							: null;
						let token = data?.atToken;
						let ldap = data?.ldap;

						if (token) {
							CrawlerConfig.settings.atToken = token;
							if (ldap) CrawlerConfig.settings.ldap = ldap;
							if (atTokenEl) atTokenEl.value = token;
							if (ldapEl && ldap) ldapEl.value = ldap;
							if (updateTokenBtn)
								updateTokenBtn.style.display = "inline-flex";
							if (getTokenBtn) getTokenBtn.style.display = "none";
							CrawlerConfig.saveSettings(CrawlerConfig.settings);
							if (this.toast)
								this.toast.show(
									"Auth Token & LDAP updated from Gauge settings!",
								);
						} else {
							if (updateTokenBtn)
								updateTokenBtn.style.display = "none";
							if (getTokenBtn)
								getTokenBtn.style.display = "inline-flex";
							if (this.toast)
								this.toast.show(
									"Token not found in storage. Please click 'Get Auth' to log in to Gauge.",
								);
						}
					} catch (err) {
						if (this.toast)
							this.toast.show(
								"Error updating Token: " + err.message,
							);
					}
				});

			if (copyDataBtn)
				copyDataBtn.addEventListener("click", async (e) => {
					e.stopPropagation();
					try {
						const storageObj = await ExtensionStorage.get();
						const jsonStr = JSON.stringify(storageObj, null, 2);
						if (ClipboardUtils.copy(jsonStr)) {
							if (this.toast)
								this.toast.show(
									"Copied all data to clipboard!",
								);
						}
					} catch (err) {
						if (this.toast)
							this.toast.show(
								"Failed to copy data: " + err.message,
							);
					}
				});

			if (clearDataBtn)
				clearDataBtn.addEventListener("click", async (e) => {
					e.stopPropagation();
					if (
						confirm(
							"Are you sure you want to clear all saved case data? This action cannot be undone.",
						)
					) {
						await ExtensionStorage.remove();
						if (this.toast)
							this.toast.show(
								"All case data cleared successfully.",
							);
						this.updateContent();
					}
				});
		}
	}
	const a = new CaseQplusApp();
})();
