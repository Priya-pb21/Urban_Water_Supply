import { useState } from 'react';
import { Bot, Send, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

export default function ChatbotPage() {
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [speak, setSpeak] = useState(false);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await waterApi.chatbot({ message, language, speak });
      setReply(data.data.reply);
      if (data.data.audio_base64) {
        new Audio(`data:${data.data.audio_mime_type};base64,${data.data.audio_base64}`).play();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chatbot failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="panel bg-gradient-to-br from-cyan-600 to-slate-900 text-white">
        <Bot className="mb-4 h-10 w-10" />
        <h2 className="text-2xl font-black">Multilingual Water Assistant</h2>
        <p className="mt-2 text-cyan-50">Ask about shortages, supply, demand, allocations, issues, and area status.</p>
      </div>
      <form onSubmit={ask} className="panel space-y-4">
        <textarea className="input min-h-32" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask: Which areas have shortage today?" required />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="kn">Kannada</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="mr">Marathi</option>
          </select>
          <button type="button" onClick={() => setSpeak(!speak)} className={speak ? 'btn-primary' : 'btn-secondary'}><Volume2 className="h-4 w-4" /> Voice</button>
          <button className="btn-primary" disabled={loading}><Send className="h-4 w-4" /> {loading ? 'Thinking...' : 'Ask'}</button>
        </div>
      </form>
      {reply && <div className="panel whitespace-pre-wrap text-slate-700 dark:text-slate-200">{reply}</div>}
    </div>
  );
}
