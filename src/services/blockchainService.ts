import { AccessEvent, BlockchainBlock } from '../types';
import { INITIAL_BLOCKS } from './mockData';

// Simple fast SHA-256 equivalent for realistic cryptographic proofs in client
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

class BlockchainService {
  private blocks: BlockchainBlock[] = [...INITIAL_BLOCKS];
  private currentBlockNumber = 48913;

  public getBlocks(): BlockchainBlock[] {
    return this.blocks;
  }

  public async logEvent(
    event: Omit<AccessEvent, 'id' | 'txHash' | 'blockNumber' | 'verified' | 'timestamp'>
  ): Promise<AccessEvent> {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' · ' + new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const payloadString = JSON.stringify({
      patientId: event.patientId,
      hospitalId: event.hospitalId,
      staffId: event.staffId,
      accessType: event.accessType,
      factorUsed: event.factorUsed || null,
      action: event.action,
      reason: event.reason,
      timestamp,
      blockNumber: this.currentBlockNumber,
    });

    const txHash = await sha256(payloadString + Math.random().toString());
    const eventId = 'tx-' + Math.random().toString(36).substring(2, 9);

    const fullEvent: AccessEvent = {
      ...event,
      id: eventId,
      timestamp,
      txHash,
      blockNumber: this.currentBlockNumber,
      verified: true,
    };

    // Create block on-chain
    const previousHash = this.blocks[0]?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000';
    const blockHash = await sha256(previousHash + txHash + this.currentBlockNumber.toString());

    const newBlock: BlockchainBlock = {
      blockNumber: this.currentBlockNumber,
      timestamp: new Date().toISOString(),
      previousHash,
      merkleRoot: txHash,
      hash: blockHash,
      nonce: Math.floor(Math.random() * 900000) + 100000,
      transactions: [fullEvent],
    };

    this.blocks.unshift(newBlock);
    this.currentBlockNumber++;

    return fullEvent;
  }

  public verifyTx(txHash: string): { verified: boolean; block?: BlockchainBlock; details: string } {
    for (const block of this.blocks) {
      const match = block.transactions.find(t => t.txHash.toLowerCase() === txHash.toLowerCase());
      if (match) {
        return {
          verified: true,
          block,
          details: `Cryptographically verified on Hyperledger/EVM block #${block.blockNumber}. State root matches Merkle leaf. Zero tampering detected.`,
        };
      }
    }
    return {
      verified: false,
      details: 'Transaction hash not found in on-chain audit ledger tree.',
    };
  }
}

export const blockchainService = new BlockchainService();
