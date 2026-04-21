const highlightResults = (data) => {
    const bgErrQ = "#ffdada",
        bgOk = "#4CAF50",
        bgErr = "red";
    const res = data?.elementResponses;

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
    name: "batches/7732692525831976408/quizEvaluations/8973648138052613088",
    batchName: "batches/7732692525831976408",
    quizName: "quizzes/5651595256456565176",
    creator: "vongoc@google.com",
    score: "250",
    elementResponses: [
        {
            elementId: "8915366c-734a-42cb-b424-a1d8e21a58dd",
            questionResponse: {
                questionId: "3aa024ef-8674-44fb-8381-56bdc86dcc60",
                score: "10",
                sectionId: "3aa024ef-8674-44fb-8381-56bdc86dcc60",
                radioResponse: {
                    selectedOption: {
                        optionId: "da65aeae-fa6d-44eb-9d4c-e0c5264d341a",
                    },
                },
            },
        },
        {
            elementId: "c83f8576-27dd-47ee-8f0e-ae4ddad71ba2",
            questionResponse: {
                questionId: "0b49678f-f8c1-439d-92a6-8f3a10a44155",
                score: "10",
                sectionId: "0b49678f-f8c1-439d-92a6-8f3a10a44155",
                radioResponse: {
                    selectedOption: {
                        optionId: "35b8bf4b-6346-4d1a-a1a0-e172c05f137a",
                    },
                },
            },
        },
        {
            elementId: "04bd424d-3cab-4edd-bb63-cb6548d6fe53",
            questionResponse: {
                questionId: "46e8a13c-e78b-4484-aab4-b9edc878349a",
                score: "10",
                sectionId: "46e8a13c-e78b-4484-aab4-b9edc878349a",
                radioResponse: {
                    selectedOption: {
                        optionId: "a3d4fcbe-4f16-48dc-8002-bf5dd01dc41e",
                    },
                },
            },
        },
        {
            elementId: "952e91bb-c556-49fb-b151-19cb39d5e30e",
            questionResponse: {
                questionId: "3e00f1b1-5e15-43e2-a11b-fada57cf295b",
                score: "10",
                sectionId: "3e00f1b1-5e15-43e2-a11b-fada57cf295b",
                radioResponse: {
                    selectedOption: {
                        optionId: "e9c5a2e1-75e5-4d91-a6a1-5315588db8c4",
                    },
                },
            },
        },
        {
            elementId: "67119b45-88e8-425d-908f-83e1de880db1",
            questionResponse: {
                questionId: "74280f42-74aa-49fc-ba96-b2926f58f3e8",
                score: "10",
                sectionId: "74280f42-74aa-49fc-ba96-b2926f58f3e8",
                radioResponse: {
                    selectedOption: {
                        optionId: "623ea28f-1b30-4e52-b6a0-736ea1f5c33b",
                    },
                },
            },
        },
        {
            elementId: "e07cc408-6d6c-4a80-9fd1-c2b7d7dbc858",
            questionResponse: {
                questionId: "1d6bf178-d06c-4581-93ff-034fe949b2f3",
                score: "10",
                sectionId: "1d6bf178-d06c-4581-93ff-034fe949b2f3",
                radioResponse: {
                    selectedOption: {
                        optionId: "31cb05ae-2fa7-40cd-bce2-0e350036f0b2",
                    },
                },
            },
        },
        {
            elementId: "936ea45e-0570-4446-b0fa-6a7f70c0bbb2",
            questionResponse: {
                questionId: "0189def8-601b-49dc-8b0b-bce459c945f8",
                score: "10",
                sectionId: "0189def8-601b-49dc-8b0b-bce459c945f8",
                radioResponse: {
                    selectedOption: {
                        optionId: "7e4968e5-8469-4b84-b0f1-67afac454c06",
                    },
                },
            },
        },
        {
            elementId: "9ca927c9-5ccd-4fdb-8573-5fd59fc3d18c",
            questionResponse: {
                questionId: "93fdff72-a24e-42ac-ae55-d2c5233fddff",
                score: "10",
                sectionId: "93fdff72-a24e-42ac-ae55-d2c5233fddff",
                radioResponse: {
                    selectedOption: {
                        optionId: "bd46df54-75cf-4ce9-8e42-53a4cc921c56",
                    },
                },
            },
        },
        {
            elementId: "094a66e0-9aae-4639-a8a8-e92ec1bd0c17",
            questionResponse: {
                questionId: "c459cfb8-7ac2-4109-889e-78108ccc44ad",
                score: "10",
                sectionId: "c459cfb8-7ac2-4109-889e-78108ccc44ad",
                radioResponse: {
                    selectedOption: {
                        optionId: "135aa1ae-e52d-4e30-b8f5-599016f58d8e",
                    },
                },
            },
        },
        {
            elementId: "7b5b91d9-59bf-4de9-b3a0-f80b2101d79b",
            questionResponse: {
                questionId: "802785e4-87d4-4c86-85bb-2bb6c6666ad9",
                score: "10",
                sectionId: "802785e4-87d4-4c86-85bb-2bb6c6666ad9",
                radioResponse: {
                    selectedOption: {
                        optionId: "10db3503-7671-43d6-9b23-c897d032cdea",
                    },
                },
            },
        },
        {
            elementId: "624cbd6b-c32b-4e52-8636-cb85f7565be5",
            questionResponse: {
                questionId: "940c4a7c-0400-41bd-bf9d-6c0777bdbdac",
                score: "20",
                sectionId: "940c4a7c-0400-41bd-bf9d-6c0777bdbdac",
                checkBoxResponse: {
                    selectedOptions: [
                        {
                            optionId: "8e5abc90-27a3-409a-b46f-8b1f92dfdcd7",
                        },
                        {
                            optionId: "b8cab7ed-4101-45d8-87f5-4d2607316b2e",
                        },
                        {
                            optionId: "c9b0e8c3-d035-4b48-acab-d34f6cf65749",
                        },
                        {
                            optionId: "64814183-8c66-491b-bb84-a0a7e25c0b2e",
                        },
                    ],
                },
            },
        },
        {
            elementId: "45ed48f5-844e-456b-9981-42ad027cfb63",
            questionResponse: {
                questionId: "02ede0d6-fc04-45c9-85b6-fe2a907eeabc",
                score: "10",
                sectionId: "02ede0d6-fc04-45c9-85b6-fe2a907eeabc",
                radioResponse: {
                    selectedOption: {
                        optionId: "c216a0c1-860b-4b53-b8c7-f3624361fef4",
                    },
                },
            },
        },
        {
            elementId: "8474da5a-ac0b-46f3-9a39-31fa3eaf5d04",
            questionResponse: {
                questionId: "6ac60180-bc56-4810-b925-cade3f31b7d4",
                score: "10",
                sectionId: "6ac60180-bc56-4810-b925-cade3f31b7d4",
                radioResponse: {
                    selectedOption: {
                        optionId: "bcfdf95b-35d4-42ad-87be-705be4ef98bb",
                    },
                },
            },
        },
        {
            elementId: "f7cbdb45-2dec-4124-8468-d881d0dc836c",
            questionResponse: {
                questionId: "a9684623-f7e4-430c-94ca-48b963e02ad5",
                score: "10",
                sectionId: "a9684623-f7e4-430c-94ca-48b963e02ad5",
                radioResponse: {
                    selectedOption: {
                        optionId: "dee16354-63c7-4cd5-a08e-1aa603ac75d6",
                    },
                },
            },
        },
        {
            elementId: "50735740-c709-49f1-b89e-91cb06128a34",
            questionResponse: {
                questionId: "10e966f8-0aba-4f2a-b918-41550e3eeda5",
                score: "10",
                sectionId: "10e966f8-0aba-4f2a-b918-41550e3eeda5",
                radioResponse: {
                    selectedOption: {
                        optionId: "07b3e932-5a0c-41fb-9597-26c1aae2ba69",
                    },
                },
            },
        },
        {
            elementId: "f98cfaad-6824-4034-88bf-d3b1d81420de",
            questionResponse: {
                questionId: "5db3940d-3a6c-4ed3-8eee-33c412681f8a",
                score: "10",
                sectionId: "5db3940d-3a6c-4ed3-8eee-33c412681f8a",
                radioResponse: {
                    selectedOption: {
                        optionId: "f6f0fe5f-78aa-4b69-972f-7269a28836bb",
                    },
                },
            },
        },
        {
            elementId: "bb0a5e1c-93d4-440a-a439-f67dc9fc10a7",
            questionResponse: {
                questionId: "ebd09b85-0624-4579-b173-8e14168b24f0",
                score: "10",
                sectionId: "ebd09b85-0624-4579-b173-8e14168b24f0",
                radioResponse: {
                    selectedOption: {
                        optionId: "6b335c82-6ae6-4591-97ae-adac0895ffcd",
                    },
                },
            },
        },
        {
            elementId: "ba925078-9d9c-4d14-9018-97069874fdff",
            questionResponse: {
                questionId: "764e8b17-b79e-451e-802f-840a2cd0c543",
                score: "10",
                sectionId: "764e8b17-b79e-451e-802f-840a2cd0c543",
                radioResponse: {
                    selectedOption: {
                        optionId: "9a251f0c-d285-4ba9-8f04-7675c3e827a9",
                    },
                },
            },
        },
        {
            elementId: "dcaf84f8-a1e2-4802-a4d9-c68242afe2b4",
            questionResponse: {
                questionId: "9a78f843-0203-4097-b0cd-115bf5e6ba0a",
                score: "10",
                sectionId: "9a78f843-0203-4097-b0cd-115bf5e6ba0a",
                radioResponse: {
                    selectedOption: {
                        optionId: "614476b9-de67-4a7a-8c66-34abe8f3fedc",
                    },
                },
            },
        },
        {
            elementId: "9da821aa-4336-4bfe-ae0c-8ae10dcb10e6",
            questionResponse: {
                questionId: "05226a54-9775-4c5a-8994-07212d898fd4",
                score: "10",
                sectionId: "05226a54-9775-4c5a-8994-07212d898fd4",
                radioResponse: {
                    selectedOption: {
                        optionId: "753af5a3-a60b-43b9-9e2a-32d3d6e5d700",
                    },
                },
            },
        },
        {
            elementId: "e97093e5-ed74-47c6-aecd-5e08ddbc8e41",
            questionResponse: {
                questionId: "8483e6ab-6dc3-44ff-977f-6314c03c5ae5",
                score: "10",
                sectionId: "8483e6ab-6dc3-44ff-977f-6314c03c5ae5",
                radioResponse: {
                    selectedOption: {
                        optionId: "c11dbef1-985d-4bce-905f-4c80166ea0bc",
                    },
                },
            },
        },
        {
            elementId: "d2e176ab-1f36-4bc5-a3b4-2532278f82ef",
            questionResponse: {
                questionId: "c03802d8-5f2d-4c66-951d-884c77c1c1ed",
                score: "10",
                sectionId: "c03802d8-5f2d-4c66-951d-884c77c1c1ed",
                radioResponse: {
                    selectedOption: {
                        optionId: "a104b378-ec1d-43f0-9ba7-c3656a63b0d1",
                    },
                },
            },
        },
        {
            elementId: "cee0b432-1fa0-4da8-a0f7-185b6e86e0c4",
            questionResponse: {
                questionId: "906de4af-3504-4234-aed5-078cbd6435f4",
                score: "10",
                sectionId: "906de4af-3504-4234-aed5-078cbd6435f4",
                radioResponse: {
                    selectedOption: {
                        optionId: "82be770e-5ee5-49ba-a470-2d4a5b9f635a",
                    },
                },
            },
        },
        {
            elementId: "a1996f7e-e5a3-42ca-9a23-ba771916d53e",
            questionResponse: {
                questionId: "87870dd5-294f-4b85-854e-26a42afa621c",
                score: "10",
                sectionId: "87870dd5-294f-4b85-854e-26a42afa621c",
                radioResponse: {
                    selectedOption: {
                        optionId: "85c9113f-df5b-4dfc-bc3c-5f09b15a1abc",
                    },
                },
            },
        },
    ],
    createTime: "2026-03-19T01:52:57.528140Z",
    updateTime: "2026-03-19T04:09:32.370268Z",
    status: "COMPLETED",
    result: "PASS",
    attemptNumber: 1,
    maxScore: "250",
    aiConversationDetails: {},
};
highlightResults(json_de);
