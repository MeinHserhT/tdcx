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
		name: "batches/5576226938595868288/quizEvaluations/132951719933785752",
		batchName: "batches/5576226938595868288",
		quizName: "quizzes/3331285089308264912",
		creator: "vongoc@google.com",
		score: "110",
		elementResponses: [
			{
				elementId: "9ea3ab48-b047-46c8-a02b-707f7135042f",
				questionResponse: {
					questionId: "7fcb6445-b992-48b2-9a9c-8c6d70ffeea8",
					score: "10",
					sectionId: "7fcb6445-b992-48b2-9a9c-8c6d70ffeea8",
					radioResponse: {
						selectedOption: {
							optionId: "0fbb91b8-ce69-429f-8413-9a174e8bc810",
						},
					},
				},
			},
			{
				elementId: "241f60db-094f-4cf8-9ece-69d90dbf934b",
				questionResponse: {
					questionId: "be9df333-7f20-4041-92ea-fe4388482e86",
					score: "10",
					sectionId: "be9df333-7f20-4041-92ea-fe4388482e86",
					radioResponse: {
						selectedOption: {
							optionId: "03eec5a7-e857-4ad3-9c76-fa2ffeff368e",
						},
					},
				},
			},
			{
				elementId: "4fb7b3aa-cbab-4c1d-a936-5c38b106867a",
				questionResponse: {
					questionId: "63efecf6-5e6a-4f95-acce-d5374498aefa",
					score: "10",
					sectionId: "63efecf6-5e6a-4f95-acce-d5374498aefa",
					radioResponse: {
						selectedOption: {
							optionId: "32557115-a891-45d1-909d-58e4f21ca8c2",
						},
					},
				},
			},
			{
				elementId: "a79b4d5e-b046-47df-b5da-7550b5fe65ae",
				questionResponse: {
					questionId: "318999a7-ca23-419b-ba5d-154bccef4e6c",
					score: "10",
					sectionId: "318999a7-ca23-419b-ba5d-154bccef4e6c",
					radioResponse: {
						selectedOption: {
							optionId: "a7e94301-47df-4be6-8c83-9191980e427b",
						},
					},
				},
			},
			{
				elementId: "ecbd8043-caa2-469a-8267-c2616abd2263",
				questionResponse: {
					questionId: "c60bdf32-4e03-4a08-9f8a-95943d439727",
					score: "10",
					sectionId: "c60bdf32-4e03-4a08-9f8a-95943d439727",
					radioResponse: {
						selectedOption: {
							optionId: "a237995f-e2f8-4437-acdf-8e3dffbba481",
						},
					},
				},
			},
			{
				elementId: "fb20db31-50f9-4ec8-babb-7fd8119b550f",
				questionResponse: {
					questionId: "a0331566-923a-49fb-a51b-d818cabb114e",
					score: "10",
					sectionId: "a0331566-923a-49fb-a51b-d818cabb114e",
					radioResponse: {
						selectedOption: {
							optionId: "c69322bc-d898-4257-8a1c-6d050264f4eb",
						},
					},
				},
			},
			{
				elementId: "4cfa4cbc-1522-42c8-abaf-6c4445d9e28e",
				questionResponse: {
					questionId: "63f10a5d-6a99-474f-ab7e-d359849f9c46",
					score: "10",
					sectionId: "63f10a5d-6a99-474f-ab7e-d359849f9c46",
					radioResponse: {
						selectedOption: {
							optionId: "f8dce4ef-42e0-4be7-9d30-a2417f1af6f8",
						},
					},
				},
			},
			{
				elementId: "195437a0-0724-4252-8e08-dc5511f44f98",
				questionResponse: {
					questionId: "76edc243-cf75-451d-b2e2-389c7a10bd0c",
					score: "10",
					sectionId: "76edc243-cf75-451d-b2e2-389c7a10bd0c",
					radioResponse: {
						selectedOption: {
							optionId: "0d9af10e-287d-46d6-85bb-36cb5cb24e4e",
						},
					},
				},
			},
			{
				elementId: "e6953944-56cd-4544-9632-30947a43bf46",
				questionResponse: {
					questionId: "81a2b0b0-2aff-4c08-b79c-16bf2954022a",
					score: "10",
					sectionId: "81a2b0b0-2aff-4c08-b79c-16bf2954022a",
					radioResponse: {
						selectedOption: {
							optionId: "642819b4-6083-4095-9763-3ab951b00db5",
						},
					},
				},
			},
			{
				elementId: "7b5326f7-0dd7-48d9-86fe-4167ef6bfe77",
				questionResponse: {
					questionId: "9fbcb117-37ad-4941-afdb-e86c338fbab8",
					score: "10",
					sectionId: "9fbcb117-37ad-4941-afdb-e86c338fbab8",
					radioResponse: {
						selectedOption: {
							optionId: "0b9c8ae8-8684-4aa5-9d82-c52865bf521f",
						},
					},
				},
			},
			{
				elementId: "6214fd6d-3109-4f7b-81b7-08526df6662c",
				questionResponse: {
					questionId: "37be7c81-5d8c-46d0-af8a-69e3fc9c4ad3",
					sectionId: "37be7c81-5d8c-46d0-af8a-69e3fc9c4ad3",
					radioResponse: {
						selectedOption: {
							optionId: "1c8ea0fd-7721-4297-8845-3c45da5373c4",
						},
					},
				},
			},
			{
				elementId: "5eeb7b62-cc57-4683-9e73-22241fd67d40",
				questionResponse: {
					questionId: "09dd9d1b-9571-4097-809f-86240763c00c",
					score: "10",
					sectionId: "09dd9d1b-9571-4097-809f-86240763c00c",
					radioResponse: {
						selectedOption: {
							optionId: "3dc62b5b-0bdf-4fd9-b1bd-832bbfcd28e4",
						},
					},
				},
			},
		],
		createTime: "2026-08-04T09:51:18.850407Z",
		updateTime: "2026-08-04T09:54:33.677193Z",
		status: "COMPLETED",
		result: "PASS",
		attemptNumber: 1,
		maxScore: "120",
		aiConversationDetails: {},
	},
};
// Now this call works perfectly
highlightResults(json_de);
