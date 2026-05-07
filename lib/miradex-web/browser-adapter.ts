import type {
  BlockchainDataProvider,
  BlockchainQuerier,
  DetectedDeposit,
  FeeEstimate,
  KeystoreMetadata,
  KeystoreSaveResult,
  Logger,
  PlatformAdapter,
  ProtocolParams,
  SwapKeystore,
} from "@miradexio/client";
import { consoleLogger } from "./logger";
import {
  broadcastRawTx,
  createElectrsBlockchainProvider,
  createElectrsBlockchainQuerier,
  fetchAddressUtxos,
  fetchFeeRecommended,
  watchAddressDeposit,
} from "./electrs-cors";
import {
  listKeystoreMetadata,
  persistKeystore,
  persistProtocolSnapshot,
  persistSwapProtocol,
  readKeystore,
  readProtocolSnapshot,
  readSwapProtocol,
  removeKeystore,
} from "./idb";
import { generateQrDataUrl } from "./qr";

type BitcoinNetwork = "mainnet" | "testnet" | "regtest";

export class BrowserAdapter implements PlatformAdapter {
  readonly logger: Logger = consoleLogger;

  watchDeposit(
    address: string,
    network: BitcoinNetwork,
    signal: AbortSignal,
    onStatus?: (msg: string) => void,
  ): Promise<DetectedDeposit> {
    return watchAddressDeposit(address, network, signal, onStatus);
  }

  checkDeposit(address: string, network: BitcoinNetwork): Promise<DetectedDeposit | null> {
    return fetchAddressUtxos(address, network);
  }

  fetchUtxo(address: string, network: BitcoinNetwork): Promise<DetectedDeposit | null> {
    return fetchAddressUtxos(address, network);
  }

  estimateFee(network: BitcoinNetwork): Promise<FeeEstimate> {
    return fetchFeeRecommended(network);
  }

  broadcastTx(rawHex: string, network: BitcoinNetwork): Promise<string> {
    return broadcastRawTx(rawHex, network);
  }

  generateQr(text: string): Promise<string> {
    return generateQrDataUrl(text);
  }

  saveKeystore(keystore: SwapKeystore, label: string): Promise<KeystoreSaveResult> {
    return persistKeystore(keystore, label);
  }

  loadKeystore(id: string): Promise<SwapKeystore> {
    return readKeystore(id);
  }

  listKeystores(): Promise<readonly KeystoreMetadata[]> {
    return listKeystoreMetadata();
  }

  deleteKeystore(id: string): Promise<void> {
    return removeKeystore(id);
  }

  readonly saveSwapProtocol = (swapId: string, params: ProtocolParams): Promise<void> => {
    return persistSwapProtocol(swapId, params);
  };

  readonly loadSwapProtocol = (swapId: string): Promise<ProtocolParams | null> => {
    return readSwapProtocol(swapId);
  };

  readonly saveProtocolSnapshot = (swapId: string, snapshotJson: string): Promise<void> => {
    return persistProtocolSnapshot(swapId, snapshotJson);
  };

  readonly loadProtocolSnapshot = (swapId: string): Promise<string | null> => {
    return readProtocolSnapshot(swapId);
  };

  createBlockchainQuerier(network: BitcoinNetwork): BlockchainQuerier {
    return createElectrsBlockchainQuerier(network);
  }

  createBlockchainProvider(network: BitcoinNetwork): Promise<BlockchainDataProvider> {
    return Promise.resolve(createElectrsBlockchainProvider(network));
  }
}
