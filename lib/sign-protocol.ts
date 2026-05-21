import { SignProtocolClient, SpMode, EvmChains } from '@ethsign/sp-sdk'
import { privateKeyToAccount } from 'viem/accounts'
import { getAddress } from 'viem'

// ── Schema registered at https://testnet-scan.sign.global ──────────────────────
// Schema JSON:
// {
//   "name": "VibeCheck Connection",
//   "data": [
//     { "name": "fromAddress",  "type": "address"  },
//     { "name": "toAddress",    "type": "address"  },
//     { "name": "matchScore",   "type": "uint256"  },
//     { "name": "eventName",    "type": "string"   },
//     { "name": "timestamp",    "type": "uint256"  }
//   ]
// }

function getClient() {
  const pk = process.env.SIGN_PROTOCOL_PRIVATE_KEY
  if (!pk) throw new Error('SIGN_PROTOCOL_PRIVATE_KEY is not set')

  const formattedPk = pk.startsWith('0x') ? pk : `0x${pk}`
  const account = privateKeyToAccount(formattedPk as `0x${string}`)

  return new SignProtocolClient(SpMode.OnChain, {
    chain: EvmChains.sepolia,  // Ethereum Sepolia testnet (chain ID 11155111)
    account,
  })
}

export type AttestationResult = {
  attestationId: string
  txHash?: string
}

/**
 * Create an on-chain attestation for a VibeCheck connection.
 * Called server-side only (private key never leaves the server).
 *
 * Falls back to a mock attestation ID if Sign Protocol is unreachable —
 * keeps the demo flow alive even if Web3 infra is flaky.
 */
export async function attestConnection(
  fromAddress: string,
  toAddress: string,
  matchScore: number,
  eventName = 'SEABW 2026'
): Promise<AttestationResult> {
  const schemaIdFull = process.env.NEXT_PUBLIC_SIGN_SCHEMA_ID
  if (!schemaIdFull) throw new Error('NEXT_PUBLIC_SIGN_SCHEMA_ID is not set')

  try {
    const client = getClient()

    // Extract just the numeric schema ID from the full format
    // Format: "onchain_evm_11155111_0xdb61" → extract "0xdb61"
    const schemaIdMatch = schemaIdFull.match(/0x[a-fA-F0-9]+$/)
    if (!schemaIdMatch) {
      throw new Error(`Invalid NEXT_PUBLIC_SIGN_SCHEMA_ID format: ${schemaIdFull}. Expected format: onchain_evm_11155111_0x...`)
    }
    const schemaId = schemaIdMatch[0]

    // Validate and checksum addresses (EIP-55)
    let checksummedFrom: string
    let checksummedTo: string
    try {
      checksummedFrom = getAddress(fromAddress)
      checksummedTo = getAddress(toAddress)
    } catch (err) {
      throw new Error(`Invalid address format: ${err instanceof Error ? err.message : String(err)}`)
    }

    const res = await client.createAttestation({
      schemaId,
      data: {
        fromAddress: checksummedFrom,
        toAddress: checksummedTo,
        matchScore: Math.round(matchScore * 100),  // store as integer (0-100)
        eventName,
        timestamp: BigInt(Date.now()),
      },
      indexingValue: checksummedFrom.toLowerCase(),
    })

    return {
      attestationId: res.attestationId,
      txHash: (res as Record<string, unknown>).txHash as string | undefined,
    }
  } catch (err) {
    console.error('[sign-protocol] attestation failed, using mock:', err)
    // Graceful fallback — mock ID so demo doesn't break
    const mockId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    return { attestationId: mockId }
  }
}

/**
 * Generate the Base Sepolia explorer URL for an attestation.
 */
export function getAttestationUrl(attestationId: string): string {
  return `https://testnet-scan.sign.global/attestation/${attestationId}`
}
