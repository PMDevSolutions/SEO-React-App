import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SEOAnalyzer from "./components/SEOAnalyzer";

const App = () => {
  const [selectedElement, setSelectedElement] = useState<any>(null);

  const analyzeElement = async () => {
    const element = await webflow.getSelectedElement();
    if (element) {
      setSelectedElement(element);
    }
  };

  return (
    <div className="p-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button onClick={analyzeElement} className="mb-4">
            Analyze SEO
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <SEOAnalyzer selectedElement={selectedElement} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default App;