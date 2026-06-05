import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ClassifyRequest, ClassifyResponse } from '@/types'

// Model i limit tokenów są zablokowane — nie zmieniaj tych stałych.
const MODEL = 'gpt-4o-mini' as const
const MAX_TOKENS = 300

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ────────────────────────────────────────────────────────────
// POST /api/classify
//
// Wejście (body JSON):
//   { message: string, company: string }
//
// Wyjście (JSON):
//   {
//     category:    "zamówienie" | "pytanie" | "reklamacja" | "spam"
//     priority:    "high" | "medium" | "low"
//     draft_reply: string  — gotowy szkic odpowiedzi po polsku
//     confidence:  number  — 0–1, pewność klasyfikacji
//   }
//
// TODO: Zaimplementuj ten endpoint.
//
// Wskazówki:
//   - Wywołaj openai.chat.completions.create() używając stałych MODEL i MAX_TOKENS
//   - Poproś model o odpowiedź w formacie JSON (response_format lub system prompt)
//   - draft_reply powinien być w tonie pasującym do firmy i kategorii
//   - Zwróć 400 gdy message lub company jest pusty
// ────────────────────────────────────────────────────────────

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
  // TODO: Walidacja wejścia
  // if (!body.message || !body.company) { ... }

  // TODO: Wywołaj OpenAI API używając MODEL i MAX_TOKENS
  // const completion = await openai.chat.completions.create({
  //   model: MODEL,
  //   max_tokens: MAX_TOKENS,
  //   ...
  // })

  // TODO: Sparsuj odpowiedź i zwróć ClassifyResponse

  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
