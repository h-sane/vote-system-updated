import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface BiometricVerificationProps {
  onVerified: () => void;
  onCancel: () => void;
  userId?: string;
}

const BiometricVerification = ({
  onVerified,
  onCancel,
  userId,
}: BiometricVerificationProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(
    null
  );
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    isMobile: false,
    hasBiometrics: false,
    hasWebAuthn: false,
    networkOnline: true,
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    const checkBiometricAvailability = () => {
      const isOnline = navigator.onLine;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(
        navigator.userAgent
      );
      const hasWebAuthn = window.PublicKeyCredential !== undefined;
      const hasBiometrics = hasWebAuthn; // Simplified for now

      setDeviceCapabilities({
        isMobile: isMobileDevice,
        hasWebAuthn,
        hasBiometrics,
        networkOnline: isOnline,
      });

      setBiometricAvailable(hasBiometrics && hasWebAuthn);
    };

    checkBiometricAvailability();
  }, []);
  // ✅ Simple fingerprint verification by base64 match
  function verifyFingerprint(inputFingerprint: string, storedFingerprint: string): boolean {
    return inputFingerprint === storedFingerprint;
  }

  const handleBiometricVerification = async () => {
    if (!userId) {
      toast.error("No user ID found.");
      return;
    }

    setIsScanning(true);

    try {
      const { data, error } = await supabase
        .from("users_biometrics")
        .select("fingerprint_hash")
        .eq("user_id", userId)
        .single();

      if (error || !data?.fingerprint_hash) {
        toast.error("Fingerprint data not found for user.");
        return;
      }

      const storedFingerprint = data.fingerprint_hash;

      // Simulated scan — in production, integrate WebAuthn/device API
      const inputFingerprint = prompt(
        "Simulate fingerprint scan:\nPaste your fingerprint (base64)"
      );

      if (!inputFingerprint) {
        toast.error("No fingerprint provided.");
        return;
      }

      const isVerified = verifyFingerprint(inputFingerprint, storedFingerprint);

      if (isVerified) {
        toast.success("Fingerprint verified successfully.");
        onVerified();
      } else {
        toast.error("Fingerprint verification failed. Please try again.");
      }
    } catch (e) {
      toast.error("Unexpected error during biometric verification.");
    } finally {
      setIsScanning(false);
    }
  };
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Biometric Verification</CardTitle>
        <CardDescription>
          Use your fingerprint to verify your identity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {deviceCapabilities.networkOnline ? (
          <div className="text-green-600 flex items-center gap-2">
            <Wifi className="w-5 h-5" /> Online
          </div>
        ) : (
          <div className="text-red-600 flex items-center gap-2">
            <WifiOff className="w-5 h-5" /> Offline
          </div>
        )}
        <div className="flex flex-col items-center">
          <Fingerprint className="w-16 h-16 text-blue-600" />
          <p className="text-center mt-2">
            {biometricAvailable
              ? "Biometric device detected."
              : "Biometric not supported on this device."}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="secondary" onClick={onCancel} disabled={isScanning}>
          Cancel
        </Button>
        <Button onClick={handleBiometricVerification} disabled={isScanning}>
          {isScanning ? "Verifying..." : "Verify"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BiometricVerification;
