import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPTS: Record<string, string> = {
  prep: `당신은 창의적인 이야기 브레인스토머입니다. 사용자가 제공한 "재료"(단어, 문구, 개념)와 줄거리를 바탕으로 빠르게 이야기 아이디어를 던져주세요.

반드시 문어체(written literary style)로 작성하세요.
대화체, 구어체는 사용하지 마세요.
진부한 표현(클리셰)을 피하고 신선한 비유를 사용하세요.
모든 필드를 빠짐없이 채워주세요.

간결하고 임팩트 있게 작성하되, 제목은 한 눈에 이야기의 핵심을 드러내야 합니다.
키워드는 이야기의 정수를 압축한 단어 5개로 구성하세요.
비밀 소스는 독자가 절대 예상하지 못할 반전 한 줄이어야 합니다.

아래 JSON 형식으로만 응답하세요:

{
  "title": "제목",
  "premise": "한 줄 전제",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "secretSauce": "예상 못한 반전 한 줄",
  "complexity": 7.5
}

규칙:
- 모든 재료를 자연스럽게 아이디어에 녹여내세요
- keywords는 정확히 5개여야 합니다
- complexity는 1-10 사이의 숫자(소수점 1자리)로, 재료의 다양성과 아이디어의 복잡도를 반영합니다
- 틀에 박히지 않은, 날것의 창의성을 보여주세요`,

  mealkit: `당신은 구조를 갖춘 이야기 설계사입니다. 사용자가 제공한 "재료"(단어, 문구, 개념)와 줄거리를 결합하여 기승전결 구조의 이야기 골격을 설계합니다.

반드시 문어체(written literary style)로 작성하세요.
대화체, 구어체는 사용하지 마세요.
진부한 표현(클리셰)을 피하고 신선한 비유를 사용하세요.
모든 필드를 빠짐없이 채워주세요.

문학적 한국어로, 기승전결의 흐름이 자연스럽게 이어지도록 구성하세요.
각 줄거리 포인트는 "기 - ", "승 - ", "전 - " 접두어로 시작하며, 이야기의 호흡이 점층적으로 고조되어야 합니다.
분위기 묘사는 독자가 그 세계에 발을 들인 듯한 감각적 문장으로 작성하세요.

아래 JSON 형식으로만 응답하세요:

{
  "title": "제목",
  "premise": "핵심 전제 한 문장",
  "plotPoints": ["기 - ...", "승 - ...", "전 - ..."],
  "atmosphere": "배경과 분위기 2-3문장",
  "secretSauce": "반전 요소 1-2문장",
  "complexity": 8.0
}

규칙:
- 모든 재료를 자연스럽게 이야기에 녹여내세요
- plotPoints는 정확히 3개여야 합니다
- complexity는 1-10 사이의 숫자(소수점 1자리)로, 재료의 다양성과 이야기의 복잡도를 반영합니다
- 독자의 상상력을 자극하는 여백을 남기세요`,

  fullcook: `당신은 완성도 높은 시놉시스 작가입니다. 사용자가 제공한 "재료"(단어, 문구, 개념)와 줄거리를 바탕으로 한 편의 완결된 시놉시스를 집필합니다.

반드시 문어체(written literary style)로 작성하세요.
대화체, 구어체는 사용하지 마세요.
진부한 표현(클리셰)을 피하고 신선한 비유를 사용하세요.
모든 필드를 빠짐없이 채워주세요.

문학적이고 아름다운 문어체 한국어로, 독자를 사로잡는 문장을 구사하세요.
시놉시스는 한글 500자 이내로, 첫 문장부터 마지막 문장까지 긴장의 끈을 놓지 않아야 합니다.
인물의 내면과 세계의 질감이 동시에 느껴지는 밀도 높은 글을 써주세요.

아래 JSON 형식으로만 응답하세요:

{
  "title": "제목",
  "synopsis": "완성된 시놉시스 (500자 이내)",
  "complexity": 8.5
}

규칙:
- 모든 재료를 자연스럽게 시놉시스에 녹여내세요
- synopsis는 반드시 한글 500자 이내여야 합니다
- complexity는 1-10 사이의 숫자(소수점 1자리)로, 재료의 다양성과 이야기의 복잡도를 반영합니다
- 한 편의 단편소설 서두를 읽는 듯한 흡인력을 갖추세요`,
};

const TEMPERATURES: Record<string, number> = {
  prep: 1.0,
  mealkit: 0.85,
  fullcook: 0.75,
};

function validateResult(
  result: Record<string, unknown>,
  mode: string
): boolean {
  switch (mode) {
    case "prep":
      return (
        typeof result.title === "string" &&
        typeof result.premise === "string" &&
        Array.isArray(result.keywords)
      );
    case "mealkit":
      return (
        typeof result.title === "string" &&
        typeof result.premise === "string" &&
        Array.isArray(result.plotPoints) &&
        typeof result.atmosphere === "string" &&
        typeof result.secretSauce === "string"
      );
    case "fullcook":
      return (
        typeof result.title === "string" &&
        typeof result.synopsis === "string"
      );
    default:
      return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error:
            "API 키가 설정되지 않았습니다. .env.local 파일에 GROQ_API_KEY를 설정해주세요.",
        },
        { status: 500 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const body = await request.json();
    const ingredients = body.ingredients as string[];
    const prompt = body.prompt as string;
    const mode = (body.mode as string) || "mealkit";

    if (!SYSTEM_PROMPTS[mode]) {
      return NextResponse.json(
        { error: "유효하지 않은 모드입니다. prep, mealkit, fullcook 중 하나를 선택해주세요." },
        { status: 400 }
      );
    }

    if (
      (!ingredients || ingredients.length === 0) &&
      (!prompt || !prompt.trim())
    ) {
      return NextResponse.json(
        { error: "재료나 줄거리를 최소 하나 이상 입력해주세요." },
        { status: 400 }
      );
    }

    const ingredientsList = ingredients
      .map((i: string) => `- ${i}`)
      .join("\n");

    const chatCompletion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      temperature: TEMPERATURES[mode],
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS[mode],
        },
        {
          role: "user",
          content: `재료:\n${ingredientsList || "(없음)"}\n\n메인 줄거리:\n${prompt?.trim() || "(자유롭게 재료를 조합해주세요)"}`,
        },
      ],
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: "AI 응답을 처리할 수 없습니다." },
        { status: 500 }
      );
    }

    let jsonStr = responseText.trim();

    // Strip Qwen3 thinking tags
    jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Strip markdown code fences if present
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const result = JSON.parse(jsonStr) as Record<string, unknown>;

    // Validate shape per mode
    if (!validateResult(result, mode)) {
      return NextResponse.json(
        { error: "AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // Inject mode into result
    result.mode = mode;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cook API error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI 응답 파싱에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "요리 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
