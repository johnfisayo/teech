import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, mode, notes, courseName, imageUrl, imageBase64, imageType } = await request.json()

    let systemPrompt = `You are Teech, a friendly and helpful AI tutor. Your goal is to help students understand their course material better.

You should:
- Explain concepts in simple, clear terms
- Use analogies and examples to make things easier to understand
- Break down complex problems step by step
- Be encouraging and supportive
- If solving a problem, show your work clearly
- If analyzing an image of homework/assignment, read it carefully and help solve or explain it

Current course: ${courseName || 'General'}
`

    if (mode === 'bounded' && notes && notes.length > 0) {
      systemPrompt += `\n\nIMPORTANT: You are in "Bounded" mode. Only use the following notes from the student's course to answer their question. Do not use external knowledge beyond what's in these notes:\n\n--- STUDENT'S NOTES ---\n${notes}\n--- END OF NOTES ---\n\nIf the answer cannot be found in the notes, let the student know and suggest they switch to "Expanded" mode.`
    } else if (mode === 'expanded') {
      systemPrompt += `\n\nYou are in "Expanded" mode. You can use both the student's notes (if provided) AND your general knowledge to give comprehensive explanations.`
      if (notes && notes.length > 0) {
        systemPrompt += `\n\nStudent's notes for reference:\n${notes}`
      }
    }

    // Build the message content
    const messageContent: any[] = []

    // Add image if provided (base64 directly from client)
    if (imageBase64) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageType || 'image/jpeg',
          data: imageBase64,
        },
      })
    }

    // Add text message
    messageContent.push({
      type: 'text',
      text: message || 'Please analyze this image and help me understand it.',
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    })

    const textContent = response.content.find(block => block.type === 'text')
    const reply = textContent ? textContent.text : 'Sorry, I could not generate a response.'

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get response from AI' },
      { status: 500 }
    )
  }
}