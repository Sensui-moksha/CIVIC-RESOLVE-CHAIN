// Universal IPFS upload utility that works with multiple providers
export const uploadFileToIPFS = async (apiToken: string, file: File | Blob) => {
  if (!apiToken || apiToken.trim() === '') {
    throw new Error('IPFS API token is required');
  }

  if (!file) {
    throw new Error('File is required for IPFS upload');
  }

  const formData = new FormData();
  formData.append('file', file instanceof Blob ? file : new Blob([file]));

  try {
    // Try NFT.Storage first (if token starts with "eyJ" it's likely NFT.Storage)
    if (apiToken.startsWith('eyJ')) {
      try {
        // Using the module with our custom type declarations
        const { NFTStorage } = await import('nft.storage');
        const client = new NFTStorage({ token: apiToken });
        const cid = await client.storeBlob(file instanceof Blob ? file : new Blob([file]));
        console.log('Successfully uploaded to NFT.Storage:', cid);
        return cid;
      } catch (nftError) {
        console.error('NFT.Storage upload failed:', nftError);
        // Fall through to other methods
      }
    }
    
    // Try Pinata API
    try {
      const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
        body: formData,
      });
      
      if (pinataResponse.ok) {
        const result = await pinataResponse.json();
        console.log('Successfully uploaded to Pinata:', result.IpfsHash);
        return result.IpfsHash;
      }
    } catch (pinataError) {
      console.error('Pinata upload failed:', pinataError);
      // Fall through to other methods
    }
    
    // Try Web3.Storage
    try {
      const web3Response = await fetch('https://api.web3.storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
        body: formData,
      });
      
      if (web3Response.ok) {
        const result = await web3Response.json();
        console.log('Successfully uploaded to Web3.Storage:', result.cid);
        return result.cid;
      }
    } catch (web3Error) {
      console.error('Web3.Storage upload failed:', web3Error);
    }
    
    throw new Error('Failed to upload to any IPFS service. Check your API token and try again.');
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
};

export const uploadJSONToIPFS = async (apiToken: string, data: unknown) => {
  if (!data) {
    throw new Error('Data is required for JSON upload');
  }
  
  try {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    return uploadFileToIPFS(apiToken, blob);
  } catch (error) {
    console.error('JSON to IPFS upload error:', error);
    throw error;
  }
};
