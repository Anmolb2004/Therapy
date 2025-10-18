// frontend/src/components/ResultsDisplay.jsx
import { FaEye, FaTrophy, FaExclamationTriangle } from 'react-icons/fa';

function ResultsDisplay({ results, onShowTranscript, therapistVersions }) {
  if (results.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-border-color">
            <FaExclamationTriangle className="text-4xl text-text-light" />
          </div>
          <h3 className="text-2xl font-bold text-text-main mb-3">No Results Yet</h3>
          <p className="text-text-light mb-6">
            Run a simulation to see detailed performance metrics and conversation transcripts.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm">
            Click "New Simulation" below to get started
          </div>
        </div>
      </div>
    );
  }

  const isSafetyEval = results[0].evaluation && 'safety_score' in results[0].evaluation;
  const getTherapistName = (id) => therapistVersions.find(v => v.id === id)?.name || id;

  // Find best performer
  const getBestScore = (result) => {
    const scores = result.evaluation;
    if ('safety_score' in scores) return scores.safety_score;
    return (scores.empathy_score + scores.helpfulness_score + scores.engagement_score) / 3;
  };
  
  const bestResult = results.reduce((best, current) => 
    getBestScore(current) > getBestScore(best) ? current : best
  , results[0]);

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 8) return { color: 'bg-green-500/10 border-green-500/30 text-green-400', label: 'Excellent' };
    if (score >= 6) return { color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', label: 'Good' };
    return { color: 'bg-red-500/10 border-red-500/30 text-red-400', label: 'Needs Improvement' };
  };

  return (
    <div className="p-6">
      {/* Best Performer Banner */}
      <div className="mb-6 bg-gradient-to-r from-primary/10 to-orange-600/10 rounded-xl p-6 border border-primary/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <FaTrophy className="text-primary text-2xl" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-text-light font-semibold mb-1">Top Performer</div>
            <div className="text-xl font-bold text-text-main">
              {getTherapistName(bestResult.therapist_version)}
              <span className="ml-3 text-primary">
                {getBestScore(bestResult).toFixed(1)}/10
              </span>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-sm text-text-light mb-1">Persona ID</div>
            <div className="text-lg font-bold text-primary">{bestResult.persona_id}</div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto rounded-xl border border-border-color">
        <table className="w-full min-w-[1000px] text-left">
          <thead className="bg-surface/50">
            <tr>
              <th className="p-4 text-xs font-bold text-text-light uppercase tracking-wider border-b border-border-color">
                <div className="text-center">Persona</div>
              </th>
              <th className="p-4 text-xs font-bold text-text-light uppercase tracking-wider border-b border-border-color">
                AI Therapist Model
              </th>
              {isSafetyEval ? (
                <>
                  <th className="p-4 text-xs font-bold text-text-light uppercase tracking-wider border-b border-border-color text-center">
                    Safety Score
                  </th>
                  <th className="p-4 text-xs font-bold text-text-light uppercase tracking-wider border-b border-border-color">
                    Safety Flags
                  </th>
                </>
              ) : (
                <>
                  <th className="p-4 text-xs font-bold text-text-light uppercase tracking-wider border-b border-border-color text-center">
                    Empathy
                  </th>
                  <th className="p-4 text-xs font-bold text-text-light uppercase tracking-wider border-b border-border-color text-center">
                    Helpfulness
                  </th>
                  <th className="p-4 text-xs font-bold text-text-light uppercase tracking-wider border-b border-border-color text-center">
                    Engagement
                  </th>
                </>
              )}
              <th className="p-4 text-xs font-bold text-text-light uppercase tracking-wider border-b border-border-color">
                Analysis & Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {results.map((r, i) => {
              const isTopPerformer = r === bestResult;
              const avgScore = isSafetyEval 
                ? r.evaluation.safety_score 
                : (r.evaluation.empathy_score + r.evaluation.helpfulness_score + r.evaluation.engagement_score) / 3;
              const scoreBadge = getScoreBadge(avgScore);

              return (
                <tr 
                  key={i} 
                  className={`transition-all hover:bg-surface/30 ${isTopPerformer ? 'bg-primary/5' : ''}`}
                >
                  <td className="p-4 border-b border-border-color/50">
                    <div className="text-center">
                      <div className="font-bold text-2xl text-primary">{r.persona_id}</div>
                      {isTopPerformer && (
                        <div className="mt-1 inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          <FaTrophy className="text-xs" /> Best
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4 border-b border-border-color/50">
                    <div className="font-semibold text-text-main mb-1">
                      {getTherapistName(r.therapist_version)}
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${scoreBadge.color}`}>
                      {scoreBadge.label}
                    </div>
                  </td>
                  
                  {isSafetyEval ? (
                    <>
                      <td className="p-4 border-b border-border-color/50 text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(r.evaluation.safety_score)}`}>
                          {r.evaluation.safety_score}
                          <span className="text-lg text-text-light">/10</span>
                        </div>
                      </td>
                      <td className="p-4 border-b border-border-color/50">
                        {r.evaluation.flags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {r.evaluation.flags.map((flag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-md font-semibold">
                                {flag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-400 text-sm font-semibold">✓ No Issues</span>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 border-b border-border-color/50 text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(r.evaluation.empathy_score)}`}>
                          {r.evaluation.empathy_score}
                          <span className="text-lg text-text-light">/10</span>
                        </div>
                      </td>
                      <td className="p-4 border-b border-border-color/50 text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(r.evaluation.helpfulness_score)}`}>
                          {r.evaluation.helpfulness_score}
                          <span className="text-lg text-text-light">/10</span>
                        </div>
                      </td>
                      <td className="p-4 border-b border-border-color/50 text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(r.evaluation.engagement_score)}`}>
                          {r.evaluation.engagement_score}
                          <span className="text-lg text-text-light">/10</span>
                        </div>
                      </td>
                    </>
                  )}
                  
                  <td className="p-4 border-b border-border-color/50">
                    <div className="max-w-md">
                      <p className="text-sm text-text-light leading-relaxed mb-3">
                        {r.evaluation.summary}
                      </p>
                      <button 
                        onClick={() => onShowTranscript(r.transcript)} 
                        className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-surface border border-border-color text-text-main rounded-lg hover:bg-primary hover:border-primary hover:text-white transition-all hover:shadow-lg"
                      >
                        <FaEye className="transition-transform group-hover:scale-110" /> 
                        View Full Transcript
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="bg-surface/30 rounded-lg p-4 border border-border-color text-center">
          <div className="text-text-light text-xs font-semibold mb-1">Total Evaluations</div>
          <div className="text-2xl font-bold text-primary">{results.length}</div>
        </div>
        <div className="bg-surface/30 rounded-lg p-4 border border-border-color text-center">
          <div className="text-text-light text-xs font-semibold mb-1">Unique Models</div>
          <div className="text-2xl font-bold text-primary">
            {new Set(results.map(r => r.therapist_version)).size}
          </div>
        </div>
        <div className="bg-surface/30 rounded-lg p-4 border border-border-color text-center">
          <div className="text-text-light text-xs font-semibold mb-1">Unique Personas</div>
          <div className="text-2xl font-bold text-primary">
            {new Set(results.map(r => r.persona_id)).size}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;