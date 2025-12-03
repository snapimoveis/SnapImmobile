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
  // Etapas: 1 = criar conta, 2 = escolher plano do trial
  const [step, setStep] = useState<1 | 2>(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [trialMode, setTrialMode] = useState<"7days" | "20photos">("7days");

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const logo = prefersDark
    ? "/static/brand/logo_branca.png"
    : "/static/brand/logo_color.png";

  // IR PARA ETAPA 2
  const goNext = () => {
    if (!email || !password || !firstName || !lastName) {
      alert("Preencha todos os campos para continuar.");
      return;
    }
    setStep(2);
  };

  // SUBMETER
  const handleSubmit = async () => {
    await onSubmit({
      firstName,
      lastName,
      email,
      password,
      trialMode,
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 py-10 bg-white dark:bg-black transition-colors">

      {/* BOTÃO VOLTAR */}
      <button
        onClick={onBack}
        className="text-gray-600 dark:text-gray-300 text-sm underline mb-4 self-start"
      >
        Voltar
      </button>

      {/* LOGO */}
      <div className="flex justify-center mt-4">
        <img src={logo} className="w-36 select-none" draggable={false} alt="Logo" />
      </div>

      {/* ================= STEP 1 ================= */}
      {step === 1 && (
        <>
          <div className="text-center mt-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Criar conta
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              Vamos começar o seu acesso
            </p>
          </div>

          <div className="w-full mt-12 max-w-sm mx-auto flex flex-col gap-5">

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Primeiro nome"
                className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-gray-900 
                           text-gray-900 dark:text-white outline-none"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Último nome"
                className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-gray-900 
                           text-gray-900 dark:text-white outline-none"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <input
              type="email"
              placeholder="E-mail"
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-900 
                         text-gray-900 dark:text-white outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Palavra-passe"
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-900 
                         text-gray-900 dark:text-white outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              onClick={goNext}
              className="w-full py-3 rounded-xl bg-black dark:bg-white text-white 
                         dark:text-black font-semibold transition active:scale-[0.97]"
            >
              Continuar →
            </button>
          </div>
        </>
      )}

      {/* ================= STEP 2 ================= */}
      {step === 2 && (
        <>
          <div className="text-center mt-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Escolha o seu teste gratuito
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              Pode cancelar a qualquer momento
            </p>
          </div>

          <div className="w-full mt-12 max-w-sm mx-auto flex flex-col gap-4">

            {/* OPÇÃO 1 */}
            <div
              onClick={() => setTrialMode("7days")}
              className={`p-4 rounded-xl border cursor-pointer transition 
              ${trialMode === "7days"
                  ? "border-black dark:border-white"
                  : "border-gray-300 dark:border-gray-700"
                }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    7 dias gratuitos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Acesso total por 7 dias.
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 
                    ${trialMode === "7days"
                      ? "border-black dark:border-white bg-black dark:bg-white"
                      : "border-gray-400"
                    }`}
                />
              </div>
            </div>

            {/* OPÇÃO 2 */}
            <div
              onClick={() => setTrialMode("20photos")}
              className={`p-4 rounded-xl border cursor-pointer transition 
              ${trialMode === "20photos"
                  ? "border-black dark:border-white"
                  : "border-gray-300 dark:border-gray-700"
                }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    1 imóvel com 20 fotos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Perfeito para testar o fluxo completo.
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 
                    ${trialMode === "20photos"
                      ? "border-black dark:border-white bg-black dark:bg-white"
                      : "border-gray-400"
                    }`}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-black dark:bg-white text-white 
                         dark:text-black font-semibold transition active:scale-[0.97]"
            >
              Começar gratuitamente →
            </button>
          </div>
        </>
      )}

      <div className="h-10" />
    </div>
  );
};
