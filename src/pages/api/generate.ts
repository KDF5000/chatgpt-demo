import type { APIRoute } from 'astro'
import { generatePayload, parseOpenAIStream } from '@/utils/openAI'
// #vercel-disable-blocks
import { fetch, ProxyAgent } from 'undici'
// #vercel-end

const apiKeys = import.meta.env.OPENAI_API_KEY
const https_proxy = import.meta.env.HTTPS_PROXY
const baseUrl = ((import.meta.env.OPENAI_API_BASE_URL) || 'https://api.openai.com/v1').trim().replace(/\/$/, '')

export const post: APIRoute = async (context) => {
  const body = await context.request.json()
  const messages = body.messages

  if (!messages) {
    return new Response('No input text')
  }

  const arr = apiKeys.split(",");
  const apiKey = arr[Math.floor(Math.random() * arr.length)];
  const initOptions = generatePayload(apiKey, messages)
  // #vercel-disable-blocks
  if (https_proxy) {
    initOptions['dispatcher'] = new ProxyAgent(https_proxy)
  }
  // #vercel-end

  // @ts-ignore
  const response = await fetch(`${baseUrl}/chat/completions?api-version=2023-03-15-preview`, initOptions).catch((err: Error) => {
    console.error(err)
    return new Response(JSON.stringify({
      error: {
        code: err.name,
        message: err.message,
      },
    }), { status: 500 })
  }) as Response

  return parseOpenAIStream(response) as Response
}
