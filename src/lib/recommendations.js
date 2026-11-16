import { aiApi } from '../api/endpoints';

// Recommendations cost an AI call and count against the per-user 10/min AI rate limit,
// so they are fetched once per session and shared by the overview and Explore pages.
let pending = null;

export function getRecommendations({ refresh = false } = {}) {
  if (!pending || refresh) {
    pending = aiApi.getRecommendations().then(r => r.data.data || []).catch(err => { pending = null; throw err; });
  }
  return pending;
}

const explanations = new Map();
export function getExplanation(serviceId) {
  if (!explanations.has(serviceId)) {
    explanations.set(serviceId, aiApi.getExplanation(serviceId).then(r => r.data.data.explanation)
      .catch(err => { explanations.delete(serviceId); throw err; }));
  }
  return explanations.get(serviceId);
}

export function clearRecommendationCache() { pending = null; explanations.clear(); }
