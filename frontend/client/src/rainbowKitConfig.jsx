"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonAmoy } from "wagmi/chains";
import { http } from "wagmi";

export default getDefaultConfig({
  appName: "Cross-Credit Lending",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(import.meta.env.VITE_ALCHEMY_RPC_URL),
  },
  ssr: false,
});
