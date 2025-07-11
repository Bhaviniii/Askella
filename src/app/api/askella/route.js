const { NextResponse } = require("next/server");

// Helper for persona-based responses
function getAskellaResponse(prompt, persona) {
  const lowerPrompt = prompt ? prompt.toLowerCase().trim() : "";
  if (lowerPrompt === "okay") return "Can I help you with something else?";
  if (lowerPrompt === "no") return "Alright!";
  if (persona === "developer") {
    if (lowerPrompt.includes("css")) {
      return "To center a div in CSS, use `margin: 0 auto;` or Flexbox with `justify-content: center; align-items: center;`.";
    }
    return "I'm Askella the Developer! Ask me anything about code.";
  }
  if (persona === "teacher") {
    if (lowerPrompt === "maths") return "maths is indeed an excellent subject";
    if (lowerPrompt === "science") return "science is indeed an excellent subject.";
    return "I'm Askella the Teacher! Let's learn together. What subject are you interested in?";
  }
  if (persona === "writer") {
    if (lowerPrompt.includes("poem")) return "machli jal ki rani hai jeevan uska paani hai";
    if (lowerPrompt.includes("story")) return "ek tha raja ek thi rani do mar gye khatam kahani";
    return "I'm Askella the Writer! I can help with poems, stories.";
  }
  if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi")) {
    return "Hello! I'm Askella, your AI chat buddy. How can I help you today?";
  }
  return `You said: "${prompt}". (This is a mock AI response.)`;
}

async function POST(req) {
  const body = await req.json();
  const response = getAskellaResponse(body.prompt, body.persona);
  return NextResponse.json({ response });
}

module.exports = { POST }; 