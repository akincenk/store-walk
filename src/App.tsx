import { useState } from "react";
import { Home } from "./Home";
import { WalkView } from "./WalkView";

export function App() {
  const [openId, setOpenId] = useState<string | null>(null);
  return openId ? <WalkView id={openId} onBack={() => setOpenId(null)} /> : <Home onOpen={setOpenId} />;
}
