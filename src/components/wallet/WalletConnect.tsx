import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Wallet, Loader2 } from "lucide-react";

declare global {
  interface Window {
    aptos?: any; // Petra and others expose window.aptos per AIP-62
    martian?: any; // Legacy Martian API
  }
}

type WalletConnectProps = {
  onAddressChange?: (address?: string) => void;
};

const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export const WalletConnect: React.FC<WalletConnectProps> = ({ onAddressChange }) => {
  const [address, setAddress] = useState<string | undefined>();
  const [wallet, setWallet] = useState<"petra" | "martian" | undefined>();
  const [connecting, setConnecting] = useState(false);

  // Check for wallet on load
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        if (window.aptos) {
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const account = await window.aptos.account();
            setAddress(account.address);
            setWallet("petra");
            onAddressChange?.(account.address);
          }
        } else if (window.martian) {
          const isConnected = await window.martian.isConnected();
          if (isConnected) {
            const account = await window.martian.connect();
            setAddress(account.address);
            setWallet("martian");
            onAddressChange?.(account.address);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkWalletConnection();
  }, [onAddressChange]);

  useEffect(() => {
    onAddressChange?.(address);
  }, [address, onAddressChange]);

  const connect = async () => {
    setConnecting(true);
    try {
      if (window.aptos) {
        const res = await window.aptos.connect();
        setAddress(res.address);
        setWallet("petra");
        toast({ 
          title: "Wallet connected", 
          description: truncate(res.address),
          variant: "success" 
        });
        return;
      }
      if (window.martian) {
        const res = await window.martian.connect();
        setAddress(res.address);
        setWallet("martian");
        toast({ 
          title: "Wallet connected", 
          description: truncate(res.address),
          variant: "success"
        });
        return;
      }
      toast({
        title: "No Aptos wallet found",
        description: "Install Petra or Martian to continue.",
        variant: "destructive"
      });
    } catch (e: any) {
      toast({ 
        title: "Failed to connect", 
        description: e?.message ?? String(e),
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (wallet === "petra" && window.aptos) {
        await window.aptos.disconnect();
        toast({ 
          title: "Wallet disconnected", 
          description: "Your wallet has been disconnected",
          variant: "default" 
        });
      }
      if (wallet === "martian" && window.martian) {
        await window.martian.disconnect();
        toast({ 
          title: "Wallet disconnected", 
          description: "Your wallet has been disconnected",
          variant: "default" 
        });
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
    
    setAddress(undefined);
    setWallet(undefined);
    onAddressChange?.(undefined);
  };

  return (
    <div className="flex items-center gap-3">
      {address ? (
        <>
          <span className="text-sm text-muted-foreground">{truncate(address)}</span>
          <Button variant="outline" size="sm" onClick={disconnect} className="hover:bg-destructive/10">
            Disconnect
          </Button>
        </>
      ) : (
        <Button variant="hero" onClick={connect} disabled={connecting} className="hover-lift">
          {connecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;