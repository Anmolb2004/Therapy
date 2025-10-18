// frontend/src/pages/ResultsPage.jsx
import { Link } from 'react-router-dom';
import ResultsDisplay from '../components/ResultsDisplay';
import { FaChartBar, FaPlus, FaTrophy, FaCheckCircle, FaDownload } from 'react-icons/fa';

function ResultsPage(props) {
  const { results, isLoading } = props;
  
  // Calculate stats
  const totalSimulations = results.length;
  const uniqueModels = new Set(results.map(r => r.therapist_version)).size;
  const avgScore = results.length > 0 
    ? (results.reduce((sum, r) => {
        const scores = r.evaluation;
        if ('safety_score' in scores) return sum + scores.safety_score;
        return sum + (scores.empathy_score + scores.helpfulness_score + scores.engagement_score) / 3;
      }, 0) / results.length).toFixed(1)
    : 0;

  return (
    <main className="max-w-7xl mx-auto w-full animate-fadeIn">
      {/* Progress Indicator */}
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
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-primary shadow-lg">
              ✓
            </div>
            <span className="text-text-main font-semibold">Configure</span>
          </div>
          <div className="w-16 h-1 bg-primary"></div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-primary shadow-lg shadow-primary/30">
              3
            </div>
            <span className="text-text-main font-semibold">View Results</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-semibold mb-6">
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <FaCheckCircle />
              Simulation Complete
            </>
          )}
        </div>
        
        <h1 className="text-5xl font-bold font-display text-text-main mb-4">
          {isLoading ? 'Running Your Simulations' : 'Simulation Results'}
          <span className="block text-transparent bg-gradient-to-r from-orange-400 via-primary to-orange-600 bg-clip-text mt-2">
            {isLoading ? 'Please Wait...' : 'Performance Analysis'}
          </span>
        </h1>
        
        <p className="text-xl text-text-light mt-4 max-w-3xl mx-auto leading-relaxed">
          {isLoading 
            ? 'AI models are conducting therapy sessions with your selected personas. This may take a few minutes.'
            : 'Review detailed performance metrics, compare AI therapist models, and explore conversation transcripts.'}
        </p>
      </div>

      {/* Stats Cards - Only show when not loading and have results */}
      {!isLoading && results.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-xl p-6 border border-border-color">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FaChartBar className="text-primary text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{totalSimulations}</div>
                <div className="text-text-light text-sm">Total Simulations</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-xl p-6 border border-border-color">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FaTrophy className="text-primary text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{avgScore}/10</div>
                <div className="text-text-light text-sm">Average Score</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-xl p-6 border border-border-color">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-primary text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{uniqueModels}</div>
                <div className="text-text-light text-sm">Models Tested</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Results Card */}
      <div className="bg-surface rounded-2xl shadow-2xl border border-border-color overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-orange-600/10 p-8 border-b border-border-color">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3 font-display mb-2">
                <FaChartBar className="text-primary" /> Evaluation Results
              </h2>
              <p className="text-text-light">
                {isLoading 
                  ? 'Your results will appear here once processing is complete'
                  : 'Detailed performance metrics for each AI therapist and patient combination'}
              </p>
            </div>
            {!isLoading && results.length > 0 && (
              <button 
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface/50 border border-border-color rounded-lg text-text-light hover:text-text-main hover:border-primary/50 transition-all"
                onClick={() => alert('Export functionality coming soon!')}
              >
                <FaDownload /> Export
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-24 px-8">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-text-main mb-3">Processing Simulations</h3>
            <p className="text-lg text-text-light mb-6">
              AI models are analyzing patient scenarios and generating responses...
            </p>
            <div className="max-w-md mx-auto bg-surface/50 rounded-xl p-4 border border-border-color">
              <div className="flex items-center gap-3 text-sm text-text-light">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span>This typically takes 1-3 minutes depending on configuration</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ResultsDisplay {...props} />
            <div className="p-8 bg-gradient-to-r from-surface/50 to-secondary/30 border-t border-border-color">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-text-light text-sm mb-1">Want to test more scenarios?</p>
                  <p className="text-text-main font-semibold">Start a new simulation with different parameters</p>
                </div>
                <Link 
                  to="/" 
                  className="group inline-flex items-center gap-3 px-10 py-4 text-lg font-display font-bold text-white bg-gradient-to-r from-primary to-orange-600 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95"
                >
                  <FaPlus className="transition-transform group-hover:rotate-90" /> 
                  New Simulation
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Tips Section - Only show when results are loaded */}
      {!isLoading && results.length > 0 && (
        <div className="mt-10 bg-gradient-to-br from-surface/80 to-secondary/60 backdrop-blur-sm rounded-2xl p-8 border border-border-color">
          <h3 className="text-2xl font-bold mb-4">📊 Understanding Your Results</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-text-main mb-2">Evaluation Metrics</h4>
              <ul className="space-y-2 text-text-light text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Empathy:</strong> How well the AI understands and validates emotions</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Helpfulness:</strong> Quality of guidance and therapeutic interventions</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Engagement:</strong> Ability to maintain meaningful therapeutic dialogue</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-main mb-2">Next Steps</h4>
              <ul className="space-y-2 text-text-light text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Click "View Transcript" to read full conversations</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Compare scores across different AI models and approaches</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Identify which model performs best for specific patient types</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ResultsPage;