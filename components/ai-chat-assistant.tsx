'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Bot, User, Loader2, ArrowDown } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AiChatAssistant({
  projectDraft,
}: {
  projectDraft: {
    title: string
    description: string
    problemStatement: string
    proposedSolution: string
    track: string
  }
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm your Mak-TIC Application Assistant. I can help review your problem statement, polish your solution, or check for completeness. Ask me anything about your draft!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Call route handler for AI chat
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          projectDraft,
        }),
      })

      const data = await res.json()
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error: ${data.error}`,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.text,
          },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the assistant. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[500px] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center gap-2">
        <div className="p-1 rounded bg-amber-500/10 text-amber-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white">Application Quality Coach</h3>
          <span className="text-[10px] text-slate-500 font-semibold">Gemini AI Assistant</span>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs ${
                m.role === 'user'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div
              className={`rounded-xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-850 border border-slate-800 text-slate-350'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-2.5 max-w-[85%]">
            <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center bg-slate-850 text-slate-300 border border-slate-800">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-xl p-3 bg-slate-850 border border-slate-800 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Analyzing draft...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask how to improve your problem statement..."
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-550 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg px-3 flex items-center justify-center cursor-pointer transition-all"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  )
}
