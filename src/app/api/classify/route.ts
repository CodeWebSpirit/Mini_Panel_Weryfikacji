import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ClassifyRequest, ClassifyResponse } from '@/types'

// Model i limit tokenów są zablokowane — nie zmieniaj tych stałych.
const MODEL = 'gpt-4o-mini' as const
const MAX_TOKENS = 300

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request): Promise<NextResponse<ClassifyResponse | { error: string }>> {
  const body: ClassifyRequest = await req.json()
  try {
      if (!body || !body.message?.trim() || !body.company?.trim()) {
      return NextResponse.json(
        { error: 'Both "message" and "company" fields are required and cannot be empty.' },
        { status: 400 }
      )
      }
      const { message, company } = body
      // Wywołanie OpenAI z odpowiednimi instrukcjami
      const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Jesteś zaawansowanym asystentem AI obsługi klienta dla firmy: "${company}".
        Przeanalizuj wiadomość od klienta i zwróć obiekt JSON o następującej strukturze:
        {
        "category": "zamówienie" | "pytanie" | "reklamacja" | "spam",
        "priority": "high" | "medium" | "low",
        "draft_reply": "string",
        "confidence": number
        }

        Zasady:
        1. "category" musi być dokładnie jedną z tych wartości: "zamówienie", "pytanie", "reklamacja", "spam".
        2. "priority" odzwierciedla pilność (np. reklamacje i duże zamówienia = high, spam = low).
        3. "draft_reply" musi być gotową, profesjonalną odpowiedzią PO POLSKU. W przypadku spamu odpowiedź może być krótka lub pusta
        4. "confidence" to liczba zmiennoprzecinkowa od 0.0 do 1.0 oznaczająca Twoją pewność co do tego czy wiadomość została poprawnie sklasyfikowana. Dla jasności, 0.0 oznacza brak pewności, a 1.0 oznacza pełną pewność.`,
        },
        {
          role: 'user',
          content: `Wiadomość od klienta:\n"""\n${message}\n"""`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate response from OpenAI' },
        { status: 500 }
      )
    }

    const parsedResponse = JSON.parse(content) as ClassifyResponse
    if (
      !parsedResponse.category ||
      !parsedResponse.priority ||
      typeof parsedResponse.draft_reply !== 'string' ||
      typeof parsedResponse.confidence !== 'number'
    ) {
      return NextResponse.json(
        { error: 'OpenAI returned invalid JSON structure' },
        { status: 500 }
      )
    }

    return NextResponse.json(parsedResponse)

  } catch (error) {
    console.error('Error in classify endpoint:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
