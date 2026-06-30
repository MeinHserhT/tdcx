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
                (o) => o.optionId
            ),
        ].filter(Boolean);

        optIds.forEach((id) => colorEl(`[id*="${id}"]`, optColor));
    });
};

const json_de = {
    quizEvaluation: {
        name: "batches/3502241224319705944/quizEvaluations/7740665736657303040",
        batchName: "batches/3502241224319705944",
        quizName: "quizzes/1696607020515410504",
        creator: "vongoc@google.com",
        score: "19",
        elementResponses: [
            {
                elementId: "082b597a-d323-4f17-b91c-c7b39af87228",
                questionResponse: {
                    questionId: "99376792-87ca-4bff-b5fa-d11ab1840c1f",
                    score: "1",
                    sectionId: "99376792-87ca-4bff-b5fa-d11ab1840c1f",
                    radioResponse: {
                        selectedOption: {
                            optionId: "30bb7026-d3b9-4ef6-a58d-d23a4d28adb9",
                        },
                    },
                },
            },
            {
                elementId: "29104ccd-1c5a-422f-a1bc-a26c6c341c22",
                questionResponse: {
                    questionId: "14dd223b-2746-4b64-bbc7-534357421803",
                    score: "1",
                    sectionId: "14dd223b-2746-4b64-bbc7-534357421803",
                    radioResponse: {
                        selectedOption: {
                            optionId: "1a734ac7-637d-4345-b323-d2da842a02ff",
                        },
                    },
                },
            },
            {
                elementId: "a61fe981-55e2-4a65-90b6-5d2e84ab6f8d",
                questionResponse: {
                    questionId: "8eb38132-528d-41b1-b2c7-cd26eb49aa87",
                    score: "1",
                    sectionId: "8eb38132-528d-41b1-b2c7-cd26eb49aa87",
                    radioResponse: {
                        selectedOption: {
                            optionId: "0ce298ae-ea63-4417-b7e0-dd6f9de2b4e1",
                        },
                    },
                },
            },
            {
                elementId: "4760e375-727e-4a6e-8897-8d247681c164",
                questionResponse: {
                    questionId: "86a63413-9e60-47e1-8075-b9773c2a6b29",
                    score: "1",
                    sectionId: "86a63413-9e60-47e1-8075-b9773c2a6b29",
                    checkBoxResponse: {
                        selectedOptions: [
                            {
                                optionId:
                                    "82302dec-eab6-411e-b63e-06187eb98501",
                            },
                            {
                                optionId:
                                    "ce258d42-907d-48c3-873c-5553d85659b5",
                            },
                            {
                                optionId:
                                    "aff5cadc-fb12-4b40-a6ae-6cb62136094a",
                            },
                        ],
                    },
                },
            },
            {
                elementId: "7825f302-7428-4976-b26f-6270cf54054b",
                questionResponse: {
                    questionId: "1e185acd-04ec-47f7-a81b-d8ba057fbd57",
                    score: "1",
                    sectionId: "1e185acd-04ec-47f7-a81b-d8ba057fbd57",
                    radioResponse: {
                        selectedOption: {
                            optionId: "0abdf752-d49d-4d65-906c-16524955dcbe",
                        },
                    },
                },
            },
            {
                elementId: "33050e44-06ad-4477-ae4a-6f4ba8080432",
                questionResponse: {
                    questionId: "2a79bac4-935f-43b7-b72b-3cf5be5c7b6e",
                    score: "1",
                    sectionId: "2a79bac4-935f-43b7-b72b-3cf5be5c7b6e",
                    radioResponse: {
                        selectedOption: {
                            optionId: "8ff28f6a-0d5f-4789-980b-fb012f69988a",
                        },
                    },
                },
            },
            {
                elementId: "7be0498c-d5b0-4553-981c-1c0b6c4544d3",
                questionResponse: {
                    questionId: "dee5f447-37cc-41f9-8b1a-fd12aec9c24a",
                    sectionId: "dee5f447-37cc-41f9-8b1a-fd12aec9c24a",
                    radioResponse: {
                        selectedOption: {
                            optionId: "ca0e6a2d-8eb8-4c8d-8c86-1a2a9fb29acd",
                        },
                    },
                },
            },
            {
                elementId: "e5b14c4c-abed-4736-b42b-eb0843c956ee",
                questionResponse: {
                    questionId: "d6f647f6-c4e2-4da0-940e-8870cc6ff3fb",
                    score: "1",
                    sectionId: "d6f647f6-c4e2-4da0-940e-8870cc6ff3fb",
                    radioResponse: {
                        selectedOption: {
                            optionId: "13bed871-436d-4ba8-a900-b98d6d9e9a83",
                        },
                    },
                },
            },
            {
                elementId: "910a55c3-507a-4eda-ace8-24ca4aabbcab",
                questionResponse: {
                    questionId: "a0ecdac8-01d9-4af7-83e3-e1f6ee099915",
                    score: "1",
                    sectionId: "a0ecdac8-01d9-4af7-83e3-e1f6ee099915",
                    radioResponse: {
                        selectedOption: {
                            optionId: "f14ff16a-a29f-4f8f-b596-7f911a30c661",
                        },
                    },
                },
            },
            {
                elementId: "02a4c209-860f-47ac-ba30-ed495b323208",
                questionResponse: {
                    questionId: "058c00b9-6d85-4ca6-aacc-89afcfe56a09",
                    score: "1",
                    sectionId: "058c00b9-6d85-4ca6-aacc-89afcfe56a09",
                    radioResponse: {
                        selectedOption: {
                            optionId: "f35fc415-c9d9-4e87-bcc8-85d880dac2d0",
                        },
                    },
                },
            },
            {
                elementId: "2364b639-5fd6-4d27-a755-7274a8f6d194",
                questionResponse: {
                    questionId: "fd412782-2c5c-4d15-9210-9cfb58c38242",
                    score: "1",
                    sectionId: "fd412782-2c5c-4d15-9210-9cfb58c38242",
                    radioResponse: {
                        selectedOption: {
                            optionId: "7019d1dd-0d54-49e1-a538-f9a9abc17402",
                        },
                    },
                },
            },
            {
                elementId: "2e22ce25-56b9-483a-883f-897284056407",
                questionResponse: {
                    questionId: "fa8d10bc-9e29-4f29-bf04-58c2b7f6e24f",
                    score: "1",
                    sectionId: "fa8d10bc-9e29-4f29-bf04-58c2b7f6e24f",
                    radioResponse: {
                        selectedOption: {
                            optionId: "33151a6e-2e8c-40f2-9e8b-896795fa877d",
                        },
                    },
                },
            },
            {
                elementId: "b0d7ab6e-3f60-42a0-8310-217ff5597fcd",
                questionResponse: {
                    questionId: "3346df87-c512-40cc-af70-d87ebbc9d999",
                    score: "1",
                    sectionId: "3346df87-c512-40cc-af70-d87ebbc9d999",
                    radioResponse: {
                        selectedOption: {
                            optionId: "615c33c1-818a-4243-b120-28f39fdbb45a",
                        },
                    },
                },
            },
            {
                elementId: "f41f8f0d-aa28-4989-9e61-84336c498e31",
                questionResponse: {
                    questionId: "3a56771e-b0ef-448e-8fb9-504e87b70d81",
                    score: "1",
                    sectionId: "3a56771e-b0ef-448e-8fb9-504e87b70d81",
                    radioResponse: {
                        selectedOption: {
                            optionId: "42d49044-ce77-4321-9e94-0cb2103610d7",
                        },
                    },
                },
            },
            {
                elementId: "c23dba4d-8f04-4c5e-8e00-35fc56a95586",
                questionResponse: {
                    questionId: "a361c303-bec5-4d80-bece-0f4c2b8ebfc8",
                    score: "1",
                    sectionId: "a361c303-bec5-4d80-bece-0f4c2b8ebfc8",
                    radioResponse: {
                        selectedOption: {
                            optionId: "b6918e15-f9c5-45db-85ed-e76b264c0838",
                        },
                    },
                },
            },
            {
                elementId: "fdd163e5-644e-420a-84eb-e12d1a3b450e",
                questionResponse: {
                    questionId: "16d2efdb-d345-458c-b674-d2e58c5a6381",
                    score: "1",
                    sectionId: "16d2efdb-d345-458c-b674-d2e58c5a6381",
                    radioResponse: {
                        selectedOption: {
                            optionId: "e61aa2a8-b7ae-458d-a422-42b928176462",
                        },
                    },
                },
            },
            {
                elementId: "3aff4007-dc70-435a-b6c3-fdd791b9833a",
                questionResponse: {
                    questionId: "f3c4ec94-db1f-4795-baba-94411a6afb32",
                    score: "1",
                    sectionId: "f3c4ec94-db1f-4795-baba-94411a6afb32",
                    radioResponse: {
                        selectedOption: {
                            optionId: "7e60281e-2823-4e01-8eeb-4f0a89b5a9fb",
                        },
                    },
                },
            },
            {
                elementId: "ab6658f0-5004-4075-898c-e47f12f1cb9e",
                questionResponse: {
                    questionId: "56cab489-c003-48cf-9716-1442a77c8237",
                    score: "1",
                    sectionId: "56cab489-c003-48cf-9716-1442a77c8237",
                    radioResponse: {
                        selectedOption: {
                            optionId: "61087430-fdc4-4eb3-8cca-b1702f924470",
                        },
                    },
                },
            },
            {
                elementId: "bdf4d52a-9ef0-4f02-84e5-0a103c01ac9b",
                questionResponse: {
                    questionId: "1e8d4afb-5d2b-465a-8c10-f353f090bcf2",
                    score: "1",
                    sectionId: "1e8d4afb-5d2b-465a-8c10-f353f090bcf2",
                    radioResponse: {
                        selectedOption: {
                            optionId: "d4dfe2fa-e441-4a39-a017-c98817556a5e",
                        },
                    },
                },
            },
            {
                elementId: "c1498f8c-f711-46dc-a395-597a01c61d13",
                questionResponse: {
                    questionId: "49e6ce77-8bd3-4a1e-93b8-d780468161ef",
                    score: "1",
                    sectionId: "49e6ce77-8bd3-4a1e-93b8-d780468161ef",
                    radioResponse: {
                        selectedOption: {
                            optionId: "2fb6b936-d7b4-49b9-b666-cb554bc2a723",
                        },
                    },
                },
            },
        ],
        createTime: "2026-06-18T08:35:37.423041Z",
        updateTime: "2026-06-18T08:44:34.073917Z",
        status: "COMPLETED",
        result: "PASS",
        attemptNumber: 1,
        maxScore: "20",
        aiConversationDetails: {},
    },
};

// Now this call works perfectly
highlightResults(json_de);
