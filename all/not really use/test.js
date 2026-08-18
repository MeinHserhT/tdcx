const highlightResults = (data) => {
	const bgErrQ = "#ffdada",
		bgOk = "#4CAF50",
		bgErr = "red";

	// FIX: Look inside quizEvaluation first, then fallback to direct elementResponses
	const res =
		data?.quizEvaluation?.elementResponses || data?.elementResponses;

	if (!res) return console.error("Invalid JSON: 'elementResponses' missing.");

	const colorEl = (sel, color) => {
		const el = document.querySelector(sel);
		if (el) el.style.backgroundColor = color;
	};

	res.forEach(({ questionResponse: qr }) => {
		// NOTE: Your JSON has scores of "10", but this checks for "1".
		// Update this to "10" if a correct answer is worth 10 points.
		const isOk = qr.score === "10" || qr.score === "1";

		colorEl(`[id="${qr.questionId}"]`, isOk ? "" : bgErrQ);

		const optColor = isOk ? bgOk : bgErr;
		const optIds = [
			qr.radioResponse?.selectedOption?.optionId,
			...(qr.checkBoxResponse?.selectedOptions || []).map(
				(o) => o.optionId,
			),
		].filter(Boolean);

		optIds.forEach((id) => colorEl(`[id*="${id}"]`, optColor));
	});
};

const json_de = {
	quizEvaluation: {
		name: "batches/3219625329927783944/quizEvaluations/8268374534351805072",
		batchName: "batches/3219625329927783944",
		quizName: "quizzes/5919822694599837256",
		creator: "vongoc@google.com",
		score: "110",
		elementResponses: [
			{
				elementId: "95aea69f-d5f3-453c-bf27-9ace80732612",
				questionResponse: {
					questionId: "c11e0d08-b923-4dca-abe7-8581139f1f60",
					score: "10",
					sectionId: "c11e0d08-b923-4dca-abe7-8581139f1f60",
					radioResponse: {
						selectedOption: {
							optionId: "0f230daa-f03f-4781-9c49-f756abfdf48d",
						},
					},
				},
			},
			{
				elementId: "c6c6c385-f923-4683-a2df-d560f74f0d60",
				questionResponse: {
					questionId: "436dc082-29a3-4939-a849-233e194ae9be",
					score: "10",
					sectionId: "436dc082-29a3-4939-a849-233e194ae9be",
					radioResponse: {
						selectedOption: {
							optionId: "28705467-21c6-4880-b992-57d126cd6d08",
						},
					},
				},
			},
			{
				elementId: "8e2d00cb-49d7-4d22-870c-53ebde86a8bb",
				questionResponse: {
					questionId: "a82ae032-8d3f-427c-952f-6b71a93a7c8a",
					score: "10",
					sectionId: "a82ae032-8d3f-427c-952f-6b71a93a7c8a",
					radioResponse: {
						selectedOption: {
							optionId: "5cc44c46-01ed-4eff-bbed-300a61efef16",
						},
					},
				},
			},
			{
				elementId: "38fa6e67-26ad-4605-b39a-fbb027fbbb19",
				questionResponse: {
					questionId: "503e5268-d855-42a9-b679-c5605890690d",
					score: "10",
					sectionId: "503e5268-d855-42a9-b679-c5605890690d",
					radioResponse: {
						selectedOption: {
							optionId: "abce7be4-98fd-44d6-a9ff-1dca328e5504",
						},
					},
				},
			},
			{
				elementId: "c5e8952d-f4f4-4f52-9abe-2b0f60727ae5",
				questionResponse: {
					questionId: "35dbeae7-6744-43fa-8361-d8c391d3c54d",
					score: "10",
					sectionId: "35dbeae7-6744-43fa-8361-d8c391d3c54d",
					radioResponse: {
						selectedOption: {
							optionId: "954e7a67-37df-4e27-b622-124f8bd5a06c",
						},
					},
				},
			},
			{
				elementId: "5b977933-a644-42ae-a290-01bce1a811ae",
				questionResponse: {
					questionId: "7c6ea3bd-63b9-429d-85a1-433dbbaa81e4",
					score: "10",
					sectionId: "7c6ea3bd-63b9-429d-85a1-433dbbaa81e4",
					radioResponse: {
						selectedOption: {
							optionId: "40159ce8-e892-4f4d-aab7-da354771001d",
						},
					},
				},
			},
			{
				elementId: "cbc59a56-87d4-40ac-90c3-e8dec5f2f805",
				questionResponse: {
					questionId: "160eae50-4e5c-468d-8f19-74cd7e53fd85",
					score: "10",
					sectionId: "160eae50-4e5c-468d-8f19-74cd7e53fd85",
					radioResponse: {
						selectedOption: {
							optionId: "9faa3eaf-e0d0-45eb-9868-fd0b88727945",
						},
					},
				},
			},
			{
				elementId: "31060e3c-d575-4012-b5e8-9dddabc29ed5",
				questionResponse: {
					questionId: "746cd4c1-b628-4cf9-a049-7e3a4a282f06",
					sectionId: "746cd4c1-b628-4cf9-a049-7e3a4a282f06",
					radioResponse: {
						selectedOption: {
							optionId: "9ff3195d-8f11-4dcc-8519-d7554ea819d5",
						},
					},
				},
			},
			{
				elementId: "b3f1bdbf-60c3-425a-9fa1-a45ec675fd11",
				questionResponse: {
					questionId: "0dcd6b14-2766-4298-8df8-700b2381eac4",
					score: "10",
					sectionId: "0dcd6b14-2766-4298-8df8-700b2381eac4",
					radioResponse: {
						selectedOption: {
							optionId: "26947533-529e-404a-bb9b-e25e22439ca3",
						},
					},
				},
			},
			{
				elementId: "ca39282c-2d58-4136-8ba4-75474d9adfda",
				questionResponse: {
					questionId: "0648494a-cb38-480a-be82-246e7105673b",
					score: "10",
					sectionId: "0648494a-cb38-480a-be82-246e7105673b",
					radioResponse: {
						selectedOption: {
							optionId: "553664c5-a47b-4142-ab9b-dca3c113d966",
						},
					},
				},
			},
			{
				elementId: "2402d079-4f2f-4d97-be95-629849c9348b",
				questionResponse: {
					questionId: "0be37e6e-f1f5-40dd-bac9-9362036705ac",
					score: "10",
					sectionId: "0be37e6e-f1f5-40dd-bac9-9362036705ac",
					radioResponse: {
						selectedOption: {
							optionId: "e87ec943-fc7b-4a6f-8322-3389c78c3655",
						},
					},
				},
			},
			{
				elementId: "06cea9c0-d28a-4a9b-aad0-3842b4d994b0",
				questionResponse: {
					questionId: "71f594af-8c30-4384-be85-6d60fe4131c0",
					score: "10",
					sectionId: "71f594af-8c30-4384-be85-6d60fe4131c0",
					radioResponse: {
						selectedOption: {
							optionId: "30789217-1999-461b-8b95-ac9b3c6cfd55",
						},
					},
				},
			},
		],
		createTime: "2026-08-17T02:10:41.424841Z",
		updateTime: "2026-08-17T02:17:46.761243Z",
		status: "COMPLETED",
		result: "PASS",
		attemptNumber: 1,
		maxScore: "120",
		aiConversationDetails: {},
	},
};
// Now this call works perfectly
highlightResults(json_de);
