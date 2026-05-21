import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { attestConnection, getAttestationUrl } from '../lib/sign-protocol'
import { getAddress } from 'viem'

async function test() {
  console.log('🔗 Testing Chain Attestation...\n')

  // Check environment variables
  console.log('📋 Environment Variables:')
  console.log('  SIGN_PROTOCOL_PRIVATE_KEY:', process.env.SIGN_PROTOCOL_PRIVATE_KEY ? '✅ Set' : '❌ Missing')
  console.log('  NEXT_PUBLIC_SIGN_SCHEMA_ID:', process.env.NEXT_PUBLIC_SIGN_SCHEMA_ID || '❌ Missing')
  console.log()

  if (!process.env.SIGN_PROTOCOL_PRIVATE_KEY) {
    console.error('❌ SIGN_PROTOCOL_PRIVATE_KEY is not set in .env')
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_SIGN_SCHEMA_ID) {
    console.error('❌ NEXT_PUBLIC_SIGN_SCHEMA_ID is not set in .env')
    process.exit(1)
  }

  try {
    console.log('🚀 Creating attestation...')
    
    // Use valid checksummed addresses (demo wallets)
    const fromAddr = getAddress('0x0000000000000000000000000000000000000001')
    const toAddr = getAddress('0x0000000000000000000000000000000000000002')
    
    console.log('  From:', fromAddr)
    console.log('  To:', toAddr)
    console.log()
    
    const result = await attestConnection(
      fromAddr,
      toAddr,
      0.92,
      'SEABW 2026'
    )

    console.log('\n✅ Attestation created successfully!')
    console.log('  Attestation ID:', result.attestationId)
    console.log('  TX Hash:', result.txHash || 'N/A (mock or pending)')
    console.log('  URL:', getAttestationUrl(result.attestationId))
    console.log()

    // Check if it's a mock ID
    if (result.attestationId.startsWith('mock_')) {
      console.warn('⚠️  Mock attestation ID detected - Sign Protocol may have failed')
      console.warn('   This could mean:')
      console.warn('   1. Sign Protocol API is unreachable')
      console.warn('   2. Private key is invalid')
      console.warn('   3. Schema ID is incorrect')
      console.warn('   4. Network connectivity issue')
    } else {
      console.log('✅ Real attestation ID - chain call succeeded!')
    }
  } catch (err) {
    console.error('\n❌ Error creating attestation:')
    console.error(err instanceof Error ? err.message : String(err))
    if (err instanceof Error && err.stack) {
      console.error('\nStack trace:')
      console.error(err.stack)
    }
    process.exit(1)
  }
}

test()
