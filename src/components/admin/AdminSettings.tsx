import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, Save, ExternalLink } from "lucide-react";

const AdminSettings = () => {
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["recaptcha_enabled", "recaptcha_site_key"]);

    if (data) {
      setRecaptchaEnabled(data.find((d) => d.key === "recaptcha_enabled")?.value === "true");
      setRecaptchaSiteKey(data.find((d) => d.key === "recaptcha_site_key")?.value || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        supabase.from("app_settings").update({ value: recaptchaEnabled ? "true" : "false" }).eq("key", "recaptcha_enabled"),
        supabase.from("app_settings").update({ value: recaptchaSiteKey.trim() }).eq("key", "recaptcha_site_key"),
      ];
      await Promise.all(updates);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure platform settings and integrations</p>
      </div>

      {/* reCAPTCHA Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Google reCAPTCHA</CardTitle>
              <CardDescription>Protect auth pages from bots and automated abuse</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Enable reCAPTCHA</p>
              <p className="text-xs text-muted-foreground">Show reCAPTCHA verification on login and registration</p>
            </div>
            <Switch checked={recaptchaEnabled} onCheckedChange={setRecaptchaEnabled} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground">Site Key (v2 Checkbox)</Label>
            <Input
              placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={recaptchaSiteKey}
              onChange={(e) => setRecaptchaSiteKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Get your site key from{" "}
              <a
                href="https://www.google.com/recaptcha/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Google reCAPTCHA Admin Console
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {recaptchaEnabled && !recaptchaSiteKey && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              ⚠️ reCAPTCHA is enabled but no site key is configured. It will not appear on auth pages until a valid site key is provided.
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
