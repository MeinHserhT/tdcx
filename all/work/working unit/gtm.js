(function () {
	"use strict";

	// 1. Scan all <script> elements across the document
	const allScripts = Array.from(document.scripts);
	const tagSet = new Set();
	const tagRegex = /\b(GTM-[A-Z0-9]{4,10}|G-[A-Z0-9]{6,12}|AW-\d+)\b/g;

	allScripts.forEach((script) => {
		if (script.src) {
			const matches = script.src.match(tagRegex);
			if (matches) matches.forEach((tag) => tagSet.add(tag));
		}
		if (script.outerHTML) {
			const matches = script.outerHTML.match(tagRegex);
			if (matches) matches.forEach((tag) => tagSet.add(tag));
		}
	});

	// Priority: GTM -> GA4 -> AW
	const getPriority = (tag) => {
		if (tag.startsWith("GTM-")) return 1;
		if (tag.startsWith("G-")) return 2;
		if (tag.startsWith("AW-")) return 3;
		return 4;
	};

	// Pastel badge colors
	const getTagStyle = (tag) => {
		if (tag.startsWith("GTM-")) {
			return { bg: "#e0f2fe", border: "#bae6fd", color: "#0369a1" };
		}
		if (tag.startsWith("G-")) {
			return { bg: "#fef9c3", border: "#fef08a", color: "#854d0e" };
		}
		if (tag.startsWith("AW-")) {
			return { bg: "#dcfce7", border: "#bbf7d0", color: "#166534" };
		}
		return { bg: "#f3f4f6", border: "#e5e7eb", color: "#374151" };
	};

	const tags = Array.from(tagSet).sort(
		(a, b) => getPriority(a) - getPriority(b) || a.localeCompare(b),
	);

	// Remove existing modal if present
	const existingOverlay = document.getElementById("apple-gtag-overlay");
	if (existingOverlay) existingOverlay.remove();

	// 2. CREATE MINIMAL APPLE UI
	const overlay = document.createElement("div");
	overlay.id = "apple-gtag-overlay";
	Object.assign(overlay.style, {
		position: "fixed",
		top: "0",
		left: "0",
		width: "100vw",
		height: "100vh",
		backgroundColor: "rgba(0, 0, 0, 0.25)",
		backdropFilter: "blur(0.1px) saturate(180%)",
		webkitBackdropFilter: "blur(0.1px) saturate(180%)",
		zIndex: "999999",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
	});

	const modal = document.createElement("div");
	Object.assign(modal.style, {
		backgroundColor: "rgba(255, 255, 255, 0.92)",
		borderRadius: "20px",
		padding: "24px",
		width: "90%",
		maxWidth: "400px",
		maxHeight: "80vh",
		boxShadow:
			"0 20px 40px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)",
		border: "1px solid rgba(255, 255, 255, 0.8)",
		display: "flex",
		flexDirection: "column",
		gap: "16px",
		boxSizing: "border-box",
	});

	// Header
	const header = document.createElement("div");
	Object.assign(header.style, {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		paddingBottom: "12px",
		borderBottom: "1px solid #e5e5e7",
	});
	header.innerHTML = `
    <div>
      <h3 style="margin: 0; font-size: 18px; color: #1d1d1f; font-weight: 600; letter-spacing: -0.01em;">Google Tags</h3>
      <p style="margin: 2px 0 0 0; font-size: 13px; color: #86868b;">Tags detected on page</p>
    </div>
    <span style="font-size: 12px; background: #e8e8ed; color: #1d1d1f; padding: 4px 10px; border-radius: 9999px; font-weight: 600;">
      ${tags.length} ${tags.length === 1 ? "tag" : "tags"}
    </span>
  `;

	// Body Container
	const tableContainer = document.createElement("div");
	Object.assign(tableContainer.style, {
		overflowY: "auto",
		maxHeight: "50vh",
		borderRadius: "12px",
		border: tags.length > 0 ? "1px solid #e5e5e7" : "none",
		backgroundColor: "#ffffff",
	});

	if (tags.length === 0) {
		tableContainer.innerHTML = `
      <div style="text-align: center; color: #86868b; padding: 32px 16px; font-size: 14px;">
        No Google Tags found on this page.
      </div>
    `;
	} else {
		const table = document.createElement("table");
		Object.assign(table.style, {
			width: "100%",
			borderCollapse: "collapse",
			textAlign: "left",
		});

		table.innerHTML = `
      <thead>
        <tr style="background-color: #fafafa; border-bottom: 1px solid #e5e5e7;">
          <th style="padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b;">Tag ID</th>
          <th style="padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; text-align: right;">Action</th>
        </tr>
      </thead>
    `;

		const tbody = document.createElement("tbody");

		tags.forEach((tag, idx) => {
			const style = getTagStyle(tag);
			const row = document.createElement("tr");
			Object.assign(row.style, {
				borderBottom:
					idx === tags.length - 1 ? "none" : "1px solid #e5e5e7",
				transition: "background-color 0.15s ease",
			});

			row.onmouseenter = () => (row.style.backgroundColor = "#fbfbfd");
			row.onmouseleave = () =>
				(row.style.backgroundColor = "transparent");

			// Tag ID Badge (Click to copy)
			const tdTag = document.createElement("td");
			tdTag.style.padding = "12px 16px";

			const tagBtn = document.createElement("button");
			tagBtn.textContent = tag;
			tagBtn.title = "Click to copy";
			Object.assign(tagBtn.style, {
				fontWeight: "600",
				fontFamily:
					"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
				fontSize: "13px",
				color: style.color,
				backgroundColor: style.bg,
				border: `1px solid ${style.border}`,
				borderRadius: "9999px",
				padding: "4px 12px",
				cursor: "pointer",
				transition: "transform 0.15s ease, background-color 0.15s ease",
			});

			tagBtn.onmouseenter = () =>
				(tagBtn.style.transform = "scale(1.03)");
			tagBtn.onmouseleave = () => (tagBtn.style.transform = "scale(1)");

			tagBtn.onclick = () => {
				navigator.clipboard.writeText(tag).then(() => {
					tagBtn.textContent = "✓ Copied";
					tagBtn.style.backgroundColor = "#dcfce7";
					tagBtn.style.borderColor = "#86efac";
					tagBtn.style.color = "#166534";
					setTimeout(() => {
						tagBtn.textContent = tag;
						tagBtn.style.backgroundColor = style.bg;
						tagBtn.style.borderColor = style.border;
						tagBtn.style.color = style.color;
					}, 1500);
				});
			};

			tdTag.appendChild(tagBtn);

			// Open Tool Button
			const tdAction = document.createElement("td");
			tdAction.style.padding = "12px 16px";
			tdAction.style.textAlign = "right";

			const openBtn = document.createElement("button");
			openBtn.textContent = "Open ↗";
			Object.assign(openBtn.style, {
				padding: "6px 14px",
				fontSize: "12px",
				fontWeight: "500",
				cursor: "pointer",
				border: "none",
				borderRadius: "9999px",
				backgroundColor: "#0071e3",
				color: "#ffffff",
				transition: "background-color 0.15s ease, transform 0.1s ease",
			});

			openBtn.onmouseenter = () =>
				(openBtn.style.backgroundColor = "#0077ed");
			openBtn.onmouseleave = () =>
				(openBtn.style.backgroundColor = "#0071e3");
			openBtn.onmousedown = () =>
				(openBtn.style.transform = "scale(0.96)");
			openBtn.onmouseup = () => (openBtn.style.transform = "scale(1)");

			openBtn.onclick = () => {
				let url = "";
				if (tag.startsWith("AW-")) {
					const numericId = tag.replace("AW-", "");
					url = `https://adwords.corp.google.com/aw_internalops/go?conversiontrackingid=${numericId}`;
				} else {
					url = `https://tagmanager-ics.corp.google.com/home?q=${tag}`;
				}
				window.open(url, "_blank");
			};

			tdAction.appendChild(openBtn);

			row.appendChild(tdTag);
			row.appendChild(tdAction);
			tbody.appendChild(row);
		});

		table.appendChild(tbody);
		tableContainer.appendChild(table);
	}

	// Footer with Gearloose & Close buttons
	const footer = document.createElement("div");
	Object.assign(footer.style, {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: "4px",
	});

	// Gearloose Button
	const gearlooseBtn = document.createElement("button");
	gearlooseBtn.textContent = "Gearloose ↗";
	Object.assign(gearlooseBtn.style, {
		padding: "8px 16px",
		fontSize: "13px",
		fontWeight: "500",
		cursor: "pointer",
		border: "none",
		borderRadius: "9999px",
		backgroundColor: "#b28787",
		color: "#1d1d1f",
		transition: "all 0.15s ease",
	});

	gearlooseBtn.onmouseenter = () =>
		(gearlooseBtn.style.backgroundColor = "#e8e8ed");
	gearlooseBtn.onmouseleave = () =>
		(gearlooseBtn.style.backgroundColor = "#b28787");
	gearlooseBtn.onclick = () => {
		window.open(
			`https://gearloose.corp.google.com/#/search?q=${encodeURIComponent(location.host)}&tab=merchants`,
			"_blank",
		);
	};

	// Close Button
	const closeBtn = document.createElement("button");
	closeBtn.textContent = "Close";
	Object.assign(closeBtn.style, {
		padding: "8px 20px",
		fontSize: "13px",
		fontWeight: "500",
		cursor: "pointer",
		border: "1px solid #d1d1d6",
		borderRadius: "9999px",
		backgroundColor: "#ffffff",
		color: "#1d1d1f",
		transition: "all 0.15s ease",
	});

	closeBtn.onmouseenter = () => (closeBtn.style.backgroundColor = "#f5f5f7");
	closeBtn.onmouseleave = () => (closeBtn.style.backgroundColor = "#ffffff");

	const closeModal = () => overlay.remove();
	closeBtn.onclick = closeModal;

	overlay.onclick = (e) => {
		if (e.target === overlay) closeModal();
	};

	footer.appendChild(gearlooseBtn);
	footer.appendChild(closeBtn);
	modal.appendChild(header);
	modal.appendChild(tableContainer);
	modal.appendChild(footer);
	overlay.appendChild(modal);
	document.body.appendChild(overlay);
})();
