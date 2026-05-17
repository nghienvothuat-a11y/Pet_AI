import assert from "node:assert/strict";
import test from "node:test";

const riskLevels = new Set(["low", "medium", "high", "urgent", "unknown"]);
const petTypes = new Set(["dog", "cat", "unknown"]);

function parseAnalysis(text) {
  const value = JSON.parse(text);
  const requiredStrings = ["summary", "vetCareAdvice", "emotion", "petThought", "limitations"];
  const requiredArrays = ["observations", "possibleConcerns", "recommendedActions"];

  if (!petTypes.has(value.petTypeGuess)) {
    throw new Error("OpenAI response has an invalid petTypeGuess.");
  }

  if (!riskLevels.has(value.riskLevel)) {
    throw new Error("OpenAI response has an invalid riskLevel.");
  }

  for (const field of requiredStrings) {
    if (typeof value[field] !== "string") {
      throw new Error(`OpenAI response is missing ${field}.`);
    }
  }

  for (const field of requiredArrays) {
    if (!Array.isArray(value[field]) || !value[field].every((item) => typeof item === "string")) {
      throw new Error(`OpenAI response is missing ${field}.`);
    }
  }

  return value;
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const item of payload?.output ?? []) {
    for (const contentItem of item?.content ?? []) {
      if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
        return contentItem.text;
      }
    }
  }

  return null;
}

test("parseAnalysis accepts the expected schema", () => {
  const analysis = parseAnalysis(
    JSON.stringify({
      petTypeGuess: "cat",
      summary: "Mat co ve hoi do.",
      observations: ["Mat trai hoi do"],
      riskLevel: "medium",
      possibleConcerns: ["Co the bi kich ung"],
      recommendedActions: ["Theo doi trong ngay"],
      vetCareAdvice: "Gap bac si thu y neu mat sung hoac co dich.",
      emotion: "Trong hoi kho chiu.",
      petThought: "Toi thay hoi kho chiu o mat.",
      limitations: "AI chi sang loc so bo."
    })
  );

  assert.equal(analysis.petTypeGuess, "cat");
  assert.equal(analysis.riskLevel, "medium");
});

test("parseAnalysis rejects invalid riskLevel", () => {
  assert.throws(() =>
    parseAnalysis(
      JSON.stringify({
        petTypeGuess: "dog",
        summary: "OK",
        observations: [],
        riskLevel: "diagnosed",
        possibleConcerns: [],
        recommendedActions: [],
        vetCareAdvice: "Lien he bac si khi can.",
        emotion: "Trong tinh tao.",
        petThought: "Toi dang thay on.",
        limitations: "AI chi sang loc so bo."
      })
    )
  );
});

test("extractResponseText reads output_text and nested response content", () => {
  assert.equal(extractResponseText({ output_text: "hello" }), "hello");
  assert.equal(
    extractResponseText({
      output: [
        {
          content: [
            {
              text: "nested"
            }
          ]
        }
      ]
    }),
    "nested"
  );
});
