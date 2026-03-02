const highlightResults = (data) => {
    const bgErrQ = "#ffdada",
        bgOk = "#4CAF50",
        bgErr = "red";
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
            ...(qr.checkBoxResponse?.selectedOptions || []).map(
                (o) => o.optionId
            ),
        ].filter(Boolean);

        optIds.forEach((id) => colorEl(`[id*="${id}"]`, optColor));
    });
};

const json_de = {
    quizEvaluation: {
        name: "batches/5025804138156444032/quizEvaluations/5899457892062884976",
        batchName: "batches/5025804138156444032",
        quizName: "quizzes/1015003498151350584",
        creator: "abc@abc.com",
        score: "18",
        elementResponses: [
            {
                elementId: "d4d62615-315a-4f3d-896d-e002cdb74bef",
                questionResponse: {
                    questionId: "c04c830c-480e-40d1-9a2c-d2ac2ac7a445",
                    score: "1",
                    sectionId: "c04c830c-480e-40d1-9a2c-d2ac2ac7a445",
                    radioResponse: {
                        selectedOption: {
                            optionId: "e5218b8e-34a1-4790-b370-deb38bed2c17",
                        },
                    },
                },
            },
            {
                elementId: "3a2fb09d-db15-487c-888e-894f2d2a61e6",
                questionResponse: {
                    questionId: "3adee19a-b249-4463-a7ac-295cb363bb78",
                    score: "1",
                    sectionId: "3adee19a-b249-4463-a7ac-295cb363bb78",
                    radioResponse: {
                        selectedOption: {
                            optionId: "12a48ca8-d31e-47f8-818b-787b0f48ddec",
                        },
                    },
                },
            },
            {
                elementId: "37550c0b-b5f3-476e-8ad6-354551acceaa",
                questionResponse: {
                    questionId: "cee2c67d-02f2-41c3-b7dc-b284caa3d8cb",
                    score: "1",
                    sectionId: "cee2c67d-02f2-41c3-b7dc-b284caa3d8cb",
                    radioResponse: {
                        selectedOption: {
                            optionId: "3432058d-9195-4cb6-a6b4-0136023d6ef5",
                        },
                    },
                },
            },
            {
                elementId: "a22b2899-8464-43fe-90da-2efb43fb7e94",
                questionResponse: {
                    questionId: "74f54e63-57ff-4524-9670-042a5d8a4fec",
                    score: "1",
                    sectionId: "74f54e63-57ff-4524-9670-042a5d8a4fec",
                    radioResponse: {
                        selectedOption: {
                            optionId: "8848ccac-bed3-4342-8681-d56a10c7e8fb",
                        },
                    },
                },
            },
            {
                elementId: "519992da-8bbe-479e-947b-ec8a3bb6f432",
                questionResponse: {
                    questionId: "8d75d52a-869c-4b51-8358-e694b3381cf5",
                    score: "1",
                    sectionId: "8d75d52a-869c-4b51-8358-e694b3381cf5",
                    radioResponse: {
                        selectedOption: {
                            optionId: "2767502f-12ac-410b-978f-117005e7848a",
                        },
                    },
                },
            },
            {
                elementId: "c1a36c8f-a0b1-4a95-9791-3a6b27ae0dd5",
                questionResponse: {
                    questionId: "b1050909-1d53-4981-8372-4373b649646e",
                    score: "1",
                    sectionId: "b1050909-1d53-4981-8372-4373b649646e",
                    radioResponse: {
                        selectedOption: {
                            optionId: "df081cb3-cda1-4768-b343-a0cc5d72b5c4",
                        },
                    },
                },
            },
            {
                elementId: "537087b5-d532-4690-831c-6824938e07c5",
                questionResponse: {
                    questionId: "182103e8-4724-4b8e-8ab7-cfc23ca131c1",
                    score: "1",
                    sectionId: "182103e8-4724-4b8e-8ab7-cfc23ca131c1",
                    radioResponse: {
                        selectedOption: {
                            optionId: "5c0d4655-f381-42a2-8f52-fc600bad01ab",
                        },
                    },
                },
            },
            {
                elementId: "1312ee8d-7d12-423a-b4a9-25a154cd0f0c",
                questionResponse: {
                    questionId: "606226f8-c13f-46b1-8671-7fff187d58bd",
                    score: "1",
                    sectionId: "606226f8-c13f-46b1-8671-7fff187d58bd",
                    radioResponse: {
                        selectedOption: {
                            optionId: "a6491522-0c3a-4dab-ac1a-362c4536d5a8",
                        },
                    },
                },
            },
            {
                elementId: "dc9040e8-c578-4830-b980-41edda11f06f",
                questionResponse: {
                    questionId: "78897cfe-54e3-4627-89b5-c8e2d987111b",
                    score: "1",
                    sectionId: "78897cfe-54e3-4627-89b5-c8e2d987111b",
                    radioResponse: {
                        selectedOption: {
                            optionId: "26069eea-bd90-4972-9529-664a59b1c6d0",
                        },
                    },
                },
            },
            {
                elementId: "570ab4a8-f1ea-4deb-adb7-72a62fad9356",
                questionResponse: {
                    questionId: "9733ff92-f7bd-493f-b3ee-1d70cd557044",
                    score: "1",
                    sectionId: "9733ff92-f7bd-493f-b3ee-1d70cd557044",
                    radioResponse: {
                        selectedOption: {
                            optionId: "b17f1b50-130b-4e00-946e-cab19e7be25f",
                        },
                    },
                },
            },
            {
                elementId: "a8535db7-4270-4b27-bc15-dd7aba791acb",
                questionResponse: {
                    questionId: "3acfa0a2-7acc-4b2e-b35e-890581a89c67",
                    score: "1",
                    sectionId: "3acfa0a2-7acc-4b2e-b35e-890581a89c67",
                    radioResponse: {
                        selectedOption: {
                            optionId: "315a23d5-c234-4260-826b-d43653a764c6",
                        },
                    },
                },
            },
            {
                elementId: "8b55555e-4c71-4a34-984a-2ac0c9a3ac3a",
                questionResponse: {
                    questionId: "1a221986-eaef-4f93-ba5f-576b79ebd41d",
                    score: "1",
                    sectionId: "1a221986-eaef-4f93-ba5f-576b79ebd41d",
                    radioResponse: {
                        selectedOption: {
                            optionId: "0554ce25-a5e3-4c29-9d14-17c23631656a",
                        },
                    },
                },
            },
            {
                elementId: "330e3755-f1da-4852-bc07-ce3670b66a23",
                questionResponse: {
                    questionId: "1fa49b78-a948-4683-9af4-1e13dda4021e",
                    score: "1",
                    sectionId: "1fa49b78-a948-4683-9af4-1e13dda4021e",
                    radioResponse: {
                        selectedOption: {
                            optionId: "98e22326-faf1-45e9-9f43-1273210bcddd",
                        },
                    },
                },
            },
            {
                elementId: "c574a2cd-721c-455b-96f2-e0698dfac724",
                questionResponse: {
                    questionId: "f9aa2e2f-6260-4890-8388-08982c2d60b5",
                    score: "1",
                    sectionId: "f9aa2e2f-6260-4890-8388-08982c2d60b5",
                    radioResponse: {
                        selectedOption: {
                            optionId: "c892a098-e36a-4414-96a8-f335ffc5794f",
                        },
                    },
                },
            },
            {
                elementId: "2617370f-0e8e-48c4-8e21-30683fa37938",
                questionResponse: {
                    questionId: "474b752f-db41-4dd9-bc1d-5f258351d92c",
                    score: "1",
                    sectionId: "474b752f-db41-4dd9-bc1d-5f258351d92c",
                    radioResponse: {
                        selectedOption: {
                            optionId: "260fb3c5-7903-48cc-833c-633a5af62d0a",
                        },
                    },
                },
            },
            {
                elementId: "80f8eb5b-1350-4056-a8b1-698d238dda53",
                questionResponse: {
                    questionId: "2fbd48e3-9dec-40ba-9864-305a7c726dfe",
                    score: "1",
                    sectionId: "2fbd48e3-9dec-40ba-9864-305a7c726dfe",
                    radioResponse: {
                        selectedOption: {
                            optionId: "7243e66f-5b32-4e7f-abbf-b8affb54b398",
                        },
                    },
                },
            },
            {
                elementId: "f53e9022-6f0b-42d7-9e63-c09267aed5c0",
                questionResponse: {
                    questionId: "e6a348d9-0835-4954-a609-54aaca7a6f34",
                    score: "1",
                    sectionId: "e6a348d9-0835-4954-a609-54aaca7a6f34",
                    radioResponse: {
                        selectedOption: {
                            optionId: "83ff1372-4d9a-4f50-b3a2-1ee5037f006e",
                        },
                    },
                },
            },
            {
                elementId: "0002e7b9-70e3-4c07-9ca5-0a3d7829d1bb",
                questionResponse: {
                    questionId: "e494e406-3424-40a2-abb4-7fccf79461c5",
                    score: "1",
                    sectionId: "e494e406-3424-40a2-abb4-7fccf79461c5",
                    radioResponse: {
                        selectedOption: {
                            optionId: "ed7af648-e0e5-4f81-8f74-df7863295ac7",
                        },
                    },
                },
            },
        ],
        createTime: "2026-02-09T02:47:07.992333Z",
        updateTime: "2026-02-09T08:20:27.701307Z",
        status: "COMPLETED",
        result: "PASS",
        attemptNumber: 1,
        maxScore: "18",
        aiConversationDetails: {},
    },
};

highlightResults(json_de);
