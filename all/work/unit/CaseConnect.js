(() => {
    "use strict";
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
            } catch {}
    };

    const toSafeHTML = (html) => {
        if (!G.tt) {
            const pass = { createHTML: (s) => s };
            for (const name of ["omnitool", "default"])
                try {
                    G.tt ||= window.trustedTypes?.createPolicy?.(name, pass);
                } catch {}
            G.tt ||= window.trustedTypes?.defaultPolicy || pass;
        }
        return G.tt.createHTML(html);
    };

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const $ = (s, p = document) => p.querySelector(s);
    const $$ = (s, p = document) => [...p.querySelectorAll(s)];
    const isoDate = (d = new Date()) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

    const el = (tag, { parent, onClick, style, text, html, ...props } = {}) => {
        const node = Object.assign(document.createElement(tag), props);
        if (text !== undefined) node.textContent = text;
        if (html !== undefined) node.innerHTML = toSafeHTML(html);
        if (style) node.style.cssText = style;
        if (onClick) node.addEventListener("click", onClick);
        parent?.appendChild(node);
        return node;
    };

    const waitFor = async (sel, ms = 5000) => {
        for (let t = 0; t < ms; t += 100) {
            const found = $(sel);
            if (found) return found;
            await sleep(100);
        }
        throw new Error(`Timeout: ${sel}`);
    };

    const isVisible = (n) => {
        if (
            !n ||
            !(
                n.checkVisibility?.({
                    checkOpacity: true,
                    checkVisibilityCSS: true,
                }) ?? n.offsetParent !== null
            )
        )
            return false;
        const r = n.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };

    const getVisibleCaseNote = () => {
        const visible = $$('[aria-label="Case Note"]').filter(isVisible);
        const top = visible.filter((n) => {
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
        return (
            (top.length ? top : visible).sort(
                (a, b) =>
                    a.getBoundingClientRect().top -
                    b.getBoundingClientRect().top,
            )[0] || null
        );
    };

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

    const norm = (s) =>
        String(s ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    const matchTaskType = (raw) => {
        const r = norm(raw);
        if (!r) return "";
        if (r === "na") return "NA";
        if (r === "ads enhanced conversions")
            return "Ads - Enhanced Conversions for Web (ECW)";
        return (
            TASK_TYPES.find((t) => {
                if (t === "NA") return false;
                const nt = norm(t.replace(/\(.*?\)/g, ""));
                return (
                    norm(t) === r ||
                    nt === r ||
                    nt.includes(r) ||
                    r.includes(nt)
                );
            }) || String(raw ?? "").trim()
        );
    };
    const isEcTask = (s) =>
        Boolean(
            s && s !== "NA" && /enhanced conversion|\becw\b|\becl\b/i.test(s),
        );

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
                    "IN - Instruction Share",
                    "IN - Not Reachable",
                    "IN - Not Interested",
                    "In - Not Ready",
                    "IN - Infeasible",
                    "IN - Out of Scope",
                ],
            ],
        ],
        1: ["AS - Reschedule 1", ["NI - Attempted Contact", "ATTEMPT_CONTACT"]],
        2: [
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
        ],
        5: [["NI - Awaiting Validation (Enhanced Conversion)", "EC"]],
    };
    STEP_OPTIONS[3] = STEP_OPTIONS[2];

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
                "Tested with Tag Assistant and Real time in GA4",
                ...GA4_COMMENTS,
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
    };

    const TD_STYLE =
        "border:1pt solid #000;vertical-align:top;padding:5pt;overflow:hidden;word-break:break-word;box-sizing:border-box;";
    const FONT_STYLE =
        "font-size:11pt;font-family:'Google Sans',sans-serif;color:#000;white-space:pre-wrap;";
    const g = (s) => `<span style="color:#188038;">${s}</span>`;
    const head = (title) =>
        `<tr style="height:21pt"><td colspan="2" style="${TD_STYLE}background:#fff2cc;text-align:center;"><span style="${FONT_STYLE}font-weight:700;">${title}</span> <span style="${FONT_STYLE}font-style:italic;">(Mandatory)</span></td></tr>`;
    const row = (lbl, desc, val = "NA", bg = "", attr = "") =>
        `<tr${attr} style="height:21pt"><td style="${TD_STYLE}width:30%;"><span style="${FONT_STYLE}${bg ? `background:${bg};` : ""}font-weight:700;">${lbl}</span><span class="qm-del-row" data-del-row="1" contenteditable="false" title="Delete row" style="float:right;cursor:pointer;color:#c92a2a;background:#ffe3e3;font-weight:700;font-size:10pt;line-height:1;padding:1px 5px;border-radius:4px;margin-left:4px;user-select:none;">✕</span>${desc ? `<div style="font-size:9.5pt;font-family:'Google Sans',sans-serif;color:#5f6368;margin-top:2px;line-height:1.25;">${desc}</div>` : ""}</td><td style="${TD_STYLE}width:70%;"><span style="${FONT_STYLE}${bg ? `background:${bg};` : ""}">${val}</span></td></tr>`;

    const parseDate = (val) => {
        if (!val) return null;
        if (+val > 1e11) return new Date(+val);
        const p = String(val).match(/\d+/g);
        return p?.length >= 3
            ? new Date(
                  p[0].length === 4 ? +p[0] : +p[2],
                  +p[1] - 1,
                  p[0].length === 4 ? +p[2] : +p[0],
              )
            : null;
    };
    const currentFollowUp = () => {
        const val = $('[data-infocase="follow_up_time"]')?.dataset?.valchoice;
        if (!val || val === "Finish") return "NA";
        const d = parseDate(val);
        return d && !isNaN(d) ? isoDate(d) : val;
    };
    const isAppt5DaysBefore = () => {
        const apptEl = $('[data-infocase="appointment_time"]');
        const apptDate = parseDate(
            apptEl?.dataset?.valchoice || apptEl?.innerText,
        );
        const flupVal = currentFollowUp();
        const flupDate = (flupVal !== "NA" && parseDate(flupVal)) || new Date();
        const d0 = (d) => new Date(d).setHours(0, 0, 0, 0);
        return Boolean(
            apptDate &&
            !isNaN(apptDate) &&
            Math.round((d0(flupDate) - d0(apptDate)) / 864e5) >= 5,
        );
    };
    const scrapeSpeakeasyIds = () =>
        [
            ...new Set(
                [
                    ...document.body.textContent.matchAll(
                        /Speakeasy session ID:\s*(P\d+)/gi,
                    ),
                ].map((m) => m[1]),
            ),
        ].join(", ") || "NA";
    const scrapeDomTasks = () => {
        const els = $$(".form-label")
            .filter((l) =>
                /^(Appointment tasks|Case Summary)$/i.test(
                    l.textContent.trim(),
                ),
            )
            .flatMap((l) => [
                ...(l.parentElement?.querySelectorAll(
                    "sanitized-content, [debug-id='html-value']",
                ) || []),
            ]);
        return [
            ...new Set(
                els
                    .map((e) => matchTaskType(e.textContent))
                    .filter((t) => t && t !== "NA"),
            ),
        ].join(", ");
    };

    const ecRowsHTML = (is5Days = isAppt5DaysBefore()) => {
        const ecRow = (lbl, desc, kind = "1") =>
            row(lbl, desc, "NA", "", ` data-ec-row="${kind}"`);
        return (
            ecRow(
                "Google Ads EC Settings: (Only for ECW)",
                `[Attach screenshot showing ${g("Turn on enhanced conversions")} enabled and method selected (${g("Google tag")} or ${g("GTM")}); or ${g("NA")}]`,
            ) +
            ecRow(
                "Customer Data Terms Accepted: (Only for ECW)",
                `[Attach screenshot showing Customer Data Terms accepted in Google Ads; or ${g("NA")}]`,
            ) +
            ecRow(
                `Error-Free ${g("em")} Parameter OR ${g("ecsid")} PII Stitching: (Only for ECW)`,
                `[Attach Tag Assistant / Network payload screenshot showing ${g("em")} parameter with a valid SHA-256 hash (${g("em=tv.1~em.&lt;sha256&gt;")}, must NOT be ${g("em.e0")}); OR if PII is stitched across pages, attach 2 screenshots showing matching ${g("ecsid")} between upstream PII event and downstream conversion event; or ${g("NA")}]`,
            ) +
            (is5Days
                ? ecRow(
                      "Tag Diagnostics / EC Qualdash: (only for ECW)",
                      `[Attach Day 7 Google Ads Tag Diagnostics screenshot showing ${g('"Recording enhanced conversions"')} (Excellent status, no major alerts) and/or ${g("EC Qualdash WAI")}; or ${g("NA")}]`,
                      "diag",
                  )
                : "")
        );
    };

    const syncEcRows = (tbl, taskText) => {
        const tbody = tbl?.tBodies?.[0] || tbl;
        if (!tbody) return;
        for (const tr of $$("tr", tbody)) {
            if (
                tr.dataset.ecRow ||
                /\(only for ecw\)/i.test(tr.cells?.[0]?.textContent || "")
            )
                tr.remove();
        }
        if (isEcTask(taskText)) {
            const html = toSafeHTML(ecRowsHTML());
            tbody.lastElementChild
                ? tbody.lastElementChild.insertAdjacentHTML("beforebegin", html)
                : tbody.insertAdjacentHTML("beforeend", html);
        }
    };

    const promptCaseType = (daysOffset) =>
        new Promise((resolve) => {
            $("#qm-modal-overlay")?.remove();
            const rootOpts = STEP_OPTIONS[daysOffset];
            if (!rootOpts) return resolve(null);
            const overlay = el("div", {
                id: "qm-modal-overlay",
                parent: document.body,
                style: "position:fixed;inset:0;background:rgba(0,0,0,0.15);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:2147483647;",
            });
            const modal = el("div", {
                parent: overlay,
                style: "background:#FFF;border-radius:16px;padding:22px;width:320px;box-shadow:0 16px 36px rgba(0,0,0,0.12);text-align:center;border:1px solid rgba(0,0,0,0.05);max-height:85vh;overflow-y:auto;",
            });
            const close = (val) => {
                overlay.remove();
                resolve(val);
            };
            cleanups.push(() => close(null));

            const render = (title, items, backFn) => {
                modal.textContent = "";
                el("div", {
                    text: title,
                    parent: modal,
                    style: "font-size:18px;font-weight:700;color:#1D1D1F;margin-bottom:4px;",
                });
                el("div", {
                    text: "Choose sub-status:",
                    parent: modal,
                    style: "font-size:14px;color:#86868B;margin-bottom:18px;",
                });
                const actions = el("div", {
                    parent: modal,
                    style: "display:flex;flex-direction:column;gap:8px;",
                });
                const btns = items.map((item, i) => {
                    const [label, val] = Array.isArray(item)
                        ? item
                        : [item, item];
                    return [
                        label,
                        ...PALETTE[i % PALETTE.length],
                        () =>
                            Array.isArray(val)
                                ? render(label, val, () =>
                                      render(
                                          `Options for ${daysOffset} Day(s)`,
                                          rootOpts,
                                      ),
                                  )
                                : close(val),
                    ];
                });
                btns.push(
                    backFn
                        ? ["← Back", "#F1F3F5", "#495057", backFn]
                        : [
                              "Skip / Keep Default",
                              "#F1F3F5",
                              "#495057",
                              () => close(null),
                          ],
                );
                for (const [label, bg, color, onClick] of btns) {
                    el("button", {
                        text: label,
                        parent: actions,
                        style: `padding:10px 14px;border-radius:10px;border:none;font-size:16px;font-weight:600;cursor:pointer;background:${bg};color:${color};`,
                        onClick,
                    });
                }
            };
            render(`Options for ${daysOffset} Day(s)`, rootOpts);
        });

    const buildNoteTemplateHTML = (
        templateKey,
        verifiedTags = "",
        domTasks = scrapeDomTasks(),
    ) => {
        const is5Days = isAppt5DaysBefore();
        let cfg =
            NOTE_TEMPLATES[templateKey] ||
            (templateKey?.startsWith("SO - ")
                ? {
                      subStatus: templateKey,
                      subStatusReason: "Implement Ads Conversion Tracking",
                      taskTypes: "Ads - Conversion Tracking",
                      tagsImplemented: "Ads Conversion Tracking",
                      comments: [
                          "Implemented Google Ads conversions for { Hotline / Zalo / Purchase / Form } via GTM / Gtag",
                          "Tested with Tag Assistant",
                          "No recent conversions",
                          ...BASE_COMMENTS,
                      ],
                  }
                : templateKey
                  ? { subStatus: templateKey }
                  : null);

        if (
            cfg &&
            is5Days &&
            isEcTask(domTasks) &&
            /^SO - (Implementation|Troubleshooting|Education) Only$/.test(
                cfg.subStatus,
            )
        ) {
            cfg = {
                ...cfg,
                taskTypes: domTasks,
                tagsImplemented: "Ads Enhanced Conversions",
                comments: [
                    "Verified Google Ads enhanced conversions for { Purchase, Form Submit } via GTM / Gtag",
                    ...BASE_COMMENTS,
                ],
            };
        }
        const hl = (s) =>
            esc(s).replace(
                /\{[^}]+\}/g,
                '<span style="background:#ffe066;color:#c92a2a;font-weight:700;padding:1px 4px;border-radius:4px;">$&</span>',
            );
        const cid = esc(
            $(".above-section div:nth-child(5) .capitalized")
                ?.innerText?.trim()
                ?.replace(/\D/g, "")
                ?.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") || "NA",
        );
        const taskVal = domTasks || cfg?.taskTypes || "NA";
        const comments = cfg?.comments?.length
            ? `<ul dir="auto" style="margin:0;padding-left:18px;">${cfg.comments.map((c) => `<li>${hl(c)}</li>`).join("")}</ul>`
            : "NA";
        const consent =
            cfg?.subStatus &&
            !/Attempted Contact|Not Reachable|Unreachable/i.test(cfg.subStatus)
                ? "Yes"
                : "NA";

        return `<div id="noteCaseUI" class="cdtx__uioncall"><div class="cdtx__uioncall_control"><span class="cdtx__uioncall_control-load" data-text="Split &amp; Transfer" data-btnclk="oncall_templ_lt_template">&nbsp;</span><span class="cdtx__uioncall_control-load" data-text="List" data-btnclk="oncall_templ_act_load">&nbsp;</span><span class="cdtx__uioncall_control-save" data-text="Save" data-btnclk="oncall_templ_act_save" data-btntooltip="Save template Reuse">&nbsp;</span><span class="cdtx__uioncall_control-remove" data-text="Remove" data-btnclk="oncall_templ_act_remove">&nbsp;</span></div><article class="cdtx__uioncall_outer"><table style="width:100% !important;table-layout:fixed !important;border-collapse:collapse !important;margin:8px 0 !important;box-sizing:border-box !important;"><tbody>${
            head("General Details") +
            row(
                "Date:",
                "[YYYY-MM-DD — Date when the SpeakEasy call, Attempted Contact dial, or follow-up action occurred]",
                isoDate(),
                "#c9daf8",
            ) +
            row(
                "Speakeasy ID:",
                `[Exact SpeakEasy session ID copied from the SpeakEasy dashboard (e.g., ${g("P100000000381267617")}). List all IDs separated by comma if multiple dials were made; write ${g("NA")} for offline/email-only updates]`,
                esc(scrapeSpeakeasyIds()),
            ) +
            row(
                "Sub-status:",
                '[Exact Connect Cases Sub-Status selected in Q+ per <a href="http://goto.google.com/tsStatuses" target="_blank" style="color:#1155cc;">go/tsStatuses</a>]',
                `<span class="_sub_i" data-btnclk="choice_status_list" data-infocase="status_case">${hl(cfg?.subStatus || "NA")}</span>`,
            ) +
            row(
                "Next Follow-Up Date",
                `[YYYY-MM-DD — Date when the next follow-up is due; or ${g("NA")}]`,
                `<span data-btnclk="oncall_templ_act_flchoice" data-dateformat="Y-m-d" data-text="oncall_templ_act_flchoice-text">${esc(currentFollowUp())}</span>`,
            ) +
            row(
                "Task types:",
                `[Primary Task Type(s) worked on the call separated by comma (e.g., ${g("Ads - Conversion Tracking, Ads - Enhanced Conversions for Web (ECW)")}); write ${g("NA")} only if no tasks were involved in emails or call]`,
                `<span class="qm-task-pick" data-task-pick="1" style="background:#ffe066;color:#c92a2a;font-weight:700;padding:1px 6px;border-radius:4px;cursor:pointer;display:inline-block;" title="Click to search/select Task Types">${esc(taskVal)}</span>`,
            ) +
            row(
                "Implemented tags:",
                `[Exact name(s) of conversion actions created, verified, or troubleshot in Google Ads separated by comma (e.g., ${g("Phone_call, lead_form, Purchase_Shopify, Add_to_Cart")}); write ${g("NA")} if not applicable]`,
                `<span>${esc(verifiedTags || cfg?.tagsImplemented || "NA")}</span>`,
            ) +
            row(
                "CID:",
                `[10-digit external Google Ads Customer ID (${g("XXX-XXX-XXXX")}) confirmed with the advertiser on the call and worked upon. If multiple CIDs or a different CID than the CUF intake form was worked upon, list all CIDs separated by comma; write ${g("NA")} if not applicable]`,
                cid,
            ) +
            row(
                "Checked and obtained recording consent from the customer before proceeding with the call",
                `[${g("Yes")} / ${g("No")} — Whether mandatory call recording consent was obtained at the beginning of the call per country SOP; write ${g("NA")} for ${g("NI - Attempted Contact")} / ${g("IN - Not Reachable")}]`,
                consent,
            ) +
            row(
                "Call Summary:",
                "Concise sentence summary of what transpired on the call/email",
                cfg?.comments?.length ? hl(cfg.comments[0]) : "NA",
            ) +
            row(
                "Sub-status Reason :",
                "exact justification for the selected sub-status",
                `<span class="cdtx__uioncall-oct_test">${esc(cfg?.subStatusReason || "NA")}</span>`,
            ) +
            row(
                "Additional information:&nbsp;",
                "Additional information related to case and call can be put here",
                comments,
            ) +
            head("Screenshots") +
            row(
                "Website URL worked upon:",
                `[Attach Tag Assistant screenshot showing the website URL connected in Google Tag Assistant (e.g., ${g("https://www.exampleclient.com")}); write ${g("NA")} only if no tasks were involved]`,
            ) +
            row(
                "Q+ entry:",
                "[Attach screenshot URL of the completed Q+ tool submission when closing or transferring the case]",
            ) +
            row(
                "GVC Chat:",
                `[Attach screenshot(s) of Google Meet chat if links or instructions were shared on the call; otherwise write ${g("NA")}]`,
            ) +
            row(
                "GAM:",
                `[Attach screenshot URL of the Google Chat ping sent to the Seller / GAM immediately after the call with call outcome, current status, and next steps (+ Seller chat confirmation if additional participants were added, or OOS redirection). Write ${g("NA - DFA Case")} for DFA cases]`,
            ) +
            row(
                "Additional Screenshots",
                `[Attach any additional screenshots of ${g("implementation, troubleshooting, validation, discrepancies etc.")} that are required based on the troubleshooting scenario encountered.] ✨`,
            ) +
            head("Implementation Screenshots") +
            row(
                "Google Ads Conversion Status:",
                `[Attach Google Ads ${g("Goals &gt; Conversions &gt; Summary")} table screenshot (after implementation or 2–3 day validation window) showing ${g("Tracking status")} transitioned to ${g("No recent conversions")}, ${g("Recording conversions")}, or ${g("Active")} with matching CID &amp; Conversion Action Name; or ${g("NA")}]`,
            ) +
            row(
                "Google Ads Conversion Settings:",
                `[Attach screenshot showing ${g("Goal category")} (Purchase, Submit lead form, Phone call lead), ${g("Action optimization")} (${g("Primary")} vs ${g("Secondary")}), ${g("Count")} (${g("Every")} / ${g("One")}), ${g("Value")}, ${g("Attribution model")} (${g("Data-driven")}), and Tag Setup card with ${g("Conversion ID")} (${g("AW-XXXXXXXXX")}) &amp; ${g("Conversion Label")}]`,
            ) +
            row(
                "GTM / Website Backend:",
                `[Attach screenshot showing Google Ads Conversion Tag + Conversion Linker + Trigger in GTM, or manual ${g("gtag.js")} in ${g("`&lt;head&gt;`")} + event snippet; or ${g("NA")}]`,
            ) +
            row(
                "Tag Assistant Tag Fired:",
                `[Attach screenshot confirming Conversion Tag &amp; Conversion Linker under ${g('"Tags Fired"')} with matching ${g("Conversion ID")}, ${g("Conversion Label")}, and dynamic ${g("Value")}/${g("Currency")}; or ${g("NA")}]`,
            ) +
            row(
                `<i>“Hit Sent”</i> in Tag Assistant OR Network Header ${g("200 OK")}:`,
                `[Attach Chrome DevTools Network tab screenshot showing conversion hit to ${g("googleadservices.com/pagead/conversion/")} with matching Conversion Label and green ${g("200 OK")} status; or ${g("NA")}]`,
            ) +
            (isEcTask(taskVal) ? ecRowsHTML(is5Days) : "") +
            row(
                "Additional Screenshots:",
                `[Attach any additional screenshots of ${g("reports, discrepancies etc.")} that are required based on the troubleshooting scenario encountered.] ✨`,
            )
        }</tbody></table></article></div>`;
    };

    const insertNote = async (templateHTML, replaceExisting) => {
        let caseNote = getVisibleCaseNote();
        if (!caseNote) {
            const fabIcon =
                $$("write-deck material-fab material-icon i").find(isVisible) ||
                $("write-deck material-fab material-icon i");
            for (
                let n = fabIcon;
                n && n !== document.body;
                n = n.parentElement
            ) {
                for (const t of ["pointerenter", "mouseenter", "mouseover"])
                    n.dispatchEvent(new MouseEvent(t, { bubbles: true }));
            }
            await sleep(150);
            (
                $$("div:nth-child(4) > material-fab i").find(isVisible) ||
                $("div:nth-child(4) > material-fab i")
            )?.click();
            for (
                let t = 0;
                t < 2000 && !(caseNote = getVisibleCaseNote());
                t += 100
            )
                await sleep(100);
        }
        if (!caseNote) return false;
        const existing = replaceExisting && $("#noteCaseUI", caseNote);
        if (existing) existing.outerHTML = toSafeHTML(templateHTML);
        else caseNote.insertAdjacentHTML("beforeend", toSafeHTML(templateHTML));
        caseNote.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
    };

    const executeFollowUp = async (flupBtn) => {
        if (flupBtn.dataset.busy) return;
        flupBtn.dataset.busy = "1";
        flupBtn.style.opacity = "0.6";
        flupBtn.style.pointerEvents = "none";
        try {
            if (!$("._connectcase_info--outer"))
                $('[data-btnclk="_connectcase_info-act_recrawl"]')?.click();
            await sleep(250);
            $('[aria-label="Overview"]')?.click();
            await sleep(300);
            const overviewTasks = scrapeDomTasks();
            const daysOffset = parseInt($("#qm-flup-in")?.value, 10) || 0;
            const apptEl = $('[data-infocase="appointment_time"]');
            if (
                apptEl &&
                !/^\d{2}\/\d{2}\/\d{4}$/.test(apptEl.dataset.valchoice)
            ) {
                apptEl.click();
                await sleep(150);
                (await waitFor(".datepicker-grid .today")).click();
                await sleep(200);
            }
            const templateKey = await promptCaseType(daysOffset);
            $('[data-infocase="follow_up_time"]')?.click();
            await sleep(150);
            if (daysOffset > 0) {
                const start = new Date(),
                    target = new Date(start);
                for (let c = 0; c < daysOffset; ) {
                    target.setDate(target.getDate() + 1);
                    if (target.getDay() % 6 !== 0) c++;
                }
                let dayEl = await waitFor(".datepicker-grid .today");
                for (
                    let i = 0, diff = Math.round((target - start) / 864e5);
                    i < diff && dayEl;
                    i++
                )
                    dayEl = dayEl.nextElementSibling;
                if (dayEl) {
                    dayEl.click();
                    await sleep(200);
                }
            } else {
                (await waitFor('[data-thischoice="Finish"]')).click();
                await sleep(200);
            }
            (await waitFor("[data-type=follow_up_time]")).click();
            await sleep(200);
            $('[aria-label="Case log"]')?.click();
            await sleep(200);
            $('[aria-haspopup="dialog"]')?.click();
            await sleep(200);
            const checkAllBtn = $('[debug-id="check-all-box"]');
            for (
                let i = 0;
                i < 2 &&
                checkAllBtn &&
                checkAllBtn.getAttribute("aria-checked") !== "true";
                i++
            ) {
                checkAllBtn.click();
                await sleep(150);
            }
            $('[debug-id="apply-filter"]')?.click();
            await sleep(300);
            const expandBtn = $(
                '[aria-label="Expand all messages"]:not([aria-expanded="true"])',
            );
            if (expandBtn) {
                expandBtn.click();
                await sleep(300);
            }
            await waitFor(
                ".speakeasy-agent-activity, .message-body-panel",
                1500,
            ).catch(() => {});
            const verifiedTags = [
                ...new Set(
                    $$(".message-body.note").flatMap((n) => {
                        if (
                            !/successfully verified for the below listed conversion actions/i.test(
                                n.textContent,
                            )
                        )
                            return [];
                        const clone = n.cloneNode(true);
                        $$("br, p, div, li, tr", clone).forEach((b) =>
                            b.before("\n"),
                        );
                        const body = clone.textContent.replace(
                            /^[\s\S]*?successfully verified for the below listed conversion actions[^:\n]*:\s*/i,
                            "",
                        );
                        return [
                            ...body.matchAll(
                                /(?:^|\n)\s*-\s*([^\n,|]+?)\s*(?:,|\|)\s*[A-Za-z0-9_-]{10,}\s*(?:,|\|)/g,
                            ),
                        ].map((m) => m[1].trim());
                    }),
                ),
            ].join(", ");
            await insertNote(
                buildNoteTemplateHTML(
                    templateKey,
                    verifiedTags,
                    overviewTasks || scrapeDomTasks(),
                ),
                true,
            );
        } catch (err) {
            console.error("Follow up script failed", err);
        } finally {
            delete flupBtn.dataset.busy;
            flupBtn.style.opacity = "1";
            flupBtn.style.pointerEvents = "auto";
        }
    };

    const insertSignature = () => {
        const sel = window.getSelection();
        if (!sel?.rangeCount)
            return alert(
                "Please click inside the email body to place your cursor first.",
            );
        const start = sel.getRangeAt(0).startContainer;
        const node = start.nodeType === 1 ? start : start.parentElement;
        if (!node?.isContentEditable)
            return alert(
                "Please place your cursor inside the text area where you want the signature.",
            );
        $$(".qm-sig").forEach((n) => n.remove());
        let sigName = localStorage.getItem("__signature_name");
        if (!sigName)
            localStorage.setItem(
                "__signature_name",
                (sigName = prompt("Enter your name:") || "Agent"),
            );
        const html = `<table class="qm-sig" style="width:348px;padding:0 30px;" data-sig-injected="true"><tbody><tr align="left"><td style="width:52px;vertical-align:top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display:block;border-radius:10px;"></td><td style="width:12px;"></td><td style="vertical-align:middle;"><p style="font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;margin:0;line-height:1.4;color:#1D1D1F;"><strong style="font-size:105%;color:#1D1D1F;">${esc(sigName)}</strong><br><span style="color:#86868B;">Technical Solutions Team</span><br><span style="color:#86868B;font-weight:500;">TDCX, on behalf of Google</span></p></td></tr></tbody></table>`;
        document.execCommand("insertHTML", false, toSafeHTML(html));
    };

    const init = () => {
        $("#qm-panel")?.remove();
        $("#qm-styles")?.remove();
        el("style", {
            id: "qm-styles",
            parent: document.head || document.documentElement,
            text: '@import url(\'https://fonts.googleapis.com/css2?family=Eczar:wght@400;600;700&display=swap\'); #qm-panel, #qm-panel *, #qm-modal-overlay, #qm-modal-overlay * { font-family: "Eczar", serif !important; } #qm-panel { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 99999; font-size: 14px; } .qm-btn { z-index: 10; color: #1D1D1F; padding: 10px 16px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); backdrop-filter: blur(6px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.6); user-select: none; } .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); filter: brightness(0.97); } .qm-btn:active { transform: scale(0.96); } #qm-flup-in { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.95); color: #1D1D1F; font-weight: 700; font-size: 14px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); transition: all 0.2s ease; -moz-appearance: textfield; z-index: 20; cursor: text; user-select: text; } #qm-flup-in:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #74B9FF; } .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF8787; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; color: #FFFFFF; } .qm-sig { margin: 12px 0; } .dock-container { max-height: 400px !important; overflow-y: auto !important; } .qm-task-pick { cursor: pointer !important; user-select: none; } .qm-task-pick::after { content: " ▾"; font-size: 10px; }',
        });
        const panel = el("div", { id: "qm-panel", parent: document.body });
        let clickerInterval = null,
            removeTimer = null,
            badgeObserver = null;

        const setAuto = (btn, on) => {
            clearInterval(clickerInterval);
            clickerInterval = on
                ? setInterval(async () => {
                      const visibleNote = getVisibleCaseNote();
                      if (
                          flupBtn.dataset.busy ||
                          (visibleNote && $("#noteCaseUI", visibleNote))
                      )
                          return;
                      if (
                          await insertNote(buildNoteTemplateHTML(null), false)
                      ) {
                          clearTimeout(removeTimer);
                          removeTimer = setTimeout(
                              () =>
                                  $(
                                      ".cdtx__uioncall_control-remove",
                                      getVisibleCaseNote() || document,
                                  )?.click(),
                              6000,
                          );
                      }
                  }, 16000)
                : null;
            btn.textContent = on ? "on" : "off";
            btn.style.backgroundColor = on ? "#B2F2BB" : "#FFA8A8";
            btn.style.color = on ? "#1E5E2A" : "#6A1A1A";
        };

        const autoBtn = el("button", {
            title: "Auto Click",
            className: "qm-btn",
            parent: panel,
            onClick: () => setAuto(autoBtn, !clickerInterval),
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
                    (await waitFor(".li-popup_lstcasefl")).click();
                } catch {}
            },
        });

        waitFor(".li-popup_lstcasefl")
            .then((item) => {
                if (!panel.isConnected) return;
                const badge = $("#flup-badge", panel);
                const update = () =>
                    (badge.style.display =
                        item.dataset.attr && item.dataset.attr !== "0"
                            ? "block"
                            : "none");
                badgeObserver = new MutationObserver(update);
                badgeObserver.observe(item, {
                    attributes: true,
                    attributeFilter: ["data-attr"],
                });
                update();
            })
            .catch(() => {});

        const flupBtn = el("div", {
            text: "fl up:",
            title: "Set Follow-up",
            className: "qm-btn",
            style: "background-color:#99E9F2;color:#0C5460;padding-right:44px;user-select:none;cursor:pointer;",
            parent: panel,
            onClick: (e) =>
                e.target.id !== "qm-flup-in" && executeFollowUp(flupBtn),
        });
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
            onmousedown: (e) => e.preventDefault(),
            onClick: insertSignature,
        });

        const syncLdapUI = () => {
            const isVongoc =
                $("[alt='profile photo']")
                    ?.src?.match(/photos\/([^/?]+)/)?.[1]
                    ?.toLowerCase() === "vongoc";
            autoBtn.style.display =
                flupItemBtn.style.display =
                signBtn.style.display =
                    isVongoc ? "" : "none";
            setAuto(autoBtn, isVongoc);
        };
        syncLdapUI();
        if (!$("[alt='profile photo']"))
            waitFor("[alt='profile photo']")
                .then(() => panel.isConnected && syncLdapUI())
                .catch(() => {});

        const syncCaseTasks = (text) => {
            if (!$('[data-btnsave], [data-btnclk="btnsave"]'))
                $(
                    '._connectcase_info-act_edit, [data-btnclk="_connectcase_info-act_edit"]',
                )?.click();
            const setVal = () => {
                const taskEl = $('[data-infocase="tasks"]');
                if (!taskEl) return;
                const inp = taskEl.matches("input, textarea")
                    ? taskEl
                    : $("input, textarea", taskEl);
                if (inp) {
                    inp.value = text;
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                    inp.dispatchEvent(new Event("change", { bubbles: true }));
                } else {
                    taskEl.textContent = text;
                    taskEl.dispatchEvent(new Event("input", { bubbles: true }));
                }
            };
            setVal();
            setTimeout(setVal, 50);
        };

        let closeTaskPop = null;
        const findTaskPickTarget = (node) => {
            const n = node?.nodeType === 1 ? node : node?.parentElement;
            if (!n || n.closest("#qm-task-pop")) return null;
            const direct = n.closest(".qm-task-pick, [data-task-pick]");
            if (direct) return direct;
            const td = n.closest("td"),
                tr = td?.parentElement;
            return tr &&
                td === tr.cells?.[1] &&
                /^\s*Task types:/i.test(tr.cells[0]?.textContent || "")
                ? $("span span", td) || td.firstElementChild || td
                : null;
        };

        let lastStrippedAt = 0;
        const stripDelBtnsOnSubmit = (e) => {
            const raw =
                e.target?.nodeType === 1 ? e.target : e.target?.parentElement;
            const submitBtn = raw?.closest('[debug-id="submit-button"]');
            if (!submitBtn) return;
            let scope = submitBtn.parentElement;
            while (
                scope &&
                scope !== document.body &&
                !$('[aria-label="Case Note"], #noteCaseUI', scope)
            )
                scope = scope.parentElement;
            const notes = [
                ...new Set(
                    [
                        scope && $('[aria-label="Case Note"]', scope),
                        getVisibleCaseNote(),
                        ...$$('[aria-label="Case Note"]'),
                    ].filter(Boolean),
                ),
            ];
            let removed = false;
            for (const note of notes) {
                const btns = $$(".qm-del-row, [data-del-row]", note);
                if (btns.length) {
                    btns.forEach((b) => b.remove());
                    note.focus();
                    for (const t of ["beforeinput", "input", "keyup", "change"])
                        note.dispatchEvent(new Event(t, { bubbles: true }));
                    removed = true;
                }
            }
            if (removed) lastStrippedAt = Date.now();
            if (
                e.type === "click" &&
                !submitBtn.dataset.qmCleanSubmit &&
                (removed || Date.now() - lastStrippedAt < 120)
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

        const clearNaAtNode = (raw) => {
            const note = raw?.closest(
                '[aria-label="Case Note"], #noteCaseUI, .cdtx__uioncall',
            );
            if (!note) return false;
            const editable =
                note.closest(
                    '[aria-label="Case Note"], [contenteditable="true"]',
                ) || note;
            const td = raw?.closest("td");
            const isValTd = !td || td !== td.parentElement?.cells?.[0];

            const replaceTextNodeWithCaret = (
                tn,
                start = 0,
                end = tn.nodeValue.length,
            ) => {
                const parent = tn.parentElement;
                if (parent?.hasAttribute("data-btnclk"))
                    parent.removeAttribute("data-btnclk");
                editable.focus?.();
                const sel = window.getSelection();
                if (!sel) return;
                const r = document.createRange();
                r.setStart(tn, start);
                r.setEnd(tn, end);
                sel.removeAllRanges();
                sel.addRange(r);
                document.execCommand("delete", false, null);
                if (tn.isConnected && /^\s*NA\s*$/i.test(tn.nodeValue)) {
                    tn.nodeValue = "\u200B";
                    const r2 = document.createRange();
                    r2.setStart(tn, 1);
                    r2.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(r2);
                }
                editable.dispatchEvent(new Event("input", { bubbles: true }));
            };

            if (isValTd && td && /^\s*NA\s*$/i.test(td.textContent)) {
                const walker = document.createTreeWalker(
                    td,
                    NodeFilter.SHOW_TEXT,
                );
                let tn;
                while ((tn = walker.nextNode())) {
                    if (/^\s*NA\s*$/i.test(tn.nodeValue)) {
                        replaceTextNodeWithCaret(tn);
                        return true;
                    }
                }
            }

            if (/^\s*NA\s*$/i.test(raw?.textContent || "")) {
                const walker = document.createTreeWalker(
                    raw,
                    NodeFilter.SHOW_TEXT,
                );
                let tn;
                while ((tn = walker.nextNode())) {
                    if (/^\s*NA\s*$/i.test(tn.nodeValue)) {
                        replaceTextNodeWithCaret(tn);
                        return true;
                    }
                }
            }

            const sel = window.getSelection();
            const aNode = sel?.anchorNode;
            if (
                isValTd &&
                aNode?.nodeType === 3 &&
                note.contains(aNode) &&
                /\bNA\b/.test(aNode.nodeValue)
            ) {
                for (const m of aNode.nodeValue.matchAll(/\bNA\b/g)) {
                    if (
                        sel.anchorOffset >= m.index &&
                        sel.anchorOffset <= m.index + 2
                    ) {
                        replaceTextNodeWithCaret(aNode, m.index, m.index + 2);
                        return true;
                    }
                }
            }
            return false;
        };

        const onDocClick = (e) => {
            stripDelBtnsOnSubmit(e);
            const raw =
                e.target?.nodeType === 1 ? e.target : e.target?.parentElement;
            const delBtn = raw?.closest(".qm-del-row, [data-del-row]");
            if (delBtn) {
                e.preventDefault();
                e.stopPropagation();
                const tr = delBtn.closest("tr"),
                    note = tr?.closest('[aria-label="Case Note"]');
                tr?.remove();
                note?.dispatchEvent(new Event("input", { bubbles: true }));
                return;
            }
            let target = findTaskPickTarget(e.target);
            if (!target) {
                if (clearNaAtNode(raw)) e.stopPropagation();
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            closeTaskPop?.();
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
                style: "padding:6px 8px;border:1px solid #ddd;border-radius:6px;outline:none;flex-shrink:0;font-size:12px;",
                oninput: () => {
                    const q = search.value.toLowerCase();
                    for (const l of $$("label", list))
                        l.style.display = l.textContent
                            .toLowerCase()
                            .includes(q)
                            ? "flex"
                            : "none";
                },
            });
            const list = el("div", {
                parent: pop,
                style: "flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:4px;",
            });
            const setStyle = (n, on) =>
                Object.assign(n.style, {
                    background: on ? "#ffe066" : "transparent",
                    color: on ? "#c92a2a" : "#1D1D1F",
                    fontWeight: on ? "700" : "400",
                });

            for (const t of TASK_TYPES) {
                const lbl = el("label", {
                    parent: list,
                    style: "flex-shrink:0;display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 6px;border-radius:4px;margin:0;line-height:1.3;",
                });
                setStyle(lbl, current.has(t));
                el("input", {
                    type: "checkbox",
                    checked: current.has(t),
                    parent: lbl,
                    style: "appearance:auto;-webkit-appearance:checkbox;opacity:1;position:static;width:14px;height:14px;margin:0;flex-shrink:0;cursor:pointer;",
                    onchange: (ev) => {
                        taskUpdated = true;
                        if (t === "NA") {
                            current.clear();
                            if (ev.target.checked) current.add("NA");
                        } else {
                            current.delete("NA");
                            ev.target.checked
                                ? current.add(t)
                                : current.delete(t);
                        }
                        if (!current.size) current.add("NA");

                        for (const l of $$("label", list)) {
                            const on = current.has(l.textContent.trim());
                            $("input", l).checked = on;
                            setStyle(l, on);
                        }

                        const nextText = current.has("NA")
                            ? "NA"
                            : [...current].join(", ") || "NA";
                        if (!target.isConnected) {
                            const re = $$("tr").find((r) =>
                                /^\s*Task types:/i.test(
                                    r.cells?.[0]?.textContent || "",
                                ),
                            );
                            target =
                                findTaskPickTarget(re?.cells?.[1]) || target;
                        }
                        target.textContent = nextText;
                        syncEcRows(target.closest("table"), nextText);
                        target
                            .closest('[aria-label="Case Note"]')
                            ?.dispatchEvent(
                                new Event("input", { bubbles: true }),
                            );
                        syncCaseTasks(nextText);
                    },
                });
                lbl.append(t);
            }
            search.focus();
            const onOutside = (ev) => {
                if (!pop.contains(ev.target) && !target.contains(ev.target))
                    closeTaskPop?.();
            };
            closeTaskPop = () => {
                if (taskUpdated) {
                    syncCaseTasks(target.textContent);
                    setTimeout(
                        () =>
                            $(
                                '._connectcase_info--outer [data-btnsave], [data-btnsave], [data-btnclk="btnsave"]',
                            )?.click(),
                        100,
                    );
                }
                pop.remove();
                document.removeEventListener("mousedown", onOutside, true);
                closeTaskPop = null;
            };
            document.addEventListener("mousedown", onOutside, true);
        };

        window.addEventListener("pointerdown", stripDelBtnsOnSubmit, true);
        window.addEventListener("mousedown", stripDelBtnsOnSubmit, true);
        window.addEventListener("click", onDocClick, true);
        cleanups.push(() => {
            clearInterval(clickerInterval);
            clearTimeout(removeTimer);
            badgeObserver?.disconnect();
            window.removeEventListener(
                "pointerdown",
                stripDelBtnsOnSubmit,
                true,
            );
            window.removeEventListener("mousedown", stripDelBtnsOnSubmit, true);
            window.removeEventListener("click", onDocClick, true);
            closeTaskPop?.();
            panel.remove();
        });
    };

    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", init, { once: true })
        : init();
})();
