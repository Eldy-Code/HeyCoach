'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatSession, ChatMessage } from '@/types'
import { cn, relativeTime } from '@/lib/utils'
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Bot,
  User,
  ChevronRight,
  Zap,
  ClipboardList,
} from 'lucide-react'

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3 chat-message', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
          isUser ? 'bg-railers-red' : 'bg-purple-600'
        )}
      >
        {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-white" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-railers-red text-white rounded-tr-sm'
            : 'bg-railers-black-card border border-white/5 text-gray-200 rounded-tl-sm'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-dark" dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
        )}
        <div className={cn('text-[10px] mt-1.5', isUser ? 'text-red-200' : 'text-gray-600')}>
          {relativeTime(message.createdAt)}
        </div>
      </div>
    </div>
  )
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gm, '<h3 class="text-railers-red font-display font-semibold text-base mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-railers-red font-display font-bold text-lg mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-railers-red font-display font-bold text-xl mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-black/40 text-railers-red px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-300 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 text-gray-300 list-decimal">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

const STARTER_PROMPTS = [
  "Suggest 3 skating drills for 10U players",
  "Help me build a 60-minute practice for Bantam defensemen",
  "What drills work best for power play development?",
  "Review my current practice plan and suggest improvements",
  "Give me a fun warm-up drill for young players (8U)",
  "How should I structure a practice focused on penalty kill systems?",
]

export default function CoachChatPage() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId')

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function loadSessions() {
    setLoading(true)
    try {
      const res = await fetch('/api/chat')
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function createSession() {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createSession: true, planId }),
    })
    const session = await res.json()
    setSessions((prev) => [session, ...prev])
    setActiveSession(session)
    setMessages([])
  }

  async function loadSession(session: ChatSession) {
    const res = await fetch(`/api/chat/${session.id}`)
    const data = await res.json()
    setActiveSession(data)
    setMessages(data.messages ?? [])
  }

  async function deleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/chat/${sessionId}`, { method: 'DELETE' })
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (activeSession?.id === sessionId) {
      setActiveSession(null)
      setMessages([])
    }
  }

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || sending) return

    // Auto-create session if none
    let session = activeSession
    if (!session) {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createSession: true, planId }),
      })
      session = await res.json()
      setSessions((prev) => [session!, ...prev])
      setActiveSession(session)
    }

    setInput('')
    setSending(true)

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      sessionId: session!.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session!.id, message: content }),
      })
      const data = await res.json()

      if (data.message) {
        setMessages((prev) => [...prev, data.message])
      }

      // Update session title in list
      await loadSessions()
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sessionId: session!.id,
          role: 'assistant',
          content: 'Sorry, I had trouble connecting. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sessions sidebar */}
      <div className="w-64 border-r border-white/5 bg-railers-black-soft flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/5">
          <button
            onClick={createSession}
            className="w-full flex items-center justify-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner mx-auto" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-600 text-xs">
              No chats yet. Start a new one!
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors group',
                  activeSession?.id === s.id
                    ? 'bg-railers-red/10 text-white border border-railers-red/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="text-xs flex-1 truncate">{s.title}</span>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))
          )}
        </div>

        {/* Tips */}
        <div className="p-3 m-2 bg-railers-red/5 border border-railers-red/10 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={12} className="text-railers-red" />
            <span className="text-[10px] text-railers-red font-semibold">PRO TIP</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Link a practice plan to get contextual coaching advice from Claude.
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 flex-shrink-0 bg-railers-black-soft/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Bot size={16} className="text-purple-400" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm uppercase tracking-wide">
                HeyCoach AI
              </div>
              <div className="text-[10px] text-gray-500">
                Powered by Claude · Rail Dawgs Edition
              </div>
            </div>
          </div>
          {activeSession?.plan && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
              <ClipboardList size={13} className="text-blue-400" />
              <span className="text-xs text-blue-300">
                Plan: {activeSession.plan.title}
              </span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!activeSession ? (
            /* Welcome state */
            <div className="max-w-2xl mx-auto pt-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot size={32} className="text-purple-400" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white uppercase mb-2">
                  HeyCoach AI
                </h2>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Your AI-powered hockey coaching assistant. Ask me anything about drills,
                  practice plans, player development, and team systems.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="p-3 bg-railers-black-card border border-white/5 hover:border-railers-red/30 rounded-xl text-left text-xs text-gray-400 hover:text-white transition-all group"
                  >
                    <ChevronRight size={12} className="text-railers-red mb-1 group-hover:translate-x-0.5 transition-transform" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="max-w-2xl mx-auto pt-8 text-center">
              <p className="text-gray-500 text-sm">Start chatting! Ask me about drills, practice plans, or player development.</p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {STARTER_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="p-3 bg-railers-black-card border border-white/5 hover:border-railers-red/30 rounded-xl text-left text-xs text-gray-400 hover:text-white transition-all"
                  >
                    <ChevronRight size={12} className="text-railers-red mb-1" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot size={15} className="text-white" />
              </div>
              <div className="bg-railers-black-card border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-white/5 flex-shrink-0">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 bg-railers-black-card border border-white/10 rounded-xl focus-within:border-railers-red/40 focus-within:ring-1 focus-within:ring-railers-red/20 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about drills, practice plans, player development... (Enter to send, Shift+Enter for new line)"
                rows={2}
                className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none"
                disabled={sending}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                input.trim() && !sending
                  ? 'bg-railers-red hover:bg-railers-red-dark text-white shadow-lg shadow-railers-red/20'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              )}
            >
              {sending ? <div className="spinner scale-75" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-700 mt-2">
            HeyCoach AI can make mistakes. Always use your coaching judgment.
          </p>
        </div>
      </div>
    </div>
  )
}
