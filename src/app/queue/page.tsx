'use client'

import { useState } from 'react'
import type { QueueItem, MessageStatus, MessageCategory, ClassifyResponse } from '@/types'

const SEED_ITEMS: QueueItem[] = [
  {
    id: '1',
    message: 'Dzień dobry, chciałbym zamówić 50 sztuk produktu X. Czy możliwy jest rabat przy takiej ilości?',
    company: 'Sklep meblowy Premium',
    category: 'zamówienie',
    priority: 'high',
    draft_reply:
      'Dzień dobry! Dziękujemy za zainteresowanie naszą ofertą. Przy zamówieniu 50 sztuk produktu X przysługuje rabat 15%. Czy mogę poprosić o dane do wyceny?',
    confidence: 0.94,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    message: 'Kiedy przyjedzie moja paczka? Zamówiłam tydzień temu i nic.',
    company: 'Sklep meblowy Premium',
    category: 'reklamacja',
    priority: 'high',
    draft_reply:
      'Przepraszamy za niedogodności. Proszę o numer zamówienia — sprawdzimy status wysyłki i wrócimy do Pani w ciągu 2 godzin.',
    confidence: 0.91,
    status: 'pending',
    created_at: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: '3',
    message: 'Jakie są godziny otwarcia w weekend?',
    company: 'Sklep meblowy Premium',
    category: 'pytanie',
    priority: 'low',
    draft_reply: 'Jesteśmy otwarci w soboty w godz. 10:00–18:00. W niedziele sklep jest nieczynny.',
    confidence: 0.98,
    status: 'pending',
    created_at: new Date(Date.now() - 300_000).toISOString(),
  },
]

// ────────────────────────────────────────────────────────────
// Kolory etykiet 
// ────────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<MessageCategory, string> = {
  zamówienie: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40',
  pytanie: 'bg-blue-900/40 text-blue-400 border border-blue-700/40',
  reklamacja: 'bg-red-900/40 text-red-400 border border-red-700/40',
  spam: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-zinc-500',
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>(SEED_ITEMS)
  const [filter, setFilter] = useState<MessageCategory | 'all'>('all')
const [editingId, setEditingId] = useState<string | null>(null)

//formularz dodawania wiadomości
const [inputMessage, setInputMessage] = useState('')
  const [inputCompany, setInputCompany] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

//licznik statystyk
const stats = items.reduce(
    (acc, item) => {
      if (item.status === 'pending') acc.pending++
      if (item.status === 'approved') acc.approved++
      if (item.status === 'rejected') acc.rejected++
      return acc
    },
    { pending: 0, approved: 0, rejected: 0 }
  )

 
  function handleAction(id: string, action: MessageStatus) {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, status: action } : item))
    )
    if (editingId === id) {
      setEditingId(null)
    }
  }

  function handleEditReply(id: string, newReply: string) {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, draft_reply: newReply } : item))
    )
  }

// implementacja formularza dodawania wiadomości i wywołania endpointu klasyfikacji
async function handleAddMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputMessage.trim() || !inputCompany.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          company: inputCompany,
        }),
      })

      if (!response.ok) {
        throw new Error('Nie udało się sklasyfikować wiadomości przez AI.')
      }

      const aiData: ClassifyResponse = await response.json()

      // Konstrukcja pełnego obiektu spełniającego interfejs QueueItem
      const newIncomingMessage: QueueItem = {
        id: crypto.randomUUID(),
        message: inputMessage,
        company: inputCompany,
        status: 'pending',
        created_at: new Date().toISOString(),
        category: aiData.category,
        priority: aiData.priority,
        draft_reply: aiData.draft_reply,
        confidence: aiData.confidence,
      }

      // Wpięcie nowej wiadomości na początek kolejki
      setItems((prev) => [newIncomingMessage, ...prev])
      
      // Czyszczenie pól formularza
      setInputMessage('')
      setInputCompany('')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsSubmitting(false)
    }
  }
const visible = filter === 'all' ? items : items.filter((i) => i.category === filter)
  const pending = items.filter((i) => i.status === 'pending').length

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      {/* ── Header ─────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Cliqy Studio</p>
        <h1 className="text-2xl font-bold text-zinc-100">Panel weryfikacji</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          {pending} oczekujących · {items.length} łącznie
        </p>
      </div>

      {/* ── Liczniki statystyk  ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
  
  {/* Karta: Oczekujące */}
  <div className="relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 transition-all hover:border-zinc-700">
    <div className="absolute top-0 left-0 w-full h-[3px] bg-zinc-500/40" />
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Oczekujące</p>
        <p className="text-3xl font-bold text-zinc-100 mt-2 font-mono">{stats.pending}</p>
      </div>
      <div className="p-2.5 bg-zinc-800/60 rounded-lg border border-zinc-700/50 text-zinc-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
    </div>
  </div>

  {/* Karta: Zatwierdzone */}
  <div className="relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 transition-all hover:border-emerald-900/50">
    <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500/90">Zatwierdzone</p>
        <p className="text-3xl font-bold text-emerald-400 mt-2 font-mono">{stats.approved}</p>
      </div>
      <div className="p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-800/30 text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
    </div>
  </div>

  {/* Karta: Odrzucone */}
  <div className="relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 transition-all hover:border-red-900/50">
    <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500" />
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-400/90">Odrzucone</p>
        <p className="text-3xl font-bold text-red-400 mt-2 font-mono">{stats.rejected}</p>
      </div>
      <div className="p-2.5 bg-red-950/30 rounded-lg border border-red-800/30 text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
  </div>

</div>

      {/* ── Filtr kategorii ────────────────── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'zamówienie', 'pytanie', 'reklamacja', 'spam'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === cat
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {cat === 'all' ? 'Wszystkie' : cat}
          </button>
        ))}
      </div>

      {/* ── Lista elementów ────────────────── */}
      <div className="flex flex-col gap-4">
        {visible.length === 0 && (
          <p className="text-zinc-500 text-sm py-12 text-center">Brak elementów w tej kategorii.</p>
        )}

        {visible.map((item) => {
          const isEditing = editingId === item.id

          return (
            <article
              key={item.id}
              className={`rounded-xl border p-5 transition-opacity ${
                item.status !== 'pending' ? 'opacity-50' : ''
              }`}
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* Nagłówek karty */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[item.category]}`}>
                    {item.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[item.priority]}`} />
                    {item.priority}
                  </span>
                  <span className="text-xs text-zinc-600">{item.company}</span>
                </div>
                <span className="text-xs text-zinc-600 shrink-0">
                  {new Date(item.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Wiadomość klienta */}
              <div className="mb-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Wiadomość</p>
                <p className="text-sm text-zinc-200">{item.message}</p>
              </div>

              {/* Draft AI */}
              <div className="mb-4 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Draft AI · {Math.round(item.confidence * 100)}% pewności
                </p>
                
                {isEditing ? (
                  <textarea
                    value={item.draft_reply}
                    onChange={(e) => handleEditReply(item.id, e.target.value)}
                    className="w-full text-sm text-zinc-200 bg-zinc-950 border border-zinc-700 rounded p-2 focus:outline-none focus:border-zinc-500 min-h-[80px] resize-y"
                  />
                ) : (
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{item.draft_reply}</p>
                )}
              </div>

              {/* Akcje */}
              {item.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'approved')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 hover:bg-emerald-800/50 transition-colors"
                  >
                    ✅ Zatwierdź
                  </button>
                  
                  <button
                    onClick={() => setEditingId(isEditing ? null : item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isEditing
                        ? 'bg-amber-900/40 text-amber-400 border-amber-700/40 hover:bg-amber-800/50'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {isEditing ? '💾 Zapisz podgląd' : '✏️ Edytuj'}
                  </button>
                  
                  <button
                    onClick={() => handleAction(item.id, 'rejected')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/40 hover:bg-red-800/50 transition-colors"
                  >
                    ❌ Odrzuć
                  </button>
                </div>
              )}

              {item.status !== 'pending' && (
                <p className="text-xs text-zinc-600 italic">
                  {item.status === 'approved' ? '✅ Zatwierdzone' : '❌ Odrzucone'}
                </p>
              )}
            </article>
          )
        })}
      </div>
{/* Formularz dodawania wiadomości */}
      <AddMessageForm 
      inputCompany={inputCompany}
      setInputCompany={setInputCompany}
      inputMessage={inputMessage}
      setInputMessage={setInputMessage}
      isSubmitting={isSubmitting}
      formError={formError}
      onSubmit={handleAddMessage}
    />
    </main>
  )
}
// Komponent formularza dodawania wiadomości
interface AddMessageFormProps {
  inputCompany: string;
  setInputCompany: (value: string) => void;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isSubmitting: boolean;
  formError: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

function AddMessageForm({
  inputCompany,
  setInputCompany,
  inputMessage,
  setInputMessage,
  isSubmitting,
  formError,
  onSubmit,
}: AddMessageFormProps) {
  return (
    <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
        Dodaj nową wiadomość do analizy
      </h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Input: Nazwa firmy */}
        <div>
          <label htmlFor="company" className="block text-xs text-zinc-500 mb-1.5 font-medium">
            Nazwa firmy
          </label>
          <input
            id="company"
            type="text"
            required
            disabled={isSubmitting}
            value={inputCompany}
            onChange={(e) => setInputCompany(e.target.value)}
            placeholder="np. Sklep meblowy Premium"
            className="w-full text-sm text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-700 disabled:opacity-50 transition-colors"
          />
        </div>

        {/* Textarea: Treść wiadomości */}
        <div>
          <label htmlFor="message" className="block text-xs text-zinc-500 mb-1.5 font-medium">
            Treść wiadomości
          </label>
          <textarea
            id="message"
            required
            disabled={isSubmitting}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Wpisz treść wiadomości od klienta..."
            rows={4}
            className="w-full text-sm text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-700 disabled:opacity-50 transition-colors resize-y min-h-[100px]"
          />
        </div>

        {/* Komunikat o błędzie */}
        {formError && (
          <div className="p-3 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
            ⚠️ {formError}
          </div>
        )}

        {/* Przycisk wysyłania */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-zinc-100 text-black hover:bg-zinc-200 border border-transparent disabled:opacity-50 transition-all cursor-pointer font-semibold shadow-sm"
          >
            {isSubmitting ? (
              <>
                {/* Prosty spinner SVG */}
                <svg className="animate-spin h-3.5 w-3.5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analizowanie...
              </>
            ) : (
              <>
                <span>✨ Analizuj przez AI</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}