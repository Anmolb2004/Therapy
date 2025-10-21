import { Link } from 'react-router-dom';
import SimulationControls from '../components/SimulationControls';
import { FaWrench, FaArrowLeft, FaRocket, FaBrain, FaShieldAlt, FaClock } from 'react-icons/fa';

function ConfigureSimulation(props) {
  const { selectedPersonaCount, therapistVersions, selectedTherapistIds } = props;
  
  return (
    <main className="max-w-7xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-primary shadow-lg">
              ✓
            </div>
            <span className="text-text-main font-semibold">Select Personas</span>
          </div>
          <div className="w-16 h-1 bg-primary"></div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-primary shadow-lg shadow-primary/30 animate-pulse">
              2
            </div>
            <span className="text-text-main font-semibold">Configure</span>
          </div>
          <div className="w-16 h-1 bg-border-color"></div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-surface border-2 border-border-color flex items-center justify-center text-text-light font-bold">
              3
            </div>
            <span className="text-text-light">View Results</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-semibold mb-6">
          <FaWrench className="animate-spin-slow" />
          Configuration Step
        </div>
        
        <h1 className="text-5xl font-bold font-display text-text-main mb-4">
          Configure Your
          <span className="block text-transparent bg-gradient-to-r from-orange-400 via-primary to-orange-600 bg-clip-text mt-2">
            Simulation Parameters
          </span>
        </h1>
        
        <p className="text-xl text-text-light mt-4 max-w-3xl mx-auto leading-relaxed">
          Select AI therapist models, evaluation criteria, and conversation length. 
          Your simulation will test <span className="text-primary font-bold">{selectedPersonaCount}</span> patient persona{selectedPersonaCount !== 1 ? 's' : ''} 
          against your chosen configurations.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-xl p-6 border border-border-color">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FaBrain className="text-primary text-xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{selectedTherapistIds.size}</div>
              <div className="text-text-light text-sm">AI Models Selected</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-xl p-6 border border-border-color">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FaShieldAlt className="text-primary text-xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{selectedPersonaCount}</div>
              <div className="text-text-light text-sm">Patient Personas</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-xl p-6 border border-border-color">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FaClock className="text-primary text-xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">~{Math.ceil(selectedPersonaCount * selectedTherapistIds.size * 0.5)}</div>
              <div className="text-text-light text-sm">Min Estimated Time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-2xl border border-border-color overflow-hidden mb-10">
        <div className="bg-gradient-to-r from-primary/10 to-orange-600/10 p-8 border-b border-border-color">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3 font-display mb-2">
                <FaWrench className="text-primary" /> Simulation Configuration
              </h2>
              <p className="text-text-light">Fine-tune your simulation parameters for optimal results</p>
            </div>
            <div className="hidden md:block">
              <div className="px-6 py-3 bg-surface/50 rounded-xl border border-border-color">
                <div className="text-xs text-text-light mb-1">Total Simulations</div>
                <div className="text-2xl font-bold text-primary">
                  {selectedPersonaCount * selectedTherapistIds.size}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <SimulationControls {...props} />
        
        <div className="p-8 bg-gradient-to-r from-surface/50 to-secondary/30 border-t border-border-color">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link 
              to="/" 
              className="group inline-flex items-center gap-3 px-6 py-3 font-display font-semibold text-text-main bg-surface border-2 border-border-color rounded-xl transition-all hover:border-primary/50 hover:bg-surface/80 hover:shadow-lg"
            >
              <FaArrowLeft className="transition-transform group-hover:-translate-x-1" /> 
              Back to Personas
            </Link>
            
            <div className="text-center md:text-right">
              <p className="text-text-light text-sm mb-1">Ready to run?</p>
              <p className="text-text-main font-semibold">Click "Run Simulation" below to start</p>
            </div>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-2xl p-8 border border-border-color">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <FaRocket className="text-primary" />
          What Happens Next?
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold border border-primary/30">
                1
              </div>
              <div>
                <h4 className="font-semibold text-text-main mb-1">Simulation Initiation</h4>
                <p className="text-text-light text-sm">Each AI therapist model will conduct separate sessions with every selected patient persona</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold border border-primary/30">
                2
              </div>
              <div>
                <h4 className="font-semibold text-text-main mb-1">Conversation Generation</h4>
                <p className="text-text-light text-sm">Each session runs for the specified number of turns, creating realistic therapy dialogues</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold border border-primary/30">
                3
              </div>
              <div>
                <h4 className="font-semibold text-text-main mb-1">Quality Evaluation</h4>
                <p className="text-text-light text-sm">Advanced AI evaluates each conversation for empathy, safety, effectiveness, and therapeutic quality</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold border border-primary/30">
                4
              </div>
              <div>
                <h4 className="font-semibold text-text-main mb-1">Results Dashboard</h4>
                <p className="text-text-light text-sm">View detailed scores, compare models, and read full conversation transcripts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tips Section */}
      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-6">
        <h4 className="font-bold text-text-main mb-3 flex items-center gap-2">
          <span className="text-primary">💡</span> Pro Tips
        </h4>
        <ul className="space-y-2 text-text-light text-sm">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Start with 3-5 conversation turns for quick testing, increase to 10+ for comprehensive evaluation</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Compare at least 2 different models to identify which approach works best for your use case</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Use "Clinical Safety" evaluation for production deployments, "Standard Quality" for development</span>
          </li>
        </ul>
      </div>
    </main>
  );
}

export default ConfigureSimulation;