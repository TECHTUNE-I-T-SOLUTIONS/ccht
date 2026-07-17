import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, screenshot, activity, violations } = body

    if (!sessionId || !screenshot) {
      return NextResponse.json({ error: 'sessionId and screenshot are required' }, { status: 400 })
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error('Gemini API key not configured')
      return NextResponse.json({ suspicious: false, reason: 'AI analysis not configured' }, { status: 200 })
    }

    // Prepare the prompt for Gemini
    const prompt = `You are an AI proctoring assistant analyzing exam activity. Analyze the following screenshot and activity data to detect potential malpractice.

Activity Context:
- Session ID: ${sessionId}
- Current Activity: ${activity}
- Recent Violations: ${violations?.map((v: any) => `${v.type} (${v.severity})`).join(', ') || 'None'}

Instructions:
1. Check if there are multiple people in the frame
2. Check if the person is looking away from the screen frequently
3. Check if there are any suspicious objects (phones, notes, etc.)
4. Check if the person appears to be reading from another screen
5. Check if the person is not present or has left

Respond with a JSON object in this exact format:
{
  "suspicious": true/false,
  "confidence": 0-100,
  "reason": "brief explanation of what was detected",
  "violations": ["list", "of", "detected", "issues"]
}

Be conservative - only flag as suspicious if you're reasonably confident (confidence > 70).`

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: screenshot,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      return NextResponse.json({ suspicious: false, reason: 'AI analysis failed' }, { status: 200 })
    }

    const data = await response.json()
    
    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Try to parse JSON from the response
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0])
        return NextResponse.json(analysis)
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText)
    }

    // If we can't parse the response, return safe default
    return NextResponse.json({
      suspicious: false,
      confidence: 0,
      reason: 'Could not parse AI analysis',
      violations: []
    })

  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ suspicious: false, reason: 'Analysis error' }, { status: 200 })
  }
}