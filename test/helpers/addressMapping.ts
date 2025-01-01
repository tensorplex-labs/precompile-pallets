import {
  blake2AsU8a,
  decodeAddress,
  encodeAddress,
} from "@polkadot/util-crypto";
import { hexToU8a, u8aToHex } from "@polkadot/util";

/**
 * Converts an Ethereum H160 address to a Substrate SS58 address public key.
 * @param ethAddress - The H160 Ethereum address as a hex string.
 * @returns The Substrate public key.
 */
function convertH160ToSS58(ethAddress: string): string {
  const prefix = "evm:";
  const prefixBytes = new TextEncoder().encode(prefix);
  const addressBytes = hexToU8a(
    ethAddress.startsWith("0x") ? ethAddress : `0x${ethAddress}`
  );
  const combined = new Uint8Array(prefixBytes.length + addressBytes.length);

  // Concatenate prefix and Ethereum address
  combined.set(prefixBytes);
  combined.set(addressBytes, prefixBytes.length);

  // Hash the combined data (the public key)
  const hash = blake2AsU8a(combined);

  // Convert the hash to SS58 format
  const ss58Address = encodeAddress(hash, 42); // Assuming network ID 42, change as per your network
  return ss58Address;
}

function ss58ToBytes(senderSS58: string) {
  const senderPubk = decodeAddress(senderSS58);
  const senderPubkBytes32 = u8aToHex(senderPubk);
  return senderPubkBytes32;
}

export { convertH160ToSS58, ss58ToBytes };
