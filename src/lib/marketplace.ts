export const MARKETPLACE_ADDRESS = "0x5645cC460DFa9CE4Dea89DC9df331C0C1721FDFf" as const;
export const NFT_ADDRESS = "0x2311751bb8cFCD111ED1Bf7FEFAf3fbe79e98c89" as const;

export const MARKETPLACE_ABI = [
  {"inputs":[{"internalType":"address","name":"_nftAddress","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"listNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_nftAddress","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"buyNFT","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_nftAddress","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"cancelListing","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"seller","type":"address"},{"indexed":true,"internalType":"address","name":"nftAddress","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"}],"name":"NFTListed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":true,"internalType":"address","name":"nftAddress","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"}],"name":"NFTSold","type":"event"}
] as const;

export const ERC721_ABI = [
  {"inputs":[{"internalType":"string","name":"_tokenURI","type":"string"}],"name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"}
] as const;
