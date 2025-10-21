import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SelectPersonas from './pages/SelectPersonas';
import ConfigureSimulation from './pages/ConfigureSimulation';
import ResultsPage from './pages/ResultsPage';
import ChatModal from './components/ChatModal';

const API_URL = "http://simula-albae-uvqkllrso5kl-1348279005.us-west-2.elb.amazonaws.com";

const THERAPIST_VERSIONS = [
  { id: 'v1_empathetic', name: 'V1 - Empathetic (GPT-4o)' },
  { id: 'v2_cbt', name: 'V2 - CBT (GPT-4o)' },
  { id: 'v3_direct', name: 'V3 - Direct (GPT-4o)' },
  { id: 'v4_claude_cbt', name: 'V4 - CBT (Claude Sonnet)' },
  { id: 'v5_claude_empathetic', name: 'V5 - Empathetic (Claude Sonnet)' },
  { id: 'v6_claude_direct', name: 'V6 - Direct (Claude Sonnet)' },
];

const EVALUATION_VERSIONS = [
  { id: 'standard', name: 'Standard Quality' },
  { id: 'safety', name: 'Clinical Safety' },
];

function App() {
  const navigate = useNavigate();

  const [personas, setPersonas] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [selectedPersonaIds, setSelectedPersonaIds] = useState(new Set());
  const [selectedTherapistIds, setSelectedTherapistIds] = useState(new Set(['v2_cbt', 'v4_claude_cbt']));
  const [selectedEvaluation, setSelectedEvaluation] = useState(EVALUATION_VERSIONS[0].id);
  const [numTurns, setNumTurns] = useState(5);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await axios.get(`${API_URL}/personas`);
        setPersonas(response.data.personas);
      } catch (error) { console.error("Failed to fetch personas:", error); }
    };
    fetchPersonas();
  }, []);
  
  const handleCheckboxChange = (id, state, setState) => {
    const newSelectedIds = new Set(state);
    if (newSelectedIds.has(id)) newSelectedIds.delete(id);
    else newSelectedIds.add(id);
    setState(newSelectedIds);
  };

  const pollForResults = (jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/results/${jobId}`);
        const { status, progress, results: jobResults, errorMessage } = response.data;

        if (status === 'RUNNING') {
          setLoadingMessage(`Simulation in progress... (${progress})`);
          if (jobResults) setResults(jobResults);
        } else if (status === 'COMPLETE') {
          setLoadingMessage('Simulation complete!');
          setResults(jobResults);
          setIsLoading(false);
          clearInterval(intervalId);
        } else if (status === 'FAILED') {
          alert(`The simulation failed: ${errorMessage}`);
          setIsLoading(false);
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Polling failed:", error);
      }
    }, 3000); 

    return intervalId;
  };

  const handleRunSimulation = async () => {
    if (selectedPersonaIds.size === 0 || selectedTherapistIds.size === 0) {
      alert("Please select at least one persona and one therapist version.");
      return;
    }
    
    navigate('/results');
    setIsLoading(true);
    setResults([]);
    setLoadingMessage("Sending job to the simulation engine...");
    
    const requestBody = {
      persona_ids: Array.from(selectedPersonaIds),
      therapist_versions: Array.from(selectedTherapistIds),
      evaluation_version: selectedEvaluation,
      num_turns: numTurns,
    };

    try {
      const response = await axios.post(`${API_URL}/start-simulation`, requestBody);
      const { job_id } = response.data;
      setLoadingMessage("Job queued! Waiting for a worker...");
      pollForResults(job_id);
    } catch (error) {
      console.error("Failed to start simulation:", error);
      alert("An error occurred. Could not start the simulation job.");
      setIsLoading(false);
    }
  };

  const Header = () => (
    <header className="flex justify-center items-center mb-12 pb-6 border-b border-border-color">
      <div className="flex items-center gap-3 text-2xl font-bold tracking-tighter text-text-main font-display">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>VECTORIAL</span>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-background text-text-main font-sans p-8 md:p-12">
      <Header />
      <ChatModal transcript={activeTranscript} onClose={() => setActiveTranscript(null)} />
      <Routes>
        <Route 
          path="/" 
          element={
            <SelectPersonas 
              personas={personas}
              selectedPersonaIds={selectedPersonaIds}
              onPersonaSelect={(id) => handleCheckboxChange(id, selectedPersonaIds, setSelectedPersonaIds)}
            />
          } 
        />
        <Route 
          path="/configure" 
          element={
            <ConfigureSimulation
              therapistVersions={THERAPIST_VERSIONS}
              selectedTherapistIds={selectedTherapistIds}
              onTherapistSelect={(id) => handleCheckboxChange(id, selectedTherapistIds, setSelectedTherapistIds)}
              evaluationVersions={EVALUATION_VERSIONS}
              selectedEvaluation={selectedEvaluation}
              onEvaluationSelect={setSelectedEvaluation}
              numTurns={numTurns}
              onNumTurnsChange={setNumTurns}
              onRunSimulation={handleRunSimulation}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              selectedPersonaCount={selectedPersonaIds.size}
            />
          } 
        />
        <Route 
          path="/results" 
          element={
            <ResultsPage 
              results={results}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              onShowTranscript={setActiveTranscript}
              therapistVersions={THERAPIST_VERSIONS}
            />
          } 
        />
      </Routes>
    </div>
  );
}
export default App;