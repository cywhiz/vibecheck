/**
 * VibeCheck — Demo Seed Script
 * Run: npx tsx scripts/seed.ts
 *
 * Pre-populates 80 realistic SEABW attendee profiles with embeddings.
 * Run this the night BEFORE the hackathon so the graph is full on day 1.
 *
 * IMPORTANT: Set .env.local keys before running.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// ── 80 Demo Profiles ──────────────────────────────────────────────────────────
const DEMO_PROFILES = [
  // ── VCs & Fund Managers ───────────────────────────────────────────────────
  { name: "Priya Sharma",       role: "VC Partner @ Hashed",                     mandate: "Sourcing Series A DeFi infrastructure plays in Southeast Asia with institutional traction and proven PMF",           tags: ["DeFi", "VC", "Infrastructure", "Southeast Asia"] },
  { name: "Marcus Chen",        role: "Managing Director @ Spartan Capital",      mandate: "Deploying $50M into RWA tokenization projects with strong regulatory moats and B2B enterprise distribution",          tags: ["RWA", "Institutional", "VC"] },
  { name: "Aisha Rahman",       role: "Investment Manager @ HashKey Capital",     mandate: "Looking for L2 infrastructure teams building on Base or Optimism with >$10M TVL traction",                            tags: ["L2", "Base", "Infrastructure", "VC"] },
  { name: "Tom Nakamura",       role: "GP @ Ryze Labs",                           mandate: "Seed-stage investor seeking gaming and social DeFi projects with Southeast Asia distribution advantages",              tags: ["Gaming", "DeFi", "Consumer", "Southeast Asia"] },
  { name: "Siriporn Wattana",   role: "Head of Digital Assets @ Kasikorn Bank",  mandate: "Evaluating crypto custody and tokenized deposit infrastructure for Thai retail banking integration",                    tags: ["Institutional", "Thailand", "Payments", "RWA"] },
  { name: "David Lim",          role: "CIO @ DeFiance Capital",                   mandate: "Allocating into DeFi protocols with real revenue and institutional-grade compliance tooling for SEA markets",           tags: ["DeFi", "Institutional", "Compliance"] },
  { name: "Nina Petrov",        role: "Partner @ Blockchain Capital",             mandate: "Finding web3 infrastructure projects with enterprise sales pipelines and Fortune 500 pilots in APAC",                   tags: ["Infrastructure", "Institutional", "VC"] },
  { name: "Raj Mehta",          role: "Fund Manager @ Multicoin Capital",         mandate: "High-conviction bets on Solana ecosystem apps with consumer adoption flywheels and sub-$5M valuation entry points",    tags: ["Solana", "Consumer", "DeFi"] },
  { name: "Yuki Tanaka",        role: "Principal @ SoftBank Vision Fund",         mandate: "Late-stage growth equity in blockchain infrastructure companies with >$100M ARR trajectory and clear regulatory path",  tags: ["VC", "Infrastructure", "Institutional"] },
  { name: "Fatima Al-Hassan",   role: "Director @ Abu Dhabi Investment Authority",mandate: "Exploring Shariah-compliant tokenized real estate and sukuk structures for Gulf sovereign wealth deployment",          tags: ["RWA", "Institutional", "Compliance"] },

  // ── Founders & Builders ───────────────────────────────────────────────────
  { name: "James Woo",          role: "Co-founder @ zkSync ecosystem project",    mandate: "Seeking $5M seed from an institutional VC to scale RWA tokenization platform targeting Thai property market",         tags: ["RWA", "Institutional", "Base", "Thailand"] },
  { name: "Mei Lin",            role: "Founder @ ComplianceDAO",                  mandate: "Building crypto ETF compliance tooling for Southeast Asian asset managers — need distribution partners and pilots",      tags: ["Regulatory", "Compliance", "ETF"] },
  { name: "Arjun Patel",        role: "Lead Dev @ Solana Foundation",              mandate: "Finding frontend developers and UX designers for consumer DeFi wallet with $2M Superteam grant approved",              tags: ["Solana", "Consumer", "Infrastructure"] },
  { name: "Elena Volkov",       role: "CEO @ StableX Protocol",                   mandate: "Seeking institutional liquidity partners and market makers for Thai Baht-backed stablecoin launching in Q3",            tags: ["Stablecoin", "Institutional", "Thailand", "Payments"] },
  { name: "Kevin Okonkwo",      role: "Founder @ RemitFi",                        mandate: "Closing seed round for blockchain remittance infrastructure for SEA migrant workers — processing $2M MoM in pilots",    tags: ["Payments", "Southeast Asia", "Infrastructure"] },
  { name: "Ana Santos",         role: "CTO @ LendX Finance",                      mandate: "Looking for institutional lending partners and credit facilities to bootstrap on-chain credit markets in Philippines",   tags: ["DeFi", "Institutional", "Southeast Asia"] },
  { name: "Ben Zhang",          role: "Co-founder @ ChainVault",                  mandate: "Seeking crypto custody infrastructure provider partnerships for launching institutional-grade self-custody solution",     tags: ["Institutional", "Infrastructure", "Compliance"] },
  { name: "Lena Hoffman",       role: "Founder @ NFT Provenance Protocol",        mandate: "Finding luxury brand partnerships (Hermès, LVMH) for on-chain asset authentication and anti-counterfeiting in SEA",     tags: ["NFT", "RWA", "Infrastructure"] },
  { name: "Paulo Reyes",        role: "Founder @ AgriChain",                      mandate: "Tokenizing Philippine agricultural supply chain receivables — seeking $3M seed and offtake partners in institutional finance", tags: ["RWA", "Southeast Asia", "Institutional"] },
  { name: "Sophie Laurent",     role: "Co-founder @ Nexus Bridge",                mandate: "Building cross-chain liquidity infrastructure between EVM chains and Cosmos ecosystem — seeking node operator partners",  tags: ["Infrastructure", "DeFi", "L2"] },

  // ── Corporate & Institutional ─────────────────────────────────────────────
  { name: "Sarah Kim",          role: "CTO @ Ascend Bit / CP Group",              mandate: "Building blockchain payment infrastructure for True Money's 50M Thai users — seeking DeFi protocol integration partners", tags: ["Payments", "Thailand", "Infrastructure", "Consumer"] },
  { name: "Michael Torres",     role: "VP Blockchain @ SCB Tech",                 mandate: "Piloting tokenized Thai government bonds for Siam Commercial Bank retail customers — seeking technical infrastructure",   tags: ["RWA", "Thailand", "Institutional", "Regulatory"] },
  { name: "Linda Chang",        role: "Digital Assets Lead @ Standard Chartered",  mandate: "Launching institutional crypto prime brokerage for SEA family offices — seeking compliant on/off ramp infrastructure",   tags: ["Institutional", "Compliance", "Southeast Asia"] },
  { name: "Patrick O'Brien",    role: "Head of Tokenization @ Deutsche Bank",     mandate: "Tokenizing German municipal bonds for APAC distribution via MAS-regulated venues — seeking Thai regulatory guidance",     tags: ["RWA", "Regulatory", "Institutional"] },
  { name: "Nathalie Dubois",    role: "Director @ BNP Paribas Digital Assets",    mandate: "Structuring ESG-linked tokenized bonds for Southeast Asian sovereign wealth funds — need local distribution channels",    tags: ["RWA", "Institutional", "Southeast Asia"] },

  // ── Regulators & Policy ───────────────────────────────────────────────────
  { name: "Khun Somchai",       role: "Deputy Governor @ Bank of Thailand",       mandate: "Exploring CBDC retail pilot frameworks and interoperability with regional CBDC initiatives (mBridge, Project Dunbar)",    tags: ["Regulatory", "Thailand", "Payments", "Institutional"] },
  { name: "Dr. Wiriya Pong",    role: "Policy Director @ Thai SEC",               mandate: "Designing token offering regulatory sandbox for Thai startups — seeking compliant projects as sandbox candidates",          tags: ["Regulatory", "Thailand", "Compliance"] },
  { name: "Amanda Chen",        role: "FinTech Policy @ MAS Singapore",           mandate: "Developing Project Guardian institutional DeFi framework — seeking pilot partners for tokenized fund infrastructure",       tags: ["Regulatory", "Institutional", "DeFi", "Compliance"] },
  { name: "Boonlert Srisuk",    role: "Director @ Thailand NECTEC",               mandate: "Evaluating blockchain for national digital identity and cross-border verification with ASEAN member states",               tags: ["Regulatory", "Thailand", "Infrastructure"] },
  { name: "Maria Santos",       role: "BSP Senior Officer @ Bangko Sentral",      mandate: "Designing Philippines crypto asset service provider licensing framework — seeking input from compliant operators",          tags: ["Regulatory", "Southeast Asia", "Compliance"] },

  // ── Developers & Technical ────────────────────────────────────────────────
  { name: "Alex Kim",           role: "Smart Contract Auditor @ Trail of Bits",   mandate: "Offering security audits for DeFi protocols in exchange for co-marketing and ecosystem integration partnerships",          tags: ["Infrastructure", "DeFi", "Compliance"] },
  { name: "Rodrigo Lima",       role: "ZK Engineer @ =nil; Foundation",           mandate: "Finding DeFi protocols needing ZK proof integration for private transaction infrastructure on L2s",                       tags: ["Privacy", "Infrastructure", "L2"] },
  { name: "Chris Park",         role: "Senior Engineer @ Optimism",               mandate: "Onboarding SEA DeFi projects to OP Stack — offering $2M in ecosystem grants for high-quality builders",                    tags: ["L2", "Infrastructure", "DeFi"] },
  { name: "Natasha Ivanova",    role: "Protocol Engineer @ Chainlink",            mandate: "Integrating Chainlink CCIP and price feeds into Thai and Vietnamese DeFi projects — seeking pilot partnerships",           tags: ["Infrastructure", "DeFi", "Southeast Asia"] },
  { name: "Joon Park",          role: "Lead Dev @ Klaytn Foundation",             mandate: "Funding Korean-SEA crossover dApp developers building consumer apps on Klaytn with LINE distribution",                    tags: ["Consumer", "Southeast Asia", "Infrastructure"] },
  { name: "Yusuf Ibrahim",      role: "Fullstack Dev @ Base ecosystem",           mandate: "Building Social DeFi applications leveraging Farcaster and Base — seeking designer and growth co-founder",                 tags: ["Base", "Consumer", "DeFi"] },
  { name: "Mei Sasaki",         role: "Protocol Dev @ Uniswap Labs",              mandate: "Expanding Uniswap v4 hooks ecosystem — seeking creative hook developers building novel AMM strategies",                    tags: ["DeFi", "Infrastructure"] },
  { name: "Diego Herrera",      role: "Lead Dev @ Polygon zkEVM",                 mandate: "Onboarding SEA gaming projects to Polygon — offering gas grants and joint GTM support for teams above 10k DAU",           tags: ["Gaming", "L2", "Infrastructure"] },
  { name: "Emma Wilson",        role: "DevRel @ Alchemy",                         mandate: "Finding developers building on Base or Ethereum to feature in Alchemy's developer showcase and growth programs",            tags: ["Infrastructure", "Base"] },
  { name: "Carlos Mendez",      role: "Backend Engineer @ Coinbase",              mandate: "Seeking DeFi protocols to integrate with Coinbase Wallet SDK and Smart Wallet for SEA user onboarding",                    tags: ["Consumer", "Infrastructure", "Base"] },

  // ── DeFi & Protocols ──────────────────────────────────────────────────────
  { name: "Liu Yang",           role: "Head of BD @ Aave",                        mandate: "Expanding Aave v3 to new EVM chains in SEA — seeking local DeFi protocols for liquidity bootstrapping partnerships",       tags: ["DeFi", "Institutional", "Southeast Asia"] },
  { name: "Tomas Havel",        role: "Ecosystem Lead @ Pendle Finance",          mandate: "Onboarding RWA yield products onto Pendle — seeking tokenized T-bill and bond projects for PT/YT structuring",            tags: ["DeFi", "RWA", "Institutional"] },
  { name: "Sophie Nakamura",    role: "Head of Growth @ Ondo Finance",            mandate: "Expanding USDY and OUSG institutional-grade yield products into Southeast Asian family offices and crypto native funds",     tags: ["RWA", "Institutional", "DeFi"] },
  { name: "Kai Fredericks",     role: "Product @ dYdX",                           mandate: "Finding SEA market makers and liquidity providers for dYdX perpetuals — offering trading fee rebates and grants",          tags: ["DeFi", "Institutional"] },
  { name: "Zara Ahmed",         role: "BD Lead @ LayerZero",                      mandate: "Seeking cross-chain bridge and messaging protocol users in SEA for OFT (Omnichain Fungible Token) standard adoption",      tags: ["Infrastructure", "DeFi"] },

  // ── Web3 Gaming ───────────────────────────────────────────────────────────
  { name: "Hiro Suzuki",        role: "CEO @ PixelForge Studios",                 mandate: "Raising $8M Series A for AAA mobile RPG on Ronin — have 500K pre-registrations, need strategic gaming fund partner",       tags: ["Gaming", "Consumer", "VC"] },
  { name: "Camille Pham",       role: "Game Director @ Thetan Arena",             mandate: "Scaling Thetan Arena to 5M MAU — seeking marketing partners and on-chain tournament infrastructure for SEA",               tags: ["Gaming", "Southeast Asia", "Consumer"] },
  { name: "Lee Sang-jun",       role: "Founder @ MetaQuest Gaming",               mandate: "Building blockchain esports infrastructure for mobile games in Vietnam and Thailand — need payment rails and token design",  tags: ["Gaming", "Southeast Asia", "Payments"] },
  { name: "Anya Petrova",       role: "CTO @ Immutable",                          mandate: "Onboarding 10 new gaming studios to Immutable zkEVM — offering $1M grant pool and co-marketing for qualified teams",        tags: ["Gaming", "L2", "Infrastructure"] },
  { name: "Ray Tanaka",         role: "Head of Partnerships @ Sky Mavis",         mandate: "Seeking DeFi protocol integrations for Ronin ecosystem to expand beyond gaming into broader crypto finance",                tags: ["Gaming", "DeFi", "Infrastructure"] },

  // ── AI x Crypto ───────────────────────────────────────────────────────────
  { name: "Dr. Alice Chen",     role: "CEO @ Nillion Network",                    mandate: "Partnering with AI companies building privacy-preserving inference on decentralized infrastructure for APAC enterprises",    tags: ["AI x Crypto", "Privacy", "Infrastructure"] },
  { name: "Mark Russo",         role: "Co-founder @ Bittensor ecosystem",         mandate: "Finding compute providers and AI model developers to contribute to decentralized ML training subnet in SEA",                 tags: ["AI x Crypto", "Infrastructure"] },
  { name: "Jenna Liu",          role: "Head of AI @ Fetch.ai",                    mandate: "Deploying autonomous agent frameworks for DeFi automation and institutional portfolio rebalancing in SEA family offices",    tags: ["AI x Crypto", "DeFi", "Institutional"] },
  { name: "Sam Torres",         role: "Founder @ AgentKit Labs",                  mandate: "Building AI-powered crypto onboarding agents for non-technical users — seeking CEX and wallet distribution partnerships",    tags: ["AI x Crypto", "Consumer", "Infrastructure"] },
  { name: "Vivian Zhang",       role: "Research Lead @ Ritual",                   mandate: "Finding DeFi protocols to integrate coprocessor-based verifiable AI inference for on-chain ML applications",                tags: ["AI x Crypto", "DeFi", "Infrastructure"] },

  // ── Consumer & NFT ────────────────────────────────────────────────────────
  { name: "Jack Morrison",      role: "Founder @ SocialGraph Protocol",           mandate: "Building decentralized professional networking on-chain — seeking enterprise pilot partners for on-chain identity graph",   tags: ["Consumer", "Infrastructure", "Privacy"] },
  { name: "Iris Chan",          role: "Product @ OpenSea",                        mandate: "Expanding OpenSea Pro to Thai and Vietnamese creator economies — seeking local artist communities and NFT projects",         tags: ["NFT", "Consumer", "Southeast Asia"] },
  { name: "Marco Rossi",        role: "Creative Director @ RTFKT (Nike)",         mandate: "Developing phygital sneaker drop strategy for SEA market — seeking blockchain retail partners in Bangkok and Ho Chi Minh",   tags: ["NFT", "Consumer", "Southeast Asia"] },
  { name: "Kim Soo-jin",        role: "Founder @ FanFi",                          mandate: "Tokenizing K-Pop and Thai pop artist fan economies — seeking music label partnerships and payment infrastructure in SEA",     tags: ["NFT", "Consumer", "Payments", "Southeast Asia"] },

  // ── Infrastructure & Node Operators ──────────────────────────────────────
  { name: "Greg Anderson",      role: "Head of BD @ Lido Finance",                mandate: "Expanding Lido liquid staking to Ethereum validators in Southeast Asia and Thailand — seeking institutional stakers",         tags: ["DeFi", "Infrastructure", "Institutional"] },
  { name: "Pita Supachai",      role: "CEO @ ThaiNode",                           mandate: "Operating institutional-grade blockchain infrastructure in Thailand — seeking anchor clients for validator services",          tags: ["Infrastructure", "Thailand", "Institutional"] },
  { name: "Ravi Kumar",         role: "Head of Sales @ Blockdaemon",              mandate: "Selling enterprise node infrastructure to Thai banks and exchanges — seeking digital asset team introductions at Thai lenders", tags: ["Infrastructure", "Institutional", "Thailand"] },
  { name: "Julia Berg",         role: "CEO @ Everstake",                          mandate: "Growing institutional staking business in Southeast Asia — seeking pension funds and endowments entering digital assets",     tags: ["Infrastructure", "Institutional", "Southeast Asia"] },

  // ── Media, Legal & Advisory ───────────────────────────────────────────────
  { name: "Peter Walsh",        role: "Crypto Partner @ Allen & Overy",           mandate: "Advising on Thai and Singapore token offering structuring — seeking DeFi and RWA projects needing legal groundwork",         tags: ["Regulatory", "Compliance", "RWA"] },
  { name: "Anna Kowalski",      role: "Crypto Journalist @ The Block",            mandate: "Covering institutional DeFi adoption and RWA tokenization in Southeast Asia — looking for exclusive stories and founders",    tags: ["Institutional", "RWA", "Southeast Asia"] },
  { name: "Jason Webb",         role: "Managing Partner @ Veris Advisors",        mandate: "Providing tokenomics design and regulatory strategy for projects raising $5M+ in Southeast Asia and Middle East",            tags: ["Regulatory", "VC", "Compliance"] },
  { name: "Chanya Suwan",       role: "CEO @ BlockThai Media",                    mandate: "Building Thai-language crypto media brand — seeking Web3 projects wanting Thai community growth and education content",        tags: ["Consumer", "Thailand", "Southeast Asia"] },
  { name: "Roberto Fonseca",    role: "Legal Counsel @ Latham & Watkins",         mandate: "Structuring MiCA-compliant token offerings for projects seeking EU distribution alongside Southeast Asian launch",            tags: ["Regulatory", "Compliance", "Institutional"] },

  // ── Stablecoins & Payments ────────────────────────────────────────────────
  { name: "Diana Popescu",      role: "BD Lead @ Circle (USDC)",                   mandate: "Expanding USDC adoption in Thailand and Philippines through bank partnerships, merchant payments, and DeFi integrations",    tags: ["Stablecoin", "Payments", "Southeast Asia", "Institutional"] },
  { name: "Haruto Yamamoto",    role: "Head of Asia @ Paxos",                      mandate: "Onboarding Thai and Vietnamese banks to PyUSD and Paxos stablecoin infrastructure for cross-border settlement",              tags: ["Stablecoin", "Institutional", "Thailand", "Payments"] },
  { name: "Laleh Ahmadi",       role: "Co-founder @ Velo Protocol",                mandate: "Scaling Velo cross-border payment rails for SEA migrant workers — seeking remittance company and exchange partnerships",      tags: ["Payments", "Southeast Asia", "Stablecoin"] },
  { name: "Ben Ho",             role: "CEO @ NOVA Finance",                        mandate: "Building institutional FX hedging tools using on-chain derivatives for Thai corporates with USD/THB exposure",               tags: ["Institutional", "DeFi", "Thailand", "Payments"] },

  // ── Misc (round out the 80) ───────────────────────────────────────────────
  { name: "Oscar Lindqvist",    role: "Founder @ MeshDAO",                        mandate: "Building decentralized HR and contributor reputation system for DAOs — seeking DAO tooling funds and community pilots",       tags: ["Infrastructure", "DeFi", "Consumer"] },
  { name: "Nadia Fontaine",     role: "Head of DeFi @ Ledger",                    mandate: "Integrating SEA DeFi protocols natively into Ledger Live — seeking protocols with >$100M TVL and security-first architecture", tags: ["DeFi", "Infrastructure", "Institutional"] },
  { name: "Tran Minh Duc",      role: "CEO @ VNBlock",                            mandate: "Building Vietnam's first licensed crypto exchange — seeking market makers, custody partners, and compliance tooling",          tags: ["Southeast Asia", "Institutional", "Compliance"] },
  { name: "Isabella Greco",     role: "Impact Investor @ Mercy Corps Ventures",   mandate: "Deploying DeFi for impact — seeking financial inclusion projects for unbanked populations in SEA with measurable outcomes",   tags: ["DeFi", "Payments", "Southeast Asia", "Consumer"] },
]

// ── Seed runner ───────────────────────────────────────────────────────────────
async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  console.log(`\n🌱 Seeding ${DEMO_PROFILES.length} profiles to ${baseUrl}\n`)

  let success = 0
  let failed  = 0

  for (let i = 0; i < DEMO_PROFILES.length; i++) {
    const profile = DEMO_PROFILES[i]
    process.stdout.write(`[${String(i + 1).padStart(2, '0')}/${DEMO_PROFILES.length}] ${profile.name.padEnd(30)} `)

    try {
      const res = await fetch(`${baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     profile.name,
          role:     profile.role,
          mandate:  profile.mandate,
          tags:     profile.tags,
          telegram: '',
        }),
      })

      if (res.ok) {
        console.log('✅')
        success++
      } else {
        const err = await res.json()
        console.log(`❌ ${err.error ?? res.status}`)
        failed++
      }
    } catch (err) {
      console.log(`❌ network error: ${err}`)
      failed++
    }

    // Rate limiting — OpenAI has 500 RPM on free tier, this keeps us well under
    await new Promise(r => setTimeout(r, 250))
  }

  console.log(`\n✅ Done! ${success} seeded, ${failed} failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
