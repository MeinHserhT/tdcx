
function highlightQuizResults(quizData) {
    const COLOR_INCORRECT_QUESTION_BG = "#ffdada"; // Light red for the question box
    const COLOR_CORRECT_OPTION_BG = "#4CAF50";     // Green for correct options
    const COLOR_INCORRECT_OPTION_BG = "red";       // Red for incorrect options
    const styleOptionElement = (optionId, color) => {
        // Finds element containing the option ID (using partial match logic from original code)
        const element = document.querySelector(`[id*="${optionId}"]`);
        if (element) {
            element.style.backgroundColor = color;
        }
    };
    if (!quizData || !quizData.quizEvaluation || !quizData.quizEvaluation.elementResponses) {
        console.error("Invalid JSON structure: 'quizEvaluation.elementResponses' missing.");
        return;
    }
    const responses = quizData.quizEvaluation.elementResponses;
    responses.forEach((item) => {
        const questionResponse = item.questionResponse;
        const isCorrect = questionResponse.score === "1";
        const questionElement = document.querySelector(
            `[id="${questionResponse.questionId}"]`
        );
        if (questionElement) {
            questionElement.style.backgroundColor = isCorrect
                ? ""
                : COLOR_INCORRECT_QUESTION_BG;
        }
        const optionColor = isCorrect
            ? COLOR_CORRECT_OPTION_BG
            : COLOR_INCORRECT_OPTION_BG;
        const radioOptionId = questionResponse.radioResponse?.selectedOption?.optionId;
        if (radioOptionId) {
            styleOptionElement(radioOptionId, optionColor);
        }
        const checkboxOptions = questionResponse.checkBoxResponse?.selectedOptions;
        if (checkboxOptions && checkboxOptions.length > 0) {
            checkboxOptions.forEach((option) => {
                styleOptionElement(option.optionId, optionColor);
            });
        }
    });
}

var json_de = {
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
            // ... (Rest of your JSON data here) ...
        ],
        // ... (Rest of properties)
    },
};

// Run the function
highlightQuizResults(json_de);