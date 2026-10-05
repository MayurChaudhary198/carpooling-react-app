import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/services/api";
import {
  Button,
  Card,
  CardContent,
  Label,
  SEO,
  getApiErrorMessage,
} from "@carpooling/common";
import { API_ENDPOINTS, ROUTES } from "@/constants";
import { FileText, Upload, CheckCircle, Loader2 } from "lucide-react";

export default function Documents() {
  const navigate = useNavigate();
  const [licence, setLicence] = useState<File | null>(null);
  const [rc, setRc] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!licence || !rc) {
      toast.error("Please upload both documents");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("licence", licence);
      formData.append("rc", rc);

      await api.post(API_ENDPOINTS.car.documents, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Documents uploaded successfully!");
      navigate(ROUTES.driver.carSetup);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Upload failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-6 space-y-6">
      <SEO
        title="Upload Documents"
        description="Upload your driving licence and vehicle registration certificate for driver verification."
      />
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>DRIVER COMPLIANCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Upload Documents
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Please upload your driving licence and vehicle RC certificate for administrative approval.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(ROUTES.driver.documentsView)}
          className="rounded-xl text-xs"
        >
          View Status
        </Button>
      </div>

      <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
        <CardContent className="p-6 flex flex-col gap-6">

          {/* licence Upload */}
          <div className="flex flex-col gap-2">
            <Label>Driving licence</Label>
            <label
              htmlFor="licence"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted"
            >
              {licence ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">{licence.name}</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload licence
                  </p>
                </>
              )}
            </label>
            <input
              id="licence"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setLicence(e.target.files?.[0] || null)}
            />
          </div>

          {/* RC Book Upload */}
          <div className="flex flex-col gap-2">
            <Label>RC Book</Label>
            <label
              htmlFor="rc"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted"
            >
              {rc ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">{rc.name}</p>
                </>
              ) : (
                <>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload RC book
                  </p>
                </>
              )}
            </label>
            <input
              id="rc"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setRc(e.target.files?.[0] || null)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !licence || !rc}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading Documents...
              </>
            ) : (
              "Upload & Continue"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
