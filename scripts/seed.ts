/**
 * VibeCheck — Seed Script (50 highly aligned mockup profiles)
 * Run: npx tsx scripts/seed.ts
 *
 * Clears ALL existing profiles, then seeds 50 realistic, highly-interconnected
 * Web3 attendees designed to produce rich, beautiful matchmaking clusters.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── 50 Interconnected Mockup Profiles ─────────────────────────────────────────
const DEMO_PROFILES = [
  // ==========================================
  // CLUSTER 1: DEPIN & AI (VCs ↔ Founders)
  // ==========================================
  {
    name: 'Sarah Chen',
    role: 'Investment Partner at Decent VC',
    mandate: 'Looking to connect with early-stage founders building in the DePIN (Decentralized Physical Infrastructure) and decentralized AI space. We write checks from $250k to $1.5M.'
  },
  {
    name: 'Alex Mercer',
    role: 'Founder of NodeNet',
    mandate: 'Building a decentralized GPU rendering network. Looking for venture capitalists interested in DePIN infrastructure and hardware suppliers who can onboard GPU nodes.'
  },
  {
    name: 'Leo Vance',
    role: 'Co-founder @ DeepCompute',
    mandate: 'Developing on-chain ML training clusters for LLMs. Seeking seed-stage VCs investing in decentralized AI and DePIN projects.'
  },
  {
    name: 'Sarah Kim',
    role: 'Managing Partner @ Edge Capital',
    mandate: 'Sourcing early-stage physical infrastructure (DePIN) and GPU marketplaces. Allocating $500k to $2M check sizes for seed rounds.'
  },
  {
    name: 'Natasha Ivanova',
    role: 'Founder @ AI-Mesh',
    mandate: 'Building decentralized API layers for open-source AI models. Seeking institutional VCs and angel investors for our $1M pre-seed round.'
  },

  // ==========================================
  // CLUSTER 2: TECH & HIRING (Devs ↔ Recruiters ↔ CTOs)
  // ==========================================
  {
    name: 'David Kim',
    role: 'Senior Solidity Developer',
    mandate: 'Expert in EVM optimization and DeFi protocol architecture. Searching for Web3 startup founders or recruiters who are actively hiring lead Solidity engineers.'
  },
  {
    name: 'Mei Lin',
    role: 'Freelance Smart Contract Engineer',
    mandate: 'Writing secure smart contracts in Vyper and Solidity. Looking for freelance audits or part-time roles building and testing secure EVM DeFi protocols.'
  },
  {
    name: 'Chloe Sparks',
    role: 'Web3 Recruiter at TechTalent',
    mandate: 'Matching top Solidity, Rust, and Go engineering talent with fast-growing Web3 projects and VC portfolio companies. Active hiring mandates for lead developers.'
  },
  {
    name: 'Julian Hayes',
    role: 'Rust & Substrate Engineer',
    mandate: 'Specializing in blockchain runtime and Solana smart contracts. Looking for a full-time lead developer role at an L2 infrastructure startup.'
  },
  {
    name: 'Niko Radic',
    role: 'Backend Systems Engineer',
    mandate: 'Expert in rust-based transaction indexers and RPC pipelines. Seeking Web3 teams or recruiters looking to hire full-time platform infrastructure engineers.'
  },
  {
    name: 'Elena Petrov',
    role: 'HR Lead at Nexus Labs',
    mandate: 'Scaling our engineering team at Nexus. Actively recruiting fullstack Web3 engineers, Solana developers, and smart contract engineers.'
  },
  {
    name: 'Arjun Patel',
    role: 'Lead Developer @ WalletX',
    mandate: 'Building complex self-custodial wallet infrastructure. Seeking senior Solidity developers and Rust indexer specialists to join our core team.'
  },

  // ==========================================
  // CLUSTER 3: INFRA & DEPLOYMENT (Founders ↔ L2 Growth & Grants)
  // ==========================================
  {
    name: 'Raj Patel',
    role: 'Founder & Game Director @ QuestVerse',
    mandate: 'Building an on-chain mobile RPG gaming platform. Looking to deploy on L2 networks and seeking gas grants, ecosystem grants, and GTM support.'
  },
  {
    name: 'Zoe Fisher',
    role: 'Ecosystem Lead at Polygon zkEVM',
    mandate: 'Onboarding Web3 gaming and consumer projects to Polygon zkEVM. Offering strategic developer grants, joint marketing, and engineering launch support.'
  },
  {
    name: 'Marcus Vance',
    role: 'Head of Growth at Horizon L2',
    mandate: 'Looking for dApp builders (DeFi, gaming, social) who want to deploy on Horizon L2. We offer marketing support, gas rebates, and integration grants for new partners.'
  },
  {
    name: 'Sophia Martinez',
    role: 'Developer Advocate @ Base Guild',
    mandate: 'Onboarding builders into the Base ecosystem. Looking to offer ecosystem grants, organize developer workshops, and support teams building on Base L2.'
  },
  {
    name: 'Aisha Rahman',
    role: 'DeFi founder @ SwapVibe',
    mandate: 'Building a gamified AMM protocol. Looking for high-throughput L2 chains to deploy our smart contracts, seeking ecosystem grants and developer launch support.'
  },
  {
    name: 'Lee Sang-jun',
    role: 'CTO @ PixelQuest',
    mandate: 'Developing AAA blockchain battle arena game. Seeking L2 scalability platforms offering gas-subsidized networks and builder grants.'
  },

  // ==========================================
  // CLUSTER 4: AUDITS & DEFI (Startups ↔ Smart Contract Auditors)
  // ==========================================
  {
    name: 'Sophie Laurent',
    role: 'Co-founder, decentralized lending protocol',
    mandate: 'Building on-chain credit markets and lending protocol on EVM. Preparing to launch Q3 — seeking smart contract auditors to safeguard our contracts.'
  },
  {
    name: 'Elena Rostova',
    role: 'Lead Auditor @ SafeGuard Sec',
    mandate: 'Offering comprehensive smart contract security audits and penetration testing for DeFi and lending protocols preparing for mainnet launches.'
  },
  {
    name: 'Alex Kim',
    role: 'Security Analyst @ Trail of Bits',
    mandate: 'Conducting full smart contract audits, codebase reviews, and formal verification for DeFi, token bridges, and Web3 infrastructure platforms.'
  },
  {
    name: 'Kevin Okonkwo',
    role: 'Founder @ RemitFi',
    mandate: 'Building blockchain-based cross-border remittance contracts. Seeking trusted security firms to run comprehensive audits before our public mainnet launch.'
  },

  // ==========================================
  // CLUSTER 5: GAME DESIGN & ART (Game Builders ↔ 3D NFT Artists)
  // ==========================================
  {
    name: 'Hiro Suzuki',
    role: 'Founder @ PixelForge Studios',
    mandate: 'Building open-world RPG game on Ronin. Searching for 3D digital artists, NFT collection designers, and generative character creators to design skin assets.'
  },
  {
    name: 'Aria Thorne',
    role: 'Digital 3D Artist & NFT Creator',
    mandate: 'Specialized in generative collections and 3D character design. Looking to collaborate with Web3 GameFi projects to design unique in-game NFT items and skins.'
  },
  {
    name: 'Camille Pham',
    role: 'Lead Animator @ RetroGameDAO',
    mandate: 'Creating rich 3D character animations and pixel-art items. Seeking GameFi studios, metaverses, or NFT founders looking for high-quality game assets.'
  },
  {
    name: 'Yusuf Ibrahim',
    role: 'Founder @ CyberRunners',
    mandate: 'Building sci-fi cyberpunk racing game on Base. Need experienced 3D character creators, vehicle asset designers, and generative digital artists.'
  },

  // ==========================================
  // CLUSTER 6: PRE-TGE & TOKENOMICS (Pre-TGE startups ↔ Tokenomics Architects)
  // ==========================================
  {
    name: 'Elena Volkov',
    role: 'CEO, stablecoin startup',
    mandate: 'Building regional collateralized stablecoins for APAC. Pre-TGE stage — seeking tokenomics architects to design long-term emission schedules and fee-distribution models.'
  },
  {
    name: 'Liam O\'Connor',
    role: 'Tokenomics Architect',
    mandate: 'Designing sustainable token economic models, emissions schedules, and utility schedules for pre-TGE startups. Specialized in mathematical whitepaper modeling.'
  },
  {
    name: 'Sam Torres',
    role: 'Founder @ AgentKit Labs',
    mandate: 'Building an on-chain AI agent network. Preparing for our public token launch — seeking expert token economic designers to optimize staking/inflation models.'
  },
  {
    name: 'Vivian Zhang',
    role: 'Ecosystem Advisor @ TokenForge',
    mandate: 'Providing token design, mathematical treasury simulations, and long-term emission architecture for high-growth pre-TGE blockchain protocols.'
  },

  // ==========================================
  // CLUSTER 7: LIQUIDITY & DEFI (Startups ↔ Market Makers)
  // ==========================================
  {
    name: 'David Lim',
    role: 'Founder @ SwapFlow DEX',
    mandate: 'Developing dynamic TVL yield optimizer and DEX on Base. Seeking market makers, digital asset brokerages, and institutional liquidity providers to bootstrap our pools.'
  },
  {
    name: 'Leo Rossi',
    role: 'Digital Assets Market Maker',
    mandate: 'Providing institutional liquidity and algorithmic market-making services for newly launched DEXs, stablecoins, and DeFi lending protocols.'
  },
  {
    name: 'Priya Sharma',
    role: 'COO @ Peak Liquidity',
    mandate: 'Deploying algorithmic liquidity, treasury hedging services, and high-volume market making support for DeFi startups and launchpads.'
  },
  {
    name: 'Diana Popescu',
    role: 'Founder @ YieldGlow',
    mandate: 'Building cross-chain yield aggregator. Seeking deep liquidity providers, market makers, and institutional stakers to help bootstrap on-chain assets.'
  },

  // ==========================================
  // CLUSTER 8: RWA & COMPLIANCE (RWA founders ↔ Legal & Compliance Partners)
  // ==========================================
  {
    name: 'Samir Desai',
    role: 'Founder @ LandToken RWA',
    mandate: 'Tokenizing high-yield commercial real estate assets. Seeking legal experts in asset tokenization and compliant offshore entities to navigate SEC regulatory frameworks.'
  },
  {
    name: 'Elias Thorne',
    role: 'Web3 Regulatory Attorney',
    mandate: 'Specialized in digital asset regulations, RWA structuring, compliance sandboxes, and helping founders register compliant offshore token entities.'
  },
  {
    name: 'Paulo Reyes',
    role: 'Founder, agricultural RWA startup',
    mandate: 'Tokenizing Philippine agricultural supply chain receivables. Sourcing legal advisors, token lawyers, and compliant legal wrappers for physical asset pools.'
  },
  {
    name: 'Peter Walsh',
    role: 'Crypto Partner @ LegalChain Group',
    mandate: 'Structuring asset-backed token offerings, digital security registration, and helping Web3 projects comply with MAS and SEC regulatory regimes.'
  },

  // ==========================================
  // CLUSTER 9: INFRASTRUCTURE & VALIDATORS (Node Ops ↔ Protocols)
  // ==========================================
  {
    name: 'Pita Supachai',
    role: 'CEO @ ThaiNode',
    mandate: 'Operating institutional-grade validator networks. Sourcing high-traction L1 and L2 protocols looking for localized, high-uptime RPC nodes and validation partners.'
  },
  {
    name: 'Julia Berg',
    role: 'Ecosystem Lead @ Everstake',
    mandate: 'Looking to support new L1/L2 networks. Offering decentralized validator set bootstrapping, node infrastructure, and strategic delegation programs.'
  },
  {
    name: 'Greg Anderson',
    role: 'Infrastructure Director @ Cosmos Hub',
    mandate: 'Expanding our validator network and secure RPC nodes. Seeking enterprise node operator groups and institutional validator operators to support core consensus.'
  },

  // ==========================================
  // CLUSTER 10: MEDIA, MARKETING & GROWTH (Apps ↔ Influencers/PR)
  // ==========================================
  {
    name: 'Chanya Suwan',
    role: 'CEO @ BlockThai Media',
    mandate: 'Building Thai-language crypto news and PR platform. Seeking early-stage startups and consumer dApps that want local APAC user acquisition and community coverage.'
  },
  {
    name: 'Nora Blake',
    role: 'Growth Marketer @ MetaBrand',
    mandate: 'Running massive Web3 influencer campaigns and Twitter Spaces. Looking for consumer-facing Web3 apps and NFT collections that need user acquisition.'
  },
  {
    name: 'Amelia Ward',
    role: 'Web3 Content Creator & Youtuber',
    mandate: 'Running a crypto education channel with 500k subscribers. Looking for innovative Web3 protocols to review, interview founders, and write sponsored GTM articles.'
  },
  {
    name: 'Laleh Ahmadi',
    role: 'Founder @ FanFi Social',
    mandate: 'Social app tokenizing creator economies. Seeking Web3 media outlets, YouTube creators, and digital marketers to design our global GTM growth push.'
  },

  // ==========================================
  // CLUSTER 11: GENERAL & ANGEL INVESTORS
  // ==========================================
  {
    name: 'Tom Harris',
    role: 'Angel Investor',
    mandate: 'I invest my own capital into pre-seed Web3 gaming, social dApps, and consumer tools. Looking for passionate teams with a working prototype.'
  },
  {
    name: 'Patrick O\'Brien',
    role: 'GP @ Wave Capital',
    mandate: 'Early-stage angel and venture investor seeking high-growth DeFi protocols, consumer crypto networks, and innovative Web3 primitives.'
  },
  {
    name: 'Amanda Chen',
    role: 'Co-founder @ Spark Labs',
    mandate: 'Pre-seed incubator looking for Web3 startups. Offering advisory, initial physical co-working desks, and small angel checks ($100k-$200k).'
  },
  {
    name: 'Arthur Pendelton',
    role: 'Hardware Wallet Manufacturer',
    mandate: 'We build secure NFC-enabled hardware wallets. Looking to connect with Web3 event organizers and NFT collections for custom co-branded cold-storage devices.'
  },
  {
    name: 'Maya Singh',
    role: 'Lead Coordinator @ Web3Summit',
    mandate: 'Organizing the largest Web3 summit in Southeast Asia. Looking to connect with corporate hardware sponsors, media houses, and keynote speakers.'
  }
]

// ── Seed runner ───────────────────────────────────────────────────────────────
async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Step 1: Wipe all existing data
  console.log('\n🗑️  Clearing all existing attendees and connections...')
  const { error: connErr } = await supabase.from('connections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (connErr) console.warn('  ⚠️  connections clear:', connErr.message)

  const { error: attErr } = await supabase.from('attendees').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (attErr) { console.error('  ❌ Failed to clear attendees:', attErr.message); process.exit(1) }

  console.log(`  ✅ Cleared. Seeding ${DEMO_PROFILES.length} new profiles to ${baseUrl}\n`)

  // Step 2: Seed profiles
  let success = 0
  let failed  = 0

  for (let i = 0; i < DEMO_PROFILES.length; i++) {
    const profile = DEMO_PROFILES[i]
    process.stdout.write(`[${String(i + 1).padStart(2, '0')}/${DEMO_PROFILES.length}] ${profile.name.padEnd(28)} `)

    try {
      const res = await fetch(`${baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, role: profile.role, mandate: profile.mandate, telegram: '' }),
      })

      if (res.ok) {
        console.log('✅')
        success++
      } else {
        const err = await res.json().catch(() => ({}))
        console.log(`❌ ${err.error ?? res.status}`)
        failed++
      }
    } catch (err) {
      console.log(`❌ network error: ${err}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n✅ Done! ${success} seeded, ${failed} failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
