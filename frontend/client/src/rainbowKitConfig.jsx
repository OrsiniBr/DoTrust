"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonAmoy } from "wagmi/chains";
import { http } from "wagmi";

export default getDefaultConfig({
  appName: "DoTrust",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(import.meta.env.VITE_RPC_URL || "https://rpc-amoy.polygon.technology"),
  },
  ssr: false,
});