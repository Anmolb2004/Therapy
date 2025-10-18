// frontend/src/components/ChatModal.jsx
import { FaTimes, FaUser, FaRobot, FaDownload, FaCopy } from 'react-icons/fa';
import { useState } from 'react';

const parseTranscript = (transcript) => {
  if (!transcript) return [];
  const messages = transcript.split(/(?=User: |Therapist: )/);
  return messages.filter(msg => msg.trim() !== '').map(msg => msg.trim());
};

function ChatModal({ transcript, onClose }) {
  const [copied, setCopied] = useState(false);
  
  if (!transcript) return null;
  
  const messages = parseTranscript(transcript);
  const userMessages = messages.filter(m => m.startsWith('User:')).length;
  const therapistMessages = messages.filter(m => m.startsWith('Therapist:')).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div 
      className="fixed inset-0 bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fadeIn p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-2xl shadow-2xl border-2 border-border-color w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border-color bg-gradient-to-r from-primary/10 to-orange-600/10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold font-display text-text-main mb-2 flex items-center gap-3">
              <FaRobot className="text-primary" />
              Conversation Transcript
            </h2>
            <div className="flex items-center gap-4 text-sm text-text-light">
              <span className="flex items-center gap-2">
                <FaUser className="text-primary" />
                {userMessages} patient messages
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <FaRobot className="text-primary" />
                {therapistMessages} therapist responses
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-3 text-text-light hover:text-text-main hover:bg-surface/50 rounded-lg transition-all border border-border-color hover:border-primary/50"
              title="Copy to clipboard"
            >
              {copied ? (
                <span className="text-green-400 text-sm font-semibold">✓ Copied!</span>
              ) : (
                <FaCopy />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-3 text-text-light hover:text-text-main hover:bg-surface/50 rounded-lg transition-all border border-border-color hover:border-primary/50"
              title="Download transcript"
            >
              <FaDownload />
            </button>
            <button 
              onClick={onClose} 
              className="p-3 text-text-light hover:text-text-main hover:bg-red-500/10 hover:border-red-500/30 rounded-lg transition-all border border-border-color"
              title="Close"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>
        
        {/* Messages Container */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-background/50">
          {messages.map((fullMessage, index) => {
            const isUser = fullMessage.startsWith('User:');
            const prefix = isUser ? 'User: ' : 'Therapist: ';
            const content = fullMessage.substring(prefix.length);
            
            return (
              <div key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                {/* Message Label */}
                <div className={`flex items-center gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && <FaRobot className="text-primary text-sm" />}
                  <span className="text-xs font-bold text-text-light uppercase tracking-wider">
                    {isUser ? 'Patient' : 'AI Therapist'}
                  </span>
                  {isUser && <FaUser className="text-primary text-sm" />}
                </div>
                
                {/* Message Bubble */}
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`group relative max-w-[85%] p-5 rounded-2xl shadow-lg leading-relaxed transition-all hover:shadow-xl ${
                    isUser 
                      ? 'bg-gradient-to-br from-primary to-orange-600 text-white rounded-br-md' 
                      : 'bg-surface text-text-light rounded-bl-md border-2 border-border-color hover:border-primary/30'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {content}
                    </p>
                    
                    {/* Message Number Badge */}
                    <div className={`absolute -top-2 ${isUser ? '-left-2' : '-right-2'} w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      isUser 
                        ? 'bg-primary text-white border-background' 
                        : 'bg-surface text-primary border-border-color'
                    }`}>
                      {Math.floor(index / 2) + 1}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* End of Conversation Marker */}
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/50 border border-border-color rounded-full text-text-light text-sm">
              <span>•</span>
              <span>End of Conversation</span>
              <span>•</span>
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="p-6 bg-gradient-to-r from-surface/50 to-secondary/30 border-t border-border-color">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-text-light">
              <span className="font-semibold text-text-main">{messages.length}</span> total messages in this conversation
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-color text-text-main rounded-lg hover:bg-primary hover:border-primary hover:text-white transition-all font-semibold text-sm"
              >
                <FaCopy /> {copied ? 'Copied!' : 'Copy All'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-color text-text-main rounded-lg hover:bg-primary hover:border-primary hover:text-white transition-all font-semibold text-sm"
              >
                <FaDownload /> Download
              </button>
              <button 
                onClick={onClose} 
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold text-sm shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatModal;