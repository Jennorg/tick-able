"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createClient } from "@/lib/supabase-client";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeMode, setActiveMode] = React.useState<"login" | "register">(
    mode,
  );
  const [agreed, setAgreed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Synchronize state with URL mode prop on load/navigation
  React.useEffect(() => {
    setActiveMode(mode);
    setError(null);
  }, [mode]);

  const handleToggle = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetMode: "login" | "register",
  ) => {
    e.preventDefault();
    setActiveMode(targetMode);
    setError(null);
    router.push(targetMode === "login" ? "/login" : "/register", {
      scroll: false,
    });
  };

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const role = formData.get("role") as string;

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role || "user",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#edf2f4] p-4 font-sans antialiased">
      {/* Outer Card */}
      <div className="relative flex flex-col md:flex-row w-full max-w-4xl bg-[#2b2d42] rounded-2xl overflow-hidden shadow-2xl min-h-[640px] md:min-h-[600px] transition-all duration-300">
        {/* ==================== REGISTER FORM (Left Back Layer) ==================== */}
        <div
          className={`w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center transition-all duration-700 ease-in-out md:absolute md:left-0 md:top-0 md:bottom-0 ${
            activeMode === "register"
              ? "opacity-100 translate-x-0 pointer-events-auto z-10"
              : "opacity-0 md:-translate-x-12 pointer-events-none z-0 h-0 md:h-auto overflow-hidden md:overflow-visible"
          }`}
        >
          {/* Top Left Tabs (visible in signup state on desktop/mobile) */}
          <div className="flex justify-end mb-6 md:mb-8">
            <div className="inline-flex p-1 bg-[#8d99ae]/20 rounded-full text-xs font-semibold select-none">
              <a
                href="/login"
                onClick={(e) => handleToggle(e, "login")}
                className={`px-5 py-1.5 rounded-full transition-all duration-300 ${
                  activeMode === "login"
                    ? "bg-[#ef233c] text-white shadow-md"
                    : "text-[#8d99ae] hover:text-white"
                }`}
              >
                Ingresar
              </a>
              <a
                href="/register"
                onClick={(e) => handleToggle(e, "register")}
                className={`px-5 py-1.5 rounded-full transition-all duration-300 ${
                  activeMode === "register"
                    ? "bg-[#ef233c] text-white shadow-md"
                    : "text-[#8d99ae] hover:text-white"
                }`}
              >
                Registrarse
              </a>
            </div>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleRegisterSubmit}
            className="flex-1 flex flex-col justify-center space-y-5 max-w-md w-full mx-auto"
          >
            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="regFullName"
                className="text-[10px] font-bold tracking-widest text-[#8d99ae] uppercase"
              >
                Nombre Completo
              </label>
              <input
                id="regFullName"
                name="fullName"
                type="text"
                placeholder="Ingresa tu nombre completo"
                required
                className="bg-transparent border-0 border-b border-[#8d99ae]/40 py-1.5 text-sm text-white focus:outline-none focus:border-[#ef233c] transition-colors placeholder:text-[#8d99ae]/50 w-full"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="regEmail"
                className="text-[10px] font-bold tracking-widest text-[#8d99ae] uppercase"
              >
                Correo Electrónico
              </label>
              <input
                id="regEmail"
                name="email"
                type="email"
                placeholder="tu@ejemplo.com"
                required
                className="bg-transparent border-0 border-b border-[#8d99ae]/40 py-1.5 text-sm text-white focus:outline-none focus:border-[#ef233c] transition-colors placeholder:text-[#8d99ae]/50 w-full"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="regPassword"
                className="text-[10px] font-bold tracking-widest text-[#8d99ae] uppercase"
              >
                Contraseña
              </label>
              <input
                id="regPassword"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-transparent border-0 border-b border-[#8d99ae]/40 py-1.5 text-sm text-white focus:outline-none focus:border-[#ef233c] transition-colors placeholder:text-[#8d99ae]/50 w-full"
              />
            </div>

            {/* Role select for assessment */}
            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="regRole"
                className="text-[10px] font-bold tracking-widest text-[#8d99ae] uppercase"
              >
                Rol
              </label>
              <div className="relative">
                <select
                  id="regRole"
                  name="role"
                  defaultValue="user"
                  required
                  className="bg-transparent border-0 border-b border-[#8d99ae]/40 py-1.5 text-sm text-white focus:outline-none focus:border-[#ef233c] transition-colors w-full appearance-none cursor-pointer pr-8"
                >
                  <option value="user" className="bg-[#2b2d42] text-white">
                    Usuario Final
                  </option>
                  <option value="agent" className="bg-[#2b2d42] text-white">
                    Agente de Soporte
                  </option>
                  <option value="admin" className="bg-[#2b2d42] text-white">
                    Administrador
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-[#8d99ae]">
                  <svg
                    className="h-4 w-4 fill-none stroke-currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Flecha hacia abajo"
                  >
                    <title>Flecha hacia abajo</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start space-x-3 text-xs text-slate-300 select-none cursor-pointer group pt-1.5">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                    agreed
                      ? "bg-[#ef233c] border-[#ef233c]"
                      : "border-slate-600 group-hover:border-slate-400 bg-transparent"
                  }`}
                >
                  {agreed && (
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  )}
                </div>
              </div>
              <span className="leading-tight text-[#8d99ae] group-hover:text-white transition-colors">
                Al registrarte, aceptas los{" "}
                <span className="underline decoration-1 decoration-[#8d99ae] underline-offset-4 hover:text-white transition-colors">
                  Términos y Condiciones
                </span>
              </span>
            </label>

            {/* Error banner */}
            {activeMode === "register" && error && (
              <div className="text-xs text-[#ef233c] bg-[#ef233c]/10 border border-[#ef233c]/20 p-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !agreed}
                className="bg-[#ef233c] text-white text-sm font-semibold px-8 py-2.5 rounded-full hover:bg-[#d90429] active:scale-95 transition-all shadow-lg shadow-red-600/10 flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Cargando"
                  >
                    <title>Cargando</title>
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ==================== LOGIN FORM (Right Back Layer) ==================== */}
        <div
          className={`w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center transition-all duration-700 ease-in-out md:absolute md:right-0 md:top-0 md:bottom-0 ${
            activeMode === "login"
              ? "opacity-100 translate-x-0 pointer-events-auto z-10"
              : "opacity-0 md:translate-x-12 pointer-events-none z-0 h-0 md:h-auto overflow-hidden md:overflow-visible"
          }`}
        >
          {/* Top Right Tabs */}
          <div className="flex justify-end mb-6 md:mb-8">
            <div className="inline-flex p-1 bg-[#8d99ae]/20 rounded-full text-xs font-semibold select-none">
              <a
                href="/login"
                onClick={(e) => handleToggle(e, "login")}
                className={`px-5 py-1.5 rounded-full transition-all duration-300 ${
                  activeMode === "login"
                    ? "bg-[#ef233c] text-white shadow-md"
                    : "text-[#8d99ae] hover:text-white"
                }`}
              >
                Ingresar
              </a>
              <a
                href="/register"
                onClick={(e) => handleToggle(e, "register")}
                className={`px-5 py-1.5 rounded-full transition-all duration-300 ${
                  activeMode === "register"
                    ? "bg-[#ef233c] text-white shadow-md"
                    : "text-[#8d99ae] hover:text-white"
                }`}
              >
                Registrarse
              </a>
            </div>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleLoginSubmit}
            className="flex-1 flex flex-col justify-center space-y-6 max-w-md w-full mx-auto"
          >
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="loginEmail"
                className="text-[10px] font-bold tracking-widest text-[#8d99ae] uppercase"
              >
                Correo Electrónico
              </label>
              <input
                id="loginEmail"
                name="email"
                type="email"
                placeholder="tu@ejemplo.com"
                required
                className="bg-transparent border-0 border-b border-[#8d99ae]/40 py-2 text-sm text-white focus:outline-none focus:border-[#ef233c] transition-colors placeholder:text-[#8d99ae]/50 w-full"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label
                htmlFor="loginPassword"
                className="text-[10px] font-bold tracking-widest text-[#8d99ae] uppercase"
              >
                Contraseña
              </label>
              <input
                id="loginPassword"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-transparent border-0 border-b border-[#8d99ae]/40 py-2 text-sm text-white focus:outline-none focus:border-[#ef233c] transition-colors placeholder:text-[#8d99ae]/50 w-full"
              />
            </div>

            {/* Error banner */}
            {activeMode === "login" && error && (
              <div className="text-xs text-[#ef233c] bg-[#ef233c]/10 border border-[#ef233c]/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#ef233c] text-white text-sm font-semibold px-8 py-2.5 rounded-full hover:bg-[#d90429] active:scale-95 transition-all shadow-lg shadow-red-600/10 flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Cargando"
                  >
                    <title>Cargando</title>
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ==================== SLIDING CORAL VISUAL PANEL (Front Layer) ==================== */}
        <div
          className={`w-full md:w-[45%] bg-[#ef233c] text-white p-8 md:p-12 flex flex-col justify-between items-center text-center select-none overflow-hidden transition-all duration-700 ease-in-out md:absolute md:top-0 md:bottom-0 md:z-20 min-h-[220px] md:min-h-0 ${
            activeMode === "login"
              ? "md:left-0 md:translate-x-0"
              : "md:left-0 md:translate-x-[122.22%]"
          }`}
        >
          {/* Top Planet Icon */}
          <div className="w-full flex justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-12 h-12 text-white/90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Icono de planeta"
            >
              <title>Planeta</title>
              <circle cx="50" cy="50" r="20" />
              <path d="M 22 62 C 32 42, 68 42, 78 62" />
              <path d="M 15 57 C 28 85, 72 85, 85 57" />
              <path d="M 28 22 h 4 M 30 20 v 4" strokeWidth="1.5" />
              <circle cx="75" cy="30" r="1.5" fill="currentColor" />
              <circle cx="70" cy="72" r="1" fill="currentColor" />
            </svg>
          </div>

          {/* Middle Text */}
          <div className="max-w-[280px] my-6">
            <h2 className="text-xl md:text-2xl font-light tracking-wide leading-relaxed">
              Sé parte de nuestro increíble equipo y diviértete con nosotros
            </h2>
          </div>

          {/* Bottom Rocket Illustration */}
          <div className="w-full mt-auto flex justify-center">
            <svg
              viewBox="0 0 240 180"
              className="w-full max-w-[200px] text-white/95"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Ilustración de lanzamiento de cohete"
            >
              <title>Lanzamiento de Cohete</title>
              <path
                d="M 20 160 C 60 145, 180 145, 220 160"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />

              {/* Rocket Ship with dynamic translate for parallax */}
              <g
                transform="translate(100, 20)"
                className="transition-transform duration-700 ease-in-out"
                style={{
                  transform:
                    activeMode === "register"
                      ? "translate(100px, 15px) rotate(2deg)"
                      : "translate(100px, 20px)",
                }}
              >
                <path
                  d="M 20 0 C 32 20, 32 60, 32 80 L 8 80 C 8 60, 8 20, 20 0 Z"
                  fill="none"
                />
                <path d="M 8 70 L 0 90 L 8 85 Z" fill="currentColor" />
                <path d="M 32 70 L 40 90 L 32 85 Z" fill="currentColor" />
                <circle cx="20" cy="40" r="5" fill="none" />
                <path
                  d="M 15 90 v 15 M 20 90 v 25 M 25 90 v 15"
                  strokeWidth="1.5"
                />
              </g>

              {/* Dynamic floating stars */}
              <g strokeWidth="1.5" opacity="0.8">
                <path d="M 40 50 h 4 M 42 48 v 4" />
                <path d="M 190 65 h 4 M 192 63 v 4" />
                <path d="M 50 110 h 4 M 52 108 v 4" />
                <path d="M 195 120 h 4 M 197 118 v 4" />
                <path d="M 120 15 h 4 M 122 13 v 4" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
