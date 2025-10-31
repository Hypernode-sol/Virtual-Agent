import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Wraps the entire app with Solana wallet context.
// Uses the provided Helius RPC endpoint.
const WalletContextProvider = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;

  // Using the Helius API key provided by the user.
  const endpoint = useMemo(() => {
    const heliusApiKey = '867f4f5e-0d97-4d2e-b7c9-957f9db77e27';
    return `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new BackpackWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;