import React, { useState } from "react";

interface RegisterScreenProps {
  error?: string;
  onBack: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  error,
  onBack,
  onSubmit,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // FORM
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [trialType, setTrialType] = useState<"7days" | "20photos" | null>(null);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFinish = async () => {
    if (!trialType) {
      alert("Selecione uma opção de teste gratuito.");
      return;
    }

    await onSubmit({
      firstName,
      lastName,
      email,
      password,
      trialType,
    });
  };

  return (
    <div
      className="
        min-h-screen w-full flex flex-col items-center justify-center 
        bg-white text-gray-900 
        dark:bg-black dark:text-white
        transition-colors duration-300 px-6 py-10
      "
    >
      {/* LOGO */}
      <img
        src={
          document.documentElement.classList.contains("dark")
            ? "/static/brand/logo_branco.png"
            : "/static/brand/logo_color.png"
        }
        alt="Snap Immobile"
        className="w-40 mb-10 transition-all"
      />

      {/* CARD */}
      <div
        className="
          w-full max-w-sm
          bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200
          dark:bg-black/40 dark:border-gray-800
          p-6
        "
      >
        {/* ETAPA 1 */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold mb-6 text-center">
              Criar conta
            </h1>

            {error && (
              <div className="text-red-500 text-center mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleStep1} className="flex flex-col gap-4">
              {/* PRIMEIRO NOME */}
              <div className="flex flex-col">
                <label className="text-sm mb-1">Primeiro Nome</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 
                    dark:border-gray-700 text-base outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>

              {/* APELIDO */}
              <div className="flex flex-col">
                <label className="text-sm mb-1">Apelido</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 
                    dark:border-gray-700 text-base outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>

              {/* EMAIL */}
              <div className="flex flex-col">
                <label className="text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 
                    dark:border-gray-700 text-base outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>

              {/* PASSWORD */}
              <div className="flex flex-col">
                <label className="text-sm mb-1">Palavra-passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 
                    dark:border-gray-700 text-base outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>

              <button
                type="submit"
                className="mt-2 py-3 rounded-xl bg-brand-purple text-white font-medium
                  hover:bg-brand-purple/90 active:scale-95 transition"
              >
                Continuar
              </button>

              <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-600 dark:text-gray-300 underline mt-2 text-center"
              >
                Voltar
              </button>
            </form>
          </>
        )}

        {/* ETAPA 2 — TESTE GRATUITO */}
        {step === 2 && (
          <>
            <h1 className="text-xl font-semibold mb-4 text-center">
              Escolher Teste Gratuito
            </h1>

            <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-6">
              Selecione uma opção para começar:
            </p>

            <div className="flex flex-col gap-4">

              {/* OPC 1 */}
              <button
                onClick={() => setTrialType("7days")}
                className={`
                  p-4 rounded-xl border text-left transition
                  ${
                    trialType === "7days"
                      ? "border-brand-purple bg-brand-purple text-white"
                      : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900"
                  }
                `}
              >
                <div className="font-semibold text-lg">7 dias grátis</div>
                <div className="text-sm opacity-80">
                  Acesso total ao Snap Immobile durante uma semana.
                </div>
              </button>

              {/* OPC 2 */}
              <button
                onClick={() => setTrialType("20photos")}
                className={`
                  p-4 rounded-xl border text-left transition
                  ${
                    trialType === "20photos"
                      ? "border-brand-purple bg-brand-purple text-white"
                      : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900"
                  }
                `}
              >
                <div className="font-semibold text-lg">1 imóvel / 20 fotos</div>
                <div className="text-sm opacity-80">
                  Fotografar e editar um imóvel completo gratuitamente.
                </div>
              </button>

              <button
                onClick={handleFinish}
                className="mt-4 py-3 rounded-xl bg-brand-purple text-white font-medium
                  hover:bg-brand-purple/90 active:scale-95 transition"
              >
                Criar Conta
              </button>

              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-600 dark:text-gray-300 underline text-center"
              >
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
