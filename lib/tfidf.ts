const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
  'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
  'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
  'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we',
  'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while',
  'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
  'your', 'yours', 'yourself', 'yourselves', 'looking', 'to', 'meet', 'with', 'for', 'building', 'seeking', 'want',
  'interested', 'in', 'involvement', 'connect', 'with', 'early', 'stage', 'focused', 'on'
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word))
}

interface Document {
  id: string
  name: string
  role: string | null
  mandate: string
}

export function rankCandidates(
  target: { role: string | null; mandate: string },
  candidates: Document[],
  limit = 30
): Document[] {
  const targetText = `${target.role ?? ''} ${target.mandate}`
  const targetTokens = tokenize(targetText)
  
  if (targetTokens.length === 0 || candidates.length === 0) {
    return candidates.slice(0, limit)
  }

  const N = candidates.length
  const docTokensList = candidates.map(c => tokenize(`${c.role ?? ''} ${c.mandate}`))

  // Calculate Document Frequency (DF) for each token in the target query
  const dfMap: Record<string, number> = {}
  for (const token of targetTokens) {
    let df = 0
    for (const docTokens of docTokensList) {
      if (docTokens.includes(token)) {
        df++
      }
    }
    dfMap[token] = df
  }

  // Calculate TF-IDF similarity for each candidate
  const scores = candidates.map((candidate, idx) => {
    const docTokens = docTokensList[idx]
    
    // Count Term Frequencies
    const docTf: Record<string, number> = {}
    for (const token of docTokens) {
      docTf[token] = (docTf[token] || 0) + 1
    }

    let score = 0
    for (const token of targetTokens) {
      const df = dfMap[token] || 0
      if (df > 0) {
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5))
        const tf = docTf[token] || 0
        score += tf * idf
      }
    }

    return { candidate, score }
  })

  // Sort descending by score, and fallback to random/original order if score is 0
  scores.sort((a, b) => b.score - a.score)

  // Return the ranked candidates list
  return scores.slice(0, limit).map(item => item.candidate)
}
