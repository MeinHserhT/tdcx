const highlightResults = (data) => {
  const bgErrQ = "#ffdada", bgOk = "#4CAF50", bgErr = "red";
  const res = data?.quizEvaluation?.elementResponses;

  if (!res) return console.error("Invalid JSON: 'elementResponses' missing.");

  const colorEl = (sel, color) => {
    const el = document.querySelector(sel);
    if (el) el.style.backgroundColor = color;
  };

  res.forEach(({ questionResponse: qr }) => {
    const isOk = qr.score === "1";
    
    colorEl(`[id="${qr.questionId}"]`, isOk ? "" : bgErrQ);

    const optColor = isOk ? bgOk : bgErr;
    const optIds = [
      qr.radioResponse?.selectedOption?.optionId,
      ...(qr.checkBoxResponse?.selectedOptions || []).map(o => o.optionId)
    ].filter(Boolean);

    optIds.forEach(id => colorEl(`[id*="${id}"]`, optColor));
  });
};

const json_de = {
  quizEvaluation: {
    name: "batches/7140736763044891056/quizEvaluations/5601021731343114792",
    batchName: "batches/7140736763044891056",
    quizName: "quizzes/6616570521238325792",
    creator: "vongoc@google.com",
    score: "14",
    elementResponses: [
      {
        elementId: "f5f2f662-6b56-4129-8cd3-b8e5ce377a9c",
        questionResponse: {
          questionId: "5354fc10-0147-4af0-a95f-526200d60028",
          score: "1",
          sectionId: "5354fc10-0147-4af0-a95f-526200d60028",
          checkBoxResponse: {
            selectedOptions: [
              { optionId: "7dedb0d4-8968-44ff-84fb-a049f3b60ebe" },
              { optionId: "a3d5bdca-6c32-4ac3-ab96-9485a5811ea1" },
              { optionId: "fc2efdd5-e497-48dc-969a-52a4482a9f31" },
            ],
          },
        },
      },
      {
        elementId: "c39add04-251a-4056-ba22-ac03f1e00532",
        questionResponse: {
          questionId: "d19380e7-7f97-4ff9-a862-9d3f005f5548",
          score: "1",
          sectionId: "d19380e7-7f97-4ff9-a862-9d3f005f5548",
          radioResponse: {
            selectedOption: { optionId: "840fb235-1b63-4b09-a75b-3f03074c9056" },
          },
        },
      },
    ],
  },
};

highlightResults(json_de);