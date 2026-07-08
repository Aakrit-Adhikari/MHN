import { Bell, Globe, Shield, UserCog } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const settings = [
  { title: "Profile & Team", description: "Admin identity, team roles, and access preferences.", icon: UserCog },
  { title: "Security", description: "Password policies, token handling, and admin guardrails.", icon: Shield },
  { title: "Notifications", description: "Email, inquiry, and operational alert preferences.", icon: Bell },
  { title: "Website Defaults", description: "Locale, contact, and brand defaults for future settings management.", icon: Globe }
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Settings sections prepared for future management."
      />

      <div className="settings-grid">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <section className="card" key={item.title}>
              <div className="card-body">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-gold-pale bg-cream text-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-navy">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
