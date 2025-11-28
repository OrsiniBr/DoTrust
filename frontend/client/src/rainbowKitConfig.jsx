"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygon} from "wagmi/chains";
import { http } from "wagmi";

export default getDefaultConfig({
  appName: "Cross-Credit Lending",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [polygon],
  // transports: {
  //   [polygonAmoy.id]: [
  //     http(import.meta.env.VITE_ALCHEMY_RPC_URL),
  //     http(import.meta.env.VITE_INFURA_RPC_URL),
  //   ],
  // },
  ssr: false,
});