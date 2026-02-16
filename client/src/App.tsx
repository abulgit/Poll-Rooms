import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import CreatePollPage from "@/pages/CreatePollPage";
import ViewPollPage from "@/pages/ViewPollPage";
import NotFoundPage from "@/pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreatePollPage />} />
        <Route path="/poll/:pollId" element={<ViewPollPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;
