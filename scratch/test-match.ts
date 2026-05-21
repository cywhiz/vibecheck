import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { getCerebrasMatches } from '../lib/llm'

async function test() {
  const me = {
    id: 'test-user-id',
    name: 'Priya Sharma',
    role: 'VC Partner @ Hashed',
    mandate: 'Sourcing Series A DeFi infrastructure plays in Southeast Asia with institutional traction and proven PMF'
  }

  const candidates = [
    {
      id: 'candidate-1',
      name: 'James Woo',
      role: 'Co-founder & CEO, RWA tokenization startup',
      mandate: 'Seeking $5M seed from an institutional VC to scale RWA tokenization platform targeting Thai property market'
    },
    {
      id: 'candidate-2',
      name: 'Mei Lin',
      role: 'Founder @ ComplianceDAO',
      mandate: 'Building crypto compliance tooling for Southeast Asian asset managers — need distribution partners and exchange pilots'
    }
  ]

  console.log('Testing getCerebrasMatches...')
  try {
    const results = await getCerebrasMatches(me, candidates, 2)
    console.log('Results:', JSON.stringify(results, null, 2))
  } catch (err) {
    console.error('Error during test:', err)
  }
}

test()
