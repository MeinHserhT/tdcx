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
  "quizEvaluation": {
    "name": "batches/1133983968236530696/quizEvaluations/623311960786187608",
    "batchName": "batches/1133983968236530696",
    "quizName": "quizzes/6486093360891907136",
    "creator": "vongoc@google.com",
    "score": "22",
    "elementResponses": [
      {
        "elementId": "c23216e5-edb1-42b7-9570-1f70d055ccc5",
        "questionResponse": {
          "questionId": "6d48ad3c-25e2-4eff-8989-4aedf1fb4ce0",
          "score": "1",
          "sectionId": "6d48ad3c-25e2-4eff-8989-4aedf1fb4ce0",
          "radioResponse": {
            "selectedOption": {
              "optionId": "ed6889d4-86d6-493b-8909-8e8680a5e45b"
            }
          }
        }
      },
      {
        "elementId": "03ec7299-a3f3-4ae1-bd3f-a2615553343e",
        "questionResponse": {
          "questionId": "bf5942c1-30d9-4ef3-a606-7db0163398eb",
          "score": "1",
          "sectionId": "bf5942c1-30d9-4ef3-a606-7db0163398eb",
          "radioResponse": {
            "selectedOption": {
              "optionId": "ea68dec3-fea2-475b-a266-649a79f4bfe6"
            }
          }
        }
      },
      {
        "elementId": "a3729871-418e-428a-a9b0-2c4fa19f8c19",
        "questionResponse": {
          "questionId": "1a62b965-667e-4fe6-99ce-7d076413d7e5",
          "score": "1",
          "sectionId": "1a62b965-667e-4fe6-99ce-7d076413d7e5",
          "radioResponse": {
            "selectedOption": {
              "optionId": "f532cd32-e997-4935-ad91-72250a6b1617"
            }
          }
        }
      },
      {
        "elementId": "7c0a84cf-4136-423e-a17a-3aa80045563e",
        "questionResponse": {
          "questionId": "8d4745db-af01-4eb5-87a4-0060b5732bce",
          "score": "1",
          "sectionId": "8d4745db-af01-4eb5-87a4-0060b5732bce",
          "radioResponse": {
            "selectedOption": {
              "optionId": "3192413b-ca60-4d89-8afa-d44572775bdc"
            }
          }
        }
      },
      {
        "elementId": "043b91dc-10db-4f8f-9a0e-eeaca31f10f5",
        "questionResponse": {
          "questionId": "05d588a1-f79c-4a3e-ba76-ee8bbea912ff",
          "score": "1",
          "sectionId": "05d588a1-f79c-4a3e-ba76-ee8bbea912ff",
          "radioResponse": {
            "selectedOption": {
              "optionId": "a1be53d9-2b65-4464-bfb2-0f965220e2da"
            }
          }
        }
      },
      {
        "elementId": "012de415-32d2-417c-9ad6-c0771424ea34",
        "questionResponse": {
          "questionId": "e7a4ad19-d75c-4cd6-8700-baeffce14e90",
          "score": "1",
          "sectionId": "e7a4ad19-d75c-4cd6-8700-baeffce14e90",
          "radioResponse": {
            "selectedOption": {
              "optionId": "73bab794-64f7-4b3e-baa6-6aff488e0dcf"
            }
          }
        }
      },
      {
        "elementId": "fc7f7a80-9435-4aa3-b8a3-21d6db5cab57",
        "questionResponse": {
          "questionId": "ac4e3a3a-5d92-4cbf-b551-3e4ec68508ee",
          "score": "1",
          "sectionId": "ac4e3a3a-5d92-4cbf-b551-3e4ec68508ee",
          "radioResponse": {
            "selectedOption": {
              "optionId": "a7f1ef08-1309-4489-a410-a5acd1bc0eda"
            }
          }
        }
      },
      {
        "elementId": "f25db02a-f8e2-4e41-85a7-df94382768d2",
        "questionResponse": {
          "questionId": "38cb2c72-10d7-46e8-9a1d-29eec5a4dc4c",
          "sectionId": "38cb2c72-10d7-46e8-9a1d-29eec5a4dc4c",
          "radioResponse": {
            "selectedOption": {
              "optionId": "3090b445-36aa-4211-87fd-7fb9a68de055"
            }
          }
        }
      },
      {
        "elementId": "4202b25f-8438-4712-be50-e8d6fa18526b",
        "questionResponse": {
          "questionId": "e138e35f-7d39-4911-bc6f-9d0414eccd3f",
          "score": "1",
          "sectionId": "e138e35f-7d39-4911-bc6f-9d0414eccd3f",
          "radioResponse": {
            "selectedOption": {
              "optionId": "8f2891f1-d6d8-4686-af41-feda995f0ea1"
            }
          }
        }
      },
      {
        "elementId": "e031ac14-e14b-441d-8a0a-e9f54b360792",
        "questionResponse": {
          "questionId": "57e0cef6-2e2f-473b-a177-fd50385e7285",
          "score": "1",
          "sectionId": "57e0cef6-2e2f-473b-a177-fd50385e7285",
          "radioResponse": {
            "selectedOption": {
              "optionId": "07535558-44ab-4d5f-8d75-0ca60deb8da1"
            }
          }
        }
      },
      {
        "elementId": "ab89ac1d-80e8-40c3-8033-d98d5970f937",
        "questionResponse": {
          "questionId": "e7cc8f06-d509-4835-8d7f-b642f939864d",
          "score": "1",
          "sectionId": "e7cc8f06-d509-4835-8d7f-b642f939864d",
          "radioResponse": {
            "selectedOption": {
              "optionId": "d11f557a-35ce-45fc-ab45-f27f403762c9"
            }
          }
        }
      },
      {
        "elementId": "2c544de3-f4a3-4a72-b1ff-4ad897aa5ffa",
        "questionResponse": {
          "questionId": "00584338-0402-44a5-9865-a6f6b473888d",
          "score": "1",
          "sectionId": "00584338-0402-44a5-9865-a6f6b473888d",
          "radioResponse": {
            "selectedOption": {
              "optionId": "844ad7b3-05ea-4b82-ba44-8a0c81e857a4"
            }
          }
        }
      },
      {
        "elementId": "b87b341c-5163-498c-b02a-e73533e4cbc3",
        "questionResponse": {
          "questionId": "f19c84af-4b0d-42df-998d-6b5513a4ff90",
          "score": "1",
          "sectionId": "f19c84af-4b0d-42df-998d-6b5513a4ff90",
          "radioResponse": {
            "selectedOption": {
              "optionId": "b06be1da-59fc-487c-80ba-9d2774043182"
            }
          }
        }
      },
      {
        "elementId": "ee5aaf83-9a44-4097-9025-4b1da0a40e5d",
        "questionResponse": {
          "questionId": "c0b3020f-e6db-4b4f-a07e-e0233ab74de5",
          "score": "1",
          "sectionId": "c0b3020f-e6db-4b4f-a07e-e0233ab74de5",
          "radioResponse": {
            "selectedOption": {
              "optionId": "facc4170-7f34-4f5d-a7e7-68960c829572"
            }
          }
        }
      },
      {
        "elementId": "f1ba1ee6-1cd4-4f58-ab00-7ebddd9f1888",
        "questionResponse": {
          "questionId": "0b732748-b796-4e04-ab67-fe4cf4b06182",
          "score": "1",
          "sectionId": "0b732748-b796-4e04-ab67-fe4cf4b06182",
          "radioResponse": {
            "selectedOption": {
              "optionId": "e0e034fa-7edc-493a-883c-82ba5c18288a"
            }
          }
        }
      },
      {
        "elementId": "89510759-0daa-4de6-80f1-f1741e5ae45a",
        "questionResponse": {
          "questionId": "3419e2a7-266e-4019-9f21-f43e2c444aa6",
          "score": "1",
          "sectionId": "3419e2a7-266e-4019-9f21-f43e2c444aa6",
          "radioResponse": {
            "selectedOption": {
              "optionId": "395f0631-e0a9-4b1f-a583-55ef18b09664"
            }
          }
        }
      },
      {
        "elementId": "09f5afb8-dc90-4c27-9b55-5b7e168aaef9",
        "questionResponse": {
          "questionId": "a09f856b-e364-46b0-869e-6cad85ec6504",
          "score": "1",
          "sectionId": "a09f856b-e364-46b0-869e-6cad85ec6504",
          "radioResponse": {
            "selectedOption": {
              "optionId": "ad99c920-47aa-467f-a9a0-880534575ccd"
            }
          }
        }
      },
      {
        "elementId": "72ff89e2-3b8c-4f38-8080-ed8848284cb9",
        "questionResponse": {
          "questionId": "48183c3a-df9b-4250-aa70-49d5fc0e4523",
          "score": "1",
          "sectionId": "48183c3a-df9b-4250-aa70-49d5fc0e4523",
          "radioResponse": {
            "selectedOption": {
              "optionId": "3b35f3c5-8b2b-443e-b399-3498a6ddeaea"
            }
          }
        }
      },
      {
        "elementId": "439a5c85-5e80-4716-a8dc-8c11c2a977ea",
        "questionResponse": {
          "questionId": "eaaaa639-b5bf-42b5-a8b4-65360e68203c",
          "score": "1",
          "sectionId": "eaaaa639-b5bf-42b5-a8b4-65360e68203c",
          "radioResponse": {
            "selectedOption": {
              "optionId": "ee3b6a92-2137-42cb-8de6-4fca20e17263"
            }
          }
        }
      },
      {
        "elementId": "b1ed4236-4627-4ae9-8b44-0507efb74fa2",
        "questionResponse": {
          "questionId": "d24b0047-9b5c-4f4f-9d7a-22d4ff083128",
          "sectionId": "d24b0047-9b5c-4f4f-9d7a-22d4ff083128",
          "radioResponse": {
            "selectedOption": {
              "optionId": "2a365633-b4c3-43b1-8aa1-b2e96808db13"
            }
          }
        }
      },
      {
        "elementId": "e810ae20-dc22-4c82-a7e0-d43e2ff734ff",
        "questionResponse": {
          "questionId": "40fd3509-b027-45c9-8bc4-08e159c8ea11",
          "score": "1",
          "sectionId": "40fd3509-b027-45c9-8bc4-08e159c8ea11",
          "radioResponse": {
            "selectedOption": {
              "optionId": "27d34877-ef49-48cf-8050-d94b7b62c971"
            }
          }
        }
      },
      {
        "elementId": "aae43c71-641c-4a54-b5b6-fb5a860bd1ca",
        "questionResponse": {
          "questionId": "eb801411-0557-4429-bcf6-29d65e4bf120",
          "sectionId": "eb801411-0557-4429-bcf6-29d65e4bf120",
          "radioResponse": {
            "selectedOption": {
              "optionId": "4d4cce16-8139-4e26-bb1d-a8b15519c5e3"
            }
          }
        }
      },
      {
        "elementId": "c92a84cd-30d4-4412-8cc8-40f03e8f6e2c",
        "questionResponse": {
          "questionId": "727e2437-3ea4-4e71-9f3a-926efe031f15",
          "score": "1",
          "sectionId": "727e2437-3ea4-4e71-9f3a-926efe031f15",
          "radioResponse": {
            "selectedOption": {
              "optionId": "75162c4b-b59b-4d28-9472-38fa91541684"
            }
          }
        }
      },
      {
        "elementId": "3c7cd74c-de49-4622-beee-d3ea3bf66089",
        "questionResponse": {
          "questionId": "c9595059-a502-4313-92cb-89cfc8aee9a0",
          "score": "1",
          "sectionId": "c9595059-a502-4313-92cb-89cfc8aee9a0",
          "radioResponse": {
            "selectedOption": {
              "optionId": "30364b92-1032-4521-859d-4c3ea0108b0d"
            }
          }
        }
      },
      {
        "elementId": "8d2a630b-9b37-4821-bbc7-d37025d53a5d",
        "questionResponse": {
          "questionId": "4ec6bab5-891b-4eb7-9f81-35cb926fdd37",
          "score": "1",
          "sectionId": "4ec6bab5-891b-4eb7-9f81-35cb926fdd37",
          "radioResponse": {
            "selectedOption": {
              "optionId": "32c19da0-595c-476c-8bc4-65845079dd54"
            }
          }
        }
      }
    ],
    "createTime": "2026-09-15T08:21:39.259998Z",
    "updateTime": "2026-09-15T08:32:00.991772Z",
    "status": "COMPLETED",
    "result": "PASS",
    "attemptNumber": 1,
    "maxScore": "25",
    "aiConversationDetails": {}
  }
}
// Now this call works perfectly
highlightResults(json_de);
