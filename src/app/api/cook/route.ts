import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

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
      temperature: 0.9,
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `당신은 창의적인 스토리 셰프입니다. 사용자가 제공한 "재료"(단어, 문구, 개념)와 메인 줄거리를 결합하여 매력적인 이야기 아이디어를 만들어냅니다.

반드시 한국어로 응답하고, 아래 JSON 형식으로만 응답하세요:

{
  "title": "이야기 제목 (짧고 임팩트 있게)",
  "premise": "한 문장으로 된 핵심 전제 (매력적이고 호기심을 자극하는)",
  "plotPoints": ["핵심 줄거리 포인트 1", "핵심 줄거리 포인트 2", "핵심 줄거리 포인트 3"],
  "atmosphere": "배경과 분위기에 대한 생생한 설명 (2-3문장)",
  "secretSauce": "예상치 못한 반전 또는 독특한 요소 (1-2문장)",
  "complexity": 8.5
}

규칙:
- 모든 재료를 자연스럽게 이야기에 녹여내세요
- plotPoints는 정확히 3개여야 합니다
- complexity는 1-10 사이의 숫자 (소수점 1자리)로, 재료의 다양성과 이야기의 복잡도를 반영합니다
- 창의적이고 예상을 뒤엎는 이야기를 만드세요
- 문학적이고 아름다운 한국어를 사용하세요`,
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

    // Strip markdown code fences if present
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);

    // Validate shape
    if (
      !result.title ||
      !result.premise ||
      !Array.isArray(result.plotPoints) ||
      !result.atmosphere ||
      !result.secretSauce
    ) {
      return NextResponse.json(
        { error: "AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

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
