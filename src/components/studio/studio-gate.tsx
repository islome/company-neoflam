import { isStudioAuthed, studioEnabled } from "@/lib/studio-auth";
import { StudioLogin } from "./studio-login";

/** Shows its children only to signed-in staff; otherwise the sign-in form (or a note that the Studio is off). */
export async function StudioGate({ children }: { children: React.ReactNode }) {
  if (!studioEnabled()) {
    return (
      <div className="max-w-lg">
        <h1 className="heading-4 text-ink">Studio is off</h1>
        <p className="body-6 mt-3 text-ink-soft">
          Set a <code>STUDIO_PASSWORD</code> environment variable (in <code>.env.local</code> and in Vercel) to switch it on.
        </p>
      </div>
    );
  }
  if (!(await isStudioAuthed())) return <StudioLogin />;
  return children;
}
