import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import ReportCard from "@/components/results/ReportCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { 
  Section,
  mockNurseryResult, 
  mockPrimaryResult, 
  mockSecondaryResult 
} from "@/data/mockData";

const ResultPortal = () => {
  const [selectedVariant, setSelectedVariant] = useState<Section>("secondary");

  const getResult = () => {
    switch (selectedVariant) {
      case "nursery":
        return mockNurseryResult;
      case "primary":
        return mockPrimaryResult;
      case "secondary":
        return mockSecondaryResult;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4 print:pt-0 print:px-0">
        <div className="container mx-auto max-w-4xl">
          {/* Actions Bar (hidden on print) */}
          <div className="print:hidden mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portal
            </Link>

            <div className="flex items-center gap-3">
              {/* Demo Variant Switcher */}
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                {(["nursery", "primary", "secondary"] as Section[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedVariant === v
                        ? "bg-gold text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>

              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="sm" className="bg-gold text-primary hover:bg-gold-dark">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="print:hidden mb-6 p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Demo Mode:</strong> Use the tabs above to switch between Nursery, Primary, and Secondary 
              report card variants. Each shows a different mock student with appropriate data structure.
            </p>
          </div>

          {/* Report Card */}
          <div className="animate-fade-in">
            <ReportCard variant={selectedVariant} data={getResult()} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultPortal;
