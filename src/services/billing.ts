export async function startAsaasCheckout(user: any) {
  const res = await fetch("/api/checkout/asaas/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      cpf: user.billing?.cpf || user.cpf,
    }),
  });

  if (!res.ok) throw new Error("Erro ao iniciar pagamento");

  const data = await res.json();
  return data.checkoutUrl;
}
