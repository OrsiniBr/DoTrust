import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze message quality and toxicity for life-line system
 * @param {Object} message - The message to analyze
 * @param {Array} conversationHistory - Last 10 messages in chronological order
 * @returns {Promise<Object>} Analysis result with points deduction
 */
export async function analyzeMessageQuality(message, conversationHistory) {
  try {
    // Build context from last 10 messages
    const contextMessages = conversationHistory
      .map(
        (msg) =>
          `[${
            msg.senderId === message.senderId ? "Current User" : "Other User"
          }]: ${msg.text || ""}`
      )
      .join("\n");

    const prompt = `You are analyzing a 1-on-1 staking chat where users have staked tokens to have a meaningful conversation.

CONVERSATION HISTORY (chronological):
${contextMessages || "(No previous messages)"}

NEW MESSAGE TO ANALYZE:
[Current User]: ${message.text || ""}

ANALYZE FOR:

1. LOW QUALITY (examples that should be penalized -1 point):
   - One-word lazy responses: "ok", "k", "lol", "idk", "cool", "nice", "yeah" when the other person asked a real question or shared something detailed
   - Not engaging meaningfully with the conversation
   - Repeated generic responses
   - Copy-paste or bot-like messages
   
   NOTE: Short responses are OK if:
   - Following casual small talk
   - Appropriate acknowledgment ("thanks!" after getting help)
   - Natural conversation flow (not every message needs to be long)
   - Answering yes/no questions appropriately

2. TOXIC BEHAVIOR (examples that should be penalized -2 points):
   - Direct insults or name-calling
   - Harassment or bullying
   - Passive-aggressive comments
   - Condescending or dismissive tone
   - Sexual harassment or unwanted advances
   - Threats or intimidation
   - Racist, sexist, or discriminatory language
   - Spam or trolling

CONTEXT MATTERS: Consider the full conversation. Don't penalize short messages if they're appropriate to the flow.

Return JSON only:
{
  "isLowQuality": boolean,
  "isToxic": boolean,
  "toxicityScore": number (0-1),
  "qualityScore": number (0-1),
  "violationType": "low_effort" | "toxic" | "spam" | "none",
  "reasoning": "specific explanation of why this was flagged",
  "confidence": number (0-1),
  "pointsToDeduct": 0 | 1 | 2
}

Be strict but fair. This affects real money stakes.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a fair but strict conversation quality moderator. Consider context carefully. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    // Ensure pointsToDeduct is valid (0, 1, or 2)
    if (analysis.isToxic) {
      analysis.pointsToDeduct = 2;
    } else if (analysis.isLowQuality) {
      analysis.pointsToDeduct = 1;
    } else {
      analysis.pointsToDeduct = 0;
    }

    return {
      ...analysis,
      contextAwareness: true,
      processedAt: new Date(),
    };
  } catch (error) {
    console.error("Error in AI moderation:", error);
    // Return safe default if AI fails - don't penalize user
    return {
      isLowQuality: false,
      isToxic: false,
      toxicityScore: 0,
      qualityScore: 1,
      violationType: "none",
      reasoning: "AI analysis failed - no penalty applied",
      confidence: 0,
      pointsToDeduct: 0,
      contextAwareness: false,
      processedAt: new Date(),
    };
  }
}
