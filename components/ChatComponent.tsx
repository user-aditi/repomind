"use client";

import { useState } from "react";
import { Send, User, Bot } from "lucide-react";

export function ChatComponent({ projectId }: { projectId: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hello! I've read your codebase. Ask me anything about it." }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message to UI immediately
    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      // 2. Send to Backend API (We will build this next)
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        body: JSON.stringify({ question: userMessage }),
      });

      const data = await res.json();

      // 3. Add AI Response to UI
      setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[80%] rounded-lg p-4 ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border text-gray-800 shadow-sm"
              }`}
            >
              <div className="mr-3 mt-1">
                {msg.role === "user" ? (
                  <User className="h-5 w-5 text-indigo-200" />
                ) : (
                  <Bot className="h-5 w-5 text-indigo-600" />
                )}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border text-gray-500 shadow-sm rounded-lg p-4 text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="flex-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ask a question about the code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}