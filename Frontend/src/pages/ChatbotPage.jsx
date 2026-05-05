import { useState } from 'react';
import { Bot, Send, Volume2, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function ChatbotPage() {
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [speak, setSpeak] = useState(false);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const ask = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), type: 'user', text: message };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const { data } = await waterApi.chatbot({ message, language, speak });
      const botReply = data.data.reply;
      setReply(botReply);
      
      // Add bot message
      const botMsg = { id: Date.now() + 1, type: 'bot', text: botReply };
      setMessages(prev => [...prev, botMsg]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl space-y-4 h-screen flex flex-col"
    >
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white p-6"
      >
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="rounded-xl bg-white/20 p-3 backdrop-blur"
          >
            <Bot className="h-7 w-7" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold">Water AI Assistant</h2>
            <p className="mt-1 text-cyan-50">Ask about supply, demand, allocation, issues, and more</p>
          </div>
        </div>
      </motion.div>

      {/* Chat messages */}
      <motion.div
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              custom={index}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-3 ${
                  msg.type === 'user'
                    ? 'glass-card bg-cyan-600 text-white'
                    : 'glass-card bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass-card rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-800">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Input form */}
      <motion.form
        onSubmit={ask}
        className="glass-card rounded-2xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="space-y-3">
          <textarea
            className="input min-h-20 resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask: Which areas have shortage? What's the water allocation status?"
            required
          />
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <select
              className="input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="kn">Kannada</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
            </select>
            <motion.button
              type="button"
              onClick={() => setSpeak(!speak)}
              className={speak ? 'btn-primary' : 'btn-secondary'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Voice</span>
            </motion.button>
            <motion.button
              className="btn-primary col-span-1"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Thinking</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
