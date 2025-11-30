before going into the new feature make the userefund functionality work so that if the person Mr A wants t chat with doesnt stake bac after 1 min, he will claim his money back and not be stranded, also reduce the general time from 5 mins to 1 minutes for now.

## New Feature: AI-Powered Life-Line System

Implement an AI moderation system that tracks conversation quality and toxicity using a life-line point system.

---

## REQUIREMENTS

### 1. Life-Line System (New Feature)
Each chat session between two users starts with 5 life-line points each.

**Point Deductions:**
- **Low Quality Response**: -1 point (e.g., "ok", "lol", "idk" when context requires meaningful engagement)
- **Toxic Message**: -2 points (harassment, insults, condescension, passive-aggressive behavior)

**Penalties:**
- When a user reaches 0 life-line points, they **lose their stake** and the other party **automatically wins the compensation reward**

### 2. Database Schema Changes

Add these new fields/collections:

```javascript
// Chat Session Schema (existing or new)
{
  sessionId: String,
  user1: {
    userId: String,
    stakedAmount: Number,
    lifeLinePoints: Number // NEW: Default 5
  },
  user2: {
    userId: String,
    stakedAmount: Number,
    lifeLinePoints: Number // NEW: Default 5
  },
  roomId: String,
  status: String, // 'active', 'completed', 'forfeited'
  winner: String, // userId of winner if forfeited
  startedAt: Date,
  endedAt: Date
}

// Message Schema - Add AI Analysis
{
  id: String,
  content: String,
  userId: String,
  sessionId: String, // Link to chat session
  roomId: String,
  replyToMessageId: String, // For threading
  
  // NEW: AI Analysis Fields
  aiAnalysis: {
    isLowQuality: Boolean,
    isToxic: Boolean,
    toxicityScore: Number, // 0-1
    qualityScore: Number, // 0-1
    violationType: String, // 'low_effort', 'toxic', 'spam', 'none'
    reasoning: String,
    confidence: Number,
    contextAwareness: Boolean,
    processedAt: Date
  },
  
  // NEW: Penalty tracking
  lifeLineDeduction: Number, // 0, 1, or 2
  penaltyApplied: Boolean,
  
  timestamp: Date
}

// NEW: Violations Log
{
  violationId: String,
  userId: String,
  sessionId: String,
  messageId: String,
  type: String, // 'low_quality' or 'toxic'
  pointsDeducted: Number,
  remainingPoints: Number,
  aiReasoning: String,
  timestamp: Date
}
```

### 3. AI Integration Points

**When to Analyze:**
- Analyze EVERY message in active chat sessions
- Only analyze messages between two staked users (not in group chats)
- Process asynchronously after message is sent (don't block user experience)

**Context Window:**
- Get last 10 messages between the two users in the session
- Include conversation history to understand if "ok" is appropriate or lazy
- Consider timing: Is this reply to a question, statement, or casual chat?

### 4. Implementation Steps

#### Step 1: Create AI Service Module
File: `services/aiModerationService.js`

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY 
});

export async function analyzeMessageQuality(message, conversationHistory) {
  // Build context from last 10 messages
  const contextMessages = conversationHistory.map(msg => 
    `[${msg.userId === message.userId ? 'Current User' : 'Other User'}]: ${msg.content}`
  ).join('\n');

  const prompt = `You are analyzing a 1-on-1 staking chat where users have staked tokens to have a meaningful conversation.

CONVERSATION HISTORY (chronological):
${contextMessages}

NEW MESSAGE TO ANALYZE:
[Current User]: ${message.content}

ANALYZE FOR:

1. LOW QUALITY (examples that should be penalized):
   - One-word lazy responses: "ok", "k", "lol", "idk", "cool"
   - When the other person asked a real question or shared something detailed
   - Not engaging meaningfully with the conversation
   - Repeated generic responses
   - Copy-paste or bot-like messages
   
   NOTE: Short responses are OK if:
   - Following casual small talk
   - Appropriate acknowledgment ("thanks!" after getting help)
   - Natural conversation flow (not every message needs to be long)

2. TOXIC BEHAVIOR (examples that should be penalized):
   - Direct insults or name-calling
   - Harassment or bullying
   - Passive-aggressive comments
   - Condescending or dismissive tone
   - Sexual harassment or unwanted advances
   - Threats or intimidation
   - Racist, sexist, or discriminatory language

CONTEXT MATTERS: Consider the full conversation. Don't penalize short messages if they're appropriate to the flow.

Return JSON:
{
  "isLowQuality": boolean,
  "isToxic": boolean,
  "toxicityScore": 0-1,
  "qualityScore": 0-1,
  "violationType": "low_effort" | "toxic" | "spam" | "none",
  "reasoning": "specific explanation of why this was flagged",
  "confidence": 0-1,
  "pointsToDeduct": 0 | 1 | 2
}

Be strict but fair. This affects real money stakes.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", 
    messages: [
      {
        role: "system",
        content: "You are a fair but strict conversation quality moderator. Consider context carefully."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  return JSON.parse(response.choices[0].message.content);
}
```

#### Step 2: Create Life-Line Management Service
File: `services/lifeLineService.js`

```javascript
export async function deductLifeLinePoints(userId, sessionId, points, reason, db) {
  // Get current session
  const session = await db.chatSessions.findOne({ sessionId });
  
  // Determine which user to penalize
  const isUser1 = session.user1.userId === userId;
  const userKey = isUser1 ? 'user1' : 'user2';
  const otherUserKey = isUser1 ? 'user2' : 'user1';
  
  // Deduct points
  const newPoints = Math.max(0, session[userKey].lifeLinePoints - points);
  
  await db.chatSessions.updateOne(
    { sessionId },
    { 
      [`${userKey}.lifeLinePoints`]: newPoints 
    }
  );
  
  // Check if user ran out of points
  if (newPoints === 0) {
    await forfeitSession(session, userId, otherUserKey, db);
  }
  
  // Log violation
  await db.violations.create({
    userId,
    sessionId,
    type: points === 1 ? 'low_quality' : 'toxic',
    pointsDeducted: points,
    remainingPoints: newPoints,
    aiReasoning: reason,
    timestamp: new Date()
  });
  
  // Emit real-time update to both users
  io.to(session.roomId).emit('lifeline_update', {
    userId,
    remainingPoints: newPoints,
    pointsDeducted: points,
    reason
  });
  
  return newPoints;
}

async function forfeitSession(session, loserUserId, winnerKey, db) {
  const winnerId = session[winnerKey].userId;
  const loserStake = session[loserUserId === session.user1.userId ? 'user1' : 'user2'].stakedAmount;
  
  // Update session status
  await db.chatSessions.updateOne(
    { sessionId: session.sessionId },
    {
      status: 'forfeited',
      winner: winnerId,
      endedAt: new Date()
    }
  );
  
  // Transfer stake to winner (compensation reward)
  await db.users.updateOne(
    { userId: winnerId },
    { $inc: { balance: loserStake } }
  );
  
  // Loser loses their stake (already deducted when they staked)
  
  // Notify both users
  io.to(session.roomId).emit('session_forfeited', {
    loserId: loserUserId,
    winnerId,
    reward: loserStake,
    reason: 'Life-line points exhausted'
  });
  
  console.log(`Session ${session.sessionId} forfeited. Winner: ${winnerId}, Stake: ${loserStake}`);
}
```

#### Step 3: Integrate into Message Handler
File: `routes/messages.js` or wherever you handle messages

```javascript
app.post('/api/messages', async (req, res) => {
  const { content, userId, sessionId, roomId, replyToMessageId } = req.body;
  
  // 1. Validate session is active
  const session = await db.chatSessions.findOne({ sessionId });
  if (!session || session.status !== 'active') {
    return res.status(400).json({ error: 'Session not active' });
  }
  
  // 2. Create and save message immediately
  const message = await db.messages.create({
    content,
    userId,
    sessionId,
    roomId,
    replyToMessageId,
    timestamp: Date.now()
  });
  
  // 3. Send to clients immediately (responsive UX)
  io.to(roomId).emit('new_message', message);
  res.json({ success: true, message });
  
  // 4. Analyze in background (don't block response)
  analyzeMessageInBackground(message, session);
});

async function analyzeMessageInBackground(message, session) {
  try {
    // Get conversation history (last 10 messages in this session)
    const history = await db.messages.find({
      sessionId: message.sessionId,
      timestamp: { $lt: message.timestamp }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .then(msgs => msgs.reverse()); // Chronological order
    
    // AI Analysis
    const analysis = await analyzeMessageQuality(message, history);
    
    // Save analysis to message
    await db.messages.updateOne(
      { id: message.id },
      {
        aiAnalysis: {
          ...analysis,
          contextAwareness: true,
          processedAt: new Date()
        },
        lifeLineDeduction: analysis.pointsToDeduct,
        penaltyApplied: analysis.pointsToDeduct > 0
      }
    );
    
    // Apply penalties if needed
    if (analysis.pointsToDeduct > 0) {
      await deductLifeLinePoints(
        message.userId,
        message.sessionId,
        analysis.pointsToDeduct,
        analysis.reasoning,
        db
      );
    }
    
  } catch (error) {
    console.error('AI analysis failed for message:', message.id, error);
    // Don't penalize user if AI fails
  }
}
```

#### Step 4: Update Chat Session Creation
When users start a staking chat, initialize life-line points:

```javascript
app.post('/api/sessions/create', async (req, res) => {
  const { user1Id, user2Id, stakeAmount, roomId } = req.body;
  
  const session = await db.chatSessions.create({
    sessionId: generateId(),
    user1: {
      userId: user1Id,
      stakedAmount: stakeAmount,
      lifeLinePoints: 5 // NEW
    },
    user2: {
      userId: user2Id,
      stakedAmount: stakeAmount,
      lifeLinePoints: 5 // NEW
    },
    roomId,
    status: 'active',
    startedAt: new Date()
  });
  
  res.json(session);
});
```

#### Step 5: Frontend Updates Needed

Add UI components to show:
- Life-line points for each user (❤️❤️❤️❤️❤️)
- Real-time deduction notifications
- Warning when points are deducted
- Session forfeit modal when someone reaches 0

---

## ENVIRONMENT VARIABLES
the 
OPENAI_API_KEY is already in the .env


## TESTING CHECKLIST

- [ ] Low quality message ("ok" to a question) deducts 1 point
- [ ] Toxic message deducts 2 points
- [ ] User reaching 0 points forfeits session
- [ ] Winner receives compensation reward
- [ ] Life-line updates show in real-time
- [ ] Appropriate short messages are NOT penalized
- [ ] AI considers conversation context
- [ ] System handles AI API failures gracefully

---

## COST OPTIMIZATION
- Use `gpt-4o-mini`  
- Only analyze messages in active staking sessions
- Cache repeated violations from same user
- Consider batching analysis for high-traffic periods

---

## IMPLEMENTATION NOTES
1. Start with the AI service and test it standalone
2. Add life-line system to database
3. Integrate into message flow
4. Add frontend UI components last
5. Test thoroughly with edge cases before production

Please implement this system step by step, ensuring each part works before moving to the next.






















