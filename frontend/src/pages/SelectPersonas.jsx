import { Link } from 'react-router-dom';
import { FaUsers, FaArrowRight, FaRobot, FaChartLine, FaComments } from 'react-icons/fa';

function SelectPersonas({ personas, selectedPersonaIds, onPersonaSelect }) {
  const isNextDisabled = selectedPersonaIds.size === 0;
  
  return (
    <main className="max-w-7xl mx-auto animate-fadeIn">
      {/* Hero Section with Product Description */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-semibold mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          AI Therapy Simulation Platform
        </div>
        
        <h1 className="text-6xl font-bold font-display text-text-main mb-6 leading-tight">
          Test Your AI Therapist
          <span className="block text-transparent bg-gradient-to-r from-orange-400 via-primary to-orange-600 bg-clip-text mt-2">
            Against Real Scenarios
          </span>
        </h1>
        
        <p className="text-xl text-text-light mt-6 max-w-3xl mx-auto leading-relaxed">
          Evaluate how different AI therapy models respond to diverse patient personas. 
          Run simulated therapy sessions and get detailed quality metrics powered by advanced AI evaluation.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-6 border border-border-color hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <FaRobot className="text-primary text-2xl" />
          </div>
          <h3 className="text-lg font-bold mb-2">Multiple AI Models</h3>
          <p className="text-text-light text-sm">Test GPT-4o and Claude Sonnet with different therapeutic approaches</p>
        </div>
        
        <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-6 border border-border-color hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <FaUsers className="text-primary text-2xl" />
          </div>
          <h3 className="text-lg font-bold mb-2">Diverse Personas</h3>
          <p className="text-text-light text-sm">Simulate conversations with patients facing various mental health challenges</p>
        </div>
        
        <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-6 border border-border-color hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <FaChartLine className="text-primary text-2xl" />
          </div>
          <h3 className="text-lg font-bold mb-2">Quality Metrics</h3>
          <p className="text-text-light text-sm">Get detailed evaluations on empathy, safety, and therapeutic effectiveness</p>
        </div>
      </div>

      {/* Main Selection Card */}
      <div className="bg-surface rounded-2xl shadow-2xl border border-border-color overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-orange-600/10 p-8 border-b border-border-color">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3 font-display mb-2">
                <FaUsers className="text-primary" /> Select Patient Personas
              </h2>
              <p className="text-text-light">Choose the patient profiles you want to test against your AI therapist</p>
            </div>
            <div className="bg-primary/20 px-6 py-3 rounded-xl border border-primary/30">
              <div className="text-3xl font-bold text-primary">{selectedPersonaIds.size}</div>
              <div className="text-xs text-text-light font-semibold">Selected</div>
            </div>
          </div>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto p-8">
          {personas.length > 0 ? (
            <div className="space-y-3">
              {personas.map((p) => (
                <div 
                  key={p.id} 
                  className={`group relative grid grid-cols-[auto_1fr] items-start gap-4 p-5 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                    selectedPersonaIds.has(p.id) 
                      ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' 
                      : 'bg-surface/30 border-border-color hover:border-primary/30 hover:bg-surface/50'
                  }`}
                  onClick={() => onPersonaSelect(p.id)}
                >
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 accent-primary cursor-pointer rounded transition-all" 
                      checked={selectedPersonaIds.has(p.id)} 
                      readOnly 
                    />
                    {selectedPersonaIds.has(p.id) && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping"></div>
                    )}
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <FaComments className={`text-lg mt-1 flex-shrink-0 transition-colors ${
                        selectedPersonaIds.has(p.id) ? 'text-primary' : 'text-text-light'
                      }`} />
                      <label className={`cursor-pointer leading-relaxed transition-all ${
                        selectedPersonaIds.has(p.id) 
                          ? 'text-text-main font-semibold' 
                          : 'text-text-light group-hover:text-text-main'
                      }`}>
                        {p.persona}
                      </label>
                    </div>
                  </div>
                  
                  {selectedPersonaIds.has(p.id) && (
                    <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Active
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-text-light text-lg">Loading patient personas...</p>
            </div>
          )}
        </div>
        
        <div className="p-8 bg-gradient-to-r from-surface/50 to-secondary/30 border-t border-border-color">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-text-light text-sm mb-1">Next Step</p>
              <p className="text-text-main font-semibold">Configure your simulation parameters</p>
            </div>
            
            <Link 
              to="/configure" 
              className={`group inline-flex items-center gap-3 px-10 py-4 text-lg font-display font-bold text-white bg-gradient-to-r from-primary to-orange-600 rounded-xl transition-all duration-300 shadow-lg ${
                isNextDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95'
              }`}
              onClick={(e) => isNextDisabled && e.preventDefault()}
            >
              Continue to Configuration
              <FaArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          {isNextDisabled && (
            <div className="mt-4 text-center md:text-right">
              <p className="text-sm text-orange-400 font-semibold">⚠ Please select at least one persona to continue</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Explanation Section */}
      <div className="mt-12 bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-2xl p-8 border border-border-color">
        <h3 className="text-2xl font-bold mb-6 text-center">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl border-2 border-primary/30">
              1
            </div>
            <h4 className="font-semibold mb-2">Select Personas</h4>
            <p className="text-text-light text-sm">Choose patient profiles with different mental health challenges</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl border-2 border-primary/30">
              2
            </div>
            <h4 className="font-semibold mb-2">Configure Models</h4>
            <p className="text-text-light text-sm">Select AI therapist versions and evaluation criteria</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl border-2 border-primary/30">
              3
            </div>
            <h4 className="font-semibold mb-2">Run Simulation</h4>
            <p className="text-text-light text-sm">AI conducts full therapy sessions with each persona</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl border-2 border-primary/30">
              4
            </div>
            <h4 className="font-semibold mb-2">Review Results</h4>
            <p className="text-text-light text-sm">Get detailed quality scores and conversation transcripts</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SelectPersonas;