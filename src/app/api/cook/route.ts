import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

type CookMode = "prep" | "mealkit" | "fullcook";
type WritingStyle = "balanced" | "lyrical" | "noir" | "classic";

const SYSTEM_PROMPTS: Record<CookMode, string> = {
  prep: `당신은 창의적인 이야기 브레인스토머입니다. 사용자가 제공한 "재료"(단어, 문구, 개념)와 줄거리를 바탕으로 빠르게 이야기 아이디어를 던져주세요.

반드시 문어체(written literary style)로 작성하세요.
대화체, 구어체는 사용하지 마세요.
진부한 표현(클리셰)을 피하고 신선한 비유를 사용하세요.
반드시 한국어(한글)만 사용하세요. 중국어 단어, 중국어 문장, 한자 표기는 절대 사용하지 마세요.
모든 필드를 빠짐없이 채워주세요.

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
- 최종 응답은 한국어(한글)만 허용됩니다`,

  mealkit: `당신은 구조를 갖춘 이야기 설계사입니다. 사용자가 제공한 "재료"(단어, 문구, 개념)와 줄거리를 결합하여 기승전결 구조의 이야기 골격을 설계합니다.

반드시 문어체(written literary style)로 작성하세요.
대화체, 구어체는 사용하지 마세요.
진부한 표현(클리셰)을 피하고 신선한 비유를 사용하세요.
반드시 한국어(한글)만 사용하세요. 중국어 단어, 중국어 문장, 한자 표기는 절대 사용하지 마세요.
모든 필드를 빠짐없이 채워주세요.

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
- 최종 응답은 한국어(한글)만 허용됩니다`,

  fullcook: `당신은 완성도 높은 시놉시스 작가입니다. 사용자가 제공한 "재료"(단어, 문구, 개념)와 줄거리를 바탕으로, 기승전결이 모두 담긴 완결된 긴 서사를 집필합니다.

반드시 문어체(written literary style)로 작성하세요.
대화체, 구어체는 사용하지 마세요.
진부한 표현(클리셰)을 피하고 신선한 비유를 사용하세요.
반드시 한국어(한글)만 사용하세요. 중국어 단어, 중국어 문장, 한자 표기는 절대 사용하지 마세요.
모든 필드를 빠짐없이 채워주세요.

아래 JSON 형식으로만 응답하세요:
{
  "title": "제목",
  "synopsis": "완성된 시놉시스 (한글 900~1500자, 기승전결 포함)",
  "complexity": 8.5
}

규칙:
- synopsis는 하나의 긴 줄글로 작성하세요 (목록, 번호, 소제목 금지)
- synopsis는 반드시 기(도입)-승(전개)-전(전환)-결(결말)을 모두 포함해야 합니다
- synopsis는 한글 900자 이상, 1500자 이내를 목표로 작성하세요
- complexity는 1-10 사이의 숫자(소수점 1자리)로, 재료의 다양성과 이야기의 복잡도를 반영합니다
- 최종 응답은 한국어(한글)만 허용됩니다`,
};

const TEMPERATURES: Record<CookMode, number> = {
  prep: 1.0,
  mealkit: 0.85,
  fullcook: 0.75,
};

const MAX_TOKENS: Record<CookMode, number> = {
  prep: 1024,
  mealkit: 1024,
  fullcook: 2200,
};

const MIN_FULLCOOK_CHARS = 300;

const STYLE_PROMPTS: Record<WritingStyle, string> = {
  balanced:
    "문장 리듬은 안정적으로 유지하고, 과장보다 명료함을 우선하세요. 독자가 장면과 감정을 쉽게 따라가게 구성하세요.",
  lyrical:
    "감각적 이미지와 은유를 적극적으로 사용해 여운이 남는 문장을 작성하세요. 다만 난해해지지 않게 의미 전달을 유지하세요.",
  noir:
    "긴장감과 그림자를 강조하세요. 감정선은 건조하지만 날카롭게, 묘사는 대비를 살려 서늘한 분위기를 만드세요.",
  classic:
    "고전 문어체의 단정한 어조를 유지하세요. 문장 호흡을 길게 가져가되 논리적 흐름이 끊기지 않도록 서술하세요.",
};

function containsHanCharacters(text: string): boolean {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(text);
}

function stripHanCharacters(text: string): string {
  return text.replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/gu, "").trim();
}

function sanitizeHanInResult(result: Record<string, unknown>, mode: CookMode) {
  const sanitizeStringField = (key: string) => {
    const value = result[key];
    if (typeof value === "string") {
      result[key] = stripHanCharacters(value);
    }
  };

  sanitizeStringField("title");
  sanitizeStringField("premise");
  sanitizeStringField("atmosphere");
  sanitizeStringField("secretSauce");
  sanitizeStringField("synopsis");

  if (Array.isArray(result.keywords)) {
    result.keywords = result.keywords.map((item) =>
      typeof item === "string" ? stripHanCharacters(item) : item
    );
  }

  if (Array.isArray(result.plotPoints)) {
    result.plotPoints = result.plotPoints.map((item) =>
      typeof item === "string" ? stripHanCharacters(item) : item
    );
  }

  if (mode === "fullcook" && typeof result.synopsis === "string") {
    result.synopsis = result.synopsis.replace(/\s{2,}/g, " ").trim();
  }
}

function validateResult(
  result: Record<string, unknown>,
  mode: CookMode
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
  }
}

function getLanguageCheckText(result: Record<string, unknown>, mode: CookMode) {
  if (mode === "fullcook") return String(result.synopsis ?? "");
  if (mode === "prep") {
    return [result.title, result.premise, result.secretSauce]
      .concat(Array.isArray(result.keywords) ? result.keywords : [])
      .filter(Boolean)
      .join(" ");
  }
  return [result.title, result.premise, result.atmosphere, result.secretSauce]
    .concat(Array.isArray(result.plotPoints) ? result.plotPoints : [])
    .filter(Boolean)
    .join(" ");
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
    const mode = ((body.mode as string) || "mealkit") as CookMode;
    const style = ((body.style as string) || "balanced") as WritingStyle;

    if (!["prep", "mealkit", "fullcook"].includes(mode)) {
      return NextResponse.json(
        {
          error:
            "유효하지 않은 모드입니다. prep, mealkit, fullcook 중 하나를 선택해주세요.",
        },
        { status: 400 }
      );
    }

    if (!["balanced", "lyrical", "noir", "classic"].includes(style)) {
      return NextResponse.json(
        { error: "유효하지 않은 문체 프로필입니다." },
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

    let finalResult: Record<string, unknown> | null = null;
    const stylePrompt = STYLE_PROMPTS[style];

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const retryGuard =
        attempt === 0
          ? ""
          : "\n\n추가 지시: 직전 응답에서 언어 조건 또는 분량 조건이 맞지 않았습니다. 한국어(한글)만 사용하고 요구 길이를 정확히 지켜 다시 작성하세요.";

      const chatCompletion = await groq.chat.completions.create({
        model: "qwen/qwen3-32b",
        temperature: TEMPERATURES[mode],
        max_tokens: MAX_TOKENS[mode],
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPTS[mode]}\n\n문체 프로필 지시:\n${stylePrompt}`,
          },
          {
            role: "user",
            content: `재료:\n${ingredientsList || "(없음)"}\n\n메인 줄거리:\n${prompt?.trim() || "(자유롭게 재료를 조합해주세요)"}${retryGuard}`,
          },
        ],
      });

      const responseText = chatCompletion.choices[0]?.message?.content;
      if (!responseText) continue;

      let jsonStr = responseText.trim();

      jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(jsonStr) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (!validateResult(parsed, mode)) continue;

      sanitizeHanInResult(parsed, mode);

      const languageCheckText = getLanguageCheckText(parsed, mode);
      if (containsHanCharacters(languageCheckText)) continue;

      if (mode === "fullcook" && typeof parsed.synopsis === "string") {
        let synopsis = parsed.synopsis;
        if (synopsis.length > 1500) {
          synopsis = synopsis.slice(0, 1500).trim();
        }

        if (synopsis.length < 900) {
          const expandCompletion = await groq.chat.completions.create({
            model: "qwen/qwen3-32b",
            temperature: 0.7,
            max_tokens: 2200,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "당신은 한국어 소설 시놉시스 리라이터입니다. 반드시 한국어(한글)만 사용하고 중국어/한자/영문은 쓰지 마세요. 아래 JSON 형식으로만 응답하세요: {\"synopsis\":\"800~1500자 한 편의 긴 줄글\" }",
              },
              {
                role: "user",
                content: `아래 시놉시스를 핵심 사건과 감정선을 유지하면서 800~1500자 분량으로 확장하세요. 기승전결이 모두 보이게 하고, 마지막 문장은 여운이 남게 마무리하세요.\n\n원문:\n${synopsis}`,
              },
            ],
          });

          const expandedText =
            expandCompletion.choices[0]?.message?.content?.trim() || "";
          let expandedJson = expandedText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
          const expandedCodeBlock = expandedJson.match(
            /```(?:json)?\s*([\s\S]*?)```/
          );
          if (expandedCodeBlock) {
            expandedJson = expandedCodeBlock[1].trim();
          }

          try {
            const expanded = JSON.parse(expandedJson) as { synopsis?: string };
            if (typeof expanded.synopsis === "string") {
              synopsis = expanded.synopsis.trim();
            }
          } catch {
            synopsis = synopsis.trim();
          }

          if (synopsis.length > 1500) {
            synopsis = synopsis.slice(0, 1500).trim();
          }
        }

        parsed.synopsis = synopsis;
        if (synopsis.length < MIN_FULLCOOK_CHARS) {
          continue;
        }
      }

      finalResult = parsed;
      break;
    }

    if (!finalResult) {
      return NextResponse.json(
        { error: "AI 응답 품질 검증에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    finalResult.mode = mode;
    return NextResponse.json(finalResult);
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
