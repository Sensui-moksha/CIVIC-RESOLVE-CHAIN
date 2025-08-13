declare module 'nft.storage' {
  export class NFTStorage {
    constructor(options: { token: string });
    storeBlob(blob: Blob): Promise<string>;
    store(data: any): Promise<any>;
  }
}
