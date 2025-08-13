import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import MapPicker from "@/components/maps/MapPicker";
import { toast } from "@/hooks/use-toast";
import { uploadFileToIPFS, uploadJSONToIPFS } from "@/utils/ipfs";
import { callCreateProblem } from "@/utils/aptos";
import { Problem, addProblem } from "@/utils/store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, MapPin, Loader2, Check, Wallet } from "lucide-react";

const toOctas = (apt: string) => {
  const value = Number(apt);
  if (Number.isNaN(value)) return "0";
  return BigInt(Math.round(value * 1e8)).toString();
};

type ProblemFormProps = {
  currentAddress?: string;
  onCreated?: (p: Problem) => void;
};

const ProblemForm: React.FC<ProblemFormProps> = ({ currentAddress, onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bountyAPT, setBountyAPT] = useState("0.1");
  const [pos, setPos] = useState({ lat: 37.7749, lng: -122.4194 });
  const [locPicked, setLocPicked] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [nftToken, setNftToken] = useState(localStorage.getItem("defix.nft.token") || "");
  const [moduleAddress, setModuleAddress] = useState(localStorage.getItem("defix.module") || "");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedAddress, setSelectedAddress] = useState("");
  const [connectingWallet, setConnectingWallet] = useState(false);

  // Track wallet connection status
  useEffect(() => {
    if (currentAddress) {
      setConnectingWallet(false);
    }
  }, [currentAddress]);

  // Create image preview when file is selected
  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(image);
    } else {
      setImagePreview(null);
    }
  }, [image]);

  const disabled = useMemo(() => {
    const disabledReason = !currentAddress ? "No wallet connected" :
                          !title ? "Missing title" :
                          !image ? "Missing image" :
                          !locPicked ? "Location not selected" :
                          !nftToken ? "Missing NFT.Storage token" :
                          !moduleAddress ? "Missing module address" : "";
    
    // Update form errors
    if (disabledReason && !loading) {
      setFormErrors(prev => ({...prev, submission: disabledReason}));
    } else {
      setFormErrors(prev => {
        const { submission, ...rest } = prev;
        return rest;
      });
    }
    
    return !currentAddress || !title || !image || !locPicked || !nftToken || !moduleAddress;
  }, [currentAddress, title, image, locPicked, nftToken, moduleAddress, loading]);

  const handlePosChange = (p: { lat: number; lng: number }, address?: string) => {
    setPos(p);
    setLocPicked(true);
    if (address) setSelectedAddress(address);
    
    // Clear location error if it exists
    if (formErrors.location) {
      setFormErrors(prev => {
        const { location, ...rest } = prev;
        return rest;
      });
    }
  };
  
  const handleConnectWallet = async () => {
    if (!currentAddress && window.aptos) {
      setConnectingWallet(true);
      try {
        await window.aptos.connect();
        toast({ 
          title: "Connecting wallet", 
          description: "Please approve the connection request in your wallet"
        });
      } catch (error) {
        toast({ 
          title: "Connection failed", 
          description: "Could not connect to your wallet. Please try again.",
          variant: "destructive"
        });
        setConnectingWallet(false);
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = "Title is required";
    } else if (title.length < 5) {
      errors.title = "Title must be at least 5 characters";
    }
    
    if (!image) {
      errors.image = "Please upload an image of the problem";
    }
    
    if (!locPicked) {
      errors.location = "Please select a location on the map";
    }
    
    if (!nftToken) {
      errors.nftToken = "NFT.Storage API token is required";
    }
    
    if (!moduleAddress) {
      errors.moduleAddress = "Module address is required";
    }
    
    if (bountyAPT && (isNaN(Number(bountyAPT)) || Number(bountyAPT) < 0)) {
      errors.bounty = "Bounty must be a valid positive number";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Perform form validation
    if (!validateForm()) {
      toast({ 
        title: "Form Error", 
        description: "Please correct the errors in the form",
        variant: "destructive" 
      });
      return;
    }
    
    if (!currentAddress) {
      toast({ 
        title: "Wallet not connected", 
        description: "Please connect your Aptos wallet to post a problem",
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    try {
      // Persist settings
      localStorage.setItem("defix.nft.token", nftToken);
      localStorage.setItem("defix.module", moduleAddress);

      // Show toast for uploading
      const uploadingToast = toast({ 
        title: "Uploading to IPFS", 
        description: "Please wait while we upload your problem data..."
      });

      // Upload image
      const imageCid = await uploadFileToIPFS(nftToken, image);
      
      // Update toast
      toast({
        title: "Image Uploaded",
        description: "Now uploading problem metadata...",
      });

      // Upload metadata JSON (title, description, imageCid)
      const metadata = { 
        title, 
        description, 
        image: `ipfs://${imageCid}`,
        location: {
          lat: pos.lat,
          lng: pos.lng,
          address: selectedAddress
        },
        timestamp: new Date().toISOString()
      };
      const cid = await uploadJSONToIPFS(nftToken, metadata);
      
      // Update toast
      // Update toast
      toast({
        title: "IPFS Upload Complete",
        description: "Now submitting to the blockchain...",
      });

      // Convert bountyAPT to octas
      const bountyOctas = toOctas(bountyAPT);

      // Call Move contract
      let txHash: string | undefined;
      try {
        txHash = await callCreateProblem(moduleAddress, cid, pos.lat, pos.lng, bountyOctas);
        
        // Success toast with transaction hash
        toast({ 
          title: "Problem Posted Successfully", 
          description: `Transaction: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
          variant: "success",
          duration: 5000
        });
      } catch (chainErr: any) {
        toast({ 
          title: "Blockchain Transaction Failed", 
          description: chainErr?.message ?? String(chainErr),
          variant: "destructive"
        });
      }

      const problem: Problem = {
        id: txHash || `${Date.now()}`,
        title,
        description,
        cid,
        imageCid,
        lat: pos.lat,
        lng: pos.lng,
        bountyAPT,
        bountyOctas,
        owner: currentAddress,
        createdAt: Date.now(),
        moduleAddress,
        address: selectedAddress,
      };

      addProblem(problem);
      onCreated?.(problem);

      // Reset form fields
      setTitle("");
      setDescription("");
      setImage(null);
      setImagePreview(null);
      setLocPicked(false);
      setBountyAPT("0.1");
      
      // Show a final success message
      toast({
        title: "Problem Submitted",
        description: "Your problem has been successfully recorded on the blockchain",
        duration: 5000,
      });
      
    } catch (e: any) {
      console.error("Submission error:", e);
      toast({ 
        title: "Submission Failed", 
        description: e?.message ?? String(e),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-0 shadow-xl animate-fade-in hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          🚨 Report a Problem
        </CardTitle>
        <p className="text-sm text-muted-foreground">Help make your community better by reporting local issues</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!currentAddress && (
          <Alert variant="destructive" className="animate-pulse-glow mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet not connected</AlertTitle>
            <AlertDescription>
              Please connect your Aptos wallet to post a problem. 
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleConnectWallet} 
                disabled={connectingWallet}
                className="mt-2 w-full"
              >
                {connectingWallet ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {currentAddress && (!nftToken || !moduleAddress) && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Missing</AlertTitle>
            <AlertDescription>
              {!nftToken && <p>• NFT.Storage API token is required to upload images.</p>}
              {!moduleAddress && (
                <p>
                  • Module address is required to interact with the contract. 
                  <span className="block text-xs mt-1">Default address from Move.toml: 0x023c80d6011fefb3cb1991536eba513fdb9789a71a18030efd8402a2b8a7805a</span>
                </p>
              )}
              <p className="mt-2 text-xs">You can get these from the DeFix team or set up your own.</p>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium flex items-center">
                Title <span className="text-destructive ml-1">*</span>
                {locPicked && title && image && (
                  <span className="ml-auto text-xs flex items-center text-green-600 dark:text-green-400">
                    <Check className="h-3 w-3 mr-1" />
                    Ready to submit
                  </span>
                )}
              </Label>
              <Input 
                id="title" 
                required 
                value={title} 
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formErrors.title && e.target.value.length >= 5) {
                    setFormErrors(prev => {
                      const { title, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                placeholder="e.g., Pothole on Main Street" 
                className={`glass-card transition-all duration-300 focus:shadow-glow ${
                  formErrors.title ? 'border-destructive focus:border-destructive' : ''
                }`}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive mt-1">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-sm font-medium">Description</Label>
              <Textarea 
                id="desc" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe the issue, its urgency, and any relevant details..." 
                rows={4}
                className="glass-card transition-all duration-300 focus:shadow-glow resize-none"
              />
            </div>
          </div>

          {/* Bounty & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bounty Reward (APT)</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                value={bountyAPT} 
                onChange={(e) => {
                  setBountyAPT(e.target.value);
                  if (formErrors.bounty) {
                    setFormErrors(prev => {
                      const { bounty, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={`glass-card transition-all duration-300 focus:shadow-glow ${
                  formErrors.bounty ? 'border-destructive focus:border-destructive' : ''
                }`}
              />
              {formErrors.bounty && (
                <p className="text-xs text-destructive mt-1">{formErrors.bounty}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Amount of APT to offer as a reward for solving this problem
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                Evidence Photo <span className="text-destructive ml-1">*</span>
              </Label>
              <div className="relative">
                <Input 
                  type="file" 
                  required 
                  accept="image/*" 
                  onChange={(e) => {
                    setImage(e.target.files?.[0] || null);
                    if (formErrors.image) {
                      setFormErrors(prev => {
                        const { image, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={`glass-card transition-all duration-300 focus:shadow-glow ${
                    formErrors.image ? 'border-destructive focus:border-destructive' : ''
                  }`}
                />
                {imagePreview && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md overflow-hidden border border-muted">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
              {formErrors.image && (
                <p className="text-xs text-destructive mt-1">{formErrors.image}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              Location <span className="text-destructive ml-1">*</span>
              {locPicked && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Location set
                </span>
              )}
            </Label>
            <MapPicker value={pos} onChange={handlePosChange} />
            {formErrors.location && (
              <p className="text-xs text-destructive mt-1">{formErrors.location}</p>
            )}
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                NFT.Storage API Token <span className="text-destructive ml-1">*</span>
              </Label>
              <Input 
                value={nftToken} 
                onChange={(e) => {
                  setNftToken(e.target.value);
                  if (formErrors.nftToken) {
                    setFormErrors(prev => {
                      const { nftToken, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                placeholder="Your token (stored securely locally)"
                className={`glass-card transition-all duration-300 focus:shadow-glow ${
                  formErrors.nftToken ? 'border-destructive focus:border-destructive' : ''
                }`}
                type="password"
              />
              {formErrors.nftToken && (
                <p className="text-xs text-destructive mt-1">{formErrors.nftToken}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                Module Address <span className="text-destructive ml-1">*</span>
              </Label>
              <Input 
                value={moduleAddress} 
                onChange={(e) => {
                  setModuleAddress(e.target.value);
                  if (formErrors.moduleAddress) {
                    setFormErrors(prev => {
                      const { moduleAddress, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                placeholder="0x... (deployed ProblemRegistry)"
                className={`glass-card transition-all duration-300 focus:shadow-glow ${
                  formErrors.moduleAddress ? 'border-destructive focus:border-destructive' : ''
                }`}
              />
              {formErrors.moduleAddress && (
                <p className="text-xs text-destructive mt-1">{formErrors.moduleAddress}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The address of the deployed ProblemRegistry contract
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <Button 
              type={!currentAddress ? "button" : "submit"}
              onClick={!currentAddress ? handleConnectWallet : undefined} 
              disabled={currentAddress ? (disabled || loading) : connectingWallet}
              className={`shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-2.5 text-sm font-medium ${
                !currentAddress 
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                  : "bg-gradient-to-r from-brand to-brand-glow hover:from-brand-strong hover:to-brand text-white animate-glow"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : !currentAddress ? (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet to Post
                </>
              ) : (
                "🚀 Post Problem"
              )}
            </Button>
          </div>
          
          {formErrors.submission && (
            <p className="text-sm text-destructive text-center">
              <AlertCircle className="h-4 w-4 inline-block mr-1" />
              {formErrors.submission}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ProblemForm;