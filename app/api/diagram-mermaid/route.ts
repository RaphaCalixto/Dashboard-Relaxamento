import { NextResponse } from "next/server"

const SYSTEM_PROMPT = `
Voce gera apenas Mermaid para fluxogramas.
Regras obrigatorias:
- Retorne apenas um bloco de codigo Mermaid.
- Sempre comece com "flowchart TD".
- Use uma aresta por linha no formato: N1["Texto"] --> N2["Texto"].
- Para decisao, use losango: N3{"Pergunta?"}.
- Para circulo, use: N4(("Texto")).
- Use IDs simples como N1, N2, N3.
- Nao escreva explicacoes fora do Mermaid.
`.trim()

const extractResponseText = (payload: any): string => {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text
  }

  if (Array.isArray(payload?.output)) {
    const fragments: string[] = []

    payload.output.forEach((item: any) => {
      if (!Array.isArray(item?.content)) return

      item.content.forEach((part: any) => {
        if (typeof part?.text === "string") {
          fragments.push(part.text)
          return
        }

        if (typeof part?.text?.value === "string") {
          fragments.push(part.text.value)
        }
      })
    })

    if (fragments.length > 0) {
      return fragments.join("\n")
    }
  }

  return ""
}

const extractMermaid = (value: string): string => {
  const fenced = value.match(/```mermaid\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return fenced[1].trim()
  }

  const genericFence = value.match(/```[\s\S]*?```/g)
  if (genericFence?.length) {
    const raw = genericFence[0].replace(/```/g, "").trim()
    if (raw) return raw
  }

  const flowStart = value.search(/\b(flowchart|graph)\b/i)
  if (flowStart >= 0) {
    return value.slice(flowStart).trim()
  }

  return value.trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""

    if (!prompt) {
      return NextResponse.json({ error: "Prompt vazio para gerar diagrama." }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Configure OPENAI_API_KEY no .env.local para habilitar a geracao com IA." },
        { status: 500 },
      )
    }

    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini"

    const upstreamResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_output_tokens: 900,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: SYSTEM_PROMPT }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: `Descricao do fluxo: ${prompt}` }],
          },
        ],
      }),
    })

    const payload = await upstreamResponse.json()

    if (!upstreamResponse.ok) {
      const message =
        typeof payload?.error?.message === "string" ? payload.error.message : "Falha na comunicacao com a IA."
      return NextResponse.json({ error: message }, { status: upstreamResponse.status })
    }

    const rawText = extractResponseText(payload)
    const mermaid = extractMermaid(rawText)

    if (!/^(flowchart|graph)\b/i.test(mermaid)) {
      return NextResponse.json({ error: "A IA nao retornou um Mermaid de fluxograma valido." }, { status: 422 })
    }

    return NextResponse.json({ mermaid })
  } catch {
    return NextResponse.json({ error: "Erro inesperado ao gerar o diagrama com IA." }, { status: 500 })
  }
}
