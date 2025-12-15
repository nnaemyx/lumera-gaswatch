import { SigningStargateClient, StargateClient, GasPrice } from "@cosmjs/stargate";
import { OfflineSigner } from "@cosmjs/proto-signing";
import { LUMERA_CONFIG, GAS_PRICE } from "./lumera-config";
import { QueryClient, setupStakingExtension } from "@cosmjs/stargate";

export const createQueryClient = async (timeout = 15000) => {
  try {
    // First, test if the RPC endpoint is reachable via HTTP
    try {
      const testResponse = await fetch(`${LUMERA_CONFIG.rpc.replace('https://', 'https://').replace('http://', 'http://')}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout for test
      });
      
      if (!testResponse.ok) {
        console.warn(`RPC endpoint returned status ${testResponse.status}`);
      }
    } catch (testError: unknown) {
      console.warn("RPC endpoint test failed:", testError);
      // Continue anyway, as the test might fail due to CORS but the actual connection might work
    }

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), timeout);
    });

    // Race between connection and timeout
    const connectionPromise = StargateClient.connect(LUMERA_CONFIG.rpc);
    
    return await Promise.race([connectionPromise, timeoutPromise]) as Awaited<ReturnType<typeof StargateClient.connect>>;
  } catch (error: unknown) {
    console.error("Failed to connect to RPC:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });
    
    // Check if it's a timeout error
    if (error instanceof Error && (error.message?.includes("timeout") || error.message?.includes("Timeout") || error.name === "AbortError")) {
      throw new Error("Connection timeout: The Lumera Testnet RPC endpoint took too long to respond. The network may be experiencing issues or the endpoint may be down. Please try again later.");
    }
    
    // Check for network/fetch errors (most common in browsers)
    if (error instanceof Error && (error.message?.includes("fetch") || 
        error.message?.includes("network") || 
        error.message?.includes("Failed to fetch") ||
        error.name === "TypeError" ||
        (error.message && typeof error.message === 'string' && error.message.toLowerCase().includes('network')))) {
      
      const errorMsg = `Network error: Unable to connect to Lumera Testnet RPC endpoint (${LUMERA_CONFIG.rpc}). ` +
        `This could be due to:\n` +
        `- CORS restrictions (the RPC endpoint may not allow browser connections)\n` +
        `- Network connectivity issues\n` +
        `- The RPC endpoint being temporarily unavailable\n\n` +
        `Please check your internet connection and try again. If the issue persists, the RPC endpoint may need to be configured to allow CORS requests from browsers.`;
      
      throw new Error(errorMsg);
    }
    
    // Check for CORS errors
    if (error instanceof Error && (error.message?.includes("CORS") || error.message?.includes("cors") || error.message?.includes("Access-Control"))) {
      throw new Error("CORS error: The Lumera Testnet RPC endpoint does not allow browser connections due to CORS restrictions. Please contact the network administrators to enable CORS for browser-based applications.");
    }
    
    // Generic error with more context
    const errorDetails = error instanceof Error ? error.message : error instanceof Error ? error.toString() : "Unknown error";
    throw new Error(`Failed to connect to Lumera Testnet (${LUMERA_CONFIG.rpc}): ${errorDetails}`);
  }
};

export const createSigningClient = async (signer: OfflineSigner) => {
  return await SigningStargateClient.connectWithSigner(
    LUMERA_CONFIG.rpc,
    signer,
    {
      gasPrice: GasPrice.fromString(GAS_PRICE),
    }
  );
};

export const getBalance = async (address: string) => {
  try {
    // Use REST API instead of RPC to avoid CORS issues
    const response = await fetch(
      `${LUMERA_CONFIG.rest}/cosmos/bank/v1beta1/balances/${address}?pagination.limit=1000`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const balances = data.balances || [];
    
    // Find the stake currency balance
    const stakeBalance = balances.find(
      (b: { denom: string; amount: string }) => b.denom === LUMERA_CONFIG.stakeCurrency.coinMinimalDenom
    );
    
    if (stakeBalance) {
      return {
        denom: stakeBalance.denom,
        amount: stakeBalance.amount,
      };
    }
    
    // Return zero balance if not found
    return {
      denom: LUMERA_CONFIG.stakeCurrency.coinMinimalDenom,
      amount: "0",
    };
  } catch (error: unknown) {
    console.error("Error fetching balance:", error);
    // Return zero balance if there's an error (wallet might be new)
    return {
      denom: LUMERA_CONFIG.stakeCurrency.coinMinimalDenom,
      amount: "0",
    };
  }
};

export const getAllBalances = async (address: string): Promise<Array<{ denom: string; amount: string }>> => {
  try {
    // Use REST API instead of RPC to avoid CORS issues
    const response = await fetch(
      `${LUMERA_CONFIG.rest}/cosmos/bank/v1beta1/balances/${address}?pagination.limit=1000`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const balances = data.balances || [];
    
    // Convert to the expected format
    return balances.map((b: { denom: string; amount: string }) => ({
      denom: b.denom,
      amount: b.amount,
    }));
    } catch (error: unknown) {
    console.error("Error fetching all balances:", error);
    // Return empty array if there's an error
    return [];
  }
};

export const sendTokens = async (
  signer: OfflineSigner,
  fromAddress: string,
  toAddress: string,
  amount: string,
  memo = ""
) => {
  const client = await createSigningClient(signer);

  const amountInMicroDenom = Math.floor(parseFloat(amount) * 1_000_000);

  const result = await client.sendTokens(
    fromAddress,
    toAddress,
    [
      {
        denom: LUMERA_CONFIG.stakeCurrency.coinMinimalDenom,
        amount: amountInMicroDenom.toString(),
      },
    ],
    {
      amount: [
        {
          denom: LUMERA_CONFIG.stakeCurrency.coinMinimalDenom,
          amount: "5000",
        },
      ],
      gas: "200000",
    },
    memo
  );

  return result;
};

export const getValidators = async () => {
  try {
    // Method 1: Try primary REST API endpoint
    console.log("Fetching validators from Lumera REST API...");
    const response = await fetch(
      `${LUMERA_CONFIG.rest}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=100`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.validators && data.validators.length > 0) {
        console.log(`✅ Found ${data.validators.length} real validators from Lumera blockchain`);
        return data.validators;
      }
    } else {
      console.warn(`REST API returned status: ${response.status}`);
    }
    
    // Method 2: Try alternative REST endpoint format
    console.log("Trying alternative endpoint...");
    const altResponse = await fetch(
      `${LUMERA_CONFIG.rest}/staking/validators`
    );
    
    if (altResponse.ok) {
      const altData = await altResponse.json();
      if (altData.result && altData.result.length > 0) {
        console.log(`✅ Found ${altData.result.length} validators from alternative endpoint`);
        return altData.result;
      }
      if (altData.validators && altData.validators.length > 0) {
        console.log(`✅ Found ${altData.validators.length} validators`);
        return altData.validators;
      }
    }
    
    // Method 3: Try RPC endpoint
    console.log("Trying RPC endpoint...");
    const rpcResponse = await fetch(
      `${LUMERA_CONFIG.rpc}/validators`
    );
    
    if (rpcResponse.ok) {
      const rpcData = await rpcResponse.json();
      if (rpcData.result?.validators && rpcData.result.validators.length > 0) {
        console.log(`✅ Found ${rpcData.result.validators.length} validators from RPC`);
        return rpcData.result.validators;
      }
    }
    
    console.error("❌ No validators found from any endpoint");
    throw new Error("No validators found on Lumera network. The network may not have active validators yet, or the endpoints may be unavailable. Please try again later.");
    
  } catch (error: unknown) {
    console.error("❌ Error fetching validators:", error);
  if (error instanceof Error && error.message.includes("No validators found")) {
      throw error;
    }
    throw new Error("Failed to connect to Lumera network. Please check your internet connection and try again.");
  }
};

export const getDelegations = async (delegatorAddress: string) => {
  try {
    const response = await fetch(
      `${LUMERA_CONFIG.rest}/cosmos/staking/v1beta1/delegations/${delegatorAddress}`
    );
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.delegation_responses || [];
  } catch (error) {
    console.error("Error fetching delegations:", error);
    return [];
  }
};

export const delegate = async (
  signer: OfflineSigner,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string
) => {
  const client = await createSigningClient(signer);

  const amountInMicroDenom = Math.floor(parseFloat(amount) * 1_000_000);

  const result = await client.delegateTokens(
    delegatorAddress,
    validatorAddress,
    {
      denom: LUMERA_CONFIG.stakeCurrency.coinMinimalDenom,
      amount: amountInMicroDenom.toString(),
    },
    {
      amount: [
        {
          denom: LUMERA_CONFIG.stakeCurrency.coinMinimalDenom,
          amount: "5000",
        },
      ],
      gas: "250000",
    }
  );

  return result;
};

export const undelegate = async (
  signer: OfflineSigner,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string
) => {
  const client = await createSigningClient(signer);

  const amountInMicroDenom = Math.floor(parseFloat(amount) * 1_000_000);

  const result = await client.undelegateTokens(
    delegatorAddress,
    validatorAddress,
    {
      denom: LUMERA_CONFIG.stakeCurrency.coinMinimalDenom,
      amount: amountInMicroDenom.toString(),
    },
    {
      amount: [
        {
          denom: LUMERA_CONFIG.stakeCurrency.coinMinimalDenom,
          amount: "5000",
        },
      ],
      gas: "250000",
    }
  );

  return result;
};

export const formatTokenAmount = (
  amount: string | number,
  decimals = 6
): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return (numAmount / Math.pow(10, decimals)).toFixed(decimals);
};

export interface TransactionDetail {
  hash: string;
  height: string;
  type: string;
  timestamp: string;
  amount?: string;
  denom?: string;
  from?: string;
  to?: string;
  validatorAddress?: string;
  status: "success" | "pending" | "failed";
  rawLog?: string;
  memo?: string;
}

export const getTransactionHistory = async (address: string): Promise<TransactionDetail[]> => {
  try {
    // Helper function to fetch with timeout
    const fetchWithTimeout = async (url: string, timeout = 10000): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.message.includes('AbortError')) {
          throw new Error("Request timeout: Network request took too long");
        }
        throw error;
      }
    };

    // Fetch sent and received transactions in parallel
    const [sentResponse, receivedResponse] = await Promise.allSettled([
      fetchWithTimeout(
        `${LUMERA_CONFIG.rest}/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&order_by=ORDER_BY_DESC&pagination.limit=50`
      ),
      fetchWithTimeout(
        `${LUMERA_CONFIG.rest}/cosmos/tx/v1beta1/txs?events=transfer.recipient='${address}'&order_by=ORDER_BY_DESC&pagination.limit=50`
      ),
    ]);

    const transactions: TransactionDetail[] = [];
    
    // Parse sent transactions
    if (sentResponse.status === 'fulfilled' && sentResponse.value.ok) {
      try {
        const sentData = await sentResponse.value.json();
        if (sentData.txs && sentData.txs.length > 0) {
          const parsedSent = sentData.txs.map((tx: TransactionDetail) => parseTransaction(tx, address));
          transactions.push(...parsedSent);
        }
      } catch (parseError) {
        console.error("Error parsing sent transactions:", parseError);
      }
    }
    
    // Parse received transactions
    if (receivedResponse.status === 'fulfilled' && receivedResponse.value.ok) {
      try {
        const receivedData = await receivedResponse.value.json();
        if (receivedData.txs && receivedData.txs.length > 0) {
          const parsedReceived = receivedData.txs.map((tx: TransactionDetail) => parseTransaction(tx, address));
          transactions.push(...parsedReceived);
        }
      } catch (parseError) {
        console.error("Error parsing received transactions:", parseError);
      }
    }

    // Remove duplicates and sort by height (descending)
    const uniqueTransactions = Array.from(
      new Map(transactions.map(tx => [tx.hash, tx])).values()
    );
    
    return uniqueTransactions.sort((a, b) => parseInt(b.height) - parseInt(a.height));
  } catch (error: unknown) {
    console.error("Error fetching transaction history:", error);
    // Return empty array on error (wallet might be new or network issue)
    return [];
  }
};

const parseTransaction = (tx: TransactionDetail, userAddress: string): TransactionDetail => {
  const txResponse = tx.rawLog || tx;
  const msgType = tx.type;
  
  // Extract amount and addresses based on message type
  let amount: string | undefined;
  let denom: string | undefined;
  let from: string | undefined;
  let to: string | undefined;
  let validatorAddress: string | undefined;
  
  if (msgType.includes("MsgSend")) {
    from = tx.from;
    to = tx.to;
    amount = formatTokenAmount(tx.amount || "0", 6);
    denom = tx.denom;
  } else if (msgType.includes("MsgDelegate") || msgType.includes("MsgUndelegate")) {
    from = tx.from;
    validatorAddress = tx.validatorAddress;
    amount = formatTokenAmount(tx.amount || "0", 6);
    denom = tx.denom;
  } else if (msgType.includes("MsgWithdrawDelegatorReward")) {
    from = tx.from;
    validatorAddress = tx.validatorAddress;
    // Try to extract reward amount from logs
    try {
      const logs = JSON.parse(tx.rawLog || "[]");
      if (logs[0]?.events) {
        const withdrawEvent = logs[0].events.find((e: { type: string }) => e.type === "withdraw_rewards");
        if (withdrawEvent) {
          const amountAttr = withdrawEvent.attributes.find((a: { key: string }) => a.key === "amount");
          if (amountAttr && amountAttr.value) {
            const match = amountAttr.value.match(/(\d+)(\w+)/);
            if (match) {
              amount = formatTokenAmount(match[1], 6);
              denom = match[2];
            }
          }
        }
      }
    } catch (e: unknown) {
      console.error("Error parsing reward amount:", e instanceof Error ? e.message : "Unknown error");
    }
  }
  
  // Determine status
  let status: "success" | "pending" | "failed" = "success";
  if (tx.status && tx.status !== "success") {
    status = tx.status;
  }
  
  // Parse timestamp
  let timestamp = new Date().toLocaleString();
  if (tx.timestamp) {
    timestamp = new Date(tx.timestamp).toLocaleString();
  }
  
  return {
    hash: tx.hash || "unknown",
    height: tx.height?.toString() || "0",
    type: tx.type,
    timestamp,
    amount,
    denom,
    from,
    to,
    validatorAddress,
    status,
    rawLog: tx.rawLog,
    memo: tx.memo,
  };
};

export interface BlockInfo {
  height: string;
  hash: string;
  time: string;
  numTxs: number;
  proposer?: string;
  transactions?: TransactionDetail[];
}

export const getLatestBlocks = async (limit: number = 20): Promise<BlockInfo[]> => {
  try {
    // Use REST API instead of RPC to avoid CORS issues
    // First get the latest block to know the current height
    const latestResponse = await fetch(`${LUMERA_CONFIG.rest}/cosmos/base/tendermint/v1beta1/blocks/latest`);
    if (!latestResponse.ok) {
      throw new Error(`Failed to fetch latest block: ${latestResponse.statusText}`);
    }
    
    const latestData = await latestResponse.json();
    const latestHeight = parseInt(latestData.block.header.height || "0");
    
    if (latestHeight === 0) {
      return [];
    }
    
    const blocks: BlockInfo[] = [];
    const startHeight = Math.max(1, latestHeight - limit + 1);
    
    // Fetch blocks in parallel (with some batching to avoid overwhelming the API)
    const fetchPromises: Promise<void>[] = [];
    const batchSize = 5;
    
    for (let height = latestHeight; height >= startHeight && height > 0; height -= batchSize) {
      const batch: number[] = [];
      for (let i = 0; i < batchSize && (height - i) >= startHeight; i++) {
        batch.push(height - i);
      }
      
      const batchPromise = Promise.all(
        batch.map(async (h: number) => {
          try {
            const response = await fetch(`${LUMERA_CONFIG.rest}/cosmos/base/tendermint/v1beta1/blocks/${h}`);
            if (response.ok) {
              const data = await response.json();
              const block = data.block;
              const txs = block.data?.txs || [];
              
              blocks.push({
                height: block.header.height || h.toString(),
                hash: block.header.last_commit_hash || block.header.hash || "",
                time: block.header.time || new Date().toISOString(),
                numTxs: txs.length,
                proposer: block.header.proposer_address,
                transactions: txs.map((tx: string, idx: number) => {
                  try {
                    // Try to decode base64 transaction hash
                    const txBytes = Buffer.from(tx, 'base64');
                    const txHash = txBytes.toString('hex').slice(0, 64);
                    return {
                      hash: txHash,
                      height: block.header.height || h.toString(),
                      type: "Unknown",
                      timestamp: block.header.time || new Date().toISOString(),
                      status: "success" as const,
                    };
                  } catch {
                    return {
                      hash: `tx-${h}-${idx}`,
                      height: block.header.height || h.toString(),
                      type: "Unknown",
                      timestamp: block.header.time || new Date().toISOString(),
                      status: "success" as const,
                    };
                  }
                }),
              });
            }
          } catch (err) {
            console.error(`Error fetching block ${h}:`, err);
          }
        })
      );
      
      fetchPromises.push(batchPromise as unknown as Promise<void>);
    }
    
    await Promise.all(fetchPromises);
    
    // Sort by height descending
    blocks.sort((a, b) => parseInt(b.height) - parseInt(a.height));
    
    return blocks;
  } catch (error: unknown) {
    console.error("Error fetching latest blocks:", error);
    return [];
  }
};

export const getBlockByHeight = async (height: number): Promise<BlockInfo | null> => {
  try {
    // Use REST API instead of RPC to avoid CORS issues
    const response = await fetch(`${LUMERA_CONFIG.rest}/cosmos/base/tendermint/v1beta1/blocks/${height}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const block = data.block;
    const txs = block?.txs || [];
    
    return {
      height: block.header.height || height.toString(),
      hash: block.header.last_commit_hash || block.header.hash || "",
      time: block.header.time || new Date().toISOString(),
      numTxs: txs.length,
      proposer: block.header.proposer_address,
      transactions: txs.map((tx: string, idx: number) => {
        try {
          // Try to decode base64 transaction hash
          const txBytes = Buffer.from(tx, 'base64');
          const txHash = txBytes.toString('hex').slice(0, 64);
          return {
            hash: txHash,
            height: block.header.height || height.toString(),
            type: "Unknown",
            timestamp: block.header.time || new Date().toISOString(),
            status: "success" as const,
          };
        } catch {
          return {
            hash: `tx-${height}-${idx}`,
            height: block.header.height || height.toString(),
            type: "Unknown",
            timestamp: block.header.time || new Date().toISOString(),
            status: "success" as const,
          };
        }
      }),
    };
  } catch (error: unknown) {
    console.error(`Error fetching block ${height}:`, error);
    return null;
  }
};

export const getLatestBlockHeight = async (): Promise<number> => {
  try {
    // Use REST API instead of RPC to avoid CORS issues
    const response = await fetch(`${LUMERA_CONFIG.rest}/cosmos/base/tendermint/v1beta1/blocks/latest`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return parseInt(data.block.header.height || "0");
  } catch (error: unknown) {
    console.error("Error fetching latest block height:", error);
    return 0;
  }
};

export interface TransactionDetails {
  hash: string;
  height: string;
  code: number;
  codespace?: string;
  gasUsed: string;
  gasWanted: string;
  timestamp: string;
  rawLog: string;
    logs: { events: { type: string; attributes: { key: string; value: string }[] }[] }[];
  events: { type: string; attributes: { key: string; value: string }[] }[];
  messages: { messages: { from_address: string; to_address: string; amount: { amount: string; denom: string }[] }[] }[];
  memo?: string;
  fee?: {
    amount: string;
    denom: string;
  };
}

export const getTransactionByHash = async (txHash: string): Promise<TransactionDetails | null> => {
  try {
    const response = await fetch(`${LUMERA_CONFIG.rest}/cosmos/tx/v1beta1/txs/${txHash}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Transaction not found");
      }
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }

    const data = await response.json();
    const txResponse = data.rawLog;
    
    if (!txResponse) {
      throw new Error("Invalid transaction response");
    }

    // Parse logs
    let logs: { events: { type: string; attributes: { key: string; value: string }[] }[] }[] = [];
    try {
      logs = JSON.parse(txResponse.raw_log || "[]");
    } catch {
      logs = [];
    }

    // Extract events from logs
    const events: { type: string; attributes: { key: string; value: string }[] }[] = [];
    if (Array.isArray(logs)) {
      logs.forEach((log: { events: { type: string; attributes: { key: string; value: string }[] }[] }) => {
        if (log.events && Array.isArray(log.events)) {
          events.push(...log.events);
        }
      });
    }

    // Parse messages
    const messages = txResponse.tx?.body?.messages || data.tx?.body?.messages || [];

    // Parse fee
    let fee: { amount: string; denom: string } | undefined;
    if (txResponse.tx?.auth_info?.fee?.amount?.[0]) {
      const feeAmount = txResponse.tx.auth_info.fee.amount[0];
      fee = {
        amount: formatTokenAmount(feeAmount.amount, 6),
        denom: feeAmount.denom,
      };
    }

    return {
      hash: txResponse.txhash || txHash,
      height: txResponse.height?.toString() || "0",
      code: txResponse.code || 0,
      codespace: txResponse.codespace,
      gasUsed: txResponse.gas_used?.toString() || "0",
      gasWanted: txResponse.gas_wanted?.toString() || "0",
      timestamp: txResponse.timestamp || new Date().toISOString(),
      rawLog: txResponse.raw_log || "",
      logs,
      events,
      messages,
      memo: txResponse.tx?.body?.memo || data.tx?.body?.memo,
      fee,
    };
    } catch (error: unknown) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

export interface NetworkStats {
  latestHeight: number;
  blockTime: number; // Average block time in seconds
  tps: number; // Transactions per second
  avgGasUsed: number;
  avgGasWanted: number;
  totalValidators: number;
  activeValidators: number;
  totalTransactions: number;
  networkStatus: "healthy" | "degraded" | "down";
}

export const getNetworkStats = async (): Promise<NetworkStats> => {
  try {
    // Use REST API instead of RPC to avoid CORS issues
    // Get latest block height
    const latestHeight = await getLatestBlockHeight();
    
    if (latestHeight === 0) {
      throw new Error("Unable to fetch latest block height");
    }
    
    // Get recent blocks to calculate stats
    const blockCount = 10;
    const startHeight = Math.max(1, latestHeight - blockCount + 1);
    
    const blockPromises: Promise<BlockInfo | null>[] = [];
    for (let height = latestHeight; height >= startHeight && height > 0; height--) {
      blockPromises.push(
        fetch(`${LUMERA_CONFIG.rest}/cosmos/base/tendermint/v1beta1/blocks/${height}`)
          .then(res => res.ok ? res.json() as Promise<BlockInfo> : null)
          .then(data => data ? data : null)
          .catch(() => null)
      );
    }
    
    const blockResults = await Promise.all(blockPromises);
    const blocks = blockResults.filter(b => b !== null);
    
    // Calculate block time (average time between blocks)
    let blockTime = 0;
    if (blocks.length > 1) {
      const times = blocks
        .map(b => b?.time ? new Date(b.time).getTime() : 0)
        .filter(t => t > 0)
        .sort((a, b) => b - a); // Sort descending
      
      if (times.length > 1) {
        const intervals: number[] = [];
        for (let i = 1; i < times.length; i++) {
          intervals.push((times[i - 1] - times[i]) / 1000); // Convert to seconds
        }
        blockTime = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      }
    }
    
    // Calculate TPS (transactions per second)
    const totalTxs = blocks.reduce((sum, block) => {
      const txs = block?.transactions || [];
      return sum + txs.length;
    }, 0);
    const timeSpan = blocks.length > 1 && blockTime > 0 ? blockTime * blocks.length : 1;
    const tps = timeSpan > 0 ? totalTxs / timeSpan : 0;
    
    // Get recent transactions to calculate gas averages
    let totalGasUsed = 0;
    let totalGasWanted = 0;
    let txCount = 0;
    
    // Sample transactions from recent blocks
    for (const block of blocks.slice(0, 5)) {
      const txs = block?.transactions || [];
      for (const tx of txs.slice(0, 5)) {
        try {
          // Try to get transaction hash from base64
          const txBytes = Buffer.from(tx.hash, 'base64');
          const txHash = txBytes.toString('hex').slice(0, 64);
          
          const response = await fetch(`${LUMERA_CONFIG.rest}/cosmos/tx/v1beta1/txs/${txHash}`);
          if (response.ok) {
            const data = await response.json();
            const txResponse = data.rawLog;
            if (txResponse) {
              totalGasUsed += parseInt(txResponse.gasUsed || "0");
              totalGasWanted += parseInt(txResponse.gasWanted || "0");
              txCount++;
            }
          }
        } catch (err) {
          // Skip if can't fetch
        }
      }
    }
    
    const avgGasUsed = txCount > 0 ? totalGasUsed / txCount : 0;
    const avgGasWanted = txCount > 0 ? totalGasWanted / txCount : 0;
    
    // Get validator stats
    let totalValidators = 0;
    let activeValidators = 0;
    try {
      const validators = await getValidators();
      totalValidators = validators.length;
      activeValidators = validators.filter((v: { status: string; }) => 
        v.status === "BOND_STATUS_BONDED" || v.status === "2"
      ).length;
    } catch (err: unknown) {
      console.error("Error fetching validators:", err);
    }
    
    // Determine network status
    let networkStatus: "healthy" | "degraded" | "down" = "healthy";
    if (blockTime > 10 || tps === 0) {
      networkStatus = "degraded";
    }
    if (blocks.length === 0 || latestHeight === 0) {
      networkStatus = "down";
    }
    
    return {
      latestHeight,
      blockTime: Math.round(blockTime * 100) / 100,
      tps: Math.round(tps * 100) / 100,
      avgGasUsed: Math.round(avgGasUsed),
      avgGasWanted: Math.round(avgGasWanted),
      totalValidators,
      activeValidators,
      totalTransactions: totalTxs,
      networkStatus,
    };
  } catch (error: unknown) {
    console.error("Error fetching network stats:", error);
    throw error;
  }
};

export interface GasPriceData {
  timestamp: string;
  gasPrice: number; // in ulume per gas unit
  gasUsed: number;
  gasWanted: number;
}

export interface GasFeeStats {
  current: {
    low: number;
    average: number;
    high: number;
  };
  history24h: GasPriceData[];
  min24h: number;
  max24h: number;
  avg24h: number;
}

export const getGasFeeStats = async (): Promise<GasFeeStats> => {
  try {
    // Get recent transactions to calculate gas prices
    const history24h: GasPriceData[] = [];
    
    // Try to get historical data from localStorage first (browser only)
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem("gas_fee_history_24h");
      if (storedHistory) {
        try {
          const parsed = JSON.parse(storedHistory);
          // Filter to last 24 hours
          const now = Date.now();
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          const filtered = parsed.filter((item: GasPriceData) => {
            const itemTime = new Date(item.timestamp).getTime();
            return itemTime >= oneDayAgo;
          });
          history24h.push(...filtered);
        } catch (e: unknown) {
          console.error("Error parsing stored gas history:", e);
        }
      }
    }
    
    // Get latest block to fetch recent transactions
    const latestHeight = await getLatestBlockHeight();
    if (latestHeight > 0) {
      // Get recent blocks (last 20 blocks)
      const blockCount = Math.min(20, latestHeight);
      const startHeight = Math.max(1, latestHeight - blockCount + 1);
      
      const gasPrices: number[] = [];
      
      // Fetch blocks in batches
      for (let height = latestHeight; height >= startHeight && height > 0; height -= 5) {
        const batch: number[] = [];
        for (let i = 0; i < 5 && (height - i) >= startHeight; i++) {
          batch.push(height - i);
        }
        
        await Promise.all(
          batch.map(async (h) => {
            try {
              const response = await fetch(`${LUMERA_CONFIG.rest}/cosmos/base/tendermint/v1beta1/blocks/${h}`);
              if (response.ok) {
                const data = await response.json();
                const block = data.block;
                const txs = block.data?.txs || [];
                
                // Sample transactions from this block
                for (const tx of txs.slice(0, 3)) {
                  try {
                    const txBytes = Buffer.from(tx, 'base64');
                    const txHash = txBytes.toString('hex').slice(0, 64);
                    
                    const txResponse = await fetch(`${LUMERA_CONFIG.rest}/cosmos/tx/v1beta1/txs/${txHash}`);
                    if (txResponse.ok) {
                      const txData = await txResponse.json();
                      const txResp = txData.tx_response;
                      
                      if (txResp && txResp.gas_used && txResp.gas_wanted) {
                        const gasUsed = parseInt(txResp.gas_used || "0");
                        const gasWanted = parseInt(txResp.gas_wanted || "0");
                        
                        // Calculate gas price from fee
                        if (txData.tx?.auth_info?.fee?.amount?.[0]) {
                          const feeAmount = txData.tx.auth_info.fee.amount[0];
                          const feeValue = parseFloat(feeAmount.amount || "0");
                          const gasPrice = gasUsed > 0 ? feeValue / gasUsed : 0;
                          
                          if (gasPrice > 0) {
                            gasPrices.push(gasPrice);
                            
                            // Add to history
                            history24h.push({
                              timestamp: txResp.timestamp || block.header.time || new Date().toISOString(),
                              gasPrice,
                              gasUsed,
                              gasWanted,
                            });
                          }
                        }
                      }
                    }
                  } catch (err) {
                    // Skip if can't fetch
                  }
                }
              }
            } catch (err) {
              // Skip if can't fetch
            }
          })
        );
      }
      
      // Sort history by timestamp
      history24h.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Store updated history (browser only)
      if (typeof window !== 'undefined' && history24h.length > 0) {
        localStorage.setItem("gas_fee_history_24h", JSON.stringify(history24h));
      }
    }
    
    // Calculate current gas prices (low, average, high)
    const recentPrices = history24h.slice(-50).map(h => h.gasPrice).filter(p => p > 0);
    let low = 0;
    let average = 0;
    let high = 0;
    
    if (recentPrices.length > 0) {
      const sorted = [...recentPrices].sort((a, b) => a - b);
      low = sorted[0];
      high = sorted[sorted.length - 1];
      average = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    } else {
      // Fallback to config values
      low = 0.01;
      average = 0.025;
      high = 0.04;
    }
    
    // Calculate 24h stats
    const prices24h = history24h.map(h => h.gasPrice).filter(p => p > 0);
    const min24h = prices24h.length > 0 ? Math.min(...prices24h) : low;
    const max24h = prices24h.length > 0 ? Math.max(...prices24h) : high;
    const avg24h = prices24h.length > 0 ? prices24h.reduce((a, b) => a + b, 0) / prices24h.length : average;
    
    return {
      current: {
        low: Math.round(low * 1000000) / 1000000,
        average: Math.round(average * 1000000) / 1000000,
        high: Math.round(high * 1000000) / 1000000,
      },
      history24h: history24h.slice(-100), // Keep last 100 data points
      min24h: Math.round(min24h * 1000000) / 1000000,
      max24h: Math.round(max24h * 1000000) / 1000000,
      avg24h: Math.round(avg24h * 1000000) / 1000000,
    };
  } catch (error: unknown) {
    console.error("Error fetching gas fee stats:", error);
    // Return default values
    return {
      current: {
        low: 0.01,
        average: 0.025,
        high: 0.04,
      },
      history24h: [],
      min24h: 0.01,
      max24h: 0.04,
      avg24h: 0.025,
    };
  }
};

