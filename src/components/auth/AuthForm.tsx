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
          {/* Top Custom Logo */}
          <div className="w-full flex flex-col items-center gap-3">
            <div className="bg-white p-3.5 rounded-2xl shadow-lg shadow-black/10 flex items-center justify-center">
              <svg
                viewBox="0 0 48 48"
                className="w-10 h-10 text-[#ef233c]"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Logo de TickAble"
              >
                <title>Logo de TickAble</title>
                {/* Stylized Ticket Shape */}
                <rect
                  x="6"
                  y="12"
                  width="36"
                  height="24"
                  rx="6"
                  fill="rgba(239, 35, 60, 0.05)"
                />
                {/* Left/Right ticket notches */}
                <path d="M 6 20 C 8 20, 8 28, 6 28" />
                <path d="M 42 20 C 40 20, 40 28, 42 28" />
                {/* Checkmark in the center representing "Tick-able" status */}
                <path
                  d="M 16 24 L 22 30 L 32 18"
                  strokeWidth="4"
                  stroke="#ef233c"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic">
              TickAble
            </h1>
          </div>

          {/* Middle Text */}
          <div className="max-w-[280px] my-6">
            <h2 className="text-xl md:text-2xl font-light tracking-wide leading-relaxed">
              Gestión inteligente de tickets potenciada por IA para tu equipo
            </h2>
          </div>

          {/* Bottom Dynamic Illustration */}
          <div className="w-full mt-auto flex justify-center relative h-[180px] max-w-[200px] mx-auto">
            {/* Login Illustration */}
            <svg
              viewBox="0 0 240 180"
              className={`w-full max-w-[200px] text-white/95 transition-all duration-700 ease-in-out absolute ${
                activeMode === "login"
                  ? "opacity-100 scale-100 rotate-0 pointer-events-auto"
                  : "opacity-0 scale-75 -rotate-12 pointer-events-none"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Ilustración de Inicio de Sesión"
            >
              <title>Inicio de Sesión</title>
              {/* Floating decorative lines */}
              <path
                d="M 20 120 C 60 110, 180 110, 220 120"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <path
                d="M 40 40 C 90 20, 150 20, 200 40"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />

              {/* Padlock Body */}
              <g transform="translate(70, 35)" className="animate-pulse">
                {/* Shackle (Lock loop) */}
                <path
                  d="M 30 25 V 12 C 30 5, 45 5, 45 12 V 25"
                  strokeWidth="2.5"
                />
                {/* Lock body */}
                <rect
                  x="15"
                  y="25"
                  width="45"
                  height="35"
                  rx="6"
                  fill="rgba(255, 255, 255, 0.1)"
                  strokeWidth="2.5"
                />
                {/* Keyhole */}
                <circle cx="37.5" cy="40" r="3.5" fill="currentColor" />
                <path d="M 37.5 43.5 V 50" strokeWidth="2.5" />
              </g>

              {/* Stylized Key */}
              <g transform="translate(130, 80) rotate(-15)">
                <circle
                  cx="18"
                  cy="18"
                  r="10"
                  strokeWidth="2.5"
                  fill="rgba(255, 255, 255, 0.05)"
                />
                <path d="M 28 18 H 65" strokeWidth="2.5" />
                {/* Key teeth */}
                <path
                  d="M 50 18 V 25 M 58 18 V 25 M 65 18 V 22"
                  strokeWidth="2.5"
                />
              </g>

              {/* Decorative sparkles */}
              <g strokeWidth="1.5" opacity="0.8">
                <path d="M 30 75 h 4 M 32 73 v 4" />
                <path d="M 210 50 h 4 M 212 48 v 4" />
                <path d="M 120 15 h 4 M 122 13 v 4" />
              </g>
            </svg>

            {/* Register Illustration */}
            <svg
              viewBox="0 0 240 180"
              className={`w-full max-w-[200px] text-white/95 transition-all duration-700 ease-in-out absolute ${
                activeMode === "register"
                  ? "opacity-100 scale-100 rotate-0 pointer-events-auto"
                  : "opacity-0 scale-75 rotate-12 pointer-events-none"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Ilustración de Registro de Usuario"
            >
              <title>Registro de Cuenta</title>
              {/* Floating decorative lines */}
              <path
                d="M 20 130 C 60 120, 180 120, 220 130"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />

              {/* User Card Background */}
              <rect
                x="65"
                y="25"
                width="110"
                height="100"
                rx="12"
                fill="rgba(255, 255, 255, 0.08)"
                strokeWidth="2"
              />

              {/* User Avatar Silhouette */}
              <g transform="translate(100, 45)">
                {/* Head */}
                <circle cx="20" cy="15" r="10" strokeWidth="2" />
                {/* Shoulders / Body */}
                <path d="M 2 40 C 2 30, 38 30, 38 40" strokeWidth="2" />
              </g>

              {/* Plus Sign Badge (User Add) */}
              <g transform="translate(145, 85)">
                <circle cx="12" cy="12" r="10" fill="#ef233c" strokeWidth="2" />
                <path
                  d="M 7 12 H 17 M 12 7 V 17"
                  strokeWidth="2"
                  stroke="white"
                />
              </g>

              {/* Small floating items checklist */}
              <g transform="translate(45, 60)" opacity="0.8">
                <rect
                  x="0"
                  y="0"
                  width="12"
                  height="12"
                  rx="3"
                  strokeWidth="1.5"
                />
                <path d="M 3 6 L 5 8 L 9 4" strokeWidth="1.5" />
              </g>
              <g transform="translate(45, 85)" opacity="0.5">
                <rect
                  x="0"
                  y="0"
                  width="12"
                  height="12"
                  rx="3"
                  strokeWidth="1.5"
                />
              </g>

              {/* Decorative sparkles */}
              <g strokeWidth="1.5" opacity="0.8">
                <path d="M 35 25 h 4 M 37 23 v 4" />
                <path d="M 205 60 h 4 M 207 58 v 4" />
                <path d="M 195 110 h 4 M 197 108 v 4" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
