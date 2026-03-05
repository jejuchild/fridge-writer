import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import type { CookMode, WritingStyle, PersonalizationHints } from "../../types";

type CookAction = "cook" | "develop";

type RawResult = Record<string, unknown>;

const TEMPERATURES: Record<CookMode, number> = {
  prep: 1.0,
  mealkit: 0.86,
  fullcook: 0.8,
};

const MAX_TOKENS: Record<CookMode, number> = {
  prep: 1000,
  mealkit: 1400,
  fullcook: 2600,
};

const MODE_PROMPTS: Record<CookMode, string> = {
  prep: `당신은 이야기 재료를 빠르게 손질하는 작가 코치입니다.
반드시 한국어(한글)만 사용하세요. 중국어, 한자, 일본어, 영문은 금지합니다.
대화체 대신 문어체로 작성하세요.

응답 JSON 형식:
{
  "title": "짧고 강한 제목",
  "premise": "한 줄 전제",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "secretSauce": "뜻밖의 반전 한 줄",
  "complexity": 7.5
}`,

  mealkit: `당신은 기승전결 구조를 설계하는 이야기 셰프입니다.
반드시 한국어(한글)만 사용하세요. 중국어, 한자, 일본어, 영문은 금지합니다.
대화체 대신 문어체로 작성하세요.

응답 JSON 형식:
{
  "title": "제목",
  "premise": "핵심 전제 한 문장",
  "plotPoints": ["기 - ...", "승 - ...", "전 - ..."],
  "atmosphere": "배경과 분위기 2~3문장",
  "secretSauce": "반전 요소 1~2문장",
  "complexity": 8.0
}`,

  fullcook: `당신은 완성형 한국어 시놉시스를 쓰는 작가입니다.
반드시 한국어(한글)만 사용하세요. 중국어, 한자, 일본어, 영문은 금지합니다.
대화체 대신 문어체로 작성하세요.
하나의 긴 줄글로 작성하고 기(도입)-승(전개)-전(전환)-결(결말)을 모두 담으세요.
분량 목표는 900~1500자입니다.

응답 JSON 형식:
{
  "title": "제목",
  "synopsis": "완성된 시놉시스",
  "complexity": 8.5
}`,
};

const STYLE_PROMPTS: Record<WritingStyle, string> = {
  balanced: `문장을 명료하게 정리하고 전개를 선명하게 유지하세요.
예시 톤: "비가 그친 골목에서 그녀는 마지막 단서를 발견했다. 이제 돌아갈 수 없었다."`,
  lyrical: `감각적 이미지와 여운 있는 비유를 사용하되 의미 전달은 분명하게 유지하세요.
예시 톤: "새벽 안개는 오래 접어 둔 편지처럼 골목마다 젖은 숨을 펼쳤다."`,
  noir: `빛과 그림자의 대비, 서늘한 긴장, 건조한 감정선을 강화하세요.
예시 톤: "형광등은 깜박였고, 진실은 늘 그렇듯 가장 늦게 도착했다."`,
  classic: `고전 문어체의 단정한 호흡으로 서술하되 흐름이 끊기지 않게 하세요.
예시 톤: "그날 저녁의 바람은 묵은 서책의 장을 넘기듯 조용히 문턱을 스쳤다."`,
};

function parseJsonResponse(raw: string): RawResult | null {
  let jsonStr = raw.trim().replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) jsonStr = codeBlock[1].trim();
  try {
    return JSON.parse(jsonStr) as RawResult;
  } catch {
    return null;
  }
}

function stripHanCharacters(text: string): string {
  return text.replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/gu, "").trim();
}

function sanitizeResult(result: RawResult): RawResult {
  const sanitized: RawResult = { ...result };
  for (const key of ["title", "premise", "atmosphere", "secretSauce", "synopsis"]) {
    const value = sanitized[key];
    if (typeof value === "string") sanitized[key] = stripHanCharacters(value);
  }

  if (Array.isArray(sanitized.keywords)) {
    sanitized.keywords = sanitized.keywords.map((item) =>
      typeof item === "string" ? stripHanCharacters(item) : item
    );
  }

  if (Array.isArray(sanitized.plotPoints)) {
    sanitized.plotPoints = sanitized.plotPoints.map((item) =>
      typeof item === "string" ? stripHanCharacters(item) : item
    );
  }

  return sanitized;
}

function validateShape(mode: CookMode, result: RawResult): boolean {
  if (typeof result.title !== "string") return false;
  if (typeof result.complexity !== "number") return false;

  if (mode === "prep") {
    return (
      typeof result.premise === "string" &&
      typeof result.secretSauce === "string" &&
      Array.isArray(result.keywords)
    );
  }

  if (mode === "mealkit") {
    return (
      typeof result.premise === "string" &&
      Array.isArray(result.plotPoints) &&
      typeof result.atmosphere === "string" &&
      typeof result.secretSauce === "string"
    );
  }

  return typeof result.synopsis === "string";
}

function evaluateResult(mode: CookMode, result: RawResult): string[] {
  const issues: string[] = [];

  if (mode === "prep") {
    if (Array.isArray(result.keywords) && result.keywords.length < 3) {
      issues.push("keywords를 최소 3개 이상 제공하세요.");
    }
  }

  if (mode === "mealkit") {
    if (Array.isArray(result.plotPoints) && result.plotPoints.length < 3) {
      issues.push("plotPoints를 최소 3개 제공하세요.");
    }
  }

  if (mode === "fullcook" && typeof result.synopsis === "string") {
    const length = result.synopsis.length;
    if (length < 300) issues.push("시놉시스 분량이 너무 짧습니다. 최소 300자 이상 필요합니다.");
    if (length > 1500) issues.push("시놉시스가 1500자를 초과했습니다.");
    if (!/[가-힣]/.test(result.synopsis)) issues.push("한글 문장으로 작성하세요.");
  }

  return issues;
}

function buildPersonalizationSection(hints: PersonalizationHints | undefined): string {
  if (!hints) return "";
  const keywords = hints.preferredKeywords?.slice(0, 6).join(", ") || "";
  const memoHighlights = hints.memoHighlights?.slice(0, 2).join(" | ") || "";
  const references = hints.referencePhrases?.slice(0, 2).join(" | ") || "";

  if (!keywords && !memoHighlights && !references) return "";

  return `\n개인화 힌트:\n- 자주 쓰는 핵심어: ${keywords || "없음"}\n- 최근 메모: ${memoHighlights || "없음"}\n- 참고 문장: ${references || "없음"}`;
}

function buildUserPrompt(params: {
  action: CookAction;
  ingredients: string[];
  prompt: string;
  seasoning: string;
  previousResult: RawResult | null;
}): string {
  const ingredientsList = params.ingredients.map((i) => `- ${i}`).join("\n") || "(없음)";

  if (params.action === "develop" && params.previousResult) {
    const previous = JSON.stringify(params.previousResult, null, 2);
    return `재료:\n${ingredientsList}\n\n기존 요리:\n${previous}\n\n추가 조미료(디벨롭 요청):\n${params.seasoning}\n\n요청: 기존 요리를 폐기하지 말고, 핵심을 유지한 채 조미료를 반영해 더 발전된 버전으로 다시 작성하세요.`;
  }

  return `재료:\n${ingredientsList}\n\n메인 줄거리:\n${params.prompt || "(자유롭게 재료를 조합해 작성)"}`;
}

async function chatJson(params: {
  groq: Groq;
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}): Promise<RawResult | null> {
  const completion = await params.groq.chat.completions.create({
    model: "qwen/qwen3-32b",
    temperature: params.temperature,
    max_tokens: params.maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;
  return parseJsonResponse(content);
}

async function polishResult(params: {
  groq: Groq;
  mode: CookMode;
  style: WritingStyle;
  result: RawResult;
}): Promise<RawResult> {
  const target = JSON.stringify(params.result, null, 2);
  const polished = await chatJson({
    groq: params.groq,
    temperature: 0.65,
    maxTokens: 2200,
    system:
      "당신은 결과를 다듬는 한국어 시놉시스 에디터입니다. 원 의미를 유지하며 문장 완성도와 리듬만 개선하세요. 반드시 JSON 형식으로 동일 키를 유지하세요.",
    user: `모드: ${params.mode}\n문체: ${params.style}\n\n아래 JSON을 문장 완성도 중심으로 다듬어 다시 출력하세요:\n${target}`,
  });

  if (!polished) return params.result;
  return sanitizeResult(polished);
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다. .env.local 파일에 GROQ_API_KEY를 설정해주세요." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      action?: CookAction;
      ingredients?: string[];
      prompt?: string;
      mode?: string;
      style?: string;
      seasoning?: string;
      previousResult?: RawResult;
      personalization?: PersonalizationHints;
    };

    const action: CookAction = body.action === "develop" ? "develop" : "cook";
    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
    const prompt = (body.prompt || "").trim();
    const seasoning = (body.seasoning || "").trim();
    const mode =
      body.mode === "prep" || body.mode === "mealkit" || body.mode === "fullcook"
        ? body.mode
        : null;
    const style =
      body.style === "balanced" ||
      body.style === "lyrical" ||
      body.style === "noir" ||
      body.style === "classic"
        ? body.style
        : null;

    if (!mode) {
      return NextResponse.json(
        { error: "유효하지 않은 모드입니다. prep, mealkit, fullcook 중 하나를 선택해주세요." },
        { status: 400 }
      );
    }

    if (!style) {
      return NextResponse.json({ error: "유효하지 않은 문체 프로필입니다." }, { status: 400 });
    }

    if (action === "cook" && ingredients.length === 0 && !prompt) {
      return NextResponse.json(
        { error: "재료나 줄거리를 최소 하나 이상 입력해주세요." },
        { status: 400 }
      );
    }

    if (action === "develop" && (!seasoning || !body.previousResult)) {
      return NextResponse.json(
        { error: "디벨롭에는 조미료 입력과 기존 요리 결과가 필요합니다." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const personalizationSection = buildPersonalizationSection(body.personalization);
    let retryIssues = "";
    let finalResult: RawResult | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const systemPrompt = `${MODE_PROMPTS[mode]}\n\n문체 프로필:\n${STYLE_PROMPTS[style]}${personalizationSection}${retryIssues}`;
      const userPrompt = buildUserPrompt({
        action,
        ingredients,
        prompt,
        seasoning,
        previousResult: body.previousResult || null,
      });

      const generated = await chatJson({
        groq,
        system: systemPrompt,
        user: userPrompt,
        temperature: TEMPERATURES[mode],
        maxTokens: MAX_TOKENS[mode],
      });

      if (!generated) continue;
      const sanitized = sanitizeResult(generated);
      if (!validateShape(mode, sanitized)) continue;

      let candidate = sanitized;
      if (mode !== "prep") {
        candidate = await polishResult({ groq, mode, style, result: sanitized });
      }

      const issues = evaluateResult(mode, candidate);
      if (issues.length > 0) {
        retryIssues = `\n\n추가 교정 요구:\n- ${issues.join("\n- ")}`;
        continue;
      }

      finalResult = candidate;
      break;
    }

    if (!finalResult) {
      return NextResponse.json(
        { error: "AI 응답 품질 검증에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    finalResult.mode = mode;
    finalResult.style = style;
    return NextResponse.json(finalResult);
  } catch (error) {
    console.error("Cook API error:", error);
    return NextResponse.json(
      { error: "요리 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
