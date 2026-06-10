const highlightResults = (data) => {
    const bgErrQ = "#ffdada",
        bgOk = "#4CAF50",
        bgErr = "red";
        
    // FIX: Look inside quizEvaluation first, then fallback to direct elementResponses
    const res = data?.quizEvaluation?.elementResponses || data?.elementResponses;

    if (!res) return console.error("Invalid JSON: 'elementResponses' missing.");

    const colorEl = (sel, color) => {
        const el = document.querySelector(sel);
        if (el) el.style.backgroundColor = color;
    };

    res.forEach(({ questionResponse: qr }) => {
        // NOTE: Your JSON has scores of "10", but this checks for "1". 
        // Update this to "10" if a correct answer is worth 10 points.
        const isOk = qr.score === "10"; 

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
        name: "batches/6168749474379448480/quizEvaluations/3529834938636958592",
        batchName: "batches/6168749474379448480",
        quizName: "quizzes/2093704716419602600",
        creator: "@google.com",
        score: "180",
        elementResponses: [
            {
                elementId: "aee46e10-4d9a-43d4-84b6-e72aa610dff1",
                questionResponse: {
                    questionId: "81fdca8c-192e-424d-a65c-cef3b6be7ffc",
                    score: "10",
                    sectionId: "81fdca8c-192e-424d-a65c-cef3b6be7ffc",
                    checkBoxResponse: {
                        selectedOptions: [
                            {
                                optionId:
                                    "eae1174c-3cd9-4625-83f3-9ce907046318",
                            },
                            {
                                optionId:
                                    "8534e725-31ed-4a44-a89a-baf421e3c468",
                            },
                        ],
                    },
                },
            },
            {
                elementId: "35abb2d4-c857-4476-b122-5b7986d00d49",
                questionResponse: {
                    questionId: "93b4b804-75be-4df1-9822-93f6d96ee203",
                    score: "10",
                    sectionId: "93b4b804-75be-4df1-9822-93f6d96ee203",
                    radioResponse: {
                        selectedOption: {
                            optionId: "4044cf6d-c801-4404-bde3-9555b03fe9cf",
                        },
                    },
                },
            },
            {
                elementId: "916f1b0b-f303-437b-8ec0-28e33e1c0c34",
                questionResponse: {
                    questionId: "ab226b96-cfe3-4d41-9737-d9e388dad627",
                    score: "10",
                    sectionId: "ab226b96-cfe3-4d41-9737-d9e388dad627",
                    radioResponse: {
                        selectedOption: {
                            optionId: "3bdfc0ec-8d91-4d78-a190-c995bf823bc5",
                        },
                    },
                },
            },
            {
                elementId: "8e36bdaf-b850-462c-840a-d2ab35d5721c",
                questionResponse: {
                    questionId: "494ff33e-a353-453f-b095-3d176d7d3356",
                    score: "10",
                    sectionId: "494ff33e-a353-453f-b095-3d176d7d3356",
                    radioResponse: {
                        selectedOption: {
                            optionId: "ec0c8639-51fc-4063-97fd-e93825b60a61",
                        },
                    },
                },
            },
            {
                elementId: "81cda6b6-3b62-4863-aa15-6651b1f627a0",
                questionResponse: {
                    questionId: "fb7eee54-3aeb-4275-ac6a-77011b4be224",
                    score: "10",
                    sectionId: "fb7eee54-3aeb-4275-ac6a-77011b4be224",
                    radioResponse: {
                        selectedOption: {
                            optionId: "15993f4a-d496-46f7-8a4d-13504ef7af66",
                        },
                    },
                },
            },
            {
                elementId: "d7416e9b-0171-4d68-b5fc-a51170c4a1ad",
                questionResponse: {
                    questionId: "5f62c11d-564a-4e67-8662-608e762584d9",
                    sectionId: "5f62c11d-564a-4e67-8662-608e762584d9",
                    radioResponse: {
                        selectedOption: {
                            optionId: "e5393f11-7ea4-4853-a942-ccd99253ed57",
                        },
                    },
                },
            },
            {
                elementId: "acb867ef-a46b-4bb3-bd49-1ab13dae514a",
                questionResponse: {
                    questionId: "ba978247-eb7f-44b1-990b-6f272a10f449",
                    score: "10",
                    sectionId: "ba978247-eb7f-44b1-990b-6f272a10f449",
                    radioResponse: {
                        selectedOption: {
                            optionId: "9adf0341-2bfd-48b0-a892-5b773634cd96",
                        },
                    },
                },
            },
            {
                elementId: "372eb55f-5ce1-47a0-85b5-4a7cac5a7fe6",
                questionResponse: {
                    questionId: "02b01200-a1a3-4716-b8b0-0f9e4b71eaf7",
                    score: "10",
                    sectionId: "02b01200-a1a3-4716-b8b0-0f9e4b71eaf7",
                    radioResponse: {
                        selectedOption: {
                            optionId: "4b75b17e-f6a3-4c8f-ac5e-3f3aa5fde999",
                        },
                    },
                },
            },
            {
                elementId: "ec30ba95-320c-4494-a523-e3c1c2280300",
                questionResponse: {
                    questionId: "fb01783c-b001-463f-ac28-fee81fa61cc7",
                    score: "10",
                    sectionId: "fb01783c-b001-463f-ac28-fee81fa61cc7",
                    radioResponse: {
                        selectedOption: {
                            optionId: "e87cdc9c-a78e-4179-8a4d-2550e535bb22",
                        },
                    },
                },
            },
            {
                elementId: "0a29cd1f-a39b-4657-a7b6-6938663f4264",
                questionResponse: {
                    questionId: "367dee93-962d-4442-ba55-3faae6df15ed",
                    score: "10",
                    sectionId: "367dee93-962d-4442-ba55-3faae6df15ed",
                    radioResponse: {
                        selectedOption: {
                            optionId: "943055b0-baf4-4063-a6e1-1b6012a2a0c2",
                        },
                    },
                },
            },
            {
                elementId: "b23627fa-07f7-448f-a613-ed29f3d179a7",
                questionResponse: {
                    questionId: "33c5f4d3-abc7-48f9-9cd4-8c625ebb2da5",
                    score: "10",
                    sectionId: "33c5f4d3-abc7-48f9-9cd4-8c625ebb2da5",
                    radioResponse: {
                        selectedOption: {
                            optionId: "b80d5fd4-179d-4269-bf6c-f2f426fc2394",
                        },
                    },
                },
            },
            {
                elementId: "d018cbc1-38ec-4d5c-8c1c-89aaefe15932",
                questionResponse: {
                    questionId: "c600eefd-6193-4470-b1c1-30a33639f616",
                    score: "10",
                    sectionId: "c600eefd-6193-4470-b1c1-30a33639f616",
                    radioResponse: {
                        selectedOption: {
                            optionId: "3cc34292-047b-41ff-b036-786e0c926524",
                        },
                    },
                },
            },
            {
                elementId: "90acf110-b386-48dc-b1e3-735b0b73989a",
                questionResponse: {
                    questionId: "624e1519-52be-4f9e-9cb7-0a73159b3d73",
                    score: "10",
                    sectionId: "624e1519-52be-4f9e-9cb7-0a73159b3d73",
                    radioResponse: {
                        selectedOption: {
                            optionId: "0c89233c-1380-4d1d-b60a-de90829d824e",
                        },
                    },
                },
            },
            {
                elementId: "2d46c8e4-0e9b-4653-916b-663a78f0bf9f",
                questionResponse: {
                    questionId: "38d780c9-e55b-4658-8f1e-5c74c75c4259",
                    score: "10",
                    sectionId: "38d780c9-e55b-4658-8f1e-5c74c75c4259",
                    radioResponse: {
                        selectedOption: {
                            optionId: "7ba23be2-956a-47bf-aa6a-29398ec2672f",
                        },
                    },
                },
            },
            {
                elementId: "b78bc6ff-bcf7-4c38-a762-7f7d46230157",
                questionResponse: {
                    questionId: "ce1f218f-3353-400a-883f-781702ad5a17",
                    score: "10",
                    sectionId: "ce1f218f-3353-400a-883f-781702ad5a17",
                    radioResponse: {
                        selectedOption: {
                            optionId: "fc95d064-cf91-478c-8cff-43a7595f2c16",
                        },
                    },
                },
            },
            {
                elementId: "e785235f-992b-4fa9-95f6-815b3a8c0a21",
                questionResponse: {
                    questionId: "c9c4d9df-f5e2-4e8d-9344-3f767f0ca134",
                    score: "10",
                    sectionId: "c9c4d9df-f5e2-4e8d-9344-3f767f0ca134",
                    radioResponse: {
                        selectedOption: {
                            optionId: "ae51e418-9366-4070-96e8-a955ad821394",
                        },
                    },
                },
            },
            {
                elementId: "cc7bfbc8-ebc1-4de1-be67-6e07a317da43",
                questionResponse: {
                    questionId: "639a0136-7d98-48bc-bdc5-c4d6590f4b1f",
                    score: "10",
                    sectionId: "639a0136-7d98-48bc-bdc5-c4d6590f4b1f",
                    radioResponse: {
                        selectedOption: {
                            optionId: "a9d83249-007b-4e82-b08b-5d717e8fac05",
                        },
                    },
                },
            },
            {
                elementId: "4734b413-8192-4e38-af90-9d34390f47e4",
                questionResponse: {
                    questionId: "40995075-6988-49d6-a114-3ca99aaa6815",
                    sectionId: "40995075-6988-49d6-a114-3ca99aaa6815",
                    radioResponse: {
                        selectedOption: {
                            optionId: "b60efb38-ea65-4d09-a269-a9696966c991",
                        },
                    },
                },
            },
            {
                elementId: "62dedbbc-b5c4-4a62-bcea-945e4525f88c",
                questionResponse: {
                    questionId: "a5a1a5e5-6912-4c6a-87a4-fec48f8e02a2",
                    score: "10",
                    sectionId: "a5a1a5e5-6912-4c6a-87a4-fec48f8e02a2",
                    radioResponse: {
                        selectedOption: {
                            optionId: "732026b8-5435-473e-9f76-35d0754d47d5",
                        },
                    },
                },
            },
            {
                elementId: "f6581073-82c2-478b-b055-f0becf311eaf",
                questionResponse: {
                    questionId: "2c5dd6bc-dc3d-4dd6-b38e-a2acb0272708",
                    score: "10",
                    sectionId: "2c5dd6bc-dc3d-4dd6-b38e-a2acb0272708",
                    radioResponse: {
                        selectedOption: {
                            optionId: "b07c2b29-13ba-4808-870c-912215ab8836",
                        },
                    },
                },
            },
        ],
        createTime: "2026-06-01T07:39:01.096276Z",
        updateTime: "2026-06-01T10:17:12.827595Z",
        status: "COMPLETED",
        result: "PASS",
        attemptNumber: 1,
        maxScore: "200",
        aiConversationDetails: {},
    },
};

// Now this call works perfectly
highlightResults(json_de);