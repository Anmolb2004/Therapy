// frontend/src/components/SimulationControls.jsx
import { FaPlay, FaRobot, FaListOl, FaBalanceScale, FaCheckCircle } from 'react-icons/fa';

function SimulationControls({ 
  therapistVersions, 
  selectedTherapistIds, 
  onTherapistSelect,  // Changed from handleTherapistSelection
  evaluationVersions, 
  selectedEvaluation, 
  onEvaluationSelect,  // Changed from setSelectedEvaluation
  numTurns, 
  onNumTurnsChange,    // Changed from setNumTurns
  onRunSimulation, 
  isLoading, 
  selectedPersonaCount 
}) {
  const isButtonDisabled = isLoading || selectedPersonaCount === 0 || selectedTherapistIds.size === 0;
  
  return (
    <div className="p-8 space-y-8">
      {/* Therapist Models Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xl font-semibold font-display flex items-center gap-3">
            <FaRobot className="text-primary" /> Select AI Therapist Models
          </label>
          <span className="text-sm text-text-light">
            {selectedTherapistIds.size} of {therapistVersions.length} selected
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {therapistVersions.map(v => (
            <div 
              key={v.id} 
              className={`group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                selectedTherapistIds.has(v.id) 
                  ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' 
                  : 'bg-surface/30 border-border-color hover:border-primary/30 hover:bg-surface/50'
              }`}
              onClick={() => onTherapistSelect(v.id)}
            >
              <div className="relative">
                <input 
                  type="checkbox" 
                  id={`t-${v.id}`} 
                  className="w-6 h-6 accent-primary cursor-pointer rounded transition-all" 
                  checked={selectedTherapistIds.has(v.id)} 
                  onChange={() => {}} // Controlled by parent div click
                  readOnly 
                />
                {selectedTherapistIds.has(v.id) && (
                  <FaCheckCircle className="absolute -top-1 -right-1 w-3 h-3 text-primary" />
                )}
              </div>
              
              <label 
                htmlFor={`t-${v.id}`} 
                className={`flex-1 cursor-pointer font-medium transition-colors ${
                  selectedTherapistIds.has(v.id) 
                    ? 'text-text-main' 
                    : 'text-text-light group-hover:text-text-main'
                }`}
              >
                {v.name}
              </label>
              
              {selectedTherapistIds.has(v.id) && (
                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
                  Active
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation & Turns Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Evaluation Selector */}
        <div className="space-y-3">
          <label htmlFor="eval-version" className="text-xl font-semibold font-display flex items-center gap-3">
            <FaBalanceScale className="text-primary" /> Evaluation Criteria
          </label>
          <div className="relative">
            <select 
              id="eval-version" 
              value={selectedEvaluation} 
              onChange={(e) => onEvaluationSelect(e.target.value)} 
              disabled={isLoading} 
              className="w-full p-4 pr-10 rounded-xl bg-surface border-2 border-border-color text-text-main font-medium focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/50"
            >
              {evaluationVersions.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-light">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <p className="text-xs text-text-light">
            {selectedEvaluation === 'standard' 
              ? 'Evaluates overall quality and effectiveness' 
              : 'Focuses on therapeutic safety and ethical considerations'}
          </p>
        </div>

        {/* Number of Turns */}
        <div className="space-y-3">
          <label htmlFor="num-turns" className="text-xl font-semibold font-display flex items-center gap-3">
            <FaListOl className="text-primary" /> Conversation Turns
          </label>
          <div className="relative">
            <input 
              type="number" 
              id="num-turns" 
              value={numTurns} 
              onChange={(e) => onNumTurnsChange(Number(e.target.value))} 
              min="1" 
              max="20" 
              disabled={isLoading} 
              className="w-full p-4 rounded-xl bg-surface border-2 border-border-color text-text-main font-medium focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/50"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light text-sm font-semibold">
              turns
            </div>
          </div>
          <p className="text-xs text-text-light">
            {numTurns <= 3 ? 'Quick test' : numTurns <= 7 ? 'Standard session' : 'Comprehensive evaluation'}
          </p>
        </div>
      </div>

      {/* Run Simulation Button */}
      <div className="pt-4">
        <button 
          onClick={onRunSimulation} 
          disabled={isButtonDisabled} 
          className={`group w-full flex items-center justify-center gap-4 px-8 py-5 text-xl font-display font-bold text-white bg-gradient-to-r from-primary to-orange-600 rounded-xl transition-all duration-300 shadow-lg ${
            isButtonDisabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] hover:from-orange-600 hover:to-primary'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              Running Simulations...
            </>
          ) : (
            <>
              <FaPlay className="transition-transform group-hover:scale-110" /> 
              Launch Simulation
            </>
          )}
        </button>
        
        {isButtonDisabled && !isLoading && (
          <div className="mt-4 text-center">
            <p className="text-sm text-orange-400 font-semibold">
              ⚠ {selectedPersonaCount === 0 
                ? 'Please select at least one persona on the previous page' 
                : 'Please select at least one AI therapist model'}
            </p>
          </div>
        )}
        
        {!isButtonDisabled && !isLoading && (
          <div className="mt-4 text-center">
            <p className="text-sm text-text-light">
              This will run <span className="text-primary font-bold">{selectedPersonaCount * selectedTherapistIds.size}</span> simulation{selectedPersonaCount * selectedTherapistIds.size !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimulationControls;