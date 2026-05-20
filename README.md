# VibeCheck

## Description
VibeCheck is an intelligent Web3 networking platform designed for blockchain conferences and events. Using a high-performance TF-IDF vector pre-filtering and deep LLM refinement pipeline, it analyzes attendee roles and mandates to pair people with high-value professional synergies. It also enables attendees to securely verify and log their newly formed relationships on-chain using Sign Protocol.

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   CEREBRAS_API_KEY=your_cerebras_api_key
   SIGN_PROTOCOL_PRIVATE_KEY=your_private_key
   ```

## How to Use

1. **Start the local development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the web app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Find matches:**
   Complete the quick onboarding form with your professional role and networking mandate. You will immediately access your personal dashboard to explore your top AI-curated matches, interact with the live networking graph, and securely attest connections on-chain.
