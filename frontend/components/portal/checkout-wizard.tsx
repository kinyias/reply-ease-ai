"use client";

import { useI18n } from "@/context/i18n-context";

import { useMemo, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, Loader2Icon, LockIcon } from "lucide-react";
import { usePortalCheckout } from "@/hooks/portal/use-portal-checkout";
import { OrderSuccess } from "./order-success";
import { PortalHeader } from "./portal-header";
import { PortalProgress, StepItem } from "./portal-progress";
import { ProductCart } from "./product-cart";
import { StepQuestions } from "./step-questions";
import { StripeCardPayment } from "./stripe-card-payment";
import { VietQRPaymentCard } from "./vietqr-payment-card";

interface CheckoutWizardProps {
  domainId: string;
  customerId: string;
}

export function CheckoutWizard({ domainId, customerId }: CheckoutWizardProps) {
  const { t } = useI18n();
  const {
    data,
    isLoading,
    isSubmitting,
    currentStep,
    setCurrentStep,
    answers,
    handleAnswerChange,
    handleSaveAnswers,
    selectedProductIds,
    toggleProduct,
    calculatedTotal,
    paymentMethod,
    setPaymentMethod,
    activeOrder,
    handleCreateOrder,
    isPolling,
    handleSimulatePayment,
    handleStripePaymentSuccess,
  } = usePortalCheckout(domainId, customerId);

  const [orderInitiated, setOrderInitiated] = useState(false);

  const wizardSteps: StepItem[] = useMemo(() => {
    const list: StepItem[] = [];

    if (data && data.questions.length > 0) {
      list.push({
        id: "qualify",
        label: t("portal.stepSurveyLabel", "Survey"),
        description: t("portal.stepSurveyDesc", "Customer details"),
      });
    }

    list.push(
      {
        id: "payment",
        label: t("portal.stepPaymentLabel", "Payment"),
        description: t("portal.stepPaymentDesc", "Select product & method"),
      },
      {
        id: "success",
        label: t("portal.stepCompleteLabel", "Complete"),
        description: t("portal.stepCompleteDesc", "Order receipt"),
      }
    );

    return list;
  }, [data]);

  const handleStartPayment = async () => {
    const order = await handleCreateOrder(paymentMethod);
    if (order) {
      setOrderInitiated(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Loader2Icon className="size-8 text-orange-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {t("portal.loadingCheckout", "Loading checkout & products...")}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          {t("portal.checkoutNotFound", "Checkout page not found")}
        </h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          {t("portal.invalidLink", "Invalid URL or customer record does not exist.")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <PortalHeader
        domainName={data.domain_name}
        domainIcon={data.domain_icon}
        subtitle={t("portal.portalSubtitleCheckout", "Online product checkout portal")}
        badgeText={t("portal.securityBadge", "256-bit SSL Secure")}
      />

      {/* Progress Stepper */}
      <PortalProgress steps={wizardSteps} currentStepId={currentStep} />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {currentStep === "qualify" && (
          <StepQuestions
            questions={data.questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSaveAnswers}
            isSubmitting={isSubmitting}
            onSkip={() => setCurrentStep("payment")}
          />
        )}

        {currentStep === "payment" && (
          <div className="space-y-6">
            {!orderInitiated ? (
              <>
                <ProductCart
                  products={data.products}
                  selectedProductIds={selectedProductIds}
                  onToggleProduct={toggleProduct}
                  calculatedTotal={calculatedTotal}
                  paymentMethod={paymentMethod}
                  onChangePaymentMethod={setPaymentMethod}
                />

                <div className="flex items-center justify-between gap-3">
                  {data.questions.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep("qualify")}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
                    >
                      <ArrowLeftIcon className="size-4" />
                      <span>{t("portal.reviewSurvey", "Review survey")}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    disabled={isSubmitting || selectedProductIds.length === 0}
                    onClick={handleStartPayment}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50"
                  >
                    <span>
                      {isSubmitting ? t("portal.creatingOrder", "Creating order...") : t("portal.proceedPayment", { method: paymentMethod === "vietqr" ? "VietQR" : "International Card" }, `Proceed to Payment (${paymentMethod === "vietqr" ? "VietQR" : "International Card"})`)}
                    </span>
                    <ArrowRightIcon className="size-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Back to product selection button */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOrderInitiated(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
                  >
                    <ArrowLeftIcon className="size-4" />
                    <span>{t("portal.changeProductMethod", "Change products or payment method")}</span>
                  </button>
                </div>

                {/* Display VietQR Card or Stripe Elements Card based on chosen method */}
                {paymentMethod === "vietqr" && activeOrder && (
                  <VietQRPaymentCard
                    order={activeOrder}
                    domainName={data.domain_name}
                    isPolling={isPolling}
                    onSimulatePayment={handleSimulatePayment}
                    isSimulating={isSubmitting}
                  />
                )}

                {paymentMethod === "stripe" && (
                  <StripeCardPayment
                    amount={calculatedTotal}
                    domainName={data.domain_name}
                    onSuccess={handleStripePaymentSuccess}
                  />
                )}
              </>
            )}
          </div>
        )}

        {currentStep === "success" && activeOrder && (
          <OrderSuccess
            order={activeOrder}
            domainName={data.domain_name}
            products={data.products}
            selectedProductIds={selectedProductIds}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-200/80 dark:border-zinc-800 text-center text-xs text-zinc-400">
        {t("portal.poweredByCheckout", "Powered by ReplyEase AI • Integrated VietQR & Stripe Elements Checkout")}
      </footer>
    </div>
  );
}
